/* ================= BÖLÜM 1: KILIÇLAR ÇEKİLDİ (Ağustos 2024) ================= */
const B1={
  id:"mezuniyet", no:2, ad:"Kılıçlar Çekildi", tarih:"Ağustos 2024", alt:"Mezuniyet günü",
  async kur(){
    await torenHazirla();
    const gy=new THREE.Vector3(.55,.62,.35).normalize();
    sahneKur({sis:"#dfe6ee",sisYakin:60,sisUzak:320,ust:"#4f86d0",ufuk:"#e6eef5",alt:"#b9c4c9",gunesYon:gy,isikYon:gy,gunesRenk:"#fff1d6",isik:"#fff0d8",isikGuc:2.5,zemin:"#8f8a78",hemi:.75,dolgu:.7,dolguRenk:"#dfe8ff"});
    Ses.ortam("kalabalik",.5);
    this.t=0; DALGA=[]; ETK=[]; this.bulundu=false;
    // zemin: çim + tören alanı
    const cim=cimZemin(260,260,"#567a36","#6d8f42",60); scene.add(cim);
    const ac=document.createElement("canvas"); ac.width=ac.height=512; const ax=ac.getContext("2d"); ax.fillStyle="#8d877a"; ax.fillRect(0,0,512,512);
    // taş döşeme: güneşte bembeyaz parlamasın diye bir ton koyu, taşlar arası derz ve tek tük koyu taş, üstünde ince doku
    for(let i=0;i<16;i++) for(let j=0;j<16;j++){ const k=Math.random()<.1; ax.fillStyle=`hsl(38,${7+Math.random()*6}%,${k?45+Math.random()*5:53+Math.random()*8}%)`; ax.fillRect(i*32+1,j*32+1,30,30); }
    for(let i=0;i<5000;i++){ ax.fillStyle=`rgba(${Math.random()<.5?"60,55,45":"235,230,215"},${.05+Math.random()*.08})`; ax.fillRect(Math.random()*512,Math.random()*512,1+Math.random()*2,1+Math.random()*2); }
    const at=new THREE.CanvasTexture(ac); at.wrapS=at.wrapT=THREE.RepeatWrapping; at.repeat.set(12,9); at.encoding=THREE.sRGBEncoding; at.anisotropy=8;
    const alan=new THREE.Mesh(new THREE.PlaneGeometry(70,52),new THREE.MeshStandardMaterial({map:at,roughness:.9})); alan.rotation.x=-Math.PI/2; alan.position.set(0,.01,2); alan.receiveShadow=true; scene.add(alan);
    // beyaz çizgiler (tören düzeni)
    const cizM=new THREE.MeshBasicMaterial({color:renk("#f4f2ea")});
    for(let r=0;r<4;r++){ const c=new THREE.Mesh(new THREE.PlaneGeometry(22,.08),cizM); c.rotation.x=-Math.PI/2; c.position.set(0,.02,2.6+r*2.2); scene.add(c); }
    // tribün
    const tri=new THREE.Group(); tri.position.set(0,0,-17); scene.add(tri);
    const beton=mat("#d7d2c6",{roughness:.85}), koltukM=mat("#b8322e",{roughness:.6});
    for(let i=0;i<7;i++){ const b=new THREE.Mesh(new THREE.BoxGeometry(34,.45,1.1),beton); b.position.set(0,.225+i*.45,-i*1.1+2.2); b.castShadow=true; b.receiveShadow=true; tri.add(b);
      const k=new THREE.Mesh(new THREE.BoxGeometry(33,.12,.45),koltukM); k.position.set(0,.5+i*.45,-i*1.1+2.15); tri.add(k); }
    const arka=new THREE.Mesh(new THREE.BoxGeometry(34,4,.4),beton); arka.position.set(0,2,-5.6); tri.add(arka);
    // çatı (kırmızı-beyaz)
    const catiG=new THREE.PlaneGeometry(36,9,1,1); const cc=document.createElement("canvas"); cc.width=256; cc.height=16; const cx=cc.getContext("2d"); for(let i=0;i<16;i++){ cx.fillStyle=i%2?"#f3f0ea":"#c8302c"; cx.fillRect(i*16,0,16,16); }
    const ct=new THREE.CanvasTexture(cc); ct.encoding=THREE.sRGBEncoding;
    const cati=new THREE.Mesh(catiG,new THREE.MeshStandardMaterial({map:ct,side:THREE.DoubleSide,roughness:.7})); cati.rotation.x=-Math.PI/2+.18; cati.position.set(0,6.4,-1); cati.castShadow=true; tri.add(cati);
    for(const x of [-17,-8.5,0,8.5,17]){ const d=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,6.5,8),mat("#e6e6ea",{metalness:.6,roughness:.4})); d.position.set(x,3.25,2.8); tri.add(d); }
    // önündeki korkuluk
    const kork=new THREE.Mesh(new THREE.BoxGeometry(34,.06,.06),mat("#e8e8ec",{metalness:.7,roughness:.3})); kork.position.set(0,1.05,3.4); tri.add(kork);
    for(let i=0;i<=34;i+=2){ const d=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.05,6),kork.material); d.position.set(-17+i,.52,3.4); tri.add(d); }
    // pankart
    const pk=new THREE.Mesh(new THREE.PlaneGeometry(10,1.2),new THREE.MeshStandardMaterial({map:yaziDoku("MEZUNİYET · 2024",{w:1024,h:128,zemin:"#1d2a4a",renk:"#f5e6c4",font:"600 70px Georgia"}),roughness:.8})); pk.position.set(0,5.3,-5.35); tri.add(pk);
    // bayraklar
    for(let i=0;i<9;i++){ const b=bayrak(9,2.2); b.position.set(-20+i*5,0,-24); scene.add(b); }
    const buyuk=bayrak(14,4.2); buyuk.position.set(26,0,-12); scene.add(buyuk);
    // kürsü
    const kursu=new THREE.Mesh(new THREE.BoxGeometry(6,.6,3),mat("#2b3a5a",{roughness:.7})); kursu.position.set(-22,.3,-6); kursu.castShadow=true; kursu.userData.engel={kutu:[3.05,1.55]}; scene.add(kursu);
    // ağaçlar
    for(let i=0;i<26;i++){ const a=agac(i%3?"yesil":"selvi",rnd(.9,1.3)); const s=i%2?1:-1; a.position.set(s*rnd(38,60),0,rnd(-40,40)); scene.add(a); }
    for(let i=0;i<10;i++){ const a=agac("selvi",rnd(1,1.4)); a.position.set(-30+i*6.5,0,-32); scene.add(a); }
    // seyirciler (tribünde ve önünde)
    const giysi=["#f2efe8","#2d3a55","#7a5b48","#9fb3cf","#c96f6f","#e6d7b8","#3f5d4a","#ffffff"];
    this.seyirci=[];
    for(let i=0;i<12;i++){ const kiz=i%2===0; const tip=kiz?"michelle":"rpm";
      const c=kalabalik(tip,{resmi:true,ust:giysi[i%giysi.length],alt:giysi[(i+3)%giysi.length],sakalsiz:i%3===0,boy:rnd(.95,1.04),alkis:0,ton:kiz?["#ffffff","#ffe9e9","#e9f0ff","#f6ffe9"][i%4]:null}); if(!c) continue;
      const sira=i%3, x=-12+(i*2.13%24); c.position.set(x+rnd(-.3,.3), .45*(sira+1), -17+2.2-sira*1.1+.36); /* koltuğun önünde, basamakta (koltuk minderinin içinde değil) */ c.rotation.y=rnd(-.25,.25); scene.add(c); this.seyirci.push(c); }
    // tribünü dolduran kalabalık: oturan ucuz silüetler (gövde + baş, iki çizim çağrısı); "bu kalabalıkta seni nasıl bulacam" gerçekten kalabalık olsun
    { const N=240, gG=new THREE.CylinderGeometry(.16,.21,.62,7), bG=new THREE.SphereGeometry(.105,10,8);
      const govde=new THREE.InstancedMesh(gG,new THREE.MeshStandardMaterial({roughness:.9}),N), basM=new THREE.InstancedMesh(bG,new THREE.MeshStandardMaterial({roughness:.7}),N);
      const o=new THREE.Object3D(); let n=0;
      const tenler=["#f1c9a5","#e0ac83","#c98f6a","#f6d5bb","#b07b57"], kiyafet=["#f2efe8","#2d3a55","#7a5b48","#9fb3cf","#c96f6f","#e6d7b8","#3f5d4a","#ffffff","#1f1f24","#8a2f3c","#4a6a8a","#d9c27a"];
      for(let i=0;i<7&&n<N;i++) for(let x=-16.2;x<=16.2&&n<N;x+=.78){ if(Math.random()<.2) continue; if(i<3&&Math.abs(x)<13.2) continue; // ön sıraların ortası gerçek seyircilerin
        const y=.56+i*.45, z=-17+2.15-i*1.1-.02, xx=x+rnd(-.12,.12), h=rnd(.92,1.06);
        o.position.set(xx,y+.31*h,z); o.rotation.set(0,rnd(-.3,.3),0); o.scale.set(1,h,1); o.updateMatrix(); govde.setMatrixAt(n,o.matrix); govde.setColorAt(n,renk(kiyafet[(Math.random()*kiyafet.length)|0]));
        o.position.set(xx+rnd(-.02,.02),y+.62*h+.12,z+rnd(-.03,.03)); o.scale.setScalar(rnd(.95,1.05)); o.updateMatrix(); basM.setMatrixAt(n,o.matrix); basM.setColorAt(n,renk(tenler[(Math.random()*tenler.length)|0])); n++; }
      govde.count=basM.count=n; govde.instanceColor.needsUpdate=basM.instanceColor.needsUpdate=true; govde.receiveShadow=basM.receiveShadow=true; scene.add(govde,basM); }
    // tören dizisi (mezunlar)
    this.mezun=[];
    for(let r=0;r<2;r++) for(let k=0;k<6;k++){ if(r===0&&k===3) continue; const c=kalabalik("rpm",{ust:"#4a5a3e",alt:"#39462f",sapka:true,sakalsiz:true,tören:true,boy:rnd(.97,1.03)}); if(!c) continue;
      c.position.set(-6+k*2,0,3+r*2.2); c.rotation.y=Math.PI; scene.add(c); this.mezun.push(c); }
    this.yer=new THREE.Vector3(0,0,3); // Kaan'ın yeri: ön sıra ortası
    this.yerIsaret=new THREE.Object3D(); this.yerIsaret.position.copy(this.yer); scene.add(this.yerIsaret);
    // karakterler
    this.kaan=karakter("kaan","uniforma"); this.kaan.position.set(22,0,14); this.kaan.rotation.y=-Math.PI*.7; scene.add(this.kaan);
    this.kar=karakter("kardelen","mezun"); this.kar.position.set(9,0,-12.7); this.kar.rotation.y=0; scene.add(this.kar);
    this.kilic=kilicYap(); this.kilic.visible=false; scene.add(this.kilic);
    KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    // güvercinler
    this.kus=tozlar(1,()=>({x:0,y:-50,z:0}));
    Kamera.sinema=null; Kamera.aci=.5; Kamera.mesafe=6.5; Kamera.yukseklik=2.6; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(30,6,24);
    Ses.ton="sicak";
  },
  async basla(){
    katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle();
    const K=this.kaan, D=this.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(-30,14,30),new THREE.Vector3(0,1,-8));
      await kameraNoktasi(s=>new THREE.Vector3(-30+s*4,14-s*.6,30-s*1.2),new THREE.Vector3(0,1,-8),7);
      baslikKarti(this.ad,[this.tarih,"Bölüm "+this.no]);
      await kameraNoktasi(new THREE.Vector3(26,2.2,17),bas(K),3);
      await anlat("Yıllar süren okul bugün bitiyor.");
      await anlat("Tören başlamadan önce birkaç dakikam var. Tribünde aradığım tek bir yüz var.");
      K.userData.bakNokta=new THREE.Vector3(0,2,-16);
      await konus("kaan","Gelmiştir. Söz verdi, gelir o.",{uzak:1.4});
      K.userData.bakNokta=null;
    });
    gorev("Tribünde Kardelen'i bul");
    this.serbest=true; gizliKalpler(this,[[24.6,1.0,-10.6,0],[-22,1.0,-3.7,1],[-14,1.0,18,2]]); let ipucu=setTimeout(()=>{ if(!this.bulundu) this.kar.userData.salla=1; },20000);
    // yaklaşınca el sallar ve seslenir
    await kosul(()=>K.position.distanceTo(D.position)<11);
    D.userData.salla=1; D.userData.gulumse=1; D.userData.bakNokta=bas(K);
    altYazi("Tribünün önünden el sallıyor. Benim minnakım.",2600);
    await etkBekle(D,"Yanına git",{mesafe:2.4,isaretY:2.1});
    clearTimeout(ipucu); this.bulundu=true;
    await sahne(async()=>{
      D.userData.salla=0; await yuruHedef(K,D.position.clone().add(new THREE.Vector3(0,0,1.15)),1.3); yuzYuze(K,D);
      K.userData.bakNokta=null; D.userData.bakNokta=null; K.userData.bak=0; D.userData.bak=0;
      await konus("kardelen",["Aşkıııım 😍","Kaç saattir buradayım biliyon mu"],{gul:1});
      await konus("kaan","Bu kalabalıkta seni nasıl bulacam diye düşünüyordum.",{gul:.6});
      await konus("kardelen",["Ben seni girerken gördüm","Kocam benim, çok yakışmış 😍"],{gul:1});
      const s=await sec(["Şapka biraz büyük ama.","Asıl sen çok güzelsin bugün."]);
      if(s===0){ await konus("kaan","Şapka biraz büyük ama."); await konus("kardelen",["Hiç de değil","Sakın çıkarma, öyle kalsın"],{gul:.8}); }
      else { await konus("kaan","Asıl sen çok güzelsin bugün.",{gul:.7}); await konus("kardelen",["Lafı çevirme 😄","Bugün senin günün"],{gul:1}); }
      await konus("kaan","Tören biter bitmez ilk sana gelecem, haberin olsun.");
      await konus("kardelen",["Buradan hiç kıpırdamıyorum","Hadi git bekliyorlar","Kılıçla dikkat et 😄"],{gul:.8});
    });
    gorev("Tören dizisindeki yerine geç");
    await etkBekle(this.yerIsaret,"Yerine geç",{mesafe:1.6,isaretY:.4,isaretBoy:1.4});
    this.serbest=false;
    await this.toren();
  },
  async toren(){
    const K=this.kaan, D=this.kar;
    Ses.yukle("mk.mp3"); gorev(null);
    await sahne(async()=>{
      await yuruHedef(K,this.yer,1.4); K.rotation.y=Math.PI; K.userData.bak=0;
      kameraNoktasi(new THREE.Vector3(14,3,16),new THREE.Vector3(0,1.4,2),0);
      await kameraNoktasi(new THREE.Vector3(8,1.7,9),bas(K),3);
      await anlat("Bütün alan sustu. Sadece bayrakların sesi.",2200);
      await anlat("Ve o komut geldi: “Kılıç çek!”",1700);
      const qte=el(`<div class="qte"><div class="qte-halka"></div><button class="btn qte-btn">Kılıcını çek</button></div>`); katman.appendChild(qte);
      await new Promise(r=>{ qte.querySelector("button").onclick=()=>r(); const f=e=>{ if(["Space","Enter","KeyE"].includes(e.code)){ removeEventListener("keydown",f); r(); } }; addEventListener("keydown",f); });
      qte.remove(); Ses.baslat(); Ses.efekt("kilic",1.15); [150,290,420,560].forEach((d,i)=>setTimeout(()=>Ses.efekt("kilic",.55-i*.08),d));
      const kabza=(c,g)=>{ const k=c.userData.kin; if(k&&k.userData.kabza) k.userData.kabza.visible=g; };
      this.kilic.visible=true; eldeTut(K,this.kilic,"S"); kabza(K,false);
      this.mezun.forEach((m,i)=>setTimeout(()=>{ m.userData.kilicPoz=1; kabza(m,false); },80+i*40));
      let s=0; Kamera.sinema=dt=>{ s+=dt; K.userData.kilic=Math.min(1,s*2.4); const b=bas(K); camera.position.set(b.x+1.25-s*.12,b.y-.68+s*.05,b.z-1.45+s*.1); camera.userData.bakis=b.clone().add(new THREE.Vector3(-.2,.3,0)); camera.lookAt(camera.userData.bakis); };
      await bekle(1600);
      // halka: Kaan ve on bir arkadaşı kılıçlarıyla bir çember kurar
      const C=new THREE.Vector3(0,0,4.4), R=1.5, kisiler=[K,...this.mezun], n=kisiler.length;
      const yer=kisiler.map((c,i)=>{ const a=i*2*Math.PI/n; return C.clone().add(new THREE.Vector3(Math.sin(a)*R,0,Math.cos(a)*R)); });
      kameraNoktasi(new THREE.Vector3(7.5,6.5,13),C.clone().add(new THREE.Vector3(0,1,0)),0);
      anlat("Ve halka kuruldu.",1500);
      await Promise.all(kisiler.map((c,i)=>new Promise(r=>setTimeout(()=>yuruHedef(c,yer[i],1.55).then(r),i*70))));
      kisiler.forEach((c,i)=>{ c.rotation.y=Math.atan2(C.x-yer[i].x,C.z-yer[i].z); c.userData.hiz=0; });
      // kılıç uçları ortada buluşur
      const T=C.clone().add(new THREE.Vector3(0,2.3,0)), v=new THREE.Vector3();
      const uzat=c=>{ const u=c.userData, sh=(u.kemik.RightShoulder||u.kemik.RightArm); sh.getWorldPosition(v); return T.clone().sub(v).normalize(); };
      this.mezun.forEach(m=>{ m.userData.kilicYon=uzat(m); }); K.userData.kilicYon=uzat(K);
      // kamera halkanın içinden yukarı bakar, yavaşça döner
      let t=0; Kamera.sinema=dt=>{ t+=dt; const a=t*.22; camera.position.set(C.x+Math.sin(a)*.55,1.05,C.z+Math.cos(a)*.55); camera.lookAt(T.x+Math.sin(a+2)*.2,T.y+.15,T.z+Math.cos(a+2)*.2); };
      await bekle(900);
      // "Mustafa Kemal'in askerleriyiz!" — üç kez, giderek yükselen
      Ses.kis(true); const kaynak=await Ses.cal("mk.mp3",1.15); this._mk=kaynak; const n0=NESIL;
      const yazi=(i)=>{ if(n0!==NESIL) return; katman.querySelectorAll(".tezahurat").forEach(x=>x.remove()); const e=el(`<div class="tezahurat t${i+1}">MUSTAFA KEMAL'İN<br>ASKERLERİYİZ!</div>`); katman.appendChild(e); setTimeout(()=>e.classList.add("git"),i<2?2350:3200); setTimeout(()=>e.remove(),i<2?2850:3900); };
      if(!kaynak&&window.speechSynthesis){ try{ for(let i=0;i<3;i++){ const u=new SpeechSynthesisUtterance("Mustafa Kemal'in askerleriyiz!"); u.lang="tr-TR"; u.rate=1.02; u.pitch=.8; u.volume=[.55,.8,1][i]; speechSynthesis.speak(u); } }catch(e){} }
      const zam=[0,2900,5790];
      for(let i=0;i<3;i++){ setTimeout(()=>{ yazi(i); kisiler.forEach(c=>{ c.userData.titre=.6+i*.25; }); },zam[i]); }
      await bekle(3000);
      t=0; const P0=C.clone().add(new THREE.Vector3(4.2,1.1,-4.6));
      Kamera.sinema=dt=>{ t+=dt; camera.position.set(P0.x-t*.35,P0.y+t*.18,P0.z+t*.12); camera.lookAt(C.x,1.9,C.z); };
      await bekle(2900);
      t=0; Kamera.sinema=dt=>{ t+=dt; camera.position.set(C.x+Math.sin(t*.12)*7.5,3.2+t*.3,C.z+9-t*.25); camera.lookAt(C.x,1.6,C.z-3); };
      this.seyirci.forEach(c=>c.userData.alkis=1); D.userData.alkis=1; D.userData.gulumse=1; Ses.efekt("alkis");
      await bekle(3200); Ses.efekt("alkis");
      Ses.kis(false);
      await anlat("Yıllarca bu anı bekledim.",2400);
      konusmaKamerasi(D,null); camera.userData.bakis=bas(D);
      await anlat("Ama gözüm hep tribündeki o yüzdeydi.",2800);
      K.userData.kilic=0; K.userData.kilicYon=null; this.kilic.visible=false; K.userData.eldeki=null; kabza(K,true);
      this.mezun.forEach(m=>{ m.userData.kilicPoz=0; m.userData.kilicYon=null; kabza(m,true); });
      this.seyirci.forEach(c=>c.userData.alkis=0); D.userData.alkis=0;
      // halka açılır: tören bitince mezunlar bir adım geri çekilir, aralarından geçilebilsin
      await Promise.all(this.mezun.map(m=>yuruHedef(m,m.position.clone().add(m.position.clone().sub(C).setY(0).setLength(1.7)),1.2)));
      await anlat("Tören bitti.",1400);
    });
    gorev("Kardelen'e git");
    this.serbest=true;
    await kosul(()=>K.position.distanceTo(D.position)<7);
    this.serbest=false;
    await sahne(async()=>{
      D.userData.gulumse=1;
      const orta=K.position.clone().lerp(D.position,.5);
      yuruHedef(K,orta.clone().add(K.position.clone().sub(orta).setLength(.17)),1.6);
      await yuruHedef(D,orta.clone().add(D.position.clone().sub(orta).setLength(.17)),3.4);
      yuzYuze(K,D); K.userData.saril=1; D.userData.saril=1; D.userData.kafa.rotation.z=-.18; Ses.efekt("parilti");
      let s=0; Kamera.sinema=dt=>{ s+=dt; const m=orta.clone(); const a=s*.18; camera.position.set(m.x+Math.sin(a)*2.6,1.7,m.z+Math.cos(a)*2.6); camera.lookAt(m.x,1.5,m.z); };
      await bekle(3200);
      K.userData.saril=0; D.userData.saril=0; D.userData.kafa.rotation.z=0;
      await konus("kardelen",["Bu şov olmuş ya 😍","Gurur duydum seninle"],{gul:.9});
      await konus("kaan","O kılıcı ben çektim ama bu yolu birlikte yürüdük, minnakım.",{gul:.5});
      await konus("kardelen",["Nereye gidersen git","Ben hep o tribündeyim","Unutma bunu"],{gul:1});
      K.rotation.y=D.rotation.y=Math.PI*.15; D.position.copy(K.position).add(new THREE.Vector3(Math.cos(K.rotation.y)*.47,0,-Math.sin(K.rotation.y)*.47)); /* omuzlar iç içe girmesin (0.40'ta Kardelen Kaan'ın içinde görünüyordu) */
      K.userData.omuz=D.userData.omuz=1; // fotoğraftaki gibi: kolu omzunda
      K.userData.gulumse=.8; D.userData.gulumse=.7; D.userData.kafa.rotation.z=.16;
      const m=K.position.clone().lerp(D.position,.5); const ileri=new THREE.Vector3(Math.sin(K.rotation.y),0,Math.cos(K.rotation.y));
      kameraNoktasi(m.clone().addScaledVector(ileri,4.2).add(new THREE.Vector3(0,1.7,0)),m.clone().add(new THREE.Vector3(0,1.25,0)),0);
      await anlat("Bir hatıra fotoğrafı. Bu günü unutmamak için.");
      await konus("kardelen",["Gözün açık olsun ama 😄","Kapalı çıkarsa bir daha çekeriz"],{gul:1,kamera:false});
      await kameraNoktasi(m.clone().addScaledVector(ileri,3).add(new THREE.Vector3(0,1.55,0)),m.clone().add(new THREE.Vector3(0,1.25,0)),1.6);
      const qte=el(`<div class="qte"><button class="btn qte-btn">📷 Fotoğrafı çek</button></div>`); katman.appendChild(qte);
      await new Promise(r=>{ qte.querySelector("button").onclick=r; }); qte.remove();
      await hatiraFoto("Mezuniyet · Ağustos 2024");
      setTimeout(()=>{ K.userData.omuz=D.userData.omuz=0; },2600);
      await bekle(2400);
    });
    bolumBitti(this.no);
  },
  guncelle(dt){
    this.t+=dt; dalgaGuncelle(this.t);
    const K=this.kaan, D=this.kar;
    const sinir=p=>{ p.x=clamp(p.x,-30,30); p.z=clamp(p.z,-13.4,22); p.y=0; };
    if(this.serbest&&!kilit) yuru(K,dt,sinir,2.4);
    etkilesimGuncelle(K,this.btn);
    if(!Kamera.sinema) Kamera.hedef.lerp(K.position,.1);
    if(!D.userData.salla&&!kilit&&this.bulundu) D.userData.bakNokta=bas(K);
    // mezunların kılıç pozu
    for(const m of this.mezun){ const u=m.userData; if(u.kilicPoz&&!u.kilicN){ u.kilicN=kilicYap(); scene.add(u.kilicN); } if(u.kilicN) u.kilicN.visible=!!u.kilicPoz; }
  },
  temizle(){ DALGA=[]; Ses.kis(false); try{ window.speechSynthesis&&speechSynthesis.cancel(); }catch(e){} try{ this._mk&&this._mk.stop&&this._mk.stop(); }catch(e){} this._mk=null; }
};
