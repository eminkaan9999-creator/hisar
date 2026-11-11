'use strict';
// End-to-end chapter predicates. Tests inject original actor position/time, not completion flags.
module.exports=async function({p,base,ok,shot}){
 const assert=require('node:assert/strict');await p.setViewportSize({width:960,height:540});
 async function chapter(n){assert.equal(await p.evaluate(()=>HisarCampaign.diagnostics().chapter),n);await p.locator('#continue').click();await p.waitForFunction(()=>HisarCampaign.diagnostics().ready,{},{timeout:180000});return p.frames().find(f=>f!==p.mainFrame()&&f.url().includes('kurulus=1'));}
 async function finished(n){await p.waitForFunction(n=>HisarCampaign.diagnostics().chapter===n+1,n,{timeout:30000});ok('story chapter '+(n+1)+' advances through its real completion predicate');await p.locator('#next').click();}
 let f=await chapter(1);const baseline=await f.evaluate(()=>__hs.stats.road);
 await f.evaluate(()=>__hs.ev(`{const v=vehicles[cur];v.eng=true;v.fuel=80;v.t.blade=.3;for(let i=0;i<55&&!HisarSiteCampaign.metrics().done;i++){v.x=ROAD.x+2+i*.5;v.z=ROAD.y+ROAD.h/2;v.v=1.2;pose(v,.05);work(v,.05,{rx:0,ry:0,L:{x:0,y:0}});HisarKurulusSession.frame(.05);}}`));
 assert.ok((await f.evaluate(()=>__hs.stats.road))>=baseline+6);await finished(1);
 f=await chapter(2);for(let i=0;i<5;i++)await f.locator('#btnFire').click();assert.ok((await f.evaluate(()=>HisarKurulusSession.diagnostics().shots))>=5);await finished(2);
 async function tank(n){
  const f=await chapter(n);
  for(let phase=0;phase<8;phase++){
   const d=await f.evaluate(()=>HisarOperations.diagnostics());if(d.mission.finished)break;const g=d.mission.goal,point=d.mission.points[g.at];
   if(g.type==='escort'){
    await f.evaluate(()=>HisarOperations.issue('İKMAL 1',1));
    await f.evaluate(()=>{const step=HisarOperations.diagnostics().mission.step;for(let i=0;i<1800&&game==='play'&&HisarOperations.diagnostics().mission.step===step;i++){const c=HisarOperations.diagnostics().convoy;P.x=c.x+2;P.z=c.z;update(.1);HisarKurulusSession.frame(.1);}});
   }else{
    await f.evaluate(({point,type})=>{mode=type==='scan'?'drone':'tank';P.x=point.x;P.z=point.z;if(type==='scan'){DR.on=true;DR.rt=0;DR.fall=0;DR.sp=1;DR.sig=1;DR.x=point.x;DR.z=point.z;DR.y=hAt(point.x,point.z)+15;}else DR.on=false;for(const a of AL){a.x=point.x+5;a.z=point.z;a.cmd='hold';a.hold={x:a.x,z:a.z};}}, {point,type:g.type});
    if(g.type==='interact')await f.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyX',bubbles:true})));
    await f.evaluate(({type,seconds})=>{const step=HisarOperations.diagnostics().mission.step;for(let i=0;i<Math.ceil(seconds*10)+900&&game==='play'&&HisarOperations.diagnostics().mission.step===step;i++){if(type==='defend'){if(E.length>1)throw Error('Story overlaps threats');for(const e of E)S.remove(e.g);E=[];}update(.1);HisarKurulusSession.frame(.1);}}, {type:g.type,seconds:g.seconds||1});
    if(g.type==='interact')await f.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyX',bubbles:true})));
   }
   const after=await f.evaluate(()=>HisarOperations.diagnostics());assert.ok(after.mission.finished||after.mission.step>d.mission.step,'chapter '+n+' goal '+g.type);
  }
  await finished(n);
 }
 await tank(3);
 f=await chapter(4);assert.equal(await f.evaluate(()=>HisarKurulusSession.start()),true);
 await f.evaluate(()=>{const d=HisarSiteCampaign.metrics().dest;for(let i=0;i<2000;i++){const p=HisarKurulusSession.drone().flight.pos,dx=d.x-p.x,dz=d.z-p.z;for(const code of ['KeyD','KeyA','KeyW','KeyS'])window.dispatchEvent(new KeyboardEvent('keyup',{code}));if(Math.abs(dx)>1)window.dispatchEvent(new KeyboardEvent('keydown',{code:dx>0?'KeyD':'KeyA'}));if(Math.abs(dz)>1)window.dispatchEvent(new KeyboardEvent('keydown',{code:dz>0?'KeyW':'KeyS'}));HisarKurulusSession.frame(.05);if(HisarSiteCampaign.metrics().scan>=2)break;}HisarKurulusSession.release();HisarKurulusSession.recall();for(let i=0;i<2000&&HisarKurulusSession.active();i++)HisarKurulusSession.frame(.05);});
 assert.ok((await f.evaluate(()=>HisarSiteCampaign.metrics().scan))>=2);
 await f.evaluate(()=>__hs.ev(`{const d=HisarSiteCampaign.metrics().dest,v=vehicles[cur];v.x=d.x;v.z=d.z;v.v=0;pose(v,0);HisarKurulusSession.frame(.1);}`));await finished(4);
 await tank(5);await tank(6);f=await chapter(7);
 await f.evaluate(()=>__hs.ev(`{const v=vehicles[cur],d=HisarSiteCampaign.metrics().dest;for(let i=20;i>=0;i--){v.x=d.x;v.z=d.z+i;v.v=i?1:0;pose(v,0);HisarKurulusSession.frame(.1);}}`));await finished(7);
 assert.equal(await p.evaluate(()=>HisarCampaign.diagnostics().state.completed.length),8);ok('all eight chapters completed sequentially with no direct complete-button bypass');await shot(p,'campaign-completed.png');
};
