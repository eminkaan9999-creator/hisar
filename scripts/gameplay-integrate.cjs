'use strict';
// Idempotent integration into the inspected v64 shell. No source PDF or unrelated app is touched.
const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const changes=[];
function plan(file,before,done,transform){const original=fs.readFileSync(file,'utf8');if(done(original))return;if(hash(original)!==before)throw Error('Source changed; refusing overwrite: '+file);const updated=transform(original);if(file.endsWith('.js')||file.endsWith('.cjs'))new vm.Script(updated,{filename:file});else if(file.endsWith('.json'))JSON.parse(updated);changes.push({file,updated});}
const loader=`
// HİSAR presentation/gameplay pack. Sequenced, same-origin and non-blocking.
(function(root){
 if(!root.document)return;
 const script=root.document.currentScript;
 const base=new URL('./',script&&script.src?script.src:new URL('experience/',root.document.baseURI).href);
 function load(name,ready,next){
  if(ready()){next();return;}
  const id='hisar-load-'+name;if(root.document.getElementById(id))return;
  const el=root.document.createElement('script');el.id=id;el.src=new URL(name+'.js?v=1.2.0',base).href;
  el.onload=next;el.onerror=()=>{const n=root.document.getElementById('hx-status');if(n)n.textContent='Yeni oyun modülü yüklenemedi; mevcut oyun korunuyor. GÜNCELLE ile yeniden dene.';};
  root.document.head.appendChild(el);
 }
 load('immersive',()=>!!root.HisarImmersive,()=>load('gameplay',()=>!!root.HisarGameplay,()=>{}));
})(typeof window!=='undefined'?window:globalThis);
`;
plan('experience/polish.js','f2f20d32b01f9847e3d00dafb753f0c3a9e98b7f4c6d43cbb8efc26c5ed44b7e',s=>s.includes('// HİSAR presentation/gameplay pack.'),s=>s+loader);
plan('sw.js','1274c876369f46b893e2077e49adef7f68ada86eae23cc016aff0a2a430f066f',s=>s.includes("const CACHE='hisar-main-v64-gameplay-12'")||s.includes("hisar-main-v65-operations-13")||s.includes("experience/simple-settings.js"),s=>s.replace("hisar-main-v64-controls-1","hisar-main-v64-gameplay-12").replace("'experience/controls.js'];","'experience/controls.js','experience/immersive.js','experience/gameplay.js'];"));
plan('version.json','5eb9e760e39fe2538630665c99390907d720e70458bba1d3707a5ee76a24d290',s=>JSON.parse(s).gameplay==='1.2.0',s=>{const v=JSON.parse(s);v.gameplay='1.2.0';v.presentation='1.1.0';v.gameplayNotes='Net drone/takip görünümü, mesafeye bağlı oyun patlamaları, sınırlı bırakma ve ikmal, dört bölümlük Kayıp Sinyal hikâyesi, görünür hedef etiketleri ve telsiz bağlantısı.';return JSON.stringify(v,null,2)+'\n';});
plan('scripts/experience-browser.cjs','bb40057c1df789da9ea2189c7fef921e07db4b1391cacae83d8cd348667e0c10',s=>s.includes('const CACHE=fs.readFileSync')||s.includes("require('./simple-browser.cjs')"),s=>s.replace("const GAME_V=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).v;","const GAME_V=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).v;\nconst CACHE=fs.readFileSync(path.join(root,'sw.js'),'utf8').match(/const CACHE='([^']+)'/)[1];").replace("await page.waitForFunction(async()=>await caches.has('hisar-main-v63.2'));","await page.waitForFunction(async name=>await caches.has(name),CACHE);").replace("page.evaluate(async()=>{const c=await caches.open('hisar-main-v63.2');return !!await c.match(new URL('experience/polish.js',location.href).href);})","page.evaluate(async name=>{const c=await caches.open(name);return !!await c.match(new URL('experience/polish.js',location.href).href);},CACHE)"));
for(const {file,updated}of changes)fs.writeFileSync(file,updated);
console.log('Gameplay integration: '+changes.length+' files updated; original game version preserved.');
