# Recovered requirements - 2026-10-10

Source: https://chatgpt.com/share/6ac93428-5ddc-83ec-96a5-583b44767278

## Final agreed direction

The project began with eight-label paired-eye ODIR classification. The user later explicitly requested a different dataset; the accepted replacement is four-class OCT2017: CNV, DME, DRUSEN, NORMAL. Do not revert to the older ODIR model or borrow its metrics.

Use DenseNet121, three simulated clients and sample-weighted FedAvg. Select the global checkpoint by validation macro F1, never substitute the one-client pooled baseline. Target held-out accuracy above 85% and precision above 85% in every class; no guarantee was given.

The website requirements are an engaging 3D interface, image upload with real final FedAvg predictions, four class scores, searchable image history with short transcripts, and an About page with a DenseNet121 explanation, scroll animations and the three-hospital parameter-update simulation. Keep the toy simulation on the About page.

The user requires free resources and rejected keeping a laptop/tunnel running. The final shared-chat recommendation was Netlify with ONNX Runtime Web using the actual exported checkpoint. Browser inference removes the need for a hosted Python prediction API. Model conversion must preserve predictions and preprocessing; training stays separate in Colab.

## Status against that direction

- Public Netlify site deployed; anonymous access and live browser inference suite passed.
- Supplied three-client round-16 checkpoint exported to ONNX, with numerical parity verified on four nonclinical fixtures.
- History, transcripts, 3D elements, About-page simulation, and mobile layout verified by the browser suite.
- Optional Python reference API retained locally; no paid or laptop-dependent backend required for predictions.
- Original Colab notebook retained. Its training copy now includes the earlier shared-chat correction for conflicting labels: log conflicts, exclude affected development patients, preserve test images, and stop if test labels contradict. This does not alter deployed weights or restart training.
- The corrected cell passed Python syntax validation. No full dataset audit, retraining, or GPU execution was run locally.

## Recovered performance evidence

The user reported round-8 VALIDATION accuracy 0.922, macro F1 0.909, and minimum per-class precision 0.860. Training then paused at round 9/client 2. The shared conversation instructed resuming the same experiment and running export followed by final evaluation.

These are reported validation results for round 8, not independently verified test results for the deployed round 16. The shared conversation does not supply matching round-16 held-out metrics. Obtain test_metrics.json and test_per_class.csv from the OCT run, plus best.pt and training_history.csv to verify selection/provenance.

## Final evaluation obtained - 2026-10-10

The user subsequently shared the completed Colab notebook. Its outputs report 97.93% test accuracy and a minimum class precision of 93.05% for round 16. Export verification prints the exact deployed bundle hash, and its dataset manifest matches the report. This supersedes the missing-results status above. The target is met on the notebook's held-out sample; no independent retraining or test rerun occurred locally. See MODEL_AUDIT.md.
