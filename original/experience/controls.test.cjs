'use strict';const test=require('node:test'),assert=require('node:assert/strict');const c=require('./controls.js');
test('default analog profile is balanced',()=>assert.equal(c.getProfile(),'dengeli'));
test('analog axes use deadzones and preserve direction',()=>{assert.equal(c.axis(.02,'dengeli'),0);assert.equal(c.axis(-.02,'dengeli'),0);assert.equal(c.axis(1,'dengeli'),1);assert.equal(c.axis(-1,'dengeli'),-1);});
test('precision profile is gentler than responsive at low movement',()=>{assert.ok(c.axis(.3,'hassas')<c.axis(.3,'seri'));});
test('smoothing is bounded and approaches target',()=>{let x=0;for(let i=0;i<120;i++)x=c.smoothing(x,1,1/60,'dengeli');assert.ok(x>.99&&x<=1);assert.equal(c.smoothing(0,0,1/60,'dengeli'),0);});
test('invalid profile is rejected',()=>{assert.equal(c.setProfile('invalid'),false);assert.equal(c.getProfile(),'dengeli');});

test('legacy update wrapper uses elapsed time when dt is missing',()=>{const fs=require('node:fs'),vm=require('node:vm');const src=fs.readFileSync(__dirname+'/controls.js','utf8');const handlers={};const ctx={joy:{x:.7,y:0},mode:'tank',game:'play',localStorage:{getItem:()=>null,setItem:()=>{}},performance:{now:(()=>{let n=0;return()=>n+=16})()},document:{getElementById:()=>null,addEventListener:()=>{}},addEventListener:(k,fn)=>handlers[k]=fn,update(){this.sample=this.joy.x;},sample:0};ctx.window=ctx;vm.runInNewContext(src,ctx);ctx.update();assert.ok(ctx.sample>0);assert.equal(ctx.joy.x,.7);});

test('non-finite analog input stays neutral',()=>{for(const v of [NaN,Infinity,-Infinity])assert.equal(c.axis(v,'dengeli'),0);});
test('non-finite smoothing delta never produces NaN',()=>{for(const dt of [NaN,Infinity,-Infinity])assert.ok(Number.isFinite(c.smoothing(0,1,dt,'dengeli')));});
