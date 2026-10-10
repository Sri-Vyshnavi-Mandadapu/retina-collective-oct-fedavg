"""Export the supplied checkpoint without retraining; verify numerical equivalence."""
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort
import torch
from PIL import Image
from torchvision.transforms import functional as TF

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from app import OCTNet
from contract import validate_bundle

torch.set_num_threads(2)
source = ROOT / 'backend/model/inference_bundle.pt'
bundle = validate_bundle(torch.load(source, map_location='cpu', weights_only=True))
model = OCTNet().eval()
model.load_state_dict(bundle['model'], strict=True)
dest = ROOT / 'frontend/model'
dest.mkdir(exist_ok=True)
temporary = dest / 'export.onnx'
torch.onnx.export(model, torch.zeros(1, 3, 224, 224), str(temporary),
                  input_names=['image'], output_names=['logits'],
                  opset_version=17, do_constant_folding=True, dynamo=False)
onnx.checker.check_model(onnx.load(str(temporary)))
session = ort.InferenceSession(str(temporary), providers=['CPUExecutionProvider'])
fixtures = ROOT / 'tests/fixtures'
fixtures.mkdir(exist_ok=True)
rng = np.random.default_rng(42)
results = []
for index, (width, height) in enumerate([(317, 189), (512, 496), (80, 96), (224,224)]):
    # Deterministic nonclinical test patterns exercise resizing and inference.
    rgb = rng.integers(0, 256, (height, width, 3), dtype=np.uint8)
    image = Image.fromarray(rgb)
    image.save(fixtures / f'pattern-{index}.png')
    prepared = image.resize((224,224), Image.Resampling.BILINEAR)
    np.asarray(prepared).tofile(fixtures / f'pattern-{index}.rgb')
    x = TF.normalize(TF.to_tensor(prepared), bundle['mean'], bundle['std']).unsqueeze(0)
    with torch.inference_mode():
        expected = model(x).numpy()
    actual = session.run(None, {'image':x.numpy()})[0]
    np.testing.assert_allclose(actual, expected, atol=2e-4, rtol=2e-4)
    scores = torch.from_numpy(expected).softmax(1)[0].tolist()
    results.append({'file':f'pattern-{index}.png', 'width':width, 'height':height,
                    'scores':scores, 'max_logit_error':float(np.abs(actual-expected).max())})
digest = hashlib.sha256(temporary.read_bytes()).hexdigest()
filename = f'model-{digest[:12]}.onnx'
temporary.replace(dest / filename)
manifest = dict(file=filename, bytes=(dest/filename).stat().st_size,
                onnx_sha256=digest, source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
                classes=bundle['classes'], image_size=bundle['image_size'], mean=bundle['mean'],
                std=bundle['std'], best_round=bundle['best_round'], preprocess=bundle['preprocess'],
                architecture='DenseNet121', clients=3)
(dest/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
(fixtures/'parity.json').write_text(json.dumps(results,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'manifest':manifest,'verification':results},indent=2))
