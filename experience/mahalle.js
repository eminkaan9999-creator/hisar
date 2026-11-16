/* ÇELİK BÖRÜ mahalle 1.0 — kullanıcının gönderdiği 3B model (kerpiç ve taş evli eski mahalle) oyuna yerleşir.
 * Model 2 milyon üçgenden 56 bine indirildi (assets/mdl/mahalle.bin), 180 m'den uzakta 7 bin üçgenlik hafif sürümü çizilir (mahalle_uzak.bin).
 * - Suriye köylerinin ve Türkiye sınır köylerinin yanına, düz ve boş araziye birer eski mahalle konur; hepsi aynı geometriyi paylaşır.
 * - Evlerin oturduğu yerler dosyadaki 16×16 yükseklik ızgarasından siper dairesi olarak çıkarılır: tank duvardan geçemez, mermi duvarda durur,
 *   piyade ve düşman evlerin arkasına siper alır.
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.0.0';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
// ---------- çekirdek ----------
const SCALE=60,MIN_WALL=1.5,NEAR=180;
// Yükseklik ızgarasından engel daireleri (model birimi 1 = scale metre; ızgara değeri binde bir birim)
function blockers(grid,size,scale,minWall){const out=[],n=grid.n,cw=size[0]*scale/n,cd=size[2]*scale/n;for(let r=0;r<n;r++)for(let c=0;c<n;c++){const h=grid.h[r*n+c]/1000*scale;if(h<minWall)continue;
  out.push({x:(c+.5-n/2)*cw,z:(r+.5-n/2)*cd,r:Math.max(cw,cd)*.62,h});}return out;}
// Yerel noktayı yerleşim dönüşüyle dünyaya taşır (three.js rotation.y ile aynı yön)
function toWorld(p,site){const c=Math.cos(site.rot),s=Math.sin(site.rot);return {x:site.x+p.x*c+p.z*s,z:site.z-p.x*s+p.z*c};}
const core=Object.freeze({VERSION,SCALE,MIN_WALL,NEAR,blockers,toWorld});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;
// ---------- oyun ----------
const stat={state:'bekliyor',sites:0,tris:0,trisFar:0,blockers:0,error:null};let started=false,SITES=[];
const RV=x=>safe(()=>riv(x),120),WSZ=()=>safe(()=>WS,800);
function flat(x,z,half){let lo=1e9,hi=-1e9;for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const h=safe(()=>hAt(x+i*half,z+j*half),0);lo=Math.min(lo,h);hi=Math.max(hi,h);}return {lo,hi};}
function okSite(x,z,half){if(Math.abs(x)>WSZ()-half-20||Math.abs(z)>WSZ()-half-20)return false;if(Math.abs(z-RV(x))<half+70)return false;const f=flat(x,z,half);if(f.lo<.2||f.hi-f.lo>4)return false;
 for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++)if(safe(()=>roadNear(x+i*half/2,z+j*half/2,8),false))return false;
 if(safe(()=>BLD.some(b=>!b.dead&&Math.hypot(b.x-x,b.z-z)<b.r+half+5),false))return false;if(safe(()=>COV.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+half+5),false))return false;
 if(safe(()=>root.HisarField.positions().some(q=>Math.hypot(q.x-x,q.z-z)<half+22),false))return false;
 if(safe(()=>root.HisarHarekat.core.OPS.some(o=>Math.hypot(o.obj.x-x,o.obj.z-z)<half+70||Math.hypot(o.start.x-x,o.start.z-z)<half+40||(o.via||[]).some(v=>Math.hypot(v[0]-x,v[1]-z)<half+18)),false))return false;
 /* elektrik direği, park etmiş araç ve orman ağacı olan yere oturmaz (bahçe ağaçları ve kayalar yerleşince kaldırılır) */
 if(safe(()=>root.HisarCevre.poles().some(q=>Math.hypot(q.x-x,q.z-z)<half+4),false))return false;if(safe(()=>root.HisarSivil.cars().some(q=>Math.hypot(q.x-x,q.z-z)<half+4),false))return false;
 if(safe(()=>(root.TREES||[]).some(t=>t.st!==3&&Math.hypot(t.x-x,t.z-z)<half+3),false))return false;
 return !SITES.some(s=>Math.hypot(s.x-x,s.z-z)<half*3.2);}
function pickSites(half){const out=[];safe(()=>VILS.forEach((v,i)=>{const sy=v[1]>RV(v[0])+40,tr=v[1]<RV(v[0])-60;if(!sy&&!tr)return;if(tr&&SITES.filter(q=>!q.sy).length>=2)return;
  for(let k=0;k<120;k++){const a=(i*1.7+k*.61)%6.283,d=half+38+(k%8)*17,x=v[0]+Math.cos(a)*d,z=v[1]+Math.sin(a)*d;if((z>RV(x))!==sy)continue;if(okSite(x,z,half)){const s={x,z,rot:(i*1.3)%6.283,sy,y:flat(x,z,half*.6).lo-.25};SITES.push(s);out.push(s);break;}}}),null);return out;}
function place(T,M,hi,lo,mat,m,site){const g=new T.Group();g.position.set(site.x,site.y,site.z);g.rotation.y=site.rot;g.scale.setScalar(SCALE);g.name='MH_MAHALLE';S.add(g);M.prop(g,hi,lo,mat,{near:NEAR,max:2,key:'mahalle',receive:true});
 safe(()=>root.HisarArazi.clear(site.x,site.z,Math.max(m.size[0],m.size[2])*SCALE*.6),null);
 for(const b of blockers(m.grid,m.size,SCALE,MIN_WALL)){const w=toWorld(b,site);COV.push({x:w.x,z:w.z,r:b.r,h:b.h+1,mah:1});stat.blockers++;}}
async function start(){const M=root.HisarModel;if(started||!M||!root.THREE||typeof S==='undefined'||typeof COV==='undefined'||!safe(()=>BLD.some(b=>b.kind==='house'&&b.w),false))return;started=true;stat.state='yükleniyor';
 try{const T=root.THREE,[m,l]=await Promise.all([M.load('assets/mdl/mahalle.bin?v=1'),M.load('assets/mdl/mahalle_uzak.bin?v=1')]);if(!m.grid)throw new Error('mahalle.bin: yükseklik ızgarası yok');
  const hi=M.geometry(m),lo=M.geometry(l),mat=M.material(M.texture('assets/tex/mahalle_col.jpg?v=1'),{color:0xe6dccb});/* dokuyu oyunun sıcak toprak tonuna yaklaştır */
  const half=Math.max(m.size[0],m.size[2])*SCALE/2;for(const s of pickSites(half))place(T,M,hi,lo,mat,m,s);
  stat.sites=SITES.length;stat.tris=m.ni/3;stat.trisFar=l.ni/3;stat.state='hazır';safe(()=>root.buildGrid&&root.buildGrid(),null);}
 catch(e){stat.state='hata';stat.error=String(e&&e.message||e);}}
function connect(){start();if(!connect.w&&typeof root.update==='function'){connect.w=1;const old=root.update;root.update=function(){if(!started)start();return old.apply(this,arguments);};}}
root.HisarMahalle=Object.freeze({version:VERSION,core,connect,sites:()=>SITES.map(s=>({x:s.x,z:s.z,rot:s.rot,sy:s.sy,y:s.y})),diagnostics:()=>({version:VERSION,...stat})});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
