/* ================= BÖLÜM 7: CUDİ'DEN SANA (Haziran 2025 – Yılbaşı 2026) =================
   Haziran: konteyner "makam odası", kule kontrolleri, kulede çay ("yine mi çay"), 37 derece ve klima, telefon çeksin diye tepe,
   aynı aya bakmak. Gece uzaktan okey. Aralık: boyumu aşan kar, kulede yılbaşı araması ve her gecenki gibi "sarıldım, uyuduk". */
let ICSAHNE=null;
function kalpDoku(){ if(kalpDoku.t) return kalpDoku.t; const c=document.createElement("canvas"); c.width=c.height=128; const x=c.getContext("2d");
  x.shadowColor="#ff6f91"; x.shadowBlur=24; x.fillStyle="#ff8fab"; x.font="96px serif"; x.textAlign="center"; x.textBaseline="middle"; x.fillText("❤",64,70);
  const t=new THREE.CanvasTexture(c); t.__kalici=true; kalpDoku.t=t; return t; }
// beton: kalıp çizgileri, akıntı izleri, lekeler
function betonDoku(){ if(betonDoku.t) return betonDoku.t; const c=document.createElement("canvas"); c.width=c.height=256; const x=c.getContext("2d");
  x.fillStyle="#aaa79e"; x.fillRect(0,0,256,256);
  for(let i=0;i<40;i++){ const px=Math.random()*256, py=Math.random()*256, r=rnd(14,46); const g=x.createRadialGradient(px,py,0,px,py,r); g.addColorStop(0,`rgba(${rnd(80,140)|0},${rnd(78,132)|0},${rnd(70,120)|0},.18)`); g.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle=g; x.fillRect(px-r,py-r,2*r,2*r); }
  x.strokeStyle="rgba(58,56,50,.4)"; x.lineWidth=1.4; for(let i=1;i<4;i++){ x.beginPath(); x.moveTo(0,i*64); x.lineTo(256,i*64); x.stroke(); } x.beginPath(); x.moveTo(128,0); x.lineTo(128,256); x.stroke();
  for(let i=0;i<22;i++){ const px=Math.random()*256, py=Math.random()*190, h=rnd(30,80); const g=x.createLinearGradient(0,py,0,py+h); g.addColorStop(0,"rgba(66,62,55,.28)"); g.addColorStop(1,"rgba(66,62,55,0)"); x.fillStyle=g; x.fillRect(px,py,rnd(1.5,4),h); }
  const d=x.getImageData(0,0,256,256); for(let i=0;i<d.data.length;i+=4){ const n=(Math.random()-.5)*22; d.data[i]+=n; d.data[i+1]+=n; d.data[i+2]+=n; } x.putImageData(d,0,0);
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding; t.__kalici=true; betonDoku.t=t; return t; }
// gözetleme kulesi: kare beton gövde, camlı kabin, korkuluklu balkon, merdiven, anten; kabin ışığı kontrol edilince yanar
function kuleYap(kar){ const g=new THREE.Group(); const bd=betonDoku(); const bet=new THREE.MeshStandardMaterial({map:bd,bumpMap:bd,bumpScale:.02,roughness:.95,color:renk(kar?"#d4d8e0":"#ffffff")});
  const gov=new THREE.Mesh(new THREE.CylinderGeometry(.85,1.1,5.2,4,1),bet); gov.rotation.y=Math.PI/4; gov.position.y=2.6; gov.castShadow=true; gov.receiveShadow=true; g.add(gov);
  const tab=new THREE.Mesh(new THREE.BoxGeometry(2.8,.24,2.8),bet); tab.position.y=5.32; tab.castShadow=true; tab.receiveShadow=true; g.add(tab);
  const par=new THREE.Mesh(new THREE.BoxGeometry(2.3,.9,2.3),bet); par.position.y=5.89; par.castShadow=true; g.add(par);
  const cam=new THREE.Mesh(new THREE.BoxGeometry(2.32,.62,2.32),new THREE.MeshStandardMaterial({color:renk("#1a222e"),emissive:renk("#ffbe6a"),emissiveIntensity:0,roughness:.12,metalness:.55})); cam.position.y=6.65; g.add(cam); g.userData.cam=cam;
  const dm=mat("#34342f",{roughness:.6,metalness:.4}); for(let i=0;i<4;i++){ const a=i*Math.PI/2, nx=Math.sin(a), nz=Math.cos(a); for(let k=-1;k<=1;k++){ const m=new THREE.Mesh(new THREE.BoxGeometry(.06,.64,.06),dm); m.position.set(nx*1.17+nz*k*.76,6.65,nz*1.17-nx*k*.76); g.add(m); } }
  const ust=new THREE.Mesh(new THREE.BoxGeometry(2.38,.2,2.38),bet); ust.position.y=7.06; g.add(ust);
  const cat=new THREE.Mesh(new THREE.ConeGeometry(2.15,.62,4),mat(kar?"#f4f6fa":"#4c4840",{roughness:.85})); cat.rotation.y=Math.PI/4; cat.position.y=7.47; cat.castShadow=true; g.add(cat);
  const rm=mat("#2c2c2a",{metalness:.6,roughness:.5});
  for(let i=0;i<4;i++){ const a=i*Math.PI/2; for(const y of [5.86,6.28]){ const r=new THREE.Mesh(new THREE.BoxGeometry(2.72,.04,.04),rm); r.position.set(Math.sin(a)*1.36,y,Math.cos(a)*1.36); r.rotation.y=a; g.add(r); } }
  for(const [px,pz] of [[1.36,1.36],[1.36,-1.36],[-1.36,1.36],[-1.36,-1.36]]){ const d=new THREE.Mesh(new THREE.BoxGeometry(.05,.86,.05),rm); d.position.set(px,5.87,pz); g.add(d); }
  const ray=(x0)=>{ const r=new THREE.Mesh(new THREE.BoxGeometry(.045,5.25,.045),rm); r.position.set(x0,2.62,.81); r.rotation.x=-.035; g.add(r); }; ray(-.22); ray(.22);
  for(let i=0;i<17;i++){ const y=.3+i*.3, b=new THREE.Mesh(new THREE.BoxGeometry(.44,.03,.03),rm); b.position.set(0,y,.9-y/5.2*.18); g.add(b); }
  const an=new THREE.Mesh(new THREE.CylinderGeometry(.014,.02,1.5,6),rm); an.position.set(.75,8.1,.75); g.add(an);
  const l=new THREE.PointLight(renk("#ffbe6a"),0,9,1.6); l.position.y=6.4; g.add(l); g.userData.l=l; g.userData.engel=1.3; return g; }
// dağ zemini: düşük frekanslı lekeler, çakıl ve kum taneleri (yaz) ya da sıkışmış kar (kış); kenarları sarmalı
function dagZeminDoku(kar){ dagZeminDoku.c=dagZeminDoku.c||{}; const k=kar?"k":"y"; if(dagZeminDoku.c[k]) return dagZeminDoku.c[k];
  const N=512, c=document.createElement("canvas"); c.width=c.height=N; const x=c.getContext("2d");
  x.fillStyle=kar?"#eef1f6":"#bdb19b"; x.fillRect(0,0,N,N);
  const leke=(px,py,r,col)=>{ for(const ox of [-N,0,N]) for(const oy of [-N,0,N]){ const cx=px+ox, cy=py+oy; if(cx+r<0||cx-r>N||cy+r<0||cy-r>N) continue; const g=x.createRadialGradient(cx,cy,0,cx,cy,r); g.addColorStop(0,col); g.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle=g; x.fillRect(cx-r,cy-r,2*r,2*r); } };
  for(let i=0;i<70;i++) leke(Math.random()*N,Math.random()*N,rnd(30,95),kar?`rgba(${rnd(200,225)|0},${rnd(210,230)|0},${rnd(235,250)|0},.1)`:`rgba(${rnd(85,140)|0},${rnd(76,118)|0},${rnd(56,88)|0},.26)`);
  for(let i=0;i<(kar?700:2600);i++){ const px=Math.random()*N, py=Math.random()*N, r=kar?rnd(.4,1.3):rnd(.5,2.7), v=kar?rnd(222,255):rnd(70,215);
    if(!kar&&r>1.5){ x.fillStyle="rgba(28,24,20,.38)"; x.beginPath(); x.ellipse(px+r*.45,py+r*.55,r,r*.65,0,0,7); x.fill(); }
    x.fillStyle=kar?`rgba(${v|0},${v|0},${Math.min(255,v+10)|0},.55)`:`rgba(${v|0},${v*.93|0},${v*.8|0},.75)`; x.beginPath(); x.ellipse(px,py,r,r*rnd(.6,1),rnd(0,3),0,7); x.fill(); }
  const d=x.getImageData(0,0,N,N); for(let i=0;i<d.data.length;i+=4){ const n=(Math.random()-.5)*(kar?6:28); d.data[i]+=n; d.data[i+1]+=n; d.data[i+2]+=n; } x.putImageData(d,0,0);
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(52,52); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; t.__kalici=true; dagZeminDoku.c[k]=t; return t; }
// uzak dağ sırtları: ay ışığında katman katman silüetler (kışın karlı tepeler)
function dagSirtlari(kar){ const g=new THREE.Group();
  const kat=kar?[[205,24,62,"#2f3856","#8f9abb",11],[268,38,92,"#343e5e","#737e9f",23]]:[[205,24,62,"#080d22","#121a3c",11],[268,38,92,"#111939","#1c2752",23]];
  for(const [R,h0,h1,alt,ust,t] of kat){ const seg=200, pos=[], col=[], idx=[]; const ca=renk(alt), cu=renk(ust);
    for(let i=0;i<=seg;i++){ const a=i/seg*Math.PI*2; const f=.36*(.5+.5*Math.sin(a*2+t))+.3*(.5+.5*Math.sin(a*5.3+t*1.7))+.22*(1-Math.abs(Math.sin(a*11+t*.3)))+.12*(1-Math.abs(Math.sin(a*27+t))); const h=h0+(h1-h0)*f;
      pos.push(Math.cos(a)*R,-30,Math.sin(a)*R, Math.cos(a)*R,h,Math.sin(a)*R); col.push(ca.r*.55,ca.g*.55,ca.b*.55, cu.r,cu.g,cu.b); }
    for(let i=0;i<seg;i++){ const k=i*2; idx.push(k,k+1,k+2, k+1,k+3,k+2); }
    const geo=new THREE.BufferGeometry(); geo.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute("color",new THREE.Float32BufferAttribute(col,3)); geo.setIndex(idx);
    const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide})); g.add(m); }
  return g; }
