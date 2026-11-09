/* ================= HİKÂYE ARAÇLARI ================= */
let kilit=false;                  // senaryo oynarken oyuncu yürüyemez
let KONUSANLAR={};                // ad → karakter
const AD={kaan:"Kaan", kardelen:"Kardelen", gorevli:"Görevli", kurye:"Kurye", kondoktor:"Kondüktör"};
function konusmaKamerasi(konusan,dinleyen,ops={}){
  const S=new THREE.Vector3(), L=new THREE.Vector3(), hedefP=new THREE.Vector3(), hedefB=new THREE.Vector3();
  const yumus=ops.yumusak?0:1; // konuşma başlarken kamera kesme ile geçer, kafanın içinden geçmez
  let ilk=true;
  Kamera.sinema=dt=>{
    konusan.userData.kafa.getWorldPosition(S); S.y-=.05;
    if(dinleyen){ dinleyen.userData.kafa.getWorldPosition(L); L.y-=.05;
      const d=S.clone().sub(L); d.y=0; const uz=d.length(); d.normalize(); const yan=new THREE.Vector3(d.z,0,-d.x).multiplyScalar(ops.sol?-1:1);
      if(uz<.85){ // çok yakınlar (sarılma sonrası): omuz üstü yerine yandan ikili çekim, kimsenin kafası kadrajı kapatmaz
        const o=S.clone().lerp(L,.5); hedefP.copy(o).addScaledVector(yan,1.5).addScaledVector(d,.25).add(new THREE.Vector3(0,.04,0)); hedefB.copy(S).lerp(L,.4); }
      else { hedefP.copy(L).addScaledVector(d,-.55-Math.max(0,1.2-uz)*.2).addScaledVector(yan,.42).add(new THREE.Vector3(0,.12,0));
      hedefB.copy(S).lerp(L,.12); } }
    else { const q=new THREE.Quaternion(); konusan.getWorldQuaternion(q); const ileri=new THREE.Vector3(0,0,1).applyQuaternion(q); ileri.y=0; ileri.normalize(); const yan=new THREE.Vector3(ileri.z,0,-ileri.x);
      hedefP.copy(S).addScaledVector(ileri,ops.uzak||1.25).addScaledVector(yan,.35).add(new THREE.Vector3(0,.05,0)); hedefB.copy(S); }
    if(ilk&&yumus){ camera.position.copy(hedefP); camera.userData.bakis=hedefB.clone(); ilk=false; } else camera.position.lerp(hedefP,1-Math.pow(.02,dt));
    if(!camera.userData.bakis) camera.userData.bakis=hedefB.clone(); camera.userData.bakis.lerp(hedefB,1-Math.pow(.02,dt)); camera.lookAt(camera.userData.bakis);
  };
}
function kameraNoktasi(poz,bakis,sure=0){ sure*=.78;
  // anında geçiş (süre 0) hemen uygulanır: ardından gelen hareketli çekim buradan başlar. Önceden bir sonraki kareyi bekliyordu ve sahneler
  // açılırken kamera bir önceki sahnede kaldığı yerden (duvarların içinden, boşluktan) süzülerek geliyordu.
  // yeni sahnenin ilk hareketli çekimi de eski sahnedeki kamera yerinden değil, kendi başlangıç noktasından başlar
  if(!sure||kameraEskiMi()){ const P=typeof poz==="function"?poz(0):poz, B=typeof bakis==="function"?bakis(0):bakis; camera.position.copy(P); camera.userData.bakis=B.clone(); camera.lookAt(B); KAMERA_ESKI=false; }
  const p0=camera.position.clone(); const b0=camera.userData.bakis? camera.userData.bakis.clone() : camera.position.clone().add(new THREE.Vector3(0,0,-5).applyQuaternion(camera.quaternion)); let s=0;
  return new Promise(res=>{ Kamera.sinema=dt=>{ s+=dt; const k=sure?Math.min(1,s/sure):1, e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
    const P=typeof poz==="function"?poz(s):poz, B=typeof bakis==="function"?bakis(s):bakis;
    camera.position.copy(p0).lerp(P,e); const b=b0.clone().lerp(B,e); camera.userData.bakis=b; camera.lookAt(b); if(k>=1&&res){ res(); res=null; } }; });
}
function oyuncuKamerasi(){ Kamera.sinema=null; if(kameraEskiMi()) Kamera.poz.set(NaN,NaN,NaN); else Kamera.poz.copy(camera.position); camera.userData.bakis=null; }

