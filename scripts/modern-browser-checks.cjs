'use strict';
// Real UI / renderer checks plus explicitly controlled convoy route checks.
// These are not four human playthroughs and are not physical-device FPS results.
const assert=require('node:assert/strict'),path=require('node:path');
module.exports=async function modernChecks(p,{mobile,label,out,ok}){
 await p.waitForFunction(()=>window.HisarSafak?.diagnostics().registered&&window.HisarModern?.diagnostics().graphics);
 assert.equal(await p.locator('#sf-campaign').isVisible(),true);
 assert.deepEqual(await p.locator('#hkCard [data-op]').evaluateAll(es=>es.map(e=>e.dataset.op)),['safak-1','safak-2','safak-3','safak-4']);
 assert.equal(await p.evaluate(()=>R.toneMapping===THREE.ACESFilmicToneMapping&&R.outputEncoding===THREE.sRGBEncoding),true);ok(label+': new campaign is primary and the actual 3D renderer uses colour-managed filmic output');
 await p.locator('#sf-archive').click();assert.equal(await p.locator('[data-op="gecit"]').isVisible(),true);await p.locator('#sf-archive').click();assert.equal(await p.locator('[data-op="safak-1"]').isVisible(),true);ok(label+': original operations remain playable from the campaign archive');
 await p.locator('#go').click();assert.equal(await p.locator('#hk-brief').isVisible(),true);assert.equal(await p.evaluate(()=>game==='play'),false);await p.screenshot({path:path.join(out,'modern-brief-'+label+'.png')});await p.locator('.hk-back').click();assert.equal(await p.locator('#hk-brief').isVisible(),false);ok(label+': briefing explains the new story and can close without launching');
 if(mobile){await p.setViewportSize({width:390,height:844});await p.screenshot({path:path.join(out,'modern-campaign-mobile.png')});await p.locator('#go').click();await p.locator('.hk-go').click();await p.waitForFunction(()=>game==='play');await p.locator('#sf-hud').waitFor({state:'visible'});
  for(const [w,h]of [[390,844],[844,390]]){await p.setViewportSize({width:w,height:h});const b=await p.locator('#sf-hud').boundingBox();assert.ok(b&&b.x>=0&&b.y>=0&&b.x+b.width<=w+1&&b.y+b.height<=h+1,'vehicle HUD fits '+w+'x'+h+': '+JSON.stringify(b));
   for(const id of ['uFire','uPad'])if(await p.locator('#'+id).isVisible()){const c=await p.locator('#'+id).boundingBox();assert.ok(b.x+b.width<=c.x||c.x+c.width<=b.x||b.y+b.height<=c.y||c.y+c.height<=b.y,'HUD leaves '+id+' reachable');}
   await p.screenshot({path:path.join(out,'modern-gameplay-mobile-'+w+'x'+h+'.png')});}
  if(await p.locator('#uMenu').isVisible())await p.locator('#uMenu').click();else await p.keyboard.press('p');assert.equal(await p.evaluate(()=>game),'pause');ok('new vehicle HUD fits portrait/landscape phones and leaves driving/fire controls clear');return;}
 await p.locator('#go').click();await p.locator('.hk-go').click();await p.waitForFunction(()=>game==='play'&&HisarHarekat.diagnostics().op==='safak-1');
 assert.equal(await p.evaluate(()=>P.mx),165);await p.locator('#sf-hud').waitFor({state:'visible'});assert.equal(await p.locator('#sf-hud').isVisible(),true);ok('new first chapter starts with preparation and the live vehicle HUD');
 // Ordinary keyboard driving, without moving P directly or advancing time.
 await p.bringToFront();const drivingStart=await p.evaluate(()=>({x:P.x,z:P.z,t:HisarHarekat.diagnostics().t}));
 await p.keyboard.down('w');try{await p.waitForFunction(()=>HisarHarekat.diagnostics().ph>=1,{},{timeout:120000});}
 catch(error){const diagnostic=await p.evaluate(()=>({game,mode,iv,mapOpen:window.mapOpen,keys:{...keys},player:{x:P.x,z:P.z,h:P.h,v:P.v,hp:P.hp},mission:HisarHarekat.diagnostics(),errors:window.HERR?HERR.LOG:[]}));await p.screenshot({path:path.join(out,'modern-driving-failure.png')});throw new Error('Ordinary opening drive failed: '+JSON.stringify({drivingStart,...diagnostic}),{cause:error});}
 finally{await p.keyboard.up('w');}
 assert.equal(await p.evaluate(()=>HisarHarekat.diagnostics().wave),-1);assert.ok(await p.evaluate(()=>P.hp>0));await p.evaluate(()=>setQ('orta'));await p.screenshot({path:path.join(out,'modern-gameplay-desktop.png')});await p.evaluate(()=>setQ('dusuk'));ok('ordinary forward driving reaches the first position alive before the first wave');
 await p.keyboard.press('p');assert.equal(await p.evaluate(()=>game),'pause');await p.locator('[data-op="safak-2"]').click();await p.locator('#cm-return').click();assert.equal(await p.evaluate(()=>HisarHarekat.diagnostics().op),'safak-1');ok('selecting another chapter in pause does not replace the current battle on resume');
 await p.evaluate(()=>HisarHarekat.start('safak-2'));await p.waitForFunction(()=>HisarHarekat.diagnostics().convoy?.modelReady,{},{timeout:60000});
 assert.equal(await p.evaluate(()=>!!S.getObjectByName('SF_IKMAL_KAMYONU')),true);ok('escort uses the supplied textured 3D truck in the live scene');
 // Controlled route feasibility: remove enemies / move the escort tank directly.
 // The truck itself moves continuously with the real map collision predicate.
 async function route(id){await p.evaluate(id=>HisarHarekat.start(id),id);await p.waitForFunction(()=>HisarHarekat.diagnostics().convoy?.modelReady);
  const result=await p.evaluate(()=>{
   const h=HisarHarekat;let steps=0,scans=0;for(;steps<100&&!h.diagnostics().convoy.active;steps++){
    for(const e of [...E])killE(e);const d=h.diagnostics(),ph=d.phase;P.v=0;
    if(ph.k==='reach'||ph.k==='clear'){P.x=ph.x;P.z=ph.z;}
    if(ph.k==='scan'){
     let found=false;for(const r of [50,90,140,200])for(let k=0;k<12&&!found;k++){const a=k*Math.PI/6,x=ph.x+Math.sin(a)*r,z=ph.z+Math.cos(a)*r;if(r>=ph.r||hAt(x,z)<0)continue;if(los(x,hAt(x,z)+2.8,z,ph.x,hAt(ph.x,ph.z)+3,ph.z)){P.x=x;P.z=z;found=true;}}
     if(!found)return {error:'no scan line',d};scans++;}
    h.step(.1);
   }
   let moved=0,last=h.diagnostics().convoy;for(let i=0;i<3000&&!last.delivered&&!h.diagnostics().lost;i++){
    for(const e of [...E])killE(e);P.x=last.x+25;P.z=last.z;P.v=0;h.step(.1);const next=h.diagnostics().convoy;moved+=Math.hypot(next.x-last.x,next.z-last.z);last=next;
   }
   return {state:h.diagnostics(),moved,scans,colliders:COV.filter(c=>c.sfConvoy).length,sceneModels:S.children.filter(g=>g.name==='SF_IKMAL_KAMYONU').length};
  });assert.ok(!result.error,JSON.stringify(result));assert.equal(result.state.convoy.delivered,true,JSON.stringify(result));assert.ok(result.moved>100,JSON.stringify(result));assert.equal(result.colliders,2);assert.equal(result.sceneModels,1);return result;
 }
 await route('safak-2');ok('controlled chapter two route reaches the station using real terrain/building collision checks');
 await route('safak-4');ok('controlled final convoy route crosses the real ford and returns to the safe post');
 await p.evaluate(()=>{window.__sfWx=wx;window.__sfNV=NVG.on;HisarHarekat.start('safak-3');});assert.equal(await p.evaluate(()=>wx),'gece');await p.evaluate(()=>HisarHarekat.start('safak-1'));assert.equal(await p.evaluate(()=>wx),await p.evaluate(()=>window.__sfWx));assert.equal(await p.evaluate(()=>NVG.on),await p.evaluate(()=>window.__sfNV));assert.equal(await p.evaluate(()=>COV.filter(c=>c.sfConvoy).length),0);ok('night raid restores previous weather/NVG and resets leave no convoy colliders');
 const map=await p.evaluate(()=>({tone:R.toneMapping,encoding:R.outputEncoding,shadow:sun.shadow.mapSize.x,look:HisarModern.diagnostics(),errors:window.HERR?HERR.LOG:[]}));assert.equal(map.errors.length,0,JSON.stringify(map.errors));ok('modern graphics, new objectives and convoy lifecycle produce no engine error log');
 await p.keyboard.press('p');await p.screenshot({path:path.join(out,'modern-campaign-desktop.png')});
};
