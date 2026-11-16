/* ÇELİK BÖRÜ ejderha 1.0 — ASELSAN EJDERHA: yüksek güçlü elektromanyetik İHA savunma sistemi sınırın bizim tarafında nöbettedir.
 * Kullanıcının gönderdiği antenli araç modeli karakolların yanına yerleşir. Model iki parçaya ayrıldı (assets/mdl/ejderha_govde.bin ve
 * ejderha_canak.bin): çanak döner tablasının ekseninde döner; boşta gökyüzünü tarar, sürü görününce ona çevrilir.
 * Görevde ara sıra güneyden bir düşman dron sürüsü gelir. Oyuncu hiçbir şey yapmaz: sistem sürüyü kendisi izler ve elektromanyetik darbeyle
 * hepsini birden düşürür (Kasım 2026'daki denemede 51 dronu aynı anda etkisiz kılan sistem). Düşürme anı ekranda küçük bir pencerede
 * gösterilir: önce darbeyi yayan araç, sonra kıvılcım saçıp düşen dronlar; pencerenin başlığında "EJDERHA · n İHA düşürüldü" yazar.
 * Küçük pencere sahnenin ikinci bir kameradan çizimidir (iki karede bir yenilenir); darbe bitince kapanır. Araçların yeri büyük haritada görünür.
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.0.0';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
// ---------- çekirdek ----------
// sc araç modelinin ölçeği, gain dokunun parlaklık çarpanı, r/h siper dairesi. pivot: çanağın döner tablasının araç eksenine göre yeri (m);
// feed: çanağın önündeki besleme ucunun eksene göre yeri (darbe halkaları buradan çıkar); bore: çanağın modeldeki bakış yönü (radyan, +z'den);
// scan/scanW: boşta tarama açısı ve hızı; slew: hedefe en çok dönüş; rate: dönüş hızı (radyan/sn)
// first/every: ilk sürüye ve iki sürü arasına kadar geçen süre (sn), perMission: bir görevde en çok kaç sürü
// swarm: sürüdeki dron sayısı, from: oyuncuya uzaklık (m), alt: uçuş yüksekliği, speed: hız (m/sn), spread: sürünün yarıçapı, size: dronun çizim ölçeği
// lock: sürü göründükten sonra darbeye kadar izleme süresi (sn), close: sürü oyuncuya bu kadar yaklaşırsa darbe hemen atılır
// drop: darbeden sonra dronların düşmeye başlama gecikmesi (sn), g: düşüş ivmesi
// pip: küçük pencere. car: aracın gösterildiği süre, total: toplam süre (sn), w/h: boyut (CSS pikseli), every: kaç karede bir yenilenir,
// back/side: araç çekiminde kameranın aracın gerisine ve yanına uzaklığı; sürü çekiminde kamera sürünün gidiş yönünde ahead metre ileride,
// far metre yanda ve yerden up metre yukarıda durur (sürü kadrajın içinden geçip yere düşer); fov: iki çekimin görüş açısı
const EJ=Object.freeze({sc:6.8,gain:1.35,r:3.4,h:3.2,near:70,pivot:Object.freeze({x:.335,z:1.622}),feed:Object.freeze({x:-.39,y:3.25,z:1.3}),bore:-.36,scan:.4,scanW:.33,slew:.6,rate:.9,first:Object.freeze([50,80]),every:Object.freeze([110,170]),perMission:4,
 swarm:Object.freeze([7,12]),from:Object.freeze([380,440]),alt:Object.freeze([36,54]),speed:27,spread:15,size:1.3,lock:3.2,close:170,drop:Object.freeze([.2,1.15]),g:8.5,
 pip:Object.freeze({car:1.9,total:5.2,w:204,h:122,every:2,back:13,side:8,ahead:36,far:52,up:6,fov:[36,46]})});
// Karakolun yanında aracın konabileceği yerler (karakolun kendi eksenlerinde; karakolun önü +z)
const SPOTS=Object.freeze([[24,3],[-26,3],[26,-12],[-28,-12],[0,-24],[34,10],[-36,10]]);
function spots(post){const c=Math.cos(post.rot||0),s=Math.sin(post.rot||0);return SPOTS.map(([lx,lz])=>({x:post.x+lx*c+lz*s,z:post.z-lx*s+lz*c}));}
const between=(u,r)=>r[0]+(r[1]-r[0])*u;
const count=(u,r)=>Math.min(r[1],r[0]+Math.floor(u*(r[1]-r[0]+1)));
// Sürünün çıkış noktası: oyuncunun güneyinde (Suriye yönünde, ±55°) d metre uzakta. Harita kenarı yüzünden yeterince uzağa düşmüyorsa
// sırayla doğu, batı ve kuzey denenir; en uzak olan alınır.
function origin(px,pz,d,u,ws){let best=null,bd=-1;for(const a of[(u-.5)*1.9,1.5,-1.5,Math.PI]){const x=clamp(px+Math.sin(a)*d,-ws+20,ws-20),z=clamp(pz+Math.cos(a)*d,-ws+20,ws-20),k=Math.hypot(x-px,z-pz);if(k>=d*.8)return {x,z};if(k>bd){bd=k;best={x,z};}}return best;}
// Sürü dizilişi: n dron merkezin çevresinde yatayda spread yarıçaplı sarmalda, düşeyde birkaç kata dağılır
function formation(n,spread){const out=[];for(let i=0;i<n;i++){const r=spread*Math.sqrt((i+.5)/n),a=i*2.399963;out.push({x:Math.cos(a)*r,y:((i*7)%5-2)*spread/12,z:Math.sin(a)*r});}return out;}
// Gücü kesilen dron: yerçekimiyle düşer, hava sürtünmesiyle yavaşlar, takla atar; yere değince true döner
function fall(d,dt,g,ground){d.vy-=g*dt;const k=Math.max(0,1-.9*dt);d.vx*=k;d.vz*=k;d.x+=d.vx*dt;d.y+=d.vy*dt;d.z+=d.vz*dt;d.rx+=d.wx*dt;d.rz+=d.wz*dt;if(d.y<=ground){d.y=ground;return true;}return false;}
// Küçük pencerenin sahnesi: darbeden sonra geçen süreye göre 'arac' (darbeyi yayan araç), 'suru' (düşen dronlar) ya da null (kapalı)
function shot(t,pip){return !(t>=0)?null:t<pip.car?'arac':t<pip.total?'suru':null;}
// Çanağın hedef dönüşü: hedefin dünya yönü az, aracın yönü yaw, çanağın modeldeki bakış yönü bore; ±lim ile sınırlanır
function aim(az,yaw,bore,lim){let a=az-yaw-bore;while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return clamp(a,-lim,lim);}
// Açıyı hedefe saniyede en çok rate radyan yaklaştırır
function toward(cur,target,rate,dt){return cur+clamp(target-cur,-rate*dt,rate*dt);}
// Besleme ucunun dünyadaki yeri: araç (x,y,z) ve yönü gy, çanağın dönüşü dy
function feedAt(x,y,z,gy,dy,cfg){const cg=Math.cos(gy),sg=Math.sin(gy),px=x+cfg.pivot.x*cg+cfg.pivot.z*sg,pz=z-cfg.pivot.x*sg+cfg.pivot.z*cg,Y=gy+dy,c=Math.cos(Y),s=Math.sin(Y),f=cfg.feed;return {x:px+f.x*c+f.z*s,y:y+f.y,z:pz-f.x*s+f.z*c};}
// Sürüye en yakın araç
function nearest(sites,x,z){let b=null,bd=1e9;for(const s of sites){const d=Math.hypot(s.x-x,s.z-z);if(d<bd){bd=d;b=s;}}return b;}
// Noktanın doğru parçasına yatay uzaklığı (kameranın önü açık mı diye bakılır)
function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=dx*dx+dz*dz,t=l?clamp(((px-ax)*dx+(pz-az)*dz)/l,0,1):0;return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
// Araç çekiminde kamera yerleri: aracın gerisinde (darbenin gittiği yönün tersinde), sırayla sol ve sağ yanda, sonra daha geride. dx,dz darbenin yatay yönü.
function carViews(x,z,dx,dz,pip){const l=Math.hypot(dx,dz)||1,fx=dx/l,fz=dz/l,sx=-fz,sz=fx,out=[];for(const[b,s]of[[1,1],[1,-1],[1.5,.45],[1.5,-.45],[.55,1.7],[.55,-1.7]])out.push({x:x-fx*pip.back*b+sx*pip.side*s,z:z-fz*pip.back*b+sz*pip.side*s});return out;}
// Bildirim metni
const text=n=>n+' İHA düşürüldü';
const core=Object.freeze({VERSION,EJ,SPOTS,spots,between,count,origin,formation,fall,shot,aim,toward,feedAt,nearest,segDist,carViews,text});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;
// ---------- oyun ----------
const stat={state:'bekliyor',sites:0,events:0,downed:0,last:0,active:false,pip:false,pipFrames:0,error:null,tris:[0,0]};
let started=false,T=null,SITES=[],EV=null,timer=0,left=0,IM=null,RINGS=[],PIP=null,O=null,clockT=0;const hooks={};
const H=(x,z)=>safe(()=>hAt(x,z),0),WSZ=()=>safe(()=>WS,800),rnd=()=>Math.random();
const playing=()=>safe(()=>game==='play'&&mis==='harekat',false);
function free(x,z){const ws=WSZ();if(Math.abs(x)>ws-30||Math.abs(z)>ws-30)return false;let lo=1e9,hi=-1e9;for(const[a,b]of[[0,0],[4,4],[-4,4],[4,-4],[-4,-4]]){const h=H(x+a,z+b);lo=Math.min(lo,h);hi=Math.max(hi,h);}if(hi-lo>1.6||lo<.2)return false;
 if(safe(()=>roadNear(x,z,7),false))return false;if(safe(()=>BLD.some(b=>!b.dead&&Math.hypot(b.x-x,b.z-z)<b.r+EJ.r+3),false))return false;if(safe(()=>COV.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+EJ.r+2),false))return false;
 if(safe(()=>root.HisarSivil.cars().some(q=>Math.hypot(q.x-x,q.z-z)<8),false))return false;if(safe(()=>root.HisarCevre.poles().some(q=>Math.hypot(q.x-x,q.z-z)<6),false))return false;
 if(safe(()=>(root.TREES||[]).some(t=>t.st!==3&&Math.hypot(t.x-x,t.z-z)<5),false))return false;if(safe(()=>root.HisarField.positions().some(q=>Math.hypot(q.x-x,q.z-z)<18),false))return false;
 return !SITES.some(s=>Math.hypot(s.x-x,s.z-z)<60);}
function place(M,G,mat){for(const p of safe(()=>root.HisarSinir.posts(),[])){const s=spots(p).find(q=>free(q.x,q.z));if(!s)continue;const g=new T.Group();g.position.set(s.x,H(s.x,s.z),s.z);g.rotation.y=-EJ.bore+((p.x*.013)%1-.5)*.3;/* çanak güneye, sınıra bakar */g.name='EJ_ARAC';S.add(g);
  const dg=new T.Group();dg.position.set(EJ.pivot.x,0,EJ.pivot.z);dg.name='EJ_CANAK';g.add(dg);
  const site={x:s.x,z:s.z,y:g.position.y,g,dg,ph:p.x*.07,p:M.prop(g,G.bh,G.bl,mat,{near:EJ.near,max:1,key:'ejderha'}),pd:M.prop(dg,G.dh,G.dl,mat,{at:g,near:EJ.near,max:1,key:'ejderha-canak'})};SITES.push(site);COV.push({x:s.x,z:s.z,r:EJ.r,h:EJ.h,ej:1});safe(()=>root.HisarArazi.clear(s.x,s.z,6),null);}
 stat.sites=SITES.length;safe(()=>root.buildGrid&&root.buildGrid(),null);}
