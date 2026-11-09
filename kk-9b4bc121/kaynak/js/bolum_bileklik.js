/* ================= BÖLÜM: BİLEKLİK VE KEMAN (31 Aralık 2024 · 18 Ocak 2025) ================= */
/* Kardelen'in yurt odası. Yılbaşı günü kargodan bileklik, iki charm ve temizleme bezi çıkar; charmlar bu bilekliğe takılmaz
   ama bileklik en küçük bedendir, tam bileğine olur. Gece yarısı telefonda “iyi ki”. 18 Ocak: resepsiyondan uzun bir kutu,
   simli siyah keman; akort ve ilk notalar. Bu bölümde oynanan karakter Kardelen. */

/* ---------- küçük yardımcılar ---------- */
function _bkTuval(w,h,ciz){ const c=document.createElement("canvas"); c.width=w; c.height=h; ciz(c.getContext("2d"),w,h); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; return t; }
function parkeDoku(renk1="#a0774f",renk2="#8a6440"){
  return _bkTuval(512,512,(x,w,h)=>{ x.fillStyle=renk2; x.fillRect(0,0,w,h);
    for(let j=0;j<8;j++){ const o=(j%2)*128+rnd(-30,30); for(let i=-1;i<3;i++){ const X=i*256+o, Y=j*64; const c=new THREE.Color(renk1).lerp(new THREE.Color(renk2),Math.random()*.7);
      x.fillStyle="#"+c.getHexString(); x.fillRect(X+1,Y+1,254,62);
      x.globalAlpha=.18; for(let k=0;k<14;k++){ x.strokeStyle=Math.random()<.5?"#5a3c22":"#c49a6c"; x.lineWidth=rnd(.6,1.6); x.beginPath(); const yy=Y+4+Math.random()*56; x.moveTo(X,yy); x.bezierCurveTo(X+80,yy+rnd(-4,4),X+170,yy+rnd(-4,4),X+256,yy+rnd(-3,3)); x.stroke(); } x.globalAlpha=1; } } });
}
// simli siyah: koyu zemin üstünde gümüş ve mor pırıltılar (keman cilası)
function simliDoku(){ if(simliDoku.t) return simliDoku.t;
  simliDoku.t=_bkTuval(512,512,(x,w,h)=>{ x.fillStyle="#0c0b12"; x.fillRect(0,0,w,h);
    for(let i=0;i<5200;i++){ const r=Math.random(); x.fillStyle=r<.6?`rgba(230,230,255,${rnd(.25,.9)})`:r<.85?`rgba(190,150,255,${rnd(.2,.7)})`:`rgba(255,200,230,${rnd(.2,.7)})`; const s=Math.random()<.92?1:2; x.fillRect(Math.random()*w,Math.random()*h,s,s); } });
  simliDoku.t.wrapS=simliDoku.t.wrapT=THREE.RepeatWrapping; simliDoku.t.repeat.set(2,2); return simliDoku.t; }
function kartonDoku(){ if(kartonDoku.t) return kartonDoku.t;
  kartonDoku.t=_bkTuval(256,256,(x,w,h)=>{ x.fillStyle="#b88a5a"; x.fillRect(0,0,w,h); for(let i=0;i<900;i++){ x.fillStyle=`rgba(${Math.random()<.5?"90,60,30":"230,200,160"},${rnd(.05,.18)})`; x.fillRect(Math.random()*w,Math.random()*h,rnd(1,6),1); }
    x.strokeStyle="rgba(90,60,30,.25)"; for(let i=0;i<256;i+=6){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,h); x.stroke(); } }); return kartonDoku.t; }

/* ---------- bileklik: küçük halkalardan zincir, kilit; charmlar ---------- */
function bileklikYap(R=.03){
  const g=new THREE.Group(); const gum=new THREE.MeshStandardMaterial({color:renk("#eef0f6"),metalness:1,roughness:.16});
  const N=Math.round(R*2*Math.PI/.0034); const hal=new THREE.TorusGeometry(.0019,.00055,6,12);
  const im=new THREE.InstancedMesh(hal,gum,N); const M=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler();
  for(let i=0;i<N;i++){ const a=i/N*Math.PI*2; const p=new THREE.Vector3(Math.cos(a)*R,0,Math.sin(a)*R);
    e.set(i%2?Math.PI/2:0,-a,0,"YXZ"); q.setFromEuler(e); M.compose(p,q,new THREE.Vector3(1,1,1)); im.setMatrixAt(i,M); }
  g.add(im);
  const kil=new THREE.Mesh(new THREE.TorusGeometry(.0034,.0011,8,16),gum); kil.position.set(R,0,0); kil.rotation.y=Math.PI/2; g.add(kil);
  const kil2=new THREE.Mesh(new THREE.CylinderGeometry(.0018,.0018,.007,8),gum); kil2.position.set(R*.97,0,.005); kil2.rotation.x=Math.PI/2; g.add(kil2);
  const p=parilti("#ffffff",.06); p.position.set(R,0,0); g.add(p); g.userData.parilti=p; g.userData.mat=gum; return g;
}
function charmYap(tur){
  const g=new THREE.Group(); const gum=new THREE.MeshStandardMaterial({color:renk("#f1f2f6"),metalness:1,roughness:.14});
  if(tur==="kalp"){ const k=new THREE.Mesh(kalpGeo(),gum); k.scale.setScalar(.032); g.add(k); const t=new THREE.Mesh(new THREE.SphereGeometry(.0022,10,8),new THREE.MeshStandardMaterial({color:renk("#ff6f9a"),roughness:.05,metalness:.2,emissive:renk("#ff2f6a"),emissiveIntensity:.25})); t.position.set(0,0,.003); g.add(t); }
  else { const d=new THREE.Mesh(new THREE.CylinderGeometry(.0058,.0058,.0028,24),gum); d.rotation.x=Math.PI/2; g.add(d);
    const t=new THREE.Mesh(new THREE.OctahedronGeometry(.0034,0),new THREE.MeshStandardMaterial({color:renk("#c9a8ff"),roughness:.02,metalness:.1,emissive:renk("#8a5cff"),emissiveIntensity:.25})); t.position.z=.0022; t.scale.z=.55; g.add(t); }
  const h=new THREE.Mesh(new THREE.TorusGeometry(.0022,.0006,6,10),gum); h.position.y=.0075; g.add(h);
  return g;
}
function mucevherKutusu(w,h,d,renkH="#f6f2f4"){
  const g=new THREE.Group(); const dis=mat(renkH,{roughness:.55}), ic=mat("#3a2a3a",{roughness:1});
  const alt=new THREE.Mesh(kutuGeo(w,h*.62,d,.4),dis); alt.position.y=h*.31; g.add(alt);
  const ped=new THREE.Mesh(new THREE.BoxGeometry(w*.86,.004,d*.86),ic); ped.position.y=h*.62+.001; g.add(ped);
  const kapak=new THREE.Group(); kapak.position.set(0,h*.62,-d/2); g.add(kapak);
  const kp=new THREE.Mesh(kutuGeo(w*1.02,h*.38,d*1.02,.4),dis); kp.position.set(0,h*.19,d/2); kapak.add(kp);
  const kurd=new THREE.Mesh(new THREE.BoxGeometry(w*1.04,h*.39,.008),mat("#e7a3bd",{roughness:.6})); kurd.position.set(0,h*.19,d/2); kapak.add(kurd);
  g.userData.kapak=kapak; g.userData.ped=ped; return g;
}
function bezYap(){ const geo=new THREE.PlaneGeometry(.085,.085,8,8); const P=geo.attributes.position; for(let i=0;i<P.count;i++){ P.setZ(i,Math.sin(P.getX(i)*90)*.002+Math.cos(P.getY(i)*70)*.0015); } geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,mat("#7a5aa8",{roughness:1,side:THREE.DoubleSide})); m.rotation.x=-Math.PI/2; return m; }

/* ---------- keman: gövde dış hattı (yarım), boyun, sap, burgu kutusu, salyangoz, köprü, teller ---------- */
function kemanYap(){
  const g=new THREE.Group();
  const yarim=[[0,0],[.06,.005],[.093,.028],[.103,.068],[.099,.108],[.086,.134],[.064,.149],[.056,.172],[.06,.197],[.074,.213],[.083,.238],[.085,.276],[.077,.312],[.053,.341],[.022,.354],[0,.356]];
  const sh=new THREE.Shape(); sh.moveTo(0,0); const sag=yarim.map(p=>new THREE.Vector2(p[0],p[1])); const sol=yarim.slice().reverse().map(p=>new THREE.Vector2(-p[0],p[1]));
  sh.splineThru(sag.slice(1)); sh.splineThru(sol.slice(1));
  const gm=new THREE.MeshPhysicalMaterial({color:renk("#141218"),metalness:.35,roughness:.28,clearcoat:1,clearcoatRoughness:.06,map:simliDoku(),emissive:renk("#ffffff"),emissiveMap:simliDoku(),emissiveIntensity:.12});
  const gov=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.032,bevelEnabled:true,bevelThickness:.007,bevelSize:.006,bevelSegments:3,curveSegments:24}),gm); gov.castShadow=true; g.add(gov);
  const eb=mat("#0b0a0c",{roughness:.35});
  const sap=new THREE.Mesh(new THREE.BoxGeometry(.024,.13,.022),gm); sap.position.set(0,.42,.02); g.add(sap);
  const klavye=new THREE.Mesh(new THREE.BoxGeometry(.03,.27,.006),eb); klavye.position.set(0,.395,.045); klavye.rotation.x=-.035; g.add(klavye);
  const kutu=new THREE.Mesh(new THREE.BoxGeometry(.022,.075,.03),gm); kutu.position.set(0,.523,.018); kutu.rotation.x=.18; g.add(kutu);
  const sal=new THREE.Mesh(new THREE.TorusGeometry(.014,.007,8,20,Math.PI*1.7),gm); sal.position.set(0,.57,.012); sal.rotation.y=Math.PI/2; g.add(sal);
  for(let i=0;i<4;i++){ const b=new THREE.Mesh(new THREE.CylinderGeometry(.0035,.0035,.06,8),eb); b.rotation.z=Math.PI/2; b.position.set(0,.497+i*.014,.02+(i%2?.004:-.004)); g.add(b);
    const tu=new THREE.Mesh(new THREE.SphereGeometry(.0075,10,8),eb); tu.scale.set(.5,1,1.1); tu.position.set(i%2?.034:-.034,.497+i*.014,.02); g.add(tu); }
  const top=.039+.007; // gövde üst yüzeyi
  const kopru=new THREE.Mesh(new THREE.BoxGeometry(.042,.003,.03),mat("#e8d2a8",{roughness:.6})); kopru.position.set(0,.152,top+.015); kopru.rotation.x=Math.PI/2; g.add(kopru);
  const kuyruk=new THREE.Mesh(new THREE.BoxGeometry(.03,.1,.006),eb); kuyruk.position.set(0,.06,top+.01); kuyruk.rotation.x=.1; g.add(kuyruk);
  const cene=new THREE.Mesh(new THREE.CylinderGeometry(.03,.034,.012,20),eb); cene.scale.set(1.25,1,.8); cene.rotation.x=Math.PI/2; cene.position.set(-.045,.03,top+.006); g.add(cene);
  // teller: kuyruktan köprüye, köprüden eşiğe
  const tm=new THREE.LineBasicMaterial({color:0xd9dde6}); for(let i=0;i<4;i++){ const x=(i-1.5)*.0055;
    const pts=[new THREE.Vector3(x*1.4,.1,top+.016),new THREE.Vector3(x*1.6,.152,top+.031),new THREE.Vector3(x,.522,top+.008)]; g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),tm)); }
  // f delikleri
  const fd=_bkTuval(64,128,(x,w,h)=>{ x.clearRect(0,0,w,h); x.strokeStyle="#000"; x.lineWidth=6; x.lineCap="round"; x.beginPath(); x.moveTo(44,14); x.bezierCurveTo(20,40,44,88,20,114); x.stroke(); x.fillStyle="#000"; x.beginPath(); x.arc(44,14,7,0,7); x.fill(); x.beginPath(); x.arc(20,114,7,0,7); x.fill(); });
  for(const s of [-1,1]){ const f=new THREE.Mesh(new THREE.PlaneGeometry(.018,.05),new THREE.MeshBasicMaterial({map:fd,transparent:true,depthWrite:false})); f.position.set(s*.036,.16,top+.0012); f.scale.x=s; g.add(f); }
  g.userData.gm=gm; return g;
}
function yayYap(){ const g=new THREE.Group(); const ag=mat("#5a2c18",{roughness:.4});
  const c=new THREE.Mesh(new THREE.CylinderGeometry(.0035,.0045,.72,8),ag); c.rotation.z=Math.PI/2; g.add(c);
  const kil=new THREE.Mesh(new THREE.TorusGeometry(.008,.0015,4,8,Math.PI*1.5),mat("#121014")); kil.position.x=-.38; g.add(kil);
  const fr=new THREE.Mesh(new THREE.BoxGeometry(.045,.022,.012),mat("#121014",{roughness:.4})); fr.position.set(-.33,-.012,0); g.add(fr);
  const kil_=new THREE.Mesh(new THREE.BoxGeometry(.66,.0025,.009),mat("#f4f0e6",{roughness:1})); kil_.position.set(.01,-.017,0); g.add(kil_);
  const uc=new THREE.Mesh(new THREE.BoxGeometry(.012,.022,.01),ag); uc.position.set(.36,-.008,0); g.add(uc); return g; }
