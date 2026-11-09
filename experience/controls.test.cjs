'use strict';const test=require('node:test'),assert=require('node:assert/strict');const c=require('./controls.js');
test('default analog profile is balanced',()=>assert.equal(c.getProfile(),'dengeli'));
test('analog axes use deadzones and preserve direction',()=>{assert.equal(c.axis(.02,'dengeli'),0);assert.equal(c.axis(-.02,'dengeli'),0);assert.equal(c.axis(1,'dengeli'),1);assert.equal(c.axis(-1,'dengeli'),-1);});
test('precision profile is gentler than responsive at low movement',()=>{assert.ok(c.axis(.3,'hassas')<c.axis(.3,'seri'));});
test('smoothing is bounded and approaches target',()=>{let x=0;for(let i=0;i<120;i++)x=c.smoothing(x,1,1/60,'dengeli');assert.ok(x>.99&&x<=1);assert.equal(c.smoothing(0,0,1/60,'dengeli'),0);});
test('invalid profile is rejected',()=>{assert.equal(c.setProfile('invalid'),false);assert.equal(c.getProfile(),'dengeli');});