// düşman dronu: dört kollu gövde ve pervane diskleri (tek geometri, hepsi tek çizim)
function droneGeo(M){const p=[{t:'b',s:[.5,.16,.7],p:[0,0,0],c:0x23262a},{t:'b',s:[.2,.1,.2],p:[0,-.1,.3],c:0xc22a1e}];for(const a of[Math.PI/4,-Math.PI/4])p.push({t:'b',s:[1.7,.07,.12],p:[0,.02,0],r:[0,a,0],c:0x2d3035});
 for(const[x,z]of[[.6,.6],[-.6,.6],[.6,-.6],[-.6,-.6]]){p.push({t:'c',s:[.07,.07,.16],p:[x,.08,z],c:0x15171a,n:8});p.push({t:'c',s:[.34,.34,.02],p:[x,.18,z],c:0x565b60,n:12});}return M.merge(p);}
function build(M,G,mat){place(M,G,mat);if(!SITES.length)return;
 IM=new T.InstancedMesh(droneGeo(M),new T.MeshLambertMaterial({vertexColors:true}),EJ.swarm[1]);IM.count=0;IM.frustumCulled=false;IM.name='EJ_SURU';S.add(IM);
 const rg=new T.RingGeometry(.9,1,40);for(let i=0;i<10;i++){const m=new T.Mesh(rg,new T.MeshBasicMaterial({color:0xa9dcff,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false}));m.visible=false;m.frustumCulled=false;m.name='EJ_DALGA';S.add(m);RINGS.push({m,t:-1,life:1,x:0,y:0,z:0,dx:0,dy:0,dz:1,v:0,r0:1,r1:1});}
 O=new T.Object3D();O.rotation.order='YXZ';}
