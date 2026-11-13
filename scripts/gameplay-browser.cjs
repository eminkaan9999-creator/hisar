'use strict';
// Full ORIGINAL HİSAR game + real Chromium WebGL on software GPU.
// State injection is used for edge cases. This is not a physical device/FPS benchmark.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=process.cwd(),out=path.join(root,'gameplay-reports');fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],diagnostics=[],screens=[];let browser;
const cache=fs.readFileSync('sw.js','utf8').match(/const CACHE='([^']+)'/)[1];
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png'};
const server=http.createServer((req,res)=>{let rel;try{rel=decodeURIComponent(new URL(req.url,'http://local').pathname);}catch{res.writeHead(400).end();return;}if(!rel.startsWith('/hisar/')){res.writeHead(404).end();return;}
 let file=path.resolve(root,rel.slice(7));if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
function ok(name){checks.push(name);console.log('PASS',name);}
async function shot(page,name){await page.screenshot({path:path.join(out,name)});screens.push(name);}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/hisar/';
 browser=await chromium.launch({args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});
 for(const mobile of [false,true]){const tag=mobile?'mobile':'desktop';const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:720},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
 await context.addInitScript(()=>{const raf=window.requestAnimationFrame;let primed=false;window.requestAnimationFrame=fn=>raf.call(window,t=>{if(!primed){try{if(typeof setQ==='function'){setQ('dusuk');primed=true;}}catch{}}fn(t);});
  localStorage.setItem('m60v2',JSON.stringify({xp:120,kr:500,U:{},best:{}}));});
 const page=await context.newPage();page.setDefaultTimeout(60000);page.on('pageerror',e=>{const text=String(e.stack||e);errors.push({tag,text});console.log('PAGE_ERROR',text.slice(0,700));});
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>!!window.HisarGameplay&&!!window.HisarImmersive&&!!window.HisarPolish&&window.HisarGameBridge.snapshot().ready,{},{timeout:90000});
 await page.evaluate(()=>{HisarGameBridge.quality('dusuk');HisarGameBridge.auto(false);});
 assert.equal(await page.evaluate(()=>HisarGameplay.version),'1.3.0');assert.equal(await page.evaluate(()=>R.getContext().isContextLost()),false);ok(tag+': original WebGL renderer and both new modules initialize');
 assert.equal(await page.locator('#hg-story').count(),0);assert.equal(await page.locator('#tg [data-g]').count(),8);ok(tag+': old story is gone and one list holds the eight missions');
 await page.locator('#hisar-experience-entry').click();await page.waitForFunction(()=>document.getElementById('hisar-experience').open);
 await page.locator('[data-page="settings"]').click();const panel=page.locator('#hs-simple');await panel.scrollIntoViewIfNeeded();const box=await panel.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=(mobile?390:1280)+1);ok(tag+': gameplay settings fit original settings dialog');
 await page.evaluate(()=>HisarGameplay.set({droneView:'fpv'}));assert.equal(await page.evaluate(()=>HisarGameplay.getSettings().droneView),'fpv');await page.evaluate(()=>HisarGameplay.set({droneView:'follow'}));ok(tag+': real camera view setting responds to UI input');
 await shot(page,tag+'-settings.png');await page.locator('#hx-close').click();
 if(!mobile){
 assert.equal(await page.evaluate(()=>{lvSel='serbest';return HisarOperations.start(0);}),true);await page.waitForFunction(()=>game==='play');assert.equal(await page.evaluate(()=>mis),'op_temas');ok('mission: first new mission launches in the native scene');
 await page.waitForTimeout(1600);await shot(page,'story-native-scene.png');
 // Exercise all currently registered player vehicle models without changing the user's live save.
 const ids=await page.evaluate(()=>Object.keys(TANKS));
 for(const id of ids){const state=await page.evaluate(id=>{applyTank(id);iv=0;mode='tank';camUpdate();R.render(S,CAM);return {selected:SV.tank,children:P.g.children.length,valid:[CAM.position.x,CAM.position.y,CAM.position.z].every(Number.isFinite)};},id);assert.equal(state.selected,id);assert.ok(state.children>0&&state.valid);ok('vehicle model: '+id+' renders with gameplay adapter');}
 await page.evaluate(()=>applyTank('m60'));
 for(const view of [0,1,2,3]){assert.equal(await page.evaluate(v=>{iv=v;mode='tank';camUpdate();R.render(S,CAM);return [CAM.position.x,CAM.position.y,CAM.position.z,CAM.fov].every(Number.isFinite);},view),true);ok('native tank view '+view+' remains valid');}
 await page.evaluate(()=>{iv=0;mode='tank';SV.dbody='saldiri';DRONE2.setBody('saldiri');sw();DR.sp=1;DR.rt=0;DR.fall=0;DR.y=hAt(DR.x,DR.z)+28;DR.ty=DR.y;ammo=5;camUpdate();});
 assert.equal(await page.evaluate(()=>mode),'drone');await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>DR.g.scale.x),.58);ok('drone: follow mode displays larger body in actual camera');
 await shot(page,'drone-follow.png');
 await page.evaluate(()=>{HisarGameplay.set({droneView:'fpv'});camUpdate();});assert.equal(await page.evaluate(()=>DR.g.visible),false);ok('drone: clean FPV mode hides own airframe');
 await page.evaluate(()=>{HisarGameplay.set({droneView:'follow'});camUpdate();});
 const drop=await page.evaluate(()=>{ammo=5;DR.sp=1;DR.rt=0;DR.fall=0;fire();const one=ammo;fire();return {one,two:ammo,owned:bombs.filter(b=>b.hg).length};});assert.equal(drop.one,4);assert.equal(drop.two,4);assert.equal(drop.owned,1);ok('bomb: one release consumes one unit; immediate repeat blocked');
 const ammoBefore=await page.evaluate(()=>ammo);await page.waitForFunction(()=>HisarGameplay.diagnostics().customImpacts>=1,{},{timeout:90000,polling:500});assert.equal(await page.evaluate(()=>ammo),ammoBefore);ok('bomb: native scene lands custom drop with no mid-air regeneration');
 const cam=await page.evaluate(()=>({on:DR.on,game,stats:HisarGameplay.diagnostics()}));diagnostics.push(cam);
 await page.evaluate(()=>{DR.th=1;mode='drone';DR.on=true;camUpdate();R.render(S,CAM);});assert.match(await page.evaluate(()=>R.domElement.style.filter),/hisar-thermal-palette/);ok('drone: green palette reaches the real WebGL canvas');await shot(page,'drone-green.png');
 await page.evaluate(()=>{DR.th=0;mode='tank';iv=0;camUpdate();R.render(S,CAM);});assert.doesNotMatch(await page.evaluate(()=>R.domElement.style.filter),/hisar-thermal-palette/);ok('daylight: green filter is removed from original canvas');
 // Native outcome handler is the only event that unlocks the next story chapter.
 await page.evaluate(()=>endGame(false,'CI native outcome test'));assert.equal(await page.evaluate(()=>game),'over');assert.equal(await page.locator('#hr-debrief').count(),1);ok('mission: native outcome ends the mission and shows its debrief');await shot(page,'story-debrief.png');
 }
 const values=await page.evaluate(()=>({xp:SV.xp,gameplay:localStorage.getItem('hisar-gameplay-v1')}));assert.ok(values.gameplay);ok(tag+': preferences saved in separate namespace');
 if(mobile){for(const [w,h]of [[320,568],[844,390]]){await page.setViewportSize({width:w,height:h});await page.locator('#hisar-experience-entry').click();await page.locator('[data-page="settings"]').click();await panel.scrollIntoViewIfNeeded();const bb=await panel.boundingBox();assert.ok(bb.x>=0&&bb.x+bb.width<=w+1);ok('mobile layout: '+w+'x'+h+' gameplay panel within viewport');await page.locator('#hx-close').click();}}
 await page.evaluate(async()=>{await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;});
 await page.waitForFunction(async name=>await caches.has(name),cache,{timeout:90000});
 assert.equal(await page.evaluate(async name=>{const c=await caches.open(name);return !!await c.match(new URL('experience/gameplay.js',location.href).href)&&!!await c.match(new URL('experience/immersive.js',location.href).href);},cache),true);ok(tag+': both modules cached in native service worker');
 diagnostics.push(await page.evaluate(()=>({gameplay:HisarGameplay.diagnostics(),renderer:{calls:R.info.render.calls,triangles:R.info.render.triangles},errors:window.HERR?HERR.LOG:[]})));
 assert.equal(errors.filter(e=>/experience\/(gameplay|immersive)\.js/.test(e.text)).length,0);ok(tag+': no runtime exceptions in new modules');
 await context.close();
 }
})().catch(e=>{errors.push({fatal:String(e.stack||e)});console.error(e);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({scope:'Original full game / Chromium real WebGL software renderer; low quality CI preset; injected state for edge cases; not physical device or performance certification',passed:checks.length,checks,errors,diagnostics,screens},null,2));if(browser)await browser.close();server.closeAllConnections();server.close();});
