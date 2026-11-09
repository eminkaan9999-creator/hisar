/* ================= BÖLÜM 1 (devam): 29 OCAK 2022 · İZMİT ================= */
/* Saat 11'de İzmit meydanında, saat kulesinin dibinde ilk buluşma → kafede kahvaltı → sonra gezmek (sahil).
   Hava soğuk: Kardelen haki mont, Kaan deri ceket; nefesler buhar olur. */
function geoBirlestir(geos){
  const pos=[], nor=[]; for(const g0 of geos){ const g=g0.index?g0.toNonIndexed():g0; const P=g.attributes.position.array, N=g.attributes.normal.array; for(let i=0;i<P.length;i++){ pos.push(P[i]); nor.push(N[i]); } }
  const g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); g.setAttribute("normal",new THREE.Float32BufferAttribute(nor,3)); return g;
}
// yapraksız kış ağacı (tek ağ: gövde + dallar)
function ciplakAgac(o=1){
  const geos=[]; const m4=new THREE.Matrix4(), q=new THREE.Quaternion(), yukari=new THREE.Vector3(0,1,0);
  const dal=(bas,yon,boy,r,d)=>{ const g=new THREE.CylinderGeometry(r*.62,r,boy,5,1); g.translate(0,boy/2,0); q.setFromUnitVectors(yukari,yon); m4.compose(bas,q,new THREE.Vector3(1,1,1)); g.applyMatrix4(m4); geos.push(g);
    if(d<=0) return; const uc=bas.clone().addScaledVector(yon,boy); const n=d===3?4:3;
    for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+rnd(-.4,.4); const y=new THREE.Vector3(Math.cos(a)*rnd(.45,.85),rnd(.6,1),Math.sin(a)*rnd(.45,.85)).add(yon.clone().multiplyScalar(.6)).normalize();
      dal(uc.clone().addScaledVector(yon,-boy*rnd(0,.25)),y,boy*rnd(.55,.72),r*.58,d-1); } };
  dal(new THREE.Vector3(0,0,0),new THREE.Vector3(rnd(-.05,.05),1,rnd(-.05,.05)).normalize(),2.4*o,.17*o,3);
  const m=new THREE.Mesh(geoBirlestir(geos),mat("#4b3b30",{roughness:.95})); m.castShadow=true; m.userData.engel=.26*o; return m;
}
function saatKadrani(){
  if(saatKadrani.t) return saatKadrani.t;
  const c=document.createElement("canvas"); c.width=c.height=256; const x=c.getContext("2d");
  x.fillStyle="#f3efe4"; x.beginPath(); x.arc(128,128,124,0,Math.PI*2); x.fill(); x.lineWidth=7; x.strokeStyle="#2b2b2b"; x.stroke();
  x.fillStyle="#222"; x.font="bold 26px Georgia"; x.textAlign="center"; x.textBaseline="middle";
  for(let i=1;i<=12;i++){ const a=i/12*Math.PI*2-Math.PI/2; x.fillText(String(i),128+Math.cos(a)*96,128+Math.sin(a)*96); }
  for(let i=0;i<60;i++){ const a=i/60*Math.PI*2; const r0=i%5?112:106; x.lineWidth=i%5?2:4; x.beginPath(); x.moveTo(128+Math.cos(a)*r0,128+Math.sin(a)*r0); x.lineTo(128+Math.cos(a)*118,128+Math.sin(a)*118); x.stroke(); }
  // akrep 11'de, yelkovan 12'de
  const el_=(a,boy,kal)=>{ x.lineWidth=kal; x.lineCap="round"; x.beginPath(); x.moveTo(128,128); x.lineTo(128+Math.cos(a)*boy,128+Math.sin(a)*boy); x.stroke(); };
  el_(11/12*Math.PI*2-Math.PI/2,58,9); el_(-Math.PI/2,86,6); x.fillStyle="#222"; x.beginPath(); x.arc(128,128,8,0,Math.PI*2); x.fill();
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; saatKadrani.t=t; return t;
}
// İzmit Saat Kulesi (sade): basamaklı kaide, taş gövde, dört kadranlı saat katı, kubbe ve alem
function saatKulesi(){
  const g=new THREE.Group(); const tas=mat("#d9cfbd",{roughness:.85,bumpMap:gurultuDoku(3),bumpScale:.02}), koyu=mat("#b9ab95",{roughness:.85}), kursun=mat("#55595e",{roughness:.5,metalness:.35});
  const kutu=(w,h,d,y,m)=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m||tas); b.position.y=y; b.castShadow=true; b.receiveShadow=true; g.add(b); return b; };
  kutu(4,.35,4,.175,koyu); kutu(3.4,.35,3.4,.525,koyu); kutu(2.9,1.1,2.9,1.25);
  kutu(2.2,8.6,2.2,6.1); kutu(2.6,.28,2.6,1.9,koyu); kutu(2.5,.24,2.5,6.0,koyu); kutu(2.7,.32,2.7,10.4,koyu);
  // kemerli pencere nişleri
  const nis=mat("#5c5246",{roughness:.9});
  for(let k=0;k<4;k++){ const a=k*Math.PI/2; for(const y of [3.9,7.8]){ const p=new THREE.Mesh(new THREE.PlaneGeometry(.55,1.3),nis); const r=1.101; p.position.set(Math.sin(a)*r,y,Math.cos(a)*r); p.rotation.y=a; g.add(p);
      const tepe=new THREE.Mesh(new THREE.CircleGeometry(.275,12,0,Math.PI),nis); tepe.position.set(Math.sin(a)*r,y+.65,Math.cos(a)*r); tepe.rotation.y=a; g.add(tepe); } }
  kutu(2.5,2.3,2.5,11.75);
  const kad=new THREE.MeshStandardMaterial({map:saatKadrani(),roughness:.6}); const cer=mat("#2c2c2c",{roughness:.4,metalness:.5});
  for(let k=0;k<4;k++){ const a=k*Math.PI/2; const r=1.262; const d=new THREE.Mesh(new THREE.CircleGeometry(.82,40),kad); d.position.set(Math.sin(a)*r,11.75,Math.cos(a)*r); d.rotation.y=a; g.add(d);
    const h=new THREE.Mesh(new THREE.TorusGeometry(.84,.05,8,40),cer); h.position.copy(d.position); h.rotation.y=a; g.add(h); }
  kutu(2.95,.3,2.95,13.05,koyu);
  const kub=new THREE.Mesh(new THREE.SphereGeometry(1.25,24,12,0,Math.PI*2,0,Math.PI/2),kursun); kub.position.y=13.2; kub.castShadow=true; g.add(kub);
  const alem=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.9,8),ALTIN()); alem.position.y=14.8; g.add(alem);
  const top=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),ALTIN()); top.position.y=14.5; g.add(top);
  return g;
}
function pencereDoku(renkH){ const c=document.createElement("canvas"); c.width=128; c.height=256; const x=c.getContext("2d"); x.fillStyle=renkH; x.fillRect(0,0,128,256);
  for(let j=0;j<6;j++) for(let i=0;i<3;i++){ const isik=Math.random()<.25; x.fillStyle=isik?"#e9d7a8":"#5f6b78"; x.fillRect(10+i*40,14+j*40,24,28); x.fillStyle="rgba(255,255,255,.35)"; x.fillRect(10+i*40,14+j*40,24,3); }
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; }
// meydanı çevreleyen apartman: kat sayısı, renk, zemin katta dükkân tabelası
function bina(w,h,d,renkH,tabela){
  const g=new THREE.Group(); const t=pencereDoku(renkH); t.repeat.set(Math.max(1,Math.round(w/3.2)),Math.max(1,Math.round((h-4)/6.4)));
  const govde=new THREE.Mesh(new THREE.BoxGeometry(w,h-4,d),[mat(renkH),mat(renkH),mat("#77706a"),mat(renkH),new THREE.MeshStandardMaterial({map:t,roughness:.85}),mat(renkH)]); govde.position.y=4+(h-4)/2; govde.castShadow=true; govde.receiveShadow=true; g.add(govde);
  const zemin=new THREE.Mesh(new THREE.BoxGeometry(w,4,d),mat("#3d3a37",{roughness:.6})); zemin.position.y=2; g.add(zemin);
  const vitrin=new THREE.Mesh(new THREE.PlaneGeometry(w-1,2.6),new THREE.MeshStandardMaterial({color:renk("#d9c9a6"),emissive:renk("#f2c98a"),emissiveIntensity:.35,roughness:.2,metalness:.3})); vitrin.position.set(0,1.6,d/2+.01); g.add(vitrin);
  if(tabela){ const tb=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w-1,5.5),.8),new THREE.MeshStandardMaterial({map:yaziDoku(tabela,{w:512,h:96,zemin:"#7a2b25",renk:"#f6ead2",font:"600 58px Georgia"}),roughness:.7})); tb.position.set(0,3.4,d/2+.03); g.add(tb); }
  g.userData.engel={kutu:[w/2+.05,d/2+.05]};
  return g;
}
function bank2(){ const g=new THREE.Group(); g.userData.engel={kutu:[.84,.3]}; const ah=mat("#6a4a32",{roughness:.8}), dm=mat("#2a2a2a",{metalness:.5,roughness:.5});
  for(let i=0;i<3;i++){ const t=new THREE.Mesh(new THREE.BoxGeometry(1.6,.04,.12),ah); t.position.set(0,.46,-.16+i*.15); g.add(t); }
  for(let i=0;i<2;i++){ const t=new THREE.Mesh(new THREE.BoxGeometry(1.6,.11,.04),ah); t.position.set(0,.68+i*.15,-.24); t.rotation.x=.15; g.add(t); }
  for(const sx of [-.7,.7]){ const a=new THREE.Mesh(new THREE.BoxGeometry(.06,.46,.5),dm); a.position.set(sx,.23,0); g.add(a); }
  g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); return g; }