// ---------- sürü ----------
function centre(){let x=0,y=0,z=0,n=0;for(const d of EV.dr){if(d.st>1)continue;x+=d.x;y+=d.y;z+=d.z;n++;}return n?(EV.cl={x:x/n,y:y/n,z:z/n,n}):(EV.cl||EV.c);}
function launch(){if(EV||!IM||!SITES.length)return false;const px=safe(()=>P.x,0),pz=safe(()=>P.z,0),o=origin(px,pz,between(rnd(),EJ.from),rnd(),WSZ()),n=count(rnd(),EJ.swarm),alt=H(o.x,o.z)+between(rnd(),EJ.alt);
 EV={st:'gel',t:0,pt:-1,n,site:nearest(SITES,o.x,o.z),c:{x:o.x,y:alt,z:o.z,n},dr:formation(n,EJ.spread).map(f=>({x:o.x+f.x,y:alt+f.y,z:o.z+f.z,vx:0,vy:0,vz:0,rx:0,rz:0,wx:0,wz:0,h:0,st:0,delay:0,ph:rnd()*6.28,sm:0})),ring:0};
 stat.active=true;safe(()=>root.CREW.say('Dron sürüsü yaklaşıyor!',2,'ej-gel',20),null);return true;}
function ring(x,y,z,dx,dy,dz,v,r0,r1,life,delay){const q=RINGS.find(r=>r.t<0);if(!q)return;Object.assign(q,{t:0,wait:delay||0,life,x,y,z,dx,dy,dz,v,r0,r1});q.m.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(dx,dy,dz));}
// Darbe: sürüye çevrilmiş araç yayar; halkalar çanağın besleme ucundan sürüye doğru açılarak gider, dronlar sırayla güç yitirir
function pulse(){const c=centre(),s=EV.site;if(!s)return;EV.st='dus';EV.pt=0;EV.c=c;const f=feedAt(s.x,s.y,s.z,s.g.rotation.y,s.dg.rotation.y,EJ),ox=f.x,oy=f.y,oz=f.z;
 let dx=c.x-ox,dy=c.y-oy,dz=c.z-oz;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;EV.o={x:ox,y:oy,z:oz,dx,dy,dz};
 for(let i=0;i<6;i++)ring(ox,oy,oz,dx,dy,dz,150,1.1,15,1.25,i*.13);for(let i=0;i<2;i++)ring(c.x-dx*70,c.y-dy*70,c.z-dz*70,dx,dy,dz,130,16,30,1.1,.25+i*.18);
 for(const q of EV.dr)q.delay=between(rnd(),EJ.drop);stat.events++;stat.last=EV.n;
 safe(()=>{const t=AC.currentTime;tone(t,1.1,{f0:120,f1:34,v:.2,type:'sawtooth'});tone(t,.5,{f0:2400,f1:300,v:.05,type:'square'});nburst(t,.6,{type:'bandpass',f:3400,q:.7,v:.09});},null);
 safe(()=>root.CREW.say('EJDERHA sürüyü indirdi.',2,'ej-vur',10),null);pipShow();}
