/* ================= KARAKTERLER: gerçekçi avatarlar ================= */
const AVATAR={}; let KARAKTERLER=[];
const AV_BOY={kaan:1.84, kardelen:1.68, rpm:1.76, michelle:1.66};
/* deri gölgelendirmesi: ışığın deride yumuşak ve sıcak sönmesi (deri altı saçılmanın ucuz benzeri). Lambert yerine kanal başına üstel eğri:
   kırmızı ışık gölgeye doğru daha geç söner, aydınlıktan karanlığa geçiş plastik gibi sert değil; nl=0'da sıfır olduğu için gölge sınırında çizgi oluşmaz */
const DERI_CHUNK=THREE.ShaderChunk.lights_physical_pars_fragment.replace("reflectedLight.directDiffuse += ( 1.0 - clearcoatDHR ) * irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );",
  "vec3 irrDeri = pow( vec3( max( dot( geometry.normal, directLight.direction ), 1e-4 ) ), vec3( 0.74, 0.9, 0.97 ) ) * directLight.color;\n#ifndef PHYSICALLY_CORRECT_LIGHTS\n\tirrDeri *= PI;\n#endif\n\treflectedLight.directDiffuse += ( 1.0 - clearcoatDHR ) * irrDeri * BRDF_Diffuse_Lambert( material.diffuseColor );");
function deriDerle(sh){ sh.fragmentShader=sh.fragmentShader.replace("#include <lights_physical_pars_fragment>",DERI_CHUNK); }
function kalicila(sahne){
  sahne.traverse(o=>{ if(o.isMesh){ o.frustumCulled=false; o.castShadow=true; o.receiveShadow=false; o.userData.kalici=true;
    (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ m.userData.kalici=true; for(const k of ["map","normalMap","roughnessMap","metalnessMap","emissiveMap","aoMap"]) if(m[k]) m[k].__kalici=true; }); } });
}
async function avatarlariYukle(kok,ilerleme){
  const L=new THREE.GLTFLoader(); if(window.MeshoptDecoder) L.setMeshoptDecoder(window.MeshoptDecoder); // modeller kayıpsız sıkıştırılmış (EXT_meshopt_compression): iPhone'da ilk yükleme ~%40 daha az veri
  const ana=["kaan","kardelen"], kalab=["rpm","michelle"]; const pay={}; const toplam=ana.length*10;
  const bildir=()=>{ if(ilerleme){ let t=0; for(const k of ana) t+=pay[k]||0; ilerleme(Math.min(1,t/toplam)); } };
  const glb=(k,w)=>new Promise((r,j)=>L.load(kok+k+".glb",r,e=>{ if(e.total){ pay[k]=w*e.loaded/e.total; bildir(); } },j));
  const js=k=>fetch(kok+"anim_"+k+".json").then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); });
  const hazirla=async(k,w)=>{
    const [g,a]=await Promise.all([glb(k,w),js(k)]); pay[k]=w; bildir();
    const sahne=g.scene; kalicila(sahne);
    sahne.traverse(o=>{ if(!o.isMesh) return; const ms=Array.isArray(o.material)?o.material:[o.material];
      ms.forEach(m=>{ const n=m.name||"";
        if(/haircut|Eyelashes/i.test(n)){ m.alphaTest=.4; m.transparent=false; m.depthWrite=true; m.side=THREE.DoubleSide; }
        if(/Cornea/i.test(n)){ m.transparent=true; m.opacity=.18; m.depthWrite=false; m.roughness=.05; }
        if(/Headwear/.test(n)) o.visible=false;
        if(m.isMeshStandardMaterial){ m.envMapIntensity=.65; if(/Avatar(Head|Body)|Skin/.test(n)){ m.roughness=Math.max(m.roughness,.58); m.metalness=0; if(DERI_CHUNK!==THREE.ShaderChunk.lights_physical_pars_fragment) m.onBeforeCompile=deriDerle; } } }); }); // deri metal değildir: hazır şablonun metal kanalı burun kanadında ve kulakta "halka/küpe" gibi parlıyordu
    // Mixamo (Michelle) dosyasında iskelet kökü 90° döndürülmüş; animasyonlar zaten dik duruş verdiği için kökü sıfırla
    let q0=null; if(k==="michelle") sahne.traverse(n=>{ if(n.name==="Character"){ q0=n.quaternion.clone(); n.rotation.set(0,0,0); } });
    // kalçanın bağlanma konumu da aynı dönüşle düzeltilir: yoksa idle/walk kliplerinde (kalça konum izi yok) beden grubun 1 m gerisinde duruyordu
    // (bankodaki görevli duvarın arkasında kalıyordu, dönen kalabalık 1 m'lik yay çiziyordu) ve sambada 1 m havada dans ediyordu
    if(q0) sahne.traverse(n=>{ if(n.isBone&&/Hips$/.test(n.name)) n.position.applyQuaternion(q0); });
    const klipler=Object.keys(a).map(ad=>{ const c=THREE.AnimationClip.parse(a[ad]); c.name=ad; c.tracks.forEach(t=>{ t.name=t.name.replace(/^\.bones\[([^\]]+)\]/,"$1"); }); return c; });
    // ölçümü durma animasyonunun ilk karesinde yap (dinlenme pozu yatık olabilir)
    { const idle=klipler.find(c=>c.name==="idle"); if(idle){ const mx=new THREE.AnimationMixer(sahne); mx.clipAction(idle).play(); mx.update(0); } }
    sahne.updateMatrixWorld(true);
    const v=new THREE.Vector3(); let ust=0, kalca=0, alt=1e9;
    sahne.traverse(n=>{ if(n.isBone){ n.getWorldPosition(v); if(/HeadTop_End$/.test(n.name)) ust=v.y; if(/Hips$/.test(n.name)) kalca=v.y; if(/Toe_End$|ToeBase$/.test(n.name)) alt=Math.min(alt,v.y); } });
    if(alt>1e8) alt=0;
    const olcek=AV_BOY[k]/(ust-alt+.02);
    if(k==="michelle"){ sahne.position.y=-alt*olcek; } // ayakları zemine indir (klon kökü ölçekten etkilenmez)
    // dans klibi GLB'den gelir: kök döndürmesi sıfırlandığı için kalça izleri aynı dönüşle düzeltilir (yoksa yerde yatıyorlar)
    if(k==="michelle"){ const s=g.animations.find(x=>x.name==="SambaDance"); if(s){ const c=s.clone(); c.name="samba";
      if(q0){ const q=new THREE.Quaternion(), p=new THREE.Vector3();
        for(const t of c.tracks){ if(/Hips\.quaternion$/.test(t.name)){ const v=t.values; for(let i=0;i<v.length;i+=4){ q.fromArray(v,i).premultiply(q0); q.toArray(v,i); } }
          else if(/Hips\.position$/.test(t.name)){ const v=t.values; for(let i=0;i<v.length;i+=3){ p.fromArray(v,i).applyQuaternion(q0); p.toArray(v,i); } } }
        c.tracks=c.tracks.filter(t=>!/^(Character|Armature|Scene)\./.test(t.name)); }
      klipler.push(c); } }
    // Kardelen: temizlenmiş, güzelleştirilmiş yüz dokusu (lekesiz cilt, hafif makyaj)
    if(k==="kardelen"){ const yukleD=(ad,srgb)=>new Promise(r=>new THREE.TextureLoader().load(kok+ad,t=>{ t.flipY=false; if(srgb) t.encoding=THREE.sRGBEncoding; t.anisotropy=4; t.__kalici=true; r(t); },undefined,()=>r(null)));
      const yb=null, yn=await yukleD("kardelen_bas_n.png",false); // renk dokusu kardelenGuzellestir'de (kardelen_yuz.jpg)
      sahne.traverse(o=>{ if(o.isMesh&&o.material&&o.material.name==="AvatarHead"){ if(yb) o.material.map=yb; if(yn) o.material.normalMap=yn; o.material.needsUpdate=true; } }); }
    // yüz pürüzlülüğü: şablondaki ıslak (parlak) boşluk bölgeleri burun deliği ve kulak kenarında gümüş halka gibi parlıyordu; mat sürüm
    if(k==="kaan"||k==="kardelen"){ if(!avatarlariYukle.basMR) avatarlariYukle.basMR=new Promise(r=>new THREE.TextureLoader().load(kok+"bas_mr.jpg",t=>{ t.flipY=false; t.__kalici=true; r(t); },undefined,()=>r(null)));
      yuzNormalYumusat(sahne);
      const mr=await avatarlariYukle.basMR; sahne.traverse(o=>{ if(o.isMesh&&o.material&&o.material.name==="AvatarHead"){ if(mr){ o.material.roughnessMap=mr; } o.material.metalnessMap=null; o.material.metalness=0; o.material.needsUpdate=true; } }); }
    if(k==="kardelen") await kardelenGuzellestir(sahne);
    AVATAR[k]={sahne, olcek, kalca:kalca*olcek, klipler, onek:k==="michelle"?"mixamorig":""};
  };
  // kalabalık (yolcu, misafir) modelleri arka planda iner: menü onları beklemeden açılır, bölüm açılırken beklenir
  avatarlariYukle.kalab=Promise.all(kalab.map(k=>hazirla(k,3).catch(e=>console.warn("kalabalık yüklenemedi",k,e))));
  await Promise.all([...ana.map(k=>hazirla(k,10)), sinifMaskeleriniCoz()]);
}


/* ---------- Kardelen: güzelleştirilmiş yüz dokusu, kahverengi gözler, uzun dalgalı saç (fotoğraftaki gibi) ---------- */
function _dokuYukle(ad){ return new Promise(r=>new THREE.TextureLoader().load(MODEL_KOK+ad,t=>{ t.flipY=false; t.encoding=THREE.sRGBEncoding; t.anisotropy=4; t.__kalici=true; r(t); },undefined,()=>r(null))); }
// bağlama uzayında gövde kesiti (y dilimlerinde ön/arka/yan), kollar hariç
function _govdeKesit(sahne){
  const Y0=.9, AD=.01, N=70; const on=new Float32Array(N).fill(-9), arka=new Float32Array(N).fill(9), gen=new Float32Array(N).fill(0);
  sahne.traverse(o=>{ if(!o.isSkinnedMesh) return; const n=o.material&&o.material.name; if(n!=="AvatarBody"&&n!=="outfit") return;
    const g=o.geometry, P=g.attributes.position, si=g.attributes.skinIndex, sw=g.attributes.skinWeight; const kol=o.skeleton.bones.map(b=>/(Arm|Hand)/.test(b.name));
    for(let i=0;i<P.count;i++){ let kw=0; if(kol[si.getX(i)]) kw+=sw.getX(i); if(kol[si.getY(i)]) kw+=sw.getY(i); if(kol[si.getZ(i)]) kw+=sw.getZ(i); if(kol[si.getW(i)]) kw+=sw.getW(i); if(kw>.3) continue;
      const x=P.getX(i), y=P.getY(i), z=P.getZ(i); if(Math.abs(x)>.24) continue; const j=Math.round((y-Y0)/AD); if(j<0||j>=N) continue;
      if(z>on[j]) on[j]=z; if(z<arka[j]) arka[j]=z; if(Math.abs(x)>gen[j]) gen[j]=Math.abs(x); } });
  for(let j=1;j<N;j++) if(gen[j]===0){ on[j]=on[j-1]; arka[j]=arka[j-1]; gen[j]=gen[j-1]; }
  return {Y0,AD,N,on,arka,gen};
}
function sacUzat(sm,kesit,marj){
  const g0=sm.geometry, geo=g0.clone(); const P=geo.attributes.position, n=P.count;
  const sk=sm.skeleton, bi=nm=>sk.bones.findIndex(b=>b.name===nm); const iH=bi("Head"), iS=bi("Spine2"), iN=bi("Neck");
  const SI=new Uint16Array(n*4), SW=new Float32Array(n*4), C=new Float32Array(n*3);
  const ss=(a,b,x)=>{ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); };
  const prof=(d,y)=>{ const j=Math.max(0,Math.min(kesit.N-1,Math.round((y-kesit.Y0)/kesit.AD))); return kesit[d][j]; };
  const y0=1.53;
  for(let i=0;i<n;i++){ let x=P.getX(i), y=P.getY(i), z=P.getZ(i);
    const ang=Math.atan2(x,-(z+.005)); let t=0;
    if(y<y0){ const k=2.05+.32*Math.cos(ang)+.08*Math.sin(ang*3.1); const y2=y0-(y0-y)*k; t=Math.min(1,(y0-y2)/.42);
      const r=Math.hypot(x,z+.005)||1; const ux=x/r, uz=(z+.005)/r;
      const dalga=Math.sin(t*10.5+ang*2.4)*.02*t+Math.sin(t*6+ang*5.1)*.008*t+.028*t*(1-.35*Math.cos(ang));
      x+=ux*dalga; z+=uz*dalga; y=y2;
      // gövdeye girmesin: öndeki tutamlar göğsün önüne, arkadakiler sırtın arkasına yaslanır
      if(y<1.5){ const ON=prof("on",y)+marj, ARKA=prof("arka",y)-marj, GEN=prof("gen",y)+marj; const zc=(ON+ARKA)/2;
        if(Math.abs(x)<GEN){ const yan=1-ss(GEN*.7,GEN,Math.abs(x)); if(z>zc&&z<ON) z=z+(ON-z)*yan; else if(z<=zc&&z>ARKA) z=z-(z-ARKA)*yan; } }
      P.setXYZ(i,x,y,z); }
    // ağırlık: üst kısım başla, alttakiler göğüs/sırtla (Spine2) birlikte hareket eder
    const wH=ss(1.39,1.52,y), wN=(1-wH)*ss(1.33,1.42,y)*.5, wS=1-wH-wN;
    SI[i*4]=iH; SI[i*4+1]=iS>=0?iS:iH; SI[i*4+2]=iN>=0?iN:iH; SI[i*4+3]=0; SW[i*4]=wH; SW[i*4+1]=wS; SW[i*4+2]=wN; SW[i*4+3]=0;
    // renk: kökler koyu, boylar ve uçlar karamel (balyaj)
    const u=ss(.0,1,t), kok=ss(1.6,1.72,P.getY(i));
    C[i*3]=(.6+.55*u)*(1-.12*kok); C[i*3+1]=(.54+.36*u)*(1-.12*kok); C[i*3+2]=(.5+.16*u)*(1-.1*kok); }
  geo.setAttribute("skinIndex",new THREE.Uint16BufferAttribute(SI,4)); geo.setAttribute("skinWeight",new THREE.Float32BufferAttribute(SW,4)); geo.setAttribute("color",new THREE.Float32BufferAttribute(C,3));
  geo.computeVertexNormals(); geo.computeBoundingSphere(); return geo;
}
// burun kanadı ve kulak kıvrımlarında normaller çok keskin: yandan gelen ışıkta ince parlak + koyu çizgi "halka/küpe" gibi görünüyordu.
// Bu bölgelerde normaller komşularıyla yumuşatılır (deri altı saçılımın yaptığı gibi), biçim değişmez.
function yuzNormalYumusat(sahne){
  sahne.traverse(o=>{ if(!o.isMesh||!o.material||o.material.name!=="AvatarHead"||o.geometry.userData.nYum) return; const g=o.geometry; g.userData.nYum=1;
    const P=g.attributes.position, N=g.attributes.normal; if(!N) return; let tip=-1, tz=-9;
    for(let i=0;i<P.count;i++){ if(Math.abs(P.getX(i))<.012&&P.getZ(i)>tz){ tz=P.getZ(i); tip=i; } } if(tip<0) return; const ty=P.getY(tip);
    const bolgeler=[{f:(x,y,z)=>Math.abs(x)<.032&&y>ty-.032&&y<ty+.008&&z>tz-.055, R:.0055},
                    {f:(x,y,z)=>Math.abs(x)>.058&&y>ty-.075&&y<ty+.07&&z>-.07&&z<tz-.06, R:.007}];
    const yeni=new Float32Array(N.array.length); yeni.set(N.array);
    for(const B of bolgeler){ const id=[]; for(let i=0;i<P.count;i++) if(B.f(P.getX(i),P.getY(i),P.getZ(i))) id.push(i);
      const R2=B.R*B.R*4;
      for(const i of id){ const xi=P.getX(i), yi=P.getY(i), zi=P.getZ(i); let sx=0,sy=0,sz=0;
        for(const j of id){ const dx=P.getX(j)-xi, dy=P.getY(j)-yi, dz=P.getZ(j)-zi, d2=dx*dx+dy*dy+dz*dz; if(d2>R2) continue; const w=Math.exp(-d2/(B.R*B.R)); sx+=N.getX(j)*w; sy+=N.getY(j)*w; sz+=N.getZ(j)*w; }
        const L=Math.hypot(sx,sy,sz)||1; const k=.85; let nx=N.getX(i)*(1-k)+sx/L*k, ny=N.getY(i)*(1-k)+sy/L*k, nz=N.getZ(i)*(1-k)+sz/L*k; const L2=Math.hypot(nx,ny,nz)||1;
        yeni[i*3]=nx/L2; yeni[i*3+1]=ny/L2; yeni[i*3+2]=nz/L2; } }
    N.array.set(yeni); N.needsUpdate=true; });
}
// Kardelen'in yüz hatlarına çok hafif dokunuş (bağlama uzayında, bir kez): gözler biraz daha açık, kaş kemeri hafif yukarı,
// dudaklar biraz dolgun, burun kanatları ve çene hattı biraz daha ince (V çizgisi). Kirpikler aynı biçimde göz kapağını izler.
function kardelenYuzSekli(sahne){
  const GL=[.0281,1.6262,.0806], GR=[-.0294,1.6265,.0805], AG=[.0008,1.5575,.104], BU=[.0006,1.5894,.1276];
  const ss=(a,b,x)=>{ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); };
  const sekil=(x,y,z)=>{ let nx=x, ny=y, nz=z; const on=ss(-.01,.03,z);
    for(const E of [GL,GR]){ // göz açıklığı: göz merkezine göre dikeyde %9, yatayda %3 açılır
      const d=Math.hypot(x-E[0],(y-E[1])/.72), w=(1-ss(.006,.021,d))*ss(E[2]-.03,E[2]-.006,z); ny+=(y-E[1])*.09*w; nx+=(x-E[0])*.03*w;
      // kaş kemeri: dış uca doğru 1.3 mm yukarı
      const u=(x-E[0])*Math.sign(E[0]), dy=y-(E[1]+.019); const kw=(1-ss(.006,.014,Math.abs(dy)))*ss(-.012,.012,u)*(1-ss(.026,.036,u))*on; ny+=.0013*kw*ss(-.012,.02,u); }
    { const d=Math.hypot(x-AG[0],(y-AG[1])/.5), w=(1-ss(.008,.02,d))*on; ny+=(y-AG[1])*.06*w; nz+=.0006*w; } // dudak dolgunluğu
    { const d=Math.hypot(x-BU[0],(y-BU[1])/.9), w=(1-ss(.008,.02,d))*ss(.09,.11,z); nx-=(x-BU[0])*.06*w; } // burun kanatları
    { const w=ss(1.478,1.505,y)*(1-ss(AG[1]-.004,AG[1]+.018,y))*ss(.022,.055,Math.abs(x))*ss(-.02,.02,z); nx-=x*.045*w; } // çene hattı
    return [nx,ny,nz]; };
  sahne.traverse(o=>{ if(!o.isMesh||!o.material) return; const n=o.material.name; if(n!=="AvatarHead"&&n!=="AvatarEyelashes") return;
    const P=o.geometry.attributes.position; if(o.geometry.userData.yuzSekli) return; o.geometry.userData.yuzSekli=1;
    for(let i=0;i<P.count;i++){ const q=sekil(P.getX(i),P.getY(i),P.getZ(i)); P.setXYZ(i,q[0],q[1],q[2]); } P.needsUpdate=true; o.geometry.computeBoundingSphere(); });
}
async function kardelenGuzellestir(sahne){
  kardelenYuzSekli(sahne);
  const [yuz,goz]=await Promise.all([_dokuYukle("kardelen_yuz.jpg"),_dokuYukle("kardelen_goz.jpg")]);
  let sac=null;
  sahne.traverse(o=>{ if(!o.isMesh||!o.material) return; const n=o.material.name;
    if(n==="AvatarHead"&&yuz){ o.material.map=yuz; o.material.roughness=Math.max(o.material.roughness,.6); o.material.needsUpdate=true; }
    if((n==="AvatarHead"||n==="AvatarBody")&&o.material.isMeshStandardMaterial){ o.material.emissive=new THREE.Color(.42,.2,.15); o.material.emissiveIntensity=.06; } // ışık geçiren cilt hissi: gölgeler griye değil sıcağa kaçar
    if(/Eyeball/.test(n)&&goz){ o.material.map=goz; o.material.needsUpdate=true; }
    if(/haircut/.test(n)&&o.isSkinnedMesh) sac=o; });
  if(sac){ const kesit=_govdeKesit(sahne); const ince=sacUzat(sac,kesit,.014), kalin=sacUzat(sac,kesit,.06);
    ince.userData.kalici=kalin.userData.kalici=true; sac.geometry=ince; sac.material.vertexColors=true; sac.material.needsUpdate=true; AVATAR_SAC.kardelen={ince,kalin};
    // saç dolgunluğu: aynı saç kartlarının arkasında daha düşük alfa eşikli, koyu bir alt katman; teller arası boşluklar dolu görünür
    const m2=sac.material.clone(); m2.alphaTest=.1; m2.color=sac.material.color.clone().multiplyScalar(.62); m2.polygonOffset=true; m2.polygonOffsetFactor=3; m2.polygonOffsetUnits=3; m2.userData.kalici=true; m2.roughness=Math.min(1,(sac.material.roughness||.6)+.15);
    const alt=new THREE.SkinnedMesh(sac.geometry,m2); alt.name="sacAlt"; alt.frustumCulled=false; alt.castShadow=false; alt.userData.kalici=true; sac.parent.add(alt); alt.bind(sac.skeleton,sac.bindMatrix); alt.renderOrder=-1; }
}
const AVATAR_SAC={};
/* ---------- kıyafet: dokuyu yeniden boya (gömlek üst bölge, pantolon mavi kumaş) ---------- */
const KIYAFET_ON={};
const KIYAFET_SINIF_B64={kaan:"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",kardelen:"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"};
const SINIF_MASKE={};
// kıyafet dokusunun her pikseli hangi parçaya ait: 1 üst (tişört, cep dahil), 2 alt (pantolon), 3 ayakkabı (geometriden pişirildi)
function sinifMaskeleriniCoz(){ return Promise.all(Object.keys(KIYAFET_SINIF_B64).map(k=>new Promise(r=>{ const im=new Image(); im.onload=()=>{ const c=document.createElement("canvas"); c.width=c.height=256; const x=c.getContext("2d"); x.drawImage(im,0,0); const d=x.getImageData(0,0,256,256).data; const a=new Uint8Array(256*256);
  for(let i=0;i<a.length;i++){ const R=d[i*4],G=d[i*4+1],Bb=d[i*4+2]; a[i]=R>128?1:Bb>128?2:G>128?3:0; } SINIF_MASKE[k]=a; r(); }; im.onerror=()=>r(); im.src="data:image/png;base64,"+KIYAFET_SINIF_B64[k]; }))); }

