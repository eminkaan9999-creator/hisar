/* ================= BÖLÜM: NİŞANDA DANS (Mayıs 2026 · Samsun, Terme) ================= */
/* Arkadaşlarımızın nişanı. Otelde hazırlık ve “prova şart”: adımları sırayla tekrarla. Akşam salonda pist boş kalınca
   sahneye çıkarız; kameraman çeker, yedi dakika yirmi dört saniye boyunca sahnede bir tek biz dans ederiz. */

/* ---------- elbiseyi yeniden renklendir: dokuyu parlaklığına göre hedef renge boyar (gölgeler korunur) ---------- */
function elbiseRenk(c,renkH){
  const u=c.userData; const hedef=new THREE.Color(renkH);
  c.traverse(o=>{ if(!o.isMesh||!o.material||o.material.name!=="outfit"||!o.material.map||!o.material.map.image) return;
    const img=o.material.map.image; const key="__"+renkH; if(!elbiseRenk[key]){ const cv=document.createElement("canvas"); cv.width=img.width; cv.height=img.height; const x=cv.getContext("2d"); x.drawImage(img,0,0);
      const d=x.getImageData(0,0,cv.width,cv.height), p=d.data; const hr=hedef.r*255, hg=hedef.g*255, hb=hedef.b*255;
      for(let i=0;i<p.length;i+=4){ const r=p[i], g=p[i+1], b=p[i+2]; const L=(r*.3+g*.55+b*.15)/255; const pembe=r>g+18&&r>b-10&&b>g-5; if(!pembe) continue; const k=.45+L*.9; p[i]=Math.min(255,hr*k+L*18); p[i+1]=Math.min(255,hg*k+L*18); p[i+2]=Math.min(255,hb*k+L*24); }
      x.putImageData(d,0,0); const t=new THREE.CanvasTexture(cv); t.encoding=o.material.map.encoding; t.flipY=o.material.map.flipY; elbiseRenk[key]=t; }
    const m=o.material.clone(); m.map=elbiseRenk[key]; m.userData.kalici=true; o.material=m; });
  if(u.pembeEtek){ const e=Array.isArray(u.pembeEtek)?u.pembeEtek:[u.pembeEtek]; e.forEach(x=>x&&x.traverse(o=>{ if(o.isMesh&&o.material){ o.material=o.material.clone(); o.material.color=renk(renkH); o.material.roughness=.42; o.material.metalness=.15; } })); }
}

