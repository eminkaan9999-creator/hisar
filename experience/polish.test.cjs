'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const p=require('./polish.js');
test('optional filmic rendering is off by default; texture and camera improvements are on',()=>{assert.equal(p.defaults.filmic,false);assert.equal(p.defaults.smoothCamera,true);assert.equal(p.defaults.textureDetail,true);assert.equal(p.defaults.exposure,1);});
for(const input of [null,undefined,false,42,'invalid',[],{exposure:NaN},{exposure:Infinity},{exposure:Symbol('x')}])test('preferences tolerate '+String(input),()=>{const result=p.settings(input);assert.ok(Number.isFinite(result.exposure));assert.ok(result.exposure>=.7&&result.exposure<=1.4);});
test('preferences use exact boolean types and an allowlist',()=>{const s=p.settings({filmic:'yes',reduceShake:1,exposure:90,evil:true});assert.equal(s.filmic,false);assert.equal(s.reduceShake,false);assert.equal(s.exposure,1.4);assert.equal('evil'in s,false);});
test('lower exposure bound and numeric string are normalized',()=>{assert.equal(p.settings({exposure:-5}).exposure,.7);assert.equal(p.settings({exposure:'1.1'}).exposure,1.1);});
for(const rate of [30,60,120,144])test('camera damping is frame-rate independent at '+rate+' Hz',()=>{let x=0;for(let i=0;i<rate;i++)x+=(10-x)*p.alpha(1/rate);assert.ok(Math.abs(x-10*(1-Math.exp(-16)))<1e-9);});
test('damping never extrapolates or produces NaN',()=>{for(const dt of [-5,0,NaN,Infinity,undefined,1/60,10]){const a=p.alpha(dt);assert.ok(a>=0&&a<=1);}});
for(const q of ['dusuk','orta','yuksek','unknown'])test('texture detail respects GPU maximum for '+q,()=>{for(const max of [1,2,4,8,16]){assert.ok(p.textureLevel(q,max)<=max);assert.ok(p.textureLevel(q,max)>=1);}});
test('all changed production scripts parse',()=>{for(const file of ['polish.js','ui.js','guard.js'])assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(__dirname+'/'+file,'utf8')));});
test('input guard releases inputs without manufacturing a browser blur',()=>{const s=fs.readFileSync(__dirname+'/guard.js','utf8');assert.match(s,/hisar:release-inputs/);assert.doesNotMatch(s,/new Event\('blur'\)/);});

test('camera response can be tuned but remains within safe bounds',()=>{
 assert.equal(p.settings({}).cameraResponse,16);
 assert.equal(p.settings({cameraResponse:2}).cameraResponse,8);
 assert.equal(p.settings({cameraResponse:200}).cameraResponse,28);
 assert.equal(p.settings({cameraResponse:20}).cameraResponse,20);
 assert.ok(p.alpha(1/60,28)>p.alpha(1/60,8));
 const src=fs.readFileSync(__dirname+'/polish.js','utf8');
 assert.match(src,/alpha\(dt,opts\.cameraResponse\)/);
 assert.match(src,/data-polish=.*cameraResponse/);
});