let dkKutu=null;
function diyalogKutusu(){
  if(dkKutu&&dkKutu.isConnected) return dkKutu;
  dkKutu=el(`<div class="dk" hidden><div class="dk-ic"><span class="dk-ad"></span><p class="dk-metin"></p><span class="dk-ileri">▸</span><div class="dk-sec"></div></div></div>`);
  katman.appendChild(dkKutu); return dkKutu;
}
/* konuşmayı ilerletmek için ekranın herhangi bir yerine dokunmak yeter (yalnız yazı kutusuna değil). Düğmeler, joystick, mini oyunlar,
   telefon ekranı, vizör gibi kendi dokunuşu olan yerler hariç. Bir dokunuş tek adım ilerletir: yazıyı tamamlar ya da sonraki satıra geçer. */
let DK_DINLE=null;
function dkDinle(f){ DK_DINLE={f,t0:performance.now()}; }
function dkBirak(f){ if(DK_DINLE&&DK_DINLE.f===f) DK_DINLE=null; }
const DK_HARIC="button,input,select,textarea,a,.joy,.sim,.qte,.vizor,.selfie,.ritim,.cicekci,.koltuk-sec,.menu,.album-ekran,.okey,.kosu,.foto-sec,.foto-bak,.sinyal,.guncel-band,.dk-sec";
addEventListener("pointerdown",e=>{ const d=DK_DINLE; if(!d||performance.now()-d.t0<140) return; const t=e.target, h=t&&t.closest?t.closest(DK_HARIC):null;
  if(h&&!(h.classList.contains("joy")&&+getComputedStyle(h).opacity<.05)) return; // joystick gizliyken onun köşesine dokunmak da ilerletir
  DK_DINLE=null; d.f(e); });
addEventListener("keydown",e=>{ const d=DK_DINLE; if(!d||!["Space","Enter","KeyE"].includes(e.code)||performance.now()-d.t0<140) return; e.preventDefault(); DK_DINLE=null; d.f(e); });
function tikla(){ return new Promise(r=>dkDinle(()=>r())); }
// süreli bekleme; ekrana dokununca hemen biter (telefondaki mesajlaşma da dokundukça hızlanır)
function bekleDokun(ms){ return new Promise(r=>{ let son=false; const f=()=>{ if(son) return; son=true; dkBirak(f); r(); }; dkDinle(f); bekle(ms).then(f); }); }
async function konus(kim,metin,ops={}){
  const k=diyalogKutusu(); k.hidden=false; k.classList.toggle("anlati",!kim);
  const c=kim?KONUSANLAR[kim]:null;
  k.querySelector(".dk-ad").textContent=kim?AD[kim]:""; k.querySelector(".dk-ad").dataset.kim=kim||"";
  const p=k.querySelector(".dk-metin"); p.textContent=""; k.querySelector(".dk-sec").innerHTML=""; k.querySelector(".dk-ileri").style.opacity=0;
  if(c){ c.userData.konus=1; if(ops.gul!==undefined) c.userData.gulumse=ops.gul; const d=KONUSANLAR[ops.dinleyen||(kim==="kaan"?"kardelen":kim==="kardelen"?"kaan":"kardelen")]; const yakin=d&&d.parent===c.parent&&d.position.distanceTo(c.position)<4; if(ops.kamera!==false){ if(yakin&&!ops.uzak) konusmaKamerasi(c,d); else konusmaKamerasi(c,null,{uzak:ops.uzak}); } }
  let atla=false; const atlaF=()=>{ atla=true; }; dkDinle(atlaF);
  // dizi verilirse kısa kısa, art arda mesajlar gibi alt alta yazılır (Kardelen'in konuşma biçimi)
  const parca=Array.isArray(metin)?metin:[metin]; const tumu=parca.join("\n"); let yazilan="";
  for(let k_=0;k_<parca.length&&!atla;k_++){ const m=parca[k_], on=yazilan+(k_?"\n":"");
    for(let i=0;i<=m.length;i++){ if(atla) break; p.textContent=on+m.slice(0,i); await bekle(m[i-1]==="."||m[i-1]==="?"||m[i-1]==="!"? 95 : 16); }
    yazilan=on+m; if(k_<parca.length-1&&!atla) await bekle(300); }
  if(atla) p.textContent=tumu;
  dkBirak(atlaF);
  if(c) c.userData.konus=0;
  k.querySelector(".dk-ileri").style.opacity=1;
  // süreli satırlar kendiliğinden geçer; dokununca beklemeden geçer
  if(ops.sure){ let gec=null; const g=new Promise(r=>{ gec=()=>r(); dkDinle(gec); }); await Promise.race([bekle(ops.sure*.8),g]); dkBirak(gec); } else await tikla();
  if(!ops.acik) k.hidden=true;
}
async function sec(secenekler,kim){
  kim=kim||"kaan"; const k=diyalogKutusu(); k.hidden=false; k.classList.remove("anlati");
  k.querySelector(".dk-ad").textContent=AD[kim]||kim; k.querySelector(".dk-ad").dataset.kim=kim; k.querySelector(".dk-metin").textContent=""; k.querySelector(".dk-ileri").style.opacity=0;
  const s=k.querySelector(".dk-sec"); s.innerHTML="";
  return new Promise(r=>{ secenekler.forEach((t,i)=>{ const b=el(`<button class="dk-btn">${t}</button>`); b.onclick=e=>{ e.stopPropagation(); s.innerHTML=""; k.hidden=true; Ses.efekt("vuru"); r(i); }; s.appendChild(b); }); });
}
async function anlat(metin,sure){ await konus(null,metin,{kamera:false,sure}); }