/* ---------- nişan salonu: mermer zemin, ahşap pist, sahne ve LED fon, yuvarlak masalar, avizeler, hareketli ışıklar ---------- */
function salonKur(B){
  Ses.zemin="tas"; const W=24, D=30, H=6, x0=-W/2, z0=-D/2;
  const mer=_bkTuval(512,512,(x,w,h)=>{ x.fillStyle="#2a2630"; x.fillRect(0,0,w,h); for(let i=0;i<40;i++){ x.strokeStyle=`rgba(${rnd(150,220)},${rnd(140,200)},${rnd(150,220)},.12)`; x.lineWidth=rnd(1,3); x.beginPath(); x.moveTo(Math.random()*w,0); x.bezierCurveTo(Math.random()*w,h*.3,Math.random()*w,h*.6,Math.random()*w,h); x.stroke(); }
    x.strokeStyle="rgba(0,0,0,.35)"; x.lineWidth=2; for(let i=0;i<=w;i+=128){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,h); x.stroke(); x.beginPath(); x.moveTo(0,i); x.lineTo(w,i); x.stroke(); } });
  mer.wrapS=mer.wrapT=THREE.RepeatWrapping; mer.repeat.set(5,6);
  const zem=new THREE.Mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshStandardMaterial({map:mer,roughness:.18,metalness:.25})); zem.rotation.x=-Math.PI/2; zem.receiveShadow=true; scene.add(zem);
  const pt=parkeDoku("#b98a5a","#9a7048"); pt.wrapS=pt.wrapT=THREE.RepeatWrapping; pt.repeat.set(3,2);
  const pist=new THREE.Mesh(new THREE.PlaneGeometry(10,6),new THREE.MeshStandardMaterial({map:pt,roughness:.3})); pist.rotation.x=-Math.PI/2; pist.position.set(0,.006,-5); pist.receiveShadow=true; scene.add(pist);
  const tav=new THREE.Mesh(new THREE.PlaneGeometry(W,D),mat("#1a1622",{roughness:1})); tav.rotation.x=Math.PI/2; tav.position.y=H; scene.add(tav);
  // drape duvarlar (dalgalı kumaş)
  const drM=mat("#efe6ee",{roughness:1,side:THREE.DoubleSide});
  const drape=(w,x,z,ry)=>{ const g=new THREE.PlaneGeometry(w,H,Math.round(w*6),1); const P=g.attributes.position; for(let i=0;i<P.count;i++) P.setZ(i,Math.sin(P.getX(i)*4)*.08); g.computeVertexNormals(); const m=new THREE.Mesh(g,drM); m.position.set(x,H/2,z); m.rotation.y=ry; m.userData.kameraEngel=true; /* takip kamerası perdenin arkasına geçmez (salon girişinde ekran mor perdeyle doluyordu) */ scene.add(m); };
  drape(W,0,z0,0); drape(D,x0,0,Math.PI/2); drape(D,-x0,0,-Math.PI/2); drape(W,0,-z0,Math.PI);
  // sahne
  const sah=new THREE.Mesh(new THREE.BoxGeometry(10,.7,5),mat("#1b1622",{roughness:.4})); sah.position.set(0,.35,-11); sah.castShadow=true; sah.receiveShadow=true; scene.add(sah);
  const sahU=new THREE.Mesh(new THREE.PlaneGeometry(10,5),new THREE.MeshStandardMaterial({color:renk("#2a2232"),roughness:.15,metalness:.4})); sahU.rotation.x=-Math.PI/2; sahU.position.set(0,.705,-11); scene.add(sahU);
  for(let i=0;i<3;i++){ const b=new THREE.Mesh(new THREE.BoxGeometry(2.4,.23,.35),mat("#2a2232")); b.position.set(0,.115+i*.23,-8.32-i*.0+(2-i)*.35-.35); scene.add(b); }
  // LED fon
  B.ledC=document.createElement("canvas"); B.ledC.width=512; B.ledC.height=192; B.ledT=new THREE.CanvasTexture(B.ledC); B.ledT.encoding=THREE.sRGBEncoding;
  const led=new THREE.Mesh(new THREE.PlaneGeometry(10,3.8),new THREE.MeshBasicMaterial({map:B.ledT,toneMapped:false})); led.position.set(0,2.6,-13.45); scene.add(led);
  B.ledCiz=t=>{ const x=B.ledC.getContext("2d"); const g=x.createLinearGradient(0,0,512,192); g.addColorStop(0,`hsl(${300+Math.sin(t*.3)*30},45%,22%)`); g.addColorStop(1,`hsl(${220+Math.cos(t*.25)*30},45%,18%)`); x.fillStyle=g; x.fillRect(0,0,512,192);
    for(let i=0;i<40;i++){ const px=(i*97+t*20*(i%3+1))%512, py=(i*53+Math.sin(t+i)*20)%192; x.fillStyle=`rgba(255,${200+i%50},${220},${.3+.3*Math.sin(t*2+i)})`; x.beginPath(); x.arc(px,py,1.5+i%3,0,7); x.fill(); }
    x.fillStyle="#fff6ee"; x.font="italic 600 34px Georgia"; x.textAlign="center"; x.fillText("Hoş Geldiniz",256,92); x.font="20px Georgia"; x.fillText("♥",256,128); B.ledT.needsUpdate=true; };
  B.ledCiz(0);
  for(const sx of [-1,1]){ const c=new THREE.Group(); c.position.set(sx*4.4,.7,-12.6); scene.add(c); for(let i=0;i<18;i++){ const f=new THREE.Mesh(new THREE.SphereGeometry(rnd(.12,.2),10,8),mat(i%3?"#f6f0f2":"#f2b6c8",{roughness:.8})); f.position.set(rnd(-.4,.4),rnd(.6,1.6),rnd(-.3,.3)); c.add(f); } const v=new THREE.Mesh(new THREE.CylinderGeometry(.2,.14,.7,14),mat("#e9e1d6",{metalness:.3,roughness:.3})); v.position.y=.35; c.add(v); }
  // masalar, sandalyeler, ortalarında mumlar
  for(const [x,z] of [[-8,-6],[8,-6],[-8,-1],[8,-1],[-8,4],[8,4],[-3.5,6],[3.5,6],[-8,9],[8,9]]){ const m=masa(.85,"#fbf6f8"); m.position.set(x,0,z); m.userData.engel=1.35; scene.add(m);
    for(let k=0;k<6;k++){ const s=sandalye("#f4eef2"); const a=k/6*Math.PI*2; s.position.set(x+Math.cos(a)*1.25,0,z+Math.sin(a)*1.25); s.rotation.y=-a-Math.PI/2; scene.add(s); }
    const mm=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.18,8),new THREE.MeshStandardMaterial({color:renk("#fff6e6"),emissive:renk("#ffcf8a"),emissiveIntensity:.8})); mm.position.set(x,.88,z); scene.add(mm); const p=parilti("#ffcf8a",.4); p.position.set(x,1.0,z); scene.add(p); }
  // avizeler
  for(const [x,z] of [[0,-4],[-6,3],[6,3]]){ const a=new THREE.Group(); a.position.set(x,H-1.2,z); scene.add(a); for(let i=0;i<26;i++){ const k=new THREE.Mesh(new THREE.OctahedronGeometry(.07,0),new THREE.MeshStandardMaterial({color:renk("#ffffff"),metalness:.2,roughness:.05,emissive:renk("#fff1de"),emissiveIntensity:.6})); const an=i/26*Math.PI*2; k.position.set(Math.cos(an)*(.5+(i%3)*.15),-(i%3)*.25,Math.sin(an)*(.5+(i%3)*.15)); a.add(k); }
    const l=new THREE.PointLight(renk("#ffe6c8"),1.1,16,1.4); l.position.set(x,H-1.8,z); scene.add(l); }
  // hareketli renkli spotlar (dans sırasında güçlenir)
  B.spotlar=[]; for(let i=0;i<4;i++){ const s=new THREE.SpotLight(renk(["#ff6fae","#6fa8ff","#c98aff","#ffd28a"][i]),0,22,.35,.6,1.2); s.position.set(-6+i*4,H-.3,-2); s.target.position.set(0,.7,-11); scene.add(s,s.target); B.spotlar.push(s); }
  B.salonSinir=p=>{ p.x=clamp(p.x,x0+.6,-x0-.6); p.z=clamp(p.z,z0+2.2,-z0-.6); const sahnede=Math.abs(p.x)<4.8&&p.z<-8.6; p.y=sahnede?.7:(Math.abs(p.x)<1.2&&p.z<-7.9&&p.z>-8.6?.35:0); };
}

