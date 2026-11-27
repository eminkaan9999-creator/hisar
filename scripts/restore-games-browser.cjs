'use strict';
// Real old workers/cache entries, then the restored game. No game save migrations.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),previous='07d30e73a133ffe3520a2be563a1285517f7be89';
const old=new Map(),types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.mp3':'audio/mpeg'};
let restored=false,browser;
const server=http.createServer((req,res)=>{
  let name=new URL(req.url,'http://test').pathname;
  if(!name.startsWith('/hisar/')){res.writeHead(404).end();return;}
  name=name.slice(7);if(name.endsWith('/')||!name)name+='index.html';
  if(name==='upgrade-check.html'||name==='santiye-250888c5/upgrade-check.html'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Upgrade fixture</title>');return;}
  const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{
    let data;
    if(restored)data=fs.readFileSync(file);
    else{if(!old.has(name))old.set(name,cp.execFileSync('git',['show',previous+':'+name],{cwd:root,maxBuffer:40*1024*1024,stdio:['ignore','pipe','ignore']}));data=old.get(name);}
    res.setHeader('Content-Type',types[path.extname(name)]||'application/octet-stream');
    if(name.endsWith('index.html'))res.setHeader('Cache-Control','public,max-age=3600');
    else res.setHeader('Cache-Control','no-store');
    res.end(data);
  }catch{res.writeHead(404).end();}
});
async function seed(page,base,cache){
  await page.goto(base+'upgrade-check.html');
  await page.evaluate(async()=>{
    localStorage.setItem('m60v2',JSON.stringify({xp:321,kr:200,U:{},best:{}}));
    localStorage.setItem('hs-proj',JSON.stringify({prog:{kapadokya:2},money:7654}));
    localStorage.setItem('hisar-santiye-29','{"preserve":"rejected-shell-save"}');
    localStorage.setItem('hs-test-preserve','original-value');
    await caches.open('hisar-tetik-preserve');
    await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(async name=>(await caches.keys()).includes(name),cache,{timeout:120000});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  assert.ok(await page.evaluate(async name=>!!await(await caches.open(name)).match(new URL('index.html',location.href).href),cache));
}
async function upgrade(page,cache){
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await page.waitForFunction(async name=>(await caches.keys()).includes(name),cache,{timeout:120000});
  await page.waitForFunction(async name=>{
    const keys=await caches.keys();return keys.includes(name)&&!keys.some(k=>(k.startsWith('hisar-main-')||k.startsWith('hisar-santiye-'))&&k!==name);
  },cache,{timeout:120000});
  await page.waitForFunction(name=>new Promise(resolve=>{const c=navigator.serviceWorker.controller;if(!c)return resolve(false);const ch=new MessageChannel();const t=setTimeout(()=>resolve(false),500);ch.port1.onmessage=e=>{clearTimeout(t);resolve(e.data?.cache===name);};c.postMessage('VERSION',[ch.port2]);}),cache,{timeout:120000});
  const values=await page.evaluate(async()=>({tank:JSON.parse(localStorage.getItem('m60v2')),site:JSON.parse(localStorage.getItem('hs-proj')),legacy:localStorage.getItem('hisar-santiye-29'),marker:localStorage.getItem('hs-test-preserve'),other:(await caches.keys()).includes('hisar-tetik-preserve')}));
  assert.equal(values.tank.xp,321);assert.equal(values.site.money,7654);assert.equal(values.marker,'original-value');assert.equal(values.other,true);assert.equal(values.legacy,'{"preserve":"rejected-shell-save"}');
}
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port+'/hisar/';
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});
  const tank=await browser.newContext({viewport:{width:640,height:360}}),site=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
  const tp=await tank.newPage(),sp=await site.newPage(),errors=[];
  for(const p of [tp,sp]){p.setDefaultTimeout(90000);p.on('pageerror',e=>{errors.push(e.message);console.error('PAGE_ERROR',e.message);});}
  await seed(tp,base,'hisar-main-125');
  await seed(sp,base+'santiye-250888c5/','hisar-santiye-29.0');
  console.log('PASS previous workers and cached replacement entries installed');
  restored=true;
  await upgrade(tp,'hisar-main-v126-original-restored');await upgrade(sp,'hisar-santiye-30-original');
  console.log('PASS both workers upgrade without clearing saves or sibling caches');
  console.log('CHECK original tank navigation');
  await tank.addInitScript(()=>{const raf=window.requestAnimationFrame;let primed=false;window.requestAnimationFrame=fn=>raf.call(window,t=>{if(!primed){try{if(typeof setQ==='function'){setQ('dusuk');primed=true;}}catch{}}fn(t);});});
  await tp.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
  console.log('CHECK tank DOM ready');
  await tp.waitForFunction(()=>window.HisarSimpleSettings?.diagnostics().ready,{},{timeout:120000});
  console.log('CHECK tank settings ready');
  assert.equal(await tp.evaluate(()=>window.APP_VER),126);
  assert.equal(await tp.evaluate(()=>SV.xp),321);
  assert.ok(await tp.locator('#go').isVisible());assert.equal(await tp.locator('[data-game="boru"]').count(),0);
  await tp.bringToFront();console.log('CHECK starting restored campaign');await tp.locator('#go').click();await tp.locator('.hk-go').click();await tp.waitForFunction(()=>game==='play');
  const before=await tp.evaluate(()=>({x:P.x,z:P.z}));await tp.keyboard.down('w');
  try{await tp.waitForFunction(start=>Math.hypot(P.x-start.x,P.z-start.z)>.05,before,{timeout:60000});}finally{await tp.keyboard.up('w');}
  const after=await tp.evaluate(()=>({x:P.x,z:P.z}));assert.ok(Math.hypot(after.x-before.x,after.z-before.z)>.05,'original tank responds to W');
  await tp.screenshot({path:'/tmp/restored-boru.png'});
  console.log('PASS original tank game opens and driving input moves the tank');
  await tp.close();
  await sp.goto(base+'santiye-250888c5/',{waitUntil:'domcontentloaded',timeout:120000});
  await sp.waitForFunction(()=>window.__hs?.vehicles?.length>=10,{},{timeout:120000});
  assert.equal(await sp.locator('iframe').count(),0);
  assert.ok(await sp.locator('#cards .card').count()>=1);
  await sp.evaluate(()=>__hs.stop());
  await sp.screenshot({path:'/tmp/restored-santiye-menu.png'});
  // Enter the existing vehicle controller; then apply ordinary keyboard input.
  await sp.evaluate(()=>__hs.start('gr'));
  const sb=await sp.evaluate(()=>{const v=__hs.vehicles.find(v=>v.type==='gr');return{x:v.x,z:v.z};});
  await sp.keyboard.down('w');await sp.evaluate(()=>__hs.frame(90,1/30,true));await sp.keyboard.up('w');
  const sa=await sp.evaluate(()=>{const v=__hs.vehicles.find(v=>v.type==='gr');return{x:v.x,z:v.z};});
  assert.ok(Math.hypot(sa.x-sb.x,sa.z-sb.z)>.05,'original grader responds to W');
  await sp.evaluate(()=>__hs.frame(1,1/30));await sp.screenshot({path:'/tmp/restored-santiye.png'});
  console.log('PASS original construction menu and grader controls restored');
  await site.setOffline(true);await sp.reload({waitUntil:'domcontentloaded',timeout:120000});
  await sp.waitForFunction(()=>window.__hs?.vehicles?.length>=10,{},{timeout:120000});
  assert.equal(await sp.evaluate(()=>localStorage.getItem('hs-test-preserve')),'original-value');
  assert.equal(await sp.locator('iframe').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS offline reopening serves original construction game; no runtime errors');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.closeAllConnections();server.close();});