/* görev çipi */
function gorev(t){ hedef(t?("◆ "+t):null); }

/* etkileşimler: yakına gelince aksiyon düğmesi */
let ETK=[];
function etkilesim(nesne,yazi,fn,ops={}){ const e={nesne,yazi,fn,mesafe:ops.mesafe||2,aktif:true,isaret:null}; if(ops.isaret!==false){ const p=parilti("#ffd9a3",ops.isaretBoy||.9); p.userData.isaret=true; scene.add(p); e.isaret=p; e.isaretY=ops.isaretY||1.6; } ETK.push(e); return e; }
function etkilesimKaldir(e){ e.aktif=false; if(e.isaret){ scene.remove(e.isaret); e.isaret=null; } }
function etkilesimGuncelle(oyuncu,btn){
  let en=null, enD=1e9; const p=new THREE.Vector3();
  for(const e of ETK){ if(!e.aktif) continue; e.nesne.getWorldPosition(p); if(e.isaret){ e.isaret.position.copy(p).add(new THREE.Vector3(0,e.isaretY+Math.sin(zaman*3)*.08,0)); e.isaret.material.opacity=.6+Math.sin(zaman*4)*.3; }
    const d=Math.hypot(p.x-oyuncu.position.x,p.z-oyuncu.position.z); if(d<e.mesafe&&d<enD){ en=e; enD=d; } }
  if(kilit){ aksiyonYazi(btn,null); return; }
  aksiyonYazi(btn,en?en.yazi:null);
  if(en&&Girdi.aksiyonBas){ Girdi.aksiyonBas=false; const tok={}; kilit=true; KILIT_SAHIBI=tok; aksiyonYazi(btn,null); Promise.resolve(en.fn(en)).finally(()=>{ if(KILIT_SAHIBI===tok){ kilit=false; KILIT_SAHIBI=null; } }); }
}

/* hatıra fotoğrafı: o anki kareden albüme */
let fotoIstegi=null;
/* anı fotoğrafı: önceki çekim ne olursa olsun (masa, manzara…) kamera ikisini önden, yüzleri ve üst bedenleri kadrajda olacak
   biçimde çerçeveler; araya duvar/eşya giriyorsa yaklaşır ya da öbür taraftan çeker. Oyuncunun kendi kadrajladığı fotoğraflarda {kendi:true}. */
function ataMi(ata,o){ for(let x=o;x;x=x.parent) if(x===ata) return true; return false; }
function kadrajIyi(L){ camera.updateMatrixWorld(); const H=L.map(c=>bas(c)), _p=new THREE.Vector3();
  for(const h of H){ _p.copy(h).project(camera); if(_p.z>1||Math.abs(_p.x)>.7||_p.y>.55||_p.y<-.45) return false; // dikey: fotoğraf 2:3 kırpılır, yüzler ortaya yakın olmalı
    const ust=h.clone().add(new THREE.Vector3(0,.11,0)).project(camera), alt=h.clone().add(new THREE.Vector3(0,-.13,0)).project(camera), boy=Math.abs(ust.y-alt.y)*.5*(window.innerHeight/window.innerWidth);
    if(boy<.07||boy>.4) return false; } // yüz kadraj genişliğinin %7'sinden küçükse çok uzak, %40'tan büyükse çok yakın
  const engel=[]; scene.traverse(o=>{ if(!o.isMesh||!o.visible||o.isSkinnedMesh||o===scene.userData.gok||o.userData.isaret) return; const mt=Array.isArray(o.material)?o.material[0]:o.material;
    if(mt&&mt.transparent&&mt.opacity<.45) return; if(L.some(c=>ataMi(c,o))) return; engel.push(o); });
  const ray=new THREE.Raycaster(); for(const h of H){ const d=h.clone().sub(camera.position), uz=d.length(); ray.set(camera.position,d.normalize()); ray.near=.05; ray.far=uz-.12; if(ray.intersectObjects(engel,false).length) return false; }
  // yüzleri kameraya dönük mü (sırtları ya da tam profilleri değil)
  for(const c of L){ const f=c.getWorldDirection(new THREE.Vector3()).setY(0).normalize(), k=camera.position.clone().sub(c.position).setY(0).normalize(); if(f.dot(k)<.25) return false; }
  // ikiliyse yan yana görünmeliler: biri ötekinin önüne geçmesin (başlar ekranda ayrık, kamera karşıdan ±35°)
  if(L.length===2){ const p0=H[0].clone().project(camera), p1=H[1].clone().project(camera); if(Math.abs(p0.x-p1.x)<.28) return false;
    const fo=L[0].getWorldDirection(new THREE.Vector3()).add(L[1].getWorldDirection(new THREE.Vector3())).setY(0); const m=L[0].position.clone().lerp(L[1].position,.5), k=camera.position.clone().sub(m).setY(0);
    if(fo.lengthSq()>.09&&fo.normalize().dot(k.normalize())<.82) return false; }
  return true; }
