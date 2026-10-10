"""Idempotent migration of the original site's copy to on-device inference."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'frontend/index.html'
s=p.read_text(encoding='utf-8')
replacements={
 '<link rel="stylesheet" href="styles.css">':'<link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="refinements.css">',
 'Analysis sends your image to the configured model API. The API does not retain uploaded images after the request. Device history is optional.':'Your scan stays on this device. The first analysis downloads the model (about 28 MB); subsequent scans reuse it. No account or server upload is needed.',
 '<p>Running the saved federated model.<br>No simulated predictions.</p>':'<p id="loading-detail" role="status" aria-live="polite">Preparing the saved federated model on your device…</p>',
 'Inference requires your exported three-client FedAvg checkpoint.':'Powered by the supplied three-client FedAvg checkpoint, running on your device.',
 'The API loads the exported, validation-selected global FedAvg checkpoint—not a centralized baseline.':'Your browser loads the exported, validation-selected global FedAvg checkpoint. The original trained weights power every result.',
 '<p id="upload-message"':'<button id="retry-model" class="button secondary full" hidden>Reconnect model</button><p id="upload-message"',
 'RESEARCH & EDUCATION · OCT2017':'RESEARCH & EDUCATION · ON-DEVICE INFERENCE',
}
for before,after in replacements.items():
    if before in s and after not in s:s=s.replace(before,after)
p.write_text(s,encoding='utf-8')
p=root/'frontend/app.js';s=p.read_text(encoding='utf-8').replace('Image selected. Connect the FedAvg API to analyze.','Image selected. Reconnect the model to analyze.')
s=s.replace("$('oct-confirm').checked=false;updateButton();};", "$('oct-confirm').checked=false;current=null;$('result-content').hidden=true;$('result-empty').hidden=false;message('Choose an OCT image to begin.');updateButton();};")
p.write_text(s,encoding='utf-8')
print('Updated interface copy and image removal state.')