// konteyner sacı: dikey oluklar, pas ve kir izleri
function konteynerDoku(){ if(konteynerDoku.t) return konteynerDoku.t; const c=document.createElement("canvas"); c.width=256; c.height=128; const x=c.getContext("2d");
  x.fillStyle="#a3a28f"; x.fillRect(0,0,256,128); for(let i=0;i<32;i++){ const g=x.createLinearGradient(i*8,0,i*8+8,0); g.addColorStop(0,"rgba(255,255,255,.16)"); g.addColorStop(.5,"rgba(0,0,0,0)"); g.addColorStop(1,"rgba(0,0,0,.22)"); x.fillStyle=g; x.fillRect(i*8,0,8,128); }
  for(let i=0;i<14;i++){ const px=Math.random()*256; const g=x.createLinearGradient(0,60,0,128); g.addColorStop(0,"rgba(110,70,40,0)"); g.addColorStop(1,"rgba(110,70,40,.35)"); x.fillStyle=g; x.fillRect(px,60,rnd(2,6),68); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(3,1); t.encoding=THREE.sRGBEncoding; t.__kalici=true; konteynerDoku.t=t; return t; }
// kırmızı gerbera + okaliptüs buketi (kraft kâğıtta): taç yapraklar, göbekler ve yapraklar örneklenmiş ağ (az çizim çağrısı)
function gerberaBuketi(){ const g=new THREE.Group(); const o=new THREE.Object3D();
  const yG=new THREE.CircleGeometry(1,10); yG.scale(.0105,.034,1); yG.translate(0,.036,0);
  const cicekler=[]; for(let i=0;i<9;i++){ const a=i/9*Math.PI*2+(i%2)*.3, r=i?(i<5?.055:.085):0; cicekler.push({p:new THREE.Vector3(Math.cos(a)*r,.36+(i?(i<5?-.015:-.045):.012)+rnd(-.01,.01),Math.sin(a)*r), n:new THREE.Vector3(Math.cos(a)*r*3,1,Math.sin(a)*r*3).normalize()}); }
  const tacSay=24*2, taclar=new THREE.InstancedMesh(yG,new THREE.MeshStandardMaterial({color:renk("#d01628"),roughness:.55,side:THREE.DoubleSide}),cicekler.length*tacSay);
  const gG=new THREE.CylinderGeometry(.016,.019,.012,14), gobek=new THREE.InstancedMesh(gG,new THREE.MeshStandardMaterial({color:renk("#2c1a0e"),roughness:.9}),cicekler.length);
  const sG=new THREE.CylinderGeometry(.004,.005,1,6); sG.translate(0,.5,0); const saplar=new THREE.InstancedMesh(sG,mat("#4f7a35",{roughness:.8}),cicekler.length+5);
  const q=new THREE.Quaternion(), yukari=new THREE.Vector3(0,1,0); let ti=0;
  cicekler.forEach((c,ci)=>{ q.setFromUnitVectors(yukari,c.n);
    for(let k=0;k<tacSay;k++){ const ic=k>=24, a=(k%24)/24*Math.PI*2+(ic?.13:0); o.position.copy(c.p); o.quaternion.copy(q); o.rotateY(a); o.rotateX(-Math.PI/2+(ic?.42:.2)); o.scale.setScalar(ic?.78:1); o.updateMatrix(); taclar.setMatrixAt(ti++,o.matrix); }
    o.position.copy(c.p).addScaledVector(c.n,.004); o.quaternion.copy(q); o.scale.setScalar(1); o.rotation.setFromQuaternion(q); o.updateMatrix(); gobek.setMatrixAt(ci,o.matrix);
    const alt=new THREE.Vector3(c.p.x*.15,0,c.p.z*.15), v=c.p.clone().sub(alt); o.position.copy(alt); o.quaternion.setFromUnitVectors(yukari,v.clone().normalize()); o.scale.set(1,v.length(),1); o.updateMatrix(); saplar.setMatrixAt(ci,o.matrix); });
  // okaliptüs: yuvarlak gri-yeşil yapraklı dallar
  const lG=new THREE.CircleGeometry(.016,10), yap=new THREE.InstancedMesh(lG,new THREE.MeshStandardMaterial({color:renk("#8ea79a"),roughness:.75,side:THREE.DoubleSide}),5*9); let li=0;
  for(let d=0;d<5;d++){ const a=d/5*Math.PI*2+.6, uc=new THREE.Vector3(Math.cos(a)*.13,.33+rnd(-.02,.03),Math.sin(a)*.13);
    o.position.set(0,0,0); o.quaternion.setFromUnitVectors(yukari,uc.clone().normalize()); o.scale.set(1,uc.length(),1); o.updateMatrix(); saplar.setMatrixAt(cicekler.length+d,o.matrix);
    for(let k=0;k<9;k++){ const t=.45+k*.065; o.position.copy(uc).multiplyScalar(t); o.position.x+=(k%2?.012:-.012)*Math.cos(a+1.5); o.position.z+=(k%2?.012:-.012)*Math.sin(a+1.5); o.rotation.set(rnd(-1,1),a+k,rnd(-.6,.6)); o.scale.setScalar(rnd(.8,1.15)); o.updateMatrix(); yap.setMatrixAt(li++,o.matrix); } }
  g.add(taclar,gobek,saplar,yap);
  // kraft kâğıt (iki kat) ve kurdele
  const kc=document.createElement("canvas"); kc.width=kc.height=128; const kx=kc.getContext("2d"); kx.fillStyle="#c49a62"; kx.fillRect(0,0,128,128); for(let i=0;i<500;i++){ kx.fillStyle=`rgba(${Math.random()<.5?90:240},${Math.random()<.5?60:220},40,.08)`; kx.fillRect(Math.random()*128,Math.random()*128,2,1); }
  const kt=new THREE.CanvasTexture(kc); kt.encoding=THREE.sRGBEncoding;
  const k1=new THREE.Mesh(new THREE.CylinderGeometry(.16,.035,.3,18,1,true),new THREE.MeshStandardMaterial({map:kt,roughness:.95,side:THREE.DoubleSide})); k1.position.y=.15; g.add(k1);
  const k2=new THREE.Mesh(new THREE.CylinderGeometry(.13,.03,.24,18,1,true,.6,4.6),new THREE.MeshStandardMaterial({color:renk("#f3e2e6"),roughness:.9,side:THREE.DoubleSide})); k2.position.y=.13; k2.rotation.y=2.2; g.add(k2);
  const kur=new THREE.Mesh(new THREE.TorusGeometry(.04,.008,6,20),mat("#b0102a",{roughness:.5})); kur.rotation.x=Math.PI/2; kur.position.y=.06; g.add(kur);
  g.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.frustumCulled=false; } }); g.scale.setScalar(1.1); return g; }
const OKEY_EL=[
  {taslar:[["k",5],["k",6],["k",7],["m",9],["s",9],["y",9],["s",2]],at:6},
  {taslar:[["m",10],["m",11],["m",12],["m",13],["k",4],["s",4],["y",4],["k",11]],at:7} ];
