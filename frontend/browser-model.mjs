let worker,manifest;
export async function modelStatus() {
  if(!globalThis.Worker||!globalThis.OffscreenCanvas||!globalThis.WebAssembly)throw Error('Use a recent Chrome, Edge, Firefox or Safari browser for on-device analysis.');
  const response=await fetch('./model/manifest.json',{cache:'no-cache'});
  if(!response.ok)throw Error('Model files are unavailable. Please refresh or contact the project owner.');
  manifest=await response.json();
  if(manifest.classes?.join(',')!=='CNV,DME,DRUSEN,NORMAL'||manifest.image_size!==224||!Number.isInteger(manifest.best_round)||manifest.best_round<1||!/^model-[a-f0-9]{12}\.onnx$/.test(manifest.file)||!/^([a-f0-9]{64})$/.test(manifest.source_sha256)||!/^([a-f0-9]{64})$/.test(manifest.onnx_sha256))throw Error('The model metadata is invalid.');
  return {ready:true,model:{type:'fedavg',round:manifest.best_round}};
}
export async function analyzeInBrowser(file,onProgress) {
  if(!manifest)await modelStatus();
  worker??=new Worker(new URL('./inference-worker.mjs',import.meta.url),{type:'module'});
  return new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{worker.terminate();worker=null;reject(Error('Analysis took too long. Please retry on a faster device or connection.'));},240000);
    worker.onmessage=({data})=>{if(data.type==='progress'){onProgress(data.text);return;}clearTimeout(timeout);if(data.type==='result')resolve(data.result);else reject(Error(data.text));};
    worker.onerror=()=>{clearTimeout(timeout);worker.terminate();worker=null;reject(Error('Could not start the model. Refresh the page and try a recent browser.'));};
    worker.postMessage({file,manifest});
  });
}
