/* İlk Işık: safe wave-boundary checkpoints, isolated from permanent progress. */
(function(root){'use strict';
const VERSION='1.0.0',KEY='celik-boru-ilk-isik-v1',RULES=1;
const num=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
const point=v=>v&&num(v.x,-790,790)&&num(v.z,-790,790)&&num(v.h,-1e6,1e6);
function normalise(v){
 if(!v||v.schema!==1||v.operation!=='safak-1'||v.rules!==RULES||!num(v.updatedAt,0,1e15)||!num(v.sessionStartedAt,0,1e15))return null;
 const base={schema:1,operation:'safak-1',rules:RULES,updatedAt:v.updatedAt,sessionStartedAt:v.sessionStartedAt};
 if(v.removed===true)return {...base,removed:true};
 if(v.phase!==1||!Number.isInteger(v.clearedWave)||v.clearedWave< -1||v.clearedWave>1||!num(v.elapsed,0,86400)||!num(v.score,0,1e8)||!['kolay','normal','zor','serbest'].includes(v.difficulty))return null;
 const value=payload(v);return value?{...base,phase:1,clearedWave:v.clearedWave,...value}:null;
}
// Shared vehicle snapshot validation; mission headers and safe boundaries stay separate.
function payload(v){
 const p=v.player,a=v.ammunition,d=v.drone;
 if(!num(v.elapsed,0,86400)||!num(v.score,0,1e8)||!['kolay','normal','zor','serbest'].includes(v.difficulty))return null;
 if(!point(p)||!num(p.th,-1e6,1e6)||!num(p.mx,1,10000)||!num(p.hp,.001,p.mx)||!p.parts||!['trk','eng','tur'].every(k=>num(p.parts[k],0,100)))return null;
 if(!a||!Array.isArray(a.capacity)||!Array.isArray(a.shells)||a.capacity.length!==4||a.shells.length!==4||!a.capacity.every((n,i)=>Number.isInteger(n)&&num(n,0,200)&&Number.isInteger(a.shells[i])&&num(a.shells[i],0,n))||!num(v.cooldown,0,120))return null;
 if(!d||!num(d.ammo,0,100)||!num(d.stock,0,100)||!num(d.charge,0,100)||![0,1].includes(d.charged))return null;
 if(!Number.isInteger(v.formation)||!num(v.formation,0,3)||!Array.isArray(v.allies)||v.allies.length>v.formation||!num(v.kills,0,10000))return null;
 const ids=new Set(),allies=[];
 for(const q of v.allies){if(!point(q)||!Number.isInteger(q.idx)||q.idx<0||q.idx>=v.formation||ids.has(q.idx)||!num(q.mx,1,10000)||!num(q.hp,.001,q.mx))return null;ids.add(q.idx);allies.push({idx:q.idx,x:q.x,z:q.z,h:q.h,hp:q.hp,mx:q.mx});}
 return {elapsed:v.elapsed,score:v.score,rewarded:v.rewarded===true,difficulty:v.difficulty,player:{x:p.x,z:p.z,h:p.h,th:p.th,hp:p.hp,mx:p.mx,parts:{...p.parts}},ammunition:{capacity:a.capacity.slice(),shells:a.shells.slice()},drone:{ammo:d.ammo,stock:d.stock,charge:d.charge,charged:d.charged},cooldown:v.cooldown,formation:v.formation,allies,kills:v.kills};
}
// A checkpoint is one coherent snapshot. Never combine its coordinates or ammo field by field.
function latest(a,b){a=normalise(a);b=normalise(b);if(!a)return b;if(!b)return a;return b.updatedAt>a.updatedAt||b.updatedAt===a.updatedAt&&b.removed?b:a;}
const core=Object.freeze({VERSION,KEY,RULES,normalise,latest,payload});if(typeof module==='object'&&module.exports)module.exports=core;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};let error=null;
const stored=()=>normalise(safe(()=>JSON.parse(root.localStorage.getItem(KEY)),null));
function changed(){safe(()=>root.document.dispatchEvent(new root.CustomEvent('hisar:checkpoint')),null);}
function write(value,prepare){const current=stored(),next=normalise(value);if(!next){error='invalid';return false;}if(current&&current.sessionStartedAt>next.sessionStartedAt){error='stale';return false;}
 next.updatedAt=Math.max(Date.now(),current?current.updatedAt+1:0);try{if(typeof prepare==='function')prepare();root.localStorage.setItem(KEY,JSON.stringify(next));error=null;changed();return true;}catch(e){error='storage';return false;}}
function clear(sessionStartedAt){return write({schema:1,operation:'safak-1',rules:RULES,updatedAt:Date.now(),sessionStartedAt,removed:true});}
root.HisarCheckpoint=Object.freeze({version:VERSION,core,session:()=>{const v=stored();return Math.max(Date.now(),v?v.sessionStartedAt+1:0);},read:()=>{const v=stored();return v&&!v.removed?v:null;},write,clear,diagnostics:()=>({available:!!(stored()&&!stored().removed),error})});
})(typeof window!=='undefined'?window:globalThis);
