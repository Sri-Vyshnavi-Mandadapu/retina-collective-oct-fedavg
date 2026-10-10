import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname,sep} from 'node:path';
const root=resolve('frontend'),port=8765;
const headers=await readFile('frontend/_headers','utf8');
const csp=headers.match(/Content-Security-Policy: (.+)/)[1];
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.wasm':'application/wasm'};
const server=createServer(async(req,res)=>{try{const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}const path=file===root?resolve(root,'index.html'):file;const body=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Content-Security-Policy':csp,'Content-Length':body.length});res.end(body);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(port,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],posts=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
 await page.goto(process.env.SITE_URL||`http://127.0.0.1:${port}`);
 await page.waitForFunction(()=>document.getElementById('status-text').textContent.includes('round 16'));
 const fixtures=JSON.parse(await readFile('tests/fixtures/parity.json','utf8'));
 for(const fixture of fixtures){
  const pixels=await page.evaluate(async file=>{const blob=await(await fetch(file)).blob();return blob.size;},'./model/manifest.json');assert.ok(pixels>0);
  await page.locator('#file-input').setInputFiles(`tests/fixtures/${fixture.file}`);
  await page.locator('#oct-confirm').check();
  await page.locator('#analyze-button').click();
  await page.waitForFunction(()=>!document.getElementById('result-content').hidden || document.getElementById('upload-message').classList.contains('error'),null,{timeout:240000});
  assert.equal(await page.locator('#result-content').isVisible(),true,await page.locator('#upload-message').textContent());
  await page.waitForFunction(()=>!document.getElementById('file-input').disabled);
  const result=await page.evaluate(()=>JSON.parse(localStorage.getItem('retina-collective-history-v1'))[0]);
  assert.ok((await page.locator('#condition-description').textContent()).length>50);
  assert.match(await page.locator('#transcript-text').textContent(),/About this category:/);
  const error=Math.max(...result.scores.map((s,i)=>Math.abs(s.score-fixture.scores[i])));
  assert.ok(error<2e-4,`Browser parity error: ${error}`);
  console.log(`${fixture.file}: browser/PyTorch max score error ${error}`);
 }
 await mkdir('artifacts',{recursive:true});
 await page.screenshot({path:'artifacts/workspace-desktop.png',fullPage:true});
 await page.locator('[data-route="history"]').click();assert.equal(await page.locator('.history-item').count(),4);
 await page.locator('#history-search').fill('no-such-scan');assert.equal(await page.locator('.history-item').count(),0);
 await page.locator('#history-search').fill('');
 const downloadPromise=page.waitForEvent('download');await page.locator('#export-history').click();assert.equal((await downloadPromise).suggestedFilename(),'retina-history.txt');
 await page.reload();assert.equal(await page.locator('.history-item').count(),4);
 await page.locator('#clear-history').click();await page.locator('#cancel-clear').click();assert.equal(await page.locator('.history-item').count(),4);
 await page.locator('#clear-history').click();await page.locator('#confirm-clear').click();assert.equal(await page.locator('.history-item').count(),0);
 await page.locator('[data-route="about"]').click();
 for(let i=0;i<3;i++)await page.locator('#sim-step').click();assert.equal(await page.locator('#sim-round').textContent(),'ROUND 01');
 await page.locator('#sim-reset').click();assert.equal(await page.locator('#sim-round').textContent(),'ROUND 00');
 await page.locator('[data-block-select="2"]').click();assert.match(await page.locator('#block-description').textContent(),/24 dense layers/);
 await page.screenshot({path:'artifacts/about-desktop.png',fullPage:true});
 await page.locator('[data-route="scan"]').click();
 await page.locator('#file-input').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('invalid image')});await page.locator('#oct-confirm').check();await page.locator('#analyze-button').click();
 await page.waitForFunction(()=>document.getElementById('upload-message').classList.contains('error'));assert.match(await page.locator('#upload-message').textContent(),/readable JPEG or PNG/);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/workspace-mobile.png',fullPage:true});
 for(const route of ['scan','history','about']){await page.evaluate(route=>{location.hash=route;},route);await page.waitForTimeout(100);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route} overflows mobile viewport`);}
 assert.deepEqual(posts,[],'Scans must never be uploaded');assert.deepEqual(errors,[]);
 console.log('PASS: browser inference, parity, history, export, deletion, simulation, invalid files, mobile layouts, no scan uploads, no script errors.');
}finally{await browser.close();server.close();}
