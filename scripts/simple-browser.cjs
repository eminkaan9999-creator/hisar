'use strict';
// Original game; real Chromium/software WebGL. Synthetic FPS for policy edge cases,
// not a performance benchmark and not a physical iPhone test.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=process.cwd(),out='simple-reports',checks=[],errors=[];let browser;
fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.mp3':'audio/mpeg','.png':'image/png'};
const server=http.createServer((req,res)=>{let rel;try{rel=decodeURIComponent(new URL(req.url,'http://test').pathname);}catch{res.writeHead(400).end();return;}
 if(!rel.startsWith('/hisar/')){res.writeHead(404).end();return;}let f=path.resolve(root,rel.slice(7));if(f!==root&&!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
const ok=name=>{checks.push(name);console.log('PASS',name);};
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/hisar/';
 browser=await chromium.launch({args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});
 for(const mobile of [false,true]){const label=mobile?'mobile':'desktop';const c=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
 await c.addInitScript(()=>{if(!localStorage.getItem('m60v2'))localStorage.setItem('m60v2',JSON.stringify({xp:321,kr:200,U:{},best:{}}));
 if(!localStorage.getItem('test-graphics-seeded')){localStorage.setItem('hisar-experience-v1',JSON.stringify({quality:'yuksek',autoQuality:false,cinematic:true,contrastCrosshair:true,showFPS:true}));localStorage.setItem('test-graphics-seeded','1');}
 const raf=window.requestAnimationFrame;let primed=false;window.requestAnimationFrame=fn=>raf.call(window,t=>{if(!primed){try{if(typeof setQ==='function'){setQ('dusuk');primed=true;}}catch{}}fn(t);});});
 const p=await c.newPage();p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(label+': '+String(e.stack||e)));
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.HisarSimpleSettings?.diagnostics().ready,{},{timeout:90000});
 assert.equal(await p.evaluate(()=>R.getContext().isContextLost()),false);assert.equal(await p.evaluate(()=>HisarSimpleSettings.diagnostics().automatic),true);ok(label+': actual game renderer uses automatic graphics');
 assert.equal(await p.evaluate(()=>HisarExperience.getSettings().quality),'mevcut');assert.equal(await p.evaluate(()=>HisarExperience.getSettings().cinematic),false);ok(label+': old manual graphics preference cannot disable automatic settings');
 await p.locator('#hisar-experience-entry').click();assert.equal(await p.locator('#hisar-experience').evaluate(e=>e.open),true);
 assert.equal(await p.locator('#hx-settings input:visible,#hx-settings select:visible').count(),3);ok(label+': exactly three visible player settings');
 for(const id of ['hx-quality','hx-auto','hx-cinematic','hx-crosshair','hx-fps','hx-polish','hg-settings','hisar-immersive-settings','hx-control-feel'])assert.equal(await p.locator('#'+id).isVisible(),false);ok(label+': detailed graphic, thermal and duplicate control panels absent');
 assert.equal(await p.locator('#hx-chat').count(),0);ok(label+': removed assistant does not reappear');
 await p.locator('[data-simple="control"]').selectOption('hassas');assert.equal(await p.evaluate(()=>HisarControls.getProfile()),'hassas');ok(label+': simple sensitivity changes actual driving input profile');
 await p.locator('[data-simple="difficulty"]').selectOption('kolay');assert.equal(await p.evaluate(()=>lvSel),'kolay');ok(label+': easy start is connected to the next actual mission');
 await p.locator('[data-simple="sound"]').uncheck();assert.equal(await p.evaluate(()=>sndOn),0);assert.equal(await p.evaluate(()=>SV.voice),0);ok(label+': sound switch mutes native audio and crew voice');
 await p.locator('[data-simple="sound"]').check();assert.equal(await p.evaluate(()=>sndOn),1);ok(label+': sound can be restored with one switch');
 const before=await p.evaluate(()=>({xp:SV.xp,credits:SV.kr,best:SV.best}));assert.equal(before.xp,321);assert.equal(before.credits,200);ok(label+': existing XP and credits retained');
 await p.screenshot({path:path.join(out,label+'-simple-settings.png')});
 if(mobile){for(const [w,h]of [[320,568],[844,390]]){await p.setViewportSize({width:w,height:h});await p.locator('#hs-simple').scrollIntoViewIfNeeded();const b=await p.locator('#hs-simple').boundingBox();assert.ok(b.x>=0&&b.x+b.width<=w+1);assert.equal(await p.locator('#hx-settings input:visible,#hx-settings select:visible').count(),3);ok('simple settings fit '+w+'x'+h);await p.screenshot({path:path.join(out,'simple-'+w+'x'+h+'.png')});}}
 await p.locator('#hx-close').click();await p.evaluate(()=>tab('a'));assert.equal(await p.locator('#ta [data-q]:visible').count(),0);assert.equal(await p.locator('#hs-settings-link').isVisible(),true);ok(label+': native settings tab also has no manual graphics');
 await p.locator('#hs-settings-link button').click();assert.equal(await p.locator('#hs-simple').isVisible(),true);ok(label+': old settings entry leads to the same simple menu');await p.locator('#hx-close').click();
 if(!mobile){await p.reload({waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.HisarSimpleSettings?.diagnostics().ready,{},{timeout:90000});assert.equal(await p.evaluate(()=>HisarControls.getProfile()),'hassas');assert.equal(await p.evaluate(()=>HisarGameBridge.snapshot().auto),true);assert.equal(await p.evaluate(()=>SV.xp),321);ok('simple preferences and automatic graphics survive reload');
 const adjusted=await p.evaluate(()=>{const original=performance.now.bind(performance),oldGame=game;let t=original();Object.defineProperty(performance,'now',{configurable:true,value:()=>t});try{document.dispatchEvent(new Event('visibilitychange'));setQ('orta');game='play';kc.t=0;window.mapOpen=false;perfAdapt(20);t+=9000;perfAdapt(20);t+=2200;perfAdapt(20);return {q:qlv,n:HisarSimpleSettings.diagnostics().adjustments};}finally{Object.defineProperty(performance,'now',{configurable:true,value:original});game=oldGame;document.dispatchEvent(new Event('visibilitychange'));}});
 assert.equal(adjusted.q,'dusuk');assert.ok(adjusted.n>=1);ok('injected slow-frame samples lower actual renderer quality without UI action');
 await p.evaluate(()=>{HisarOperations.start(0);});await p.waitForFunction(()=>game==='play');assert.equal(await p.evaluate(()=>L.hp),150);await p.waitForTimeout(1800);ok('new scenario starts with the selected easy difficulty');
 await p.keyboard.press('F2');assert.equal(await p.evaluate(()=>game),'pause');await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>game),'play');ok('simple settings pause and resume active gameplay');
 }
 await p.evaluate(async()=>{await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;});const cache=fs.readFileSync('sw.js','utf8').match(/const CACHE='([^']+)'/)[1];await p.waitForFunction(async name=>{const c=await caches.open(name);return !!await c.match(new URL('experience/simple-settings.js',location.href));},cache,{timeout:90000});ok(label+': automatic settings module is precached for offline play');
 await p.evaluate(()=>HisarSimpleSettings.install());assert.equal(await p.locator('#hs-simple').count(),1);ok(label+': repeated initialization creates no duplicate panels');
 await c.close();}
 assert.equal(errors.length,0);ok('no original-game or new-module runtime exceptions');
})().catch(e=>{errors.push(String(e.stack||e));console.error(e);process.exitCode=1;}).finally(async()=>{const report={scope:'Original game + Chromium software WebGL; synthetic FPS inputs for adaptation tests. Not physical iPhone or real performance certification.',passed:checks.length,checks,errors};fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(report,null,2));fs.writeFileSync('experience-browser-results.json',JSON.stringify(report,null,2));if(browser)await browser.close();server.closeAllConnections();server.close();});
