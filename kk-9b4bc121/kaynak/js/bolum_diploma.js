/* ================= BÖLÜM: DİPLOMA GÜNÜ (26 Eylül 2025 · İzmit → Kastamonu → AŞTİ) ================= */
/* Gece üçte İzmit'ten Kastamonu otobüsüne biner (27 numara, tekli). Sabah kampüste öğrenci işlerinden sıra fişi alır,
   diplomasını teslim alır. Öğleden sonra Ankara otobüsü; Kaan Çorum'dan arabayla AŞTİ'ye gelir. “Ankaralı mısın çen.” */

/* ---------- otobüs içi (2+1 koltuk, tavan LED'leri, koltuk arkası ekranlar, pencerelerde akan manzara) ---------- */
function otobusIciKur(B,gece){
  const W=2.5, L=11, H=2.15;
  const z=new THREE.Mesh(new THREE.PlaneGeometry(W,L),mat("#3a3f4a",{roughness:1,bumpMap:gurultuDoku(20),bumpScale:.01})); z.rotation.x=-Math.PI/2; scene.add(z);
  const kor=new THREE.Mesh(new THREE.PlaneGeometry(.55,L),mat("#5a4a3a",{roughness:.9})); kor.rotation.x=-Math.PI/2; kor.position.set(-.15,.003,0); scene.add(kor);
  const tav=new THREE.Mesh(new THREE.PlaneGeometry(W,L),mat("#d9dce2",{roughness:.7})); tav.rotation.x=Math.PI/2; tav.position.y=H; scene.add(tav);
  const led=new THREE.Mesh(new THREE.BoxGeometry(.06,.02,L),new THREE.MeshBasicMaterial({color:renk(gece?"#3a6aff":"#f6f8ff")})); led.position.set(-.15,H-.02,0); scene.add(led);
  if(gece){ const lI=new THREE.PointLight(renk("#3a5aff"),.6,8,1.5); lI.position.set(-.15,H-.2,0); scene.add(lI); }
  // pencere manzarası
  const c=document.createElement("canvas"); c.width=512; c.height=160; const x=c.getContext("2d"); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding;
  const isik=[]; for(let i=0;i<60;i++) isik.push({x:Math.random()*1024,y:rnd(60,140),r:rnd(1,3),k:Math.random()});
  const ciz=(zm)=>{ if(gece){ const g=x.createLinearGradient(0,0,0,160); g.addColorStop(0,"#05070f"); g.addColorStop(1,"#121624"); x.fillStyle=g; x.fillRect(0,0,512,160);
      const o=(zm*160)%1024; for(const l of isik){ const xx=((l.x-o)%1024+1024)%1024-256; if(xx<-10||xx>520) continue; x.fillStyle=l.k<.7?"rgba(255,210,140,.9)":"rgba(255,255,255,.8)"; x.beginPath(); x.arc(xx,l.y,l.r,0,7); x.fill(); }
      const d=(zm*420)%240; x.fillStyle="rgba(255,200,120,.25)"; for(let k=0;k<4;k++){ const xx=k*240-d; x.fillRect(xx,0,18,160); } }
    else { const g=x.createLinearGradient(0,0,0,160); g.addColorStop(0,"#b9d2ea"); g.addColorStop(.55,"#eef2f4"); g.addColorStop(1,"#c9b48a"); x.fillStyle=g; x.fillRect(0,0,512,160);
      const o1=(zm*14)%512; x.fillStyle="#b39a74"; for(let k=-1;k<2;k++){ x.beginPath(); x.moveTo(k*512-o1,120); for(let i=0;i<=16;i++) x.lineTo(k*512-o1+i*32,92+Math.sin(i*.8+k)*16); x.lineTo(k*512-o1+512,160); x.lineTo(k*512-o1,160); x.fill(); }
      const o2=(zm*120)%1024; for(let i=0;i<14;i++){ const xx=((i*80-o2)%1024+1024)%1024-256; x.fillStyle="#6f8a4a"; x.beginPath(); x.arc(xx,128,10,0,7); x.fill(); x.fillStyle="#5a3c26"; x.fillRect(xx-1,128,3,14); } }
    t.needsUpdate=true; };
  ciz(0); B.otobusCiz=ciz;
  const camM=new THREE.MeshBasicMaterial({map:t,toneMapped:false});
  const gov=mat("#cfd3da",{roughness:.6}), koltuk=mat(gece?"#3a2a4a":"#4a2a2a",{roughness:.95,bumpMap:gurultuDoku(12),bumpScale:.006}), ortu=mat("#efe9df");
  for(const sx of [-1,1]){ const d=new THREE.Mesh(new THREE.PlaneGeometry(L,H),gov); d.position.set(sx*W/2,H/2,0); d.rotation.y=-sx*Math.PI/2; scene.add(d);
    const p=new THREE.Mesh(new THREE.PlaneGeometry(L-.6,.8),camM); p.position.set(sx*(W/2-.012),1.3,0); p.rotation.y=-sx*Math.PI/2; if(sx>0) p.scale.x=-1; scene.add(p);
    for(let i=0;i<7;i++){ const k=new THREE.Mesh(new THREE.BoxGeometry(.03,.86,.06),mat("#2a2c30")); k.position.set(sx*(W/2-.01),1.3,-4.6+i*1.55); scene.add(k); }
    const p2=new THREE.Mesh(new THREE.BoxGeometry(.4,.04,L),mat("#b9c0c9",{metalness:.5,roughness:.4})); p2.position.set(sx*(W/2-.22),1.88,0); scene.add(p2); }
  const koltuklar=[];
  for(let r=0;r<6;r++){ const zz=-4.2+r*1.4;
    for(const xx of [-.9,.45,.93]){ const g=new THREE.Group(); g.position.set(xx,0,zz); scene.add(g);
      const o=new THREE.Mesh(new THREE.BoxGeometry(.48,.13,.48),koltuk); o.position.y=.46; g.add(o);
      const s=new THREE.Mesh(new THREE.BoxGeometry(.48,.8,.13),koltuk); s.position.set(0,.9,.25); s.rotation.x=.12; g.add(s);
      const b=new THREE.Mesh(new THREE.BoxGeometry(.42,.14,.135),ortu); b.position.set(0,1.24,.29); b.rotation.x=.12; g.add(b);
      const ek=new THREE.Mesh(new THREE.PlaneGeometry(.22,.14),new THREE.MeshBasicMaterial({color:renk(gece?"#2a4a8a":"#1a1c22")})); ek.position.set(0,1.0,.32+.02); ek.rotation.x=.12; ek.rotation.y=Math.PI; g.add(ek);
      koltuklar.push(g); } }
  const no=new THREE.Mesh(new THREE.PlaneGeometry(.12,.06),new THREE.MeshBasicMaterial({map:yaziDoku("27",{w:128,h:64,zemin:"#1a1a1e",renk:"#ffd28a",font:"700 40px Arial"})})); no.position.set(-1.2,1.75,-1.4+.0); no.rotation.y=Math.PI/2; scene.add(no);
  B.koltuk27=new THREE.Vector3(-.9,0,-1.4);
}