function kiyafetDoku(kim,plan,orijinal){
  const anah=kim+JSON.stringify(plan); if(KIYAFET_ON[anah]) return KIYAFET_ON[anah];
  const img=orijinal.image; const W=img.width, H=img.height;
  const c=document.createElement("canvas"); c.width=W; c.height=H; const x=c.getContext("2d"); x.drawImage(img,0,0,W,H);
  const d=x.getImageData(0,0,W,H), p=d.data;
  const sinif=new Uint8Array(W*H); let sL=0,sN=0,aL=0,aN=0; const M=SINIF_MASKE[kim];
  for(let y=0;y<H;y++) for(let X=0;X<W;X++){ const i=(y*W+X)*4; const r=p[i]/255,g=p[i+1]/255,b=p[i+2]/255; const L=(r+g+b)/3;
    let k=0; if(M){ k=M[((y*256/H)|0)*256+((X*256/W)|0)]; if(k===3){ if(plan.ayak){ const i3=(y*W+X)*4; const L3=(p[i3]+p[i3+1]+p[i3+2])/765; const C3=new THREE.Color(plan.ayak); const f3=Math.pow(L3/.75,1.2); p[i3]=Math.min(255,C3.r*f3*255); p[i3+1]=Math.min(255,C3.g*f3*255); p[i3+2]=Math.min(255,C3.b*f3*255); } k=0; } }
    else { const mx=Math.max(r,g,b), mn=Math.min(r,g,b), s=mx?(mx-mn)/mx:0; if(y<H*.45 && X<W*.84 && L>=.7 && s<.3) k=1; else if(b>r+.05 && L<.78 && s>.12) k=2; }
    if(k===1){ sinif[y*W+X]=1; sL+=L; sN++; } else if(k===2){ sinif[y*W+X]=2; aL+=L; aN++; } }
  const ortS=sN?sL/sN:.8, ortA=aN?aL/aN:.4;
  const hex=h=>{ const C=new THREE.Color(h); return [C.r,C.g,C.b]; };
  const kamuflaj=(X,y)=>{ const u=X/W*9, v=y/H*9; const n=Math.sin(u*1.7+Math.sin(v*1.3)*2)+Math.sin(v*2.1+Math.sin(u*.9)*2)+Math.sin((u+v)*1.1); return n>1.1?[.24,.2,.13]:n>-.2?[.36,.38,.24]:n>-1.2?[.5,.47,.33]:[.18,.22,.15]; };
  const hS=plan.ust&&plan.ust!=="kamuflaj"?hex(plan.ust):null, hA=plan.alt&&plan.alt!=="kamuflaj"?hex(plan.alt):null;
  for(let y=0;y<H;y++) for(let X=0;X<W;X++){ const k=sinif[y*W+X]; if(!k) continue; const i=(y*W+X)*4;
    const pl=k===1?plan.ust:plan.alt; if(!pl) continue;
    const L=(p[i]+p[i+1]+p[i+2])/765; const f=Math.pow(L/(k===1?ortS:ortA),k===1?1.6:1.1);
    const hd=pl==="kamuflaj"?kamuflaj(X,y):(k===1?hS:hA);
    p[i]=Math.min(255,hd[0]*f*255); p[i+1]=Math.min(255,hd[1]*f*255); p[i+2]=Math.min(255,hd[2]*f*255); }
  x.putImageData(d,0,0);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.flipY=orijinal.flipY; t.wrapS=orijinal.wrapS; t.wrapT=orijinal.wrapT; t.anisotropy=4; t.__kalici=true;
  KIYAFET_ON[anah]=t; return t;
}

/* ---------- aksesuarlar ---------- */
const ALTIN=()=>new THREE.MeshStandardMaterial({color:renk("#d8b15c"),metalness:1,roughness:.3,envMapIntensity:1.25});
function armaDoku(){
  if(armaDoku.t) return armaDoku.t;
  const c=document.createElement("canvas"); c.width=c.height=256; const x=c.getContext("2d");
  const ag=x.createLinearGradient(0,0,256,256); ag.addColorStop(0,"#fff3c4"); ag.addColorStop(.5,"#d9ab4c"); ag.addColorStop(1,"#94691f");
  x.translate(128,132);
  // defne çelengi
  x.fillStyle=ag; x.strokeStyle="#6a4a14"; x.lineWidth=1.5;
  for(const s of [-1,1]) for(let i=0;i<10;i++){ const a=Math.PI*.55+i*.16; const r=84; const px=s*Math.cos(a)*r*-1, py=Math.sin(a)*r*.95-8;
    x.save(); x.translate(px,py); x.rotate(s*(Math.PI/2-a)+(s<0?Math.PI:0)); x.beginPath(); x.ellipse(0,0,8,19,0,0,Math.PI*2); x.fill(); x.stroke(); x.restore(); }
  // ay yıldız
  x.fillStyle="#fbf3dc"; x.beginPath(); x.arc(-10,-4,46,0,Math.PI*2); x.fill(); x.globalCompositeOperation="destination-out"; x.beginPath(); x.arc(4,-4,37,0,Math.PI*2); x.fill(); x.globalCompositeOperation="source-over";
  x.beginPath(); for(let i=0;i<10;i++){ const r=i%2?9.5:23, a=-Math.PI/2+i*Math.PI/5; x.lineTo(30+Math.cos(a)*r,-4+Math.sin(a)*r); } x.closePath(); x.fill();
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.__kalici=true; armaDoku.t=t; return t;
}
/* tören şapkası (vizörlü subay kepi) — ölçüler metre; orijin: bant alt merkezi, +z ön */
function sapkaYap(rx=.104,rz=.118){
  const g=new THREE.Group();
  const kumas=new THREE.MeshStandardMaterial({color:renk("#454e33"),roughness:.86,bumpMap:gurultuDoku(6),bumpScale:.0015,side:THREE.DoubleSide});
  const bantM=new THREE.MeshStandardMaterial({color:renk("#262d1d"),roughness:.7});
  const siyah=new THREE.MeshStandardMaterial({color:renk("#070707"),roughness:.24,metalness:0,envMapIntensity:.8,side:THREE.DoubleSide});
  const altin=ALTIN();
  const hB=.045, rxT=rx+.019, rzT=rz+.023, onKay=.007;
  const kenarY=a=>hB+.036+.04*Math.pow(Math.max(0,Math.cos(a)),1.6);    // tepe kenarı: önde yüksek
  const N=56;
  // bant
  const band=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,N,1,true),bantM); band.scale.set(rx,hB,rz); band.position.y=hB/2; g.add(band);
  // yan kumaş (banttan tepeye hafif bombeli)
  const H=6, pos=[], idx=[];
  for(let j=0;j<=H;j++){ const t=j/H, e=t*t*(3-2*t);
    for(let i=0;i<=N;i++){ const a=i/N*Math.PI*2; const sx=Math.sin(a), cz=Math.cos(a);
      const r0x=rx, r0z=rz, r1x=rxT, r1z=rzT; const bom=Math.sin(t*Math.PI)*.004;
      const X=sx*(r0x+(r1x-r0x)*e+bom), Z=cz*(r0z+(r1z-r0z)*e+bom)+onKay*e, Y=hB+(kenarY(a)-hB)*t;
      pos.push(X,Y,Z); } }
  for(let j=0;j<H;j++) for(let i=0;i<N;i++){ const a=j*(N+1)+i, b=a+N+1; idx.push(a,b,a+1, b,b+1,a+1); }
  const yg=new THREE.BufferGeometry(); yg.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); yg.setIndex(idx); yg.computeVertexNormals();
  g.add(new THREE.Mesh(yg,kumas));
  // tepe: kenardan merkeze hafif çöken yüzey
  const R=5, tp=[], ti=[]; const yMerkez=hB+.052;
  for(let j=0;j<=R;j++){ const t=j/R;
    for(let i=0;i<=N;i++){ const a=i/N*Math.PI*2; const X=Math.sin(a)*rxT*t, Z=Math.cos(a)*rzT*t+onKay; const Y=yMerkez+(kenarY(a)-yMerkez)*Math.pow(t,2.2)+Math.sin(t*Math.PI)*.006; tp.push(X,Y,Z); } }
  for(let j=0;j<R;j++) for(let i=0;i<N;i++){ const a=j*(N+1)+i, b=a+N+1; ti.push(a,a+1,b, b,a+1,b+1); }
  const tg=new THREE.BufferGeometry(); tg.setAttribute("position",new THREE.Float32BufferAttribute(tp,3)); tg.setIndex(ti); tg.computeVertexNormals();
  g.add(new THREE.Mesh(tg,kumas));
  // tepe kenarında biye
  const kp=[]; for(let i=0;i<=N;i++){ const a=i/N*Math.PI*2; kp.push(new THREE.Vector3(Math.sin(a)*rxT,kenarY(a),Math.cos(a)*rzT+onKay)); }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(kp,true),N,.0024,5,true),bantM));
  // siperlik: önde ~6.5 cm, aşağı eğik, yanlara doğru incelir
  const VA=26, VR=4, vp=[], vi=[]; const aMax=Math.PI*.42, egim=.43;
  for(let i=0;i<=VA;i++){ const a=-aMax+2*aMax*i/VA; const L=.062*Math.pow(Math.cos(a/aMax*Math.PI/2),.75);
    for(let j=0;j<=VR;j++){ const t=j/VR; const d=L*t; const sx=Math.sin(a), cz=Math.cos(a);
      vp.push(sx*(rx+d*Math.cos(egim)), .004-d*Math.sin(egim)-.004*t*t-Math.pow(Math.abs(sx),2)*.008*t, cz*(rz+d*Math.cos(egim))); } }
  for(let i=0;i<VA;i++) for(let j=0;j<VR;j++){ const a=i*(VR+1)+j, b=a+VR+1; vi.push(a,b,a+1, b,b+1,a+1); }
  const vg=new THREE.BufferGeometry(); vg.setAttribute("position",new THREE.Float32BufferAttribute(vp,3)); vg.setIndex(vi); vg.computeVertexNormals();
  g.add(new THREE.Mesh(vg,siyah));
  // altın çene kordonu ve yan düğmeler
  for(const dy of [.013,.022]){ const cp=[]; for(let i=0;i<=24;i++){ const a=-Math.PI*.4+Math.PI*.8*i/24; cp.push(new THREE.Vector3(Math.sin(a)*(rx+.003),dy+Math.cos(a)*.002,Math.cos(a)*(rz+.003))); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cp),24,.0021,6,false),altin)); }
  for(const s of [-1,1]){ const a=s*Math.PI*.42; const d=new THREE.Mesh(new THREE.SphereGeometry(.0055,10,6,0,Math.PI*2,0,Math.PI/2),altin); d.position.set(Math.sin(a)*(rx+.002),.0175,Math.cos(a)*(rz+.002)); d.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(Math.sin(a),0,Math.cos(a))); g.add(d); }
  // arma: kalkık önün ortasında
  const ay=hB+.034; const arma=new THREE.Mesh(new THREE.PlaneGeometry(.052,.052),new THREE.MeshStandardMaterial({map:armaDoku(),transparent:true,alphaTest:.35,metalness:.85,roughness:.3,envMapIntensity:1.3}));
  const e=(ay-hB)/(kenarY(0)-hB); arma.position.set(0,ay,rz+(rzT-rz)*e*e*(3-2*e)+onKay*e+.003); arma.rotation.x=-.32; g.add(arma);
  g.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.frustumCulled=false; } });
  return g;
}
/* subay kılıcı: hafif kavisli parlak çelik namlu, altın el kemeri, siyah sap */
function kilicYap(){
  const g=new THREE.Group();
  const celik=new THREE.MeshStandardMaterial({color:renk("#eef2f7"),metalness:.72,roughness:.2,envMapIntensity:1.9});
  const altin=ALTIN();
  const L=.82, y0=.06, sh=new THREE.Shape(), N=28, sirt=[], agiz=[];
  for(let i=0;i<=N;i++){ const t=i/N, y=y0+t*L, kav=.04*t*t; const w=.026*(1-t*.3)*(t>.88?Math.max(.04,(1-t)/.12):1);
    sirt.push(new THREE.Vector2(-.004-kav,y)); agiz.push(new THREE.Vector2(-.004-kav+w,y)); }
  sh.moveTo(sirt[0].x,sirt[0].y); for(const q of sirt) sh.lineTo(q.x,q.y); for(let i=agiz.length-1;i>=0;i--) sh.lineTo(agiz[i].x,agiz[i].y); sh.closePath();
  const ng=new THREE.ExtrudeGeometry(sh,{depth:.002,bevelEnabled:true,bevelThickness:.0016,bevelSize:.0022,bevelSegments:2,steps:1}); ng.translate(0,0,-.001);
  g.add(new THREE.Mesh(ng,celik));
  const olukM=new THREE.MeshStandardMaterial({color:renk("#aab3bd"),metalness:1,roughness:.28});
  for(const sz of [-1,1]){ const o=new THREE.Mesh(new THREE.PlaneGeometry(.0045,L*.6),olukM); o.position.set(.003,y0+L*.32,sz*.0031); o.rotation.y=sz>0?0:Math.PI; o.rotation.z=-.025; g.add(o); }
  const sip=new THREE.Mesh(new THREE.BoxGeometry(.074,.01,.022),altin); sip.position.set(.008,.052,0); g.add(sip);
  const kemer=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.042,.05,0),new THREE.Vector3(.058,.018,0),new THREE.Vector3(.057,-.04,0),new THREE.Vector3(.04,-.08,0),new THREE.Vector3(.014,-.093,0)]),20,.0042,6,false),altin); g.add(kemer);
  const kalkan=new THREE.Mesh(new THREE.CylinderGeometry(.027,.031,.008,18),altin); kalkan.position.set(.008,.045,0); kalkan.scale.z=.55; g.add(kalkan);
  const sap=new THREE.Mesh(new THREE.CylinderGeometry(.0125,.0145,.115,12),new THREE.MeshStandardMaterial({color:renk("#141010"),roughness:.42})); sap.position.y=-.016; g.add(sap);
  for(let i=0;i<7;i++){ const r=new THREE.Mesh(new THREE.TorusGeometry(.0136-i*.0002,.0011,4,16),altin); r.rotation.x=Math.PI/2; r.position.y=-.065+i*.016; g.add(r); }
  const topuz=new THREE.Mesh(new THREE.SphereGeometry(.016,14,10),altin); topuz.scale.y=.8; topuz.position.y=-.08; g.add(topuz);
  const kapak=new THREE.Mesh(new THREE.CylinderGeometry(.009,.016,.022,14),altin); kapak.position.y=-.095; g.add(kapak);
  const tas=new THREE.Mesh(new THREE.SphereGeometry(.0075,12,8),new THREE.MeshStandardMaterial({color:renk("#b0161e"),roughness:.15,metalness:.2,envMapIntensity:1.5})); tas.position.set(0,-.1,0); g.add(tas);
  // kılıç bağı: kabzadan sarkan sarı kordon ve püskül
  const kord=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.03,.045,0),new THREE.Vector3(.05,-.02,.004),new THREE.Vector3(.045,-.09,.006),new THREE.Vector3(.04,-.14,.004)]),16,.0022,5,false),new THREE.MeshStandardMaterial({color:renk("#d9b452"),roughness:.55,metalness:.3}));
  g.add(kord); const pus=new THREE.Mesh(new THREE.CylinderGeometry(.005,.013,.055,10),new THREE.MeshStandardMaterial({color:renk("#dcb550"),roughness:.6,metalness:.25})); pus.position.set(.04,-.17,.004); g.add(pus);
  g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); g.userData.kilic=true;
  return g;
}
/* kılıcı avuçta tut: bilek bıçak yönüne döner, parmaklar kabzanın etrafına kapanır, kabza yumruğun içine oturur */
const _kv=new THREE.Vector3(), _kw=new THREE.Vector3(), _kx=new THREE.Vector3(), _ky=new THREE.Vector3(), _kz=new THREE.Vector3(), _km=new THREE.Matrix4();
function kemikPoz(b,v){ return b.getWorldPosition(v); }
const PARMAK=["Index","Middle","Ring","Pinky","Thumb"];
// animasyonda parmak izi olmayabilir: döndürülen kemikler her karede dinlenme açısından başlar (birikme olmaz)
function elSifirla(B,yan,yaz){ const L=[B[yan+"Hand"]]; for(const f of PARMAK) for(let j=1;j<=3;j++) L.push(B[yan+"Hand"+f+j]);
  for(const b of L){ if(!b) continue; if(!b.userData.q0) b.userData.q0=b.quaternion.clone(); else if(yaz!==false) b.quaternion.copy(b.userData.q0); } if(B[yan+"Hand"]) B[yan+"Hand"].updateMatrixWorld(true); }
