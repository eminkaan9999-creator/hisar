/* ================= BÖLÜM 2: MASAL ŞATOSU (Bahar 2025, Eskişehir) ================= */
function satoYap(pencereM){
  const sato=new THREE.Group();
  const duvar=mat("#f1e7d6",{roughness:.85}), cati=mat("#3a66c9",{roughness:.4,metalness:.15}), altinM=mat("#ffcf6a",{metalness:.9,roughness:.3}), tas=mat("#d8cbb4",{roughness:.9});
  const govde=new THREE.Mesh(new THREE.BoxGeometry(16,9,8),duvar); govde.position.y=4.5; govde.castShadow=true; govde.receiveShadow=true; sato.add(govde);
  for(let i=0;i<16;i++){ const d=new THREE.Mesh(new THREE.BoxGeometry(.6,.7,.6),duvar); d.position.set(-7.7+i*1.03,9.35,4); d.castShadow=true; sato.add(d); }
  const kule=(x,z_,r,h,y0=0)=>{ const k=new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.05,h,22),duvar); k.position.set(x,y0+h/2,z_); k.castShadow=true; sato.add(k);
    const c=new THREE.Mesh(new THREE.ConeGeometry(r*1.25,h*.7,22),cati); c.position.set(x,y0+h+h*.35,z_); c.castShadow=true; sato.add(c);
    const u=new THREE.Mesh(new THREE.SphereGeometry(r*.18,8,8),altinM); u.position.set(x,y0+h+h*.72,z_); sato.add(u);
    const bant=new THREE.Mesh(new THREE.CylinderGeometry(r*1.07,r*1.07,.3,22),tas); bant.position.set(x,y0+h*.4,z_); sato.add(bant);
    for(let i=0;i<3;i++){ const p=new THREE.Mesh(new THREE.PlaneGeometry(r*.32,r*.55),pencereM); const a=(i-1)*.55; p.position.set(x+Math.sin(a)*r*1.02, y0+h*.62, z_+Math.cos(a)*r*1.02); p.rotation.y=a; sato.add(p); } };
  kule(-8.5,3.5,2,12); kule(8.5,3.5,2,12); kule(-5,-2,1.6,15); kule(5,-2,1.6,15); kule(0,-1,2.6,19); kule(-3,4.2,1,10,0); kule(3,4.2,1,10,0);
  for(let i=0;i<7;i++){ const p=new THREE.Mesh(new THREE.PlaneGeometry(1,1.8),pencereM); p.position.set(-6+i*2,5.5,4.02); sato.add(p); }
  const kapi=new THREE.Mesh(new THREE.PlaneGeometry(2.4,3.6),mat("#5a3a24",{roughness:.7})); kapi.position.set(0,1.8,4.03); sato.add(kapi);
  const kemer=new THREE.Mesh(new THREE.TorusGeometry(1.25,.18,8,20,Math.PI),tas); kemer.position.set(0,3.6,4.05); sato.add(kemer);
  return sato;
}
const B2={
  id:"eskisehir", no:4, ad:"Masal Şatosu", tarih:"Mart 2025", alt:"Eskişehir, buz gibi bir gün",
  kopruY(t){ return .06+.42*Math.sin(Math.PI*clamp(t,0,1)); },
  kopruUstu(x,z){ return x<-7.6&&x>-15.7&&Math.abs(z-6)<.98; },
  adada(x,z){ return Math.hypot(x+18.2,z-6)<2.55; },
  zemY(x,z){ if(this.kopruUstu(x,z)) return this.kopruY((-7.6-x)/8); if(this.adada(x,z)) return .125; return 0; },
  // köprüdeyken başka yere giderken önce köprünün kıyı ucuna in (göletin içinden yürümesin)
  async yuruYol(c,hedef,hiz){ const yer=(x,z)=>this.zemY(x,z); const giris=new THREE.Vector3(-6.9,0,6);
    const suda=(a,b)=>{ for(let k=1;k<10;k++){ const p=a.clone().lerp(b,k/10); if(Math.hypot(p.x+19,p.z-4)<11.5&&!this.kopruUstu(p.x,p.z)&&!this.adada(p.x,p.z)) return true; } return false; };
    if(suda(c.position,hedef)){ if(this.kopruUstu(c.position.x,c.position.z)||this.adada(c.position.x,c.position.z)){ await yuruHedef(c,new THREE.Vector3(-7.2,0,6),hiz,{yer}); }
      else { await yuruHedef(c,giris,hiz,{yer}); } }
    await yuruHedef(c,hedef,hiz,{yer}); },
  async kur(){
    const gy=new THREE.Vector3(-.6,.35,-.55).normalize();
    sahneKur({sis:"#f3dccb",sisYakin:50,sisUzak:260,ust:"#6f9be0",ufuk:"#ffe1c6",alt:"#c9b8a8",gunesYon:gy,isikYon:gy,gunesRenk:"#ffe2b8",isik:"#ffe4c2",isikGuc:2.4,zemin:"#6f7a4a",hemi:.8,dolgu:.8});
    Ses.ortam("kus",.5);
    this.t=0; DALGA=[]; ETK=[];
    scene.add(cimZemin(260,260,"#6c7c46","#8d9358",70)); // mart: soluk, yer yer sararmış çimen
    // yollar
    const yolM=mat("#d8c7a8",{roughness:.95,bumpMap:gurultuDoku(30),bumpScale:.02});
    const yol=(x,z,w,l,r=0)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,l),yolM); m.rotation.x=-Math.PI/2; m.rotation.z=r; m.position.set(x,.015,z); m.receiveShadow=true; scene.add(m); };
    yol(0,4,4,40); yol(0,-20,16,10); yol(-9,6,14,3.2,Math.PI/2);
    // gölet
    if(THREE.Water){ const sn=new THREE.TextureLoader().load(SU_NORMAL); sn.wrapS=sn.wrapT=THREE.RepeatWrapping;
      this.su=new THREE.Water(new THREE.CircleGeometry(11,48).rotateX(-Math.PI/2),{textureWidth:512,textureHeight:512,waterNormals:sn,sunDirection:gy.clone(),sunColor:0xffe2b8,waterColor:0x1f4a4a,distortionScale:1.2,fog:true}); this.su.position.set(-19,.06,4); scene.add(this.su); }
    const kiyi=new THREE.Mesh(new THREE.RingGeometry(10.8,11.6,48).rotateX(-Math.PI/2),mat("#bfae90",{roughness:.95})); kiyi.position.set(-19,.04,4); scene.add(kiyi);
    // kemerli tahta köprü: kıyıdan göletin içindeki küçük adaya (kıyıda başlar, adada biter; içinden su geçmez)
    const kopru=new THREE.Group(); scene.add(kopru);
    const tah=mat("#8f6440",{roughness:.88,bumpMap:gurultuDoku(8),bumpScale:.015}), tahK=mat("#6e4a2e",{roughness:.85});
    const KX0=-7.6, KX1=-15.6, KN=26;
    for(let i=0;i<KN;i++){ const t=(i+.5)/KN, x=KX0+(KX1-KX0)*t, y=this.kopruY(t); const e=Math.cos(Math.PI*t)*Math.PI*.45/8*(1);
      const pl=new THREE.Mesh(new THREE.BoxGeometry(8/KN+.01,.06,2.1),tah); pl.position.set(x,y-.03,6); pl.rotation.z=-Math.atan(.45*Math.PI*Math.cos(Math.PI*t)/8); pl.castShadow=true; pl.receiveShadow=true; kopru.add(pl); }
    for(const zz of [-1.02,1.02]){ const pts=[]; for(let i=0;i<=16;i++){ const t=i/16; pts.push(new THREE.Vector3(KX0+(KX1-KX0)*t,this.kopruY(t)+.95,6+zz)); }
      kopru.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,.035,6,false),tahK));
      for(let i=0;i<=8;i++){ const t=i/8, x=KX0+(KX1-KX0)*t, y=this.kopruY(t); const d=new THREE.Mesh(new THREE.BoxGeometry(.08,.95,.08),tahK); d.position.set(x,y+.45,6+zz); d.castShadow=true; kopru.add(d); } }
    for(const t of [.3,.7]) for(const zz of [-.95,.95]){ const x=KX0+(KX1-KX0)*t; const k=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,1.4,8),tahK); k.position.set(x,this.kopruY(t)-.7,6+zz); kopru.add(k); }
    // ada
    const ada=new THREE.Group(); ada.position.set(-18.2,0,6); scene.add(ada);
    const adaT=new THREE.Mesh(new THREE.CylinderGeometry(2.7,2.95,.5,40),mat("#c2ad8a",{roughness:.95})); adaT.position.y=-.13; adaT.receiveShadow=true; ada.add(adaT);
    const adaC=cimZemin(5.2,5.2,"#5f8a3c","#79a24a",4); adaC.geometry=new THREE.CircleGeometry(2.55,40); adaC.rotation.x=-Math.PI/2; adaC.position.y=.125; ada.add(adaC);
    const adaAgac=ciplakAgac(1.1); adaAgac.position.set(-.6,.12,-.4); ada.add(adaAgac);
    const fen=lamba2? lamba2() : null; if(fen){ fen.position.set(1.2,.12,1.3); fen.scale.setScalar(.75); ada.add(fen); }
    // korsan gemisi (gölde)
    const gemi=new THREE.Group(); gemi.position.set(-25,0,0); gemi.rotation.y=.6; scene.add(gemi);
    const gv=new THREE.Mesh(new THREE.BoxGeometry(6,1.4,2),mat("#5a3a24",{roughness:.8})); gv.position.y=.7; gemi.add(gv);
    const ds=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,6,8),tah); ds.position.y=4; gemi.add(ds);
    const yel=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.8),mat("#f2ead8",{side:THREE.DoubleSide,roughness:.9})); yel.position.set(0,4.2,0); yel.rotation.y=Math.PI/2; gemi.add(yel);
    // şato
    this.pencereM=new THREE.MeshStandardMaterial({color:renk("#4a5a8a"),emissive:renk("#ffcf7a"),emissiveIntensity:.05,roughness:.2,metalness:.3});
    const sato=satoYap(this.pencereM); sato.position.set(0,0,-30); scene.add(sato);
    // çiçekli ağaç yolu + düşen yapraklar
    for(let i=0;i<16;i++){ const s=i%2?1:-1; const a=ciplakAgac(rnd(.95,1.25)); a.rotation.y=rnd(0,6); a.position.set(s*rnd(3.6,5.5),0,14-i*2.4); scene.add(a); } // mart başı: ağaçlar henüz çıplak
    for(let i=0;i<30;i++){ const a=i%4? (i%3?ciplakAgac(rnd(1,1.4)):agac("cam",rnd(.8,1.1))) : agac("selvi",rnd(.9,1.3)); const ang=rnd(0,Math.PI*2), r=rnd(32,70); a.position.set(Math.cos(ang)*r,0,Math.sin(ang)*r-6); scene.add(a); }
    scene.add(otlar(()=>({x:rnd(-40,40),z:rnd(-40,30)}),1400,"#86915a",.26,p=>Math.hypot(p.x+19,p.z-4)<11.8||(Math.abs(p.x)<2.2&&p.z>-16&&p.z<24)||(p.x>-16&&p.x<-2&&Math.abs(p.z-6)<1.8)||(Math.abs(p.x)<8.5&&p.z<-15)));
    this.yaprak=tozlar(60,()=>({x:rnd(-8,8),y:rnd(0,7),z:rnd(-24,16)}),"#c9b48a",.09); scene.add(this.yaprak); // rüzgârda uçuşan birkaç kuru yaprak
    // banklar
    this.bank=new THREE.Group(); this.bank.position.set(-9.5,0,-4.5); this.bank.rotation.y=-Math.PI*.35; scene.add(this.bank);
    const bm=mat("#7a5232",{roughness:.8}), dm=mat("#2a2a2e",{metalness:.6,roughness:.4});
    for(let i=0;i<4;i++){ const t=new THREE.Mesh(new THREE.BoxGeometry(1.8,.05,.11),bm); t.position.set(0,.45,-.18+i*.12); t.castShadow=true; this.bank.add(t); }
    for(let i=0;i<3;i++){ const t=new THREE.Mesh(new THREE.BoxGeometry(1.8,.1,.04),bm); t.position.set(0,.65+i*.13,-.26); t.rotation.x=-.15; this.bank.add(t); }
    for(const x of [-.8,.8]){ const a=new THREE.Mesh(new THREE.BoxGeometry(.06,.45,.5),dm); a.position.set(x,.22,0); this.bank.add(a); }
    // fotoğraf noktaları
    this.noktalar=[
      {foto:new THREE.Vector3(1.2,0,7.5),poz:new THREE.Vector3(-1.4,0,3.4),pozlar:["bel","el"],baslik:"Masal Şatosu · Ağaç yolunda"},
      {foto:new THREE.Vector3(-6.6,0,10.1),poz:new THREE.Vector3(-11.6,.48,6),pozlar:["ac","el"],baslik:"Masal Şatosu · Köprüde"},
      {foto:new THREE.Vector3(0,0,-12),poz:new THREE.Vector3(0,0,-19.5),pozlar:["kalp","bel"],baslik:"Masal Şatosu · Şatonun önünde"} ];
    await kisHazirla(); await kiyafetDokulari(["kaan_oduncu_kiyafet.jpg","kaan_oduncu_govde.jpg"]);
    this.kaan=karakter("kaan","oduncu"); this.kar=karakter("kardelen","kis");
    this.gokF=null; this.kaan.position.set(.5,0,22); this.kar.position.set(-.5,0,22); /* Kardelen el ele yürüyüşteki tarafında başlar (serbest yürüyüş başında Kaan'ın çevresinden dolaşmasın) */ this.kaan.rotation.y=this.kar.rotation.y=Math.PI; scene.add(this.kaan,this.kar);
    KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    Kamera.sinema=null; Kamera.aci=0; Kamera.mesafe=7; Kamera.yukseklik=2.8; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(0,4,30);
    Ses.ton="sicak";
  },
  async basla(){
    katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle();
    const K=this.kaan, D=this.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(-34,6,14),new THREE.Vector3(0,6,-30));
      await kameraNoktasi(s=>new THREE.Vector3(-34+s*3,6+s*.3,14-s),new THREE.Vector3(0,6,-30),6);
      baslikKarti(this.ad,[this.tarih,"Bölüm "+this.no]);
      await kameraNoktasi(new THREE.Vector3(2,2,26),bas(D),3);
      await anlat("Mart 2025. Eskişehir. Takvim baharı gösteriyordu ama hava buz gibiydi.");
      await anlat("Bu buluşma için yeni bir gömlek almıştım. Oduncu gömleği. Aynı şeylerle yanına gitmek istemedim.",3400);
      yuzYuze(K,D);
      await konus("kardelen",["Bugün benim fotoğrafçımsın","Kaçış yok kocam 😄"],{gul:1});
      await konus("kaan","Kaç fotoğraf istiyorsun?",{gul:.4});
      await konus("kardelen",["Üç tane","Ama güzel olacak","Ağaçların altında, köprüde, şatonun önünde"],{gul:.9});
      const c=await sec(["Üç tane mi? Kolay.","Buraya fotoğraf çekinmeye mi geldik? 😄"]);
      if(c===0){ await konus("kaan","Üç tane mi? Kolay."); await konus("kardelen",["Görücez 😄","Beğenmezsem tekrar çekeceksin"],{gul:1}); }
      else { await konus("kaan","Buraya fotoğraf çekinmeye mi geldik? 😄"); await konus("kardelen",["Evet 😄","Şov yapma, çek","Live'dan gözü açık kareyi seçersin ama"],{gul:1}); }
      K.rotation.y=D.rotation.y=Math.PI;
    });
    this.serbest=true; this.elele=true; gizliKalpler(this,[[-17.4,1.05,6.8,0],[7.5,1.0,-21,1],[14,1.0,12,2]]);
    for(let i=0;i<3;i++){
      const N=this.noktalar[i];
      gorev(`${["Ağaç yolunda","Köprüde","Şatonun önünde"][i]} fotoğraf çek · ${i} / 3`);
      const isaret=new THREE.Object3D(); isaret.position.copy(N.foto); scene.add(isaret);
      await etkBekle(isaret,"Fotoğraf çek",{mesafe:1.6,isaretY:.3,isaretBoy:1.2});
      this.serbest=false; this.elele=false; K.userData.elele=D.userData.elele=0;
      await sahne(async()=>{
        await this.yuruYol(D,N.poz,1.6); cevir(D,K.position); await this.yuruYol(K,N.foto,1.2); cevir(K,D.position); D.userData.gulumse=1;
        if(i===2){ await konus("kardelen",["Şato da sığsın ama","Yarım çıkmasın"],{gul:.8}); }
        const deneme=await fotoModu(K,D,{pozlar:N.pozlar,baslik:N.baslik,bakY:i===2?1.6:1.1,fov:i===2?52:38});
        if(i===0) await konus("kardelen",deneme?["Sonunda 😍","Bu oldu işte"]:["İlk seferde mi","Yeteneğin varmış kocam 😄"],{gul:1});
        if(i===1) await konus("kardelen",["Gemi de çıkmış mı arkada 😍","Harika"],{gul:1});
        if(i===2){ await konus("kardelen",["İki dakikadır şatoyu çekiyorsun","Ben neredeyim kdkdkd"],{gul:.9});
          await konus("kaan","Ellerim dondu ama tamam, bir tane daha 😅",{gul:.3});
          await konus("kardelen",["Son, söz 😄"],{gul:1});
          await fotoModu(K,D,{pozlar:["kalp"],baslik:"Masal Şatosu · Son, söz",bakY:1.6,fov:52});
          await konus("kaan","Şato güzel ama önündeki daha güzel.",{gul:.6}); await konus("kardelen",["Kurtardın 😄","Puanın arttı kocam"],{gul:1}); }
        await this.yuruYol(D,K.position.clone().addScaledVector(new THREE.Vector3(Math.cos(K.rotation.y),0,-Math.sin(K.rotation.y)),.52),1.6); // el ele tutuşacağı tarafa (eleleTakip ile aynı yan)
      });
      this.serbest=true; this.elele=true;
    }
    gorev("Göl kenarındaki banka otur");
    await etkBekle(this.bank,"Banka otur",{mesafe:2.2,isaretY:1.2});
    this.serbest=false; this.elele=false;
    await sahne(async()=>{
      const bq=this.bank.rotation.y, yan=new THREE.Vector3(Math.cos(bq),0,-Math.sin(bq));
      K.position.copy(this.bank.position).addScaledVector(yan,-.4); D.position.copy(this.bank.position).addScaledVector(yan,.4);
      K.rotation.y=D.rotation.y=bq; K.userData.hiz=D.userData.hiz=0;
      K.userData.oturY=D.userData.oturY=.33; K.userData.otur=D.userData.otur=1; K.userData.elele=D.userData.elele=1;
      // gün batımına geç
      const gok=scene.userData.gok.material.uniforms; let s=0;
      const gokF=dt=>{ s+=dt; const k=Math.min(1,s/18); gok.ufuk.value.copy(renk("#ffe1c6").lerp(renk("#ff9f78"),k)); gok.ust.value.copy(renk("#6f9be0").lerp(renk("#4a5a9a"),k)); this.pencereM.emissiveIntensity=.05+k*1.4; };
      const ileri=new THREE.Vector3(Math.sin(bq),0,Math.cos(bq)); const m=this.bank.position.clone(); this.gokF=gokF;
      Kamera.sinema=dt=>{ camera.position.copy(m).addScaledVector(ileri,3.4+s*.05).add(new THREE.Vector3(0,1.3,0)).addScaledVector(yan,Math.sin(s*.1)*.6); camera.lookAt(m.x,1,m.z); };
      await bekle(3000);
      await anlat("Göl kenarına oturduk. Ellerimiz buz gibiydi.");
      D.userData.bakNokta=bas(K); K.userData.bakNokta=bas(D);
      await konus("kardelen",["Masal gibi burası","Ama çok soğuk 🥶"],{gul:.7});
      await konus("kaan","Ver ellerini ısıtayım minnakım. Masalda üşümek yasak, haberin olsun.",{gul:.6});
      await kameraNoktasi(m.clone().addScaledVector(ileri,1.8).add(new THREE.Vector3(0,1.05,0)),m.clone().add(new THREE.Vector3(0,.72,0)),.9); // ikisi ve elleri karede
      await basiliTut("🤲 Ellerini ısıt · basılı tut",1.6);
      await konus("kardelen",["Çok klişe kdkdkd","Ama ısındım valla"],{gul:1});
      D.userData.bakNokta=null; K.userData.bakNokta=null; D.userData.kafa.rotation.z=-.3; K.userData.kafa.rotation.z=.1;
      Kamera.sinema=dt=>{ camera.position.copy(m).addScaledVector(ileri,2.4).add(new THREE.Vector3(0,1.15,0)); camera.lookAt(m.x,.95,m.z); };
      await anlat("O günün en güzel fotoğrafı hiçbirine sığmadı.",3800);
    });
    bolumBitti(this.no);
  },
  guncelle(dt){
    this.t+=dt; const t=this.t; if(this.su) this.su.material.uniforms.time.value=t*.4; if(this.gokF) this.gokF(dt);
    const yp=this.yaprak.geometry.attributes.position; for(let i=0;i<yp.count;i++){ let y=yp.getY(i)-dt*(.3+(i%5)*.06); if(y<0) y=7; yp.setY(i,y); yp.setX(i,yp.getX(i)+Math.sin(t+i)*dt*.25); } yp.needsUpdate=true;
    const K=this.kaan, D=this.kar;
    const sinir=p=>{ { const ax=p.x+18.2, az=p.z-6, ar=Math.hypot(ax,az); if(!this.kopruUstu(p.x,p.z)&&ar>=2.55&&ar<4.5){ p.x=-18.2+ax/ar*2.5; p.z=6+az/ar*2.5; } }
      const dx=p.x+19, dz=p.z-4; const kopruUstu=this.kopruUstu(p.x,p.z)||this.adada(p.x,p.z);
      if(!kopruUstu&&Math.hypot(dx,dz)<11.4){ if(Math.abs(p.z-6)<1.3&&p.x<-7.4&&p.x>-16){ p.z=6+clamp(p.z-6,-.97,.97); } else { const L=Math.hypot(dx,dz); p.x=-19+dx/L*11.4; p.z=4+dz/L*11.4; } }
      p.x=clamp(p.x,-34,20); p.z=clamp(p.z,-22,26); p.y=this.zemY(p.x,p.z); };
    if(this.serbest&&!kilit){ yuru(K,dt,sinir,2.2); if(this.elele){ eleleTakip(K,D,dt); sinir(D.position); } }
    etkilesimGuncelle(K,this.btn);
    if(!Kamera.sinema) Kamera.hedef.lerp(K.position,.1);
  },
  temizle(){}
};
