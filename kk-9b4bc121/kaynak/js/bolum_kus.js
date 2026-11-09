/* ================= BÖLÜM: KUŞ 46 NUMARA MI? (21–22 Mart 2025 · İzmit) ================= */
/* Kaan ehliyetini aldığı gün trenle İzmit'e gider; Kardelen otobüsle, kemanıyla birlikte otele önce varır.
   Odada izler: “kuş mu girdi?” — “Kuş 46 numara mı giyiyormuş?” — meğer balkondan kedi girmiş. Çarşafı değiştiren
   görevliye yardım, televizyon, akşam keman, film ve ikisinin de uyuyakalması; sabah kedi yine balkonda. */

/* ---------- kedi: gövde, baş, kulaklar, kuyruk, bacaklar; tekir dokusu ---------- */
function kediDoku(){ if(kediDoku.t) return kediDoku.t;
  kediDoku.t=_bkTuval(256,128,(x,w,h)=>{ x.fillStyle="#c98a4a"; x.fillRect(0,0,w,h); x.fillStyle="rgba(120,70,30,.55)"; for(let i=0;i<14;i++){ x.beginPath(); x.ellipse(i*19+6,h/2,4,h*.48,0,0,7); x.fill(); }
    x.fillStyle="rgba(250,230,200,.6)"; x.fillRect(0,h*.78,w,h*.22); for(let i=0;i<900;i++){ x.fillStyle=`rgba(${Math.random()<.5?"90,50,20":"240,200,150"},.15)`; x.fillRect(Math.random()*w,Math.random()*h,1,2); } }); return kediDoku.t; }
function kediYap(){
  const g=new THREE.Group(); const km=new THREE.MeshStandardMaterial({map:kediDoku(),roughness:.95}), ak=mat("#f3e6d2",{roughness:.95});
  const gov=new THREE.Mesh(new THREE.SphereGeometry(.12,18,14),km); gov.scale.set(.85,.8,1.55); gov.position.y=.2; gov.castShadow=true; g.add(gov);
  const bas_=new THREE.Group(); bas_.position.set(0,.31,.17); g.add(bas_); g.userData.bas=bas_;
  const kf=new THREE.Mesh(new THREE.SphereGeometry(.085,18,14),km); kf.scale.set(1,.9,.95); bas_.add(kf);
  const ag=new THREE.Mesh(new THREE.SphereGeometry(.04,12,10),ak); ag.position.set(0,-.03,.06); ag.scale.set(1.2,.8,.8); bas_.add(ag);
  const bur=new THREE.Mesh(new THREE.SphereGeometry(.009,8,6),mat("#d98a8a")); bur.position.set(0,-.012,.088); bas_.add(bur);
  for(const s of [-1,1]){ const k=new THREE.Mesh(new THREE.ConeGeometry(.032,.06,4),km); k.position.set(s*.048,.075,0); k.rotation.z=-s*.25; bas_.add(k);
    const go=new THREE.Mesh(new THREE.SphereGeometry(.014,10,8),new THREE.MeshStandardMaterial({color:renk("#a8c94a"),emissive:renk("#506a10"),emissiveIntensity:.4,roughness:.15})); go.position.set(s*.032,.012,.072); bas_.add(go);
    const gb=new THREE.Mesh(new THREE.SphereGeometry(.006,8,6),mat("#111")); gb.position.set(s*.032,.012,.084); gb.scale.set(.5,1,.5); bas_.add(gb);
    for(let i=0;i<3;i++){ const b=new THREE.Mesh(new THREE.CylinderGeometry(.0008,.0008,.07,3),mat("#f6f2ea")); b.rotation.z=Math.PI/2+s*(i-1)*.15; b.position.set(s*.05,-.02+i*.006,.075); bas_.add(b); } }
  for(const [x,z] of [[-.055,.11],[.055,.11],[-.055,-.12],[.055,-.12]]){ const b=new THREE.Mesh(new THREE.CylinderGeometry(.022,.018,.16,8),km); b.position.set(x,.08,z); g.add(b); const p=new THREE.Mesh(new THREE.SphereGeometry(.022,8,6),ak); p.scale.y=.5; p.position.set(x,.008,z+.008); g.add(p); }
  const kuy=new THREE.Group(); kuy.position.set(0,.24,-.17); g.add(kuy); g.userData.kuyruk=kuy;
  const eg=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(0,.06,-.08),new THREE.Vector3(0,.18,-.12),new THREE.Vector3(0,.28,-.08)]);
  const ky=new THREE.Mesh(new THREE.TubeGeometry(eg,16,.018,8,false),km); kuy.add(ky);
  return g;
}
function patiDoku(){ if(patiDoku.t) return patiDoku.t;
  patiDoku.t=_bkTuval(64,64,(x,w,h)=>{ x.clearRect(0,0,w,h); x.fillStyle="rgba(70,60,55,.75)"; x.beginPath(); x.ellipse(32,40,13,11,0,0,7); x.fill(); for(const [a,b] of [[16,22],[26,14],[38,14],[48,22]]){ x.beginPath(); x.ellipse(a,b,6,7,0,0,7); x.fill(); } }); return patiDoku.t; }
function patiIzi(boy=.07){ const m=new THREE.Mesh(new THREE.PlaneGeometry(boy,boy),new THREE.MeshBasicMaterial({map:patiDoku(),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2})); m.rotation.x=-Math.PI/2; return m; }

