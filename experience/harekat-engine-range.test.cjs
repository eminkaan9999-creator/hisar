'use strict';
// Execute the actual engine firing branch with deterministic target/projectile
// stubs. This checks firing decisions and ally projectile attachment, not flight.
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {runtime,production}=require('./test-support/harekat-runtime.cjs');
const html=production('index.html'),begin=html.indexOf('if(e.cd<=0){',html.indexOf('function update(dt){'));
const end=html.indexOf('\n }\n // mermiler',begin);assert.ok(begin>=0&&end>begin);
const branch=html.slice(begin,end);
const helperStart=html.indexOf('function fireEnemyAt('),helper=helperStart<0?'':html.slice(helperStart,html.indexOf('\nfunction eshot(',helperStart));
function decision(e,distance,ally=false){
 let shots=0;const c={mode:e.type==='aa'?'drone':'tank',DR:{on:true,x:e.x+distance,y:10,z:e.z},P:{x:0,z:0},
  L:{cd:1},smoked:()=>false,hAt:()=>0,rnd:()=>1,ebul:[],
  pickTgt:()=>({d:distance,x:0,z:0,al:ally?{cs:'friend'}:null}),
  eshot(){shots++;c.ebul.push({});},artyShot(){shots++;}};
 vm.createContext(c);vm.runInContext(helper+'\nfunction run(e,d){'+branch+'}',c);e.cd=0;c.run(e,distance);
 return {shots,bullet:c.ebul[0]};
}
for(const [name,match,dayRange]of[
 ['infantry',e=>e.type==='inf'&&!e.at,50],['Kornet',e=>e.type==='inf'&&e.at,115],['AA',e=>e.type==='aa',95],
 ['tank',e=>e.type==='tank',360],['APC',e=>e.type==='apc',220]
])test('night '+name+' firing uses the shorter range in the real engine branch',()=>{
 const r=runtime();r.start('depo');r.to({x:400,z:200});r.run(.2);const e=r.c.E.find(match);assert.ok(e);
 const day={...e,hkFireRange:undefined,fr:dayRange};
 assert.equal(decision(day,dayRange*.8).shots,1,'day shot is inside the native range');
 assert.equal(decision(e,dayRange*.8).shots,0,'night shot is outside the reduced range');
 assert.equal(decision(e,dayRange*.5).shots,1,'night shot inside the reduced range still creates a projectile');
});
test('an in-range ally shot still attaches the correct ally to its new projectile',()=>{
 const r=runtime();r.start('depo');const e=r.c.E.find(e=>e.type==='inf'&&!e.at),d=decision(e,20,true);
 assert.equal(d.shots,1);assert.equal(d.bullet.al.cs,'friend');
});
