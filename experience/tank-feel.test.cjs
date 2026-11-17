'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('./tank-feel.js');
test('bounded suspension responds to acceleration and turning and settles without idle vibration',()=>{
 const s={};for(let i=0;i<60;i++)core.advanceMotion(s,{speed:12,turn:1,rough:.8,road:false},1/60);assert.ok(s.p<0);assert.ok(s.r<0);assert.ok(Math.abs(s.p)<=.09&&Math.abs(s.r)<=.065);
 for(let i=0;i<600;i++)core.advanceMotion(s,{speed:0,turn:0,rough:1,road:false},1/60);assert.ok(Math.abs(s.p)<1e-6&&Math.abs(s.r)<1e-6);assert.ok(Math.abs(s.pv)<1e-6&&Math.abs(s.rv)<1e-6);
});
test('uneven ground has more hull response than a road and 10/60 Hz inputs remain finite and comparable',()=>{
 const run=(dt,road)=>{const s={fw:10};let energy=0;for(let t=0;t<4;t+=dt){core.advanceMotion(s,{speed:10,turn:.2,rough:1,road},dt);energy+=Math.abs(s.p)*dt;}return {s,energy};};const field=run(1/60,false),road=run(1/60,true),slow=run(.1,false);assert.ok(field.energy>road.energy*2);assert.ok(Math.abs(slow.energy-field.energy)<.02);assert.ok(Object.values(slow.s).every(Number.isFinite));core.advanceMotion(slow.s,{speed:NaN,turn:Infinity,rough:undefined},NaN);assert.ok(Object.values(slow.s).every(Number.isFinite));
});
test('recoil is a bounded impulse and reset drops previous vehicle motion',()=>{
 const s={p:.03,pv:0,r:.02,rv:0,fw:14,acc:5,travel:100};core.impulse(s);assert.equal(s.pv,-.14);for(let i=0;i<100;i++)core.impulse(s);assert.equal(s.pv,-.4);core.resetMotion(s);assert.ok(Object.values(s).every(v=>v===0));
});
test('hit direction follows the actual source and current hull heading, including unknown sources',()=>{
 const p={x:10,z:10,h:0};assert.equal(core.hitSector(p,{x:10,z:100}),0);assert.equal(core.hitSector(p,{x:100,z:10}),2);assert.equal(core.hitSector({...p,h:Math.PI/2},{x:100,z:10}),0);assert.equal(core.hitSector(p,{x:0,z:10}),6);assert.equal(core.hitSector(p,null),null);assert.equal(core.hitSector(p,p),null);assert.equal(core.partsText({trk:100,eng:40,tur:65}),'MOTOR %40 · KULE %65');
});
test('only successful tank shots cause recoil and only real health loss creates hit feedback',()=>{
 const c={document:{body:null,readyState:'loading',getElementById:()=>null,addEventListener(){}},game:'play',mode:'tank',TA:[3],st:0,P:{hp:100,x:0,z:0,h:0},SUSP:{pv:0},ebul:[],reset(){},fire(){if(c.allowed)c.TA[0]--;},eshot(){c.ebul.push({});},hitP(k){c.P.hp-=k;}};c.window=c;vm.runInNewContext(fs.readFileSync(__dirname+'/tank-feel.js','utf8'),c);c.HisarTankFeel.connect();
 c.fire();assert.equal(c.SUSP.pv,0);c.allowed=true;c.fire();assert.equal(c.SUSP.pv,-.14);assert.equal(c.HisarTankFeel.diagnostics().shots,1);c.eshot({x:100,z:0});assert.equal(c.ebul[0].hitSource.x,100);c.hitP(0,{x:0,z:0});assert.equal(c.HisarTankFeel.diagnostics().hits,0);c.hitP(12,{x:0,z:0},{x:100,z:0});assert.equal(c.HisarTankFeel.diagnostics().impact.sector,2);assert.equal(c.HisarTankFeel.diagnostics().impact.damage,12);
});
