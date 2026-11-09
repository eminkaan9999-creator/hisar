/* ================= BÖLÜM 8: PATARA (Ağustos 2026) =================
   Antalya'da kiralık manuel araba (otomatik kullanamadığım için), sahil yolu; Aspendos tiyatrosunda fısıltı;
   Patara'da antik kent, caretta yuvaları ("carettalar da varmış reis"), denizde el ele, kumullarda gün batımı. */
// caretta yuvası koruma kafesi: tel örgü silindir ve kapak (saydam örgü dokusu), kazık ve uyarı tabelası
function telOrguDoku(){ if(telOrguDoku.t) return telOrguDoku.t; const c=document.createElement("canvas"); c.width=c.height=128; const x=c.getContext("2d"); x.clearRect(0,0,128,128);
  x.strokeStyle="rgba(205,205,200,1)"; x.lineWidth=2; for(let i=0;i<=128;i+=16){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,128); x.stroke(); x.beginPath(); x.moveTo(0,i); x.lineTo(128,i); x.stroke(); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.__kalici=true; telOrguDoku.t=t; return t; }
function kafesYap(){ const g=new THREE.Group(); const tt=telOrguDoku();
  const ym=new THREE.MeshStandardMaterial({map:tt.clone(),alphaTest:.35,side:THREE.DoubleSide,metalness:.5,roughness:.5}); ym.map.repeat.set(10,1.4); ym.map.needsUpdate=true;
  const k=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.45,24,1,true),ym); k.position.y=.2; g.add(k);
  const um=ym.clone(); um.map=tt.clone(); um.map.repeat.set(4,4); um.map.needsUpdate=true; const u=new THREE.Mesh(new THREE.CircleGeometry(.55,24),um); u.rotation.x=-Math.PI/2; u.position.y=.425; g.add(u);
  const cm=mat("#8a8a86",{metalness:.6,roughness:.4}); const hal=new THREE.Mesh(new THREE.TorusGeometry(.55,.008,6,40),cm); hal.rotation.x=Math.PI/2; hal.position.y=.425; g.add(hal);
  for(let i=0;i<4;i++){ const a=i*Math.PI/2+.4; const kz=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.6,6),cm); kz.position.set(Math.cos(a)*.56,.2,Math.sin(a)*.56); g.add(kz); }
  const d=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.15,6),mat("#7a5a3a",{roughness:.9})); d.position.set(.7,.55,0); g.add(d);
  const tc=document.createElement("canvas"); tc.width=256; tc.height=160; const tx=tc.getContext("2d"); tx.fillStyle="#f4efe2"; tx.fillRect(0,0,256,160); tx.strokeStyle="#2a6a44"; tx.lineWidth=8; tx.strokeRect(6,6,244,148);
  tx.fillStyle="#2a6a44"; tx.textAlign="center"; tx.font="800 30px Arial"; tx.fillText("DİKKAT!",128,48); tx.font="700 26px Arial"; tx.fillText("CARETTA",128,88); tx.fillText("YUVASI",128,120);
  tx.beginPath(); tx.ellipse(40,104,16,11,0,0,7); tx.fill(); tx.beginPath(); tx.arc(58,98,6,0,7); tx.fill();
  const tt2=new THREE.CanvasTexture(tc); tt2.encoding=THREE.sRGBEncoding; const t=new THREE.Mesh(new THREE.PlaneGeometry(.42,.26),new THREE.MeshStandardMaterial({map:tt2,roughness:.8})); t.position.set(.7,1.0,.03); g.add(t);
  g.userData.engel=.6; return g; }
// Aspendos sahne binası: kırmızımsı kesme taş sıraları, harç izleri, yer yer aşınma
function tasDuvarDoku(){ if(tasDuvarDoku.t) return tasDuvarDoku.t; const c=document.createElement("canvas"); c.width=c.height=512; const x=c.getContext("2d");
  x.fillStyle="#8a6a4e"; x.fillRect(0,0,512,512);
  for(let r=0;r<16;r++){ const h=32, o=(r%2)*24; for(let k=-1;k<11;k++){ const w=48; const px=k*w+o, py=r*h; const t=rnd(-14,14);
      x.fillStyle=`rgb(${(198+t)|0},${(152+t*.8)|0},${(108+t*.6)|0})`; x.fillRect(px+2,py+2,w-4,h-4);
      const g=x.createLinearGradient(0,py,0,py+h); g.addColorStop(0,"rgba(255,235,210,.12)"); g.addColorStop(1,"rgba(60,40,25,.18)"); x.fillStyle=g; x.fillRect(px+2,py+2,w-4,h-4); } }
  const d=x.getImageData(0,0,512,512); for(let i=0;i<d.data.length;i+=4){ const n=(Math.random()-.5)*26; d.data[i]+=n; d.data[i+1]+=n; d.data[i+2]+=n; } x.putImageData(d,0,0);
  for(let i=0;i<30;i++){ const px=Math.random()*512, py=Math.random()*512, r=rnd(10,40); const g=x.createRadialGradient(px,py,0,px,py,r); g.addColorStop(0,"rgba(70,50,35,.25)"); g.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle=g; x.fillRect(px-r,py-r,2*r,2*r); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(4,2); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; t.__kalici=true; tasDuvarDoku.t=t; return t; }
// Toros eteği: gürültüyle bozulmuş, yumuşak gölgeli dağ; etekte çam yeşili, yukarıda kayalık
function torosDagi(r,h){ const g=new THREE.ConeGeometry(r,h,40,10); const P=g.attributes.position, renkler=[], t=Math.random()*10;
  const alt=renk("#4f6a3a"), orta=renk("#6f7a52"), ust=renk("#9a927e"), c=new THREE.Color();
  for(let i=0;i<P.count;i++){ const x=P.getX(i), y=P.getY(i), z=P.getZ(i); const a=Math.atan2(z,x), k=(y+h/2)/h;
    const n=1+.18*Math.sin(a*3+t)+.1*Math.sin(a*7+t*2)+.06*Math.sin(a*13+y*.2); const yy=y+Math.sin(a*5+t)*h*.04*(1-Math.abs(k-.5)*2);
    if(k<.999){ P.setX(i,x*n); P.setZ(i,z*n); } P.setY(i,yy);
    c.copy(alt).lerp(orta,THREE.MathUtils.smoothstep(k,.25,.6)).lerp(ust,THREE.MathUtils.smoothstep(k,.62,.9)).multiplyScalar(rnd(.92,1.06)); renkler.push(c.r,c.g,c.b); }
  g.setAttribute("color",new THREE.Float32BufferAttribute(renkler,3)); g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,bumpMap:gurultuDoku(8),bumpScale:.4})); return m; }