function kilicKavra(B,yan,kilic,bicakYon,w=1){
  const H=B[yan+"Hand"], I1=B[yan+"HandIndex1"], P1=B[yan+"HandPinky1"], M1=B[yan+"HandMiddle1"]; if(!H||!I1||!P1||!M1) return;
  elSifirla(B,yan);
  const iz=yan==="Right"?1:-1;
  const avuc=()=>{ const h=kemikPoz(H,new THREE.Vector3()), i=kemikPoz(I1,new THREE.Vector3()).sub(h), p=kemikPoz(P1,new THREE.Vector3()).sub(h); return i.cross(p).multiplyScalar(iz).normalize(); };
  // 1) bilek: boğum çizgisi (serçe→işaret) bıçak yönüne
  if(bicakYon){ const i=kemikPoz(I1,new THREE.Vector3()), p=kemikPoz(P1,new THREE.Vector3()); const d=i.sub(p).normalize(); const hd=bicakYon.clone().normalize();
    const eks=d.clone().cross(hd); const s=eks.length(); if(s>1e-4){ const a=Math.min(Math.atan2(s,d.dot(hd)),1.2)*w; kemikDondur(H,eks.normalize(),a); } }
  // 2) parmaklar kapanır
  const N=avuc();
  for(const [f,acilar] of [["Index",[1.25,1.5,.9]],["Middle",[1.3,1.5,.9]],["Ring",[1.35,1.45,.9]],["Pinky",[1.4,1.35,.85]],["Thumb",[.5,.8,.75]]]){
    for(let j=1;j<=3;j++){ const b=B[yan+"Hand"+f+j], c=B[yan+"Hand"+f+(j+1)]; if(!b||!c) continue;
      const F=kemikPoz(c,new THREE.Vector3()).sub(kemikPoz(b,new THREE.Vector3())).normalize(); const eks=F.clone().cross(N); if(eks.lengthSq()<1e-8) continue;
      kemikDondur(b,eks.normalize(),acilar[j-1]*w); } }
  if(!kilic) return;
  // 3) kabza yumruğun içinde: eksen işaret boğumundan dışarı, el kemeri parmakların önünde
  const h=kemikPoz(H,new THREE.Vector3()), i=kemikPoz(I1,new THREE.Vector3()), p=kemikPoz(P1,new THREE.Vector3()), m=kemikPoz(M1,new THREE.Vector3());
  _ky.copy(i).sub(p).normalize(); const ileri=m.clone().sub(h).normalize();
  _kx.copy(ileri).addScaledVector(_ky,-ileri.dot(_ky)).normalize(); _kz.copy(_kx).cross(_ky).normalize();
  const merkez=i.clone().add(p).multiplyScalar(.5).addScaledVector(N,.024).addScaledVector(ileri,-.006);
  _km.makeBasis(_kx,_ky,_kz); kilic.quaternion.setFromRotationMatrix(_km);
  kilic.position.copy(merkez).addScaledVector(_ky,.016);
}
/* kın: siyah parlak, altın ağızlık/halka/uç; üstte kılıcın kabzası görünür (çekilince gizlenir) */
function kinYap(){
  const g=new THREE.Group(); const deri=new THREE.MeshStandardMaterial({color:renk("#0c0c0e"),roughness:.28,metalness:.2,envMapIntensity:1}); const altin=ALTIN();
  const pts=[]; for(let i=0;i<=10;i++){ const t=i/10; pts.push(new THREE.Vector3(-.04*t*t,-t*.78,0)); }
  const egri=new THREE.CatmullRomCurve3(pts);
  const tup=new THREE.Mesh(new THREE.TubeGeometry(egri,24,.0135,8,false),deri); tup.scale.z=.5; g.add(tup);
  for(const t of [0,.3,1]){ const q=egri.getPoint(t); const b=new THREE.Mesh(new THREE.CylinderGeometry(.0165,.0165,t===1?.05:.026,12),altin); b.position.copy(q); b.position.y+=t===1?.012:0; b.scale.z=.55; g.add(b); }
  const kabza=new THREE.Group(); const k=kilicYap(); k.children.forEach(c=>{ if(c.position.y<.06 && !(c.geometry&&c.geometry.type==="ExtrudeGeometry")) kabza.add(c.clone()); });
  kabza.position.y=.035; kabza.rotation.y=Math.PI; g.add(kabza);
  g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); g.userData.kabza=kabza; return g;
}
/* model uzayında kurulan parçayı kemiğe bağla (bağlama pozundaki yerine birebir oturur) */
function kemigeBagla(model,kemikAd,nesne){
  let sm=null; model.traverse(o=>{ if(!sm&&o.isSkinnedMesh) sm=o; }); if(!sm) return null;
  const sk=sm.skeleton; const i=sk.bones.findIndex(b=>b.name.replace(/^mixamorig/,"")===kemikAd); if(i<0) return null;
  const L=sk.boneInverses[i].clone().multiply(sm.bindMatrix); const sar=new THREE.Group(); L.decompose(sar.position,sar.quaternion,sar.scale);
  sar.add(nesne); sk.bones[i].add(sar); return sar;
}
/* ---------- Kaan tören üniforması: pişirilmiş dokular + ölçülü parçalar ---------- */
const KU={"dugme":[[0.0,1.425,0.083],[0.0,1.325,0.118],[0.0,1.225,0.123],[0.0,1.125,0.126],[0.0,0.99,0.131]],"cep":[[-0.098,1.346,0.11],[0.098,1.346,0.107]],"kemer":[[-0.056,1.058,-0.1],[-0.075,1.058,-0.096],[-0.089,1.058,-0.095],[-0.095,1.058,-0.087],[-0.108,1.058,-0.083],[-0.12,1.058,-0.077],[-0.134,1.058,-0.069],[-0.143,1.058,-0.059],[-0.147,1.058,-0.047],[-0.153,1.058,-0.034],[-0.157,1.058,-0.021],[-0.163,1.058,-0.006],[-0.161,1.058,0.008],[-0.158,1.058,0.022],[-0.154,1.058,0.035],[-0.149,1.058,0.049],[-0.141,1.058,0.061],[-0.112,1.058,0.091],[-0.089,1.058,0.107],[-0.077,1.058,0.112],[-0.052,1.058,0.122],[-0.027,1.058,0.13],[0.0,1.058,0.132],[0.027,1.058,0.13],[0.052,1.058,0.122],[0.065,1.058,0.118],[0.077,1.058,0.112],[0.089,1.058,0.107],[0.112,1.058,0.091],[0.132,1.058,0.072],[0.141,1.058,0.06],[0.147,1.058,0.048],[0.153,1.058,0.035],[0.158,1.058,0.021],[0.163,1.058,-0.006],[0.157,1.058,-0.021],[0.153,1.058,-0.034],[0.145,1.058,-0.046],[0.136,1.058,-0.057],[0.125,1.058,-0.066],[0.12,1.058,-0.077],[0.114,1.058,-0.087],[0.103,1.058,-0.093],[0.091,1.058,-0.097],[0.079,1.058,-0.1],[0.072,1.058,-0.106],[0.06,1.058,-0.106],[0.04,1.058,-0.107],[0.022,1.058,-0.103]],"yaka":[[-0.001,1.534,-0.079],[-0.001,1.534,-0.079],[-0.013,1.534,-0.079],[-0.024,1.535,-0.078],[-0.034,1.536,-0.077],[-0.043,1.537,-0.076],[-0.051,1.537,-0.073],[-0.068,1.538,-0.067],[-0.083,1.537,-0.053],[-0.088,1.536,-0.043],[-0.09,1.532,-0.031],[-0.086,1.523,-0.018],[-0.074,1.507,0.006],[-0.067,1.501,0.018],[-0.059,1.494,0.029],[-0.051,1.487,0.038],[-0.033,1.477,0.051],[-0.022,1.474,0.054],[0.001,1.468,0.054],[0.013,1.47,0.054],[0.037,1.477,0.05],[0.047,1.48,0.043],[0.066,1.492,0.027],[0.066,1.492,0.027],[0.079,1.505,0.005],[0.087,1.52,-0.015],[0.09,1.529,-0.029],[0.09,1.535,-0.043],[0.077,1.537,-0.059],[0.069,1.538,-0.067],[0.051,1.537,-0.075],[0.041,1.536,-0.077],[0.03,1.535,-0.078],[0.019,1.534,-0.077],[0.009,1.534,-0.078],[0.009,1.534,-0.079]],"apolet":{"sol":[[0.085,1.538,-0.038],[0.1,1.532,-0.056],[0.115,1.527,-0.043],[0.13,1.523,-0.044],[0.145,1.519,-0.044],[0.16,1.519,-0.044],[0.175,1.52,-0.043],[0.19,1.518,-0.042]],"sag":[[-0.085,1.538,-0.041],[-0.1,1.533,-0.056],[-0.115,1.528,-0.044],[-0.13,1.522,-0.045],[-0.145,1.52,-0.045],[-0.16,1.518,-0.029],[-0.175,1.511,-0.012],[-0.19,1.518,-0.045]]},"bilek":0.692,"sapka":[0,1.737,0.0],"sapkaR":[0.103,0.12],"kin":[0.165,1.0,0.02]};
const UDOKU={};
function dokuYukle(ad){ if(UDOKU[ad]) return UDOKU[ad];
  return UDOKU[ad]=new Promise(r=>{ new THREE.TextureLoader().load(MODEL_KOK+ad,t=>{ t.flipY=false; t.encoding=THREE.sRGBEncoding; t.anisotropy=4; t.__kalici=true; r(t); },undefined,()=>r(null)); }); }
async function uniformaHazirla(){ const [c,g,u,a]=await Promise.all(["kaan_ceket.jpg","kaan_govde.jpg","ogrenci_ust.jpg","ogrenci_alt.jpg"].map(dokuYukle)); UDOKU.hazir={ceket:c,govde:g,ogrUst:u,ogrAlt:a}; }
const bilesen=(A,i,k)=>{ let v=A.array[i*A.itemSize+k]; if(A.normalized){ const a=A.array; v/= a instanceof Uint8Array?255: a instanceof Uint16Array?65535:1; } return v; };
function sacSikistir(o,mrk,r){ // şapkanın altındaki saçı bandın ve tepenin içine çek
  const geo=o.geometry.clone(); const P=geo.attributes.position; const y0=mrk[1]-.004, bantUst=mrk[1]+.045, tepe=mrk[1]+.081;
  for(let i=0;i<P.count;i++){ const y=P.getY(i); if(y<y0) continue;
    const t=clamp((y-bantUst)/(tepe-bantUst),0,1); const sx=r[0]-.006+(.019)*t, sz=r[1]-.006+(.023)*t, cz=mrk[2]+.007*t;
    const x=P.getX(i)-mrk[0], z=P.getZ(i)-cz; const f=Math.hypot(x/sx,z/sz);
    if(f>1){ P.setX(i,mrk[0]+x/f); P.setZ(i,cz+z/f); }
    const ust=mrk[1]+.084; if(y>ust) P.setY(i,ust+(y-ust)*.25); }
  P.needsUpdate=true; geo.computeVertexNormals(); geo.computeBoundingSphere(); o.geometry=geo;
}
function kolKalinlastir(o,bilek){
  const geo=o.geometry.clone(); const P=geo.attributes.position, N=geo.attributes.normal, J=geo.attributes.skinIndex, W=geo.attributes.skinWeight;
  const kol=o.skeleton.bones.map(b=>/^(Left|Right)(Arm|ForeArm\d?)$/.test(b.name.replace(/^mixamorig/,"")));
  const ss=(a,b,x)=>{ const t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
  for(let i=0;i<P.count;i++){ let w=0; for(let k=0;k<4;k++) if(kol[bilesen(J,i,k)]) w+=bilesen(W,i,k); if(w<.02) continue;
    const ax=Math.abs(P.getX(i)); const d=.0085*w*ss(.30,.36,ax)*(1-.55*ss(bilek-.09,bilek-.015,ax));
    P.setXYZ(i,P.getX(i)+N.getX(i)*d,P.getY(i)+N.getY(i)*d,P.getZ(i)+N.getZ(i)*d); }
  P.needsUpdate=true; geo.computeBoundingSphere(); o.geometry=geo;
}
function torenParcalari(model,olcek){
  const altin=ALTIN();
  const kumas=new THREE.MeshStandardMaterial({color:renk("#434b31"),roughness:.86,side:THREE.DoubleSide});
  const deri=new THREE.MeshStandardMaterial({color:renk("#2a1a10"),roughness:.38,metalness:.05});
  const v=(a)=>new THREE.Vector3(a[0],a[1],a[2]);
  const dugmeGeo=new THREE.SphereGeometry(1,14,8,0,Math.PI*2,0,Math.PI/2); dugmeGeo.scale(1,.45,1);
  const dugme=(p,n,r,kemik)=>{ const m=new THREE.Mesh(dugmeGeo,altin); m.scale.setScalar(r); m.position.copy(p); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),n.normalize()); m.castShadow=true; kemigeBagla(model,kemik,m); };
  KU.dugme.forEach((d,i)=>{ const n=i===0?new THREE.Vector3(0,.55,1):new THREE.Vector3(0,.12,1); dugme(v(d).add(n.clone().normalize().multiplyScalar(.002)),n,.0078,["Spine2","Spine2","Spine1","Spine","Hips"][i]); });
  KU.cep.forEach(d=>dugme(v(d).add(new THREE.Vector3(0,0,.004)),new THREE.Vector3(Math.sign(d[0])*.25,.15,1),.0058,"Spine2"));
  // kemer + toka
  { const K=KU.kemer.map(v); const c=K.reduce((s,q)=>s.add(q),new THREE.Vector3()).multiplyScalar(1/K.length);
    K.sort((a,b)=>Math.atan2(a.x-c.x,a.z-c.z)-Math.atan2(b.x-c.x,b.z-c.z));
    const pos=[], idx=[]; const n=K.length;
    K.forEach(q=>{ const d=new THREE.Vector3(q.x-c.x,0,q.z-c.z).normalize(); const p=q.clone().addScaledVector(d,.007); pos.push(p.x,p.y-.022,p.z, p.x,p.y+.022,p.z); });
    for(let i=0;i<n;i++){ const a=i*2, b=((i+1)%n)*2; idx.push(a,b,a+1, b,b+1,a+1); }
    const g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals();
    const kb=new THREE.Mesh(g,deri); kb.material.side=THREE.DoubleSide; kb.castShadow=true; kemigeBagla(model,"Spine",kb);
    const on=K.reduce((m,q)=>q.z>m.z?q:m,K[0]);
    const toka=new THREE.Group(); for(const [w,h,x,y] of [[.056,.007,0,.0195],[.056,.007,0,-.0195],[.007,.046,-.0245,0],[.007,.046,.0245,0],[.004,.04,.004,0]]){ const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,.006),altin); b.position.set(x,y,0); toka.add(b); }
    toka.position.set(0,on.y,on.z+.012); kemigeBagla(model,"Spine",toka); }
  // dik yaka + yaka armaları
  { const Y=KU.yaka.map(v); const c=Y.reduce((s,q)=>s.add(q),new THREE.Vector3()).multiplyScalar(1/Y.length);
    Y.sort((a,b)=>Math.atan2(a.x-c.x,a.z-c.z)-Math.atan2(b.x-c.x,b.z-c.z));
    const pos=[], idx=[]; const n=Y.length;
    Y.forEach(q=>{ const d=new THREE.Vector3(q.x-c.x,0,q.z-c.z).normalize(); const p=q.clone().addScaledVector(d,.004); const u=p.clone().addScaledVector(d,-.007); pos.push(p.x,p.y-.004,p.z, u.x,p.y+.034,u.z); });
    for(let i=0;i<n;i++){ const a=i*2, b=((i+1)%n)*2; const ac=Math.atan2(Y[i].x-c.x,Y[i].z-c.z); if(Math.abs(ac)<.06) continue; idx.push(a,b,a+1, b,b+1,a+1); }
    const g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals();
    const yk=new THREE.Mesh(g,kumas); yk.castShadow=true; kemigeBagla(model,"Spine2",yk);
    for(const s of [-1,1]){ const hedef=Y.reduce((m,q)=>{ const a=Math.atan2(q.x-c.x,q.z-c.z); return Math.abs(a-s*.85)<Math.abs(Math.atan2(m.x-c.x,m.z-c.z)-s*.85)?q:m; },Y[0]);
      const d=new THREE.Vector3(hedef.x-c.x,0,hedef.z-c.z).normalize(); const r=new THREE.Mesh(new THREE.PlaneGeometry(.022,.016),new THREE.MeshStandardMaterial({map:armaDoku(),transparent:true,alphaTest:.35,metalness:.85,roughness:.3}));
      r.position.copy(hedef).addScaledVector(d,.006); r.position.y+=.016; r.lookAt(r.position.clone().add(d)); kemigeBagla(model,"Spine2",r); } }
  // apoletler
  for(const [ad,kemik] of [["sol","LeftShoulder"],["sag","RightShoulder"]]){ const A=KU.apolet[ad]; const s=ad==="sol"?1:-1;
    const y0=A[1][1], y1=A[6][1]; const ap=new THREE.Group();
    const govde=new THREE.Mesh(new THREE.BoxGeometry(.078,.005,.05),kumas); ap.add(govde);
    const uc=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.005,16,1,false,0,Math.PI),kumas); uc.rotation.y=s>0?Math.PI/2:-Math.PI/2; uc.position.x=-s*.039; ap.add(uc);
    const d=new THREE.Mesh(dugmeGeo,altin); d.scale.setScalar(.0055); d.position.set(-s*.04,.003,0); ap.add(d);
    for(const k of [-1,1]){ const sr=new THREE.Mesh(new THREE.BoxGeometry(.074,.0012,.002),altin); sr.position.set(0,.0028,k*.0245); ap.add(sr); }
    ap.position.set(s*.135,(y0+y1)/2+.006,-.044); ap.rotation.z=Math.atan2(y1-y0,s*.075); ap.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); kemigeBagla(model,kemik,ap); }
  // kın sol kalçada
  const kin=kinYap(); kin.position.set(KU.kin[0],KU.kin[1],KU.kin[2]); { const qy=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-Math.PI/2), qx=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),.6), qz=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),.1); kin.quaternion.copy(qz.multiply(qx).multiply(qy)); } kemigeBagla(model,"Hips",kin);
  return {kin};
}
/* öğrenciler (kalabalık modeli): doku, eldiven (köşe rengi), şapka */
const RPM_SAPKA={o:[0,1.762,.022],r:[.091,.111]};
function eldivenRenkle(o,elRenk,ten){
  const geo=o.geometry.clone(); const J=geo.attributes.skinIndex, W=geo.attributes.skinWeight; const n=J.count; const c=new Float32Array(n*3);
  const el=o.skeleton.bones.map(b=>/Hand/.test(b.name)); const A=renk(elRenk), T=ten;
  for(let i=0;i<n;i++){ let w=0; for(let k=0;k<4;k++) if(el[bilesen(J,i,k)]) w+=bilesen(W,i,k); w=clamp((w-.3)/.4,0,1); c[i*3]=T.r+(A.r-T.r)*w; c[i*3+1]=T.g+(A.g-T.g)*w; c[i*3+2]=T.b+(A.b-T.b)*w; }
  geo.setAttribute("color",new THREE.BufferAttribute(c,3)); o.geometry=geo;
}
function telefonYap(){ const g=new THREE.Group(); const m=new THREE.Mesh(new THREE.BoxGeometry(.072,.15,.009),mat("#151518",{roughness:.25,metalness:.4})); g.add(m);
  const ek=new THREE.Mesh(new THREE.PlaneGeometry(.064,.136),new THREE.MeshBasicMaterial({color:renk("#9fc2ff")})); ek.position.z=.0051; g.add(ek); g.userData.ekran=ek; return g; }
function etekYap(renkH){
  const pts=[]; for(let i=0;i<=12;i++){ const t=i/12; pts.push(new THREE.Vector2(.155+Math.pow(t,1.25)*.36, -t*.86)); }
  const geo=new THREE.LatheGeometry(pts,40);
  const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:renk(renkH),roughness:.55,side:THREE.DoubleSide}));
  m.castShadow=true; return m;
}


