/* ================= BÖLÜM: İLK UZUN YOL (4 Nisan 2025 · Çorum → Kastamonu → Karadeniz) ================= */
/* Ehliyetin ikinci haftası. Bir gece önceden tembih: kemerini tak, hız yapma. Kontrol listesi, Çorum'dan Kastamonu'ya
   hız sınırlarına uyarak sürüş (aşınca telefona “yavaş!” düşer), Kastamonu'da o biner, sonra Karadeniz kıyısı:
   çakıllı sahil, fotoğraflar ve telefonu kayaya yaslayıp çekilen dans videosu. */

/* ---------- ortak: ritimli dans (halka kalbe değince dokun) — B.guncelle içinden ritimGuncelle(B,dt) çağrılır ---------- */
function ritimBasla(B,hedefSay,ops={}){
  B.durum="dans"; B.vurus=0; B.ritimT=0; B.ritimSure=ops.sure||1.4; B.dansIlerle=0; B.ritimHedef=hedefSay; B.ritimEtiket=ops.etiket||"Halka kalbe değdiğinde dokun";
  gorev(`${B.ritimEtiket} · 0 / ${hedefSay}`);
  B.ritimEl=el(`<div class="ritim"><div class="hedefh"></div><div class="daire"></div></div>`); katman.appendChild(B.ritimEl);
  if(B.btn){ B.btn.hidden=false; aksiyonYazi(B.btn,"Şimdi!"); }
  return kosul(()=>B.vurus>=hedefSay).then(()=>{ if(B.ritimEl){ B.ritimEl.remove(); B.ritimEl=null; } aksiyonYazi(B.btn,null); gorev(null); B.durum=null; });
}
function ritimGuncelle(B,dt){
  if(!B.ritimEl) return; B.ritimT+=dt; const k=B.ritimT/B.ritimSure; const d=B.ritimEl.querySelector(".daire"); const boy=150-80*Math.min(k,1.3);
  d.style.width=d.style.height=Math.max(20,boy)+"px"; d.style.opacity=k>1.25?0:1;
  B.dansIlerle=lerp(B.dansIlerle||0,B.vurus/B.ritimHedef,.05);
  if(Girdi.aksiyonBas){ if(Math.abs(k-1)<.2){ B.vurus++; Ses.efekt("vuru"); if(B.ritimVurus) B.ritimVurus(); gorev(B.vurus<B.ritimHedef?`${B.ritimEtiket} · ${B.vurus} / ${B.ritimHedef}`:"Mükemmel");
      const h=B.ritimEl.querySelector(".hedefh"); h.style.boxShadow="0 0 40px #ffcf8a"; setTimeout(()=>{ h.style.boxShadow=""; },200); }
    else { Ses.efekt("vuru",.12); const h=B.ritimEl.querySelector(".hedefh"); h.style.boxShadow="0 0 26px #ff6b6b"; setTimeout(()=>{ h.style.boxShadow=""; },220); } B.ritimT=0; }
  if(k>1.35) B.ritimT=0;
}

/* ---------- motor sesi: testere dalga + alçak geçiren; devir hızla yükselir ---------- */
const Motor={ o:null,
  baslat(){ if(!Ses.ac||this.o) return; const A=Ses.ac; const o=A.createOscillator(), o2=A.createOscillator(), f=A.createBiquadFilter(), g=A.createGain();
    o.type="sawtooth"; o2.type="square"; o.frequency.value=38; o2.frequency.value=19; f.type="lowpass"; f.frequency.value=260; g.gain.value=0;
    const g2=A.createGain(); g2.gain.value=.4; o.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(Ses.kuru); o.start(); o2.start(); g.gain.setTargetAtTime(.05,A.currentTime,.3); this.o={o,o2,f,g}; },
  ayarla(kmh){ if(!this.o) return; const A=Ses.ac, t=A.currentTime; const devir=30+((kmh%38)/38)*45+kmh*.25; this.o.o.frequency.setTargetAtTime(devir,t,.15); this.o.o2.frequency.setTargetAtTime(devir/2,t,.15); this.o.f.frequency.setTargetAtTime(220+kmh*3,t,.2); this.o.g.gain.setTargetAtTime(.035+kmh*.0004,t,.2); },
  durdur(){ if(!this.o) return; const o=this.o; this.o=null; o.g.gain.setTargetAtTime(0,Ses.ac.currentTime,.25); setTimeout(()=>{ try{ o.o.stop(); o.o2.stop(); }catch(e){} },1200); }
};
function tabelaYap(metin,ops={}){ const g=new THREE.Group(); const w=ops.w||2.4, h=ops.h||.9;
  const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:yaziDoku(metin,{w:512,h:Math.round(512*h/w),zemin:ops.zemin||"#1f5fa8",renk:ops.renk||"#ffffff",font:ops.font||"700 72px Arial"}),side:THREE.DoubleSide})); p.position.y=ops.y||2.4; g.add(p);
  for(const s of [-1,1]){ const d=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,ops.y||2.4,6),mat("#8a9099",{metalness:.6,roughness:.4})); d.position.set(s*w*.35,(ops.y||2.4)/2-h/2,-.02); g.add(d); } return g; }
function sinirTabela(kmh){ const g=new THREE.Group(); const c=document.createElement("canvas"); c.width=c.height=128; const x=c.getContext("2d"); x.fillStyle="#fff"; x.beginPath(); x.arc(64,64,62,0,7); x.fill(); x.strokeStyle="#d21f2a"; x.lineWidth=16; x.beginPath(); x.arc(64,64,54,0,7); x.stroke(); x.fillStyle="#111"; x.font="700 52px Arial"; x.textAlign="center"; x.textBaseline="middle"; x.fillText(String(kmh),64,68);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; const p=new THREE.Mesh(new THREE.CircleGeometry(.4,28),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide})); p.position.y=2.0; g.add(p);
  const d=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,2.0,6),mat("#8a9099",{metalness:.6})); d.position.y=1.0; g.add(d); return g; }
