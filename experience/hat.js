/* ÇELİK BÖRÜ hat 1.0 — sınır hattı kullanıcının gönderdiği 3B modellerle görünür.
 * - Sınır duvarı: beton levha ve üstünde jiletli tel halkaları. Model bir duvar dilimidir (yaklaşık 6,8 m); duvar boyunca yan yana dizilir.
 *   Kameraya en yakın dilimler ayrıntılı örgüyle (assets/mdl/duvar.bin), sonrakiler hafif örgüyle (duvar_orta.bin), uzaktakiler modelin
 *   resmini taşıyan kartla (assets/tex/duvar_uzak.png) çizilir. Yerleşimi ve geçiş kuralını sinir.js yürütür.
 * - Gözetleme kuleleri: beton kule modeli (kule.bin) eski kutu kulelerin yerine geçer; vurulunca onlarla birlikte çöker. Nöbetçi kulenin dibinde durur.
 * - Sınır kapılarının yanında bekleyen küçük zırhlı araç (zirhli.bin; duvar modeliyle aynı dosyadan ayrıldı).
 * - Kirpi (kirpi.bin): devriye yolunda gezen araçlar, karakollarda park edenler ve görevde tankın arkasından gelen araç bu modeli giyer.
 * Her modelin yakın ve uzak sürümü vardır; kameraya en yakın birkaç tanesi ayrıntılı çizilir. Model gelmezse eski duvar ve kuleler kalır.
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.0.0';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
// ---------- çekirdek ----------
// Duvar: sc ölçek (model birimi → metre), ground modelde zeminin yüksekliği, band levhanın düzlemini bulmak için yükseklik aralığı,
// card kart resminin kapsadığı yükseklik aralığı (model birimi), levels düzeylerin uzaklık (m) ve sayı sınırları
const DUVAR=Object.freeze({sc:18,ground:-.018,band:Object.freeze([.02,.12]),card:Object.freeze([-.0541,.2579]),levels:Object.freeze([{r:45,max:6},{r:130,max:12},{r:1e9}])});
// Kule: r çarpışma yarıçapı (m), guard nöbetçinin kule ekseninden uzaklığı
const KULE=Object.freeze({sc:9,r:2.4,near:75,max:2,guard:3.6,gain:1.5});
// Zırhlı araç: off kapı ekseninden uzaklık, back duvardan içeri uzaklık, r/h siper dairesi
const ZIRHLI=Object.freeze({sc:19,off:22,back:5.3,r:2.3,h:2.4,near:60,max:2});
// Kirpi: gerçek ölçülere (7,1 × 2,9 m) oturması için eni ayrı ölçeklenir; modelin burnu +x'tedir, oyunda +z'ye döndürülür
const KIRPI=Object.freeze({sx:7.2,sy:7.2,sz:5.8,rot:-Math.PI/2,near:60,max:2});
// Levhanın düzlemi: y0..y1 aralığındaki köşelerin x ortancası
function slabX(pos,y0,y1){const xs=[];for(let i=0;i<pos.length;i+=3)if(pos[i+1]>=y0&&pos[i+1]<=y1)xs.push(pos[i]);xs.sort((a,b)=>a-b);return xs.length?xs[xs.length>>1]:0;}
// Kapı yanındaki zırhlı aracın yeri: kapının bir yanında (sırayla doğu, batı), duvarla devriye yolu arasında, burnu kapıya dönük. wz(x) duvarın z'si.
function gateSpot(f,i,wz,cfg){const s=i%2?-1:1,x=f+s*cfg.off;return {x,z:wz(x)-cfg.back,yaw:s>0?-Math.PI/2:Math.PI/2};}
const core=Object.freeze({VERSION,DUVAR,KULE,ZIRHLI,KIRPI,slabX,gateSpot});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;
// ---------- oyun ----------
const stat={state:'bekliyor',wall:false,towers:0,cars:0,kirpis:0,tris:{},errors:[]};let started=false;const READY={},QUEUE=[],TW=[];
const H=(x,z)=>safe(()=>hAt(x,z),0);
// Bir araç grubuna modelini giydirir; model henüz gelmediyse sıraya alır
function dress(g,kind){if(!g||g.userData.hat)return false;const f=READY[kind];if(!f){QUEUE.push([g,kind]);return false;}g.userData.hat=kind;f(g);return true;}
function ready(kind,f){READY[kind]=f;for(let i=QUEUE.length-1;i>=0;i--)if(QUEUE[i][1]===kind){const g=QUEUE[i][0];QUEUE.splice(i,1);dress(g,kind);}}
async function wall(M,tex){const [a,b]=await Promise.all([M.load('assets/mdl/duvar.bin?v=1'),M.load('assets/mdl/duvar_orta.bin?v=1')]),c=DUVAR,sx=slabX(a.pos,c.band[0],c.band[1]),len=a.size[2]*c.sc;
 for(const d of[a,b])M.core.move(d.pos,-sx,-c.ground,0,c.sc);const mat=M.material(tex),cmat=M.cardMaterial(M.texture('assets/tex/duvar_uzak.png?v=1',true));
 const lv=[{geo:M.geometry(a),mat},{geo:M.geometry(b),mat},{geo:M.geometry(M.core.wallCard(len,(c.card[0]-c.ground)*c.sc,(c.card[1]-c.ground)*c.sc)),mat:cmat,card:true}].map((q,i)=>Object.assign(q,c.levels[i]));
 stat.tris.duvar=[a.ni/3,b.ni/3,2];stat.wall=!!root.HisarSinir.wallModel(lv,{len,assign:M.core.assign});if(!stat.wall)throw new Error('sınır duvarı modeli almadı');}
async function towers(M){const T=root.THREE,[a,b]=await Promise.all([M.load('assets/mdl/kule.bin?v=1'),M.load('assets/mdl/kule_uzak.bin?v=1')]);for(const d of[a,b])M.core.move(d.pos,0,0,0,KULE.sc);
 const hi=M.geometry(a),lo=M.geometry(b),tex=M.texture('assets/tex/kule_col.jpg?v=1'),mat=M.material(tex,{gain:KULE.gain}),ruin=M.material(tex,{gain:.6}),zero=new T.Matrix4().makeScale(0,0,0);stat.tris.kule=[a.ni/3,b.ni/3];
 for(const bl of safe(()=>BLD,[])){if(bl.kind!=='kule'||!bl.parts||bl.hat)continue;bl.hat=1;for(const p of bl.parts)p.m.copy(zero);bl.sync();/* eski kutu kule çizilmez */
  const g=new T.Group();g.position.set(bl.x,H(bl.x,bl.z),bl.z);g.rotation.y=(bl.x*.37)%6.283;g.name='HT_KULE';S.add(g);TW.push({b:bl,g,p:M.prop(g,hi,lo,mat,{near:KULE.near,max:KULE.max,key:'kule'}),dead:false,mat,ruin});
  bl.r=KULE.r;bl.h=a.size[1]*KULE.sc;}
 stat.towers=TW.length;safe(()=>root.HisarSinir.towerGuards(KULE.guard),null);safe(()=>root.buildGrid&&root.buildGrid(),null);}
