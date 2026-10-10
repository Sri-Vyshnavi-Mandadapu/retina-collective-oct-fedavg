import * as ort from './vendor/ort.wasm.min.mjs';
import {resizeRGB,normalizeRGB,imageDimensions} from './preprocess.mjs';
ort.env.wasm.wasmPaths=new URL('./vendor/',import.meta.url).href;
ort.env.wasm.numThreads=1;
let session,metadata;
const progress=text=>postMessage({type:'progress',text});
async function verifiedModel(m) {
  const url=new URL(m.file, new URL('./model/',import.meta.url)).href;
  let cache;
  try {cache=await caches.open('retina-model-v1');}catch{}
  let response=await cache?.match(url),cached=Boolean(response);
  if(!response)response=await fetch(url);
  if(!response.ok)throw Error('The model download failed. Check your connection and try again.');
  const total=Number(response.headers.get('content-length'))||m.bytes;
  const reader=response.body.getReader(),chunks=[];let received=0;
  for(;;){const {done,value}=await reader.read();if(done)break;chunks.push(value);received+=value.length;progress(`${cached?'Opening cached model':'Downloading model'} · ${Math.min(100,Math.round(received/total*100))}%`);}
  const bytes=new Uint8Array(received);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  if(digest!==m.onnx_sha256){await cache?.delete(url);throw Error('Model integrity check failed. Please retry the download.');}
  if(!cached&&cache)try {await cache.put(url,new Response(bytes,{headers:{'Content-Type':'application/octet-stream'}}));}catch{}
  return bytes;
}
onmessage=async({data})=>{
  try {
    const {file,manifest}=data;
    if(!file || !['image/png','image/jpeg'].includes(file.type)||file.size===0||file.size>5*1024*1024)throw Error('Choose a JPEG or PNG of at most 5 MB.');
    const dimensions=imageDimensions(await file.arrayBuffer());
    if(Math.min(...dimensions)<16||dimensions[0]*dimensions[1]>12000000)throw Error('Use an image at least 16 pixels wide and high, and at most 12 megapixels.');
    if(!session){progress('Preparing your model…');const bytes=await verifiedModel(manifest);progress('Starting the model on your device…');session=await ort.InferenceSession.create(bytes,{executionProviders:['wasm'],graphOptimizationLevel:'all'});metadata=manifest;}
    progress('Reading retinal patterns on your device…');
    const bitmap=await createImageBitmap(file,{imageOrientation:'from-image',colorSpaceConversion:'none',premultiplyAlpha:'none'});
    const canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(bitmap,0,0);bitmap.close();
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    for(let i=3;i<pixels.length;i+=4)if(pixels[i]!==255)throw Error('Use an opaque JPEG or PNG. Transparent pixels are not supported.');
    const rgb=resizeRGB(pixels,canvas.width,canvas.height,metadata.image_size);
    const input=normalizeRGB(rgb,metadata.image_size,metadata.mean,metadata.std);
    const outputs=await session.run({image:new ort.Tensor('float32',input,[1,3,224,224])});
    const logits=Array.from(outputs.logits.data),max=Math.max(...logits),exp=logits.map(x=>Math.exp(x-max)),sum=exp.reduce((a,b)=>a+b,0);
    if(logits.length!==4||logits.some(x=>!Number.isFinite(x)))throw Error('The model returned invalid scores.');
    const scores=metadata.classes.map((label,i)=>({label,score:exp[i]/sum}));
    const result={prediction:scores.reduce((a,b)=>a.score>=b.score?a:b).label,scores,model:{type:'fedavg',architecture:'DenseNet121',clients:3,round:metadata.best_round,sha256:metadata.source_sha256,runtime:'onnx-browser'}};
    Object.values(outputs).forEach(t=>t.dispose());
    postMessage({type:'result',result});
  }catch(error){postMessage({type:'error',text:error.message||'Analysis failed. Please retry.'});}
};
