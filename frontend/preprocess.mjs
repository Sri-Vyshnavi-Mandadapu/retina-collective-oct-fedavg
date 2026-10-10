// Pillow-compatible separable, antialiased bilinear resize of RGB byte pixels.
export function coefficients(source, target) {
  const scale = source / target, filterScale = Math.max(scale,1), rows=[];
  for(let i=0;i<target;i++) {
    const center=(i+.5)*scale;
    const start=Math.max(0,Math.trunc(center-filterScale+.5));
    const end=Math.min(source,Math.trunc(center+filterScale+.5));
    const weights=[];
    for(let j=start;j<end;j++) weights.push(Math.max(0,1-Math.abs((j-center+.5)/filterScale)));
    const sum=weights.reduce((a,b)=>a+b,0);
    rows.push({start,weights:weights.map(w=>Math.floor(w/sum*(1<<22)+.5))});
  }
  return rows;
}
export function resizeRGB(rgba,width,height,size=224) {
  const horizontal=coefficients(width,size),vertical=coefficients(height,size);
  const middle=new Uint8Array(size*height*3),out=new Uint8Array(size*size*3);
  for(let y=0;y<height;y++) for(let x=0;x<size;x++) for(let c=0;c<3;c++) {
    const {start,weights}=horizontal[x];let sum=1<<21;
    for(let k=0;k<weights.length;k++) sum+=rgba[(y*width+start+k)*4+c]*weights[k];
    middle[(y*size+x)*3+c]=Math.max(0,Math.min(255,Math.floor(sum/(1<<22))));
  }
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) for(let c=0;c<3;c++) {
    const {start,weights}=vertical[y];let sum=1<<21;
    for(let k=0;k<weights.length;k++) sum+=middle[((start+k)*size+x)*3+c]*weights[k];
    out[(y*size+x)*3+c]=Math.max(0,Math.min(255,Math.floor(sum/(1<<22))));
  }
  return out;
}
export function normalizeRGB(rgb,size,mean,std) {
  const plane=size*size,result=new Float32Array(plane*3);
  for(let i=0;i<plane;i++) for(let c=0;c<3;c++) result[c*plane+i]=Math.fround(Math.fround(Math.fround(rgb[i*3+c]/255)-Math.fround(mean[c]))/Math.fround(std[c]));
  return result;
}
export function imageDimensions(buffer) {
  const b=new Uint8Array(buffer),v=new DataView(buffer);
  if(b.length>=24 && b[0]===137 && b[1]===80 && b[2]===78 && b[3]===71) return [v.getUint32(16),v.getUint32(20)];
  if(b[0]===255 && b[1]===216) {
    let i=2;
    while(i+3<b.length) {
      if(b[i++]!==255) continue;
      while(b[i]===255)i++;
      const marker=b[i++];
      if(marker===217 || marker===218) break;
      if(marker===1 || marker>=208 && marker<=215)continue;
      if(i+2>b.length)break;
      const length=v.getUint16(i);
      if(length<2 || i+length>b.length)break;
      if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && length>=7) return [v.getUint16(i+5),v.getUint16(i+3)];
      i+=length;
    }
  }
  throw Error('This file is not a readable JPEG or PNG.');
}
