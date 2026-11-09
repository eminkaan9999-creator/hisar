/* ================= ORTAM PARÇALARI ================= */
let DALGA=[];
function bayrakDoku(){
  if(bayrakDoku.t) return bayrakDoku.t;
  const W=600,H=400,c=document.createElement("canvas"); c.width=W; c.height=H; const x=c.getContext("2d");
  x.fillStyle="#e30a17"; x.fillRect(0,0,W,H); const G=H;
  x.fillStyle="#fff"; x.beginPath(); x.arc(.5*G,H/2,.25*G,0,7); x.fill();
  x.fillStyle="#e30a17"; x.beginPath(); x.arc(.5625*G,H/2,.2*G,0,7); x.fill();
  const sx=.5625*G+.2*G+.0833*G+.125*G*.2, sy=H/2, R=.125*G, r=R*.382; x.fillStyle="#fff"; x.beginPath();
  for(let i=0;i<10;i++){ const a=-Math.PI+i*Math.PI/5, rr=i%2?r:R; x.lineTo(sx+Math.cos(a)*rr, sy+Math.sin(a)*rr); } x.closePath(); x.fill();
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; t.__kalici=true; bayrakDoku.t=t; return t;
}
function bayrak(direkBoy=8,genislik=2.4){
  const g=new THREE.Group(); g.userData.engel=.12;
  const d=new THREE.Mesh(new THREE.CylinderGeometry(.045,.07,direkBoy,10),mat("#d9d9de",{metalness:.8,roughness:.3})); d.position.y=direkBoy/2; d.castShadow=true; g.add(d);
  const top=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),mat("#d9b45a",{metalness:.9,roughness:.3})); top.position.y=direkBoy+.05; g.add(top);
  const geo=new THREE.PlaneGeometry(genislik,genislik/1.5,24,10); geo.translate(genislik/2,0,0);
  const b=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:bayrakDoku(),side:THREE.DoubleSide,roughness:.85})); b.position.set(.05,direkBoy-genislik/3-.1,0); b.castShadow=true; g.add(b);
  DALGA.push({geo,orj:geo.attributes.position.array.slice(),faz:Math.random()*6,g:genislik}); return g;
}
function dalgaGuncelle(t){
  for(const d of DALGA){ const p=d.geo.attributes.position; if(!p) continue;
    for(let i=0;i<p.count;i++){ const x=d.orj[i*3], y=d.orj[i*3+1]; const k=x/d.g; p.setZ(i,Math.sin(x*2.6-t*5+d.faz+y*.6)*.16*k+Math.sin(x*5.1-t*7.3)*.04*k); }
    p.needsUpdate=true; d.geo.computeVertexNormals(); }
}
function agacEski(tur="yesil",o=1){
  const g=new THREE.Group();
  const gov=new THREE.Mesh(new THREE.CylinderGeometry(.12*o,.22*o,2.6*o,7),mat(tur==="cicek"?"#4a3226":"#5a4330",{roughness:.95})); gov.position.y=1.3*o; gov.castShadow=true; g.add(gov);
  const renkler={cicek:["#f7b6c8","#f39fb6","#ffd3df","#fbe3ea"],yesil:["#4f6e35","#5f7f3d","#46622f"],sonbahar:["#c9873b","#a85b2c","#d9a24a"],zeytin:["#7d8a5c","#6c7a50","#8f9a6a"]}[tur]||["#4f6e35"];
  const ig=new THREE.IcosahedronGeometry(1,1);
  const n=tur==="selvi"?0:9;
  for(let k=0;k<n;k++){ const c=new THREE.Mesh(ig,mat(renkler[k%renkler.length],{roughness:.85,flatShading:true}));
    const a=k/n*Math.PI*2, r=k?rnd(.5,1.1)*o:0; c.scale.setScalar(rnd(.65,1.05)*o*(tur==="zeytin"?.8:1)); c.position.set(Math.cos(a)*r,(2.5+rnd(0,1.1))*o,Math.sin(a)*r); c.castShadow=true; g.add(c); }
  g.userData.engel=(tur==="selvi"?.3:.32)*o;
  if(tur==="selvi"){ const c=new THREE.Mesh(new THREE.ConeGeometry(.75*o,5.5*o,9),mat("#2e4a2a",{roughness:.9,flatShading:true})); c.position.y=3.6*o; c.castShadow=true; g.add(c); gov.scale.y=.5; gov.position.y=.65*o; }
  return g;
}
function cimZemin(w,h,renk1="#5b7f3a",renk2="#7a9a48",tekrar=40){
  // ince çimen yaprakları (kenarlarda sarmalı, desen dikişsiz) + büyük ölçekte renk lekeleri (köşe renkleri)
  const anah="cim_"+renk1+renk2; let t=cimZemin[anah];
  if(!t){ const S=512; const c=document.createElement("canvas"); c.width=c.height=S; const x=c.getContext("2d");
    const c1=new THREE.Color(renk1), c2=new THREE.Color(renk2); x.fillStyle="#"+c1.clone().multiplyScalar(.92).getHexString(); x.fillRect(0,0,S,S);
    const ciz=(px,py,L,a,col,lw)=>{ for(const ox of [-S,0,S]) for(const oy of [-S,0,S]){ const X=px+ox, Y=py+oy; if(X<-12||X>S+12||Y<-12||Y>S+12) continue; x.strokeStyle=col; x.lineWidth=lw; x.beginPath(); x.moveTo(X,Y); x.lineTo(X+Math.cos(a)*L,Y+Math.sin(a)*L); x.stroke(); } };
    for(let i=0;i<16000;i++){ const k=Math.random(); const col=c1.clone().lerp(c2,k).multiplyScalar(rnd(.7,1.18)); if(Math.random()<.06) col.lerp(new THREE.Color("#b8a46a"),.45);
      ciz(Math.random()*S,Math.random()*S,rnd(3,9),-Math.PI/2+rnd(-.5,.5),"#"+col.getHexString(),rnd(.8,1.7)); }
    for(let i=0;i<500;i++){ x.fillStyle=`rgba(70,58,40,${rnd(.15,.35)})`; x.fillRect(Math.random()*S,Math.random()*S,rnd(1,2.5),rnd(1,2.5)); }
    t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding; t.anisotropy=8; cimZemin[anah]=t; t.__kalici=true; }
  const tt=t.clone(); tt.needsUpdate=true; tt.repeat.set(tekrar,tekrar*h/w);
  const n=Math.max(8,Math.min(64,Math.round(Math.max(w,h)/4))); const geo=new THREE.PlaneGeometry(w,h,n,n); const P=geo.attributes.position; const col=[];
  const fx=rnd(0,9), fz=rnd(0,9);
  for(let i=0;i<P.count;i++){ const X=P.getX(i), Y=P.getY(i); const v=Math.sin(X*.07+fx)*Math.cos(Y*.06+fz)*.5+Math.sin(X*.021+Y*.017+fz)*.5+Math.sin(X*.13-Y*.11)*.18;
    const k=.86+v*.12, sar=Math.max(0,v)*.06; col.push(k+sar,k+sar*.6,k-sar*.5); }
  geo.setAttribute("color",new THREE.Float32BufferAttribute(col,3));
  const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:tt,vertexColors:true,roughness:1,bumpMap:gurultuDoku(tekrar*2),bumpScale:.02})); m.rotation.x=-Math.PI/2; m.receiveShadow=true; return m;
}
function otlarEski(alan,adet,renkH="#6f9443",yuk=.35){
  const geo=new THREE.ConeGeometry(.05,1,3); geo.translate(0,.5,0);
  const m=new THREE.InstancedMesh(geo,mat(renkH,{roughness:.9}),adet); const o=new THREE.Object3D();
  for(let i=0;i<adet;i++){ const p=alan(); o.position.set(p.x,p.y||0,p.z); o.rotation.set(rnd(-.3,.3),rnd(0,6),rnd(-.3,.3)); const s=rnd(.5,1.2); o.scale.set(s,s*yuk*rnd(.6,1.3),s); o.updateMatrix(); m.setMatrixAt(i,o.matrix); }
  m.receiveShadow=true; return m;
}
function ipLambalar(noktalar,renkH="#ffd9a0",sarkma=.4,aralik=.35){
  const g=new THREE.Group(); const pts=[]; const ampul=[];
  for(let i=0;i<noktalar.length-1;i++){ const a=noktalar[i], b=noktalar[i+1]; const L=a.distanceTo(b); const n=Math.max(2,Math.round(L/aralik));
    for(let k=0;k<=n;k++){ const t=k/n; const p=a.clone().lerp(b,t); p.y-=Math.sin(t*Math.PI)*sarkma*L/6; pts.push(p); if(k%1===0) ampul.push(p.clone().add(new THREE.Vector3(0,-.06,0))); } }
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x222222})));
  const pg=new THREE.BufferGeometry().setFromPoints(ampul);
  const pm=new THREE.PointsMaterial({map:parlakDokuAl(),color:renk(renkH),size:.55,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}); g.add(new THREE.Points(pg,pm));
  const am=new THREE.InstancedMesh(new THREE.SphereGeometry(.035,6,5),new THREE.MeshBasicMaterial({color:renk("#fff1cf")}),ampul.length); const o=new THREE.Object3D();
  ampul.forEach((p,i)=>{ o.position.copy(p); o.updateMatrix(); am.setMatrixAt(i,o.matrix); }); g.add(am);
  g.userData.isik=pm; return g;
}
function sandalye(renkH="#f2efe8"){ const g=new THREE.Group(), m=mat(renkH,{roughness:.6}); g.userData.engel={kutu:[.23,.23]};
  const otur=new THREE.Mesh(new THREE.BoxGeometry(.44,.05,.42),m); otur.position.y=.46; g.add(otur);
  const sirt=new THREE.Mesh(new THREE.BoxGeometry(.44,.5,.04),m); sirt.position.set(0,.72,-.2); g.add(sirt);
  for(const [a,b] of [[-.19,-.18],[.19,-.18],[-.19,.18],[.19,.18]]){ const ay=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.46,6),m); ay.position.set(a,.23,b); g.add(ay); }
  g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); return g; }
