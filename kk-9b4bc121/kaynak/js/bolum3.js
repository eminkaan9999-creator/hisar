/* ================= BÖLÜM 3: BALONLARI GÖRÜYOR MU? (Mayıs 2025, Kapadokya) ================= */
function balonYap(r,biz){
  const g=new THREE.Group();
  const c=document.createElement("canvas"); c.width=256; c.height=64; const x=c.getContext("2d");
  for(let i=0;i<8;i++){ x.fillStyle=i%2?r[0]:r[1]; x.fillRect(i*32,0,32,64); }
  const doku=new THREE.CanvasTexture(c); doku.encoding=THREE.sRGBEncoding;
  const zarf=new THREE.Mesh(new THREE.SphereGeometry(2.2,24,18),new THREE.MeshStandardMaterial({map:doku,roughness:.7})); zarf.scale.set(1,1.22,1); zarf.position.y=3.6; zarf.castShadow=!!biz; g.add(zarf);
  const ag=new THREE.Mesh(new THREE.CylinderGeometry(.7,1.4,1.2,24,1,true),new THREE.MeshStandardMaterial({map:doku,roughness:.7,side:THREE.DoubleSide})); ag.position.y=1.35; g.add(ag);
  const sepet=new THREE.Mesh(new THREE.BoxGeometry(biz?1.5:.9,biz?.75:.6,biz?1.1:.9),mat("#8a5a34",{roughness:.95})); sepet.position.y=biz?-.85:-.35; sepet.castShadow=!!biz; g.add(sepet);
  const ip=new THREE.LineBasicMaterial({color:0x3a2a1a});
  { const P=[]; for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]) P.push(new THREE.Vector3(a*(biz?.7:.42),biz?-.48:-.05,b*(biz?.5:.42)),new THREE.Vector3(a*.6,.8,b*.6));
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(P),ip)); } // dört ip tek çizimde (40 balonda 120 çizim çağrısı az)
  return g;
}
function bardakYap(){ const g=new THREE.Group(); const b=new THREE.Mesh(new THREE.CylinderGeometry(.028,.022,.08,10),new THREE.MeshStandardMaterial({color:renk("#b8401e"),transparent:true,opacity:.85,roughness:.1})); g.add(b);
  const t=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.006,12),mat("#f2efe8")); t.position.y=-.045; g.add(t); return g; }