/* ================= BÖLÜM NESNESİ ================= */
const BN={
  id:"nisan", no:14, ad:"Nişanda Dans", tarih:"Mayıs 2026", alt:"Prova şart: sahnede yedi dakika yirmi dört saniye",
  async kur(){ await this.otelKur(); },
  tvCiz(d,t){ return BI.tvCiz.call(this,d,t); },
  tween(sure,f){ return new Promise(r=>this.tw.push({t:0,sure,f,r})); },
  qte(y){ return BK.qte.call(this,y); },
  async otelKur(){
    this.faz="otel"; this.t=0; ETK=[]; this.tw=[]; this.serbest=false; this.durum=null; this.elele=false;
    const gy=new THREE.Vector3(-.6,.18,-1).normalize();
    sahneKur({sis:"#e9b89a",sisYakin:120,sisUzak:900,ust:"#4a5c9a",ufuk:"#ffb98a",alt:"#2b4f74",gunesYon:gy,isikYon:new THREE.Vector3(-.4,.5,-1),gunesRenk:"#ffc88a",isik:"#ffbe8a",isikGuc:1.2,zemin:"#6a5a52",hemi:.6,dolgu:.5,dolguRenk:"#ffd9c2"});
    otelOdasi(this,{gece:false});
    await pembeHazirla(); await takimHazirla();
    this.kaan=karakter("kaan","takim"); this.kar=karakter("kardelen","pembe"); elbiseRenk(this.kar,"#1d2a52");
    this.kaan.position.set(.4,0,.6); this.kar.position.set(-.3,0,.2); this.kaan.rotation.y=Math.PI*.9; this.kar.rotation.y=Math.PI*.2; scene.add(this.kaan,this.kar);
    this.oyuncu=this.kaan; KONUSANLAR={kaan:this.kaan,kardelen:this.kar}; this.tel=telefonYap(); this.tel.userData.telefon=true; this.tel.visible=false; scene.add(this.tel);
    Kamera.sinema=null; Kamera.aci=.3; Kamera.mesafe=3.4; Kamera.yukseklik=1.8; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(1.5,2.4,4);
    Ses.ton="sicak";
  },
  async basla(){
    katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle();
    const K=this.kaan, D=this.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(1.4,1.8,-2.4),new THREE.Vector3(.2,1.2,.8));
      baslikKarti(this.ad,[this.tarih,"Bölüm "+this.no]); await bekle(3400);
      await anlat("Mayıs 2026, Samsun. Arkadaşlarımızın nişanı. Otel odasında son hazırlıklar.",3200);
      yuzYuze(K,D);
      await konus("kardelen",["Çok yakışmış takım elbise","Ama bu akşam oynamak var"],{gul:1});
      await konus("kaan","Ben oynarım ya, sen merak etme 😄",{gul:.6});
      await konus("kardelen",["Ben seni bilirim","Prova şart","Her şarkıda kalkıp oynayacaksın, kaçmak yok"],{gul:1});
    });
    await this.prova();
    gorev("Gitmeden aynaya bir bak");
    this.serbest=true; gizliKalpler(this,[[-1.0,1.0,-2.45,0]]);
    const ay=this.ayna, gar=new THREE.Object3D(); gar.position.set(ay?ay.position.x+.55:2.0,0,ay?ay.position.z:2.15); scene.add(gar);
    await etkBekle(gar,ay?"Aynaya bak":"Hazırlan",{mesafe:1.5,isaretY:1.3});
    this.serbest=false; gorev(null);
    await sahne(async()=>{ if(ay){ cevir(K,ay.position); await bekle(300); await konus("kaan","Takım tamam, saç tamam. Kravat düz mü?",{gul:.5}); }
      await konus("kardelen",["Kravat dümdüz, yakışıklı da oldun","Hadi, salon Terme'de, bir saat yol"],{gul:.9}); });
    await gecis(async()=>{ katmanTemizle(); await this.salonKur_(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await this.salon();
  },
  // prova: Kardelen gösterir, sen sırayı tekrarla
  async prova(){
    const K=this.kaan, D=this.kar;
    const adimlar=["⬅️","➡️","🔄","🙌"], ad={"⬅️":"Sol","➡️":"Sağ","🔄":"Dön","🙌":"Eller"};
    gorev("Prova · adımları sırayla tekrarla");
    const ui=el(`<div class="sim prova-ui"><div class="baslik">Prova</div><div class="ipucu">Kardelen gösteriyor…</div><div class="pv-sira"></div>
      <div class="satir">${adimlar.map(a=>`<button class="pv" data-a="${a}">${a}<small>${ad[a]}</small></button>`).join("")}</div></div>`); katman.appendChild(ui);
    const sira=ui.querySelector(".pv-sira"), ip=ui.querySelector(".ipucu"); const btn=[...ui.querySelectorAll(".pv")];
    Kamera.sinema=dt=>{ const a=.4+Math.sin(this.t*.2)*.3; const m=K.position.clone().lerp(D.position,.5); camera.position.set(m.x+Math.sin(a)*3.0,1.7,m.z+Math.cos(a)*3.0); camera.lookAt(m.x,1.2,m.z); };
    for(const uz of [3,4,5]){
      const hedef=[]; for(let i=0;i<uz;i++) hedef.push(adimlar[Math.floor(Math.random()*4)]); this._provaHedef=hedef;
      let tamam=false;
      while(!tamam){ btn.forEach(b=>b.disabled=true); ip.textContent="Kardelen gösteriyor…"; sira.innerHTML=""; D.userData.dans=1;
        for(const a of hedef){ const s=el(`<span class="pv-a">${a}</span>`); sira.appendChild(s); Ses.efekt("vuru",.2); D.userData.govde.rotation.z=a==="⬅️"?.15:a==="➡️"?-.15:0; if(a==="🙌") D.userData.salla=1; await bekle(650); D.userData.salla=0; D.userData.govde.rotation.z=0; }
        await bekle(400); sira.innerHTML=hedef.map(()=>`<span class="pv-a gizli">?</span>`).join(""); D.userData.dans=0; ip.textContent="Şimdi sen: aynı sırayla"; btn.forEach(b=>b.disabled=false); K.userData.dans=1;
        const sonuc=await new Promise(r=>{ let i=0; btn.forEach(b=>b.onclick=()=>{ const a=b.dataset.a; const s=sira.children[i]; if(a!==hedef[i]){ Ses.efekt("vuru",.15); r(false); return; }
            s.textContent=a; s.classList.remove("gizli"); s.classList.add("dogru"); Ses.efekt("parilti",.25); K.userData.govde.rotation.z=a==="⬅️"?.12:a==="➡️"?-.12:0; setTimeout(()=>{ K.userData.govde.rotation.z=0; },300); i++; if(i>=hedef.length) r(true); }); });
        K.userData.dans=0; btn.forEach(b=>b.onclick=null);
        if(sonuc){ tamam=true; ip.textContent=["Aferin 😄","Oluyor bu iş!","Tamamdır, sahneye hazırsın"][uz-3]; await bekle(900); }
        else { ip.textContent="Kardelen: Ters ayak kdkdkd · baştan"; D.userData.konus=1; D.userData.gulumse=1; await bekle(1200); D.userData.konus=0; } }
    }
    ui.remove(); gorev(null); Kamera.sinema=null;
    await sahne(async()=>{ await konus("kardelen",["Bak işte","Prova şart demiştim"],{gul:1}); await konus("kaan","Haklıydın minnakım. Bu akşam sahne bizim, haberin olsun.",{gul:.8}); });
  },
  async salonKur_(){
    this.faz="salon"; this.t=0; ETK=[]; this.tw=[]; this.serbest=false; this.durum=null; this.elele=false;
    const gy=new THREE.Vector3(.2,.8,.3).normalize();
    sahneKur({sis:"#1a1622",sisYakin:30,sisUzak:120,ust:"#0c0f2a",ufuk:"#2a1d3a",alt:"#120f1c",gunesYon:gy,isikYon:gy,gunesRenk:"#ffffff",isik:"#ffe6d0",isikGuc:.35,zemin:"#2a2030",hemi:.45,dolgu:.3,dolguRenk:"#c9a0ff"});
    Ses.ortam("kalabalik",.55);
    salonKur(this);
    this.kaan=karakter("kaan","takim"); this.kar=karakter("kardelen","pembe"); elbiseRenk(this.kar,"#1d2a52");
    this.kaan.position.set(-.4,0,12); this.kar.position.set(.4,0,12); this.kaan.rotation.y=this.kar.rotation.y=Math.PI; scene.add(this.kaan,this.kar);
    this.oyuncu=this.kaan; KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    this.misafir=[]; const ust=["#2a2f45","#7a2236","#3a3a3a","#e9d5c9","#c9a24a","#2f4a5a","#5a3a5a","#1d1f26"];
    for(let i=0;i<18;i++){ const kiz=i%2===0; const c=kalabalik(kiz?"michelle":"rpm",{resmi:true,ust:ust[i%ust.length],alt:ust[(i+3)%ust.length],anim:"idle",boy:rnd(.95,1.04),ton:kiz?["#efe6ff","#e6eef9","#f3e9e3"][i%3]:null,sac:["#2a1d14","#151515","#4a3524"][i%3]}); if(!c) continue;
      const t=[[-8,-6],[8,-6],[-8,-1],[8,-1],[-8,4],[8,4],[-3.5,6],[3.5,6],[-8,9],[8,9]][i%10]; const a=rnd(0,6.28); c.position.set(t[0]+Math.cos(a)*1.9,0,t[1]+Math.sin(a)*1.9); c.lookAt(0,0,-9); c.userData.engelKisi=true; scene.add(c); this.misafir.push(c); }
    this.kameraman=kalabalik("rpm",{ust:"#151515",alt:"#151515",anim:"idle",sac:"#151515"}); if(this.kameraman){ this.kameraman.position.set(3.2,0,-6.8); this.kameraman.lookAt(0,0,-11); scene.add(this.kameraman);
      const kam=new THREE.Mesh(new THREE.BoxGeometry(.18,.14,.28),mat("#111",{roughness:.4})); kam.position.set(3.05,1.45,-7.05); scene.add(kam); const ay=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,1.4,6),mat("#333")); ay.position.set(3.05,.7,-7.05); scene.add(ay); }
    this.flas=new THREE.PointLight(renk("#ffffff"),0,14,1.2); this.flas.position.set(3,2.2,-7); scene.add(this.flas);
    Kamera.sinema=null; Kamera.aci=0; Kamera.mesafe=6; Kamera.yukseklik=2.6; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(0,4,19);
    Ses.ton="sicak";
  },
  async salon(){
    const K=this.kaan, D=this.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(9,4.5,11),new THREE.Vector3(0,1.5,-8));
      await kameraNoktasi(s=>new THREE.Vector3(9-s*1.4,4.5-s*.3,11-s),new THREE.Vector3(0,1.5,-8),4.5);
      await anlat("Terme. Salon ışıl ışıl, müzik başladı. Ama pist bomboş.",3000);
      yuzYuze(K,D);
      await konus("kardelen",["Kimse oynamıyor","Bu kadar boş pist olur mu"],{gul:.6});
      const c=await sec(["Sahneye çıkalım mı?","Prova yaptık, şimdi gösteri zamanı 😄"]);
      await konus("kaan",c?"Prova yaptık, şimdi gösteri zamanı 😄":"Sahneye çıkalım mı?",{gul:.8});
      await konus("kardelen",["Ciddi misin","Hadi o zaman 😍"],{gul:1});
      K.rotation.y=D.rotation.y=Math.PI;
    });
    gorev("El ele sahneye çıkın");
    this.serbest=true; this.elele=true; K.userData.elele=D.userData.elele=1; gizliKalpler(this,[[-10.5,1.0,11,1],[10.5,1.0,-11,2]]);
    const s=new THREE.Object3D(); s.position.set(0,.7,-10.3); scene.add(s);
    await etkBekle(s,"Sahnede dans et",{mesafe:1.8,isaretY:1.0});
    this.serbest=false; this.elele=false; K.userData.elele=D.userData.elele=0; gorev(null);
    await sahne(async()=>{ K.position.set(-.3,.7,-10.6); D.position.set(.3,.7,-10.6); yuzYuze(K,D); K.userData.dans=D.userData.dans=1; this.dansMerkez=new THREE.Vector3(0,.7,-10.6); this.dansA=Math.atan2(K.position.x-this.dansMerkez.x,K.position.z-this.dansMerkez.z); // konuldukları yerden başlar
      this.spotlar.forEach(s=>s.intensity=2.2); this.sayac=el(`<div class="dans-sayac">0:00</div>`); katman.appendChild(this.sayac); this.sure=0;
      this.dansKam=dt=>{ const a=this.t*.22; camera.position.set(Math.sin(a)*4.4,2.3,-10.6+Math.cos(a)*4.4); camera.lookAt(0,1.6,-10.6); }; Kamera.sinema=this.dansKam;
      await anlat("Müzik değişti. Sahnede ikimiz.",2000); });
    Kamera.sinema=this.dansKam; // sahne() bitince oyuncu kamerasına dönüyordu: dans boyunca sahneyi dönen kamera kalsın
    this.ritimVurus=()=>{ this.sure=Math.min(444,this.sure+27.75); const m=Math.floor(this.sure/60), sn=Math.floor(this.sure%60); if(this.sayac) this.sayac.textContent=m+":"+String(sn).padStart(2,"0");
      if(Math.random()<.5){ this.flas.intensity=6; Ses.efekt("deklansor",.4); } for(const c of this.misafir) c.userData.alkis=this.vurus>8?1:0; };
    await ritimBasla(this,16,{sure:1.25,etiket:"Halka kalbe değince dokun"});
    this.ritimVurus=null; if(this.sayac) this.sayac.textContent="7:24";
    await sahne(async()=>{ K.userData.dans=D.userData.dans=0; K.userData.hiz=D.userData.hiz=0; yuzYuze(K,D); K.userData.saril=D.userData.saril=1; Ses.efekt("alkis"); Ses.efekt("buyuk");
      for(const c of this.misafir) c.userData.alkis=1;
      let s2=0; Kamera.sinema=dt=>{ s2+=dt; const a=.5+s2*.1; camera.position.set(Math.sin(a)*3.2,2.0,-10.6+Math.cos(a)*3.2); camera.lookAt(0,1.55,-10.6); };
      await anlat("Yedi dakika yirmi dört saniye. Sahnede bir tek biz vardık.",3200);
      K.userData.saril=D.userData.saril=0; if(this.sayac){ this.sayac.remove(); this.sayac=null; }
      await konus("kardelen",["Gördün mü","Prova işe yaradı 😍"],{gul:1});
      await konus("kaan","Bundan sonra her şarkıda kalkarım, haberin olsun.",{gul:.9});
      for(const c of this.misafir) c.userData.alkis=0;
      K.userData.dans=D.userData.dans=1; // kameramanın karesinde dans tutuşuyla ("fotoğrafların hepsinde dans ediyoruz")
      await kameraNoktasi(ondenNokta(K,2.0,.5,.15),bas(K).lerp(bas(D),.5),1.3);
      await hatiraFoto("Nişanda dans · Mayıs 2026"); await bekle(1500); K.userData.dans=D.userData.dans=0;
      await anlat("Kameraman bizi çekti. Fotoğrafların hepsinde dans ediyoruz; başka türlü çekilmedik ki.",3400);
    });
    bolumBitti(this.no);
  },
  guncelle(dt){
    this.t+=dt; this.tw=this.tw.filter(a=>{ a.t+=dt; const k=Math.min(1,a.t/a.sure); a.f(k); if(k>=1){ a.r(); return false; } return true; });
    const K=this.kaan, D=this.kar; if(!K) return;
    if(this.faz==="salon"){ this._led=(this._led||0)+dt; if(this._led>.1&&this.ledCiz){ this._led=0; this.ledCiz(this.t); }
      if(this.flas) this.flas.intensity=Math.max(0,this.flas.intensity-dt*30);
      for(const [i,s] of (this.spotlar||[]).entries()){ s.target.position.set(Math.sin(this.t*.7+i*1.6)*4,.7,-10.6+Math.cos(this.t*.5+i)*2); }
      if(this.durum==="dans"&&this.dansMerkez){ ritimGuncelle(this,dt); this.dansA+=dt*(.6+(this.dansIlerle||0)*.9); const m=this.dansMerkez, r=.3;
        K.position.set(m.x+Math.sin(this.dansA)*r,m.y,m.z+Math.cos(this.dansA)*r); D.position.set(m.x-Math.sin(this.dansA)*r,m.y,m.z-Math.cos(this.dansA)*r); yuzYuze(K,D); K.userData.hiz=D.userData.hiz=r*(.6+(this.dansIlerle||0)*.9)*1.6; return; } }
    const sinir=this.faz==="salon"?this.salonSinir:this.odaSinir;
    if(this.serbest&&!kilit&&sinir){ yuru(K,dt,sinir,this.faz==="salon"?2.0:1.6); if(this.elele){ eleleTakip(K,D,dt); sinir(D.position); } }
    etkilesimGuncelle(K,this.btn);
    if(!Kamera.sinema) Kamera.hedef.lerp(K.position,.12);
  },
  temizle(){ DM.kapat&&DM.kapat(); if(this.sayac){ this.sayac.remove(); this.sayac=null; } }
};
