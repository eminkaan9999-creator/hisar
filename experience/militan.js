/* ÇELİK BÖRÜ militan 1.0 — düşman piyadesi ve Mehmetçik kullanıcının gönderdiği 3B modellerle görünür.
 * Model belden yukarı üç silahlı figürdür (yüzü sarılı, AK tüfekli). Figürler ayrılıp küçültüldü (assets/mdl/militan1–3.bin); her düşman
 * piyadesinin gövdesi, başı, kolları ve tüfeği bu büstlerden biriyle değişir. Bacaklar oyunun eklemli iskeletinde kalır: yürüme, diz çökme
 * ve yatma hareketleri sürer, büst gövdeyle birlikte döner. Model yüklenemezse eski kodla kurulan piyade görünür.
 * Türk askeri modeli (kasklı, yelekli, tüfeği omuzda; assets/mdl/asker.bin) kemerden yukarı kesildi: sınır nöbetçileri, devriyeler ve tankın
 * önündeki piyade bu büstle çizilir (sinir.js figür kalabalığına örnekli olarak eklenir), pantolon kamuflajı modelin renklerine boyanır.
 * Her büstün iki sürümü vardır: kameraya en yakın birkaç figür ayrıntılı (yaklaşık 5 bin üçgen), ötekiler hafif (yaklaşık bin üçgen) çizilir.
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.0.0';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
// ---------- çekirdek ----------
// near: ayrıntılı büstün çizildiği uzaklık (m), max: aynı anda en çok kaç düşman ayrıntılı çizilir
const BUST=Object.freeze({n:3,scale:1.78,y:-.1,top:.85,near:40,max:4});
// Türk askeri: model kemer hizası (belt) iskeletin bel eklemine oturur; pantolon rengi modelin pantolonundan örneklendi ve büstün
// oyundaki tonuna indirildi (bacaklar gövdeden parlak durmasın)
// range/max: ayrıntılı büst uzaklığı ve en çok kişi; far: hafif büstün çizildiği en uzak mesafe
const ASKER=Object.freeze({scale:1.27,belt:.3,top:.85,range:45,max:8,far:170,palette:Object.freeze(['#4d2d16','#3a1c08','#260e02','#42240e','#75553a'])});
// Büstü baş eksenine ortalar: en üstteki köşelerin (başın) yatay ortası x=0,z=0 olur
function centre(pos,top){let hi=-1e9;for(let i=1;i<pos.length;i+=3)hi=Math.max(hi,pos[i]);let sx=0,sz=0,n=0;for(let i=0;i<pos.length;i+=3)if(pos[i+1]>hi*top){sx+=pos[i];sz+=pos[i+2];n++;}
 if(!n)return {x:0,z:0,h:hi};sx/=n;sz/=n;for(let i=0;i<pos.length;i+=3){pos[i]-=sx;pos[i+2]-=sz;}return {x:sx,z:sz,h:hi};}
// Hangi büst: piyadeye sırayla dağıtılır
const which=k=>((k%BUST.n)+BUST.n)%BUST.n;
const core=Object.freeze({VERSION,BUST,ASKER,centre,which});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;
// ---------- oyun ----------
const stat={state:'bekliyor',busts:0,applied:0,tris:[],trisFar:[],error:null,asker:'bekliyor',askerTris:0,askerTrisFar:0,askerError:null};let GEO=[],MAT=null,started=false,seq=0,wrapped=false;
function apply(g){const u=g&&g.userData;if(!u||!u.tor||!u.head||!u.rif||u.bust||!GEO.length)return false;
 const off=o=>{if(o)for(const c of o.children)if(c.isMesh&&c!==u.fl)c.visible=false;};off(u.tor);off(u.head);off(u.rif);for(const a of[u.R,u.Lf])if(a){off(a.ua);off(a.fa);}
 const q=GEO[which(seq++)],p=root.HisarModel.prop(u.tor,q.hi,q.lo,MAT,{at:g,near:BUST.near,max:BUST.max,key:'militan',gone:true});for(const m of[p.hi,p.lo]){m.scale.setScalar(BUST.scale);m.position.y=BUST.y;m.name='ML_BUST';}u.bust=p;stat.applied++;return true;}
function sweep(){for(const e of safe(()=>E,[]))if(e&&e.type==='inf'&&e.g)safe(()=>apply(e.g),null);}
function hook(){if(wrapped||typeof root.mkInf!=='function')return;wrapped=true;const old=root.mkInf;root.mkInf=function(){const g=old.apply(this,arguments);safe(()=>apply(g),null);return g;};}
async function start(){const M=root.HisarModel;if(started||!root.THREE||!M||typeof root.mkInf!=='function')return;started=true;stat.state='yükleniyor';
 try{const ds=await Promise.all([1,2,3].map(i=>Promise.all([M.load('assets/mdl/militan'+i+'.bin?v=1'),M.load('assets/mdl/militan'+i+'_uzak.bin?v=1')])));MAT=M.material(M.texture('assets/tex/militan_col.jpg?v=1'));
  /* ayrıntılı ve hafif sürüm aynı eksene oturur: ikisi de ayrıntılı sürümün baş eksenine göre kaydırılır */
  GEO=ds.map(([a,b])=>{const c=centre(a.pos,BUST.top);for(let i=0;i<b.pos.length;i+=3){b.pos[i]-=c.x;b.pos[i+2]-=c.z;}stat.tris.push(a.ni/3);stat.trisFar.push(b.ni/3);return {hi:M.geometry(a),lo:M.geometry(b)};});
  stat.busts=GEO.length;stat.state='hazır';hook();sweep();}
 catch(e){stat.state='hata';stat.error=String(e&&e.message||e);}
 // Türk askeri büstü: figür kalabalığına verilir
 try{stat.asker='yükleniyor';const [a,b]=await Promise.all([M.load('assets/mdl/asker.bin?v=1'),M.load('assets/mdl/asker_uzak.bin?v=1')]),c=centre(a.pos,ASKER.top);for(let i=0;i<b.pos.length;i+=3){b.pos[i]-=c.x;b.pos[i+2]-=c.z;}
  if(!root.HisarSinir.bust({geo:M.geometry(a),lo:M.geometry(b),mat:M.material(M.texture('assets/tex/asker_col.jpg?v=1')),s:ASKER.scale,y:-ASKER.belt*ASKER.scale,palette:ASKER.palette,range:ASKER.range,max:ASKER.max,far:ASKER.far}))throw new Error('figür kalabalığı büstü almadı');
  stat.askerTris=a.ni/3;stat.askerTrisFar=b.ni/3;stat.asker='hazır';}
 catch(e){stat.asker='hata';stat.askerError=String(e&&e.message||e);}}
function connect(){start();if(!connect.w&&typeof root.update==='function'){connect.w=1;const old=root.update;root.update=function(){if(!started)start();return old.apply(this,arguments);};}}
root.HisarMilitan=Object.freeze({version:VERSION,core,connect,diagnostics:()=>({version:VERSION,...stat})});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