/* ---------- kampüs: yürüyüş yolu, çimen, binalar, öğrenci işleri salonu (içi: sıra makinesi, bankolar) ---------- */
function kampusKur(B){
  scene.add(cimZemin(200,200,"#6c8a46","#8aa25a",60));
  const tas=_bkTuval(256,256,(x,w,h)=>{ x.fillStyle="#bfb6a6"; x.fillRect(0,0,w,h); for(let j=0;j<8;j++) for(let i=0;i<4;i++){ const c=new THREE.Color("#d4ccbc").lerp(new THREE.Color("#a99f8e"),Math.random()*.6); x.fillStyle="#"+c.getHexString(); x.fillRect(i*64+(j%2)*32+1,j*32+1,62,30); } });
  tas.wrapS=tas.wrapT=THREE.RepeatWrapping; tas.repeat.set(2,14);
  const yol=new THREE.Mesh(new THREE.PlaneGeometry(4,44),new THREE.MeshStandardMaterial({map:tas,roughness:.9})); yol.rotation.x=-Math.PI/2; yol.position.set(0,.012,22); yol.receiveShadow=true; scene.add(yol);
  const mey=new THREE.Mesh(new THREE.PlaneGeometry(24,8),new THREE.MeshStandardMaterial({map:tas,roughness:.9})); mey.rotation.x=-Math.PI/2; mey.position.set(0,.011,4); scene.add(mey);
  // öğrenci işleri binası: cam cephe, kapı boşluğu, tabela
  const H=4.2, D=11, Wb=18;
  const duvar=mat("#e6dccb",{roughness:.85}), tugla=mat("#a6543a",{roughness:.9});
  const govde=new THREE.Mesh(new THREE.BoxGeometry(Wb+.6,9,.6),tugla); govde.position.set(0,4.5+H,-D-.3); scene.add(govde);
  for(const sx of [-1,1]){ const y=new THREE.Mesh(new THREE.BoxGeometry(.6,H+9,D+.6),tugla); y.position.set(sx*(Wb/2+.3),(H+9)/2,-D/2); scene.add(y); }
  const ust=new THREE.Mesh(new THREE.BoxGeometry(Wb+.6,9,.6),tugla); ust.position.set(0,H+4.5,.3); scene.add(ust);
  const pd=pencereDoku("#e6dccb"); pd.repeat.set(6,2); const ustCephe=new THREE.Mesh(new THREE.PlaneGeometry(Wb,8.6),new THREE.MeshStandardMaterial({map:pd,roughness:.8})); ustCephe.position.set(0,H+4.5,.61); scene.add(ustCephe);
  const tav=new THREE.Mesh(new THREE.PlaneGeometry(Wb,D),mat("#f4f2ee")); tav.rotation.x=Math.PI/2; tav.position.set(0,H,-D/2); scene.add(tav);
  const ic=new THREE.Mesh(new THREE.PlaneGeometry(Wb,D),new THREE.MeshStandardMaterial({map:(()=>{ const t=_bkTuval(256,256,(x,w,h)=>{ x.fillStyle="#dcd6cc"; x.fillRect(0,0,w,h); for(let j=0;j<4;j++) for(let i=0;i<4;i++){ x.fillStyle=(i+j)%2?"#e8e4dc":"#cfc8bc"; x.fillRect(i*64,j*64,64,64); } }); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(6,4); return t; })(),roughness:.3})); ic.rotation.x=-Math.PI/2; ic.position.set(0,.01,-D/2); ic.receiveShadow=true; scene.add(ic);
  const icDuvar=(w,x,z,ry)=>{ const p=new THREE.Mesh(new THREE.PlaneGeometry(w,H),duvar); p.position.set(x,H/2,z); p.rotation.y=ry; scene.add(p); };
  icDuvar(Wb,0,-D,0); icDuvar(D,-Wb/2,-D/2,Math.PI/2); icDuvar(D,Wb/2,-D/2,-Math.PI/2);
  const camM=new THREE.MeshPhysicalMaterial({color:renk("#cfe0ea"),transparent:true,opacity:.18,roughness:.05,depthWrite:false,side:THREE.DoubleSide});
  for(const [x0,x1] of [[-Wb/2,-1.1],[1.1,Wb/2]]){ const c=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,H),camM); c.position.set((x0+x1)/2,H/2,0); scene.add(c); }
  for(let i=0;i<=9;i++){ const k=new THREE.Mesh(new THREE.BoxGeometry(.08,H,.1),mat("#5a5d66",{metalness:.7,roughness:.35})); k.position.set(-Wb/2+i*2,H/2,0); scene.add(k); }
  const lev=new THREE.Mesh(new THREE.PlaneGeometry(7,.8),new THREE.MeshStandardMaterial({map:yaziDoku("ÖĞRENCİ İŞLERİ",{w:1024,h:120,zemin:"#123a6a",renk:"#ffffff",font:"700 78px Arial"}),roughness:.6})); lev.position.set(0,H+.6,.65); scene.add(lev);
  // içerisi: bankolar, sıra ekranı, sıra makinesi, bekleme sandalyeleri
  B.bankolar=[]; for(let i=0;i<3;i++){ const x=-5+i*5; const g=new THREE.Group(); g.position.set(x,0,-D+1.3); scene.add(g); g.userData.engel={kutu:[1.6,.45]};
    const b=new THREE.Mesh(new THREE.BoxGeometry(3.2,1.1,.8),mat("#5a7a9a",{roughness:.5})); b.position.y=.55; g.add(b); const u=new THREE.Mesh(new THREE.BoxGeometry(3.3,.05,.9),mat("#f2efe8",{roughness:.3})); u.position.y=1.12; g.add(u);
    const cam=new THREE.Mesh(new THREE.PlaneGeometry(3.0,.9),camM); cam.position.set(0,1.6,.1); g.add(cam);
    const n=new THREE.Mesh(new THREE.PlaneGeometry(.6,.35),new THREE.MeshBasicMaterial({map:yaziDoku(String(i+1),{w:128,h:72,zemin:"#123a6a",renk:"#fff",font:"700 52px Arial"})})); n.position.set(0,2.3,.1); g.add(n); B.bankolar.push(g); }
  B.ekranC=document.createElement("canvas"); B.ekranC.width=512; B.ekranC.height=160; B.ekranT=new THREE.CanvasTexture(B.ekranC); B.ekranT.encoding=THREE.sRGBEncoding;
  const ek=new THREE.Mesh(new THREE.PlaneGeometry(2.6,.8),new THREE.MeshBasicMaterial({map:B.ekranT,toneMapped:false})); ek.position.set(0,3.4,-D+.05); scene.add(ek); B.siraCiz=(no,banko)=>{ const x=B.ekranC.getContext("2d"); x.fillStyle="#0a0f1a"; x.fillRect(0,0,512,160); x.fillStyle="#ff5a4a"; x.font="700 72px Arial"; x.textAlign="center"; x.fillText(String(no).padStart(3,"0"),180,100); x.fillStyle="#9fd0ff"; x.font="700 40px Arial"; x.fillText("→ "+banko,380,98); x.fillStyle="#fff"; x.font="20px Arial"; x.fillText("SIRA NO",180,140); x.fillText("BANKO",380,140); B.ekranT.needsUpdate=true; };
  B.siraCiz(24,1);
  const mak=new THREE.Group(); mak.position.set(-6.5,0,-1.6); scene.add(mak); mak.userData.engel=.35; B.siraMakinesi=mak;
  const mg=new THREE.Mesh(new THREE.BoxGeometry(.5,1.4,.4),mat("#c9ccd2",{metalness:.5,roughness:.35})); mg.position.y=.7; mak.add(mg); const me=new THREE.Mesh(new THREE.PlaneGeometry(.32,.22),new THREE.MeshBasicMaterial({color:renk("#9fc2ff")})); me.position.set(0,1.15,.205); mak.add(me);
  for(let r=0;r<3;r++) for(const sx of [-4.6,-3.6,-2.6,-1.6,1.6,2.6,3.6]){ const s=new THREE.Group(); s.position.set(sx,0,-5.2+r*1.3); scene.add(s); s.userData.engel=.24; /* ortada bankolara giden geniş koridor */ const o=new THREE.Mesh(new THREE.BoxGeometry(.48,.06,.45),mat("#2f4f8a")); o.position.y=.45; s.add(o); const a=new THREE.Mesh(new THREE.BoxGeometry(.48,.5,.05),mat("#2f4f8a")); a.position.set(0,.72,.22); s.add(a); const l=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.45,6),mat("#555")); l.position.y=.22; s.add(l); }
  for(const [x,z] of [[-3,-2],[3,-2],[-3,-7],[3,-7]]){ const l=new THREE.PointLight(renk("#fff3e2"),.7,10,1.3); l.position.set(x,H-.3,z); scene.add(l); }
  // dışarıda diğer fakülte binaları, ağaçlar (sonbahar), banklar, bayrak
  const renkler=["#d8cdbb","#e6dccb","#cbbfa9"]; for(const [x,z,ry] of [[-26,6,Math.PI/2],[26,6,-Math.PI/2],[-24,30,Math.PI/2],[24,30,-Math.PI/2]]){ const b=bina(16,14,12,renkler[Math.abs(x+z)%3],null); b.position.set(x,0,z); b.rotation.y=ry; scene.add(b); }
  for(let i=0;i<20;i++){ const s=i%2?1:-1; const a=agac(i%4===0?"sonbahar":i%3?"yesil":"cam",rnd(.9,1.3)); a.position.set(s*rnd(4,13),0,8+i*2.2+rnd(-1,1)); scene.add(a); }
  for(const z of [12,22,32]){ for(const s of [-1,1]){ const b=bank2(); b.position.set(s*3.1,0,z); b.rotation.y=-s*Math.PI/2; scene.add(b); } }
  const by=bayrak(10,2.6); by.position.set(6,0,3.5); scene.add(by);
  B.kampusSinir=p=>{ const icerde=p.z<0, kapida=Math.abs(p.x)<.85; if(icerde){ p.x=clamp(p.x,-Wb/2+.4,Wb/2-.4); p.z=clamp(p.z,-D+.35,kapida?.05:-.35); } else { p.x=clamp(p.x,-14,14); p.z=clamp(p.z,kapida?-.05:.35,42); }
    if(Math.abs(p.z)<.35&&Math.abs(p.x)>.85){ p.z=p.z<0?-.35:.35; } p.y=0; };
}