function masa(r=.75,ortu="#fbf6ee"){ const g=new THREE.Group(); g.userData.engel=r+.05;
  const ust=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.03,28),mat(ortu,{roughness:.8})); ust.position.y=.76; g.add(ust);
  const ortuM=new THREE.Mesh(new THREE.CylinderGeometry(r+.02,r+.12,.6,28,1,true),mat(ortu,{roughness:.85,side:THREE.DoubleSide})); ortuM.position.y=.46; g.add(ortuM);
  const mum=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.12,8),new THREE.MeshStandardMaterial({color:renk("#fff3dc"),emissive:renk("#ffb35a"),emissiveIntensity:.6})); mum.position.y=.84; g.add(mum);
  const al=parilti("#ffb35a",.5); al.position.y=.94; g.add(al);
  const cic=new THREE.Mesh(new THREE.IcosahedronGeometry(.11,1),mat("#f4a9be",{roughness:.8,flatShading:true})); cic.position.set(.2,.85,.1); g.add(cic);
  g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); return g; }
// kaya: konuma bağlı gürültüyle bozulan ikosahedron (aynı köşeler aynı kayar, çatlak/kâğıt görüntüsü olmaz), altı düz, üstü yuvarlak
function kaya(o=1,renkH="#8a7f72"){ const geo=new THREE.IcosahedronGeometry(1,2); const p=geo.attributes.position, t=Math.random()*100, v=new THREE.Vector3();
  const cr=[], c0=renk(renkH), c=new THREE.Color();
  for(let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i); const n=Math.sin(v.x*2.9+t)*Math.cos(v.y*2.3+t*1.3)*Math.sin(v.z*3.3+t*.7), m2=Math.sin(v.x*7.1+v.z*6.3+v.y*5.2+t);
    v.multiplyScalar(1+.24*n+.07*m2); v.y=Math.max(v.y*.64,-.28); p.setXYZ(i,v.x,v.y,v.z);
    const k=.86+.14*(v.y+.3)+.06*m2; c.copy(c0).multiplyScalar(k); cr.push(c.r,c.g,c.b); }
  geo.setAttribute("color",new THREE.Float32BufferAttribute(cr,3)); geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.95,flatShading:true,bumpMap:gurultuDoku(2),bumpScale:.04})); m.scale.setScalar(o); m.castShadow=true; m.receiveShadow=true; m.userData.engel=.92; return m; }