function hit(d,vx,vz){d.st=1;d.vx=vx*.55+(rnd()-.5)*6;d.vz=vz*.55+(rnd()-.5)*6;d.vy=(rnd()-.3)*3;d.wx=(rnd()<.5?-1:1)*(4+rnd()*5);d.wz=(rnd()<.5?-1:1)*(3+rnd()*5);stat.downed++;
 safe(()=>{const fx=root.FXP;fx.glow(d.x,d.y,d.z,0,0,0,.22,.5,2.4,0xe8f6ff,0x58a8ff,.95,0);for(let i=0;i<3;i++)fx.glow(d.x,d.y,d.z,(rnd()-.5)*9,rnd()*5,(rnd()-.5)*9,.4+rnd()*.3,.16,.05,0xdff2ff,0x6fb8ff,1,9);},null);}
function crash(d){d.st=2;safe(()=>root.FXP.explosion(d.x,d.y+.3,d.z,.28,{noDeb:true}),null);}
function end(){EV=null;stat.active=false;IM.count=0;timer=between(rnd(),EJ.every);left--;}
// Çanaklar: boşta ağır ağır tarar; sürü görününce o sürüye bakan araç çanağını sürüye çevirir
function turn(dt){clockT+=dt;for(const s of SITES){let a;if(EV&&EV.site===s){const c=EV.st==='gel'?centre():EV.c;a=aim(Math.atan2(c.x-s.x,c.z-s.z),s.g.rotation.y,EJ.bore,EJ.slew);s.dg.rotation.y=toward(s.dg.rotation.y,a,EJ.rate,dt);}
  else s.dg.rotation.y=toward(s.dg.rotation.y,Math.sin(clockT*EJ.scanW+s.ph)*EJ.scan,EJ.rate*.5,dt);}}
