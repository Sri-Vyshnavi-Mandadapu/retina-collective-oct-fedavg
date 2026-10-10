# Model audit - updated 2026-10-10

## Result

The shared Colab notebook reports completed 16-round training and selects round 16 by best validation macro F1 (0.9116054941363996). Its final held-out report meets the requested accuracy > 85% and precision > 85% in every class.

- Test accuracy: 97.93% (948 / 968 images correct).
- Macro precision: 98.05%.
- Macro F1: 97.93%.
- Minimum class precision: 93.05%.
- Test cohort: 968 images, 609 patients / independent groups, 242 images per class.
- Patient-group bootstrap accuracy 95% interval: 96.86% to 98.82%.

| Class | Precision | Recall | Test images |
| --- | ---: | ---: | ---: |
| CNV | 93.05% | 99.59% | 242 |
| DME | 99.59% | 100.00% | 242 |
| DRUSEN | 99.56% | 92.56% | 242 |
| NORMAL | 100.00% | 99.59% | 242 |

## Checkpoint identity

The notebook's export verification compares all inference_bundle.pt tensors, class order, experiment specification and round with best.pt before printing its SHA-256. Its saved output is a67407874d3ea6ef86a9507063c67ba18fe5baefd1e309f1d6fc08fcd8023e26, which matches the local checkpoint and deployed ONNX manifest.

The held-out report records best.pt SHA-256 80640890e7c25bf948c391a6cfe137f6ef9c677babc52670ac300506caeea310. This differs from the inference bundle hash because they are different serialized files; the notebook verifies model tensor equality. The report's dataset manifest hash matches the exported bundle: 496ff8dda3a38eb69f2fa1bd277e3000ef5977e4fd9709fd2c8e6b81eb8486fe.

Local ONNX SHA-256: 51476624e742ebf93ebe2d3a21951020b2249b695fcb99ac08418d8a002e4201. Browser/PyTorch score parity was independently checked on four nonclinical patterns, including the live public deployment, with maximum absolute error 4.636e-7.

## Training and evaluation method

The notebook records ImageNet-initialized DenseNet121, three clients and sample-weighted FedAvg. It uses patient-disjoint splits and duplicate checks, removes development images for test patients, logs label conflicts and excludes affected development patients without changing the test cohort. The final evaluation uses all test images with argmax class predictions; it does not filter results by confidence to inflate precision. The checkpoint is selected using validation macro F1, not test performance or precision alone.

## Evidence limits

These accuracy and precision values are read from saved outputs of the user's shared notebook. The full training and held-out evaluation were not independently rerun locally, and the held-out images and best.pt are not available locally. The source hash and manifest matches were checked locally. Best means validation-selected within this completed experiment, not globally optimal or clinically validated. No retraining or model replacement was performed during this audit.

The earlier audit's missing-results status is superseded by this notebook evidence. The eight-label ODIR files remain unrelated.

Source: https://colab.research.google.com/drive/1Hv1d0NQcnVW8iTiUtyretiotsUK7mid4
Machine-readable evidence: evaluation/colab_evaluation_evidence.json
