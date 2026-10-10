# Verification — 2026-10-10

## Model

- Supplied checkpoint loaded with `weights_only=True` and strict parameter matching; 727 state tensors, selected round 16, three-client metadata.
- Source SHA-256: `a67407874d3ea6ef86a9507063c67ba18fe5baefd1e309f1d6fc08fcd8023e26`.
- ONNX export: 28,234,329 bytes; SHA-256 `51476624e742ebf93ebe2d3a21951020b2249b695fcb99ac08418d8a002e4201`.
- ONNX structure validation passed.
- Four deterministic nonclinical PNG patterns cover downsampling, upsampling, and unchanged dimensions.
- Maximum desktop ONNX/PyTorch logit difference: `1.7286e-6`.
- Maximum browser/PyTorch softmax score difference: `4.636e-7`.
- These tests verify conversion and preprocessing, not clinical accuracy or OCT classification performance.

## Application

- JavaScript contract tests: 2 passed.
- Python reference/API tests: 3 passed (one dependency deprecation warning).
- Chrome browser test passed under the production Content Security Policy.
- Verified actual browser worker inference, four scores, history persistence/reload, search, transcript export, cancel/confirm deletion, simulation progression/reset, architecture tabs, malformed file errors, responsive layout at 390 pixels, and no image POST requests.
- No uncaught page script errors in the browser test.
- Desktop and mobile screenshots inspected; improved score spacing and hidden skip-link styling, then reran the browser suite successfully.
- Netlify publication and anonymous-access verification are tracked separately; local tests do not prove deployment.

## Remaining scope limits

No real OCT image or held-out evaluation report was present for independent clinical-performance verification. Tests use the actual supplied weights on nonclinical patterns. Browser JPEG decoding can differ from Pillow. Physical phones and browsers other than Chrome were not tested. Free hosting has monthly usage limits.

## Public deployment verified - 2026-10-10

- URL: https://merry-otter-714f0d.netlify.app
- Production deploy: 6ac9c4faad3673e9549cabf3.
- Existing Netlify account remains on Free. Site-specific login protection removed at the owner's request; no team-wide settings changed.
- Anonymous HTTP GET returned 200 with the Retina page.
- Full Chrome suite passed against the public URL: real ONNX predictions, parity on all four fixtures, history, exports/deletion, simulation, invalid images and mobile layout. No image POST requests or uncaught page errors.
- Maximum live browser/PyTorch score difference: 4.63576820264322e-7.
- Source checkpoint and ONNX hashes match the manifest; all 727 checkpoint tensors are finite.
- JavaScript tests: 2 passed. Python tests: 3 passed (dependency deprecation and sandbox cache-write warnings).
- Clinical performance and per-class OCT test precision remain unverified. See MODEL_AUDIT.md for missing evidence.

## Final evaluation recovered from Colab - supersedes missing-results status

The shared notebook at https://colab.research.google.com/drive/1Hv1d0NQcnVW8iTiUtyretiotsUK7mid4 contains completed round-16 training, export verification and final held-out results. It reports 97.93% test accuracy and per-class precision of 93.05%, 99.59%, 99.56%, and 100%, on 968 images from 609 patients. The inference-bundle fingerprint and dataset manifest match the locally deployed model. These are saved notebook results; the evaluation was not rerun locally. See MODEL_AUDIT.md and evaluation/colab_evaluation_evidence.json. The earlier missing-results assessment is superseded.

## Condition descriptions and restart persistence - 2026-10-10

- Public deploy: 6ac9d4240dec4cb2ce693922.
- Added short educational descriptions for CNV, DME, DRUSEN and NORMAL below each result, plus source links for conditions. Descriptions also appear in saved history and downloaded transcripts.
- Descriptions reference National Eye Institute and MedlinePlus information; they are fixed category explanations, not image-specific medical findings.
- Existing JavaScript and browser suites passed; browser timing now waits for history saving before checking stored inference scores.
- Public index.html, app.js, core.mjs and refinements.css matched local release hashes over anonymous HTTP.
- tests/history-restart.mjs passed against the live site: ran actual inference, reloaded the page, closed Chrome completely, reopened the same test profile and verified identical report, scores, timestamp, model fingerprint and thumbnail. Reopening the saved scan displays the description.
- History saving is enabled by default. Storage is limited to 50 reports in the same browser profile and website origin. Clearing site data, private sessions or switching browser/device does not preserve that local history.