function step(dt){turn(dt);for(const q of RINGS){if(q.t<0)continue;if(q.wait>0){q.wait-=dt;continue;}q.t+=dt;const k=q.t/q.life;if(k>=1){q.t=-1;q.m.visible=false;continue;}const s=q.r0+(q.r1-q.r0)*k,l=q.v*q.t;q.m.visible=true;q.m.position.set(q.x+q.dx*l,q.y+q.dy*l,q.z+q.dz*l);q.m.scale.setScalar(s);q.m.material.opacity=.75*(1-k)*Math.min(1,k*8);}
 if(!EV){if(playing()&&left>0&&IM){timer-=dt;if(timer<=0)launch();}return;}
 EV.t+=dt;const px=safe(()=>P.x,0),pz=safe(()=>P.z,0),c=centre();let hx=px-c.x,hz=pz-c.z;const hl=Math.hypot(hx,hz)||1;hx/=hl;hz/=hl;const vx=hx*EJ.speed,vz=hz*EJ.speed,tt=EV.t;
 if(EV.st==='gel'){if(tt>EJ.lock||hl<EJ.close)pulse();}else EV.pt+=dt;
 let n=0,alive=0;for(const d of EV.dr){if(d.st===0){d.x+=vx*dt;d.z+=vz*dt;d.y+=Math.sin(tt*2.1+d.ph)*.6*dt;d.h=Math.atan2(hx,hz);if(EV.st==='dus'&&EV.pt>=d.delay)hit(d,vx,vz);}
  else if(d.st===1){if(fall(d,dt,EJ.g,H(d.x,d.z)+.2))crash(d);else if((d.sm-=dt)<=0){d.sm=.09;safe(()=>root.FXP.puff(d.x,d.y,d.z,0,.6,0,1.3,.35,1.5,0x2a2826,0x6a6660,.6,.6),null);}}
  if(d.st>1)continue;alive++;O.position.set(d.x,d.y,d.z);O.rotation.set(d.st?d.rx:.22,d.h,d.st?d.rz:Math.sin(tt*3+d.ph)*.12);O.scale.setScalar(EJ.size);O.updateMatrix();IM.setMatrixAt(n++,O.matrix);}
 IM.count=n;IM.instanceMatrix.needsUpdate=true;if(EV.st==='dus'&&!alive&&EV.pt>EJ.pip.total)end();}
