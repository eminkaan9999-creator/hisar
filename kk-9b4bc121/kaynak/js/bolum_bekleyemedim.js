/* ================= BÖLÜM: BEKLEYEMEDİM (25–26 Ocak 2026 · Ankara → İzmit) ================= */
/* Plan sabah yola çıkmaktı. Gece on biri geçe valizi kapatıp AŞTİ'ye: 00:30 İzmit otobüsü. Sabaha karşı otelde.
   Dokuz buçukta tramvaydan iner, “paytak paytak” gelir. Erken doğum günü pastası ve pizza gecesi. */

/* ---------- Kaan'ın odası (Ankara, misafirhane): yatak, açık valiz, dolap, çalışma masası, pencere ---------- */
function kaanOdasi(B){
  const W=4.2, D=5, H=2.7, x0=-W/2, z0=-D/2;
  const zt=parkeDoku("#8a6a4c","#6f5238"); zt.wrapS=zt.wrapT=THREE.RepeatWrapping; zt.repeat.set(2,2.4);
  const zem=new THREE.Mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshStandardMaterial({map:zt,roughness:.6})); zem.rotation.x=-Math.PI/2; zem.receiveShadow=true; scene.add(zem);
  const tav=new THREE.Mesh(new THREE.PlaneGeometry(W,D),mat("#f2efe8")); tav.rotation.x=Math.PI/2; tav.position.y=H; scene.add(tav);
  const duvar=mat("#e4ddd0",{roughness:.95}); const dv=(w,x,z,ry)=>{ const p=new THREE.Mesh(new THREE.PlaneGeometry(w,H),duvar); p.position.set(x,H/2,z); p.rotation.y=ry; scene.add(p); };
  dv(W,0,z0,0); dv(W,0,-z0,Math.PI); dv(D,x0,0,Math.PI/2); dv(D,-x0,0,-Math.PI/2);
  const man=bkManzara("gece"); B.manzara=man; const pen=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.2),new THREE.MeshBasicMaterial({map:man.doku,toneMapped:false})); pen.position.set(.6,1.55,z0+.015); scene.add(pen);
  const cer=mat("#f6f4ee"); for(const [w,h,x,y] of [[1.42,.06,.6,2.18],[1.42,.06,.6,.92],[.06,1.3,-.08,1.55],[.06,1.3,1.28,1.55]]){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.06),cer); m.position.set(x,y,z0+.03); scene.add(m); }
  const yat=new THREE.Group(); yat.position.set(x0+.55,0,-.3); scene.add(yat); yat.userData.engel={kutu:[.5,1.05]};
  const ce=new THREE.Mesh(new THREE.BoxGeometry(.95,.3,2.05),mat("#5a4438")); ce.position.y=.18; yat.add(ce); const sil=new THREE.Mesh(new THREE.BoxGeometry(.92,.16,2.0),mat("#f4f1ea",{roughness:.95})); sil.position.y=.41; yat.add(sil);
  const ort=new THREE.Mesh(new THREE.BoxGeometry(.97,.06,1.3),mat("#3a4a66",{roughness:1})); ort.position.set(0,.5,.3); yat.add(ort); const ys=new THREE.Mesh(new THREE.BoxGeometry(.6,.12,.35),mat("#fff")); ys.position.set(0,.55,-.75); yat.add(ys);
  // açık valiz yatağın üstünde
  const val=new THREE.Group(); val.position.set(x0+.55,.5,.1); scene.add(val); B.valiz=val;
  const vm=mat("#1f2a3a",{roughness:.6}); const alt=new THREE.Mesh(kutuGeo(.55,.18,.38,.3),vm); alt.position.y=.09; val.add(alt);
  const ic=new THREE.Mesh(new THREE.BoxGeometry(.5,.005,.33),mat("#8a8f9a",{roughness:1})); ic.position.y=.17; val.add(ic);
  const kap=new THREE.Group(); kap.position.set(0,.18,-.19); val.add(kap); const kp=new THREE.Mesh(kutuGeo(.55,.06,.38,.3),vm); kp.position.set(0,.03,.19); kap.add(kp); kap.rotation.x=-1.9; B.valizKapak=kap;
  B.valizIc=[]; // yerleştirilecek eşyalar
  const esya=[["gomlek","#e9e4da",[.3,.03,.22]],["kazak","#7a2236",[.28,.05,.2]],["sarj","#f2f2f2",[.08,.02,.06]],["firca","#9fd0ff",[.16,.015,.02]],["parfum","#d9b26a",[.05,.1,.05]],["hediye","#e7a3bd",[.12,.08,.12]]];
  const masa=new THREE.Group(); masa.position.set(-x0-.45,0,-.6); scene.add(masa); masa.userData.engel={kutu:[.38,.65]};
  const mu=new THREE.Mesh(new THREE.BoxGeometry(.7,.04,1.2),mat("#7a5a40",{roughness:.6})); mu.position.y=.74; masa.add(mu); for(const [x,z] of [[-.3,-.55],[.3,-.55],[-.3,.55],[.3,.55]]){ const l=new THREE.Mesh(new THREE.BoxGeometry(.04,.72,.04),mat("#4a3a2a")); l.position.set(x,.36,z); masa.add(l); }
  esya.forEach(([ad,r,[w,h,d]],i)=>{ const m=new THREE.Mesh(ad==="parfum"?new THREE.CylinderGeometry(w/2,w/2,h,12):new THREE.BoxGeometry(w,h,d),mat(r,{roughness:ad==="parfum"?.15:.8,metalness:ad==="parfum"?.3:0})); m.position.set(-x0-.45+((i%2)?.15:-.15),.76+h/2,-.6-.45+i*.18); m.userData.ad=ad; scene.add(m); B.valizIc.push(m); });
  const gar=new THREE.Mesh(new THREE.BoxGeometry(.6,2.2,1.1),mat("#6f5238",{roughness:.6})); gar.position.set(-x0-.3,1.1,1.6); scene.add(gar); gar.userData.engel={kutu:[.3,.55]}; gar.userData.kameraEngel=true;
  const lamba=new THREE.PointLight(renk("#ffc890"),1.4,7,1.4); lamba.position.set(-x0-.5,1.3,-.6); scene.add(lamba);
  const tl=new THREE.PointLight(renk("#fff1de"),.5,8,1.3); tl.position.set(0,H-.3,0); scene.add(tl);
  B.kapiP=new THREE.Vector3(1.0,0,-z0-.25);
  const kapi=new THREE.Mesh(new THREE.PlaneGeometry(.92,2.05),mat("#5a4438",{roughness:.6})); kapi.position.set(1.0,1.03,-z0-.012); kapi.rotation.y=Math.PI; scene.add(kapi);
  B.odaSinir=p=>{ p.x=clamp(p.x,x0+.3,-x0-.3); p.z=clamp(p.z,z0+.35,-z0-.3); p.y=0; };
}
/* ---------- İzmit sokağı: tramvay hattı ve durağı, otelin girişi ---------- */
function izmitSokak(B){
  const asf=new THREE.Mesh(new THREE.PlaneGeometry(200,60),mat("#3c3e42",{roughness:.9,bumpMap:gurultuDoku(60),bumpScale:.01})); asf.rotation.x=-Math.PI/2; asf.receiveShadow=true; scene.add(asf);
  const kal=new THREE.Mesh(new THREE.BoxGeometry(200,.16,7),mat("#b9b2a6",{roughness:.9,bumpMap:gurultuDoku(50),bumpScale:.006})); kal.position.set(0,.08,-7); kal.receiveShadow=true; scene.add(kal);
  const kal2=new THREE.Mesh(new THREE.BoxGeometry(200,.16,5),mat("#b9b2a6",{roughness:.9})); kal2.position.set(0,.08,10); scene.add(kal2);
  for(const z of [2.2,3.6]){ const r=new THREE.Mesh(new THREE.BoxGeometry(200,.03,.08),mat("#9aa0a8",{metalness:.8,roughness:.3})); r.position.set(0,.015,z); scene.add(r); }
  // tramvay durağı
  const dur=new THREE.Group(); dur.position.set(-18,.16,-4.4); scene.add(dur);
  const ca=new THREE.Mesh(new THREE.BoxGeometry(6,.08,1.8),mat("#4a6a5a",{metalness:.4,roughness:.4})); ca.position.y=2.6; dur.add(ca);
  for(const x of [-2.8,2.8]){ const d=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.6,8),mat("#4a6a5a",{metalness:.5})); d.position.set(x,1.3,-.6); dur.add(d); }
  const lv=new THREE.Mesh(new THREE.PlaneGeometry(2.2,.4),new THREE.MeshBasicMaterial({map:yaziDoku("TRAMVAY · OTOGAR",{w:512,h:96,zemin:"#1d5a3a",renk:"#fff",font:"700 44px Arial"})})); lv.position.set(0,2.95,.0); dur.add(lv);
  // tramvay: uzun beyaz-yeşil gövde, camlar
  const tr=new THREE.Group(); tr.position.set(-18,0,2.9); scene.add(tr); B.tramvay=tr;
  const tm=mat("#f2f2ee",{roughness:.4,metalness:.2}); const g=new THREE.Mesh(new THREE.BoxGeometry(22,2.6,2.5),tm); g.position.y=1.65; tr.add(g);
  const sr=new THREE.Mesh(new THREE.BoxGeometry(22.05,.35,2.55),mat("#2a8a5a")); sr.position.y=.6; tr.add(sr);
  const cm=new THREE.Mesh(new THREE.BoxGeometry(21.6,1.0,2.56),mat("#1a2430",{metalness:.7,roughness:.15})); cm.position.y=2.1; tr.add(cm);
  // otel cephesi ve girişi
  const ot=new THREE.Group(); ot.position.set(14,0,-11); scene.add(ot); B.otelGiris=new THREE.Vector3(14,.16,-8.2);
  const cep=new THREE.Mesh(new THREE.BoxGeometry(22,24,1),new THREE.MeshStandardMaterial({map:(()=>{ const t=pencereDoku("#d9cfc0"); t.repeat.set(7,7); return t; })(),roughness:.8})); cep.position.y=12; ot.add(cep);
  const kanopi=new THREE.Mesh(new THREE.BoxGeometry(5,.2,3),mat("#2a2a2e",{metalness:.5})); kanopi.position.set(0,3.2,1.8); ot.add(kanopi);
  const ad=new THREE.Mesh(new THREE.PlaneGeometry(4,.7),new THREE.MeshBasicMaterial({map:yaziDoku("OTEL",{w:512,h:96,zemin:"#2a2a2e",renk:"#f6d9a0",font:"700 64px Georgia"})})); ad.position.set(0,3.6,3.31); ot.add(ad);
  const kapi=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.8),new THREE.MeshStandardMaterial({color:renk("#c9d6e2"),metalness:.6,roughness:.1,emissive:renk("#ffd9a0"),emissiveIntensity:.25})); kapi.position.set(0,1.4,.52); ot.add(kapi);
  // diğer binalar
  const renkler=["#e6ddd0","#d8c9b4","#cfc2ae","#e9e0cf"]; for(let i=0;i<8;i++){ const b=bina(rnd(9,13),rnd(14,22),9,renkler[i%4],i%3===0?["KAFE","ECZANE","FIRIN"][i%3]:null); b.position.set(-60+i*14,0,-14.5); scene.add(b); if(Math.abs(-60+i*14-14)<14) b.visible=false; }
  for(let i=0;i<8;i++){ const b=bina(rnd(9,13),rnd(12,18),9,renkler[(i+1)%4],null); b.position.set(-60+i*15,0,17); b.rotation.y=Math.PI; scene.add(b); }
  for(let i=0;i<10;i++){ const a=ciplakAgac(rnd(.8,1.1)); a.position.set(-50+i*10,.16,-4.2); scene.add(a); }
  B.sokakSinir=p=>{ p.x=clamp(p.x,-30,30); p.z=clamp(p.z,-9.6,-4.0); p.y=.16; };
}