function kemanKutusuYap(){
  const g=new THREE.Group(); const L=.8, W=.25, H=.11;
  const dis=mat("#1c1a22",{roughness:.7,bumpMap:gurultuDoku(10),bumpScale:.004});
  const alt=new THREE.Mesh(kutuGeo(L,H*.62,W,.5),dis); alt.position.y=H*.31; alt.castShadow=true; g.add(alt);
  const ic=new THREE.Mesh(new THREE.BoxGeometry(L*.95,.004,W*.86),mat("#a98ac9",{roughness:1})); ic.position.y=H*.62-.012; g.add(ic);
  const kapak=new THREE.Group(); kapak.position.set(0,H*.62,-W/2); g.add(kapak);
  const kp=new THREE.Mesh(kutuGeo(L*1.01,H*.36,W*1.01,.5),dis); kp.position.set(0,H*.18,W/2); kp.castShadow=true; kapak.add(kp);
  const kpi=new THREE.Mesh(new THREE.PlaneGeometry(L*.95,W*.9),mat("#a98ac9",{roughness:1,side:THREE.DoubleSide})); kpi.rotation.x=Math.PI/2; kpi.position.set(0,.002,W/2); kapak.add(kpi);
  const met=mat("#c9ccd6",{metalness:1,roughness:.25}); const kilitler=[];
  for(const x of [-.22,.22]){ const k=new THREE.Mesh(new THREE.BoxGeometry(.035,.03,.008),met); k.position.set(x,H*.62,W/2+.004); g.add(k); kilitler.push(k); }
  const sap=new THREE.Mesh(new THREE.TorusGeometry(.04,.008,6,14,Math.PI),mat("#111")); sap.position.set(0,H*.62,W/2+.012); sap.rotation.x=Math.PI/2; g.add(sap);
  const keman=kemanYap(); keman.rotation.set(-Math.PI/2,0,-Math.PI/2); keman.position.set(-.29,H*.62-.05,0); keman.scale.setScalar(.94); g.add(keman);
  const yay=yayYap(); yay.position.set(.02,H*.62-.008,.075); yay.scale.setScalar(.97); g.add(yay);
  g.userData={kapak,kilitler,keman,yay}; return g;
}

/* ---------- pencere manzarası: alacakaranlık / gece / karlı gün (kar taneleri her karede yeniden çizilir) ---------- */
function bkManzara(tur){
  const c=document.createElement("canvas"); c.width=320; c.height=256; const x=c.getContext("2d");
  const evler=[]; for(let i=0;i<14;i++) evler.push({x:i*26+rnd(-6,6),w:rnd(22,34),h:rnd(40,110),p:Math.random()});
  const tepe=[]; for(let i=0;i<=16;i++) tepe.push(150+Math.sin(i*.9)*12+Math.sin(i*2.3)*6);
  const taneler=[]; for(let i=0;i<110;i++) taneler.push({x:Math.random()*320,y:Math.random()*256,v:rnd(14,34),r:rnd(.8,2.2),f:Math.random()*6});
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding;
  const ciz=(zaman)=>{
    const g=x.createLinearGradient(0,0,0,256);
    if(tur==="aksam"){ g.addColorStop(0,"#3a4a7e"); g.addColorStop(.55,"#e9a07a"); g.addColorStop(.8,"#f6c99a"); g.addColorStop(1,"#9a8a9a"); }
    else if(tur==="gece"){ g.addColorStop(0,"#070a1f"); g.addColorStop(.7,"#1b2550"); g.addColorStop(1,"#2a3058"); }
    else { g.addColorStop(0,"#c9d2dc"); g.addColorStop(.7,"#e6eaee"); g.addColorStop(1,"#f2f4f6"); }
    x.fillStyle=g; x.fillRect(0,0,320,256);
    if(tur==="gece"){ for(let i=0;i<60;i++){ x.fillStyle=`rgba(255,255,255,${.3+.5*((i*37)%10)/10})`; x.fillRect((i*53)%320,(i*29)%120,1.4,1.4); } }
    // uzak karlı tepeler
    x.fillStyle=tur==="gece"?"#252a45":tur==="aksam"?"#8a7f98":"#e9edf1"; x.beginPath(); x.moveTo(0,256); tepe.forEach((y,i)=>x.lineTo(i*20,y)); x.lineTo(320,256); x.fill();
    // binalar, karlı çatılar, pencereler
    for(const e of evler){ const y=256-e.h; x.fillStyle=tur==="gece"?"#11131f":tur==="aksam"?"#5a5262":"#a9a4a0"; x.fillRect(e.x,y,e.w,e.h);
      x.fillStyle=tur==="gece"?"#d8deea":"#f6f8fb"; x.fillRect(e.x-1,y-3,e.w+2,4);
      for(let k=0;k<6;k++) for(let j=0;j<Math.floor(e.h/16);j++){ const yan=((k*7+j*13+Math.floor(e.p*10))%5)<(tur==="gece"?3:tur==="aksam"?2:0);
        if(yan){ x.fillStyle=tur==="gece"?"#ffcf7a":"#ffd9a0"; x.fillRect(e.x+3+k*5,y+6+j*15,3,6); } } }
    if(tur!=="aksam"){ x.fillStyle="rgba(255,255,255,.9)"; for(const n of taneler){ const yy=(n.y+zaman*n.v)%256, xx=(n.x+Math.sin(zaman*.8+n.f)*8+320)%320; x.beginPath(); x.arc(xx,yy,n.r*(tur==="gece"?.8:1),0,7); x.fill(); } }
    t.needsUpdate=true; };
  ciz(0); return {doku:t,ciz,tur};
}

