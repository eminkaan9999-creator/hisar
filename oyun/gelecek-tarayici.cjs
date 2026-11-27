'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {createServer}=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.webp':'image/webp','.woff2':'font/woff2','.png':'image/png'};
const server=createServer(async(req,res)=>{const u=new URL(req.url,'http://local');let name=decodeURIComponent(u.pathname).slice(1);if(!name||name.endsWith('/'))name+='index.html';const target=path.resolve(root,name);if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{const d=await fs.readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(name)]||'application/octet-stream'}).end(d);}catch{res.writeHead(404).end();}});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({
    executablePath:process.env.PLAYWRIGHT_CHROME||undefined,
    args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']
  });
  try {
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>{errors.push(error.message);console.error(error.message);});
    page.setDefaultTimeout(25000);
    const fit=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    const shot=async name=>{
      if(!process.env.ART_DIR)return;
      await fs.mkdir(process.env.ART_DIR,{recursive:true});
      await page.screenshot({path:path.join(process.env.ART_DIR,name+'.png'),fullPage:true,animations:'disabled'});
    };
    for(const mission of ['neon','eclipse','anadolu','ufuk']) {
      await page.goto(base+'/');
      await page.locator('.future-hero').waitFor();await fit();
      await shot('boru-menu');
      await page.locator('button[data-era="'+(({anadolu:'present',ag:'present',ufuk:'near',birlesik:'near'})[mission]||'far')+'"]').click();
      await page.locator('[data-mission="'+mission+'"]').click();
      await page.locator('.primary[data-nav=play]').click();
      await page.setViewportSize({width:844,height:390});
      await page.locator('.arena[data-ready="3d"]').waitFor();
      await fit();await shot('boru-alan-'+mission);
      assert.ok(Number(await page.locator('.arena').getAttribute('data-draws'))<100);
      assert.equal(await page.locator('.arena').getAttribute('data-era'),({anadolu:'present',ufuk:'near'})[mission]||'far');
      await page.keyboard.down('ArrowUp');await page.keyboard.down('Space');
      await page.waitForFunction(()=>Number(document.querySelector('.kills').textContent.split('/')[0])>0);
      await page.keyboard.up('ArrowUp');await page.keyboard.up('Space');
      await page.getByRole('button',{name:'Duraklat',exact:true}).click();
      const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hisar-future-3:boru')).run);
      assert.ok(saved.kills>0);
      await page.reload();await page.locator('.primary[data-nav=play]').click();
      await page.locator('.arena[data-ready="3d"]').waitFor();
      assert.equal(Number((await page.locator('.kills').innerText()).split('/')[0]),saved.kills);
      await page.keyboard.down('ArrowUp');await page.keyboard.down('Space');
      for(let seconds=0;seconds<180;seconds++) {
        if(await page.locator('.result-banner').isVisible())break;
        const shield=Number((await page.locator('[data-meter=shield] b').innerText()).replace('%',''));
        if(shield<45&&await page.locator('[data-dome]').isEnabled())await page.keyboard.press('q');
        await page.waitForTimeout(1000);
      }
      await page.keyboard.up('ArrowUp');await page.keyboard.up('Space');
      await page.getByRole('heading',{name:'Görev tamamlandı',exact:true}).waitFor();
      assert.ok(await page.locator('.stars').isVisible());
      await shot('boru-sonuc');
    }
    console.log('PASS vehicle: all four missions, actual steering and firing, shield, saved continuation, completion and narrow layout');

    const plans={
      orbit:[[['strike',0],['guard',0]],[],[['strike',2],['guard',2]],[],[['strike',1],['guard',1],['repair',1]],[],[['strike',0],['guard',0],['repair',0],['repair',2]],[['repair',1]]],
      storm:[[['strike',0],['guard',0]],[],[['strike',1],['guard',1]],[],[['strike',2],['guard',2],['repair',2]],[['repair',1]],[['strike',0],['guard',0]],[['repair',0]],[['strike',1]],[['guard',2]]]
    };
    for(const mission of ['orbit','storm','ag','birlesik']) {
      await page.setViewportSize({width:390,height:844});
      await page.goto(base+'/komuta/');
      await page.locator('.future-hero').waitFor();await fit();await shot('komuta-menu');
      await page.locator('button[data-era="'+(({anadolu:'present',ag:'present',ufuk:'near',birlesik:'near'})[mission]||'far')+'"]').click();
      await page.locator('[data-mission="'+mission+'"]').click();
      await page.locator('.primary[data-nav=play]').click();
      await fit();await shot('komuta-harita-'+mission);
      await page.evaluate(()=>window.originalMap=document.querySelector('.holo-map canvas'));
      await page.locator('[data-layer=relief]').click();
      await page.waitForFunction(()=>document.querySelector('.holo-map canvas').dataset.layer==='relief');
      await page.locator('[data-layer=systems]').click();
      await page.waitForFunction(()=>document.querySelector('.holo-map canvas').dataset.layer==='systems');
      await page.locator('[data-layer=network]').click();
      await page.waitForFunction(()=>document.querySelector('.holo-map canvas').dataset.layer==='network');
      const builds=await page.locator('.holo-map canvas').getAttribute('data-background-builds');
      await page.locator('.node-pin[data-node="1"]').click();
      assert.ok(await page.evaluate(()=>window.originalMap===document.querySelector('.holo-map canvas')));
      assert.equal(await page.locator('.holo-map canvas').getAttribute('data-background-builds'),builds);
      for(const [turn,actions] of plans[({ag:'orbit',birlesik:'storm'})[mission]||mission].entries()) {
        for(const [action,node] of actions) {
          await page.locator('.node-pin[data-node="'+node+'"]').click();
          await page.locator('[data-fleet="'+action+'"]').click();
        }
        await page.locator('[data-wave]').click();
        if(turn===1) {
          await page.reload();await page.locator('.primary[data-nav=play]').click();
          assert.match(await page.locator('.command-summary').innerText(),/2\s*\//);
        }
      }
      await page.getByRole('heading',{name:'Görev tamamlandı',exact:true}).waitFor();
      await fit();await shot('komuta-sonuc');
    }
    console.log('PASS command: all four missions, cached canvas and map layers, fleet cooldowns, stored wave state and completed defense reports');
    await page.locator('nav [data-nav=settings]').click();
    await page.locator('[data-sound]').click();
    await page.locator('[data-quality]').selectOption('performance');
    await page.reload();await page.locator('nav [data-nav=settings]').click();
    assert.equal(await page.locator('[data-quality]').inputValue(),'performance');
    assert.equal(await page.locator('[data-sound]').getAttribute('aria-pressed'),'true');
    for(const route of ['/','/komuta/']) {
      await page.goto(base+route);
      await page.evaluate(()=>navigator.serviceWorker.ready);
      await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    }
    await context.setOffline(true);
    for(const route of ['/','/komuta/']) {
      await page.goto(base+route);await page.locator('.future-hero').waitFor();
      await page.setViewportSize({width:320,height:568});await fit();
      await page.locator('nav [data-nav=history]').click();
      await page.locator('[data-record="0"]').click();
      await page.locator('.result-banner').waitFor();await fit();
    }
    assert.deepEqual(errors,[]);
    console.log('PASS future offline: both launch URLs, stored reports, shared audio preference and 320px layout');
  } finally {
    await browser.close();server.closeAllConnections();server.close();
  }
})().catch(error=>{console.error(error);server.closeAllConnections();server.close();process.exitCode=1;});