function fotoCercevesi(){
  const L=["kaan","kardelen"].map(k=>KONUSANLAR&&KONUSANLAR[k]).filter(c=>c&&c.visible&&ataMi(scene,c));
  if(!L.length) return null;
  const H=L.map(c=>bas(c)), m=new THREE.Vector3(); H.forEach(h=>m.add(h)); m.multiplyScalar(1/H.length);
  const ileri=new THREE.Vector3(), f=new THREE.Vector3(); L.forEach(c=>{ c.getWorldDirection(f); f.y=0; if(f.lengthSq()>1e-6) ileri.add(f.normalize()); });
  const kamTaraf=camera.position.clone().sub(m).setY(0);
  let yon;
  if(L.length===2){ const ab=H[1].clone().sub(H[0]).setY(0); const fN=ileri.lengthSq()>.09?ileri.clone().normalize():null;
    if(fN&&ab.lengthSq()>1e-4&&Math.abs(ab.clone().normalize().dot(fN))>.75){
      // biri ötekinin arkasında (ATV, arkadan sarılma): yandan değil, önden çaprazdan; arkadakinin başı hangi yana kaymışsa o taraftan
      const onI=ab.dot(fN)>0?1:0, yan=new THREE.Vector3(fN.z,0,-fN.x); const sg=Math.sign(H[1-onI].clone().sub(H[onI]).dot(yan)||kamTaraf.dot(yan)||1);
      yon=fN.clone().applyAxisAngle(new THREE.Vector3(0,1,0),sg*.6).normalize(); }
    else { yon=ab.lengthSq()>1e-4?new THREE.Vector3(-ab.z,0,ab.x).normalize():ileri.clone().normalize();
      const ref=ileri.lengthSq()>.09?ileri:kamTaraf; if(yon.dot(ref)<0) yon.negate(); } }
  else yon=(ileri.lengthSq()>1e-6?ileri:kamTaraf).normalize();
  const vf=THREE.MathUtils.degToRad(camera.fov), hf=2*Math.atan(Math.tan(vf/2)*camera.aspect);
  const yari=(L.length===2?Math.hypot(H[0].x-H[1].x,H[0].z-H[1].z)/2:0)+.42;
  const d=clamp(Math.max(yari/Math.tan(hf/2),.6/Math.tan(vf/2)),1.0,5.5);
  // elinde gösterdiği bir şey varsa (diploma, plaket, buket) kadrajın ortası biraz aşağı: o da kesilmeden girer
  const tutuyor=L.some(c=>c.userData.kolPoz==="plaket"||c.userData.kolPoz==="buket"||c.userData.eldeki);
  const hedef=m.clone().add(new THREE.Vector3(0,tutuyor?-.3:-.16,0));
  const engel=[]; scene.traverse(o=>{ if(!o.isMesh||!o.visible||o.isSkinnedMesh||o===scene.userData.gok||o.userData.isaret) return; const mt=Array.isArray(o.material)?o.material[0]:o.material;
    if(mt&&mt.transparent&&mt.opacity<.45) return; if(L.some(c=>ataMi(c,o))) return; engel.push(o); });
  const ray=new THREE.Raycaster(); ray.camera=camera;
  // kadraja girecek yabancılar da engeldir (önceden kalabalıktan biri objektifle ikisinin arasına girebiliyordu)
  const yabanci=KARAKTERLER.filter(c=>c.parent===scene&&c.visible&&c.userData.kalabalik);
  const bos=y=>{ ray.set(hedef,y); ray.near=.05; ray.far=d; const h=ray.intersectObjects(engel,false); let en=h.length?h[0].distance:d;
    for(const c of yabanci){ const v=c.position.clone().add(new THREE.Vector3(0,1.2,0)).sub(hedef), t=v.dot(y); if(t>.2&&t<en&&v.addScaledVector(y,-t).setY(0).length()<.42) en=t-.25; }
    return Math.max(0,en); };
  // önden çekilemiyorsa (duvar, ağaç, araba) önce yana doğru başka açılar denenir; arkalarından çekmek son çare
  let en=null; for(const a of [0,.42,-.42,.84,-.84,1.25,-1.25]){ const y=yon.clone().applyAxisAngle(new THREE.Vector3(0,1,0),a), ms=bos(y), puan=Math.min(ms,d)-Math.abs(a)*.4; if(!en||puan>en.puan) en={y,ms,puan}; if(a===0&&ms>=d) break; }
  if(en.ms<.9){ const y2=yon.clone().negate(), m2=bos(y2); if(m2>en.ms+1) en={y:y2,ms:m2}; }
  yon=en.y; const uz=Math.max(.95,Math.min(d,en.ms-.2));
  // yer darsa objektif genişler: iki yüz de kadraja sığar (önceden kamera yüzlere dayanıp yüzleri kesiyordu)
  let fov=null; if(uz<d-.05){ const gH=2*Math.atan(yari/uz), gV=Math.max(2*Math.atan(Math.tan(gH/2)/camera.aspect),2*Math.atan(.6/uz)); fov=clamp(gV*180/Math.PI,camera.fov,95); }
  const pos=hedef.clone().addScaledVector(yon,uz); pos.y=m.y-.02;
  // yerde/alçakta oturuyorlarsa (battaniye, kum) ayakta duran birinin çektiği gibi biraz yukarıdan: ayaklar kadrajın önünü kaplamaz
  const bY=m.y-L.reduce((t,c)=>t+c.getWorldPosition(new THREE.Vector3()).y,0)/L.length; if(bY<1.15) pos.y+=Math.min(.45,(1.15-bY)*.9);
  return {pos,hedef,fov,kisiler:L};
}
const kareBekle=n=>new Promise(r=>{ const f=()=>{ if(--n<=0) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); });
function hatiraFoto(baslik,ops={}){ return new Promise(async r=>{
  let fk=null, onceki=null, bakislar=null, fovDegisti=false, dondu=false;
  // yüz yüze duruyorlarsa (konuşurken) fotoğraf için ikisi de objektife döner, yan yana poz verir (önceden profilden, birbirine bakarken çekiliyordu)
  if(!ops.kendi){ try{ const L=["kaan","kardelen"].map(k=>KONUSANLAR&&KONUSANLAR[k]).filter(c=>c&&c.visible&&ataMi(scene,c));
    if(L.length===2){ const [a,b]=L, serbest=u=>!(u.otur>0)&&!(u.saril>0)&&!(u.dans>0)&&!(u.arkadan>0)&&!(u.omuz>0)&&!(u.elele>.05)&&!u.elHedef&&!((u.hiz||0)>.3);
      const fa=a.getWorldDirection(new THREE.Vector3()).setY(0).normalize(), fb=b.getWorldDirection(new THREE.Vector3()).setY(0).normalize();
      if(serbest(a.userData)&&serbest(b.userData)&&fa.dot(fb)<-.3){ const ab=b.position.clone().sub(a.position).setY(0); const n=new THREE.Vector3(-ab.z,0,ab.x).normalize();
        const kt=camera.position.clone().sub(a.position.clone().lerp(b.position,.5)).setY(0); if(n.dot(kt)<0) n.negate(); a.rotation.y=b.rotation.y=Math.atan2(n.x,n.z); dondu=true;
        // dönerken birbirlerine yaklaşırlar (yüz yüzeyken aralarındaki boşlukla yan yana durunca fazla ayrık görünüyorlardı)
        const dAB=ab.length(); if(dAB>.6){ const k=Math.min(.18,(dAB-.55)/2), u=ab.clone().normalize(), a0=a.position.clone(), b0=b.position.clone(), a1=a0.clone().addScaledVector(u,k), b1=b0.clone().addScaledVector(u,-k), t0=performance.now();
          a.userData.hiz=b.userData.hiz=.5; await new Promise(r=>{ const f=()=>{ const t=Math.min(1,(performance.now()-t0)/420); a.position.lerpVectors(a0,a1,t); b.position.lerpVectors(b0,b1,t); if(t<1) requestAnimationFrame(f); else r(); }; f(); }); a.userData.hiz=b.userData.hiz=0; }
        else await bekle(300); } } }catch(e){ console.warn("foto dön",e); } }
  // sahnenin kendi kamerası ikisini de iyi çerçeveliyorsa (yüzler kadrajda, arada engel yok, ne çok uzak ne çok yakın) o kare korunur;
  // yalnız ikisi de objektife bakar. Değilse (masayı, sırtlarını, yarım yüzleri çeken açılar) kamera yeniden yerleşir.
  if(!ops.kendi){ try{ const L=["kaan","kardelen"].map(k=>KONUSANLAR&&KONUSANLAR[k]).filter(c=>c&&c.visible&&ataMi(scene,c));
    if(L.length&&kadrajIyi(L)){ const kp=camera.position.clone(); bakislar=L.map(k=>[k,k.userData.bakNokta,kp]); for(const [k,,h] of bakislar) k.userData.bakNokta=h; ops={...ops,kendi:true,_bakti:true}; await bekle(dondu?650:480); } }catch(e){ console.warn("foto kadraj",e); } }
  if(!ops.kendi){ try{ const c=fotoCercevesi(); if(c){ onceki=Kamera.sinema;
      if(c.fov){ camera.fov=c.fov; camera.updateProjectionMatrix(); fovDegisti=true; }
      fk=dt=>{ camera.position.copy(c.pos); camera.lookAt(c.hedef); camera.userData.bakis=c.hedef; }; Kamera.sinema=fk;
      // hatıra fotoğrafında ikisi de objektife bakar: başlar ve gözler dönsün diye deklanşörden önce kısa bir an beklenir
      bakislar=c.kisiler.map(k=>[k,k.userData.bakNokta,c.pos.clone()]); for(const [k,,h] of bakislar) k.userData.bakNokta=h;
      await bekle(dondu?650:480); } }catch(e){ console.warn("foto",e); } }
  fotoIstegi={baslik,r:v=>{ if(fk||bakislar) setTimeout(()=>{ if(fk&&Kamera.sinema===fk) Kamera.sinema=onceki; if(fovDegisti) boyut(); if(bakislar) for(const [k,b,h] of bakislar) if(k.userData.bakNokta===h) k.userData.bakNokta=b; },1100); r(v); }}; }); }
