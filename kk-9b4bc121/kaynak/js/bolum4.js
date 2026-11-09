/* ================= BÖLÜM 6: PEMBE ELBİSE (22–29 Mayıs 2025) =================
   22 Mayıs Çorum: elbisesiyle aynı tonda kravat ("güneşteki hali / ışıksız hali"). 28 Mayıs Kastamonu: mezuniyet balosu —
   topuk koruyucu, "üşürsün" dediğim kot ceket, dans. 29 Mayıs: onun seçtiği kombin, bölüm birinciliği plaketi, bowling,
   sağanak yağmurda dönüş ("silecek yetişmedi"). */
function gulYap(){ const g=new THREE.Group(); const sap=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.36,5),mat("#2f6a2a")); sap.position.y=.18; g.add(sap);
  const c=new THREE.Mesh(new THREE.IcosahedronGeometry(.045,1),mat("#c8102e",{roughness:.6,flatShading:true})); c.position.y=.38; c.scale.y=1.2; g.add(c);
  const y=new THREE.Mesh(new THREE.PlaneGeometry(.05,.03),mat("#2f6a2a",{side:THREE.DoubleSide})); y.position.set(.02,.22,0); g.add(y); return g; }
const ELBISE_RENK="#f2a7bf";
// askıda kravat: düğüm yeri dar, uca doğru genişleyen sivri kumaş; ince diyagonal örgü
function kravatYap(renkH){ const s=new THREE.Shape(); s.moveTo(-.018,0); s.lineTo(-.026,-.12); s.lineTo(-.044,-.74); s.lineTo(0,-.8); s.lineTo(.044,-.74); s.lineTo(.026,-.12); s.lineTo(.018,0); s.lineTo(-.018,0);
  const geo=new THREE.ShapeGeometry(s); const t=kravatDoku(); const m=new THREE.MeshStandardMaterial({color:renk(renkH),map:t,roughness:.42,metalness:.05,side:THREE.DoubleSide,envMapIntensity:.8});
  const k=new THREE.Mesh(geo,m); k.castShadow=true; const g=new THREE.Group(); g.add(k); const kanca=new THREE.Mesh(new THREE.TorusGeometry(.03,.004,6,14,Math.PI),mat("#b9bcc2",{metalness:.8,roughness:.3})); kanca.position.y=.03; g.add(kanca); return g; }
