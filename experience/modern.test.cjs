'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const c=require('./modern.js');
const fs=require('node:fs'),vm=require('node:vm');
test('coarse graphics budget caps pixels, shadows and filtering while retaining automatic quality',()=>{
 assert.deepEqual(c.budget(true,'yuksek',3),{pixelRatio:1.5,shadowSize:1024,anisotropy:4});assert.equal(c.budget(true,'dusuk',.7).pixelRatio,.7);assert.equal(c.budget(false,'yuksek',2).shadowSize,2048);
});
test('every supported weather has finite exposure and a usable ordered visibility range',()=>{
 for(const [k,v]of Object.entries(c.LOOKS)){assert.ok(v.exposure>0&&v.exposure<2,k);assert.ok(v.far>v.near&&v.near>0,k);}assert.ok(c.LOOKS.gece.far<c.LOOKS.gunduz.far);
});
test('radio and pause duck the music without changing the master sound preference',()=>{
 assert.ok(c.musicMix('play',true)<c.musicMix('play',false));assert.equal(c.musicMix('pause',false),0);assert.ok(c.musicMix('menu',false)<c.musicMix('play',false));
});
test('an uninitialised or invalid health value can never write NaN into a progress element',()=>{
 for(const [v,m]of [[undefined,undefined],[100,0],[NaN,100],[100,Infinity]])assert.equal(c.percent(v,m),0);assert.equal(c.percent(75,150),50);assert.equal(c.percent(200,150),100);
});
test('shared instanced materials always have a valid white colour buffer without replacing real colours',()=>{
 class Attribute{constructor(array,itemSize){this.array=array;this.itemSize=itemSize;}}
 const mesh={isInstancedMesh:true,instanceColor:null,instanceMatrix:{count:4}};assert.equal(c.instanceColour(mesh,Attribute),true);assert.equal(mesh.instanceColor.array.length,12);assert.ok(mesh.instanceColor.array.every(v=>v===1));const old=mesh.instanceColor;assert.equal(c.instanceColour(mesh,Attribute),false);assert.equal(mesh.instanceColor,old);assert.equal(c.instanceColour({isInstancedMesh:false},Attribute),false);
});
test('the drone HUD reads actual altitude and view heading, rather than an absent speed property',()=>{
 const ctx={document:{body:null,readyState:'loading',addEventListener(){}},addEventListener(){},game:'play',mode:'drone',DR:{on:true,x:5,z:6,y:90,hp:60},P:{h:0},SV:{U:{}},hAt:()=>10,yaw:1.2,ammo:4};ctx.window=ctx;vm.runInNewContext(fs.readFileSync(__dirname+'/modern.js','utf8'),ctx);const s=ctx.HisarModern.telemetry();assert.equal(s.speed,80);assert.equal(s.unit,'m');assert.equal(s.bearing,1.2);assert.equal(s.hp,100);
});