/* ================= BÖLÜM NESNESİ ================= */
const BD={
  id:"diploma", no:11, ad:"Diploma Günü", tarih:"26 Eylül 2025", alt:"Gece üçte yola, sabah diploma, akşam AŞTİ",
  async kur(){ this.kareler=[]; await this.otobusKur(true); },
  async otobusKur(gece){
    this.faz="otobus"; this.t=0; ETK=[]; this.tw=[]; this.serbest=false; this.gece=gece;
    const gy=new THREE.Vector3(.4,gece?.3:.6,-.8).normalize();
    sahneKur({sis:gece?"#0b0e18":"#dfe6ee",sisYakin:30,sisUzak:120,ust:gece?"#05070f":"#9ec4e6",ufuk:gece?"#121624":"#eef2f4",alt:"#2a2c30",gunesYon:gy,isikYon:gy,gunesRenk:"#fff0dc",isik:gece?"#9fb0ff":"#fff1e0",isikGuc:gece?.15:1.2,zemin:"#3a3f4a",hemi:gece?.3:.75,dolgu:gece?.1:.4});
    otobusIciKur(this,gece);
    this.kar=karakter("kardelen",gece?"kis":"gunluk"); const D=this.kar; D.position.copy(this.koltuk27); D.rotation.y=Math.PI; D.userData.otur=1; D.userData.oturY=.47; scene.add(D);
    this.oyuncu=D; KONUSANLAR={kardelen:D}; this.tel=telefonYap(); this.tel.userData.telefon=true; this.tel.visible=false; scene.add(this.tel);
    this.otobusKam=dt=>{ camera.position.set(-.35+Math.sin(this.t*9)*.004,1.28+Math.sin(this.t*13)*.003,-2.35); camera.lookAt(-.92,1.05,-1.35); }; Kamera.sinema=this.otobusKam;
    Ses.ton=gece?"gece":"sicak";
  },
  async kampusKur_(){
    this.faz="kampus"; this.t=0; ETK=[]; this.tw=[]; this.serbest=false;
    const gy=new THREE.Vector3(.4,.55,.7).normalize();
    sahneKur({sis:"#dfe6ea",sisYakin:60,sisUzak:260,ust:"#5f98d6",ufuk:"#e2ecf2",alt:"#9aa6ae",gunesYon:gy,isikYon:gy,gunesRenk:"#fff2dc",isik:"#fff1e0",isikGuc:2.0,zemin:"#7a8a5a",hemi:.85,dolgu:.55});
    Ses.ortam("kus",.8);
    kampusKur(this);
    this.kar=karakter("kardelen","gunluk"); this.oyuncu=this.kar; this.kar.position.set(0,0,28); this.kar.rotation.y=Math.PI; scene.add(this.kar);
    this.memur=kalabalik("rpm",{ust:"#3a4a66",alt:"#2a2a33",anim:"idle",sac:"#2a1d14"}); if(this.memur){ kafaEkle(this.memur,"rpm"); /* bankodaki memur: kulaklıklı/güneş gözlüklü kalabalık modeli yerine sade giyimli */ this.memur.position.set(0,0,-10.4); this.memur.rotation.y=0; scene.add(this.memur); }
    this.ogrenciler=[]; for(let i=0;i<7;i++){ const kiz=i%2===0; const c=kalabalik(kiz?"michelle":"rpm",{ust:["#7a2236","#2f4a5a","#e9d5c9","#3a3f4b","#c9a24a"][i%5],alt:["#2a3550","#1d1f26","#3a4a66"][i%3],anim:i<4?"walk":"idle",telefon:i===5,ton:kiz?"#f3e9e3":null}); if(!c) continue;
      if(i<4){ c.position.set(rnd(-1.4,1.4),0,rnd(10,40)); c.userData.yol={hz:(i%2?1:-1)*rnd(.8,1.1)}; c.userData.hiz=1.1; } else { const [x,z,ry]=[[-7.4,-6.2,Math.PI/2],[7.3,-3.6,-Math.PI/2],[6.6,-8.0,-2.3]][i-4]; c.position.set(x,0,z); c.rotation.y=ry; } // bekleyenler duvar kenarında: sandalye sırasının içinde (ayakları sandalye altında) durmasınlar
      c.userData.engelKisi=true; scene.add(c); this.ogrenciler.push(c); }
    KONUSANLAR={kardelen:this.kar,gorevli:this.memur};
    this.tel=telefonYap(); this.tel.userData.telefon=true; this.tel.visible=false; scene.add(this.tel);
    this.dosya=new THREE.Mesh(new THREE.BoxGeometry(.32,.02,.24),mat("#7a1f2a",{roughness:.5})); this.dosya.visible=false; this.dosya.userData.dik=true; scene.add(this.dosya);
    Kamera.sinema=null; Kamera.aci=0; Kamera.mesafe=5.2; Kamera.yukseklik=2.3; Kamera.hedef.copy(this.kar.position); Kamera.poz.set(0,3,34);
    Ses.ton="sicak";
  },
  tween(sure,f){ return new Promise(r=>this.tw.push({t:0,sure,f,r})); },
  qte(y){ return BK.qte.call(this,y); },
  async basla(){
    katmanTemizle(); ustDugmeler(); this.btn=aksiyonEkle();
    const D=this.kar;
    // 02:30 alarm
    await this.alarm();
    await sahne(async()=>{
      baslikKarti(this.ad,[this.tarih,"Bölüm "+this.no]); await bekle(3400);
      await anlat("26 Eylül 2025. Gece üç. İzmit otogarından Kastamonu otobüsüne bindi; 27 numara, tekli koltuk.",3600);
      await anlat("Diplomasını alacaktı. Ben Çorum'da uyuyordum; biletini ben almıştım.",3000);
      D.userData.telefon=2; this.tel.visible=true; eldeTut(D,this.tel,"S");
      const dm=DM.ac("Kaan 💙","son görülme 00:26"); dm.zaman("26 Eylül · 03:13");
      await dm.yaz("ben","Otobüse bindim"); await dm.yaz("ben","27 numara, tekli 🙈"); await bekle(600); DM.kapat();
      D.userData.telefon=0; D.userData.eldeki=null; this.tel.visible=false; D.userData.kafa.rotation.z=-.25;
      await anlat("Otobüs karanlıkta ilerledi. O, cama yaslanıp uyudu.",2800);
    });
    await gecis(async()=>{ katmanTemizle(); await this.kampusKur_(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await this.kampus();
    await gecis(async()=>{ katmanTemizle(); await this.otobusKur(false); katmanTemizle(); ustDugmeler(); this.btn=aksiyonEkle(); });
    await this.ankaraYolu();
    await gecis(async()=>{ katmanTemizle(); await this.astiBolumKur(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await this.asti();
  },
  alarm(){ return new Promise(r=>{ const d=el(`<div class="alarm"><small>Alarm</small><b>02:30</b><span>Kastamonu otobüsü 🚌</span><div class="satir"><button class="btn ince kucuk ertele">Ertele</button><button class="btn kucuk kapat">Kapat</button></div></div>`); katman.appendChild(d);
    let cal=setInterval(()=>Ses.efekt("zil",.3),900); Ses.efekt("titresim");
    d.querySelector(".ertele").onclick=()=>{ d.querySelector("span").textContent="Beş dakika daha… yok yok, kaçarsın! 😅"; Ses.efekt("vuru",.3); };
    d.querySelector(".kapat").onclick=()=>{ clearInterval(cal); d.classList.add("bitti"); setTimeout(()=>{ d.remove(); r(); },500); }; }); },
  async kampus(){
    const D=this.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(8,6,26),new THREE.Vector3(0,3,0));
      await kameraNoktasi(s=>new THREE.Vector3(8-s*1.2,6-s*.5,26-s),new THREE.Vector3(0,3,0),4);
      await anlat("Sabah dokuz buçuk, Kastamonu. Kampüs bomboş sayılır; dersler daha başlamamış.",3200);
      await kameraNoktasi(ondenNokta(D,2.4,.3,.2),bas(D),1.6);
      await konus("kardelen",["Son kez öğrenci işleri","Diplomamı alıp kaçıyorum kdkdkd"],{gul:1,uzak:1.6});
    });
    gorev("Öğrenci işleri binasına gir");
    this.serbest=true; gizliKalpler(this,[[-6.5,1.0,18,0],[7.5,1.0,-8.4,1]]);
    kosul(()=>D.position.z<15).then(()=>{ if(this.serbest) konus("kardelen",["Bu yolu çok yürüdüm","Son kez kdkdkd"],{kamera:false,sure:2400}); });
    // önce kapı: işaret camın arkasındaki makinede değil kapıda (oyuncu cam cepheye yürüyüp kalmasın)
    { const kapiN=new THREE.Object3D(); kapiN.position.set(0,0,1.3); scene.add(kapiN); let gir=null;
      const e=etkilesim(kapiN,"İçeri gir",()=>{ if(gir) gir(); },{mesafe:1.9,isaretY:2.0});
      await new Promise(r=>{ gir=r; kosul(()=>D.position.z<-.25).then(r); }); etkilesimKaldir(e);
      if(D.position.z>-.25){ this.serbest=false; D.position.x=clamp(D.position.x,-.6,.6); await yuruHedef(D,new THREE.Vector3(0,0,-1.4),1.2); this.serbest=true; } }
    gorev("Sıra fişi al");
    await etkBekle(this.siraMakinesi,"Sıra fişi al",{mesafe:1.5,isaretY:1.6});
    this.serbest=false; gorev(null); Ses.efekt("vuru",.4);
    const fis=el(`<div class="sira-fis"><small>ÖĞRENCİ İŞLERİ</small><b>027</b><span>Önünüzde 2 kişi var</span></div>`); katman.appendChild(fis); requestAnimationFrame(()=>fis.classList.add("gor"));
    await sahne(async()=>{ await konus("kardelen",["Yine 27","Bu sayı peşimi bırakmıyor kdkdkd"],{gul:1}); fis.classList.remove("gor"); setTimeout(()=>fis.remove(),500);
      await yuruHedef(D,new THREE.Vector3(-1.6,0,-3.4),1.1); D.rotation.y=Math.PI; D.userData.otur=1; D.userData.oturY=.45; D.position.set(-1.6,0,-3.82);
      await kameraNoktasi(new THREE.Vector3(2.5,2.2,-1.0),new THREE.Vector3(0,2.6,-11),1.2);
      for(const n of [25,26,27]){ await bekle(1100); this.siraCiz(n,n===27?2:n===25?3:1); Ses.efekt("zil",.35); }
      await konus("kardelen",["Benim!","2 numaralı banko"],{gul:1}); D.userData.otur=0; D.position.set(-1.05,0,-3.75); });
    gorev("2 numaralı bankoya git");
    this.serbest=true;
    await etkBekle(this.bankolar[1],"Diplomamı almaya geldim",{mesafe:2.0,isaretY:2.0});
    this.serbest=false; gorev(null);
    await sahne(async()=>{ await yuruHedef(D,new THREE.Vector3(0,0,-8.9),1); D.rotation.y=Math.PI;
      await konus("gorevli","Günaydın. Kimliğinizi alabilir miyim? …Tamam, buyurun. Diplomanız hazır.",{dinleyen:"kardelen"});
      await konus("kardelen",["Teşekkür ederim","Bunun için gece üçte yola çıktım 😄"],{gul:1,dinleyen:"gorevli"});
      await konus("gorevli","Hayırlı olsun, yolunuz açık olsun.",{dinleyen:"kardelen"});
      this.dosya.visible=true; eldeTut(D,this.dosya,"S"); D.userData.kolS.rotation.set(-.9,0,-.15); Ses.efekt("parilti");
      const kart=el(`<div class="diploma-kart"><small>T.C.</small><b>LİSANS DİPLOMASI</b><span>Kardelen</span><i>Bütün emeklerin karşılığı</i></div>`); katman.appendChild(kart); requestAnimationFrame(()=>kart.classList.add("gor"));
      await bekle(2800); kart.classList.remove("gor"); setTimeout(()=>kart.remove(),600);
      await yuruHedef(D,new THREE.Vector3(0,0,2.2),1.2); D.rotation.y=0;
      gogusteTut(D,this.dosya,true); // diplomayı iki eliyle göğsünün önünde, objektife dönük tutar (önceden tepsi gibi yatay tutuyordu)
      await kameraNoktasi(ondenNokta(D,1.5,.2,.1),bas(D).add(new THREE.Vector3(0,-.2,0)),1.2); D.userData.gulumse=1;
      await hatiraFoto("Diploma günü · 26 Eylül 2025"); await bekle(1400);
      const foto=await kareAl(300);
      gogustenBirak(D,this.dosya); // diploma çantaya; telefon çıkar (önceden diploma havada asılı kalıyordu)
      D.userData.kolS.rotation.set(0,0,0); D.userData.telefon=2; this.tel.visible=true; eldeTut(D,this.tel,"S");
      const dm=DM.ac("Kaan 💙","son görülme 00:26"); dm.zaman("11:38");
      if(foto) await dmResim("ben",foto); await dm.yaz("ben","Diploma elimde 🎓");
      dm.zaman("14:20"); await dm.yaz("o","Uyandım uyandım 😴"); await dm.yaz("o","Hayırlı olsun diplomalı kız 🎓");
      await dm.yaz("o","Çanta hazır, dörtte çıkıyorum, AŞTİ'de buluşuyoruz haberin olsun");
      await bekle(500); DM.kapat(); D.userData.telefon=0; D.userData.eldeki=null; this.tel.visible=false;
    });
  },
  async ankaraYolu(){
    const D=this.kar;
    await sahne(async()=>{
      await anlat("Öğleden sonra dört. Bu sefer Ankara otobüsü.",2400);
      D.userData.telefon=2; this.tel.visible=true; eldeTut(D,this.tel,"S");
      const dm=DM.ac("Kaan 💙","yolda"); dm.zaman("18:03");
      await dm.yaz("o","Benzin aldım, Ankara'ya bir saatlik yolum kaldı haberin olsun");
      await dm.yaz("ben","Ben Çankırı'yı geçemedim daha"); await dm.yaz("ben","Mola uzadıkça uzadı");
      await dm.yaz("o","Birazdan çıkarsınız, merak etme");
      await dm.yaz("ben","Kemerini tak"); await dm.yaz("o","Taktım, uslu uslu sürüyorum");
      await bekle(600); DM.kapat(); D.userData.telefon=0; D.userData.eldeki=null; this.tel.visible=false;
      await anlat("İki ayrı yoldan aynı şehre. Biri arabayla, biri otobüsle.",2800);
    });
  },
  async astiBolumKur(){ this.tw=[]; this.t=this.t||0; await BA.astiKur.call(this,true); this.astiHazirla(); },
  astiHazirla(){ this.faz="asti"; this.otobus.position.set(-120,0,24); this.otobus.rotation.y=Math.PI/2; this.kareler=this.kareler||[]; this.oyuncu=this.kaan; this.kaan.position.x=this.peron[this.bosPeron]-24; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(NaN,NaN,NaN); },
  async asti(){
    const K=this.kaan, D=this.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(-48,10,30),new THREE.Vector3(-30,2.5,-4));
      await kameraNoktasi(s=>new THREE.Vector3(-48+s*2.4,10-s*.7,30-s*1.6),new THREE.Vector3(-30,2.5,-4),4);
      await anlat("Akşam sekize doğru, AŞTİ. Ben erkenden gelmiştim.",2600);
      this.tel.visible=true; eldeTut(K,this.tel,"S"); K.userData.telefon=2;
      await kameraNoktasi(ondenNokta(K,1.3,.3,.08),bas(K).add(new THREE.Vector3(0,-.1,0)),1.2);
      const dm=DM.ac("Kardelen 💕","çevrimiçi"); dm.zaman("19:42");
      await dm.yaz("ben","Ben vardım, peronların oradayım"); await dm.yaz("o","Ankara'ya girdik"); await dm.yaz("o","Az kaldı");
      await dm.yaz("ben","Sen nasıl geleceksin peron tarafına?"); await dm.yaz("o","Yürüye yürüye gelirim kdkdkd");
      const c=await dm.sec(["Ankaralı mısın çen 😄","Ankara'yı ezberlemişsin 😄"]);
      await dm.yaz("ben",c?"Ankara'yı ezberlemişsin 😄":"Ankaralı mısın çen 😄"); await dm.yaz("o","Evet kdkdkd"); await dm.yaz("o","Geldik!");
      await bekle(600); DM.kapat(); K.userData.telefon=0; K.userData.eldeki=null; this.tel.visible=false;
    });
    await BA.otobusGelis.call(this);
    gorev("Kastamonu otobüsünü bul, diplomalı kızı karşıla");
    this.serbest=true; gizliKalpler(this,[[58,1.1,-6.1,2]]);
    await kosul(()=>K.position.distanceTo(D.position)<11);
    D.userData.salla=1; D.userData.gulumse=1; D.userData.bakNokta=bas(K);
    konus("kardelen",["Buradayım 🎓"],{kamera:false,sure:1.6});
    await kosul(()=>K.position.distanceTo(D.position)<6.5);
    this.serbest=false; gorev(null);
    await sahne(async()=>{ await BA.kosarakSaril.call(this,K,D,"AŞTİ · Diploma günü");
      await konus("kaan","Hoş geldin diplomalı kız. Göster bakalım şunu.",{gul:.8});
      this.dosya2=new THREE.Mesh(new THREE.BoxGeometry(.32,.02,.24),mat("#7a1f2a",{roughness:.5})); this.dosya2.userData.dik=true; scene.add(this.dosya2); eldeTut(D,this.dosya2,"S"); D.userData.kolS.rotation.set(-1.0,0,-.2);
      await konus("kardelen",["Taaa daaa 🎓","Gece üçten beri yoldayım ama değdi"],{gul:1});
      const c=await sec(["Gurur duyuyorum seninle minnakım.","Ankaralı diplomalı kız, haberin olsun 😄"]);
      if(c===0){ await konus("kaan","Gurur duyuyorum seninle minnakım.",{gul:.7}); await konus("kardelen",["Ben de kendimle 🥹","Şaka şaka, seninle de"],{gul:1}); }
      else { await konus("kaan","Ankaralı diplomalı kız, haberin olsun 😄",{gul:.8}); await konus("kardelen",["Şapşik","Yürüyerek geldim ama kdkdkd"],{gul:1}); }
      yuzYuze(K,D); K.position.x+=.05; gogusteTut(D,this.dosya2,true); await kameraNoktasi(ondenNokta(K,1.9,.5,.15),bas(K).lerp(bas(D),.5),1.3);
      await hatiraFoto("AŞTİ · Diploma günü · 26 Eylül 2025"); await bekle(1500);
      gogustenBirak(D,this.dosya2); D.userData.kolS.rotation.set(0,0,0);
      await anlat("O gece Ankara'nın ışıkları bize diploma töreni gibi geldi.",3000);
    });
    bolumBitti(this.no);
  },
  guncelle(dt){
    this.t+=dt; dalgaGuncelle(this.t); this.tw=this.tw.filter(a=>{ a.t+=dt; const k=Math.min(1,a.t/a.sure); a.f(k); if(k>=1){ a.r(); return false; } return true; });
    if(this.faz==="otobus"){ if(!Kamera.sinema) Kamera.sinema=this.otobusKam; this._oc=(this._oc||0)+dt; if(this._oc>.05&&this.otobusCiz){ this._oc=0; this.otobusCiz(this.t); } return; }
    if(this.faz==="asti"){ BA.guncelle.call(this,dt); return; }
    const D=this.kar; if(!D) return;
    for(const c of this.ogrenciler||[]){ const y=c.userData.yol; if(!y) continue; c.position.z+=y.hz*dt*1.2; c.rotation.y=y.hz>0?0:Math.PI; if(c.position.z>42||c.position.z<6.5) y.hz*=-1; /* kapı önüne (fotoğraf çekilen yere) gelmezler */ }
    if(this.serbest&&!kilit) yuru(D,dt,this.kampusSinir,2.0);
    etkilesimGuncelle(D,this.btn);
    if(!Kamera.sinema) Kamera.hedef.lerp(D.position,.12);
  },
  temizle(){ DM.kapat&&DM.kapat(); this.kosu=null; }
};