function fotoAl(){
  if(!fotoIstegi) return; const {baslik,r}=fotoIstegi; fotoIstegi=null;
  try{
    const W=Math.min(960,canvas.width), H=Math.round(W*Math.min(1.5,canvas.height/canvas.width));
    const c=document.createElement("canvas"); c.width=W; c.height=H; const x=c.getContext("2d");
    const sw=canvas.width, sh=canvas.height, oran=W/H; let kw=sw, kh=sw/oran; if(kh>sh){ kh=sh; kw=sh*oran; }
    x.drawImage(canvas,(sw-kw)/2,(sh-kh)/2,kw,kh,0,0,W,H);
    const veri=c.toDataURL("image/jpeg",.86);
    AlbumDB.yaz({ad:baslik,veri,bolum:bolum&&bolum.id||null,zaman:Date.now()});
    const f=el(`<div class="flas"></div>`); katman.appendChild(f); setTimeout(()=>f.remove(),900);
    Ses.efekt("deklansor");
    const pk=el(`<div class="polaroid"><img src="${veri}" alt=""><span>${baslik}</span></div>`); katman.appendChild(pk);
    setTimeout(()=>pk.classList.add("gor"),60); setTimeout(()=>{ pk.classList.remove("gor"); setTimeout(()=>pk.remove(),900); },3400);
    r(veri);
  }catch(e){ r(null); }
}

