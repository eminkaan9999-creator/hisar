/* ================= KAMERA & OYUNCU ================= */
const Kamera={hedef:new THREE.Vector3(), poz:new THREE.Vector3(), mesafe:7, yukseklik:3.2, aci:0, sinema:null};
// kamerayı kapatan büyük eşyalar (ranza, dolap…): userData.kameraEngel=true; kamera onlarla karakter arasına girmez, öne yaklaşır
let _KENG=[], _kengSahne=null, _kengSay=-1; const _kRay=new THREE.Raycaster();
function kameraEngelleri(){ if(_kengSahne!==scene||_kengSay!==scene.children.length){ _KENG=[]; _kengSahne=scene; _kengSay=scene.children.length; scene.traverse(o=>{ if(o.userData&&o.userData.kameraEngel) _KENG.push(o); }); } return _KENG; }
function kameraGuncelle(dt){
  const K=Kamera;
  if(K.sinema){ K.sinema(dt); return; }
  if(YUKLENIYOR) return; // sahne kurulurken takip kamerası oynamaz: kurulumda açıkça konan kamera bozulmasın, eski sahneden süzülme olmasın
  const ist=new THREE.Vector3(K.hedef.x+Math.sin(K.aci)*K.mesafe, K.hedef.y+K.yukseklik, K.hedef.z+Math.cos(K.aci)*K.mesafe);
  // yeni sahnede takip kamerası doğrudan yerine oturur (eski sahneden süzülmez); ara sahne kamerası çok uzakta kaldıysa (ör. tribündeki yakın çekimden
  // meydanın öbür ucundaki oyuncuya) gökyüzünden süzülerek değil, kesmeyle oyuncunun arkasına geçer
  if(Number.isNaN(K.poz.x)||K.poz.distanceToSquared(ist)>64) K.poz.copy(ist);
  KAMERA_ESKI=false;
  const E=kameraEngelleri(); let yakin=0;
  if(E.length){ const bak=new THREE.Vector3(K.hedef.x,K.hedef.y+1.25,K.hedef.z), yon=ist.clone().sub(bak), L=yon.length();
    if(L>.01){ yon.divideScalar(L); _kRay.set(bak,yon); _kRay.far=L; const h=_kRay.intersectObjects(E,true);
      // kamera eşyaya takılıp karaktere yaklaşınca biraz yükselir ve omuz hizasına bakar (yakından bele/kalçaya bakan kadraj olmasın)
      if(h.length){ const d=Math.max(.45,h[0].distance-.25); yakin=clamp(1-d/L,0,1); ist.copy(bak).addScaledVector(yon,d); ist.y+=.5*yakin; K.poz.lerp(ist,1-Math.pow(.0005,dt)); } } }
  K._yakin=lerp(K._yakin||0,yakin,1-Math.pow(.02,dt));
  K.poz.lerp(ist,1-Math.pow(.02,dt)); camera.position.copy(K.poz);
  camera.lookAt(K.hedef.x,K.hedef.y+1+.42*K._yakin,K.hedef.z);
}
/* çarpışma: ağaç gövdeleri, direkler, banklar, kayalar, binalar ve diğer insanlar — oyuncu ve el ele yürüdüğü kişi içlerinden geçmez.
   engel bilgisi nesnenin userData.engel alanında: sayı = yarıçap, {kutu:[yarıGen,yarıDerin], o:[x,z]} = döndürülmüş kutu */
let _ENG=null, _engSahne=null, _engSay=-1, _engT=0;
function engelleriTopla(){ _ENG=[]; _engSahne=scene; _engSay=scene.children.length; scene.updateMatrixWorld(true);
  const p=new THREE.Vector3(), sk=new THREE.Vector3(), q=new THREE.Quaternion(), ex=new THREE.Vector3();
  scene.traverse(o=>{ const e=o.userData&&o.userData.engel; if(!e||!o.visible) return; o.matrixWorld.decompose(p,q,sk);
    if(typeof e==="number") _ENG.push({x:p.x,z:p.z,r:e*Math.max(Math.abs(sk.x),Math.abs(sk.z))});
    else if(e.kutu){ ex.set(1,0,0).applyQuaternion(q); const a=Math.atan2(-ex.z,ex.x), c=Math.cos(a), si=Math.sin(a); const ox=(e.o?e.o[0]:0)*sk.x, oz=(e.o?e.o[1]:0)*sk.z;
      _ENG.push({x:p.x+ox*c+oz*si, z:p.z-ox*si+oz*c, hx:e.kutu[0]*Math.abs(sk.x), hz:e.kutu[1]*Math.abs(sk.z), c, s:si}); } }); }
