# Contributing

Thanks for helping improve Retina Collective. Please keep model and research claims traceable to the exact checkpoint, dataset manifest, split, and evaluation report.

## Before opening a pull request

1. Run `npm ci` and `npm test`.
2. For browser or model changes, run `npm run test:browser` and document the result. This needs a recent Chrome installation.
3. For Python API changes, install the backend dependencies and run `python -m pytest -q tests/test_backend.py`.
4. Do not commit patient scans, identifiers, credentials, environment files, local run data, or Netlify claim files.
5. Do not describe synthetic parity fixtures as clinical validation, or select a model using the held-out test set.

Model updates must include the source checkpoint fingerprint, dataset manifest fingerprint, class order, preprocessing, selected validation round, and matching evaluation evidence. Do not add `.pt` checkpoints to Git. The browser ONNX asset is required for the public website and remains downloadable there.
