import test from 'node:test';
import assert from 'node:assert/strict';
import {weightedAverage,validateResult,transcript,CLASSES} from '../frontend/core.mjs';
test('FedAvg uses all three sample counts',()=>{
 const r=weightedAverage([[1,0,0],[0,1,0],[0,0,1]],[300,500,200]);
 assert.deepEqual(r,[.3,.5,.2]);
 assert.throws(()=>weightedAverage([[1,2,3],[1,2,3],[1,2,3]],[0,2,3]));
});
test('result contract rejects baseline, wrong class order and inconsistent scores',()=>{
 const r={prediction:'NORMAL',scores:CLASSES.map((label,i)=>({label,score:i===3?.7:.1})),model:{type:'fedavg',round:8,sha256:'a'.repeat(64)}};
 assert.equal(validateResult(r),r);
 assert.throws(()=>validateResult({...r,model:{...r.model,type:'baseline'}}));
 assert.throws(()=>validateResult({...r,prediction:'CNV'}));
 assert.throws(()=>validateResult({...r,scores:[...r.scores].reverse()}));
 assert.match(transcript({...r,name:'Scan 1',date:'2026-01-01'}),/selected round 8/);
});
