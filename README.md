# Retina Collective

A four-class retinal OCT research website powered by a three-client DenseNet121 FedAvg model. The public website runs inference in the visitor's browser, so scans are not sent to a prediction server.

**Live Netlify site:** [merry-otter-714f0d.netlify.app](https://merry-otter-714f0d.netlify.app)

## Features

- OCT image upload and on-device ONNX inference with the exported round-16 FedAvg checkpoint.
- CNV, DME, DRUSEN and NORMAL categories, four model scores, and short educational descriptions.
- Searchable local scan history, thumbnails, and downloadable transcripts. History is stored in the same browser and device, up to 50 reports.
- Responsive 3D-inspired interface, DenseNet121 overview, and an About-page FedAvg simulation.
- Optional FastAPI/PyTorch reference service under `backend/`. The public site does not depend on a hosted API.

## Project layout

| Path | Purpose |
| --- | --- |
| `frontend/` | Netlify static site, ONNX weights, browser inference worker |
| `backend/` | Optional Python inference API and checkpoint contract |
| `training/` | Output-cleared OCT2017 federated-training Colab notebook |
| `evaluation/` | Saved Colab test metrics and checkpoint identity evidence |
| `tests/` | JavaScript, Python API, browser and synthetic parity tests |
| `scripts/` | Model export, site setup and release packaging |
| `netlify.toml` | Netlify publish directory (`frontend`) |

## Run locally

Install Node.js 22 or newer, then run from the repository root:

```powershell
npm ci
npm test
python -m http.server 8080 --directory frontend
```

Open http://localhost:8080. The first model inference downloads about 27 MB. Scans are processed on-device. The browser test suite uses installed Chrome:

```powershell
npm run test:browser
```

The Python API tests need the dependencies in `backend/requirements.txt` and the CPU PyTorch/torchvision versions specified by `backend/Dockerfile`:

```powershell
python -m pytest -q tests/test_backend.py
```

## Deploy to the existing Netlify site

This project uses Netlify site `merry-otter-714f0d`. Deploy **only** `frontend/`:

```powershell
npm run deploy
```

The live site is [https://merry-otter-714f0d.netlify.app](https://merry-otter-714f0d.netlify.app). Netlify usage is subject to the account's current Free plan limits. See [Netlify pricing](https://www.netlify.com/pricing/).

## Model and reported results

- Architecture: DenseNet121, fine-tuned and aggregated with sample-weighted FedAvg over three simulated clients.
- Dataset task: four-class OCT2017 classification. Class order: `CNV`, `DME`, `DRUSEN`, `NORMAL`.
- Exported global checkpoint: selected round 16 by validation macro F1.
- Source checkpoint SHA-256: `a67407874d3ea6ef86a9507063c67ba18fe5baefd1e309f1d6fc08fcd8023e26`.
- Browser ONNX SHA-256: `51476624e742ebf93ebe2d3a21951020b2249b695fcb99ac08418d8a002e4201`.
- Shared Colab notebook reports 97.93% accuracy and minimum per-class precision of 93.05% on its 968-image held-out set from 609 patients.

The saved Colab export check compares every exported tensor with the selected `best.pt`; its source fingerprint matches the deployed model and the held-out report's dataset manifest. These are saved notebook results, not a locally rerun evaluation. See [MODEL_AUDIT.md](MODEL_AUDIT.md) and [evaluation/colab_evaluation_evidence.json](evaluation/colab_evaluation_evidence.json) for per-class results and limits. The reported best checkpoint is the best within that run; it is not a guarantee of performance on new data or clinical validation.

Open `training/Retinal_OCT_DenseNet121_Federated_Colab.ipynb` in Colab to inspect or continue training. Free Colab GPU access and runtime length vary. Keep validation for model selection and the held-out test set for final evaluation.

## Privacy and limitations

Images and prediction history stay in the visitor's browser. History is not synced across devices or browsers, and may be removed when browser site data is cleared. Model weights are included with the public site and can be downloaded by visitors. Model scores are uncalibrated research outputs, not disease probabilities or a diagnosis. The four categories do not cover all eye conditions. Federated learning is simulated on one Colab runtime; this project does not connect real hospitals.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing the model or evaluation. Never commit patient scans, identifiers, credentials, `.env` files, Netlify claim files, or PyTorch checkpoints. Do not use synthetic parity images as clinical test evidence.
