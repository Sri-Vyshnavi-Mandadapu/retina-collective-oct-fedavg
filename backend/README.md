---
title: Retina Collective API
emoji: 👁
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---
Retina Collective research API. Load the exported OCT DenseNet121 FedAvg bundle in `model/inference_bundle.pt`. Configure `MODEL_SHA256` and `ALLOWED_ORIGINS` as Space variables. GET `/health` returns readiness; POST `/predict` accepts a JPEG/PNG multipart file.

The supplied checkpoint is included locally in `model/inference_bundle.pt`; see the root README for its fingerprint. This API is retained as an optional reference. The public website uses browser inference and requires no Python hosting. No remote Python host has been provisioned; check current host quotas and pricing before deploying this optional service.

No baseline or synthetic fallback. This API does not authenticate users; CORS only controls browser access. Use de-identified research images only. Uploaded image files may be temporarily spooled by the multipart parser and are closed after each request; the app does not retain them.