// ---------- küçük pencere ----------
function pipBuild(){if(PIP)return PIP;const st=doc.createElement('style');st.textContent=`#ej-pip{position:fixed;left:calc(env(safe-area-inset-left,0px) + 14px);top:calc(env(safe-area-inset-top,0px) + 98px);width:${EJ.pip.w}px;z-index:12;pointer-events:none;border-radius:6px;overflow:hidden;border:1px solid rgba(159,216,255,.55);box-shadow:0 6px 18px rgba(0,0,0,.45)}
#ej-pip[hidden]{display:none}#ej-pip .ej-h{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 8px;background:rgba(12,13,12,.88);color:#f4f2ec;font:800 12px/1 var(--sf,system-ui);letter-spacing:.1em;white-space:nowrap}
#ej-pip .ej-h span{font:700 11.5px/1 var(--sf,system-ui);letter-spacing:.02em;color:#9fd8ff}#ej-pip .ej-v{height:${EJ.pip.h}px}body:not(.inplay) #ej-pip{display:none}
@media (orientation:portrait){#ej-pip{top:calc(env(safe-area-inset-top,0px) + 150px)}}`;doc.head.appendChild(st);
 const card=doc.createElement('div');card.id='ej-pip';card.hidden=true;card.setAttribute('role','status');const h=doc.createElement('div');h.className='ej-h';const b=doc.createElement('b');b.textContent='EJDERHA';const sp=doc.createElement('span');h.append(b,sp);const v=doc.createElement('div');v.className='ej-v';card.append(h,v);doc.body.appendChild(card);
 const pr=Math.min(2,root.devicePixelRatio||1),rt=new T.WebGLRenderTarget(Math.round(EJ.pip.w*pr),Math.round(EJ.pip.h*pr)),cam=new T.PerspectiveCamera(36,EJ.pip.w/EJ.pip.h,.5,900);
 const bs=new T.Scene(),bc=new T.OrthographicCamera(-1,1,1,-1,0,1);bs.add(new T.Mesh(new T.PlaneGeometry(2,2),new T.MeshBasicMaterial({map:rt.texture,depthTest:false,depthWrite:false,fog:false})));
 PIP={card,sp,v,rt,cam,bs,bc,on:false,t:0,fr:0,fol:[],vp:new T.Vector4(),sc:new T.Vector4(),look:new T.Vector3()};return PIP;}
// Kamerayla araç arasında bina, direk, ağaç ya da başka engel var mı
function open(ax,az,bx,bz,site){const hit=(x,z,r)=>segDist(x,z,ax,az,bx,bz)<r+.7;if(safe(()=>BLD.some(b=>!b.dead&&hit(b.x,b.z,b.r)),false))return false;if(safe(()=>COV.some(c=>!(c.ej&&c.x===site.x&&c.z===site.z)&&hit(c.x,c.z,c.r)),false))return false;
 if(safe(()=>root.HisarCevre.poles().some(q=>hit(q.x,q.z,.5)),false))return false;if(safe(()=>(root.TREES||[]).some(t=>t.st!==3&&hit(t.x,t.z,1.6)),false))return false;return !safe(()=>root.HisarArazi.trees().some(t=>hit(t.x,t.z,1.6)),false);}