/* ---------- yurt odası ---------- */
function bkOda(B,ops){
  const oda=new THREE.Group(); scene.add(oda); const W=4.4, D=5.6, H=2.75; const x0=-W/2, z0=-D/2;
  const duvar=mat("#efe4dd",{roughness:.95}), vurgu=mat("#d9c3d6",{roughness:.95});
  const zt=parkeDoku(); zt.wrapS=zt.wrapT=THREE.RepeatWrapping; zt.repeat.set(2.2,2.8);
  const zem=new THREE.Mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshStandardMaterial({map:zt,roughness:.55,metalness:0})); zem.rotation.x=-Math.PI/2; zem.receiveShadow=true; oda.add(zem);
  const tav=new THREE.Mesh(new THREE.PlaneGeometry(W,D),mat("#f6f2ee")); tav.rotation.x=Math.PI/2; tav.position.y=H; oda.add(tav);
  const dv=(w,x,z,ry,m)=>{ const p=new THREE.Mesh(new THREE.PlaneGeometry(w,H),m||duvar); p.position.set(x,H/2,z); p.rotation.y=ry; p.receiveShadow=true; oda.add(p); return p; };
  dv(W,0,z0,0); dv(W,0,-z0,Math.PI); dv(D,x0,0,Math.PI/2,vurgu); dv(D,-x0,0,-Math.PI/2);
  for(const [w,x,z,ry] of [[W,0,z0+.01,0],[W,0,-z0-.01,Math.PI],[D,x0+.01,0,Math.PI/2],[D,-x0-.01,0,-Math.PI/2]]){ const s=new THREE.Mesh(new THREE.BoxGeometry(w,.09,.012),mat("#fbf8f4")); s.position.set(x,.045,z); s.rotation.y=ry; oda.add(s); }
  // pencere (arka duvar), perdeler, kalorifer
  const man=bkManzara(ops.manzara); B.manzara=man;
  const pen=new THREE.Mesh(new THREE.PlaneGeometry(1.5,1.3),new THREE.MeshBasicMaterial({map:man.doku,toneMapped:false})); pen.position.set(.45,1.62,z0+.015); oda.add(pen); B.pencere=pen;
  const cer=mat("#fbfbf8",{roughness:.4}); for(const [w,h,x,y] of [[1.62,.07,.45,2.3],[1.62,.07,.45,.94],[.07,1.42,-.33,1.62],[.07,1.42,1.23,1.62],[.045,1.3,.45,1.62]]){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.06),cer); m.position.set(x,y,z0+.035); oda.add(m); }
  const esik=new THREE.Mesh(new THREE.BoxGeometry(1.75,.035,.2),cer); esik.position.set(.45,.92,z0+.1); oda.add(esik);
  const perdeM=mat("#cdb3d9",{roughness:1,side:THREE.DoubleSide});
  for(const s of [-1,1]){ const geo=new THREE.PlaneGeometry(.55,1.95,24,1); const P=geo.attributes.position; for(let i=0;i<P.count;i++) P.setZ(i,Math.sin(P.getX(i)*38)*.035); geo.computeVertexNormals();
    const p=new THREE.Mesh(geo,perdeM); p.position.set(.45+s*.92,1.4,z0+.12); p.castShadow=true; oda.add(p); }
  const cub=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,2.6,8),mat("#c8c2bd",{metalness:.6,roughness:.4})); cub.rotation.z=Math.PI/2; cub.position.set(.45,2.42,z0+.12); oda.add(cub);
  const kal=new THREE.Mesh(new THREE.BoxGeometry(1.2,.5,.08),mat("#f4f4f2",{roughness:.4})); kal.position.set(.45,.5,z0+.07); oda.add(kal);
  for(let i=0;i<14;i++){ const f=new THREE.Mesh(new THREE.BoxGeometry(.025,.46,.1),mat("#ecebea",{roughness:.4})); f.position.set(-.1+i*.08,.5,z0+.08); oda.add(f); }
  // çalışma masası, sandalye, lamba, kitaplar, laptop, kupa
  const ah=mat("#e9e1d6",{roughness:.6}), ayak=mat("#b9b2a8",{roughness:.5,metalness:.3});
  const masa=new THREE.Group(); masa.position.set(.45,0,z0+.42); oda.add(masa); masa.userData.engel={kutu:[.7,.36]}; B.masa=masa;
  const ust=new THREE.Mesh(new THREE.BoxGeometry(1.4,.04,.66),ah); ust.position.y=.74; ust.castShadow=true; ust.receiveShadow=true; masa.add(ust);
  for(const [x,z] of [[-.66,-.29],[.66,-.29],[-.66,.29],[.66,.29]]){ const l=new THREE.Mesh(new THREE.BoxGeometry(.04,.72,.04),ayak); l.position.set(x,.36,z); masa.add(l); }
  const cek=new THREE.Mesh(new THREE.BoxGeometry(.4,.5,.6),ah); cek.position.set(.47,.47,0); masa.add(cek);
  for(let i=0;i<3;i++){ const t=new THREE.Mesh(new THREE.BoxGeometry(.1,.012,.012),ayak); t.position.set(.47,.62-i*.16,.305); masa.add(t); }
  const lap=new THREE.Mesh(new THREE.BoxGeometry(.33,.018,.23),mat("#c9ccd2",{metalness:.7,roughness:.3})); lap.position.set(-.36,.77,-.06); lap.rotation.y=.1; masa.add(lap);
  for(let i=0;i<5;i++){ const k=new THREE.Mesh(new THREE.BoxGeometry(.035,rnd(.18,.24),.15),mat(["#7a2236","#2d3a55","#d9b8c4","#3f5d4a","#c9a24a"][i])); k.position.set(.45+i*.04,.76+k.geometry.parameters.height/2,-.2); masa.add(k); }
  const kupa=new THREE.Mesh(new THREE.CylinderGeometry(.04,.036,.09,16),mat("#f2b6c8",{roughness:.35})); kupa.position.set(.55,.805,.15); masa.add(kupa);
  const lb=new THREE.Mesh(new THREE.CylinderGeometry(.07,.08,.02,16),mat("#f6f2ee")); lb.position.set(-.58,.76,-.2); masa.add(lb);
  const lk=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.38,8),mat("#f6f2ee")); lk.position.set(-.58,.95,-.2); masa.add(lk);
  const ls=new THREE.Mesh(new THREE.ConeGeometry(.1,.12,20,1,true),new THREE.MeshStandardMaterial({color:renk("#fff3e2"),emissive:renk("#ffbe7a"),emissiveIntensity:1.1,side:THREE.DoubleSide})); ls.position.set(-.58,1.14,-.2); masa.add(ls);
  B.masaLamba=new THREE.PointLight(renk("#ffc48a"),ops.gece?2.2:1.2,6,1.4); B.masaLamba.position.set(-.58+.45,1.05,z0+.3); oda.add(B.masaLamba);
  const sand=new THREE.Group(); sand.position.set(.35,0,z0+1.02); sand.rotation.y=.25; /* sırtı odaya, oturağı masaya dönük (ters duruyordu: oturunca sırtlık önüne geliyordu) */ oda.add(sand); sand.userData.engel=.3;
  const otur=new THREE.Mesh(new THREE.BoxGeometry(.44,.07,.42),mat("#d6c6e6",{roughness:.9})); otur.position.y=.47; sand.add(otur);
  const sirt=new THREE.Mesh(new THREE.BoxGeometry(.42,.42,.05),mat("#d6c6e6",{roughness:.9})); sirt.position.set(0,.78,.2); sirt.rotation.x=-.12; sand.add(sirt);
  const di=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.38,8),ayak); di.position.y=.25; sand.add(di);
  for(let i=0;i<5;i++){ const a=i/5*Math.PI*2; const k=new THREE.Mesh(new THREE.BoxGeometry(.28,.025,.035),ayak); k.position.set(Math.cos(a)*.13,.05,Math.sin(a)*.13); k.rotation.y=-a; sand.add(k); }
  // yatak (sol duvar), yastıklar, örtü, ayıcık, başlık
  const yat=new THREE.Group(); yat.position.set(x0+.55,0,z0+1.15); oda.add(yat); yat.userData.engel={kutu:[.52,1.05]}; B.yatak=yat;
  const ce=new THREE.Mesh(new THREE.BoxGeometry(1.0,.3,2.1),mat("#c9a98a",{roughness:.7})); ce.position.y=.2; yat.add(ce);
  const sil=new THREE.Mesh(new THREE.BoxGeometry(.94,.16,2.0),mat("#fbf8f6",{roughness:.95})); sil.position.y=.43; yat.add(sil);
  const ort=new THREE.Mesh(new THREE.BoxGeometry(1.02,.07,1.35),mat("#b98ab0",{roughness:1})); ort.position.set(0,.53,.33); ort.castShadow=true; yat.add(ort);
  const ortK=new THREE.Mesh(new THREE.BoxGeometry(1.03,.36,.04),mat("#b98ab0",{roughness:1})); ortK.position.set(0,.37,1.0); yat.add(ortK);
  for(const s of [-1,1]){ const ys=new THREE.Mesh(new THREE.BoxGeometry(.4,.13,.3),mat("#ffffff",{roughness:.95})); ys.position.set(s*.22,.58,-.78); ys.rotation.x=-.25; yat.add(ys); }
  const bsl=new THREE.Mesh(new THREE.BoxGeometry(1.02,.8,.06),mat("#e2d2e6",{roughness:.9})); bsl.position.set(0,.6,-1.07); yat.add(bsl);
  const ayi=new THREE.Group(); ayi.position.set(.28,.62,-.45); ayi.rotation.y=-.5; yat.add(ayi); const am=mat("#c9a07a",{roughness:1});
  const ag=new THREE.Mesh(new THREE.SphereGeometry(.09,14,12),am); ag.scale.y=1.15; ayi.add(ag); const ak=new THREE.Mesh(new THREE.SphereGeometry(.07,14,12),am); ak.position.y=.13; ayi.add(ak);
  for(const s of [-1,1]){ const k=new THREE.Mesh(new THREE.SphereGeometry(.028,10,8),am); k.position.set(s*.05,.19,0); ayi.add(k); } const bn=new THREE.Mesh(new THREE.SphereGeometry(.026,10,8),mat("#ecd8c0")); bn.position.set(0,.12,.06); ayi.add(bn);
  // gardırop, boy aynası, kapı
  const gar=new THREE.Group(); gar.position.set(-x0-.32,0,.5); oda.add(gar); gar.userData.engel={kutu:[.32,.62]}; gar.userData.kameraEngel=true;
  const gk=new THREE.Mesh(new THREE.BoxGeometry(.6,2.1,1.24),mat("#f3ede6",{roughness:.6})); gk.position.y=1.05; gk.castShadow=true; gar.add(gk);
  for(const s of [-1,1]){ const t=new THREE.Mesh(new THREE.BoxGeometry(.015,.2,.02),mat("#c9ccd2",{metalness:.8,roughness:.3})); t.position.set(-.31,1.1,s*.06); gar.add(t); }
  const ay=new THREE.Mesh(new THREE.PlaneGeometry(.5,1.5),new THREE.MeshStandardMaterial({color:renk("#dfe6ee"),metalness:1,roughness:.04})); ay.position.set(-x0-.04,1.0,1.75); ay.rotation.y=-Math.PI/2; oda.add(ay);
  const ayc=new THREE.Mesh(new THREE.BoxGeometry(.03,1.56,.56),mat("#e9e1d6")); ayc.position.set(-x0-.02,1.0,1.75); oda.add(ayc);
  B.kapiP=new THREE.Vector3(1.35,0,-z0-.15);
  const kapi=new THREE.Mesh(new THREE.PlaneGeometry(.92,2.05),mat("#d8c2a4",{roughness:.6})); kapi.position.set(1.35,1.025,-z0-.012); kapi.rotation.y=Math.PI; oda.add(kapi); B.kapi=kapi;
  const kol=new THREE.Mesh(new THREE.BoxGeometry(.12,.025,.04),mat("#c9ccd2",{metalness:.8,roughness:.3})); kol.position.set(1.7,1.0,-z0-.04); oda.add(kol);
  // duvar rafı ve kitaplar, mantar pano ve polaroidler, saksı, halı, tavan lambası
  const raf=new THREE.Mesh(new THREE.BoxGeometry(1.0,.03,.22),ah); raf.position.set(x0+.12,1.75,z0+2.6); raf.rotation.y=Math.PI/2; oda.add(raf);
  const pano=_bkTuval(256,180,(x,w,h)=>{ x.fillStyle="#b8875a"; x.fillRect(0,0,w,h); for(let i=0;i<500;i++){ x.fillStyle=`rgba(${Math.random()<.5?"90,60,30":"220,180,130"},.25)`; x.fillRect(Math.random()*w,Math.random()*h,2,2); }
    const r=["#f6c1d4","#bfe0f6","#ffe6a8","#d8c4f2","#c8ecd0","#f9d3b8"]; for(let i=0;i<7;i++){ const px=14+(i%4)*60+rnd(-6,6), py=12+Math.floor(i/4)*84+rnd(-6,6); x.save(); x.translate(px+24,py+30); x.rotate(rnd(-.15,.15)); x.fillStyle="#fbfbf8"; x.fillRect(-24,-30,48,58); x.fillStyle=r[i%r.length]; x.fillRect(-20,-26,40,40); x.fillStyle="#e2556b"; x.beginPath(); x.arc(0,-34,3,0,7); x.fill(); x.restore(); } });
  const pn=new THREE.Mesh(new THREE.PlaneGeometry(1.05,.74),new THREE.MeshStandardMaterial({map:pano,roughness:.95})); pn.position.set(x0+.012,1.55,z0+1.15); pn.rotation.y=Math.PI/2; oda.add(pn);
  const hali=_bkTuval(256,256,(x,w,h)=>{ x.fillStyle="#f1c9d6"; x.beginPath(); x.arc(128,128,126,0,7); x.fill(); x.strokeStyle="#e4a9be"; x.lineWidth=6; for(let r=20;r<120;r+=22){ x.beginPath(); x.arc(128,128,r,0,7); x.stroke(); } for(let i=0;i<2500;i++){ x.fillStyle="rgba(255,255,255,.15)"; x.fillRect(Math.random()*w,Math.random()*h,1,1); } });
  const hm=new THREE.Mesh(new THREE.CircleGeometry(.95,40),new THREE.MeshStandardMaterial({map:hali,roughness:1,transparent:true})); hm.rotation.x=-Math.PI/2; hm.position.set(.1,.006,-.15); hm.receiveShadow=true; oda.add(hm);
  const sak=new THREE.Group(); sak.position.set(x0+.3,0,-z0-.35); oda.add(sak); sak.userData.engel=.22; const sk=new THREE.Mesh(new THREE.CylinderGeometry(.16,.12,.32,16),mat("#e9e1d6")); sk.position.y=.16; sak.add(sk);
  for(let i=0;i<9;i++){ const y=new THREE.Mesh(new THREE.SphereGeometry(.14,10,8),mat("#4f7a46",{roughness:.8})); y.scale.set(.5,1.4,.25); y.position.set(Math.cos(i*.7)*.08,.48+Math.random()*.25,Math.sin(i*.7)*.08); y.rotation.set(rnd(-.5,.5),i*.7,rnd(-.5,.5)); sak.add(y); }
  const tl=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.03,24),new THREE.MeshStandardMaterial({color:renk("#fff8ee"),emissive:renk("#fff1de"),emissiveIntensity:ops.gece?.3:1})); tl.position.set(0,H-.02,0); oda.add(tl);
  B.tavanIsik=new THREE.PointLight(renk("#fff1de"),ops.gece?.25:.9,9,1.3); B.tavanIsik.position.set(0,H-.3,0); oda.add(B.tavanIsik);
  // ip ışıklar (yatağın üstü)
  B.ipIsik=ipLambalar([new THREE.Vector3(x0+.04,2.15,z0+.3),new THREE.Vector3(x0+.04,2.2,z0+1.3),new THREE.Vector3(x0+.04,2.15,z0+2.3)],"#ffd9a0",.5,.18); oda.add(B.ipIsik);
  // yılbaşı ağacı (yalnız Aralık)
  if(ops.agac){ const a=new THREE.Group(); a.position.set(-x0-.45,0,z0+.45); oda.add(a); a.userData.engel=.3; B.agac=a;
    const sa=new THREE.Mesh(new THREE.CylinderGeometry(.13,.1,.2,14),mat("#f3ede6")); sa.position.y=.1; a.add(sa);
    for(let i=0;i<3;i++){ const k=new THREE.Mesh(new THREE.ConeGeometry(.36-i*.09,.42,14),mat("#2f5a3a",{roughness:.85})); k.position.y=.42+i*.26; k.castShadow=true; a.add(k); }
    const ren=["#e2556b","#f2c14e","#9fd0ff","#f4f1ea","#c9a8ff"]; for(let i=0;i<16;i++){ const y=.3+Math.random()*.75, r=(.36-(y-.3)*.3)*.92, an=Math.random()*6.28; const s=new THREE.Mesh(new THREE.SphereGeometry(.025,10,8),mat(ren[i%5],{metalness:.6,roughness:.25})); s.position.set(Math.cos(an)*r,y,Math.sin(an)*r); a.add(s); }
    const yil=new THREE.Mesh(new THREE.OctahedronGeometry(.06,0),new THREE.MeshStandardMaterial({color:renk("#ffe08a"),emissive:renk("#ffcf5a"),emissiveIntensity:1.4})); yil.position.y=1.22; a.add(yil);
    const ip=[]; for(let i=0;i<40;i++){ const t=i/40, y=.3+t*.85, r=(.36-t*.27)*1.0, an=t*18; ip.push(new THREE.Vector3(Math.cos(an)*r,y,Math.sin(an)*r)); }
    const pm=new THREE.Points(new THREE.BufferGeometry().setFromPoints(ip),new THREE.PointsMaterial({map:parlakDokuAl(),color:renk("#ffd9a0"),size:.12,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); a.add(pm); B.agacIsik=pm; }
  B.odaSinir=p=>{ p.x=clamp(p.x,x0+.3,-x0-.3); p.z=clamp(p.z,z0+.35,-z0-.3); p.y=0; };
  return oda;
}

/* ---------- yurt lobisi: resepsiyon, posta kutuları, koltuklar, asansör, karlı cam giriş ---------- */
function bkLobi(B){
  const W=14, D=9, H=3.2; const x0=-W/2, z0=-D/2;
  const kare=_bkTuval(256,256,(x,w,h)=>{ x.fillStyle="#d9d4cc"; x.fillRect(0,0,w,h); for(let j=0;j<4;j++) for(let i=0;i<4;i++){ const c=new THREE.Color("#e9e5de").lerp(new THREE.Color("#cfc8bd"),Math.random()*.6); x.fillStyle="#"+c.getHexString(); x.fillRect(i*64+1,j*64+1,62,62);
      x.globalAlpha=.12; for(let k=0;k<5;k++){ x.strokeStyle="#9a8f80"; x.beginPath(); x.moveTo(i*64,j*64+Math.random()*64); x.bezierCurveTo(i*64+20,j*64+Math.random()*64,i*64+40,j*64+Math.random()*64,i*64+64,j*64+Math.random()*64); x.stroke(); } x.globalAlpha=1; } });
  kare.wrapS=kare.wrapT=THREE.RepeatWrapping; kare.repeat.set(W/2.4,D/2.4);
  const zem=new THREE.Mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshStandardMaterial({map:kare,roughness:.25,metalness:.05})); zem.rotation.x=-Math.PI/2; zem.receiveShadow=true; scene.add(zem);
  const tav=new THREE.Mesh(new THREE.PlaneGeometry(W,D),mat("#f4f2ee")); tav.rotation.x=Math.PI/2; tav.position.y=H; scene.add(tav);
  const duvar=mat("#ece6dc",{roughness:.9}), ah=mat("#9a6c46",{roughness:.55});
  const dv=(w,x,z,ry,m)=>{ const p=new THREE.Mesh(new THREE.PlaneGeometry(w,H),m||duvar); p.position.set(x,H/2,z); p.rotation.y=ry; p.receiveShadow=true; scene.add(p); return p; };
  dv(W,0,z0,0); dv(D,x0,0,Math.PI/2); dv(D,-x0,0,-Math.PI/2);
  // ön cephe: cam giriş, dışarıda kar
  const cam=_bkTuval(512,256,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,"#dfe6ee"); g.addColorStop(1,"#f8fafc"); x.fillStyle=g; x.fillRect(0,0,w,h);
    x.fillStyle="#c5ccd4"; for(let i=0;i<8;i++){ const ww=rnd(40,80), hh=rnd(60,140); x.fillRect(i*66,h-hh-40,ww,hh); } x.fillStyle="#ffffff"; x.fillRect(0,h-44,w,44);
    for(let i=0;i<5;i++){ x.fillStyle="#3c4a3c"; x.beginPath(); x.moveTo(30+i*110,h-44); x.lineTo(55+i*110,h-150); x.lineTo(80+i*110,h-44); x.fill(); x.fillStyle="#fff"; x.beginPath(); x.moveTo(42+i*110,h-100); x.lineTo(55+i*110,h-150); x.lineTo(68+i*110,h-100); x.fill(); } });
  const on=new THREE.Mesh(new THREE.PlaneGeometry(W,H),new THREE.MeshBasicMaterial({map:cam,toneMapped:false})); on.position.set(0,H/2,-z0); on.rotation.y=Math.PI; scene.add(on);
  for(let i=0;i<=7;i++){ const k=new THREE.Mesh(new THREE.BoxGeometry(.08,H,.08),mat("#5a5d66",{metalness:.7,roughness:.35})); k.position.set(x0+i*2,H/2,-z0-.05); scene.add(k); }
  const kk=new THREE.Mesh(new THREE.BoxGeometry(W,.08,.08),mat("#5a5d66",{metalness:.7,roughness:.35})); kk.position.set(0,2.4,-z0-.05); scene.add(kk);
  // resepsiyon tezgâhı
  const tez=new THREE.Group(); tez.position.set(3.2,0,z0+1.7); scene.add(tez); tez.userData.engel={kutu:[1.7,.42]}; B.tezgah=tez;
  const on_=new THREE.Mesh(new THREE.BoxGeometry(3.4,1.05,.12),ah); on_.position.set(0,.525,.36); on_.castShadow=true; tez.add(on_);
  for(let i=0;i<11;i++){ const c=new THREE.Mesh(new THREE.BoxGeometry(.02,.9,.03),mat("#7a5232",{roughness:.6})); c.position.set(-1.55+i*.31,.5,.43); tez.add(c); }
  const ust=new THREE.Mesh(new THREE.BoxGeometry(3.5,.05,.85),mat("#f4f1ec",{roughness:.25})); ust.position.set(0,1.08,0); ust.castShadow=true; tez.add(ust);
  const ekr=new THREE.Mesh(new THREE.BoxGeometry(.5,.32,.03),mat("#1a1a1e",{roughness:.4})); ekr.position.set(-.6,1.32,-.12); ekr.rotation.y=.2; tez.add(ekr);
  const zil=new THREE.Mesh(new THREE.SphereGeometry(.05,14,8,0,Math.PI*2,0,Math.PI/2),mat("#d9d0b8",{metalness:1,roughness:.2})); zil.position.set(.7,1.105,.2); tez.add(zil);
  const lev=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.42),new THREE.MeshBasicMaterial({map:yaziDoku("RESEPSİYON",{w:1024,h:180,zemin:"#3a2a22",renk:"#f6ead2",font:"600 96px Georgia"})})); lev.position.set(3.2,2.55,z0+.02); scene.add(lev);
  // arkada kargo rafı ve paketler (uzun kutu: keman)
  const raf=new THREE.Group(); raf.position.set(3.4,0,z0+.35); scene.add(raf);
  for(let i=0;i<3;i++){ const r=new THREE.Mesh(new THREE.BoxGeometry(2.6,.03,.45),mat("#b9b2a8",{metalness:.3,roughness:.5})); r.position.y=.6+i*.55; raf.add(r); }
  for(let i=0;i<9;i++){ const w=rnd(.25,.45), h=rnd(.15,.3); const k=new THREE.Mesh(kutuGeo(w,h,rnd(.2,.35),.3),new THREE.MeshStandardMaterial({map:kartonDoku(),roughness:.9})); k.position.set(-1.1+(i%4)*.6+rnd(-.05,.05),.6+Math.floor(i/4)*.55+h/2+.015,rnd(-.04,.04)); raf.add(k); }
  const uzun=new THREE.Mesh(kutuGeo(.86,.16,.3,.3),new THREE.MeshStandardMaterial({map:kartonDoku(),roughness:.9})); uzun.position.set(.6,1.15+.095,0); raf.add(uzun); B.uzunKutuRaf=uzun;
  // posta kutuları
  const pk=_bkTuval(512,256,(x,w,h)=>{ x.fillStyle="#9aa0a8"; x.fillRect(0,0,w,h); for(let j=0;j<4;j++) for(let i=0;i<8;i++){ x.fillStyle="#b9bec6"; x.fillRect(i*64+3,j*64+3,58,58); x.fillStyle="#7d838c"; x.fillRect(i*64+40,j*64+26,10,12); x.fillStyle="#2a2e34"; x.font="600 14px Arial"; x.fillText(String(101+j*8+i),i*64+8,j*64+20); } });
  const pkm=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.3),new THREE.MeshStandardMaterial({map:pk,metalness:.5,roughness:.4})); pkm.position.set(x0+.02,1.35,-1.2); pkm.rotation.y=Math.PI/2; scene.add(pkm);
  // oturma köşesi
  const kol=mat("#6d7a8e",{roughness:.95}); const kos=new THREE.Group(); kos.position.set(-1.6,0,1.9); scene.add(kos);
  for(const [x,z,r] of [[0,.9,Math.PI],[-1.3,0,Math.PI/2]]){ const k=new THREE.Group(); k.position.set(x,0,z); k.rotation.y=r; kos.add(k); k.userData.engel={kutu:[.95,.42]};
    const o=new THREE.Mesh(new THREE.BoxGeometry(1.9,.42,.8),kol); o.position.y=.21; k.add(o); const s=new THREE.Mesh(new THREE.BoxGeometry(1.9,.45,.16),kol); s.position.set(0,.62,-.32); k.add(s);
    for(const sx of [-.88,.88]){ const y=new THREE.Mesh(new THREE.BoxGeometry(.14,.3,.8),kol); y.position.set(sx,.55,0); k.add(y); } }
  const sh=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.04,24),mat("#f2efe8",{roughness:.3})); sh.position.set(0,.42,0); kos.add(sh); const shA=new THREE.Mesh(new THREE.CylinderGeometry(.04,.06,.4,10),mat("#3a3a3e")); shA.position.y=.2; kos.add(shA); kos.userData.engel=.48;
  for(const [x,z] of [[x0+.5,z0+.5],[-x0-.5,-z0-.7],[x0+.5,-z0-.7]]){ const s=new THREE.Group(); s.position.set(x,0,z); scene.add(s); s.userData.engel=.3; const sp=new THREE.Mesh(new THREE.CylinderGeometry(.25,.2,.5,16),mat("#e9e1d6")); sp.position.y=.25; s.add(sp);
    for(let i=0;i<10;i++){ const y=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),mat("#3f6a3a",{roughness:.8})); y.scale.set(.45,1.5,.22); y.position.set(Math.cos(i*.63)*.12,.85+Math.random()*.4,Math.sin(i*.63)*.12); y.rotation.set(rnd(-.4,.4),i*.63,rnd(-.4,.4)); s.add(y); } }
  // duyuru panosu
  const dp=_bkTuval(256,180,(x,w,h)=>{ x.fillStyle="#b8875a"; x.fillRect(0,0,w,h); const r=["#fff4c2","#ffd6e0","#d6ecff","#e2ffd6","#ffffff"]; for(let i=0;i<9;i++){ x.fillStyle=r[i%5]; const px=8+(i%3)*82+rnd(-5,5), py=8+Math.floor(i/3)*56+rnd(-4,4); x.fillRect(px,py,70,46); x.fillStyle="rgba(40,40,60,.5)"; for(let k=0;k<4;k++) x.fillRect(px+6,py+8+k*9,rnd(30,58),3); } });
  const dpm=new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.0),new THREE.MeshStandardMaterial({map:dp,roughness:.95})); dpm.position.set(-2.8,1.6,z0+.02); scene.add(dpm);
  // asansör
  const as=new THREE.Group(); as.position.set(x0+.02,0,2.6); as.rotation.y=Math.PI/2; scene.add(as); B.asansor=as;
  const cer=new THREE.Mesh(new THREE.BoxGeometry(1.5,2.4,.06),mat("#8d939c",{metalness:.8,roughness:.3})); cer.position.set(0,1.2,.01); as.add(cer);
  const kapM=new THREE.MeshStandardMaterial({color:renk("#c3c8d0"),metalness:1,roughness:.22}); B.asKapi=[];
  for(const s of [-1,1]){ const k=new THREE.Mesh(new THREE.BoxGeometry(.6,2.2,.02),kapM); k.position.set(s*.3,1.1,.05); as.add(k); B.asKapi.push(k); }
  const ic=new THREE.Mesh(new THREE.PlaneGeometry(1.2,2.2),mat("#d9d4cc",{metalness:.5,roughness:.3})); ic.position.set(0,1.1,-.01); as.add(ic);
  const gs=new THREE.Mesh(new THREE.PlaneGeometry(.22,.12),new THREE.MeshBasicMaterial({map:yaziDoku("3",{w:128,h:72,zemin:"#101014",renk:"#ff5a4a",font:"700 52px Arial"})})); gs.position.set(0,2.5,.05); as.add(gs);
  B.asansorP=new THREE.Vector3(x0+.8,0,2.6);
  // tavan panelleri
  for(const [x,z] of [[-4,-1.5],[0,-1.5],[4,-1.5],[-4,2],[0,2],[4,2]]){ const p=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.2),new THREE.MeshBasicMaterial({color:renk("#fffaf0")})); p.rotation.x=Math.PI/2; p.position.set(x,H-.01,z); scene.add(p); }
  for(const [x,z] of [[-3,0],[3.5,-1]]){ const l=new THREE.PointLight(renk("#fff3e2"),.9,14,1.2); l.position.set(x,H-.4,z); scene.add(l); }
  B.lobiSinir=p=>{ p.x=clamp(p.x,x0+.45,-x0-.4); p.z=clamp(p.z,z0+2.25,-z0-.5); p.y=0; };
}

