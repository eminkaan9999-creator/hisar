/* ÇELİK BÖRÜ harekât 1.0 — görev emriyle oynanan senaryolar (Türkiye–Suriye sınırı).
 * Her görevin bir başlangıç karakolu (senin bölgen), bir hedefi ve hedefe çizilen rotası vardır. Düşman kendi mevzisinde bekler,
 * oyuncuyu haritanın öbür ucundan kovalamaz; savunma görevinde düşman yalnız sınır kapısına yüklenir ve Türkiye'ye giremez.
 * - Sınır Kapısı Savunması: üç dalga taarruzu Taş Geçit'te durdur.
 * - Tel Zeytun Tepesi: sınırı geç, karakolu aş, tepedeki mevziyi temizle ve tepeyi tut.
 * - Kafr Sadun Deposu: gece baskını; gece görüşüyle köyün dışındaki düşman ikmal deposunu imha et. Gecede düşman daha yakından görür ve vurur.
 * - Umm Celal Bataryası: Taşlıdere köyünü döven düşman obüslerini bul ve sustur; batarya yaşadıkça köye mermi düşer.
 * Başlangıç karakolunda ikmal (cephane ve onarım) yapılır. Rastgele sandık, topçu ya da güvenli alan yoktur.
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.5.1',MODE='harekat',SAVE='celik-boru-harekat-v1';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;

// ---------- çekirdek (sınanabilir) ----------
// via: menüdeki küçük haritada çizilen yol; oyunda rota bulma gerçek yolu hesaplar.
const OPS=Object.freeze([
 Object.freeze({id:'gecit',n:'Sınır Kapısı Savunması',tur:'SAVUNMA',ford:70,start:{x:62,z:28,h:0},obj:{x:70,z:160,r:40,n:'Taş Geçit Sınır Kapısı'},
  emir:'Suriye tarafından Taş Geçit sınır kapısına zırhlı taarruz bekleniyor. Duvarın gerisindeki mevzine gir, üç dalgayı kapıya varmadan durdur.',
  waves:[{at:55,u:['apc','tank']},{at:30,u:['tank','apc','tank']},{at:30,u:['tank','tank','apc','tank']}],spawn:[[70,720],[30,700],[110,700]],
  phases:[{n:'Duvar gerisindeki mevzine gir',k:'reach',x:70,z:58,r:26},{n:'Üç dalgayı kapıya varmadan durdur',k:'final'}],
  via:[[62,28],[70,84],[70,160],[70,420],[70,720]]}),
 Object.freeze({id:'tepe',n:'Tel Zeytun Tepesi',tur:'TAARRUZ',ford:-560,start:{x:-548,z:20,h:0},obj:{x:-540,z:680,r:45,n:'Tel Zeytun Tepesi'},
  emir:'Batı Geçidi\'nden sınırı geç. Yol üstündeki düşman karakolunu aş, tepedeki tank mevzilerini temizle ve tepeyi tut.',
  outpost:{x:-588,z:290,u:['bunker','apc','inf','inf']},guard:{u:['tank','tank','tank','apc','kornet','inf','kornet'],r:58},qrf:{at:1,u:['tank','apc'],from:[-640,520]},
  phases:[{n:'Batı Geçidi\'ni geç',k:'reach',x:-560,z:178,r:30},{n:'Yol üstündeki düşman karakolunu temizle',k:'clear',x:-588,z:290,r:90},{n:'Tepeyi temizle ve 12 sn tut',k:'final'}],par:420,
  via:[[-548,20],[-560,90],[-560,170],[-600,300],[-610,420],[-560,560],[-540,680]]}),
 Object.freeze({id:'depo',n:'Kafr Sadun Deposu',tur:'GECE BASKINI',wx:'gece',ford:400,start:{x:392,z:40,h:0},obj:{x:430,z:480,r:60,n:'Kafr Sadun İkmal Deposu'},
  emir:'Karanlıkta, gece görüşüyle Söğüt Geçidi\'nden sınırı geç. Kafr Sadun\'un doğusundaki düşman ikmal deposunu (yakıt, kamyon, radar) imha et. Köyde sivil var: ateşine dikkat et.',
  depot:['fuel','fuel','truck','truck','radar'],guard:{u:['tank','tank','aa','kornet','inf','inf'],r:46},qrf:{at:1,u:['tank','apc'],from:[500,600]},
  phases:[{n:'Söğüt Geçidi\'ni geç',k:'reach',x:400,z:200,r:30},{n:'Depoyu 400 m\'den gözetle',k:'near',x:430,z:480,r:400},{n:'Depoyu imha et',k:'final'}],par:360,
  via:[[392,40],[400,108],[400,250],[400,400],[430,480]]}),
 Object.freeze({id:'batarya',n:'Umm Celal Bataryası',tur:'KARŞI BATARYA',ford:660,start:{x:650,z:30,h:0},obj:{x:690,z:640,r:55,n:'Umm Celal Topçu Bataryası'},
  emir:'Sınır ötesindeki düşman obüs bataryası Taşlıdere köyünü dövüyor. Doğu Geçidi\'nden geç, bataryayı tespit et ve sustur. Batarya ateşte kaldıkça köye mermi düşer.',
  battery:['arty','arty','arty'],guard:{u:['tank','apc','kornet','inf','aa'],r:62},qrf:{at:1,u:['tank','tank','apc'],from:[740,500]},shell:{x:480,z:20,n:'Taşlıdere',every:20,fly:6},
  phases:[{n:'Doğu Geçidi\'ni geç',k:'reach',x:660,z:185,r:30},{n:'Bataryayı 350 m\'den tespit et',k:'near',x:690,z:640,r:350},{n:'Üç obüsü sustur',k:'final'}],par:420,
  via:[[650,30],[660,100],[660,185],[650,360],[640,520],[690,640]]})]);
// zorluk: düşmanın yeniden dolum süresi (sn), isabet hasarı, dayanıklılık çarpanı
const TUNE=Object.freeze({kolay:{cd:6,dmg:12,hp:1.8},normal:{cd:4.6,dmg:18,hp:2.2},zor:{cd:3.4,dmg:26,hp:2.6},serbest:{cd:6,dmg:0,hp:1.8}});
const HOLD=12,QRF_STOP=170,FIRE_RANGE=360,SEEN=300,NIGHT=.6,LEASH=80,BASE_R=32;
// Ele geçirme: hedef çevresinde düşman kalmamışsa ve oyuncu içerideyse sayaç ilerler, çıkınca yavaşça geri iner.
function capture(c,dt,inside,clear){if(!clear)return Math.max(0,c-dt*.5);return inside?Math.min(HOLD,c+dt):Math.max(0,c-dt*.5);}
// Saldırı dalgaları: önceki dalga bitince bir sonrakinin sayacı başlar.
function waveDue(w,t){return t>=w.at;}
// Düşman duruş atışı: yürürken arada durur, ateş eder, yeniden yürür.
function halt(st,dt,rnd){st.t-=dt;if(st.t<=0){st.stop=!st.stop;st.t=st.stop?4+rnd()*2:10+rnd()*8;}return st.stop;}
// Hedef çevresinde savunma mevzileri: yaklaşma yönüne bakan yay üzerinde, eşit aralıklı.
// Ara hedef tamam mı: geçiş/yaklaşma noktasına varmak ya da bölgeyi temizlemek
function phaseDone(ph,p,enemies){if(!ph||ph.k==='final')return false;const d=Math.hypot(p.x-ph.x,p.z-ph.z);if(ph.k==='reach'||ph.k==='near')return d<ph.r;if(ph.k==='clear')return !enemies.some(e=>Math.hypot(e.x-ph.x,e.z-ph.z)<ph.r);return false;}
// Değerlendirme: görev tamam (1), tank sağlığı yarıdan fazla (2), hedef sürede bitti ya da dost kayıp yok (3)
function stars(o,r){let n=r.won?1:0;if(!n)return 0;if(r.hp>=.5)n++;if(o.par?r.t<=o.par:r.allies)n++;return n;}
// Düşman bataryası: susan her obüs atış aralığını uzatır; mermi köyün çevresine (35–90 m, sınırın aksi yönünde) düşer
function salvoGap(every,left,r){return left>0?every*(3/left)*(.8+r*.4):Infinity;}
function shellPoint(v,a,d){d=35+d*55;a=Math.PI*(1+a);return {x:v.x+Math.cos(a)*d,z:v.z+Math.sin(a)*d*.7};}
// Düşman tahmini: görev emrinde yazan kuvvet
const UNIT={tank:'T-72',apc:'BMP',inf:'piyade timi',kornet:'Kornet timi',aa:'uçaksavar',bunker:'sığınak',arty:'obüs',fuel:'yakıt tankeri',truck:'kamyon',radar:'radar'};
function forces(o){const c={};const add=t=>{c[t]=(c[t]||0)+1;};(o.outpost?o.outpost.u:[]).forEach(add);(o.guard?o.guard.u:[]).forEach(add);(o.depot||[]).forEach(add);(o.battery||[]).forEach(add);(o.qrf?o.qrf.u:[]).forEach(add);(o.waves||[]).forEach(w=>w.u.forEach(add));
 return Object.keys(UNIT).filter(k=>c[k]).map(k=>c[k]+' '+UNIT[k]).join(', ');}
function posts(o,from,n,r){const a=Math.atan2(from.x-o.x,from.z-o.z),out=[];for(let i=0;i<n;i++){const k=n>1?(i/(n-1)-.5)*1.6:0;out.push({x:o.x+Math.sin(a+k)*r,z:o.z+Math.cos(a+k)*r,h:a+k});}return out;}
const core=Object.freeze({VERSION,MODE,OPS,TUNE,HOLD,NIGHT,capture,waveDue,halt,posts,phaseDone,stars,forces,salvoGap,shellPoint});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;

// ---------- oyun ----------
const hooks={};let wx0=null,nv0=null,H=null,card=null,pick=null,beam=null,clock=0,saveError=false;
const rnd=Math.random,dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const record=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const load=()=>safe(()=>JSON.parse(root.localStorage.getItem(SAVE))||{},{});
function state(v){const s=Object.assign({mode:MODE,sel:'gecit'},record(v));s.done={...record(s.done)};s.stars={...record(s.stars)};
 if(s.mode!==MODE&&s.mode!=='savas')s.mode=MODE;if(!OPS.some(o=>o.id===s.sel))s.sel='gecit';
 for(const o of OPS){if(o.id in s.done)s.done[o.id]=s.done[o.id]===1||s.done[o.id]===true?1:0;
  if(o.id in s.stars)s.stars[o.id]=Number.isFinite(s.stars[o.id])?clamp(Math.floor(s.stars[o.id]),0,3):0;}return s;}
let ST=state(load());
// Preserve achievement maxima written by another tab before this write.
function store(v){const current=state(load()),next=state(v),s=Object.assign({},current,next,{done:{...current.done,...next.done},stars:{...current.stars,...next.stars}});
 for(const o of OPS)for(const k of ['done','stars'])if(o.id in current[k]||o.id in next[k])s[k][o.id]=Math.max(current[k][o.id]||0,next[k][o.id]||0);
 ST=s;try{root.localStorage.setItem(SAVE,JSON.stringify(s));saveError=false;return true;}catch(e){saveError=true;return false;}}
const picked=()=>ST.mode===MODE;
const op=()=>OPS.find(o=>o.id===ST.sel)||OPS[0];
const playing=()=>safe(()=>game==='play'&&mis===MODE,false);
function mk(type,x,z,o){const kornet=type==='kornet';if(kornet)type='inf';const tank=type==='tank';if(tank)root.BT_KIND='t72';const e=safe(()=>root.addE(type,x,z,{h:o.h||0}),null);root.BT_KIND=null;if(!e)return null;
 const tune=H.tune;e.hk=Object.assign({role:'def'},o);e.pr=1e6;e.fr=type==='apc'?220:type==='bunker'?160:FIRE_RANGE;e.bs=80;e.bl=4.5;
 if(tank){e.mx=safe(()=>HPT.tank,100)*tune.hp;e.nm='T-72';}else e.mx=safe(()=>HPT[type],80)*(type==='apc'?1.4:1);e.hp=e.mx;e.sn=e.hp;e.cd=2+rnd()*3;e.h=o.h||0;if(kornet){e.at=1;e.nm='KORNET';}
 if(H.op.wx==='gece'&&e.fr){e.fr=Math.round(e.fr*NIGHT);const close={inf:kornet?115:50,bunker:75,aa:95,arty:170,mgn:60};if(close[type])e.hkFireRange=Math.round(close[type]*NIGHT);}return e;}
function begin(){cleanup();const o=op(),key=safe(()=>lvKey,'normal'),tune=TUNE[key]||TUNE.normal;
 safe(()=>{L=Object.assign({},LV[key]||LV.normal,{sp:5,cd:tune.cd,dmg:tune.dmg,rl:3,ar:190});},null);
 sky(o.wx);H={op:o,tune,t:0,won:false,lost:false,wave:-1,waveT:0,cap:0,phase:'go',kills:0,sup:0,last:'',halts:new WeakMap(),post:null,ph:0,al0:safe(()=>AL.length,0)};
 P.x=o.start.x;P.z=o.start.z;P.h=o.start.h;P.th=o.start.h;P.v=P.w=0;safe(()=>{yaw=o.start.h;},null);
 safe(()=>{AL.forEach((a,i)=>{const s=i%2?1:-1,b=10+8*Math.floor(i/2),x=o.start.x+Math.cos(o.start.h)*s*11-Math.sin(o.start.h)*b,z=o.start.z-Math.sin(o.start.h)*s*11-Math.cos(o.start.h)*b;a.x=x;a.z=z;a.h=o.start.h;a.g.position.set(x,hAt(x,z),z);a.g.rotation.y=o.start.h;a.cmd='follow';a.fire=1;});},null);
 H.post=safe(()=>root.HisarSinir.posts().find(p=>p.f===o.ford),null);
 if(o.outpost){const q=o.outpost;q.u.forEach((t,i)=>{const x=q.x+(i?(i%2?1:-1)*(6+i*5):0),z=q.z-(i?7:0);mk(t,x,z,{role:'def',post:{x,z},h:Math.PI});});}
 if(o.guard){const g=o.guard,ps=posts(o.obj,o.start,g.u.length,g.r);g.u.forEach((t,i)=>{const p=ps[i];mk(t,p.x,p.z,{role:'def',post:p,h:p.h});});}
 if(o.battery){o.battery.forEach((t,i)=>{const x=o.obj.x+(i-1)*16,z=o.obj.z+8+Math.abs(i-1)*5;const e=mk(t,x,z,{role:'def',bat:1,post:{x,z},h:Math.PI});if(e)e.nm='OBÜS';});H.shT=8;H.inc=[];H.hits=0;}
 if(o.depot){o.depot.forEach((t,i)=>{const a=i/o.depot.length*Math.PI*2,x=o.obj.x+Math.cos(a)*18,z=o.obj.z+Math.sin(a)*14;const e=mk(t,x,z,{role:'dep',post:{x,z},h:a});if(e){e.park=1;e.fr=0;}});}
 buildBeam(o.obj);doc.body.classList.add('hk-active','hr-mission-active');safe(()=>{MI[MODE].t=o.n.toLocaleUpperCase('tr-TR');},null);if(card)card.hidden=false;
 navTo();
 safe(()=>root.radio('Komuta: '+o.emir),null);paint();}
function navTo(){if(!H)return;const o=H.op,ph=o.phases&&o.phases[H.ph],t=ph&&ph.k!=='final'?{x:ph.x,z:ph.z,n:ph.n}:{x:o.obj.x,z:o.obj.z,n:o.obj.n};safe(()=>root.startNav({x:t.x,z:t.z,n:t.n,id:'hk'}),null);}
// görev havası: gece görevinde gece ve gece görüşü açılır; görev bitince ya da menüye dönünce eski hava geri gelir
function sky(w){const nv=root.NVG||{};if(w){if(wx0==null){wx0=safe(()=>wx,'gunduz');nv0=nv.on||0;}if(w==='gece')nv.on=1;safe(()=>root.setW(w),null);/* kayıtlı hava tercihi değişmesin */safe(()=>{SV.wx=wx0;save();},null);}
 else if(wx0!=null){const b=wx0;wx0=null;nv.on=nv0;nv0=null;safe(()=>root.setW(b),null);}}
