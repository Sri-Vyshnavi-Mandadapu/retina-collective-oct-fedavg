import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
import copy
import hashlib
import io
import pytest
import torch
from PIL import Image
from fastapi.testclient import TestClient
from contract import validate_bundle, CLASSES
from app import app, OCTNet, Predictor

def metadata(state):
 return dict(model=state,classes=CLASSES,image_size=224,mean=[.485,.456,.406],std=[.229,.224,.225],preprocess='full_image_resize_bilinear_rgb',spec={'architecture':'oct_densenet121_v1','config':{'clients':3}},best_round=8)

def test_contract_rejects_incompatible_exports():
 b=metadata({'placeholder':1})
 assert validate_bundle(b) is b
 for key,value in [('classes',list(reversed(CLASSES))),('preprocess','crop'),('best_round',0),('image_size',256)]:
  bad=copy.deepcopy(b);bad[key]=value
  with pytest.raises(ValueError):validate_bundle(bad)
 bad=copy.deepcopy(b);bad['spec']['config']['clients']=1
 with pytest.raises(ValueError):validate_bundle(bad)

def test_missing_checkpoint_cannot_predict(monkeypatch,tmp_path):
 monkeypatch.setenv('MODEL_PATH',str(tmp_path/'absent.pt'))
 with TestClient(app) as client:
  assert client.get('/health').json()['ready'] is False
  assert client.post('/predict',files={'file':('scan.png',b'bad','image/png')}).status_code==503

# Synthetic weights verify plumbing ONLY, never packaged or used in the product.
def test_checkpoint_loading_and_image_contract(monkeypatch,tmp_path):
 path=tmp_path/'test.pt'
 torch.manual_seed(3)
 torch.save(metadata(OCTNet().state_dict()),path)
 sha=hashlib.sha256(path.read_bytes()).hexdigest()
 monkeypatch.setenv('MODEL_SHA256',sha)
 monkeypatch.setenv('MODEL_PATH',str(path))
 with TestClient(app) as client:
  assert client.get('/health').json()['model']['sha256']==sha
  im=Image.new('RGB',(250,200),(110,110,110));raw=io.BytesIO();im.save(raw,format='PNG')
  r=client.post('/predict',files={'file':('scan.png',raw.getvalue(),'image/png')})
  assert r.status_code==200
  body=r.json();assert [s['label'] for s in body['scores']]==CLASSES
  assert sum(s['score'] for s in body['scores'])==pytest.approx(1)
  assert body['prediction'] in CLASSES
  assert client.post('/predict',files={'file':('bad.png',b'invalid','image/png')}).status_code==422
  assert client.post('/predict',files={'file':('scan.svg',b'<svg/>','image/svg+xml')}).status_code==415
  assert client.post('/predict',files={'file':('big.png',b'0'*(5*1024*1024+1),'image/png')}).status_code==413
  preflight=client.options('/predict',headers={'Origin':'http://localhost:8080','Access-Control-Request-Method':'POST'})
  assert preflight.headers['access-control-allow-origin']=='http://localhost:8080'
  denied=client.options('/predict',headers={'Origin':'https://unapproved.example','Access-Control-Request-Method':'POST'})
  assert denied.status_code==400
 monkeypatch.setenv('MODEL_SHA256','0'*64)
 with pytest.raises(ValueError):Predictor(path)