const B5={
  id:"cudi", no:7, ad:"Dağdan Sana", tarih:"Haziran 2025", alt:"Kulede çay, uzaktan okey, dağdan çiçekler",
  yer(x,z){ const d0=Math.hypot(x,z), r=Math.max(0,d0-11); let y=14*(1-Math.exp(-r*r/968));
    y=Math.max(y,7.2*Math.exp(-((x-20)*(x-20)+(z+16)*(z+16))/90)); y+=Math.sin(x*.35)*Math.cos(z*.3)*.25*Math.min(1,d0/10);
    if(d0>45){ const k=Math.min(1,(d0-45)/45); y+=k*(Math.sin(x*.045+1.3)*Math.cos(z*.05)*7+Math.sin(x*.11+z*.07)*3+6); } return y; },
  async kur(){ await this.dagKur(false); },
  async dagKur(kar){
    this.kar_=kar; this.fisekler=[]; this.serbest=false; this.sinyalEl=null; this.tabure=null; const ay=new THREE.Vector3(-.35,.42,-1).normalize();
    if(!kar) sahneKur({sis:"#19224a",sisYakin:35,sisUzak:250,ust:"#040719",ufuk:"#26335f",alt:"#05060f",gunesYon:ay,isikYon:ay,gunesRenk:"#9fb4ff",isik:"#9fb0ff",isikGuc:.9,zemin:"#1a1a2a",hemi:.5,yildiz:1.4,parlak:.25,dolgu:.3,dolguRenk:"#8a9cff"});
    else sahneKur({sis:"#2c3452",sisYakin:22,sisUzak:170,ust:"#0a0e22",ufuk:"#3a4466",alt:"#1a2034",gunesYon:ay,isikYon:ay,gunesRenk:"#cfd8ff",isik:"#c9d4ff",isikGuc:.85,zemin:"#9aa4c0",hemi:.7,yildiz:.6,parlak:.25,dolgu:.42,dolguRenk:"#b4c2ff"});
    Ses.ortam(kar?"ruzgar":"gece",.9);
    this.t=0; DALGA=[]; ETK=[]; this.kalpler=[]; ICSAHNE=null; this.karYag=null; this.setYol=null; this.tabure=null;
    const ag=new THREE.PlaneGeometry(260,260,140,140); ag.rotateX(-Math.PI/2); const ap=ag.attributes.position, ar=[];
    for(let i=0;i<ap.count;i++){ const x=ap.getX(i), z=ap.getZ(i); ap.setY(i,this.yer(x,z)+(kar?.25:0)); }
    ag.computeVertexNormals(); const nr=ag.attributes.normal;
    const Y0=renk("#8c7c5e"), Y1=renk("#77726a"), Y2=renk("#8e8a82"), K0=renk("#f2f5fb"), K1=renk("#b7bfd0"), cc=new THREE.Color();
    for(let i=0;i<ap.count;i++){ const y=ap.getY(i), sl=1-nr.getY(i), n=rnd(.92,1.06), ss=THREE.MathUtils.smoothstep;
      if(kar){ cc.copy(K0).lerp(K1,ss(sl,.3,.6)*.6).multiplyScalar(rnd(.98,1.015)); }
      else { cc.copy(Y0).lerp(Y1,ss(sl,.1,.32)).lerp(Y2,ss(y,10,20)*.6).multiplyScalar(n); }
      ar.push(cc.r,cc.g,cc.b); }
    ag.setAttribute("color",new THREE.Float32BufferAttribute(ar,3));
    const zd=dagZeminDoku(kar); const da=new THREE.Mesh(ag,new THREE.MeshStandardMaterial({vertexColors:true,map:zd,roughness:kar?.82:.97,bumpMap:zd,bumpScale:kar?.008:.05})); da.receiveShadow=true; scene.add(da);
    scene.add(dagSirtlari(kar));
    for(let i=0;i<(kar?16:70);i++){ const x=rnd(-60,60), z=rnd(-60,40); if(Math.hypot(x,z)<9) continue; const k=kaya(kar?rnd(.4,.9):rnd(.4,1.8),kar?"#5a5d66":"#6a6156"); k.position.set(x,this.yer(x,z)+(kar?.05:0),z); k.rotation.y=rnd(0,6); scene.add(k); }
    if(!kar) scene.add(otlar(()=>{ const x=rnd(-40,40), z=rnd(-40,30); return {x,y:this.yer(x,z),z}; },500,"#4a5a30",.35));
    else { // boyu aşan kar yığınları: yürünen yolun iki yanı
      const km=new THREE.MeshStandardMaterial({color:renk("#f4f7fc"),roughness:.88,bumpMap:gurultuDoku(4),bumpScale:.01});
      const A0=new THREE.Vector3(-2.5,0,.4), A1=new THREE.Vector3(8.4,0,3.7); this.setYol={A0,A1};
      for(const yan of [-1,1]) scene.add(this.karSeti(A0,A1,yan,km));
      // duvar diplerinde ve kulelerin dibinde kar birikintisi
      for(let i=0;i<5;i++){ const s=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),km); s.scale.set(rnd(.9,1.3),rnd(.35,.55),.55); s.position.set(-7.4+i*1.25,this.yer(-5,-1)+.05,-1.2); s.receiveShadow=true; scene.add(s); }
      this.karYag=tozlar(2600,()=>({x:rnd(-30,30),y:rnd(0,18),z:rnd(-30,30)}),"#ffffff",.09); scene.add(this.karYag); }
    // konteyner "makam odası": prefabrik, ışıklı pencere, kum torbaları, bayrak
    const kd=konteynerDoku(); const pre=new THREE.Mesh(new THREE.BoxGeometry(6,2.8,3.2),new THREE.MeshStandardMaterial({map:kd,bumpMap:kd,bumpScale:.03,roughness:.75,metalness:.25})); pre.position.set(-5,1.4,-3); pre.castShadow=true; pre.receiveShadow=true; scene.add(pre);
    const kl=new THREE.Mesh(new THREE.BoxGeometry(.32,.62,.84),mat("#d9d9d2",{roughness:.6})); kl.position.set(-1.84,.5,-2.7); kl.castShadow=true; scene.add(kl);
    const pv=new THREE.Mesh(new THREE.CircleGeometry(.24,24),mat("#2a2a2a",{roughness:.8})); pv.rotation.y=Math.PI/2; pv.position.set(-1.675,.52,-2.7); scene.add(pv);
    const kk_=new THREE.Mesh(new THREE.BoxGeometry(1.04,2.1,.05),mat("#3a3a32")); kk_.position.set(-6.2,1.05,-1.41); scene.add(kk_);
    const cat=new THREE.Mesh(new THREE.BoxGeometry(6.4,kar?.45:.15,3.6),mat(kar?"#f6f8fc":"#6a6a5a")); cat.position.set(-5,kar?3.0:2.88,-3); scene.add(cat);
    const pen=new THREE.Mesh(new THREE.PlaneGeometry(1,.7),new THREE.MeshStandardMaterial({color:renk("#332a1a"),emissive:renk("#ffbe6a"),emissiveIntensity:1.6})); pen.position.set(-4,1.7,-1.39); scene.add(pen);
    const kapi=new THREE.Mesh(new THREE.PlaneGeometry(.9,2),mat("#4a4a3e")); kapi.position.set(-6.2,1,-1.37); scene.add(kapi);
    this.lamba=new THREE.PointLight(renk("#ffbe6a"),1.4,12,1.6); this.lamba.position.set(-4,2.2,-.6); scene.add(this.lamba);
    // kum torbaları: yastık gibi şişkin, şaşırtmalı iki sıra; kışın üstleri karlı
    const tm=new THREE.MeshStandardMaterial({color:renk(kar?"#7f7b6c":"#8f805f"),roughness:1,bumpMap:gurultuDoku(3),bumpScale:.015}), tk_=mat("#f2f5fa",{roughness:.85}), tg=new THREE.SphereGeometry(1,14,8);
    for(let r=0;r<3;r++) for(let a=0;a<7-r;a++){ const t=new THREE.Mesh(tg,tm); const x=3+a*.64+r*.32, y=this.yer(x,-4.6)+.12+r*.22; t.position.set(x,y,-4.6+rnd(-.03,.03)); t.scale.set(.34,.13,.21); t.rotation.y=rnd(-.08,.08); t.rotation.z=rnd(-.05,.05); t.castShadow=true; t.receiveShadow=true; scene.add(t);
      if(kar&&r===2-0&&a<5){ const k=new THREE.Mesh(tg,tk_); k.scale.set(.32,.06,.2); k.position.set(x,y+.1,-4.6); scene.add(k); } }
    const b=bayrak(7,2); b.position.set(1.5,0,-5.5); scene.add(b);
    this.cay=bardakYap(); this.cay.userData.dik=true; this.cay.position.set(-2.2,.82,-1); scene.add(this.cay);
    const kasa=new THREE.Mesh(new THREE.BoxGeometry(.8,.8,.6),mat("#5a5a3e")); kasa.position.set(-2.2,.4,-1); kasa.castShadow=true; scene.add(kasa);
    // gözetleme kuleleri
    this.kuleler=[new THREE.Vector3(9,0,5),new THREE.Vector3(12,0,-3),new THREE.Vector3(8,0,-10)].map(p=>{ p.y=this.yer(p.x,p.z); const k=kuleYap(kar); k.position.copy(p); k.rotation.y=Math.atan2(-p.x,-p.z); scene.add(k); return k; });
    this.tepe=new THREE.Object3D(); this.tepe.position.set(20,this.yer(20,-16),-16); scene.add(this.tepe);
    const tk=kaya(1.1,kar?"#eef2f8":"#7a7064"); tk.position.copy(this.tepe.position).add(new THREE.Vector3(.6,-.4,-.9)); scene.add(tk);
    { const ot=new THREE.Mesh(new THREE.CylinderGeometry(.26,.32,.34,7),mat(kar?"#e9edf4":"#756b5f",{flatShading:true,roughness:.95})); ot.position.copy(this.tepe.position).add(new THREE.Vector3(0,.17,0)); ot.castShadow=ot.receiveShadow=true; scene.add(ot); }
    this.ay=ayYap(96); this.ayYon=ay.clone(); this.ay.position.copy(ay.clone().multiplyScalar(850)); scene.add(this.ay); // gökyüzündeki ay diskiyle çakışsın: her karede kameraya göre konumlanır
    if(kar) await kisHazirla();
    this.kaan=karakter("kaan",kar?"kis":"kamuflaj"); this.kaan.position.set(-1,this.yer(-1,1)+(kar?.25:0),1); this.kaan.rotation.y=Math.PI; scene.add(this.kaan);
    this.tel=telefonYap(); this.tel.userData.telefon=true; this.tel.visible=false; scene.add(this.tel);
    this.oda=this.odaKur(kar);
    KONUSANLAR={kaan:this.kaan,kardelen:this.oda.kar};
    Kamera.sinema=null; Kamera.aci=.3; Kamera.mesafe=6; Kamera.yukseklik=2.6; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(2,4,8);
    Ses.ton="gece";
  },
  // sürekli kar seti: yol boyunca dalgalı, yuvarlak tepeli, iç yüzü kürenmiş gibi dik
  karSeti(A0,A1,yan,km){ const U=48, V=12; const yon=A1.clone().sub(A0); const L=yon.length(); yon.normalize(); const dik=new THREE.Vector3(yon.z,0,-yon.x).multiplyScalar(yan);
    const pos=[], idx=[], uv=[];
    for(let i=0;i<=U;i++){ const u=i/U; const uc=Math.min(u,1-u); const H=(2.05+.28*Math.sin(u*9.1+yan*2)+.12*Math.sin(u*27+yan))*Math.min(1,uc/.07+.15);
      const m=A0.clone().addScaledVector(yon,u*L).addScaledVector(dik,2.05+.12*Math.sin(u*7+yan));
      for(let j=0;j<=V;j++){ const v=j/V, w=(v-.5)*1.9; const a=(v-.5)*Math.PI; const h=H*Math.pow(Math.max(0,Math.cos(a)),v<.5?.45:.9);
        const p=m.clone().addScaledVector(dik,w); p.y=this.yer(p.x,p.z)+.2+h; pos.push(p.x,p.y,p.z); uv.push(u*L/2,v*2); } }
    for(let i=0;i<U;i++) for(let j=0;j<V;j++){ const a=i*(V+1)+j, b=a+V+1; if(yan>0) idx.push(a,b,a+1, b,b+1,a+1); else idx.push(a,a+1,b, b,a+1,b+1); }
    const g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
    const me=new THREE.Mesh(g,km); me.castShadow=true; me.receiveShadow=true; me.userData.kameraEngel=true; return me; },
  odaKur(kis){
    const s=new THREE.Scene(); s.background=renk("#1b1626"); s.userData.pip=true; EK_SAHNELER.push(s); // telefon ekranında doğrudan çizilir (gecis derlemesi buna göre)
    s.add(new THREE.HemisphereLight(renk("#ffe9d6"),renk("#4a3a5a"),.55));
    const lamba=new THREE.PointLight(renk("#ffc89a"),2.2,8,1.4); lamba.position.set(1.1,1.4,.6); s.add(lamba);
    const ayI=new THREE.DirectionalLight(renk("#9fb4ff"),.6); ayI.position.set(-1,2,-3); s.add(ayI);
    const duvar=mat("#d8c4c8",{roughness:.95}), zem=mat("#8a6a52",{roughness:.7});
    const z=new THREE.Mesh(new THREE.PlaneGeometry(5,5),zem); z.rotation.x=-Math.PI/2; s.add(z);
    const arka=new THREE.Mesh(new THREE.PlaneGeometry(5,3),duvar); arka.position.set(0,1.5,-1.6); s.add(arka);
    const yan=new THREE.Mesh(new THREE.PlaneGeometry(5,3),duvar); yan.position.set(-1.8,1.5,0); yan.rotation.y=Math.PI/2; s.add(yan);
    const pc=document.createElement("canvas"); pc.width=256; pc.height=200; const px=pc.getContext("2d"); const g=px.createLinearGradient(0,0,0,200); g.addColorStop(0,"#0b1030"); g.addColorStop(1,"#2a3060"); px.fillStyle=g; px.fillRect(0,0,256,200);
    for(let i=0;i<40;i++){ px.fillStyle="rgba(255,255,255,"+rnd(.3,.9)+")"; px.fillRect(Math.random()*256,Math.random()*140,1.5,1.5); }
    if(!kis){ const rg=px.createRadialGradient(170,62,4,170,62,40); rg.addColorStop(0,"#fffbe8"); rg.addColorStop(.45,"#fff4d6"); rg.addColorStop(.5,"rgba(200,210,255,.4)"); rg.addColorStop(1,"rgba(150,160,255,0)"); px.fillStyle=rg; px.fillRect(110,10,120,110); }
    else { for(let i=0;i<5;i++){ const cx=40+i*45, cy=50+Math.random()*50, r=14+Math.random()*12, h=Math.random()*360; for(let k=0;k<16;k++){ const a=k/16*Math.PI*2; px.strokeStyle=`hsla(${h},90%,70%,.85)`; px.lineWidth=1.5; px.beginPath(); px.moveTo(cx,cy); px.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); px.stroke(); } } } // yılbaşı havai fişekleri
    const pt=new THREE.CanvasTexture(pc); pt.encoding=THREE.sRGBEncoding;
    const pen=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1),new THREE.MeshBasicMaterial({map:pt})); pen.position.set(-.3,1.7,-1.59); s.add(pen);
    const cer=mat("#f2efe8"); for(const [w,h,x,y] of [[1.42,.06,-.3,2.2],[1.42,.06,-.3,1.2],[.06,1.06,-.98,1.7],[.06,1.06,.38,1.7],[.04,1,-.3,1.7]]){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.04),cer); m.position.set(x,y,-1.57); s.add(m); }
    const yat=new THREE.Mesh(new THREE.BoxGeometry(1.6,.42,2.2),mat("#f4eef2",{roughness:.9})); yat.position.set(-.6,.21,-.2); s.add(yat);
    const ort=new THREE.Mesh(new THREE.BoxGeometry(1.64,.08,1.3),mat("#b98ab0",{roughness:.95})); ort.position.set(-.6,.45,.25); s.add(ort);
    const yas=new THREE.Mesh(new THREE.BoxGeometry(.7,.16,.4),mat("#ffffff")); yas.position.set(-.6,.5,-1.05); s.add(yas);
    const ayi=new THREE.Mesh(new THREE.SphereGeometry(.12,12,10),mat("#c9a07a")); ayi.position.set(-1.1,.6,-.9); s.add(ayi);
    const ml=new THREE.Mesh(new THREE.ConeGeometry(.14,.18,16,1,true),new THREE.MeshStandardMaterial({color:renk("#ffe2c0"),emissive:renk("#ffb070"),emissiveIntensity:1.2,side:THREE.DoubleSide})); ml.position.set(1.1,1.05,.5); s.add(ml);
    const ms=new THREE.Mesh(new THREE.BoxGeometry(.7,.7,.5),mat("#7a5a46")); ms.position.set(1.1,.35,.5); s.add(ms);
    const isik=[]; for(let i=0;i<14;i++){ const p=new THREE.Vector3(-1.4+i*.2,2.45-Math.sin(i/13*Math.PI)*.25,-1.55); isik.push(p); }
    const pm=new THREE.Points(new THREE.BufferGeometry().setFromPoints(isik),new THREE.PointsMaterial({map:parlakDokuAl(),color:renk("#ffd9a0"),size:.18,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); s.add(pm);
    // yatağın ayak ucunda, kenarına oturur (eskiden yatağın ortasında, şiltenin içine gömülü oturuyordu)
    const kar=karakter("kardelen","ev"); kar.position.set(-.45,0,.95); kar.rotation.y=.25; kar.userData.oturY=.48; kar.userData.otur=1; kar.userData._otur=1; s.add(kar);
    const tel=telefonYap(); tel.userData.telefon=true; s.add(tel);
    const cam=new THREE.PerspectiveCamera(42,9/16,.05,30); cam.position.set(.45,1.3,2.6); cam.lookAt(-.42,1.0,.95);
    return {scene:s,camera:cam,kar,tel};
  },
  async basla(){
    katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle();
    const K=this.kaan;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(17,6.5,27),new THREE.Vector3(-8,9.5,-26));
      await kameraNoktasi(s=>new THREE.Vector3(17-s*1.2,6.5-s*.35,27-s*1.6),new THREE.Vector3(-8,9.5,-26),6.5);
      baslikKarti(this.ad,[this.tarih,"Bölüm "+this.no]);
      await kameraNoktasi(new THREE.Vector3(1,2,4),bas(K),3);
      await anlat("Haziran. Uzak bir dağ, küçük bir konteyner oda. Adını “makam odası” koyduk.");
      await anlat("Uzak, sıcak ve sessiz bir dağ. Telefon çoğu zaman çekmiyor.");
    });
    gorev("Telefonun çektiği yeri ara · 0 / 3");
    { const sn=el(`<div class="sinyal"><i style="height:6px"></i><i style="height:10px"></i><i style="height:14px"></i><i style="height:18px"></i></div>`); katman.appendChild(sn); this.sinyalEl=sn; }
    this.serbest=true; gizliKalpler(this,[[-5,this.yer(-5,-5.5)+1.0,-5.5,0],[2.4,this.yer(2.4,-6.6)+1.0,-6.6,1],[-20,this.yer(-20,-12)+1.0,-12,2]]);
    await new Promise(res=>{ let k=0; this.kuleler.forEach(p=>{ const e=etkilesim(p,"Burada çekiyor mu?",async()=>{ etkilesimKaldir(e); p.userData.yandi=true; Ses.efekt("vuru"); k++;
      gorev(k<3?`Telefonun çektiği yeri ara · ${k} / 3`:"Hâlâ zayıf…");
      await sahne(async()=>{ K.userData.hiz=0; K.rotation.y=Math.atan2(K.position.x-p.position.x,K.position.z-p.position.z); await this.kuleAni(k); }); if(k>=3) res(); },{mesafe:2.6,isaretY:2.6}); }); });
    await sahne(async()=>{ Ses.efekt("titresim"); this.tel.visible=true; eldeTut(K,this.tel,"S"); K.userData.telefon=2;
      await kameraNoktasi(ondenNokta(K,1.3,.3,.06),bas(K).add(new THREE.Vector3(0,-.1,0)),1);
      await anlat("Akşam ona yazdım ama mesaj gitmedi. Jeneratör ısınınca hat da gidiyordu.");
      await konus("kaan","Tepeye çıkarsam belki çeker.",{uzak:1.4}); K.userData.telefon=0; K.userData.eldeki=null; this.tel.visible=false; });
    gorev("Telefon çeksin diye tepeye tırman");
    await etkBekle(this.tepe,"Ara 📞",{mesafe:2.2,isaretY:1.6});
    this.serbest=false; if(this.sinyalEl) this.sinyalEl.remove(); this.sinyalEl=null; gorev(null);
    await this.arama();
  },
  // her kulede küçük bir an: kendini göstermek, kulede çay (fotoğrafla), sıcak ve klima
  async kuleAni(k){
    const K=this.kaan;
    if(k===1){ await konus("kaan","Tek çizgi… Burada da zor 😄",{uzak:1.5}); return; }
    if(k===2){ this.cay.visible=true; eldeTut(K,this.cay,"S"); K.userData.kolS.rotation.set(-1.0,0,.1);
      await kameraNoktasi(ondenNokta(K,1.4,-.4,.1),bas(K).add(new THREE.Vector3(0,-.2,0)),1);
      await anlat("Kulenin dibinde bir çay demledim. Burada mesaj gidiyordu; fotoğrafını çekip ona attım.",2800);
      const f=await kareAl(300);
      K.userData.kolS.rotation.set(0,0,0); K.userData.eldeki=null; this.cay.position.set(-2.2,.82,-1); this.cay.rotation.set(0,0,0);
      const dm=DM.ac("Kardelen 💕","çevrimiçi"); dm.zaman("Öğleden sonra");
      if(f) await dmResim("ben",f); await dm.yaz("ben","Dağda çay, haberin olsun");
      await dm.yaz("o","Çay mı yine kdkdkd"); await dm.yaz("o","Başka bir şey yaptığın yok mu");
      const c=await dm.sec(["Seni düşündüm ya 😄","Çay da bir iş ama"]); await dm.yaz("ben",c?"Çay da bir iş ama":"Seni düşündüm ya 😄");
      await dm.yaz("o","Kendine iyi bak ama 🥹"); await bekle(500); DM.kapat(); return; }
    await anlat("Gündüz otuz yedi derece. Klima ya üşütüyordu ya hiç çalışmıyordu.",2800);
    await konus("kaan","Çorumlu adam ne anlar klimadan 😄",{uzak:1.5});
  },
  async arama(){
    const K=this.kaan, O=this.oda, D=O.kar;
    await sahne(async()=>{
      const p=this.tepe.position; K.position.set(p.x,p.y,p.z); const ayY=this.ay.position.clone().sub(K.position); K.rotation.y=Math.atan2(ayY.x,ayY.z);
      K.userData.otur=1; K.userData.oturY=.35; K.userData.telefon=2; K.userData.hiz=0; this.tel.visible=true; eldeTut(K,this.tel,"S");
      Ses.efekt("titresim"); await bekle(900);
      const ek=el(`<div class="telefon-ekran"><span>KARDELEN</span></div>`); katman.appendChild(ek); ICSAHNE={...O,el:ek};
      D.userData.telefon=2; O.tel.visible=true; eldeTut(D,O.tel,"S"); D.userData.gulumse=.8;
      // kamera omzunun sol arkasında: ay ekranın solunda kalsın (sağ üstte görüntülü arama penceresi var)
      const arka=K.position.clone().sub(new THREE.Vector3(Math.sin(K.rotation.y),0,Math.cos(K.rotation.y)).multiplyScalar(2.6)).add(new THREE.Vector3(Math.cos(K.rotation.y),0,-Math.sin(K.rotation.y)).multiplyScalar(1.1)).add(new THREE.Vector3(0,1.4,0));
      await kameraNoktasi(arka,K.position.clone().add(this.ay.position.clone().sub(K.position).setLength(6)).add(new THREE.Vector3(0,1.2,0)),2);
      const kk={kamera:false};
      await konus("kardelen",["Alo","Sesim geliyor mu","Seninki cızırtılı ama"],{...kk,gul:.6});
      await konus("kaan","Geliyor minnakım. Tepeye çıktım, ancak burada çekiyor. Haberin olsun.",{...kk,gul:.5});
      await konus("kardelen",["Karnın tok mu","Biraz uyudun mu","Kendine iyi bakıyorsun dimi"],{...kk,gul:.3});
      const c=await sec(["Yorgunum ama sesini duyunca geçti.","İyiyim, merak etme."]);
      if(c===0){ await konus("kaan","Yorgunum ama sesini duyunca geçti.",kk); await konus("kardelen",["Of minikom 🥹","Bütün gün telefona baktım durdum"],{...kk,gul:.7}); }
      else { await konus("kaan","İyiyim, merak etme.",kk); await konus("kardelen",["Yalancı","Sesinden anlıyorum","Yat dinlen biraz"],{...kk,gul:.4}); }
      await konus("kardelen",["Pencereden ay görünüyor","Sen de bak"],{...kk,gul:.7});
      await konus("kaan","Burada kocaman. Ama aynı ay.",{...kk,gul:.6});
      await konus("kardelen",["Her gece ona bakalım o zaman","Aynı yere bakmış oluruz"],{...kk,gul:1});
      await konus("kaan","Söz.",{...kk,gul:.8});
    });
    gorev("Ona kalp gönder · 0 / 5");
    { const arkaN=K.position.clone().sub(new THREE.Vector3(Math.sin(K.rotation.y),0,Math.cos(K.rotation.y)).multiplyScalar(2.9)).add(new THREE.Vector3(0,1.55,0)).add(new THREE.Vector3(Math.cos(K.rotation.y),0,-Math.sin(K.rotation.y)).multiplyScalar(.8));
      const bakN=K.position.clone().add(this.ay.position.clone().sub(K.position).setLength(30)); Kamera.sinema=dt=>{ camera.position.lerp(arkaN,1-Math.pow(.08,dt)); camera.lookAt(bakN); }; }
    const qte=el(`<div class="qte"><button class="btn qte-btn">❤ Gönder</button></div>`); katman.appendChild(qte);
    await new Promise(r=>{ let n=0; qte.querySelector("button").onclick=()=>{ n++; this.kalpAt(); Ses.efekt("parilti"); gorev(n<5?`Ona kalp gönder · ${n} / 5`:"Gönderildi"); if(n>=5) r(); }; });
    qte.remove(); gorev(null);
    await sahne(async()=>{
      await bekle(1500);
      await konus("kardelen",["Geldi geldi","Hepsi geldi 😍","Ben de sana 💋"],{kamera:false,gul:1});
      await anlat("Aramızda yüzlerce kilometre vardı. Ama aynı ayın altındaydık.");
      if(ICSAHNE&&ICSAHNE.el) ICSAHNE.el.remove(); ICSAHNE=null; K.userData.telefon=0; K.userData.eldeki=null; this.tel.visible=false;
      { const f=new THREE.Vector3(Math.sin(K.rotation.y),0,Math.cos(K.rotation.y)), sol=new THREE.Vector3(Math.cos(K.rotation.y),0,-Math.sin(K.rotation.y));
        // ay ve Kaan'ın silüeti aynı karede: bakış ayın yönünde ama yakın bir noktaya (fotoğraf kırpınca Kaan dışarıda kalmasın)
        await kameraNoktasi(K.position.clone().addScaledVector(f,-3.4).addScaledVector(sol,.75).add(new THREE.Vector3(0,1.2,0)),bas(K).add(this.ay.position.clone().sub(K.position).setLength(6)),2.4); } // yana az kayık: dikey ekranda Kaan kenardan taşmıyor
      const q=el(`<div class="qte"><button class="btn qte-btn">📷 Bu geceyi sakla</button></div>`); katman.appendChild(q);
      await new Promise(r=>{ q.querySelector("button").onclick=r; }); q.remove();
      await hatiraFoto("Dağda bir gece · Haziran 2025",{kendi:true}); await bekle(2000);
    });
    await this.okey();
  },
  // GECE OKEY: uzaktan aynı masada; perlere uymayan taşı at, eli bitir
  async okey(){
    const K=this.kaan;
    await sahne(async()=>{
      // gece, konteynerin önünde taburede: telefonda okey; arkada ışıklı pencere
      if(!this.tabure){ this.tabure=new THREE.Mesh(new THREE.BoxGeometry(.4,.42,.4),mat("#4a4038",{roughness:.8})); scene.add(this.tabure); }
      const ty=this.yer(-3.4,-.55); this.tabure.position.set(-3.4,ty+.21,-.55);
      K.position.set(-3.4,ty,-.55); K.rotation.y=.35; K.userData.otur=1; K.userData.oturY=.44; K.userData.hiz=0;
      this.tel.visible=true; eldeTut(K,this.tel,"S"); K.userData.telefon=2;
      kameraNoktasi(new THREE.Vector3(-1.2,1.5,2.6),bas(K));
      await kameraNoktasi(new THREE.Vector3(-1.75,1.3,1.75),bas(K).add(new THREE.Vector3(.1,-.35,0)),1.4);
      await anlat("Bazı geceler internetten okey oynadık. Aynı masadaymışız gibi.",2800);
      const ui=el(`<div class="okey"><div class="ok-ust"><b>Okey · Masa 2</b><small>Kardelen 💕 · sen · iki kişi daha</small></div><div class="ok-ipucu">Perlere uymayan taşı at, eli bitir.</div><div class="istaka"></div></div>`); katman.appendChild(ui);
      for(let r=0;r<OKEY_EL.length;r++){ const E=OKEY_EL[r], ist=ui.querySelector(".istaka"); ist.innerHTML=E.taslar.map(([c,n],i)=>`<button class="tas ${c}" data-i="${i}">${n}<i></i></button>`).join("");
        ui.querySelector(".ok-ipucu").textContent=r?"Bu sefer zor. Seri mi, aynı sayı mı, bak.":"Perlere uymayan taşı at, eli bitir.";
        let dogru=false; while(!dogru){ const i=await new Promise(res=>ist.querySelectorAll(".tas").forEach(b=>b.onclick=()=>res(+b.dataset.i)));
          dogru=i===E.at; const b=ist.querySelector(`[data-i="${i}"]`);
          if(dogru){ b.classList.add("atildi"); Ses.efekt("vuru"); ui.querySelector(".ok-ipucu").textContent="Okey! El bitti 🎉"; await bekle(900); }
          else { b.classList.add("yanlis"); Ses.efekt("vuru",.4); ui.querySelector(".ok-ipucu").textContent="O taş per yapıyordu, bir daha bak."; await bekle(800); b.classList.remove("yanlis"); } }
        if(r===0) await konus("kardelen",["Şanslısın bugün","Bir el daha"],{kamera:false,gul:1}); }
      ui.remove(); K.userData.gulumse=.8;
      await konus("kardelen",["Yine mi kazandın","Hile var bunda kdkdkd"],{kamera:false,gul:1});
      await konus("kaan","Hile yok, şans benden yana, haberin olsun 😄",{kamera:false,gul:.8});
      await konus("kardelen",["Şanslı şapşik 🥹","Yarın rövanş"],{kamera:false,gul:1});
    });
    await this.gerbera();
  },
  // 25 HAZİRAN: dağdan çiçek siparişi (sinyal arayarak), onun odasında kapı zili, kırmızı gerberalar
  async gerbera(){
    const K=this.kaan, O=this.oda, D=O.kar;
    await sahne(async()=>{
      K.userData.otur=0; K.userData.telefon=2; this.tel.visible=true; eldeTut(K,this.tel,"S");
      await kameraNoktasi(ondenNokta(K,1.5,.35,.05),bas(K).add(new THREE.Vector3(0,-.12,0)),1.2);
      await anlat("25 Haziran. Onu biraz şımartmak istedim. Ama burası dağ: ne çiçekçi var ne de düzgün internet.",3400);
    });
    // çiçekçi uygulaması: buket, kart notu, sinyal bulup siparişi gönder
    const not=await this.cicekSiparisi();
    await sahne(async()=>{ K.userData.telefon=0; K.userData.eldeki=null; this.tel.visible=false;
      await konus("kaan","Sipariş tamam. Yarın kapısında, haberin olsun 😄",{uzak:1.5,gul:.7}); });
    // onun odası: kapı çalar, kurye, çiçekler (sahne geçici olarak onun odası olur)
    const ana=scene; let buket=null, foto=null;
    await gecis(async()=>{ katmanTemizle(); scene=O.scene; ICSAHNE=null; KONUSANLAR={kaan:K,kardelen:D};
      D.position.set(-.45,0,.95); D.rotation.y=.25; D.userData.otur=1; D.userData.oturY=.48; D.userData.telefon=2; O.tel.visible=true; eldeTut(D,O.tel,"S"); D.userData.gulumse=.2;
      buket=gerberaBuketi(); buket.visible=false; buket.userData.dik=true; O.scene.add(buket); this.buket=buket;
      camera.position.set(.9,1.32,2.9); camera.userData.bakis=new THREE.Vector3(-.4,.98,.95); camera.lookAt(camera.userData.bakis); });
    await sahne(async()=>{
      await kameraNoktasi(new THREE.Vector3(.8,1.3,2.72),new THREE.Vector3(-.42,1.0,.95),2.2);
      await anlat("Ertesi akşam, Kastamonu.",2200);
      Ses.efekt("zil"); await bekle(700); D.userData.bakNokta=new THREE.Vector3(2,1.5,1.5);
      await konus("kardelen",["Kapı mı çaldı","Bu saatte kim ki"],{kamera:false,gul:.2,sure:2.2});
      D.userData.telefon=0; D.userData.eldeki=null; O.tel.visible=false; D.userData.otur=0; D.userData.bakNokta=null; await bekle(500);
      await yuruHedef(D,new THREE.Vector3(1.9,0,1.5),1.2);
      await anlat("Kapıda bir kurye. Elinde kocaman bir buket: kırmızı gerberalar ve okaliptüs.",3200);
      buket.visible=true; buket.userData.tutY=.08; eldeTut(D,buket,"S"); D.userData.kolPoz="buket"; D.userData.gulumse=1; // göğsüne yaslar
      await yuruHedef(D,new THREE.Vector3(-.15,0,1.45),1.0); D.rotation.y=.5; // yatağın önünde durur (eskiden yatağın içine yürüyordu)
      await kameraNoktasi(ondenNokta(D,1.15,-.2,-.05),bas(D).add(new THREE.Vector3(0,-.18,0)),1.2);
      D.userData.kafa.rotation.z=-.12; await bekle(600);
      await konus("kardelen",["Ayy","Bu ne güzel böyle 😍","Dağdan mı yolladı bu deli"],{kamera:false,gul:1});
      const kart=el(`<div class="cicek-kart"><small>Kart notu</small><b>${not}</b><span>— Kaan</span></div>`); katman.appendChild(kart); requestAnimationFrame(()=>kart.classList.add("gor"));
      await bekle(3200); kart.classList.remove("gor"); setTimeout(()=>kart.remove(),600);
      await konus("kardelen",["Şımarttı yine beni 🥹"],{kamera:false,gul:1});
      foto=await kareAl(320);
      await hatiraFoto("Dağdan çiçekler · Haziran 2025"); await bekle(1600);
    });
    await gecis(async()=>{ D.userData.eldeki=null; D.userData.kolS.rotation.set(0,0,0); D.userData.kolPoz=null; D.userData.kafa.rotation.z=0; buket.visible=false; D.position.set(-.45,0,.95); D.rotation.y=.25; D.userData.otur=1; D.userData.oturY=.48;
      scene=ana; katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); KONUSANLAR={kaan:K,kardelen:D};
      K.position.set(-3.4,this.yer(-3.4,-.55),-.55); K.rotation.y=.35; K.userData.otur=1; K.userData.oturY=.44; this.tel.visible=true; eldeTut(K,this.tel,"S"); K.userData.telefon=2;
      camera.position.set(-1.75,1.3,1.75); camera.userData.bakis=bas(K).add(new THREE.Vector3(.1,-.35,0)); camera.lookAt(camera.userData.bakis); });
    await sahne(async()=>{
      const dm=DM.ac("Kardelen 💕","çevrimiçi"); dm.zaman("Ertesi akşam");
      if(foto) await dmResim("o",foto); await dm.yaz("o","Çiçekler geldiii 😍");
      await dm.yaz("ben","Beğendin mi? Sitedeki fotoğraf kadar gür değil sanki 😔");
      await dm.yaz("o","Bayıldım"); await dm.yaz("o","Dağdan düşünmen bile yeter 🥹");
      const c=await dm.sec(["Sana yakışan çiçek yok ki zaten","Bir dahakine kendi elimle getireceğim"]);
      await dm.yaz("ben",c?"Bir dahakine kendi elimle getireceğim":"Sana yakışan çiçek yok ki zaten");
      await dm.yaz("o","Şapşik 🥹"); await dm.yaz("o",c?"Söz ver ama":"Yine şımarttın beni");
      dm.zaman("Birkaç gün sonra");
      await dm.yaz("ben","Çiçekler duruyor mu hâlâ?");
      await dm.yaz("o","Duruyor tabii"); await dm.yaz("o","Kurutuyorum, bir tanesini bile atmam");
      await bekle(700); DM.kapat();
      await anlat("Dağdan gönderebildiğim tek şey çiçekti. Gerisini her gece telefonda gönderdim.",3600);
    });
    bolumBitti(this.no);
  },
  // telefonda çiçekçi: buket → kart notu → sinyal ara (basılı tut) → sipariş
  cicekSiparisi(){
    const K=this.kaan;
    return new Promise(son=>{
      const d=el(`<div class="cicekci"><div class="cc-ust"><b>Çiçek Sepeti</b><small>Kastamonu'ya yarın teslim</small></div><div class="cc-govde"></div></div>`); katman.appendChild(d);
      const g=d.querySelector(".cc-govde");
      const resim=(renkler,yaprak)=>{ const c=document.createElement("canvas"); c.width=c.height=160; const x=c.getContext("2d"); x.fillStyle="#f4ede4"; x.fillRect(0,0,160,160);
        x.fillStyle="#c9a574"; x.beginPath(); x.moveTo(40,92); x.lineTo(120,92); x.lineTo(88,156); x.lineTo(72,156); x.fill();
        for(let i=0;i<9;i++){ const a=-2.6+i*.65, r=i%2?44:30, cx=80+Math.cos(a)*r*.9, cy=70+Math.sin(a)*r*.55; if(yaprak){ x.fillStyle="#8fa89a"; for(let k=0;k<4;k++){ x.beginPath(); x.arc(cx+Math.cos(a+k)*16,cy+Math.sin(a+k)*12,6,0,7); x.fill(); } } }
        for(let i=0;i<7;i++){ const a=-2.8+i*.8, r=i?28:0, cx=80+Math.cos(a)*r, cy=64+Math.sin(a)*r*.6; const R=15; x.fillStyle=renkler[i%renkler.length];
          for(let k=0;k<14;k++){ const t=k/14*6.283; x.beginPath(); x.ellipse(cx+Math.cos(t)*R*.55,cy+Math.sin(t)*R*.55,R*.5,R*.2,t,0,7); x.fill(); } x.fillStyle="#3a2416"; x.beginPath(); x.arc(cx,cy,R*.28,0,7); x.fill(); }
        return c.toDataURL(); };
      const buketler=[{ad:"Kırmızı gerberalar ve okaliptüs",r:["#d3182b","#c01426"],y:1,fiyat:"Kelebek buket"},{ad:"Beyaz güller",r:["#f6f1ea","#efe6da"],y:0,fiyat:"Stokta yok 😔"},{ad:"Papatya ve lavanta",r:["#ffffff","#b9a3e0"],y:1,fiyat:"Stokta yok 😔"}];
      const adim1=()=>{ g.innerHTML=`<p class="cc-ipucu">Hangi buket?</p><div class="cc-izgara">${buketler.map((b,i)=>`<button class="cc-kart" data-i="${i}"><img src="${resim(b.r,b.y)}" alt=""><b>${b.ad}</b><small>${b.fiyat}</small></button>`).join("")}</div>`;
        g.querySelectorAll(".cc-kart").forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; Ses.efekt("vuru",.5);
          if(i){ b.classList.add("yok"); b.querySelector("small").textContent="Stokta yok 😔 Başkasını seç"; return; }
          adim2(); }); };
      const notlar=["Dağdan sevgilerle, minnakım 💕","Haberin olsun: Seni çok seviyorum","Uzaktayım ama aklım hep sende"];
      const adim2=()=>{ g.innerHTML=`<p class="cc-ipucu">Kart notu ne olsun?</p><div class="cc-notlar">${notlar.map((n,i)=>`<button class="cc-not" data-i="${i}">${n}</button>`).join("")}</div>`;
        g.querySelectorAll(".cc-not").forEach(b=>b.onclick=()=>{ Ses.efekt("vuru",.5); adim3(notlar[+b.dataset.i]); }); };
      const adim3=not=>{ g.innerHTML=`<p class="cc-ipucu">Sipariş gönderilemiyor: <b>sinyal yok</b>. Telefonu havaya kaldır, çekene kadar tut.</p>
          <div class="cc-sinyal"><i></i><i></i><i></i><i></i><i></i></div><button class="btn cc-tut">📶 Basılı tut, telefonu kaldır</button>`;
        const tut=g.querySelector(".cc-tut"), cub=[...g.querySelectorAll(".cc-sinyal i")]; let v=0, bas=false, bitti=false, son_=performance.now();
        const ac=e=>{ e.preventDefault(); bas=true; tut.classList.add("basili"); K.userData.telefon=3; }, kapa=()=>{ bas=false; tut.classList.remove("basili"); K.userData.telefon=2; };
        tut.addEventListener("pointerdown",ac); tut.addEventListener("pointerup",kapa); tut.addEventListener("pointercancel",kapa); tut.addEventListener("pointerleave",kapa);
        const f=()=>{ if(bitti||!d.isConnected) return; const t=performance.now(), dt=Math.min(.1,(t-son_)/1000); son_=t;
          v=clamp(v+(bas?.42:-.55)*dt*(.7+.3*Math.sin(t/260)),0,1); cub.forEach((c,i)=>c.classList.toggle("dolu",v>(i+.5)/5));
          if(v>=1){ bitti=true; K.userData.telefon=2; Ses.efekt("parilti"); g.innerHTML=`<p class="cc-tamam">✓ Sipariş alındı</p><p class="cc-ipucu">Yarın akşam kapısında. Kart notu: “${not}”</p>`; bekle(2200).then(()=>{ d.remove(); son(not); }); return; }
          requestAnimationFrame(f); }; f(); };
      adim1();
    });
  },
  // YILBAŞI: boyu aşan kar; gece yarısı kulenin dibinden arama; her gecenki ritüel
  async yilbasi(){
    const K=this.kaan, O=this.oda, D=O.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(-26,14,26),new THREE.Vector3(4,3,-6));
      baslikKarti(this.ad,[this.tarih,"Bölüm "+this.no]);
      await kameraNoktasi(s=>new THREE.Vector3(-26+s*3,14-s,26-s*2),new THREE.Vector3(4,3,-6),5);
      await anlat("Haziranda geldiğim dağa kış geldi.",2600);
      await anlat("31 Aralık 2025. Yıllardır yağmayan kar, ben gelince yağdı. Hem de boyum kadar.",3400);
      const ab=this.setYol?this.setYol.A1.clone().sub(this.setYol.A0).normalize():new THREE.Vector3(0,0,-1); K.rotation.y=Math.atan2(ab.x,ab.z);
      await kameraNoktasi(bas(K).addScaledVector(ab,2.8).add(new THREE.Vector3(0,.15,0)),bas(K).add(new THREE.Vector3(0,.25,0)),1.8);
      await konus("kaan","Gece yarısına az kaldı. Kulenin dibinde telefon çeker.",{uzak:1.4});
    });
    gorev("Karda kuleye yürü");
    { const ab=this.setYol?this.setYol.A1.clone().sub(this.setYol.A0).normalize():new THREE.Vector3(0,0,-1); Kamera.aci=Math.atan2(-ab.x,-ab.z); Kamera.yukseklik=3.2; }
    this.serbest=true; gizliKalpler(this,[[-6.2,this.yer(-6.2,-.5)+1.2,-.5,0],[2.4,this.yer(2.4,-6.6)+1.2,-6.6,1],[6.4,this.yer(6.4,-8.4)+1.2,-8.4,2]]);
    await etkBekle(this.kuleler[0],"Ara 📞",{mesafe:3,isaretY:2.6});
    this.serbest=false; gorev(null);
    await sahne(async()=>{
      this.kuleler.forEach(k=>k.userData.yandi=true);
      { const T=this.kuleler[0].position; K.rotation.y=Math.atan2(K.position.x-T.x,K.position.z-T.z); }
      K.userData.telefon=2; this.tel.visible=true; eldeTut(K,this.tel,"S"); K.userData.hiz=0;
      const ek=el(`<div class="telefon-ekran"><span>KARDELEN</span></div>`); katman.appendChild(ek); ICSAHNE={...O,el:ek};
      D.userData.telefon=2; O.tel.visible=true; eldeTut(D,O.tel,"S"); D.userData.gulumse=1;
      await kameraNoktasi(ondenNokta(K,2.3,-.8,.12),bas(K).add(new THREE.Vector3(0,-.08,0)),1.4);
      const kk={kamera:false};
      const sayac=el(`<div class="geri-sayim">23:59</div>`); katman.appendChild(sayac); await bekle(900);
      for(const t of ["10","9","8","7","6","5","4","3","2","1"]){ sayac.textContent=t; Ses.efekt("vuru",.3); await bekle(520); }
      sayac.textContent="2026"; sayac.classList.add("yeni"); Ses.efekt("havai"); bekle(500).then(()=>Ses.efekt("havai",.7));
      { const ileri=bas(K).sub(camera.position).setY(0).normalize(), yan=new THREE.Vector3(ileri.z,0,-ileri.x); const merkez=bas(K).addScaledVector(ileri,46).add(new THREE.Vector3(0,16,0));
        ["#ffd27a","#ff7aa8","#9fd8ff","#ffffff","#ffb36b"].forEach((r,i)=>bekle(i*430).then(()=>this.fisek(merkez.clone().addScaledVector(yan,(i%2?1:-1)*(4+i*3)).add(new THREE.Vector3(0,rnd(-3,4),0)),r))); }
      await konus("kardelen",["Yeni yılımız kutlu olsun","İyi ki varsın minikom 🥹"],{...kk,gul:1});
      await konus("kaan","İyi ki benimsin minnakım.",{...kk,gul:.8});
      sayac.remove();
      await konus("kardelen",["Üşüme ama","Boyun kadar kar varmış kdkdkd"],{...kk,gul:.8});
      await konus("kaan","Boyumu aştı, haberin olsun 😄 Ama sen varsın, üşümem.",{...kk,gul:.7});
      // her gecenki gibi: yattım yanına, sarıldım, öptüm, uyuduk
      const c1=await sec(["Hadi yatalım minnakım","Biraz daha konuşalım"]);
      if(c1===0) await konus("kaan","Hadi yatalım minnakım. Yeni yılın ilk uykusu.",{...kk,gul:.6});
      else { await konus("kaan","Biraz daha konuşalım.",kk); await konus("kardelen",["Gözlerim kapanıyor ama","Hadi yatalım kocam"],{...kk,gul:.7}); }
      await anlat("Her gecenki gibi, telefonda yanına uzandım.",2400);
      await basiliTut("🤗 Sarıl · basılı tut",1.4); this.kalpAt();
      await konus("kardelen",["Sıcacık oldu 🥹","Üstümüzü de ben örttüm"],{...kk,gul:1});
      const q=el(`<div class="qte"><button class="btn qte-btn">💋 Öp</button></div>`); katman.appendChild(q);
      await new Promise(r=>{ q.querySelector("button").onclick=r; }); q.remove(); Ses.efekt("kalp"); this.kalpAt();
      await konus("kardelen",["Duydum kdkdkd","İyi geceler kocam 💋"],{...kk,gul:1});
      await konus("kaan","İyi geceler minnakım. Yeni yılda da her gece.",{...kk,gul:.8});
      if(ICSAHNE&&ICSAHNE.el) ICSAHNE.el.remove(); ICSAHNE=null; K.userData.telefon=0; K.userData.eldeki=null; this.tel.visible=false;
      { // kuleden Kaan'a doğru, onun arkasından: Kaan kulenin dibinde karede. Kaan'ın durduğu yere göre arada boyu aşan kar seti kalabiliyordu:
        // aday noktalardan Kaan'ı açıkça gören ilki seçilir (gerekirse biraz yukarıdan)
        const T=this.kuleler[0].position, ab=K.position.clone().sub(T).setY(0); if(ab.lengthSq()<.01) ab.set(-1,0,.3); ab.normalize();
        const eng=[]; scene.traverse(o=>{ if(o.isMesh&&o.visible&&!o.isSkinnedMesh&&o.material&&!o.material.transparent&&!Array.isArray(o.material)) eng.push(o); });
        const yuz=eng.map(o=>o.material.side); eng.forEach(o=>o.material.side=THREE.DoubleSide); // ışın kar setinin arka yüzünü de görsün
        const noktalar=[bas(K),K.position.clone().add(new THREE.Vector3(0,1.15,0)),K.position.clone().add(new THREE.Vector3(0,.55,0))]; // baş, göğüs, diz: Kaan bütünüyle görünsün
        const ray=new THREE.Raycaster(), Y=new THREE.Vector3(0,1,0), kule=T.clone().add(new THREE.Vector3(0,2.6,0)); let poz=null, bak=kule;
        const dar=[0,.22,-.22,.42,-.42], genis=[.8,-.8,1.2,-1.2,1.6,-1.6,2.2,-2.2,Math.PI];
        const adaylar=[...dar.map(a=>[a,4.2,1.9]),...dar.map(a=>[a,4.2,2.9]),...genis.map(a=>[a,3.4,2.2]),...genis.map(a=>[a,2.6,2.6])];
        // objektifin önünde (3,6 m içinde) kadrajın yarısını kapatan bir kar seti de olmasın: köşelere doğru birkaç ışın
        const temiz=(c,b)=>{ const f=b.clone().sub(c).normalize(), r=new THREE.Vector3().crossVectors(f,Y).normalize(), u=new THREE.Vector3().crossVectors(r,f);
          const tv=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)), th=tv*camera.aspect;
          return [[-.7,0],[.7,0],[-.6,-.55],[.6,-.55],[0,-.65]].every(([x,y])=>{ ray.set(c,f.clone().addScaledVector(r,th*x).addScaledVector(u,tv*y).normalize()); ray.far=3.6; return !ray.intersectObjects(eng,false).length; }); };
        for(const [a,u,h] of adaylar){ const c=K.position.clone().addScaledVector(ab.clone().applyAxisAngle(Y,a),u); c.y=K.position.y+h;
          const b_=Math.abs(a)>.45?K.position.clone().add(new THREE.Vector3(0,1.4,0)).lerp(kule,.3):kule; // geniş açıda kule değil Kaan merkezde
          if(noktalar.every(n=>{ const yon=c.clone().sub(n), L=yon.length(); ray.set(n,yon.normalize()); ray.far=L; return !ray.intersectObjects(eng,false).length; })&&temiz(c,b_)){ poz=c; bak=b_; break; } }
        eng.forEach((o,i)=>o.material.side=yuz[i]);
        if(!poz){ poz=K.position.clone().addScaledVector(ab,2.2).add(new THREE.Vector3(0,4.2,0)); bak=K.position.clone().add(new THREE.Vector3(0,1.2,0)); }
        await kameraNoktasi(poz,bak,2.4); }
      const q2=el(`<div class="qte"><button class="btn qte-btn">📷 Karlı yılbaşı</button></div>`); katman.appendChild(q2);
      await new Promise(r=>{ q2.querySelector("button").onclick=r; }); q2.remove();
      await hatiraFoto("Karlı dağ · Yılbaşı 2026"); await bekle(1800);
      await anlat("Aramızda yüzlerce kilometre vardı. Ama her gece aynı şekilde uyuduk.",3200);
    });
    bolumBitti(this.no);
  },
  fisek(p,r){ const n=54, g=new THREE.BufferGeometry(), pos=new Float32Array(n*3), v=[]; for(let i=0;i<n;i++){ v.push(new THREE.Vector3(rnd(-1,1),rnd(-1,1),rnd(-1,1)).normalize().multiplyScalar(rnd(5.5,8))); pos[i*3]=p.x; pos[i*3+1]=p.y; pos[i*3+2]=p.z; }
    g.setAttribute("position",new THREE.BufferAttribute(pos,3)); const m=new THREE.PointsMaterial({color:renk(r),size:1.1,map:parlakDokuAl(),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false});
    const pts=new THREE.Points(g,m); pts.frustumCulled=false; scene.add(pts); (this.fisekler=this.fisekler||[]).push({pts,v,t:0,p0:p.clone()}); },
  kalpAt(){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:kalpDoku(),transparent:true,depthWrite:false,fog:false})); s.scale.set(.5,.5,1);
    s.position.copy(bas(this.kaan)).add(new THREE.Vector3(0,.3,0)); scene.add(s);
    const hedef=s.position.clone().add(this.ay.position.clone().sub(s.position).setLength(70)); this.kalpler.push({s,v:0,bas:s.position.clone(),hedef});
    const O=this.oda; const s2=new THREE.Sprite(new THREE.SpriteMaterial({map:kalpDoku(),transparent:true,depthWrite:false})); s2.scale.set(.18,.18,1); s2.position.set(-.3+rnd(-.4,.4),1.6+rnd(-.2,.2),-1.5); O.scene.add(s2); this.kalpler.push({s:s2,v:0,oda:true}); },
  guncelle(dt){
    this.t+=dt; dalgaGuncelle(this.t); const K=this.kaan;
    if(this.fisekler&&this.fisekler.length) this.fisekler=this.fisekler.filter(f=>{ f.t+=dt; const a=f.pts.geometry.attributes.position, k=1-Math.exp(-f.t*2.4), d=f.t*f.t*1.1;
      for(let i=0;i<f.v.length;i++) a.setXYZ(i,f.p0.x+f.v[i].x*k,f.p0.y+f.v[i].y*k-d,f.p0.z+f.v[i].z*k); a.needsUpdate=true; f.pts.material.opacity=Math.max(0,1-f.t/1.9);
      if(f.t>1.9){ scene.remove(f.pts); f.pts.geometry.dispose(); f.pts.material.dispose(); return false; } return true; });
    if(this.ay&&this.ayYon) this.ay.position.copy(camera.position).addScaledVector(this.ayYon,850);
    const sinir=p=>{ p.x=clamp(p.x,-26,30); p.z=clamp(p.z,-28,20); const yy=this.yer(p.x,p.z)+(this.kar_?.25:0); p.y=yy;
      if(this.setYol){ const {A0,A1}=this.setYol, ab=A1.clone().sub(A0), L=ab.length(); ab.divideScalar(L); const rx=p.x-A0.x, rz=p.z-A0.z, u=rx*ab.x+rz*ab.z, d=rx*ab.z-rz*ab.x;
        if(u>.3&&u<L-.3&&Math.abs(d)>.95&&Math.abs(d)<3.2){ const nd=Math.sign(d)*(Math.abs(d)<2.1?.95:3.2); p.x=A0.x+ab.x*u+ab.z*nd; p.z=A0.z+ab.z*u-ab.x*nd; p.y=this.yer(p.x,p.z)+.25; } }
      if(p.x>-8.2&&p.x<-1.55&&p.z>-4.8&&p.z<-1.2){ const dx=Math.min(p.x+8.2,-1.55-p.x), dz=Math.min(p.z+4.8,-1.2-p.z); if(dx<dz) p.x=p.x< -5?-8.2:-1.55; else p.z=p.z<-3?-4.8:-1.2; } };
    if(this.serbest&&!kilit) yuru(K,dt,sinir,this.kar_?1.6:2.1);
    etkilesimGuncelle(K,this.btn);
    if(!Kamera.sinema){ Kamera.hedef.lerp(K.position,.1); }
    for(const p of this.kuleler||[]){ const h=p.userData.yandi?1:0; p.userData.cam.material.emissiveIntensity=lerp(p.userData.cam.material.emissiveIntensity,h*1.2,.05); p.userData.l.intensity=lerp(p.userData.l.intensity,h*1.5,.05); }
    if(this.sinyalEl){ const d=K.position.distanceTo(this.tepe.position); const s=clamp(Math.round(4-d/7),0,4); this.sinyalEl.querySelectorAll("i").forEach((e,i)=>e.classList.toggle("dolu",i<s)); }
    if(this.karYag){ const p=this.karYag.geometry.attributes.position; for(let i=0;i<p.count;i++){ let y=p.getY(i)-dt*(1.2+(i%5)*.15), x=p.getX(i)+Math.sin(this.t*.8+i)*dt*.3; if(y<0) y=18; p.setY(i,y); p.setX(i,x); } p.needsUpdate=true; this.karYag.position.set(K.position.x,K.position.y,K.position.z); }
    this.kalpler=this.kalpler.filter(k=>{ k.v+=dt; if(k.oda){ k.s.position.y+=dt*.15; k.s.material.opacity=Math.max(0,1-k.v/4); } else { const e=Math.min(1,k.v/3.5); k.s.position.copy(k.bas).lerp(k.hedef,e*e); k.s.scale.setScalar(.5+e*6); k.s.material.opacity=1-e; }
      if(k.v>4){ k.s.parent&&k.s.parent.remove(k.s); return false; } return true; });
  },
  temizle(){ ICSAHNE=null; DM.kapat&&DM.kapat(); }
};
/* ================= BÖLÜM: KARLI YILBAŞI (31 Aralık 2025) — Cudi'nin kışı ayrı bölüm ================= */
const B5K=Object.assign(Object.create(B5),{
  id:"yilbasi", ad:"Karlı Yılbaşı", tarih:"31 Aralık 2025", alt:"Boyu aşan kar, kulenin dibinde yılbaşı",
  async kur(){ await this.dagKur(true); },
  async basla(){ katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); await this.yilbasi(); }
});