/* sabit kamera: mini oyun sırasında yakın çekim kalsın (sahne() bitince oyuncu kamerasına dönmesin) */
function sabitKamera(p,b){ const P=p.clone(), Bk=b.clone(); if(kameraEskiMi()){ camera.position.copy(P); camera.lookAt(Bk); camera.userData.bakis=Bk; KAMERA_ESKI=false; } Kamera.sinema=dt=>{ camera.position.lerp(P,1-Math.pow(.02,dt)); camera.lookAt(Bk); camera.userData.bakis=Bk; }; }
function kafaEkle(c,tip){ if(!c||c.userData.kafa) return c; const h=c.userData.kemik&&c.userData.kemik.Head; if(!h) return c; const k=new THREE.Object3D(); h.add(k); const A=AVATAR[tip]; k.position.set(0,.09/((A&&A.olcek)||1),0); c.userData.kafa=k; return c; }
/* ---------- bilekliği bileğe tak: bind uzayında bilek noktası ve kol yönü; çapı örgüden ölçülür ---------- */
function bilegeTak(c,yan){
  const m=c.userData.model; let sm=null; const tum=[]; m.traverse(o=>{ if(o.isSkinnedMesh&&o.skeleton){ if(!sm) sm=o; tum.push(o); } }); if(!sm) return null;
  const sk=sm.skeleton; const bul=ad=>sk.bones.findIndex(b=>b.name.replace(/^mixamorig/,"")===ad);
  const iH=bul(yan+"Hand"), iF=bul(yan+"ForeArm"); if(iH<0||iF<0) return null;
  const nok=i=>new THREE.Vector3().setFromMatrixPosition(sk.boneInverses[i].clone().multiply(sm.bindMatrix).invert());
  const pH=nok(iH), pF=nok(iF), yon=pH.clone().sub(pF).normalize();
  const merkez=pH.clone().addScaledVector(yon,-.024*(pF.distanceTo(pH)/.25));
  let R=0; const v=new THREE.Vector3(), dv=new THREE.Vector3();
  for(const o of tum){ const P=o.geometry.attributes.position; if(!P) continue; const ad=o.material&&o.material.name||"";
    if(/hair|haircut|eye|teeth|tongue|lash|brow/i.test(ad)) continue;
    for(let i=0;i<P.count;i++){ v.fromBufferAttribute(P,i); dv.copy(v).sub(merkez); const t=dv.dot(yon); if(Math.abs(t)>.012) continue; const r=dv.addScaledVector(yon,-t).length(); if(r<.08&&r>R) R=r; } }
  if(!R) R=.028; R=R*1.06+.002;
  const A=AVATAR[c.userData.kim]; const o=A?A.olcek:1;
  const b=bileklikYap(R*o); b.scale.setScalar(1/o); const sar=kemigeBagla(m,yan+"Hand",b); if(!sar) return null;
  b.position.copy(merkez); b.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),yon); b.rotateY(-Math.PI/2);
  c.userData.bileklik=b; return b;
}

