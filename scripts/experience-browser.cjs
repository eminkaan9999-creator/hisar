'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=process.cwd(),checks=[];
const watchdog=setTimeout(()=>{console.error('Browser test exceeded 600 seconds. Completed checks:',checks);process.exit(1);},600000);watchdog.unref();
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png'};
const server=http.createServer((req,res)=>{
 let rel;try{rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 if(!rel.startsWith('/hisar/')){res.writeHead(404).end();return;}
 let file=path.resolve(root,rel.slice(7));if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}
 try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');const bytes=fs.readFileSync(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);}catch{res.writeHead(404).end('not found');}
});
function ok(name){checks.push(name);console.log('PASS',name);}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/hisar/';
 const browser=await chromium.launch({args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 try{
  for(const mobile of [false,true]){
   const label=mobile?'mobile':'desktop';
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
   await context.addInitScript(()=>{
    // Test-only: retain the real 3D engine but use its low preset on the software GPU.
    const raf=window.requestAnimationFrame;let primed=false;window.requestAnimationFrame=function(fn){return raf.call(window,t=>{if(!primed){try{if(typeof setQ==='function'){setQ('dusuk');primed=true;}}catch{}}fn(t);});};
    if(!localStorage.getItem('m60v2'))localStorage.setItem('m60v2',JSON.stringify({xp:120,kr:500,U:{},best:{}}));});
   const page=await context.newPage(),errors=[];page.setDefaultTimeout(45000);page.setDefaultNavigationTimeout(120000);
   page.on('pageerror',e=>{errors.push(String(e.stack||e));console.log('PAGE_ERROR',String(e.stack||e).slice(0,1200));});
   await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
   await page.waitForFunction(()=>window.HisarExperience&&window.HisarPolish&&window.HisarGameBridge.snapshot().ready,{},{timeout:60000});
   await page.evaluate(()=>HisarGameBridge.quality('dusuk'));await page.waitForTimeout(3200);
   assert.equal(await page.evaluate(()=>window.APP_VER),63);assert.equal(await page.evaluate(()=>HisarPolish.version),'63.1');ok(label+': original 3D engine, build 63 and experience 63.1 initialize');
   await page.locator('#hisar-experience-entry').click();assert.equal(await page.locator('#hisar-experience').evaluate(e=>e.open),true);
   const box=await page.locator('#hisar-experience').boundingBox();assert.ok(box.x>=0&&box.width<=(mobile?390:1280));ok(label+': integrated panel fits viewport');
   assert.equal(await page.locator('[data-page="assistant"]').count(),0);assert.equal(await page.locator('#hx-chat').count(),0);ok(label+': removed assistant is absent');
   await page.locator('[data-page="settings"]').click();await page.locator('#hx-quality').selectOption('dusuk');await page.locator('#hx-auto').uncheck();
   assert.equal(await page.locator('#hx-quality').evaluate(el=>{el.value='orta';el.dispatchEvent(new Event('change'));const level=HisarGameBridge.snapshot().quality;el.value='dusuk';el.dispatchEvent(new Event('change'));return level;}),'orta');
   const config=await page.evaluate(()=>HisarGameBridge.snapshot());assert.equal(config.quality,'dusuk');assert.equal(config.auto,false);ok(label+': native quality and adaptation controls work');
   await page.locator('#hx-cinematic').check();await page.locator('#hx-crosshair').check();
   assert.equal(await page.evaluate(()=>HisarExperience.getSettings().cinematic&&HisarExperience.getSettings().contrastCrosshair&&document.body.classList.contains('hisar-cinematic')),true);ok(label+': visual checkboxes really execute their handlers');
   await page.locator('[data-polish="reduceShake"]').check();assert.equal(await page.evaluate(()=>HisarPolish.getSettings().reduceShake),true);ok(label+': camera comfort option is wired');
   await page.locator('#hx-large').check();await page.screenshot({path:'experience-'+label+'.png'});
   await page.locator('#hx-close').click();if(!mobile){await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.HisarExperience&&!!window.HisarPolish);await page.waitForTimeout(3200);}
   assert.equal(await page.evaluate(()=>HisarGameBridge.snapshot().quality),'dusuk');assert.equal(await page.evaluate(()=>HisarGameBridge.snapshot().auto),false);assert.equal(await page.evaluate(()=>HisarExperience.getSettings().largeText),true);assert.equal(await page.evaluate(()=>HisarGameBridge.snapshot().xp),120);
   assert.equal(await page.evaluate(()=>HisarExperience.getSettings().cinematic&&HisarPolish.getSettings().reduceShake),true);ok(label+(mobile?': preferences save without erasing game progress':': preferences survive reload without erasing game progress'));
   if(!mobile){
    await page.locator('[data-m="serbest"]').first().click();await page.locator('#go').click();
    await page.waitForFunction(()=>HisarGameBridge.snapshot().state==='play');
    const diagnostic=()=>page.evaluate(()=>({state:HisarGameBridge.snapshot(),session:HisarExperience.snapshot(),hidden:document.hidden,hooks:typeof FRAME_HOOKS==='undefined'?'missing':FRAME_HOOKS.length,frames:typeof R==='undefined'?null:R.info.render.frame,errors:window.HERR?window.HERR.LOG:[],polish:HisarPolish.diagnostics()}));
    console.log('PLAY_STARTED',JSON.stringify(await diagnostic()));
    try{await page.waitForFunction(()=>HisarExperience.snapshot().activeSeconds>=2,{},{timeout:90000,polling:500});}
    catch(e){console.log('SESSION_DIAGNOSTIC',JSON.stringify(await diagnostic()));throw e;}
    console.log('PLAY_MEASURED',JSON.stringify(await diagnostic()));ok('desktop: real render loop records active time');
    await page.keyboard.press('F2');await page.locator('[data-page="settings"]').click();
    assert.equal(await page.evaluate(()=>HisarGameBridge.snapshot().state),'pause');assert.equal(await page.locator('#hx-quality').count(),1);ok('desktop: settings panel pauses game without chatbot');
    await page.locator('[data-page="session"]').click();await page.locator('#hx-save').click();console.log('SESSION_SAVE_STATUS',await page.locator('#hx-status').innerText());assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('hisar-session-history-v1')||'[]').length),1);ok('desktop: measured active session is saved');
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#hx-export').click()]);const report=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(report.schema,1);assert.equal(report.session.xp,120);ok('desktop: JSON report export contains real game values');
    await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>HisarGameBridge.snapshot().state),'play');ok('desktop: Escape resumes the previously running game');
    await page.evaluate(async()=>{await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;});
    await page.waitForFunction(async()=>await caches.has('hisar-main-v63.1'));
    assert.equal(await page.evaluate(async()=>{const c=await caches.open('hisar-main-v63.1');return !!await c.match(new URL('experience/polish.js',location.href).href);}),true);ok('offline: presentation module is included in cache');
    await page.goto(base+'iti/');assert.match(await page.title(),/İTİ/);await context.setOffline(true);
    const offlineTitle=await page.evaluate(()=>new Promise((resolve,reject)=>{const f=document.createElement('iframe');f.setAttribute('sandbox','allow-same-origin');f.onload=()=>{try{resolve({title:f.contentDocument.title,integrated:f.contentDocument.documentElement.innerHTML.includes('experience/ui.js?v=63')});}catch(e){reject(e);}};f.onerror=()=>reject(Error('offline navigation failed'));f.src='../?offline=1';document.body.appendChild(f);}));
    assert.match(offlineTitle.title,/HİSAR/);assert.equal(offlineTitle.integrated,true);ok('offline: visiting ITI never replaces the integrated main game shell');
    await page.goto(base+'iti/',{waitUntil:'domcontentloaded'});assert.match(await page.title(),/İTİ/);ok('offline: standalone ITI shell remains separate');
   }
   assert.equal(errors.filter(e=>/experience\/(?:ui|guard|bridge|core|polish)\.js/.test(e)).length,0);ok(label+': no new module runtime exceptions');
   await context.close();
  }
  console.log('BROWSER CHECKS PASSED',checks.length);fs.writeFileSync('experience-browser-results.json',JSON.stringify({passed:checks.length,checks},null,2));
 }finally{clearTimeout(watchdog);await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