function engelIt(p,r=.26,haric){
  _engT+=1; if(_engSahne!==scene||_engSay!==scene.children.length||!_ENG||_engT%240===0) engelleriTopla();
  for(let k=0;k<2;k++){
    for(const e of _ENG){
      const dx=p.x-e.x, dz=p.z-e.z;
      if(e.r!==undefined){ const R=e.r+r, d2=dx*dx+dz*dz; if(d2<R*R){ const d=Math.sqrt(d2)||1e-4; p.x=e.x+dx/d*R; p.z=e.z+dz/d*R; } }
      else { let lx=dx*e.c-dz*e.s, lz=dx*e.s+dz*e.c; const X=e.hx+r, Z=e.hz+r;
        if(Math.abs(lx)<X&&Math.abs(lz)<Z){ if(X-Math.abs(lx)<Z-Math.abs(lz)) lx=Math.sign(lx||1)*X; else lz=Math.sign(lz||1)*Z;
          p.x=e.x+lx*e.c+lz*e.s; p.z=e.z-lx*e.s+lz*e.c; } } }
    for(const c of KARAKTERLER){ if(!c.parent||c.parent!==scene||(haric&&haric.includes(c))||!c.visible) continue; if(!c.userData.kalabalik&&!c.userData.engelKisi) continue;
      const dx=p.x-c.position.x, dz=p.z-c.position.z, R=.27+r, d2=dx*dx+dz*dz; if(d2<R*R&&Math.abs(p.y-c.position.y)<1.2){ const d=Math.sqrt(d2)||1e-4; p.x=c.position.x+dx/d*R; p.z=c.position.z+dz/d*R; } } }
}
function yuru(c,dt,sinir,hiz=2.3){
  // kare aralığı uzunsa (takılma, yavaş telefon) yürüyüşü ince adımlara böl: sınır ve engeller her adımda çalışsın, kapı aralıklarından geçilsin
  if(dt>.034){ const n=Math.min(8,Math.ceil(dt/.034)), h=dt/n; for(let i=0;i<n;i++) yuru(c,h,sinir,hiz); return; }
  hiz*=1.38; const v=girdiVek(); const u=c.userData;
  const a=Kamera.aci; const ileri=new THREE.Vector3(-Math.sin(a),0,-Math.cos(a)), sag=new THREE.Vector3(Math.cos(a),0,-Math.sin(a));
  const yon=sag.multiplyScalar(v.x).add(ileri.multiplyScalar(-v.y));
  const L=yon.length();
  if(L>.08){ const kos=(L>.93||Girdi.tus.ShiftLeft||Girdi.tus.ShiftRight)?1.32:1; const hz=hiz*Math.min(1,L)*kos; c.position.addScaledVector(yon.normalize(),hz*dt);
    u._adimYol=(u._adimYol||0)+hz*dt; const adim=hz>3.4?1.05:.72; if(u._adimYol>adim){ u._adimYol=0; if(Ses.ac) Ses.efekt("adim",hz>3.4?1.2:1); } const hedefAci=Math.atan2(yon.x,yon.z); let fark=hedefAci-c.rotation.y; fark=Math.atan2(Math.sin(fark),Math.cos(fark)); c.rotation.y+=fark*Math.min(1,dt*10); u.hiz=lerp(u.hiz,hz,.2); }
  else u.hiz=lerp(u.hiz,0,.25);
  engelIt(c.position,.26,[c,..._eleleEs(c)]);
  // el ele değilken duran eşin içinden geçilmez (yanına yürürken üstüne binmesin)
  if(!(u.elele>.05)) for(const o of _eleleEs(c)){ if(!o.visible||o.parent!==c.parent||(o.userData.elele>.05)||(o.userData.hiz||0)>.2) continue;
    const dx=c.position.x-o.position.x, dz=c.position.z-o.position.z, d2=dx*dx+dz*dz, R=.5; if(d2<R*R&&d2>1e-6&&Math.abs(c.position.y-o.position.y)<1){ const d=Math.sqrt(d2); c.position.x=o.position.x+dx/d*R; c.position.z=o.position.z+dz/d*R; } }
  if(sinir) sinir(c.position);
}
function eleleTakip(o,p,dt){
  const sag=new THREE.Vector3(Math.cos(o.rotation.y),0,-Math.sin(o.rotation.y));
  const hedefP=o.position.clone().addScaledVector(sag,o.userData.kim==="kaan"?.52:-.52);
  const once=p.position.clone(), k=1-Math.pow(.001,dt);
  // yakındayken eş, lidere göre açısı ve uzaklığıyla (yay çizerek) yerine geçer: lider aniden geri dönünce düz çizgide onun içinden geçiyordu
  const dx=p.position.x-o.position.x, dz=p.position.z-o.position.z, r=Math.hypot(dx,dz);
  if(r>.05&&r<1.5){ const a0=Math.atan2(dx,dz); let f=Math.atan2(hedefP.x-o.position.x,hedefP.z-o.position.z)-a0; f=Math.atan2(Math.sin(f),Math.cos(f));
    const a=a0+f*k, rr=r+(.52-r)*k; p.position.x=o.position.x+Math.sin(a)*rr; p.position.z=o.position.z+Math.cos(a)*rr; p.position.y+=(hedefP.y-p.position.y)*k; }
  else p.position.lerp(hedefP,k);
  engelIt(p.position,.24,[o,p]);
  let fark=o.rotation.y-p.rotation.y; fark=Math.atan2(Math.sin(fark),Math.cos(fark)); p.rotation.y+=fark*Math.min(1,dt*8);
  // o yerinde dönerken onun etrafında yer değiştiren eş de adım atar (kayarak değil)
  const kendi=dt>1e-4?Math.min(2.4,once.distanceTo(p.position)/dt):0;
  p.userData.hiz=Math.max(o.userData.hiz||0,lerp(p.userData.hiz||0,kendi,.3)); p.userData.faz=o.userData.faz+Math.PI;
  p.userData.elele=o.userData.elele=lerp(o.userData.elele,1,.08);
}
function _eleleEs(c){ return KARAKTERLER.filter(o=>o!==c&&o.userData&&!o.userData.kalabalik&&o.userData.kim); }
function yuzYuze(a,b){ a.rotation.y=Math.atan2(b.position.x-a.position.x,b.position.z-a.position.z); b.rotation.y=Math.atan2(a.position.x-b.position.x,a.position.z-b.position.z); }

