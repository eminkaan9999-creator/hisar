'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('./mobility.js'),html=fs.readFileSync(__dirname+'/../index.html','utf8');
function terrain(){const c={Math,clamp:(v,a,b)=>Math.max(a,Math.min(b,v))};c.window=c;vm.createContext(c);vm.runInContext(html.slice(html.search(/const WS=\d+/),html.indexOf('const WROADS=[')),c);return c;}
test('a tank accelerates and brakes over time, cannot reverse instantly and limits lateral acceleration at road speed',()=>{
 const p={x:0,z:0,h:0,v:0,w:0};core.advance(p,{forward:1,condition:1,road:true},.1);assert.ok(p.v>.3&&p.v<.33);assert.equal(p.h,0);
 for(let i=0;i<80;i++)core.advance(p,{forward:1,condition:1,road:true},.1);assert.equal(p.v,14.5);
 core.advance(p,{forward:-1,condition:1,road:true},.1);assert.ok(p.v>13,'reverse input first brakes');
 for(let i=0;i<200;i++){core.advance(p,{forward:1,steer:1,condition:1,road:true},.1);assert.ok(Math.abs(p.w*p.v)<=core.LIMIT.lateral+1e-8);}
 for(let i=0;i<60;i++)core.advance(p,{forward:0,condition:1,road:true},.1);assert.equal(p.v,0);assert.equal(p.w,0);
});
test('a pivot is bounded and a long frame never teleports or bypasses the acceleration limit',()=>{
 const p={x:0,z:0,h:0,v:0,w:0};core.advance(p,{steer:1,condition:1,road:true},4);assert.equal(p.x,0);assert.equal(p.z,0);assert.ok(Math.abs(p.h)<=.01501);
 core.advance(p,{forward:1,condition:1,engine:999,road:true},4);assert.ok(p.v<.37);assert.ok(Math.hypot(p.x,p.z)<.037);
});
test('every signed dry crossing has a continuous approach on both banks',()=>{
 const c=terrain();
 for(const x of vm.runInContext('FORDS',c)){
  const centre=c.riv(x);
  for(const heading of [0,Math.PI]){
   const direction=heading===0?1:-1;
   for(let offset=-32;offset<32;offset+=.25){
    const z=centre+direction*offset;
    assert.ok(core.terrainAllowed({x,z,h:heading},{x,z:z+direction*.25,h:heading},c.hAt,c.riv),'blocked crossing at '+x+', '+z);
   }
  }
 }
});
test('swept terrain checks stop a tank and a pedestrian at deep water, allow the real dry ford, and reject a cliff',()=>{
 const c=terrain(),h=c.hAt,river=c.riv,x=-490,z=river(x);
 assert.ok(core.depth(h,river,x,z)>1.7);
 assert.equal(core.terrainAllowed({x,z:z-18,h:0},{x,z:z-10,h:0},h,river),false);
 assert.equal(core.terrainAllowed({x,z:z-14,h:0},{x,z:z-7,h:0},h,river,true),false);
 for(let a=82;a<175;a+=.5)assert.equal(core.terrainAllowed({x:-560,z:a,h:0},{x:-560,z:a+.5,h:0},h,river),true,'dry Batı Geçidi at '+a);
 assert.equal(core.terrainAllowed({x:0,z:0,h:0},{x:0,z:1,h:0},(x,z)=>z*3,()=>100),false);
 // A discontinuous teleport is never accepted as movement.
 assert.equal(core.terrainAllowed({x,z:z-18},{x,z:z+18},h,river),false);
});
test('a saved vehicle already in water can escape toward shallower ground without opening a new water crossing',()=>{
 const river=()=>0,h=(x,z)=>-3+z*.2;
 assert.equal(core.terrainAllowed({x:0,z:0,h:0},{x:0,z:.5,h:0},h,river,true),true);
 assert.equal(core.terrainAllowed({x:0,z:0,h:0},{x:0,z:-.5,h:0},h,river,true),false);
});
test('the shipped update guard bounds actual combat infantry and blocks real engine movement into water',()=>{
 const c=terrain();Object.assign(c,{document:{hidden:false,addEventListener(){}},game:'play',SV:{U:{eng:0}},roadNear:()=>false,P:{x:-490,z:c.riv(-490)-20,h:0,v:8,w:0,dz:{trk:100}},AL:[],E:[{type:'inf',x:-490,z:50,h:0}],radio(){},drive(){throw Error('legacy fast drive must be replaced');},update(dt){c.drive(0,1,1,dt);c.E[0].z+=10*dt;},buildGrid(){return [];}});c.window=c;
 vm.runInContext(fs.readFileSync(__dirname+'/mobility.js','utf8'),c);const before=c.P.z;c.update(.1);assert.ok(c.E[0].z<=50.4200001);assert.ok(c.P.z>=before);
 for(let i=0;i<100&&!c.HisarMobility.diagnostics().waterStops;i++)c.update(.1);assert.ok(c.P.z<c.riv(c.P.x)-10);assert.equal(c.P.v,0);assert.ok(c.HisarMobility.diagnostics().waterStops>0);const bank=c.P.z;for(let i=0;i<20;i++){c.update(.1);assert.equal(c.P.v,0,'held forward input cannot repeatedly creep after contact');assert.equal(c.P.z,bank);}
});
test('civilian sidesteps remain bounded even when a vehicle overlaps their previous position',()=>{
 const c=require('./koy.js');for(const dt of[1/60,.1]){assert.ok(c.sideStep({need:5,push:4},4.6,dt)<=4.6*dt+1e-9);}
});