/* keman çalma pozu: keman sol omuzda (çene altında), sol el sapta, sağ el yayın kurbağasında; faz 0..1 yayın kayması */
function kemanTutGuncelle(D,k,y,faz){
    D.updateMatrixWorld(true); const q=D.getWorldQuaternion(new THREE.Quaternion());
    const ileri=new THREE.Vector3(0,0,1).applyQuaternion(q), sag=new THREE.Vector3(-1,0,0).applyQuaternion(q), sol=sag.clone().negate();
    const cene=bas(D).add(new THREE.Vector3(0,-.12,0));
    const govdeP=cene.clone().addScaledVector(sol,.07).addScaledVector(ileri,.06).add(new THREE.Vector3(0,-.04,0));
    const sapYon=ileri.clone().multiplyScalar(.82).addScaledVector(sol,.5).add(new THREE.Vector3(0,.06,0)).normalize();
    const ustYon=new THREE.Vector3(0,1,0).addScaledVector(sag,.55).normalize();
    const m=new THREE.Matrix4(); const xE=new THREE.Vector3().crossVectors(sapYon,ustYon).normalize(); const zE=new THREE.Vector3().crossVectors(xE,sapYon).normalize();
    m.makeBasis(xE,sapYon,zE); k.quaternion.setFromRotationMatrix(m); k.position.copy(govdeP).addScaledVector(sapYon,-.06);
    const sapP=k.position.clone().addScaledVector(sapYon,.47).addScaledVector(zE,.01);
    D.userData.elHedef=D.userData.elHedef||{};
    D.userData.elHedef.Left={p:sapP.clone().addScaledVector(zE,-.035),F:zE.clone(),N:sag.clone(),kutup:new THREE.Vector3(0,-1,0).addScaledVector(ileri,-.3).normalize(),kivrim:[.9,1.0,.8],bas:[.5,.5,.4]};
    const kopruP=k.position.clone().addScaledVector(sapYon,.17).addScaledVector(zE,.05);
    const yayYon=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),sapYon).normalize().addScaledVector(zE,.12).normalize();
    const kayma=(faz-.5)*.5; const kurbagaP=kopruP.clone().addScaledVector(yayYon,-(.2+kayma+.25));
    const ym=new THREE.Matrix4(); const yy=zE.clone().addScaledVector(yayYon,-zE.dot(yayYon)).normalize(); ym.makeBasis(yayYon,yy,new THREE.Vector3().crossVectors(yayYon,yy)); y.quaternion.setFromRotationMatrix(ym);
    y.position.copy(kurbagaP).addScaledVector(yayYon,.36);
    D.userData.elHedef.Right={p:kurbagaP.clone().addScaledVector(yayYon,-.02).add(new THREE.Vector3(0,-.015,0)),F:yayYon.clone(),N:new THREE.Vector3(0,-1,0),kutup:new THREE.Vector3(0,-1,0).addScaledVector(sag,.6).normalize(),kivrim:[1.0,1.1,.9],bas:[.5,.6,.5]};
}
/* yay oyunu: ok yönünde sakin sürükle; çok hızlı = gıcırtı. B.yayHedef yayın konumunu sürer. */
function yayOyunu(B,notalar,ops={}){
  const D=B.kar; gorev((ops.baslik||"İlk notalar")+" · 0 / "+notalar.length); Ses.kis(true);
  const ui=el(`<div class="sim bk-yay-ui"><div class="baslik">Yayı çek</div><div class="ipucu">Okun yönünde, sakin ve düz sürükle</div><div class="bk-yay"><span class="ok"></span><i></i></div></div>`); katman.appendChild(ui);
  const alan=ui.querySelector(".bk-yay"), ok=ui.querySelector(".ok"), ip=ui.querySelector(".ipucu"), iz=ui.querySelector(".bk-yay i");
  let n=0, gicirSay=0;
  return new Promise(r=>{
    let x0=null,t0=0, yon_=1; const goster=()=>{ yon_=n%2?-1:1; ok.textContent=yon_>0?"→  aşağı yay":"←  yukarı yay"; ok.className="ok "+(yon_>0?"sag":"sol"); }; goster();
    alan.addEventListener("pointerdown",e=>{ x0=e.clientX; t0=performance.now(); try{ alan.setPointerCapture(e.pointerId); }catch(_){} });
    alan.addEventListener("pointermove",e=>{ if(x0===null) return; const w=alan.clientWidth; const d=(e.clientX-x0)/w; B.yayHedef=clamp(.5+d*yon_,0,1); iz.style.width=Math.abs(d*100)+"%"; iz.style.left=d<0?(50+d*100)+"%":"50%"; });
    alan.addEventListener("pointerup",e=>{ if(x0===null||n>=notalar.length){ x0=null; return; } const w=alan.clientWidth, d=(e.clientX-x0)/w, sn=(performance.now()-t0)/1000; x0=null; iz.style.width="0";
      if(Math.sign(d)!==yon_||Math.abs(d)<.25){ ip.textContent="Yay ok yönünde, biraz daha uzun çekilmeli"; return; }
      const hiz=Math.abs(d)/Math.max(.05,sn); const ilk=ops.acemi&&n===0&&gicirSay===0;
      if(hiz>2.4||ilk){ gicirSay++; Ses.keman(notalar[n],.45,.13,1); D.userData.gulumse=.3; ip.textContent=ilk?"Gıııık 😅 İlk ses böyle olur":"Çok hızlı! Gıcırdadı kdkdkd"; D.userData.konus=1; bekle(1100).then(()=>{ D.userData.konus=0; }); return; }
      Ses.keman(notalar[n],clamp(sn,.45,1.3),.17); D.userData.gulumse=1; n++; gorev(`${ops.baslik||"İlk notalar"} · ${n} / ${notalar.length}`); ip.textContent=["Güzel!","Bir daha","Oluyor!","Melodi gibi 😍","Devam","Az kaldı","Çok güzel","Son nota"][Math.min(7,n-1)];
      B.yayHedef=.5; if(n>=notalar.length){ bekle(900).then(()=>{ ui.remove(); gorev(null); Ses.kis(false); r(); }); return; } goster(); });
  });
}
/* ================= BÖLÜM NESNESİ ================= */
const BK={
  id:"bileklik", no:4, ad:"Bileklik ve Keman", tarih:"Aralık 2024 · Ocak 2025", alt:"Kargodan çıkan bileklik, simli siyah keman",
  async kur(){ await this.odaKur("aralik"); },
  async odaKur(evre){
    this.evre=evre; this.faz="oda"; this.t=0; ETK=[]; ICSAHNE=null; this.serbest=false; this.tw=[]; this.lobi=false; this.agac=null; this.agacIsik=null;
    this.calisPozu=false; this.elKeman=this.elYay=null; this.kemanParilti=0; this.isikCos=0; this._as=0;
    const gece=evre==="gece", gun=evre==="ocak";
    const gy=new THREE.Vector3(.3,.6,-1).normalize();
    sahneKur({sis:"#2a2430",sisYakin:30,sisUzak:120,ust:gun?"#c9d2dc":"#3a4a7e",ufuk:gun?"#e6eaee":"#e9a07a",alt:"#2a2430",gunesYon:gy,isikYon:gy,gunesRenk:"#ffe0c0",isik:gun?"#e9eef6":"#ffcfa0",isikGuc:gece?.08:gun?.55:.45,zemin:"#5a4a52",hemi:gece?.32:gun?.62:.5,dolgu:gece?.12:.3,dolguRenk:gece?"#8a9cff":"#ffe6d0"});
    bkOda(this,{manzara:gece?"gece":gun?"gun":"aksam",gece,agac:evre!=="ocak"});
    await kiyafetDokulari([]);
    this.kar=karakter("kardelen","ev"); this.oyuncu=this.kar; scene.add(this.kar);
    KONUSANLAR={kardelen:this.kar};
    const D=this.kar;
    if(evre==="aralik"){ D.position.set(-.2,0,1.2); D.rotation.y=Math.PI*.9; this.kargoKur(); }
    else if(evre==="gece"){ D.position.set(-1.25,0,-.4); D.rotation.y=Math.PI/2; D.userData.otur=1; D.userData.oturY=.42; if(!D.userData.bileklik) bilegeTak(D,"Right"); }
    else { D.position.set(-1.25,0,-1.25); D.rotation.y=Math.PI/2; D.userData.otur=1; D.userData.oturY=.42; bilegeTak(D,"Right"); }
    this.tel=telefonYap(); this.tel.userData.telefon=true; this.tel.visible=false; scene.add(this.tel);
    Kamera.sinema=null; Kamera.aci=.35; Kamera.mesafe=2.9; Kamera.yukseklik=1.55; Kamera.hedef.copy(D.position); Kamera.poz.set(D.position.x+1,2.2,D.position.z+2.8);
    Ses.ton=gece?"gece":"sicak";
  },
  kargoKur(){
    const g=new THREE.Group(); g.position.set(.45+.1,.76,-2.8+.42+.02); scene.add(g); this.kargo=g;
    const W=.34,H=.13,Dp=.26; const km=new THREE.MeshStandardMaterial({map:kartonDoku(),roughness:.92});
    const gov=new THREE.Mesh(kutuGeo(W,H,Dp,.3),km); gov.position.y=H/2; gov.castShadow=true; g.add(gov);
    const ic=new THREE.Mesh(new THREE.BoxGeometry(W*.96,.004,Dp*.96),mat("#8a6440",{roughness:1})); ic.position.y=.02; g.add(ic);
    this.kapaklar=[]; for(const [x,z,ry,w,d] of [[0,-Dp/2,0,W,Dp/2],[0,Dp/2,Math.PI,W,Dp/2],[-W/2,0,Math.PI/2,Dp,W/2],[W/2,0,-Math.PI/2,Dp,W/2]]){
      const p=new THREE.Group(); p.position.set(x,H,z); p.rotation.y=ry; g.add(p); const h=new THREE.Group(); p.add(h); const k=new THREE.Mesh(kutuGeo(w*.99,.004,d,.3),km); k.position.set(0,.002+(this.kapaklar.length<2?.001:0),d/2); h.add(k); this.kapaklar.push(h); }
    const bant=new THREE.Mesh(new THREE.BoxGeometry(W+.004,.003,.055),mat("#d9c7a0",{roughness:.35,transparent:true,opacity:.85})); bant.position.set(0,H+.0045,0); g.add(bant); this.bant=bant;
    // bant iki kapağın birleştiği çizgi boyunca (soldan sağa): ekrandaki makas da soldan sağa gider
    const kesik=new THREE.Mesh(new THREE.BoxGeometry(1,.0035,.004),mat("#3a2a1a")); kesik.position.set(-W/2,H+.0055,0); kesik.scale.x=.001; g.add(kesik); this.kesik=kesik; this.kargoW=W;
    const et=new THREE.Mesh(new THREE.PlaneGeometry(.12,.07),new THREE.MeshStandardMaterial({map:_bkTuval(256,150,(x,w,h)=>{ x.fillStyle="#fbfbf8"; x.fillRect(0,0,w,h); x.fillStyle="#1a1a1a"; x.font="700 20px Arial"; x.fillText("KARGO",12,30); x.font="16px Arial"; x.fillText("Alıcı: Kardelen",12,62); x.fillText("Kırılabilir · Hediye",12,88); for(let i=0;i<34;i++) x.fillRect(12+i*6,104,i%3?2:4,34); }),roughness:.7})); et.position.set(.08,H+.0035,.05); et.rotation.x=-Math.PI/2; et.rotation.z=.15; g.add(et); this.etiket=et;
    // içerik: iki mücevher kutusu, kırışık kâğıt
    this.bKutu=mucevherKutusu(.1,.04,.1); this.bKutu.position.set(-.07,.02,0); g.add(this.bKutu);
    this.cKutu=mucevherKutusu(.07,.035,.07); this.cKutu.position.set(.085,.02,-.03); g.add(this.cKutu);
    const kag=[]; for(let i=0;i<70;i++) kag.push(new THREE.Vector3(rnd(-W*.45,W*.45),rnd(.03,.09),rnd(-Dp*.45,Dp*.45)));
    this.kagit=new THREE.InstancedMesh(new THREE.BoxGeometry(.04,.003,.008),mat("#f2c2d0",{roughness:1}),kag.length); const M=new THREE.Matrix4(), q=new THREE.Quaternion();
    kag.forEach((p,i)=>{ q.setFromEuler(new THREE.Euler(rnd(0,3),rnd(0,3),rnd(0,3))); M.compose(p,q,new THREE.Vector3(1,1,1)); this.kagit.setMatrixAt(i,M); }); g.add(this.kagit);
    // takılar (kutuların içinde, gizli)
    this.masaBileklik=bileklikYap(.032); this.masaBileklik.position.set(0,.03,0); this.masaBileklik.visible=false; this.bKutu.add(this.masaBileklik);
    this.charmlar=[charmYap("kalp"),charmYap("tas")]; this.charmlar.forEach((c,i)=>{ c.rotation.x=-Math.PI/2; c.position.set(i?.014:-.014,.028,0); c.visible=false; this.cKutu.add(c); });
    this.kadife=new THREE.Mesh(new THREE.BoxGeometry(.06,.006,.06),mat("#5a3a5a",{roughness:1})); this.kadife.position.y=.03; this.cKutu.add(this.kadife);
    this.bez=bezYap(); this.bez.position.set(.0,.03,.075); this.bez.visible=false; g.add(this.bez);
  },
  // kısa animasyonlar
  tween(sure,f){ return new Promise(r=>this.tw.push({t:0,sure,f,r})); },
  async basla(){
    katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle();
    const D=this.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(1.6,2.3,2.4),new THREE.Vector3(.2,1.0,-2.2));
      await kameraNoktasi(s=>new THREE.Vector3(1.6-s*.25,2.3-s*.08,2.4-s*.12),new THREE.Vector3(.2,1.0,-2.2),4.5);
      baslikKarti(this.ad,[this.tarih,"Bölüm "+this.no]);
      await kameraNoktasi(bas(D).add(new THREE.Vector3(.6,.05,-1.1)),bas(D),2.6);
      await anlat("31 Aralık 2024. Yılbaşına saatler kala ona bir kargo gönderdim.",3000);
      await anlat("Kargoyu yurdun resepsiyonuna bırakmışlar. Ben uzaktaydım; telefonun başında heyecandan yerimde duramıyordum.",3600);
      D.userData.telefon=2; this.tel.visible=true; eldeTut(D,this.tel,"S");
      const dm=DM.ac("Kaan 💙","çevrimiçi"); dm.zaman("31 Aralık · öğleden sonra");
      await dm.yaz("o","Kargo teslim edilmiş görünüyor, resepsiyona bırakmışlar galiba"); await dm.yaz("ben","Az önce getirdiler 😳"); await dm.yaz("ben","Heyecandan yerimde duramıyorum");
      await dm.yaz("o","Hadi aç, ben de merak ediyorum"); await bekle(500); DM.kapat();
      D.userData.telefon=0; D.userData.eldeki=null; this.tel.visible=false;
    });
    gorev("Masadaki kargoyu aç");
    this.serbest=true; gizliKalpler(this,[[1.65,1.0,2.15,0]]);
    await etkBekle(this.kargo,"Kargoyu aç",{mesafe:1.35,isaretY:.35});
    this.serbest=false; gorev(null);
    await this.kutuAc();
    await this.charmDene();
    await this.kilitTak();
    await this.parlat();
    await this.yilbasiGecesi();
    await this.kemanGunu();
  },
  async masayaOtur(){ const D=this.kar; await yuruHedef(D,new THREE.Vector3(.4,0,-1.55),1.1); D.rotation.y=Math.PI; D.userData.otur=1; D.userData.oturY=.47; D.position.z=-1.72; },
  kargoBakis(ust=.32,geri=.36){ const k=this.kargo.position; if(camera.aspect<1) ust*=1.6; /* dikey ekranda kutu ve bant baştan sona karede */ return [new THREE.Vector3(k.x+.05,k.y+ust,k.z+geri),k.clone().add(new THREE.Vector3(0,.05,0))]; },
  async kutuAc(){
    const D=this.kar;
    await sahne(async()=>{ await this.masayaOtur(); const [p,b]=this.kargoBakis(); await kameraNoktasi(p,b,1.4); });
    sabitKamera(...this.kargoBakis());
    // 1) bandı kes
    await this.bantKes();
    // 2) kapaklar açılır, kâğıtlar
    Ses.efekt("vuru",.4);
    await this.tween(.9,t=>{ const e=1-Math.pow(1-t,3); this.kapaklar.forEach((h,i)=>{ h.rotation.x=-e*(i<2?3.08:3.0); }); this.bant.visible=t<.2; this.kesik.visible=t<.2; this.etiket.visible=t<.5; });
    await sahne(async()=>{ const [p,b]=this.kargoBakis(.34,.12); await kameraNoktasi(p,b,1.0);
      await konus("kardelen",["Ayy kutu ne kadar tatlı","İki tane kutu var"],{kamera:false,gul:1}); });
    sabitKamera(...this.kargoBakis(.34,.12));
    // 3) bileklik kutusu
    await this.qte("💎 Büyük kutuyu aç");
    const bk=this.bKutu.userData.kapak; await this.tween(.8,t=>{ bk.rotation.x=-(1-Math.pow(1-t,3))*1.9; }); this.masaBileklik.visible=true; Ses.efekt("parilti");
    await sahne(async()=>{ const p=new THREE.Vector3(); this.bKutu.getWorldPosition(p); await kameraNoktasi(p.clone().add(new THREE.Vector3(.05,.2,.18)),p.clone().add(new THREE.Vector3(0,.03,0)),1.1);
      D.userData.gulumse=1; await konus("kardelen",["Ayyyy","Bileklik 😍","Çok zarif bu"],{kamera:false,gul:1}); });
    { const p=new THREE.Vector3(); this.cKutu.getWorldPosition(p); sabitKamera(p.clone().add(new THREE.Vector3(.03,.17,.14)),p.clone().add(new THREE.Vector3(0,.03,0))); }
    // 4) charm kutusu: boş mu?
    await this.qte("🎀 Küçük kutuyu aç");
    const ck=this.cKutu.userData.kapak; await this.tween(.8,t=>{ ck.rotation.x=-(1-Math.pow(1-t,3))*1.9; });
    await sahne(async()=>{ const p=new THREE.Vector3(); this.cKutu.getWorldPosition(p); await kameraNoktasi(p.clone().add(new THREE.Vector3(.03,.17,.14)),p.clone().add(new THREE.Vector3(0,.03,0)),1.0);
      await konus("kardelen",["Bu kutu boş mu","Ne koymuş bunun içine"],{kamera:false,gul:.2});
      D.userData.telefon=2; this.tel.visible=true; eldeTut(D,this.tel,"S");
      const dm=DM.ac("Kaan 💙","çevrimiçi"); dm.zaman("Biraz sonra");
      await dm.yaz("ben","Bileklik çok güzel 😍"); await dm.yaz("ben","Ama küçük kutunun içi boş gibi?");
      await dm.yaz("o","Boş olamaz ki"); await dm.yaz("o","İçinde iki charm olacaktı, bir de temizleme bezi");
      await dm.yaz("ben","Dur bakıyorum"); await bekle(400); DM.kapat(); D.userData.telefon=0; D.userData.eldeki=null; this.tel.visible=false; });
    { const p=new THREE.Vector3(); this.cKutu.getWorldPosition(p); sabitKamera(p.clone().add(new THREE.Vector3(.03,.17,.14)),p.clone().add(new THREE.Vector3(0,.03,0))); }
    await this.qte("👆 Kadifeyi kaldır");
    await this.tween(.6,t=>{ this.kadife.position.y=.03+t*.05; this.kadife.rotation.z=t*1.2; this.kadife.position.x=t*.07; }); this.kadife.visible=false;
    this.charmlar.forEach(c=>c.visible=true); this.bez.visible=true; Ses.efekt("parilti");
    await sahne(async()=>{ await konus("kardelen",["Aaa buradaymış","Kadifenin altına saklanmışlar kdkdkd","Bir de bez var"],{kamera:false,gul:1}); });
  },
  async charmDene(){
    const D=this.kar;
    await sahne(async()=>{ const p=new THREE.Vector3(); this.bKutu.getWorldPosition(p); await kameraNoktasi(p.clone().add(new THREE.Vector3(.06,.2,.16)),p.clone().add(new THREE.Vector3(.04,.03,0)),1.0); });
    { const p=new THREE.Vector3(); this.bKutu.getWorldPosition(p); sabitKamera(p.clone().add(new THREE.Vector3(.06,.2,.16)),p.clone().add(new THREE.Vector3(.04,.03,0))); }
    gorev("Charmları dene · 0 / 2");
    const hedefP=new THREE.Vector3(); this.masaBileklik.getWorldPosition(hedefP); hedefP.x+=.032;
    for(let i=0;i<2;i++){
      await this.qte(i?"💜 Taşlı charmı tak":"💗 Kalp charmı tak");
      const c=this.charmlar[i]; const bas_=new THREE.Vector3(); c.getWorldPosition(bas_); scene.attach(c);
      const ust=hedefP.clone().add(new THREE.Vector3(0,.035,0));
      await this.tween(.7,t=>{ const e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2; c.position.lerpVectors(bas_,ust,e); c.position.y+=Math.sin(t*Math.PI)*.03; });
      await this.tween(.35,t=>{ c.position.y=ust.y-t*.03; });
      Ses.efekt("vuru",.35);
      await this.tween(.55,t=>{ c.position.x=hedefP.x+t*.03; c.position.y=ust.y-.03-Math.sin(t*Math.PI)*-.012+t*.0; c.rotation.z=t*.8; });
      await konus("kardelen",i?["Bu da olmuyor","Halkaya girmiyor ki"]:["Hmm","Takılmıyor bu"],{kamera:false,gul:.3,sure:1.6});
      gorev(`Charmları dene · ${i+1} / 2`);
    }
    gorev(null);
    await sahne(async()=>{
      D.userData.telefon=2; this.tel.visible=true; eldeTut(D,this.tel,"S");
      await kameraNoktasi(ondenNokta(D,1.1,-.25,-.1),bas(D).add(new THREE.Vector3(0,-.15,0)),1.0);
      const dm=DM.ac("Kaan 💙","çevrimiçi");
      await dm.yaz("ben","Aşkım bu charmlar bu bilekliğe olmuyor 😄"); await dm.yaz("ben","Başka model zincire takılıyormuş bunlar");
      await dm.yaz("o","Ben de takılır sanmıştım 🙈"); await dm.yaz("o","Öbür modeli alsaydım takılırmış; bunu daha şık diye seçmiştim");
      const c=await dm.sec(["Olsun, bu da çok zarif. Hepsini ayrı ayrı sevdim","Senin seçtiğin daha güzel bence"]);
      await dm.yaz("ben",c?"Senin seçtiğin daha güzel bence":"Olsun, bu da çok zarif. Hepsini ayrı ayrı sevdim");
      await dm.yaz("o","Charmlara da bir bileklik alırız, haberin olsun"); await dm.yaz("o","Hadi tak da göreyim");
      await bekle(400); DM.kapat(); D.userData.telefon=0; D.userData.eldeki=null; this.tel.visible=false;
    });
  },
  async kilitTak(){
    const D=this.kar;
    // bileklik bileğe: önce kutudan alınır
    this.masaBileklik.visible=false; const b=bilegeTak(D,"Right"); if(b) b.visible=true;
    D.userData.kolS.rotation.set(-1.25,0,.35); D.userData.otur=1;
    await sahne(async()=>{ await bekle(400); const p=new THREE.Vector3(); (b||D.userData.kafa).getWorldPosition(p); await kameraNoktasi(p.clone().add(new THREE.Vector3(-.05,.12,.32)),p,1.1);
      await konus("kardelen",["Tek elle takmak ne zor ya","Kilidi tutturamıyorum"],{kamera:false,gul:.4}); });
    { const p=new THREE.Vector3(); (b||D.userData.kafa).getWorldPosition(p); sabitKamera(p.clone().add(new THREE.Vector3(-.05,.12,.32)),p); }
    gorev("Kilidi tuttur");
    const ui=el(`<div class="sim"><div class="baslik">Bileklik kilidi</div><div class="ipucu">Halka kancanın hizasına gelince dokun</div>
      <div class="olcek" style="align-self:center;width:100%"><div class="bar"><span class="hedef" style="left:44%;width:12%"></span><i style="width:0;left:0;background:#fff;width:8px;border-radius:4px"></i></div></div>
      <div class="satir"><button class="tut">🔗 Tuttur</button></div></div>`); katman.appendChild(ui);
    const isaret=ui.querySelector(".bar i"), ip=ui.querySelector(".ipucu"); let x=0, yon_=1, hiz=.62, deneme=0, bitti=false;
    const dongu=()=>{ if(bitti||!ui.isConnected) return; x+=yon_*hiz*.016; if(x>1){ x=1; yon_=-1; } if(x<0){ x=0; yon_=1; } isaret.style.left=(x*100-1)+"%"; requestAnimationFrame(dongu); }; dongu();
    await new Promise(r=>{ ui.querySelector(".tut").onclick=()=>{ if(bitti) return; deneme++;
      if(x>.43&&x<.57||deneme>=5){ bitti=true; Ses.efekt("vuru",.5); Ses.efekt("parilti"); ip.textContent="Tık! Takıldı 🥹"; bekle(900).then(r); }
      else { Ses.efekt("vuru",.25); ip.textContent=["Kaçtı 😤","Az kaldı…","Kanca yine kaçtı kdkdkd","Bir daha"][Math.min(3,deneme-1)]; hiz=Math.max(.38,hiz-.06); } }; });
    ui.remove(); gorev(null);
    await sahne(async()=>{ const p=new THREE.Vector3(); (b||D.userData.kafa).getWorldPosition(p); await kameraNoktasi(p.clone().add(new THREE.Vector3(.02,.08,.22)),p,.9);
      await konus("kardelen",["Tam bileğime göre","Nereden bildi ölçümü bu"],{kamera:false,gul:1});
      D.userData.telefon=2; this.tel.visible=true; eldeTut(D,this.tel,"D");
      const dm=DM.ac("Kaan 💙","çevrimiçi");
      await dm.yaz("ben","Taktım! Bileğime tam oldu"); await dm.yaz("ben","Ölçümü nasıl tutturdun?");
      await dm.yaz("o","En küçük bedenini seçtim"); await dm.yaz("o","Minnak bileğine göre 😄");
      await dm.yaz("ben","😂"); await dm.yaz("o","Haberin olsun, duşta çıkar onu; kararmasın");
      const c=await dm.sec(["Peki premses 😄","Gözüm gibi bakacağım"]);
      await dm.yaz("ben",c?"Gözüm gibi bakacağım":"Peki premses 😄");
      await bekle(400); DM.kapat(); D.userData.telefon=0; D.userData.eldeki=null; this.tel.visible=false; });
  },
  async parlat(){
    const D=this.kar, b=D.userData.bileklik;
    // kamera yönleri onun baktığı yöne göre (önceden dünya eksenine göreydi: yana baktığı için kamera kolunun/gövdesinin içine giriyordu)
    const f=D.getWorldDirection(new THREE.Vector3()).setY(0).normalize(), sg=new THREE.Vector3(-f.z,0,f.x), yk=new THREE.Vector3(0,1,0);
    // kol önce kalkar (yarım saniye), sonra kamera bileğe yaklaşır: önceden kamera kolun eski (aşağıdaki) yerine bakıp omzu gösteriyordu
    D.userData.kolS.rotation.set(-1.25,0,.35); await bekle(550); { const p=new THREE.Vector3(); (b||D.userData.kafa).getWorldPosition(p); sabitKamera(p.clone().addScaledVector(f,.3).addScaledVector(yk,.08).addScaledVector(sg,.06),p); }
    gorev("Temizleme beziyle parlat");
    const ui=el(`<div class="sim"><div class="baslik">Temizleme bezi</div><div class="ipucu">Parmağını sağa sola sürterek bilekliği parlat</div>
      <div class="bk-ovma"><span>✨ Sürt</span></div><div class="olcek" style="align-self:center;width:100%"><div class="bar"><i style="width:0%"></i></div></div></div>`); katman.appendChild(ui);
    const pad=ui.querySelector(".bk-ovma"), bar=ui.querySelector(".bar i"); let v=0, son=null;
    await new Promise(r=>{ const hareket=e=>{ if(son!==null){ const d=Math.abs(e.clientX-son); v=Math.min(1,v+d/2600); bar.style.width=(v*100)+"%"; if(b){ b.userData.parilti.scale.setScalar(.04+v*.1); b.userData.mat.roughness=.3-v*.22; } if(Math.random()<.08) Ses.efekt("parilti",.15); if(v>=1){ pad.onpointermove=null; r(); } } son=e.clientX; };
      pad.addEventListener("pointerdown",e=>{ son=e.clientX; try{ pad.setPointerCapture(e.pointerId); }catch(_){} }); pad.addEventListener("pointermove",e=>{ if(e.buttons||e.pointerType==="touch") hareket(e); }); pad.addEventListener("pointerup",()=>{ son=null; }); });
    ui.remove(); gorev(null); Ses.efekt("parilti");
    await sahne(async()=>{ D.userData.gulumse=1; const p=new THREE.Vector3(); (b||D.userData.kafa).getWorldPosition(p);
      // hatıra karesi: önde bileklik, arkasında gülümseyen yüzü (ikisi de kadrajda); objektife bakar
      const h=bas(D), hedef=p.clone().lerp(h,.38), kam=hedef.clone().addScaledVector(f,.78).addScaledVector(sg,-.12).addScaledVector(yk,.05);
      const bak0=D.userData.bakNokta; D.userData.bakNokta=kam.clone();
      await kameraNoktasi(kam,hedef,1.0); await bekle(350);
      await hatiraFoto("Bileklik · 31 Aralık 2024",{kendi:true}); await bekle(1400);
      D.userData.bakNokta=bak0; D.userData.kolS.rotation.set(0,0,0); });
  },
  async yilbasiGecesi(){
    await gecis(async()=>{ katmanTemizle(); await this.odaKur("gece"); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    const D=this.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(1.3,1.9,1.8),bas(D));
      await anlat("Gece yarısına beş kala. Dışarıda kar, odada ip ışıklar.",3000);
      D.userData.telefon=2; this.tel.visible=true; eldeTut(D,this.tel,"S");
      await konus("kardelen",["Dışarıda çıt yok","Ama bileklik ışıl ışıl"],{gul:.8,uzak:1.5});
      D.userData.telefon=0; D.userData.eldeki=null; this.tel.visible=false;
    });
    gorev("Pencereye git");
    this.serbest=true; D.userData.otur=0; gizliKalpler(this,[[1.65,1.0,2.15,0]]); // ilk serbest anda kaçırıldıysa odada yine bulunabilsin
    await etkBekle(this.pencere,"Yeni yılı karşıla",{mesafe:1.7,isaretY:-.5});
    this.serbest=false; gorev(null);
    await sahne(async()=>{
      await yuruHedef(D,new THREE.Vector3(1.05,0,-1.55),1); D.rotation.y=Math.PI+.35;
      await kameraNoktasi(new THREE.Vector3(1.1,1.5,-.7),new THREE.Vector3(.4,1.55,-2.8),1.4);
      await this.geriSayim();
      D.userData.telefon=2; this.tel.visible=true; eldeTut(D,this.tel,"S");
      await kameraNoktasi(ondenNokta(D,1.1,-.3,-.1),bas(D).add(new THREE.Vector3(0,-.15,0)),1.0);
      const dm=DM.ac("Kaan 💙","çevrimiçi"); dm.zaman("1 Ocak 2025 · 00:00");
      await dm.yaz("o","Mutlu yıllar minnakım"); await dm.yaz("o","Yeni yılda da hep yanımda ol");
      const c=await dm.sec(["Seninle her yıl daha güzel 💕","Seninle yeni bir yıl, kocam 💋"]);
      await dm.yaz("ben",c?"Seninle yeni bir yıl, kocam 💋":"Seninle her yıl daha güzel 💕");
      await dm.yaz("o","Burada gökyüzü fişek dolu");
      await dmResim("o",this.fisekResim());
      await dm.yaz("ben","Bizde çıt yok 😄 Sadece kar yağıyor"); await dm.yaz("o","Bir yıl daha geçti, inanabiliyor musun 😄"); await dm.yaz("ben","Hepsini seninle geçireceğim");
      await bekle(500); DM.kapat(); D.userData.telefon=0; D.userData.eldeki=null; this.tel.visible=false;
      await this.buguluCam();
      await anlat("2025'e uzaktan ama aynı anda girdik.",2600);
    });
  },
  // yılbaşı gecesi: soğuk cam buğulanır, parmakla kalp çizilir (albüme bir kare)
  async buguluCam(){
    const D=this.kar, pen=this.pencere; if(!pen) return;
    const pw=new THREE.Vector3(); pen.getWorldPosition(pw); const m=pw.clone().add(new THREE.Vector3(.39,-.06,.009));
    // nefesin bıraktığı buğu: sağ camın içinde, kenarlara doğru yumuşakça kaybolan oval bir leke (köşeli dikdörtgen değil)
    const c=document.createElement("canvas"); c.width=256; c.height=356; const x=c.getContext("2d");
    x.save(); x.translate(128,178); x.scale(1,178/128); const g=x.createRadialGradient(0,0,0,0,0,128); g.addColorStop(0,"rgba(232,238,246,.68)"); g.addColorStop(.62,"rgba(232,238,246,.6)"); g.addColorStop(1,"rgba(232,238,246,0)"); x.fillStyle=g; x.fillRect(-128,-128,256,256); x.restore();
    for(let i=0;i<1100;i++){ const a=Math.random()*7, r=Math.sqrt(Math.random())*.92; x.fillStyle=`rgba(255,255,255,${Math.random()*.25*(1-r*r)})`; x.beginPath(); x.arc(128+Math.cos(a)*r*128,178+Math.sin(a)*r*178,Math.random()*2.2,0,7); x.fill(); }
    const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding;
    const bugu=new THREE.Mesh(new THREE.PlaneGeometry(.72,1.0),new THREE.MeshBasicMaterial({map:t,transparent:true,opacity:0,depthWrite:false,toneMapped:false})); bugu.position.copy(pw).add(new THREE.Vector3(.385,-.06,.009)); scene.add(bugu);
    await konus("kardelen",["Cam buz gibi","Dur bir şey yapacağım"],{gul:1,uzak:1.2});
    await kameraNoktasi(m.clone().add(new THREE.Vector3(-.12,.02,.95)),m.clone(),1.0);
    const q=el(`<div class="qte"><button class="btn qte-btn">🫧 Cama hohla</button></div>`); katman.appendChild(q);
    await new Promise(r=>{ q.querySelector("button").onclick=r; }); q.remove();
    await this.tween(.7,k=>{ bugu.material.opacity=k; }); await bekle(300);
    // kalp: parmak izi gibi buğuyu siler
    const yol=[]; for(let i=0;i<=60;i++){ const a=i/60*Math.PI*2; yol.push([130+64*Math.pow(Math.sin(a),3),172-(51.6*Math.cos(a)-20.3*Math.cos(2*a)-8.3*Math.cos(3*a)-3.7*Math.cos(4*a))]); }
    x.globalCompositeOperation="destination-out"; x.lineCap=x.lineJoin="round"; x.lineWidth=12; let son=0;
    await this.tween(1.8,k=>{ const n=Math.floor(k*60); if(n<=son) return; x.beginPath(); x.moveTo(...yol[son]); for(let i=son+1;i<=n;i++) x.lineTo(...yol[i]); x.stroke(); son=n; t.needsUpdate=true; if(n%12===0) Ses.efekt("vuru",.05); });
    x.globalCompositeOperation="source-over"; Ses.efekt("parilti");
    await hatiraFoto("Buğulu cam · 1 Ocak 2025",{kendi:true}); await bekle(1200);
    await konus("kardelen",["Bunu ona göstermeliyim kdkdkd"],{gul:1,kamera:false});
    await this.tween(1.2,k=>{ bugu.material.opacity=1-k; }); scene.remove(bugu); t.dispose(); bugu.geometry.dispose(); bugu.material.dispose();
  },
  fisekResim(){ const c=document.createElement("canvas"); c.width=300; c.height=220; const x=c.getContext("2d"); const g=x.createLinearGradient(0,0,0,220); g.addColorStop(0,"#05071a"); g.addColorStop(1,"#1a2048"); x.fillStyle=g; x.fillRect(0,0,300,220);
    for(let i=0;i<5;i++){ const cx=40+i*55+rnd(-10,10), cy=60+rnd(-20,30), r=rnd(18,34), h=rnd(0,360); for(let k=0;k<26;k++){ const a=k/26*6.283; x.strokeStyle=`hsla(${h},95%,70%,.9)`; x.lineWidth=1.6; x.beginPath(); x.moveTo(cx+Math.cos(a)*r*.25,cy+Math.sin(a)*r*.25); x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); x.stroke(); } }
    x.fillStyle="#0a0a12"; for(let i=0;i<9;i++){ const h=rnd(30,70); x.fillRect(i*34,220-h,rnd(24,32),h); } x.fillStyle="#ffcf7a"; for(let i=0;i<40;i++) x.fillRect(rnd(0,300),rnd(170,215),2,3); return c.toDataURL("image/jpeg",.85); },
  async geriSayim(){
    const d=el(`<div class="bk-sayac"><b></b><small>2025</small></div>`); katman.appendChild(d); const b=d.querySelector("b");
    for(let i=10;i>=1;i--){ b.textContent=i; d.classList.remove("vur"); void d.offsetWidth; d.classList.add("vur"); Ses.efekt("vuru",.2); await bekle(560); }
    b.textContent="Mutlu yıllar"; d.classList.add("son"); Ses.efekt("buyuk"); if(this.ipIsik) this.isikCos=1;
    await bekle(2200); d.remove();
  },
  // ---------------- 18 OCAK 2025: KEMAN ----------------
  async kemanGunu(){
    await gecis(async()=>{ katmanTemizle(); await this.odaKur("ocak"); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    const D=this.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(1.2,1.8,1.6),bas(D));
      baslikKarti("18 Ocak 2025",["Bileklik ve Keman","Simli siyah"]); await bekle(1200);
      await anlat("Öğleden sonra iki. Daha yeni uyanmıştı. Ben de uzaktaydım; kargonun durumunu yenileyip duruyordum.",3600);
      D.userData.telefon=2; this.tel.visible=true; eldeTut(D,this.tel,"S");
      await kameraNoktasi(ondenNokta(D,1.1,-.3,-.1),bas(D).add(new THREE.Vector3(0,-.15,0)),1.2);
      const dm=DM.ac("Kaan 💙","çevrimiçi"); dm.zaman("18 Ocak · öğlen");
      await dm.yaz("o","Günaydın civcivim"); await dm.yaz("o","Kargo teslim edilmiş görünüyor, ulaştı mı?");
      await dm.yaz("ben","Ben daha yeni uyandım 🙈"); await dm.yaz("o","O zaman aşağıda, resepsiyonda bekliyordur");
      await bekle(400); DM.kapat(); D.userData.telefon=0; D.userData.eldeki=null; this.tel.visible=false;
      await konus("kardelen",["Ne kargosu ki bu","Kocaman bir şey mi yoksa"],{gul:.6,uzak:1.4});
    });
    gorev("Resepsiyona in");
    this.serbest=true; D.userData.otur=0; gizliKalpler(this,[[1.65,1.0,2.15,0]]); // ilk serbest anda kaçırıldıysa odada yine bulunabilsin
    const kapiN=new THREE.Object3D(); kapiN.position.copy(this.kapiP); scene.add(kapiN);
    await etkBekle(kapiN,"Odadan çık",{mesafe:1.3,isaretY:1.2});
    this.serbest=false; gorev(null);
    await gecis(async()=>{ katmanTemizle(); await this.lobiKur(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await this.lobiAkisi();
    await gecis(async()=>{ katmanTemizle(); await this.kemanOdaKur(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await this.kemanSahnesi();
  },
  async kemanOdaKur(){ await this.odaKur("ocak"); this.kemanKutusuKoy(); const D=this.kar; D.position.set(1.1,0,1.9); D.rotation.y=Math.PI*1.1; D.userData.otur=0; },
  async kemanSahnesi(){ await this.kemanAc(); await this.akort(); await this.solakSorusu(); await this.yayCek(); await this.son(); },
  async lobiKur(){
    this.faz="lobi"; this.lobi=true; this.t=0; ETK=[]; this.tw=[];
    const gy=new THREE.Vector3(.2,.7,1).normalize();
    sahneKur({sis:"#e9e6e0",sisYakin:30,sisUzak:120,ust:"#c9d2dc",ufuk:"#e6eaee",alt:"#9a958e",gunesYon:gy,isikYon:gy,gunesRenk:"#ffffff",isik:"#eef2f8",isikGuc:.6,zemin:"#8a8478",hemi:.85,dolgu:.45});
    bkLobi(this);
    this.kar=karakter("kardelen","ev"); this.oyuncu=this.kar; this.kar.position.copy(this.asansorP); this.kar.rotation.y=Math.PI/2; scene.add(this.kar); bilegeTak(this.kar,"Right");
    this.gorevli=kalabalik("rpm",{ust:"#2f3a4a",alt:"#1e2228",anim:"idle",sac:"#1a1714"}); if(this.gorevli){ this.gorevli.position.set(3.0,0,-3.45); this.gorevli.rotation.y=0; kafaEkle(this.gorevli,"rpm"); scene.add(this.gorevli); }
    this.ogrenci=kalabalik("michelle",{ust:"#e9d5c9",alt:"#3a4a66",anim:"idle",ton:"#f3e9e3"}); if(this.ogrenci){ this.ogrenci.position.set(-5.4,0,-.4); this.ogrenci.rotation.y=-Math.PI*.6; scene.add(this.ogrenci); }
    KONUSANLAR={kardelen:this.kar,gorevli:this.gorevli};
    this.uzunKutu=new THREE.Mesh(kutuGeo(.86,.16,.3,.3),new THREE.MeshStandardMaterial({map:kartonDoku(),roughness:.9})); this.uzunKutu.visible=false; this.uzunKutu.userData.dik=true; scene.add(this.uzunKutu);
    Kamera.sinema=null; Kamera.aci=Math.PI/2+.5; Kamera.mesafe=4.2; Kamera.yukseklik=2.0; Kamera.hedef.copy(this.kar.position); Kamera.poz.set(-2,3,5);
    this.asansorAc=1;
  },
  async lobiAkisi(){
    const D=this.kar;
    await sahne(async()=>{ kameraNoktasi(new THREE.Vector3(-3.5,1.9,4.2),bas(D)); await bekle(900); await yuruHedef(D,new THREE.Vector3(-5.4,0,2.6),1.1); this.asansorAc=-1;
      await konus("kardelen",["Uykulu uykulu indim","Resepsiyon neredeydi kdkdkd"],{gul:.5,uzak:1.6}); });
    gorev("Resepsiyondan kargonu al");
    this.serbest=true; gizliKalpler(this,[[-3.2,1.0,3.6,1],[-6.3,1.0,-2.0,2]]);
    await etkBekle(this.tezgah,"Kargonu sor",{mesafe:2.3,isaretY:1.6});
    this.serbest=false; gorev(null);
    await sahne(async()=>{
      await yuruHedef(D,new THREE.Vector3(3.0,0,-2.0),1.1); D.rotation.y=Math.PI;
      if(this.gorevli){ this.gorevli.userData.bakNokta=bas(D); }
      await konus("gorevli","Kardelen Hanım, size bir kargo var. Epey uzun bir kutu.",{dinleyen:"kardelen"});
      await konus("kardelen",["Benim mi","Uzun mu dediniz 😳"],{gul:.6,dinleyen:"gorevli"});
      await konus("gorevli","Sabah geldi, kırılabilir yazıyor. Dikkatli taşıyın.",{dinleyen:"kardelen"});
      this.uzunKutuRaf.visible=false; this.uzunKutu.visible=true; eldeTut(D,this.uzunKutu,"S"); D.userData.kolS.rotation.set(-.9,0,-.2); D.userData.kolD.rotation.set(-.9,0,.2);
      await konus("kardelen",["Teşekkür ederim","Ayy kalbim"],{gul:1,dinleyen:"gorevli"});
    });
    gorev("Asansöre dön");
    this.serbest=true; this.asansorAc=1;
    const n=new THREE.Object3D(); n.position.copy(this.asansorP); scene.add(n);
    await etkBekle(n,"Asansöre bin",{mesafe:1.2,isaretY:1.3});
    this.serbest=false; gorev(null); D.userData.kolS.rotation.set(0,0,0); D.userData.kolD.rotation.set(0,0,0);
  },
  kemanKutusuKoy(){
    const k=kemanKutusuYap(); k.position.set(-1.3,.57,-.95); k.rotation.y=Math.PI/2+.05; scene.add(k); this.kemanKutu=k;
    const kar=new THREE.Mesh(kutuGeo(.88,.17,.31,.3),new THREE.MeshStandardMaterial({map:kartonDoku(),roughness:.9})); kar.position.set(-.55,.085,.4); kar.rotation.y=.4; scene.add(kar); this.kartonBos=kar;
  },
  async kemanAc(){
    const D=this.kar, K=this.kemanKutu, U=K.userData;
    await sahne(async()=>{ kameraNoktasi(new THREE.Vector3(.3,1.7,1.2),new THREE.Vector3(-1.2,.6,-.9));
      await anlat("Kartonu açınca içinden siyah bir keman kutusu çıktı.",2800);
      await yuruHedef(D,new THREE.Vector3(-.55,0,-.95),1.0); D.rotation.y=-Math.PI/2;
      await kameraNoktasi(new THREE.Vector3(-.6,1.35,-.25),new THREE.Vector3(-1.3,.55,-.95),1.2); });
    sabitKamera(new THREE.Vector3(-.6,1.35,-.25),new THREE.Vector3(-1.3,.55,-.95));
    gorev("Kilitleri aç · 0 / 2");
    for(let i=0;i<2;i++){ await this.qte(i?"🔓 Sağ kilit":"🔓 Sol kilit"); const k=U.kilitler[i]; Ses.efekt("vuru",.4); await this.tween(.25,t=>{ k.rotation.x=t*1.2; }); gorev(`Kilitleri aç · ${i+1} / 2`); }
    gorev(null);
    await this.tween(1.3,t=>{ const e=1-Math.pow(1-t,3); U.kapak.rotation.x=-e*1.75; });
    Ses.efekt("parilti"); Ses.efekt("kalp",.5);
    await sahne(async()=>{ const p=new THREE.Vector3(); U.keman.getWorldPosition(p);
      await kameraNoktasi(p.clone().add(new THREE.Vector3(.35,.45,.1)),p.clone().add(new THREE.Vector3(-.05,0,0)),1.6);
      D.userData.gulumse=1; this.kemanParilti=1;
      await anlat("Simli siyah bir keman. Işığa her dönüşünde pırıl pırıl.",3000);
      await kameraNoktasi(ondenNokta(D,1.0,-.35,-.05),bas(D),1.2);
      await konus("kardelen",["Ben…","Ben şoktayım şu an"],{kamera:false,gul:.8});
      D.userData.telefon=2; this.tel.visible=true; eldeTut(D,this.tel,"D");
      const dm=DM.ac("Kaan 💙","çevrimiçi"); dm.zaman("Öğleden sonra");
      await dm.yaz("ben","Aşkım"); await dm.yaz("ben","Ben kendime gelemedim"); await dm.yaz("ben","Yatağın üstünde öyle bakıp duruyorum 🥹");
      await dm.yaz("o","Siyah olsun demiştin, aradım buldum"); await dm.yaz("o","Çoğu boyalı oluyormuş; bu simli kaplama, kolay kolay solmaz");
      await dm.yaz("ben","Işıl ışıl parlıyor 😍"); await dm.yaz("ben","Sen çok delisin"); await dm.yaz("o","Yine de senden güzel değil");
      await bekle(500); DM.kapat(); D.userData.telefon=0; D.userData.eldeki=null; this.tel.visible=false;
      await anlat("Sonra uzun uzun kemanla bakıştı. Mutluluktan ağladığını sonradan anlattı.",3400);
    });
  },
  // akort: dört tel, ibre ortaya gelene kadar burguyu çevir
  async akort(){
    const D=this.kar; const teller=[{ad:"Sol (G)",f:196},{ad:"Re (D)",f:293.66},{ad:"La (A)",f:440},{ad:"Mi (E)",f:659.25}];
    await sahne(async()=>{ await konus("kardelen",["Önce akort","Videoda öyle diyordu"],{gul:.6,uzak:1.3}); });
    this.kemanEle();
    gorev("Kemanı akort et · 0 / 4");
    const ui=el(`<div class="sim bk-akort"><div class="baslik">Akort</div><div class="ipucu"></div>
      <div class="bk-tuner"><div class="bk-kadran"><i></i><b></b></div><span class="bk-nota"></span></div>
      <div class="satir"><button class="tut bk-eksi">↺ Gevşet</button><button class="bk-cal">🎻 Çal</button><button class="tut bk-arti">↻ Ger</button></div></div>`); katman.appendChild(ui);
    const ibre=ui.querySelector(".bk-kadran i"), not=ui.querySelector(".bk-nota"), ip=ui.querySelector(".ipucu");
    let yon_=0; const bas_=(b,v)=>{ b.addEventListener("pointerdown",e=>{ e.preventDefault(); yon_=v; b.classList.add("basili"); }); const bit=()=>{ yon_=0; b.classList.remove("basili"); }; b.addEventListener("pointerup",bit); b.addEventListener("pointercancel",bit); b.addEventListener("pointerleave",bit); };
    bas_(ui.querySelector(".bk-eksi"),-1); bas_(ui.querySelector(".bk-arti"),1);
    for(let i=0;i<4;i++){
      const T=teller[i]; let sapma=(i%2?1:-1)*rnd(35,55); let tutT=0, sonCal=0; not.textContent=T.ad; ip.textContent="İbre ortaya gelene kadar burguyu çevir"; Ses.keman(T.f*Math.pow(2,sapma/1200),.6,.12);
      await new Promise(r=>{ ui.querySelector(".bk-cal").onclick=()=>{ Ses.keman(T.f*Math.pow(2,sapma/1200),.8,.14); };
        let son_=performance.now(); const f=()=>{ if(!ui.isConnected) return; const t=performance.now(), dt=Math.min(.05,(t-son_)/1000); son_=t;
          if(yon_){ sapma+=yon_*dt*(Math.abs(sapma)<14?11:26); if(t-sonCal>420){ sonCal=t; Ses.keman(T.f*Math.pow(2,sapma/1200),.45,.09); } }
          sapma=clamp(sapma,-60,60); ibre.style.transform=`rotate(${sapma*1.2}deg)`; const ok=Math.abs(sapma)<4.5; ibre.classList.toggle("ayarda",ok); /* "tam" sınıfı tam ekran paneller için ayrılmış: ibre koca yeşil bir kutuya dönüşüyordu */
          if(ok&&!yon_){ tutT+=dt; if(tutT>.55){ Ses.keman(T.f,.9,.15); Ses.efekt("parilti",.4); ip.textContent=T.ad+" tamam ✓"; return bekle(700).then(r); } } else tutT=0;
          requestAnimationFrame(f); }; f(); });
      gorev(`Kemanı akort et · ${i+1} / 4`);
    }
    ui.remove(); gorev(null);
  },
  kemanEle(){ // keman sol omuzda, yay sağ elde
    const D=this.kar, U=this.kemanKutu.userData;
    D.position.set(-.35,0,-.2); D.rotation.y=-Math.PI*.55; D.userData.otur=0; D.userData.hiz=0;
    const k=U.keman, y=U.yay; scene.attach(k); scene.attach(y); this.elKeman=k; this.elYay=y; k.scale.setScalar(1); y.scale.setScalar(1);
    this.calisPozu=true; this.yayFaz=.5; this.yayHedef=.5;
    D.updateMatrixWorld(true); this.calisKam=[ondenNokta(D,1.45,.45,.08),bas(D).add(new THREE.Vector3(0,-.22,0))]; kameraNoktasi(...this.calisKam); sabitKamera(...this.calisKam); // kesme: keman pozuna alınışı görünmesin
  },
  calisGuncelle(dt){ if(!this.elKeman||!this.kar) return; this.yayFaz=lerp(this.yayFaz,this.yayHedef,1-Math.pow(.004,dt)); kemanTutGuncelle(this.kar,this.elKeman,this.elYay,this.yayFaz); },
  async solakSorusu(){
    const D=this.kar;
    await sahne(async()=>{
      await konus("kardelen",["Bir şey soracağım ama","Ben solağım ya…"],{kamera:false,gul:.3});
      const dm=DM.ac("Kaan 💙","çevrimiçi"); dm.zaman("Akşam");
      await dm.yaz("ben","Bir şey sorabilir miyim"); await dm.yaz("ben","Ben solağım ya, bu kemanı rahat çalabilir miyim?"); await dm.yaz("ben","Tel sırası falan değişir mi diye düşündüm");
      await dm.yaz("o","Sorun değilmiş, satıcıya özellikle sordum"); await dm.yaz("o","Çene desteği de var. Hadi bakalım kemancı");
      await bekle(400); DM.kapat();
      await konus("kardelen",["Çal kemancı","Kendime diyorum kdkdkd"],{kamera:false,gul:1});
    });
    if(this.calisKam) sabitKamera(...this.calisKam);
  },
  async yayCek(){ await yayOyunu(this,[587.33,659.25,739.99,587.33,880,783.99,739.99,659.25,587.33],{acemi:true}); },
  async son(){
    const D=this.kar;
    await sahne(async()=>{
      await kameraNoktasi(ondenNokta(D,1.6,.4,.1),bas(D).add(new THREE.Vector3(0,-.2,0)),1.6);
      await konus("kardelen",["Çaldım!","Kendi kemanımla 🥹"],{kamera:false,gul:1});
      await hatiraFoto("Simli siyah keman · 18 Ocak 2025"); await bekle(1600);
      this.calisPozu=false; D.userData.elHedef=null; if(this.elKeman) this.elKeman.visible=false; if(this.elYay) this.elYay.visible=false;
      D.userData.telefon=2; this.tel.visible=true; eldeTut(D,this.tel,"S");
      const dm=DM.ac("Kaan 💙","çevrimiçi"); dm.zaman("Biraz sonra");
      await dm.yaz("ben","Sesli mesaj 🎻 0:21"); await dm.yaz("o","Bravo kemancı 😍"); await dm.yaz("o","Haberin olsun, ilk konser benim");
      await dm.yaz("ben","Hem keman hem sen, iki ayrı mutluluk"); await dm.yaz("ben","Beni çok mutlu ettin, teşekkür ederim");
      await bekle(600); DM.kapat(); D.userData.telefon=0; D.userData.eldeki=null; this.tel.visible=false;
      await anlat("O keman iki ay sonra onunla İzmit'e, bizim otele bile geldi.",3000);
    });
    bolumBitti(this.no);
  },
  // tek dokunuşluk düğme
  qte(yazi){ return new Promise(r=>{ const q=el(`<div class="qte"><button class="btn qte-btn">${yazi}</button></div>`); katman.appendChild(q); q.querySelector("button").onclick=()=>{ q.remove(); Ses.efekt("vuru",.3); r(); }; }); },
  // bant kesme: makasla bant boyunca sürükle
  async bantKes(){
    gorev("Bandı kes");
    const ui=el(`<div class="sim"><div class="baslik">Kargoyu aç</div><div class="ipucu">Makası bant boyunca sürükle</div>
      <div class="bk-iz"><i></i><b>✂️</b></div></div>`); katman.appendChild(ui);
    const iz=ui.querySelector(".bk-iz"), mk=ui.querySelector(".bk-iz b"), dol=ui.querySelector(".bk-iz i"); let v=0, tut=false;
    await new Promise(r=>{ const git=e=>{ const R=iz.getBoundingClientRect(); const p=clamp((e.clientX-R.left)/R.width,0,1); if(p>v&&p-v<.35){ v=p; mk.style.left=(v*100)+"%"; dol.style.width=(v*100)+"%"; this.kesik.scale.x=Math.max(.001,v*this.kargoW); this.kesik.position.x=-this.kargoW/2+v*this.kargoW/2; if(Math.random()<.25) Ses.efekt("vuru",.08); }
        if(v>.96){ tut=false; r(); } };
      iz.addEventListener("pointerdown",e=>{ tut=true; try{ iz.setPointerCapture(e.pointerId); }catch(_){} git(e); }); iz.addEventListener("pointermove",e=>{ if(tut) git(e); }); iz.addEventListener("pointerup",()=>{ tut=false; }); });
    ui.remove(); gorev(null);
  },
  guncelle(dt){
    this.t+=dt; const D=this.kar;
    this.tw=this.tw.filter(a=>{ a.t+=dt; const k=Math.min(1,a.t/a.sure); a.f(k); if(k>=1){ a.r(); return false; } return true; });
    if(this.manzara&&!this.lobi&&this.manzara.tur!=="aksam"){ this._mz=(this._mz||0)+dt; if(this._mz>.06){ this._mz=0; this.manzara.ciz(this.t); } }
    if(this.ipIsik){ const m=this.ipIsik.children[1]&&this.ipIsik.children[1].material; if(m){ m.opacity=.75+Math.sin(this.t*2.2)*.15+(this.isikCos?Math.sin(this.t*9)*.1:0); } }
    if(this.agacIsik){ const m=this.agacIsik.material; const h=(this.t*.08)%1; m.color.setHSL(h,.6,.7); }
    if(this.kemanParilti&&this.kemanKutu){ const gm=this.kemanKutu.userData.keman.userData.gm; gm.emissiveIntensity=.1+Math.max(0,Math.sin(this.t*2.4))*.12; }
    if(D&&D.userData.bileklik){ const p=D.userData.bileklik.userData.parilti; p.material.opacity=.6+Math.sin(this.t*5)*.4; }
    if(this.lobi&&this.asKapi){ this._as=clamp((this._as||0)+(this.asansorAc||0)*dt*1.4,0,1); this.asKapi.forEach((k,i)=>{ k.position.x=(i?1:-1)*(.3+this._as*.55); }); }
    if(this.calisPozu) this.calisGuncelle(dt);
    if(!D) return;
    if(this.serbest&&!kilit) yuru(D,dt,this.lobi?this.lobiSinir:this.odaSinir,this.lobi?2.0:1.55);
    etkilesimGuncelle(D,this.btn);
    if(!Kamera.sinema) Kamera.hedef.lerp(D.position,.12);
  },
  temizle(){ ICSAHNE=null; DM.kapat&&DM.kapat(); Ses.kis(false); }
};