function kravatDoku(){ if(kravatDoku.t) return kravatDoku.t; const c=document.createElement("canvas"); c.width=c.height=64; const x=c.getContext("2d"); x.fillStyle="#fff"; x.fillRect(0,0,64,64);
  x.strokeStyle="rgba(0,0,0,.1)"; x.lineWidth=2; for(let i=-64;i<128;i+=6){ x.beginPath(); x.moveTo(i,0); x.lineTo(i+64,64); x.stroke(); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(8,8); t.encoding=THREE.sRGBEncoding; t.__kalici=true; kravatDoku.t=t; return t; }
function renkFark(a,b){ const lab=h=>{ const c=new THREE.Color(h); let r=c.r,g=c.g,bb=c.b; const f=v=>v>.04045?Math.pow((v+.055)/1.055,2.4):v/12.92; r=f(r); g=f(g); bb=f(bb);
    let X=(r*.4124+g*.3576+bb*.1805)/.95047, Y=r*.2126+g*.7152+bb*.0722, Z=(r*.0193+g*.1192+bb*.9505)/1.08883; const q=v=>v>.008856?Math.cbrt(v):7.787*v+16/116; X=q(X); Y=q(Y); Z=q(Z); return [116*Y-16,500*(X-Y),200*(Y-Z)]; };
  const A=lab(a), B=lab(b); return Math.hypot(A[0]-B[0],A[1]-B[1],A[2]-B[2]); }
function lobutYap(){ const pts=[]; const p=[[0,0],[.026,0],[.04,.04],[.06,.11],[.056,.17],[.035,.24],[.026,.27],[.03,.31],[.034,.34],[.028,.37],[.0,.385]]; for(const [r,y] of p) pts.push(new THREE.Vector2(r,y));
  const g=new THREE.Group(); const m=new THREE.Mesh(new THREE.LatheGeometry(pts,18),mat("#f7f5f0",{roughness:.25,metalness:0})); m.castShadow=true; g.add(m);
  for(const y of [.255,.275]){ const s=new THREE.Mesh(new THREE.CylinderGeometry(.0275,.0275,.008,18,1,true),mat("#c41e2a",{roughness:.3})); s.position.y=y; g.add(s); } return g; }
function yagmurCamDoku(){ if(yagmurCamDoku.t) return yagmurCamDoku.t; const c=document.createElement("canvas"); c.width=c.height=512; const x=c.getContext("2d"); x.clearRect(0,0,512,512);
  // camdan süzülen ince izler (seyrek), sonra boncuk boncuk damlalar: üstte parlak kenar, altta koyu kırılma halkası
  for(let i=0;i<26;i++){ let px=Math.random()*512, py=Math.random()*400; x.strokeStyle=`rgba(215,228,245,${.1+Math.random()*.12})`; x.lineWidth=.8+Math.random()*.9; x.beginPath(); x.moveTo(px,py); for(let k=0;k<6;k++){ px+=rnd(-3,3); py+=rnd(8,22); x.lineTo(px,py); } x.stroke(); }
  for(let i=0;i<520;i++){ const px=Math.random()*512, py=Math.random()*512, r=Math.random()<.85?.8+Math.random()*2.2:2.6+Math.random()*2.6, oy=r*(1+Math.random()*.25);
    x.save(); x.translate(px,py); x.scale(1,oy/r);
    const g=x.createRadialGradient(0,r*.25,r*.2,0,0,r); g.addColorStop(0,"rgba(160,175,200,.10)"); g.addColorStop(.7,"rgba(120,135,160,.22)"); g.addColorStop(1,"rgba(40,50,70,.45)"); x.fillStyle=g; x.beginPath(); x.arc(0,0,r,0,7); x.fill();
    x.fillStyle="rgba(255,255,255,.75)"; x.beginPath(); x.arc(-r*.32,-r*.38,Math.max(.35,r*.22),0,7); x.fill(); x.restore(); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.__kalici=true; yagmurCamDoku.t=t; return t; }
function bildirimGoster(t){ const b=el(`<div class="bildirim"><b>Kardelen 💕</b><span>${t}</span></div>`); katman.appendChild(b); Ses.efekt("mesaj"); requestAnimationFrame(()=>b.classList.add("gor")); setTimeout(()=>{ b.classList.remove("gor"); setTimeout(()=>b.remove(),500); },2600); }
const B4={
  id:"pembe", no:6, ad:"Pembe Elbise", tarih:"28 Mayıs 2025", alt:"Aynı renk kravat, balo ve plaket",
  sahneY(x,z){ return (Math.abs(x)<4&&z<-15.2&&z>-19)?.6:0; },
  async kur(){ await this.dukkanKur(); },
  // ---------- 22 MAYIS, ÇORUM: KRAVAT ----------
  async dukkanKur(){
    this.faz="dukkan"; this.t=0; this.durum=null; DALGA=[]; ETK=[]; this.konfeti=[]; this.lambalar=[]; this.serbest=false; this.elele=false;
    sahneKur({sis:"#2a2420",sisYakin:12,sisUzak:40,ust:"#3a3430",ufuk:"#5a4a40",alt:"#2a2420",gunesYon:new THREE.Vector3(.4,.5,.7).normalize(),isikYon:new THREE.Vector3(.3,.8,.5),gunesRenk:"#ffe0b0",isik:"#ffe2c0",isikGuc:.9,zemin:"#4a3a30",hemi:.55,dolgu:.35,dolguRenk:"#ffd9b0"});
    const zem=new THREE.Mesh(new THREE.PlaneGeometry(14,10),mat("#6a4a34",{roughness:.55,bumpMap:gurultuDoku(10),bumpScale:.01})); zem.rotation.x=-Math.PI/2; zem.receiveShadow=true; scene.add(zem);
    const duvM=mat("#e9e2d6",{roughness:.95}); const arka=new THREE.Mesh(new THREE.PlaneGeometry(14,4),duvM); arka.position.set(0,2,-2.2); scene.add(arka);
    const yan=new THREE.Mesh(new THREE.PlaneGeometry(10,4),duvM); yan.rotation.y=Math.PI/2; yan.position.set(-4,2,2); scene.add(yan);
    const tavan=new THREE.Mesh(new THREE.PlaneGeometry(14,10),mat("#f2ede4")); tavan.rotation.x=Math.PI/2; tavan.position.y=3.4; scene.add(tavan);
    // pencere (gün ışığı), raf, askılar
    const pen=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.8),new THREE.MeshBasicMaterial({color:renk("#fff6e6")})); pen.rotation.y=Math.PI/2; pen.position.set(-3.98,1.8,.6); scene.add(pen);
    this.gunIsik=new THREE.DirectionalLight(renk("#fff7ee"),0); this.gunIsik.position.set(-6,3.5,1.5); this.gunIsik.target.position.set(0,1.4,-1.8); scene.add(this.gunIsik,this.gunIsik.target);
    this.dukIsik=new THREE.SpotLight(renk("#ffcf8a"),1.6,9,.6,.6,1.2); this.dukIsik.position.set(.2,3.3,.6); this.dukIsik.target.position.set(0,1.3,-2); scene.add(this.dukIsik,this.dukIsik.target);
    const raf=new THREE.Mesh(new THREE.BoxGeometry(3.2,.04,.35),mat("#3a2a20",{roughness:.5})); raf.position.set(0,2.35,-2.02); scene.add(raf);
    for(let i=0;i<9;i++){ const g=new THREE.Mesh(new THREE.BoxGeometry(.3,.06+Math.random()*.04,.25),mat(["#e9e6e0","#c7d3e2","#1f2430","#d9c7b0","#f2f2f2"][i%5],{roughness:.8})); g.position.set(-1.4+i*.35,2.41,-2.0); scene.add(g); } // katlanmış gömlekler
    const cub=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,2.6,8),mat("#b9bcc2",{metalness:.85,roughness:.25})); cub.rotation.z=Math.PI/2; cub.position.set(0,1.85,-1.95); scene.add(cub);
    const renkler=["#d98c8f",ELBISE_RENK,"#e06a92","#f7c9d4","#f4a68c","#ef8fae","#c9a3d9"]; this.kravatlar=[];
    renkler.forEach((r,i)=>{ const k=kravatYap(r); k.position.set(-1.05+i*.35,1.85,-1.95); k.userData={renk:r,i,hedefZ:0}; scene.add(k); this.kravatlar.push(k); });
    const ayna=new THREE.Mesh(new THREE.PlaneGeometry(.9,1.8),new THREE.MeshStandardMaterial({color:renk("#c9d3dc"),roughness:.05,metalness:.95})); ayna.position.set(2.4,1.3,-2.15); scene.add(ayna);
    const tezgah=new THREE.Mesh(new THREE.BoxGeometry(1.6,.95,.6),mat("#3a2a20",{roughness:.4})); tezgah.position.set(2.6,.48,.6); tezgah.castShadow=true; scene.add(tezgah);
    this.kaan=karakter("kaan","gunluk"); this.kaan.position.set(1.05,0,-.7); this.kaan.rotation.y=Math.PI; scene.add(this.kaan);
    this.kar=karakter("kardelen","gunluk"); this.kar.visible=false; this.kar.position.set(-30,0,0); scene.add(this.kar);
    this.tel=telefonYap(); this.tel.userData.telefon=true; this.tel.visible=false; scene.add(this.tel);
    KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    Kamera.sinema=null; Kamera.aci=0; Kamera.mesafe=4; Kamera.yukseklik=1.6; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(0,2,4);
    Ses.ton="sicak";
  },
  async basla(){
    katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle();
    const K=this.kaan;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(1.8,2,2.6),new THREE.Vector3(0,1.5,-1.9));
      baslikKarti(this.ad,[this.tarih,"Bölüm "+this.no]);
      await kameraNoktasi(s=>new THREE.Vector3(1.8-s*.2,2-s*.05,2.6-s*.15),new THREE.Vector3(0,1.5,-1.9),4.6);
      await anlat("22 Mayıs, Çorum. Balosuna bir hafta vardı.");
      this.tel.visible=true; eldeTut(K,this.tel,"S"); K.userData.telefon=2; K.rotation.y=0;
      await kameraNoktasi(ondenNokta(K,1.3,.3,.06),bas(K).add(new THREE.Vector3(0,-.1,0)),1);
      const dm=DM.ac("Kardelen 💕","çevrimiçi"); dm.zaman("21:40");
      await dmResim("o",this.elbiseResmi()); await dm.yaz("o","Elbisem bu 🙈"); await dm.yaz("o","İlk defa isteyerek pembe aldım"); await dm.yaz("o","Nasıl");
      const c=await dm.sec(["Çok güzel minnakım 😍","Bayılacaklar 😍"]); await dm.yaz("ben",c?"Bayılacaklar 😍":"Çok güzel minnakım 😍");
      await bekle(500); DM.kapat(); K.userData.telefon=0; K.userData.eldeki=null; this.tel.visible=false; K.rotation.y=Math.PI;
      await anlat("Ona söylemedim. Ertesi gün aynı tonda bir kravat aramaya çıktım.",3000);
    });
    await this.kravatSec();
    await gecis(async()=>{ katmanTemizle(); await this.baloKur(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await this.balo();
  },
  elbiseResmi(){ if(this._elbise) return this._elbise; const c=document.createElement("canvas"); c.width=360; c.height=420; const x=c.getContext("2d"); const g=x.createLinearGradient(0,0,0,420); g.addColorStop(0,"#f4efe9"); g.addColorStop(1,"#e2d9cf"); x.fillStyle=g; x.fillRect(0,0,360,420);
    x.fillStyle="#d9d2c8"; x.fillRect(176,20,8,40); x.strokeStyle="#9a958c"; x.lineWidth=4; x.beginPath(); x.arc(180,62,14,Math.PI,0); x.stroke(); // askı
    x.fillStyle=ELBISE_RENK; x.beginPath(); x.moveTo(140,80); x.lineTo(220,80); x.lineTo(232,170); x.lineTo(212,190); x.lineTo(268,360); x.quadraticCurveTo(180,385,92,360); x.lineTo(148,190); x.lineTo(128,170); x.closePath(); x.fill();
    x.fillStyle="rgba(0,0,0,.08)"; for(let i=0;i<6;i++){ x.beginPath(); x.moveTo(170+i*4-10,195); x.lineTo(120+i*28,360); x.lineTo(126+i*28,362); x.lineTo(174+i*4-10,195); x.fill(); }
    x.fillStyle="rgba(255,255,255,.25)"; x.fillRect(150,95,10,70);
    return this._elbise=c.toDataURL("image/jpeg",.85); },
  // askıdaki kravatlardan elbisesiyle aynı tonu bul; pencerede (güneşte) ve dükkân ışığında karşılaştır
  async kravatSec(){
    const K=this.kaan;
    const kd=()=>{ const hf=Math.atan(Math.tan(camera.fov*Math.PI/360)*camera.aspect); return clamp(1.18/Math.tan(hf),1.6,4.6); }; // askının tamamı görünsün
    await sahne(async()=>{
      await kameraNoktasi(new THREE.Vector3(-.2,1.62,-1.95+kd()),new THREE.Vector3(0,1.55,-1.95),1.4);
      let sec_=-1, gunes=false;
      const ui=el(`<div class="sim kravat-ui"><div class="baslik">Aynı tonu bul</div><div class="ipucu">Elbisenin rengine en yakın kravatı seç. Güneşte de bak.</div>
        <div class="satir"><div class="elbise-ornek"><img alt=""></div><div class="sec-renkler">${this.kravatlar.map((k,i)=>`<button class="renk-btn" data-i="${i}">${i+1}</button>`).join("")}</div></div>
        <div class="satir"><button class="gunes">☀ Pencerede bak</button><button class="tamam" disabled>Bunu al</button></div></div>`);
      ui.querySelector(".elbise-ornek img").src=this.elbiseResmi(); katman.appendChild(ui);
      const isikAyarla=()=>{ this.gunIsik.intensity=gunes?2.6:0; this.dukIsik.intensity=gunes?.5:1.6; this.dukIsik.color.copy(renk(gunes?"#fff4e8":"#ffcf8a")); ui.querySelector(".gunes").textContent=gunes?"💡 Dükkân ışığı":"☀ Pencerede bak"; };
      ui.querySelector(".gunes").onclick=()=>{ gunes=!gunes; isikAyarla(); Ses.efekt("vuru",.4); };
      ui.querySelectorAll(".renk-btn").forEach(b=>b.onclick=()=>{ sec_=+b.dataset.i; ui.querySelectorAll(".renk-btn").forEach(x=>x.classList.toggle("secili",x===b)); ui.querySelector(".tamam").disabled=false; Ses.efekt("vuru",.4);
        this.kravatlar.forEach((k,i)=>{ k.userData.hedefZ=i===sec_?.25:0; }); });
      while(true){
        await new Promise(r=>{ ui.querySelector(".tamam").onclick=r; });
        const k=this.kravatlar[sec_], fark=renkFark(k.userData.renk,ELBISE_RENK);
        ui.style.display="none";
        // iki fotoğraf: güneşte ve dükkân ışığında
        await kameraNoktasi(new THREE.Vector3(k.position.x+.08,1.62,-.98),new THREE.Vector3(k.position.x,1.5,-1.95),.8);
        gunes=true; isikAyarla(); await bekle(300); const f1=await kareAl(300); gunes=false; isikAyarla(); await bekle(300); const f2=await kareAl(300);
        this.tel.visible=true; eldeTut(K,this.tel,"S"); K.userData.telefon=2;
        const dm=DM.ac("Kardelen 💕","çevrimiçi"); dm.zaman("Ertesi gün");
        await dmResim("ben",f1); await dm.yaz("ben","Bak, güneşte böyle duruyor"); await dmResim("ben",f2); await dm.yaz("ben","Dükkân ışığında da böyle");
        let tamam=false;
        if(fark<7){ await dm.yaz("o","Aaa"); await dm.yaz("o","Bu tam benim elbisenin rengi 😍"); await dm.yaz("ben","Ondan aldım işte 😄"); await dm.yaz("o","Nereden buldun bunu kdkdkd"); await dm.yaz("ben","Çorum'da buldum, şansıma 😄"); await dm.yaz("o","Oleyyy"); tamam=true; }
        else if(fark<20){ await dm.yaz("o","Güzelmiş ama"); await dm.yaz("o","Benimki biraz daha farklı gibi"); await dm.yaz("o","Bir daha bak 🙈"); }
        else { await dm.yaz("o","Bu hangi renk kdkdkd"); await dm.yaz("o","Elbiseme bak bir daha"); }
        await bekle(600); DM.kapat(); K.userData.telefon=0; K.userData.eldeki=null; this.tel.visible=false;
        if(tamam) break;
        await kameraNoktasi(new THREE.Vector3(-.2,1.62,-1.95+kd()),new THREE.Vector3(0,1.55,-1.95),.8); ui.style.display="";
      }
      ui.remove();
    });
  },
  // ---------- 28 MAYIS, KASTAMONU: BALO ----------
  async baloKur(){
    this.faz="balo";
    const gy=new THREE.Vector3(-.3,.6,-.6).normalize();
    sahneKur({sis:"#1a1630",sisYakin:25,sisUzak:120,ust:"#0c0f2a",ufuk:"#3a2c55",alt:"#140f22",gunesYon:gy,gunesRenk:"#cfd8ff",isik:"#b7c3ff",isikGuc:.55,zemin:"#2a2350",hemi:.5,yildiz:1,parlak:.5,dolgu:.45,dolguRenk:"#ffc9e0"});
    this.t=0; this.durum=null; DALGA=[]; ETK=[]; this.vurus=0; this.konfeti=[];
    scene.add(cimZemin(200,200,"#2f4a2a","#3c5a33",50));
    const pc=document.createElement("canvas"); pc.width=pc.height=256; const px=pc.getContext("2d"); for(let i=0;i<16;i++){ px.fillStyle=`hsl(28,${35+Math.random()*10}%,${32+Math.random()*10}%)`; px.fillRect(0,i*16,256,15); }
    const ptx=new THREE.CanvasTexture(pc); ptx.encoding=THREE.sRGBEncoding; ptx.wrapS=ptx.wrapT=THREE.RepeatWrapping; ptx.repeat.set(3,3);
    this.pist=new THREE.Mesh(new THREE.CircleGeometry(6,48),new THREE.MeshStandardMaterial({map:ptx,roughness:.35,metalness:.05})); this.pist.rotation.x=-Math.PI/2; this.pist.position.set(0,.02,-6); this.pist.receiveShadow=true; scene.add(this.pist);
    const sh=new THREE.Mesh(new THREE.BoxGeometry(8,.6,3.8),mat("#1d1a26",{roughness:.6})); sh.position.set(0,.3,-17.1); sh.castShadow=true; sh.receiveShadow=true; scene.add(sh);
    const perde=new THREE.Mesh(new THREE.PlaneGeometry(9,4.5),mat("#f3c6d4",{roughness:.9,side:THREE.DoubleSide})); perde.position.set(0,2.8,-19); scene.add(perde);
    const yazi=new THREE.Mesh(new THREE.PlaneGeometry(6,1),new THREE.MeshBasicMaterial({map:yaziDoku("MEZUNİYET BALOSU",{w:1024,h:170,renk:"#7a2a44",font:"italic 600 96px Georgia"}),transparent:true})); yazi.position.set(0,3.9,-18.95); scene.add(yazi);
    const kemer=new THREE.Group(); kemer.position.set(0,0,14); scene.add(kemer);
    const km=new THREE.Mesh(new THREE.TorusGeometry(1.9,.12,8,24,Math.PI),mat("#f2efe8")); km.position.y=1.9; kemer.add(km);
    for(let i=0;i<26;i++){ const a=i/25*Math.PI; const c=new THREE.Mesh(new THREE.IcosahedronGeometry(.18,1),mat(["#f4a9be","#ffffff","#f7c6d3"][i%3],{roughness:.8,flatShading:true})); c.position.set(Math.cos(a)*1.9,1.9+Math.sin(a)*1.9,0); kemer.add(c); }
    for(const x of [-1.9,1.9]){ const d=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,1.9,8),mat("#f2efe8")); d.position.set(x,.95,0); d.userData.engel=.15; kemer.add(d); }
    // giriş masası ve görevli (topuk koruyucu)
    this.masaG=new THREE.Group(); this.masaG.position.set(4.6,0,11); this.masaG.rotation.y=-.5; this.masaG.userData.engel={kutu:[.85,.4]}; scene.add(this.masaG);
    const tz=new THREE.Mesh(new THREE.BoxGeometry(1.6,.9,.7),mat("#f2efe8")); tz.position.y=.45; tz.castShadow=true; this.masaG.add(tz);
    for(let i=0;i<5;i++){ const p=new THREE.Mesh(new THREE.BoxGeometry(.09,.02,.14),mat(["#e8d9c8","#ffffff"][i%2])); p.position.set(-.5+i*.22,.91,.05); this.masaG.add(p); }
    const gl=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.25),new THREE.MeshBasicMaterial({map:yaziDoku("KARŞILAMA",{w:512,h:96,zemin:"#7a2a44",renk:"#f6ead2",font:"600 54px Georgia"})})); gl.position.set(0,.65,.36); this.masaG.add(gl);
    this.gorevli=kalabalik("rpm",{resmi:true,ust:"#111114",alt:"#111114",anim:"idle",sac:"#151515"}); if(this.gorevli){ this.gorevli.position.set(5.0,0,10.0); this.gorevli.rotation.y=Math.PI-.5; scene.add(this.gorevli); }
    for(let i=0;i<10;i++){ const a=i/10*Math.PI*2+.3, r=11; const m=masa(.75); m.position.set(Math.cos(a)*r,0,-4+Math.sin(a)*r*.75); if(m.position.z>9) continue; scene.add(m);
      for(let k=0;k<4;k++){ const s=sandalye(); const b=k/4*Math.PI*2; s.position.set(m.position.x+Math.cos(b)*1.1,0,m.position.z+Math.sin(b)*1.1); s.rotation.y=-b-Math.PI/2; scene.add(s); } }
    const kutup=[[-12,-14],[12,-14],[12,6],[-12,6]];
    for(const [x,z] of kutup){ const d=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,4.6,6),mat("#2a2a2e")); d.position.set(x,2.3,z); d.userData.engel=.1; scene.add(d); }
    const P=(x,z)=>new THREE.Vector3(x,4.5,z);
    this.lambalar=[ipLambalar([P(-12,-14),P(12,6)],"#ffd9a0",.6), ipLambalar([P(12,-14),P(-12,6)],"#ffd9a0",.6), ipLambalar([P(-12,-14),P(12,-14),P(12,6),P(-12,6),P(-12,-14)],"#ffcfe0",.4), ipLambalar([P(-12,-4),P(12,-4)],"#ffd9a0",.5)];
    this.lambalar.forEach(l=>scene.add(l));
    this.pistIsik=new THREE.PointLight(renk("#ff9fb4"),1.2,18,1.5); this.pistIsik.position.set(0,4,-6); scene.add(this.pistIsik);
    for(let i=0;i<14;i++){ const ang=i/14*Math.PI*2; if(Math.sin(ang)>.85) continue; /* giriş yolunun arkası boş: takip kamerası ağacın içine girip ekranı karartıyordu */ const a=agac(i%3?"yesil":"selvi",rnd(1,1.4)); a.position.set(Math.cos(ang)*rnd(22,30),0,-4+Math.sin(ang)*rnd(20,26)); a.userData.kameraEngel=true; scene.add(a); }
    // misafirler: dans edenler pistin uzak yarısında, yakın plana girmezler
    this.misafir=[];
    const elbise=["#d9c9d2","#c9d2e2","#e2d2c4","#d2c6de"];
    for(let i=0;i<4;i++){ const c=kalabalik("michelle",{anim:"samba",ton:elbise[i%4],boy:rnd(.96,1.04)}); if(!c) continue; const a=Math.PI*(1.2+i*.2); c.position.set(Math.cos(a)*5.2,0,-6+Math.sin(a)*5.2); /* pistin uzak kenarında (7.4 m'de masaların içine düşüyorlardı) */ c.rotation.y=-a-Math.PI/2; if(c.userData.temel) c.userData.temel.timeScale=rnd(.5,.62); scene.add(c); this.misafir.push(c); }
    for(let i=0;i<8;i++){ const c=kalabalik("rpm",{resmi:true,ust:["#17171c","#2a2f45","#3a2a2a"][i%3],alt:"#141418",boy:rnd(.97,1.03)}); if(!c) continue; c.position.set(rnd(-10,10),0,rnd(-13,3)); if(Math.hypot(c.position.x,c.position.z+6)<6.8) c.position.x+=c.position.x<0?-6.5:6.5; c.rotation.y=rnd(0,6); c.userData.engelKisi=true; scene.add(c); this.misafir.push(c); }
    this.arkadas=[];
    for(let i=0;i<3;i++){ const c=kalabalik("michelle",{ton:["#d9f0ff","#fff1c9","#e9ffe9"][i],boy:rnd(.96,1.02)}); if(!c) continue; scene.add(c); this.arkadas.push(c); }
    await Promise.all([takimHazirla(),pembeHazirla()]);
    this.kaan=karakter("kaan","takim"); this.kar=karakter("kardelen","pembe");
    this.kaan.position.set(0,0,17); this.kaan.rotation.y=Math.PI; this.kar.position.set(-8.5,0,1.5); this.kar.rotation.y=Math.PI*.3; scene.add(this.kaan,this.kar);
    this.arkadas.forEach((c,i)=>{ const a=i/3*Math.PI*1.4-1.1; c.position.set(-8.5+Math.sin(a+Math.PI*.3)*1.4,0,1.5+Math.cos(a+Math.PI*.3)*1.4); c.lookAt(this.kar.position.x,0,this.kar.position.z); });
    KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    this.paket=new THREE.Mesh(new THREE.BoxGeometry(.09,.02,.14),mat("#e8d9c8")); this.paket.visible=false; scene.add(this.paket);
    Kamera.sinema=null; Kamera.aci=0; Kamera.mesafe=6; Kamera.yukseklik=2.5; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(0,4,24);
    Ses.ton="gece";
  },
  async balo(){
    const K=this.kaan, D=this.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(16,9,-20),new THREE.Vector3(0,1,-4));
      await kameraNoktasi(s=>new THREE.Vector3(16-s*2,9-s*.5,-20+s*3),new THREE.Vector3(0,1,-4),6);
      await kameraNoktasi(new THREE.Vector3(1.6,1.9,19.5),bas(K),2.4);
      await anlat("28 Mayıs, Kastamonu. Onun mezuniyet balosu.");
      await anlat("Birkaç gün sonra çok uzağa gidecektim. Ama önce buradaydım. Bunu kaçıramazdım.");
    });
    // telefon: topuk koruyucu
    bildirimGoster("Geldin mi"); await bekle(1400); bildirimGoster("Görevliye sor, topuk koruyucu var mı"); await bekle(1600); bildirimGoster("Topuklar çime batıyor kdkdkd");
    gorev("Girişteki görevliden topuk koruyucu iste");
    this.serbest=true; gizliKalpler(this,[[2.6,1.0,-13.4,0],[-12.5,1.0,8,1],[12,1.0,4.5,2]]);
    await etkBekle(this.masaG,"Topuk koruyucu iste",{mesafe:2.2,isaretY:1.4});
    this.serbest=false;
    await sahne(async()=>{ K.userData.hiz=0; if(this.gorevli) cevir(K,this.gorevli.position);
      await kameraNoktasi(ondenNokta(K,1.6,.6,.1),bas(K),.8);
      await anlat("Görevli gülümseyip küçük bir paket uzattı. Bir çift şeffaf topuk koruyucu.",2600);
      this.paket.visible=true; eldeTut(K,this.paket,"S"); Ses.efekt("parilti"); });
    gorev("Kardelen'i bul");
    this.serbest=true;
    await kosul(()=>K.position.distanceTo(D.position)<6);
    D.userData.bakNokta=bas(K);
    await etkBekle(D,"Yanına git",{mesafe:2.2,isaretY:2});
    this.serbest=false; gorev(null);
    await sahne(async()=>{
      await yuruHedef(K,D.position.clone().add(new THREE.Vector3(.6,0,1.1)),1.2); yuzYuze(K,D); D.userData.bakNokta=null;
      await konus("kardelen",["Geldin 😍","Buldun mu"],{gul:1});
      await konus("kaan","Topuk koruyucu, haberin olsun 😄",{gul:.7});
      K.userData.eldeki=null; this.paket.visible=false; Ses.efekt("parilti");
      await konus("kardelen",["Kurtardın beni","Topuklar çime batıyordu"],{gul:1});
      // elbiseyi göstermek için döner
      D.userData.gulumse=1; let a0=D.rotation.y; let s=0;
      Kamera.sinema=dt=>{ s+=dt; D.rotation.y=a0+Math.min(1,s/1.6)*Math.PI*2; camera.position.copy(K.position).add(new THREE.Vector3(.5,1.55,.6)); camera.lookAt(D.position.x,1.1,D.position.z); };
      await bekle(1800); yuzYuze(K,D);
      await konus("kardelen",["Nasıl olmuş","Elbise diyorum"],{gul:1});
      const c=await sec(["Nefesim kesildi.","Pembe sana çok yakışıyor."]);
      if(c===0){ await konus("kaan","Nefesim kesildi. Gerçekten.",{gul:.6}); await konus("kardelen",["Abartma 😄","Ama devam et"],{gul:1}); }
      else { await konus("kaan","Pembe sana çok yakışıyor.",{gul:.6}); await konus("kardelen",["İlk defa isteyerek pembe aldım","İyi ki almışım"],{gul:1}); }
      await konus("kardelen",["Dur bir dakika","Kravatın","Elbisemle aynı renk 😍"],{gul:1});
      { const o=K.position.clone().lerp(D.position,.5); await kameraNoktasi(o.clone().add(new THREE.Vector3(.9,1.25,.7)),o.clone().add(new THREE.Vector3(0,1.15,0)),.8); }
      await konus("kaan","Ondan aldım işte. Kimse fark etmez sandım 😄",{gul:.8,kamera:false});
      await konus("kardelen",["Herkes fark etti","Arkadaşlar bakıyor şu an kdkdkd"],{gul:1});
      await bekle(300);
      await konus("kardelen",["Biraz üşüdüm ama"],{gul:.5});
      const c2=await sec(["Kot ceketini getirdim. Demiştim üşürsün diye 😄","Ceketimi vereyim mi?"]);
      if(c2===0){ await konus("kaan","Kot ceketini getirdim. Demiştim üşürsün diye 😄",{gul:.8}); }
      else { await konus("kaan","Ceketimi vereyim mi?",{gul:.6}); await konus("kardelen",["Takımın bozulur","Kot ceketim arabadaydı ya"],{gul:.8}); await konus("kaan","Arabadan aldım bile 😄",{gul:.8}); }
      await gecis(async()=>{ kotGiy(D,true); });
      await konus("kardelen",["Haklıymışsın","Ama söyleme kdkdkd"],{gul:1});
      await konus("kaan","Bu gece senin gecen. Dans?",{gul:.7});
      await konus("kardelen",["Hadi"],{gul:1});
    });
    gorev("Dans pistine çıkın");
    this.serbest=true; this.elele=true;
    { const pm=new THREE.Object3D(); pm.position.set(0,0,-6); scene.add(pm); await etkBekle(pm,"Dansa kaldır 💃",{mesafe:3,isaretY:1.2}); }
    this.serbest=false; this.elele=false;
    await this.dans();
  },
  async dans(){
    const K=this.kaan, D=this.kar;
    this.durum="dans"; this.merkez=new THREE.Vector3(0,0,-6); this.dansA=Math.atan2(K.position.x,K.position.z+6); this.vurus=0; this.ritimT=0; this.ritimSure=1.5; this.dansIlerle=0;
    this._dansK0=K.position.clone(); this._dansD0=D.position.clone(); this._dansG=0; // dans halkasına süzülerek geçerler (bir anda yer değiştirmezler)
    K.userData.elele=D.userData.elele=0; K.userData.dans=D.userData.dans=1;
    gorev("Halka kalbe değdiğinde dokun · 0 / 8");
    const j=katman.querySelector(".joy"); if(j) j.style.opacity=0;
    this.ritimEl=el(`<div class="ritim"><div class="hedefh"></div><div class="daire"></div></div>`); katman.appendChild(this.ritimEl);
    aksiyonYazi(this.btn,"Şimdi!");
    Kamera.sinema=dt=>{ const a=this.t*.22; camera.position.set(Math.sin(a)*3.4,1.9,-6+Math.cos(a)*3.4); camera.lookAt(0,1.3,-6); };
    await kosul(()=>this.vurus>=8);
    this.ritimEl.remove(); this.ritimEl=null; aksiyonYazi(this.btn,null); gorev(null); this.durum="sakin";
    await sahne(async()=>{
      Ses.efekt("buyuk"); K.userData.dans=D.userData.dans=0; K.userData.hiz=D.userData.hiz=0; yuzYuze(K,D); K.userData.saril=D.userData.saril=1; D.userData.kafa.rotation.z=-.2;
      let s=0; Kamera.sinema=dt=>{ s+=dt; const a=.6+s*.12; camera.position.set(Math.sin(a)*2.6,1.7,-6+Math.cos(a)*2.6); camera.lookAt(0,1.45,-6); };
      await anlat("O gece hiç oturmadık.",3000);
      await anlat("Ertesi sabah aynı bahçede başka bir tören vardı: onun töreni.",3200);
    });
    await this.sabah();
  },
  // ---------- 29 MAYIS: KOMBİN, PLAKET ----------
  async sabah(){
    let K=this.kaan; const D=this.kar;
    // kombini o seçer: siyah gömlek, kemer
    await sahne(async()=>{
      K.userData.saril=D.userData.saril=0; D.userData.kafa.rotation.z=0;
      const dm=DM.ac("Kardelen 💕","çevrimiçi"); dm.zaman("Ertesi sabah");
      await dm.yaz("o","Hangisini giyiyorsun"); await dm.yaz("o","Tören için diyorum");
      let ok=false;
      while(!ok){ const c=await dm.sec(["Siyah gömlek","Gri gömlek","Siyah tişört"]); await dm.yaz("ben",["Siyah gömlek","Gri gömlek","Siyah tişört"][c]);
        if(c===0){ await dm.yaz("o","Bu"); await dm.yaz("o","Kemerini tak"); await dm.yaz("ben","Senin aldığın kemer, takılı bile 😄"); await dm.yaz("o","İşte bu kocam 😌"); ok=true; }
        else if(c===1){ await dm.yaz("o","Gri olmaz bugün"); await dm.yaz("o","Hem makinedeydi o kdkdkd"); }
        else { await dm.yaz("o","Tişört mü"); await dm.yaz("o","Plaket alacağım ya 🙄"); } }
      await bekle(500); DM.kapat();
    });
    await gecis(async()=>{
      const gok=scene.userData.gok.material.uniforms; gok.ust.value.copy(renk("#6f9be0")); gok.ufuk.value.copy(renk("#ffe9d2")); gok.yildiz.value=0; gok.parlak.value=1; gok.gunes.value.set(.4,.6,.5).normalize();
      scene.userData.gun.intensity=2.4; scene.userData.gun.color.copy(renk("#fff0d8")); scene.fog.color.copy(renk("#e9eef2")); scene.fog.near=60; scene.fog.far=260;
      scene.children.filter(o=>o.isHemisphereLight).forEach(h=>{ h.intensity=.85; h.color.copy(renk("#dfe8ff")); h.groundColor.copy(renk("#6a7a4a")); });
      this.lambalar.forEach(l=>l.visible=false); this.pistIsik.intensity=0;
      this.misafir.forEach((c,i)=>{ if(c.userData.eylem.samba){ c.userData.eylem.samba.stop(); c.userData.eylem.idle.play(); } c.position.set(-8.6+(i%6)*1.9,0,-9.8+Math.floor(i/6)*1.5); c.rotation.y=Math.PI; c.userData.alkis=0; });
      this.arkadas.forEach((c,i)=>{ c.position.set(-3.2-i*1.3,0,-12.4); c.rotation.y=Math.PI; });
      // Kaan siyah gömlekle
      const yeni=karakter("kaan","deri"); yeni.position.set(1.6,0,-11); yeni.rotation.y=Math.PI; scene.remove(K); scene.add(yeni); this.kaan=K=yeni; KONUSANLAR.kaan=yeni;
      kotGiy(D,false); D.position.set(-2.6,.6,-17); D.rotation.y=Math.PI/2;
      this.plaket=new THREE.Mesh(new THREE.BoxGeometry(.32,.24,.03),mat("#3a2a5a",{roughness:.4})); const ic=new THREE.Mesh(new THREE.PlaneGeometry(.26,.18),mat("#d9b45a",{metalness:.8,roughness:.3})); ic.position.z=.016; this.plaket.add(ic); this.plaket.visible=false; scene.add(this.plaket);
    });
    await sahne(async()=>{
      await kameraNoktasi(new THREE.Vector3(4.6,3.0,-5.4),new THREE.Vector3(-1,1.4,-17),.01);
      await anlat("Dereceye girenler sahneye çağrıldı. Bölüm birincisi: onun adı okundu.",3200);
      this.misafir.concat(this.arkadas).forEach(c=>c.userData.alkis=1); K.userData.alkis=1; K.userData.gulumse=1; Ses.efekt("alkis");
      await yuruHedef(D,new THREE.Vector3(0,.6,-16.8),1.1,{yer:()=>.6}); D.rotation.y=0;
      gogusteTut(D,this.plaket); D.userData.gulumse=1;
      await bekle(1200); this.misafir.concat(this.arkadas).forEach(c=>c.userData.alkis=0); K.userData.alkis=0;
      await anlat("Telefonumu çıkardım. Bu kareyi kaçıramazdım.",2400);
    });
    // Kaan sahnedeki onu çeker (netlik ibresi)
    await sahne(async()=>{ await fotoModu(K,D,{baslik:"Bölüm birincisi · 29 Mayıs 2025",bakY:1.25,fov:30,pozlar:["plaket"]}); D.userData.kolPoz="plaket"; });
    await sahne(async()=>{
      await kameraNoktasi(new THREE.Vector3(2.2,1.7,-8.5),bas(K),1.2);
      await anlat("O kadar kişinin önünde plaketini aldı. Ondan daha çok ben gurur duydum.",3400);
      await yuruHedef(D,new THREE.Vector3(2.6,.6,-16),1.2,{yer:()=>.6}); await yuruHedef(D,new THREE.Vector3(2.4,0,-13),1.2,{yer:(x,z)=>this.sahneY(x,z)});
      await yuruHedef(D,K.position.clone().add(new THREE.Vector3(-.2,0,-1)),2.6);
      yuzYuze(K,D); gogustenBirak(D,this.plaket,"D"); // konuşurken plaket yanında, elinde
      await konus("kardelen",["Bölüm birincisi 🥹","İnanamıyorum"],{gul:1});
      await konus("kaan","Ben hep inandım. Sen inanmayınca bile.",{gul:.8});
      await konus("kardelen",["İyi ki geldin","Sen de oradaydın"],{gul:.8});
      await konus("kaan","Gitmeden önce bunu görmem lazımdı.",{gul:.6});
      await konus("kardelen",["Şimdi gitmeyi açma","Önce bowling 😄"],{gul:1});
    });
    await gecis(async()=>{ katmanTemizle(); await this.bowlingKur(); katmanTemizle(); ustDugmeler(); this.btn=aksiyonEkle(); });
    await this.bowling();
  },
  // ---------- BOWLING ----------
  async bowlingKur(){
    this.faz="bowling"; this.t=0; ETK=[]; DALGA=[];
    sahneKur({sis:"#120f1c",sisYakin:20,sisUzak:60,ust:"#1a1428",ufuk:"#2a1d3a",alt:"#120f1c",gunesYon:new THREE.Vector3(0,1,0),isikYon:new THREE.Vector3(.2,1,.3),gunesRenk:"#ffffff",isik:"#fff1e0",isikGuc:.9,zemin:"#2a2030",hemi:.6,dolgu:.5,dolguRenk:"#c9a0ff"});
    Ses.ortam("kalabalik",.5);
    const tc=document.createElement("canvas"); tc.width=64; tc.height=512; const tx=tc.getContext("2d"); for(let i=0;i<8;i++){ tx.fillStyle=`hsl(32,${40+Math.random()*12}%,${58+Math.random()*10}%)`; tx.fillRect(i*8,0,8,512); }
    tx.fillStyle="#7a2a2a"; for(let i=0;i<7;i++){ tx.beginPath(); tx.moveTo(4+i*9,140); tx.lineTo(8+i*9,128); tx.lineTo(12+i*9,140); tx.fill(); }
    const tt=new THREE.CanvasTexture(tc); tt.encoding=THREE.sRGBEncoding; tt.anisotropy=8;
    for(let p=-2;p<=2;p++){ const x=p*2.2; const yol=new THREE.Mesh(new THREE.PlaneGeometry(1.06,19),new THREE.MeshStandardMaterial({map:tt,roughness:.18,metalness:.05,envMapIntensity:1.2})); yol.rotation.x=-Math.PI/2; yol.position.set(x,.01,-9.5); yol.receiveShadow=true; scene.add(yol);
      for(const s of [-1,1]){ const o=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,19,10,1,true,0,Math.PI),mat("#2a2a30",{roughness:.4,side:THREE.DoubleSide})); o.rotation.x=Math.PI/2; o.rotation.z=Math.PI; o.position.set(x+s*.65,.1,-9.5); scene.add(o); }
      const ay=new THREE.Mesh(new THREE.BoxGeometry(.3,.05,19),mat("#3a2f45")); ay.position.set(x+1.1,.06,-9.5); scene.add(ay); }
    const arka=new THREE.Mesh(new THREE.PlaneGeometry(14,3.5),mat("#120f1c")); arka.position.set(0,1.75,-19.6); scene.add(arka);
    const neon=new THREE.Mesh(new THREE.PlaneGeometry(9,.6),new THREE.MeshBasicMaterial({map:yaziDoku("BOWLING",{w:1024,h:96,renk:"#ff7ad9",font:"800 76px Arial"}),transparent:true})); neon.position.set(0,3.1,-19.5); scene.add(neon);
    for(let p=-2;p<=2;p++){ const l=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.08),new THREE.MeshBasicMaterial({color:renk(["#6af0ff","#ff7ad9","#ffd56a","#7aff9c","#b98aff"][p+2])})); l.position.set(p*2.2,2.6,-19.45); scene.add(l); }
    const tav=new THREE.Mesh(new THREE.PlaneGeometry(14,24),mat("#0e0c16")); tav.rotation.x=Math.PI/2; tav.position.set(0,3.6,-8); scene.add(tav);
    // tavanda şerit ışıklar, lobutların üstünde aydınlık maske paneli, yan duvarlarda neon, kulvar başında skor ekranları
    const serit=new THREE.MeshBasicMaterial({color:renk("#fff3e2")}); for(let p=-2;p<=2;p++) for(let k=0;k<5;k++){ const m=new THREE.Mesh(new THREE.PlaneGeometry(.16,1.9),serit); m.rotation.x=Math.PI/2; m.position.set(p*2.2,3.58,-2-k*3.4); scene.add(m); }
    const mc=document.createElement("canvas"); mc.width=512; mc.height=64; const mx=mc.getContext("2d"); const mg=mx.createLinearGradient(0,0,512,0); ["#2b1a5a","#7a2a8a","#2a6ab0","#7a2a8a","#2b1a5a"].forEach((c,i)=>mg.addColorStop(i/4,c)); mx.fillStyle=mg; mx.fillRect(0,0,512,64); mx.fillStyle="rgba(255,255,255,.18)"; for(let i=0;i<40;i++) mx.fillRect(Math.random()*512,Math.random()*64,2,2);
    const mt=new THREE.CanvasTexture(mc); mt.encoding=THREE.sRGBEncoding; const mask=new THREE.Mesh(new THREE.PlaneGeometry(12,.9),new THREE.MeshBasicMaterial({map:mt})); mask.position.set(0,1.45,-18.6); scene.add(mask);
    const deck=new THREE.PointLight(renk("#ffffff"),1.1,7,2); deck.position.set(0,1.1,-16.8); scene.add(deck);
    const duvarM=mat("#1d1630",{roughness:.85}); for(const sx of [-1,1]){ const w=new THREE.Mesh(new THREE.PlaneGeometry(26,3.6),duvarM); w.rotation.y=-sx*Math.PI/2; w.position.set(sx*6.2,1.8,-7.5); scene.add(w);
      for(const [y,c] of [[2.9,"#6af0ff"],[2.75,"#ff7ad9"]]){ const n=new THREE.Mesh(new THREE.PlaneGeometry(24,.035),new THREE.MeshBasicMaterial({color:renk(c)})); n.rotation.y=-sx*Math.PI/2; n.position.set(sx*6.18,y,-7.5); scene.add(n); } }
    const ekranM=new THREE.MeshStandardMaterial({color:renk("#141418"),roughness:.5,metalness:.4});
    for(let p=-2;p<=2;p++){ const e=new THREE.Mesh(new THREE.BoxGeometry(.95,.56,.08),ekranM); e.position.set(p*2.2,2.95,-1.2); e.rotation.x=.18; scene.add(e);
      const yz=p===0?"KAAN · KARDELEN":["9 · 7","10 · 8","","6 · 9","8 · 8"][p+2];
      const sc=new THREE.Mesh(new THREE.PlaneGeometry(.88,.49),new THREE.MeshBasicMaterial({map:yaziDoku(yz,{w:512,h:280,zemin:"#0c1a3a",renk:p===0?"#ffd1ea":"#9fd8ff",font:p===0?"800 54px Arial":"700 90px Arial"})})); sc.position.set(0,0,.041); e.add(sc); }
    const donus=new THREE.Mesh(new THREE.BoxGeometry(.5,.55,1.2),mat("#2c2a36",{roughness:.4,metalness:.3})); donus.position.set(-1.1,.28,2.1); scene.add(donus);
    ["#ff5a8a","#3a7aff","#2ec27e"].forEach((c,i)=>{ const b=new THREE.Mesh(new THREE.SphereGeometry(.11,18,14),new THREE.MeshStandardMaterial({color:renk(c),roughness:.12,metalness:.2})); b.position.set(-1.1,.66,1.75+i*.24); scene.add(b); });
    const kol=new THREE.Mesh(new THREE.BoxGeometry(.7,.42,2.6),mat("#5a2a5a",{roughness:.9})); kol.position.set(-4.6,.21,3.0); scene.add(kol); const sir=new THREE.Mesh(new THREE.BoxGeometry(.2,.7,2.6),mat("#5a2a5a",{roughness:.9})); sir.position.set(-4.95,.6,3.0); scene.add(sir);
    const zem=new THREE.Mesh(new THREE.PlaneGeometry(14,8),mat("#2a2236",{roughness:.8})); zem.rotation.x=-Math.PI/2; zem.position.set(0,0,3.5); scene.add(zem);
    const s1=new THREE.PointLight(renk("#fff1e0"),.7,12,2); s1.position.set(0,3.2,-3); scene.add(s1); const s2=new THREE.PointLight(renk("#ffe0f0"),.9,10,2); s2.position.set(0,2.8,-16.5); scene.add(s2);
    // lobutlar
    this.lobut=[]; const P0=new THREE.Vector3(0,.01,-17.4); for(let r=0;r<4;r++) for(let c=0;c<=r;c++){ const l=lobutYap(); const x=(c-r/2)*.3, z=-r*.26; l.position.set(P0.x+x,P0.y,P0.z+z); l.userData={x0:l.position.clone(),dus:0,v:new THREE.Vector3(),w:new THREE.Vector3(),t:0}; scene.add(l); this.lobut.push(l); }
    this.top=new THREE.Mesh(new THREE.SphereGeometry(.109,24,18),new THREE.MeshStandardMaterial({color:renk("#2c5cff"),roughness:.12,metalness:.25,envMapIntensity:1.3})); this.top.castShadow=true; this.top.position.set(.3,.11,.3); scene.add(this.top);
    await pembeHazirla();
    this.kaan=karakter("kaan","deri"); this.kar=karakter("kardelen","pembe"); this.kaan.position.set(-.25,0,1.2); this.kaan.rotation.y=Math.PI; this.kar.position.set(1.6,0,2.2); this.kar.rotation.y=Math.PI*1.1;
    scene.add(this.kaan,this.kar); KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    Kamera.sinema=null;
  },
  async bowling(){
    const K=this.kaan, D=this.kar;
    await sahne(async()=>{
      await kameraNoktasi(new THREE.Vector3(1.4,1.9,4.6),new THREE.Vector3(0,.8,-6),.01);
      await anlat("Vedalaşmadan önce bir oyun. Videosu hâlâ telefonumda.",2600);
      await konus("kardelen",["Kaybeden bir hafta “haklısın” der","Söz mü"],{gul:1});
      await konus("kaan","Söz. Ben doğuştan bowlingciyim, haberin olsun 😄",{gul:.8});
    });
    const sonuc=await this.atis(K,true);
    await sahne(async()=>{
      if(sonuc>=10) await konus("kardelen",["Ohaa","Strike","Şov yapma kdkdkd"],{gul:1});
      else if(sonuc>=6) await konus("kardelen",[sonuc+" lobut","Fena değil doğuştan bowlingci 😄"],{gul:1});
      else await konus("kardelen",["Doğuştan mı demiştin","kdkdkd"],{gul:1});
    });
    this.lobutDiz(); K.position.set(-1.1,0,2.1);
    const s2=await this.atis(D,false,sonuc>=10?8:10);
    await sahne(async()=>{
      if(s2>=10){ await konus("kardelen",["Strikeee 😎","Bir hafta haklıyım o zaman"],{gul:1}); await konus("kaan","Bu nasıl oldu ya 😄",{gul:.8}); }
      else { await konus("kardelen",["Olsun","Yine de ben kazandım sayılır kdkdkd"],{gul:1}); }
      await anlat("Oyunu kim kazandı, hâlâ tartışıyoruz.",2600);
    });
    await gecis(async()=>{ katmanTemizle(); await this.arabaKur(); katmanTemizle(); ustDugmeler(); this.btn=aksiyonEkle(); });
    await this.donus();
  },
  lobutDiz(){ for(const l of this.lobut){ l.position.copy(l.userData.x0); l.rotation.set(0,0,0); l.userData.dus=0; l.userData.t=0; l.visible=true; } },
  // nişan (sağ-sol ibre) ve güç (dolan çubuk): iki dokunuş; top kayar, lobutlar devrilir
  async atis(c,oyuncu,hedefSay){
    const T=this.top; c.position.set(oyuncu?-.2:.2,0,1.3); c.rotation.y=Math.PI; c.userData.hiz=0;
    Kamera.sinema=dt=>{ camera.position.set(c.position.x+.25,1.6,c.position.z+2.6); camera.lookAt(0,.6,-8); };
    T.position.set(c.position.x+.18,.11,c.position.z-.3); T.visible=true;
    let nisan=0, guc=.7;
    if(oyuncu){
      const ui=el(`<div class="sim"><div class="baslik">Nişan al</div><div class="ipucu">İbre yeşil bölgedeyken dokun.</div><div class="olcek" style="align-self:center;width:100%"><div class="bar"><span class="hedef" style="left:42%;width:16%"></span><i style="width:3px;left:50%;transition:none"></i></div></div><div class="satir"><button>🎳 Dokun</button></div></div>`); katman.appendChild(ui);
      const b=ui.querySelector("button"), ib=ui.querySelector(".bar i"), ip=ui.querySelector(".ipucu"), bs=ui.querySelector(".baslik"), hd=ui.querySelector(".hedef");
      for(const asama of [0,1]){ let v=0, yon=1, tik=false; const t0=performance.now(); b.onclick=()=>{ if(performance.now()-t0>250) tik=true; };
        await new Promise(r=>{ let son=performance.now(); const f=()=>{ if(!ui.isConnected) return; const t=performance.now(), dt=Math.min(.1,(t-son)/1000); son=t; v+=yon*dt*(asama?.9:.85); if(v>1){ v=1; yon=-1; } if(v<0){ v=0; yon=1; }
          if(asama===0){ ib.style.left=(v*100)+"%"; ib.style.width="3px"; } else { ib.style.left="0"; ib.style.width=(v*100)+"%"; }
          if(tik){ r(); return; } requestAnimationFrame(f); }; f(); });
        if(asama===0){ nisan=(v-.5)*2; bs.textContent="Güç"; ip.textContent="Çubuk yeşile gelince dokun."; hd.style.left="78%"; hd.style.width="20%"; }
        else guc=v; }
      ui.remove();
    } else { nisan=hedefSay>=10?rnd(-.03,.03):rnd(.14,.22); guc=.92; await bekle(900); }
    const xs=nisan*.42+(1-guc)*.16*Math.sign(nisan||1), x0=T.position.x, sure=2.6-guc*.9; let u=0;
    c.userData.kolS.rotation.set(-1.2,0,0); setTimeout(()=>c.userData.kolS.rotation.set(0,0,0),500);
    await new Promise(r=>{ Kamera.sinema=dt=>{ u=Math.min(1,u+dt/sure); const z=lerp(c.position.z-.3,-17.3,u), x=lerp(x0,xs,u*u); T.position.set(x,.11,z); T.rotation.x-=dt*14;
        camera.position.set(T.position.x*.5,1.2,Math.max(-12,T.position.z+3.2)); camera.lookAt(0,.4,-17.5); if(u>=1) r(); }; });
    const fark=Math.abs(xs); let say=fark<.07?10:fark<.16?Math.round(9-fark*25):fark<.3?Math.round(6-fark*12):fark<.45?2:0; if(hedefSay!==undefined) say=Math.min(10,hedefSay);
    const sira=[...this.lobut].sort((a,b)=>Math.abs(a.position.x-xs)-Math.abs(b.position.x-xs)).slice(0,say);
    Ses.efekt("vuru"); setTimeout(()=>Ses.efekt("vuru",.6),120); setTimeout(()=>Ses.efekt("vuru",.4),260);
    for(const l of sira){ l.userData.dus=1; const d=new THREE.Vector3(l.position.x-xs+rnd(-.1,.1),0,-1).normalize(); l.userData.v.copy(d).multiplyScalar(rnd(1.2,2.4)); l.userData.v.y=rnd(.5,1.4); l.userData.w.set(rnd(-8,-4),rnd(-3,3),rnd(-6,6)); l.userData.t=0; }
    T.visible=false; await bekle(1900);
    return say;
  },
  // ---------- YAĞMURDA DÖNÜŞ ----------
  async arabaKur(){
    this.faz="araba"; this.t=0; ETK=[]; DALGA=[];
    sahneKur({sis:"#2a3038",sisYakin:8,sisUzak:90,ust:"#2a3038",ufuk:"#3a4048",alt:"#1a1e24",gunesYon:new THREE.Vector3(0,.3,-1).normalize(),isikYon:new THREE.Vector3(0,1,.2),gunesRenk:"#9aa4b0",isik:"#aab4c0",isikGuc:.55,zemin:"#20242a",hemi:.55,dolgu:.3,dolguRenk:"#ffd6a6",parlak:.001});
    const yolC=document.createElement("canvas"); yolC.width=128; yolC.height=512; const yx=yolC.getContext("2d"); yx.fillStyle="#2b2e33"; yx.fillRect(0,0,128,512); yx.fillStyle="#e9e9e2"; for(let i=0;i<4;i++) yx.fillRect(62,i*128,5,64); yx.fillRect(4,0,4,512); yx.fillRect(120,0,4,512);
    const yt=new THREE.CanvasTexture(yolC); yt.wrapS=yt.wrapT=THREE.RepeatWrapping; yt.repeat.set(1,20); yt.encoding=THREE.sRGBEncoding; this.yolDoku=yt;
    const yol=new THREE.Mesh(new THREE.PlaneGeometry(9,400),new THREE.MeshStandardMaterial({map:yt,roughness:.15,metalness:.4,envMapIntensity:1.4})); yol.rotation.x=-Math.PI/2; yol.position.set(0,0,-190); scene.add(yol);
    const cim=new THREE.Mesh(new THREE.PlaneGeometry(200,400),mat("#25301f",{roughness:1})); cim.rotation.x=-Math.PI/2; cim.position.set(0,-.02,-190); scene.add(cim);
    this.agaclar=[]; for(let i=0;i<40;i++){ const a=agac(i%2?"cam":"yesil",rnd(1,1.5)); a.position.set((i%2?1:-1)*rnd(9,22),0,-i*10-rnd(0,8)); scene.add(a); this.agaclar.push(a); }
    this.karsi=[]; for(let i=0;i<3;i++){ const g=new THREE.Group(); for(const sx of [-.6,.6]){ const f=parilti("#fff4d0",1.6); f.position.set(sx,.7,0); g.add(f); } g.position.set(-2.2,0,-150-i*70); scene.add(g); this.karsi.push(g); }
    this.yagmur=tozlar(1400,()=>({x:rnd(-12,12),y:rnd(0,9),z:rnd(-40,4)}),"#c9d6e6",.05); scene.add(this.yagmur);
    // araç içi: torpido, direksiyon, ön cam (yağmur damlaları), silecekler; kamera sürücü gözünde
    const ic=new THREE.Group(); this.ic=ic; scene.add(ic);
    const torp=new THREE.Mesh(new THREE.BoxGeometry(1.7,.25,.55),mat("#1a1b1e",{roughness:.7})); torp.position.set(0,.95,-.75); ic.add(torp);
    const gc=document.createElement("canvas"); gc.width=256; gc.height=96; const gx=gc.getContext("2d"); gx.fillStyle="#05070a"; gx.fillRect(0,0,256,96); gx.strokeStyle="rgba(127,214,255,.35)"; gx.lineWidth=3; gx.strokeRect(4,4,248,88);
    gx.fillStyle="#7fd6ff"; gx.font="700 50px Arial"; gx.textAlign="right"; gx.textBaseline="middle"; gx.fillText("90",150,50); gx.font="600 22px Arial"; gx.textAlign="left"; gx.fillStyle="rgba(127,214,255,.75)"; gx.fillText("km/s",160,56);
    gx.fillStyle="#ffb04a"; gx.beginPath(); gx.arc(30,48,7,0,7); gx.fill();
    const gt=new THREE.CanvasTexture(gc); gt.encoding=THREE.sRGBEncoding; const gost=new THREE.Mesh(new THREE.PlaneGeometry(.16,.06),new THREE.MeshBasicMaterial({map:gt,color:renk("#b8c4cc")})); gost.position.set(-.38,1.06,-.66); gost.rotation.x=-.32; ic.add(gost);
    const dir=new THREE.Mesh(new THREE.TorusGeometry(.19,.018,10,32),mat("#111",{roughness:.6})); dir.position.set(-.38,1.02,-.42); dir.rotation.x=-1.0; ic.add(dir); this.direksiyon=dir;
    const cam=new THREE.Mesh(new THREE.PlaneGeometry(1.7,.75),new THREE.MeshBasicMaterial({map:yagmurCamDoku(),transparent:true,depthWrite:false,opacity:.85})); cam.position.set(0,1.42,-.95); cam.rotation.x=-.42; ic.add(cam); this.camYagmur=cam;
    const tavan=new THREE.Mesh(new THREE.BoxGeometry(1.8,.06,1.6),mat("#2a2b2e")); tavan.position.set(0,1.85,-.2); ic.add(tavan);
    for(const sx of [-.9,.9]){ const d=new THREE.Mesh(new THREE.BoxGeometry(.08,.9,.08),mat("#1a1b1e")); d.position.set(sx,1.45,-.9); d.rotation.x=-.42; ic.add(d); }
    this.silecek=[]; for(const sx of [-.55,.2]){ const s=new THREE.Group(); const k=new THREE.Mesh(new THREE.BoxGeometry(.015,.62,.01),mat("#0c0c0c")); k.position.y=.31; s.add(k); s.position.set(sx,1.1,-1.06); s.rotation.x=-.42; ic.add(s); this.silecek.push(s); }
    this.silHiz=1; this.silA=0;
    this.kaan=karakter("kaan","deri"); this.kar=karakter("kardelen","gunluk"); this.kar.visible=false; this.kaan.visible=false; scene.add(this.kaan,this.kar); KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    Kamera.sinema=dt=>{ const f=camera.aspect<1?80:60; if(camera.fov!==f){ camera.fov=f; camera.updateProjectionMatrix(); } camera.position.set(-.38,1.32,.05); camera.lookAt(-.38,1.16,-6); };
    Ses.ton="gece";
  },
  async donus(){
    Kamera.sinema=dt=>{ const f=camera.aspect<1?80:60; if(camera.fov!==f){ camera.fov=f; camera.updateProjectionMatrix(); } camera.position.set(-.38,1.32,.05); camera.lookAt(-.38,1.16,-6); };
    await bekle(800);
    await anlat("Vedalaştık. Çorum'a doğru yola çıktım. Gök delindi sanki.",3000);
    gorev("Silecekleri hızlandır");
    const ui=el(`<div class="sim"><div class="baslik">Sağanak</div><div class="ipucu">Silecek: yavaş</div><div class="satir"><button class="az">− Yavaş</button><button class="cok">Hızlı +</button></div></div>`); katman.appendChild(ui);
    const yaz=()=>{ ui.querySelector(".ipucu").textContent="Silecek: "+["","yavaş","normal","en hızlı"][this.silHiz]+(this.silHiz===3?" · yine de yetişmiyor":""); };
    ui.querySelector(".az").onclick=()=>{ this.silHiz=Math.max(1,this.silHiz-1); yaz(); };
    ui.querySelector(".cok").onclick=()=>{ this.silHiz=Math.min(3,this.silHiz+1); yaz(); };
    await kosul(()=>this.silHiz>=3); await bekle(2600);
    ui.remove(); gorev(null);
    bildirimGoster("Eve vardım"); await bekleDokun(3000); bildirimGoster("Oda çok sessiz"); await bekleDokun(3000); bildirimGoster("Şimdiden özledim"); await bekleDokun(3000); bildirimGoster("Yolun açık olsun 🥹");
    await bekleDokun(2200);
    await anlat("Yolda okuyamadım. Mola yerinde durunca cevap yazdım.",2800);
    const dm=DM.ac("Kardelen 💕","çevrimiçi"); dm.zaman("Akşam");
    await dm.yaz("ben","Çok yağmur yağdı minnakım"); await dm.yaz("ben","Silecekler pes etti, haberin olsun");
    await dm.yaz("o","Of minikom 🥹"); await dm.yaz("o","Yavaş gel ama");
    const c=await dm.sec(["Gitmedim ki, aklım sende kaldı","Az kaldı, yine geleceğim"]); await dm.yaz("ben",c?"Az kaldı, yine geleceğim":"Gitmedim ki, aklım sende kaldı");
    await dm.yaz("o","Biliyorum"); await dm.yaz("o","Fotoğrafları at ama"); await dm.yaz("o","Hepsini HD 💋");
    await bekle(700); DM.kapat();
    await anlat("Birkaç gün sonra çok uzak bir dağa gidecektim.",3000);
    bolumBitti(this.no);
  },
  guncelle(dt){
    this.t+=dt; const t=this.t, K=this.kaan, D=this.kar; if(!K) return;
    if(this.faz==="dukkan"){ for(const k of this.kravatlar||[]){ const h=k.userData.hedefZ||0; k.position.z=lerp(k.position.z,-1.95+h,.12); k.rotation.y=Math.sin(t*.8+k.userData.i)*.06+(h?Math.sin(t*1.5)*.08:0); } return; }
    if(this.faz==="bowling"){ for(const l of this.lobut||[]){ const u=l.userData; if(!u.dus||u.t>1.8) continue; u.t+=dt; u.v.y-=dt*6; l.position.addScaledVector(u.v,dt); if(l.position.y<0){ l.position.y=0; u.v.y=Math.abs(u.v.y)*.25; u.v.x*=.7; u.v.z*=.7; }
        l.rotation.x=Math.max(-1.57,l.rotation.x+u.w.x*dt); l.rotation.z+=u.w.z*dt*.3; if(l.position.z<-19.2) l.visible=false; } return; }
    if(this.faz==="araba"){ const h=[0,1.6,3,5][this.silHiz||1]; this.silA+=dt*h; const a=Math.sin(this.silA)*.9;
      if(this.silecek) this.silecek.forEach(s=>{ s.rotation.z=-.15+a*.9; }); if(this.yolDoku) this.yolDoku.offset.y+=dt*1.6;
      if(this.camYagmur){ const m=this.camYagmur.material; m.map.offset.y-=dt*.05; m.opacity=.95-(this.silHiz||1)*.08+Math.max(0,Math.cos(this.silA))*.05; }
      if(this.yagmur){ const p=this.yagmur.geometry.attributes.position; for(let i=0;i<p.count;i++){ let y=p.getY(i)-dt*14, z=p.getZ(i)+dt*20; if(y<0) y=9; if(z>4) z-=44; p.setY(i,y); p.setZ(i,z); } p.needsUpdate=true; }
      for(const g of this.karsi||[]){ g.position.z+=dt*45; if(g.position.z>2) g.position.z=-200-Math.random()*80; }
      for(const a2 of this.agaclar||[]){ a2.position.z+=dt*25; if(a2.position.z>6) a2.position.z-=400; }
      if(this.direksiyon) this.direksiyon.rotation.z=Math.sin(t*.7)*.05; return; }
    this.lambalar.forEach((l,i)=>{ if(l.userData.isik) l.userData.isik.opacity=.75+Math.sin(t*2+i)*.2; });
    const sinir=p=>{ p.x=clamp(p.x,-14,14); p.z=clamp(p.z,-14,19); p.y=0; };
    if(this.serbest&&!kilit){ yuru(K,dt,sinir,2.1); if(this.elele){ eleleTakip(K,D,dt); D.position.y=0; } }
    if(this.durum!=="dans") etkilesimGuncelle(K,this.btn);
    if(!Kamera.sinema) Kamera.hedef.lerp(K.position,.1);
    if(this.durum==="dans"){
      this.dansA+=dt*(.5+this.dansIlerle*.7); const r=.3;
      K.position.set(Math.sin(this.dansA)*r,0,-6+Math.cos(this.dansA)*r); D.position.set(-Math.sin(this.dansA)*r,0,-6-Math.cos(this.dansA)*r);
      if(this._dansK0&&this._dansG<1){ this._dansG=Math.min(1,this._dansG+dt*1.3); const e=this._dansG*this._dansG*(3-2*this._dansG); K.position.lerpVectors(this._dansK0,K.position.clone(),e); D.position.lerpVectors(this._dansD0,D.position.clone(),e); K.userData.hiz=D.userData.hiz=(1-e)*1.2; }
      else K.userData.hiz=D.userData.hiz=r*(.5+this.dansIlerle*.7)*1.6; // birbirinin etrafında dönerken küçük adımlar (ayaklar yerde kaymasın)
      yuzYuze(K,D);
      D.userData.gulumse=K.userData.gulumse=.4+this.dansIlerle*.6; this.dansIlerle=lerp(this.dansIlerle,this.vurus/8,.05);
      this.pistIsik.intensity=1.2+this.dansIlerle*2.5;
      if(this.ritimEl){ this.ritimT+=dt; const k=this.ritimT/this.ritimSure; const d=this.ritimEl.querySelector(".daire"); const boy=150-80*Math.min(k,1.3);
        d.style.width=d.style.height=Math.max(20,boy)+"px"; d.style.opacity=k>1.25?0:1;
        if(Girdi.aksiyonBas){ if(Math.abs(k-1)<.2){ this.vurus++; Ses.efekt("vuru"); this.konfetiAt(); gorev(this.vurus<8?`Halka kalbe değdiğinde dokun · ${this.vurus} / 8`:"Mükemmel");
            const h=this.ritimEl.querySelector(".hedefh"); h.style.boxShadow="0 0 40px #ffcf8a"; setTimeout(()=>{ h.style.boxShadow=""; },200); } this.ritimT=0; }
        if(k>1.35) this.ritimT=0; }
    }
    this.konfeti=this.konfeti.filter(f=>{ f.o.material.opacity-=dt*.35; const p=f.o.geometry.attributes.position; for(let i=0;i<p.count;i++){ f.v[i*3+1]-=dt*2.2; p.setXYZ(i,p.getX(i)+f.v[i*3]*dt,Math.max(.02,p.getY(i)+f.v[i*3+1]*dt),p.getZ(i)+f.v[i*3+2]*dt); } p.needsUpdate=true;
      if(f.o.material.opacity<=0){ scene.remove(f.o); f.o.geometry.dispose(); f.o.material.dispose(); return false; } return true; });
  },
  konfetiAt(){ const n=60, g=new THREE.BufferGeometry(), p=new Float32Array(n*3), v=new Float32Array(n*3);
    for(let i=0;i<n;i++){ p[i*3]=rnd(-.5,.5); p[i*3+1]=3.5; p[i*3+2]=-6+rnd(-.5,.5); const a=Math.random()*Math.PI*2; v[i*3]=Math.cos(a)*rnd(1,3); v[i*3+1]=rnd(0,2); v[i*3+2]=Math.sin(a)*rnd(1,3); }
    g.setAttribute("position",new THREE.BufferAttribute(p,3));
    const o=new THREE.Points(g,new THREE.PointsMaterial({color:renk(["#ff9fb4","#ffd28a","#ffffff","#c9a0ff"][this.vurus%4]),size:.08,transparent:true,depthWrite:false})); scene.add(o); this.konfeti.push({o,v}); },
  temizle(){ if(this.ritimEl){ this.ritimEl.remove(); this.ritimEl=null; } DM.kapat&&DM.kapat(); boyut(); }
};