/* ================= BÖLÜM NESNESİ ================= */
const BT={
  id:"bekleyemedim", no:13, ad:"Bekleyemedim", tarih:"26 Ocak 2026", alt:"Gece yarısı otobüsü, paytak paytak, erken doğum günü",
  async kur(){ await this.odaKur(); },
  async odaKur(){
    this.faz="oda"; this.t=0; ETK=[]; this.tw=[]; this.serbest=false;
    const gy=new THREE.Vector3(-.3,.3,-1).normalize();
    sahneKur({sis:"#141a2c",sisYakin:30,sisUzak:120,ust:"#070b20",ufuk:"#2a3058",alt:"#0a0e18",gunesYon:gy,isikYon:gy,gunesRenk:"#9fb4ff",isik:"#9fb0ff",isikGuc:.12,zemin:"#3a3238",hemi:.35,dolgu:.12,yildiz:.6,parlak:.2});
    kaanOdasi(this);
    this.kaan=karakter("kaan","gunluk"); this.oyuncu=this.kaan; this.kaan.position.set(.2,0,.6); this.kaan.rotation.y=Math.PI*.8; scene.add(this.kaan);
    KONUSANLAR={kaan:this.kaan}; this.tel=telefonYap(); this.tel.userData.telefon=true; this.tel.visible=false; scene.add(this.tel);
    Kamera.sinema=null; Kamera.aci=.3; Kamera.mesafe=3.0; Kamera.yukseklik=1.6; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(1.4,2.2,3.2);
    Ses.ton="gece";
  },
  tween(sure,f){ return new Promise(r=>this.tw.push({t:0,sure,f,r})); },
  qte(y){ return BK.qte.call(this,y); },
  tvCiz(d,t){ return BI.tvCiz.call(this,d,t); },
  async basla(){
    katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle();
    const K=this.kaan;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(1.2,1.9,2.1),bas(K));
      baslikKarti(this.ad,[this.tarih,"Bölüm "+this.no]); await bekle(3400);
      await anlat("25 Ocak 2026, pazar gecesi. Ankara'da odama yeni dönmüştüm.",2600);
      await anlat("Plan belliydi: sabah dokuzda yola çıkıp öğlen İzmit'te olacaktım.",2800);
      K.userData.telefon=2; this.tel.visible=true; eldeTut(K,this.tel,"S");
      await kameraNoktasi(ondenNokta(K,1.2,.3,.06),bas(K).add(new THREE.Vector3(0,-.12,0)),1.2);
      const dm=DM.ac("Kardelen 💕","çevrimiçi"); dm.zaman("Pazar gecesi");
      await dm.yaz("ben","Valizimi topluyorum. Sabah yola çıkarım, öğlene oradayım");
      await dm.yaz("o","Öğleni mi bekleyeceğim yani"); await dm.yaz("o","Bugün de doğru düzgün konuşamadık");
      await dm.yaz("ben","Desen şimdi yola çıkarım"); await dm.yaz("ben","Bir kelimene bakar");
      await dm.yaz("o","Yorgunsun, kendini yorma"); await dm.yaz("o","Sabah gelirsin");
      await bekle(500); DM.kapat(); K.userData.telefon=0; K.userData.eldeki=null; this.tel.visible=false;
    });
    gorev("Valizi hazırla · 0 / 6");
    this.serbest=true; gizliKalpler(this,[[-1.55,1.0,1.9,0]]);
    let n=0; await new Promise(r=>{ this.valizIc.forEach(m=>{ const e=etkilesim(m,{gomlek:"Gömleği koy",kazak:"Kazağı koy",sarj:"Şarj aletini koy",firca:"Diş fırçasını koy",parfum:"Parfümü koy",hediye:"Hediyeyi koy 🎁"}[m.userData.ad],async()=>{ etkilesimKaldir(e); n++;
        const p0=m.position.clone(), p1=this.valiz.position.clone().add(new THREE.Vector3(rnd(-.15,.15),.22+n*.012,rnd(-.1,.1)));
        await this.tween(.6,t=>{ m.position.lerpVectors(p0,p1,t); m.position.y+=Math.sin(t*Math.PI)*.25; }); Ses.efekt("vuru",.25); gorev(`Valizi hazırla · ${n} / 6`); if(n>=6) r(); },{mesafe:1.35,isaretY:.35}); }); });
    this.serbest=false; gorev(null);
    await sahne(async()=>{
      await kameraNoktasi(ondenNokta(K,1.6,.4,.1),bas(K),1.0);
      await anlat("Saat on biri geçiyordu. Valiz hazırdı ama sabaha daha dokuz saat vardı.",3000);
      await konus("kaan","Dokuz saat… Hiç bekleyemem ben.",{gul:.3});
      const c=await sec(["Sabahı beklerim, söz verdim.","Şimdi yola çıkıyorum!"]);
      if(c===0){ await konus("kaan","Sabahı beklerim, söz…",{gul:.2}); await bekle(500); await konus("kaan","Yok. Bekleyemedim.",{gul:.8}); }
      else await konus("kaan","Şimdi yola çıkıyorum!",{gul:.9});
      await this.tween(.6,t=>{ this.valizKapak.rotation.x=-1.9+t*1.9; }); Ses.efekt("vuru",.5); this.valizIc.forEach(m=>m.visible=false);
      K.userData.telefon=2; this.tel.visible=true; eldeTut(K,this.tel,"S");
      const dm=DM.ac("Kardelen 💕","çevrimiçi"); dm.zaman("Gece yarısına doğru");
      await dm.yaz("ben","Ben otogara gidiyorum"); await dm.yaz("o","Ne? kdkdkd"); await dm.yaz("ben","Sabahı bekleyemedim, yanına geliyorum");
      await dm.yaz("o","Sen delisin"); await dm.yaz("o","Hiç yorulmuyor musun"); await dm.yaz("ben","Otobüste uyurum, merak etme minnakım");
      await dm.yaz("o","Sana bir şey olmasın 🥹");
      await bekle(500); DM.kapat(); K.userData.telefon=0; K.userData.eldeki=null; this.tel.visible=false;
    });
    gorev("Valizi al, kapıdan çık");
    this.serbest=true; const kN=new THREE.Object3D(); kN.position.copy(this.kapiP); scene.add(kN);
    await etkBekle(kN,"Kapıdan çık",{mesafe:1.3,isaretY:1.2});
    this.serbest=false; gorev(null);
    await gecis(async()=>{ katmanTemizle(); await this.astiBolumKur(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await this.asti();
    await gecis(async()=>{ katmanTemizle(); await this.otobusKur(); katmanTemizle(); ustDugmeler(); this.btn=aksiyonEkle(); });
    await this.yolculuk();
    await gecis(async()=>{ katmanTemizle(); await this.sokakKur(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await this.paytak();
    await gecis(async()=>{ katmanTemizle(); await this.otelKur(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await this.dogumGunu();
  },
  async astiBolumKur(){ this.tw=[]; this.t=this.t||0; await BA.astiKur.call(this,true); this.astiHazirla(); },
  astiHazirla(){ this.faz="asti"; this.kareler=this.kareler||[];
    // Kastamonu otobüsü yerine İzmit otobüsü, peron 140
    scene.remove(this.otobus); this.otobus=otobusYap("#c8262a","ANKARA – İZMİT"); this.otobus.rotation.y=Math.PI; this.izmitPeron=133; this.otobus.position.set(this.peron[133],0,8.4); scene.add(this.otobus);
    this.kaan.position.set(-20,.18,-5.2); this.kaan.rotation.y=Math.PI/2; this.oyuncu=this.kaan;
    Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(NaN,NaN,NaN); // takip kamerası Ankara'daki başlangıç noktasından (40 m öteden) süzülerek gelmesin
    this.valizK=valizYap("#1f2a3a"); scene.add(this.valizK);
    // bilet gişesi
    const g=new THREE.Group(); g.position.set(-8,.18,-6.4); scene.add(g); this.gise=g; g.userData.engel={kutu:[1.1,.35]};
    const t=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.1,.6),mat("#2a3a5a",{roughness:.5})); t.position.y=.55; g.add(t);
    const lv=new THREE.Mesh(new THREE.PlaneGeometry(2.0,.36),new THREE.MeshBasicMaterial({map:yaziDoku("BİLET · İZMİT",{w:512,h:92,zemin:"#c8262a",renk:"#fff",font:"700 52px Arial"})})); lv.position.set(0,1.5,.31); g.add(lv); },
  async asti(){
    const K=this.kaan;
    await sahne(async()=>{ kameraNoktasi(new THREE.Vector3(-30,4.5,4),bas(K)); await anlat("23:49. AŞTİ. Gece yarısı otobüsüne yer var mı bilmiyordum.",2800); });
    gorev("Bilet gişesine git");
    this.serbest=true; gizliKalpler(this,[[-40,1.1,-6.2,1]]);
    await etkBekle(this.gise,"İzmit'e bir bilet",{mesafe:1.8,isaretY:1.6});
    this.serbest=false; gorev(null);
    const koltuk=await this.koltukSec();
    await sahne(async()=>{ await konus("kaan",`00:30 otobüsü, ${koltuk} numara. Bulurum dedim, buldum.`,{gul:.8});
      K.userData.telefon=2; this.tel.visible=true; eldeTut(K,this.tel,"S");
      const dm=DM.ac("Kardelen 💕","çevrimiçi"); dm.zaman("23:49");
      await dm.yaz("ben","Otogardayım"); await dm.yaz("o","Bu saatte bilet mi buldun"); await dm.yaz("ben","Buldum 😄 Yarım saate kalkıyor");
      await bekle(400); DM.kapat(); K.userData.telefon=0; K.userData.eldeki=null; this.tel.visible=false; });
    await sahne(async()=>{ await konus("kaan","Peron 133. Yine 133. Bu peron bizi seviyor 😄",{gul:.8}); });
    gorev("133 numaralı perona yürü");
    this.serbest=true;
    const pn=new THREE.Object3D(); pn.position.set(this.peron[133]+1.9,.18,-.6); scene.add(pn);
    await etkBekle(pn,"Otobüse bin",{mesafe:2.2,isaretY:1.4});
    this.serbest=false; gorev(null);
  },
  koltukSec(){ return new Promise(r=>{ const d=el(`<div class="koltuk-sec"><b>00:30 · Ankara → İzmit</b><small>Boş koltuklardan birini seç</small><div class="ks-izgara"></div></div>`); katman.appendChild(d);
    const g=d.querySelector(".ks-izgara"); const dolu=new Set([1,2,4,5,7,8,9,12,13,16,17,19,20,22,25,28,29,31,34,35,37]);
    for(let i=1;i<=39;i++){ const b=el(`<button class="ks ${dolu.has(i)?"dolu":""}" ${dolu.has(i)?"disabled":""}>${i}</button>`); b.onclick=()=>{ Ses.efekt("parilti",.4); d.remove(); r(i); }; g.appendChild(b); } }); },
  async otobusKur(){
    this.faz="otobus"; this.t=0; ETK=[]; this.tw=[]; this.serbest=false;
    const gy=new THREE.Vector3(.4,.3,-.8).normalize();
    sahneKur({sis:"#0b0e18",sisYakin:30,sisUzak:120,ust:"#05070f",ufuk:"#121624",alt:"#2a2c30",gunesYon:gy,isikYon:gy,gunesRenk:"#fff0dc",isik:"#9fb0ff",isikGuc:.15,zemin:"#3a3f4a",hemi:.3,dolgu:.1});
    otobusIciKur(this,true);
    this.kaan=karakter("kaan","gunluk"); const K=this.kaan; K.position.set(.93,0,-1.4); K.rotation.y=Math.PI; K.userData.otur=1; K.userData.oturY=.47; scene.add(K);
    this.oyuncu=K; KONUSANLAR={kaan:K}; this.tel=telefonYap(); this.tel.userData.telefon=true; this.tel.visible=false; scene.add(this.tel);
    this.otobusKam=dt=>{ camera.position.set(.45+Math.sin(this.t*9)*.004,1.28+Math.sin(this.t*13)*.003,-2.35); camera.lookAt(.93,1.05,-1.35); }; Kamera.sinema=this.otobusKam;
    Ses.ton="gece";
  },
  async yolculuk(){
    const K=this.kaan;
    await sahne(async()=>{
      await anlat("00:47. Otobüs yola çıktı. Bilirsin, ben otobüste hemen uyurum.",3000);
      K.userData.telefon=2; this.tel.visible=true; eldeTut(K,this.tel,"S");
      const dm=DM.ac("Kardelen 💕","çevrimiçi"); dm.zaman("Gece yarısını geçe");
      await dm.yaz("ben","Otobüs kalktı 😘"); await dm.yaz("o","Ben uyuyayım o zaman, sabah erken kalkacağım"); await dm.yaz("ben","Uyu sen. Dokuz gibi gelirsin, acele etme");
      await dm.yaz("o","Bir saatlik yolum var ama kdkdkd"); await dm.yaz("ben","Çıkınca haber ver"); await dm.yaz("o","Otobüste üstünü ört"); await dm.yaz("o","Şapşik 🥹");
      await bekle(500); DM.kapat(); K.userData.telefon=0; K.userData.eldeki=null; this.tel.visible=false;
      K.userData.kafa.rotation.z=.25; await bekle(1200);
      const pr=el(`<div class="tam" style="background:#000;opacity:0;transition:opacity 1.2s"></div>`); katman.appendChild(pr); await bekle(50); pr.style.opacity=1; await bekle(1600);
      await anlat("04:55. Oteldeyim. Haberin olsun diye yazdım, o uyuyordu.",2600);
      await anlat("Ben de uyumadım. Uyuyabilir miydim? Onu bekliyordum.",2600);
      pr.remove();
    });
  },
  async sokakKur(){
    this.faz="sokak"; this.t=0; ETK=[]; this.tw=[]; this.serbest=false;
    const gy=new THREE.Vector3(.5,.45,-1).normalize();
    sahneKur({sis:"#cdd5de",sisYakin:40,sisUzak:200,ust:"#8fa8c4",ufuk:"#e6eaee",alt:"#9aa6ae",gunesYon:gy,isikYon:gy,gunesRenk:"#fff2df",isik:"#f2efe9",isikGuc:1.5,zemin:"#8d8983",hemi:.95,dolgu:.5});
    Ses.ortam("sehir",.9);
    izmitSokak(this);
    await kisHazirla();
    this.kar=karakter("kardelen","kis"); this.kaan=karakter("kaan","kis"); this.oyuncu=this.kar;
    this.kar.position.set(-18,.16,-4.6); this.kar.rotation.y=Math.PI/2; this.kaan.position.copy(this.otelGiris); this.kaan.rotation.y=-Math.PI/2; scene.add(this.kar,this.kaan);
    KONUSANLAR={kardelen:this.kar,kaan:this.kaan}; this.tel=telefonYap(); this.tel.userData.telefon=true; this.tel.visible=false; scene.add(this.tel);
    Kamera.sinema=null; Kamera.aci=-Math.PI/2+.4; Kamera.mesafe=5.5; Kamera.yukseklik=2.4; Kamera.hedef.copy(this.kar.position); Kamera.poz.set(-24,3,-1);
    Ses.ton="sicak";
  },
  async paytak(){
    const D=this.kar, K=this.kaan;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(-30,4,-1),this.tramvay.position.clone().add(new THREE.Vector3(0,1.5,0)));
      await this.tween(3,t=>{ this.tramvay.position.x=-40+t*22; });
      await anlat("26 Ocak, sabah 09:51. Tramvay durağı.",2400);
      D.userData.telefon=2; this.tel.visible=true; eldeTut(D,this.tel,"S");
      await kameraNoktasi(ondenNokta(D,1.3,.3,.06),bas(D),1.0);
      const dm=DM.ac("Kaan 💙","otelde"); dm.zaman("09:51");
      await dm.yaz("ben","Tramvaydan indim, geliyorum"); await dm.yaz("o","Kapıdayım 😘"); await dm.yaz("o","Paytak paytak gel");
      await dm.yaz("ben","Koşarak geliyorum kdkdkd");
      await bekle(400); DM.kapat(); D.userData.telefon=0; D.userData.eldeki=null; this.tel.visible=false;
      await this.tween(2.5,t=>{ this.tramvay.position.x=-18+t*40; });
    });
    // paytak paytak: sol-sağ sırayla
    gorev("Paytak paytak yürü: sol, sağ, sol…");
    const ui=el(`<div class="sim paytak-ui"><div class="baslik">Paytak paytak</div><div class="ipucu">Sırayla sol ve sağ adım</div><div class="satir"><button class="ayak sol">👣 Sol</button><button class="ayak sag">Sağ 👣</button></div></div>`); katman.appendChild(ui);
    const hedefX=this.otelGiris.x-1.2; let beklenen="sol", adim=0;
    // her doğru adım hedefi 2.4 m ileri atar; Kardelen oraya yürüyüş hızında (bacaklarıyla uyumlu) ve iki yana paytak paytak sallanarak gider.
    // önceden her dokunuş onu 0.45 sn'de 2.4 m kaydırıyordu (5 m/sn, ayaklar kayıyordu) ve hızlı dokununca iki kayma üst üste biniyordu
    let hedefXa=D.position.x, egim=0; D.rotation.y=Math.PI/2;
    const yuruyus={t:0,son:0,sure:1e9,r:()=>{},f:()=>{ if(!yuruyus.sure){ D.userData.hiz=0; D.userData.govde.rotation.z=0; return; } const dt=Math.min(.1,yuruyus.t-yuruyus.son); yuruyus.son=yuruyus.t; const fark=hedefXa-D.position.x;
      const v=Math.min(2.1,Math.max(0,fark)*2.6); D.position.x+=Math.min(Math.max(0,fark),v*dt); D.userData.hiz=v;
      D.userData.govde.rotation.z+=((v>.3?egim:0)-D.userData.govde.rotation.z)*Math.min(1,dt*9); } };
    this.tw.push(yuruyus);
    await new Promise(r=>{ const bas_=(yan)=>{ if(hedefXa>=hedefX-.2) return; if(yan!==beklenen){ ui.querySelector(".ipucu").textContent="Ters ayak! Paytak olmadı kdkdkd"; Ses.efekt("vuru",.15); return; }
        beklenen=yan==="sol"?"sag":"sol"; adim++; ui.querySelector(".ipucu").textContent=["Paytak","Paytak 🐧","Az kaldı","Bir adım daha"][adim%4];
        hedefXa=Math.min(hedefX,hedefXa+2.4); egim=yan==="sol"?.12:-.12; Ses.efekt("vuru",.08); };
      ui.querySelector(".sol").onclick=()=>bas_("sol"); ui.querySelector(".sag").onclick=()=>bas_("sag");
      const bitti=kosul(()=>hedefXa>=hedefX-.2&&D.position.x>=hedefXa-.05); bitti.then(r); });
    yuruyus.sure=0; D.userData.hiz=0; D.userData.govde.rotation.z=0;
    ui.remove(); gorev(null);
    await sahne(async()=>{ cevir(K,D.position); await yuruHedef(K,new THREE.Vector3(D.position.x+.9,.16,D.position.z),1.6); yuzYuze(K,D); K.userData.saril=D.userData.saril=1; Ses.efekt("kalp");
      await kameraNoktasi(K.position.clone().lerp(D.position,.5).add(new THREE.Vector3(.4,1.5,2.6)),K.position.clone().lerp(D.position,.5).add(new THREE.Vector3(0,1.3,0)),1.6);
      await bekle(1400); K.userData.saril=D.userData.saril=0;
      await konus("kaan","Paytak paytak geldin işte 😄",{gul:1}); await konus("kardelen",["Gece yarısı yola çıkan deli kim acaba","Uyudun mu hiç"],{gul:1});
      await konus("kaan","Nasıl uyuyayım, seni bekliyordum.",{gul:.7}); await konus("kardelen",["Odaya çıktın mı bari","Yoksa kapıda mı bekledin"],{gul:.8});
      await konus("kaan","Kapıda bekledim tabii. Hadi içeri, üşüdün.",{gul:.6}); });
  },
  async otelKur(){
    this.faz="otel"; this.t=0; ETK=[]; this.tw=[]; this.serbest=false; this.tvDurum=null;
    const gy=new THREE.Vector3(-.5,.35,-1).normalize();
    sahneKur({sis:"#141a2c",sisYakin:120,sisUzak:900,ust:"#070b20",ufuk:"#2a3058",alt:"#0a0e18",gunesYon:gy,isikYon:new THREE.Vector3(-.3,.6,-1),gunesRenk:"#fff0d8",isik:"#9fb0ff",isikGuc:.1,zemin:"#6a5a52",hemi:.28,dolgu:.1,yildiz:.8,parlak:.2});
    otelOdasi(this,{gece:true});
    this.kar=karakter("kardelen","gunluk"); this.kaan=karakter("kaan","gunluk"); this.oyuncu=this.kaan;
    this.kaan.position.set(.3,0,.9); this.kar.position.set(-.3,0,1.3); this.kaan.rotation.y=this.kar.rotation.y=Math.PI; scene.add(this.kaan,this.kar);
    KONUSANLAR={kardelen:this.kar,kaan:this.kaan}; this.tel=telefonYap(); this.tel.userData.telefon=true; this.tel.visible=false; scene.add(this.tel);
    // pasta (gizli: komodinin içinde/arkasında), pizza kutuları sonra
    this.pasta=new THREE.Group(); const pt=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.12,24),mat("#f6e6ef",{roughness:.7})); pt.position.y=.06; this.pasta.add(pt);
    const kr=new THREE.Mesh(new THREE.TorusGeometry(.15,.015,6,24),mat("#e7a3bd")); kr.rotation.x=Math.PI/2; kr.position.y=.12; this.pasta.add(kr);
    this.mumlar=[]; for(let i=0;i<5;i++){ const a=i/5*Math.PI*2; const m=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.06,6),mat(["#9fd0ff","#ffd28a","#c9a8ff","#a8e6c0","#ffb0c8"][i])); m.position.set(Math.cos(a)*.08,.15,Math.sin(a)*.08); this.pasta.add(m);
      const al=parilti("#ffcf7a",.07); al.position.set(Math.cos(a)*.08,.195,Math.sin(a)*.08); this.pasta.add(al); this.mumlar.push(al); }
    // mum ışığı: odanın ikinci lambası pastanın yanına taşınır (ışık sayısı değişmez, gölgelendiriciler yeniden derlenmez)
    { const L2=this.lamba2, p0=L2.position.clone(), c0=L2.color.clone(), d0=L2.distance; this.mumAcik=false;
      this.mumIsik=v=>{ if(v>0){ this.mumAcik=true; L2.color.set("#ffbe6a"); L2.distance=3; L2.intensity=v; } else { this.mumAcik=false; L2.position.copy(p0); L2.color.copy(c0); L2.distance=d0; } }; }
    this.pasta.position.set(2.05,.56,-1.3); this.pasta.visible=false; scene.add(this.pasta);
    Kamera.sinema=null; Kamera.aci=.25; Kamera.mesafe=3.4; Kamera.yukseklik=1.8; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(1.3,2.4,4);
    Ses.ton="gece";
  },
  async dogumGunu(){
    const K=this.kaan, D=this.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(-1.2,1.8,-1.6),new THREE.Vector3(.2,1.2,1.0));
      await anlat("Üç gün İzmit. Doğum günü şubattaydı ama ben erkenden kutlamak istedim.",3200);
      await anlat("O akşam ışıkları kapattım.",2200);
      this.lamba1.intensity=this.lamba2.intensity=.15; this.tavan.intensity=.02;
      await konus("kardelen",["Ne oluyor","Neden karanlık burası"],{gul:.4});
    });
    gorev("Pastayı getir");
    this.serbest=true; this.pasta.visible=true; this.mumIsik(.9); gizliKalpler(this,[[2.0,1.0,1.0,2]]);
    await etkBekle(this.pasta,"Pastayı al",{mesafe:1.4,isaretY:.4});
    this.serbest=false; gorev(null);
    await sahne(async()=>{ eldeTut(K,this.pasta,"S"); this.pasta.userData.dik=true; K.userData.kolS.rotation.set(-.95,0,-.15);
      await yuruHedef(K,D.position.clone().add(new THREE.Vector3(.5,0,-.6)),.8); yuzYuze(K,D); D.userData.gulumse=1;
      await konus("kaan","İyi ki doğdun minnakım. Erken ama içimden geldi.",{gul:.9});
      await konus("kardelen",["Ayyy","Pasta mı aldın","Ağlatacaksın beni 🥹"],{gul:1});
      await konus("kaan","Dilek tut, mumları üfle. Haberin olsun, dilek gizli kalacak.",{gul:.8}); });
    // mumları üfle: hızlı hızlı dokun (ikisi ve pasta yandan karede; oyuncu kamerası Kardelen'in arkasında kalıyordu)
    await sahne(async()=>{
      const m=K.position.clone().lerp(D.position,.5), yan=new THREE.Vector3().subVectors(D.position,K.position).setY(0).normalize(); yan.set(-yan.z,0,yan.x);
      const icerde=v=>Math.abs(v.x)<2.1&&Math.abs(v.z)<2.8; if(!icerde(m.clone().addScaledVector(yan,1.9))) yan.negate();
      kameraNoktasi(m.clone().addScaledVector(yan,1.9).add(new THREE.Vector3(0,1.45,0)),m.clone().add(new THREE.Vector3(0,1.1,0)));
      const ui=el(`<div class="sim"><div class="baslik">Dilek tut, üfle</div><div class="ipucu">Hızlı hızlı dokun</div><div class="olcek" style="align-self:center;width:100%"><div class="bar"><i style="width:0%"></i></div></div><div class="satir"><button class="ufle">🌬️ Üfle</button></div></div>`); katman.appendChild(ui);
      const bar=ui.querySelector(".bar i"); let v=0, sonen=0;
      await new Promise(r=>{ ui.querySelector(".ufle").onclick=()=>{ v=Math.min(1,v+.13); bar.style.width=(v*100)+"%"; Ses.efekt("vuru",.08); const s=Math.floor(v*5); while(sonen<s&&sonen<5){ this.mumlar[sonen].visible=false; sonen++; } if(v>=1){ bekle(500).then(r); } };
        const azal=setInterval(()=>{ if(v>=1||!ui.isConnected) return clearInterval(azal); v=Math.max(0,v-.02); bar.style.width=(v*100)+"%"; },200); });
      ui.remove(); this.mumIsik(0); Ses.efekt("buyuk"); });
    await sahne(async()=>{ this.lamba1.intensity=this.lamba2.intensity=1.4; this.tavan.intensity=.3; K.userData.kolS.rotation.set(0,0,0); K.userData.eldeki=null; this.pasta.position.set(2.0,.57,-.2);
      await konus("kardelen",["Dileğimi tuttum","Söylemem ama kdkdkd"],{gul:1});
      yuzYuze(K,D); K.userData.saril=D.userData.saril=1; await bekle(1500); K.userData.saril=D.userData.saril=0;
      await konus("kardelen",["Şimdi pizza","Doğum günü kızı pizza istiyor"],{gul:1}); });
    // pizza siparişi
    const sec_=await this.pizzaSiparis();
    await sahne(async()=>{
      await konus("kaan",`${sec_.pizza}, yanına da ${sec_.icecek.toLocaleLowerCase("tr")}. Doğum günü kızı ne derse o.`,{gul:.8});
      await konus("kardelen",sec_.icecek==="Kola"?["Kolasız pizza olmaz zaten","Bilirsin işte kocam"]:["Ayran mı kdkdkd","Olsun, sen bilirsin"],{gul:1});
      // zaman atlaması karartmayla: ikisi yatağa geçerken kamera önlerinde "ışınlanmalarını" göstermesin
      const kr=el(`<div class="tam" style="background:#000;opacity:0;transition:opacity .6s"></div>`); katman.appendChild(kr); await bekle(30); kr.style.opacity=1; await bekle(650);
      const kutu=new THREE.Mesh(new THREE.BoxGeometry(.4,.05,.4),new THREE.MeshStandardMaterial({map:kartonDoku(),roughness:.9})); kutu.position.set(-1.0,.6,-.6); scene.add(kutu);
      for(const [c,z] of [[K,-.25],[D,-1.05]]){ c.position.set(-1.45,0,z); c.rotation.y=Math.PI/2; c.userData.otur=1; c.userData.oturY=.62; c.userData.saril=0; c.userData.hiz=0; }
      this.tvDurum="film"; this.tvIsik.intensity=.8;
      kameraNoktasi(new THREE.Vector3(1.25,1.58,-.65),new THREE.Vector3(-1.3,.95,-.65));
      Ses.efekt("zil",.6); await anlat("Yarım saat sonra kapı çaldı.",2000);
      kr.style.opacity=0; setTimeout(()=>kr.remove(),700);
      await kameraNoktasi(new THREE.Vector3(.9,1.5,-.65),new THREE.Vector3(-1.3,.95,-.65),1.6);
      await anlat("Yatağın üstünde pizza, televizyonda bir film. Kimse bir yere gitmedi.",3000);
      await konus("kardelen",["Pizza ve film","En sevdiğim plan kdkdkd"],{gul:1,kamera:false});
      await konus("kaan","Bence de. Her seferinde yapalım.",{gul:.8,kamera:false});
      await konus("kardelen",["Filmde uyuyoruz ya","Bu sefer uyumam kdkdkd"],{gul:1,kamera:false});
      await hatiraFoto("İzmit · Erken doğum günü · Ocak 2026"); await bekle(1500);
      await anlat("Filmin yarısını yine göremedik.",2400);
      await anlat("Bekleyemediğim o gece, en güzel üç günü getirdi.",3000);
    });
    bolumBitti(this.no);
  },
  pizzaSiparis(){ return new Promise(r=>{ const d=el(`<div class="cicekci"><div class="cc-ust"><b>Pizza siparişi</b><small>Otele teslim · 30 dk</small></div><div class="cc-govde"><p class="cc-ipucu">Hangi pizza?</p><div class="cc-notlar"></div></div></div>`); katman.appendChild(d);
    const g=d.querySelector(".cc-notlar"), ip=d.querySelector(".cc-ipucu"); const sonuc={};
    const adim=(liste,soru,anahtar,sonra)=>{ ip.textContent=soru; g.innerHTML=""; liste.forEach(t=>{ const b=el(`<button class="cc-not">${t}</button>`); b.onclick=()=>{ Ses.efekt("vuru",.4); sonuc[anahtar]=t.replace(/ .*$/u,"").replace(/[🍕🥤]/gu,"").trim()||t; sonuc[anahtar]=t.split(" ·")[0]; sonra(); }; g.appendChild(b); }); };
    adim(["Karışık · bol malzemeli","Margarita · sade","Sucuklu · acılı"],"Hangi pizza?","pizza",()=>adim(["Kola","Ayran"],"Yanına içecek?","icecek",()=>{ d.remove(); r(sonuc); })); }); },
  guncelle(dt){
    this.t+=dt; this.tw=this.tw.filter(a=>{ a.t+=dt; const k=Math.min(1,a.t/a.sure); a.f(k); if(k>=1){ a.r(); return false; } return true; });
    if(this.faz==="asti"){ BA.guncelle.call(this,dt); if(this.valizK&&this.kaan){ const K=this.kaan; this.valizK.position.set(K.position.x-Math.sin(K.rotation.y+1.2)*.45,.18,K.position.z-Math.cos(K.rotation.y+1.2)*.45); this.valizK.rotation.y=K.rotation.y; } return; }
    if(this.faz==="otobus"){ if(!Kamera.sinema) Kamera.sinema=this.otobusKam; this._oc=(this._oc||0)+dt; if(this._oc>.05&&this.otobusCiz){ this._oc=0; this.otobusCiz(this.t); } return; }
    if(this.faz==="oda"&&this.manzara){ this._mz=(this._mz||0)+dt; if(this._mz>.06){ this._mz=0; this.manzara.ciz(this.t); } }
    if(this.faz==="otel"&&this.mumAcik&&this.pasta){ this.pasta.getWorldPosition(this.lamba2.position); this.lamba2.position.y+=.3; }
    if(this.faz==="otel"){ if(this.tvDurum==="film"){ this._tv=(this._tv||0)+dt; if(this._tv>.08){ this._tv=0; BI.tvCiz.call(this,"film",this.t); } } for(const m of this.mumlar||[]) if(m.visible) m.scale.setScalar(.06+Math.sin(this.t*20+m.position.x*40)*.012); }
    const P=this.oyuncu; if(!P) return;
    const sinir=this.faz==="oda"?this.odaSinir:this.faz==="sokak"?this.sokakSinir:this.faz==="otel"?this.odaSinir:null;
    if(this.serbest&&!kilit&&sinir) yuru(P,dt,sinir,this.faz==="sokak"?2.0:1.6);
    etkilesimGuncelle(P,this.btn);
    if(!Kamera.sinema) Kamera.hedef.lerp(P.position,.12);
  },
  temizle(){ DM.kapat&&DM.kapat(); this.kosu=null; }
};
