/* ================= TÖREN ÜNİFORMASI (subay tören kıyafeti) ================= */
/* Kaynak: kalabalık modelinin yakalı ceketi. Papyon, gül ve yapraklar silinir, kuyruklar ceket boyuna indirilir,
   doku koyu yeşil ceket + beyaz gömlek + siyah kravat + kırmızı biyeli sarı omuz kayışı ve kemer olarak pişirilmiştir.
   Öğrenciler ceketi doğrudan giyer; Kaan'a kemik eşlemesiyle aktarılır (iki iskeletin duruş farkı düzeltilerek). */
const TU={};
// bağlama pozları: iki iskeletin eklem konumları (model uzayı, metre)
function kaynakMesh(k,desen){ let r=null; AVATAR[k].sahne.traverse(o=>{ if(!r&&o.isSkinnedMesh&&desen.test(o.material.name||o.name)) r=o; }); return r; }
function bindPoz(k){
  if(bindPoz[k]) return bindPoz[k];
  const sm=kaynakMesh(k,k==="rpm"?/Outfit_Top/:/^outfit$|AvatarBody/); const o={};
  sm.skeleton.bones.forEach((b,i)=>{ const M=sm.bindMatrix.clone().multiply(sm.skeleton.boneInverses[i].clone().invert()); o[b.name.replace(/^mixamorig/,"")]={p:new THREE.Vector3().setFromMatrixPosition(M),i}; });
  return bindPoz[k]={sm,o};
}
const ESLEM_SONRAKI={Hips:"Spine",Spine:"Spine1",Spine1:"Spine2",Spine2:"Neck",Neck:"Head",Head:"HeadTop_End",Shoulder:"Arm",Arm:"ForeArm",ForeArm:"Hand",Hand:"HandMiddle1",UpLeg:"Leg",Leg:"Foot",Foot:"ToeBase",ToeBase:"Toe_End"};
function sonrakiEklem(ad){ const m=ad.match(/^(Left|Right)?(.*)$/), s=m[1]||"", b=m[2]; const t=ESLEM_SONRAKI[b];
  if(t) return (s&&!/^(Spine|Neck|Head)/.test(t)?s:"")+t;
  const f=b.match(/^Hand(Thumb|Index|Middle|Ring|Pinky)(\d)$/); if(f&&+f[2]<4) return s+"Hand"+f[1]+(+f[2]+1); return null; }
