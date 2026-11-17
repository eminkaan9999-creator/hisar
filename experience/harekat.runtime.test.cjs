'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {runtime,key}=require('./test-support/harekat-runtime.cjs');
const ops=require('./harekat.js').OPS;
function cross(r,id){const o=ops.find(o=>o.id===id);r.to(o.phases[0]);r.run(.2);}
function finishDepot(r){cross(r,'depo');r.run(.2);r.clear(e=>e.hk.role==='dep');r.run(.2);}
function defenceToLast(r){r.start('gecit');r.to(ops[0].phases[0]);r.run(55.1);r.clear();r.run(30.1);r.clear();r.run(30.1);}
test('four starts reset operation, phase, timer, opponents and navigation',()=>{
 const r=runtime();for(const o of ops){assert.equal(r.start(o.id),true);const d=r.snapshot();
  assert.equal(d.op,o.id);assert.equal(d.ph,0);assert.equal(d.won,false);assert.equal(d.t,0);
  assert.equal(r.c.P.x,o.start.x);assert.equal(r.c.P.z,o.start.z);assert.ok(d.nav);
  assert.equal(d.enemies.length,o.id==='gecit'?0:o.id==='batarya'?8:11);
 }assert.equal(r.c.wx,'gunduz');assert.equal(r.c.NVG.on,0);
});
test('defence cannot win in the frame that spawns its third live wave',()=>{
 const r=runtime();defenceToLast(r);const d=r.snapshot();
 assert.equal(d.wave,2);assert.equal(d.enemies.filter(e=>e.role==='att').length,4);
 assert.equal(d.won,false);assert.equal(r.c.game,'play');assert.equal(d.done.gecit,undefined);
});
test('defence wins once after all three waves are actually destroyed',()=>{
 const r=runtime();defenceToLast(r);r.clear();r.run(.2);
 assert.equal(r.snapshot().won,true);assert.equal(r.snapshot().done.gecit,1);
 assert.equal(r.snapshot().best.gecit,3);assert.equal(r.c.game,'over');
 r.run(2);assert.equal(r.events.filter(e=>e.kind==='end').length,1);
});
test('gate breach is a defeat and does not award progress',()=>{
 const r=runtime();r.start('gecit');r.to(ops[0].phases[0]);r.run(55.1);
 const e=r.c.E[0];e.x=70;e.z=r.c.riv(70)+40;r.run(.1);
 assert.equal(r.snapshot().lost,true);assert.equal(r.c.game,'over');assert.equal(r.snapshot().done.gecit,undefined);
});
test('hill cannot be captured before the crossing phase',()=>{
 const r=runtime();r.start('tepe');r.clear();r.to(ops[1].obj);r.run(13);
 assert.equal(r.snapshot().ph,0);assert.equal(r.snapshot().cap,0);assert.equal(r.snapshot().won,false);
});
test('hill requires the outpost before the final hold and then completes normally',()=>{
 const r=runtime();r.start('tepe');cross(r,'tepe');
 r.clear(e=>Math.hypot(e.x-ops[1].outpost.x,e.z-ops[1].outpost.z)>90);
 r.to(ops[1].obj);r.run(13);assert.equal(r.snapshot().won,false);assert.equal(r.snapshot().ph,1);
 r.clear();r.run(.2);assert.equal(r.snapshot().ph,2);r.run(11);
 assert.equal(r.snapshot().won,false);r.run(1.1);assert.equal(r.snapshot().won,true);
});
test('hill hold decays outside the objective and with a contesting enemy',()=>{
 const r=runtime();r.start('tepe');cross(r,'tepe');r.clear();r.run(.1);r.to(ops[1].obj);r.run(6);
 assert.ok(r.snapshot().cap>5.9);r.to({x:0,z:0});r.run(2);assert.ok(r.snapshot().cap<5.1);
 r.to(ops[1].obj);r.c.E.push({type:'tank',hp:100,x:-540,z:680,hk:{role:'def',post:{x:-540,z:680}}});r.run(2);
 assert.ok(r.snapshot().cap<4.1);assert.equal(r.snapshot().won,false);
});
for(const id of ['depo','batarya'])test(id+' does not bypass crossing and observation when targets die early',()=>{
 const r=runtime();r.start(id);r.clear(e=>id==='depo'?e.hk.role==='dep':e.hk.bat);r.run(.2);
 assert.equal(r.snapshot().won,false);assert.equal(r.snapshot().ph,0);assert.equal(r.snapshot().done[id],undefined);
 cross(r,id);const o=ops.find(o=>o.id===id);r.to(o.phases[1]);r.run(.2);
 assert.equal(r.snapshot().won,true);assert.equal(r.snapshot().done[id],1);
});
for(const id of ['tepe','depo','batarya'])test(id+' counter-attack spawns once after crossing and resets on restart',()=>{
 const r=runtime();r.start(id);r.run(.2);assert.equal(r.c.E.filter(e=>e.hk.role==='qrf').length,0);
 cross(r,id);const count=id==='batarya'?3:2;assert.equal(r.c.E.filter(e=>e.hk.role==='qrf').length,count);
 r.run(2);assert.equal(r.c.E.filter(e=>e.hk.role==='qrf').length,count);
 r.start(id);assert.equal(r.c.E.filter(e=>e.hk.role==='qrf').length,0);cross(r,id);
 assert.equal(r.c.E.filter(e=>e.hk.role==='qrf').length,count);
});
test('night APC counter-attack keeps advancing until inside its actual fire range',()=>{
 const r=runtime();r.start('depo');cross(r,'depo');const e=r.c.E.find(e=>e.hk.role==='qrf'&&e.type==='apc');
 e.x=r.c.P.x;e.z=r.c.P.z+150;r.run(.1);assert.equal(e.fr,132);
 assert.ok(e.hd.x!==e.x||e.hd.z!==e.z,'150 m is outside the night APC fire range');
 e.z=r.c.P.z+95;r.run(.1);assert.equal(e.hd.x,e.x);assert.equal(e.hd.z,e.z);
});
test('attacker halt timing follows elapsed time, independent of update frame rate',()=>{
 const results=[];for(const dt of [.05,1/60]){const r=runtime();r.start('gecit');r.to(ops[0].phases[0]);r.run(55.1);
  const e=r.c.E[0];e.x=70;e.z=350;r.to({x:70,z:40});let t=0;
  for(;t<13;t+=dt){r.run(dt,dt);if(e.hd.x===e.x&&e.hd.z===e.z)break;}results.push(t+dt);
 }for(const t of results)assert.ok(t>10.9&&t<11.1,'first halt at '+t+' simulated seconds');
});
test('pause and hidden document do not advance operation timers',()=>{
 const r=runtime();r.start('batarya');r.run(1);const before=r.snapshot().t;
 r.c.openMenu();r.run(2);assert.equal(r.snapshot().t,before);
 r.c.game='play';r.doc.hidden=true;r.run(2);assert.equal(r.snapshot().t,before);
 r.doc.hidden=false;r.run(1);assert.ok(Math.abs(r.snapshot().t-before-1)<1e-6);
});
test('battery shell events slow from 20 seconds to 60 with only one gun alive',()=>{
 const intervals=[];for(const left of [3,1]){const r=runtime();r.start('batarya');let remove=3-left;r.clear(e=>e.hk.bat&&remove-->0);
  let first=null;for(let i=0;i<1000;i++){r.run(.1);const shots=r.events.filter(e=>e.kind==='shot').length;
   if(shots===1&&first===null)first=r.snapshot().t;
   if(shots>=2){intervals.push(r.snapshot().t-first);break;}}
 }assert.ok(Math.abs(intervals[0]-20)<.21);assert.ok(Math.abs(intervals[1]-60)<.21);
});
test('battery stops new shell events after the final gun is destroyed',()=>{
 const r=runtime();r.start('batarya');r.run(9);assert.equal(r.events.filter(e=>e.kind==='shot').length,1);
 r.clear(e=>e.hk.bat);r.run(65);assert.equal(r.events.filter(e=>e.kind==='shot').length,1);
 assert.equal(r.snapshot().hits,1);assert.equal(r.snapshot().inc,0,'the already-launched shell finishes its flight');
 assert.equal(r.snapshot().won,false,'still has to finish its route phases');
});
test('night victory restores weather, saved weather and previous night vision choice',()=>{
 const r=runtime({weather:'aksam',nvg:1});r.start('depo');assert.equal(r.c.wx,'gece');assert.equal(r.c.SV.wx,'aksam');
 finishDepot(r);assert.equal(r.c.game,'over');assert.equal(r.c.wx,'aksam');assert.equal(r.c.SV.wx,'aksam');assert.equal(r.c.NVG.on,1);
 assert.equal(JSON.parse(r.data.get('m60v2')).wx,'aksam');
});
test('pausing keeps night mission conditions; a new daytime mission restores user settings',()=>{
 const r=runtime();r.start('depo');r.c.openMenu();assert.equal(r.c.wx,'gece');assert.equal(r.c.NVG.on,1);
 r.start('tepe');assert.equal(r.c.wx,'gunduz');assert.equal(r.c.NVG.on,0);assert.equal(r.snapshot().ph,0);
});
test('engine player-death path records defeat and restores night conditions',()=>{
 const r=runtime({weather:'sis'});r.start('depo');r.c.P.hp=0;r.c.endGame(0,'Tank kaybedildi');
 assert.equal(r.snapshot().lost,true);assert.equal(r.snapshot().won,false);assert.equal(r.c.NAV.on,false);
 assert.equal(r.c.stagePending(),false);assert.equal(r.c.wx,'sis');assert.equal(r.c.NVG.on,0);
 assert.equal(r.events.filter(e=>e.kind==='end').length,1);assert.equal(r.snapshot().done.depo,undefined);
});
test('mission air restrictions do not leak into other game modes',()=>{
 const r=runtime();r.start('tepe');r.c.spawnHeli();r.c.spawnED();assert.equal(r.c.HELI.length+r.c.ED.length,0);
 r.c.mis='egitim';r.c.spawnHeli();r.c.spawnED();assert.equal(r.c.HELI.length+r.c.ED.length,2);
});
test('valid saved completion, best stars and extra metadata survive a lower-scoring replay',()=>{
 const r=runtime({saved:{mode:'harekat',sel:'depo',done:{tepe:1,depo:1},stars:{tepe:3,depo:3},custom:{keep:1}}});
 r.start('depo');r.to({x:0,z:0});r.run(361);r.c.P.hp=20;finishDepot(r);
 const saved=JSON.parse(r.data.get(key));assert.equal(r.snapshot().stars,1);assert.equal(saved.stars.depo,3);
 assert.equal(saved.stars.tepe,3);assert.equal(saved.done.tepe,1);assert.equal(saved.custom.keep,1);
});
test('malformed achievement maps cannot strand the mission after a victory',()=>{
 for(const saved of [{done:null,stars:null},{done:[],stars:[]},{done:'bad',stars:{depo:99,tepe:'bad'}}]){
  const r=runtime({saved});r.start('depo');finishDepot(r);assert.equal(r.c.game,'over');assert.equal(r.snapshot().done.depo,1);
  assert.ok(r.snapshot().best.depo>=1&&r.snapshot().best.depo<=3);
 }
});
test('sequential writes from two open sessions preserve newer achievement maxima',()=>{
 const data=new Map(),a=runtime({data}),b=runtime({data});a.start('depo');finishDepot(a);
 b.hk.select('batarya');const saved=JSON.parse(data.get(key));assert.equal(saved.done.depo,1);assert.equal(saved.stars.depo,3);
});
test('a storage write failure still ends victory once and reports unsaved progress',()=>{
 const r=runtime();r.start('depo');r.c.denyWrite=true;finishDepot(r);
 assert.equal(r.c.game,'over');assert.equal(r.events.filter(e=>e.kind==='end').length,1);
 assert.equal(r.snapshot().saveError,true);assert.ok(r.events.some(e=>e.kind==='say'&&/kayıt/i.test(e.text)));
});
