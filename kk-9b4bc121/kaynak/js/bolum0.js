/* ================= BÖLÜM 1: İLK MESAJ (2021) ================= */
/* Gece harp okulu yatakhanesi → Instagram'dan ilk mesaj → aylarca yazışma → altı ay sonra sahilde ilk buluşma */
const DM={
  el:null,
  ac(ad,durum){ this.kapat();
    this.el=el(`<div class="dm"><div class="dm-ust"><div class="dm-av">${ad[0].toUpperCase()}</div><div class="dm-ad"><b>${ad}</b><small>${durum||"Instagram"}</small></div></div><div class="dm-akis"></div><div class="dm-sec" hidden></div></div>`);
    katman.appendChild(this.el); requestAnimationFrame(()=>this.kaydir()); return this; },
  // telefon paneli ekranın altını kaplar: sahne görüntüsü panelin üstündeki boşluğa kayar (konuşanın yüzü panelin arkasında kalmasın)
  kaydir(){ if(!this.el||!this.el.isConnected) return; const h=ekranYuksekligi(), w=innerWidth, ust=this.el.getBoundingClientRect().top; const k=Math.max(0,Math.min(h*.32,h/2-ust/2)); if(k>4) camera.setViewOffset(w,h,0,k,w,h); },
  kapat(){ if(this.el){ this.el.remove(); this.el=null; } if(camera.view&&camera.view.enabled) camera.clearViewOffset(); },
  ekle(n){ if(!this.el) return n; const a=this.el.querySelector(".dm-akis"); a.appendChild(n); a.scrollTop=a.scrollHeight; return n; },
  zaman(t){ this.ekle(el(`<div class="dm-zaman">${t}</div>`)); },
  async yaz(kim,metin,ops={}){
    if(!this.el) return;
    // bekleyişler ekrana dokununca kısalır: sohbet dokundukça ilerler
    if(kim==="o"){ const y=this.ekle(el(`<div class="dm-yaziyor"><i></i><i></i><i></i></div>`)); await bekleDokun(ops.sure||Math.min(2400,800+metin.length*38)); y.remove(); Ses.efekt("mesaj"); }
    if(!this.el) return;
    const b=el(`<div class="dm-bal ${kim}"></div>`); b.textContent=metin; this.ekle(b);
    if(kim==="ben"){ Ses.efekt("gonder"); await bekleDokun(500); const g=this.el&&this.el.querySelector(".dm-gor"); if(g) g.remove(); this.ekle(el(`<div class="dm-gor">Görüldü</div>`)); }
    await bekleDokun(ops.bekle||500);
  },
  sec(secenekler){ if(!this.el) return new Promise(()=>{}); const s=this.el.querySelector(".dm-sec"); s.hidden=false; s.innerHTML="";
    return new Promise(r=>{ secenekler.forEach((t,i)=>{ const b=el(`<button class="dm-btn"></button>`); b.textContent=t; b.onclick=()=>{ s.hidden=true; s.innerHTML=""; r(i); }; s.appendChild(b); }); }); }
};
const B0={
  id:"ilkmesaj", no:1, ad:"İlk Mesaj", tarih:"2 Ağustos 2021", alt:"İzmit'te ilk buluşma",
  async kur(){
    this.faz="oda"; this.t=0; DALGA=[]; ETK=[]; ICSAHNE=null; this.serbest=false; this.birlikte=false; this.noktalar=null;
    const ay=new THREE.Vector3(-.5,.35,-1).normalize();
    sahneKur({sis:"#0d1020",sisYakin:30,sisUzak:120,ust:"#04061a",ufuk:"#151d3c",alt:"#05060f",gunesYon:ay,isikYon:ay,gunesRenk:"#9fb4ff",isik:"#9fb0ff",isikGuc:.35,zemin:"#2a2430",hemi:.35,yildiz:1.2,parlak:.2,dolgu:.15,dolguRenk:"#8a9cff"});
    // yatakhane odası (iç mekân)
    const oda=new THREE.Group(); scene.add(oda); this.oda=oda;
    const duvar=mat("#c9cbbd",{roughness:.95}), zem=mat("#6f5a46",{roughness:.75,bumpMap:gurultuDoku(8),bumpScale:.02}), metal=mat("#5d6658",{roughness:.55,metalness:.45});
    const W=7, D=6, H=3;
    const z=new THREE.Mesh(new THREE.PlaneGeometry(W,D),zem); z.rotation.x=-Math.PI/2; z.receiveShadow=true; oda.add(z);
    const tav=new THREE.Mesh(new THREE.PlaneGeometry(W,D),mat("#e2e2da")); tav.rotation.x=Math.PI/2; tav.position.y=H; oda.add(tav);
    const dv=(w,x,zz,ry)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,H),duvar); m.position.set(x,H/2,zz); m.rotation.y=ry; m.receiveShadow=true; oda.add(m); return m; };
    dv(W,0,-D/2,0); dv(W,0,D/2,Math.PI); dv(D,-W/2,0,Math.PI/2); dv(D,W/2,0,-Math.PI/2);
    const supur=new THREE.Mesh(new THREE.BoxGeometry(W,.12,.02),mat("#4a4a40")); supur.position.set(0,.06,-D/2+.01); oda.add(supur);
    // pencere: gece göğü ve ay
    const pc=document.createElement("canvas"); pc.width=256; pc.height=200; const px=pc.getContext("2d"); const gr=px.createLinearGradient(0,0,0,200); gr.addColorStop(0,"#070b22"); gr.addColorStop(1,"#1d2550"); px.fillStyle=gr; px.fillRect(0,0,256,200);
    for(let i=0;i<50;i++){ px.fillStyle="rgba(255,255,255,"+rnd(.3,.9)+")"; px.fillRect(Math.random()*256,Math.random()*150,1.4,1.4); }
    const rg=px.createRadialGradient(70,56,3,70,56,36); rg.addColorStop(0,"#fffbe8"); rg.addColorStop(.42,"#fff4d6"); rg.addColorStop(.48,"rgba(200,210,255,.45)"); rg.addColorStop(1,"rgba(150,160,255,0)"); px.fillStyle=rg; px.fillRect(20,10,110,100);
    px.fillStyle="#0a0d1a"; for(let i=0;i<9;i++){ const x=i*30+rnd(-6,6), h=rnd(20,55); px.fillRect(x,200-h,rnd(18,28),h); }
    const pt=new THREE.CanvasTexture(pc); pt.encoding=THREE.sRGBEncoding;
    const pen=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.2),new THREE.MeshBasicMaterial({map:pt})); pen.position.set(1.4,1.75,-D/2+.02); oda.add(pen);
    const cer=mat("#f2efe8"); for(const [w,h,x,y] of [[1.72,.07,1.4,2.38],[1.72,.07,1.4,1.12],[.07,1.3,.57,1.75],[.07,1.3,2.23,1.75],[.05,1.2,1.4,1.75]]){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.05),cer); m.position.set(x,y,-D/2+.04); oda.add(m); }
    // ranzalar
    const ranza=(x,zz,ry)=>{ const g=new THREE.Group(); g.position.set(x,0,zz); g.rotation.y=ry; oda.add(g); g.userData.engel={kutu:[.52,1.04]}; g.userData.kameraEngel=true; // içinden geçilmez, kamerayı kapatmaz
      for(const [dx,dz] of [[-.48,-1],[.48,-1],[-.48,1],[.48,1]]){ const d=new THREE.Mesh(new THREE.BoxGeometry(.05,1.9,.05),metal); d.position.set(dx,.95,dz); d.castShadow=true; g.add(d); }
      for(const y of [.42,1.45]){ const c=new THREE.Mesh(new THREE.BoxGeometry(1,.06,2.05),metal); c.position.y=y; g.add(c);
        const yt=new THREE.Mesh(new THREE.BoxGeometry(.94,.14,1.98),mat("#e9e4d8",{roughness:.95})); yt.position.y=y+.1; yt.castShadow=true; yt.receiveShadow=true; g.add(yt);
        const bt=new THREE.Mesh(new THREE.BoxGeometry(.96,.05,1.3),mat("#4d5a3f",{roughness:.95})); bt.position.set(0,y+.19,.3); g.add(bt);
        const ys=new THREE.Mesh(new THREE.BoxGeometry(.6,.1,.32),mat("#ffffff",{roughness:.9})); ys.position.set(0,y+.22,-.78); g.add(ys); }
      const mrd=new THREE.Mesh(new THREE.BoxGeometry(.04,1.2,.04),metal); mrd.position.set(.5,1,.3); g.add(mrd);
      return g; };
    this.ranza=ranza(-2.4,-.9,0); ranza(-2.4,1.6,0); ranza(2.6,1.6,Math.PI);
    // dolaplar
    for(let i=0;i<3;i++){ const d=new THREE.Mesh(new THREE.BoxGeometry(.6,1.95,.55),mat("#7c8571",{roughness:.6,metalness:.3})); d.position.set(3.15,.98,-1.9+i*.62); d.castShadow=true; d.userData.engel={kutu:[.3,.31]}; d.userData.kameraEngel=true; oda.add(d);
      const tut=new THREE.Mesh(new THREE.BoxGeometry(.02,.14,.03),mat("#c9c9c0",{metalness:.8,roughness:.3})); tut.position.set(2.84,1.05,-1.9+i*.62+.18); oda.add(tut); }
    // masa, kitaplar, lamba
    const ms=new THREE.Mesh(new THREE.BoxGeometry(1.3,.06,.65),mat("#8a6a4c",{roughness:.7})); ms.position.set(1.3,.76,-2.55); ms.castShadow=true; ms.userData.engel={kutu:[.66,.34]}; oda.add(ms);
    for(const [x,zz] of [[.72,-2.3],[1.88,-2.3],[.72,-2.8],[1.88,-2.8]]){ const a=new THREE.Mesh(new THREE.BoxGeometry(.05,.76,.05),metal); a.position.set(x,.38,zz); oda.add(a); }
    for(let i=0;i<4;i++){ const k=new THREE.Mesh(new THREE.BoxGeometry(.22,.04,.3),mat(["#7a2236","#2d3a55","#3f5d4a","#c9a24a"][i])); k.position.set(1.7,.81+i*.04,-2.6); k.rotation.y=rnd(-.2,.2); oda.add(k); }
    const ml=new THREE.Mesh(new THREE.ConeGeometry(.12,.16,16,1,true),new THREE.MeshStandardMaterial({color:renk("#ffe2c0"),emissive:renk("#ffb070"),emissiveIntensity:1.3,side:THREE.DoubleSide})); ml.position.set(.85,1.12,-2.62); oda.add(ml);
    const mla=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.32,6),metal); mla.position.set(.85,.95,-2.62); oda.add(mla);
    this.lamba=new THREE.PointLight(renk("#ffbe7a"),1.6,7,1.5); this.lamba.position.set(.85,1.1,-2.4); oda.add(this.lamba);
    const ayIsik=new THREE.PointLight(renk("#9fb4ff"),1.1,8,1.2); ayIsik.position.set(1.4,2.2,-2.6); oda.add(ayIsik); // ay ışığı (noktasal: diğer sahnelerle aynı ışık düzeni)
    // duvarda bayrak
    const bd=bayrakDoku(); const bf=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.73),new THREE.MeshStandardMaterial({map:bd,roughness:.9})); bf.position.set(-W/2+.02,1.9,-1.4); bf.rotation.y=Math.PI/2; oda.add(bf);
    // telefon yatağın üstünde
    this.tel=telefonYap(); this.tel.userData.telefon=true; this.tel.position.set(-2.25,.62,-.6); this.tel.rotation.x=-Math.PI/2; scene.add(this.tel);
    this.telIsik=parilti("#9fd0ff",.35); this.telIsik.position.copy(this.tel.position).add(new THREE.Vector3(0,.05,0)); scene.add(this.telIsik);
    // karakter
    this.kaan=karakter("kaan","gunluk"); this.kaan.position.set(.6,0,.8); this.kaan.rotation.y=-Math.PI*.8; scene.add(this.kaan);
    this.kardelenOda=B5.odaKur();
    KONUSANLAR={kaan:this.kaan,kardelen:this.kardelenOda.kar};
    Kamera.sinema=null; Kamera.aci=.6; Kamera.mesafe=3.2; Kamera.yukseklik=1.6; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(2,2.4,3.4);
    Ses.ton="gece";
  },
  async sahilKur(){
    this.faz="sahil"; this.t=0; ETK=[]; ICSAHNE=null; this.serbest=false; this.birlikte=false; this.birlikteDur=false;
    const gy=new THREE.Vector3(-.25,.07,-1).normalize();
    sahneKur({sis:"#f0a983",sisYakin:40,sisUzak:260,ust:"#4a5c9a",ufuk:"#ffb98a",alt:"#2b4f74",gunesYon:gy,isikYon:new THREE.Vector3(-.4,.5,-1),gunesRenk:"#ffc88a",isik:"#ffbe8a",isikGuc:2.1,zemin:"#8a7a6a",hemi:.85,dolgu:1,dolguRenk:"#ffd9c2"});
    // deniz
    if(THREE.Water){ const sn=new THREE.TextureLoader().load(SU_NORMAL); sn.wrapS=sn.wrapT=THREE.RepeatWrapping;
      const wg=new THREE.PlaneGeometry(700,320); wg.rotateX(-Math.PI/2); wg.translate(0,0,-160);
      this.su=new THREE.Water(wg,{textureWidth:512,textureHeight:512,waterNormals:sn,sunDirection:gy.clone(),sunColor:0xffc490,waterColor:0x174a63,distortionScale:2,fog:true,alpha:1}); this.su.position.y=-.6; scene.add(this.su); }
    else { const dm=new THREE.Mesh(new THREE.PlaneGeometry(700,320).rotateX(-Math.PI/2).translate(0,-.6,-160),mat("#2d6e93",{roughness:.12,metalness:.35})); scene.add(dm); }
    // rıhtım duvarı ve yürüyüş yolu
    const tas=mat("#b9ad9c",{roughness:.85,bumpMap:gurultuDoku(40),bumpScale:.03});
    const yol=new THREE.Mesh(new THREE.PlaneGeometry(160,9),tas); yol.rotation.x=-Math.PI/2; yol.position.set(0,0,4.5); yol.receiveShadow=true; scene.add(yol);
    const serit=new THREE.Mesh(new THREE.PlaneGeometry(160,1.2),mat("#a0503e",{roughness:.9})); serit.rotation.x=-Math.PI/2; serit.position.set(0,.005,6.8); scene.add(serit);
    const duvarR=new THREE.Mesh(new THREE.BoxGeometry(160,.8,.6),mat("#9a8f80",{roughness:.9})); duvarR.position.set(0,-.38,-.3); scene.add(duvarR);
    const cim=new THREE.Mesh(new THREE.PlaneGeometry(160,14),mat("#6e7450",{roughness:1})); cim.rotation.x=-Math.PI/2; cim.position.set(0,.01,16); cim.receiveShadow=true; scene.add(cim);
    scene.add(otlar(()=>({x:rnd(-70,70),y:.01,z:rnd(9.6,22)}),700,"#8a8a5a",.3));
    for(let i=0;i<16;i++){ const a=ciplakAgac(rnd(.9,1.3)); a.position.set(-72+i*9.5+rnd(-2,2),0,rnd(11,20)); a.rotation.y=rnd(0,6); scene.add(a); }
    // korkuluk
    const kor=mat("#e6e2da",{roughness:.4,metalness:.5});
    // iskelenin girişinde korkuluk açık (x 44.6–47.4)
    for(let x=-70;x<=70;x+=2){ if(x>44.4&&x<47.6) continue; const d=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1,6),kor); d.position.set(x,.5,.15); scene.add(d); }
    for(const [x0,x1] of [[-70,44.6],[47.4,70]]) for(const y of [.98,.55]){ const L=x1-x0; const b=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,L,8),kor); b.rotation.z=Math.PI/2; b.position.set((x0+x1)/2,y,.15); scene.add(b); }
    for(const x of [44.6,47.4]){ const d=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.05,8),kor); d.position.set(x,.52,.15); scene.add(d); }
    // banklar ve lambalar
    const bank=(x)=>{ const g=new THREE.Group(); g.position.set(x,0,3.2); g.rotation.y=Math.PI; g.userData.engel={kutu:[.88,.3]};
      const ah=mat("#7a5236",{roughness:.8}), dm=mat("#2a2a2a",{metalness:.5,roughness:.5});
      for(let i=0;i<3;i++){ const t=new THREE.Mesh(new THREE.BoxGeometry(1.7,.04,.12),ah); t.position.set(0,.46,-.16+i*.15); g.add(t); }
      for(let i=0;i<2;i++){ const t=new THREE.Mesh(new THREE.BoxGeometry(1.7,.12,.04),ah); t.position.set(0,.68+i*.16,.24); t.rotation.x=-.15; g.add(t); }
      for(const sx of [-.75,.75]){ const a=new THREE.Mesh(new THREE.BoxGeometry(.06,.46,.5),dm); a.position.set(sx,.23,0); g.add(a); }
      g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); scene.add(g); return g; };
    this.banklar=[-14,4,22,40].map(bank);
    this.lambalar=[];
    for(let x=-60;x<=60;x+=12){ const g=new THREE.Group(); g.position.set(x,0,7.6); g.userData.engel=.15; const d=new THREE.Mesh(new THREE.CylinderGeometry(.05,.07,3.6,8),mat("#2b2b30",{metalness:.6,roughness:.4})); d.position.y=1.8; g.add(d);
      const f=new THREE.Mesh(new THREE.SphereGeometry(.18,12,10),new THREE.MeshStandardMaterial({color:renk("#fff1d6"),emissive:renk("#ffcf8a"),emissiveIntensity:.2})); f.position.y=3.65; g.add(f); g.userData.f=f; scene.add(g); this.lambalar.push(g); }
    // iskele
    const isk=new THREE.Group(); isk.position.set(46,0,0); scene.add(isk);
    const tah=mat("#8a6646",{roughness:.85});
    for(let i=0;i<22;i++){ const t=new THREE.Mesh(new THREE.BoxGeometry(2.6,.08,.55),tah); t.position.set(0,-.04,-.4-i*.6); t.receiveShadow=true; isk.add(t); }
    for(let i=0;i<6;i++) for(const sx of [-1.25,1.25]){ const k=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,2,8),mat("#5a4430")); k.position.set(sx,-.9,-1-i*2.4); isk.add(k); }
    this.iskeleUc=new THREE.Vector3(46,0,-12.6);
    // karşı kıyı tepeleri ve şehir ışıkları
    for(let i=0;i<12;i++){ const t=new THREE.Mesh(new THREE.SphereGeometry(rnd(18,34),18,10),mat("#5a5470",{roughness:1})); t.scale.y=rnd(.18,.3); t.position.set(-180+i*34+rnd(-8,8),-2,-230+rnd(-10,10)); scene.add(t); }
    this.sehirIsik=tozlar(260,()=>({x:rnd(-190,200),y:rnd(.5,6),z:rnd(-222,-208)}),"#ffd9a0",.9); scene.add(this.sehirIsik);
    // martılar
    this.martilar=[]; for(let i=0;i<6;i++){ const m=new THREE.Group(); const k=mat("#f6f6f2",{roughness:.8});
      for(const s of [-1,1]){ const kn=new THREE.Mesh(new THREE.BoxGeometry(.5,.02,.12),k); kn.position.x=s*.25; kn.rotation.z=s*.25; m.add(kn); }
      m.position.set(rnd(-30,40),rnd(6,12),rnd(-30,-8)); m.userData={a:rnd(0,6),r:rnd(6,14),h:m.position.y,c:m.position.clone()}; scene.add(m); this.martilar.push(m); }
    // konuşma noktaları (yürürken)
    this.noktalar=[{x:12,ad:"korkuluk"},{x:24,ad:"bank"},{x:36,ad:"iskele"}];
    // karakterler
    await kisHazirla(); this.kaan=karakter("kaan","kis"); this.kar=karakter("kardelen","kis");
    this.kaan.position.set(-24,0,5); this.kaan.rotation.y=Math.PI/2;
    this.kar.position.set(-24,0,5.75); this.kar.rotation.y=Math.PI/2;
    scene.add(this.kaan,this.kar);
    KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    Kamera.sinema=null; Kamera.aci=.25; Kamera.mesafe=7; Kamera.yukseklik=2.8; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(-24,4,13);
    Ses.ton="sicak"; Ses.denizBaslat();
  },
  async basla(){
    katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle();
    const sk=el(`<button class="sarki" aria-label="Spotify'da dinle">🎵 Uzunlar · Evdeki Saat</button>`); sk.onclick=()=>{ try{ window.open("https://open.spotify.com/intl-tr/track/1vLkBVAy8ZWrqcQjYTPP3a","_blank","noopener"); }catch(e){} }; katman.appendChild(sk); setTimeout(()=>{ sk.classList.add("git"); setTimeout(()=>sk.remove(),900); },45000);
    const K=this.kaan;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(-1.5,2.6,2.6),new THREE.Vector3(1.4,1.7,-3));
      await kameraNoktasi(s=>new THREE.Vector3(-1.5+s*.25,2.6-s*.12,2.6-s*.1),new THREE.Vector3(1.4,1.7,-3),4);
      baslikKarti(this.ad,[this.tarih,"Bölüm "+this.no]);
      await kameraNoktasi(bas(K).add(new THREE.Vector3(.8,.1,1.3)),bas(K),2.5);
      await anlat("2 Ağustos 2021. Okulda bir gece. Işıklar çoktan söndü, koğuş uyuyor.");
      await anlat("Günlerdir aklımdan çıkmayan bir fotoğraf vardı.");
      await konus("kaan","Yazsam mı… yazmasam mı? Hadi be, yaz işte.",{uzak:1.3});
    });
    gorev("Telefonunu al");
    this.serbest=true; gizliKalpler(this,[[2.3,1.0,-1.3,0]]);
    await etkBekle(this.tel,"Telefonu al",{mesafe:1.4,isaretY:.5});
    this.serbest=false;
    await sahne(async()=>{
      await yuruHedef(K,new THREE.Vector3(-1.62,0,-.45),1.6); K.rotation.y=Math.PI/2;
      K.position.x=-1.78; K.userData.otur=1; K.userData.oturY=.5; scene.remove(this.telIsik);
      this.tel.rotation.set(0,0,0); eldeTut(K,this.tel,"S"); K.userData.telefon=2; Ses.efekt("titresim");
      await kameraNoktasi(bas(K).add(new THREE.Vector3(.9,.05,.9)),bas(K).add(new THREE.Vector3(0,-.25,0)),1.6);
      const dm=DM.ac("kardelen","Instagram"); dm.zaman("21:47");
      await bekle(500);
      const c=await dm.sec(["Merhaba 🙂","Selam, nasılsın?","Fotoğrafın çok güzelmiş."]);
      await dm.yaz("ben",["Merhaba 🙂","Selam, nasılsın?","Fotoğrafın çok güzelmiş."][c]);
      await anlat("Gönderdim. Telefonu bıraksam mı, beklesem mi… Ekrana bakmaktan kendimi alamadım.",3200);
      // ekranın öbür ucunda
      const O=this.kardelenOda; const ek=el(`<div class="telefon-ekran"><span>KARDELEN</span></div>`); katman.appendChild(ek); ICSAHNE={...O,el:ek};
      O.kar.userData.telefon=2; O.tel.visible=true; eldeTut(O.kar,O.tel,"S"); O.kar.userData.gulumse=.2;
      await bekle(1200); O.kar.userData.gulumse=.9;
      await dm.yaz("o","Merhabaa 🙂");
      await dm.yaz("o","Tanışıyor muyuz 😄");
      const c2=await dm.sec(["Henüz değil ama tanışacağız 🙂","Fotoğrafını gördüm, yazmadan duramadım."]);
      await dm.yaz("ben",["Henüz değil ama tanışacağız 🙂","Fotoğrafını gördüm, yazmadan duramadım."][c2]);
      await dm.yaz("o",c2===0?"Ooo iddialı 😄":"Kıyamam 🙈");
      await dm.yaz("o","Çok ciddisin ama");
      const c3=await dm.sec(["İlk başta ciddiyimdir, yılışmam.","Heyecandan, kusura bakma 😅"]);
      await dm.yaz("ben",["İlk başta ciddiyimdir, yılışmam.","Heyecandan, kusura bakma 😅"][c3]); this.ciddi=c3===0;
      await dm.yaz("o",c3===0?"Görücez 😄":"Heyecan mı yaptın şapşik kdkdkd");
      dm.zaman("03:12");
      await dm.yaz("o","Sabah oluyor yaa 😅");
      await dm.yaz("o","Yarın yine yazar mısın");
      await dm.yaz("ben","Her gece yazarım.");
      await dm.yaz("o","Tamam 🙂 İyi geceler");
      await bekle(900); DM.kapat(); ek.remove(); ICSAHNE=null;
      await anlat("O gece sabaha kadar yazıştık. Sonraki gece de. Ondan sonraki de.",3400);
      // aylar sonra: ders yardımı
      const dm2=DM.ac("kardelen","Instagram"); dm2.zaman("Aylar sonra · 23:05");
      await dm2.yaz("o","Bu soruyu çözemedim yaa 😩");
      await dm2.yaz("o","Sınava az kaldı");
      await dm2.yaz("o","2x + 6 = 14 ise x kaç?");
      const cevap=await dm2.sec(["x = 3","x = 4","x = 5","x = 10"]);
      await dm2.yaz("ben",["x = 3","x = 4","x = 5","x = 10"][cevap]);
      if(cevap===1){ await dm2.yaz("o","Doğruuu 😍"); await dm2.yaz("o","Sen olmasan bu matematik bitmezdi"); }
      else { await dm2.yaz("o","Hmm bence 4 çıkıyor 😄"); await dm2.yaz("o","14'ten 6 çıkınca 8, ikiye bölünce 4"); await dm2.yaz("ben","Seni sınıyordum 😅"); await dm2.yaz("o","Yalancııı kdkdkd"); }
      await dm2.yaz("o","Keşke görüşebilsek…");
      await dm2.yaz("ben","Yasaklar bitsin, izin çıksın, ilk fırsatta gelecem. Söz.");
      dm2.zaman("28 Ocak 2022 · 22:40");
      await dm2.yaz("ben","İzin çıktı! Yarın İzmit'teyim, haberin olsun 😄");
      await dm2.yaz("o","Ohaa gerçekten mi 😍");
      await dm2.yaz("o","Saat 11");
      await dm2.yaz("o","Meydanda, saat kulesinin dibi");
      await dm2.yaz("o","Geç kalma ama");
      await dm2.yaz("ben","Saniyesi saniyesine. Asker adamız 😉");
      await dm2.yaz("o","Artis kdkdkd");
      await bekle(900); DM.kapat();
      K.userData.telefon=0; K.userData.eldeki=null; this.tel.visible=false;
      await anlat("Yasaklar, okul, izinler… Aylarca sadece ekrandan konuştuk.",3200);
      await anlat("Neredeyse altı ay sonra izin çıktı. Yola çıktım.",3000);
    });
    await gecis(async()=>{ katmanTemizle(); await this.meydanKur(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await this.meydan();
  },
  async sahil(){
    const K=this.kaan, D=this.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(-40,9,22),new THREE.Vector3(10,1,-20));
      await kameraNoktasi(s=>new THREE.Vector3(-40+s*3,9-s*.8,22-s*1.2),new THREE.Vector3(10,1,-20),4.5);
      await kameraNoktasi(bas(K).add(new THREE.Vector3(1.6,.2,2)),bas(K).lerp(bas(D),.5),2.2);
      await anlat("Sonra gezdik. Soğuktu ama hiç umurumuzda değildi.",3000);
      yuzYuze(K,D);
      await konus("kardelen",["Sahile inelim mi","Kışın da güzel burası"],{gul:.8});
      await konus("kaan","Sen nereye, ben oraya.",{gul:.6});
      K.rotation.y=D.rotation.y=Math.PI/2;
    });
    gorev("Sahil boyunca birlikte yürüyün · iskeleye kadar");
    this.serbest=true; this.birlikte=true; gizliKalpler(this,[[-6,1.0,8.1,2]]);
    const sozler={
      korkuluk:[["kardelen",["İlk mesajını görünce","Kim bu ciddi çocuk dedim kdkdkd"]],["kaan",this.ciddi===false?"Heyecandandı, söylemiştim ya 😅":"İlk başta ciddiydim, yılışmam."],["kardelen",["Ben pas vermesem görürdün 😄","Unutma bunu"]]],
      bank:[["kardelen",["Sınav aklımdan çıkmıyor yaa","Ya heyecandan her şeyi unutursam"]],["kaan","Ssst. Matematiği ben hallederim, sen vazgeçme yeter."],["kardelen",["Bu akşam soru yok ama","Söz mü"]],["kaan","Söz. Bu akşam sadece deniz."]],
      iskele:[["kardelen",["Bazen gelmeyeceksin sandım","Biliyon mu"]],["kaan","Söz vermiştim. Geldim işte."]] };
    for(const n of this.noktalar){
      await kosul(()=>K.position.x>n.x-1.5);
      await sahne(async()=>{ this.birlikteDur=true; K.userData.hiz=0; D.userData.hiz=0; yuzYuze(K,D); for(const [kim,m] of sozler[n.ad]) await konus(kim,m,{gul:kim==="kardelen"?.9:.5}); this.birlikteDur=false; });
      if(n.ad!=="iskele") gorev("Sahil boyunca birlikte yürüyün · iskeleye kadar");
    }
    gorev("İskelenin ucuna yürüyün");
    await kosul(()=>K.position.x>44.5&&K.position.z<-7.5);
    this.serbest=false; this.birlikte=false; gorev(null);
    await sahne(async()=>{
      const U=this.iskeleUc;
      yuruHedef(D,U.clone().add(new THREE.Vector3(.38,0,.6)),1.5); await yuruHedef(K,U.clone().add(new THREE.Vector3(-.38,0,.6)),1.6);
      K.rotation.y=D.rotation.y=Math.PI; K.userData.bak=0; D.userData.bak=0;
      const m=U.clone();
      await kameraNoktasi(m.clone().add(new THREE.Vector3(0,1.5,4)),m.clone().add(new THREE.Vector3(0,1.3,-10)),2.4);
      await anlat("Akşam oldu, kış güneşi denize değerken bir süre hiç konuşmadık.",3000);
      yuzYuze(K,D);
      await konus("kaan","Elini tutabilir miyim?",{gul:.4});
      await kameraNoktasi(m.clone().add(new THREE.Vector3(.9,1.05,1.6)),m.clone().add(new THREE.Vector3(0,.95,.6)),1.1);
      await basiliTut("🤝 Elini tut · basılı tut",1.5);
      await konus("kardelen",["Bütün gün bunu mu bekledin","Şapşik 😄"],{gul:1});
      K.rotation.y=D.rotation.y=Math.PI; K.userData.elele=D.userData.elele=1; D.userData.kafa.rotation.z=-.22; Ses.efekt("buyuk");
      await kameraNoktasi(m.clone().add(new THREE.Vector3(0,1.4,3.2)),m.clone().add(new THREE.Vector3(0,1.15,0)),2);
      const q=el(`<div class="qte"><button class="btn qte-btn">📷 Bu anı sakla</button></div>`); katman.appendChild(q);
      await new Promise(r=>{ q.querySelector("button").onclick=r; }); q.remove();
      await hatiraFoto("İlk buluşma · İzmit · 29 Ocak 2022");
      await bekle(1800);
      let s=0; Kamera.sinema=dt=>{ s+=dt; camera.position.set(m.x+Math.sin(s*.08)*3,1.6+s*.5,m.z+4+s*1.2); camera.lookAt(m.x,1.2,m.z-20); };
      await anlat("2 Ağustos 2021'de bir mesajla başladı. 29 Ocak 2022'de, İzmit'te, bir kış günü ilk kez yan yana yürüdük.",4400);
      await anlat("O günden beri adımız tek: Biz.",3000);
    });
    bolumBitti(this.no);
  },
  guncelle(dt){
    this.t+=dt; const t=this.t; const K=this.kaan; dalgaGuncelle(t);
    if(this.faz==="oda"){
      const sinir=p=>{ p.x=clamp(p.x,-3.1,2.6); p.z=clamp(p.z,-2.2,2.6); p.y=0; };
      if(this.serbest&&!kilit) yuru(K,dt,sinir,1.8);
      if(this.telIsik&&this.telIsik.parent){ this.telIsik.material.opacity=.5+Math.sin(t*4)*.35; }
      etkilesimGuncelle(K,this.btn);
      if(!Kamera.sinema) Kamera.hedef.lerp(K.position,.12);
      return;
    }
    if(this.faz==="meydan"){ this.meydanGuncelle(dt); return; }
    if(this.faz==="kafe"){ if(!Kamera.sinema) Kamera.hedef.set(-3.75,.9,.6); return; }
    // sahil
    const D=this.kar; const ydt=dt; nefesGuncelle(this,[K,D],dt);
    if(this.su) this.su.material.uniforms.time.value=t*.55;
    for(const m of this.martilar){ const u=m.userData; u.a+=dt*.35; m.position.set(u.c.x+Math.cos(u.a)*u.r,u.h+Math.sin(u.a*2)*.6,u.c.z+Math.sin(u.a)*u.r*.5); m.rotation.y=-u.a; m.children.forEach((k,i)=>k.rotation.z=(i?1:-1)*(.25+Math.sin(t*6+u.a)*.35)); }
    const aksam=clamp(t/90,0,1); for(const l of this.lambalar) l.userData.f.material.emissiveIntensity=.2+aksam*1.6;
    const sinir=p=>{ p.x=clamp(p.x,-60,47.1); if(p.z<.9){ if(p.z>.5&&(p.x<44.95||p.x>47.05)) p.z=.9; else { p.x=clamp(p.x,44.95,47.05); p.z=Math.max(p.z,-12.9); } } else p.z=Math.min(p.z,8.5); p.y=0; }; // iskele dışında denize düşülmez
    if(this.serbest&&!kilit&&!this.birlikteDur){ yuru(K,ydt,sinir,2.4);
      if(this.birlikte){ // yan yana yürüme (el ele değil)
        const sag=new THREE.Vector3(Math.cos(K.rotation.y),0,-Math.sin(K.rotation.y)); const h=K.position.clone().addScaledVector(sag,-.75);
        D.position.lerp(h,1-Math.pow(.004,dt)); if(D.position.z<.9) D.position.x=clamp(D.position.x,44.9,47.1); let f=K.rotation.y-D.rotation.y; f=Math.atan2(Math.sin(f),Math.cos(f)); D.rotation.y+=f*Math.min(1,dt*6); D.userData.hiz=K.userData.hiz; D.userData.bakNokta=null; } }
    etkilesimGuncelle(K,this.btn);
    if(!Kamera.sinema) Kamera.hedef.lerp(this.birlikte?K.position.clone().lerp(D.position,.5):K.position,.1);
  },
  temizle(){ DM.kapat(); ICSAHNE=null; ZAMAN_OLCEK=1; Ses.denizDurdur(); this.buhar=[]; this.birlikteDur=false; }
};