// hazır pişirilmiş kıyafet dokuları (bölüm kurulurken önceden yüklenir)
const KIYAFET_DOKU={};
async function kiyafetDokulari(adlar){ await Promise.all(adlar.filter(a=>!KIYAFET_DOKU[a]).map(async a=>{ const t=await _dokuYukle(a); if(t) KIYAFET_DOKU[a]=t; })); }
function dokuGiydir(m,doku){
  m.traverse(o=>{ if(!o.isMesh||!o.material) return; const n=o.material.name;
    if(n==="outfit"&&doku.kiyafet&&KIYAFET_DOKU[doku.kiyafet]){ const c=o.material.clone(); c.map=KIYAFET_DOKU[doku.kiyafet]; c.roughness=.9; c.metalness=0; c.roughnessMap=null; c.metalnessMap=null; c.envMapIntensity=.4; c.userData.kalici=true; o.material=c; }
    else if(n==="AvatarBody"&&doku.govde&&KIYAFET_DOKU[doku.govde]){ const c=o.material.clone(); c.map=KIYAFET_DOKU[doku.govde]; c.userData.kalici=true; o.material=c; } });
}
/* ---------- karakter ---------- */
const KIYAFETLER={
  kaan:{ uniforma:{sapka:true,tören:true}, kis:{kis:1}, oduncu:{doku:{kiyafet:"kaan_oduncu_kiyafet.jpg",govde:"kaan_oduncu_govde.jpg"}}, deri:{ust:"#1a1716",alt:"#1d1f26"}, gunluk:{}, takim:{takim:1}, kamuflaj:{ust:"kamuflaj",alt:"kamuflaj"}, yaz:{ust:"#f4f1ea",alt:"#d8cdb6"} },
  kardelen:{ gunluk:{}, kis:{kis:1}, mezun:{mezun:1}, bordo:{ust:"#7a2236"}, deri:{ust:"#1b1716",alt:"#2a3550"}, pembe:{pembe:1,kot:0}, ev:{ust:"#d9c7e8",alt:"#8a7aa0"}, yaz:{yaz:1} }
};
function vekil(){ return new THREE.Object3D(); }
function karakter(kim,kiyafetAd){
  const A=AVATAR[kim]; const g=new THREE.Group();
  const m=THREE.SkeletonUtils.clone(A.sahne); m.scale.setScalar(A.olcek); g.add(m);
  const plan=(KIYAFETLER[kim]||{})[kiyafetAd]||{};
  const yuz=[];
  m.traverse(o=>{ if(!o.isMesh) return;
    if(o.material&&o.material.name==="outfit"&&(plan.ust||plan.alt)&&o.material.map){ const c=o.material.clone(); c.map=kiyafetDoku(kim,plan,o.material.map); c.userData.kalici=true; c.roughness=.9; c.metalness=0; c.roughnessMap=null; c.metalnessMap=null; c.envMapIntensity=.45; o.material=c; }
    if(o.morphTargetDictionary&&o.morphTargetInfluences) yuz.push(o); });
  const kemik={}; m.traverse(n=>{ if(n.isBone) kemik[n.name.replace(/^mixamorig/,"")]=n; });
  const mixer=new THREE.AnimationMixer(m);
  const eylem={}; for(const c of A.klipler){ const e=mixer.clipAction(c); e.play(); e.setEffectiveWeight(0); eylem[c.name]=e; }
  eylem.idle.setEffectiveWeight(1); eylem.idle.time=Math.random()*2;
  const kafa=vekil(); kemik.Head.add(kafa); kafa.position.set(0,.09/A.olcek,0);
  const u={kim, model:m, kemik, mixer, eylem, kafa, govde:vekil(), kolS:vekil(), kolD:vekil(), yuz,
    faz:Math.random()*6, hiz:0, elele:0, salla:0, dans:0, otur:0, oturY:0, bak:0, bakNokta:null, gulumse:0, konus:0, alkis:0, saril:0, kilic:0, telefon:0, baslik:0,
    _ag:{idle:1,walk:0,run:0}, _kol:{S:{w:0,d:new THREE.Vector3(0,-1,0)},D:{w:0,d:new THREE.Vector3(0,-1,0)}}, _otur:0, _bak:0, _egik:0, _kirp:rnd(1,4), _kirpT:0, _gul:0, _cene:0, _dans:0};
  g.userData=u;
  if(plan.sapka){ m.traverse(o=>{ if(o.isMesh&&o.material&&/haircut/.test(o.material.name)) sacSikistir(o,KU.sapka,KU.sapkaR); });
    const s=sapkaYap(KU.sapkaR[0],KU.sapkaR[1]); s.position.set(KU.sapka[0],KU.sapka[1],KU.sapka[2]); kemigeBagla(m,"Head",s); u.sapka=s; }
  if(plan.tören&&TU.hazir){ const r=kaanGiydir(m,kemik,kim); u.kin=r.kin; u.ceket=r.ceket; }
  if(plan.kis&&TU.kis){ u.ceket=kisGiydir(m,kemik,kim); if(AVATAR_SAC[kim]) m.traverse(o=>{ if(o.isSkinnedMesh&&o.material&&/haircut/.test(o.material.name)) o.geometry=AVATAR_SAC[kim].kalin; }); }
  if(plan.mezun&&TU.mezun){ mezunGiydir(m,kemik); }
  if(plan.takim&&TU.takim){ u.ceket=takimGiydir(m,kemik,kim); }
  if(plan.yaz&&TU.yaz){ u.pembeEtek=yazGiydir(m); }
  if(plan.pembe&&TU.pembe){ const r=pembeGiydir(m,kemik,plan.kot); u.pembeEtek=r.etek; u.kotCeket=r.ceket; }
  if(plan.doku){ dokuGiydir(m,plan.doku); }
  if(plan.etek){ const e=etekYap(plan.etek); g.add(e); u.etek=e; }
  KARAKTERLER.push(g);
  return g;
}
function eldeTut(c,nesne,el){ c.userData.eldeki=nesne; c.userData.eldekiEl=el||"D"; if(!nesne.parent) scene.add(nesne); }
// iki elle göğsünün önünde, yüzü öne dönük tutar (plaket, diploma): nesne görsel modele bağlanır (dönerken gövdeyle döner), eller IK ile kenarlarından tutar
function gogusteTut(c,nesne,yatik){ const u=c.userData, m=u.model; u.eldeki=null; c.updateMatrixWorld(true); const om=u.kemik.LeftArm.getWorldPosition(new THREE.Vector3()).y-c.getWorldPosition(new THREE.Vector3()).y;
  m.add(nesne); nesne.visible=true; nesne.position.set(0,(om-.27)/m.scale.y,.29/m.scale.z); nesne.rotation.set(yatik?-Math.PI/2:0,0,0); nesne.scale.setScalar(1/m.scale.x); u.kolS.rotation.set(0,0,0); u.kolD.rotation.set(0,0,0); u.kolPoz="plaket"; }
function gogustenBirak(c,nesne,el){ c.userData.kolPoz=null; scene.add(nesne); nesne.scale.setScalar(1); if(el) eldeTut(c,nesne,el); else nesne.visible=false; }
function animasyon(){}

/* ---------- kalabalık ---------- */
// Michelle (kalabalıktaki kadınlar): dokudaki sarı pantolonu istenen renge boyar; ten, saç ve üst korunur (renk başına bir kez hesaplanır)
function michelleRenk(o,renkH){ const m=o.material; if(!m||!m.map||!m.map.image) return;
  const key="__mic"+renkH; let t=michelleRenk[key];
  if(!t){ const img=m.map.image; const cv=document.createElement("canvas"); cv.width=img.width; cv.height=img.height; const x=cv.getContext("2d"); x.drawImage(img,0,0);
    const d=x.getImageData(0,0,cv.width,cv.height), p=d.data; const h=new THREE.Color(renkH); const hr=h.r*255, hg=h.g*255, hb=h.b*255;
    for(let i=0;i<p.length;i+=4){ const r=p[i], g=p[i+1], b=p[i+2]; const mx=Math.max(r,g,b), mn=Math.min(r,g,b); if(mx<110||(mx-mn)/mx<.45) continue;
      let hue=mx===r?((g-b)/(mx-mn))*60:mx===g?(2+(b-r)/(mx-mn))*60:(4+(r-g)/(mx-mn))*60; if(hue<0) hue+=360; if(hue<38||hue>68) continue;
      const k=.35+(r*.3+g*.55+b*.15)/255*.85; p[i]=Math.min(255,hr*k); p[i+1]=Math.min(255,hg*k); p[i+2]=Math.min(255,hb*k); }
    x.putImageData(d,0,0); t=new THREE.CanvasTexture(cv); t.encoding=m.map.encoding; t.flipY=m.map.flipY; t.wrapS=m.map.wrapS; t.wrapT=m.map.wrapT; t.__kalici=true; michelleRenk[key]=t; }
  const m2=m.clone(); m2.map=t; m2.userData.kalici=false; o.material=m2; }
function kalabalik(tip,ayar={}){
  const A=AVATAR[tip]; if(!A) return null;
  const g=new THREE.Group(); const m=THREE.SkeletonUtils.clone(A.sahne); const s=A.olcek*(ayar.boy||1); m.scale.setScalar(s); g.add(m);
  const TUH=ayar.tören&&TU.hazir;
  m.traverse(o=>{ if(!o.isMesh) return; const n=o.material&&o.material.name||"";
    if(!TUH&&ayar.ust&&/Outfit_Top/.test(n)){ o.material=o.material.clone(); o.material.color=renk(ayar.ust); o.material.userData.kalici=false; }
    else if(!TUH&&ayar.alt&&/Outfit_Bottom/.test(n)){ o.material=o.material.clone(); o.material.color=renk(ayar.alt); o.material.userData.kalici=false; }
    if(/Beard/.test(n)) o.visible=false;
    if(tip==="michelle"&&ayar.ust&&/Ch03_Body/.test(n)) michelleRenk(o,ayar.ust);
    if(ayar.ton&&/Ch03_Body/.test(n)){ o.material=o.material.clone(); o.material.color=renk(ayar.ton); o.material.userData.kalici=false; }
    o.castShadow=!!ayar.golge; });
  const kemik={}; m.traverse(n=>{ if(n.isBone) kemik[n.name.replace(/^mixamorig/,"")]=n; });
  let kin=null;
  if(tip==="rpm"){ if(TUH){ kin=ogrenciGiydir(m,kemik).kin; } else sivilDuzelt(m,ayar.resmi); sacEkle(m,ayar.sac); }
  // parmaklar: rahat el (bağlama pozunda dümdüz ve açıktı); telefonlu yolcunun sağ eli telefonu kavrar, alkışlayanın elleri düz.
  // klipte parmak izi olmadığından bir kez kurmak yeter (animGuncelle ilk karede bu hali saklar)
  try{ g.updateMatrixWorld(true); for(const yan of ["Left","Right"]) parmakUygula(kemik,yan,ayar.alkis?"alkis":(yan==="Right"&&ayar.telefon&&!TUH)?"telefon":"rahat"); }catch(e){}
  const mixer=new THREE.AnimationMixer(m); const eylem={};
  for(const c of A.klipler){ const e=mixer.clipAction(c); eylem[c.name]=e; }
  const ad=ayar.anim||"idle"; const e=eylem[ad]||eylem.idle; e.play(); e.time=Math.random()*e.getClip().duration; e.timeScale=rnd(.85,1.1);
  if(eylem.walk&&eylem.walk!==e){ eylem.walk.play(); eylem.walk.setEffectiveWeight(0); }
  if(ayar.sapka){ const sp=sapkaYap(RPM_SAPKA.r[0],RPM_SAPKA.r[1]); sp.position.set(RPM_SAPKA.o[0],RPM_SAPKA.o[1],RPM_SAPKA.o[2]); kemigeBagla(m,"Head",sp); }
  // telefona bakan yolcu: telefon NPC grubunun çocuğu, her güncellemede sağ ele konur, ekranı yüze döner
  let tel=null; if(ayar.telefon&&!TUH){ tel=telefonYap(); tel.userData.ekran.material=new THREE.MeshBasicMaterial({color:renk(["#9fc2ff","#ffd9a0","#c9f0d0","#f6c6dc"][Math.floor(Math.random()*4)])}); tel.visible=false; g.add(tel); }
  g.userData={kalabalik:true, tip, model:m, mixer, kemik, eylem, temel:e, kin, hazirol:!!TUH, alkis:ayar.alkis||0, faz:Math.random()*6, _sayac:Math.random()*.1, bak:0, hiz:0, telefon:tel};
  KARAKTERLER.push(g); return g;
}

const _q=new THREE.Quaternion(), _q2=new THREE.Quaternion(), _q3=new THREE.Quaternion(), _v1=new THREE.Vector3(), _v2=new THREE.Vector3(), _v3=new THREE.Vector3(), _v4=new THREE.Vector3(), _e=new THREE.Euler(), _kq=new THREE.Quaternion();
function kemikYonelt(b,cocuk,hedefYon,w){
  if(w<=.001||!b||!cocuk) return;
  b.getWorldPosition(_v1); cocuk.getWorldPosition(_v2); _v2.sub(_v1).normalize();
  _q.setFromUnitVectors(_v2,hedefYon); _q2.identity().slerp(_q,w);
  b.parent.getWorldQuaternion(_q3); b.getWorldQuaternion(_q);
  _q.premultiply(_q2); _q3.invert(); b.quaternion.copy(_q3.multiply(_q));
  b.updateMatrixWorld(true);
}
function kemikDondur(b,eksenDunya,aci){
  if(!b||Math.abs(aci)<1e-4) return;
  _q2.setFromAxisAngle(eksenDunya,aci);
  b.parent.getWorldQuaternion(_q3); b.getWorldQuaternion(_q);
  _q.premultiply(_q2); _q3.invert(); b.quaternion.copy(_q3.multiply(_q));
  b.updateMatrixWorld(true);
}
// kemikDondur'un hızlı sürümü: alt ağacın dünya matrislerini her çağrıda yeniden hesaplamaz (kalça/omurgada 60+ kemik); ebeveyn zinciri getWorldQuaternion'la tazelenir.
// küçük ek dönüşler (duruş, nefes, ağırlık aktarma) art arda bununla yapılır, sonunda tek bir güncelleme yeter
const _v6=new THREE.Vector3(), _q4=new THREE.Quaternion();
function kemikDondurH(b,eksenDunya,aci){ if(!b||Math.abs(aci)<1e-5) return; b.parent.getWorldQuaternion(_q4); _v6.copy(eksenDunya).applyQuaternion(_q4.invert()); _q2.setFromAxisAngle(_v6,aci); b.quaternion.premultiply(_q2); }
function yuzAyarla(u,ad,deger){ for(const o of u.yuz){ const i=o.morphTargetDictionary[ad]; if(i!==undefined) o.morphTargetInfluences[i]=deger; } }
/* iki kemikli kol IK: el hedef noktaya gider, dirsek "kutup" yönüne bakar */
function kolIK(B,yan,hedef,kutup,w){
  const S=B[yan+"Arm"], E=B[yan+"ForeArm"], H=B[yan+"Hand"]; if(!S||!E||!H||w<=.001) return;
  const s=S.getWorldPosition(new THREE.Vector3()), e=E.getWorldPosition(new THREE.Vector3()), h=H.getWorldPosition(new THREE.Vector3());
  const L1=s.distanceTo(e), L2=e.distanceTo(h); const d=hedef.clone().sub(s); const D=Math.min(Math.max(d.length(),Math.abs(L1-L2)+.01),(L1+L2)*.995); d.normalize();
  const a=(L1*L1+D*D-L2*L2)/(2*D), yuk=Math.sqrt(Math.max(0,L1*L1-a*a));
  const pd=kutup.clone().addScaledVector(d,-kutup.dot(d)); if(pd.lengthSq()<1e-6) pd.set(0,-1,0); pd.normalize();
  const dirsek=s.clone().addScaledVector(d,a).addScaledVector(pd,yuk);
  kemikYonelt(S,E,dirsek.clone().sub(s).normalize(),w);
  const e2=E.getWorldPosition(new THREE.Vector3()); const uc=s.clone().addScaledVector(d,D);
  kemikYonelt(E,H,uc.sub(e2).normalize(),w);
}
function esBul(c){ const u=c.userData; return KARAKTERLER.find(o=>o!==c&&o.parent===c.parent&&!o.userData.kalabalik&&o.userData.kim&&o.userData.kim!==u.kim&&o.position.distanceTo(c.position)<2.2)||null; }
/* ---------- temas: gövde kesit profili (CPU skinning ile bir kez ölçülür) ----------
   karakterin yerel ekseninde (ileri +z, sol +x) 2 cm'lik yükseklik dilimlerinde gövdenin ön/arka/yan sınırı; kollar hariç */
function govdeOlcu(c){
  const u=c.userData; const durum=(u._otur>.5?1:0)+(u.oturY||0); if(u._olcu&&u._olcuD===durum) return u._olcu; u._olcuD=durum;
  c.updateMatrixWorld(true); const inv=new THREE.Matrix4().copy(c.matrixWorld).multiply(new THREE.Matrix4().makeRotationY(u.model.rotation.y)).invert(); // görsel gövde çerçevesi (dönüş yumuşatması dahil)
  const Y0=.5, ADIM=.02, N=70; const on=new Float32Array(N).fill(-1), arka=new Float32Array(N).fill(1), gen=new Float32Array(N).fill(0);
  const v=new THREE.Vector3();
  u.model.traverse(o=>{ if(!o.isSkinnedMesh||!o.visible) return; const g=o.geometry, pa=g.attributes.position, si=g.attributes.skinIndex, sw=g.attributes.skinWeight; if(!si||!sw) return;
    const kol=o.skeleton.bones.map(b=>/(Arm|Hand)/.test(b.name)); const adim=pa.count>20000?3:2; o.updateMatrixWorld(true);
    for(let i=0;i<pa.count;i+=adim){
      let kw=0; const i0=si.getX(i),i1=si.getY(i),i2=si.getZ(i),i3=si.getW(i);
      if(kol[i0]) kw+=sw.getX(i); if(kol[i1]) kw+=sw.getY(i); if(kol[i2]) kw+=sw.getZ(i); if(kol[i3]) kw+=sw.getW(i); if(kw>.3) continue;
      v.fromBufferAttribute(pa,i); o.boneTransform(i,v); v.applyMatrix4(o.matrixWorld).applyMatrix4(inv);
      const j=Math.round((v.y-Y0)/ADIM); if(j<0||j>=N||Math.abs(v.x)>.3) continue;
      if(v.z>on[j]) on[j]=v.z; if(v.z<arka[j]) arka[j]=v.z; if(Math.abs(v.x)>gen[j]) gen[j]=Math.abs(v.x); } });
  // boş dilimleri komşudan doldur
  for(let j=1;j<N;j++) if(gen[j]===0&&gen[j-1]>0){ on[j]=on[j-1]; arka[j]=arka[j-1]; gen[j]=gen[j-1]; }
  u._olcu={Y0,ADIM,N,on,arka,gen}; return u._olcu;
}
function profil(ol,dizi,y){ const j=Math.max(0,Math.min(ol.N-1,Math.round((y-ol.Y0)/ol.ADIM))); return ol[dizi][j]; }
// iki kişinin sarılırken gövdeleri değecek kadar yakın durması için kök arası mesafe
function sarilMesafe(a,b){ const A=govdeOlcu(a), B_=govdeOlcu(b); const ust=Math.min(a.userData.kemik.LeftArm.getWorldPosition(_v1).y-a.position.y, b.userData.kemik.LeftArm.getWorldPosition(_v2).y-b.position.y)-.02;
  let d=.2; for(let y=.85;y<=ust;y+=.02) d=Math.max(d,profil(A,"on",y)+profil(B_,"on",y)); return d-.012; }
/* avucun baktığı yön (dünya) */
function avucNormal(B,yan){ const h=kemikPoz(B[yan+"Hand"],new THREE.Vector3()), i=kemikPoz(B[yan+"HandIndex1"],new THREE.Vector3()).sub(h), p=kemikPoz(B[yan+"HandPinky1"],new THREE.Vector3()).sub(h); return i.cross(p).multiplyScalar(yan==="Right"?1:-1).normalize(); }
function _bukum(n,N,ax){ const a=n.clone().addScaledVector(ax,-n.dot(ax)), b=N.clone().addScaledVector(ax,-N.dot(ax)); if(a.lengthSq()<1e-6||b.lengthSq()<1e-6) return 0; a.normalize(); b.normalize(); return Math.atan2(a.clone().cross(b).dot(ax),a.dot(b)); }
/* eli yönlendir: parmaklar F yönüne, avuç N yönüne; bükümün yarısı ön kola dağıtılır (bilek burulmaz) */
function elYonelt(B,yan,F,N,w){
  const E=B[yan+"ForeArm"], H=B[yan+"Hand"], M1=B[yan+"HandMiddle1"]; if(!E||!H||!M1||w<=.001) return;
  const ax=kemikPoz(H,new THREE.Vector3()).sub(kemikPoz(E,new THREE.Vector3())).normalize();
  kemikYonelt(H,M1,F,w); const a0=_bukum(avucNormal(B,yan),N,F);
  kemikDondur(E,ax,a0*.5*w);
  kemikYonelt(H,M1,F,w); const a1=_bukum(avucNormal(B,yan),N,F); kemikDondur(H,F,a1*w);
}
/* parmakları avuca doğru kıvır (her karede dinlenme açısından) */
function parmakSifirla(B,yan){ for(const f of PARMAK) for(let j=1;j<=3;j++){ const b=B[yan+"Hand"+f+j]; if(!b) continue; if(!b.userData.q0) b.userData.q0=b.quaternion.clone(); else b.quaternion.copy(b.userData.q0); } }
function parmakKapaHam(B,yan,acilar,bas,w,kademe){
  const N=avucNormal(B,yan);
  for(const f of PARMAK){ const ac=f==="Thumb"?bas:acilar; const k=kademe?(kademe[f]||1):(f==="Pinky"?1.08:f==="Index"?.92:1);
    for(let j=1;j<=3;j++){ const b=B[yan+"Hand"+f+j], c=B[yan+"Hand"+f+(j+1)]; if(!b||!c) continue;
      const F=kemikPoz(c,new THREE.Vector3()).sub(kemikPoz(b,new THREE.Vector3())).normalize(); const eks=F.clone().cross(N); if(eks.lengthSq()<1e-8) continue;
      kemikDondur(b,eks.normalize(),ac[j-1]*w*k); } }
}
/* ---------- parmak duruşları ----------
   Animasyon kliplerinde parmak izi yok: parmaklar bağlama pozunda (dümdüz, birbirinden açık, başparmak yana fırlamış) kalıyordu; eller manken eli
   gibi duruyordu, telefon ve kutu avucun üstünde havada görünüyordu. Gerçek el dinlenirken parmaklar işaretten serçeye doğru artan bir kıvrımla
   bükülür, aralar kapanır, başparmak işaret parmağının yanına gelir. Her duruş bir kez hesaplanıp kemiklerin yerel dönüşü olarak saklanır;
   her karede yalnız kopyalanır (dünya hesabı yok). a: parmak eklemleri (kök, orta, uç), b: başparmak eklemleri, yay: parmak aralarını kapama (0-1),
   bas: [başparmakla işaret parmağı arasındaki açı (avuç düzleminde), başparmağın avuç önüne kalkışı] (radyan); b: başparmağın orta ve uç eklem bükümü */
