'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const c=require('./modern.js');
test('coarse graphics budget caps pixels, shadows and filtering while retaining automatic quality',()=>{
 assert.deepEqual(c.budget(true,'yuksek',3),{pixelRatio:1.5,shadowSize:1024,anisotropy:4});assert.equal(c.budget(true,'dusuk',.7).pixelRatio,.7);assert.equal(c.budget(false,'yuksek',2).shadowSize,2048);
});
test('every supported weather has finite exposure and a usable ordered visibility range',()=>{
 for(const [k,v]of Object.entries(c.LOOKS)){assert.ok(v.exposure>0&&v.exposure<2,k);assert.ok(v.far>v.near&&v.near>0,k);}assert.ok(c.LOOKS.gece.far<c.LOOKS.gunduz.far);
});
test('radio and pause duck the music without changing the master sound preference',()=>{
 assert.ok(c.musicMix('play',true)<c.musicMix('play',false));assert.equal(c.musicMix('pause',false),0);assert.ok(c.musicMix('menu',false)<c.musicMix('play',false));
});