function pipShow(){const p=pipBuild();p.on=true;p.t=0;p.fr=0;p.sw=null;p.sp.textContent=text(EV.n);p.card.hidden=false;stat.pip=true;
 const s0=EV.site,o0=EV.o,vs=carViews(s0.x,s0.z,o0.dx,o0.dz,EJ.pip);p.car=vs.find(v=>open(v.x,v.z,s0.x,s0.z,s0))||vs[0];
 /* kamerayı izleyen nesneler (gök kubbesi gibi): ikinci kameradan çizerken onun yanına alınır */
 const c=safe(()=>CAM.position,null);p.fol=c?S.children.filter(o=>o.isMesh&&o.position.x===c.x&&o.position.y===c.y&&o.position.z===c.z):[];force(EV.site,true);}
function force(s,on){if(s&&s.p.force!==on)s.p.force=s.pd.force=on;}
function pipHide(){if(!PIP||!PIP.on)return;PIP.on=false;PIP.card.hidden=true;stat.pip=false;for(const s of SITES)force(s,false);}
function pipFrame(dr){const p=PIP;if(!p||!p.on)return;p.t+=dr||0;const sh=EV&&EV.st==='dus'?shot(p.t,EJ.pip):null;if(!sh||!safe(()=>game==='play',false)){pipHide();return;}const map=!!root.mapOpen;if(p.card.hidden!==map)p.card.hidden=map;if(map)return;/* büyük harita açıkken gizlenir */const cam=p.cam,s=EV.site,o=EV.o;
 if(sh==='arac'){cam.fov=EJ.pip.fov[0];cam.position.set(p.car.x,Math.max(H(p.car.x,p.car.z)+1.6,s.y+2.3),p.car.z);p.look.set(s.x+o.dx*6,s.y+3.6,s.z+o.dz*6);force(s,true);}
 else{force(s,false);cam.fov=EJ.pip.fov[1];const c=centre();if(!p.sw){const px=safe(()=>P.x,0),pz=safe(()=>P.z,0);let dx=px-EV.c.x,dz=pz-EV.c.z;const l=Math.hypot(dx,dz)||1,q=EJ.pip;dx/=l;dz/=l;const gx=EV.c.x+dx*q.ahead-dz*q.far,gz=EV.c.z+dz*q.ahead+dx*q.far;p.sw={x:gx,y:H(gx,gz)+q.up,z:gz};}
  cam.position.set(p.sw.x,p.sw.y,p.sw.z);p.look.set(c.x,Math.max(H(c.x,c.z)+2.5,c.y),c.z);}
 cam.updateProjectionMatrix();cam.lookAt(p.look);const R0=safe(()=>R,null);if(!R0)return;
 if(p.fr++%EJ.pip.every===0){const main=CAM.position,au=R0.shadowMap.autoUpdate,nu=R0.shadowMap.needsUpdate,iv0=safe(()=>iv,0);R0.shadowMap.autoUpdate=false;R0.shadowMap.needsUpdate=false;for(const f of p.fol)f.position.copy(cam.position);safe(()=>{iv=0;},null);
  try{R0.setRenderTarget(p.rt);R0.render(S,cam);}finally{R0.setRenderTarget(null);safe(()=>{iv=iv0;},null);for(const f of p.fol)f.position.copy(main);R0.shadowMap.autoUpdate=au;R0.shadowMap.needsUpdate=nu;}stat.pipFrames++;}
 const b=p.v.getBoundingClientRect();if(b.width<2)return;R0.getViewport(p.vp);R0.getScissor(p.sc);const st=R0.getScissorTest(),ac=R0.autoClear,x=b.left,y=root.innerHeight-b.bottom;
 try{R0.setViewport(x,y,b.width,b.height);R0.setScissor(x,y,b.width,b.height);R0.setScissorTest(true);R0.autoClear=false;R0.render(p.bs,p.bc);}finally{R0.autoClear=ac;R0.setScissorTest(st);R0.setScissor(p.sc);R0.setViewport(p.vp);}}
