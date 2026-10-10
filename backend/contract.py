"""Strict metadata contract for the OCT Colab export (not a provenance proof)."""
import math
CLASSES = ['CNV', 'DME', 'DRUSEN', 'NORMAL']
def validate_bundle(b):
    if not isinstance(b, dict) or 'model' not in b:
        raise ValueError('Expected inference_bundle.pt exported by the OCT notebook.')
    if b.get('classes') != CLASSES:
        raise ValueError('Wrong classes/order. ODIR and baseline bundles are not accepted.')
    spec = b.get('spec', {})
    if spec.get('architecture') != 'oct_densenet121_v1' or spec.get('config', {}).get('clients') != 3:
        raise ValueError('Expected oct_densenet121_v1 with three federated clients.')
    if b.get('preprocess') != 'full_image_resize_bilinear_rgb':
        raise ValueError('Unsupported preprocessing.')
    if b.get('image_size') != 224:
        raise ValueError('Expected the 224-pixel OCT model export.')
    for key, expected in [('mean', [.485,.456,.406]), ('std', [.229,.224,.225])]:
        values = b.get(key, [])
        if len(values) != 3 or any(not isinstance(x,(int,float)) or not math.isclose(x,y,abs_tol=1e-6) for x,y in zip(values,expected)):
            raise ValueError('Normalization does not match the trained model.')
    if type(b.get('best_round')) is not int or b['best_round'] < 1:
        raise ValueError('Missing selected global round.')
    if not isinstance(b['model'], dict) or not b['model']:
        raise ValueError('Missing trained parameters.')
    return b