test('native fuel and dozer power restrictions still affect the new drive; an immobilised tank cannot pivot',()=>{
 const run=engine=>{const p={x:0,z:0,h:0,v:0,w:0};for(let i=0;i<100;i++)core.advance(p,{forward:1,steer:1,condition:1,road:true,engine},.1);return p;};
 const normal=run(0),reserve=run((.25-1)/.07),dug=run(-1/.07);assert.ok(reserve.v<normal.v*.3);assert.ok(Math.abs(dug.v)<1e-8&&Math.abs(dug.h)<1e-8);
 const p={x:0,z:0,h:0,v:0,w:0};for(let i=0;i<20;i++)core.advance(p,{forward:1,steer:1,tracks:false,condition:1,road:true},.1);assert.equal(p.v,0);assert.equal(p.h,0);
});

test('static water mask is sampled once while each caller receives current building blockers',()=>{
 const mask=core.waterGridCache();let calls=0;const h=(x,z)=>{calls++;return z<0?-3.4:1;},river=()=>0;
 const first=new Float32Array(16);mask.apply(first,4,4,8,h,river);assert.equal(calls,16);assert.equal(first[0],1e9);assert.equal(first[15],0);
 const changed=new Float32Array(16);changed[15]=1e9;mask.apply(changed,4,4,8,h,river);assert.equal(calls,16);assert.equal(changed[15],1e9,'a new building stays blocked');
 const destroyed=new Float32Array(16);mask.apply(destroyed,4,4,8,h,river);assert.equal(destroyed[15],0,'demolition is not hidden by a cached combined grid');assert.equal(mask.diagnostics().builds,1);
 mask.invalidate();mask.apply(new Float32Array(16),4,4,8,h,river);assert.equal(calls,32);mask.apply(new Float32Array(25),5,4,10,h,river);assert.equal(calls,57);
});

test('accepted movement preserves the native suspension/dug-in height; only a rejected or clamped move is resynchronised',()=>{
 const c=terrain(),g=()=>({position:{x:0,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z});}},rotation:{x:0,y:0,z:0}});Object.assign(c,{document:{hidden:false,addEventListener(){}},game:'play',SV:{U:{eng:0}},roadNear:()=>true,P:{x:70,z:30,h:0,v:0,w:0,dz:{trk:100},g:g()},AL:[],E:[{type:'inf',x:20,z:20,h:0,g:g()}],radio(){},drive(){},update(dt){c.drive(0,1,1,dt);c.P.g.position.set(c.P.x,c.hAt(c.P.x,c.P.z)-.35,c.P.z);c.E[0].z+=10*dt;c.E[0].g.position.set(c.E[0].x,0,c.E[0].z);}});c.window=c;
 vm.runInContext(fs.readFileSync(__dirname+'/mobility.js','utf8'),c);c.update(.1);assert.equal(c.P.g.position.y,c.hAt(c.P.x,c.P.z)-.35);assert.equal(c.E[0].g.position.z,c.E[0].z);assert.ok(c.E[0].z<=20.4200001);
});

