'use strict';
// Runtime regression for the shipped menu wrapper. The renderer and DOM are
// minimal stubs: this verifies transition logic, not WebGL or device FPS.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=require('./test-support/harekat-runtime.cjs').production('experience/menu.js');
function runtime({at=1000,state='pause',tdz=false}={}){
 let now=at,draws=0,legacyCameras=0,fixedCameras=0;
 const menu={style:{display:state==='play'?'none':'flex'}};
 const ctx={game:state,performance:{now:()=>now},document:{head:null,
  getElementById:id=>id==='menu'?menu:null,addEventListener(){}},
  R:{render(){draws++;}},P:{x:0,z:0},hAt:()=>0,
  CAM:{position:{set(){fixedCameras++;}},lookAt(){}},
  camUpdate(){legacyCameras++;}};
 ctx.window=ctx;vm.createContext(ctx);
 if(tdz)try{vm.runInContext('throw Error("renderer boot failed"); const R=null;',ctx);}catch{}
 vm.runInContext(source,ctx);
 return {ctx,at:t=>now=t,menu,get draws(){return draws;},
  get legacyCameras(){return legacyCameras;},get fixedCameras(){return fixedCameras;}};
}
test('resuming immediately restores every gameplay render, without a 250 ms throttle tail',()=>{
 const r=runtime();r.ctx.R.render({},{});assert.equal(r.draws,1);
 r.at(1010);r.ctx.game='play';r.menu.style.display='none';
 r.ctx.R.render({},{});r.at(1026);r.ctx.R.render({},{});
 assert.equal(r.draws,3,'both resumed frames must reach the renderer');
});
test('resuming immediately releases the fixed menu camera',()=>{
 const r=runtime();r.ctx.camUpdate();assert.equal(r.fixedCameras,1);
 r.at(1010);r.ctx.game='play';r.menu.style.display='none';r.ctx.camUpdate();
 assert.equal(r.fixedCameras,1,'the menu camera must not overwrite the gameplay camera');
 assert.equal(r.legacyCameras,2,'the original camera runs in both states');
});
test('opening a menu immediately applies its fixed camera and renderer limit',()=>{
 const r=runtime({state:'play'});r.ctx.R.render({},{});r.ctx.camUpdate();
 r.at(1010);r.ctx.game='pause';r.menu.style.display='flex';
 r.ctx.R.render({},{});r.ctx.camUpdate();
 assert.equal(r.draws,1,'a menu render inside the 15 FPS interval is skipped');
 assert.equal(r.fixedCameras,1,'the menu camera applies on the first paused frame');
 r.at(1070);r.ctx.R.render({},{});assert.equal(r.draws,2);
});
test('menu camera is recognized during the first 250 ms after boot',()=>{
 const r=runtime({at:10});r.ctx.camUpdate();
 assert.equal(r.fixedCameras,1);
 assert.equal(r.ctx.HisarMenu.diagnostics().menu,true);
});
test('renderer initialization failure leaves menu diagnostics available',()=>{
 assert.doesNotThrow(()=>{const r=runtime({tdz:true});
  assert.equal(r.ctx.HisarMenu.diagnostics().hooks.render,undefined);
 });
});
test('static headquarters skips menu GPU draws and immediately returns gameplay rendering',()=>{
 const r=runtime();r.ctx.HisarCommandMenu={staticBackground:true};r.ctx.R.render({},{});assert.equal(r.draws,0);
 r.ctx.game='play';r.menu.style.display='none';r.ctx.R.render({},{});assert.equal(r.draws,1);
});
test('initial menu shown by CSS also skips hidden scene rendering',()=>{
 const r=runtime({state:'menu'});r.menu.style.display='';r.ctx.HisarCommandMenu={staticBackground:true};
 r.ctx.R.render({},{});assert.equal(r.draws,0);assert.equal(r.ctx.HisarMenu.diagnostics().menu,true);
});
test('static headquarters limits scene work and immediately restores the gameplay clock',()=>{
 const html=fs.readFileSync(__dirname+'/../index.html','utf8');
 const block=html.slice(html.indexOf('let idleMenu=false'),html.indexOf('// grafik bellegi kaybi'));
 let callbacks=0,hookCalls=0;const updates=[];
 const menu={style:{display:'flex'}},dmg={style:{}};
 const ctx={game:'menu',last:0,fpsA:0,fpsN:0,shake:0,dmgA:0,HisarCommandMenu:{staticBackground:true},
  $:name=>name==='menu'?menu:dmg,requestAnimationFrame(){callbacks++;},update(dt){updates.push(dt);},
  hud(){},skyUp(){},camUpdate(){},R:{render(){}},S:{},CAM:{},FRAME_HOOKS:[()=>hookCalls++],err(tag,e){throw e;}};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(block,ctx);
 for(let i=0;i<60;i++)ctx.loop(i*1000/60);
 assert.equal(callbacks,60);assert.equal(hookCalls,20);assert.equal(ctx.fpsN,0);
 ctx.game='play';menu.style.display='none';ctx.loop(1000);
 assert.equal(hookCalls,21);assert.equal(updates.length,1);assert.ok(Math.abs(updates[0]-1/60)<1e-6);
 ctx.loop(1016);assert.equal(updates.length,2);
 ctx.game='pause';menu.style.display='flex';ctx.loop(1032);ctx.loop(1048);assert.equal(hookCalls,23);
});