const B6={
  id:"patara", no:8, ad:"Patara", tarih:"Ağustos 2026", alt:"Manuel araba, Aspendos, carettalar, gün batımı",
  yer(x,z){ let y= z<1? (z-1)*.25:0; if(z>10) y+=Math.pow((z-10)/18,1.6)*(1.6+Math.sin(x*.07)*1.2+Math.sin(x*.19+z*.1)*.6); return y; },
  // menü arka planı da bu sahili kullanır
  async kur(){
    this.faz="sahil"; this.gokF=null; this.serbest=false; this.elele=false; this.dalgaK=0; const gy=new THREE.Vector3(-.2,.06,-1).normalize();
    sahneKur({sis:"#f2a37a",sisYakin:30,sisUzak:220,ust:"#3d4f8f",ufuk:"#ffb27a",alt:"#2b4f74",gunesYon:gy,isikYon:new THREE.Vector3(-.35,.5,-1),gunesRenk:"#ffc07a",isik:"#ffb37a",isikGuc:2.2,zemin:"#a07a5a",hemi:.8,dolgu:1.1,dolguRenk:"#ffd9c2"});
    this.t=0; DALGA=[]; ETK=[]; this.dalgaK=0; Ses.zemin="kum";
    if(THREE.Water){
      const sn=new THREE.TextureLoader().load(SU_NORMAL); sn.wrapS=sn.wrapT=THREE.RepeatWrapping;
      const wg=new THREE.PlaneGeometry(600,300); wg.rotateX(-Math.PI/2); wg.translate(0,0,-148);
      this.su=new THREE.Water(wg,{textureWidth:512,textureHeight:512,waterNormals:sn,sunDirection:gy.clone(),sunColor:0xffc490,waterColor:0x174f6b,distortionScale:2.2,fog:true,alpha:1});
      this.su.position.y=.02; scene.add(this.su);
      // kıyıya yakın sığ su: kumun üstünde turkuaz, açığa doğru solar (yukarıdan bakınca deniz kapkara görünmez)
      const sc=document.createElement("canvas"); sc.width=8; sc.height=256; const sx=sc.getContext("2d"); const sg=sx.createLinearGradient(0,0,0,256);
      sg.addColorStop(0,"rgba(40,120,140,0)"); sg.addColorStop(.55,"rgba(52,150,160,.38)"); sg.addColorStop(.85,"rgba(110,196,190,.62)"); sg.addColorStop(1,"rgba(190,215,190,.55)"); sx.fillStyle=sg; sx.fillRect(0,0,8,256);
      const st=new THREE.CanvasTexture(sc); st.encoding=THREE.sRGBEncoding;
      const sig=new THREE.Mesh(new THREE.PlaneGeometry(400,12),new THREE.MeshBasicMaterial({map:st,transparent:true,depthWrite:false,fog:true})); sig.rotation.x=-Math.PI/2; sig.position.set(0,.026,-5.0); scene.add(sig);
    } else { const dm=new THREE.Mesh(new THREE.PlaneGeometry(600,300).rotateX(-Math.PI/2).translate(0,0,-148),mat("#2d6e93",{roughness:.12,metalness:.35})); scene.add(dm); }
    const kg=new THREE.PlaneGeometry(400,120,140,46); kg.rotateX(-Math.PI/2); kg.translate(0,0,58);
    const kp=kg.attributes.position; const kr=[];
    for(let i=0;i<kp.count;i++){ const x=kp.getX(i), z=kp.getZ(i); let y=this.yer(x,z)+Math.sin(x*.9+z*.6)*.03; kp.setY(i,y); const c=renk(z<2.5?"#c9a36c":"#ecd1a0"); kr.push(c.r,c.g,c.b); }
    kg.setAttribute("color",new THREE.Float32BufferAttribute(kr,3)); kg.computeVertexNormals();
    const kum=new THREE.Mesh(kg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,bumpMap:gurultuDoku(90),bumpScale:.035})); kum.receiveShadow=true; scene.add(kum);
    // köpük: kıyıya vuran dalganın dantel gibi beyaz izi (yumuşak kenarlı, şeffaf doku)
    const kc=document.createElement("canvas"); kc.width=1024; kc.height=128; const kx=kc.getContext("2d"); kx.clearRect(0,0,1024,128);
    for(let k=0;k<5;k++){ kx.strokeStyle=`rgba(255,250,242,${.55-k*.09})`; kx.lineWidth=7-k; kx.filter=`blur(${1+k*.6}px)`; kx.beginPath(); for(let x=0;x<=1024;x+=8){ const y=28+k*18+Math.sin(x*.021+k*1.7)*7+Math.sin(x*.067+k)*3; if(x===0) kx.moveTo(x,y); else kx.lineTo(x,y); } kx.stroke(); }
    kx.filter="none"; for(let i=0;i<900;i++){ const x=Math.random()*1024, y=20+Math.random()*90; kx.fillStyle=`rgba(255,255,255,${Math.random()*.35})`; kx.fillRect(x,y,rnd(1,4),rnd(1,2)); }
    const kt=new THREE.CanvasTexture(kc); kt.wrapS=THREE.RepeatWrapping; kt.repeat.set(26,1); kt.encoding=THREE.sRGBEncoding;
    this.kopuk=new THREE.Mesh(new THREE.PlaneGeometry(400,2.2),new THREE.MeshBasicMaterial({map:kt,transparent:true,opacity:.75,depthWrite:false})); this.kopuk.rotation.x=-Math.PI/2; this.kopuk.position.set(0,.035,.4); scene.add(this.kopuk);
    scene.add(otlar(()=>{ const x=rnd(-90,90), z=rnd(12,40); return {x,y:this.yer(x,z),z}; },900,"#7d8f4f",.6));
    // antik kent kalıntıları
    const kal=new THREE.Group(); kal.position.set(-20,0,15); scene.add(kal);
    for(let i=0;i<9;i++){ const s=sutun(5.2,i%3===1); s.position.set(i*2.4-9,this.yer(-20+i*2.4-9,15)-.2,Math.sin(i)*.4); kal.add(s); }
    const arsit=new THREE.Mesh(new THREE.BoxGeometry(12,.45,1),mat("#e8dcc4",{roughness:.9})); arsit.position.set(-3.6,5.8,0); arsit.castShadow=true; kal.add(arsit);
    for(let i=0;i<8;i++){ const k=kaya(rnd(.4,.9),"#d9c9ac"); k.position.set(rnd(-12,10),this.yer(-20+rnd(-12,10),15)+.1,rnd(-3,4)); kal.add(k); }
    // caretta yuvaları (tel kafesler, tabela)
    this.yuvalar=[[12,8.2],[15,9.4],[18.5,8.6]].map(([x,z])=>{ const k=kafesYap(); k.position.set(x,this.yer(x,z),z); k.rotation.y=rnd(-.3,.3); scene.add(k); return k; });
    // battaniye + fener
    this.bat=new THREE.Group(); this.bat.position.set(9,0,4);
    const b=new THREE.Mesh(new THREE.BoxGeometry(2.2,.03,1.6),mat("#c4544f",{roughness:.95})); b.position.y=.02; b.receiveShadow=true; this.bat.add(b);
    for(let i=0;i<4;i++){ const s=new THREE.Mesh(new THREE.BoxGeometry(2.2,.032,.12),mat("#f1e4c8")); s.position.set(0,.025,-.6+i*.4); this.bat.add(s); }
    const fen=new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,.26,8),new THREE.MeshStandardMaterial({color:renk("#ffd28a"),emissive:renk("#ffb04a"),emissiveIntensity:1.4})); fen.position.set(.9,.15,-.55); this.bat.add(fen);
    const fl=parilti("#ffb04a",1.6); fl.position.set(.9,.2,-.55); this.bat.add(fl);
    this.fenerIsik=new THREE.PointLight(renk("#ffb04a"),.8,6); this.fenerIsik.position.set(.9,.4,-.55); this.bat.add(this.fenerIsik);
    const sepet=new THREE.Mesh(new THREE.CylinderGeometry(.22,.18,.25,12),mat("#a67845",{roughness:.95})); sepet.position.set(-.85,.13,-.5); sepet.castShadow=true; this.bat.add(sepet);
    scene.add(this.bat);
    this.toz=tozlar(90,()=>({x:rnd(-40,50),y:rnd(.3,3),z:rnd(-2,14)}),"#ffe6c8",.06); scene.add(this.toz);
    await yazHazirla();
    this.kaan=karakter("kaan","yaz"); this.kar=karakter("kardelen","yaz");
    this.kaan.position.set(-12,this.yer(-12,9),9); this.kar.position.set(-11.5,0,9.4); this.kaan.rotation.y=this.kar.rotation.y=Math.PI*.55; scene.add(this.kaan,this.kar);
    KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    Kamera.sinema=null; Kamera.aci=.35; Kamera.mesafe=7.5; Kamera.yukseklik=3; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(-6,4,18);
    Ses.ton="sicak"; Ses.denizBaslat();
  },
  menuPozu(son){
    const K=this.kaan, D=this.kar, B=this.bat.position;
    K.position.set(B.x-.35,0,B.z-.1); D.position.set(B.x+.35,0,B.z-.1); K.rotation.y=D.rotation.y=Math.PI*1.02;
    K.userData.otur=D.userData.otur=1; K.userData.elele=D.userData.elele=1; D.userData.kafa.rotation.z=-.28; D.userData.gulumse=.6; K.userData.gulumse=.4;
    let s=0; Kamera.sinema=dt=>{ s+=dt; const a=(son?.3:.8)+Math.sin(s*.05)*.3; camera.position.set(9+Math.sin(a)*6.5,1.8,4+Math.cos(a)*6.5); camera.lookAt(9,1.4,-4); };
  },
  arkaGuncelle(dt){ this.t+=dt; if(this.su) this.su.material.uniforms.time.value=this.t*.6; this.kopuk.position.z=.4+Math.sin(this.t*.8)*.45; this.kopuk.material.map.offset.x+=dt*.004; },
  // ---------- SAHİL YOLU: MANUEL ARABA ----------
  async bolumKur(){ await this.yolKur(); },
  async yolKur(){
    this.faz="yol"; this.t=0; ETK=[]; DALGA=[]; this.serbest=false; this.elele=false; this.gokF=null;
    sahneKur({sis:"#cfe2f0",sisYakin:40,sisUzak:260,ust:"#4f86c6",ufuk:"#d9ecf7",alt:"#6aa0c8",gunesYon:new THREE.Vector3(.4,.6,-.5).normalize(),isikYon:new THREE.Vector3(.4,.7,-.4),gunesRenk:"#fff2d0",isik:"#fff1dc",isikGuc:2.2,zemin:"#b8a888",hemi:.9,dolgu:.6,dolguRenk:"#ffe6c8"});
    const yolC=document.createElement("canvas"); yolC.width=128; yolC.height=512; const yx=yolC.getContext("2d"); yx.fillStyle="#3a3c40"; yx.fillRect(0,0,128,512); yx.fillStyle="#f2f2ea"; for(let i=0;i<4;i++) yx.fillRect(62,i*128,4,70); yx.fillRect(6,0,4,512); yx.fillRect(118,0,4,512);
    const yt=new THREE.CanvasTexture(yolC); yt.wrapS=yt.wrapT=THREE.RepeatWrapping; yt.repeat.set(1,24); yt.encoding=THREE.sRGBEncoding; this.yolDoku=yt;
    const yol=new THREE.Mesh(new THREE.PlaneGeometry(8,480),new THREE.MeshStandardMaterial({map:yt,roughness:.8})); yol.rotation.x=-Math.PI/2; yol.position.set(0,0,-230); scene.add(yol);
    const deniz=new THREE.Mesh(new THREE.PlaneGeometry(400,500),new THREE.MeshStandardMaterial({color:renk("#1f6fa6"),roughness:.1,metalness:.5,envMapIntensity:1.2})); deniz.rotation.x=-Math.PI/2; deniz.position.set(-206,-3,-230); scene.add(deniz);
    const kiyi=new THREE.Mesh(new THREE.PlaneGeometry(14,500),mat("#c9b48a",{roughness:1})); kiyi.rotation.x=-Math.PI/2; kiyi.position.set(-10,-.4,-230); scene.add(kiyi);
    this.daglar=[]; for(let i=0;i<14;i++){ const h=rnd(34,70), d=torosDagi(rnd(28,46),h); d.position.set(rnd(60,105),h/2-4,-i*36-rnd(0,20)); d.rotation.y=rnd(0,6); scene.add(d); this.daglar.push(d); }
    // yolun dağ tarafı: makilik, kuru ot; yol kenarında toprak banket
    { const g=new THREE.PlaneGeometry(158,500,64,80); g.rotateX(-Math.PI/2); const P=g.attributes.position, cr=[], c=new THREE.Color(), a0=renk("#8a8452"), a1=renk("#6f7d45"), a2=renk("#a89a6a");
      for(let i=0;i<P.count;i++){ const x=P.getX(i)+75, z=P.getZ(i); const y=Math.max(0,(x-9)*.04)*(1+.6*Math.sin(z*.05+x*.02))+Math.sin(x*.3)*Math.cos(z*.25)*.15*THREE.MathUtils.smoothstep(x,7,12); P.setY(i,y-.06);
        c.copy(a0).lerp(a1,.5+.5*Math.sin(x*.11+z*.07)).lerp(a2,x<7?.8:0).multiplyScalar(rnd(.9,1.08)); cr.push(c.r,c.g,c.b); }
      g.setAttribute("color",new THREE.Float32BufferAttribute(cr,3)); g.computeVertexNormals();
      const zb=gurultuDoku(80); this.zeminDoku=zb; const ze=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,bumpMap:zb,bumpScale:.06})); ze.position.set(75,0,-230); ze.receiveShadow=true; scene.add(ze); }
    this.agaclar=[]; for(let i=0;i<34;i++){ const a=agac(i%3?"zeytin":"cam",rnd(1,1.4)); a.position.set(rnd(7,22),0,-i*14-rnd(0,8)); scene.add(a); this.agaclar.push(a); }
    const ic=new THREE.Group(); scene.add(ic);
    const torp=new THREE.Mesh(new THREE.BoxGeometry(1.8,.26,.6),mat("#2a2b2e",{roughness:.7})); torp.position.set(0,.88,-.78); ic.add(torp);
    const dir=new THREE.Mesh(new THREE.TorusGeometry(.19,.02,10,32),mat("#151515",{roughness:.6})); dir.position.set(-.38,.96,-.42); dir.rotation.x=-1.0; ic.add(dir); this.direksiyon=dir;
    const vk=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.22,8),mat("#222")); vk.position.set(0,.86,-.25); vk.rotation.x=-.3; ic.add(vk); const vt=new THREE.Mesh(new THREE.SphereGeometry(.035,12,10),mat("#111",{roughness:.4})); vt.position.set(0,.97,-.28); ic.add(vt); this.vitesTopuz=vt;
    const tavan=new THREE.Mesh(new THREE.BoxGeometry(1.9,.06,1.5),mat("#77736b",{roughness:.95})); tavan.position.set(0,1.88,-.15); ic.add(tavan);
    for(const sx of [-.95,.95]){ const d=new THREE.Mesh(new THREE.BoxGeometry(.08,.9,.08),mat("#2a2b2e")); d.position.set(sx,1.45,-.92); d.rotation.x=-.42; ic.add(d); }
    // iç detaylar: yuvarlak torpido üstü, gösterge kalkanı, orta konsol ve navigasyon ekranı, dikiz aynası, direksiyon kolları
    const yum=mat("#232427",{roughness:.85}); const ust=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,1.8,16,1,false,0,Math.PI),yum); ust.rotation.z=Math.PI/2; ust.position.set(0,1.01,-.62); ic.add(ust);
    const kalkan=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.3,16,1,true,0,Math.PI),yum); kalkan.rotation.z=Math.PI/2; kalkan.position.set(-.38,1.05,-.64); ic.add(kalkan);
    const kol_=mat("#2c2d31",{roughness:.95,bumpMap:gurultuDoku(6),bumpScale:.004}); for(const sx of [-.38,.42]){ const o=new THREE.Mesh(new THREE.BoxGeometry(.52,.14,.52),kol_); o.position.set(sx,.74,.04); ic.add(o); const a=new THREE.Mesh(new THREE.BoxGeometry(.52,.72,.13),kol_); a.position.set(sx,1.13,.36); a.rotation.x=-.16; ic.add(a); const b_=new THREE.Mesh(new THREE.BoxGeometry(.28,.2,.1),kol_); b_.position.set(sx,1.6,.43); ic.add(b_); }
    const siper=new THREE.Mesh(new THREE.BoxGeometry(.5,.012,.2),mat("#6a655c",{roughness:.95})); siper.position.set(-.42,1.79,-.78); siper.rotation.x=.25; ic.add(siper);
    const nc=document.createElement("canvas"); nc.width=256; nc.height=160; const nx=nc.getContext("2d"); nx.fillStyle="#0e1a26"; nx.fillRect(0,0,256,160); nx.fillStyle="#1f6fa6"; nx.fillRect(0,0,70,160); nx.strokeStyle="#f2d27a"; nx.lineWidth=7; nx.beginPath(); nx.moveTo(150,160); nx.bezierCurveTo(140,110,95,90,105,40); nx.lineTo(118,0); nx.stroke(); nx.fillStyle="#ff6a6a"; nx.beginPath(); nx.arc(150,140,8,0,7); nx.fill();
    nx.fillStyle="rgba(0,0,0,.55)"; nx.fillRect(0,0,256,34); nx.fillStyle="#fff"; nx.font="700 20px Arial"; nx.fillText("Patara  ·  38 km",14,24);
    const nt=new THREE.CanvasTexture(nc); nt.encoding=THREE.sRGBEncoding; const ekran=new THREE.Mesh(new THREE.PlaneGeometry(.2,.125),new THREE.MeshBasicMaterial({map:nt,color:renk("#c8ccd2")})); ekran.position.set(.02,.91,-.465); ekran.rotation.x=-.12; ic.add(ekran);
    const kon=new THREE.Mesh(new THREE.BoxGeometry(.26,.32,.4),yum); kon.position.set(.02,.8,-.42); ic.add(kon);
    const ayna=new THREE.Mesh(new THREE.BoxGeometry(.24,.07,.02),mat("#1a1a1a",{roughness:.4})); ayna.position.set(-.05,1.66,-.66); ic.add(ayna); const ac=new THREE.Mesh(new THREE.PlaneGeometry(.22,.055),new THREE.MeshStandardMaterial({color:renk("#9fb4c8"),roughness:.05,metalness:.9})); ac.position.set(-.05,1.66,-.648); ic.add(ac);
    for(const a of [0,2.2,4.1]){ const k=new THREE.Mesh(new THREE.BoxGeometry(.17,.025,.02),mat("#151515",{roughness:.6})); k.position.set(Math.cos(a)*.085,Math.sin(a)*.085,0); k.rotation.z=a; dir.add(k); }
    const gobek=new THREE.Mesh(new THREE.CylinderGeometry(.045,.05,.035,24),mat("#121212",{roughness:.35,metalness:.2})); gobek.rotation.x=Math.PI/2; dir.add(gobek);
    await yazHazirla();
    this.kaan=karakter("kaan","yaz"); this.kaan.visible=false; this.kaan.position.set(-.38,.35,.1); scene.add(this.kaan);
    this.kar=karakter("kardelen","yaz"); this.kar.position.set(.42,.3,.05); this.kar.rotation.y=Math.PI; this.kar.userData.otur=1; this.kar.userData.oturY=.42; scene.add(this.kar);
    KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    this.hiz=0; this.vites=1; this.devir=900; this.sarsinti=0; this.gazBasik=null;
    this.arabaKam=dt=>{ const f=camera.aspect<1?80:60; if(camera.fov!==f){ camera.fov=f; camera.updateProjectionMatrix(); } camera.position.set(-.38,1.33,.08); camera.lookAt(-.3,1.42,-6); }; Kamera.sinema=this.arabaKam;
    Ses.ton="sicak";
  },
  async basla(){
    katmanTemizle(); ustDugmeler(); this.btn=aksiyonEkle();
    await bekle(400);
    baslikKarti(this.ad,[this.tarih,"Bölüm "+this.no]); await bekle(3600);
    await anlat("24 Ağustos 2026, Antalya. Kiralık arabamız manueldi. Otomatik kullanamadığım için öyle istemiştim.",3600);
    const D=this.kar; D.userData.bakNokta=new THREE.Vector3(-.38,1.3,.1);
    await kameraNoktasi(new THREE.Vector3(-.36,1.31,.1),bas(D).add(new THREE.Vector3(0,-.05,0)),.6);
    await konus("kardelen",["Arabamız da var","Manuel ama güzelmiş kdkdkd"],{kamera:false,gul:1});
    D.userData.bakNokta=null; Kamera.sinema=this.arabaKam;
    await this.vitesOyunu();
    await sahne(async()=>{
      Kamera.sinema=this.arabaKam;
      await anlat("Sahil yolu. Bir yanımız deniz, bir yanımız dağ.",2600);
      D.userData.bakNokta=new THREE.Vector3(-30,0,-20);
      await konus("kardelen",["Denize bak","Fotoğraf çekiyorum"],{kamera:false,gul:1});
      await hatiraFoto("Sahil yolu · Ağustos 2026",{kendi:true});
      await konus("kaan","Sen çek, ben yola bakayım. Ralli pilotu gibiyim ama 😄",{kamera:false,gul:.7});
      D.userData.bakNokta=new THREE.Vector3(-.38,1.3,.1);
      await kameraNoktasi(new THREE.Vector3(-.36,1.31,.1),bas(D).add(new THREE.Vector3(0,-.05,0)),.5);
      await konus("kardelen",["Önüne bak ralli pilotu 😄"],{kamera:false,gul:1});
      D.userData.bakNokta=null; Kamera.sinema=this.arabaKam;
    });
    Kamera.sinema=this.arabaKam; // perde kapanırken kamera arabanın dışına fırlamasın
    await gecis(async()=>{ katmanTemizle(); await this.aspendosKur(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await this.aspendos();
  },
  // vites: gaz basılıyken devir yükselir; ibre yeşildeyken "Vites" ile bir üst vitese geç
  async vitesOyunu(){
    gorev("Gaza bas, vitesi zamanında değiştir · 1. vites");
    const ui=el(`<div class="sim vites-ui"><div class="baslik">Manuel vites</div><div class="ipucu">Gaza bas; ibre yeşile gelince vitesi değiştir.</div>
      <div class="devir"><div class="kadran">${(()=>{ const yay=(a0,a1)=>{ const P=a=>[75+62*Math.sin(a*Math.PI/180),80-62*Math.cos(a*Math.PI/180)]; const [x0,y0]=P(a0),[x1,y1]=P(a1); return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A 62 62 0 ${a1-a0>180?1:0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; }; const d=r=>-120+r/7000*240;
        return `<svg viewBox="0 0 150 92" width="170" height="104"><path d="${yay(-120,120)}" stroke="rgba(255,255,255,.22)" stroke-width="9" fill="none" stroke-linecap="round"/><path d="${yay(d(2200),d(5200))}" stroke="#7fd39a" stroke-width="9" fill="none"/><path d="${yay(d(6000),120)}" stroke="#ff6a6a" stroke-width="9" fill="none"/></svg>`; })()}<b class="ibre"></b><span class="vno">1</span><small class="rpm">×1000 d/dk</small></div></div>
      <div class="satir"><button class="tut gaz">⛽ Gaz</button><button class="vit">⇧ Vites</button></div></div>`); katman.appendChild(ui);
    const gaz=ui.querySelector(".gaz"), vno=ui.querySelector(".vno"), ip=ui.querySelector(".ipucu");
    let basik=false; const bit=()=>{ basik=false; gaz.classList.remove("basili"); };
    gaz.addEventListener("pointerdown",e=>{ e.preventDefault(); basik=true; gaz.classList.add("basili"); }); gaz.addEventListener("pointerup",bit); gaz.addEventListener("pointercancel",bit); gaz.addEventListener("pointerleave",bit);
    this.gazBasik=()=>basik;
    let stop=0;
    await new Promise(res=>{ ui.querySelector(".vit").onclick=()=>{ if(this.vites>=5) return;
        const d=this.devir; if(d<2200){ stop++; Ses.efekt("vuru",.5); ip.textContent="Erken! Motor bayıldı, araba sarsıldı."; this.devir=700; this.sarsinti=.6;
          ip.textContent=stop>1?"Kardelen: Yine mi kdkdkd · Ralli pilotu":"Kardelen: Stop ediyordun az kalsın kdkdkd"; const Dk=this.kar; Dk.userData.konus=1; Dk.userData.gulumse=1; bekle(1400).then(()=>{ Dk.userData.konus=0; }); return; }
        if(d>5200){ ip.textContent="Kardelen: Motoru bağırttın kdkdkd"; const Dk=this.kar; Dk.userData.konus=1; bekle(1400).then(()=>{ Dk.userData.konus=0; }); }
        else ip.textContent=["Tıkır tıkır.","Yağ gibi.","Ralli pilotu 😄","Beşinci vites!"][Math.min(3,this.vites-1)];
        this.vites++; this.devir=Math.max(1300,d*.58); vno.textContent=this.vites; Ses.efekt("vuru",.4); gorev(this.vites<5?`Vitesi zamanında değiştir · ${this.vites}. vites`:"Beşinci vites, sahil yolu");
        this.vitesTopuz.position.x=(this.vites%2?-.03:.03); if(this.vites>=5) bekle(900).then(res); }; });
    ui.remove(); gorev(null); this.gazBasik=()=>true;
  },
  // ---------- ASPENDOS: tiyatroda fısıltı ----------
  async aspendosKur(){
    this.faz="aspendos"; this.t=0; ETK=[]; DALGA=[]; boyut(); this.serbest=false; this.elele=false;
    sahneKur({sis:"#f2dcc0",sisYakin:50,sisUzak:300,ust:"#5a8cc8",ufuk:"#f8e2c4",alt:"#c9b08a",gunesYon:new THREE.Vector3(-.85,.42,.25).normalize(),isikYon:new THREE.Vector3(-.85,.5,.2),gunesRenk:"#fff0d0",isik:"#fff0d8",isikGuc:2.3,zemin:"#b49a78",hemi:.85,dolgu:.55,dolguRenk:"#ffe2c4"});
    Ses.ortam("kus",.6);
    const tas=mat("#d9c7a4",{roughness:.92,bumpMap:gurultuDoku(30),bumpScale:.02});
    // cavea: basamaklı oturma sıraları (yarım daireden biraz geniş), orkestra, sahne binası
    const N=26, P=[new THREE.Vector2(8,0)]; for(let i=0;i<N;i++){ const r=8+i*.82, y=i*.43; P.push(new THREE.Vector2(r,y+.43)); P.push(new THREE.Vector2(r+.82,y+.43)); }
    P.push(new THREE.Vector2(8+N*.82+.6,N*.43+.43)); P.push(new THREE.Vector2(8+N*.82+.6,0));
    const tasC=tas.clone(); tasC.side=THREE.DoubleSide; tasC.vertexColors=true;
    const lg=new THREE.LatheGeometry(P,72,Math.PI*.5-.12,Math.PI+.24).toNonIndexed(); lg.computeVertexNormals();
    { const nr=lg.attributes.normal, ps=lg.attributes.position, cr=[]; for(let i=0;i<nr.count;i++){ const ay=Math.abs(nr.getY(i)), y=ps.getY(i); const k=(ay>.7?1:.62)*(.94+.06*Math.sin(y*13.7))*(1-.18*Math.max(0,Math.sin(Math.atan2(ps.getZ(i),ps.getX(i))*9+y)*.5)); cr.push(k,k*.98,k*.95); }
      lg.setAttribute("color",new THREE.Float32BufferAttribute(cr,3)); }
    const cav=new THREE.Mesh(lg,tasC); cav.receiveShadow=true; cav.castShadow=true; scene.add(cav); // sıralar -z yönünde, sahneye bakar
    this.caveaY=i=>i*.43+.43; this.caveaR=i=>8+i*.82+.4;
    const ork=new THREE.Mesh(new THREE.CircleGeometry(8,48),mat("#cdb894",{roughness:.95})); ork.rotation.x=-Math.PI/2; ork.position.y=.01; ork.receiveShadow=true; scene.add(ork);
    const zem=new THREE.Mesh(new THREE.PlaneGeometry(200,200),mat("#b9a07a",{roughness:1})); zem.rotation.x=-Math.PI/2; zem.position.y=-.02; zem.receiveShadow=true; scene.add(zem);
    const sahneP=new THREE.Mesh(new THREE.BoxGeometry(30,1.3,5.5),tas); sahneP.position.set(0,.65,5.8); sahneP.receiveShadow=true; sahneP.castShadow=true; scene.add(sahneP);
    const td=tasDuvarDoku(); const fr=new THREE.Mesh(new THREE.BoxGeometry(34,16,2.4),new THREE.MeshStandardMaterial({map:td,bumpMap:td,bumpScale:.04,roughness:.95})); fr.position.set(0,8,9.6); fr.castShadow=true; fr.receiveShadow=true; scene.add(fr);
    const kap=mat("#5a4632",{roughness:1}); for(let k=0;k<2;k++) for(let i=-4;i<=4;i++){ const w=i===0&&k===0?2.6:1.5, h=k?2.2:3.2; const a=new THREE.Mesh(new THREE.PlaneGeometry(w,h),kap); a.position.set(i*3.4,k?9.8:3.0,8.39); a.rotation.y=Math.PI; scene.add(a);
      const ust=new THREE.Mesh(new THREE.CircleGeometry(w/2,16,0,Math.PI),kap); ust.position.set(i*3.4,(k?9.8:3.0)+h/2,8.39); ust.rotation.y=Math.PI; scene.add(ust); }
    for(let i=-5;i<=5;i++){ const s=sutun(4,i%3===0); s.position.set(i*3.1,1.3,8.1); scene.add(s); }
    for(let i=0;i<10;i++){ const a=agac(i%2?"selvi":"zeytin",rnd(1,1.4)); const an=rnd(-1.2,1.2); a.position.set(Math.sin(an)*rnd(36,50),0,-Math.cos(an)*rnd(36,50)); scene.add(a); }
    this.turist=[]; for(let i=0;i<8;i++){ const c=kalabalik("rpm",{ust:["#e9e4d8","#5a7a9a","#c96a4a","#2f4a5a"][i%4],alt:["#c9b48a","#2c2c34"][i%2],anim:"idle",sac:"#3a2a20"}); if(!c) continue; const r=rnd(10,22), a=rnd(-1.3,1.3); c.position.set(Math.sin(a)*r,0,-Math.cos(a)*r); scene.add(c); this.turist.push(c); }
    for(const c of this.turist){ const r=Math.hypot(c.position.x,c.position.z); const i=Math.max(0,Math.min(N-1,Math.floor((r-8)/.82))); c.position.y=this.caveaY(i); c.lookAt(0,c.position.y,4); }
    await yazHazirla();
    this.kaan=karakter("kaan","yaz"); this.kar=karakter("kardelen","yaz");
    this.kaan.position.set(0,0,2.4); this.kaan.rotation.y=Math.PI; this.kar.position.set(.5,0,2.5); this.kar.rotation.y=Math.PI; scene.add(this.kaan,this.kar);
    KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    Kamera.sinema=null; Kamera.aci=Math.PI; Kamera.mesafe=6; Kamera.yukseklik=2.6; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(0,3,8);
  },
  async aspendos(){
    const K=this.kaan, D=this.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(-26,16,-18),new THREE.Vector3(0,4,6));
      await kameraNoktasi(s=>new THREE.Vector3(-26+s*3,16-s,-18+s*1.5),new THREE.Vector3(0,4,6),4.6);
      await anlat("Aspendos. İki bin yıllık tiyatro, hâlâ ayakta.",2800);
      yuzYuze(K,D);
      await konus("kardelen",["Sahnenin ortasında fısıldayınca","En üstten duyuluyormuş","Deneyelim mi"],{gul:1});
      await konus("kaan","Sen en üste çık, ben buradan fısıldayacağım. Haberin olsun 😄",{gul:.8});
    });
    // o en üst sıralardan birine çıkar
    const N=26, ust=new THREE.Vector3(Math.sin(.25)*this.caveaR(N-2),this.caveaY(N-2),-Math.cos(.25)*this.caveaR(N-2));
    D.position.copy(ust); D.rotation.y=Math.atan2(-ust.x,4-ust.z); D.userData.otur=1; D.userData.oturY=.32;
    gorev("Orkestranın tam ortasına geç");
    this.serbest=true; gizliKalpler(this,[[5.0,1.0,-4.8,0]]);
    const orta=new THREE.Object3D(); orta.position.set(0,0,0); scene.add(orta);
    await etkBekle(orta,"Fısılda",{mesafe:1.3,isaretY:.3});
    this.serbest=false; gorev(null);
    await sahne(async()=>{
      K.position.set(0,0,0); K.rotation.y=Math.atan2(ust.x,ust.z);
      await kameraNoktasi(K.position.clone().add(new THREE.Vector3(1.6,1.6,2.2)),ust.clone().add(new THREE.Vector3(0,1,0)),1.4);
      const secenek=["Seni seviyorum","Duyuyor musun minnakım?","Fotoğrafçın burada 😄"];
      const c=await sec(secenek);
      await konus("kaan",secenek[c],{kamera:false,sure:1.8,gul:.6});
      // ses halkaları basamaklardan yukarı yayılır
      const halkalar=[]; for(let i=0;i<4;i++){ const h=new THREE.Mesh(new THREE.RingGeometry(.9,1.0,48),new THREE.MeshBasicMaterial({color:renk("#fff1c9"),transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false})); h.rotation.x=-Math.PI/2; h.position.y=.4; scene.add(h); halkalar.push({h,t:-i*.35}); }
      // fısıltı ona ulaşırken önden, hafif yandan: yüzü ve arkasındaki gökyüzü görünür
      const sahneY=new THREE.Vector3(-ust.x,0,4-ust.z).normalize(), yanY=new THREE.Vector3(-sahneY.z,0,sahneY.x); const onKam=ust.clone().addScaledVector(sahneY,1.9).addScaledVector(yanY,1.0).add(new THREE.Vector3(0,.75,0));
      let s=0; await new Promise(r=>{ Kamera.sinema=dt=>{ s+=dt; for(const q of halkalar){ q.t+=dt; const k=Math.max(0,q.t); const R=1+k*9; q.h.scale.setScalar(R); q.h.position.y=.4+k*4.5; q.h.material.opacity=Math.max(0,.6-k*.22); }
        camera.position.lerp(onKam,1-Math.pow(.25,dt)); camera.lookAt(ust.x,ust.y+.85,ust.z); if(s>3.2) r(); }; });
      halkalar.forEach(q=>scene.remove(q.h));
      D.userData.gulumse=1;
      const cevap=[["Duydum 😳","Ben de seni seviyorum 💋"],["Duyuyorum","Ohaa gerçekten duyuluyor"],["Fotoğrafçım 😄","Gel o zaman çek beni"]][c];
      await konus("kardelen",cevap,{gul:1,uzak:1.6});
      await hatiraFoto("Aspendos · En üst sıra · Ağustos 2026",{kendi:true}); await bekle(1200);
      await anlat("Aspendos'ta da yüzlerce fotoğraf çektik. Toplamda bin iki yüzü geçti.",3000);
    });
    await gecis(async()=>{ katmanTemizle(); await this.kur(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await this.sahil();
  },
  // ---------- PATARA ----------
  async sahil(){
    const K=this.kaan, D=this.kar;
    const nesneler=[
      {x:-4,z:3.2,r:"#ffcf6a",ad:"arma"}, {x:2,z:2.2,r:"#9fe0a0",ad:"gazoz"}, {x:8,z:1.6,r:"#d9a46a",ad:"yaprak"}, {x:15,z:2.4,r:"#ff8fa8",ad:"balon"}, {x:23,z:1.2,r:"#f4a9be",ad:"kurdele"}, {x:30,z:3,r:"#cfe0ff",ad:"ay"} ];
    this.hatira=nesneler.map(n=>{ const g=new THREE.Group(); g.position.set(n.x,this.yer(n.x,n.z)+.25,n.z); const p=parilti(n.r,1.3); g.add(p);
      const m=new THREE.Mesh(new THREE.OctahedronGeometry(.09,0),new THREE.MeshStandardMaterial({color:renk(n.r),emissive:renk(n.r),emissiveIntensity:1.2})); g.add(m); g.userData=n; scene.add(g); return g; });
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(30,9,-30),new THREE.Vector3(0,2,-80));
      await kameraNoktasi(s=>new THREE.Vector3(30-s*3,9-s*.6,-30+s*4),new THREE.Vector3(0,2,-80),5);
      await kameraNoktasi(new THREE.Vector3(-14,2.2,13),bas(K).add(new THREE.Vector3(.3,0,0)),3);
      await anlat("Patara. Kilometrelerce kum, antik kent ve deniz.");
      yuzYuze(K,D);
      await konus("kardelen",["Antik kent varmış demiştim","Bak sütunlar 😍","Kaplumbağa yuvaları da varmış 🐢"],{gul:1});
      await konus("kaan","Planı sen yaptın, ben şoförüm. Manuel arabayla hem de 😄",{gul:.6});
      await konus("kardelen",["Hadi güneş batmadan sahile","Fotoğraf çekeceğiz ama","Bin tane"],{gul:.9});
      K.rotation.y=D.rotation.y=Math.PI*.6;
    });
    gorev("Sahilde birlikte yürüyün · Hatıralar 0 / 6");
    this.serbest=true; this.elele=true; let n=0; gizliKalpler(this,[[5,this.yer(5,11.5)+1.0,11.5,1],[-22,this.yer(-22,6)+1.0,6,2]]);
    const satirlar={
      arma:[["kardelen",["Bu parıltı","Mezuniyetteki arman gibi"]],["kaan","O gün ilk baktığım yer tribündü."]],
      gazoz:[["kaan","Bir gazoz kapağı. Kalenin dibindeki gazozcu."],["kardelen",["Pıt diye açılmıştı","Hatırlıyorum 😄"]]],
      yaprak:[["kaan","Kuru bir yaprak. Eskişehir'i hatırlıyor musun?"],["kardelen",["Buz gibiydi","Sen de söylendin durdun kdkdkd"]]],
      balon:[["kardelen",["Minik bir balon","Kapadokya sabahı 😍"]],["kaan","Balona binemedik ama izledik. Bir dahakine bineriz, haberin olsun."]],
      kurdele:[["kaan","Pembe kurdele. Kravatımla aynı renk."],["kardelen",["Elbisemle aynı renkti","Nasıl bulmuştun kdkdkd"]]],
      ay:[["kardelen",["Bu da aya benziyor","Dağdaki geceler"]],["kaan","Aynı aya bakıyorduk. Bana yetiyordu."]] };
    await new Promise(res=>{
      this.hatira.forEach(h=>{ const e=etkilesim(h,"Hatırayı al",async()=>{ etkilesimKaldir(e); h.visible=false; n++; Ses.efekt("parilti");
        gorev(n<6?`Sahilde birlikte yürüyün · Hatıralar ${n} / 6`:"Caretta yuvalarına bak");
        await sahne(async()=>{ K.userData.hiz=0; D.userData.hiz=0; for(const [kim,t] of satirlar[h.userData.ad]) await konus(kim,t,{gul:.7}); });
        if(n>=6) res(); },{mesafe:1.6,isaret:false}); }); });
    await etkBekle(this.yuvalar[1],"Tabelayı oku",{mesafe:2.4,isaretY:1.4});
    this.serbest=false; this.elele=false; gorev(null);
    await sahne(async()=>{
      const y=this.yuvalar[1].position; await kameraNoktasi(y.clone().add(new THREE.Vector3(-1.8,1.4,2.4)),y.clone().add(new THREE.Vector3(0,.4,0)),1.4);
      await anlat("Caretta yuvaları. Gönüllüler tel kafesle korumaya almış. Yavrular geceleri aya bakıp denize yürüyormuş.",3600);
      yuzYuze(K,D);
      await konus("kardelen",["Yuvalara bak","Senin gibi minik kaplumbağalar çıkacak 🐢"],{gul:1});
      await konus("kaan","Ben minik kaplumbağa mıyım şimdi 😄",{gul:.8});
      await konus("kardelen",["Benim minik kaplumbağamsın","Tartışma kdkdkd"],{gul:1});
    });
    await this.deniz();
  },
  // DENİZDE EL ELE: dalga gelirken elini sıkı tut
  async deniz(){
    const K=this.kaan, D=this.kar;
    await sahne(async()=>{
      await konus("kardelen",["Denize girelim mi","Ama elimi bırakma","Yüzme kursuna gitmem lazım kdkdkd"],{gul:.9});
      await konus("kaan","Bırakmam. Sensiz denize girmiş sayılmam zaten.",{gul:.7});
      await konus("kardelen",["Bensiz gitme o zaman","Hiçbir yere"],{gul:1});
    });
    await gecis(async()=>{ K.position.set(4,this.yer(4,.25),.25); D.position.set(4.55,this.yer(4.55,.25),.25); /* kıyıda, su bileklerinde (önceden uyluk boyu suyun içindeydiler, "dalga ayağınıza değerken" diyordu) */ K.rotation.y=D.rotation.y=Math.PI; K.userData.elele=D.userData.elele=1; K.userData.hiz=D.userData.hiz=0; });
    gorev("Dalga gelirken elini sıkı tut · 0 / 3");
    const ui=el(`<div class="sim"><div class="baslik">Dalga geliyor</div><div class="ipucu">Dalga ayağınıza değerken tut.</div><div class="olcek" style="align-self:center;width:100%"><div class="bar"><span class="hedef" style="left:76%;width:16%"></span><i style="width:0%"></i></div></div><div class="satir"><button>🤝 Elini tut</button></div></div>`); katman.appendChild(ui);
    const b=ui.querySelector("button"), bar=ui.querySelector(".bar i"), ip=ui.querySelector(".ipucu");
    let s=0; Kamera.sinema=dt=>{ s+=dt; const m=K.position.clone().lerp(D.position,.5); camera.position.set(m.x+Math.sin(s*.15)*1.2,1.3,m.z-3.4); camera.lookAt(m.x,.9,m.z); };
    let ok=0; while(ok<3){ let v=0, tik=false; b.onclick=()=>{ tik=true; };
      await new Promise(r=>{ let son=performance.now(); const f=()=>{ if(!ui.isConnected) return; const t=performance.now(), dt=Math.min(.1,(t-son)/1000); son=t; v+=dt*(.42+ok*.08); bar.style.width=Math.min(100,v*100)+"%"; this.dalgaK=v;
        if(tik||v>=1.05){ r(); return; } requestAnimationFrame(f); }; f(); });
      if(v>=.76&&v<=.94){ ok++; Ses.efekt("vuru",.6); ip.textContent=["Dalga geçti, el ele 😊","Bir daha! Sıkı tut","Üçüncüsü de tamam 🌊"][ok-1]; D.userData.gulumse=1; gorev(`Dalga gelirken elini sıkı tut · ${ok} / 3`); await konus("kardelen",[["Kdkdkd","Ayaklarım"],["Soğukmuş ama","Güzel"],["Bırakmadın","Aferin kocama"]][ok-1],{kamera:false,sure:1.4,gul:1}); }
      else { ip.textContent=v<.76?"Erken tuttun, dalga daha gelmedi 😄":"Dalga çarptı! Neredeyse düşüyordu"; Ses.efekt("vuru",.3); await konus("kardelen",v<.76?["Erken erken"]:["Ayy","Bırakma demiştim kdkdkd"],{kamera:false,sure:1.4,gul:.8}); }
      this.dalgaK=0; bar.style.width="0%"; await bekle(500); }
    ui.remove(); gorev("Battaniyeye otur"); Kamera.sinema=null;
    await gecis(async()=>{ K.position.set(7,this.yer(7,3),3); D.position.set(7.55,this.yer(7.55,3),3); K.rotation.y=D.rotation.y=Math.PI*.2; Kamera.hedef.copy(K.position); Kamera.poz.set(NaN,NaN,NaN); }); // perde açılınca takip kamerası doğrudan arkalarında (eski yerinden süzülmez)
    this.serbest=true; this.elele=true;
    await etkBekle(this.bat,"Otur",{mesafe:2.6,isaretY:.6});
    this.serbest=false; this.elele=false; gorev(null); // "Battaniyeye otur" yazısı kapanış sahnesi boyunca ekranda kalıyordu
    await this.final();
  },
  async final(){
    const K=this.kaan, D=this.kar, B=this.bat.position;
    await sahne(async()=>{
      K.position.set(B.x-.35,0,B.z-.1); D.position.set(B.x+.35,0,B.z-.1); K.rotation.y=D.rotation.y=Math.PI*1.02; K.userData.hiz=D.userData.hiz=0;
      K.userData.otur=1; D.userData.otur=1; K.userData.elele=D.userData.elele=1;
      const gok=scene.userData.gok.material.uniforms, gun=scene.userData.gun; let s=0; const g0=gok.gunes.value.clone();
      const gokF=dt=>{ s+=dt; const k=Math.min(1,s/40); const g=g0.clone(); g.y=lerp(g0.y,-.05,k); gok.gunes.value.copy(g.normalize());
        gok.ust.value.copy(renk("#3d4f8f").lerp(renk("#151a3a"),k)); gok.ufuk.value.copy(renk("#ffb27a").lerp(renk("#e0603f"),k)); gok.yildiz.value=k; gok.parlak.value=1-k*.4;
        gun.intensity=2.2*(1-k*.8); scene.fog.color.copy(renk("#f2a37a").lerp(renk("#5a3550"),k)); this.fenerIsik.intensity=.8+k*2; };
      this.gokF=gokF;
      Kamera.sinema=dt=>{ const a=.42-Math.min(.3,s*.02), r=5.2-Math.min(1.4,s*.1); camera.position.set(B.x+Math.sin(a)*r,1.5+Math.min(.8,s*.05),B.z+Math.cos(a)*r); camera.lookAt(B.x-.6,1,B.z-4); };
      await bekle(3500);
      await anlat("Güneş denize değdi. Kimse acele etmedi.");
      D.userData.bakNokta=bas(K); K.userData.bakNokta=bas(D);
      await konus("kardelen",["Aylarca bekledik bu tatili","Sonunda buradayız"],{gul:.8});
      await konus("kaan","Bir mesajla başladı, bir kumsala geldi. Arada ne kadar çok yol var.");
      await konus("kardelen",["Hep uzaktaydın","Ama hiç uzak hissetmedim"],{gul:.6});
      const c=await sec(["Kaç fotoğraf çektik biliyor musun? 😄","Gittiğimiz her yerde bu güneşi seninle izlemek istiyorum."]);
      if(c===0){ await konus("kaan","Kaç fotoğraf çektik biliyor musun? Bin iki yüz 😄",{gul:.7}); await konus("kardelen",["Hepsini HD at ama","Hiçbirini silme"],{gul:1}); }
      else { await konus("kaan","Gittiğimiz her yerde bu güneşi seninle izlemek istiyorum.",{gul:.5}); await konus("kardelen",["Fotoğrafçım 😄","Bin iki yüz foto çektik ama"],{gul:1}); }
      await konus("kaan","İyi ki varsın minnakım.",{gul:.7});
      await konus("kardelen",["Sen de iyi ki varsın","Minik kaplumbağam benim 🐢"],{gul:1});
      D.userData.bakNokta=null; K.userData.bakNokta=null; D.userData.kafa.rotation.z=-.3; D.userData.gulumse=1; K.userData.gulumse=.8;
      await kameraNoktasi(new THREE.Vector3(B.x,1.25,B.z-2.6),new THREE.Vector3(B.x,1.05,B.z),2);
      const qte=el(`<div class="qte"><button class="btn qte-btn">📷 Son fotoğraf</button></div>`); katman.appendChild(qte);
      await new Promise(r=>{ qte.querySelector("button").onclick=r; }); qte.remove();
      await hatiraFoto("Patara · Ağustos 2026");
      await bekle(2600);
      let s2=0; Kamera.sinema=dt=>{ s2+=dt; camera.position.set(B.x+Math.sin(s2*.05)*2,1.6+s2*.35,B.z+6+s2*.8); camera.lookAt(B.x,1+s2*.2,B.z-30); };
      await this.aniMontaj();
      await anlat("Ve hikâyemiz burada bitmiyor.",3600);
    });
    bolumBitti(this.no);
  },
  guncelle(dt){
    this.t+=dt; const t=this.t; const K=this.kaan, D=this.kar; if(!K) return;
    if(this.faz==="yol"){ const gaz=this.gazBasik?this.gazBasik():false; const v=this.vites||1; const hedef=gaz?6400:900; this.devir=lerp(this.devir,hedef,Math.min(1,dt*(gaz?.9/v+.12:.6)));
      const oran=[0,.55,.95,1.35,1.7,2.0][v]; this.hiz=lerp(this.hiz,this.devir/1000*oran*4.5,Math.min(1,dt*.8));
      if(this.yolDoku) this.yolDoku.offset.y+=dt*this.hiz*.06; if(this.zeminDoku) this.zeminDoku.offset.y+=dt*this.hiz*.16; for(const a of this.agaclar||[]){ a.position.z+=dt*this.hiz; if(a.position.z>8) a.position.z-=470; } for(const d of this.daglar||[]){ d.position.z+=dt*this.hiz*.25; if(d.position.z>40) d.position.z-=500; }
      const ib=katman&&katman.querySelector(".devir .ibre"); if(ib) ib.style.transform=`rotate(${-120+Math.min(7000,this.devir)/7000*240}deg)`;
      if(this.sarsinti>0) this.sarsinti=Math.max(0,this.sarsinti-dt);
      if(this.direksiyon) this.direksiyon.rotation.z=Math.sin(t*.5)*.04+Math.sin(t*40)*.01*this.sarsinti; return; }
    if(this.faz==="aspendos"){ const sinir=p=>{ const r=Math.hypot(p.x,p.z); if(r>7.6){ p.x*=7.6/r; p.z*=7.6/r; } p.z=Math.min(p.z,3); p.y=0; };
      if(this.serbest&&!kilit){ yuru(K,dt,sinir,2); } etkilesimGuncelle(K,this.btn); if(!Kamera.sinema) Kamera.hedef.lerp(K.position,.1); return; }
    if(this.su) this.su.material.uniforms.time.value=t*.6;
    if(this.gokF) this.gokF(dt);
    const dk=this.dalgaK||0; if(dk>0){ this.kopuk.position.z=lerp(-2.2,.74,Math.min(1,dk)); /* dalga denizden kıyıya gelir, doğru anda (dk≈.83) ayaklarına varır */ this.kopuk.material.opacity=.6; } else { this.kopuk.position.z=.4+Math.sin(t*.8)*.45; this.kopuk.material.opacity=.55+Math.sin(t*.8)*.2; } this.kopuk.material.map.offset.x+=dt*.004;
    const sinir=p=>{ p.x=clamp(p.x,-30,46); p.z=clamp(p.z,1.35,14); p.y=this.yer(p.x,p.z); };
    if(this.serbest&&!kilit){ yuru(K,dt,sinir,2); if(this.elele){ eleleTakip(K,D,dt); D.position.y=this.yer(D.position.x,D.position.z); } }
    if(this.hatira) for(const h of this.hatira){ if(h.visible){ h.children[1].rotation.y+=dt*2; h.position.y=this.yer(h.position.x,h.position.z)+.25+Math.sin(t*2+h.position.x)*.06; } }
    etkilesimGuncelle(K,this.btn);
    if(!Kamera.sinema) Kamera.hedef.lerp(K.position.clone().lerp(D.position,.5),.1);
  },
  // finalde albümden her bölümün son karesi gün batımının üstünden süzülür (albüm boşsa atlanır)
  async aniMontaj(){ let L=[]; try{ L=await AlbumDB.hepsi(); }catch(e){} if(!L||!L.length) return;
    const sec=[]; for(const B of BOLUMLER){ const f=L.filter(x=>x.bolum===B.id&&x.veri).sort((a,b)=>(b.zaman||0)-(a.zaman||0))[0]; if(f) sec.push(f); }
    const S=sec.slice(-10); if(!S.length) return;
    const kutu=el(`<div class="montaj"></div>`); katman.appendChild(kutu);
    for(let i=0;i<S.length;i++){ const f=S[i], p=el(`<figure class="polaroid sabit montaj-p"><img alt=""><figcaption></figcaption></figure>`);
      p.querySelector("img").src=f.veri; p.querySelector("figcaption").textContent=(f.ad||"").split(" · ")[0];
      p.style.left=((i%2?66:34)+rnd(-7,7))+"%"; p.style.setProperty("--r",((i%2?5:-5)+rnd(-3,3)).toFixed(1)+"deg"); kutu.appendChild(p);
      requestAnimationFrame(()=>requestAnimationFrame(()=>p.classList.add("git"))); await bekleDokun(950); }
    await bekleDokun(3200); kutu.classList.add("son"); bekle(1300).then(()=>kutu.remove()); },
  temizle(){ Ses.denizDurdur(); this.gazBasik=null; boyut(); }
};
