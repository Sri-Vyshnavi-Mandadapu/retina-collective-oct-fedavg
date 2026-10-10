import asyncio
import hashlib
import io
import logging
import os
import warnings
from contextlib import asynccontextmanager
from pathlib import Path

import torch
from torch import nn
from torchvision.models import densenet121
from torchvision.transforms import functional as TF
from PIL import Image, ImageOps, UnidentifiedImageError
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from contract import CLASSES, validate_bundle

MAX_BYTES = 5 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 12_000_000
warnings.simplefilter('error', Image.DecompressionBombWarning)
torch.set_num_threads(max(1, int(os.getenv('TORCH_THREADS', '2'))))
logger = logging.getLogger('retina')

class OCTNet(nn.Module):
    def __init__(self):
        super().__init__()
        # Never download or fall back to ImageNet weights.
        self.net = densenet121(weights=None)
        self.net.classifier = nn.Sequential(nn.Dropout(.25), nn.Linear(1024, 4))
    def forward(self, x):
        return self.net(x)

class Predictor:
    def __init__(self, path):
        digest = hashlib.sha256()
        with path.open('rb') as f:
            for chunk in iter(lambda: f.read(1024 * 1024), b''):
                digest.update(chunk)
        sha = digest.hexdigest()
        expected = os.getenv('MODEL_SHA256', '').strip().lower()
        if not expected or sha != expected:
            raise ValueError('MODEL_SHA256 must match your verified FedAvg export.')
        bundle = validate_bundle(torch.load(path, map_location='cpu', weights_only=True))
        self.net = OCTNet()
        self.net.load_state_dict(bundle['model'], strict=True)
        self.net.eval()
        self.size, self.mean, self.std = bundle['image_size'], bundle['mean'], bundle['std']
        self.metadata = {'type': 'fedavg', 'architecture':'DenseNet121', 'clients':3,
                         'round':bundle['best_round'], 'sha256':sha}
    @torch.inference_mode()
    def predict(self, raw):
        try:
            with Image.open(io.BytesIO(raw)) as im:
                if im.format not in ('JPEG', 'PNG'):
                    raise ValueError('Only JPEG and PNG images are accepted.')
                if im.width * im.height > Image.MAX_IMAGE_PIXELS or min(im.size)<16:
                    raise ValueError('Image dimensions must be at least 16 pixels and at most 12 megapixels.')
                im.load()
                rgb = ImageOps.exif_transpose(im).convert('RGB').resize((self.size,self.size), Image.Resampling.BILINEAR)
            x = TF.normalize(TF.to_tensor(rgb), self.mean, self.std).unsqueeze(0)
        except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
            raise HTTPException(422, 'Invalid or unsupported image. Use a non-corrupt JPEG/PNG of at most 12 megapixels.') from exc
        logits = self.net(x)
        if logits.shape != (1,4) or not torch.isfinite(logits).all():
            raise HTTPException(503, 'Model returned invalid scores.')
        scores = logits.softmax(dim=1)[0].tolist()
        return {'prediction':CLASSES[max(range(4),key=lambda i:scores[i])],
                'scores':[{'label':label,'score':scores[i]} for i,label in enumerate(CLASSES)],
                'model':self.metadata}

@asynccontextmanager
async def lifespan(app):
    app.state.predictor = None
    app.state.lock = asyncio.Lock()
    path = Path(os.getenv('MODEL_PATH', 'model/inference_bundle.pt'))
    try:
        app.state.predictor = Predictor(path)
        logger.info('FedAvg checkpoint loaded successfully.')
    except Exception:
        logger.exception('Model unavailable; inference remains disabled.')
    yield

app = FastAPI(title='Retina Collective FedAvg API', lifespan=lifespan)
origins = [s.strip().rstrip('/') for s in os.getenv('ALLOWED_ORIGINS','http://localhost:8080,http://127.0.0.1:8080').split(',') if s.strip()]
if '*' in origins:
    raise RuntimeError('Set explicit ALLOWED_ORIGINS, not a wildcard.')
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=['GET','POST'], allow_headers=['Content-Type'], allow_credentials=False)

@app.middleware('http')
async def safety_headers(request, call_next):
    if request.method == 'POST':
        try:
            if int(request.headers.get('content-length','0')) > MAX_BYTES + 64*1024:
                from starlette.responses import JSONResponse
                return JSONResponse({'detail':'Image must be at most 5 MB.'}, status_code=413)
        except ValueError:
            raise HTTPException(400, 'Invalid Content-Length.')
    response = await call_next(request)
    response.headers['Cache-Control']='no-store'
    response.headers['X-Content-Type-Options']='nosniff'
    return response

@app.get('/health')
def health():
    p = getattr(app.state,'predictor',None)
    return {'ready':p is not None, 'model':p.metadata if p else None}

@app.post('/predict')
async def predict(file: UploadFile = File(...)):
    try:
        p = app.state.predictor
        if p is None:
            raise HTTPException(503, 'FedAvg model is not configured. Check checkpoint, SHA-256 and server logs.')
        if app.state.lock.locked():
            raise HTTPException(429, 'The model is processing another scan. Retry shortly.')
        async with app.state.lock:
            if file.content_type not in ('image/jpeg','image/png'):
                raise HTTPException(415, 'Use a JPEG or PNG image.')
            raw = await file.read(MAX_BYTES+1)
            if not raw or len(raw)>MAX_BYTES:
                raise HTTPException(413, 'Image must contain data and be at most 5 MB.')
            return await run_in_threadpool(p.predict,raw)
    finally:
        await file.close()