/* sessiz kare: o anki görüntüyü küçük bir JPEG olarak döndürür (albüme yazmaz, flaş yok) */
let KARE_ISTEK=[];
function kareAl(w=360){ return new Promise(r=>KARE_ISTEK.push({w,r})); }
function kareleriAl(){
  if(!KARE_ISTEK.length) return; const L=KARE_ISTEK; KARE_ISTEK=[];
  for(const {w,r} of L){ try{ const W=w, H=Math.round(w*Math.min(1.6,canvas.height/canvas.width)); const c=document.createElement("canvas"); c.width=W; c.height=H; const x=c.getContext("2d");
      const sw=canvas.width, sh=canvas.height, oran=W/H; let kw=sw, kh=sw/oran; if(kh>sh){ kh=sh; kw=sh*oran; } x.drawImage(canvas,(sw-kw)/2,(sh-kh)/2,kw,kh,0,0,W,H); r(c.toDataURL("image/jpeg",.8)); }catch(e){ r(null); } }
}

/* koşul bekleme ve senaryolu yürüyüş */
let KOSUL=[], HAREKET=[];
function kosul(fn){ return new Promise(r=>KOSUL.push({fn,r})); }
function etkBekle(nesne,yazi,ops){ return new Promise(r=>{ const e=etkilesim(nesne,yazi,()=>{ etkilesimKaldir(e); r(); },ops); }); }
function yuruHedef(c,hedefP,hiz=1.4,ops={}){
  return new Promise(r=>HAREKET.push({c,h:hedefP.clone(),hiz:hiz*1.35,r,yer:ops.yer})); }
