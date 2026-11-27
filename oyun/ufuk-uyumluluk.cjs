const {chromium}=require('playwright');
const fs=require('node:fs/promises'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),server=http.createServer(async(req,res)=>{let file=new URL(req.url,'http://x').pathname;if(file.endsWith('/'))file+='index.html';try{const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json'})[ext]||'application/octet-stream');res.end(await fs.readFile(path.join(root,file)));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});try{
 const page=await browser.newPage({viewport:{width:320,height:568},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:'+server.address().port;
 const fit=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.goto(base+'/komuta/');await page.waitForURL('**/santiye-250888c5/');await page.getByRole('heading',{name:'Bir sonraki adımını seç'}).waitFor();await fit();
 await page.goto(base+'/');await page.locator('nav [data-nav=settings]').click();await page.locator('[data-quality]').selectOption('performance');
 await page.locator('nav [data-nav=missions]').click();await page.locator('button[data-era=present]').click();await page.locator('[data-mission=anadolu]').click();await page.locator('.primary[data-nav=play]').click();await page.locator('.arena[data-ready="3d"]').waitFor();
 await page.waitForFunction(()=>document.querySelector('.arena').dataset.resolution==='0.85');
 await page.evaluate(()=>{const c=document.querySelector('.arena');c.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();});
 // Three may have created WebGL 1 on a platform without WebGL 2.
 if(await page.locator('.arena[data-ready="3d"]').count())await page.evaluate(()=>document.querySelector('.arena').getContext('webgl')?.getExtension('WEBGL_lose_context')?.loseContext());
 await page.locator('.arena[data-ready=map]').waitFor();
 await page.keyboard.down('ArrowUp');await page.waitForTimeout(400);await page.keyboard.up('ArrowUp');await page.getByRole('button',{name:'Duraklat',exact:true}).click();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hisar-future-3:boru')).run);assert.ok(saved.z>-46);
 await page.reload();await page.locator('.primary[data-nav=play]').click();await page.locator('.arena[data-ready="3d"]').waitFor();
 assert.equal(await page.locator('.arena').getAttribute('data-era'),'present');
 await page.setViewportSize({width:320,height:568});await fit();
 if(process.env.ART_DIR){await fs.mkdir(process.env.ART_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.ART_DIR,'mobile-present.png'),fullPage:true});}
 assert.deepEqual(errors,[]);console.log('PASS retired route redirect, 320px era navigation, quality persistence, WebGL loss continuation and reload');
}finally{await browser.close();server.closeAllConnections();server.close();}})().catch(e=>{console.error(e);server.closeAllConnections();server.close();process.exitCode=1;});
