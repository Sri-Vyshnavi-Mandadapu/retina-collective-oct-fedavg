# Run this in a NEW Colab cell AFTER Cell 7 has exported inference_bundle.pt.
# No retraining or final-test rerun is needed if that export already exists.
from pathlib import Path
import hashlib
import torch
from google.colab import drive, files

drive.mount('/content/drive')
RUN_FOLDER = Path('/content/drive/MyDrive/Retinal_OCT/oct_densenet121_fedavg_v1')
# If your notebook uses another RUN_NAME, change RUN_FOLDER to its OUT folder.
path = RUN_FOLDER / 'inference_bundle.pt'
best_path = RUN_FOLDER / 'best.pt'
assert path.exists(), 'Run the notebook export cell first (Cell 7).'
b = torch.load(path, map_location='cpu', weights_only=True)
best = torch.load(best_path, map_location='cpu', weights_only=True)
assert b['spec']['config']['clients'] == 3, 'This is not the three-client experiment.'
assert b['spec']['architecture'] == 'oct_densenet121_v1'
assert b['classes'] == ['CNV','DME','DRUSEN','NORMAL']
assert b['spec'] == best['spec'] and b['best_round'] == best['round']
assert b['model'].keys() == best['model'].keys()
assert all(torch.equal(b['model'][k], best['model'][k]) for k in b['model']), 'Export differs from selected global checkpoint.'
sha = hashlib.sha256(path.read_bytes()).hexdigest()
print('Selected FedAvg global round:', b['best_round'])
print('MODEL_SHA256 =', sha)
print('Keep this hash for the API hosting configuration.')
files.download(str(path))
