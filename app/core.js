/* Independent HİSAR: KOMUTA state and proximity rules. Game-only coordinates. */
(function(root){'use strict';
const VERSION='1.0.0',KEY='hisar-komuta-v1';
const zones=Object.freeze({range:Object.freeze({x:-88,z:-78,r:4,label:'Poligon'}),drone:Object.freeze({x:-72,z:-32,r:4,label:'Uçangöz parkuru'})});
const num=(v,d=0)=>Number.isFinite(v)?v:d;
function near(p,z){return !!p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.hypot(p.x-z.x,p.z-z.z)<=z.r;}
function normalize(s){s=s&&typeof s==='object'?s:{};const d=s.drone||{},p=s.position||{};return {version:1,position:{x:Math.max(-420,Math.min(260,num(p.x,-88))),z:Math.max(-150,Math.min(200,num(p.z,-69))),a:num(p.a,-Math.PI/2)},drone:{owned:d.owned===true,battery:Math.max(0,Math.min(150,num(d.battery,150))),view:d.view==='fpv'?'fpv':'follow'},range:{weapon:typeof s.range?.weapon==='string'?s.range.weapon.slice(0,30):null},sound:s.sound!==false};}
const api=Object.freeze({VERSION,KEY,zones,near,normalize,dt:(v)=>Math.max(0,Math.min(.05,num(v)))});
if(typeof module==='object'&&module.exports)module.exports=api;else root.KomutaCore=api;
})(typeof window!=='undefined'?window:globalThis);