/* ---------- otel odası (İzmit, “bizim otel”): çift kişilik yatak, TV, balkon, körfez manzarası ---------- */
function otelOdasi(B,ops={}){
  Ses.zemin="hali"; const W=4.8, D=6.2, H=2.8, x0=-W/2, z0=-D/2;
  const duvarD=_bkTuval(256,256,(x,w,h)=>{ x.fillStyle="#e9dfd0"; x.fillRect(0,0,w,h); x.strokeStyle="rgba(170,150,120,.18)"; x.lineWidth=2; for(let i=0;i<w;i+=16){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,h); x.stroke(); } for(let i=0;i<1600;i++){ x.fillStyle="rgba(255,255,255,.12)"; x.fillRect(Math.random()*w,Math.random()*h,1,1); } });
  duvarD.wrapS=duvarD.wrapT=THREE.RepeatWrapping; duvarD.repeat.set(3,1.5);
  const duvar=new THREE.MeshStandardMaterial({map:duvarD,roughness:.95});
  const hal=_bkTuval(256,256,(x,w,h)=>{ x.fillStyle="#6c5a52"; x.fillRect(0,0,w,h); for(let i=0;i<9000;i++){ x.fillStyle=`rgba(${Math.random()<.5?"40,30,28":"150,130,118"},.25)`; x.fillRect(Math.random()*w,Math.random()*h,1,1); } x.strokeStyle="rgba(190,160,120,.25)"; x.lineWidth=3; for(let i=0;i<4;i++){ x.strokeRect(20+i*6,20+i*6,216-i*12,216-i*12); } });
  hal.wrapS=hal.wrapT=THREE.RepeatWrapping; hal.repeat.set(2.4,3);
  const zem=new THREE.Mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshStandardMaterial({map:hal,roughness:1})); zem.rotation.x=-Math.PI/2; zem.receiveShadow=true; scene.add(zem);
  const tav=new THREE.Mesh(new THREE.PlaneGeometry(W,D),mat("#f6f3ee")); tav.rotation.x=Math.PI/2; tav.position.y=H; scene.add(tav);
  const dv=(w,x,z,ry)=>{ const p=new THREE.Mesh(new THREE.PlaneGeometry(w,H),duvar); p.position.set(x,H/2,z); p.rotation.y=ry; p.receiveShadow=true; scene.add(p); return p; };
  dv(W,0,-z0,Math.PI); dv(D,x0,0,Math.PI/2); dv(D,-x0,0,-Math.PI/2);
  // arka duvar: balkon kapısı boşluğu (x -.4 … 2.0)
  const bx0=-.4, bx1=2.0, bh=2.35;
  { const sol=new THREE.Mesh(new THREE.PlaneGeometry(bx0-x0,H),duvar); sol.position.set((x0+bx0)/2,H/2,z0); scene.add(sol);
    const sag=new THREE.Mesh(new THREE.PlaneGeometry(-x0-bx1,H),duvar); sag.position.set((bx1-x0)/2,H/2,z0); scene.add(sag);
    const ust=new THREE.Mesh(new THREE.PlaneGeometry(bx1-bx0,H-bh),duvar); ust.position.set((bx0+bx1)/2,bh+(H-bh)/2,z0); scene.add(ust); }
  const cer=mat("#3a3c42",{metalness:.7,roughness:.35});
  for(const [w,h,x,y] of [[bx1-bx0+.08,.06,(bx0+bx1)/2,bh],[.06,bh,bx0,bh/2],[.06,bh,bx1,bh/2],[.05,bh,(bx0+bx1)/2,bh/2]]){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.08),cer); m.position.set(x,y,z0); scene.add(m); }
  const camM=new THREE.MeshPhysicalMaterial({color:renk("#cfe0ea"),metalness:0,roughness:.05,transparent:true,opacity:.14,depthWrite:false});
  B.camKapi=new THREE.Mesh(new THREE.PlaneGeometry((bx1-bx0)/2-.03,bh-.06),camM); B.camKapi.position.set(bx0+(bx1-bx0)*.75,bh/2,z0-.02); scene.add(B.camKapi);
  const camSabit=new THREE.Mesh(new THREE.PlaneGeometry((bx1-bx0)/2-.03,bh-.06),camM); camSabit.position.set(bx0+(bx1-bx0)*.25,bh/2,z0+.02); scene.add(camSabit);
  // perdeler (tül + kalın)
  const tul=new THREE.MeshStandardMaterial({color:renk("#f6f2ea"),roughness:1,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false}), kalin=mat("#7a5a4a",{roughness:1,side:THREE.DoubleSide});
  const perde=(m,gen,x,z)=>{ const geo=new THREE.PlaneGeometry(gen,2.55,26,1); const P=geo.attributes.position; for(let i=0;i<P.count;i++) P.setZ(i,Math.sin(P.getX(i)*30)*.04); geo.computeVertexNormals(); const p=new THREE.Mesh(geo,m); p.position.set(x,1.3,z); scene.add(p); return p; };
  B.tulPerde=perde(tul,1.3,bx0+.65,z0+.12); perde(kalin,.55,bx0-.45,z0+.16); perde(kalin,.55,bx1+.4,z0+.16);
  // balkon: zemin, korkuluk, masa, sandalyeler, saksı
  const bal=new THREE.Group(); scene.add(bal); B.balkon=bal;
  const bz=new THREE.Mesh(new THREE.BoxGeometry(3.6,.12,1.5),mat("#b9b2a8",{roughness:.8})); bz.position.set(.8,-.06,z0-.75); bz.receiveShadow=true; bal.add(bz);
  const camKor=new THREE.MeshPhysicalMaterial({color:renk("#eaf4f8"),transparent:true,opacity:.1,roughness:.02,depthWrite:false,side:THREE.DoubleSide});
  const kor=new THREE.Mesh(new THREE.BoxGeometry(3.6,1.0,.02),camKor); kor.position.set(.8,.5,z0-1.47); bal.add(kor);
  const kc=new THREE.Mesh(new THREE.BoxGeometry(3.62,.05,.06),mat("#c9ccd2",{metalness:.8,roughness:.3})); kc.position.set(.8,1.02,z0-1.47); bal.add(kc);
  for(const x of [-1.0,2.6]){ const y=new THREE.Mesh(new THREE.BoxGeometry(.02,1.0,1.5),camKor); y.position.set(x,.5,z0-.75); bal.add(y); const ust=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,1.5),mat("#c9ccd2",{metalness:.8,roughness:.3})); ust.position.set(x,1.02,z0-.75); bal.add(ust); }
  const bm=new THREE.Group(); bm.position.set(1.6,0,z0-.8); bal.add(bm); const bmu=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.03,20),mat("#f2efe8",{roughness:.35})); bmu.position.y=.72; bm.add(bmu); const bma=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.72,8),cer); bma.position.y=.36; bm.add(bma);
  B.balkonSandalye=[]; for(const [x,z,r] of [[.95,z0-.75,Math.PI/2],[2.2,z0-.85,-Math.PI/2]]){ const s=sandalye("#3a3c42"); s.position.set(x,0,z); s.rotation.y=r; bal.add(s); B.balkonSandalye.push(s); }
  const sk=new THREE.Group(); sk.position.set(-.7,0,z0-1.2); bal.add(sk); const sp=new THREE.Mesh(new THREE.CylinderGeometry(.2,.16,.36,14),mat("#c9784a")); sp.position.y=.18; sk.add(sp);
  for(let i=0;i<8;i++){ const y=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),mat("#4f7a3a",{roughness:.8})); y.scale.set(.5,1.3,.3); y.position.set(Math.cos(i*.8)*.08,.55+Math.random()*.2,Math.sin(i*.8)*.08); y.rotation.y=i*.8; sk.add(y); }
  // körfez: deniz, karşı kıyı, şehir; akşam ışıkları
  const deniz=new THREE.Mesh(new THREE.PlaneGeometry(900,500),new THREE.MeshStandardMaterial({color:renk(ops.gece?"#0d1a2c":"#3f6f8a"),roughness:.15,metalness:.5})); deniz.rotation.x=-Math.PI/2; deniz.position.set(0,-30,-300); scene.add(deniz); B.deniz=deniz;
  for(let i=0;i<10;i++){ const t=new THREE.Mesh(new THREE.SphereGeometry(rnd(40,70),16,10),mat(ops.gece?"#1a1e2c":"#7c8a7a",{roughness:1})); t.scale.y=rnd(.2,.32); t.position.set(-420+i*95+rnd(-20,20),-32,-480+rnd(-20,20)); scene.add(t); }
  const sehir=tozlar(500,()=>({x:rnd(-420,420),y:rnd(-29,-20),z:rnd(-470,-440)}),"#ffd9a0",1.6); sehir.material.opacity=ops.gece?1:.0; scene.add(sehir); B.sehirIsik=sehir;
  for(let i=0;i<46;i++){ const w=rnd(8,18), h=rnd(10,40); const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,w),mat(["#d8cfc2","#c9c2b8","#e6ddd0","#bdb5aa"][i%4],{roughness:.9})); b.position.set(rnd(-120,140),-32+h/2,rnd(-40,-110)); scene.add(b); }
  // yatak (başlık sol duvarda), komodinler, lambalar
  const yat=new THREE.Group(); yat.position.set(x0+1.05,0,-.7); scene.add(yat); yat.userData.engel={kutu:[1.05,.95]}; B.yatak=yat;
  const ce=new THREE.Mesh(new THREE.BoxGeometry(2.05,.32,1.85),mat("#5a4438",{roughness:.6})); ce.position.y=.2; yat.add(ce);
  B.carsaf=new THREE.Mesh(new THREE.BoxGeometry(2.0,.2,1.8),mat("#fbfaf7",{roughness:.95})); B.carsaf.position.y=.46; B.carsaf.receiveShadow=true; yat.add(B.carsaf);
  const ort=new THREE.Mesh(new THREE.BoxGeometry(.55,.04,1.88),mat("#7a2236",{roughness:.9})); ort.position.set(.65,.575,0); yat.add(ort); B.yatakOrtu=ort;
  const bsl=new THREE.Mesh(new THREE.BoxGeometry(.08,1.1,2.1),mat("#4a3a32",{roughness:.7})); bsl.position.set(-1.04,.75,0); yat.add(bsl);
  B.yastiklar=[]; for(const z of [-.45,.45]) for(const k of [0,1]){ const y=new THREE.Mesh(new THREE.BoxGeometry(.32,.16,.62),mat(k?"#f3efe8":"#ffffff",{roughness:.95})); y.position.set(-.8+k*.16,.62+k*.05,z); y.rotation.z=-.35; yat.add(y); B.yastiklar.push(y); }
  for(const z of [-1.3,1.3]){ const k=new THREE.Group(); k.position.set(x0+.25,0,-.7+z); scene.add(k); k.userData.engel=.28; const kk=new THREE.Mesh(new THREE.BoxGeometry(.45,.5,.42),mat("#5a4438",{roughness:.6})); kk.position.y=.25; k.add(kk);
    const lb=new THREE.Mesh(new THREE.CylinderGeometry(.05,.07,.25,12),mat("#d9c7a8")); lb.position.y=.63; k.add(lb); const ls=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,.2,16,1,true),new THREE.MeshStandardMaterial({color:renk("#fff3e2"),emissive:renk("#ffcf9a"),emissiveIntensity:ops.gece?1.2:.5,side:THREE.DoubleSide})); ls.position.y=.85; k.add(ls); }
  B.lamba1=new THREE.PointLight(renk("#ffc890"),ops.gece?1.6:.6,7,1.4); B.lamba1.position.set(x0+.3,1.0,-2.0); scene.add(B.lamba1);
  B.lamba2=new THREE.PointLight(renk("#ffc890"),ops.gece?1.6:.6,7,1.4); B.lamba2.position.set(x0+.3,1.0,.6); scene.add(B.lamba2);
  // TV ve konsol (sağ duvar)
  const kon=new THREE.Group(); kon.position.set(-x0-.25,0,-.7); scene.add(kon); kon.userData.engel={kutu:[.25,.9]};
  const ko=new THREE.Mesh(new THREE.BoxGeometry(.45,.55,1.8),mat("#5a4438",{roughness:.6})); ko.position.y=.275; kon.add(ko);
  const tvc=new THREE.Mesh(new THREE.BoxGeometry(.04,.68,1.15),mat("#0d0d10",{roughness:.3,metalness:.4})); tvc.position.set(.18,1.32,0); kon.add(tvc);
  B.tvC=document.createElement("canvas"); B.tvC.width=256; B.tvC.height=144; B.tvT=new THREE.CanvasTexture(B.tvC); B.tvT.encoding=THREE.sRGBEncoding;
  B.tvEkran=new THREE.Mesh(new THREE.PlaneGeometry(1.09,.62),new THREE.MeshBasicMaterial({map:B.tvT,toneMapped:false})); B.tvEkran.position.set(-x0-.096,1.32,-.7); B.tvEkran.rotation.y=-Math.PI/2; scene.add(B.tvEkran); B.tvCiz("kapali");
  B.tvIsik=new THREE.PointLight(renk("#9fc2ff"),0,4,1.5); B.tvIsik.position.set(-x0-.6,1.3,-.7); scene.add(B.tvIsik);
  // koltuk, sehpa, gardırop, banyo kapısı, giriş kapısı, ayna
  const kol=new THREE.Group(); kol.position.set(x0+.55,0,z0+.75); kol.rotation.y=Math.PI*.75; scene.add(kol); kol.userData.engel=.42; B.koltuk=kol;
  const km=mat("#8a6a5a",{roughness:.95}); const ko1=new THREE.Mesh(new THREE.BoxGeometry(.75,.42,.72),km); ko1.position.y=.21; kol.add(ko1); const ko2=new THREE.Mesh(new THREE.BoxGeometry(.75,.5,.14),km); ko2.position.set(0,.66,-.29); kol.add(ko2);
  for(const s of [-1,1]){ const k=new THREE.Mesh(new THREE.BoxGeometry(.12,.28,.72),km); k.position.set(s*.32,.52,0); kol.add(k); }
  const gar=new THREE.Mesh(new THREE.BoxGeometry(.62,2.3,1.3),mat("#5a4438",{roughness:.6})); gar.position.set(-x0-.31,1.15,2.15); gar.castShadow=true; scene.add(gar); gar.userData.engel={kutu:[.31,.65]}; gar.userData.kameraEngel=true;
  B.girisP=new THREE.Vector3(.9,0,-z0-.4);
  const kapi=new THREE.Mesh(new THREE.PlaneGeometry(.95,2.1),mat("#4a3a32",{roughness:.55})); kapi.position.set(.9,1.05,-z0-.012); kapi.rotation.y=Math.PI; scene.add(kapi); B.kapi=kapi;
  const no=new THREE.Mesh(new THREE.PlaneGeometry(.2,.1),new THREE.MeshBasicMaterial({map:yaziDoku("214",{w:128,h:64,zemin:"#d9c7a0",renk:"#3a2a1a",font:"700 40px Georgia"})})); no.position.set(.9,1.75,-z0-.02); no.rotation.y=Math.PI; scene.add(no);
  const bk=new THREE.Mesh(new THREE.PlaneGeometry(.85,2.05),mat("#f3efe8",{roughness:.6})); bk.position.set(x0+.012,1.03,2.2); bk.rotation.y=Math.PI/2; scene.add(bk);
  const ayn=new THREE.Mesh(new THREE.PlaneGeometry(.7,1.0),new THREE.MeshStandardMaterial({color:renk("#dfe6ee"),metalness:1,roughness:.04})); ayn.position.set(x0+.012,1.45,.95); ayn.rotation.y=Math.PI/2; scene.add(ayn); B.ayna=ayn;
  // tavan spotları
  for(const [x,z] of [[0,-1],[0,1.5],[1.5,-1]]){ const s=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.01,12),new THREE.MeshBasicMaterial({color:renk("#fff6e6")})); s.position.set(x,H-.005,z); scene.add(s); }
  B.tavan=new THREE.PointLight(renk("#fff1de"),ops.gece?.35:.8,10,1.3); B.tavan.position.set(.3,H-.3,0); scene.add(B.tavan);
  // balkona yalnızca sürgülü kapı açıkken ve açık yarıdan (sağ yarı) geçilir: kapalı camın içinden yürünmez;
  // balkondayken kapı aralığının dışına kayınca odaya ışınlanmaz, balkon tarafında kalır
  B.balkonAcik=false;
  B.odaSinir=p=>{ const gx0=(bx0+bx1)/2+.15, gx1=bx1-.15, kapida=B.balkonAcik&&p.x>gx0&&p.x<gx1;
    if(p.z<z0){ if(!kapida&&p.z>z0-.25) p.z=z0-.25; p.x=clamp(p.x,-.85,2.4); }
    else { if(!kapida&&p.z<z0+.25) p.z=z0+.25; p.x=clamp(p.x,x0+.3,-x0-.3); }
    p.z=clamp(p.z,z0-1.3,-z0-.3); p.y=0; };
  B.oz0=z0;
}

