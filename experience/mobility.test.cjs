'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('./mobility.js'),html=fs.readFileSync(__dirname+'/../index.html','utf8');
function terrain(){const c={Math,clamp:(v,a,b)=>Math.max(a,Math.min(b,v))};vm.createContext(c);vm.runInContext(html.slice(html.indexOf('const WS=800;'),html.indexOf('const WROADS=[')),c);return c;}
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
 for(let i=0;i<100;i++)c.update(.1);assert.ok(c.P.z<c.riv(c.P.x)-10);assert.equal(c.P.v,0);assert.ok(c.HisarMobility.diagnostics().terrainStops>0);
});
test('civilian sidesteps remain bounded even when a vehicle overlaps their previous position',()=>{
 const c=require('./koy.js');for(const dt of[1/60,.1]){assert.ok(c.sideStep({need:5,push:4},4.6,dt)<=4.6*dt+1e-9);}
});
