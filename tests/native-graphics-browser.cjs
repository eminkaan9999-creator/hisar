'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve('public'),out=path.resolve('reports/native-graphics');fs.mkdirSync(out,{recursive:true});const checks=[],errors=[],missing=[];let server,browser;
const mime={'.html':'text/html;charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'};
const ok=s=>{checks.push(s);console.log('PASS',s);};
(async()=>{
 server=http.createServer((req,res)=>{const u=new URL(req.url,'http://local');let p=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(p!==root&&!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'}).end(fs.readFileSync(p));}catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});
 const ctx=await browser.newContext({viewport:{width:1280,height:720},hasTouch:true,deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('hs-set',JSON.stringify({gfx:'high',sens:1,joy:124,vol:.7}));localStorage.setItem('poligon-ayar-v1',JSON.stringify({d3:1,gq:'yuksek',voice:0}));});
 const p=await ctx.newPage();p.setDefaultTimeout(90000);p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error'&&/Shader Error|VALIDATE_STATUS|WebGLProgram/.test(m.text()))errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)missing.push({url:r.url(),status:r.status()});});
 await p.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});await p.locator('#enter').click();await p.waitForFunction(()=>!KomutaHost.diagnostics().loading,{},{timeout:120000});let f=p.frames().find(f=>f.url().includes('/site/'));
 assert.equal(await f.evaluate(()=>__hs.qual.g),'high');ok('native high preset active; screenshot is not forced-low regression output');
 assert.equal(await f.locator('#bChar').isVisible(),false);ok('person selection button really hidden in rendered game');
 const faces=await f.evaluate(()=>{let n=0;__hs.scene.traverse(o=>{if(o.name==='READABLE_SIGN_FACE'){if(o.material.side!==THREE.FrontSide)throw Error('mirrored sign material');n++;}});return n;});assert.equal(faces,4);ok('two station signs have four independently readable faces');
 await p.waitForTimeout(1200);await p.screenshot({path:out+'/native-high-base.png'});
 await f.evaluate(()=>{__hs.foot.x=-88;__hs.foot.z=-77;__hs.foot.on=true;__hs.foot.seq=null;__hs.frame(3,.05);});await p.waitForTimeout(500);await f.locator('#km-interact').click();await p.waitForFunction(()=>KomutaHost.diagnostics().scene==='range'&&!KomutaHost.diagnostics().loading,{},{timeout:120000});
 f=p.frames().find(f=>f.url().includes('/poligon/'));await f.locator('[data-equipment]').first().click();await p.waitForTimeout(1500);
 await p.screenshot({path:out+'/native-3d-range.png'});
 assert.equal(await f.evaluate(()=>KomutaScene.diagnostics().threeD),true);assert.equal(await f.locator('#view3d').isVisible(),true);ok('original 3D range renderer and canvas visible after selecting equipment');
 const n=await f.evaluate(()=>KomutaScene.diagnostics().shots);await f.locator('#btnFire').click();await p.waitForTimeout(500);assert.ok(await f.evaluate(x=>KomutaScene.diagnostics().shots>x,n));ok('original shot action still works with 3D enabled');
 for(const size of [{width:844,height:390},{width:740,height:360}]){await p.setViewportSize(size);await p.waitForTimeout(400);const box=await f.locator('#btnFire').boundingBox();assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=size.width+1&&box.y+box.height<=size.height+1);await p.screenshot({path:out+'/native-range-'+size.width+'.png'});ok('3D range control fits landscape '+size.width+'x'+size.height);}
 assert.equal(await p.locator('iframe').count(),1);ok('only one gameplay scene loaded');
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);ok('no JavaScript, shader compile or missing-resource errors');
 fs.writeFileSync(out+'/metrics.json',JSON.stringify(await p.evaluate(()=>KomutaHost.diagnostics().metrics),null,2));await ctx.close();
})().catch(e=>{errors.push(String(e.stack||e));console.error(e);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(out+'/result.json',JSON.stringify({checks,errors,missing,note:'Real game on Chromium software WebGL. High site preset; native 3D range. Endpoint location injected to isolate rendering; not a physical iPhone performance measurement.'},null,2));if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));});
