import {mkdir, copyFile} from 'node:fs/promises';
const target = new URL('../frontend/vendor/', import.meta.url);
await mkdir(target, {recursive:true});
for (const name of ['ort.wasm.min.mjs', 'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']) {
  await copyFile(new URL(`../node_modules/onnxruntime-web/dist/${name}`, import.meta.url), new URL(name,target));
}
await copyFile(new URL('../node_modules/onnxruntime-web/README.md',import.meta.url),new URL('ONNXRUNTIME-README.md',target));
console.log('Browser runtime prepared.');
