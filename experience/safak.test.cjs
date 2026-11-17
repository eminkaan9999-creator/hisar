'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const story=require('./safak.js'),legacy=require('./harekat.js'),{runtime,key,backup}=require('./test-support/harekat-runtime.cjs');
function setup(options={}){const r=runtime({...options,campaign:true}),models=[];r.c.HisarModern={spawnConvoy:c=>models.push(c),removeConvoy:c=>c.disposed=true,syncConvoy(){},convoyPassable:()=>true};r.models=models;return r;}
const movePhase=r=>{const p=r.snapshot().phase;r.to(p);r.run(.2);};
test('four connected chapters preserve the four legacy operations and have reachable, finite phase coordinates',()=>{
 assert.deepEqual(story.IDS,['safak-1','safak-2','safak-3','safak-4']);assert.deepEqual(legacy.OPS.map(o=>o.id),story.LEGACY);
 for(const o of story.OPS){assert.ok(o.story.length>100&&o.emir.length>80);assert.equal(o.phases.at(-1).k,'complete');for(const p of o.phases)assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.abs(p.x)<800&&Math.abs(p.z)<800);}
 assert.ok(story.OPS[1].escort&&story.OPS[3].escort);assert.equal(story.OPS[2].wx,'gece');
});
test('new campaign selection keeps existing XP-independent legacy achievements and unknown metadata',()=>{
 const saved={sel:'tepe',mode:'harekat',done:{tepe:1},stars:{tepe:3},tag:'keep'},r=setup({saved});
 assert.equal(r.snapshot().sel,'safak-1');const s=JSON.parse(r.data.get(key));assert.equal(s.stars.tepe,3);assert.equal(s.done.tepe,1);assert.equal(s.tag,'keep');assert.equal(r.c.HisarSafak.diagnostics().done['safak-1'],0);
});
test('defence waits for arrival at the position and the live final wave prevents early victory',()=>{
 const r=setup();r.start('safak-1');assert.equal(r.c.P.mx,165);r.run(90);assert.equal(r.snapshot().wave,-1);assert.equal(r.snapshot().won,false);
 movePhase(r);r.run(35);assert.equal(r.snapshot().wave,0);r.clear();r.run(25);r.clear();r.run(30);assert.equal(r.snapshot().wave,2);assert.equal(r.c.E.length,3);assert.equal(r.snapshot().won,false);r.clear();r.run(.1);assert.equal(r.snapshot().won,true);assert.equal(r.events.filter(e=>e.kind==='end').length,1);
});
test('the first twelve seconds provide preparation; the timer does not advance while paused',()=>{
 const r=setup();r.start('safak-2');r.run(3);assert.ok(r.c.E.every(e=>e.cd>=8));const t=r.snapshot().t;r.c.openMenu();r.run(30);assert.equal(r.snapshot().t,t);assert.ok(r.snapshot().preparation>8);
});
test('night scan needs actual line of sight, a stationary tank and uninterrupted observation',()=>{
 const r=setup();r.start('safak-3');movePhase(r);assert.equal(r.snapshot().ph,1);r.c.los=()=>false;r.to({x:430,z:300});r.run(6);assert.equal(r.snapshot().phaseT,0);
 r.c.los=()=>true;r.c.P.v=5;r.run(6);assert.equal(r.snapshot().ph,1);r.c.P.v=0;r.run(2);assert.ok(r.snapshot().phaseT>=2);r.to({x:0,z:0});r.run(.2);assert.equal(r.snapshot().phaseT,0);r.to({x:430,z:300});r.run(5.1);assert.equal(r.snapshot().ph,2);
});
test('early jammer destruction cannot skip observation or the return and extraction stage',()=>{
 const r=setup();r.start('safak-3');r.clear();r.run(1);assert.equal(r.snapshot().won,false);movePhase(r);r.clear();r.c.los=()=>true;r.to({x:430,z:300});r.run(5.3);assert.equal(r.snapshot().phase.k,'extract');assert.equal(r.snapshot().won,false);r.to({x:400,z:200});r.run(4.2);assert.equal(r.snapshot().won,true);assert.equal(r.c.wx,'gunduz');
});
test('escort cannot arrive remotely, teleport through a blocked route or move through its tank',()=>{
 const c={x:0,z:0,h:0,i:1,path:[[0,0],[0,100]],speed:6,follow:110};legacy.escortMove(c,{x:500,z:0},1,()=>true);assert.equal(c.z,0);legacy.escortMove(c,{x:20,z:0},1,()=>false);assert.equal(c.z,0);legacy.escortMove(c,{x:0,z:0},1,()=>true);assert.equal(c.z,0);
 legacy.escortMove(c,{x:20,z:0},.1,()=>true);assert.ok(c.z>0&&c.z<=.601);assert.equal(c.delivered,undefined);
});
test('a full controlled convoy route requires protection, travel and the final security hold',()=>{
 const r=setup();r.start('safak-2');const cv=r.models[0];movePhase(r);r.clear();r.to({x:-588,z:290});r.run(.3);assert.equal(r.snapshot().phase.k,'escort');
 r.c.engineStep=()=>{r.c.P.x=cv.x+25;r.c.P.z=cv.z;};for(let i=0;i<1200&&!cv.delivered;i++)r.run(.1);assert.equal(cv.delivered,true);assert.equal(r.snapshot().phase.k,'extract');assert.equal(r.snapshot().won,false);r.run(5.2);assert.equal(r.snapshot().won,true);
});
test('near threats halt the convoy and real ally projectile hits can fail the mission without crediting a win',()=>{
 const r=setup();r.start('safak-2');movePhase(r);r.clear();r.to({x:-588,z:290});r.run(.3);const cv=r.models[0];r.to({x:cv.x+25,z:cv.z});const enemy=r.c.addE('tank',cv.x+15,cv.z,{h:0});enemy.hk={role:'def',post:{x:enemy.x,z:enemy.z}};const z=cv.z;r.run(1);assert.equal(cv.z,z);
 const target=r.c.pickTgt(enemy,999);assert.equal(target.al,cv);r.c.hitAl(cv,100);r.run(.1);assert.equal(r.snapshot().lost,true);assert.equal(r.snapshot().won,false);assert.equal(r.c.HisarSafak.diagnostics().done['safak-2'],0);
});
test('counter-battery success also needs the escort returning to the safe post',()=>{
 const r=setup();r.start('safak-4');movePhase(r);r.c.los=()=>true;r.to({x:690,z:500});r.run(4.2);r.clear();r.run(.2);assert.equal(r.snapshot().phase.k,'escort');assert.equal(r.snapshot().won,false);const cv=r.models[0];r.c.engineStep=()=>{r.c.P.x=cv.x+25;r.c.P.z=cv.z;};r.run(120);assert.equal(r.snapshot().won,true);assert.ok(cv.z<40);
});
test('reset disposes the previous convoy and restores weather and the saved night-vision choice',()=>{
 const r=setup({nvg:1});r.start('safak-2');const old=r.models[0];r.start('safak-3');assert.equal(old.disposed,true);assert.equal(r.c.wx,'gece');r.start('safak-1');assert.equal(r.c.wx,'gunduz');assert.equal(r.c.NVG.on,1);assert.equal(r.snapshot().convoy,null);
});
test('campaign merge keeps maxima, best time and extra metadata when an older tab saves',()=>{
 const a={done:{'safak-1':1},stars:{'safak-1':3},best:{'safak-1':300},custom:'retain'},b={done:{'safak-1':0},stars:{'safak-1':1},best:{'safak-1':400}};const m=story.merge(a,b);assert.equal(m.done['safak-1'],1);assert.equal(m.stars['safak-1'],3);assert.equal(m.best['safak-1'],300);assert.equal(m.custom,'retain');assert.equal(story.normalise({stars:{'safak-1':99}}).stars['safak-1'],3);
});
test('campaign progress, old stars and independent applications survive the backup round trip',()=>{
 const data=new Map([['m60v2',JSON.stringify({xp:321,kr:200,U:{},best:{}})],[story.SAVE,JSON.stringify({selected:'safak-3',done:{'safak-1':1},stars:{'safak-1':3}})],[key,JSON.stringify({done:{tepe:1},stars:{tepe:3}})],['unrelated-app','keep']]);const a=backup(data),code=a.api.code(),b=backup(new Map([['unrelated-app','keep']]));assert.equal(b.api.restore(code).ok,true);assert.equal(JSON.parse(b.data.get(story.SAVE)).stars['safak-1'],3);assert.equal(JSON.parse(b.data.get(key)).stars.tepe,3);assert.equal(JSON.parse(b.data.get('m60v2')).xp,321);assert.equal(b.data.get('unrelated-app'),'keep');
});
test('restoring a slower campaign backup never replaces a faster local best time or higher stars',()=>{
 const source=backup(new Map([['m60v2',JSON.stringify({xp:20})],[story.SAVE,JSON.stringify({done:{'safak-1':1},stars:{'safak-1':1},best:{'safak-1':500}})]]));
 const target=backup(new Map([['m60v2',JSON.stringify({xp:100})],[story.SAVE,JSON.stringify({done:{'safak-1':1},stars:{'safak-1':3},best:{'safak-1':300}})]]));assert.equal(target.api.restore(source.api.code()).ok,true);const s=JSON.parse(target.data.get(story.SAVE));assert.equal(s.best['safak-1'],300);assert.equal(s.stars['safak-1'],3);assert.equal(JSON.parse(target.data.get('m60v2')).xp,100);
});