// kaynak modelin bağlama uzayındaki noktayı hedef karakterin "ad" kemiğinin yerel uzayına taşıyan matris.
// Kemik yönü farkı (A-poz/T-poz) en kısa yay dönüşüyle, boy farkı kemik boyunca, beden farkı dik yönde ölçekle düzeltilir.
const ESLEM_ON={};
function eslemeMatris(kaynakAd,hedefAd,ad,ayar){
  const anah=kaynakAd+">"+hedefAd+">"+ad+">"+(ayar&&ayar.ad||""); if(ESLEM_ON[anah]) return ESLEM_ON[anah];
  const K=bindPoz(kaynakAd), H=bindPoz(hedefAd); const a=K.o[ad], h=H.o[ad]; if(!a||!h) return null;
  let s=sonrakiEklem(ad); while(s&&!(K.o[s]&&H.o[s])) s=sonrakiEklem(s);
  const R=new THREE.Matrix4(), S=new THREE.Matrix4(); let g=(ayar&&ayar.en&&ayar.en(ad))||1;
  if(s){ const dK=K.o[s].p.clone().sub(a.p), dH=H.o[s].p.clone().sub(h.p); let f=dH.length()/Math.max(1e-6,dK.length()); f=Math.min(1.35,Math.max(.75,f));
    if(ayar&&ayar.boy) f=ayar.boy(ad,f); dK.normalize(); dH.normalize();
    R.makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(dK,dH));
    const d=dK, k=f-g; S.set(g+k*d.x*d.x,k*d.x*d.y,k*d.x*d.z,0, k*d.y*d.x,g+k*d.y*d.y,k*d.y*d.z,0, k*d.z*d.x,k*d.z*d.y,g+k*d.z*d.z,0, 0,0,0,1); }
  else S.makeScale(g,g,g);
  const M=new THREE.Matrix4().makeTranslation(-a.p.x,-a.p.y,-a.p.z).premultiply(S).premultiply(R).premultiply(new THREE.Matrix4().makeTranslation(h.p.x,h.p.y,h.p.z));
  M.premultiply(H.sm.bindMatrix.clone().invert()).premultiply(H.sm.skeleton.boneInverses[h.i]);
  return ESLEM_ON[anah]=M;
}
// kaynak bağlama uzayında kurulmuş bir parçayı hedef karakterin kemiğine bağla
function parcaBagla(hedefKemik,kaynakAd,hedefAd,kemikAd,nesne,ayar){
  const M=eslemeMatris(kaynakAd,hedefAd,kemikAd,ayar), b=hedefKemik[kemikAd]; if(!M||!b) return null;
  const sar=new THREE.Group(); sar.matrixAutoUpdate=false; sar.matrix.copy(M); sar.add(nesne); b.add(sar); return sar;
}
// bağlı bileşenler (konumu aynı köşeler birleştirilerek)
function bilesenBul(geo){
  const P=geo.attributes.position, I=geo.index.array, n=P.count, anah=new Map(), kok=new Int32Array(n);
  for(let i=0;i<n;i++){ const k=Math.round(P.getX(i)*2000)+","+Math.round(P.getY(i)*2000)+","+Math.round(P.getZ(i)*2000); let r=anah.get(k); if(r===undefined){ r=i; anah.set(k,i); } kok[i]=r; }
  const par=new Int32Array(n); for(let i=0;i<n;i++) par[i]=i;
  const bul=x=>{ while(par[x]!==x){ par[x]=par[par[x]]; x=par[x]; } return x; };
  for(let t=0;t<I.length;t+=3){ const a=bul(kok[I[t]]); par[bul(kok[I[t+1]])]=a; par[bul(kok[I[t+2]])]=a; }
  const tri=new Int32Array(I.length/3), G=new Map(), v=new THREE.Vector3();
  for(let t=0;t<I.length/3;t++){ const r=bul(kok[I[t*3]]); let g=G.get(r); if(!g){ g={id:G.size,n:0,min:new THREE.Vector3(1e9,1e9,1e9),max:new THREE.Vector3(-1e9,-1e9,-1e9)}; G.set(r,g); }
    g.n++; tri[t]=g.id; for(let k=0;k<3;k++){ v.fromBufferAttribute(P,I[t*3+k]); g.min.min(v); g.max.max(v); } }
  const L=[...G.values()]; L.forEach(g=>{ g.c=g.min.clone().add(g.max).multiplyScalar(.5); g.boy=g.max.clone().sub(g.min); });
  return {tri,L};
}
function tuDokuYukle(ad){ return new Promise(r=>{ new THREE.TextureLoader().load(MODEL_KOK+ad,t=>{ t.flipY=false; t.encoding=THREE.sRGBEncoding; t.anisotropy=4; t.__kalici=true; r(t); },undefined,()=>r(null)); }); }
// rpm ceketinden giyilebilir ceket ağı: papyon/gül silinir, düğmeler ayrı grup, gömlek yakası alçaltılır, etek "kes" yüksekliğinde biter
function ceketGeoYap(kes){
  const sm=kaynakMesh("rpm",/Outfit_Top/); const geo=sm.geometry.clone(); const {tri,L}=bilesenBul(geo);
  const ceketG=L.reduce((a,b)=>b.n>a.n?b:a,L[0]);
  const sil=new Set(), altin=new Set();
  for(const g of L){ const c=g.c, b=g.boy, mx=Math.max(b.x,b.y,b.z);
    if(Math.abs(c.x)<.05&&c.y>1.48&&c.y<1.6&&b.y<.1&&c.z>.04) sil.add(g.id);            // papyon ve düğümü
    else if(c.x<-.07&&c.y>1.33&&c.y<1.5&&c.z>.04&&mx<.16) sil.add(g.id);                 // gül ve yaprakları
    else if(mx<.03) altin.add(g.id); }                                                     // düğmeler
  const I=geo.index.array, kumasI=[], altinI=[], kumasK=[];
  for(let t=0;t<I.length/3;t++){ const id=tri[t]; if(sil.has(id)) continue; if(altin.has(id)) altinI.push(I[t*3],I[t*3+1],I[t*3+2]); else { kumasI.push(I[t*3],I[t*3+1],I[t*3+2]); kumasK.push(id); } }
  const gomlekG=L.filter(g=>Math.abs(g.c.x)<.04&&g.c.y>1.4&&g.n>300&&g.boy.y>.2).map(g=>g.id), yelekG=L.filter(g=>Math.abs(g.c.x)<.03&&g.boy.y>.3&&g.id!==ceketG.id&&!gomlekG.includes(g.id)).map(g=>g.id);
  const P=geo.attributes.position;
  { const vs=new Set(); for(let t=0;t<I.length/3;t++) if(gomlekG.includes(tri[t])) for(let k=0;k<3;k++) vs.add(I[t*3+k]);
    for(const i of vs){ const y=P.getY(i); if(y>1.565) P.setY(i,1.565+(y-1.565)*.42); } }
  const ceketV=new Set(); for(let t=0;t<I.length/3;t++) if(tri[t]===ceketG.id) for(let k=0;k<3;k++) ceketV.add(I[t*3+k]);
  for(const i of ceketV){ const y=P.getY(i); if(y<kes) P.setY(i,kes-(kes-y)*.04); }
  geo.setIndex([...kumasI,...altinI]); geo.clearGroups(); geo.addGroup(0,kumasI.length,0); geo.addGroup(kumasI.length,altinI.length,1);
  geo.computeVertexNormals(); geo.computeBoundingSphere();
  return {geo,kumasK,govdeK:new Set([ceketG.id,...yelekG]),sm,sil:sil.size,altin:altin.size};
}
async function torenHazirla(){
  if(TU.hazir) return TU;
  const [ceket,pant,kaanAlt,kaanGovdeE,olcu,mKiyafet,mGovde]=await Promise.all([...["tu_ceket.jpg","tu_pantolon.jpg","kaan_alt.jpg","kaan_govde_eldiven.jpg"].map(tuDokuYukle),fetch(MODEL_KOK+"tu_olcu.json").then(r=>r.json()).catch(()=>null),tuDokuYukle("kardelen_mezun_kiyafet.jpg"),tuDokuYukle("kardelen_mezun_govde.jpg")]);
  const kaanGovde=kaanGovdeE||await tuDokuYukle("kaan_govde2.jpg"); TU.mezun={kiyafet:mKiyafet,govde:mGovde};
  const C=ceketGeoYap(.9), sm=C.sm;
  const kumasM=new THREE.MeshStandardMaterial({map:ceket||sm.material.map,roughness:.82,metalness:0,envMapIntensity:.5,skinning:true}); kumasM.userData.kalici=true;
  const altinM=ALTIN(); altinM.skinning=true; altinM.userData.kalici=true;
  Object.assign(TU,{hazir:true,geo:C.geo,kumasK:C.kumasK,govdeK:C.govdeK,mats:[kumasM,altinM],ceket,pant,kaanAlt,kaanGovde,olcu,sm,silinen:C.sil,altinSay:C.altin});
  return TU;
}
// kış (29 Ocak 2022): Kaan deri ceket, Kardelen haki mont
async function kisHazirla(){
  if(TU.kis) return TU.kis;
  const [deri,mont,kaanGovde,karGovde]=await Promise.all(["deri_ceket.jpg","haki_mont.jpg","kaan_govde_koyu.jpg","kardelen_govde_haki.jpg"].map(tuDokuYukle));
  const sm=kaynakMesh("rpm",/Outfit_Top/);
  const dM=new THREE.MeshStandardMaterial({map:deri||sm.material.map,roughness:.4,metalness:.06,envMapIntensity:.95,skinning:true});
  const dD=new THREE.MeshStandardMaterial({color:renk("#2b2b2d"),roughness:.3,metalness:.8,skinning:true});
  const mM=new THREE.MeshStandardMaterial({map:mont||sm.material.map,roughness:.86,metalness:0,envMapIntensity:.45,skinning:true});
  const mD=new THREE.MeshStandardMaterial({color:renk("#4a3526"),roughness:.5,metalness:.1,skinning:true});
  [dM,dD,mM,mD].forEach(m=>m.userData.kalici=true);
  TU.sm=TU.sm||sm;
  return TU.kis={deriGeo:ceketGeoYap(.97).geo,montGeo:ceketGeoYap(.86).geo,deriMats:[dM,dD],montMats:[mM,mD],kaanGovde,karGovde};
}
// Kaan'a ceketi giydir (kemik eşlemeli yeni deri-kemik ağı)
const KAAN_ESLEM={ad:"kaan",en:ad=>/^(Hips|Spine)$/.test(ad)?1.06:/^Spine[12]$/.test(ad)?1.09:/Neck/.test(ad)?1.1:/Shoulder/.test(ad)?1.06:/Arm/.test(ad)?1.08:1};
const KAR_ESLEM={ad:"kardelen",en:ad=>/^Hips$/.test(ad)?1.12:/^Spine$/.test(ad)?1.08:/^Spine1$/.test(ad)?1.12:/^Spine2$/.test(ad)?1.1:/Neck/.test(ad)?1.08:/Shoulder/.test(ad)?.98:/Arm/.test(ad)?1.04:1};
function ceketAktar(model,kemik,kim,ayar,geo,mats){
  const sm=TU.sm||kaynakMesh("rpm",/Outfit_Top/), bones=[], inv=[];
  sm.skeleton.bones.forEach(b=>{ const ad=b.name.replace(/^mixamorig/,""); let kb=kemik[ad];
    if(!kb){ let p=b.parent; while(p&&!kemik[p.name.replace(/^mixamorig/,"")]) p=p.parent; kb=kemik[p?p.name.replace(/^mixamorig/,""):"Hips"]; }
    bones.push(kb); inv.push(eslemeMatris("rpm",kim,ad,ayar||KAAN_ESLEM)||new THREE.Matrix4()); });
  const m=new THREE.SkinnedMesh(geo||TU.geo,mats||TU.mats); m.name="ceket"; m.frustumCulled=false; m.castShadow=true; m.userData.kalici=true;
  model.add(m); m.bind(new THREE.Skeleton(bones,inv),new THREE.Matrix4());
  return m;
}
/* ---------- altın örgülü apolet ve kemer tokası ---------- */
function apoletDoku(){
  if(apoletDoku.t) return apoletDoku.t;
  const c=document.createElement("canvas"); c.width=256; c.height=128; const x=c.getContext("2d");
  const g=x.createLinearGradient(0,0,0,128); g.addColorStop(0,"#8a6524"); g.addColorStop(.5,"#e6c56e"); g.addColorStop(1,"#8a6524"); x.fillStyle=g; x.fillRect(0,0,256,128);
  // örgü: çapraz bükümlü kordonlar
  for(let r=0;r<4;r++){ const y0=10+r*28; for(let i=-2;i<20;i++){ const x0=i*15+(r%2)*7;
    const gg=x.createLinearGradient(x0,y0,x0+12,y0+24); gg.addColorStop(0,"#7a5a1e"); gg.addColorStop(.45,"#fff0b0"); gg.addColorStop(1,"#80601f");
    x.fillStyle=gg; x.beginPath(); x.ellipse(x0+6,y0+12,5,13,-.6,0,Math.PI*2); x.fill(); } }
  x.strokeStyle="rgba(60,40,10,.6)"; x.lineWidth=3; x.strokeRect(1.5,1.5,253,125);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.__kalici=true; apoletDoku.t=t; return t;
}
function apoletYap(){
  const g=new THREE.Group(); const L=.1, Wd=.048, h=.007;
  const sh=new THREE.Shape(); sh.moveTo(-L/2,-Wd/2); sh.lineTo(L/2-Wd/2,-Wd/2); sh.absarc(L/2-Wd/2,0,Wd/2,-Math.PI/2,Math.PI/2,false); sh.lineTo(-L/2,Wd/2); sh.lineTo(-L/2,-Wd/2);
  const geo=new THREE.ExtrudeGeometry(sh,{depth:h,bevelEnabled:true,bevelThickness:.002,bevelSize:.002,bevelSegments:2}); geo.rotateX(-Math.PI/2);
  // UV: üst yüze örgü dokusu
  const P=geo.attributes.position, uv=geo.attributes.uv; for(let i=0;i<P.count;i++) uv.setXY(i,(P.getX(i)+L/2)/L,(P.getZ(i)+Wd/2)/Wd);
  const m=new THREE.MeshStandardMaterial({map:apoletDoku(),metalness:.75,roughness:.35,envMapIntensity:1.2}); m.userData.kalici=true;
  const a=new THREE.Mesh(geo,m); a.castShadow=true; g.add(a);
  const d=new THREE.Mesh(new THREE.SphereGeometry(.0065,12,8,0,Math.PI*2,0,Math.PI/2),ALTIN()); d.position.set(-L/2+.011,h+.002,0); g.add(d);
  return g;
}
function tokaDoku(){
  if(tokaDoku.t) return tokaDoku.t;
  const c=document.createElement("canvas"); c.width=c.height=128; const x=c.getContext("2d");
  const g=x.createLinearGradient(0,0,128,128); g.addColorStop(0,"#d9d3c2"); g.addColorStop(.5,"#9c9482"); g.addColorStop(1,"#cfc6ae"); x.fillStyle=g; x.fillRect(0,0,128,128);
  x.strokeStyle="#6d6556"; x.lineWidth=6; x.strokeRect(5,5,118,118); x.strokeStyle="#efe9d8"; x.lineWidth=2; x.strokeRect(11,11,106,106);
  x.fillStyle="#efe9d8"; x.beginPath(); x.arc(56,64,27,0,Math.PI*2); x.fill(); x.globalCompositeOperation="destination-out"; x.beginPath(); x.arc(64,64,22,0,Math.PI*2); x.fill(); x.globalCompositeOperation="source-over";
  x.fillStyle="#efe9d8"; x.beginPath(); for(let i=0;i<10;i++){ const r=i%2?5:12, a=-Math.PI/2+i*Math.PI/5; x.lineTo(84+Math.cos(a)*r,64+Math.sin(a)*r); } x.closePath(); x.fill();
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.__kalici=true; tokaDoku.t=t; return t;
}
function tokaYap(){ const m=new THREE.Mesh(new THREE.BoxGeometry(.068,.052,.006),[0,0,0,0,1,0].map(i=>{ const q=new THREE.MeshStandardMaterial(i?{map:tokaDoku(),metalness:.8,roughness:.38,envMapIntensity:1.1}:{color:renk("#8f8775"),metalness:.8,roughness:.4}); q.userData.kalici=true; return q; })); m.castShadow=true; return m; }
// rpm ceketinin omuz sırtı (apolet yeri): 90. yüzdelik yükseklikten doğru uydur
function omuzSirti(){
  if(TU.omuz) return TU.omuz;
  const P=TU.geo.attributes.position, I=TU.geo.index.array, n=TU.geo.groups[0].count; const vs=new Set(); for(let k=0;k<n;k++) vs.add(I[k]);
  const sonuc={};
  for(const sx of [1,-1]){ const X=[],Y=[],Z=[];
    for(let xq=.085;xq<=.1451;xq+=.015){ const ys=[], zs=[]; for(const i of vs){ const x=P.getX(i), z=P.getZ(i); if(Math.abs(x-sx*xq)<.008&&z>-.075&&z<.005){ ys.push(P.getY(i)); zs.push(z); } }
      if(ys.length<3) continue; ys.sort((a,b)=>a-b); zs.sort((a,b)=>a-b); X.push(sx*xq); Y.push(ys[ys.length-1]); Z.push(zs[zs.length>>1]); }
    const mx=X.reduce((a,b)=>a+b,0)/X.length, my=Y.reduce((a,b)=>a+b,0)/Y.length, mz=Z.reduce((a,b)=>a+b,0)/Z.length;
    let sxy=0,sxx=0; X.forEach((x,i)=>{ sxy+=(x-mx)*(Y[i]-my); sxx+=(x-mx)*(x-mx); }); const b=sxx?sxy/sxx:0;
    sonuc[sx]={c:new THREE.Vector3(sx*.122,my+b*(sx*.122-mx)+.004,mz),egim:Math.max(-.9,Math.min(.9,b))}; }
  return TU.omuz=sonuc;
}
// tören parçalarını (apolet, toka, kın) bir karaktere tak; kaynak uzayı: rpm ceketi
function torenAksesuar(kemik,hedefAd,ayar){
  const O=omuzSirti(), sonuc={};
  for(const sx of [1,-1]){ const o=O[sx]; const a=apoletYap();
    const yon=new THREE.Vector3(sx,o.egim*sx,0).normalize(); const nrm=new THREE.Vector3(-yon.y,yon.x,0); if(nrm.y<0) nrm.negate();
    const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(yon,nrm,yon.clone().cross(nrm)));
    a.quaternion.copy(q); a.position.copy(o.c);
    parcaBagla(kemik,"rpm",hedefAd,sx>0?"LeftShoulder":"RightShoulder",a,ayar); sonuc[sx>0?'apS':'apD']=a; }
  const olc=TU.olcu||{toka:[0,1.095,.135],kin:[.168,1.02,.02]}; const kinP=[.19,1.0,-.025];
  const t=tokaYap(); t.position.set(olc.toka[0],olc.toka[1],olc.toka[2]+.003); parcaBagla(kemik,"rpm",hedefAd,"Spine",t,ayar);
  const kin=kinYap(); kin.position.set(kinP[0],kinP[1],kinP[2]);
  kin.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),new THREE.Vector3(.07,-1,-.2).normalize());
  parcaBagla(kemik,"rpm",hedefAd,"Hips",kin,ayar); sonuc.kin=kin;
  return sonuc;
}
/* ---------- kel kalabalık modeline saç kabuğu (kafa derisini 5 mm dışa iten alt ağ) ---------- */
function sacKabugu(){
  if(TU.sacGeo) return TU.sacGeo;
  const hm=kaynakMesh("rpm",/Wolf3D_Skin/); const geo=hm.geometry.clone(); const P=geo.attributes.position, N=geo.attributes.normal, I=geo.index.array;
  const bp=bindPoz("rpm").o; const goz=bp.LeftEye?bp.LeftEye.p:new THREE.Vector3(0,1.69,.08), kafa=bp.Head.p;
  const sac=new Uint8Array(P.count);
  for(let i=0;i<P.count;i++){ const x=P.getX(i), y=P.getY(i), z=P.getZ(i), dy=y-goz.y, ax=Math.abs(x);
    let h=dy>.052 || (z<goz.z-.065&&dy>-.012) || (z<goz.z-.1&&dy>-.07);
    if(z>goz.z-.04&&dy<.058) h=false;                      // yüz ve alın
    if(ax>.066&&dy<.012&&dy>-.065&&z>goz.z-.125) h=false;  // kulaklar
    if(y<kafa.y-.05) h=false;
    sac[i]=h?1:0; }
  const yeni=[]; for(let t=0;t<I.length;t+=3) if(sac[I[t]]&&sac[I[t+1]]&&sac[I[t+2]]) yeni.push(I[t],I[t+1],I[t+2]);
  for(let i=0;i<P.count;i++) P.setXYZ(i,P.getX(i)+N.getX(i)*.0055,P.getY(i)+N.getY(i)*.0055,P.getZ(i)+N.getZ(i)*.0055);
  geo.setIndex(yeni); geo.computeBoundingSphere(); TU.sacGeo=geo; return geo;
}
const SAC_RENK=["#16110d","#1f1712","#2a1e15","#120f0d","#36271b","#3f3024"];
function sacEkle(m,renkH){
  let bas=null; m.traverse(o=>{ if(!bas&&o.isSkinnedMesh&&/Wolf3D_Skin/.test(o.material.name)) bas=o; }); if(!bas) return;
  const mt=new THREE.MeshStandardMaterial({color:renk(renkH||SAC_RENK[(Math.random()*SAC_RENK.length)|0]),roughness:.78,metalness:0,skinning:true,envMapIntensity:.4});
  const s=new THREE.SkinnedMesh(sacKabugu(),mt); s.frustumCulled=false; bas.parent.add(s); s.bind(bas.skeleton,bas.bindMatrix);
}
// öğrenci: aynı tören üniforması
function ogrenciGiydir(m,kemik){
  let ust=null;
  m.traverse(o=>{ if(!o.isMesh) return; const n=o.material&&o.material.name||"";
    if(/Outfit_Top/.test(n)){ o.geometry=TU.geo; o.material=TU.mats; ust=o; }
    else if(/Outfit_Bottom/.test(n)&&TU.pant){ o.material=o.material.clone(); o.material.map=TU.pant; o.material.color=new THREE.Color(1,1,1); o.material.roughness=.86; o.material.userData.kalici=false; }
    else if(/Outfit_Footwear/.test(n)){ o.material=o.material.clone(); o.material.map=null; o.material.color=renk("#141414"); o.material.roughness=.28; o.material.metalness=.15; o.material.userData.kalici=false; }
    else if(/Beard/.test(n)) o.visible=false; });
  if(ust) cikartmaEkle(ust);
  return torenAksesuar(kemik,"rpm");
}
// Kaan: tişört gizlenir, pantolon/ayakkabı ve kollar boyanır, ceket ve aksesuarlar aktarılır
function kaanGiydir(m,kemik,kim){
  m.traverse(o=>{ if(!o.isMesh||!o.material) return; const n=o.material.name;
    if(n==="outfit"){ ustGizle(o,"kaan"); const c=o.material.clone(); if(TU.kaanAlt) c.map=TU.kaanAlt; c.roughness=.84; c.userData.kalici=true; o.material=c; }
    else if(n==="AvatarBody"&&TU.kaanGovde){ const c=o.material.clone(); c.map=TU.kaanGovde; c.userData.kalici=true; o.material=c; } });
  const ceket=ceketAktar(m,kemik,kim); cikartmaEkle(ceket);
  const ak=torenAksesuar(kemik,kim,KAAN_ESLEM);
  return {ceket,kin:ak.kin};
}
// sivil kalabalık: hazır modelin smokini yerine günlük görünüm — gül ve papyon silinir, yelek+gömlek tek renk kazak olur
const KAZAK_RENK=["#d9d2c5","#8a8f96","#3a4256","#6b4a3a","#e9e4da","#4a5a4a","#7a2236","#c9b48a"];
function sivilDuzelt(m,resmi){
  if(resmi){ // balo/nişan/tören: takım elbise ve papyon kalır, yalnız gül silinir
    if(!TU.resmiGeo){ const sm=kaynakMesh("rpm",/Outfit_Top/); const geo=sm.geometry.clone(), {tri,L}=bilesenBul(geo), I=geo.index.array, yeni=[];
      for(let t=0;t<I.length/3;t++){ const g=L[tri[t]], c=g.c, b=g.boy; if(c.x<-.07&&c.y>1.33&&c.y<1.5&&c.z>.04&&Math.max(b.x,b.y,b.z)<.16) continue; yeni.push(I[t*3],I[t*3+1],I[t*3+2]); }
      geo.setIndex(yeni); TU.resmiGeo=geo; }
    m.traverse(o=>{ if(o.isMesh&&/Outfit_Top/.test(o.material&&o.material.name||"")) o.geometry=TU.resmiGeo; }); return; }
  if(!TU.sivilGeo){ const sm=kaynakMesh("rpm",/Outfit_Top/); const geo=sm.geometry.clone(), {tri,L}=bilesenBul(geo), I=geo.index.array, dis=[], ic=[];
    const ceketG=L.reduce((a,b)=>b.n>a.n?b:a,L[0]);
    const icG=new Set(L.filter(g=>g.id!==ceketG.id&&Math.abs(g.c.x)<.04&&g.boy.y>.2&&g.n>200).map(g=>g.id));
    for(let t=0;t<I.length/3;t++){ const g=L[tri[t]], c=g.c, b=g.boy;
      if(c.x<-.07&&c.y>1.33&&c.y<1.5&&c.z>.04&&Math.max(b.x,b.y,b.z)<.16) continue;      // gül
      if(Math.abs(c.x)<.05&&c.y>1.48&&c.y<1.6&&b.y<.1&&c.z>.04) continue;                 // papyon
      (icG.has(g.id)?ic:dis).push(I[t*3],I[t*3+1],I[t*3+2]); }
    geo.setIndex([...dis,...ic]); geo.clearGroups(); geo.addGroup(0,dis.length,0); geo.addGroup(dis.length,ic.length,1); TU.sivilGeo=geo; }
  m.traverse(o=>{ if(!o.isMesh||!/Outfit_Top/.test(o.material&&o.material.name||"")) return; o.geometry=TU.sivilGeo; const dis=o.material;
    const ic=new THREE.MeshStandardMaterial({color:renk(KAZAK_RENK[(Math.random()*KAZAK_RENK.length)|0]),roughness:.93,metalness:0,skinning:true,normalMap:dis.normalMap||null,envMapIntensity:.5}); ic.userData.kalici=false;
    o.material=[dis,ic]; });
}
/* ---------- çıkartmalar: omuz kayışı (sağ omuzdan sol kalçaya) ve sol göğüs rozetleri ---------- */
// Ceketin dokusu sağ-sol aynalı olduğundan asimetrik ayrıntılar ayrı, yüzeye 2 mm yapışık deri-kemik ağlarıyla çizilir.
function kayisDoku(){
  if(kayisDoku.t) return kayisDoku.t;
  const c=document.createElement("canvas"); c.width=256; c.height=64; const x=c.getContext("2d"); x.clearRect(0,0,256,64);
  const y0=4, y1=60; const g=x.createLinearGradient(0,y0,0,y1); g.addColorStop(0,"#9b7a35"); g.addColorStop(.5,"#d4ad58"); g.addColorStop(1,"#9b7a35");
  x.fillStyle=g; x.fillRect(0,y0,256,y1-y0);
  for(let i=0;i<256;i+=4){ x.fillStyle="rgba(120,90,30,.22)"; x.fillRect(i,y0,1.5,y1-y0); }
  x.fillStyle="#a3252c"; x.fillRect(0,y0+3,256,4); x.fillRect(0,y1-7,256,4);
  x.fillStyle="rgba(40,25,10,.55)"; x.fillRect(0,y0,256,1.5); x.fillRect(0,y1-1.5,256,1.5);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.wrapS=THREE.RepeatWrapping; t.wrapT=THREE.ClampToEdgeWrapping; t.anisotropy=4; t.__kalici=true; kayisDoku.t=t; return t;
}
function rozetDoku(){
  if(rozetDoku.t) return rozetDoku.t;
  const c=document.createElement("canvas"); c.width=128; c.height=256; const x=c.getContext("2d"); x.clearRect(0,0,128,256);
  const U=u=>u*128, V=v=>v*256;
  // kırmızı oval (Harbiye rozeti)
  x.fillStyle="#b3242c"; x.beginPath(); x.ellipse(U(.46),V(.21),17,12,0,0,Math.PI*2); x.fill(); x.strokeStyle="#e7cf8a"; x.lineWidth=2; x.stroke();
  x.fillStyle="#f1e3b5"; x.beginPath(); x.ellipse(U(.46),V(.21),7,5,0,0,Math.PI*2); x.fill();
  x.fillStyle="#c9343a"; x.fillRect(U(.46)-13,V(.27)-3,26,7); x.strokeStyle="#e7cf8a"; x.lineWidth=1; x.strokeRect(U(.46)-13,V(.27)-3,26,7);
  // küçük yuvarlak rozet
  x.fillStyle="#c7343a"; x.beginPath(); x.arc(U(.46),V(.33),7,0,Math.PI*2); x.fill(); x.fillStyle="#ece7de"; x.beginPath(); x.arc(U(.46),V(.33),3,0,Math.PI*2); x.fill();
  // siyah kalkan (ay-yıldız)
  const kx=U(.46), ky=V(.70); x.fillStyle="#9a9a9a"; x.beginPath(); x.moveTo(kx-20,ky-24); x.lineTo(kx+20,ky-24); x.lineTo(kx+20,ky+4); x.quadraticCurveTo(kx+18,ky+20,kx,ky+28); x.quadraticCurveTo(kx-18,ky+20,kx-20,ky+4); x.closePath(); x.fill();
  x.fillStyle="#121315"; x.beginPath(); x.moveTo(kx-17,ky-21); x.lineTo(kx+17,ky-21); x.lineTo(kx+17,ky+3); x.quadraticCurveTo(kx+15,ky+17,kx,ky+24); x.quadraticCurveTo(kx-15,ky+17,kx-17,ky+3); x.closePath(); x.fill();
  x.fillStyle="#f2f2f2"; x.beginPath(); x.arc(kx-3,ky,9,0,Math.PI*2); x.fill(); x.fillStyle="#121315"; x.beginPath(); x.arc(kx,ky,7.5,0,Math.PI*2); x.fill();
  x.fillStyle="#f2f2f2"; x.beginPath(); for(let i=0;i<10;i++){ const r=i%2?2:4.6, a=-Math.PI/2+i*Math.PI/5; x.lineTo(kx+8+Math.cos(a)*r,ky+Math.sin(a)*r); } x.closePath(); x.fill();
  const t=new THREE.CanvasTexture(c); t.flipY=false; t.encoding=THREE.sRGBEncoding; t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping; t.__kalici=true; rozetDoku.t=t; return t;
}
function cikartmaGeo(secici,uvFn,kaydir){
  const g=TU.geo, P=g.attributes.position, N=g.attributes.normal, J=g.attributes.skinIndex, W=g.attributes.skinWeight, I=g.index.array, n=g.groups[0].count;
  const pos=[],nor=[],uv=[],si=[],sw=[]; const a=new THREE.Vector3(), nn=new THREE.Vector3();
  for(let k=0;k<n;k+=3){ const ids=[I[k],I[k+1],I[k+2]]; if(!secici(ids,TU.kumasK[k/3])) continue;
    for(const i of ids){ a.fromBufferAttribute(P,i); nn.fromBufferAttribute(N,i); const q=uvFn(a); pos.push(a.x+nn.x*kaydir,a.y+nn.y*kaydir,a.z+nn.z*kaydir); nor.push(nn.x,nn.y,nn.z); uv.push(q[0],q[1]);
      si.push(J.getX(i),J.getY(i),J.getZ(i),J.getW(i)); sw.push(W.getX(i),W.getY(i),W.getZ(i),W.getW(i)); } }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute("normal",new THREE.Float32BufferAttribute(nor,3)); geo.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  geo.setAttribute("skinIndex",new THREE.BufferAttribute(new J.array.constructor(si),4,J.normalized)); geo.setAttribute("skinWeight",new THREE.BufferAttribute(new W.array.constructor(sw),4,W.normalized));
  geo.computeBoundingSphere(); return geo;
}
function cikartmalarHazirla(){
  if(TU.cikartma) return TU.cikartma;
  const g=TU.geo, P=g.attributes.position, J=g.attributes.skinIndex, W=g.attributes.skinWeight, bones=TU.sm.skeleton.bones;
  const kolB=bones.map(b=>/(Arm|ForeArm|Hand)/.test(b.name)?1:0); const wn=W.normalized?(W.array instanceof Uint8Array?255:65535):1;
  const kolW=i=>(kolB[J.getX(i)]*W.getX(i)+kolB[J.getY(i)]*W.getY(i)+kolB[J.getZ(i)]*W.getZ(i)+kolB[J.getW(i)]*W.getW(i))/wn;
  const v=new THREE.Vector3(); const A=new THREE.Vector3(-.125,1.548,-.03), B=new THREE.Vector3(.165,1.06,.13), C=new THREE.Vector3(.165,1.06,-.13);
  const n=B.clone().sub(A).cross(C.clone().sub(A)).normalize(); const KW=.021, YB=(TU.olcu&&TU.olcu.kemerY)||1.095;
  const dP=i=>{ v.fromBufferAttribute(P,i); return n.dot(v.clone().sub(A)); };
  const kayis=cikartmaGeo((ids,k)=>{ if(!TU.govdeK.has(k)) return false; let ic=false, ust=true;
      for(const i of ids){ if(kolW(i)>.45) return false; v.fromBufferAttribute(P,i); if(v.y<YB+.018||Math.abs(v.x)>.24) ust=false; if(Math.abs(dP(i))<KW+.004) ic=true; } return ic&&ust; },
    p=>[p.y*7, (n.dot(p.clone().sub(A))/KW+1)/2], .0024);
  const rozet=cikartmaGeo((ids,k)=>{ if(!TU.govdeK.has(k)) return false; for(const i of ids){ v.fromBufferAttribute(P,i); if(v.x<.05||v.x>.17||v.y<1.24||v.y>1.46||v.z<.03) return false; } return true; },
    p=>[(p.x-.05)/.12,(1.46-p.y)/.22], .0026);
  const ortak={transparent:false,alphaTest:.5,skinning:true,roughness:.6,metalness:.2,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2};
  const km=new THREE.MeshStandardMaterial(Object.assign({map:kayisDoku()},ortak)), rm=new THREE.MeshStandardMaterial(Object.assign({map:rozetDoku()},ortak,{metalness:.1}));
  km.userData.kalici=rm.userData.kalici=true;
  return TU.cikartma={kayis,rozet,km,rm};
}
function cikartmaEkle(ceketMesh){
  const C=cikartmalarHazirla();
  for(const [geo,mt] of [[C.kayis,C.km],[C.rozet,C.rm]]){ const d=new THREE.SkinnedMesh(geo,mt); d.frustumCulled=false; d.castShadow=false; d.userData.kalici=true; ceketMesh.parent.add(d); d.bind(ceketMesh.skeleton,ceketMesh.bindMatrix); }
}
// üstteki tişört/bluz gizlenir (ceketin altında kalır): Kaan'da UV bölgesi, Kardelen'de üst gövde kemik ağırlığı
function ustGizle(o,kim){
  const geo=o.geometry.clone(), I=geo.index.array, yeni=[];
  if(kim==="kaan"){ const UV=geo.attributes.uv; for(let t=0;t<I.length;t+=3){ const v=(UV.getY(I[t])+UV.getY(I[t+1])+UV.getY(I[t+2]))/3; if(v<.445) continue; yeni.push(I[t],I[t+1],I[t+2]); } }
  else if(SINIF_MASKE[kim]){ const UV=geo.attributes.uv, M=SINIF_MASKE[kim]; const c=i=>M[Math.min(255,(UV.getY(i)*256)|0)*256+Math.min(255,(UV.getX(i)*256)|0)]; for(let t=0;t<I.length;t+=3){ if(c(I[t])===1&&c(I[t+1])===1&&c(I[t+2])===1) continue; yeni.push(I[t],I[t+1],I[t+2]); } }
  else { const J=geo.attributes.skinIndex, W=geo.attributes.skinWeight, ust=o.skeleton.bones.map(b=>/(Spine1|Spine2|Shoulder|Arm|Neck)/.test(b.name)?1:0);
    const wn=W.normalized?(W.array instanceof Uint8Array?255:65535):1; const uw=i=>(ust[J.getX(i)]*W.getX(i)+ust[J.getY(i)]*W.getY(i)+ust[J.getZ(i)]*W.getZ(i)+ust[J.getW(i)]*W.getW(i))/wn;
    for(let t=0;t<I.length;t+=3){ if(uw(I[t])+uw(I[t+1])+uw(I[t+2])>1.35) continue; yeni.push(I[t],I[t+1],I[t+2]); } }
  geo.setIndex(yeni); o.geometry=geo;
}
function kisGiydir(m,kemik,kim){
  const K=TU.kis, deri=kim==="kaan";
  m.traverse(o=>{ if(!o.isMesh||!o.material) return; const n=o.material.name;
    if(n==="outfit") ustGizle(o,kim);
    else if(n==="AvatarBody"){ const t=deri?K.kaanGovde:K.karGovde; if(t){ const c=o.material.clone(); c.map=t; c.userData.kalici=true; o.material=c; } } });
  // giysi bedenin kendi yüzeyinden üretilir (bkz. giysi.js): Kardelen haki şişme mont + atkı, Kaan deri ceket
  if(kim==="kardelen") m.traverse(o=>{ if(o.isMesh&&o.material&&o.material.name==="outfit"&&o.material.map){ const c=o.material.clone(); c.map=kiyafetDoku("kardelen",{ayak:"#4a2f20"},o.material.map); c.roughness=.8; c.userData.kalici=true; o.material=c; } });
  const r=kabukGiysi(m,Object.assign({kim},KABUK_PLAN[kim+"_kis"])); return r?r.m:null;
}