const PK={Index:.82,Middle:1,Ring:1.12,Pinky:1.24,Thumb:1};
const PD={
  rahat:{a:[.22,.42,.24],b:[0,.22,.2],yay:.85,bas:[.5,.36]},
  tut:{a:[1.0,1.1,.7],b:[0,.4,.35],yay:.9,bas:[.62,.8]},
  telefon:{a:[.2,.3,.22],b:[0,.2,.16],yay:.9,bas:[.32,.72]},
  plaket:{a:[.42,.62,.42],b:[0,.25,.2],yay:.95,bas:[.55,.42]},
  bel:{a:[.14,.24,.16],b:[0,.1,.1],yay:.95,bas:[.55,.2]},
  kalp:{a:[.5,.74,.52],b:[0,.3,.25],yay:1,bas:[.5,.4]},
  ac:{a:[.1,.2,.14],b:[0,.1,.08],yay:.45,bas:[.65,.22]},
  alkis:{a:[.06,.12,.1],b:[0,.08,.06],yay:.95,bas:[.42,.2]},
  salla:{a:[.04,.08,.06],b:[0,.05,.04],yay:.5,bas:[.7,.15]},
  jest:{a:[.18,.36,.22],b:[0,.15,.12],yay:.65,bas:[.58,.3]} };
function parmakAyarla(B,yan,P){ // bağlama pozundan P duruşunu kurar (kemiklere yazar)
  parmakSifirla(B,yan); const H=B[yan+"Hand"]; H.updateMatrixWorld(true);
  const N=avucNormal(B,yan), dz=(b,c)=>{ const F=kemikPoz(c,new THREE.Vector3()).sub(kemikPoz(b,new THREE.Vector3())); return F.addScaledVector(N,-F.dot(N)).normalize(); };
  const M1=B[yan+"HandMiddle1"], M2=B[yan+"HandMiddle2"];
  // parmak aralarını kapa: işaret, yüzük ve serçe orta parmağa doğru döner (avuç düzleminde); tam bitişik olmasın diye küçük pay kalır
  if(P.yay&&M1&&M2){ const Fm=dz(M1,M2);
    for(const f of ["Index","Ring","Pinky"]){ const b=B[yan+"Hand"+f+"1"], c=B[yan+"Hand"+f+"2"]; if(!b||!c) continue; const F=dz(b,c);
      const a=Math.atan2(F.clone().cross(Fm).dot(N),F.dot(Fm)), pay=f==="Pinky"?.1:.06; if(Math.abs(a)>pay) kemikDondur(b,N,(a-Math.sign(a)*pay)*P.yay); } }
  // başparmak: el uzayında hedef yöne çevrilir (işaret parmağından bas[0] kadar başparmak tarafına, avucun önüne bas[1] kadar). Modellerin bağlama
  // pozu farklı (MetaPerson'da başparmak avuçtan ~20°, RPM'de ~40° önde; ek döndürme başparmağı avuçtan dışarı fırlatıyordu), bu yüzden hedef yön kullanılır.
  // sonra orta ve uç eklemi işaret parmağının orta boğumuna doğru bükülür (gerçek elde başparmak ucu oraya yaslanır)
  const T1=B[yan+"HandThumb1"], T2=B[yan+"HandThumb2"], T3=B[yan+"HandThumb3"], T4=B[yan+"HandThumb4"], I1=B[yan+"HandIndex1"], I2=B[yan+"HandIndex2"], P1=B[yan+"HandPinky1"];
  if(P.bas&&T1&&T2&&I1&&I2&&P1){ const Fi=dz(I1,I2); const Wr=kemikPoz(I1,new THREE.Vector3()).sub(kemikPoz(P1,new THREE.Vector3())); Wr.addScaledVector(N,-Wr.dot(N)); Wr.addScaledVector(Fi,-Wr.dot(Fi)).normalize();
    const th=P.bas[0], ph=P.bas[1]; const hedef=Fi.clone().multiplyScalar(Math.cos(th)).addScaledVector(Wr,Math.sin(th)).multiplyScalar(Math.cos(ph)).addScaledVector(N,Math.sin(ph)).normalize();
    kemikYonelt(T1,T2,hedef,1);
    const hI=kemikPoz(I2,new THREE.Vector3());
    for(const [b,c,ac] of [[T2,T3,P.b[1]],[T3,T4,P.b[2]]]){ if(!b||!c||!ac) continue; const pb=kemikPoz(b,new THREE.Vector3()), F=kemikPoz(c,new THREE.Vector3()).sub(pb).normalize(); const eks=F.clone().cross(hI.clone().sub(pb)); if(eks.lengthSq()<1e-10) continue; kemikDondur(b,eks.normalize(),ac); } }
  parmakKapaHam(B,yan,P.a,[0,0,0],1,PK);
}
const _PB=[]; for(const f of PARMAK) for(let j=1;j<=3;j++) _PB.push(f+j);
const PD_ON=new WeakMap(); // el kemiği -> hesaplanmış duruşlar (userData'ya konmaz: kemik kopyalanırken JSON'a çevrilir)
function parmakDurus(B,yan,ad){ const H=B[yan+"Hand"]; if(!H||!B[yan+"HandMiddle2"]) return null; let C=PD_ON.get(H); if(!C){ C={}; PD_ON.set(H,C); } if(C[ad]) return C[ad];
  const L=_PB.map(n=>B[yan+"Hand"+n]||null); const eski=L.map(x=>x&&x.quaternion.clone());
  parmakAyarla(B,yan,PD[ad]||PD.rahat); const S=L.map(x=>x&&x.quaternion.clone());
  if(ad==="rahat") L.forEach((x,i)=>{ if(x) x.userData.qR=S[i].clone(); });
  L.forEach((x,i)=>{ if(x) x.quaternion.copy(eski[i]); }); H.updateMatrixWorld(true);
  return C[ad]={L,S}; }
function parmakUygula(B,yan,ad){ const D=parmakDurus(B,yan,ad); if(!D) return; for(let i=0;i<D.L.length;i++) if(D.L[i]) D.L[i].quaternion.copy(D.S[i]); }
// el başka bir sistemin (el ele, sarılma, poz...) olmadığı karelerde: hedef duruşa ~0,25 sn'de yumuşak geçiş
function parmakGecis(u,B,yan,ad,dt){ const D=parmakDurus(B,yan,ad); if(!D) return; const G=(u._pg||(u._pg={}))[yan]||(u._pg[yan]={ad,w:1,son:D.S.map(q=>q&&q.clone()),bas:null});
  if(G.ad!==ad){ G.ad=ad; G.w=0; G.bas=G.son.map(q=>q&&q.clone()); }
  G.w=Math.min(1,G.w+dt/.25); const s=G.w*G.w*(3-2*G.w);
  for(let i=0;i<D.L.length;i++){ const x=D.L[i]; if(!x) continue; if(s>=1||!G.bas) x.quaternion.copy(D.S[i]); else x.quaternion.copy(G.bas[i]).slerp(D.S[i],s); G.son[i].copy(x.quaternion); } }
/* eski çağrılar için: parmaklar "rahat" duruştan başlar, hedef kıvrıma w oranında gider (w=0: rahat el, önceden dümdüz bağlama pozuydu) */
function parmakKapa(B,yan,acilar,bas,w){
  parmakUygula(B,yan,"rahat"); const R=PD.rahat; if(w<=.001) return;
  parmakKapaHam(B,yan,acilar.map((x,i)=>(x-R.a[i])*w),bas.map((x,i)=>(x-R.b[i])*w),1);
}
/* el kutusu: avuç + parmak köklerini kaplayan döndürülmüş kutu (parmakların karşıdaki ele girmemesi için) */
function elKutu(B,yan){
  const H=kemikPoz(B[yan+"Hand"],new THREE.Vector3()), I1=kemikPoz(B[yan+"HandIndex1"],new THREE.Vector3()), P1=kemikPoz(B[yan+"HandPinky1"],new THREE.Vector3()), M1=kemikPoz(B[yan+"HandMiddle1"],new THREE.Vector3()), M2=kemikPoz(B[yan+"HandMiddle2"],new THREE.Vector3());
  const F=M1.clone().sub(H); const uz=F.length()+M1.distanceTo(M2)*.7; F.normalize();
  const W=I1.clone().sub(P1); const gen=W.length(); W.addScaledVector(F,-W.dot(F)).normalize(); const N=F.clone().cross(W).normalize();
  const merkez=H.clone().addScaledVector(F,uz*.5).addScaledVector(W,I1.clone().add(P1).multiplyScalar(.5).sub(H).dot(W));
  return {m:merkez,F,W,N,h:[uz*.5+.005,gen*.5+.014,.0155]};
}
function _kutuda(q,k,r){ const d=_v4.copy(q).sub(k.m); return Math.abs(d.dot(k.F))<k.h[0]+r&&Math.abs(d.dot(k.W))<k.h[1]+r&&Math.abs(d.dot(k.N))<k.h[2]+r; }
/* parmaklar karşıdaki eli kavrar: her eklem küçük adımlarla kapanır, parmak karşı ele değdiği an durur (içinden geçmez) */
function parmakSar(B,yan,kutu,acilar,bas,w){
  const Nn=avucNormal(B,yan); const q=new THREE.Vector3(), a_=new THREE.Vector3(), b_=new THREE.Vector3();
  for(const f of PARMAK){ const ac=f==="Thumb"?bas:acilar; const zincir=[1,2,3,4].map(j=>B[yan+"Hand"+f+j]); if(zincir.some(x=>!x)) continue;
    const r=f==="Thumb"?.0095:.0085;
    const carp=j=>{ for(let k=j+1;k<4;k++){ kemikPoz(zincir[k],q); if(_kutuda(q,kutu,r)) return true; kemikPoz(zincir[k-1],a_); if(_kutuda(a_.lerp(q,.5),kutu,r)) return true; } return false; };
    for(let j=0;j<3;j++){ const b=zincir[j], c=zincir[j+1]; const maks=ac[j]*w*(f==="Pinky"?1.08:f==="Index"?.92:1); let top=0;
      if(carp(j)) continue;
      while(top<maks-1e-4){ const adim=Math.min(.1,maks-top); const F=kemikPoz(c,a_).sub(kemikPoz(b,b_)).normalize(); const eks=F.cross(Nn); if(eks.lengthSq()<1e-8) break; eks.normalize();
        kemikDondur(b,eks,adim); if(carp(j)){ kemikDondur(b,eks,-adim); if(adim>.03){ kemikDondur(b,eks,adim*.5); if(carp(j)) kemikDondur(b,eks,-adim*.5); else top+=adim*.5; } break; } top+=adim; } } }
}
/* gerçek el yüzeyi: elin deri köşeleri ve normalleri (skinning ile), hızlı en yakın nokta için ızgara */
function elYuzey(C,yan){
  const u=C.userData; u._elIdx=u._elIdx||{};
  if(!u._elIdx[yan]){ const L=[]; u.model.traverse(o=>{ if(!o.isSkinnedMesh||!o.visible) return; const g=o.geometry, si=g.attributes.skinIndex, sw=g.attributes.skinWeight; if(!si) return;
      const el=o.skeleton.bones.map(bn=>bn.name.indexOf(yan+"Hand")>=0); const id=[];
      for(let i=0;i<g.attributes.position.count;i++){ let w=0; if(el[si.getX(i)]) w+=sw.getX(i); if(el[si.getY(i)]) w+=sw.getY(i); if(el[si.getZ(i)]) w+=sw.getZ(i); if(el[si.getW(i)]) w+=sw.getW(i); if(w>.5) id.push(i); }
      if(id.length) L.push({o,id}); }); u._elIdx[yan]=L; }
  const H=.012, izg=new Map(), P=[], N=[]; const v=new THREE.Vector3(), n=new THREE.Vector3(), m=new THREE.Matrix4(), m3=new THREE.Matrix3();
  for(const {o,id} of u._elIdx[yan]){ const g=o.geometry, pa=g.attributes.position, na=g.attributes.normal, si=g.attributes.skinIndex, sw=g.attributes.skinWeight;
    for(const i of id){ v.fromBufferAttribute(pa,i); o.boneTransform(i,v); v.applyMatrix4(o.matrixWorld);
      let bk=si.getX(i), bw=sw.getX(i); if(sw.getY(i)>bw){ bw=sw.getY(i); bk=si.getY(i); } if(sw.getZ(i)>bw){ bw=sw.getZ(i); bk=si.getZ(i); }
      m.multiplyMatrices(o.skeleton.bones[bk].matrixWorld,o.skeleton.boneInverses[bk]).multiply(o.bindMatrix); m3.getNormalMatrix(m);
      n.fromBufferAttribute(na,i).applyMatrix3(m3).normalize(); const k=P.length; P.push(v.clone()); N.push(n.clone());
      const a=Math.floor(v.x/H)+","+Math.floor(v.y/H)+","+Math.floor(v.z/H); let c=izg.get(a); if(!c){ c=[]; izg.set(a,c); } c.push(k); } }
  return {P,N,izg,H};
}
// işaretli mesafe: + yüzeyin dışında, - içinde (en yakın deri noktasının normaline göre); uzaksa büyük pozitif
function yuzeyMesafe(S,q){ const H=S.H, x=Math.floor(q.x/H), y=Math.floor(q.y/H), z=Math.floor(q.z/H); let best=1e9, bi=-1;
  for(let a=-2;a<=2;a++) for(let b=-2;b<=2;b++) for(let c=-2;c<=2;c++){ const L=S.izg.get((x+a)+","+(y+b)+","+(z+c)); if(!L) continue; for(const k of L){ const d=S.P[k].distanceToSquared(q); if(d<best){ best=d; bi=k; } } }
  if(bi<0) return 1; return _v4.copy(q).sub(S.P[bi]).dot(S.N[bi]); }
/* kavrama çözümü (pahalı, nadiren): önce avuçları ayır (parmak kökleri karşı ele girmesin), sonra her parmak eklemi
   küçük adımlarla kapanır ve parmak karşı elin derisine değdiği an durur. sonuç eklem dönüşleri olarak saklanır */
const PARMAK_R={Thumb:.0105,Index:.0088,Middle:.009,Ring:.0085,Pinky:.0078};
function kavraCoz(B,yan,S,acilar,bas,Nn){
  const q=new THREE.Vector3(), a_=new THREE.Vector3(), b_=new THREE.Vector3(); const sonuc={};
  for(const f of PARMAK){ const ac=f==="Thumb"?bas:acilar; const z=[1,2,3,4].map(j=>B[yan+"Hand"+f+j]); if(z.some(x=>!x)) continue; const r=PARMAK_R[f];
    const carp=j=>{ for(let k=j+1;k<4;k++){ kemikPoz(z[k-1],a_); kemikPoz(z[k],q); for(const t of [.35,.7,1]){ b_.copy(a_).lerp(q,t); if(yuzeyMesafe(S,b_)<r) return true; } } return false; };
    for(let j=0;j<3;j++){ const b=z[j], c=z[j+1]; const maks=ac[j]; let top=0;
      // başlangıçta zaten değiyorsa parmağı biraz açarak dışarı çıkar
      for(let k=0;k<7&&carp(j);k++){ const F=kemikPoz(c,a_).sub(kemikPoz(b,b_)).normalize(); const eks=F.cross(Nn); if(eks.lengthSq()<1e-8) break; kemikDondur(b,eks.normalize(),-.08); top=maks; }
      if(!carp(j)) while(top<maks-1e-4){ const adim=Math.min(.09,maks-top); const F=kemikPoz(c,a_).sub(kemikPoz(b,b_)).normalize(); const eks=F.cross(Nn); if(eks.lengthSq()<1e-8) break; eks.normalize();
        kemikDondur(b,eks,adim); if(carp(j)){ kemikDondur(b,eks,-adim); const y=adim*.5; kemikDondur(b,eks,y); if(carp(j)) kemikDondur(b,eks,-y); break; } top+=adim; }
      sonuc[b.name]=b.quaternion.clone(); } }
  return sonuc;
}
// avuç tarafındaki parmak köklerinin karşı ele ne kadar girdiği (ayırma payı)
function avucGirme(B,yan,S){ let g=0; const q=new THREE.Vector3(), a=new THREE.Vector3();
  for(const f of ["Index","Middle","Ring","Pinky"]){ const r=PARMAK_R[f]; kemikPoz(B[yan+"Hand"+f+"1"],a); kemikPoz(B[yan+"Hand"+f+"2"],q);
    for(const t of [0,.5,1]){ const d=yuzeyMesafe(S,a.clone().lerp(q,t)); if(d<r) g=Math.max(g,r-d); } }
  const h=kemikPoz(B[yan+"Hand"],new THREE.Vector3()); kemikPoz(B[yan+"HandMiddle1"],a); const d=yuzeyMesafe(S,h.lerp(a,.6)); if(d<.016) g=Math.max(g,.016-d);
  return g; }
/* el ele: iki kişi aynı buluşma noktasını hesaplar; avuçlar karşı karşıya, parmaklar çapraz, Kaan'ın eli önde */
function eleleHedef(c,es){
  const q=c.getWorldQuaternion(new THREE.Quaternion()), qe=es.getWorldQuaternion(new THREE.Quaternion());
  const yerel=es.position.clone().sub(c.position).applyQuaternion(q.clone().invert()); const yan=yerel.x>0?"Left":"Right";
  const yerelE=c.position.clone().sub(es.position).applyQuaternion(qe.clone().invert()); const yanE=yerelE.x>0?"Left":"Right";
  const o1=c.userData.kemik[yan+"Arm"].getWorldPosition(new THREE.Vector3()), o2=es.userData.kemik[yanE+"Arm"].getWorldPosition(new THREE.Vector3());
  const ileri=new THREE.Vector3(0,0,1).applyQuaternion(q).add(new THREE.Vector3(0,0,1).applyQuaternion(qe)); ileri.y=0; if(ileri.lengthSq()<1e-4) ileri.set(0,0,1); ileri.normalize();
  const uz=(c_,y_)=>{ const B_=c_.userData.kemik; return B_[y_+"Arm"].getWorldPosition(new THREE.Vector3()).distanceTo(B_[y_+"ForeArm"].getWorldPosition(new THREE.Vector3()))+B_[y_+"ForeArm"].getWorldPosition(new THREE.Vector3()).distanceTo(B_[y_+"Hand"].getWorldPosition(new THREE.Vector3())); };
  const disa=o1.clone().sub(o2); disa.y=0; const ayri=disa.length(); disa.normalize();
  // avuç ortası buluşma noktası: omuzların ortası, kolların rahat sarktığı yükseklik; omuzlar uzaksa eller biraz daha yüksekte buluşur
  const P=o1.clone().add(o2).multiplyScalar(.5);
  const L=Math.min(uz(c,yan),uz(es,yanE)); const yatay=Math.min(ayri*.5,L*.8);
  P.y=Math.max(o1.y,o2.y)-Math.sqrt(Math.max(.04,(L*.93)**2-yatay*yatay))-.07;
  const otur=Math.max(c.userData._otur||0,es.userData._otur||0); if(otur>.3){ const kal=Math.max(c.userData.kemik.Hips.getWorldPosition(new THREE.Vector3()).y,es.userData.kemik.Hips.getWorldPosition(new THREE.Vector3()).y); P.y=Math.max(P.y,kal+.03); }
  P.addScaledVector(ileri,.07+(otur>.3?.1:0));
  const onde=c.userData.kim==="kaan";
  const N=ileri.clone().multiplyScalar(onde?-1:1);                               // Kaan'ın avucu geriye, Kardelen'inki öne bakar
  const F=new THREE.Vector3(0,-1,0).addScaledVector(disa,-.5).addScaledVector(ileri,.06).normalize(); // parmaklar aşağı ve karşıya: çapraz
  const T=P.clone().addScaledVector(N,-.016).addScaledVector(F,-.072);           // bilek
  return {yan,T,F,N,onde,kutup:ileri.clone().multiplyScalar(-1).addScaledVector(disa,.6).add(new THREE.Vector3(0,-.2,0)).normalize()};
}
function eleleIK(c,es,w){ const B=c.userData.kemik, r=eleleHedef(c,es);
  const u=c.userData; const kv=u._kavra3&&u._kavra3.yan===r.yan?u._kavra3:null;
  parmakSifirla(B,r.yan);
  const T=kv? r.T.clone().addScaledVector(r.N,-kv.ayri*w) : r.T;
  kolIK(B,r.yan,T,r.kutup,w); elYonelt(B,r.yan,r.F,r.N,w);
  // göreli el dönüşümü değişmediyse saklı kavrayışı uygula; değiştiyse (ya da hiç yoksa) yeniden çöz
  const yanE=eleleHedef(es,c).yan, eH=es.userData.kemik[yanE+"Hand"], bH=B[r.yan+"Hand"];
  const rel=new THREE.Matrix4().copy(eH.matrixWorld).invert().multiply(bH.matrixWorld);
  let yeni=!kv; if(kv){ const e=rel.elements, o=kv.rel.elements; let fark=0; for(let i=0;i<16;i++) fark=Math.max(fark,Math.abs(e[i]-o[i])*(i>=12?30:1)); yeni=fark>.12&&(u._kvT=(u._kvT||0)+1)%8===0; }
  if(yeni&&w>.96){ const S=elYuzey(es,yanE); let ayri=0;
    for(let k=0;k<3;k++){ const g=avucGirme(B,r.yan,S); if(g<.0015) break; ayri+=g; parmakSifirla(B,r.yan); kolIK(B,r.yan,r.T.clone().addScaledVector(r.N,-ayri),r.kutup,w); elYonelt(B,r.yan,r.F,r.N,w); }
    const Q=kavraCoz(B,r.yan,S,[1.05,1.2,.85],[.5,.55,.45],avucNormal(B,r.yan));
    u._kavra3={yan:r.yan,Q,ayri,t0:kv&&kv.yan===r.yan?kv.t0:zaman,rel:new THREE.Matrix4().copy(es.userData.kemik[yanE+"Hand"].matrixWorld).invert().multiply(B[r.yan+"Hand"].matrixWorld)}; }
  const k2=u._kavra3&&u._kavra3.yan===r.yan?u._kavra3:null;
  parmakDurus(B,r.yan,"rahat");
  if(k2){ const bl=clamp((zaman-k2.t0)/.35,0,1)*w; for(const f of PARMAK) for(let j=1;j<=3;j++){ const b=B[r.yan+"Hand"+f+j]; const q=b&&k2.Q[b.name]; if(q) b.quaternion.copy(b.userData.qR||b.userData.q0).slerp(q,bl); } B[r.yan+"Hand"].updateMatrixWorld(true); }
  else parmakUygula(B,r.yan,"rahat"); // kavrayış henüz çözülmediyse el rahat dursun (önceden parmaklar dümdüz açıktı)
  return r.yan; }