function cleanup(){sky(null);if(beam){safe(()=>{S.remove(beam);beam.traverse(m=>{if(m.geometry)m.geometry.dispose();if(m.material)m.material.dispose();});},null);beam=null;}
 if(H)doc.body.classList.remove('hr-mission-active');H=null;doc.body.classList.remove('hk-active');if(card)card.hidden=true;}
function buildBeam(o){if(!root.THREE)return;const T=root.THREE,g=new T.Group(),y=hAt(o.x,o.z);
 const col=new T.Mesh(new T.CylinderGeometry(1.4,1.4,70,12,1,true),new T.MeshBasicMaterial({color:0xffb030,transparent:true,opacity:.28,depthWrite:false,fog:false,side:T.DoubleSide}));col.position.y=35;
 const ring=new T.Mesh(new T.RingGeometry(o.r-1.2,o.r,64),new T.MeshBasicMaterial({color:0xffb030,transparent:true,opacity:.55,depthWrite:false,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.6;
 g.add(col,ring);g.position.set(o.x,y,o.z);g.name='HK_HEDEF';S.add(g);beam=g;}
// ---------- adım ----------
function enemies(){return safe(()=>E.filter(e=>e.hk&&e.hp>0),[]);}
function control(dt){if(!H)return;for(const e of enemies()){const k=e.hk;
  if(k.role==='def'){if(e.rt>0&&dist(e,k.post)>LEASH)e.rt=0;if(!(e.rt>0)){e.hd={x:k.post.x,z:k.post.z};e.hdT=1e9;e.hdV=1e9;}}
  else if(k.role==='qrf'){if(!(clock<k.next)){k.path=safe(()=>root.astar(e.x,e.z,P.x,P.z),null)||[[e.x,e.z],[P.x,P.z]];k.i=1;k.next=clock+8;}const w=k.path[k.i];
   if(w&&Math.hypot(w[0]-e.x,w[1]-e.z)<10&&k.i<k.path.length-1)k.i++;const stop=!w||dist(e,P)<Math.min(QRF_STOP,(e.fr||FIRE_RANGE)*.8);e.hd=stop?{x:e.x,z:e.z}:{x:w[0],z:w[1]};e.hdT=1e9;e.hdV=1e9;e.rt=0;}
  else if(k.role==='att'){const w=k.path&&k.path[k.i];if(!w){e.hd={x:e.x,z:e.z};e.hdT=1e9;e.hdV=1e9;continue;}
   if(Math.hypot(w[0]-e.x,w[1]-e.z)<10&&k.i<k.path.length-1)k.i++;let st=H.halts.get(e);if(!st){st={t:8+rnd()*6,stop:false};H.halts.set(e,st);}
   const near=Math.min(dist(e,P),...safe(()=>AL.filter(a=>!a.dead).map(a=>dist(e,a)),[]),1e9)<FIRE_RANGE;const stop=near&&halt(st,dt,rnd);
   e.hd=stop?{x:e.x,z:e.z}:{x:w[0],z:w[1]};e.hdT=1e9;e.hdV=1e9;e.rt=0;}}}
// Karşı taarruz: oyuncu sınırı geçince düşman yedeği (tank ve BMP) mevzisinden çıkıp oyuncunun üstüne yürür
function spawnQRF(q){H.qrfOn=true;q.u.forEach((t,i)=>{const x=q.from[0]+(i-(q.u.length-1)/2)*14,z=q.from[1]+(i%2)*10;const e=mk(t,x,z,{role:'qrf',i:1,h:Math.PI});if(e)e.cd=3+rnd()*3;});
 const n=c=>q.u.filter(t=>t===c).length,parts=[n('tank')?n('tank')+' T-72':'',n('apc')?n('apc')+' BMP':''].filter(Boolean).join(' ve ');
 safe(()=>root.radio('Komuta: Düşman karşı taarruzu! '+parts+' güneyden üstünüze geliyor. Mevzi alın, topla karşılayın.'),null);safe(()=>root.say('KARŞI TAARRUZ',1.8),null);}
function spawnWave(w){const o=H.op,gate={x:o.ford,z:safe(()=>riv(o.ford),110)+40};w.u.forEach((t,i)=>{const s=o.spawn[i%o.spawn.length],x=s[0]+(rnd()-.5)*20,z=s[1]+(rnd()-.5)*20;
  const path=safe(()=>root.astar(x,z,gate.x,gate.z),null)||[[x,z],[gate.x,gate.z]];const e=mk(t,x,z,{role:'att',path,i:1,h:Math.PI});if(e){e.cd=4+rnd()*3;}});
 H.waveLeft=w.u.length;safe(()=>root.radio('Komuta: '+(H.wave+1)+'. dalga sınıra yaklaşıyor! '+w.u.length+' araç.'),null);}
function step(dt){if(!H||H.won||H.lost)return;H.t+=dt;clock+=dt;const o=H.op;let en=enemies();
 // ara hedefler: sırayla; biri tamamlanınca rota bir sonrakine döner
 const ph=o.phases&&o.phases[H.ph];if(phaseDone(ph,P,en)){H.ph++;const nx=o.phases[H.ph];safe(()=>root.radio('Komuta: Ara hedef tamam: '+ph.n+'.'+(nx?' Sıradaki: '+nx.n+'.':'')),null);safe(()=>root.say('ARA HEDEF TAMAM',1.6),null);navTo();}
 if(o.qrf&&!H.qrfOn&&H.ph>=o.qrf.at){spawnQRF(o.qrf);en=enemies();}
 const final=!!(o.phases&&o.phases[H.ph]&&o.phases[H.ph].k==='final');
 if(o.waves){let att=en.filter(e=>e.hk.role==='att');
  if(H.wave<0||(att.length===0&&H.wave<o.waves.length)){if(H.wave<o.waves.length-1||H.wave<0){H.waveT+=dt;const nx=o.waves[H.wave+1];if(nx&&waveDue(nx,H.waveT)){H.wave++;H.waveT=0;spawnWave(nx);en=enemies();att=en.filter(e=>e.hk.role==='att');}}}
  const gate={x:o.ford,z:safe(()=>riv(o.ford),110)+40};if(att.some(e=>dist(e,gate)<40))return lose('Düşman sınır kapısına dayandı.');
  if(final&&H.wave>=o.waves.length-1&&att.length===0&&H.wave>=0)return win('Taş Geçit tutuldu. Taarruz sınırda durduruldu.');}
 if(o.guard&&!o.depot&&!o.battery){const near=en.filter(e=>dist(e,o.obj)<200).length,inside=dist(P,o.obj)<o.obj.r;H.cap=capture(H.cap,dt,final&&inside,final&&near===0);if(H.cap>=HOLD)return win(o.obj.n+' ele geçirildi.');}
 if(o.battery){const guns=en.filter(e=>e.hk.bat);H.batLeft=guns.length;if(final&&!guns.length)return win('Batarya susturuldu. '+o.shell.n+'\'ye ateş kesildi.');shelling(dt,o,guns);}
 if(o.depot){const left=en.filter(e=>e.hk.role==='dep').length;H.depLeft=left;if(final&&left===0)return win('Kafr Sadun deposu imha edildi.');}
 // başlangıç karakolunda ikmal
 const base=H.post?H.post.door:o.start;if(dist(P,base)<BASE_R){H.sup+=dt;if(H.sup>1){H.sup=0;let did=false;safe(()=>{if(ammo<AMX()){ammo++;did=true;}if(TA&&TA0)for(let i=0;i<TA.length;i++)if(TA[i]<TA0[i]){TA[i]++;did=true;}if(P.hp<P.mx){P.hp=Math.min(P.mx,P.hp+4);did=true;}},null);
   if(did&&H.last!=='sup'){H.last='sup';safe(()=>root.say('KARAKOLDA İKMAL',1.5),null);}}}else if(H.last==='sup')H.last='';
 // düşman piyadesi mevzisinden 35 m'den fazla uzaklaşmaz (oyuncuyu haritada kovalamaz)
 for(const e of en)if(e.type==='inf'&&e.hk.post){const dx=e.x-e.hk.post.x,dz=e.z-e.hk.post.z,d=Math.hypot(dx,dz);if(d>35){e.x=e.hk.post.x+dx/d*35;e.z=e.hk.post.z+dz/d*35;}}
 if((H.paintT=(H.paintT||0)+dt)>.25){H.paintT=0;paint();}}
// Batarya köyü döver: atış sesi bataryadan gelir, mermi uçuştan sonra köyün çevresine düşer
function shelling(dt,o,guns){H.shT-=dt;if(guns.length&&H.shT<=0){const g=guns[Math.floor(rnd()*guns.length)];H.shT=salvoGap(o.shell.every,guns.length,rnd());safe(()=>root.sndBoom(g.x,g.z),null);
  H.inc.push(Object.assign({t:o.shell.fly},shellPoint(o.shell,rnd(),rnd())));if(H.hits%3===0)safe(()=>root.radio('Karakol: '+o.shell.n+'\'ye topçu mermisi düşüyor! Bataryayı susturun!'),null);}
 for(const q of H.inc){q.t-=dt;if(q.t<=0){q.done=1;H.hits++;safe(()=>root.bigBoom(q.x,q.z,5),null);}}H.inc=H.inc.filter(q=>!q.done);}
function win(t){if(!H)return;H.won=true;const o=H.op,n=stars(o,{won:true,hp:safe(()=>P.hp/P.mx,1),t:H.t,allies:safe(()=>AL.filter(a=>!a.dead).length,0)>=H.al0});H.stars=n;H.ph=o.phases.length;
 ST.done[o.id]=1;ST.stars[o.id]=Math.max(ST.stars[o.id]||0,n);const saved=store(ST);safe(()=>root.stopNav(),null);safe(()=>root.endGame(1,t+' '+'★'.repeat(n)+'☆'.repeat(3-n)),null);
 if(!saved)safe(()=>root.say('Görev tamamlandı; kayıt yazılamadı. Cihaz depolamasını kontrol et.',4),null);}
function lose(t){if(!H)return;H.lost=true;safe(()=>root.stopNav(),null);safe(()=>root.endGame(0,t),null);}
// ---------- görev kartı (oyunda) ----------
function paint(){if(!card||!H)return;const o=H.op,[s,p,pr,sm,ol]=card.children;paintPhases(ol);const d=Math.round(dist(P,o.obj));s.textContent=o.tur+' · '+o.n.toLocaleUpperCase('tr-TR');
 if(o.waves){const att=enemies().filter(e=>e.hk.role==='att').length;if(att){p.textContent=(H.wave+1)+'. dalga: '+att+' araç kapıya ilerliyor';pr.value=1-att/Math.max(1,H.waveLeft||att);}
  else{const nx=o.waves[H.wave+1];p.textContent=nx?'Mevzine gir · '+(H.wave+2)+'. dalga '+Math.max(0,Math.ceil(nx.at-H.waveT))+' sn':'Bölgeyi tut';pr.value=nx?H.waveT/nx.at:1;}
  sm.textContent='Dalga '+Math.max(0,H.wave+1)+'/'+o.waves.length+' · kapıya '+Math.round(dist(P,o.obj))+' m';}
  const cph=o.phases&&o.phases[H.ph];if(cph&&cph.k!=='final'&&!o.waves){p.textContent=cph.n;pr.value=H.ph/(o.phases.length-1);sm.textContent='Ara hedef '+Math.round(Math.hypot(P.x-cph.x,P.z-cph.z))+' m · son hedef '+d+' m'+(o.battery?' · köye düşen '+(H.hits||0):'');}
 else if(o.battery){p.textContent='Bataryayı sustur · '+(H.batLeft??o.battery.length)+' obüs ateşte';pr.value=1-(H.batLeft??o.battery.length)/o.battery.length;sm.textContent='Hedef '+d+' m · köye düşen '+(H.hits||0)+' mermi';}
 else if(o.depot){p.textContent='Depoyu imha et · '+(H.depLeft??o.depot.length)+' hedef kaldı';pr.value=1-(H.depLeft??o.depot.length)/o.depot.length;sm.textContent='Hedef '+d+' m';}
 else if(!o.waves){const near=enemies().filter(e=>dist(e,o.obj)<200).length;p.textContent=near?'Tepedeki mevzileri temizle · '+near+' düşman':H.cap>0?'Tepeyi tut · '+Math.ceil(HOLD-H.cap)+' sn':'Tepeye çık';pr.value=near?0:H.cap/HOLD;sm.textContent='Hedef '+d+' m';}}
function paintPhases(ol){if(!ol||!H)return;const o=H.op,ph=o.phases||[];if(ol.childElementCount!==ph.length){ol.replaceChildren(...ph.map(q=>{const li=doc.createElement('li');li.textContent=q.n;return li;}));}
 [...ol.children].forEach((li,i)=>{li.className=i<H.ph?'ok':i===H.ph?'cur':'';});}
// ---------- menü: harekât seçimi ----------
function previewDraw(c,o,big){const g=c.getContext('2d'),W=c.width,Hh=c.height,ws=safe(()=>WS,800),xs=o.via.map(p=>p[0]),zs=o.via.map(p=>p[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cz=(Math.min(...zs)+Math.max(...zs))/2,
  span=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...zs)-Math.min(...zs))*.62+90,k=W/(span*2),X=x=>(x-cx+span)*k,Z=z=>(z-cz+span)*k;
 const gr=g.createLinearGradient(0,0,0,Hh);gr.addColorStop(0,'#26301f');gr.addColorStop(1,'#2e2a1e');g.fillStyle=gr;g.fillRect(0,0,W,Hh);
 // topoğrafik harita görüntüsü (oyundaki harita ile aynı)
 safe(()=>{const bm=BM,kk=bm.width/(2*ws);g.drawImage(bm,(cx-span+ws)*kk,(cz-span+ws)*kk,span*2*kk,span*2*kk,0,0,W,Hh);g.fillStyle='rgba(0,0,0,.08)';g.fillRect(0,0,W,Hh);},null);
 g.strokeStyle='rgba(255,255,255,.06)';g.lineWidth=1;for(let i=1;i<8;i++){g.beginPath();g.moveTo(i*W/8,0);g.lineTo(i*W/8,Hh);g.moveTo(0,i*Hh/8);g.lineTo(W,i*Hh/8);g.stroke();}
 g.strokeStyle='#3d7fb8';g.lineWidth=3;g.beginPath();for(let x=-ws;x<=ws;x+=10){const y=safe(()=>riv(x),120);x===-ws?g.moveTo(X(x),Z(y)):g.lineTo(X(x),Z(y));}g.stroke();
 g.strokeStyle='#e5463a';g.lineWidth=1.5;g.setLineDash([4,3]);g.beginPath();for(let x=-ws;x<=ws;x+=10){const y=safe(()=>riv(x),120)-26;x===-ws?g.moveTo(X(x),Z(y)):g.lineTo(X(x),Z(y));}g.stroke();g.setLineDash([]);
 g.fillStyle='rgba(40,38,34,.75)';safe(()=>BLD.forEach(b=>{if(b.parts)g.fillRect(X(b.x)-1.5,Z(b.z)-1.5,3,3);}),null);g.font='800 13px system-ui';g.fillStyle='rgba(160,30,24,.85)';g.textAlign='center';g.fillText('TÜRKİYE',W/2,Z(safe(()=>riv(cx),120)-60));g.fillText('SURİYE',W/2,Z(safe(()=>riv(cx),120)+70));
g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=5;g.beginPath();o.via.forEach((p,i)=>i?g.lineTo(X(p[0]),Z(p[1])):g.moveTo(X(p[0]),Z(p[1])));g.stroke();
 g.strokeStyle='#ffc247';g.lineWidth=2.5;g.beginPath();o.via.forEach((p,i)=>i?g.lineTo(X(p[0]),Z(p[1])):g.moveTo(X(p[0]),Z(p[1])));g.stroke();
 g.fillStyle='#8fd14f';g.beginPath();g.arc(X(o.start.x),Z(o.start.z),4.5,0,7);g.fill();
 if(big){const ds=[];if(o.outpost)ds.push(o.outpost);if(o.guard)posts(o.obj,o.start,o.guard.u.length,o.guard.r).forEach(q=>ds.push(q));if(o.waves)o.spawn.forEach(q=>ds.push({x:q[0],z:q[1]}));if(o.battery)ds.push({x:o.obj.x,z:o.obj.z+8});
  g.fillStyle='#e5463a';g.strokeStyle='#2a0806';g.lineWidth=1.5;for(const q of ds){const x=X(q.x),y=Z(q.z);g.beginPath();g.moveTo(x,y-7);g.lineTo(x+6,y);g.lineTo(x,y+7);g.lineTo(x-6,y);g.closePath();g.fill();g.stroke();}
   if(o.shell){const x=X(o.shell.x),y=Z(o.shell.z);g.strokeStyle='#ff8a2a';g.lineWidth=2;for(const r of[7,12]){g.beginPath();g.arc(x,y,r,0,7);g.stroke();}}
  g.font='800 14px system-ui';g.textAlign='center';g.textBaseline='middle';(o.phases||[]).forEach((q,i)=>{if(q.k==='final')return;const x=X(q.x),y=Z(q.z);g.fillStyle='#fff';g.beginPath();g.arc(x,y,10,0,7);g.fill();g.fillStyle='#111';g.fillText(String(i+1),x,y+1);});g.textBaseline='alphabetic';}
 g.strokeStyle='#ffc247';g.lineWidth=2;g.beginPath();g.arc(X(o.obj.x),Z(o.obj.z),6,0,7);g.stroke();g.fillStyle='#ffc247';g.beginPath();g.arc(X(o.obj.x),Z(o.obj.z),2.2,0,7);g.fill();}
function routeKm(o){let s=0;for(let i=1;i<o.via.length;i++)s+=Math.hypot(o.via[i][0]-o.via[i-1][0],o.via[i][1]-o.via[i-1][1]);return (s/1000).toFixed(1).replace('.',',')+' km';}
function paintMenu(){const tg=doc.getElementById('tg'),bt=doc.getElementById('btCard');if(!tg)return;let seg=doc.getElementById('hkMode'),box=doc.getElementById('hkCard');
 const el=(tag,cls,text)=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
 if(!seg){seg=el('div');seg.id='hkMode';seg.setAttribute('role','group');seg.setAttribute('aria-label','Oyun türü');for(const [k,t,s] of [[MODE,'HAREKÂT','Görev emriyle'],['savas','SON TAKIM','Serbest savaş']]){const b=el('button');b.type='button';b.dataset.hm=k;b.append(el('b',null,t),el('small',null,s));seg.appendChild(b);}
  tg.insertBefore(seg,tg.firstChild);seg.onclick=e=>{const b=e.target.closest('[data-hm]');if(!b)return;ST.mode=b.dataset.hm;store(ST);safe(()=>root.setG(ST.mode),null);paintMenu();};}
 if(!box){box=el('div');box.id='hkCard';tg.insertBefore(box,seg.nextSibling);box.onclick=e=>{const b=e.target.closest('[data-op]');if(!b)return;ST.sel=b.dataset.op;store(ST);paintMenu();};}
 seg.dataset.m=ST.mode;for(const b of seg.children){const on=b.dataset.hm===ST.mode;b.classList.toggle('sel',on);b.setAttribute('aria-pressed',String(on));}
 box.hidden=!picked();if(bt)bt.style.display=picked()?'none':'';if(!picked())return;
 box.replaceChildren();for(const o of OPS){const b=el('button','hk-op'+(o.id===ST.sel?' sel':''));b.type='button';b.dataset.op=o.id;b.setAttribute('aria-pressed',String(o.id===ST.sel));
  const cv=el('canvas');cv.width=176;cv.height=176;previewDraw(cv,o);const tx=el('div','hk-tx');const top=el('div','hk-top');top.append(el('span','hk-tur',o.tur));if(ST.done[o.id])top.append(el('span','hk-st','★'.repeat(ST.stars[o.id]||1)+'☆'.repeat(3-(ST.stars[o.id]||1))));
  tx.append(top,el('b',null,o.n),el('p',null,o.emir),el('small',null,'Rota '+routeKm(o)));b.append(cv,tx);box.appendChild(b);}
 if(picked())safe(()=>{if(mis!==MODE&&!safe(()=>TUT.on,false))root.setG(MODE);},null);}
function installUI(){if(!doc.body||card)return;const st=doc.createElement('style');st.id='hk-style';st.textContent=`
#hkMode{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:0;padding:3px;margin:0 0 10px;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.08);border-radius:12px;isolation:isolate}
#hkMode::before{content:'';position:absolute;z-index:-1;top:3px;bottom:3px;left:3px;width:calc(50% - 3px);border-radius:9px;background:#f4f2ec;box-shadow:0 6px 18px rgba(0,0,0,.35);transition:transform .32s cubic-bezier(.3,1.25,.4,1)}
#hkMode[data-m=savas]::before{transform:translateX(100%)}
#hkMode button{min-height:54px;margin:0;border:0;border-radius:9px;background:none!important;color:#a7afb8;transition:color .25s,transform .12s;-webkit-text-fill-color:currentColor;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;touch-action:manipulation}
#hkMode b{font:800 17px/1 var(--sf,system-ui);letter-spacing:.08em}#hkMode small{font:600 11.5px/1 var(--sf,system-ui);letter-spacing:.04em;opacity:.8}
#hkMode button.sel{color:#121311}#hkMode button:active{transform:scale(.96)}
#hkCard{display:flex;flex-direction:column;gap:8px}#hkCard[hidden]{display:none!important}
.hk-op{display:grid;grid-template-columns:88px 1fr;gap:12px;align-items:stretch;width:100%;margin:0;padding:8px;text-align:left;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(26,27,25,.92),rgba(14,15,14,.95));color:#e8ece2;-webkit-text-fill-color:currentColor;cursor:pointer;touch-action:manipulation}
.hk-op{transition:transform .16s ease,border-color .25s,box-shadow .25s,background .25s}.hk-op:active{transform:scale(.985)}
#hkCard.hk-anim .hk-op{animation:hkIn .5s cubic-bezier(.2,.85,.25,1) both}#hkCard.hk-anim .hk-op:nth-child(2){animation-delay:.07s}#hkCard.hk-anim .hk-op:nth-child(3){animation-delay:.14s}#hkCard.hk-anim .hk-op:nth-child(4){animation-delay:.21s}
@keyframes hkIn{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}
.hk-op.sel canvas{box-shadow:0 0 0 2px #d0172b}
@media (prefers-reduced-motion:reduce){#hkCard.hk-anim .hk-op{animation:none}#hkMode::before{transition:none}}
 @media (orientation:landscape) and (max-height:520px){html #hkCard .hk-op{grid-template-columns:60px 1fr!important;gap:10px!important;padding:6px 8px!important;min-height:0!important}html #hkCard .hk-op canvas{width:60px!important;height:60px!important}html #hkCard .hk-op p{display:none!important}html #hkCard .hk-op b{font-size:15px!important}html #hkCard{gap:6px!important}}
.hk-op canvas{width:88px;height:88px;border-radius:9px;border:1px solid rgba(255,255,255,.1)}
.hk-op.sel{border-color:rgba(255,255,255,.85);box-shadow:inset 3px 0 0 #d0172b,0 10px 26px rgba(0,0,0,.4);background:linear-gradient(180deg,rgba(40,41,38,.96),rgba(20,21,19,.97))}
.hk-tx{min-width:0;display:flex;flex-direction:column;gap:4px}.hk-top{display:flex;gap:6px;align-items:center}
.hk-tur{padding:3px 7px;border-radius:4px;background:#d0172b;color:#fff;font:800 10.5px/1 var(--sf,system-ui);letter-spacing:.12em}
.hk-ok{padding:3px 7px;border-radius:6px;background:rgba(132,198,60,.16);color:#9fd860;font:700 10.5px/1 var(--sf,system-ui);letter-spacing:.06em}
.hk-op b{font:800 17px/1.1 var(--sf,system-ui);letter-spacing:.02em}.hk-op p{margin:0;font:400 12.5px/1.3 var(--sf,system-ui);color:#aab3a2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.hk-op small{margin-top:auto;font:700 11.5px/1 var(--sf,system-ui);letter-spacing:.05em;color:#c9d0bf}
#hk-obj{position:fixed;left:calc(env(safe-area-inset-left,0px) + 12px);top:max(96px,env(safe-area-inset-top));z-index:14;width:min(300px,calc(100vw - 24px));margin:0;padding:0 10px 8px;pointer-events:none;box-sizing:border-box;background:rgba(18,21,16,.86);color:#f3f5ec;border:1px solid rgba(255,255,255,.1);border-left:3px solid #ffc247;border-radius:6px}
#hk-obj[hidden]{display:none!important}#hk-obj strong{display:block;margin:0 -10px 6px;padding:6px 10px;background:rgba(0,0,0,.35);font:800 12.5px/1 var(--sf,system-ui);letter-spacing:.08em;color:#ffc247}
#hk-obj p{margin:0 0 6px;font:700 15px/1.2 var(--sf,system-ui)}#hk-obj progress{display:block;width:100%;height:6px;accent-color:#ffc247}#hk-obj small{display:block;margin-top:5px;font:700 12.5px/1 var(--sf,system-ui);color:#c3c9b8}
#hk-obj ol{margin:7px 0 0;padding:0 0 0 18px;font:600 12px/1.35 var(--sf,system-ui);color:#9ea596}#hk-obj ol li.ok{color:#8fd14f;text-decoration:line-through}#hk-obj ol li.cur{color:#fff;font-weight:800}
body:not(.inplay) #hk-obj{display:none}
@media (orientation:landscape){html body.hk-active #radio#radio,html body.hk-active #msg#msg{left:calc(env(safe-area-inset-left,0px) + 326px)!important;right:auto!important;transform:none!important;text-align:left!important;width:auto!important;max-width:calc(100vw - 560px)!important}}
#hk-brief{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 12px) calc(env(safe-area-inset-right,0px) + 14px) calc(env(safe-area-inset-bottom,0px) + 12px) calc(env(safe-area-inset-left,0px) + 14px);box-sizing:border-box;background:linear-gradient(180deg,#121411,#0b0c0b);color:#ecefe6;animation:hkBr .35s cubic-bezier(.2,.85,.25,1)}
#hk-brief[hidden]{display:none}@keyframes hkBr{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
#hk-brief header{display:flex;align-items:center;gap:10px;flex-wrap:wrap}#hk-brief h2{margin:0;font:800 15px/1 var(--sf,system-ui);letter-spacing:.16em;color:#b9bdb2}#hk-brief header b{font:800 20px/1.1 var(--sf,system-ui)}
.hk-bbody{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:14px}.hk-bbody canvas{width:100%;height:100%;max-height:100%;object-fit:contain;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:#26301f;min-height:0}
.hk-bt{overflow:auto;display:flex;flex-direction:column;gap:10px}.hk-bs h3{margin:0 0 4px;font:800 12px/1 var(--sf,system-ui);letter-spacing:.14em;color:#d0172b}.hk-bs p,.hk-bs ol{margin:0;font:500 14px/1.4 var(--sf,system-ui);color:#d9ddd2}.hk-bs ol{padding-left:20px}
.hk-bb{display:flex;gap:10px;justify-content:flex-end}.hk-bb button{min-height:50px;padding:0 22px;border-radius:12px;font:800 16px/1 var(--sf,system-ui);letter-spacing:.08em;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#e8ece2;-webkit-text-fill-color:currentColor;touch-action:manipulation}
.hk-bb .hk-go{background:linear-gradient(180deg,#d0172b,#9b0f1f);border-color:transparent;color:#fff;min-width:200px}.hk-bb button:active{transform:scale(.97)}
@media (orientation:portrait){.hk-bbody{grid-template-columns:1fr;grid-template-rows:minmax(0,42%) minmax(0,1fr)}}
.hk-st{color:#ffc247;font:800 12px/1 var(--sf,system-ui);letter-spacing:.1em}`;doc.head.appendChild(st);
 card=doc.createElement('section');card.id='hk-obj';card.hidden=true;for(const t of ['strong','p','progress','small','ol'])card.appendChild(doc.createElement(t));card.children[2].max=1;doc.body.appendChild(card);paintMenu();}
// ---------- görev emri ekranı: BAŞLAT'a basınca harita, durum, görev, icra ve destek; GÖREVE ÇIK ile başlar ----------
let briefOK=false,brief=null;
function showBrief(){const o=op(),el=(t,c,x)=>{const e=doc.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};if(!brief){brief=el('section');brief.id='hk-brief';doc.body.appendChild(brief);}
 brief.replaceChildren();const head=el('header');head.append(el('span','hk-tur',o.tur),el('h2',null,'HAREKÂT EMRİ'),el('b',null,o.n));const cv=el('canvas');cv.width=cv.height=520;previewDraw(cv,o,true);
 const tx=el('div','hk-bt');const sec=(h,body)=>{const d=el('div','hk-bs');d.append(el('h3',null,h));if(typeof body==='string')d.append(el('p',null,body));else d.append(body);tx.append(d);};
 sec('DURUM','Düşman: '+forces(o)+'. Dost: tank takımın, iki piyade timi, Kirpi ve ACV-15.');sec('GÖREV',o.emir);const ol=el('ol');(o.phases||[]).forEach(q=>ol.append(el('li',null,q.n)));sec('İCRA',ol);
 sec('DESTEK','Telsizden T129 ATAK, Bayraktar TB2, F-16 ve T-155 Fırtına. İkmal başlangıç karakolunda. Rota '+routeKm(o)+(o.par?' · hedef süre '+Math.round(o.par/60)+' dk':'')+'.');
 const bar=el('div','hk-bb'),back=el('button','hk-back','Geri'),go=el('button','hk-go','GÖREVE ÇIK');back.type=go.type='button';back.onclick=()=>{brief.hidden=true;};
 go.onclick=()=>{brief.hidden=true;briefOK=true;safe(()=>doc.getElementById('go').click(),null);briefOK=false;};bar.append(back,go);
 const body=el('div','hk-bbody');body.append(cv,tx);brief.append(head,body,bar);brief.hidden=false;}
function briefGuard(e){const g=e.target&&e.target.closest&&e.target.closest('#go');if(!g||briefOK||!picked())return;if(safe(()=>TUT.on,false))return;e.stopImmediatePropagation();e.preventDefault();showBrief();}
// ---------- bağlantılar ----------
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
function drawMap(c,SX,SY,s){if(!H)return;const o=H.op;c.save();c.strokeStyle='#ffc247';c.lineWidth=3;c.beginPath();c.arc(SX(o.obj.x),SY(o.obj.z),Math.max(6,o.obj.r*s),0,7);c.stroke();
 c.font='800 13px '+(safe(()=>getComputedStyle(doc.body).getPropertyValue('--sf'),'')||'system-ui');c.textAlign='center';c.fillStyle='#ffc247';c.fillText('HEDEF',SX(o.obj.x),SY(o.obj.z)-Math.max(9,o.obj.r*s)-5);
 c.fillStyle='#8fd14f';c.beginPath();c.arc(SX(o.start.x),SY(o.start.z),6,0,7);c.fill();c.fillText('BÖLGEN',SX(o.start.x),SY(o.start.z)+20);c.restore();}
function drawMini(){if(!H||typeof mmx==='undefined')return;const W=132,O=mmO(),X=x=>((x-O.x)/MMR+.5)*W,Z=z=>((z-O.z)/MMR+.5)*W,o=H.op;let x=X(o.obj.x),y=Z(o.obj.z);const dx=x-W/2,dy=y-W/2,l=Math.hypot(dx,dy),m=W/2-7;if(l>m){x=W/2+dx/l*m;y=W/2+dy/l*m;}
 mmx.save();mmx.fillStyle='#ffc247';mmx.strokeStyle='#1d1000';mmx.lineWidth=1.5;mmx.beginPath();mmx.moveTo(x,y-6);mmx.lineTo(x+5,y);mmx.lineTo(x,y+6);mmx.lineTo(x-5,y);mmx.closePath();mmx.fill();mmx.stroke();mmx.restore();}
function connect(){safe(()=>{if(typeof MI!=='undefined')MI[MODE]={n:'Harekât',t:'Görevi tamamla',r:'Görev emri telsizde.',w:'Görev tamamlandı'};},null);
 wrap('startMission',old=>function(){const r=old.apply(this,arguments);if(safe(()=>mis===MODE,false))begin();else cleanup();return r;});
 /* görevlerde düşman helikopteri ve dronu yok: muharebe yerde, tank topuyla */
 wrap('spawnHeli',old=>function(){if(playing())return;return old.apply(this,arguments);});wrap('spawnED',old=>function(){if(playing())return;return old.apply(this,arguments);});
 wrap('stagePending',old=>function(){return !!(H&&!H.won&&!H.lost)||old.apply(this,arguments);});
 wrap('update',old=>function(dt){const d=clamp(+dt||0,0,.1);if(playing()&&H&&!doc.hidden)safe(()=>control(d),null);const r=old.apply(this,arguments);if(playing()&&H&&!doc.hidden)safe(()=>step(d),null);return r;});
 wrap('endGame',old=>function(ok){if(!ok&&playing()&&H&&!H.won&&!H.lost){H.lost=true;safe(()=>root.stopNav(),null);}return old.apply(this,arguments);});
 wrap('spotted',old=>function(e){if(old.apply(this,arguments))return true;if(!H||!e||!e.hk)return false;if(e.spT>clock)return true;const sn=H.op.wx==='gece'?SEEN*NIGHT:SEEN;if(dist(e,P)<sn)return true;return safe(()=>AL.some(a=>!a.dead&&dist(a,e)<sn*.8),false);});
 wrap('eshot',old=>function(e){if(H&&e&&e.hk)e.spT=clock+8;return old.apply(this,arguments);});
 wrap('openMenu',old=>function(){if(!playing())sky(null);const r=old.apply(this,arguments);paintMenu();const b=doc.getElementById('hkCard');if(b){b.classList.remove('hk-anim');void b.offsetWidth;b.classList.add('hk-anim');root.setTimeout(()=>b.classList.remove('hk-anim'),900);}return r;});
 wrap('mmDraw',old=>function(){const r=old.apply(this,arguments);safe(drawMini,null);return r;});
 (root.MAPX=root.MAPX||[]).includes(drawMap)||root.MAPX.push(drawMap);
 if(!hooks.brief){hooks.brief=true;doc.addEventListener('click',briefGuard,true);}
 root.MAPVIEW_HK=()=>H?H.op:null;}
function select(id,mode){if(mode)ST.mode=mode;if(id&&OPS.some(o=>o.id===id))ST.sel=id;store(ST);safe(()=>root.setG(ST.mode),null);paintMenu();return ST.sel;}
function start(id){select(id,MODE);return safe(()=>{root.reset(typeof lvSel==='string'?lvSel:'normal');return !!H;},false);}
function diagnostics(){const en=enemies();return {version:VERSION,hooks:{...hooks},mode:ST.mode,sel:ST.sel,done:{...ST.done},saveError,active:!!H,op:H?H.op.id:null,t:H?H.t:0,won:H?H.won:false,lost:H?H.lost:false,
 wave:H?H.wave:-1,cap:H?H.cap:0,ph:H?H.ph:0,stars:H?H.stars||0:0,best:{...ST.stars},depLeft:H?H.depLeft:null,batLeft:H?H.batLeft??null:null,hits:H?H.hits||0:0,inc:H&&H.inc?H.inc.length:0,shT:H?H.shT??null:null,enemies:en.map(e=>({type:e.type,role:e.hk.role,x:Math.round(e.x),z:Math.round(e.z),hp:Math.round(e.hp),post:e.hk.post?Math.round(dist(e,e.hk.post)):null,i:e.hk.i})),
 nav:safe(()=>NAV.on?{to:NAV.to.n,len:Math.round(NAV.len)}:null,null)};}
root.HisarHarekat=Object.freeze({version:VERSION,core,start,select,picked,brief:()=>{showBrief();return !!brief&&!brief.hidden;},connect,diagnostics,step:dt=>step(dt)});
connect();installUI();doc.addEventListener('hisar:ui-ready',()=>{connect();installUI();});
})(typeof window!=='undefined'?window:globalThis);