function ayYap(boy=26){ const c=document.createElement("canvas"); c.width=c.height=256; const x=c.getContext("2d");
  const g=x.createRadialGradient(128,128,20,128,128,128); g.addColorStop(0,"rgba(255,250,235,1)"); g.addColorStop(.32,"rgba(255,246,225,1)"); g.addColorStop(.36,"rgba(220,225,255,.35)"); g.addColorStop(1,"rgba(160,170,255,0)");
  x.fillStyle=g; x.fillRect(0,0,256,256); x.globalAlpha=.12; x.fillStyle="#9a8f80"; [[110,105,14],[150,140,10],[120,150,8],[142,100,6]].forEach(([a,b,r])=>{ x.beginPath(); x.arc(a,b,r,0,7); x.fill(); });
  const t=new THREE.CanvasTexture(c); const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false})); s.scale.set(boy,boy,1); return s; }
// yivli mermer sütun dokusu: 20 yiv, yaşlanma lekeleri (bump için de kullanılır)
function sutunDoku(){ if(sutunDoku.t) return sutunDoku.t; const c=document.createElement("canvas"); c.width=512; c.height=256; const x=c.getContext("2d");
  x.fillStyle="#e6dcc6"; x.fillRect(0,0,512,256); for(let i=0;i<20;i++){ const g=x.createLinearGradient(i*25.6,0,i*25.6+25.6,0); g.addColorStop(0,"rgba(255,255,255,.35)"); g.addColorStop(.18,"rgba(120,105,85,.32)"); g.addColorStop(.5,"rgba(150,135,110,.18)"); g.addColorStop(.82,"rgba(120,105,85,.32)"); g.addColorStop(1,"rgba(255,255,255,.35)"); x.fillStyle=g; x.fillRect(i*25.6,0,25.6,256); }
  for(let i=0;i<40;i++){ const px=Math.random()*512, py=Math.random()*256, r=rnd(8,40); const g=x.createRadialGradient(px,py,0,px,py,r); g.addColorStop(0,`rgba(${rnd(110,150)|0},${rnd(95,125)|0},${rnd(70,95)|0},.22)`); g.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle=g; x.fillRect(px-r,py-r,2*r,2*r); }
  const d=x.getImageData(0,0,512,256); for(let i=0;i<d.data.length;i+=4){ const n=(Math.random()-.5)*16; d.data[i]+=n; d.data[i+1]+=n; d.data[i+2]+=n; } x.putImageData(d,0,0);
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding; t.__kalici=true; sutunDoku.t=t; return t; }
function sutun(boy=5,yikik=false){ const g=new THREE.Group(), m=mat("#e8dcc4",{roughness:.9,bumpMap:gurultuDoku(2),bumpScale:.08}); const sd=sutunDoku();
  const ms=new THREE.MeshStandardMaterial({map:sd,bumpMap:sd,bumpScale:.06,roughness:.85});
  const h=yikik?boy*rnd(.35,.7):boy; const s=new THREE.Mesh(new THREE.CylinderGeometry(.34,.38,h,28),ms); s.position.y=h/2+.3; s.castShadow=true; s.receiveShadow=true; g.add(s);
  const k=new THREE.Mesh(new THREE.BoxGeometry(1,.3,1),m); k.position.y=.15; k.castShadow=true; g.add(k);
  if(!yikik){ const b=new THREE.Mesh(new THREE.BoxGeometry(.95,.32,.95),m); b.position.y=h+.46; b.castShadow=true; g.add(b); }
  g.userData.engel={kutu:[.5,.5]}; return g; }
function yaziDoku(metin,ops={}){ const c=document.createElement("canvas"); c.width=ops.w||512; c.height=ops.h||128; const x=c.getContext("2d");
  x.fillStyle=ops.zemin||"rgba(0,0,0,0)"; x.fillRect(0,0,c.width,c.height); x.fillStyle=ops.renk||"#fff"; x.font=ops.font||"600 64px Georgia"; x.textAlign="center"; x.textBaseline="middle"; x.fillText(metin,c.width/2,c.height/2);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; return t; }
function tozlar(n,alan,renkH="#ffd9a3",boy=.16){ const g=new THREE.BufferGeometry(), p=new Float32Array(n*3); for(let i=0;i<n;i++){ const q=alan(); p[i*3]=q.x; p[i*3+1]=q.y; p[i*3+2]=q.z; }
  g.setAttribute("position",new THREE.BufferAttribute(p,3)); return new THREE.Points(g,new THREE.PointsMaterial({map:parlakDokuAl(),color:renk(renkH),size:boy,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); }