function hikayeGuncelle(dt){
  KOSUL=KOSUL.filter(k=>{ let ok=false; try{ ok=k.fn(); }catch(e){} if(ok){ k.r(); return false; } return true; });
  HAREKET=HAREKET.filter(m=>{ const c=m.c, d=m.h.clone().sub(c.position); d.y=0; const L=d.length();
    if(L<.08){ if(!m.yer&&m.y0!==undefined) c.position.y=lerp(c.position.y,m.h.y,.5); c.userData.hiz=lerp(c.userData.hiz,0,.3); if(c.userData.hiz<.05){ if(!m.yer&&m.y0!==undefined) c.position.y=m.h.y; c.userData.hiz=0; m.r(); return false; } return true; }
    d.normalize(); const a=Math.atan2(d.x,d.z); let f=a-c.rotation.y; f=Math.atan2(Math.sin(f),Math.cos(f)); c.rotation.y+=f*Math.min(1,dt*6);
    // hedef arkada/yanda kalıyorsa önce döner: yönüne bakmadan ilerleyip yan yan ya da geri geri kaymasın (kısa mesafede hep ilerler)
    const yonluk=L<.6?1:clamp(Math.cos(f)*1.4-.15,0,1);
    // hız bacaklarla birlikte artar: yürüyüş başında bacaklar daha kıpırdamadan gövde kaymasın
    const adim=Math.min(L,Math.max(c.userData.hiz||0,m.hiz*.3)*dt*yonluk); c.position.addScaledVector(d,adim);
    if(m.yer) c.position.y=m.yer(c.position.x,c.position.z);
    // zemin fonksiyonu yoksa ve hedef farklı yükseklikteyse (kaldırım, sahne basamağı) yürürken yavaşça o yüksekliğe çıkar/iner: ayaklar zemine gömülmez, sonda "pat" diye zıplamaz
    else if(Math.abs(m.h.y-c.position.y)>.005){ if(m.y0===undefined){ m.y0=c.position.y; m.L0=Math.max(L,.01); } c.position.y=m.y0+(m.h.y-m.y0)*clamp(1-(L-adim)/m.L0,0,1); }
    c.userData.hiz=lerp(c.userData.hiz,m.hiz*Math.max(.35,yonluk),.15); return true; });
}
function cevir(c,hedefP){ c.rotation.y=Math.atan2(hedefP.x-c.position.x,hedefP.z-c.position.z); }
let KILIT_SAHIBI=null;
async function sahne(fn){ kilit=true; KILIT_SAHIBI="sahne"; const j=katman&&katman.querySelector(".joy"); if(j){ j.style.opacity=0; j.style.pointerEvents="none"; } joyVec={x:0,y:0};
  // ara sahne boyunca üstteki görev yazısı (biten görev) gizlenir; sahne bitince geri gelir
  const h=hedefEl&&hedefEl.isConnected?hedefEl:null; if(h) h.classList.add("sahnede");
  try{ await fn(); } finally{ kilit=false; KILIT_SAHIBI=null; if(j){ j.style.opacity=1; j.style.pointerEvents=""; } if(h) h.classList.remove("sahnede"); SON_SINEMA={f:Kamera.sinema,t:performance.now(),n:NESIL}; oyuncuKamerasi(); } }
