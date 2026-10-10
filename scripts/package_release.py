"""Produce clean website/source ZIPs, excluding credentials and local dependencies."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root=Path(__file__).resolve().parents[1]
output=root/'artifacts'
output.mkdir(exist_ok=True)
with ZipFile(output/'retina-netlify-ready.zip','w',ZIP_DEFLATED) as archive:
    for path in sorted((root/'frontend').rglob('*')):
        if path.is_file():archive.write(path,path.relative_to(root/'frontend'))
files=['README.md','TEST_RESULTS.md','MODEL_AUDIT.md','RECOVERED_REQUIREMENTS.md','netlify.toml','package.json','package-lock.json','.gitignore','VERIFY_EXPORT_IN_COLAB.py']
for folder in ['frontend','backend','scripts','tests','training','evaluation']:
    files.extend(str(p.relative_to(root)) for p in (root/folder).rglob('*')
                 if p.is_file() and '__pycache__' not in p.parts and 'fixtures' not in p.parts)
with ZipFile(output/'retina-project-clean.zip','w',ZIP_DEFLATED) as archive:
    for name in files:archive.write(root/name,'retina-web/'+name)
print('Created artifacts/retina-netlify-ready.zip and artifacts/retina-project-clean.zip')