/* omuzdan sarılma (hatıra fotoğrafı pozu): uzun olan yakın kolunu onun omuzlarına atar, kısa olan yakın koluyla belinden sarar; ikisi de kameraya bakar */
function omuzIK(c,es,w){
  const u=c.userData, B=u.kemik, eB=es.userData.kemik;
  const q=c.getWorldQuaternion(new THREE.Quaternion()), qe=es.getWorldQuaternion(new THREE.Quaternion());
  const yerel=es.position.clone().sub(c.position).applyQuaternion(q.clone().invert()); const yan=yerel.x>0?"Left":"Right";
  const yerelE=c.position.clone().sub(es.position).applyQuaternion(qe.clone().invert()); const yanE=yerelE.x>0?"Right":"Left"; // onun benden uzak tarafı
  const uzun=(AV_BOY[u.kim]||1.7)>=(AV_BOY[es.userData.kim]||1.7);
  const ileri=new THREE.Vector3(0,0,1).applyQuaternion(qe); ileri.y=0; ileri.normalize();
  const dis=es.position.clone().sub(c.position); dis.y=0; dis.normalize();       // benden ona doğru
  const S=B[yan+"Arm"].getWorldPosition(new THREE.Vector3()); let T,F,N,kutup;
  if(uzun){ const om=eB[yanE+"Arm"].getWorldPosition(new THREE.Vector3());          // onun uzak omzu
    T=om.clone().add(new THREE.Vector3(0,.06,0)).addScaledVector(dis,-.035).addScaledVector(ileri,-.03);
    F=new THREE.Vector3(0,-.55,0).addScaledVector(ileri,.55).addScaledVector(dis,.25).normalize(); N=new THREE.Vector3(0,-1,0).addScaledVector(dis,-.35).normalize();
    kutup=ileri.clone().multiplyScalar(-1).add(new THREE.Vector3(0,.25,0)).normalize(); }
  else { const ol=govdeOlcu(es); const sp=eB.Spine.getWorldPosition(new THREE.Vector3()); const hy=sp.y-es.position.y;
    const arka=-profil(ol,"arka",hy); T=sp.clone().addScaledVector(ileri,-(arka+.03)).addScaledVector(dis,.09);
    F=dis.clone().addScaledVector(ileri,.15).add(new THREE.Vector3(0,-.25,0)).normalize(); N=ileri.clone(); kutup=ileri.clone().multiplyScalar(-1).addScaledVector(dis,-.3).add(new THREE.Vector3(0,-.4,0)).normalize(); }
  N.addScaledVector(F,-N.dot(F)).normalize();
  parmakSifirla(B,yan); kolIK(B,yan,T,kutup,w); elYonelt(B,yan,F,N,w); parmakKapa(B,yan,[.35,.45,.3],[.2,.2,.15],w);
  return yan;
}
/* arkadan sarılma (ATV/motor arkası): elleri önündekinin karnında birleşir, dirsekler onun belinin yanında */
function arkadanIK(c,es,w){
  const u=c.userData, B=u.kemik, eB=es.userData.kemik;
  const qe=es.getWorldQuaternion(new THREE.Quaternion()); const eI=new THREE.Vector3(0,0,1).applyQuaternion(qe), eX=new THREE.Vector3(1,0,0).applyQuaternion(qe);
  const ol=govdeOlcu(es); const sp=eB.Spine1.getWorldPosition(new THREE.Vector3()); const hy=sp.y-es.getWorldPosition(new THREE.Vector3()).y-.06;
  const on=profil(ol,"on",hy), gen=profil(ol,"gen",hy);
  for(const [yan,s] of [["Left",1],["Right",-1]]){ // ikisi de aynı yöne bakıyor: benim solum onun solu
    const T=sp.clone().add(new THREE.Vector3(0,-.06,0)).addScaledVector(eI,on+.015).addScaledVector(eX,s*.075);
    const F=eX.clone().multiplyScalar(-s).addScaledVector(eI,-.2).normalize(), N=eI.clone().multiplyScalar(-1);
    const kutup=eX.clone().multiplyScalar(s).add(new THREE.Vector3(0,-.5,0)).normalize();
    parmakSifirla(B,yan); kolIK(B,yan,T,kutup,w); elYonelt(B,yan,F,N,w); parmakKapa(B,yan,[.25,.35,.25],[.15,.15,.1],w); }
}
/* sarılma: uzun olan kollarını karşısındakinin omuzlarının dışından sırtının üstüne, kısa olan koltuk altlarından beline sarar.
   eller gövde yüzeyinde durur (profilden), dirsekler gövdenin dışında kalır */
const _YUK=new THREE.Vector3(0,1,0);
function sarilIK(c,es,w){
  const u=c.userData, B=u.kemik, eB=es.userData.kemik;
  const qe=es.getWorldQuaternion(new THREE.Quaternion()); const eI=new THREE.Vector3(0,0,1).applyQuaternion(qe); eI.y=0; eI.normalize();
  const eX=new THREE.Vector3(1,0,0).applyQuaternion(qe); eX.y=0; eX.normalize();
  const uzun=(AV_BOY[u.kim]||1.7)>=(AV_BOY[es.userData.kim]||1.7);
  const ol=govdeOlcu(es), eP=es.position;
  const dunya=(x,y,z)=>eP.clone().addScaledVector(eX,x).addScaledVector(_YUK,y).addScaledVector(eI,z);
  const yy=b=>b.getWorldPosition(new THREE.Vector3()).y-eP.y;
  const omuzX=Math.abs(eB.LeftArm.getWorldPosition(new THREE.Vector3()).sub(eP).dot(eX));
  const hy=uzun? yy(eB.Spine2)*.55+yy(eB.Neck)*.45 : yy(eB.Spine)+.03;
  for(const [yan,s] of [["Left",-1],["Right",1]]){
    const S=B[yan+"Arm"].getWorldPosition(new THREE.Vector3());
    const L=S.distanceTo(B[yan+"ForeArm"].getWorldPosition(_v1))+_v1.distanceTo(B[yan+"Hand"].getWorldPosition(_v2));
    const g=Math.max(.08,profil(ol,"gen",hy)), o=profil(ol,"on",hy), a=profil(ol,"arka",hy); const zc=(o+a)/2, bz=Math.max(.05,zc-a);
    let lx=uzun?.095:.085, T=null, F=null, N=null;
    for(let it=0;it<10;it++){
      const t=Math.min(.96,lx/g), zb=zc-bz*Math.sqrt(1-t*t);
      let nx=s*lx/(g*g), nz=(zb-zc)/(bz*bz); const nl=Math.hypot(nx,nz); nx/=nl; nz/=nl;         // dışa normal (yerel)
      let tx=-nz*s, tz=nx*s; if(tx*s>0){ tx=-tx; tz=-tz; }                                        // yüzey boyunca omurgaya doğru
      const n=eX.clone().multiplyScalar(nx).addScaledVector(eI,nz);
      F=eX.clone().multiplyScalar(tx).addScaledVector(eI,tz).normalize().addScaledVector(_YUK,uzun?-.45:-.2).normalize();
      N=n.clone().negate(); F.addScaledVector(N,-F.dot(N)).normalize();
      const Pc=dunya(s*lx,hy,zb).addScaledVector(n,.018);
      T=Pc.clone().addScaledVector(F,-.075);
      if(T.distanceTo(S)<L*.96||lx>g*.9) break; lx+=.02;
    }
    const Ed=uzun? dunya(s*(Math.max(g,omuzX)+.085),hy-.06,zc+.03) : dunya(s*(g+.065),hy+.03,zc+.01);
    const kutup=Ed.sub(S);
    parmakSifirla(B,yan); kolIK(B,yan,T,kutup,w); elYonelt(B,yan,F,N,w); parmakKapa(B,yan,[.22,.3,.2],[.12,.15,.1],w);
  }
}
// kişiye göre duruş düzeltme açıları (radyan)
// adlandırılmış kol pozları (karakter yerel uzayı: +x sol yan, +z ileri; L: gövde yükseklikleri, s: boy oranı)
const POZ_IK={
  bel:{ parmak:"bel", hedef:(L,sx,s)=>new THREE.Vector3(sx*.195*s,L.bel+.03,.0), kutup:sx=>new THREE.Vector3(sx,-.05,-.35), F:sx=>new THREE.Vector3(0,-.55,.85), N:sx=>new THREE.Vector3(-sx,0,.1) },
  kalp:{ parmak:"kalp", hedef:(L,sx,s)=>new THREE.Vector3(sx*.06*s,L.bas+.2*s,.05*s), kutup:sx=>new THREE.Vector3(sx,.25,.35), F:sx=>new THREE.Vector3(-sx,.15,.3), N:sx=>new THREE.Vector3(0,-.6,.6) },
  ac:{ parmak:"ac", hedef:(L,sx,s)=>new THREE.Vector3(sx*.6*s,L.omuz+.1,.32*s), kutup:sx=>new THREE.Vector3(0,-1,-.3), F:sx=>new THREE.Vector3(sx,.15,.45), N:sx=>new THREE.Vector3(0,.3,1) },
  // plaket: iki eliyle göğsünün önünde, yüzü objektife dönük tutar (önceden tek kolu göğsünün önünden çapraz uzanıyordu)
  plaket:{ parmak:"plaket", hedef:(L,sx,s)=>new THREE.Vector3(sx*.165*s,L.omuz-.27,.25*s), kutup:sx=>new THREE.Vector3(sx,-.5,-.3), F:sx=>new THREE.Vector3(-sx*.2,.15,1), N:sx=>new THREE.Vector3(-sx,0,0) },
  // buket: sağ el göğüs önünde, dirsek bükük; çiçekler omuz hizasında, yüzü kapatmaz
  buket:{ parmak:"tut", yanlar:["Right"], hedef:(L,sx,s)=>new THREE.Vector3(sx*.07*s,L.omuz-.33,.25*s), kutup:sx=>new THREE.Vector3(sx*.7,-1,-.15), F:sx=>new THREE.Vector3(-sx*.85,.15,.3), N:sx=>new THREE.Vector3(0,-.25,-1) } };
const _v5=new THREE.Vector3();
const DURUS={kaan:{kalca:.1,sirt:.05,gogus:.05,boyun:.05,dar:.06}, kardelen:{kalca:.16,sirt:.04,gogus:.04,boyun:.05,dar:.08}};
// Karıştırıcı (AnimationMixer) bir kemiğin hesapladığı değer bir önceki kareyle aynıysa o kemiğe hiç yazmaz (ör. bekleme klibinde
// başın birkaç kare sabit kaldığı anlar). O karelerde bizim üstüne eklediğimiz dönüşler (duruş, bakış, kafa eğme) birikip baş
// birden eğiliyor, sonra yerine "sıçrıyordu". Çözüm: güncellemeden önce kemikleri karıştırıcının son çıktısına geri al, sonra sakla.
// Bir karakterin bütün parçaları (gövde, baş, kıyafet, saç…) aynı kemikleri kullanır ama kopyalamada her parçaya ayrı iskelet düşüyordu:
// kalabalık sahnelerde 200 iskelet = her karede 200 kemik hesabı ve doku yüklemesi. Aynı kemik ve bağlama matrislerini kullanan parçalar tek iskeleti paylaşır.
function iskeletPaylas(kok){ const G=[];
  kok.traverse(o=>{ if(!o.isSkinnedMesh||!o.skeleton) return; const s=o.skeleton;
    const g=G.find(x=>x.bones.length===s.bones.length&&x.bones.every((b,i)=>b===s.bones[i])&&x.boneInverses.every((m,i)=>m.equals(s.boneInverses[i])));
    if(!g){ G.push(s); return; } if(g!==s){ if(s.boneTexture) s.dispose(); o.skeleton=g; } }); }
// küçük parçalar (düğme, rozet, kordon, göz, diş, kirpik) gölge haritasına çizilmez: gölgede seçilmezler ama her biri ayrı çizim çağrısıydı
// (mezuniyet sahnesinde kare başına 500 gölge çizimi). Çok küçük olanlar kalabalıkta uzaktan gizlenir (ayrıntı seviyesi).
const _gsV=new THREE.Vector3();
function golgeSadelestir(kok){ kok.updateMatrixWorld(true); const ayrinti=[]; // [ağ, en uzak görünme mesafesi]
  kok.traverse(o=>{ if(!o.isMesh) return; const ad=o.name||"";
    if(/Teeth|Tongue/i.test(ad)){ o.castShadow=false; if(o.visible) ayrinti.push([o,5]); return; }
    if(/Cornea|Eyeball|Eyelash|^Eye(Left|Right)/i.test(ad)){ o.castShadow=false; if(o.visible) ayrinti.push([o,16]); return; }
    if(o.isSkinnedMesh||(o.userData&&(o.userData.telefon||o.userData.kalici))) return;
    const g=o.geometry; if(!g) return; if(!g.boundingSphere) g.computeBoundingSphere(); o.getWorldScale(_gsV);
    const r=g.boundingSphere.radius*Math.max(Math.abs(_gsV.x),Math.abs(_gsV.y),Math.abs(_gsV.z));
    if(r<.11){ o.castShadow=false; if(r<.06&&o.visible) ayrinti.push([o,14]); } });
  return ayrinti; }
