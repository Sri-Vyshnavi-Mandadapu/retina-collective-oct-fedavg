export const CLASSES = ['CNV','DME','DRUSEN','NORMAL'];
export const NAMES = {CNV:'Choroidal neovascularization',DME:'Diabetic macular edema',DRUSEN:'Drusen',NORMAL:'Normal OCT category'};
export const CONDITIONS = {
  CNV: {description: 'Abnormal blood vessels grow beneath the retina, the light-sensitive layer at the back of the eye. These vessels can leak fluid or blood and blur or distort central vision.', source: 'https://medlineplus.gov/ency/article/001000.htm'},
  DME: {description: 'Diabetic macular edema is swelling in the macula, the part of the retina used for sharp central vision. It happens when blood vessels damaged by diabetes leak fluid, which can make vision blurry.', source: 'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/macular-edema'},
  DRUSEN: {description: 'Drusen are small yellow deposits beneath the retina. They can be associated with age-related changes in the macula and do not always cause noticeable vision symptoms.', source: 'https://medlineplus.gov/ency/article/001000.htm'},
  NORMAL: {description: 'This scan most closely matches the normal OCT category learned by the model. This result does not rule out eye conditions outside the four categories this model recognizes.', source: null},
};
export function weightedAverage(vectors, counts) {
  if(vectors.length!==3 || counts.length!==3 || counts.some(n=>!Number.isFinite(n)||n<=0) || vectors.some(v=>v.length!==3||v.some(x=>!Number.isFinite(x)))) throw Error('Enter positive image counts for all three hospitals.');
  const total=counts.reduce((a,b)=>a+b,0);
  return [0,1,2].map(j=>vectors.reduce((s,v,i)=>s+v[j]*counts[i]/total,0));
}
export function validateResult(r) {
  if(!r || !CLASSES.includes(r.prediction) || !Array.isArray(r.scores) || r.scores.length!==4 || r.scores.some((s,i)=>s.label!==CLASSES[i]||!Number.isFinite(s.score)||s.score<0||s.score>1) || Math.abs(r.scores.reduce((s,x)=>s+x.score,0)-1)>1e-4 || r.model?.type!=='fedavg' || !/^[a-f0-9]{64}$/.test(r.model.sha256||'') || !Number.isInteger(r.model.round)) throw Error('The API returned an invalid model result.');
  const top=r.scores.reduce((a,b)=>a.score>=b.score?a:b);
  if(top.label!==r.prediction) throw Error('Inconsistent prediction from API.');
  return r;
}
export function transcript(r) {return `${r.name || 'Untitled scan'} — ${new Date(r.date).toLocaleString()}. Predicted category: ${r.prediction} (${NAMES[r.prediction]}). About this category: ${CONDITIONS[r.prediction].description} ${r.scores.map(s=>`${s.label} ${(s.score*100).toFixed(1)}%`).join('; ')}. Uncalibrated model scores, not diagnostic probabilities. DenseNet121 / FedAvg, selected round ${r.model.round}. Model SHA-256: ${r.model.sha256}. Research use only.`;}