async function cars(M,tex){const T=root.THREE,[a,b]=await Promise.all([M.load('assets/mdl/zirhli.bin?v=1'),M.load('assets/mdl/zirhli_uzak.bin?v=1')]),ax=M.core.axis(a.pos,0,.12);
 for(const d of[a,b])M.core.move(d.pos,-ax.x,0,-ax.z,ZIRHLI.sc);const hi=M.geometry(a),lo=M.geometry(b),mat=M.material(tex),RV=x=>safe(()=>riv(x),120),wz=x=>root.HisarSinir.core.wallZ(RV,x);stat.tris.zirhli=[a.ni/3,b.ni/3];
 safe(()=>FORDS,[]).slice().sort((p,q)=>p-q).forEach((f,i)=>{const s=gateSpot(f,i,wz,ZIRHLI);if(safe(()=>BLD.some(q=>!q.dead&&Math.hypot(q.x-s.x,q.z-s.z)<q.r+ZIRHLI.r+.5),false))return;
  const g=new T.Group();g.position.set(s.x,H(s.x,s.z),s.z);g.rotation.y=s.yaw;g.name='HT_ZIRHLI';S.add(g);M.prop(g,hi,lo,mat,{near:ZIRHLI.near,max:ZIRHLI.max,key:'zirhli'});COV.push({x:s.x,z:s.z,r:ZIRHLI.r,h:ZIRHLI.h,hat:1});stat.cars++;});
 safe(()=>root.buildGrid&&root.buildGrid(),null);}
async function kirpi(M){const [a,b]=await Promise.all([M.load('assets/mdl/kirpi.bin?v=1'),M.load('assets/mdl/kirpi_uzak.bin?v=1')]),c=KIRPI;for(const d of[a,b]){M.core.move(d.pos,0,0,0,c.sx,c.sy,c.sz);M.core.scaleNormals(d.nor,c.sx,c.sy,c.sz);}
 const hi=M.geometry(a,{rotY:c.rot}),lo=M.geometry(b,{rotY:c.rot}),mat=M.material(M.texture('assets/tex/kirpi_col.jpg?v=1'));stat.tris.kirpi=[a.ni/3,b.ni/3];
 ready('kirpi',g=>{M.prop(g,hi,lo,mat,{near:c.near,max:c.max,key:'kirpi'});stat.kirpis++;});for(const g of safe(()=>root.HisarSinir.kirpis(),[]))dress(g,'kirpi');}
// Kule eski binasıyla birlikte çöker: yüksekliği ve yıkık rengi ondan alır
function frame(){for(const t of TW){const sy=t.b.g.scale.y;if(t.g.scale.y!==sy)t.g.scale.y=sy;const d=!!t.b.dead;if(d!==t.dead){t.dead=d;t.p.hi.material=t.p.lo.material=d?t.ruin:t.mat;}}}
async function start(){const M=root.HisarModel;if(started||!M||!root.THREE||typeof S==='undefined'||typeof COV==='undefined'||!root.HisarSinir||!safe(()=>root.HisarSinir.diagnostics().built,false))return;started=true;stat.state='yükleniyor';
 const tex=M.texture('assets/tex/hat_col.jpg?v=1'),run=(n,p)=>p.catch(e=>stat.errors.push(n+': '+String(e&&e.message||e)));
 await Promise.all([run('duvar',wall(M,tex)),run('kule',towers(M)),run('zırhlı',cars(M,tex)),run('kirpi',kirpi(M))]);stat.state=stat.errors.length?'hata':'hazır';}
function connect(){start();if(!connect.w&&typeof root.update==='function'){connect.w=1;const old=root.update;root.update=function(){if(!started)start();return old.apply(this,arguments);};}
 if(!connect.f&&typeof FRAME_HOOKS!=='undefined'){connect.f=1;FRAME_HOOKS.push(()=>safe(frame,null));}}
root.HisarHat=Object.freeze({version:VERSION,core,connect,dress,towers:()=>TW.map(t=>({x:t.b.x,z:t.b.z,dead:t.dead,sy:t.g.scale.y})),diagnostics:()=>({version:VERSION,...stat,errors:stat.errors.slice(),queued:QUEUE.length})});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