function animGuncelle(u,dt){
  if(u._kq) for(let i=0;i<u._kd.length;i++) u._kd[i].quaternion.copy(u._kq[i]);
  u.mixer.update(dt);
  if(!u._kq){ u._kd=Object.values(u.kemik); u._kq=u._kd.map(b=>b.quaternion.clone()); }
  else for(let i=0;i<u._kd.length;i++) u._kq[i].copy(u._kd[i].quaternion);
}
function karakterleriGuncelle(dt){
  for(const c of KARAKTERLER){
    if(!c.parent) continue;
    const u=c.userData;
    if(!u._iskelet){ iskeletPaylas(c); u._ayrinti=golgeSadelestir(c); u._iskelet=true; }
    if(u.kalabalik){ kalabalikGuncelle(c,dt); continue; }
    const A=u._ag, E=u.eylem;
    // görsel dönüş yumuşatma: kod karakteri bir anda çevirdiğinde (yüz yüze getirme, cevir, yerleştirme) gövde ~0,3 sn'de döner, kesik "pat" diye dönmez.
    // ışınlanma (büyük konum sıçraması), sahne değişimi ve yükleme sırasında doğrudan oturur. Dönerken ayaklar küçük adımlar atar (yerinde kayarak dönmez).
    let donusAdim=0;
    { const hy=c.rotation.y, tele=!u._gPoz||u._gSahne!==c.parent||YUKLENIYOR||u._gPoz.distanceToSquared(c.position)>.64;
      if(u._gYaw===undefined||tele) u._gYaw=hy; else { let f=hy-u._gYaw; f=Math.atan2(Math.sin(f),Math.cos(f)); u._gYaw+=Math.abs(f)<.002?f:f*Math.min(1,dt*12); }
      let off=u._gYaw-hy; off=Math.atan2(Math.sin(off),Math.cos(off)); u.model.rotation.y=Math.abs(off)<1e-4?0:off;
      if(Math.abs(off)>.2&&(u._otur||0)<.1&&!(u.saril>0)&&!(u.dans>0)&&!u.elHedef) donusAdim=Math.min(.95,Math.abs(off)*1.1);
      // oturduğu yere ışınlanınca (koltuğa, yatağa, banka konunca) oturma pozu doğrudan oturur: yarım saniye ayakta "eşyanın içinde" durmaz
      const sicra=u._gPoz&&u._gSahne===c.parent&&(u.hiz||0)<.5&&u._gPoz.distanceToSquared(c.position)>.06;
      if(tele||sicra){ u._otur=u.otur>0?1:0; u._dans=u.dans>0?1:0; }
      (u._gPoz||(u._gPoz=new THREE.Vector3())).copy(c.position); u._gSahne=c.parent; }
    const hiz=Math.max(u.hiz||0,donusAdim);
    let hRun=clamp((hiz-2.3)/.6,0,1), hWalk=clamp(hiz/1.2,0,1)*(1-hRun), hIdle=1-Math.max(hWalk,hRun);
    const k=1-Math.pow(.002,dt);
    A.idle=lerp(A.idle,hIdle,k); A.walk=lerp(A.walk,hWalk,k); A.run=lerp(A.run,hRun,k);
    E.idle.setEffectiveWeight(A.idle); E.walk.setEffectiveWeight(A.walk); E.run.setEffectiveWeight(A.run);
    if(E.agree) E.agree.setEffectiveWeight(0); if(E.headShake) E.headShake.setEffectiveWeight(0);
    // yürüyüş ve koşu klipleri ortak bir adım evresiyle sürülür (sol ayak basışları hizalı: koşu klibi yürüyüşten ~0.16 tur geride);
    // geçişte iki klip karışırken ayaklar birbirini tutar, "sekerek yürüme" görünmez
    { const wD=E.walk.getClip().duration, rD=E.run.getClip().duration, wHz=clamp(hiz/1.5,.6,1.7)/wD, rHz=clamp(hiz/4,.62,1.3)/rD;
      u._adimFaz=((u._adimFaz||0)+dt*lerp(wHz,rHz,A.run/(A.walk+A.run+1e-6)))%1;
      E.walk.timeScale=E.run.timeScale=0; E.walk.time=u._adimFaz*wD; E.run.time=(((u._adimFaz-.16)%1)+1)%1*rD; }
    animGuncelle(u,dt);
    const m=u.model, B=u.kemik;
    // göz kemiklerinin "ileri" yönü: klibin nötr pozunda (baş henüz döndürülmeden) gövdenin ileri yönü
    if(!u._gozF&&B.LeftEye&&B.RightEye){ u._gozF={}; m.getWorldQuaternion(_q4); const f0=new THREE.Vector3(0,0,1).applyQuaternion(_q4); for(const g of ["LeftEye","RightEye"]){ B[g].getWorldQuaternion(_q4); u._gozF[g]=f0.clone().applyQuaternion(_q4.clone().invert()); } u._gozD=null; }
    u._otur=lerp(u._otur,u.otur>0?1:0,1-Math.pow(.004,dt));
    u._dans=lerp(u._dans,u.dans>0?1:0,1-Math.pow(.02,dt));
    const kalcaY=AVATAR[u.kim].kalca;
    m.position.y=-(kalcaY-.13-(u.oturY||0))*u._otur;
    c.updateMatrixWorld(true);
    m.getWorldQuaternion(_kq); const kq=_kq; // görsel gövdenin yönü (dönüş yumuşatması dahil)
    const yon=(x,y,z)=>new THREE.Vector3(x,y,z).normalize().applyQuaternion(kq);
    // duruş düzeltmesi: animasyonlardan gelen öne eğik (kambur) gövde ve geriye çıkık kalça toparlanır, bacaklar fazla açık durmaz
    if(u._otur<.3&&u._dans<.3){ const D=DURUS[u.kim]||DURUS.kaan, w=1-Math.max(u._otur,u._dans)/.3, X=yon(1,0,0), Z=yon(0,0,1);
      const yur=A.walk+A.run;
      // leğen geriye (kalça içeri), bacaklar ve bel aynı açıyla dengelenir; üst sırt hafif dikleşir, baş öne düşmez
      kemikDondurH(B.Hips,X,-D.kalca*w); kemikDondurH(B.LeftUpLeg,X,D.kalca*w); kemikDondurH(B.RightUpLeg,X,D.kalca*w); kemikDondurH(B.Spine,X,D.kalca*w);
      const sg=(D.sirt+D.gogus)*w*(1-.35*yur); kemikDondurH(B.Spine1,X,-D.sirt*w*(1-.35*yur)); kemikDondurH(B.Spine2,X,-D.gogus*w*(1-.35*yur));
      kemikDondurH(B.Neck,X,-D.boyun*w); kemikDondurH(B.Head,X,sg+D.boyun*w);
      const dar=D.dar*w*A.idle; kemikDondurH(B.LeftUpLeg,Z,-dar); kemikDondurH(B.RightUpLeg,Z,dar); kemikDondurH(B.LeftLeg,Z,dar*.5); kemikDondurH(B.RightLeg,Z,-dar*.5); B.Hips.updateMatrixWorld(true); }
    if(u._otur>.01){
      const w=u._otur, sandalye=(u.oturY||0)>.2;
      for(const t of ["Left","Right"]){
        if(u.oturTip==="ata"){ const sx=t==="Left"?1:-1; kemikYonelt(B[t+"UpLeg"],B[t+"Leg"],yon(sx*.5,-.22,1),w); kemikYonelt(B[t+"Leg"],B[t+"Foot"],yon(sx*.12,-1,.28),w); }
        else if(sandalye){ kemikYonelt(B[t+"UpLeg"],B[t+"Leg"],yon(t==="Left"?.08:-.08,-.05,1),w); kemikYonelt(B[t+"Leg"],B[t+"Foot"],yon(0,-1,.12),w); }
        else { kemikYonelt(B[t+"UpLeg"],B[t+"Leg"],yon(t==="Left"?.1:-.1,.12,1),w); kemikYonelt(B[t+"Leg"],B[t+"Foot"],yon(0,-.3,1),w); } }
      kemikYonelt(B.Spine,B.Spine2,yon(0,1,sandalye?.02:-.12),w*.6);
    }
    if(u._dans>.01){ const sw=Math.sin(zaman*1.7+(u.kim==="kaan"?0:Math.PI))*.07*u._dans; kemikDondur(B.Hips,yon(0,0,1),sw); kemikDondur(B.Spine1,yon(0,0,1),-sw*1.4); }
    if(Math.abs(u.govde.rotation.z)>1e-3) kemikDondur(B.Spine1,yon(0,0,1),u.govde.rotation.z);
    if(Math.abs(u.govde.rotation.x)>1e-3) kemikDondur(B.Spine1,yon(1,0,0),u.govde.rotation.x);
    // canlılık: bekleme klibi tamamen durağan (nefes, ağırlık aktarma yok; karakterler heykel gibi duruyordu).
    // Üstüne nefes (göğüs ve omuzlar), yavaş ağırlık aktarma (kalça yuvarlanır, bacaklar ve gövde dengeler) eklenir; yürürken, dans ederken söner.
    { const t=zaman+u.faz*7, idle=A.idle*(1-Math.min(1,u._dans*1.5)), ayakta=idle*(1-u._otur);
      if(idle>.02){ const n=(Math.sin(t*1.55)+.25*Math.sin(t*3.1+.4))*.5+.5, X=yon(1,0,0), Z=yon(0,0,1);
        kemikDondurH(B.Spine1,X,-.014*n*idle); kemikDondurH(B.Spine2,X,-.01*n*idle); kemikDondurH(B.Neck,X,.012*n*idle);
        if(B.LeftShoulder) kemikDondurH(B.LeftShoulder,Z,.016*n*idle); if(B.RightShoulder) kemikDondurH(B.RightShoulder,Z,-.016*n*idle);
        if(ayakta>.02){ const sw=(Math.sin(t*.43)+.45*Math.sin(t*.97+1.3))*.55, tw=Math.sin(t*.31+.7);
          kemikDondurH(B.Hips,Z,.026*sw*ayakta); kemikDondurH(B.LeftUpLeg,Z,-.026*sw*ayakta); kemikDondurH(B.RightUpLeg,Z,-.026*sw*ayakta);
          kemikDondurH(B.Spine1,Z,-.018*sw*ayakta); kemikDondurH(B.Neck,Z,-.008*sw*ayakta);
          kemikDondurH(B.Hips,yon(0,1,0),.022*tw*ayakta); kemikDondurH(B.Spine2,yon(0,1,0),-.016*tw*ayakta); }
        B.Hips.updateMatrixWorld(true); } }
    // kollar: kolD = karakterin +x yanı (Left kemikleri), kolS = -x yanı (Right)
    const es=(u.elele>.05||u.saril>0||u.omuz>0||u.arkadan>0)?esBul(c):null; let ikKol=null;
    u._ikW=lerp(u._ikW||0,es?1:0,1-Math.pow(.0004,dt));
    if(es){ if(u.saril>0||u.arkadan>0) ikKol={Left:1,Right:1}; else if(u.omuz>0){ const yr=es.position.clone().sub(c.position).applyQuaternion(c.getWorldQuaternion(new THREE.Quaternion()).invert()); ikKol={[yr.x>0?"Left":"Right"]:1}; } else { const r=eleleHedef(c,es); ikKol={[r.yan]:1}; u._ele=r; } }
    // sarılırken gövdeler değecek kadar yaklaşır (iki kişi de yarı yolu gelir)
    if(es&&u.saril>0&&hiz<.3){ const dv=es.position.clone().sub(c.position); dv.y=0; const dist=dv.length(); if(dist>.05&&dist<1.2){ u._sm=u._sm||sarilMesafe(c,es); c.position.addScaledVector(dv.normalize(),(dist-u._sm)*.5*(1-Math.pow(.01,dt))); } }
    else if(u._sm&&!(u.saril>0)){ u._sm=0; u._ayril=.7; }
    // sarılma bitince yarım adım geri: konuşurken göğüs göğüse (gövdeler iç içe) kalmasınlar; iki kişi de ~0.6 sn'de birkaç santim açılır
    if(u._ayril>0){ u._ayril-=dt; const e2=esBul(c); if(e2&&!(u.saril>0)&&!(u.elele>.05)&&!(u.dans>0)&&!(u.arkadan>0)&&!(u.omuz>0)&&!(u.otur>0)&&!(e2.userData.otur>0)&&hiz<.3){ const dv=c.position.clone().sub(e2.position); dv.y=0; const d=dv.length(); if(d>.01&&d<.56) c.position.addScaledVector(dv.multiplyScalar(1/d),Math.min(.56-d,.24*dt)); else u._ayril=0; } else u._ayril=0; }
    const pozIK=POZ_IK[u.kolPoz]; u._pozW=lerp(u._pozW||0,pozIK?1:0,1-Math.pow(.003,dt)); if(pozIK) u._pozSon=u.kolPoz;
    const pozKol=u._pozW>.02&&POZ_IK[u._pozSon]&&!es, pozYan=pozKol?(POZ_IK[u._pozSon].yanlar||["Left","Right"]):[];
    // konuşma jestleri: konuşan karakter (ayakta, eli boşken) ara ara bir ya da iki eliyle sözüne eşlik eder; önkol öne kalkar, vurgularda hafifçe iner kalkar
    const J=u._jest||(u._jest={D:0,S:0,hD:0,hS:0,t:0,tip:0});
    if(u.konus>0){ J.t-=dt; if(J.t<=0){ J.t=rnd(1.2,2.6); const r=Math.random(); J.tip=r<.3?0:r<.62?1:r<.84?2:3; J.hS=(J.tip===1||J.tip===3)?1:0; J.hD=(J.tip===2||J.tip===3)?1:0; } }
    else { J.hD=J.hS=0; J.t=rnd(.15,.5); }
    J.D=lerp(J.D,J.hD,1-Math.pow(.03,dt)); J.S=lerp(J.S,J.hS,1-Math.pow(.03,dt));
    for(const [anah,kmk] of [["D","Left"],["S","Right"]]){
      if((ikKol&&ikKol[kmk]&&u._ikW>.02)||(u.elHedef&&u.elHedef[kmk])||pozYan.includes(kmk)) continue;
      const vk=anah==="D"?u.kolD:u.kolS, st=u._kol[anah], isaret=anah==="D"?1:-1;
      let aktif=false, px=vk.rotation.x, pz=vk.rotation.z, onKol=null, ozel=null;
      if(Math.abs(px)>.01||Math.abs(pz)>.01) aktif=true;
      const elKol=(u.kim==="kaan")?"D":"S";
      if(!aktif&&u.saril>0){ aktif=true; if(u.kim==="kaan"){ px=-.95; pz=-isaret*.15; } else { px=-1.55; pz=-isaret*.25; } }
      if(!aktif&&u._dans>.05){ aktif=true; if(u.kim==="kaan"){ px=-.75; pz=-isaret*.25; } else { px=-1.45; pz=-isaret*.3; } }
      if(!aktif&&u.kilic>0&&anah==="S"){ aktif=true; if(u.kilicYon){ const ky=u.kilicYon.clone().normalize().add(new THREE.Vector3(0,(u.titre||0)*.4,0)).normalize(); ozel=ky.clone().applyQuaternion(kq.clone().invert()); onKol=ky; } else { px=-1.0-u.kilic*.72; pz=-.12; onKol=yon(-.2,.55+u.kilic*.25,.9); } }
      if(!aktif&&u.telefon>0&&anah==="S"){ aktif=true; if(u.telefon>2.5){ px=-1.0; pz=.08; onKol=yon(.16,.95,.5); } else if(u.telefon>1.5){ px=-.4; pz=.1; onKol=yon(.42,.88,.72); } else { px=-.55; pz=.12; onKol=yon(.25,.55,1); } } // 1: göğüs önünde, 2: telefona bakıyor (yüzün önünde, önceden kol yana açık, el omuz hizasında havadaydı), 3: görüntülü arama (telefon yüz hizasında)
      if(!aktif&&u.alkis>0){ aktif=true; px=-.55; pz=-isaret*.12; onKol=yon(-isaret*(.55+Math.sin(zaman*14)*.2),.35,.8); }
      if(!aktif&&u.elele>.05&&anah===elKol&&!es){ aktif=true; px=-.1+Math.sin(u.faz)*.06*Math.min(1,hiz); pz=isaret*.32; }
      if(!aktif&&u.salla>0&&anah==="D"){ aktif=true; px=0; pz=2.5+Math.sin(zaman*8)*.25; onKol=yon(isaret*.25,1,.15); }
      if(!aktif&&u._otur>.5&&!(u.oturY>.2)){ aktif=true; px=.45; pz=isaret*.3; onKol=yon(isaret*.1,-1,-.3); }
      // sandalyede, bankta, yatakta otururken eller dizlerin üstünde (önceden kollar sandalyenin yanından dümdüz sarkıyordu)
      if(!aktif&&u._otur>.5&&u.oturY>.2&&u.oturTip!=="ata"){ aktif=true; px=-.32; pz=isaret*.12; onKol=yon(-isaret*.18,-.32,1); }
      // ayakta beklerken kollar gövdeye biraz daha yakın ve dirsek hafif bükük (bekleme klibinde kollar yana açık, eller havada duruyordu); yarı ağırlıkla
      let agir=1; if(!aktif&&u._otur<.1&&u._dans<.1&&(A.walk+A.run)<.15&&!(u.elele>.05)){ aktif=true; agir=.55; px=-.05; pz=isaret*.12; onKol=yon(isaret*.02,-1,.22);
        const jw=(u.eldeki&&u.eldekiEl===anah)?0:J[anah];
        if(jw>.01){ const t=zaman+u.faz*3+(anah==="D"?1.7:0), vur=.16*Math.sin(t*6.3)*Math.max(0,Math.sin(t*2.1))+.05*Math.sin(t*1.3), ikiEl=J.tip===3;
          // önce dirsek bükülür (önkol öne-yukarı kalkar), üst kol biraz geriden gelir: ara karede kol dümdüz öne uzanmış gibi görünmez
          const wf=Math.min(1,jw*1.8); agir=lerp(.55,.95,jw); px=lerp(-.05,-.28,jw); pz=isaret*lerp(.12,ikiEl?.16:.1,jw);
          onKol=new THREE.Vector3(isaret*.02,-1,.22).normalize().lerp(new THREE.Vector3(isaret*(ikiEl?.05:-.35),.12+vur,1).normalize(),wf).normalize().applyQuaternion(kq); } }
      st.w=lerp(st.w,aktif?agir:0,1-Math.pow(.003,dt));
      if(aktif){ if(ozel) _v3.copy(ozel); else { _e.set(px,0,pz); _v3.set(0,-1,0).applyEuler(_e); } st.d.lerp(_v3,1-Math.pow(.0005,dt)).normalize(); st.on=onKol; }
      if(st.w>.01){
        const d=st.d.clone().applyQuaternion(kq);
        kemikYonelt(B[kmk+"Arm"],B[kmk+"ForeArm"],d,st.w);
        // önkol yönü gövdeye göre yumuşatılır: bir pozdan ötekine (bekleme, jest, telefon...) geçerken önkol bir anda sıçramasın (alkış ve kılıç hızlı izlenir)
        const hL=st.on? st.on.clone().applyQuaternion(kq.clone().invert()) : (st.d.z>.55? new THREE.Vector3(-isaret,st.d.y*.4,.45).normalize() : st.d.clone().add(new THREE.Vector3(0,.15,.35)).normalize());
        if(!st.onL||ozel||u.alkis>0) st.onL=hL; else st.onL.lerp(hL,1-Math.pow(.0005,dt)).normalize();
        kemikYonelt(B[kmk+"ForeArm"],B[kmk+"Hand"],st.onL.clone().applyQuaternion(kq),st.w*.85);
      }
    }
    // fotoğraf pozları: eller gövdeye göre hedef noktalara IK ile gider (bel: eller belde, kalp: eller başın üstünde, aç: kollar açık)
    if(pozKol){ const Q=POZ_IK[u._pozSon], s=(AV_BOY[u.kim]||1.75)/1.75, w=u._pozW; c.getWorldPosition(_v5);
      const L={bel:B.Spine.getWorldPosition(_v1).y-_v5.y, bas:B.Head.getWorldPosition(_v1).y-_v5.y, omuz:B.LeftArm.getWorldPosition(_v1).y-_v5.y};
      for(const [yan,sx] of [["Left",1],["Right",-1]]){ if(!pozYan.includes(yan)) continue; const T=Q.hedef(L,sx,s).applyQuaternion(kq).add(_v5);
        kolIK(B,yan,T,Q.kutup(sx).normalize().applyQuaternion(kq),w); elYonelt(B,yan,Q.F(sx).normalize().applyQuaternion(kq),Q.N(sx).normalize().applyQuaternion(kq),w*.9); } }
    const yonet={}; // bu karede parmaklarını başka bir sistemin kurduğu eller
    if(es&&u._ikW>.01){ const w=u._ikW;
      if(u.saril>0){ sarilIK(c,es,w); u._kavra2=true; yonet.Left=yonet.Right=1; }
      else if(u.omuz>0){ yonet[omuzIK(c,es,w)]=1; u._kavra2=true; }
      else if(u.arkadan>0){ arkadanIK(c,es,w); u._kavra2=true; yonet.Left=yonet.Right=1; }
      else if(u._ele){ u._kavra2=eleleIK(c,es,w); yonet[u._kavra2]=1; } }
    else if(u._kavra2){ elSifirla(B,"Left"); elSifirla(B,"Right"); u._kavra2=null; u._kavra3=null; }
    if(u.elHedef){ for(const yan in u.elHedef){ const h=u.elHedef[yan]; if(!h||!B[yan+"Arm"]) continue; yonet[yan]=1; parmakSifirla(B,yan); kolIK(B,yan,h.p,h.kutup||yon(0,-.5,-1),1); if(h.F&&h.N) elYonelt(B,yan,h.F,h.N,1); parmakKapa(B,yan,h.kivrim||[1.1,1.3,.9],h.bas||[.6,.6,.5],1); } u._elH=true; }
    else if(u._elH){ elSifirla(B,"Left"); elSifirla(B,"Right"); u._elH=false; }
    // baş: bakNokta > bak açısı; kafa vekilinin z dönüşü = yana eğme
    // elinde telefon varken (başka yere bakması istenmediyse) telefona bakar
    const bakH=u.bakNokta||(u.telefon>0&&u.eldeki&&u.eldeki.userData.telefon&&u.eldeki.parent?u.eldeki.getWorldPosition(new THREE.Vector3()):null);
    { let bk=u.bak||0, by=0;
      if(bakH){ B.Neck.getWorldPosition(_v1); _v2.copy(bakH).sub(_v1); const yerel=_v2.clone().applyQuaternion(kq.clone().invert()); bk=Math.atan2(yerel.x,yerel.z); by=Math.atan2(yerel.y,Math.hypot(yerel.x,yerel.z)); }
      bk=Math.atan2(Math.sin(bk),Math.cos(bk));
      // hedef tam arkaya geçince baş sağ-sol uç arasında çırpınmasın: arkadaysa bulunduğu taraftan bakmayı sürdürür
      if(Math.abs(bk)>2.0&&Math.sign(bk)!==Math.sign(u._bak||0)&&Math.abs(u._bak||0)>.2) bk=Math.sign(u._bak)*1.1;
      bk=clamp(bk,-1.1,1.1); by=clamp(by,-.5,.4);
      // canlı baş: hep çok hafif oynar; konuşurken sözü vurgular gibi iner kalkar; karşısındaki konuşurken ara ara başını sallar (onaylar)
      { const t=zaman+u.faz*5; bk+=(.035*Math.sin(t*.37)+.02*Math.sin(t*.91+2))*(1-u._dans); by+=.02*Math.sin(t*.53+1);
        if(u.konus>0) { bk+=.03*Math.sin(zaman*2.3+u.faz); by+=.035*Math.sin(zaman*5.1+u.faz)*Math.max(0,Math.sin(zaman*1.7)); }
        else if(KARAKTERLER.some(o=>o!==c&&o.userData.konus>0&&!o.userData.kalabalik&&o.parent===c.parent&&o.position.distanceToSquared(c.position)<16)){
          u._dinle=(u._dinle||0)+dt; const fz=(u._dinle+u.faz)%3.4; if(fz<.6) by-=.07*Math.sin(fz/.6*Math.PI); } else u._dinle=0; }
      u._bak=lerp(u._bak,bk,1-Math.pow(.03,dt)); u._egik=lerp(u._egik,by,1-Math.pow(.03,dt));
      kemikDondur(B.Neck,yon(0,1,0),u._bak*.4); kemikDondur(B.Head,yon(0,1,0),u._bak*.6);
      const yanEksen=yon(1,0,0).applyAxisAngle(yon(0,1,0),u._bak);
      kemikDondur(B.Head,yanEksen,-u._egik*.8);
      if(Math.abs(u.kafa.rotation.z)>1e-3) kemikDondur(B.Head,yon(0,0,1),u.kafa.rotation.z); }
    // gözler: bakılan noktaya ya da konuşulan kişinin yüzüne döner; boşta ara ara küçük sıçramalarla (sakkad) etrafa bakar.
    // göz yuvası sınırı ~20°: gözler asla kayıp şaşı/ters görünmez
    if(u._gozF){
      let T=null; if(bakH) T=bakH;
      else { const es2=esBul(c); if(es2&&(u.konus>0||es2.userData.konus>0||u.saril>0||u.dans>0)){ T=bas(es2); T.y-=.03; } }
      u._sakT=(u._sakT||0)-dt; if(u._sakT<=0){ u._sakT=T?rnd(.9,2.2):rnd(.6,2.0); u._sakX=rnd(-1,1)*(T?.025:.16); u._sakY=rnd(-1,1)*(T?.02:.07); }
      const gm=B.LeftEye.getWorldPosition(_v1).add(B.RightEye.getWorldPosition(_v2)).multiplyScalar(.5);
      B.LeftEye.getWorldQuaternion(_q4); const fw=u._gozF.LeftEye.clone().applyQuaternion(_q4); // gözün şu an baktığı yön (başla birlikte)
      const yuk=new THREE.Vector3(0,1,0), sag=new THREE.Vector3().crossVectors(fw,yuk).normalize();
      if(T&&T.clone().sub(gm).normalize().dot(fw)<-.1) T=null; // hedef arkada kaldıysa gözler zorlanmaz, öne bakar
      let d=T? T.clone().sub(gm).normalize() : fw.clone();
      d.applyAxisAngle(yuk,u._sakX).applyAxisAngle(sag,u._sakY);
      // göz yuvası sınırı: baş yönünden en fazla ~20°
      const a=fw.angleTo(d), MAX=.36; if(a>MAX){ const q=new THREE.Quaternion().setFromUnitVectors(fw,d); d=fw.clone().applyQuaternion(new THREE.Quaternion().slerp(q,MAX/a)); }
      if(!u._gozD) u._gozD=d.clone(); else u._gozD.lerp(d,1-Math.pow(.00002,dt)).normalize();
      u._gozAsagi=Math.max(0,Math.asin(clamp(fw.y,-1,1))-Math.asin(clamp(u._gozD.y,-1,1))); // gözün başa göre aşağı bakışı (göz kapağı için)
      for(const g of ["LeftEye","RightEye"]){ B[g].getWorldQuaternion(_q4); const f=u._gozF[g].clone().applyQuaternion(_q4); const hedefY=T? T.clone().sub(B[g].getWorldPosition(_v3)).normalize().lerp(u._gozD,.5).normalize() : u._gozD;
        const b=f.angleTo(hedefY); if(b>1e-3){ const q=new THREE.Quaternion().setFromUnitVectors(f,hedefY); if(b>MAX+.05) q.slerp(new THREE.Quaternion(),1-(MAX+.05)/b); B[g].parent.getWorldQuaternion(_q3); const qa=_q4.clone().premultiply(q); B[g].quaternion.copy(_q3.invert().multiply(qa)); } } }
    // sarılırken başlar: kısa olan yanağını göğsüne yaslar (başı yana döner), uzun olan başını eğip onun başının üstüne yaslar; ikisi de aynı yöne bakar
    if(es&&u.saril>0&&u._ikW>.01){ const w=u._ikW, uzun=(AV_BOY[u.kim]||1.7)>=(AV_BOY[es.userData.kim]||1.7);
      if(!uzun){ kemikDondur(B.Spine2,yon(1,0,0),.06*w); kemikDondur(B.Neck,yon(1,0,0),.2*w); kemikDondur(B.Head,yon(0,1,0),1.15*w); kemikDondur(B.Head,yon(0,0,1),.14*w); }
      else { kemikDondur(B.Spine2,yon(1,0,0),.05*w); kemikDondur(B.Neck,yon(1,0,0),.3*w); kemikDondur(B.Head,yon(0,1,0),-.5*w); kemikDondur(B.Head,yon(0,0,1),-.22*w); } }
    // yüz: göz kırpma, gülümseme, konuşma
    if(u.yuz.length){
      u._kirp-=dt; let kir=0; if(u._kirp<0){ u._kirpT+=dt; kir=Math.sin(Math.min(1,u._kirpT/.16)*Math.PI); if(u._kirpT>.16){ u._kirpT=0; u._kirp=rnd(2.2,5.5); } }
      u._gul=lerp(u._gul,u.gulumse,1-Math.pow(.05,dt));
      const kn=u.konus>0? clamp(.12+.22*Math.sin(zaman*17+u.faz)*Math.sin(zaman*5.3)+.12*Math.sin(zaman*9.1),0,.45):0; u._cene=lerp(u._cene,kn,.5);
      // aşağı bakarken üst göz kapağı da iner (gerçekte kapak gözü izler; inmeyince telefona bakarken "şaşkın, faltaşı gibi" bakıyordu)
      const kapak=Math.max(kir,clamp((u._gozAsagi||0)*1.25-.04,0,.42),u.uyku||0); // uyku: gözler kapalı (sinemada omzunda uyuyakalınca)
      yuzAyarla(u,"eyeBlinkLeft",kapak); yuzAyarla(u,"eyeBlinkRight",kapak);
      const gl=Math.max(u._gul,u.kim==="kardelen"?.2:.06); // hafif, doğal tebessüm
      yuzAyarla(u,"mouthSmileLeft",gl*.7); yuzAyarla(u,"mouthSmileRight",gl*.7); yuzAyarla(u,"cheekSquintLeft",gl*.35); yuzAyarla(u,"cheekSquintRight",gl*.35);
      yuzAyarla(u,"jawOpen",u._cene); yuzAyarla(u,"mouthFunnel",u._cene*.3); yuzAyarla(u,"browInnerUp",u.baslik||0);
      if(u.kim==="kardelen"){ /* göz ve kaş biçimi kardelenYuzSekli'nde geometriye işlendi (dosyada eyeWide/browOuterUp hedefi yok) */ } // biraz daha açık, ışıltılı bakış
    }
    // parmaklar: başka bir sistemin yönetmediği eller hedef duruşa yumuşakça geçer (rahat el, elde nesne, fotoğraf pozu, alkış, el sallama, konuşma jesti)
    for(const yan of ["Left","Right"]){ if(yonet[yan]) continue; const anah=yan==="Left"?"D":"S", elde=u.eldeki&&(u.eldekiEl==="S"?"Right":"Left")===yan;
      if(elde&&u.eldeki.userData.kilic) continue;
      let ad="rahat";
      if(elde) ad=u.eldeki.userData.telefon?"telefon":"tut";
      else if(pozYan.includes(yan)&&u._pozW>.3) ad=POZ_IK[u._pozSon].parmak||"rahat";
      else if(u.alkis>0) ad="alkis";
      else if(u.salla>0&&anah==="D") ad="salla";
      else if(u._jest&&u._jest[anah]>.35) ad="jest";
      parmakGecis(u,B,yan,ad,dt); }
    // elde tutulan nesne
    if(u.titre>0) u.titre=Math.max(0,u.titre-dt*2.2);
    if(u.eldeki&&u.eldeki.userData.kilic){ u._kavra=u.eldekiEl==="S"?"Right":"Left"; kilicKavra(B,u._kavra,u.eldeki,u.kilicYon?u.kilicYon.clone().normalize().add(new THREE.Vector3(0,(u.titre||0)*.4,0)).normalize():yon(.05,1,.32),1); }
    else if(u._kavra){ elSifirla(B,u._kavra); u._kavra=null; }
    else if(u.eldeki){ const el=u.eldekiEl==="S"?"Right":"Left"; const h=B[el+"Hand"], f=B[el+"ForeArm"];
      h.getWorldPosition(_v1); f.getWorldPosition(_v2); _v4.copy(_v1).sub(_v2).normalize();
      u.eldeki.position.copy(_v1).addScaledVector(_v4,.07);
      if(u.eldeki.userData.dik){ c.getWorldQuaternion(u.eldeki.quaternion); u.eldeki.position.addScaledVector(_v4,-.05);
        // avucun ortasından tutulur (bilekten değil); tutY: nesnenin tutulan yüksekliği (buket sapından)
        const M1=B[el+"HandMiddle1"]; if(M1){ M1.getWorldPosition(_v3); u.eldeki.position.copy(_v1).lerp(_v3,.6); } if(u.eldeki.userData.tutY) u.eldeki.position.y-=u.eldeki.userData.tutY;
        if(u.eldeki.userData.egim) u.eldeki.rotateX(u.eldeki.userData.egim); } // dik tutulan (buket, kutu): dünya yukarısı korunur
      else if(u.eldeki.userData.telefon){
        // telefon avucun içinde: arkası avuca ve parmaklara yaslanır, ekranı avucun baktığı yöne döner (önceden elin sırtında, parmaklar telefonun dışında kalıyordu).
        // telefona bakarken ya da kulağa tutarken avuç başa döner: ekran yüze/kulağa bakar
        if(u.telefon>0&&B.Head){ const bs=B.Head.getWorldPosition(new THREE.Vector3()).sub(_v1), Fh=_v4.clone().add(new THREE.Vector3(0,.18,0)).normalize(); bs.addScaledVector(Fh,-bs.dot(Fh));
          if(bs.lengthSq()>1e-6){ elYonelt(B,el,Fh,bs.normalize(),1); h.getWorldPosition(_v1); } }
        const M1=B[el+"HandMiddle1"], N=avucNormal(B,el); M1.getWorldPosition(_v3); const F=_v3.clone().sub(_v1); F.addScaledVector(N,-F.dot(N)).normalize();
        u.eldeki.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(F.clone().cross(N).normalize(),F,N));
        u.eldeki.position.copy(_v1).addScaledVector(F,.085).addScaledVector(N,.024); }
      else u.eldeki.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),_v4); }
    temasGuncelle(c,u,B);
    // etek kalçayı izler
    if(u.etek){ B.Hips.getWorldPosition(_v1); c.worldToLocal(_v1); u.etek.position.set(_v1.x,_v1.y+.07,_v1.z); u.etek.scale.set(1,1-(u._otur*.55),1+u._otur*.3); u.etek.rotation.x=-u._otur*.35; }
  }
}
/* temas gölgesi: ayakların altında yumuşak koyuluk. Güneş gölgesinin düşmediği yerlerde (gölgelik, iç mekân, akşam) karakterler zemine basıyor
   görünsün, havada süzülür gibi durmasın. Ayaklar yerden kalkınca (taşınma, sıçrama) solar. */
