'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {createServer}=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.webp':'image/webp','.woff2':'font/woff2','.png':'image/png'};
const server=createServer(async(req,res)=>{const u=new URL(req.url,'http://local');let name=decodeURIComponent(u.pathname).slice(1);if(!name||name.endsWith('/'))name+='index.html';const target=path.resolve(root,name);if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{const d=await fs.readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(name)]||'application/octet-stream'}).end(d);}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});
try{
 const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),p=await c.newPage(),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.error('Browser error:',e.message);});p.setDefaultTimeout(25000);
 const click=async name=>p.getByRole('button',{name,exact:true}).click();
 const shot=async n=>{if(process.env.ART_DIR){await fs.mkdir(process.env.ART_DIR,{recursive:true});await p.screenshot({path:path.join(process.env.ART_DIR,n+'.png')});}};
 const assertFit=async()=>assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await p.goto(base+'/?arsiv=1');await p.getByRole('heading',{name:'Beyaz Geçit'}).waitFor();await assertFit();await shot('boru-menu');
 await p.locator('.primary[data-nav="brief"]').click();await p.getByRole('button',{name:/Görevi teslim al/}).click();await p.locator('[data-check=crewChecked]').click();await p.locator('[data-check=loadChecked]').click();await click('Yükleri teslim al');
 await p.getByRole('button',{name:'Çamlıova',exact:true}).click();
 await p.getByRole('button',{name:'Duraklat',exact:true}).click();await p.reload();await p.getByRole('button',{name:/Göreve devam et/}).click();
 assert.match(await p.locator('.objective').innerText(),/Çamlıova/);
 await p.setViewportSize({width:844,height:390});await assertFit();await p.locator('.terrain[data-ready="3d"]').waitFor();await shot('boru-surus');
 await p.locator('.map-toggle').tap();await p.getByRole('dialog').waitFor();await p.keyboard.press('Escape');
 assert.equal(await p.locator('.map-dialog').isVisible(),false);assert.ok(await p.locator('.terrain').isVisible());
 for(const label of ['Teslim fişini al','Teslim fişini al','Seferi kapat']){
   // Drive through normal keyboard input; the vehicle's position and game clock remain entirely in game control.
   if(await p.locator('[data-route="ridge"]').isVisible()){
     await p.locator('[data-route="ridge"]').click();await p.reload();await p.getByRole('button',{name:/Göreve devam et/}).click();
     await p.locator('.road-progress').filter({hasText:'Sırt yolu'}).waitFor();
   }
   const action=p.locator('.deliver');await action.waitFor();assert.equal(await action.innerText(),label);
   await p.keyboard.down('ArrowUp');
   try{await p.waitForFunction(()=>!document.querySelector('.deliver').disabled,null,{timeout:105000});}finally{await p.keyboard.up('ArrowUp');}
   if(label==='Teslim fişini al'){const first=(await p.locator('.objective').innerText()).includes('Çamlıova');if(first){await p.locator('.cargo').selectOption('1');await action.click();assert.match(await p.locator('.feedback').innerText(),/Battaniye/);}await p.locator('.cargo').selectOption(first?'2':'1');}
   await action.click();
 }
 await p.getByRole('heading',{name:'Sefer sonu raporu'}).waitFor();await click('Kayıtlar').catch(()=>p.locator('header [data-nav=history]').click());
 console.log('PASS driving: briefing, chosen first stop, save/reload, three driven legs and after-action report');
 await p.goto(base+'/?arsiv=1');
 await p.locator('header [data-nav=settings]').click();
 await p.locator('[data-sound]').click();
 assert.equal(await p.locator('[data-sound]').getAttribute('aria-pressed'),'true');
 await p.reload(); await p.locator('header [data-nav=settings]').click();
 assert.equal(await p.locator('[data-sound]').getAttribute('aria-pressed'),'true');
 await p.setViewportSize({width:844,height:390});
 for(const mission of ['rain','night']) {
   await p.locator('header [data-nav=missions]').click();
   await p.locator('[data-mission="'+mission+'"]').click();
   await p.getByRole('button',{name:/Görevi teslim al/}).click();
   await p.locator('[data-check=crewChecked]').click();
   await p.locator('[data-check=loadChecked]').click();
   await click('Yükleri teslim al');
   await p.locator('.terrain[data-ready="3d"]').waitFor();
   await p.locator('[data-camera]').click();
   await p.reload(); await p.getByRole('button',{name:/Göreve devam et/}).click();
   assert.equal(await p.locator('[data-camera]').innerText(),mission==='rain'?'Kabin':'Takip');
   await p.locator('.terrain[data-ready="3d"]').waitFor();
   await assertFit(); await shot('boru-'+mission);
   for(const target of [1,2,0]) {
     if(target===2) await p.locator('[data-route=creek]').click();
     const action=p.locator('.deliver');
     await p.keyboard.down('ArrowUp');
     try { await p.waitForFunction(()=>!document.querySelector('.deliver').disabled,null,{timeout:105000}); }
     finally { await p.keyboard.up('ArrowUp'); }
     if(target) await p.locator('.cargo').selectOption(String(target));
     await action.click();
   }
   await p.getByRole('heading',{name:'Sefer sonu raporu'}).waitFor();
   assert.ok(await p.locator('.evaluation').isVisible());
   await p.locator('header [data-nav=missions]').click();
   assert.match(await p.locator('[data-mission="'+mission+'"]').innerText(),/Kayıtlardaki en iyi/);
 }
 console.log('PASS new driving missions: rain and night completed, cargo reports, sound preference and both camera views');
 await p.goto(base+'/?arsiv=1');
 await p.setViewportSize({width:320,height:568});await assertFit();await p.locator('header [data-theme]').click();assert.equal(await p.locator('html').getAttribute('data-hisar-theme'),'light');
 for(const route of ['/']){await p.goto(base+route+'?arsiv=1');await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);}
 await c.setOffline(true);for(const [route,title] of [['/','Gece Sevki']]){await p.goto(base+route+'?arsiv=1');await p.getByRole('heading',{name:title}).waitFor();await assertFit();await p.locator('header [data-nav=history]').click();await p.locator('[data-record="0"]').click();assert.ok(await p.locator('.stats').isVisible());}
 assert.deepEqual(errors,[]);console.log('PASS offline: vehicle launch URL, saved reports, shared theme and 320px layout');
}finally{await b.close();server.closeAllConnections();server.close();}
})().catch(e=>{console.error(e);server.closeAllConnections();server.close();process.exitCode=1;});
