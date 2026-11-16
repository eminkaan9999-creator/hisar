/* ÇELİK BÖRÜ atış 1.0 — ateşin hissi.
 * - Ana top: gövde geri sarsılır (yay benzeri sönümlü salınım), namlu geri gelir, namlu ağzından alev ve büyük duman halkası çıkar,
 *   atışın basıncı tankın önündeki tozu kaldırır. Ses: keskin patlama, derin gümbürtü ve vadiden dönen iki yankı.
 * - Uçaksavar makineli tüfeği (M85): her mermide boş kovan yana fırlar, yere düşüp seker; namludan ince duman.
 * - Mürettebat ve telsiz sesi erkek sesi: Türkçe erkek ses varsa o, yoksa var olan Türkçe ses daha kalın okunur.
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.0.1';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;

// ---------- çekirdek ----------
// Gövde salınımı: sönümlü yay. k yay katsayısı, c sönüm. Atışta hız verilir; açı geri döner.
const ROCK=Object.freeze({kick:-.9,k:70,c:7.5,max:.09});
function rockStep(r,dt){const a=-ROCK.k*r.a-ROCK.c*r.v;r.v+=a*dt;r.a=clamp(r.a+r.v*dt,-ROCK.max,ROCK.max);return r;}
// Kovan: yana ve yukarı fırlar, yerçekimiyle düşer, yere değince hızını kaybedip seker.
function casingStep(c,dt,ground){c.vy-=9.8*dt;c.x+=c.vx*dt;c.y+=c.vy*dt;c.z+=c.vz*dt;c.r+=c.w*dt;c.t+=dt;
 if(c.y<ground+.02){c.y=ground+.02;if(Math.abs(c.vy)>1){c.vy=-c.vy*.35;c.vx*=.5;c.vz*=.5;c.w*=.6;c.b=(c.b|0)+1;}else{c.vy=0;c.vx*=.8;c.vz*=.8;c.w*=.8;}}return c;}
const MALE=/\b(cem|tolga|ahmet|emre|kerem|murat|male|erkek)\b/i,FEMALE=/\b(yelda|emel|filiz|seda|female|kadın|kadin)\b/i;
// Ses seçimi: önce Türkçe erkek ses; yoksa Türkçe ses ve kalınlaştırma
function voicePick(list){const tr=(list||[]).filter(v=>v&&/^tr/i.test(v.lang||''));const m=tr.find(v=>MALE.test(v.name||''));if(m)return {voice:m,male:true,pitch:.92};
 const n=tr.find(v=>!FEMALE.test(v.name||''))||tr[0]||null;return {voice:n,male:false,pitch:.56};}
const core=Object.freeze({VERSION,ROCK,rockStep,casingStep,voicePick});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;

// ---------- oyun ----------
const hooks={},stat={shots:0,casings:0,live:0,smoke:0,voice:null,male:false,peak:0};const rock={a:0,v:0},roll={a:0,v:0};let cas=null,aaAmmo=null,T=null;
function voice(){const p=voicePick(safe(()=>root.speechSynthesis.getVoices(),[]));stat.voice=p.voice?p.voice.name:null;stat.male=p.male;return p;}
root.trVoice=voice;
// ana top
function muzzle(){const a=safe(()=>P.th,0),el=safe(()=>root.gel(),0),ce=Math.cos(el),M=safe(()=>MZ,{tz:0,z:.5,d:6.4,y:1.95});const r=M.tz+M.z+M.d*ce;
 return {x:P.x+Math.sin(a)*r,y:safe(()=>hAt(P.x,P.z),0)+M.y+M.d*Math.sin(el),z:P.z+Math.cos(a)*r,dx:Math.sin(a)*ce,dy:Math.sin(el),dz:Math.cos(a)*ce};}
function gunBlast(){const fx=root.FXP||null,m=muzzle(),q=safe(()=>root.FXQ||1,1);stat.shots++;
 const rel=safe(()=>P.th-P.h,0);rock.v+=ROCK.kick*Math.cos(rel);roll.v+=ROCK.kick*.8*Math.sin(rel);stat.peak=Math.abs(rock.v)+Math.abs(roll.v);safe(()=>{P.rec=1;},null);safe(()=>{shake=Math.max(shake,.5);},null);
 if(fx&&fx.puff){const n=Math.round(26*q);
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2,s=2+Math.random()*3,ux=-m.dz,uz=m.dx;// halka: namlu doğrultusuna dik
   fx.puff(m.x+m.dx*1.2,m.y,m.z+m.dz*1.2,m.dx*(6+Math.random()*8)+ux*Math.cos(a)*s,Math.sin(a)*s*.7+.6,m.dz*(6+Math.random()*8)+uz*Math.cos(a)*s,3.5+Math.random()*2,1.6,8+Math.random()*5,0xf2efe8,0xa9a69e,.78,1.3);stat.smoke++;}
  for(let i=0;i<Math.round(14*q);i++)fx.puff(m.x+m.dx*(2+i*1.4),m.y,m.z+m.dz*(2+i*1.4),m.dx*16,.5,m.dz*16,2.4,1.2,6,0xffe2a0,0x8f8a82,.62,1.8);
  // toz: atışın basıncı tankın önünde yerden toz kaldırır
  const gy=safe(()=>hAt(m.x,m.z),0);for(let i=0;i<Math.round(16*q);i++){const a=Math.random()*Math.PI*2,d=3+Math.random()*5;fx.puff(P.x+m.dx*6+Math.cos(a)*d,gy+.4,P.z+m.dz*6+Math.sin(a)*d,Math.cos(a)*5,.8,Math.sin(a)*5,2.2,1.5,5,0xb3a27c,0xc9bb98,.42,1.4);}
  if(fx.glow)fx.glow(m.x+m.dx*1.5,m.y,m.z+m.dz*1.5,0,0,0,.12,2.5,7,0xffffff,0xffb050,.95);}
 boomSound();}
// ses: kısa sert patlama + derin gümbürtü + iki yankı
function boomSound(){const A=safe(()=>AC,null);if(!A)return;const out=safe(()=>MG,null)||A.destination,t=A.currentTime;
 const noise=(dur,f,v,dl)=>{const n=Math.floor(A.sampleRate*dur),b=A.createBuffer(1,n,A.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.2);
  const s=A.createBufferSource(),fl=A.createBiquadFilter(),g=A.createGain();s.buffer=b;fl.type='lowpass';fl.frequency.value=f;g.gain.value=v;s.connect(fl);fl.connect(g);g.connect(out);s.start(t+dl);};
 const low=(dl,v)=>{const o=A.createOscillator(),g=A.createGain();o.type='sine';o.frequency.setValueAtTime(70,t+dl);o.frequency.exponentialRampToValueAtTime(24,t+dl+.9);g.gain.setValueAtTime(v,t+dl);g.gain.exponentialRampToValueAtTime(.001,t+dl+1.1);o.connect(g);g.connect(out);o.start(t+dl);o.stop(t+dl+1.2);};
 noise(.35,5200,1.15,0);noise(1.4,700,1.0,0);low(0,1.1);noise(1.1,520,.32,.42);noise(1.2,400,.18,.95);}
// uçaksavar kovanları
function casBuild(){if(cas||!root.THREE||typeof S==='undefined')return;T=root.THREE;const g=new T.CylinderGeometry(.012,.012,.1,6);g.rotateZ(Math.PI/2);
 const m=new T.InstancedMesh(g,new T.MeshLambertMaterial({color:0xc9a344,emissive:0x2a1d00}),160);m.count=0;m.frustumCulled=false;m.name='AT_KOVAN';S.add(m);cas={m,list:[],o:new T.Object3D()};}
function ejectAA(n){casBuild();if(!cas)return;const U=safe(()=>P.g.userData,null),p=new (root.THREE.Vector3)();if(!U||!U.ae)return;U.ae.getWorldPosition(p);const yw=safe(()=>AA.yaw,P.th),rx=Math.cos(yw),rz=-Math.sin(yw);
 for(let i=0;i<n;i++){if(cas.list.length>=150)cas.list.shift();cas.list.push({x:p.x-Math.sin(yw)*.5,y:p.y-.05,z:p.z-Math.cos(yw)*.5,vx:rx*(2.4+Math.random()*1.4)+(Math.random()-.5),vy:1.8+Math.random()*1.4,vz:rz*(2.4+Math.random()*1.4)+(Math.random()-.5),r:Math.random()*6,w:18+Math.random()*14,t:0,b:0});stat.casings++;}
 const fx=root.FXP;if(fx&&fx.puff){const dx=Math.sin(yw),dz=Math.cos(yw);fx.puff(p.x+dx*1.9,p.y+.05,p.z+dz*1.9,dx*3,.5,dz*3,.9,.25,1.2,0xe8e4dc,0xb0aca4,.35,1.8);}}
function casStep(dt){if(!cas)return;const o=cas.o,L=cas.list;for(let i=L.length-1;i>=0;i--){const c=L[i];casingStep(c,dt,safe(()=>hAt(c.x,c.z),0));if(c.t>9)L.splice(i,1);}
 for(let i=0;i<L.length;i++){const c=L[i];o.position.set(c.x,c.y,c.z);o.rotation.set(0,c.r,c.r*.3);o.updateMatrix();cas.m.setMatrixAt(i,o.matrix);}cas.m.count=L.length;cas.m.instanceMatrix.needsUpdate=true;stat.live=L.length;}
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
function connect(){
 wrap('fire',old=>function(){const n0=safe(()=>shells.length,0);const r=old.apply(this,arguments);if(safe(()=>mode==='tank'&&!(root.AA&&AA.on)&&shells.length>n0,false))safe(gunBlast,null);return r;});
 wrap('update',old=>function(dt){const r=old.apply(this,arguments);const d=clamp(+dt||0,0,.1);
  safe(()=>{rockStep(rock,d);rockStep(roll,d);if(Math.abs(rock.a)>1e-4&&P.g)P.g.rotation.x+=rock.a;if(Math.abs(roll.a)>1e-4&&P.g)P.g.rotation.z+=roll.a;},null);
  safe(()=>{const a=root.AA&&AA.ammo;if(typeof a==='number'){if(aaAmmo!=null&&a<aaAmmo)ejectAA(Math.min(4,aaAmmo-a));aaAmmo=a;}},null);safe(()=>casStep(d),null);return r;});
 safe(()=>{if(root.speechSynthesis&&root.speechSynthesis.addEventListener&&!hooks.voices){hooks.voices=true;root.speechSynthesis.addEventListener('voiceschanged',()=>{voice();safe(()=>root.pickVoice(),null);});}},null);voice();safe(()=>root.pickVoice(),null);}
root.HisarAtis=Object.freeze({version:VERSION,core,connect,blast:()=>gunBlast(),eject:n=>ejectAA(n||1),diagnostics:()=>({version:VERSION,hooks:{...hooks},...stat,rock:{...rock},roll:{...roll}})});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
