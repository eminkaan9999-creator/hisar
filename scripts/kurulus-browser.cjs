'use strict';
// Tests the three original rendered games. Movement/end-state edge cases use game-state injection.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=process.cwd(),out=path.join(root,'kurulus-reports');fs.mkdirSync(out,{recursive:true});let browser;const results=[],errors=[],catalogues={};
const mime={'.js':'application/javascript','.css':'text/css','.html':'text/html; charset=utf-8','.json':'application/json','.mp3':'audio/mpeg','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{let p=path.resolve(root,decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\/hisar\/?/,''));if(p!==root&&!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'}).end(fs.readFileSync(p));}catch{res.writeHead(404).end();}});
function ok(name){results.push(name);console.log('PASS',name);}
async function shot(p,name){await p.screenshot({path:path.join(out,name),timeout:60000});}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/hisar/';
 browser=await chromium.launch({...(process.env.LOCAL_CHROMIUM?{executablePath:process.env.LOCAL_CHROMIUM}:{}),args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({viewport:{width:960,height:540},hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
 await context.addInitScript(()=>{if(window===window.top){try{const k='m60v2';if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({xp:120,kr:500,U:{},best:{},form:1}));}catch{}}
 // The test renderer is software, not a physical phone; select its existing low rendering preset.
 const raf=requestAnimationFrame;let quality=false;window.requestAnimationFrame=fn=>raf.call(window,t=>{try{if(!quality&&typeof setQ==='function'){setQ('dusuk');quality=true;}}catch{}fn(t);});
 });
 await context.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 const p=await context.newPage();p.setDefaultTimeout(45000);p.on('pageerror',e=>{errors.push(String(e.stack||e));console.log('PAGEERROR',String(e));});
 await p.goto(base+'kurulus/',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>HisarCampaign.diagnostics().lockReady);
 assert.equal(await p.locator('[data-area]').count(),3);ok('one home contains full construction, tank and range areas');
 assert.equal(await p.locator('#scene').count(),1);ok('exactly one original game frame is active at a time');
 assert.equal(await p.evaluate(()=>HisarCampaign.diagnostics().state.drone.label),'Uçangöz');ok('shared vehicle is named Uçangöz');
 await shot(p,'shared-home.png');
 async function open(area){await p.locator('[data-area="'+area+'"]').click();await p.waitForFunction(()=>HisarCampaign.diagnostics().ready,{},{timeout:180000});const f=p.frames().find(f=>f!==p.mainFrame()&&f.url().includes('kurulus=1'));assert.ok(f);await f.waitForFunction(()=>!!window.HisarKurulusSession,{},{timeout:120000});return f;}
 async function home(){await p.locator('#home-button').click();await p.locator('#leave').click();await p.waitForFunction(()=>document.getElementById('play').hidden);}
 // Tank models, interiors, original targets and camera controls remain the original engine.
 let f=await open('tank');catalogues.tank=await f.evaluate(()=>HisarKurulusSession.catalogue());
 assert.equal(catalogues.tank.filter(x=>x.id.startsWith('tank:')).length,7);ok('all seven original tank models remain in the catalogue');
 assert.equal(catalogues.tank.filter(x=>x.id.startsWith('view:')).length,4);assert.equal(catalogues.tank.filter(x=>x.id.startsWith('crew:')).length,4);ok('four main cameras and four crew positions are connected');
 assert.ok(catalogues.tank.filter(x=>x.id.startsWith('target:')).length>=10);ok('original target families are retained');
 for(const v of ['view:0','view:1','view:2','view:3','crew:0','crew:1','crew:2','crew:3']){assert.equal(await f.evaluate(v=>HisarKurulusSession.activate(v).ok,v),true);await f.evaluate(()=>camUpdate());}
 ok('actual tank camera and crew switches complete without exceptions');
 await p.locator('#equipment-button').click();assert.equal(await p.locator('#equipment').isVisible(),true);await shot(p,'tank-catalogue.png');await p.locator('#equipment-close').click();
 assert.equal(await f.evaluate(()=>game),'play');ok('equipment drawer pauses and resumes the original tank game');
 const before=await f.evaluate(()=>HisarKurulusSession.drone().battery);assert.equal(await f.evaluate(()=>HisarKurulusSession.start()),true);await f.evaluate(()=>{for(let i=0;i<120;i++)HisarKurulusSession.frame(.05);camUpdate();});
 assert.ok((await f.evaluate(()=>HisarKurulusSession.drone().battery))<before);assert.equal(await f.evaluate(()=>HisarKurulusSession.activate('view:3').ok),false);ok('Uçangöz consumes battery and blocks vehicle changes while airborne');
 assert.equal(await f.locator('#kmd').isVisible(),false);assert.equal(await f.locator('#ui').isVisible(),false);ok('legacy controller and duplicate flight UI are hidden');
 const beforeAmmo=await f.evaluate(()=>ammo);await f.locator('[data-kd="actions"]').click();await f.locator('.kd-actions button').first().click();assert.equal(await f.evaluate(()=>ammo),beforeAmmo-1);ok('original release action consumes one game item through shared controls');
 await shot(p,'tank-ucangoz.png');await f.evaluate(()=>{HisarKurulusSession.recall();for(let i=0;i<500&&HisarKurulusSession.active();i++)HisarKurulusSession.frame(.05);});assert.equal(await f.evaluate(()=>HisarKurulusSession.active()),false);ok('Uçangöz returns to its original tank launch point');
 const carried=await p.evaluate(()=>HisarCampaign.diagnostics().state.drone.battery);await home();
 f=await open('site');catalogues.site=await f.evaluate(()=>HisarKurulusSession.catalogue());
 const vehicles=catalogues.site.filter(x=>x.id.startsWith('vehicle:'));assert.ok(vehicles.length>=10);ok('all construction engine drivable vehicles are exposed, not just Uçangöz');
 assert.ok(Math.abs((await f.evaluate(()=>HisarKurulusSession.drone().battery))-carried)<.01);ok('the same Uçangöz battery carries from tank to construction');
 for(const item of vehicles)assert.equal(await f.evaluate(id=>HisarKurulusSession.activate(id).ok,item.id),true);ok('every construction vehicle selection connects to the native vehicle');
 for(let i=0;i<4;i++)assert.equal(await f.evaluate(i=>HisarKurulusSession.activate('camera:'+i).ok,i),true);ok('construction outside, driver, work and overhead cameras are retained');
 await p.locator('#equipment-button').click();await shot(p,'site-catalogue.png');await p.locator('#equipment-close').click();
 assert.equal(await f.evaluate(()=>HisarKurulusSession.start()),true);await f.evaluate(()=>{for(let i=0;i<60;i++)HisarKurulusSession.frame(.05);});
 assert.equal(await f.evaluate(()=>HisarKurulusSession.drone().label),'Uçangöz');ok('construction uses the same shared Uçangöz controller and identity');
 await p.locator('#pause').click();const pauseBat=await f.evaluate(()=>{if(!HisarKurulusSession.diagnostics().paused)throw Error('Pause not applied');return HisarKurulusSession.drone().battery;});await f.evaluate(()=>{for(let i=0;i<100;i++)HisarKurulusSession.frame(.1);});assert.equal(await f.evaluate(()=>HisarKurulusSession.drone().battery),pauseBat);await p.locator('#resume').click();ok('pause freezes shared flight and battery');
 await f.evaluate(()=>{HisarKurulusSession.recall();for(let i=0;i<500&&HisarKurulusSession.active();i++)HisarKurulusSession.frame(.05);});assert.equal(await f.evaluate(()=>HisarKurulusSession.active()),false);await home();
 f=await open('range');catalogues.range=await f.evaluate(()=>HisarKurulusSession.catalogue());
 assert.ok(catalogues.range.filter(x=>x.id.startsWith('equipment:')).length>=10);assert.equal(catalogues.range.filter(x=>x.id.startsWith('target:')).length,6);assert.ok(catalogues.range.filter(x=>x.id.startsWith('mode:')).length>=16);ok('range equipment, six target cards and all original mode entries are retained');
 for(const v of catalogues.range.filter(x=>x.id.startsWith('equipment:')||x.id.startsWith('target:')))assert.equal(await f.evaluate(id=>HisarKurulusSession.activate(id).ok,v.id),true);ok('range equipment and target selections execute on the native range');
 await p.locator('#equipment-button').click();await shot(p,'range-catalogue.png');await p.locator('#equipment-close').click();
 const nc=await f.evaluate(()=>{const r=HisarKurulusSession.activate('native-menu');r.after?.();return r.ok;});assert.equal(nc,true);assert.equal(await f.locator('#menu').isVisible(),true);ok('full original range menus are available inside the same application');
 assert.equal(await p.evaluate(()=>HisarCampaign.diagnostics().chapter),0);ok('free area use cannot auto-complete story chapters');await home();
 // First story chapter: actual shared flight completion rather than a "mark complete" button.
 await p.locator('#continue').click();await p.waitForFunction(()=>HisarCampaign.diagnostics().ready,{},{timeout:180000});f=p.frames().find(f=>f!==p.mainFrame()&&f.url().includes('kurulus=1'));
 assert.equal(await f.evaluate(()=>HisarKurulusSession.start()),true);await f.evaluate(()=>{for(let i=0;i<170;i++)HisarKurulusSession.frame(.05);HisarKurulusSession.recall();for(let i=0;i<500&&HisarKurulusSession.active();i++)HisarKurulusSession.frame(.05);});await p.waitForFunction(()=>HisarCampaign.diagnostics().chapter===1);ok('guided first chapter advances only after flight and physical return');
 await p.locator('#next').click();assert.ok((await p.evaluate(()=>Object.keys(HisarCampaign.diagnostics().state.fleet).length))>=11);ok('shared fleet records retain vehicles and range equipment across scene changes');
 await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>HisarCampaign.diagnostics().lockReady);assert.equal(await p.evaluate(()=>HisarCampaign.diagnostics().chapter),1);ok('chapter progress survives reload');
 for(const size of [{width:844,height:390},{width:667,height:375},{width:390,height:844}]){await p.setViewportSize(size);const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert.equal(overflow,false);ok('home fits '+size.width+'×'+size.height);}
 await shot(p,'mobile-home.png');
 assert.deepEqual(errors,[]);ok('no uncaught exceptions in the three original game integrations');
 fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({checks:results,errors,catalogues,limits:'Chromium software WebGL. State injection used for flight time, return and camera selection. Not physical iPhone/Safari or FPS validation.'},null,2));
 await require('./kurulus-story.cjs')({p,base,ok,shot});assert.deepEqual(errors,[]);await context.close();
})().catch(e=>{errors.push(String(e.stack||e));console.error(e);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({checks:results,errors,catalogues,limits:'Chromium software WebGL; some timing and vehicle selections injected; not physical-device performance.'},null,2));if(browser)await browser.close();await new Promise(r=>server.close(r));});