const B3={
  id:"kapadokya", no:5, ad:"Balonları Görüyor mu?", tarih:"Mayıs 2025", alt:"Kapadokya, gün doğumu",
  yuk(x,z){ return Math.abs(Math.sin(x*.02)*Math.cos(z*.017))*22+Math.sin(x*.05+z*.03)*5+Math.sin(z*.08)*3-22; },
  async kur(){
    const gy=new THREE.Vector3(.8,.02,-.6).normalize();
    sahneKur({sis:"#c9a6b8",sisYakin:60,sisUzak:420,ust:"#2c3a72",ufuk:"#f2b49a",alt:"#c49a8a",gunesYon:gy,isikYon:new THREE.Vector3(.7,.35,-.4),gunesRenk:"#ffd0a0",isik:"#ffc9a0",isikGuc:1.2,zemin:"#7a6a7a",hemi:.7,dolgu:.6,dolguRenk:"#c9b8ff",yildiz:.5});
    Ses.ortam("kus",.6);
    this.t=0; this.sabah=0; DALGA=[]; ETK=[]; this.durum=null; this.indi=false; this.inisNokta=null; this.inis=null; this.aktifNokta=undefined; this.halkalar=null; this.yuksel=false; this.serbest=false;
    this.yolHazirla();
    const ag=new THREE.PlaneGeometry(900,900,110,110); ag.rotateX(-Math.PI/2);
    const ap=ag.attributes.position, ar=[];
    for(let i=0;i<ap.count;i++){ const x=ap.getX(i), z=ap.getZ(i); const y=(z>-6&&Math.abs(x)<30)?-1:this.yukYol(x,z); ap.setY(i,y); const c=renk(y>-5?"#e9c4a2":y>-14?"#d9a988":"#c08a6e"); ar.push(c.r,c.g,c.b); }
    ag.setAttribute("color",new THREE.Float32BufferAttribute(ar,3)); ag.computeVertexNormals();
    const arazi=new THREE.Mesh(ag,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,bumpMap:gurultuDoku(220),bumpScale:.4})); arazi.receiveShadow=true; scene.add(arazi);
    const pm=mat("#ecd2b4",{roughness:.95,bumpMap:gurultuDoku(3),bumpScale:.25}), sm=mat("#7a5a46",{roughness:.9});
    const pg=new THREE.ConeGeometry(1,1,10), sg=new THREE.SphereGeometry(1,10,8);
    this.peri=[];
    for(let i=0;i<190;i++){ const x=rnd(-260,260), z=rnd(-340,-14); const h=rnd(6,18), r=rnd(1.4,3); const yy=this.yolYakin(x,z); if(yy&&yy.d<r+4.2) continue; const y=this.yukYol(x,z); this.peri.push({x,z,r});
      const c=new THREE.Mesh(pg,pm); c.scale.set(r,h,r); c.position.set(x,y+h/2-1,z); c.castShadow=i%4===0; scene.add(c);
      const s=new THREE.Mesh(sg,sm); s.scale.set(r*.45,r*.3,r*.45); s.position.set(x,y+h-1+r*.1,z); scene.add(s); }
    this.yolKur();
    // Uçhisar kalesi
    this.kale=new THREE.Group(); this.kale.position.set(-70,this.yuk(-70,-170),-170); scene.add(this.kale);
    const km=new THREE.Mesh(new THREE.CylinderGeometry(9,16,34,12),mat("#e3c3a2",{roughness:.95,flatShading:true})); km.position.y=17; km.castShadow=true; this.kale.add(km);
    for(let i=0;i<30;i++){ const d=new THREE.Mesh(new THREE.CircleGeometry(.7,8),mat("#3a2a22")); const a=rnd(0,Math.PI*2), y=rnd(4,30); const r=16-(y/34)*7; d.position.set(Math.sin(a)*(r+.05),y,Math.cos(a)*(r+.05)); d.lookAt(d.position.clone().multiplyScalar(2).setY(y)); this.kale.add(d); }
    const bay=bayrak(6,3); bay.position.y=34; this.kale.add(bay);
    // otel terası
    const ter=new THREE.Group(); scene.add(ter);
    const tasM=mat("#e2c9a8",{roughness:.95,bumpMap:gurultuDoku(6),bumpScale:.05});
    const zemin=new THREE.Mesh(new THREE.BoxGeometry(16,1,12),tasM); zemin.position.set(0,-.5,2); zemin.receiveShadow=true; ter.add(zemin);
    const duvar=new THREE.Mesh(new THREE.BoxGeometry(16,.6,.4),tasM); duvar.position.set(0,.3,-3.8); duvar.castShadow=true; ter.add(duvar);
    const kaya_=new THREE.Mesh(new THREE.BoxGeometry(18,9,4),tasM); kaya_.position.set(0,4,9.5); ter.add(kaya_);
    for(const x of [-5,0,5]){ const k=new THREE.Mesh(new THREE.PlaneGeometry(1.6,2.4),mat("#4a3020")); k.position.set(x,1.2,7.49); k.rotation.y=Math.PI; ter.add(k);
      const kemer=new THREE.Mesh(new THREE.CircleGeometry(.8,16,0,Math.PI),k.material); kemer.position.set(x,2.4,7.49); kemer.rotation.y=Math.PI; ter.add(kemer); }
    // halı + minderler
    const hc=document.createElement("canvas"); hc.width=hc.height=256; const hx=hc.getContext("2d"); hx.fillStyle="#8e2a2a"; hx.fillRect(0,0,256,256); hx.strokeStyle="#e8c27a"; hx.lineWidth=6; hx.strokeRect(14,14,228,228); hx.fillStyle="#2a3a6a";
    for(let i=0;i<5;i++){ hx.beginPath(); hx.moveTo(128,40+i*36); hx.lineTo(160,58+i*36); hx.lineTo(128,76+i*36); hx.lineTo(96,58+i*36); hx.closePath(); hx.fill(); }
    const ht=new THREE.CanvasTexture(hc); ht.encoding=THREE.sRGBEncoding;
    const hali=new THREE.Mesh(new THREE.PlaneGeometry(3,2.2),new THREE.MeshStandardMaterial({map:ht,roughness:1})); hali.rotation.x=-Math.PI/2; hali.position.set(0,.01,-2.2); ter.add(hali);
    this.minder=new THREE.Group(); this.minder.position.set(0,0,-2.5); ter.add(this.minder);
    for(const x of [-.45,.45]){ const m=new THREE.Mesh(new THREE.BoxGeometry(.7,.22,.7),mat(x<0?"#c9763a":"#a33a4a",{roughness:.95})); m.position.set(x,.11,0); m.castShadow=true; this.minder.add(m); }
    this.masa=new THREE.Group(); this.masa.position.set(4,0,1.5); this.masa.userData.engel=.5; ter.add(this.masa);
    const mu=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.05,20),mat("#8a5a34")); mu.position.y=.42; this.masa.add(mu);
    const ma=new THREE.Mesh(new THREE.CylinderGeometry(.06,.1,.42,8),mat("#5a3a24")); ma.position.y=.21; this.masa.add(ma);
    const caydanlik=new THREE.Mesh(new THREE.SphereGeometry(.12,12,10),mat("#c9c9cf",{metalness:.9,roughness:.25})); caydanlik.position.set(-.12,.55,0); this.masa.add(caydanlik);
    for(const x of [.12,.25]){ const b=bardakYap(); b.position.set(x,.49,.05); this.masa.add(b); }
    // fenerler
    for(const [x,z] of [[-6,-3],[6,-3],[-6,5],[6,5]]){ const f=new THREE.Mesh(new THREE.CylinderGeometry(.14,.16,.35,8),new THREE.MeshStandardMaterial({color:renk("#ffd28a"),emissive:renk("#ffa04a"),emissiveIntensity:1.6})); f.position.set(x,.75,z); ter.add(f);
      const p=parilti("#ffa04a",1.4); p.position.set(x,.8,z); ter.add(p); const ay=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.6,6),mat("#2a2a2e")); ay.position.set(x,.3,z); ter.add(ay); }
    this.terIsik=new THREE.PointLight(renk("#ffb060"),1.6,14); this.terIsik.position.set(0,2.5,0); ter.add(this.terIsik);
    for(let i=0;i<6;i++){ const s=new THREE.Mesh(new THREE.CylinderGeometry(.25,.2,.4,10),mat("#b56a3a")); s.position.set(-7+i*.4,.2,6.5); s.userData.engel=.25; ter.add(s); const b=agac("zeytin",.35); b.position.set(-7+i*.4,.35,6.5); ter.add(b); }
    // balonlar (yerde, sonra yükselir)
    this.balonlar=[]; const renkler=[["#e2504a","#f6c34a"],["#3f7fd8","#f2efe8"],["#7a4fb8","#f19ab0"],["#2e9a6a","#f2c14e"],["#e87b2e","#2a3a7a"],["#d8406a","#ffffff"]];
    for(let i=0;i<40;i++){ const b=balonYap(renkler[i%renkler.length]); const x=rnd(-180,180), z=rnd(-260,-30); b.position.set(x,this.yuk(x,z)+2,z); const s=rnd(.8,1.4); b.scale.setScalar(s); b.userData={v:rnd(.4,1.2),f:Math.random()*6,hedefY:rnd(15,70),gecik:rnd(0,8)}; scene.add(b); this.balonlar.push(b); }
    this.biz=balonYap(["#ff8fa8","#ffd28a"],true); this.biz.visible=false; scene.add(this.biz);
    this.alev=parilti("#ffb04a",2.2); this.alev.position.set(0,1.3,0); this.alev.material.opacity=.2; this.biz.add(this.alev);
    this.alevIsik=new THREE.PointLight(renk("#ffa040"),0,8); this.alevIsik.position.set(0,1.2,0); this.biz.add(this.alevIsik);
    this.kaan=karakter("kaan","gunluk"); this.kar=karakter("kardelen","ev");
    this.kaan.position.set(0,0,6.5); this.kaan.rotation.y=Math.PI; this.kar.position.set(.6,0,-3.1); this.kar.rotation.y=Math.PI; scene.add(this.kaan,this.kar);
    KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    this.bardak1=bardakYap(); this.bardak2=bardakYap(); this.bardak1.visible=this.bardak2.visible=false; scene.add(this.bardak1,this.bardak2);
    Kamera.sinema=null; Kamera.aci=0; Kamera.mesafe=5.5; Kamera.yukseklik=2.4; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(0,3,12);
    Ses.ton="sicak";
  },
  sabahAyarla(k){ const gok=scene.userData.gok.material.uniforms; this.sabah=k;
    gok.ust.value.copy(renk("#2c3a72").lerp(renk("#6f8fd0"),k)); gok.ufuk.value.copy(renk("#f2b49a").lerp(renk("#ffd9b8"),k)); gok.yildiz.value=.5*(1-k);
    const g=new THREE.Vector3(.8,.02+k*.12,-.6).normalize(); gok.gunes.value.copy(g); scene.userData.gun.intensity=1.2+k*1.2; scene.fog.color.copy(renk("#c9a6b8").lerp(renk("#f5c9ae"),k)); },
  async basla(){
    katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle();
    const K=this.kaan, D=this.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(30,16,-80),new THREE.Vector3(0,0,0));
      await kameraNoktasi(s=>new THREE.Vector3(30-s*4,16-s*1.4,-80+s*10),new THREE.Vector3(0,1,0),7);
      baslikKarti(this.ad,[this.tarih,"Bölüm "+this.no]);
      await kameraNoktasi(new THREE.Vector3(1.5,1.8,9.5),bas(K),3);
      await anlat("Mayıs 2025. Kapadokya. Güneş doğmadan önce, otelin terası.");
      await anlat("Oteli seçerken tek bir şartı vardı: Terastan balonlar görünecek.");
    });
    gorev("Masadan çay doldur");
    this.serbest=true; gizliKalpler(this,[[-6.4,1.0,5.8,0],[6.6,1.0,-2.7,1],[-3.4,1.0,-2.9,2]]);
    await etkBekle(this.masa,"Çay doldur",{mesafe:1.6,isaretY:1});
    await sahne(async()=>{ cevir(K,this.masa.position); this.masa.children.filter(o=>o.children&&o.children.length===2).forEach(o=>o.visible=false);
      this.bardak1.visible=true; this.bardak1.userData={}; eldeTut(K,this.bardak1,"D"); K.userData.kolD.rotation.set(-.6,0,.15); await bekle(800); });
    gorev("Çayı Kardelen'e götür");
    await etkBekle(D,"Çayı ver",{mesafe:1.8,isaretY:2});
    this.serbest=false;
    gorev(null);
    await sahne(async()=>{
      await yuruHedef(K,new THREE.Vector3(-.45,0,-2.5),1.1); K.rotation.y=Math.PI; await yuruHedef(D,new THREE.Vector3(.45,0,-2.5),1); D.rotation.y=Math.PI;
      K.userData.kolD.rotation.set(0,0,0); K.userData.eldeki=null; this.bardak1.visible=false;
      K.userData.oturY=D.userData.oturY=.08; K.userData.otur=D.userData.otur=1;
      await kameraNoktasi(new THREE.Vector3(1.4,1.4,-1),new THREE.Vector3(0,.95,-2.6),2);
      D.userData.bakNokta=bas(K); K.userData.bakNokta=bas(D);
      await konus("kardelen",["Teşekkürler aşkım","Üşüdüm biraz","Ama buradan kalkmam"],{gul:.6});
      await konus("kardelen",["Balonlar görünür mü sence buradan"],{gul:.4});
      const c=await sec(["Oteli seçerken ilk ona baktın zaten.","Görünmezse otelciyle konuşurum."]);
      if(c===0){ await konus("kaan","Oteli seçerken ilk ona baktın zaten."); await konus("kardelen",["Çünkü ne istediğimi biliyorum 😄"],{gul:1}); }
      else { await konus("kaan","Görünmezse otelciyle konuşurum."); await konus("kardelen",["Sen yaparsın biliyorum","Reis 😄"],{gul:1}); }
      D.userData.bakNokta=null; K.userData.bakNokta=null;
      // balonlar yükselir
      let s=0; this.yuksel=true;
      Kamera.sinema=dt=>{ s+=dt; this.sabahAyarla(Math.min(1,s/16)); camera.position.set(-1.2+s*.04,1.3+s*.02,.4); camera.userData.bakis=new THREE.Vector3(0,3+s*.6,-60); camera.lookAt(camera.userData.bakis); };
      await bekle(3000); D.userData.gulumse=1; D.userData.baslik=.6;
      await anlat("Önce bir tane, sonra onlarcası. Gökyüzü bir anda renklerle doldu.");
      await bekle(2500);
      D.userData.bakNokta=bas(K); K.userData.bakNokta=bas(D); D.userData.baslik=0;
      await konus("kardelen",["Görüyor! Görüyor!","Ohaaa bak ne kadar çoklar 😍"],{gul:1});
      await konus("kardelen",["Çeksene","Hepsini çek"],{gul:1});
    });
    const enIyi=await this.balonFoto();
    await sahne(async()=>{
      await kameraNoktasi(new THREE.Vector3(1.4,1.4,-1),new THREE.Vector3(0,.95,-2.6),1.4);
      D.userData.bakNokta=bas(K); K.userData.bakNokta=bas(D);
      await konus("kaan","Videonun sonuna on saniye sessiz bir balon görüntüsü koyacağım. Sadece balonlar.",{gul:.5});
      await konus("kardelen",this.harikaKare?["Artis 😄","Ama çok güzel olur"]:["Artis 😄","Bir tane de beni çek ama"],{gul:1});
      await anlat("O gün yüzlerce fotoğraf çektik. Öğleden sonra ATV turu vardı.",3000);
      D.userData.bakNokta=null; K.userData.bakNokta=null;
    });
    await this.atv();
  },
  async ucus(){
    const K=this.kaan, D=this.kar, B=this.biz;
    await gecis(async()=>{
      this.sabahAyarla(1);
      K.userData.otur=D.userData.otur=0; K.userData.oturY=D.userData.oturY=0; K.userData.bakNokta=D.userData.bakNokta=null;
      B.visible=true; B.position.set(0,6,-40);
      for(const [c,x] of [[K,-.32],[D,.32]]){ scene.remove(c); c.position.set(x,-1.22,0); c.rotation.y=Math.PI; B.add(c); }
      this.balonlar.forEach(b=>{ b.userData.gecik=0; b.position.y=Math.max(b.position.y,this.yuk(b.position.x,b.position.z)+b.userData.hedefY*.7); });
      Kamera.sinema=null; Kamera.aci=0; Kamera.mesafe=14; Kamera.yukseklik=4; Kamera.hedef.copy(B.position); Kamera.poz.set(0,12,-24);
    });
    this.noktalar=[{p:new THREE.Vector3(-20,22,-110),ad:"Aşk Vadisi",yon:"Aşk Vadisi'ne",s:[["kardelen","Aşağıdaki vadiye bak! Bütün peri bacaları sıra sıra."],["kaan","Adı Aşk Vadisi'ymiş. Tam bizlik."]]},
      {p:new THREE.Vector3(-60,44,-165),ad:"Uçhisar Kalesi",yon:"Uçhisar Kalesi'ne",s:[["kardelen","Kalenin tepesinde bayrak var, görüyor musun?"],["kaan","Buradan bakınca bütün Kapadokya ayaklarımızın altında."]]},
      {p:new THREE.Vector3(10,30,-230),ad:"Güvercinlik",yon:"Güvercinlik'e",s:[["kardelen","Bu sabahı hiç unutmayacağım."],["kaan","Ben de. Özellikle yüzündeki ifadeyi."]]}];
    this.halkalar=this.noktalar.map(n=>{ const h=new THREE.Mesh(new THREE.TorusGeometry(6,.25,8,40),new THREE.MeshBasicMaterial({color:renk("#ffd28a"),transparent:true,opacity:.75,fog:false})); h.position.copy(n.p); scene.add(h); return h; });
    this.vy=0; this.durum="uc"; this.btn.hidden=false; aksiyonYazi(this.btn,"Ateşle 🔥");
    for(let i=0;i<3;i++){
      gorev(`Balonu ${this.noktalar[i].yon} yönlendir · ${i} / 3`);
      this.aktifNokta=i;
      await kosul(()=>B.position.distanceTo(this.noktalar[i].p)<9);
      this.halkalar[i].visible=false; Ses.efekt("parilti"); this.durum="dur";
      await sahne(async()=>{ for(const [kim,t] of this.noktalar[i].s) await konus(kim,t,{gul:.8}); });
      if(i===1){ await sahne(async()=>{ yuzYuze(K,D); K.position.x=-.2; D.position.x=.2; D.userData.kafa.rotation.z=-.2; K.userData.gulumse=D.userData.gulumse=1;
        const m=new THREE.Vector3(); B.localToWorld(m.set(0,-.4,0));
        await kameraNoktasi(B.localToWorld(new THREE.Vector3(2.2,.1,-1.6)),m,1.5);
        const qte=el(`<div class="qte"><button class="btn qte-btn">📷 Gökyüzünde bir fotoğraf</button></div>`); katman.appendChild(qte);
        await new Promise(r=>{ qte.querySelector("button").onclick=r; }); qte.remove();
        await hatiraFoto("Kapadokya · Mayıs 2025"); await bekle(2000);
        K.rotation.y=D.rotation.y=Math.PI; K.position.x=-.32; D.position.x=.32; D.userData.kafa.rotation.z=0; }); }
      this.durum="uc"; aksiyonYazi(this.btn,"Ateşle 🔥");
    }
    gorev("Yumuşak iniş yap: tarlaya yavaşça alçal");
    const tarla=new THREE.Vector3(30,0,-260); tarla.y=this.yuk(tarla.x,tarla.z);
    this.inis=new THREE.Mesh(new THREE.RingGeometry(5,6,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:renk("#fff1c9"),transparent:true,opacity:.8})); this.inis.position.copy(tarla).add(new THREE.Vector3(0,.4,0)); scene.add(this.inis);
    this.inisNokta=tarla;
    await kosul(()=>this.indi);
    this.durum="son"; aksiyonYazi(this.btn,null); gorev(null);
    await sahne(async()=>{
      yuzYuze(K,D); K.position.x=-.17; D.position.x=.17; K.userData.saril=D.userData.saril=1; D.userData.kafa.rotation.z=-.18; Ses.efekt("buyuk");
      let s=0; Kamera.sinema=dt=>{ s+=dt; const p=B.position; camera.position.set(p.x+Math.sin(s*.15)*7,p.y+1.5,p.z+Math.cos(s*.15)*7); camera.lookAt(p.x,p.y,p.z); };
      await anlat("Yumuşacık bir iniş. Sepetin içinde biraz daha kaldık.");
      K.userData.saril=D.userData.saril=0;
      await konus("kardelen","Biliyor musun, en sevdiğim yer burası oldu. Bir daha geleceğiz.",{gul:1});
      await konus("kaan","Her bahar, istersen.",{gul:.7});
      await anlat("Hâlâ söyler: En sevdiği yer Nevşehir.",3400);
    });
    bolumBitti(this.no);
  },
  guncelle(dt){
    this.t+=dt; const t=this.t, K=this.kaan, D=this.kar, B=this.biz; dalgaGuncelle(t);
    for(const b of this.balonlar){ const u=b.userData; if(this.yuksel||this.durum){ if(u.gecik>0){ u.gecik-=dt; continue; } const zy=this.yuk(b.position.x,b.position.z)+u.hedefY; if(b.position.y<zy) b.position.y+=dt*u.v*2.2; else b.position.y+=Math.sin(t*.3+u.f)*.01; b.position.x+=u.v*dt*.5; if(b.position.x>220) b.position.x=-220; } }
    if(this.durum==="atv"||this.durum==="atvDur"){ this.atvGuncelle(dt); return; }
    if(!this.durum){
      const sinir=p=>{ p.x=clamp(p.x,-7.2,7.2); p.z=clamp(p.z,-3.3,6.8); p.y=0; };
      if(this.serbest&&!kilit) yuru(K,dt,sinir,1.8);
      etkilesimGuncelle(K,this.btn);
      if(!Kamera.sinema) Kamera.hedef.lerp(K.position,.1);
      return;
    }
    if(this.halkalar) this.halkalar.forEach((h,i)=>{ h.rotation.y+=dt*.4; h.material.opacity=i===this.aktifNokta?.85:.25; });
    if(this.inis) this.inis.material.opacity=.5+Math.sin(t*3)*.3;
    if(this.durum==="uc"&&!kilit){
      const v=girdiVek();
      if(Girdi.aksiyon){ this.vy=Math.min(this.vy+5*dt,3); if(!this.sonAtes||t-this.sonAtes>.35){ Ses.efekt("ates"); this.sonAtes=t; } } else this.vy=Math.max(this.vy-2.2*dt,-2.4);
      this.alev.material.opacity=lerp(this.alev.material.opacity,Girdi.aksiyon?1:.15,.2); this.alevIsik.intensity=Girdi.aksiyon?3:0;
      B.position.y+=this.vy*dt; B.position.x+=v.x*6*dt; B.position.z-=(2.6+(-v.y)*3)*dt;
      const zemin=this.yuk(B.position.x,B.position.z)+3; if(B.position.y<zemin){ B.position.y=zemin; this.vy=Math.max(this.vy,0); }
      B.position.y=Math.min(B.position.y,80); B.position.x=clamp(B.position.x,-110,110); B.position.z=Math.max(B.position.z,-300);
      B.rotation.z=lerp(B.rotation.z,-v.x*.08,.05);
      // hedef noktayı kaçırırsa geri dön
      if(this.aktifNokta!==undefined&&this.noktalar[this.aktifNokta]&&B.position.z<this.noktalar[this.aktifNokta].p.z-30){ B.position.z=this.noktalar[this.aktifNokta].p.z+25; }
      if(this.inisNokta){ const d=Math.hypot(B.position.x-this.inisNokta.x,B.position.z-this.inisNokta.z); if(B.position.z<this.inisNokta.z-15) B.position.z=this.inisNokta.z+15;
        if(d<6&&B.position.y<=this.yuk(B.position.x,B.position.z)+3.05&&!this.indi){ this.indi=true; } }
      Kamera.hedef.copy(B.position); Kamera.hedef.y-=.5;
    }
  },
  temizle(){ this._fotoSok&&this._fotoSok(); }
};