/* ---------- tren vagonu (ayrı sahne): koltuklar, raflar, pencerelerde akan manzara ---------- */
function trenSahnesi(){
  const s=new THREE.Scene(); s.background=renk("#1a1c22"); EK_SAHNELER.push(s);
  s.add(new THREE.HemisphereLight(renk("#f2f4f8"),renk("#4a4a52"),.75)); const g=new THREE.DirectionalLight(renk("#fff0dc"),.8); g.position.set(-3,4,1); s.add(g);
  const tavL=new THREE.PointLight(renk("#f6f8ff"),.8,12,1.2); tavL.position.set(0,2.1,0); s.add(tavL);
  const W=2.9, L=12, H=2.3;
  const z=new THREE.Mesh(new THREE.PlaneGeometry(W,L),mat("#4a5568",{roughness:1,bumpMap:gurultuDoku(20),bumpScale:.01})); z.rotation.x=-Math.PI/2; s.add(z);
  const kor=new THREE.Mesh(new THREE.PlaneGeometry(.6,L),mat("#6a7486",{roughness:1})); kor.rotation.x=-Math.PI/2; kor.position.y=.002; s.add(kor);
  const tav=new THREE.Mesh(new THREE.CylinderGeometry(W/2,W/2,L,24,1,true,-Math.PI/2,Math.PI),mat("#e9ecf0",{roughness:.6,side:THREE.BackSide})); tav.rotation.x=Math.PI/2; tav.rotation.z=0; tav.scale.set(1,1,.35); tav.position.y=H-.05; s.add(tav);
  const isk=new THREE.Mesh(new THREE.BoxGeometry(.18,.02,L),new THREE.MeshBasicMaterial({color:renk("#fbfdff")})); isk.position.set(0,H+.36,0); s.add(isk);
  // pencereler: iki yanda; manzara dokusu
  const man=document.createElement("canvas"); man.width=512; man.height=192; const mx=man.getContext("2d"); const mt=new THREE.CanvasTexture(man); mt.encoding=THREE.sRGBEncoding;
  const agac=[]; for(let i=0;i<40;i++) agac.push({x:Math.random()*1024,h:rnd(30,70),t:Math.random()<.6?"kavak":"yuvarlak"});
  const direk=[]; for(let i=0;i<6;i++) direk.push(i*170);
  const ciz=(t,tunel)=>{ const g=mx.createLinearGradient(0,0,0,192); g.addColorStop(0,"#9ec4e6"); g.addColorStop(.6,"#e6eef4"); g.addColorStop(1,"#cfd8c0"); mx.fillStyle=g; mx.fillRect(0,0,512,192);
    const o1=(t*12)%512; mx.fillStyle="#8fa0a8"; for(let k=-1;k<2;k++){ mx.beginPath(); mx.moveTo(k*512-o1,130); for(let i=0;i<=16;i++) mx.lineTo(k*512-o1+i*32,104+Math.sin(i*.9+k)*14+Math.sin(i*2.1)*6); mx.lineTo(k*512-o1+512,192); mx.lineTo(k*512-o1,192); mx.fill(); }
    const o2=(t*40)%512; mx.fillStyle="#7d9a5a"; for(let k=-1;k<2;k++){ mx.beginPath(); mx.moveTo(k*512-o2,150); for(let i=0;i<=16;i++) mx.lineTo(k*512-o2+i*32,138+Math.sin(i*1.3+k*2)*8); mx.lineTo(k*512-o2+512,192); mx.lineTo(k*512-o2,192); mx.fill(); }
    mx.fillStyle="#6a8fae"; mx.fillRect(0,158,512,8);
    const o3=(t*180)%1024; for(const a of agac){ const x=((a.x-o3)%1024+1024)%1024-256; if(x<-40||x>540) continue; mx.fillStyle="#5a3c26"; mx.fillRect(x,150-a.h*.3,4,a.h*.3+20); mx.fillStyle=a.t==="kavak"?"#4f7a3a":"#6f9443"; mx.beginPath(); if(a.t==="kavak") mx.ellipse(x+2,150-a.h*.6,9,a.h*.45,0,0,7); else mx.arc(x+2,150-a.h*.4,a.h*.3,0,7); mx.fill(); }
    const o4=(t*420)%170; mx.fillStyle="#3a3c40"; for(const d of direk){ const x=d-o4; mx.fillRect(x,40,5,152); mx.fillRect(x-14,46,34,3); }
    mx.strokeStyle="rgba(40,40,44,.6)"; mx.lineWidth=1.5; mx.beginPath(); mx.moveTo(0,48); mx.quadraticCurveTo(256,58,512,48); mx.stroke();
    if(tunel>0){ mx.fillStyle=`rgba(10,10,14,${tunel})`; mx.fillRect(0,0,512,192); }
    mt.needsUpdate=true; };
  ciz(0,0);
  const camM=new THREE.MeshBasicMaterial({map:mt,toneMapped:false});
  const koltukM=mat("#2f4f8a",{roughness:.95,bumpMap:gurultuDoku(12),bumpScale:.006}), ortu=mat("#f4f6f8",{roughness:.9}), gov=mat("#d9dde3",{roughness:.6});
  for(const sx of [-1,1]){ const d=new THREE.Mesh(new THREE.PlaneGeometry(L,H),gov); d.position.set(sx*W/2,H/2,0); d.rotation.y=-sx*Math.PI/2; s.add(d);
    for(let i=0;i<6;i++){ const p=new THREE.Mesh(new THREE.PlaneGeometry(1.25,.75),camM); p.position.set(sx*(W/2-.01),1.35,-5+i*2); p.rotation.y=-sx*Math.PI/2; if(sx>0) p.scale.x=-1; s.add(p);
      const c=new THREE.Mesh(new THREE.BoxGeometry(.03,.85,1.35),mat("#9aa2ad",{metalness:.5,roughness:.4})); c.position.set(sx*(W/2-.005),1.35,-5+i*2); s.add(c); }
    const raf=new THREE.Mesh(new THREE.BoxGeometry(.45,.03,L),mat("#b9c0c9",{metalness:.6,roughness:.4})); raf.position.set(sx*(W/2-.25),1.95,0); s.add(raf); }
  const koltuklar=[];
  for(let r=0;r<6;r++) for(const sx of [-1,1]) for(const k of [0,1]){ const g2=new THREE.Group(); g2.position.set(sx*(.5+k*.48),0,-5+r*1.95); s.add(g2);
    const o=new THREE.Mesh(new THREE.BoxGeometry(.46,.12,.46),koltukM); o.position.y=.45; g2.add(o); const sr=new THREE.Mesh(new THREE.BoxGeometry(.46,.75,.12),koltukM); sr.position.set(0,.88,.24); sr.rotation.x=.1; g2.add(sr);
    const bo=new THREE.Mesh(new THREE.BoxGeometry(.4,.14,.125),ortu); bo.position.set(0,1.2,.26); bo.rotation.x=.1; g2.add(bo); const ay=new THREE.Mesh(new THREE.BoxGeometry(.06,.4,.3),gov); ay.position.set(0,.2,0); g2.add(ay);
    koltuklar.push(g2); }
  const kapi=new THREE.Mesh(new THREE.PlaneGeometry(1.0,2.0),mat("#9aa2ad",{metalness:.6,roughness:.35})); kapi.position.set(0,1.0,-6); s.add(kapi);
  const cam=new THREE.PerspectiveCamera(55,9/16,.05,60);
  return {scene:s,camera:cam,ciz,koltuklar};
}