function lamba2(){ const g=new THREE.Group(); g.userData.engel=.14; const d=new THREE.Mesh(new THREE.CylinderGeometry(.05,.08,3.8,8),mat("#25272b",{metalness:.6,roughness:.4})); d.position.y=1.9; g.add(d);
  const b=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),new THREE.MeshStandardMaterial({color:renk("#fff3dc"),emissive:renk("#ffd9a0"),emissiveIntensity:.25})); b.position.y=3.9; g.add(b); return g; }
function guvercin(){ const g=new THREE.Group(); const gri=mat("#8b919b",{roughness:.8}), koyu=mat("#4f5560",{roughness:.8});
  const v=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),gri); v.scale.set(.065,.06,.11); v.position.y=.085; g.add(v);
  const b=new THREE.Mesh(new THREE.SphereGeometry(.036,10,8),koyu); b.position.set(0,.15,.08); g.add(b); g.userData.bas=b;
  const k=new THREE.Mesh(new THREE.ConeGeometry(.04,.09,4),koyu); k.rotation.x=-Math.PI/2-.3; k.position.set(0,.09,-.11); g.add(k); return g; }
// soğukta nefes buharı
function nefesDoku(){ if(nefesDoku.t) return nefesDoku.t; const c=document.createElement("canvas"); c.width=c.height=64; const x=c.getContext("2d"); const r=x.createRadialGradient(32,32,2,32,32,30); r.addColorStop(0,"rgba(255,255,255,.9)"); r.addColorStop(1,"rgba(255,255,255,0)"); x.fillStyle=r; x.fillRect(0,0,64,64); const t=new THREE.CanvasTexture(c); t.__kalici=true; nefesDoku.t=t; return t; }
function nefesGuncelle(B,kisiler,dt){
  B.buhar=B.buhar||[];
  for(const c of kisiler){ if(!c||!c.parent) continue; const u=c.userData; u._nefes=(u._nefes||rnd(0,2))-dt; if(u._nefes<0){ u._nefes=rnd(2.2,3.4);
      const s=new THREE.Sprite(new THREE.SpriteMaterial({map:nefesDoku(),transparent:true,opacity:.28,depthWrite:false})); const h=bas(c); const ileri=new THREE.Vector3(Math.sin(c.rotation.y),0,Math.cos(c.rotation.y));
      s.position.copy(h).addScaledVector(ileri,.13).add(new THREE.Vector3(0,-.07,0)); s.scale.setScalar(.05); s.userData={t:0,v:ileri.multiplyScalar(.18).add(new THREE.Vector3(0,.07,0))}; scene.add(s); B.buhar.push(s); } }
  B.buhar=B.buhar.filter(s=>{ s.userData.t+=dt; const t=s.userData.t; s.position.addScaledVector(s.userData.v,dt); s.scale.setScalar(.05+t*.22); s.material.opacity=.28*Math.max(0,1-t/1.3); if(t>1.3){ scene.remove(s); s.material.dispose(); return false; } return true; });
}
/* kahvaltı sofrası (masa üstü y=.76 yerelde) */
function kahvaltiSofrasi(){
  const g=new THREE.Group(); const y0=.775;
  const tabak=(x,z,r=.085)=>{ const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.8,.014,24),mat("#f8f6f1",{roughness:.35})); t.position.set(x,y0+.007,z); g.add(t); return t; };
  const kup=(x,z,w,h,d,renkH,ry=0)=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(renkH,{roughness:.6})); b.position.set(x,y0+.014+h/2,z); b.rotation.y=ry; g.add(b); return b; };
  const kure=(x,z,r,renkH,yy=0,sx=1,sy=1)=>{ const s=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),mat(renkH,{roughness:.35})); s.scale.set(sx,sy,sx); s.position.set(x,y0+.014+r*sy+yy,z); g.add(s); return s; };
  const dilim=(x,z,r,renkH,ic)=>{ const d=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.008,14),mat(renkH,{roughness:.5})); d.position.set(x,y0+.02,z); g.add(d); if(ic){ const i=new THREE.Mesh(new THREE.CylinderGeometry(r*.75,r*.75,.009,12),mat(ic,{roughness:.5})); i.position.copy(d.position); g.add(i); } };
  // peynirler
  tabak(-.2,-.06); kup(-.22,-.06,.07,.03,.05,"#f7f4ea",.3); kup(-.16,-.08,.06,.025,.045,"#f0d27a",-.2);
  // zeytin
  tabak(.0,-.12,.07); for(let i=0;i<6;i++){ const a=i*1.05; kure(Math.cos(a)*.03,-.12+Math.sin(a)*.03,.011,i%2?"#2a2a1e":"#5d6b2c",0,1,.8); }
  // domates-salatalık
  tabak(.2,-.06); for(let i=0;i<4;i++) dilim(.17+i*.022,-.08+(i%2)*.03,.024,"#c9342a","#e8634f"); for(let i=0;i<4;i++) dilim(.2+(i%2)*.03,-.02,.02,"#7a9a3a","#e7efc9");
  // bal-kaymak, reçel
  const kase=(x,z,renkH)=>{ const k=new THREE.Mesh(new THREE.CylinderGeometry(.04,.03,.03,16),mat("#ffffff",{roughness:.3})); k.position.set(x,y0+.015,z); g.add(k); const i=new THREE.Mesh(new THREE.CylinderGeometry(.034,.034,.004,16),mat(renkH,{roughness:.25})); i.position.set(x,y0+.029,z); g.add(i); };
  kase(-.06,.02,"#d99a2b"); kase(.06,.03,"#a1142a"); kase(0,.07,"#f6f0dc");
  // sahanda yumurta
  const tava=new THREE.Mesh(new THREE.CylinderGeometry(.085,.075,.03,24),mat("#a8582f",{metalness:.7,roughness:.3})); tava.position.set(-.04,y0+.016,.15); g.add(tava);
  const ak=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.006,20),mat("#fbfaf4",{roughness:.4})); ak.position.set(-.04,y0+.034,.15); g.add(ak);
  kure(-.065,.14,.018,"#f2a51c",.02,1,.55); kure(-.015,.16,.018,"#f2a51c",.02,1,.55);
  // ekmek sepeti ve simit
  const sepet=new THREE.Mesh(new THREE.CylinderGeometry(.09,.07,.05,10),mat("#9a6a3a",{roughness:.9})); sepet.position.set(.22,y0+.025,.12); g.add(sepet);
  for(let i=0;i<3;i++){ const e=new THREE.Mesh(new THREE.BoxGeometry(.07,.05,.015),mat("#e3c38f",{roughness:.9})); e.position.set(.2+i*.02,y0+.07,.12); e.rotation.z=.2; g.add(e); }
  const simit=new THREE.Mesh(new THREE.TorusGeometry(.06,.019,10,24),mat("#a8642e",{roughness:.75,bumpMap:gurultuDoku(10),bumpScale:.003})); simit.rotation.x=-Math.PI/2; simit.position.set(-.24,y0+.02,.15); g.add(simit);
  // ince belli çay bardakları ve çaydanlık
  // ince belli (lale) çay bardağı: altı geniş, belde incelir, ağzına doğru açılır
  const egri=new THREE.SplineCurve([new THREE.Vector2(.021,0),new THREE.Vector2(.0205,.014),new THREE.Vector2(.0168,.04),new THREE.Vector2(.0172,.058),new THREE.Vector2(.0215,.08),new THREE.Vector2(.0258,.1)]);
  const profil=egri.getPoints(16).map(p=>new THREE.Vector2(p.x,p.y));
  const cam=new THREE.MeshStandardMaterial({color:renk("#ffffff"),transparent:true,opacity:.28,roughness:.05,metalness:.1,side:THREE.DoubleSide,depthWrite:false});
  const cayM=new THREE.MeshStandardMaterial({color:renk("#a0270f"),transparent:true,opacity:.86,roughness:.15});
  const bardaklar=[];
  for(const [x,z] of [[.12,.2],[-.13,-.2]]){ const ta=new THREE.Mesh(new THREE.CylinderGeometry(.055,.045,.008,20),mat("#f2efe6",{roughness:.3})); ta.position.set(x,y0+.004,z); g.add(ta);
    const b=new THREE.Mesh(new THREE.LatheGeometry(profil,20),cam); b.position.set(x,y0+.008,z); g.add(b);
    const ic=new THREE.Mesh(new THREE.LatheGeometry(profil.map(p=>new THREE.Vector2(p.x*.9,p.y*.98)),20),cayM); ic.position.set(x,y0+.009,z); ic.scale.y=.15; g.add(ic); bardaklar.push(ic); }
  const demlik=new THREE.Group(); const cel=mat("#c9cdd2",{metalness:.85,roughness:.25});
  const alt=new THREE.Mesh(new THREE.CylinderGeometry(.085,.1,.13,20),cel); alt.position.y=.065; demlik.add(alt);
  const ust=new THREE.Mesh(new THREE.CylinderGeometry(.05,.065,.09,18),cel); ust.position.y=.175; demlik.add(ust);
  const kapak=new THREE.Mesh(new THREE.SphereGeometry(.03,10,8),cel); kapak.position.y=.23; demlik.add(kapak);
  const em=new THREE.Mesh(new THREE.CylinderGeometry(.009,.015,.1,8),cel); em.position.set(.07,.19,0); em.rotation.z=-1; demlik.add(em);
  demlik.position.set(.3,y0,-.22); g.add(demlik);
  g.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  g.userData={bardaklar,demlik}; return g;
}
Object.assign(B0,{
  async meydanKur(){
    this.yayalar=null; this.kapi=null; this.kar=null; this.faz="meydan"; this.t=0; ETK=[]; ICSAHNE=null; this.serbest=false; this.birlikte=false; this.buhar=[];
    await kisHazirla();
    const gy=new THREE.Vector3(.4,.33,-1).normalize();
    sahneKur({sis:"#cdd5de",sisYakin:35,sisUzak:190,ust:"#8da3bd",ufuk:"#e2e6eb",alt:"#a6adb4",gunesYon:gy,isikYon:gy,gunesRenk:"#fff2df",isik:"#f2efe9",isikGuc:1.75,zemin:"#8d8983",hemi:.95,dolgu:.55,dolguRenk:"#dde5f1"});
    Ses.ortam("kalabalik",.55);
    // taş döşeli meydan
    const c=document.createElement("canvas"); c.width=c.height=512; const x=c.getContext("2d"); x.fillStyle="#8f887d"; x.fillRect(0,0,512,512);
    for(let j=0;j<16;j++) for(let i=0;i<16;i++){ const o=(j%2)*16; x.fillStyle=`hsl(${30+Math.random()*10},${5+Math.random()*6}%,${52+Math.random()*10}%)`; x.fillRect(i*32+o+1,j*32+1,30,30); }
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(20,20); t.encoding=THREE.sRGBEncoding; t.anisotropy=8;
    const zem=new THREE.Mesh(new THREE.PlaneGeometry(160,160),new THREE.MeshStandardMaterial({map:t,roughness:.92,bumpMap:gurultuDoku(30),bumpScale:.01})); zem.rotation.x=-Math.PI/2; zem.receiveShadow=true; scene.add(zem);
    this.kule=saatKulesi(); scene.add(this.kule); Ses.zemin="tas";
    // çevredeki binalar (kafe doğu tarafta)
    const renkler=["#d8c3a5","#c9b6a0","#e3d5c0","#b8a68f","#cdbfae","#d1b49a"];
    const tabelalar=["FIRIN","ECZANE","KİTAPÇI","SİMİT","ÇİÇEKÇİ","OPTİK","LOKANTA","KIRTASİYE"];
    let k=0;
    for(const [x0,z0,ry,n] of [[-26,-30,0,6],[30,-30,-Math.PI/2,0],[-30,30,Math.PI/2,0],[-26,30,Math.PI,6]]){
      for(let i=0;i<n;i++){ const w=rnd(7,9.5), h=rnd(14,22), b=bina(w,h,9,renkler[k%renkler.length],tabelalar[k%tabelalar.length]); k++;
        b.position.set(x0+i*9.6,0,z0); b.rotation.y=ry; scene.add(b); } }
    for(const [x0,z0,ry] of [[-34,-18,Math.PI/2],[-34,-6,Math.PI/2],[-34,6,Math.PI/2],[-34,18,Math.PI/2],[34,-18,-Math.PI/2],[34,6,-Math.PI/2],[34,18,-Math.PI/2]]){
      const b=bina(rnd(9,11),rnd(15,21),9,renkler[k%renkler.length],tabelalar[k%tabelalar.length]); k++; b.position.set(x0,0,z0); b.rotation.y=ry; scene.add(b); }
    // kafe: doğu tarafta, meydana bakan
    const kafe=bina(11,17,9,"#e6d6bf","KAFE · KAHVALTI"); kafe.position.set(34,0,-6); kafe.rotation.y=-Math.PI/2; scene.add(kafe);
    const tente=new THREE.Mesh(new THREE.BoxGeometry(1.4,.08,8),new THREE.MeshStandardMaterial({map:(()=>{ const cc=document.createElement("canvas"); cc.width=256; cc.height=16; const xx=cc.getContext("2d"); for(let i=0;i<16;i++){ xx.fillStyle=i%2?"#f3ede2":"#8b2e2a"; xx.fillRect(i*16,0,16,16); } const tt=new THREE.CanvasTexture(cc); tt.encoding=THREE.sRGBEncoding; return tt; })(),roughness:.8}));
    tente.position.set(28.8,3.1,-6); tente.rotation.z=.25; scene.add(tente);
    const kapi=new THREE.Mesh(new THREE.PlaneGeometry(1.3,2.4),new THREE.MeshStandardMaterial({color:renk("#5a3b26"),roughness:.6})); kapi.position.set(29.48,1.2,-6); kapi.rotation.y=-Math.PI/2; scene.add(kapi);
    this.kapi=new THREE.Object3D(); this.kapi.position.set(28.6,0,-6); scene.add(this.kapi);
    for(const z of [-9,-3]){ const s=sandalye("#3a3a3a"); s.position.set(27.6,0,z); s.rotation.y=-Math.PI/2; scene.add(s); }
    // ağaçlar, banklar, lambalar, bayrak
    for(let i=0;i<14;i++){ const a=i/14*Math.PI*2; const r=i%2?13:17; const ag=ciplakAgac(rnd(.9,1.25)); ag.position.set(Math.cos(a)*r,0,Math.sin(a)*r); ag.rotation.y=rnd(0,6); scene.add(ag); }
    for(let i=0;i<8;i++){ const a=i/8*Math.PI*2+.2; const b=bank2(); b.position.set(Math.cos(a)*9,0,Math.sin(a)*9); b.rotation.y=-a-Math.PI/2; scene.add(b); }
    for(let i=0;i<10;i++){ const a=i/10*Math.PI*2; const l=lamba2(); l.position.set(Math.cos(a)*11,0,Math.sin(a)*11); scene.add(l); }
    const by=bayrak(12,3); by.position.set(-12,0,-14); scene.add(by);
    // güvercinler
    this.guvercinler=[]; for(let i=0;i<9;i++){ const gv=guvercin(); gv.position.set(rnd(-6,-2.5),0,rnd(3,6)); gv.rotation.y=rnd(0,6); gv.userData.f=rnd(0,6); scene.add(gv); this.guvercinler.push(gv); }
    // meydandan geçenler (kışlık koyu renkler)
    this.yayalar=[]; const koyu=["#2f3440","#3b2f2a","#24303a","#4a3e33","#2d2d33","#3d4436"];
    for(let i=0;i<9;i++){ const kiz=i%3===0; const c2=kalabalik(kiz?"michelle":"rpm",{ust:koyu[i%koyu.length],alt:koyu[(i+2)%koyu.length],anim:"walk",boy:rnd(.95,1.04),ton:kiz?["#efe6ff","#e6eef9","#f3e9e3"][i%3]:null}); if(!c2) continue;
      const r=rnd(14,20), a=rnd(0,6.28), hz=rnd(.8,1.15)*(i%2?1:-1); c2.userData.yol={r,a,hz}; c2.userData.hiz=1; scene.add(c2); this.yayalar.push(c2); }
    // karakterler: Kaan güneyden gelir, Kardelen kulenin dibinde
    this.kaan=karakter("kaan","kis"); this.kar=karakter("kardelen","kis");
    this.kaan.position.set(-3,0,26); this.kaan.rotation.y=Math.PI;
    this.kar.position.set(2.2,0,2.6); this.kar.rotation.y=.3;
    scene.add(this.kaan,this.kar); KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    Kamera.sinema=null; Kamera.aci=0; Kamera.mesafe=6.5; Kamera.yukseklik=2.6; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(-3,4,33);
    Ses.ton="sicak";
  },
  async meydan(){
    const K=this.kaan, D=this.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(10,2.6,13),new THREE.Vector3(0,10.5,0));
      await kameraNoktasi(s=>new THREE.Vector3(10-s*.7,2.6+s*.5,13-s*.4),new THREE.Vector3(0,11.75,1.2),3.6);
      await anlat("29 Ocak 2022. İzmit. Hava buz gibi.",2600);
      await anlat("Saat tam on bir. Saat kulesinin dibinde buluşacaktık.",2800);
      await kameraNoktasi(bas(K).add(new THREE.Vector3(1.4,.15,-2.2)),bas(K),2.2);
      await konus("kaan","Deri ceketi giydim, saçımı düzelttim… Ya beğenmezse? Sakin ol, sakin.",{uzak:1.4});
    });
    gorev("Saat kulesinin dibinde Kardelen'i bul");
    this.serbest=true; gizliKalpler(this,[[-11.2,1.0,-13.2,1]]);
    await kosul(()=>K.position.distanceTo(D.position)<7);
    this.serbest=false;
    await sahne(async()=>{
      K.userData.hiz=0; cevir(K,D.position);
      await kameraNoktasi(bas(K).add(new THREE.Vector3(-.5,.05,1.2).applyAxisAngle(new THREE.Vector3(0,1,0),K.rotation.y+Math.PI)),bas(D),1.4);
      ZAMAN_OLCEK=.35; Ses.efekt("kalp"); D.userData.bakNokta=bas(K); await bekle(500);
      D.rotation.y=Math.atan2(K.position.x-D.position.x,K.position.z-D.position.z); D.userData.gulumse=1;
      const p=parilti("#ffd0e0",2.6); p.position.copy(bas(D)); scene.add(p); setTimeout(()=>scene.remove(p),3800);
      await kameraNoktasi(bas(D).add(new THREE.Vector3(.35,.05,1.1).applyAxisAngle(new THREE.Vector3(0,1,0),D.rotation.y)),bas(D),2.4);
      await anlat("Haki montunun içinde, kulenin dibinde bekliyordu. Onu ilk gördüğüm an… Çarpıldım sanki.",3400);
      ZAMAN_OLCEK=1; Ses.efekt("kalp");
      const yon=K.position.clone().sub(D.position).setLength(1.05); await yuruHedef(K,D.position.clone().add(yon),1.6); yuzYuze(K,D);
      await konus("kardelen",["Ooo tam on bir 😄","Dakik adammış bu"],{gul:1});
      const c=await sec(["Dün gece söz verdim ya 😉","Seni bekletmek olmazdı."]);
      if(c===0){ await konus("kaan","Dün gece söz verdim ya 😉",{gul:.6}); await konus("kardelen",["Sözünü tutuyormuş bu","Not ettim kdkdkd"],{gul:1}); }
      else { await konus("kaan","Seni bekletmek olmazdı.",{gul:.5}); await konus("kardelen",["Kıyamam 🙂","Fotoğraflardakinden uzunsun bu arada"],{gul:1}); }
      await konus("kardelen",["Hava buz yaa","İyi ki montumu giydim"],{gul:.8});
      await konus("kaan","Deri ceket ısıtmıyormuş, bugün öğrendim 😅",{gul:.6});
      await konus("kardelen",["Üşüme sakın","Hadi kafeye girelim","Kahvaltı yapmadım daha, şurası çok güzel"],{gul:.9});
    });
    gorev("Kardelen'le kafeye yürüyün");
    this.serbest=true; this.birlikte=true;
    await etkBekle(this.kapi,"Kafeye gir",{mesafe:2.6,isaretY:2.3});
    this.serbest=false; this.birlikte=false; gorev(null);
    await gecis(async()=>{ katmanTemizle(); await this.kafeKur(); katmanTemizle(); ustDugmeler(); });
    await this.kafe();
  },
  async kafeKur(){
    this.faz="kafe"; this.t=0; ETK=[]; ICSAHNE=null; this.serbest=false; this.birlikte=false; this.buhar=[];
    const gy=new THREE.Vector3(-1,.55,.35).normalize();
    sahneKur({sis:"#3a2c22",sisYakin:25,sisUzak:80,ust:"#7f8fa3",ufuk:"#c9cfd6",alt:"#4a3d33",gunesYon:gy,isikYon:gy,gunesRenk:"#f6f2ea",isik:"#e9eef6",isikGuc:.8,zemin:"#4a3a2e",hemi:.55,dolgu:.35,dolguRenk:"#ffd6aa"});
    Ses.ortam("kalabalik",.45);
    const oda=new THREE.Group(); scene.add(oda); const W=10, D=8, H=3.3;
    const tahta=(()=>{ const c=document.createElement("canvas"); c.width=c.height=512; const x=c.getContext("2d"); for(let i=0;i<8;i++){ x.fillStyle=`hsl(26,${32+Math.random()*10}%,${26+Math.random()*9}%)`; x.fillRect(0,i*64,512,63); for(let k=0;k<30;k++){ x.fillStyle="rgba(0,0,0,.08)"; x.fillRect(Math.random()*512,i*64+Math.random()*60,40+Math.random()*80,1.2); } } const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(3,3); t.encoding=THREE.sRGBEncoding; return t; })();
    const z=new THREE.Mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshStandardMaterial({map:tahta,roughness:.6})); z.rotation.x=-Math.PI/2; z.receiveShadow=true; oda.add(z);
    const tav=new THREE.Mesh(new THREE.PlaneGeometry(W,D),mat("#3b2c22",{roughness:.9})); tav.rotation.x=Math.PI/2; tav.position.y=H; oda.add(tav);
    const sıva=mat("#e8dac4",{roughness:.95});
    const tugla=(()=>{ const c=document.createElement("canvas"); c.width=c.height=256; const x=c.getContext("2d"); x.fillStyle="#d8cfc2"; x.fillRect(0,0,256,256); for(let j=0;j<16;j++) for(let i=0;i<8;i++){ x.fillStyle=`hsl(${12+Math.random()*10},${40+Math.random()*15}%,${36+Math.random()*10}%)`; x.fillRect(i*32+(j%2)*16+1,j*16+1,30,14); } const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(3,1.4); t.encoding=THREE.sRGBEncoding; return t; })();
    const dv=(w,x,zz,ry,m)=>{ const p=new THREE.Mesh(new THREE.PlaneGeometry(w,H),m); p.position.set(x,H/2,zz); p.rotation.y=ry; p.receiveShadow=true; oda.add(p); };
    dv(W,0,-D/2,0,new THREE.MeshStandardMaterial({map:tugla,roughness:.9})); dv(W,0,D/2,Math.PI,sıva); dv(D,W/2,0,-Math.PI/2,sıva);
    // pencere duvarı (batı): büyük cam, dışarıda kış sokağı
    const pc=document.createElement("canvas"); pc.width=512; pc.height=256; const px=pc.getContext("2d"); const gg=px.createLinearGradient(0,0,0,256); gg.addColorStop(0,"#b7c4d3"); gg.addColorStop(1,"#d9dee4"); px.fillStyle=gg; px.fillRect(0,0,512,256);
    for(let i=0;i<7;i++){ px.fillStyle=["#c9b8a2","#b9a58c","#d3c4b0"][i%3]; const h=rnd(90,170); px.fillRect(i*76,256-h,70,h); px.fillStyle="#6c7681"; for(let j=0;j<5;j++) for(let k=0;k<3;k++) px.fillRect(i*76+8+k*20,256-h+12+j*26,12,15); }
    px.strokeStyle="#4b3b30"; px.lineWidth=3; for(let i=0;i<5;i++){ const x0=40+i*110; px.beginPath(); px.moveTo(x0,256); px.lineTo(x0,170); px.stroke(); for(let k=0;k<5;k++){ px.beginPath(); px.moveTo(x0,190+k*8); px.lineTo(x0+rnd(-26,26),160+k*6); px.stroke(); } }
    px.fillStyle="rgba(255,255,255,.28)"; px.fillRect(0,200,512,56);
    const pt=new THREE.CanvasTexture(pc); pt.encoding=THREE.sRGBEncoding;
    const cam=new THREE.Mesh(new THREE.PlaneGeometry(D-1,2.1),new THREE.MeshBasicMaterial({map:pt})); cam.position.set(-W/2+.02,1.65,0); cam.rotation.y=Math.PI/2; oda.add(cam);
    dv(D,-W/2-.01,0,Math.PI/2,sıva); cam.position.x=-W/2+.03;
    const cer=mat("#3b2a1f",{roughness:.6}); for(const [w,h,y,zz] of [[D-.8,.12,2.72,0],[D-.8,.12,.6,0],[.1,2.2,1.65,-3.5],[.1,2.2,1.65,3.5],[.08,2.2,1.65,0],[.08,2.2,1.65,-1.75],[.08,2.2,1.65,1.75]]){ const m=new THREE.Mesh(new THREE.BoxGeometry(.06,h,w),cer); m.position.set(-W/2+.05,y,zz); oda.add(m); }
    // tezgâh, kahve makinesi, raflar, saksılar
    const tez=new THREE.Mesh(new THREE.BoxGeometry(3.6,1.05,.7),mat("#5b3d2a",{roughness:.6})); tez.position.set(2.2,.525,-3.2); tez.castShadow=true; oda.add(tez);
    const tu=new THREE.Mesh(new THREE.BoxGeometry(3.7,.05,.8),mat("#d8d2c8",{roughness:.35})); tu.position.set(2.2,1.07,-3.2); oda.add(tu);
    const mak=new THREE.Mesh(new THREE.BoxGeometry(.7,.45,.45),mat("#b9bcc0",{metalness:.8,roughness:.3})); mak.position.set(1.3,1.32,-3.25); oda.add(mak);
    const vit=new THREE.Mesh(new THREE.BoxGeometry(1,.45,.5),new THREE.MeshStandardMaterial({color:renk("#ffffff"),transparent:true,opacity:.25,roughness:.05})); vit.position.set(3.1,1.32,-3.2); oda.add(vit);
    for(let i=0;i<4;i++){ const pas=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.09,16),mat(["#f2d7b5","#7a3b2a","#f6efe2","#d98ca1"][i])); pas.position.set(2.75+i*.24,1.17,-3.2); oda.add(pas); }
    for(const y of [1.7,2.2]){ const r=new THREE.Mesh(new THREE.BoxGeometry(3.4,.04,.28),mat("#4a3122")); r.position.set(2.2,y,-3.86); oda.add(r);
      for(let i=0;i<9;i++){ const k=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.2,10),mat(["#c8a675","#6d4a2f","#e1d1b0","#9b6f4a"][i%4],{roughness:.4})); k.position.set(.7+i*.37,y+.12,-3.86); oda.add(k); } }
    for(const [x,zz] of [[4.4,3.2],[-4.3,3.4],[4.4,-1.2]]){ const s=new THREE.Mesh(new THREE.CylinderGeometry(.2,.16,.4,12),mat("#a0583a")); s.position.set(x,.2,zz); oda.add(s); const b=new THREE.Mesh(new THREE.IcosahedronGeometry(.42,1),mat("#3f6b34",{flatShading:true})); b.position.set(x,.78,zz); oda.add(b); }
    // sarkıt lambalar
    for(const [x,zz] of [[-3.6,.6],[-1.2,2.4],[1.6,1.2],[-1.4,-1.6]]){ const kab=new THREE.Mesh(new THREE.ConeGeometry(.22,.22,16,1,true),mat("#2d2a27",{side:THREE.DoubleSide})); kab.position.set(x,2.45,zz); oda.add(kab);
      const ip=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.8,4),mat("#111")); ip.position.set(x,2.9,zz); oda.add(ip);
      const amp=new THREE.Mesh(new THREE.SphereGeometry(.06,10,8),new THREE.MeshStandardMaterial({color:renk("#fff2d6"),emissive:renk("#ffc070"),emissiveIntensity:2})); amp.position.set(x,2.36,zz); oda.add(amp);
      const L=new THREE.PointLight(renk("#ffc98a"),.9,6,1.6); L.position.set(x,2.25,zz); oda.add(L); }
    // masalar
    const masaK=(x,zz)=>{ const g=new THREE.Group(); const ust=new THREE.Mesh(new THREE.BoxGeometry(.9,.04,.8),mat("#7a5233",{roughness:.55})); ust.position.y=.76; g.add(ust);
      const ayak=new THREE.Mesh(new THREE.CylinderGeometry(.04,.06,.74,8),mat("#222")); ayak.position.y=.37; g.add(ayak); const tab=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.03,16),mat("#222")); tab.position.y=.015; g.add(tab);
      g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); g.position.set(x,0,zz); oda.add(g); return g; };
    this.masa=masaK(-3.75,.6); masaK(-1.2,2.4); masaK(1.6,1.2); masaK(-1.4,-1.6);
    for(const [x,zz,ry] of [[-1.2,1.85,0],[-1.2,2.95,Math.PI],[1.6,.65,0],[1.6,1.75,Math.PI],[-1.4,-2.15,0],[-1.4,-1.05,Math.PI]]){ const s=sandalye("#5b3d2a"); s.position.set(x,0,zz); s.rotation.y=ry; oda.add(s); }
    // bizim masa: pencere kenarı, karşılıklı
    const s1=sandalye("#5b3d2a"); s1.position.set(-3.75,0,1.22); s1.rotation.y=Math.PI; oda.add(s1);
    const s2=sandalye("#5b3d2a"); s2.position.set(-3.75,0,-.02); oda.add(s2);
    this.sofra=kahvaltiSofrasi(); this.sofra.position.set(-3.75,0,.6); oda.add(this.sofra);
    // karakterler oturuyor
    this.kaan=karakter("kaan","kis"); this.kar=karakter("kardelen","kis");
    this.kaan.position.set(-3.75,0,1.2); this.kaan.rotation.y=Math.PI; this.kar.position.set(-3.75,0,0); this.kar.rotation.y=0;
    for(const c of [this.kaan,this.kar]){ c.userData.otur=1; c.userData.oturY=.44; c.userData._otur=1; }
    scene.add(this.kaan,this.kar); KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    // tezgâhta iki müşteri
    for(const [x,ad] of [[1.1,"rpm"],[2.6,"michelle"]]){ const c=kalabalik(ad,{ust:"#3b3f48",alt:"#2a2d33",ton:ad==="michelle"?"#f3e6e0":null}); if(!c) continue; c.position.set(x,0,-2.5); c.rotation.y=Math.PI; scene.add(c); }
    Kamera.sinema=null; Kamera.hedef.set(-3.75,.9,.6);
  },
  // ÇAY DOLDURMA SİMÜLATÖRÜ: önce demlikten dem, sonra çaydanlıktan su. Basılı tut → demlik eğilir, akış hızlanır; bırak → durur.
  // hedef: tavşan kanı (dem oranı %28–48) ve ağızdan bir parmak boşluk (doluluk %80–93). taşarsa tabağa döker.
  async cayDoldur(){
    const S=this.sofra, dm=S.userData.demlik, b=S.userData.bardaklar[1], bK=S.userData.bardaklar[0];
    const p0=dm.position.clone(), r0=dm.rotation.z; const cayM=b.material;
    const gw=new THREE.Vector3(); b.getWorldPosition(gw);
    const kamP=gw.clone().add(new THREE.Vector3(.1,.16,.42)), kamB=gw.clone().add(new THREE.Vector3(-.07,.065,0));
    await kameraNoktasi(kamP,kamB,1.2);
    // bardak boş başlar
    let dem=0, su=0, akis=0, kaynak=null, tasma=0; const H=.88;
    const renkler=[[0,"#efe6d2"],[.15,"#d8892e"],[.38,"#a0270f"],[.65,"#5a1407"],[1,"#2a0a04"]];
    const renkAl=f=>{ for(let i=1;i<renkler.length;i++){ if(f<=renkler[i][0]){ const [a0,c0]=renkler[i-1], [a1,c1]=renkler[i]; return new THREE.Color(c0).lerp(new THREE.Color(c1),(f-a0)/(a1-a0)); } } return new THREE.Color(renkler[renkler.length-1][1]); };
    const renkAdi=f=>f<.2?"çok açık":f<.28?"açık":f<.48?"tavşan kanı":f<.62?"koyu":"zifiri";
    const akim=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,8,1,true),new THREE.MeshStandardMaterial({color:renk("#a0270f"),transparent:true,opacity:.85,roughness:.1})); akim.visible=false; scene.add(akim);
    const isl=new THREE.Mesh(new THREE.CircleGeometry(.05,20),new THREE.MeshStandardMaterial({color:renk("#8a3a1a"),transparent:true,opacity:0,roughness:.2})); isl.rotation.x=-Math.PI/2; isl.position.copy(gw).add(new THREE.Vector3(0,-.0035,0)); scene.add(isl);
    const ui=el(`<div class="sim"><div class="baslik">Çay doldur</div><div class="ipucu">Önce demlikten biraz dem koy, sonra çaydanlıktan suyla aç. Tavşan kanı olsun, ağzından bir parmak boşluk kalsın.</div>
      <div class="satir"><div class="olcek"><small><span>Doluluk</span><span class="dl">%0</span></small><div class="bar"><div class="hedef" style="left:80%;width:13%"></div><i class="dlb" style="width:0%"></i></div>
      <small style="margin-top:8px"><span>Renk</span><span class="rn">—</span></small><div class="bar"><div class="hedef" style="left:28%;width:20%"></div><i class="rnb" style="width:0%;background:linear-gradient(90deg,#d8892e,#a0270f,#2a0a04)"></i></div></div><div class="renk"></div></div>
      <div class="satir"><button class="tut" data-k="dem">🫖 Dem dök</button><button class="tut" data-k="su">💧 Su dök</button><button class="tamam">Tamam</button></div></div>`);
    katman.appendChild(ui);
    const ip=ui.querySelector(".ipucu"), dl=ui.querySelector(".dl"), dlb=ui.querySelector(".dlb"), rn=ui.querySelector(".rn"), rnb=ui.querySelector(".rnb"), rk=ui.querySelector(".renk");
    for(const t of ui.querySelectorAll("button.tut")){ const bas_=e=>{ e.preventDefault(); kaynak=t.dataset.k; t.classList.add("basili"); try{ t.setPointerCapture(e.pointerId); }catch(_){} if(!this._cayS){ this._cayS=true; Ses.efekt("cay"); } };
      const bit=()=>{ if(kaynak===t.dataset.k) kaynak=null; t.classList.remove("basili"); this._cayS=false; };
      t.addEventListener("pointerdown",bas_); t.addEventListener("pointerup",bit); t.addEventListener("pointercancel",bit); t.addEventListener("lostpointercapture",bit); }
    let bitti=false; ui.querySelector(".tamam").onclick=()=>{ bitti=true; };
    let son=performance.now(); const v1=new THREE.Vector3(), v2=new THREE.Vector3();
    await new Promise(res=>{ const adim=()=>{ if(!ui.isConnected) return; const t=performance.now(), dt=Math.min(.25,(t-son)/1000); son=t;
        const hedefAkis=kaynak?1:0; akis+=(hedefAkis-akis)*Math.min(1,dt*(kaynak?3.2:6));
        const top=dem+su;
        // demliği bardağın soluna getir ve eğ (emzik bardağa döner)
        const egim=-.15-akis*.85; dm.position.lerp(new THREE.Vector3(b.position.x-.2,p0.y+.1,b.position.z-.03),Math.min(1,dt*5)); dm.rotation.z+=(egim-dm.rotation.z)*Math.min(1,dt*8);
        if(akis>.04&&(kaynak||akis>.08)){ const k=kaynak||this._sonK||"su"; this._sonK=k; const hiz=(k==="dem"?.2:.27)*akis*akis;
          if(top<1.02){ if(k==="dem") dem+=hiz*dt; else su+=hiz*dt; } else { tasma+=hiz*dt; }
          const em=dm.children.find(c=>c.geometry&&c.geometry.parameters&&c.geometry.parameters.height===.1);
          if(em){ em.localToWorld(v1.set(0,.05,0)); v2.copy(gw); v2.y+=.008+Math.min(1,dem+su)*H*.1; const L=v1.distanceTo(v2); akim.visible=true; akim.position.copy(v1).lerp(v2,.5); akim.scale.set(.0016+.0024*akis,L,.0016+.0024*akis);
            akim.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v2.clone().sub(v1).normalize()); akim.material.color.copy(k==="dem"?renkAl(.92):renkAl(.03)); akim.material.opacity=k==="dem"?.92:.45; } }
        else akim.visible=false;
        const L=Math.min(1,dem+su), f=(dem+su)>.001?dem/(dem+su):0;
        b.scale.y=.02+L*H; b.visible=L>.004; cayM.color.copy(renkAl(f)); cayM.opacity=.5+.42*Math.min(1,f*2.2);
        isl.material.opacity=Math.min(.75,tasma*6);
        dl.textContent="%"+Math.round(L*100); dlb.style.width=(L*100)+"%"; rn.textContent=L>.02?renkAdi(f):"—"; rnb.style.width=(L>.02?f*100:0)+"%"; rk.style.background="#"+renkAl(f).getHexString();
        if(tasma>.01) ip.textContent="Taştı! Tabağa döküldü 😅"; else if(L>.93) ip.textContent="Dur dur, ağzına kadar geldi!"; else if(L>.02&&f>.62) ip.textContent="Çok koyu oldu, biraz su ekle."; else if(L>.3&&f<.2) ip.textContent="Çok açık, biraz dem lazım.";
        if(bitti){ akim.visible=false; res(); return; } requestAnimationFrame(adim); }; adim(); });
    ui.remove(); scene.remove(akim);
    const L=Math.min(1,dem+su), f=(dem+su)>.001?dem/(dem+su):0;
    // Kaan'ın kendi bardağı da dolar
    const t0=performance.now(); await new Promise(r=>{ const g_=()=>{ const k=Math.min(1,(performance.now()-t0)/900); bK.scale.y=.02+k*.85*H; if(k<1) requestAnimationFrame(g_); else r(); }; g_(); });
    dm.position.copy(p0); dm.rotation.z=r0;
    if(L<.05){ b.scale.y=.02+.86*H; cayM.color.copy(renkAl(.38)); cayM.opacity=.85; return {sonuc:"bos"}; }
    if(tasma>.01) return {sonuc:"tasti",L,f};
    const dolu=L>=.8&&L<=.93, renkOK=f>=.28&&f<=.48;
    return {sonuc:dolu&&renkOK?"tam":!renkOK?(f<.28?"acik":"koyu"):(L<.8?"az":"fazla"),L,f};
  },
  // küçük doğum günü pastası (1 Şubat'a üç gün var; Kaan hediyeyi hep erken verir) — mumu basılı tutup üfle
  async pastaSurprizi(){
    const K=this.kaan, D=this.kar, S=this.sofra; const g=new THREE.Group();
    const dilim=(r,h,y,renkH,rough=.7)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24,1,false,0,.75),mat(renkH,{roughness:rough})); m.position.y=y; g.add(m); return m; };
    dilim(.075,.022,.011,"#f2d7a8"); dilim(.075,.006,.025,"#c94f63",.5); dilim(.075,.02,.038,"#f5dfb2"); dilim(.076,.012,.054,"#fff6ee",.45);
    const cilek=new THREE.Mesh(new THREE.SphereGeometry(.012,10,8),mat("#d8213a",{roughness:.35})); cilek.scale.y=1.25; cilek.position.set(.03,.07,.025); g.add(cilek);
    const mum=new THREE.Mesh(new THREE.CylinderGeometry(.0028,.0028,.05,8),mat("#ffd6e2",{roughness:.6})); mum.position.set(.022,.085,.012); g.add(mum);
    const alev=parilti("#ffb04a",.12); alev.position.set(.022,.118,.012); g.add(alev);
    const alevC=new THREE.Mesh(new THREE.ConeGeometry(.0045,.016,10),new THREE.MeshBasicMaterial({color:renk("#ffd27a")})); alevC.position.set(.022,.12,.012); g.add(alevC);
    const tabak=new THREE.Mesh(new THREE.CylinderGeometry(.08,.065,.008,24),mat("#f8f6f1",{roughness:.35})); tabak.position.y=-.004; g.add(tabak);
    const b=S.userData.bardaklar[1]; g.position.set(b.position.x+.14,.775+.008,b.position.z-.1); g.rotation.y=2.3; S.add(g); // zeytin tabağının üstüne binmesin: onun önünde, çay tabağının yanında
    const pw=new THREE.Vector3(); g.getWorldPosition(pw);
    await kameraNoktasi(pw.clone().add(new THREE.Vector3(.35,.32,.55)),pw.clone().add(new THREE.Vector3(0,.08,0)),1.2);
    await konus("kaan","Doğum günün üç gün sonra ama… ben beklemem, haberin olsun.",{gul:.6});
    await konus("kardelen",["Ohaaa","Ne zaman aldın bunu","Delirdin mi 😍"],{gul:1});
    await konus("kaan","Hediyeyi erken vermek benim huyum 😄 Hadi, dilek tut.",{gul:.7});
    await kameraNoktasi(pw.clone().add(new THREE.Vector3(.26,.2,.4)),pw.clone().add(new THREE.Vector3(0,.09,0)),.7); // üflerken mum alevi karede (konuşma kamerası Kaan'da kalıyordu)
    const ui=el(`<div class="sim"><div class="baslik">Dilek tut</div><div class="ipucu">Gözlerini kapat, dileğini tut ve mumu üfle.</div><div class="satir"><button class="tut">🌬️ Basılı tut, üfle</button></div></div>`); katman.appendChild(ui);
    const btn=ui.querySelector("button"); let us=false, guc=0; const bas_=e=>{ e.preventDefault(); us=true; btn.classList.add("basili"); try{ btn.setPointerCapture(e.pointerId); }catch(_){} }, bit=()=>{ us=false; btn.classList.remove("basili"); };
    btn.addEventListener("pointerdown",bas_); btn.addEventListener("pointerup",bit); btn.addEventListener("pointercancel",bit); btn.addEventListener("lostpointercapture",bit);
    let son=performance.now(), sure=0;
    await new Promise(res=>{ const f=()=>{ if(!ui.isConnected) return; const t=performance.now(), dt=Math.min(.25,(t-son)/1000); son=t; sure+=dt;
        guc=us?Math.min(1,guc+dt*1.3):Math.max(0,guc-dt*2); const s_=1-guc*.85+Math.sin(t*.03)*.06*(1-guc);
        alev.scale.setScalar(.12*s_); alevC.scale.set(1+guc*.6,s_,1); alevC.rotation.z=guc*.6;
        if(guc>=1||sure>25){ res(); return; } requestAnimationFrame(f); }; f(); });
    ui.remove(); g.remove(alev); g.remove(alevC); Ses.efekt("parilti");
    const duman=tozlar(18,()=>({x:.022+rnd(-.004,.004),y:.12+rnd(0,.05),z:.012+rnd(-.004,.004)}),"#d8d8d8",.03); g.add(duman); setTimeout(()=>g.remove(duman),2600);
    D.userData.gulumse=1; await bekle(700);
    await konus("kardelen",["Dileğimi söylemem 😄","Ama içinde sen varsın"],{gul:1});
    await konus("kaan","İyi ki doğdun. Şimdiden 🙂",{gul:.8});
  },
  async kafe(){
    const K=this.kaan, D=this.kar; const m=this.masa.position;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(2.8,2.3,3.4),new THREE.Vector3(m.x,1,m.z));
      await kameraNoktasi(new THREE.Vector3(-1.5,1.65,2.6),new THREE.Vector3(m.x,1,m.z),3.4);
      await anlat("İçerisi sıcacıktı. Camlar buğulanmış, çaylar demlenmişti.",2800);
      await konus("kardelen",["Ellerim ısındı sonunda","Serpme kahvaltı geldi bak 😍"],{gul:.9});
      await konus("kaan","Çayları ben dolduruyorum, sen otur.",{gul:.5});
      await konus("kardelen","Bakalım asker çay koymayı biliyor mu 😄",{gul:1});
      const r=await this.cayDoldur();
      const tepki={tam:["Tavşan kanı!","Bu adam her şeyi biliyor 😄"],acik:["Açık olmuş ama","Senin elinden olsun, içerim 🙂"],koyu:["Bu ne koyuluk 😄","Nöbete mi kalkıyoruz"],az:["Yarım bardak mı bu","Cimri 😄"],fazla:["Ağzına kadar mı doldurulur şapşik 😄","Nasıl içeyim ben bunu"],tasti:["Tabağa döktün kdkdkd","Dur peçete vereyim"],bos:["Bardak boş kaldı 😄","Dur ben koyarım"]}[r.sonuc]||"Ellerine sağlık";
      await konus("kardelen",tepki,{gul:1});
      if(r.sonuc==="tam") await konus("kaan","Okulda ilk öğrettikleri şey 😄",{gul:.6});
      // sürpriz: doğum günü üç gün sonra ama hediye erken verilir (Kaan'ın huyu)
      await this.pastaSurprizi();
      await konus("kaan","Altı aydır her sabah ‘günaydın’ yazıyorum. İlk defa karşı karşıyayız.",{gul:.5});
      await konus("kardelen",["Telefondan başkaymış","Böyle daha güzel 🙂"],{gul:1});
      const c2=await sec(["Bundan sonraki bütün kahvaltılar bizim.","Bir dahaki sefere yeri ben seçiyorum."]);
      if(c2===0){ await konus("kaan","Bundan sonraki bütün kahvaltılar bizim.",{gul:.6}); await konus("kardelen",["Söz mü 🙂","Unutmam bak"],{gul:1}); }
      else { await konus("kaan","Bir dahaki sefere yeri ben seçiyorum.",{gul:.6}); await konus("kardelen",["Bir dahaki sefer olacak yani 😄","Tamamdır"],{gul:1}); }
      await kameraNoktasi(new THREE.Vector3(m.x+1.55,1.45,m.z+.2),new THREE.Vector3(m.x,1.05,m.z),1.6);
      const q=el(`<div class="qte"><button class="btn qte-btn">📷 Bu anı sakla</button></div>`); katman.appendChild(q);
      await new Promise(r=>{ q.querySelector("button").onclick=r; }); q.remove();
      await hatiraFoto("İlk kahvaltı · İzmit · 29 Ocak 2022");
      await bekle(1200);
      await anlat("Saatler nasıl geçti anlamadık. Sonra kalkıp gezmeye çıktık.",3000);
    });
    await gecis(async()=>{ katmanTemizle(); await this.sahilKur(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await this.sahil();
  },
  meydanGuncelle(dt){
    const K=this.kaan, D=this.kar, t=this.t; if(!K||!D||!this.yayalar||!this.kapi) return;
    const sinir=p=>{ p.x=clamp(p.x,-27,29.3); p.z=clamp(p.z,-24,27); const r=Math.hypot(p.x,p.z); if(r<2.3){ p.x*=2.3/r; p.z*=2.3/r; } p.y=0; };
    if(this.serbest&&!kilit){ yuru(K,dt,sinir,2.2);
      if(this.birlikte){ const sag=new THREE.Vector3(Math.cos(K.rotation.y),0,-Math.sin(K.rotation.y)); const h=K.position.clone().addScaledVector(sag,-.75);
        D.position.lerp(h,1-Math.pow(.004,dt)); let f=K.rotation.y-D.rotation.y; f=Math.atan2(Math.sin(f),Math.cos(f)); D.rotation.y+=f*Math.min(1,dt*6); D.userData.hiz=K.userData.hiz; D.userData.bakNokta=null; } }
    for(const y of this.yayalar||[]){ const u=y.userData, w=u.yol; w.a+=w.hz*dt/w.r; y.position.set(Math.cos(w.a)*w.r,0,Math.sin(w.a)*w.r); y.rotation.y=Math.atan2(-Math.sin(w.a)*Math.sign(w.hz),Math.cos(w.a)*Math.sign(w.hz)); u.hiz=Math.abs(w.hz); }
    for(const g of this.guvercinler||[]){ const f=g.userData.f+=dt*(3+Math.sin(g.userData.f)*.5); g.userData.bas.position.y=.15+Math.max(0,Math.sin(f*1.7))*-.05; g.rotation.y+=Math.sin(f*.13)*dt*.4;
      if(K.position.distanceTo(g.position)<1.6){ g.position.y=Math.min(g.position.y+dt*2.5,2.5); g.position.addScaledVector(g.position.clone().sub(K.position).setY(0).normalize(),dt*3); } else g.position.y=Math.max(0,g.position.y-dt*1.2); }
    nefesGuncelle(this,[K,D],dt);
    etkilesimGuncelle(K,this.btn);
    if(!Kamera.sinema) Kamera.hedef.lerp(this.birlikte?K.position.clone().lerp(D.position,.5):K.position,.1);
  }
});
// test kısayolu: bölüm 1'in bir evresine doğrudan geç (yalnız otomatik testler için)
B0.__test=async function(evre){ NESIL++; KOSUL=[]; HAREKET=[]; kilit=false; ETK=[];
  await gecis(async()=>{ katmanTemizle(); if(evre==="meydan") await this.meydanKur(); else if(evre==="kafe") await this.kafeKur(); else await this.sahilKur(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
  if(evre==="meydan") await this.meydan(); else if(evre==="kafe") await this.kafe(); else await this.sahil(); };