let TEMAS_DOKU=null;
function temasDoku(){ if(TEMAS_DOKU) return TEMAS_DOKU; const c=document.createElement("canvas"); c.width=c.height=64; const x=c.getContext("2d"); const g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,"rgba(0,0,0,1)"); g.addColorStop(.4,"rgba(0,0,0,.6)"); g.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle=g; x.fillRect(0,0,64,64); TEMAS_DOKU=new THREE.CanvasTexture(c); TEMAS_DOKU.__kalici=true; return TEMAS_DOKU; }
const TEMAS_GEO=new THREE.PlaneGeometry(1,1); TEMAS_GEO.rotateX(-Math.PI/2); TEMAS_GEO.userData.kalici=true;
function temasGuncelle(c,u,B){ if(!B.LeftFoot||!B.RightFoot) return;
  if(!u._temas){ const mt=new THREE.MeshBasicMaterial({map:temasDoku(),color:0x000000,transparent:true,depthWrite:false,opacity:.4,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,fog:true}); mt.userData.kalici=true;
    const m=new THREE.Mesh(TEMAS_GEO,mt); m.renderOrder=1; m.castShadow=m.receiveShadow=false; m.userData.temas=true; c.add(m); u._temas=m; }
  const m=u._temas, o=B.LeftFoot.getWorldPosition(new THREE.Vector3()).add(B.RightFoot.getWorldPosition(new THREE.Vector3())).multiplyScalar(.5); c.worldToLocal(o);
  const yuk=Math.max(0,o.y-.12); m.position.set(o.x,.008,o.z); m.rotation.y=u.model.rotation.y; m.scale.set(.55,1,.72); m.material.opacity=.34*clamp(1-yuk*3,0,1); m.visible=m.material.opacity>.02; }
function kalabalikGuncelle(c,dt){
  const u=c.userData; u._sayac+=dt;
  // yolun sonunda geri dönen yürüyenler bir anda 180° çevrilmesin: gövde ~0,3 sn'de döner (görsel yön yumuşatması)
  if(u.model){ const hy=c.rotation.y, tele=!u._gPoz||u._gSahne!==c.parent||YUKLENIYOR||u._gPoz.distanceToSquared(c.position)>.64;
    if(u._gYaw===undefined||tele) u._gYaw=hy; else { let f=hy-u._gYaw; f=Math.atan2(Math.sin(f),Math.cos(f)); u._gYaw+=Math.abs(f)<.002?f:f*Math.min(1,dt*10); }
    let off=u._gYaw-hy; off=Math.atan2(Math.sin(off),Math.cos(off)); u.model.rotation.y=Math.abs(off)<1e-4?0:off;
    (u._gPoz||(u._gPoz=new THREE.Vector3())).copy(c.position); u._gSahne=c.parent; }
  // uzaktakiler daha seyrek güncellenir
  const uz=c.position.distanceTo(camera.position), aralik=uz>30?.12:uz>14?.05:0;
  // uzaktaki kalabalıkta düğme/rozet gibi minicik parçalar çizilmez (o mesafede birer pikselden küçükler)
  if(u._ayrinti&&u._ayrinti.length&&Math.abs(uz-(u._ayrUz||-99))>.5){ u._ayrUz=uz; for(const a of u._ayrinti){ const gor=a[0].visible? uz<a[1]+.75 : uz<a[1]; if(a[0].visible!==gor) a[0].visible=gor; } }
  if(u._sayac<aralik) return; const t=u._sayac; u._sayac=0;
  // yürüyen kalabalığın adım sıklığı gerçek hızına göre (rastgele sabit hızda adım atınca ayaklar yerde kayıyordu)
  if(u.eylem.walk&&u.temel===u.eylem.walk&&u.hiz>0) u.eylem.walk.timeScale=clamp(u.hiz/1.4,.55,1.6);
  if(u.eylem.walk&&u.temel!==u.eylem.walk){ const yw=clamp((u.hiz||0)/1.1,0,1); u.eylem.walk.setEffectiveWeight(yw); u.temel.setEffectiveWeight(1-yw); u.eylem.walk.timeScale=clamp((u.hiz||0)/1.4,.7,1.9); }
  animGuncelle(u,t);
  // ayakta bekleyen sivil kalabalık: bekleme klibindeki açık kolları doğal biçimde yanlara indir
  if(!u.hazirol&&!u.kilicPoz&&!u.alkis&&u.eylem.idle&&u.temel===u.eylem.idle&&(u.hiz||0)<.15){ c.updateMatrixWorld(true); u.model.getWorldQuaternion(_kq); const B=u.kemik;
    // nefes ve hafif ağırlık aktarma (bekleme klibi durağan; kalabalık heykel gibi durmasın)
    if(uz<22&&B.Spine1){ const tt=zaman+u.faz*7, n=Math.sin(tt*1.6)*.5+.5, sw=Math.sin(tt*.45)+.4*Math.sin(tt*1.03+1.1), X=_v1.set(1,0,0).applyQuaternion(_kq).clone(), Z=_v2.set(0,0,1).applyQuaternion(_kq).clone();
      kemikDondurH(B.Spine1,X,-.014*n); if(B.Spine2) kemikDondurH(B.Spine2,X,-.01*n);
      if(B.Hips&&B.LeftUpLeg&&B.RightUpLeg){ kemikDondurH(B.Hips,Z,.02*sw); kemikDondurH(B.LeftUpLeg,Z,-.02*sw); kemikDondurH(B.RightUpLeg,Z,-.02*sw); kemikDondurH(B.Spine1,Z,-.014*sw); }
      if(B.Hips) B.Hips.updateMatrixWorld(true); }
    for(const [kmk,is] of [["Left",1],["Right",-1]]){ if(!B[kmk+"Arm"]||!B[kmk+"ForeArm"]||!B[kmk+"Hand"]) continue;
      kemikYonelt(B[kmk+"Arm"],B[kmk+"ForeArm"],new THREE.Vector3(is*.16,-1,.05).normalize().applyQuaternion(_kq),.72);
      kemikYonelt(B[kmk+"ForeArm"],B[kmk+"Hand"],new THREE.Vector3(is*.06,-1,.2).normalize().applyQuaternion(_kq),.6); }
    if(u.telefon&&B.RightArm&&B.RightForeArm&&B.RightHand&&B.Head){ // dirsek bükük, telefon göğüs önünde, baş eğik
      kemikYonelt(B.RightArm,B.RightForeArm,new THREE.Vector3(.02,-1,.42).normalize().applyQuaternion(_kq),1);
      kemikYonelt(B.RightForeArm,B.RightHand,new THREE.Vector3(.62,.62,.8).normalize().applyQuaternion(_kq),1);
      kemikDondur(B.Head,new THREE.Vector3(1,0,0).applyQuaternion(_kq),.42+Math.sin(zaman*.4+u.faz)*.05);
      const el_=B.RightHand.getWorldPosition(new THREE.Vector3()), bs=B.Head.getWorldPosition(new THREE.Vector3());
      el_.addScaledVector(new THREE.Vector3(0,0,1).applyQuaternion(_kq),.07).addScaledVector(new THREE.Vector3(1,0,0).applyQuaternion(_kq),.04).add(new THREE.Vector3(0,.03,0));
      u.telefon.position.copy(c.worldToLocal(el_)); u.telefon.lookAt(bs); u.telefon.visible=true; }
    else if(B.Neck){ // konuşulan kişiye bakar (bakNokta); yoksa etrafa bakınır: boyun yavaşça sağa sola döner
      let a; if(u.bakNokta){ B.Neck.getWorldPosition(_v1); const y=_v2.copy(u.bakNokta).sub(_v1).applyQuaternion(_kq.clone().invert()); let ham=Math.atan2(y.x,y.z); if(Math.abs(ham)>2&&Math.sign(ham)!==Math.sign(u._bakA||0)&&Math.abs(u._bakA||0)>.2) ham=Math.sign(u._bakA)*.9; a=clamp(ham,-.9,.9); }
      else a=Math.sin(zaman*.23+u.faz)*.3+Math.sin(zaman*.57+u.faz*2.3)*.12;
      u._bakA=lerp(u._bakA===undefined?a:u._bakA,a,.2); kemikDondur(B.Neck,new THREE.Vector3(0,1,0),u._bakA); } }
  else if(u.telefon) u.telefon.visible=false;
  // yürüyen kalabalık (RPM modeli): hazır yürüyüş klibi bu iskelette kolları bozuk oynatıyordu (dirsekler bükük, önkollar yana açık, avuçlar
  // yukarı: parkta "kollarını açmış yürüyen adam"). Kollar yanlarda, bacaklarla ters fazda öne-arkaya salınır; dirsek hafif bükük.
  if(u.tip==="rpm"&&!u.hazirol&&!u.kilicPoz&&!u.alkis&&!u.telefon&&u.eylem.walk&&u.temel===u.eylem.walk&&(u.hiz||0)>.05){ c.updateMatrixWorld(true); u.model.getWorldQuaternion(_kq); const B=u.kemik, ters=_kq.clone().invert();
    const bacak=k=>B[k+"Leg"]&&B[k+"UpLeg"]?B[k+"Leg"].getWorldPosition(new THREE.Vector3()).sub(B[k+"UpLeg"].getWorldPosition(new THREE.Vector3())).normalize().applyQuaternion(ters).z:0;
    const sw=clamp((bacak("Right")-bacak("Left"))*.55,-.45,.45); // sol kol sağ bacakla birlikte öne gider
    for(const [kmk,is,s_] of [["Left",1,sw],["Right",-1,-sw]]){ const A_=B[kmk+"Arm"], F_=B[kmk+"ForeArm"], H_=B[kmk+"Hand"]; if(!A_||!F_) continue;
      kemikYonelt(A_,F_,new THREE.Vector3(is*.14,-1,s_).normalize().applyQuaternion(_kq),1);
      if(H_) kemikYonelt(F_,H_,new THREE.Vector3(is*.05,-1,s_+.3).normalize().applyQuaternion(_kq),1); } }
  // tören: hazır ol duruşu (kollar yanlarda); kılıç kolu ayrıca yönetilir
  if(u.hazirol){ c.updateMatrixWorld(true); u.model.getWorldQuaternion(_kq); const B=u.kemik;
    for(const [kmk,is] of [["Left",1],["Right",-1]]){ if(kmk==="Right"&&u.kilicPoz&&u.kilicN) continue;
      kemikYonelt(B[kmk+"Arm"],B[kmk+"ForeArm"],new THREE.Vector3(is*.1,-1,.03).normalize().applyQuaternion(_kq),1);
      kemikYonelt(B[kmk+"ForeArm"],B[kmk+"Hand"],new THREE.Vector3(is*.03,-1,.1).normalize().applyQuaternion(_kq),1); } }
  if(u.kilicPoz&&u.kilicN){ c.updateMatrixWorld(true); u.model.getWorldQuaternion(_kq); const B=u.kemik;
    if(u.titre>0) u.titre=Math.max(0,u.titre-t*2.2);
    const kolY=u.kilicYon? u.kilicYon.clone().normalize().add(new THREE.Vector3(0,(u.titre||0)*.4,0)).normalize() : new THREE.Vector3(-.12,.25,1).normalize().applyQuaternion(_kq);
    kemikYonelt(B.RightArm,B.RightForeArm,kolY,1);
    kemikYonelt(B.RightForeArm,B.RightHand,u.kilicYon? kolY.clone().add(new THREE.Vector3(0,.35,0)).normalize() : new THREE.Vector3(-.04,1,.7).normalize().applyQuaternion(_kq),1);
    kilicKavra(B,"Right",u.kilicN,u.kilicYon? kolY : new THREE.Vector3(.05,1,.3).normalize().applyQuaternion(_kq),1); u._kavra=true; }
  else if(u._kavra){ elSifirla(u.kemik,"Right"); u._kavra=false; }
  if(u.alkis>0){ c.updateMatrixWorld(true); u.model.getWorldQuaternion(_kq); const B=u.kemik;
    for(const [kmk,is] of [["Left",1],["Right",-1]]){ const d=new THREE.Vector3(is*.25,-.45,1).normalize().applyQuaternion(_kq); kemikYonelt(B[kmk+"Arm"],B[kmk+"ForeArm"],d,1);
      const d2=new THREE.Vector3(-is*(.6+Math.sin(zaman*13+u.faz)*.3),.4,.7).normalize().applyQuaternion(_kq); kemikYonelt(B[kmk+"ForeArm"],B[kmk+"Hand"],d2,1); } }
}