/* ================= BÖLÜM NESNESİ ================= */
const BI={
  id:"kus", no:6, ad:"Kuş 46 Numara mı?", tarih:"21 Mart 2025", alt:"Ehliyet günü tren, otelde gizemli izler, film gecesi",
  async kur(){ await this.otelKur("ogle"); },
  async otelKur(evre){
    this.evre=evre; this.faz="otel"; this.t=0; ETK=[]; ICSAHNE=null; this.serbest=false; this.tw=[]; this.tren=null; this.calisPozu=false; this.tvDurum="kapali"; this.tvBagli=false;
    const gece=evre==="aksam", sabah=evre==="sabah";
    const gy=sabah?new THREE.Vector3(.6,.45,-1).normalize():gece?new THREE.Vector3(-.3,-.1,-1).normalize():new THREE.Vector3(-.5,.35,-1).normalize();
    sahneKur({sis:gece?"#141a2c":"#c9d6e2",sisYakin:120,sisUzak:900,ust:gece?"#070b20":sabah?"#5f98d6":"#8fb0cf",ufuk:gece?"#2a3058":sabah?"#e6f0f6":"#e9e2d8",alt:gece?"#0a0e18":"#9aa6ae",gunesYon:gy,isikYon:sabah?gy:new THREE.Vector3(-.3,.6,-1),gunesRenk:"#fff0d8",isik:gece?"#9fb0ff":"#fff1e0",isikGuc:gece?.1:sabah?1.4:.9,zemin:"#6a5a52",hemi:gece?.25:.62,dolgu:gece?.1:.35,yildiz:gece?.8:0,parlak:gece?.2:1});
    otelOdasi(this,{gece}); this.otelSahne=scene;
    this.kar=karakter("kardelen","gunluk"); this.oyuncu=this.kar; scene.add(this.kar);
    this.kaan=karakter("kaan","gunluk"); this.kaan.visible=false; scene.add(this.kaan);
    KONUSANLAR=evre==="ogle"?{kardelen:this.kar}:{kardelen:this.kar,kaan:this.kaan}; // öğlen Kaan trende: görünmez Kaan konuşma kamerasını kendi arkasına almasın
    this.tel=telefonYap(); this.tel.userData.telefon=true; this.tel.visible=false; scene.add(this.tel);
    this.kemanKutu=kemanKutusuYap(); this.kemanKutu.position.set(-1.65,.42,-2.55); this.kemanKutu.rotation.y=Math.PI*.75; this.kemanKutu.visible=evre!=="ogle"; scene.add(this.kemanKutu);
    this.kedi=kediYap(); this.kedi.visible=false; scene.add(this.kedi);
    const D=this.kar;
    if(evre==="ogle"){ D.position.copy(this.girisP); D.rotation.y=Math.PI; this.izleriKoy(); }
    else if(evre==="aksam"){ D.position.set(-.3,0,1.2); D.rotation.y=Math.PI*.7; }
    else { D.position.set(.8,0,-3.75); D.rotation.y=Math.PI; }
    Kamera.sinema=null; Kamera.aci=.25; Kamera.mesafe=3.4; Kamera.yukseklik=1.8; Kamera.hedef.copy(D.position); Kamera.poz.set(D.position.x+1,2.4,D.position.z+3);
    Ses.ton=gece?"gece":"sicak";
    // tren ayrı sahnede (kesmelerle geçilir)
    if(evre==="ogle"){ this.tren=trenSahnesi(); this.trenKaan=karakter("kaan","gunluk"); const k=this.trenKaan; k.position.set(-.98,0,-1.1+.0); k.rotation.y=Math.PI; k.userData.otur=1; k.userData.oturY=.47; this.tren.scene.add(k);
      this.trenTel=telefonYap(); this.trenTel.userData.telefon=true; this.tren.scene.add(this.trenTel);
      this.kondoktor=kalabalik("rpm",{ust:"#24324f",alt:"#1d2433",anim:"idle",sac:"#2a2522"}); if(this.kondoktor){ kafaEkle(this.kondoktor,"rpm"); this.kondoktor.position.set(0,0,-4.5); this.kondoktor.rotation.y=0; this.tren.scene.add(this.kondoktor); }
      this.tren.scene.environment=scene.environment; }
  },
  izleriKoy(){ this.izler=[]; const yat=this.yatak.position;
    const P=[[yat.x-.3,.565,yat.z-.45,.3],[yat.x+.05,.565,yat.z-.2,.6],[yat.x+.4,.565,yat.z+.1,.2],[yat.x+.75,.565,yat.z+.35,.5],
      [.05,.004,-.95,.9],[.38,.004,-1.55,.7],[.72,.004,-2.15,.8],[1.08,.004,-2.76,.6]]; // son iz açılacak kapının önünde
    for(const [x,y,z,r] of P){ const p=patiIzi(y>.1?.085:.095); p.position.set(x,y,z); p.rotation.z=r; scene.add(p); this.izler.push(p); } },
  tvCiz(durum,t=0){ const c=this.tvC; if(!c) return; const x=c.getContext("2d");
    if(durum==="kapali"){ x.fillStyle="#050507"; x.fillRect(0,0,256,144); }
    else if(durum==="menu"){ const g=x.createLinearGradient(0,0,256,144); g.addColorStop(0,"#1b2a4a"); g.addColorStop(1,"#3a1b4a"); x.fillStyle=g; x.fillRect(0,0,256,144); x.fillStyle="#fff"; x.font="700 14px Arial"; x.fillText("Ekran yansıtma",14,26); x.font="12px Arial"; x.fillText(this.tvBagli?"✓ Kardelen'in telefonu":"Cihaz aranıyor…",14,48);
      ["Bir Yaz Masalı","Uzak Şehir","Son Tren"].forEach((f,i)=>{ x.fillStyle=`hsl(${i*60+300},45%,${35+i*5}%)`; x.fillRect(14+i*80,64,70,60); x.fillStyle="#fff"; x.font="10px Arial"; x.fillText(f,16+i*80,136); }); }
    else if(durum==="film"){ const k=Math.sin(t*.3)*.5+.5; const g=x.createLinearGradient(0,0,0,144); g.addColorStop(0,`hsl(${210+k*40},50%,${25+k*10}%)`); g.addColorStop(1,"#0a0a12"); x.fillStyle=g; x.fillRect(0,0,256,144);
      x.fillStyle="#f2c8a8"; x.beginPath(); x.arc(90+Math.sin(t*.7)*20,80,14,0,7); x.fill(); x.fillStyle="#2a2a3a"; x.fillRect(76+Math.sin(t*.7)*20,94,28,50);
      x.fillStyle="#f6d6c0"; x.beginPath(); x.arc(170-Math.sin(t*.5)*14,84,12,0,7); x.fill(); x.fillStyle="#7a2236"; x.fillRect(158-Math.sin(t*.5)*14,96,24,48);
      x.fillStyle="rgba(0,0,0,.6)"; x.fillRect(0,124,256,20); x.fillStyle="#fff"; x.font="11px Arial"; x.fillText(["Bunu sana çok önce söylemeliydim…","Yağmur dinmeden gitme.","Her şey burada başladı."][Math.floor(t/5)%3],12,138); }
    this.tvT.needsUpdate=true; },
  tween(sure,f){ return new Promise(r=>this.tw.push({t:0,sure,f,r})); },
  qte(yazi){ return BK.qte.call(this,yazi); },
  trenGoster(){ ICSAHNE=null; scene=this.tren.scene; KONUSANLAR={kaan:this.trenKaan,kardelen:this.kar,kondoktor:this.kondoktor}; this.trende=true;
    camera.position.set(-.35,1.25,-2.05); camera.lookAt(-.98,1.0,-1.1); this.trenKam=dt=>{ camera.position.set(.22+Math.sin(this.t*7)*.004,1.52+Math.sin(this.t*11)*.003,-2.75); camera.lookAt(-1.05,1.08,-.85); }; Kamera.sinema=this.trenKam; },
  otelGoster(){ scene=this.otelSahne; KONUSANLAR=this.kaan&&this.kaan.visible?{kardelen:this.kar,kaan:this.kaan,gorevli:this.gorevli}:{kardelen:this.kar,gorevli:this.gorevli}; this.trende=false; Kamera.sinema=null; oyuncuKamerasi(); },
  async basla(){
    katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle();
    const D=this.kar;
    // 1) trende Kaan
    await gecis(async()=>{ this.trenGoster(); });
    const K=this.trenKaan;
    await sahne(async()=>{ const kam=Kamera.sinema;
      Kamera.sinema=dt=>{ camera.position.set(.6,1.7,-4.4); camera.lookAt(-.6,1.0,-1.0); };
      baslikKarti(this.ad,[this.tarih,"Bölüm "+this.no]); await bekle(3500);
      Kamera.sinema=kam;
      await anlat("21 Mart 2025. Sabah ehliyetimi aldım. Geçici belgesi daha cebimde, öğleden sonra trene bindim.",3600);
      await anlat("O sabah otobüsle çıkmıştı, kemanını da yanına almıştı. Otele benden önce varacaktı.",3400);
      K.userData.telefon=2; this.trenTel.visible=true; eldeTut(K,this.trenTel,"S");
      const dm=DM.ac("Kardelen 💕","çevrimiçi"); dm.zaman("21 Mart · 15:02");
      await dm.yaz("o","Ben vardım, otele geçiyorum"); await dm.yaz("ben","Rezervasyon benim adıma, bir sorun çıkarsa beni ara 😄");
      await dm.yaz("o","Tamam kocam kdkdkd"); await dm.yaz("ben","Trene bindim. Ehliyetli adam olarak geliyorum, haberin olsun");
      await dm.yaz("o","Hayırlı olsun ehliyetin minikom"); await bekle(400); DM.kapat();
      K.userData.telefon=0; K.userData.eldeki=null; this.trenTel.visible=false;
    });
    await this.biletKontrol();
    // 2) otelde Kardelen
    await gecis(async()=>{ this.otelGoster(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(-1.2,1.9,-1.6),bas(D));
      await anlat("Saat üç buçuk. Odanın kapısını açtı.",2400);
      await yuruHedef(D,new THREE.Vector3(.6,0,1.4),1.1);
      await konus("kardelen",["Oda çok güzel","Balkonu da varmış 😍"],{gul:1,uzak:1.6});
      await konus("kardelen",["Bir dakika","Yatağın üstünde ne var öyle"],{gul:.1,uzak:1.6});
    });
    gorev("Yataktaki izlere bak");
    this.serbest=true; gizliKalpler(this,[[2.0,1.0,.95,0],[-1.0,1.0,-2.45,1],[2.3,1.0,-3.4,2]]);
    await etkBekle(this.izler[1],"İzlere bak",{mesafe:1.6,isaretY:.4});
    this.serbest=false; gorev(null);
    await sahne(async()=>{ const p=this.izler[1].position.clone();
      await kameraNoktasi(p.clone().add(new THREE.Vector3(.5,.7,.6)),p,1.2);
      await konus("kardelen",["Bunlar ne ya","Kuş mu girmiş buraya"],{kamera:false,gul:0});
      D.userData.telefon=2; this.tel.visible=true; eldeTut(D,this.tel,"S");
      const foto=await kareAl(300);
      const dm=DM.ac("Kaan 💙","trende"); dm.zaman("15:42");
      if(foto) await dmResim("ben",foto);
      await dm.yaz("ben","Odaya kuş girmiş galiba"); await dm.yaz("ben","Yatakta izler var 😳");
      await bekle(500); DM.kapat(); D.userData.telefon=0; D.userData.eldeki=null; this.tel.visible=false;
    });
    // 3) trende cevap
    await gecis(async()=>{ this.trenGoster(); });
    await sahne(async()=>{
      K.userData.telefon=2; this.trenTel.visible=true; eldeTut(K,this.trenTel,"S");
      const dm=DM.ac("Kardelen 💕","çevrimiçi"); dm.zaman("Öğleden sonra");
      await dm.yaz("o","Odaya kuş girmiş galiba"); await dm.yaz("o","Yatakta izler var 😳");
      await dm.sec(["Kuş 46 numara mı giyiyormuş? 😄"]);
      await dm.yaz("ben","Kuş 46 numara mı giyiyormuş? 😄");
      await dm.yaz("o","kdkdkdkdkd"); await dm.yaz("o","Dur bakıyorum, izler balkona gidiyor");
      await bekle(400); DM.kapat(); K.userData.telefon=0; K.userData.eldeki=null; this.trenTel.visible=false;
      await anlat("Pencereden Bilecik'in tepeleri akıp gidiyordu. Ben gülmekten telefonu düşürecektim.",3200);
    });
    // 4) izleri takip et → balkonda kedi
    await gecis(async()=>{ this.otelGoster(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await this.izTakibi();
    await this.gorevliGelir();
    await this.televizyon();
    await this.aksam();
  },
  async biletKontrol(){
    const K=this.trenKaan, C=this.kondoktor; if(!C) return;
    await sahne(async()=>{ C.userData.hiz=1; C.userData.yol=null;
      await this.tween(3,t=>{ C.position.z=-4.5+t*3.0; });
      C.userData.hiz=0; C.position.set(-.05,0,-1.5); C.rotation.y=-Math.PI/2+.3;
      Kamera.sinema=dt=>{ camera.position.set(.45,1.45,-2.6); camera.lookAt(-.5,1.25,-1.2); };
      await konus("kondoktor","İyi günler, biletinizi alabilir miyim?",{dinleyen:"kaan",kamera:false});
    });
    gorev("Bileti göster");
    await this.qte("📱 E-bileti göster");
    K.userData.telefon=3; this.trenTel.visible=true; eldeTut(K,this.trenTel,"S"); Ses.efekt("vuru",.3);
    await sahne(async()=>{ await bekle(900);
      await konus("kondoktor","Teşekkürler, iyi yolculuklar. İzmit'e üç saat var.",{dinleyen:"kaan",kamera:false});
      await konus("kaan","Sağ olun. Üç saat… Uçsa bu tren.",{kamera:false,gul:.5});
      K.userData.telefon=0; K.userData.eldeki=null; this.trenTel.visible=false;
      C.userData.hiz=1; await this.tween(2.5,t=>{ C.position.z=-1.5+t*3; C.rotation.y=0; }); C.userData.hiz=0;
      C.visible=false; });
    gorev(null);
    Kamera.sinema=this.trenKam;
  },
  async izTakibi(){
    const D=this.kar;
    gorev("İzleri takip et · 0 / 3");
    this.serbest=true;
    const sira=[this.izler[4],this.izler[6],this.izler[7]];
    for(let i=0;i<3;i++){ await etkBekle(sira[i],i<2?"İze bak":"Perdeyi aç",{mesafe:1.3,isaretY:.3}); Ses.efekt("vuru",.25);
      if(i<2) await sahne(async()=>{ await konus("kardelen",i?["Balkona doğru gidiyor"]:["Burada da var","Yerde de"],{gul:.2,sure:1.6}); });
      gorev(`İzleri takip et · ${i+1} / 3`); }
    this.serbest=false; gorev(null);
    // perde açılır, balkonda kedi
    const S=this.balkonSandalye[0]; this.kedi.visible=true; this.kedi.position.set(S.position.x,.45,S.position.z); this.kedi.rotation.y=-Math.PI*.8;
    await this.tween(1.2,t=>{ this.tulPerde.position.x=-.4+.65+t*1.1; this.tulPerde.scale.x=1-t*.6; this.camKapi.position.x=-.4+2.4*.75-t*1.1; }); this.balkonAcik=true;
    await sahne(async()=>{
      await kameraNoktasi(new THREE.Vector3(.2,1.4,-2.2),this.kedi.position.clone().add(new THREE.Vector3(0,.2,0)),1.3);
      await yuruHedef(D,new THREE.Vector3(1.3,0,-2.85),1); await yuruHedef(D,new THREE.Vector3(1.25,0,-3.5),.9); cevir(D,this.kedi.position); // açık yarıdan geçer
      Ses.efekt("kalp",.4); await anlat("Balkonda, sandalyenin üstünde, tombul bir tekir kedi.",2600);
      await konus("kardelen",["Aaa","Kuş değil kediymiş bu kdkdkd","46 numara da değil, minicik patiler"],{gul:1});
    });
    gorev("Kediyi sev");
    sabitKamera(new THREE.Vector3(2.05,1.3,-3.0),this.kedi.position.clone().add(new THREE.Vector3(-.2,.15,0)));
    await this.qte("🐾 Kediyi sev");
    Ses.efekt("parilti",.4); this.miyav();
    await sahne(async()=>{ D.userData.kolS.rotation.set(-1.0,0,-.2); await bekle(1400); D.userData.kolS.rotation.set(0,0,0);
      await konus("kardelen",["Seni gidi pati","Balkon kapısını açık bulmuşsun he"],{gul:1});
      const k=this.kedi, p0=k.position.clone(); await this.tween(.9,t=>{ k.position.lerpVectors(p0,new THREE.Vector3(2.75,1.1,p0.z-.4),t); k.position.y=.45+Math.sin(t*Math.PI)*.9; k.rotation.y=-Math.PI/2; });
      k.visible=false; this.miyav(.7);
      await konus("kardelen",["Komşu balkona atladı","Bay bay 👋"],{gul:1});
      D.userData.telefon=2; this.tel.visible=true; eldeTut(D,this.tel,"S");
      const dm=DM.ac("Kaan 💙","trende");
      await dm.yaz("ben","Kuş değilmiş! Kedi 😂"); await dm.yaz("ben","Balkon kapısından süzülmüş");
      await dm.yaz("o","Hahaha"); await dm.yaz("o","Değiştirsinler çarşafları, söyle");
      await dm.yaz("ben","Resepsiyona söyledim, geliyorlar"); await bekle(400); DM.kapat(); D.userData.telefon=0; D.userData.eldeki=null; this.tel.visible=false;
    });
    gorev(null);
  },
  miyav(h=1){ if(!Ses.ac) return; const A=Ses.ac, t=A.currentTime; const o=A.createOscillator(), g=A.createGain(), f=A.createBiquadFilter(); o.type="sawtooth"; f.type="bandpass"; f.frequency.value=1400; f.Q.value=3;
    o.frequency.setValueAtTime(520,t); o.frequency.linearRampToValueAtTime(820,t+.18); o.frequency.linearRampToValueAtTime(460,t+.55); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.12*h,t+.05); g.gain.linearRampToValueAtTime(0,t+.6);
    o.connect(f); f.connect(g); g.connect(Ses.kuru); o.start(t); o.stop(t+.65); },
  async gorevliGelir(){
    const D=this.kar;
    this.gorevli=kalabalik("michelle",{ust:"#5a6a7a",alt:"#2a2a33",anim:"idle",ton:"#efe6e0",boy:.97}); if(this.gorevli){ kafaEkle(this.gorevli,"michelle"); this.gorevli.position.set(.9,0,2.6); this.gorevli.rotation.y=Math.PI; scene.add(this.gorevli); }
    KONUSANLAR.gorevli=this.gorevli;
    await sahne(async()=>{ Ses.efekt("zil",.6); await bekle(600);
      // görevli de kapıdan içeri yürür (bir anda yer değiştirmez)
      await Promise.all([yuruHedef(D,new THREE.Vector3(.4,0,.9),1.1),this.gorevli?yuruHedef(this.gorevli,new THREE.Vector3(.6,0,1.9),.9):null]); if(this.gorevli){ cevir(this.gorevli,D.position); cevir(D,this.gorevli.position); }
      await konus("gorevli","Kusura bakmayın kızım, balkon kapısı açık kalmış galiba. Çarşafları hemen değiştirelim.",{dinleyen:"kardelen"});
      await konus("kardelen",["Olur öyle teyzeciğim","Ben de yardım edeyim"],{gul:.9,dinleyen:"gorevli"});
    });
    // çarşaf: dört köşe, iki yastık
    const C=this.carsaf, Y=this.yatak.position; C.material=C.material.clone(); C.material.color=renk("#e9e4dc");
    const yeni=new THREE.Mesh(new THREE.PlaneGeometry(2.0,1.8),mat("#ffffff",{roughness:.95,side:THREE.DoubleSide})); yeni.rotation.x=-Math.PI/2; yeni.position.set(Y.x,.58,Y.z); yeni.scale.set(.05,.05,1); scene.add(yeni);
    this.izler.slice(0,4).forEach(i=>i.visible=true);
    if(this.gorevli){ this.gorevli.position.set(Y.x+1.2,0,Y.z+1.2); cevir(this.gorevli,Y); }
    D.position.set(Y.x+1.25,0,Y.z-1.15); cevir(D,Y);
    kameraNoktasi(new THREE.Vector3(Y.x+2.5,2.0,Y.z+.7),Y.clone().add(new THREE.Vector3(0,.4,0))); // kesme: yatağın başına alınmaları görünmesin
    await sahne(async()=>{ await kameraNoktasi(new THREE.Vector3(Y.x+2.2,1.9,Y.z+.4),Y.clone().add(new THREE.Vector3(0,.4,0)),1.1); });
    const kos=["Sol üst köşe","Sağ üst köşe","Sağ alt köşe","Sol alt köşe"];
    for(let i=0;i<4;i++){ gorev(`Çarşafı ser · ${i} / 4`); await this.qte("🛏️ "+kos[i]); Ses.efekt("vuru",.25);
      const s0=yeni.scale.x; await this.tween(.4,t=>{ const v=s0+(Math.min(1,(i+1)/4)-s0)*t; yeni.scale.set(v,Math.min(1,v*1.2),1); }); }
    this.izler.forEach(i=>i.visible=false); C.material.color=renk("#fbfaf7"); yeni.visible=false;
    gorev("Yastık kılıfları · 0 / 2");
    for(let i=0;i<2;i++){ await this.qte("🤍 Yastık kılıfı"); const y=this.yastiklar[i*2]; await this.tween(.35,t=>{ y.scale.set(1,1+Math.sin(t*Math.PI)*.25,1); }); gorev(`Yastık kılıfları · ${i+1} / 2`); }
    gorev(null);
    await sahne(async()=>{
      await konus("gorevli","Elinize sağlık kızım, Allah razı olsun. Siz olmasanız yarım saat uğraşırdım.",{dinleyen:"kardelen"});
      await konus("kardelen",["Ne demek","Kolay gelsin size"],{gul:1,dinleyen:"gorevli"});
      if(this.gorevli){ await yuruHedef(this.gorevli,this.girisP.clone(),1.0); this.gorevli.visible=false; }
      await konus("kardelen",["Teyze yorulmuştu ya","İyi ki yardım ettim"],{gul:.4,uzak:1.6});
      await konus("kardelen",["Ama oda kedi kokuyor","Sprey sıkayım bari"],{gul:.6,uzak:1.6});
    });
    // oda spreyi: basılı tut
    gorev("Oda spreyini sık");
    const ui=el(`<div class="sim"><div class="baslik">Oda spreyi</div><div class="ipucu">Basılı tut, odayı mis gibi yap</div><div class="olcek" style="align-self:center;width:100%"><div class="bar"><i style="width:0%"></i></div></div><div class="satir"><button class="tut">🌸 Sık</button></div></div>`); katman.appendChild(ui);
    const btn=ui.querySelector(".tut"), bar=ui.querySelector(".bar i"); let v=0, bas_=false;
    btn.addEventListener("pointerdown",e=>{ e.preventDefault(); bas_=true; btn.classList.add("basili"); }); const bit=()=>{ bas_=false; btn.classList.remove("basili"); }; btn.addEventListener("pointerup",bit); btn.addEventListener("pointercancel",bit); btn.addEventListener("pointerleave",bit);
    const bulut=tozlar(60,()=>({x:D.position.x+rnd(-.6,.6),y:rnd(.8,2),z:D.position.z+rnd(-.6,.6)}),"#ffc6dc",.12); bulut.material.opacity=0; scene.add(bulut);
    await new Promise(r=>{ let son=performance.now(); const f=()=>{ if(!ui.isConnected) return; const t=performance.now(), dt=Math.min(.05,(t-son)/1000); son=t; if(bas_){ v=Math.min(1,v+dt*.45); bulut.material.opacity=Math.min(.8,bulut.material.opacity+dt*2); if(Math.random()<.2) Ses.efekt("vuru",.05); } else bulut.material.opacity=Math.max(0,bulut.material.opacity-dt*.6); bar.style.width=(v*100)+"%"; if(v>=1){ return setTimeout(r,500); } requestAnimationFrame(f); }; f(); });
    ui.remove(); gorev(null); setTimeout(()=>{ scene.remove(bulut); },3000);
  },
  async televizyon(){
    const D=this.kar;
    gorev("Telefonunu televizyona bağla");
    this.serbest=true;
    await etkBekle(this.tvEkran,"Ekranı yansıt",{mesafe:2.0,isaretY:-.3});
    this.serbest=false; gorev(null);
    this.tvDurum="menu"; this.tvCiz("menu"); this.tvIsik.intensity=.6;
    await sahne(async()=>{ await kameraNoktasi(new THREE.Vector3(.4,1.5,.4),this.tvEkran.position,1.1); });
    await this.qte("📲 Bağlan");
    this.tvBagli=true; this.tvCiz("menu"); Ses.efekt("parilti",.5);
    await sahne(async()=>{
      await konus("kardelen",["Ooo her şey bağlanıyor","Televizyon çok iyiymiş"],{gul:1,kamera:false});
      D.userData.telefon=2; this.tel.visible=true; eldeTut(D,this.tel,"S");
      const dm=DM.ac("Kaan 💙","trende"); dm.zaman("17:45");
      await dm.yaz("ben","Telefon televizyona bağlanıyor, harika"); await dm.yaz("ben","Akşama film açarız");
      await dm.yaz("o","Filmde uyuyoruz ya 😄"); await dm.yaz("ben","Ne demek o şimdi"); await dm.yaz("ben","Söyle bakalım");
      await dm.yaz("o","Ben mi? Hiçbir şey 😇"); await dm.yaz("o","Arifiye'yi geçtik, az kaldı");
      await bekle(400); DM.kapat(); D.userData.telefon=0; D.userData.eldeki=null; this.tel.visible=false;
    });
    this.tvDurum="kapali"; this.tvCiz("kapali"); this.tvIsik.intensity=0;
  },
  async aksam(){
    await gecis(async()=>{ katmanTemizle(); await this.otelKur("aksam"); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    const D=this.kar, K=this.kaan;
    K.visible=true; K.position.copy(this.girisP); K.rotation.y=Math.PI;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(-1.4,1.7,-1.2),new THREE.Vector3(.6,1.3,1.8));
      await anlat("Akşam yedi buçuk. Kapı çaldı.",2200); Ses.efekt("zil",.6); await bekle(500);
      await yuruHedef(K,new THREE.Vector3(.6,0,1.9),1.2); cevir(D,K.position);
      await yuruHedef(D,new THREE.Vector3(.4,0,1.15),2.4); yuzYuze(K,D); K.userData.saril=D.userData.saril=1; Ses.efekt("kalp");
      await bekle(1800); K.userData.saril=D.userData.saril=0;
      await konus("kaan","Geldim minnakım. Nerede o 46 numaralı kuş, göreyim 😄",{gul:.8});
      await konus("kardelen",["Kaçtı kdkdkd","Komşu balkona atladı","Ama sana bir sürprizim var"],{gul:1});
    });
    // keman: Kaan yatağa oturur, Kardelen çalar
    await sahne(async()=>{ await yuruHedef(K,new THREE.Vector3(-.85,0,.2),1.1); K.rotation.y=-Math.PI*.15; K.userData.otur=1; K.userData.oturY=.5; K.position.x=-.62;
      const U=this.kemanKutu.userData; U.kapak.rotation.x=-1.75; this.kedi.visible=false;
      await yuruHedef(D,new THREE.Vector3(.7,0,-.1),1.1); cevir(D,K.position); cevir(K,D.position);
      const k=U.keman, y=U.yay; scene.attach(k); scene.attach(y); k.scale.setScalar(1); y.scale.setScalar(1); this.elKeman=k; this.elYay=y; this.calisPozu=true; this.yayFaz=.5; this.yayHedef=.5;
      await kameraNoktasi(ondenNokta(D,1.6,.4,.05),bas(D).add(new THREE.Vector3(0,-.25,0)),1.2);
      await konus("kardelen",["Kemanımı getirdim","İlk dinleyicim sensin"],{kamera:false,gul:1});
      await konus("kaan","Konser başlasın. Alkışım hazır, haberin olsun 😄",{gul:.8});
    });
    // konser: Kaan'ın omzunun üstünden Kardelen'e bakan sabit çekim
    { const kp=K.position.clone().setY(0), dp=D.position.clone().setY(0); const yon=dp.clone().sub(kp).normalize(), yan=new THREE.Vector3(-yon.z,0,yon.x);
      sabitKamera(kp.clone().addScaledVector(yon,-.3).addScaledVector(yan,.52).setY(1.34),bas(D).add(new THREE.Vector3(0,-.28,0))); }
    await yayOyunu(this,[659.25,739.99,880,739.99,659.25,587.33],{baslik:"Ona çal"});
    await sahne(async()=>{ K.userData.alkis=1; Ses.efekt("alkis",.5); await bekle(1500); K.userData.alkis=0;
      await konus("kaan","Bravo! Bu kemanı seçen adamın zevkine de bravo 😄",{gul:1});
      await konus("kardelen",["Şapşik","O alkış benim, seçen adamın değil kdkdkd"],{gul:1});
      this.calisPozu=false; D.userData.elHedef=null; this.elKeman.visible=false; this.elYay.visible=false; });
    await this.film();
  },
  async film(){
    const D=this.kar, K=this.kaan;
    await sahne(async()=>{
      K.userData.otur=0; await yuruHedef(K,new THREE.Vector3(-1.05,0,-.35),1); await yuruHedef(D,new THREE.Vector3(-1.05,0,-1.05),1);
      for(const [c,z] of [[K,-.4],[D,-1.0]]){ c.position.set(-1.5,0,z); c.rotation.y=Math.PI/2; c.userData.otur=1; c.userData.oturY=.62; }
      this.tvDurum="film"; this.tvIsik.intensity=1.0; this.lamba1.intensity=.25; this.lamba2.intensity=.25; this.tavan.intensity=.05;
      await kameraNoktasi(new THREE.Vector3(1.2,1.5,-.7),new THREE.Vector3(-1.4,.95,-.7),1.4);
      await anlat("Işıkları kapattık, filmi açtık. Bu sefer uyumayacaktık.",2800);
      await konus("kardelen",["Bu sefer uyumak yok","Söz mü"],{kamera:false,gul:.8});
      await konus("kaan","Söz. Sonuna kadar izliyoruz.",{kamera:false,gul:.5});
    });
    await this.uyanikKal();
    await sahne(async()=>{ D.userData.kafa.rotation.z=-.3; K.userData.kafa.rotation.z=.25;
      await kameraNoktasi(new THREE.Vector3(.3,1.25,-.7),new THREE.Vector3(-1.4,.95,-.7),2.2);
      await anlat("Filmin sonunu ikimiz de görmedik. Film bizi izledi.",3000);
      await anlat("O günden beri film açınca biri mutlaka söyler: filmde uyuyoruz ya.",3200); });
    await this.sabah();
  },
  async uyanikKal(){
    gorev("Uyanık kalmaya çalış"); const n0=NESIL;
    const d=el(`<div class="bk-goz"><i class="ust"></i><i class="alt"></i><div class="sim" style="background:none"><div class="satir"><button class="tut">👀 Uyan!</button></div></div></div>`); katman.appendChild(d);
    const u=d.querySelector(".ust"), a=d.querySelector(".alt"), b=d.querySelector(".tut"); let k=0, tik=0, t0=performance.now();
    await new Promise(r=>{ b.onclick=()=>{ tik++; k=Math.max(0,k-.35); Ses.efekt("vuru",.15); };
      let son=performance.now(); const f=()=>{ if(n0!==NESIL||!d.isConnected) return; const t=performance.now(), dt=Math.min(.05,(t-son)/1000); son=t; const gecen=(t-t0)/1000;
        k=Math.min(1,k+dt*(.12+gecen*.022)); u.style.height=a.style.height=(k*50)+"%";
        if(k>=1||gecen>26){ u.style.height=a.style.height="50%"; b.textContent="😴 Göz kapakları kazandı"; b.disabled=true; return bekle(1300).then(r); } requestAnimationFrame(f); }; f(); });
    d.remove(); gorev(null);
  },
  async sabah(){
    await gecis(async()=>{ katmanTemizle(); await this.otelKur("sabah"); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    const D=this.kar, K=this.kaan;
    K.visible=true; K.position.set(1.5,0,-3.6); K.rotation.y=Math.PI*1.1;
    const S=this.balkonSandalye[1]; this.kedi.visible=true; this.kedi.position.set(2.45,1.02,-4.55); this.kedi.rotation.y=-Math.PI/2;
    this.tulPerde.position.x=-.4+.65+1.1; this.tulPerde.scale.x=.4; this.camKapi.position.x=-.4+2.4*.75-1.1; this.balkonAcik=true;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(.2,1.7,-1.5),new THREE.Vector3(1.4,1.2,-4.2));
      await anlat("Ertesi sabah. Körfez masmavi.",2400);
      await konus("kardelen",["Aaa bak","Kuş yine gelmiş kdkdkd"],{gul:1});
      this.miyav(.8);
      await konus("kaan","Günaydın civcivim. 46 numara kuşumuz da gelmiş 😄",{gul:1});
      { const kp=this.kedi.position; await kameraNoktasi(kp.clone().add(new THREE.Vector3(-.17,.43,1.27)),kp.clone().add(new THREE.Vector3(.02,.2,-.05)),1.2); await hatiraFoto("46 numara kuş · İzmit · Mart 2025",{kendi:true}); await bekle(900); } // kedi yakından, arkada şehir ve körfez (önceki kadrajda Kaan objektifi kapatıyordu)
      // fotoğraf balkonda: kapının orta kayıtı kadrajın dışında kalsın, arkada körfez
      // fotoğraf yerine yürüyerek geçerler (bir anda yer değiştirmezler); kamera da o sırada geriye çekilir
      const kamP=kameraNoktasi(new THREE.Vector3(1.07,1.5,-3.12),new THREE.Vector3(1.07,1.42,-4.4),1.9);
      await Promise.all([yuruHedef(K,new THREE.Vector3(1.26,0,-4.4),1.0),yuruHedef(D,new THREE.Vector3(.88,0,-4.4),1.0)]); yuzYuze(K,D);
      await kamP;
      await hatiraFoto("İzmit · Mart 2025"); await bekle(1600);
      await anlat("Kedi bir daha hiç gelmedi ama adı bizde kaldı: 46 numara kuş.",3200);
    });
    bolumBitti(this.no);
  },
  guncelle(dt){
    this.t+=dt; const D=this.kar;
    this.tw=this.tw.filter(a=>{ a.t+=dt; const k=Math.min(1,a.t/a.sure); a.f(k); if(k>=1){ a.r(); return false; } return true; });
    if(this.trende&&!Kamera.sinema&&this.trenKam) Kamera.sinema=this.trenKam;
    if(this.tren){ this._tz=(this._tz||0)+dt; if(this._tz>.05&&this.trende){ this._tz=0; const tun=Math.max(0,Math.sin(this.t*.21)-.93)*14; this.tren.ciz(this.t,Math.min(1,tun)); } }
    if(this.tvDurum==="film"){ this._tv=(this._tv||0)+dt; if(this._tv>.08){ this._tv=0; this.tvCiz("film",this.t); this.tvIsik.intensity=.8+Math.sin(this.t*1.7)*.25; } }
    if(this.kedi&&this.kedi.visible){ const u=this.kedi.userData; u.kuyruk.rotation.y=Math.sin(this.t*2.2)*.5; u.bas.rotation.y=Math.sin(this.t*.7)*.35; }
    if(this.calisPozu&&this.elKeman){ this.yayFaz=lerp(this.yayFaz,this.yayHedef,1-Math.pow(.004,dt)); kemanTutGuncelle(D,this.elKeman,this.elYay,this.yayFaz); }
    if(!D||this.trende) return;
    if(this.serbest&&!kilit) yuru(D,dt,this.odaSinir,1.7);
    etkilesimGuncelle(D,this.btn);
    if(!Kamera.sinema) Kamera.hedef.lerp(D.position,.12);
  },
  temizle(){ ICSAHNE=null; DM.kapat&&DM.kapat(); Ses.kis(false); if(this.otelSahne&&scene!==this.otelSahne) scene=this.otelSahne; this.trende=false; }
};