function karsiAraba(renkH){ const g=new THREE.Group(); const m=mat(renkH,{metalness:.5,roughness:.35});
  const gv=new THREE.Mesh(new THREE.BoxGeometry(1.8,.7,4.2),m); gv.position.y=.6; g.add(gv); const ust=new THREE.Mesh(new THREE.BoxGeometry(1.6,.55,2.2),m); ust.position.set(0,1.18,.15); g.add(ust);
  const cam=new THREE.Mesh(new THREE.BoxGeometry(1.62,.45,2.0),mat("#1a2430",{metalness:.8,roughness:.1})); cam.position.set(0,1.2,.15); g.add(cam);
  for(const s of [-1,1]) for(const z of [-1.4,1.4]){ const t=new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,.22,14),mat("#111")); t.rotation.z=Math.PI/2; t.position.set(s*.85,.33,z); g.add(t); }
  for(const s of [-.6,.6]){ const f=new THREE.Mesh(new THREE.CircleGeometry(.12,12),new THREE.MeshBasicMaterial({color:renk("#fff6dc")})); f.position.set(s,.7,2.11); g.add(f); }
  return g; }

/* ================= BÖLÜM NESNESİ ================= */
const BY={
  id:"uzunyol", no:7, ad:"İlk Uzun Yol", tarih:"4 Nisan 2025", alt:"Kemerini tak, hız yapma: Çorum'dan Kastamonu'ya, sonra deniz",
  async kur(){ await this.yolKur(); },
  async yolKur(){
    this.faz="yol"; this.t=0; ETK=[]; DALGA=[]; this.tw=[]; this.kmh=0; this.km=0; this.gaz=false; this.fren=false; this.suruyor=false; this.ihlal=0; this.ihlalT=0; this.durum=null;
    const gy=new THREE.Vector3(.3,.55,-.8).normalize();
    sahneKur({sis:"#d9e2ea",sisYakin:60,sisUzak:420,ust:"#6f98c8",ufuk:"#dfe8ef",alt:"#9aa6ae",gunesYon:gy,isikYon:new THREE.Vector3(.4,.75,-.4),gunesRenk:"#fff2dc",isik:"#fff1e0",isikGuc:1.9,zemin:"#8a8a6a",hemi:.9,dolgu:.55});
    // yol (sağ şerit: araba x≈0), banket, zemin
    const yc=document.createElement("canvas"); yc.width=128; yc.height=512; const yx=yc.getContext("2d"); yx.fillStyle="#3c3e42"; yx.fillRect(0,0,128,512);
    for(let i=0;i<9000;i++){ yx.fillStyle=`rgba(${Math.random()<.5?"20,20,22":"90,92,96"},.35)`; yx.fillRect(Math.random()*128,Math.random()*512,1,1); }
    yx.fillStyle="#f2f2ea"; for(let i=0;i<4;i++) yx.fillRect(62,i*128,4,64); yx.fillRect(5,0,4,512); yx.fillRect(119,0,4,512);
    const yt=new THREE.CanvasTexture(yc); yt.wrapS=yt.wrapT=THREE.RepeatWrapping; yt.repeat.set(1,30); yt.encoding=THREE.sRGBEncoding; yt.anisotropy=8; this.yolDoku=yt;
    const yol=new THREE.Mesh(new THREE.PlaneGeometry(8,600),new THREE.MeshStandardMaterial({map:yt,roughness:.85})); yol.rotation.x=-Math.PI/2; yol.position.set(-1.9,0,-280); yol.receiveShadow=true; scene.add(yol);
    this.zeminDoku=gurultuDoku(90); const zm=new THREE.MeshStandardMaterial({color:renk("#8d8a62"),roughness:1,bumpMap:this.zeminDoku,bumpScale:.05});
    for(const sx of [-1,1]){ const z=new THREE.Mesh(new THREE.PlaneGeometry(300,600),zm); z.rotation.x=-Math.PI/2; z.position.set(-1.9+sx*154,-.02,-280); scene.add(z); this.zemin=zm; }
    // uzak tepeler (yavaş akar), ağaç havuzları: kavak (ova), çam (orman), bina (şehir)
    this.tepeler=[]; for(let i=0;i<16;i++){ const sx=i%2?1:-1; const h=rnd(20,60); const t=new THREE.Mesh(new THREE.SphereGeometry(rnd(40,70),18,10),mat(i%3?"#8a8f6a":"#7a8460",{roughness:1})); t.scale.y=h/60*.5; t.position.set(sx*rnd(90,160),-4,-i*40-rnd(0,30)); scene.add(t); this.tepeler.push(t);
      const kar=new THREE.Mesh(new THREE.SphereGeometry(1,14,8,0,Math.PI*2,0,.55),mat("#f4f6f8",{roughness:.9})); kar.scale.set(t.geometry.parameters.radius*.62,t.geometry.parameters.radius*t.scale.y*.62,t.geometry.parameters.radius*.62); kar.position.copy(t.position).add(new THREE.Vector3(0,t.geometry.parameters.radius*t.scale.y*.42,0)); kar.visible=false; scene.add(kar); t.userData.kar=kar; }
    this.havuz={kavak:[],cam:[],bina:[]};
    for(let i=0;i<34;i++){ const a=agac(i%3?"selvi":"yesil",rnd(1,1.4)); a.position.set((i%2?1:-1)*rnd(7,20)-1.9,0,-i*14-rnd(0,8)); scene.add(a); this.havuz.kavak.push(a); }
    for(let i=0;i<40;i++){ const a=agac("cam",rnd(1.1,1.6)); a.position.set((i%2?1:-1)*rnd(6.5,22)-1.9,0,-i*12-rnd(0,6)); a.visible=false; scene.add(a); this.havuz.cam.push(a); }
    const renkler=["#e6ddd0","#d8c9b4","#f0e6d6","#cfc2ae","#e9e0cf"];
    for(let i=0;i<18;i++){ const w=rnd(7,11), h=rnd(9,18); const b=bina(w,h,8,renkler[i%5],i%4===0?["MARKET","FIRIN","ECZANE","LOKANTA"][i%4]:null); b.position.set((i%2?1:-1)*rnd(11,16)-1.9,0,-i*22-rnd(0,6)); b.rotation.y=i%2?-Math.PI/2:Math.PI/2; scene.add(b); this.havuz.bina.push(b); }
    // karşı şerit arabaları
    this.arabalar=["#c9ccd2","#7a2236","#2a3a5a","#f2f2ee"].map((r,i)=>{ const a=karsiAraba(r); a.position.set(-3.9,0,-80-i*140); scene.add(a); return a; });
    // tabelalar
    this.tabelalar=[];
    // araç içi
    this.icKur();
    await kiyafetDokulari([]);
    this.kaan=karakter("kaan","deri"); this.kaan.visible=false; this.kaan.position.set(-.38,.35,.1); scene.add(this.kaan);
    this.kar=karakter("kardelen","deri"); this.kar.visible=false; this.kar.position.set(.42,.3,.05); this.kar.rotation.y=Math.PI; this.kar.userData.otur=1; this.kar.userData.oturY=.42; scene.add(this.kar);
    KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    this.tel=telefonYap(); this.tel.visible=false; scene.add(this.tel);
    this.segment(0,true);
    this.arabaKam=dt=>{ const f=camera.aspect<1?78:58; if(camera.fov!==f){ camera.fov=f; camera.updateProjectionMatrix(); } const s=this.sarsinti||0; camera.position.set(-.38+Math.sin(this.t*31)*.002*s,1.33+Math.sin(this.t*23)*.003*(.3+this.kmh/90),.08); camera.lookAt(-.3+Math.sin(this.t*.4)*.02,1.40,-6); };
    Kamera.sinema=this.arabaKam;
    Ses.ton="sicak";
  },
  icKur(){
    const ic=new THREE.Group(); scene.add(ic); this.ic=ic;
    const yum=mat("#2a2b2e",{roughness:.85});
    const torp=new THREE.Mesh(new THREE.BoxGeometry(1.8,.26,.6),mat("#2a2b2e",{roughness:.7})); torp.position.set(0,.88,-.78); ic.add(torp);
    const ust=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,1.8,16,1,false,0,Math.PI),yum); ust.rotation.z=Math.PI/2; ust.position.set(0,1.01,-.62); ic.add(ust);
    const dir=new THREE.Mesh(new THREE.TorusGeometry(.19,.02,10,32),mat("#151515",{roughness:.6})); dir.position.set(-.38,.96,-.42); dir.rotation.x=-1.0; ic.add(dir); this.direksiyon=dir;
    for(const a of [0,2.2,4.1]){ const k=new THREE.Mesh(new THREE.BoxGeometry(.17,.025,.02),mat("#151515",{roughness:.6})); k.position.set(Math.cos(a)*.085,Math.sin(a)*.085,0); k.rotation.z=a; dir.add(k); }
    const gobek=new THREE.Mesh(new THREE.CylinderGeometry(.045,.05,.035,24),mat("#121212",{roughness:.35,metalness:.2})); gobek.rotation.x=Math.PI/2; dir.add(gobek);
    // gösterge: kemer uyarısı, hız
    const gc=document.createElement("canvas"); gc.width=256; gc.height=96; this.gostC=gc; this.gostT=new THREE.CanvasTexture(gc); this.gostT.encoding=THREE.sRGBEncoding;
    const gp=new THREE.Mesh(new THREE.PlaneGeometry(.26,.1),new THREE.MeshBasicMaterial({map:this.gostT,toneMapped:false})); gp.position.set(-.38,1.01,-.6); gp.rotation.x=-.25; ic.add(gp); this.gosterge(true);
    const kalkan=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.32,16,1,true,0,Math.PI),yum); kalkan.rotation.z=Math.PI/2; kalkan.position.set(-.38,1.06,-.64); ic.add(kalkan);
    const vk=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.22,8),mat("#222")); vk.position.set(0,.86,-.25); vk.rotation.x=-.3; ic.add(vk); const vt=new THREE.Mesh(new THREE.SphereGeometry(.035,12,10),mat("#111",{roughness:.4})); vt.position.set(0,.97,-.28); ic.add(vt);
    const el_=new THREE.Mesh(new THREE.BoxGeometry(.05,.03,.2),mat("#1a1a1a")); el_.position.set(.12,.8,-.05); el_.rotation.x=.35; ic.add(el_); this.elFreni=el_;
    const tavan=new THREE.Mesh(new THREE.BoxGeometry(1.9,.06,1.5),mat("#8a857c",{roughness:.95})); tavan.position.set(0,1.88,-.15); ic.add(tavan);
    for(const sx of [-.95,.95]){ const d=new THREE.Mesh(new THREE.BoxGeometry(.08,.9,.08),mat("#2a2b2e")); d.position.set(sx,1.45,-.92); d.rotation.x=-.42; ic.add(d); }
    const kol_=mat("#3a3530",{roughness:.95,bumpMap:gurultuDoku(6),bumpScale:.004}); for(const sx of [-.38,.42]){ const o=new THREE.Mesh(new THREE.BoxGeometry(.52,.14,.52),kol_); o.position.set(sx,.74,.04); ic.add(o); const a=new THREE.Mesh(new THREE.BoxGeometry(.52,.72,.13),kol_); a.position.set(sx,1.13,.36); a.rotation.x=-.16; ic.add(a); }
    const ayna=new THREE.Mesh(new THREE.BoxGeometry(.24,.07,.02),mat("#1a1a1a",{roughness:.4})); ayna.position.set(-.05,1.66,-.66); ic.add(ayna); this.ayna=ayna;
    const ac=new THREE.Mesh(new THREE.PlaneGeometry(.22,.055),new THREE.MeshStandardMaterial({color:renk("#9fb4c8"),roughness:.05,metalness:.9})); ac.position.set(-.05,1.66,-.648); ic.add(ac);
    const nc=document.createElement("canvas"); nc.width=256; nc.height=160; this.navC=nc; this.navT=new THREE.CanvasTexture(nc); this.navT.encoding=THREE.sRGBEncoding; this.navCiz();
    const ekran=new THREE.Mesh(new THREE.PlaneGeometry(.2,.125),new THREE.MeshBasicMaterial({map:this.navT,toneMapped:false})); ekran.position.set(.02,.91,-.465); ekran.rotation.x=-.12; ic.add(ekran);
    const kon=new THREE.Mesh(new THREE.BoxGeometry(.26,.32,.4),yum); kon.position.set(.02,.8,-.42); ic.add(kon);
    // emniyet kemeri (sürücünün omzundan çaprazına): görünürlüğü kemer takılınca açılır
    const kem=new THREE.Mesh(new THREE.BoxGeometry(.05,.75,.006),mat("#151517",{roughness:.8})); kem.position.set(-.42,1.02,.02); kem.rotation.z=.75; kem.visible=false; ic.add(kem); this.kemer=kem;
  },
  gosterge(kemerUyari){ const x=this.gostC.getContext("2d"); x.fillStyle="#08090c"; x.fillRect(0,0,256,96);
    x.fillStyle="#e9f2ff"; x.font="700 34px Arial"; x.textAlign="center"; x.fillText(Math.round(this.kmh||0)+"",128,52); x.font="12px Arial"; x.fillStyle="#9fb0c8"; x.fillText("km/s",128,72);
    if(kemerUyari&&Math.floor(this.t*3)%2===0){ x.fillStyle="#ff3b30"; x.beginPath(); x.arc(40,48,14,0,7); x.fill(); x.fillStyle="#08090c"; x.font="700 18px Arial"; x.fillText("⚠",40,55); }
    if(this.sinir){ x.fillStyle="#fff"; x.beginPath(); x.arc(214,46,22,0,7); x.fill(); x.strokeStyle="#d21f2a"; x.lineWidth=5; x.beginPath(); x.arc(214,46,19,0,7); x.stroke(); x.fillStyle="#111"; x.font="700 16px Arial"; x.fillText(this.sinir+"",214,52); }
    this.gostT.needsUpdate=true; },
  navCiz(){ const x=this.navC.getContext("2d"); x.fillStyle="#0e1a26"; x.fillRect(0,0,256,160); x.strokeStyle="#f2d27a"; x.lineWidth=7; x.beginPath(); x.moveTo(128,160); x.bezierCurveTo(120,110,160,80,140,20); x.stroke();
    x.fillStyle="rgba(0,0,0,.55)"; x.fillRect(0,0,256,34); x.fillStyle="#fff"; x.font="700 18px Arial"; x.fillText("Kastamonu · "+Math.max(0,Math.round(205-(this.km||0)))+" km",12,24); this.navT.needsUpdate=true; },
  // yol bölümleri: 0 şehir içi (50), 1 ova (90), 2 Ilgaz ormanı (70), 3 Kastamonu (50)
  segment(n,ilk){ this.seg=n; this.sinir=[50,90,70,50][n];
    const kavak=n===1, cam=n===2, bina=n===0||n===3;
    if(!ilk){ const t=sinirTabela(this.sinir); t.position.set(2.6,0,-160); scene.add(t); this.tabelalar.push(t); this.ihlalT=-4; if(this.yolIpucu) this.yolIpucu.textContent="Yeni sınır "+this.sinir+" · yavaşla";
      { const msj=[null,"Ova başladı, yine de yavaş 😌","Ilgaz'da kar var mı","Az kaldı, sakin sakin gel 😍"][n]; if(msj) bekle(2600).then(()=>{ if(this.suruyor) bildirimGoster(msj); }); }
      const ad=[null,"OSMANCIK · TOSYA",
        "ILGAZ GEÇİDİ","KASTAMONU"][n]; if(ad){ const tb=tabelaYap(ad,{zemin:n===3?"#1f5fa8":"#1f6f3a",font:ad.length>12?"700 46px Arial":undefined}); tb.position.set(3.6,0,-190); scene.add(tb); this.tabelalar.push(tb); } }
    this.havuzGoster={kavak,cam,bina}; for(const t of this.tepeler) t.userData.kar.visible=n===2;
    if(ilk) for(const [ad,L] of Object.entries(this.havuz)) for(const a of L) a.visible=!!this.havuzGoster[ad];
    this.zemin.color=renk(n===2?"#5f6f4a":n===1?"#9a9466":"#8d8a72");
  },
  async basla(){
    katmanTemizle(); ustDugmeler(); this.btn=aksiyonEkle();
    await bekle(300);
    // bir gece önce
    await sahne(async()=>{
      const dm=DM.ac("Kardelen 💕","çevrimiçi"); dm.zaman("3 Nisan · 23:54");
      await dm.yaz("ben","Uyuduk 😘"); await dm.yaz("o","Yarın yola çıkınca ilk iş kemer"); await dm.yaz("o","Acele etmek yok, sakin sakin gel");
      const c=await dm.sec(["Okeeey 🫡","Ehliyetli adam olarak söz veriyorum"]); await dm.yaz("ben",c?"Ehliyetli adam olarak söz veriyorum":"Okeeey 🫡"); await dm.yaz("o","Uyu hadi, öptüm");
      await bekle(500); DM.kapat();
      baslikKarti(this.ad,[this.tarih,"Bölüm "+this.no]); await bekle(3600);
      await anlat("4 Nisan 2025. Ehliyetimin ikinci haftası. Çorum'dan Kastamonu'ya, arabayla ilk uzun yolum.",3600);
    });
    await this.kontrolListesi();
    await this.surus();
    await this.kastamonu();
    await gecis(async()=>{ katmanTemizle(); Motor.durdur(); await this.sahilKur(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await this.sahil();
  },
  async kontrolListesi(){
    this.kemerUyari=true; Ses.efekt("zil",.25); bildirimGoster("Kemerini tak 😌");
    const adimlar=[["🔒 Kemeri tak","Kemer"],["🪞 Aynayı ayarla","Ayna"],["🔑 Kontağı çevir","Kontak"],["🅿️ El frenini indir","El freni"]];
    for(let i=0;i<adimlar.length;i++){ gorev(`Yola çıkmadan · ${i} / 4`);
      await BK.qte.call(this,adimlar[i][0]);
      if(i===0){ this.kemerUyari=false; this.kemer.visible=true; Ses.efekt("vuru",.5); tost("Klik! Kemer takıldı"); }
      if(i===1){ await this.tween(.5,t=>{ this.ayna.rotation.y=Math.sin(t*Math.PI)*.15; }); }
      if(i===2){ Ses.efekt("vuru",.4); await bekle(300); Motor.baslat(); this.sarsinti=1; setTimeout(()=>{ this.sarsinti=.3; },800); }
      if(i===3){ await this.tween(.4,t=>{ this.elFreni.rotation.x=.35-t*.35; }); }
    }
    gorev(null);
    await sahne(async()=>{ await anlat("Kemer tamam, ayna tamam. Söz verdiğim gibi: yavaş yavaş.",2600); });
  },
  async surus(){
    gorev("Hız sınırına uy · Kastamonu'ya sür");
    const ui=el(`<div class="sim yol-ui"><div class="baslik">Çorum → Kastamonu</div><div class="ipucu">Gaz ve frenle hızını sınırın altında tut</div>
      <div class="olcek" style="align-self:center;width:100%"><small><span>Çorum</span><span>Kastamonu</span></small><div class="bar"><i style="width:0%"></i></div></div>
      <div class="satir"><button class="tut fren">🛑 Fren</button><button class="tut gaz">⛽ Gaz</button></div></div>`); katman.appendChild(ui);
    const bas_=(b,k)=>{ b.addEventListener("pointerdown",e=>{ e.preventDefault(); this[k]=true; b.classList.add("basili"); }); const bit=()=>{ this[k]=false; b.classList.remove("basili"); }; b.addEventListener("pointerup",bit); b.addEventListener("pointercancel",bit); b.addEventListener("pointerleave",bit); };
    bas_(ui.querySelector(".gaz"),"gaz"); bas_(ui.querySelector(".fren"),"fren"); this.ilerleme=ui.querySelector(".bar i"); this.suruyor=true; this.yolIpucu=ui.querySelector(".ipucu");
    await kosul(()=>this.km>=205);
    this.suruyor=false; this.gaz=false; ui.remove(); gorev(null);
    const k0=this.kmh; await this.tween(2.5,t=>{ this.kmh=k0*(1-t); });
    this.kmh=0;
  },
  ihlalMesaji(){ this.ihlal++; Ses.efekt("titresim"); const L=["Yavaş gel demiştim 😠","Hız yapma minikom","Radar seni yazdı mı bakalım kdkdkd","Kemer takılı mı en azından"];
    bildirimGoster(L[(this.ihlal-1)%L.length]); this.yolIpucu.textContent="Hız sınırı "+this.sinir+" · biraz yavaşla"; },
  async kastamonu(){
    const K=this.kaan, D=this.kar;
    await sahne(async()=>{
      await anlat("Saat bir, Kastamonu'dayım. Merak etmesin diye varmama on beş dakika kala yazmıştım.",3000);
      Ses.efekt("vuru",.5); await bekle(400);
      D.visible=true; Kamera.sinema=dt=>{ camera.position.set(-.45,1.36,.16); camera.lookAt(.42,1.3,-.08); };
      await anlat("Kapı açıldı, yanıma oturdu.",2000);
      await konus("kardelen",["Hoş geldin şoför bey","Kemerini taktın mı bakayım"],{kamera:false,gul:1});
      await konus("kaan","Taktım, haberin olsun. Bir kere bile hız yapmadım.",{kamera:false,gul:.6});
      await konus("kardelen",this.ihlal?["Telefonuma düşen bildirimler başka söylüyor","Ama geldin ya, affettim kdkdkd"]:["Aferin minikom","Ehliyetin hakkını vermişsin"],{kamera:false,gul:1});
      await konus("kardelen",["Hadi denize gidelim","Hava kapalı ama deniz yine güzel"],{kamera:false,gul:1});
      await anlat("Kastamonu'dan Karadeniz'e, viraj viraj aşağı indik.",2800);
    });
  },
  // ---------------- KARADENİZ SAHİLİ ----------------
  async sahilKur(){
    boyut(); this.faz="sahil"; this.t=0; ETK=[]; DALGA=[]; this.tw=[]; this.serbest=false; this.elele=false; this.durum=null;
    const gy=new THREE.Vector3(-.4,.35,-1).normalize();
    sahneKur({sis:"#b9c6cf",sisYakin:50,sisUzak:300,ust:"#7f93a6",ufuk:"#d4dce2",alt:"#56707e",gunesYon:gy,isikYon:new THREE.Vector3(-.3,.8,-.5),gunesRenk:"#f2f0ea",isik:"#eef2f6",isikGuc:1.15,zemin:"#7a7468",hemi:1.0,dolgu:.5,parlak:.4});
    if(THREE.Water){ const sn=new THREE.TextureLoader().load(SU_NORMAL); sn.wrapS=sn.wrapT=THREE.RepeatWrapping;
      const wg=new THREE.PlaneGeometry(800,400); wg.rotateX(-Math.PI/2); wg.translate(0,0,-202);
      this.su=new THREE.Water(wg,{textureWidth:512,textureHeight:512,waterNormals:sn,sunDirection:gy.clone(),sunColor:0xdfe6ea,waterColor:0x24485a,distortionScale:3.2,fog:true}); this.su.position.y=-.62; scene.add(this.su); }
    // çakıllı kumsal: kıyıya doğru eğim
    const cak=_bkTuval(512,512,(x,w,h)=>{ x.fillStyle="#8a8478"; x.fillRect(0,0,w,h); for(let i=0;i<5200;i++){ const r=rnd(2,7); const c=new THREE.Color("#a9a294").lerp(new THREE.Color("#5f5a52"),Math.random()); x.fillStyle="#"+c.getHexString(); x.beginPath(); x.ellipse(Math.random()*w,Math.random()*h,r,r*rnd(.6,1),Math.random()*3,0,7); x.fill(); } });
    cak.wrapS=cak.wrapT=THREE.RepeatWrapping; cak.repeat.set(14,4);
    const kg=new THREE.PlaneGeometry(120,30,60,15); kg.rotateX(-Math.PI/2); const P=kg.attributes.position; for(let i=0;i<P.count;i++){ const z=P.getZ(i); P.setY(i,Math.max(-.6,(z+2)*.08)+Math.sin(P.getX(i)*.3)*.05); } kg.computeVertexNormals();
    const kum=new THREE.Mesh(kg,new THREE.MeshStandardMaterial({map:cak,roughness:.95,bumpMap:cak,bumpScale:.04})); kum.position.set(0,0,12); kum.receiveShadow=true; scene.add(kum);
    this.yer=(x,z)=>Math.max(-.6,(z-12+2)*.08); Ses.zemin="tas";
    // köpük şeridi
    const kc=_bkTuval(512,64,(x,w,h)=>{ x.clearRect(0,0,w,h); for(let i=0;i<800;i++){ x.fillStyle=`rgba(255,255,255,${rnd(.2,.8)})`; x.beginPath(); x.arc(Math.random()*w,h/2+rnd(-14,14)*Math.random(),rnd(1,3),0,7); x.fill(); } }); kc.wrapS=THREE.RepeatWrapping; kc.repeat.set(8,1);
    this.kopuk=new THREE.Mesh(new THREE.PlaneGeometry(120,2.2),new THREE.MeshBasicMaterial({map:kc,transparent:true,depthWrite:false})); this.kopuk.rotation.x=-Math.PI/2; this.kopuk.position.set(0,-.58,-2.4); scene.add(this.kopuk);
    // yalıyar, kayalar, çamlar
    for(const sx of [-1,1]){ for(let i=0;i<6;i++){ const r=new THREE.Mesh(new THREE.DodecahedronGeometry(rnd(6,12),1),mat(i%2?"#5a5852":"#6a665c",{roughness:1,flatShading:true})); r.position.set(sx*(36+i*7),rnd(1,6),rnd(-6,24)); r.scale.y=rnd(1.2,2.2); scene.add(r); }
      for(let i=0;i<14;i++){ const a=agac("cam",rnd(1.1,1.6)); a.position.set(sx*rnd(34,60),rnd(6,14),rnd(4,40)); scene.add(a); } }
    this.kayalar=[]; for(const [x,z,o] of [[-6,1.2,1.3],[5.5,2.2,1.0],[11,.6,1.5],[-12,2.6,.9],[2.0,5.5,.7]]){ const k=kaya(o,"#6d6a62"); k.position.set(x,this.yer(x,z),z); k.userData.engel=o*.6; scene.add(k); this.kayalar.push(k); }
    // uzakta mendirek ve kırmızı fener, yamaçta beyaz evler
    const men=new THREE.Mesh(new THREE.BoxGeometry(3,1.2,40),mat("#8a8680",{roughness:1})); men.position.set(26,-.2,-22); men.rotation.y=-.5; scene.add(men);
    const fen=new THREE.Group(); fen.position.set(17,0,-39); scene.add(fen); const fg=new THREE.Mesh(new THREE.CylinderGeometry(.8,1.0,6,16),mat("#c8302c")); fg.position.y=3; fen.add(fg); const fb=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,1,16),mat("#f2efe8")); fb.position.y=6.5; fen.add(fb);
    // evler denizin üstünde havada duruyordu: altlarına yeşil bir burun (yamaç) kondu, her ev yamaca oturur; temeli yokuş aşağı tarafta toprağa gömülür
    const tep=new THREE.Mesh(new THREE.SphereGeometry(1,32,14),mat("#66744f",{roughness:1,flatShading:true})); tep.scale.set(48,20,34); tep.position.set(72,-10,-56); scene.add(tep);
    const tepY=(x,z)=>{ const u=(x-72)/48, v=(z+56)/34, k=1-u*u-v*v; return k>0?-10+20*Math.sqrt(k):-10; };
    // evler yamacın kumsala bakan yüzüne serpilir (sahilden görünen taraf), kıyıdan tepeye doğru
    for(let i=0;i<44;i++){ const w=rnd(2.6,4), h=rnd(2.6,4.4); const a=rnd(1.25,3.45), r=Math.sqrt(rnd(.04,.66)); const x=72+Math.cos(a)*r*48, z=-56+Math.sin(a)*r*34;
      let y0=1e9, y1=-1e9; for(const [a_,b_] of [[-1,-1],[1,-1],[-1,1],[1,1],[0,0]]){ const y=tepY(x+a_*w/2,z+b_*w/2); y0=Math.min(y0,y); y1=Math.max(y1,y); }
      const H=h+(y1-y0)+.4; const e=new THREE.Mesh(new THREE.BoxGeometry(w,H,w),mat(["#f2efe8","#e6ddd0","#f6f2ea"][i%3])); e.position.set(x,y0-.4+H/2,z); e.rotation.y=rnd(-.3,.3); scene.add(e);
      const c=new THREE.Mesh(new THREE.ConeGeometry(w*.8,1.4,4),mat("#a0503e")); c.rotation.y=Math.PI/4+e.rotation.y; c.position.set(x,y0-.4+H+.7,z); scene.add(c); }
    // martılar
    this.martilar=[]; for(let i=0;i<5;i++){ const m=new THREE.Group(); const k=mat("#f6f6f2"); for(const s of [-1,1]){ const kn=new THREE.Mesh(new THREE.BoxGeometry(.5,.02,.12),k); kn.position.x=s*.25; kn.rotation.z=s*.25; m.add(kn); } m.userData={a:rnd(0,6),r:rnd(6,14),h:rnd(6,11),c:new THREE.Vector3(rnd(-20,20),0,rnd(-20,-6))}; scene.add(m); this.martilar.push(m); }
    this.kaan=karakter("kaan","deri"); this.kar=karakter("kardelen","deri"); this.oyuncu=null;
    this.kaan.position.set(-14,this.yer(-14,6),6); this.kar.position.set(-14.6,this.yer(-14.6,6),6); this.kaan.rotation.y=this.kar.rotation.y=Math.PI/2; scene.add(this.kaan,this.kar);
    KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    this.tel=telefonYap(); this.tel.userData.telefon=true; this.tel.visible=false; scene.add(this.tel);
    Kamera.sinema=null; Kamera.aci=.6; Kamera.mesafe=6; Kamera.yukseklik=2.4; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(-10,4,13);
    Ses.denizBaslat();
  },
  async sahil(){
    const K=this.kaan, D=this.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(10,6,14),new THREE.Vector3(0,0,-20));
      await kameraNoktasi(s=>new THREE.Vector3(10-s*2,6-s*.6,14-s),new THREE.Vector3(0,0,-20),4.5);
      await kameraNoktasi(ondenNokta(K,2.4,.6,.2),bas(K).lerp(bas(D),.5),2.2);
      await anlat("Karadeniz. Hava kapalı, deniz hırçın, çakıllar ayağımızın altında şıkır şıkır.",3400);
      yuzYuze(K,D);
      await konus("kardelen",["Deniz kokusu","Çok özlemişim"],{gul:1});
      await konus("kardelen",["Fotoğraf çekeceğiz ama","Bir de dans videosu","Hayır deme"],{gul:1});
      await konus("kaan","Ben mi? Dans mı? …Tamam, bir kere 😄",{gul:.6});
      K.rotation.y=D.rotation.y=Math.PI/2;
    });
    gorev("Kıyı boyunca yürüyün · fotoğraf noktası");
    this.serbest=true; this.elele=true; K.userData.elele=D.userData.elele=1; gizliKalpler(this,[[-9,this.yer(-9,9)+1.0,9,0],[8.5,this.yer(8.5,7)+1.0,7,1],[14,this.yer(14,2.5)+1.0,2.5,2]]);
    const n1=new THREE.Object3D(); n1.position.set(-3,this.yer(-3,2.4),2.4); scene.add(n1);
    await etkBekle(n1,"Fotoğraf çek",{mesafe:1.6,isaretY:.3,isaretBoy:1.2});
    this.serbest=false; this.elele=false; K.userData.elele=D.userData.elele=0;
    await sahne(async()=>{ await yuruHedef(D,new THREE.Vector3(-3.2,this.yer(-3.2,.9),.9),1.4,{yer:(x,z)=>this.yer(x,z)}); cevir(D,K.position); await yuruHedef(K,new THREE.Vector3(-3,this.yer(-3,3.4),3.4),1.2,{yer:(x,z)=>this.yer(x,z)}); cevir(K,D.position); D.userData.gulumse=1;
      await fotoModu(K,D,{pozlar:["bel","el"],baslik:"Karadeniz · Nisan 2025",bakY:1.15,fov:42});
      await konus("kardelen",["Güzel çıkmış mı","Denizle beraber"],{gul:1}); });
    gorev("Telefonu kayaya yasla");
    this.serbest=true; this.elele=true; K.userData.elele=D.userData.elele=1;
    const kaya_=this.kayalar[1];
    await etkBekle(kaya_,"Telefonu yasla, kaydı başlat",{mesafe:1.9,isaretY:1.4});
    this.serbest=false; this.elele=false; K.userData.elele=D.userData.elele=0;
    await sahne(async()=>{ this.tel.visible=true; { const bb=new THREE.Box3().setFromObject(kaya_); this.tel.position.set(kaya_.position.x,bb.max.y+.05,kaya_.position.z); } this.tel.rotation.set(-.2,Math.PI*.15,0); Ses.efekt("deklansor");
      const m=new THREE.Vector3(5.5,this.yer(5.5,4.6),4.6); await yuruHedef(K,m.clone().add(new THREE.Vector3(-.35,0,0)),1.2,{yer:(x,z)=>this.yer(x,z)}); await yuruHedef(D,m.clone().add(new THREE.Vector3(.35,0,0)),1.2,{yer:(x,z)=>this.yer(x,z)}); yuzYuze(K,D);
      this.kayit=el(`<div class="kayit-rozet">● REC</div>`); katman.appendChild(this.kayit);
      await konus("kardelen",["Kayıt başladı","Ritmi kaçırma kdkdkd"],{gul:1});
      K.userData.dans=D.userData.dans=1; this.dansMerkez=m.clone(); this.dansA=Math.atan2(K.position.x-m.x,K.position.z-m.z); // bulundukları yerden başlar (ilk karede yer değiştirmez)
      this.dansKam=dt=>{ const a=this.t*.25; camera.position.set(m.x+Math.sin(a)*3.2,m.y+1.7,m.z+Math.cos(a)*3.2); camera.lookAt(m.x,m.y+1.2,m.z); }; Kamera.sinema=this.dansKam; });
    Kamera.sinema=this.dansKam;
    this.ritimVurus=()=>{ const K=this.kaan; K.userData.salla=.6; setTimeout(()=>{ K.userData.salla=0; },400); };
    await ritimBasla(this,8,{sure:1.35,etiket:"Halka kalbe değince dokun"});
    this.ritimVurus=null;
    await sahne(async()=>{ K.userData.dans=D.userData.dans=0; K.userData.hiz=D.userData.hiz=0; yuzYuze(K,D); K.userData.saril=D.userData.saril=1; Ses.efekt("buyuk");
      await anlat("Bir dalga ayakkabılarımıza kadar geldi; videonun sonunda kahkahamız var.",3200);
      K.userData.saril=D.userData.saril=0; if(this.kayit) this.kayit.remove();
      const kare=await kareAl(320);
      await kameraNoktasi(ondenNokta(D,1.3,-.3,0),bas(D),1.2);
      const dm=DM.ac("Kardelen 💕","çevrimiçi"); dm.zaman("5 Nisan · 18:56");
      await dm.yaz("o","Dans videolarını atmadın daha"); await dm.yaz("o","Hepsini istiyorum");
      if(kare) await dmResim("ben",kare); await dm.yaz("ben","Hepsi geliyor 💃🕺");
      await dm.yaz("o","Ayy ben bunu izlemeye doyamam"); await dm.yaz("o","Sen de iyi dans ediyormuşsun, prova şart ama 😄");
      await bekle(600); DM.kapat();
      await hatiraFoto("İlk uzun yol · Nisan 2025"); await bekle(1500);
      await anlat("Dönüş yolunda da tek bir mesaj vardı: kemerini tak.",3000);
    });
    bolumBitti(this.no);
  },
  tween(sure,f){ return new Promise(r=>this.tw.push({t:0,sure,f,r})); },
  guncelle(dt){
    this.t+=dt; const t=this.t; this.tw=this.tw.filter(a=>{ a.t+=dt; const k=Math.min(1,a.t/a.sure); a.f(k); if(k>=1){ a.r(); return false; } return true; });
    if(this.faz==="yol"){
      if(!Kamera.sinema) Kamera.sinema=this.arabaKam;
      if(this.suruyor){ const hedef=this.gaz?1:this.fren?-2.4:-.25; this.kmh=clamp(this.kmh+hedef*dt*(this.gaz?14-this.kmh*.06:12),0,135);
        this.km+=this.kmh*dt*.042; const seg=this.km<8?0:this.km<120?1:this.km<172?2:3; if(seg!==this.seg) this.segment(seg);
        if(this.kmh>this.sinir+8){ this.ihlalT+=dt; if(this.ihlalT>1.6){ this.ihlalT=-2.5; this.ihlalMesaji(); } } else if(this.ihlalT>0) this.ihlalT=Math.max(0,this.ihlalT-dt);
        if(this.ilerleme) this.ilerleme.style.width=Math.min(100,this.km/205*100)+"%";
        this._nv=(this._nv||0)+dt; if(this._nv>1){ this._nv=0; this.navCiz(); } }
      const v=this.kmh/3.6; Motor.ayarla(this.kmh);
      this._gs=(this._gs||0)+dt; if(this._gs>.12){ this._gs=0; this.gosterge(this.kemerUyari); }
      if(this.kemerUyari){ this._dg=(this._dg||0)+dt; if(this._dg>1.2){ this._dg=0; Ses.efekt("zil",.12); } }
      if(this.yolDoku) this.yolDoku.offset.y+=dt*v/20; if(this.zeminDoku) this.zeminDoku.offset.y+=dt*v*.0055;
      const G=this.havuzGoster||{};
      for(const [ad,L] of Object.entries(this.havuz)){ for(const a of L){ a.position.z+=dt*v; if(a.position.z>10){ a.position.z-=ad==="bina"?400:470; a.visible=!!G[ad]; } else if(!G[ad]&&a.position.z<-300) a.visible=false; else if(G[ad]&&a.position.z<-300) a.visible=true; } }
      for(const d of this.tepeler){ d.position.z+=dt*v*.12; d.userData.kar.position.z=d.position.z; if(d.position.z>60){ d.position.z-=640; } }
      for(const a of this.arabalar){ a.position.z+=dt*(v+22); if(a.position.z>20) a.position.z=-500-Math.random()*200; }
      this.tabelalar=this.tabelalar.filter(tb=>{ tb.position.z+=dt*v; if(tb.position.z>12){ scene.remove(tb); return false; } return true; });
      if(this.direksiyon) this.direksiyon.rotation.z=Math.sin(t*.45)*.05*(this.seg===2?2.4:1)+Math.sin(t*37)*.004*(this.sarsinti||0);
      if(this.ic) this.ic.rotation.z=Math.sin(t*.45)*.004*(this.seg===2?2:1);
      return; }
    // sahil
    if(this.su) this.su.material.uniforms.time.value=t*.8;
    if(this.kopuk){ this.kopuk.position.z=-2.4+Math.sin(t*.7)*.45; this.kopuk.material.opacity=.55+Math.sin(t*.7)*.25; this.kopuk.material.map.offset.x+=dt*.006; }
    for(const m of this.martilar||[]){ const u=m.userData; u.a+=dt*.3; m.position.set(u.c.x+Math.cos(u.a)*u.r,u.h+Math.sin(u.a*2)*.6,u.c.z+Math.sin(u.a)*u.r); m.rotation.y=-u.a; m.children.forEach((k,i)=>k.rotation.z=(i?1:-1)*(.25+Math.sin(t*6+u.a)*.3)); }
    const K=this.kaan, D=this.kar; if(!K) return;
    if(this.durum==="dans"&&this.dansMerkez){ ritimGuncelle(this,dt); this.dansA+=dt*(.6+(this.dansIlerle||0)*.8); const m=this.dansMerkez, r=.32;
      K.position.set(m.x+Math.sin(this.dansA)*r,this.yer(m.x,m.z),m.z+Math.cos(this.dansA)*r); D.position.set(m.x-Math.sin(this.dansA)*r,this.yer(m.x,m.z),m.z-Math.cos(this.dansA)*r); yuzYuze(K,D); K.userData.hiz=D.userData.hiz=r*(.6+(this.dansIlerle||0)*.8)*1.6; K.userData.gulumse=D.userData.gulumse=.5+(this.dansIlerle||0)*.5; return; }
    const sinir=p=>{ p.x=clamp(p.x,-30,30); p.z=clamp(p.z,.4,20); p.y=this.yer(p.x,p.z); };
    if(this.serbest&&!kilit){ yuru(K,dt,sinir,2.1); if(this.elele){ eleleTakip(K,D,dt); D.position.y=this.yer(D.position.x,D.position.z); } }
    etkilesimGuncelle(K,this.btn);
    if(!Kamera.sinema) Kamera.hedef.lerp(K.position,.1);
  },
  temizle(){ Motor.durdur(); Ses.denizDurdur(); DM.kapat&&DM.kapat(); boyut(); }
};
