/* ================= KAPADOKYA: şafakta balon fotoğrafı + vadilerde ATV turu (gerçekte yaptıkları) ================= */
function atvYap(){
  const g=new THREE.Group(); const kirmizi=mat("#b3262b",{roughness:.45,metalness:.25}), siyah=mat("#18181b",{roughness:.7}), krom=mat("#c9cdd2",{metalness:.9,roughness:.25}), lastik=mat("#1c1c1e",{roughness:.95});
  const kutu=(w,h,d,x,y,z,m,rx=0)=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); b.position.set(x,y,z); b.rotation.x=rx; b.castShadow=true; g.add(b); return b; };
  kutu(.9,.32,1.5,0,.62,0,kirmizi); kutu(1.08,.1,.62,0,.8,.62,kirmizi,-.12); kutu(1.08,.1,.55,0,.8,-.62,kirmizi,.1);   // gövde ve çamurluklar
  kutu(.42,.14,.95,0,.86,-.18,siyah);                                                                                // sele
  kutu(.36,.18,.3,0,.92,.42,kirmizi,-.3);                                                                             // depo
  const tekerler=[]; for(const [x,z] of [[-.5,.6],[.5,.6],[-.5,-.6],[.5,-.6]]){ const t=new THREE.Group(); t.position.set(x,.3,z);
    const l=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.24,18),lastik); l.rotation.z=Math.PI/2; l.castShadow=true; t.add(l);
    const j=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.25,12),krom); j.rotation.z=Math.PI/2; t.add(j); g.add(t); tekerler.push(t); }
  const gidon=new THREE.Group(); gidon.position.set(0,1.0,.52); g.add(gidon);
  const boru=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.72,8),krom); boru.rotation.z=Math.PI/2; gidon.add(boru);
  const kolon=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.3,8),krom); kolon.position.set(0,-.14,-.02); kolon.rotation.x=.3; gidon.add(kolon);
  for(const x of [-.33,.33]){ const e=new THREE.Mesh(new THREE.CylinderGeometry(.024,.024,.13,8),siyah); e.rotation.z=Math.PI/2; e.position.x=x; gidon.add(e); }
  const far=new THREE.Mesh(new THREE.CircleGeometry(.07,12),new THREE.MeshStandardMaterial({color:renk("#fff6dc"),emissive:renk("#ffe9b0"),emissiveIntensity:.8})); far.position.set(0,.78,.95); g.add(far);
  for(const x of [-.32,.32]) kutu(.14,.03,.32,x,.38,.02,siyah);   // ayak basamakları
  g.userData={tekerler,gidon}; return g;
}
Object.assign(B3,{
  // vadi yolu: kontrol noktaları; yükseklik araziden alınıp yumuşatılır, eğim sınırlanır
  yolHazirla(){
    const K=[[55,-22],[46,-58],[18,-84],[-14,-99],[-36,-128],[-27,-163],[4,-188],[34,-204],[52,-236]];
    const egri=new THREE.CatmullRomCurve3(K.map(([x,z])=>new THREE.Vector3(x,0,z)),false,"catmullrom",.4);
    const L=egri.getLength(), n=Math.ceil(L); const P=[], Y=[];
    for(let i=0;i<=n;i++){ const p=egri.getPointAt(i/n); P.push(p); Y.push(this.yuk(p.x,p.z)); }
    // hareketli ortalama (±18 m) + eğim en fazla %10
    let Ys=Y.map((_,i)=>{ let t=0,c=0; for(let k=-18;k<=18;k++){ const j=Math.min(n,Math.max(0,i+k)); t+=Y[j]; c++; } return t/c; });
    for(let it=0;it<3;it++){ for(let i=1;i<=n;i++) Ys[i]=Math.max(Ys[i-1]-.1,Math.min(Ys[i-1]+.1,Ys[i])); for(let i=n-1;i>=0;i--) Ys[i]=Math.max(Ys[i+1]-.1,Math.min(Ys[i+1]+.1,Ys[i])); }
    const T=[], R=[]; for(let i=0;i<=n;i++){ const a=P[Math.max(0,i-1)], b=P[Math.min(n,i+1)]; const t=b.clone().sub(a); t.y=0; t.normalize(); T.push(t); R.push(new THREE.Vector3(-t.z,0,t.x)); }
    P.forEach((p,i)=>p.y=Ys[i]+.05);
    this.yol={P,T,R,n,L};
  },
  // yola yakın arazi yol yüksekliğine iner (yarma/dolgu), uzakta doğal arazi
  yolYakin(x,z){ const Y=this.yol; if(!Y) return null; let en=1e9, ei=0; for(let i=0;i<=Y.n;i+=2){ const p=Y.P[i]; const d=(p.x-x)*(p.x-x)+(p.z-z)*(p.z-z); if(d<en){ en=d; ei=i; } } return {d:Math.sqrt(en),y:Y.P[ei].y,i:ei}; },
  yukYol(x,z){ const h=this.yuk(x,z); const y=this.yolYakin(x,z); if(!y||y.d>16) return h; const k=Math.min(1,Math.max(0,(16-y.d)/10)); const k2=k*k*(3-2*k); return h+(y.y-.08-h)*k2; },
  yolKur(){
    const Y=this.yol; const pos=[], uv=[], idx=[]; const G=3.3;
    for(let i=0;i<=Y.n;i++){ const p=Y.P[i], r=Y.R[i]; for(const s of [-1,1]){ pos.push(p.x+r.x*G*s,p.y+.02,p.z+r.z*G*s); uv.push(s>0?1:0,i*.15); } if(i<Y.n){ const a=i*2; idx.push(a,a+2,a+1, a+1,a+2,a+3); } }
    const geo=new THREE.BufferGeometry(); geo.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2)); geo.setIndex(idx); geo.computeVertexNormals();
    const c=document.createElement("canvas"); c.width=128; c.height=256; const x=c.getContext("2d"); x.fillStyle="#c79b74"; x.fillRect(0,0,128,256);
    for(let i=0;i<900;i++){ x.fillStyle=`rgba(${120+Math.random()*80},${80+Math.random()*60},${50+Math.random()*40},${.15+Math.random()*.3})`; x.fillRect(Math.random()*128,Math.random()*256,1+Math.random()*3,1+Math.random()*3); }
    for(const tx of [34,94]){ x.fillStyle="rgba(120,84,58,.35)"; x.fillRect(tx-7,0,14,256); }   // tekerlek izleri
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding;
    const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:t,roughness:1})); m.receiveShadow=true; scene.add(m); this.yolMesh=m;
    // yol kenarında ahşap tabelalar: görevdeki duraklar yolda da görünsün
    const tahta=mat("#8a5a36",{roughness:.9});
    for(const [f,yazi] of [[.29,"GÜVERCİNLİK →"],[.53,"AŞK VADİSİ →"],[.84,"UÇHİSAR ↑"]]){ const i=Math.round(f*Y.n), p=Y.P[i], r=Y.R[i], tg=Y.T[i];
      const x=p.x+r.x*4.7, z=p.z+r.z*4.7, g=new THREE.Group(); g.position.set(x,this.yukYol(x,z)-.05,z);
      const yon=tg.clone().negate().addScaledVector(r,-.45).normalize(); g.rotation.y=Math.atan2(yon.x,yon.z); scene.add(g);
      const dir=new THREE.Mesh(new THREE.CylinderGeometry(.07,.08,2.3,8),tahta); dir.position.y=1.15; g.add(dir);
      const lv=new THREE.Mesh(new THREE.BoxGeometry(2.3,.62,.06),tahta); lv.position.y=2.0; g.add(lv);
      const yz=new THREE.Mesh(new THREE.PlaneGeometry(2.2,.54),new THREE.MeshStandardMaterial({map:yaziDoku(yazi,{w:512,h:126,zemin:"#e9d3ae",renk:"#4a2c16",font:"700 58px Georgia"}),roughness:.85})); yz.position.set(0,2.0,.032); g.add(yz); }
  },
  // şafak: telefonla balon fotoğrafı (sürükle: bak, kaydırıcı: yakınlaştır, deklanşör: çek; karedeki balonlar sayılır)
  async balonFoto(){
    const K=this.kaan, D=this.kar; const ui=el(`<div class="sim" style="background:none"><div class="baslik" style="text-shadow:0 1px 8px #000">Balonları çek</div><div class="ipucu" style="text-shadow:0 1px 8px #000">Ekranı sürükleyip bak, kaydırıcıyla yakınlaştır. En çok balonu tek karede yakala.</div>
      <div class="satir"><div class="olcek"><small><span>Yakınlaştırma</span><span class="zm">1x</span></small><input class="zoom" type="range" min="1" max="4" step="0.05" value="1" style="width:100%;pointer-events:auto"></div></div>
      <div class="satir"><span class="say" style="font:700 15px var(--f-ui);color:#fff3e0;min-width:110px;text-align:center">0 / 5 kare</span><button class="tamam deklan" style="min-width:120px">📷 Çek</button></div></div>`);
    const vz=el(`<div class="vizor" style="pointer-events:none"><i class="k1"></i><i class="k2"></i><i class="k3"></i><i class="k4"></i></div>`); katman.append(vz,ui);
    let yaw=0, pitch=.12, fov=55, kare=0, enIyi=0; const goz=new THREE.Vector3(-.2,1.45,-2.3); const fov0=camera.fov;
    let id=null, x0=0, y0=0; const cv=canvas;
    const pd=e=>{ if(id!==null) return; id=e.pointerId; x0=e.clientX; y0=e.clientY; }, pm=e=>{ if(e.pointerId!==id) return; yaw-=(e.clientX-x0)*.004*(fov/55); pitch=clamp(pitch+(e.clientY-y0)*.004*(fov/55),-.1,.75); x0=e.clientX; y0=e.clientY; }, pu=e=>{ if(e.pointerId===id) id=null; };
    cv.addEventListener("pointerdown",pd); cv.addEventListener("pointermove",pm); cv.addEventListener("pointerup",pu); cv.addEventListener("pointercancel",pu);
    this._fotoSok=()=>{ cv.removeEventListener("pointerdown",pd); cv.removeEventListener("pointermove",pm); cv.removeEventListener("pointerup",pu); cv.removeEventListener("pointercancel",pu); camera.fov=fov0; camera.updateProjectionMatrix(); this._fotoSok=null; };
    const zm=ui.querySelector(".zoom"), zt=ui.querySelector(".zm"); zm.oninput=()=>{ fov=55/(+zm.value); zt.textContent=(+zm.value).toFixed(1)+"x"; };
    Kamera.sinema=()=>{ camera.fov=fov; camera.updateProjectionMatrix(); camera.position.copy(goz); const d=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)); camera.lookAt(goz.clone().add(d)); };
    const sozler=[["Ohaaa","Bak bak 😍"],["Bir tane daha","Şuradakini de çek"],["Live'dan güzel kareyi seçeriz"],["Bu gidişle 700 fotoğraf olur kdkdkd"],["Tamam tamam","En güzeli bu oldu"]];
    const esik=camera.aspect<1?8:12; // dikey telefonda kareye daha az balon sığar
    await new Promise(res=>{ ui.querySelector(".deklan").onclick=async()=>{ if(kare>=5) return;
        Ses.efekt("deklansor"); const f=el(`<div class="flas"></div>`); katman.appendChild(f); setTimeout(()=>f.remove(),700);
        camera.updateMatrixWorld(); let n=0; const v=new THREE.Vector3(); for(const b of this.balonlar){ v.copy(b.position).add(new THREE.Vector3(0,3.6*b.scale.y,0)).project(camera); if(v.z<1&&Math.abs(v.x)<.92&&Math.abs(v.y)<.92) n++; }
        kare++; enIyi=Math.max(enIyi,n); ui.querySelector(".say").textContent=`${kare} / 5 kare · ${n} balon`;
        ui.querySelector(".ipucu").textContent=n>=esik?`Bu karede ${n} balon var! Harika kare 😍`:n>0?`Bu karede ${n} balon var.`:"Karede balon yok 😄 Biraz yukarı bak.";
        { const s=sozler[kare-1]; if(s){ D.userData.konus=1; D.userData.gulumse=1; tost("Kardelen: "+s.join(" · "),1900); bekle(1500).then(()=>{ D.userData.konus=0; }); } }
        if(kare>=5){ bekle(1200).then(res); } }; });
    this._fotoSok&&this._fotoSok();
    ui.remove(); vz.remove(); boyut&&boyut(); this.harikaKare=enIyi>=esik;
    await hatiraFoto("Kapadokya şafağı · "+enIyi+" balon · Mayıs 2025",{kendi:true});
    return enIyi;
  },
  // ATV TURU: joystick ileri gaz, geri fren, sağ-sol direksiyon. Kardelen arkada sarılı. Toz kalkar, peri bacalarına çarpmamaya dikkat.
  async atv(){
    const K=this.kaan, D=this.kar; const Y=this.yol;
    await gecis(async()=>{
      this.sabahAyarla(1); scene.userData.gun.intensity=2.4;
      this.durum="atv"; this.balonlar.forEach(b=>{ b.position.y=Math.max(b.position.y,this.yuk(b.position.x,b.position.z)+b.userData.hedefY); });
      if(!this.atvG||this.atvG.parent!==scene){ this.atvG=atvYap(); scene.add(this.atvG); }
      const A=this.atvG; A.visible=true; this.atvS=4; this.atvL=0; this.atvV=0; this.atvYaw=0;
      for(const c of [K,D]){ scene.remove(c); A.add(c); c.rotation.set(0,0,0); c.userData.hiz=0; c.userData.bakNokta=null; c.userData.otur=1; c.userData.oturTip="ata"; }
      K.position.set(0,0,.02); K.userData.oturY=.66; D.position.set(0,0,-.42); D.userData.oturY=.7;
      D.userData.arkadan=1; D.userData.kafa.rotation.z=.12;
      this.atvTuta(); this.atvGuncelle(0);
      // toz
      const N=160; const pg=new THREE.BufferGeometry(); this.toz={p:new Float32Array(N*3),v:new Float32Array(N*3),o:new Float32Array(N),i:0,N};
      pg.setAttribute("position",new THREE.BufferAttribute(this.toz.p,3)); this.toz.m=new THREE.Points(pg,new THREE.PointsMaterial({map:parlakDokuAl(),color:renk("#d9b48e"),size:1.6,transparent:true,opacity:.35,depthWrite:false})); this.toz.m.frustumCulled=false; scene.add(this.toz.m);
      Kamera.sinema=null; Kamera.mesafe=6.5; Kamera.yukseklik=2.6; Kamera.poz.set(NaN,NaN,NaN); // perde açılınca kamera doğrudan ATV'nin arkasında (alçaktan, önceki çekimden süzülmez)
      const j=katman.querySelector(".joy"); if(j) j.style.opacity=1;
    });
    const ip=el(`<div class="sim" style="background:none;pointer-events:none"><div class="ipucu" style="text-shadow:0 1px 8px #000">Joystick: ileri gaz, geri fren, sağa-sola direksiyon</div><div class="satir"><span class="hiz" style="font:800 26px var(--f-ui);color:#fff3e0;text-shadow:0 2px 10px #000">0 km/s</span></div></div>`); katman.appendChild(ip); this.atvUI=ip;
    gorev("Vadi turu · Güvercinlik'e kadar sür");
    // sürüş boyunca konuşma kutusu ekranın üstünde: joystick'in üstünü kapatmasın
    const dkK=diyalogKutusu(); dkK.style.bottom="auto"; dkK.style.top="calc(env(safe-area-inset-top,0px) + 118px)";
    await konus("kardelen",["Yavaş git ama şapşik 😄","Sıkı tutunuyorum"],{gul:1,kamera:false,sure:2.4});
    const nokta=async(oran,yeniGorev,sozler)=>{ await kosul(()=>this.atvS>=Y.L*oran); Ses.efekt("parilti"); if(yeniGorev) gorev(yeniGorev); for(const [kim,m] of sozler) await konus(kim,m,{gul:.9,kamera:false,sure:2.6}); };
    await nokta(.18,null,[["kardelen",["Ohaa toz oldum kdkdkd"]],["kaan","Dedim sana rahat bir şeyler giy diye 😄"],["kardelen",["İyi ki dedin","Reis 😄"]]]);
    await nokta(.36,"Vadi turu · Aşk Vadisi'ne sür",[["kardelen",["Güvercinlik burası","Bak taşlarda delikler"]],["kaan","Eskiden güvercinler yaşarmış oralarda."]]);
    await nokta(.6,"Vadi turu · Uçhisar'ı gören tepeye çık",[["kardelen",["Aşk Vadisi'ymiş adı","Tam bizlik 😍"]],["kaan","Ralli pilotu gibiyim di mi? Doğuştan 😎"],["kardelen",["Artis 😄","Ama yakışıyor"]]]);
    await nokta(.98,null,[]);
    this.durum="atvDur"; gorev(null); ip.remove(); dkK.style.bottom=""; dkK.style.top="";
    await sahne(async()=>{
      const A=this.atvG; const m=A.localToWorld(new THREE.Vector3(0,1.2,0));
      let s=0; Kamera.sinema=dt=>{ s+=dt; camera.position.copy(m).add(new THREE.Vector3(Math.sin(s*.12+1)*6,1.6,Math.cos(s*.12+1)*6)); camera.lookAt(m); };
      await anlat("Tepeden bütün vadi ayaklarımızın altındaydı. Karşıda Uçhisar Kalesi.");
      await konus("kardelen",["Görüşemeyeceğiz diye","Bir çılgınlık ettik ama","İyi ki ettik"],{gul:.8});
      await konus("kaan","Uzağa gitmeden önceki en güzel kaçamağımız. Bunu hep hatırlayacağız, minnakım.",{gul:.6});
      await konus("kardelen",["Fav yerim burası","Yine geleceğiz ama","Söz ver"],{gul:1});
      await konus("kaan","Söz. Bir dahakine balona da bineriz, haberin olsun.",{gul:.8});
      const q=el(`<div class="qte"><button class="btn qte-btn">📷 ATV'nin üstünde bir fotoğraf</button></div>`); katman.appendChild(q);
      await new Promise(r=>{ q.querySelector("button").onclick=r; }); q.remove();
      await hatiraFoto("Kapadokya · ATV turu · Mayıs 2025"); await bekle(1500);
      await anlat("Dönüşte hayatımda ilk kez sekiz saat araba sürdüm. Yanımda o uyudu.",3200);
      await anlat("Hâlâ söyler: En sevdiği yer Nevşehir.",3400);
    });
    bolumBitti(this.no);
  },
  // Kaan'ın elleri gidonda (IK hedefleri her karede gidonla birlikte güncellenir)
  atvTuta(){ const K=this.kaan, A=this.atvG, gd=A.userData.gidon; gd.updateMatrixWorld(true);
    const sag=A.localToWorld(new THREE.Vector3(1,0,0)).sub(A.getWorldPosition(new THREE.Vector3())).normalize(), ileri=A.localToWorld(new THREE.Vector3(0,0,1)).sub(A.getWorldPosition(new THREE.Vector3())).normalize();
    const tut={}; for(const [yan,x] of [["Left",.33],["Right",-.33]]){ const p=gd.localToWorld(new THREE.Vector3(x,0,0)); const s=Math.sign(x);
      tut[yan]={p:p.addScaledVector(ileri,-.07).add(new THREE.Vector3(0,-.02,0)),F:sag.clone().multiplyScalar(-s).addScaledVector(ileri,.3).normalize(),N:new THREE.Vector3(0,-1,0).addScaledVector(ileri,.6).normalize(),kutup:sag.clone().multiplyScalar(s).add(new THREE.Vector3(0,-.6,0)).addScaledVector(ileri,-.3).normalize(),kivrim:[1.25,1.45,.95]}; }
    K.userData.elHedef=tut; },
  atvGuncelle(dt){
    const Y=this.yol, A=this.atvG; if(!A) return;
    const surus=this.durum==="atv"&&!kilit; const v=surus?girdiVek():{x:0,y:0};
    const gaz=Math.max(0,-v.y), fren=Math.max(0,v.y)+(this.durum!=="atv"?1:0);
    const i0=Math.min(Y.n-1,Math.max(0,Math.floor(this.atvS))); const egim=(Y.P[i0+1].y-Y.P[i0].y);
    this.atvV+=(gaz*4.2-fren*7*(this.atvV>0?1:0)-this.atvV*.18-egim*9.8*.5)*dt; this.atvV=clamp(this.atvV,0,13);
    this.atvS=Math.min(Y.L-.5,this.atvS+this.atvV*dt);
    this.atvL=clamp(this.atvL+v.x*this.atvV*.32*dt,-2.6,2.6);
    if(Math.abs(this.atvL)>=2.6&&this.atvV>4){ this.atvV*=.97; if(!this._kenar||zaman-this._kenar>6){ this._kenar=zaman; konus("kardelen",["Dikkat et 😱"],{kamera:false,sure:1.2}); } }
    // peri bacası çarpması
    const i=Math.min(Y.n,Math.max(0,Math.round(this.atvS))); const p=Y.P[i].clone().addScaledVector(Y.R[i],this.atvL);
    if(this.peri) for(const q of this.peri){ const dx=p.x-q.x, dz=p.z-q.z, R=q.r+.9; if(dx*dx+dz*dz<R*R){ this.atvV*=.5; this.atvL-=Math.sign(this.atvL||1)*.05; } }
    const t=Y.T[i]; this.atvYaw=lerp(this.atvYaw,v.x*.35*Math.min(1,this.atvV/4),.1);
    A.position.copy(p); A.position.y+=Math.sin(zaman*17)*.012*Math.min(1,this.atvV/6)+Math.sin(zaman*7.3)*.01*Math.min(1,this.atvV/6);
    A.rotation.set(0,Math.atan2(t.x,t.z)-this.atvYaw,0); A.rotateX(-Math.atan(egim)); A.rotateZ(Math.sin(zaman*5.1)*.02*Math.min(1,this.atvV/6));
    for(const w of A.userData.tekerler) w.children[0].rotation.x-=this.atvV*dt/.3, w.children[1].rotation.x=w.children[0].rotation.x;
    A.userData.gidon.rotation.y=this.atvYaw*1.5; this.atvTuta();
    if(this.atvUI){ const h=this.atvUI.querySelector(".hiz"); if(h) h.textContent=Math.round(this.atvV*3.6)+" km/s"; }
    // toz
    const T_=this.toz; if(T_){ const P_=T_.p, V_=T_.v; const yayin=this.atvV>1.5?Math.min(3,Math.round(this.atvV/4)):0;
      for(let k=0;k<yayin;k++){ const j=T_.i; T_.i=(T_.i+1)%T_.N; const arka=A.localToWorld(new THREE.Vector3(rnd(-.6,.6),.25,-.9)); P_[j*3]=arka.x; P_[j*3+1]=arka.y; P_[j*3+2]=arka.z; V_[j*3]=rnd(-.4,.4); V_[j*3+1]=rnd(.3,.9); V_[j*3+2]=rnd(-.4,.4); }
      for(let j=0;j<T_.N;j++){ P_[j*3]+=V_[j*3]*dt; P_[j*3+1]+=V_[j*3+1]*dt; P_[j*3+2]+=V_[j*3+2]*dt; V_[j*3+1]*=.98; }
      T_.m.geometry.attributes.position.needsUpdate=true; }
    if(!Kamera.sinema){ const geri=A.localToWorld(new THREE.Vector3(0,0,-1)).sub(A.position).normalize(); Kamera.aci=Math.atan2(geri.x,geri.z); Kamera.hedef.copy(A.position).add(new THREE.Vector3(0,.4,0)); }
  }
});