let SON_SINEMA=null;
/* basılı tutma anı: düğmeye basılı tuttukça dolar, bırakınca yavaşça boşalır; dolunca biter (el tutmak, ısıtmak gibi anlar için) */
function basiliTut(yazi,sure=1.6){ return new Promise(r=>{ const q=el(`<div class="qte basili-tut"><button class="btn qte-btn"><i></i><span>${yazi}</span></button></div>`); katman.appendChild(q);
  const b=q.querySelector("button"), dol=q.querySelector("i"); let v=0, bas=false, son=performance.now(), kalpT=0; const n0=NESIL;
  const bir=()=>{ bas=false; b.classList.remove("basili"); }, kapat=()=>{ removeEventListener("pointerup",bir); removeEventListener("pointercancel",bir); };
  b.addEventListener("pointerdown",e=>{ e.preventDefault(); bas=true; b.classList.add("basili"); }); addEventListener("pointerup",bir); addEventListener("pointercancel",bir); b.oncontextmenu=e=>e.preventDefault();
  const f=()=>{ if(n0!==NESIL||!q.isConnected){ kapat(); return; } const t=performance.now(), dt=Math.min(.1,(t-son)/1000); son=t;
    v=clamp(v+(bas?dt/sure:-dt/(sure*1.6)),0,1); dol.style.transform=`scaleX(${v.toFixed(3)})`;
    if(bas){ kalpT-=dt; if(kalpT<=0){ kalpT=.42; Ses.efekt("kalp",.45); try{ navigator.vibrate&&navigator.vibrate(8); }catch(e){} } }
    if(v>=1){ kapat(); q.classList.add("bitti"); setTimeout(()=>q.remove(),350); r(); return; } requestAnimationFrame(f); }; requestAnimationFrame(f); }); }
function bas(c){ const v=new THREE.Vector3(); c.userData.kafa.getWorldPosition(v); return v; }

/* fotoğraf modu: vizör + netlik ibresi */
async function fotoModu(foto,model,ops={}){
  const pozlar=ops.pozlar||["bel"]; let deneme=0;
  while(true){
    const poz=pozlar[deneme%pozlar.length]; pozVer(model,poz);
    const fov0=camera.fov; camera.fov=ops.fov||38; camera.updateProjectionMatrix();
    const goz=bas(foto), hedefB=model.position.clone().add(new THREE.Vector3(0,ops.bakY||1.15,0));
    const yon=hedefB.clone().sub(goz).normalize();
    const bak0=model.userData.bakNokta, bakF=goz.clone(); model.userData.bakNokta=bakF; // objektife (Kaan'a) bakar
    Kamera.sinema=dt=>{ camera.position.copy(goz).addScaledVector(yon,.25).add(new THREE.Vector3(Math.sin(zaman*.8)*.02,Math.sin(zaman*1.1)*.015,0)); camera.lookAt(hedefB); };
    const v=el(`<div class="vizor"><i class="k1"></i><i class="k2"></i><i class="k3"></i><i class="k4"></i><div class="netlik"><b></b><span></span></div><button class="btn deklansor" aria-label="Çek">📷</button><small>İbre ortadayken çek</small></div>`); katman.appendChild(v);
    const ibre=v.querySelector(".netlik span"); let x=0, h=Math.max(.5,.9-deneme*.12), bitti=false; // her başarısız denemede ibre yavaşlar
    const t0=performance.now(); const anim=()=>{ if(bitti) return; x=Math.sin((performance.now()-t0)/1000*h*2.4); ibre.style.left=(50+x*46)+"%"; requestAnimationFrame(anim); }; anim();
    await new Promise(r=>{ v.querySelector(".deklansor").onclick=r; const f=e=>{ if(["Space","Enter","KeyE"].includes(e.code)){ removeEventListener("keydown",f); r(); } }; addEventListener("keydown",f); });
    bitti=true; const iyi=Math.abs(x)<Math.min(.6,.28+deneme*.1);
    if(iyi){ await hatiraFoto(ops.baslik,{kendi:true}); }
    else { Ses.efekt("deklansor"); const f=el(`<div class="flas"></div>`); katman.appendChild(f); setTimeout(()=>f.remove(),900); }
    v.remove(); camera.fov=fov0; camera.updateProjectionMatrix(); boyut();
    pozVer(model,null); if(model.userData.bakNokta===bakF) model.userData.bakNokta=bak0;
    if(iyi) return deneme;
    deneme++;
    await konus("kardelen",[["Bulanık çıktı","Bir daha 😄"],["Gözüm kapalı çıktım","Tekrar çek"],["Elin titredi şapşik","Bir kere daha"]][deneme%3],{gul:.6});
  }
}
function pozVer(c,poz){ const u=c.userData; u.kolS.rotation.set(0,0,0); u.kolD.rotation.set(0,0,0); u.salla=0; u.kafa.rotation.z=0; u.gulumse=poz?1:u.gulumse;
  u.kolPoz=(poz==="bel"||poz==="kalp"||poz==="ac"||poz==="plaket")?poz:null; // bu pozlarda eller IK ile gövdeye göre yerleşir
  if(poz==="bel"){ u.kafa.rotation.z=-.12; }
  if(poz==="el"){ u.salla=1; u.kafa.rotation.z=.1; }
  if(poz==="kalp"){ u.kafa.rotation.z=.06; }
  if(poz==="plaket"){ u.kafa.rotation.z=.08; }
  if(poz==="ac"){ u.kafa.rotation.z=.12; } }