test('a pivot checks the arc of the hull even when its centre and final corners are on level ground',()=>{
 const from={x:0,z:0,h:0},to={x:0,z:0,h:Math.PI/2};
 // The outer corner sweeps past x=3.1 m. Both end poses are within x=2.8 m.
 for(const height of [-4,4]){
  const ground=x=>Math.abs(x)>3.1?height:0;
  assert.equal(core.terrainAllowed(from,to,ground,()=>0),false);
  assert.equal(core.terrainAllowed(to,from,ground,()=>0),false);
  assert.equal(core.terrainAllowed(from,to,ground,()=>0,true),true);
 }
 assert.equal(core.terrainAllowed(from,to,x=>.2*x,()=>50),true);
 assert.equal(core.terrainAllowed({...from,h:Math.PI-.01},{...to,h:-Math.PI+.01},x=>Math.abs(x)>3.1?4:0,()=>50),true);
});

test('a rejected native vehicle rotation restores the previous heading on the model as well as in the simulation',()=>{
 const model={position:{set(){}},rotation:{y:0}},truck={x:0,z:0,h:0,type:'truck',g:model};
 const c={document:{hidden:false,addEventListener(){}},game:'play',AL:[],E:[truck],P:{x:20,z:20,h:0},
  hAt:x=>Math.abs(x)>3.1?-4:0,riv:()=>0,update(){truck.h=Math.PI/2;model.rotation.y=truck.h;}};
 c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/mobility.js','utf8'),c);
 c.update(.1);
 assert.equal(truck.h,0);assert.equal(model.rotation.y,0);
});

test('driving into the nose of a solid patrol stops the tank, held input cannot build speed, and reverse frees it',()=>{
 const {approachesBlocker}=require('./sinir.js');
 const nose={x:0,z:1.8,r:2.8},P={x:0,z:12,h:Math.PI,v:0,w:0,dz:{trk:100}};
 const c={document:{addEventListener(){}},SV:{U:{eng:0}},P,hAt:()=>0,riv:()=>100,roadNear:()=>true,WS:1000,drive(){},
  HisarSinir:{blocksPatrolDrive:(a,b)=>approachesBlocker(a,b,nose,2.6)}};
 c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/mobility.js','utf8'),c);
 for(let i=0;i<60;i++)c.drive(0,1,1,.1);
 assert.ok(P.z>6.7&&P.z<7.5);assert.equal(P.v,0);
 const stopped=P.z;for(let i=0;i<25;i++)c.drive(0,1,1,.1);
 assert.equal(P.z,stopped);assert.ok(c.HisarMobility.diagnostics().patrolStops>0);
 for(let i=0;i<10;i++)c.drive(0,-1,1,.1);
 assert.ok(P.z>stopped+1);assert.ok(P.v<0);
 assert.equal(approachesBlocker({x:0,z:6},{x:0,z:7},nose,2.6),false);
});

test('the driver yields to a stationary villager and can reverse or proceed after the path clears',()=>{
 const {blocksActor}=require('./koy.js'),actor={x:0,z:10};
 const P={x:0,z:0,h:0,v:10,w:0,dz:{trk:100}};
 const c={document:{addEventListener(){}},SV:{U:{eng:0}},P,hAt:()=>0,riv:()=>100,roadNear:()=>true,WS:1000,drive(){},
  HisarKoy:{blocksDrive:(a,b)=>blocksActor(a,b,actor)}};
 c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/mobility.js','utf8'),c);
 for(let i=0;i<50;i++)c.drive(0,1,1,.1);
 assert.ok(actor.z-P.z>=4.85&&actor.z-P.z<5.3);assert.equal(P.v,0);assert.ok(c.HisarMobility.diagnostics().crowdStops>0);
 const stop=P.z;for(let i=0;i<10;i++)c.drive(0,-1,1,.1);assert.ok(P.z<stop-1);
 actor.x=8;for(let i=0;i<60;i++)c.drive(0,1,1,.1);assert.ok(P.z>actor.z);
 assert.ok(blocksActor({x:0,z:0,h:0},{x:0,z:0,h:Math.PI/2},{x:4.2,z:0}));
 assert.equal(blocksActor({x:0,z:0,h:0},{x:0,z:-1,h:0},{x:0,z:4}),false);
});