/* balo (28 Mayıs 2025): Kaan lacivert takım, beyaz gömlek, elbisesiyle aynı tonda pembe kravat (tören ceketi ağı, yeni dokular) */
async function takimHazirla(){
  if(TU.takim) return TU.takim; await torenHazirla();
  const [ceket,alt,govde]=await Promise.all(["kaan_takim_ceket.jpg","kaan_takim_alt.jpg","kaan_takim_govde.jpg"].map(tuDokuYukle));
  const kM=new THREE.MeshStandardMaterial({map:ceket||TU.ceket,roughness:.78,metalness:0,envMapIntensity:.5,skinning:true});
  const dM=new THREE.MeshStandardMaterial({color:renk("#14161c"),roughness:.35,metalness:.4,skinning:true});
  kM.userData.kalici=dM.userData.kalici=true;
  return TU.takim={mats:[kM,dM],alt,govde};
}
function takimGiydir(m,kemik,kim){
  const T=TU.takim;
  m.traverse(o=>{ if(!o.isMesh||!o.material) return; const n=o.material.name;
    if(n==="outfit"){ ustGizle(o,"kaan"); const c=o.material.clone(); if(T.alt) c.map=T.alt; c.roughness=.8; c.metalness=0; c.roughnessMap=null; c.metalnessMap=null; c.userData.kalici=true; o.material=c; }
    else if(n==="AvatarBody"&&T.govde){ const c=o.material.clone(); c.map=T.govde; c.userData.kalici=true; o.material=c; } });
  return ceketAktar(m,kemik,kim,KAAN_ESLEM,TU.geo,T.mats);
}
/* balo: Kardelen pembe kısa elbise (üst + kabuk etek), çıplak bacak, ten rengi topuklu; isteğe bağlı önü açık kot ceket */
async function pembeHazirla(){ if(TU.pembe) return TU.pembe; const t=await tuDokuYukle("kardelen_pembe_kiyafet.jpg"); return TU.pembe={kiyafet:t}; }
function pembeGiydir(m,kemik,kot){
  m.traverse(o=>{ if(o.isMesh&&o.material&&o.material.name==="outfit"&&TU.pembe.kiyafet){ const c=o.material.clone(); c.map=TU.pembe.kiyafet; c.roughness=.72; c.metalness=0; c.roughnessMap=null; c.metalnessMap=null; c.envMapIntensity=.5; c.userData.kalici=true; o.material=c; } });
  const etek=etekKabuk(m,{renk:"#f2a7bf",ust:1.035,alt:.63,acilim:.075,kalin:.014});
  let ceket=null; if(kot!==undefined){ const r=kabukGiysi(m,Object.assign({kim:"kardelen"},KABUK_PLAN.kardelen_kot)); if(r){ ceket=[r.m,...r.ekler]; ceket.forEach(x=>x.visible=!!kot); } }
  return {etek,ceket};
}
/* yaz (Patara): beyaz üst, lacivert midi etek (kabuk), çıplak bacak, sandalet */
async function yazHazirla(){ if(TU.yaz) return TU.yaz; const t=await tuDokuYukle("kardelen_yaz_kiyafet.jpg"); return TU.yaz={kiyafet:t}; }
function yazGiydir(m){
  m.traverse(o=>{ if(o.isMesh&&o.material&&o.material.name==="outfit"&&TU.yaz.kiyafet){ const c=o.material.clone(); c.map=TU.yaz.kiyafet; c.roughness=.8; c.metalness=0; c.roughnessMap=null; c.metalnessMap=null; c.envMapIntensity=.5; c.userData.kalici=true; o.material=c; } });
  return etekKabuk(m,{renk:"#27375f",ust:1.035,alt:.42,acilim:.14,kalin:.012,puruz:.8});
}
function kotGiy(c,v){ const u=c.userData; if(u.kotCeket) u.kotCeket.forEach(x=>x.visible=!!v); }
/* mezuniyet (fotoğraftaki gibi): Kardelen siyah yelek + beyaz uzun kollu bluz + siyah bol paça kumaş pantolon */
function mezunGiydir(m,kemik){
  const K=TU.mezun; if(!K||!K.kiyafet) return;
  m.traverse(o=>{ if(!o.isMesh||!o.material) return; const n=o.material.name;
    if(n==="outfit"){ const c=o.material.clone(); c.map=K.kiyafet; c.roughness=.9; c.metalness=0; c.roughnessMap=null; c.metalnessMap=null; c.envMapIntensity=.4; c.userData.kalici=true; o.material=c; pacaGenislet(o); }
    else if(n==="AvatarBody"&&K.govde){ const c=o.material.clone(); c.map=K.govde; c.userData.kalici=true; o.material=c; } });
}
// dar kot → bol paça: baldırdan aşağı genişler (iç tarafta daha az), paça ayakkabının üstüne iner
function pacaGenislet(o){
  const geo=o.geometry.clone(); o.geometry=geo; const P=geo.attributes.position, UV=geo.attributes.uv; const S=SINIF_MASKE.kardelen; if(!S) return;
  const sk=o.skeleton, bi=n=>sk.bones.findIndex(b=>b.name.replace(/^mixamorig/,"")===n);
  const kemikP=n=>{ const i=bi(n); if(i<0) return null; const m=new THREE.Matrix4().copy(sk.boneInverses[i]).invert(); return new THREE.Vector3().setFromMatrixPosition(m); };
  const yan={}; for(const t of ["Left","Right"]){ const k=kemikP(t+"Leg"), a=kemikP(t+"Foot"), u=kemikP(t+"UpLeg"); if(!k||!a||!u) return; yan[t]={k,a,u}; }
  const v=new THREE.Vector3(), eks=new THREE.Vector3(), r=new THREE.Vector3();
  const ss=(a,b,x)=>{ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); };
  const sec=[]; for(let i=0;i<P.count;i++){ const u=UV.getX(i), w=UV.getY(i); if(S[Math.min(255,(w*256)|0)*256+Math.min(255,(u*256)|0)]===2) sec.push(i); }
  // her bacakta paçanın şimdiki ucu (kısa kesim kot): oradan ayak bileğinin altına kadar uzatılır
  const tUc={Left:0,Right:0};
  for(const i of sec){ v.fromBufferAttribute(P,i); const k=v.x>0?"Left":"Right", L=yan[k]; eks.copy(L.a).sub(L.k); const boy=eks.length(); const t=v.clone().sub(L.k).dot(eks.normalize())/boy; if(t>tUc[k]) tUc[k]=t; }
  for(const i of sec){
    v.fromBufferAttribute(P,i); const k=v.x>0?"Left":"Right", L=yan[k];
    eks.copy(L.a).sub(L.k); const boy=eks.length(); eks.normalize(); const t=v.clone().sub(L.k).dot(eks)/boy;
    const merkez=L.k.clone().addScaledVector(eks,t*boy); r.copy(v).sub(merkez);
    let f; if(t<0){ const tu=Math.min(1,-t*boy/L.u.distanceTo(L.k)); f=1+.08*(1-tu*.6); } else f=1+.08+.78*ss(-.05,1,t);
    const disa=Math.sign(v.x)*r.x/(r.length()||1); const kat=.45+.55*Math.max(0,disa*.5+.5);
    r.multiplyScalar(1+(f-1)*kat);
    // alttaki %16'lık bölüm aşağı esner: paça ayakkabının üstüne (ayak bileğinin ~5 cm altına) iner
    const tu=tUc[k], bas=tu-.16, hedef=1.12; const uzat=t>bas? ss(bas,tu,t)*(hedef-tu)*boy : 0;
    v.copy(merkez).add(r).addScaledVector(eks,uzat); P.setXYZ(i,v.x,v.y,v.z); }
  P.needsUpdate=true; geo.computeVertexNormals();
}