function onCekim(nesneler,sure=4.2,mesafe=2.3,yuk=.25){
  const merkez=new THREE.Vector3(), ileri=new THREE.Vector3(), q=new THREE.Quaternion(), v=new THREE.Vector3();
  let s=0;
  return new Promise(res=>{
    Kamera.sinema=dt=>{
      s+=dt; merkez.set(0,0,0); ileri.set(0,0,0);
      for(const n of nesneler){ n.userData.kafa.getWorldPosition(v); merkez.add(v); n.getWorldQuaternion(q); ileri.add(new THREE.Vector3(0,0,1).applyQuaternion(q)); }
      merkez.multiplyScalar(1/nesneler.length); ileri.y=0; ileri.normalize();
      const yan=new THREE.Vector3(ileri.z,0,-ileri.x);
      const m=mesafe+s*.12;
      camera.position.copy(merkez).addScaledVector(ileri,m).addScaledVector(yan,Math.sin(s*.4)*.35); camera.position.y+=yuk;
      camera.lookAt(merkez.x,merkez.y-.05,merkez.z);
      if(s>=sure){ Kamera.sinema=null; Kamera.poz.copy(camera.position); res(); }
    };
  });
}
/* kamerayı parmakla çevir: serbest yürüyüşte ekranda sürükleyince karakterin etrafında 360° döner (yukarı-aşağı: yükseklik) */
(function(){ let id=null, x0=0, y0=0;
  canvas.style.touchAction="none";
  canvas.addEventListener("pointerdown",e=>{ if(id!==null) return; id=e.pointerId; x0=e.clientX; y0=e.clientY; try{ canvas.setPointerCapture(id); }catch(_){} });
  canvas.addEventListener("pointermove",e=>{ if(e.pointerId!==id) return; const dx=e.clientX-x0, dy=e.clientY-y0; x0=e.clientX; y0=e.clientY;
    if(Kamera.sinema) return; Kamera.aci-=dx*.009; Kamera.yukseklik=clamp(Kamera.yukseklik+dy*.012,.8,6.5); });
  const bit=e=>{ if(e.pointerId===id){ id=null; try{ canvas.releasePointerCapture(e.pointerId); }catch(_){} } };
  canvas.addEventListener("pointerup",bit); canvas.addEventListener("pointercancel",bit); canvas.addEventListener("lostpointercapture",bit);
})();
function kameraIpucu(){ if(kayit.kamIpucu) return; kayit.kamIpucu=1; kaydet(); setTimeout(()=>{ if(typeof tost==="function") tost("Kamerayı döndürmek için ekranı parmağınla kaydır ↻"); },2600); }