// ---------- kurulum ----------
function reset(){if(EV){for(const q of RINGS){q.t=-1;q.m.visible=false;}EV=null;if(IM)IM.count=0;stat.active=false;}pipHide();timer=between(rnd(),EJ.first);left=EJ.perMission;}
async function start(){const M=root.HisarModel;if(started||!M||!root.THREE||typeof S==='undefined'||typeof COV==='undefined'||!root.HisarSinir||!safe(()=>root.HisarSinir.diagnostics().built,false))return;started=true;stat.state='yükleniyor';T=root.THREE;
 try{const [bh,bl,dh,dl]=await Promise.all(['govde','govde_uzak','canak','canak_uzak'].map(n=>M.load('assets/mdl/ejderha_'+n+'.bin?v=1'))),sc=EJ.sc,pv=EJ.pivot;
  /* parçalar özgün modeldeki yerlerine konur: gövde araç eksenine, çanak kendi dönme eksenine göre */
  for(const d of[bh,bl])M.core.move(d.pos,d.off[0],0,d.off[1],sc);for(const d of[dh,dl])M.core.move(d.pos,d.off[0]-pv.x/sc,0,d.off[1]-pv.z/sc,sc);stat.tris=[(bh.ni+dh.ni)/3,(bl.ni+dl.ni)/3];
  build(M,{bh:M.geometry(bh),bl:M.geometry(bl),dh:M.geometry(dh),dl:M.geometry(dl)},M.material(M.texture('assets/tex/ejderha_col.jpg?v=1'),{gain:EJ.gain}));stat.state=SITES.length?'hazır':'hata';if(!SITES.length)stat.error='araç için boş yer bulunamadı';else if(!left)reset();}
 catch(e){stat.state='hata';stat.error=String(e&&e.message||e);}}
// Büyük haritada araçların yeri: açık mavi halka ve ad
function drawMap(c,SX,SY){if(!SITES.length)return;c.save();c.font='800 11px '+(safe(()=>getComputedStyle(doc.body).getPropertyValue('--sf'),'')||'system-ui');c.textAlign='center';
 for(const s of SITES){const x=SX(s.x),y=SY(s.z);c.fillStyle='#9fd8ff';c.strokeStyle='#0c1a24';c.lineWidth=1.5;c.beginPath();c.arc(x,y,4.5,0,7);c.fill();c.stroke();c.strokeStyle='rgba(159,216,255,.8)';c.beginPath();c.arc(x,y,8.5,0,7);c.stroke();c.lineWidth=3;c.strokeStyle='rgba(0,0,0,.8)';c.strokeText('EJDERHA',x,y+22);c.fillStyle='#bfe6ff';c.fillText('EJDERHA',x,y+22);}c.restore();}
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
function connect(){start();
 wrap('update',old=>function(dt){const r=old.apply(this,arguments);if(!started)start();if(safe(()=>game==='play',false))safe(()=>step(clamp(+dt||0,0,.1)),null);return r;});
 wrap('startMission',old=>function(){safe(reset,null);return old.apply(this,arguments);});
 if(!hooks.frame&&typeof FRAME_HOOKS!=='undefined'){hooks.frame=true;FRAME_HOOKS.push(dr=>safe(()=>pipFrame(dr),null));}
 (root.MAPX=root.MAPX||[]).includes(drawMap)||root.MAPX.push(drawMap);}
root.HisarEjderha=Object.freeze({version:VERSION,core,connect,launch:()=>launch(),sites:()=>SITES.map(s=>({x:s.x,z:s.z,y:s.y,yaw:s.g.rotation.y,dish:s.dg.rotation.y,busy:!!EV&&EV.site===s})),
 event:()=>EV?{st:EV.st,t:EV.t,pt:EV.pt,n:EV.n,flying:EV.dr.filter(d=>d.st===0).length,falling:EV.dr.filter(d=>d.st===1).length,down:EV.dr.filter(d=>d.st===2).length,c:centre()}:null,
 diagnostics:()=>({version:VERSION,...stat,timer,left,hooks:{...hooks},rings:RINGS.filter(q=>q.t>=0).length,pipT:PIP&&PIP.on?PIP.t:-1})});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
