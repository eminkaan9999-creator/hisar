/* ================= BÖLÜM 3: ANKARAM =================
   27–29 Eylül 2024: Kastamonu'dan ilk kez Ankara'ya, yanıma geldi. Yol boyu konum takibi, akşam AŞTİ'de kavuşma,
   ertesi gün Ulus'ta Ankara Kalesi'nin dibindeki gazozcu ve surlardan gün batımı, akşam Seğmenler Parkı,
   gece telefonda hikâyeye atılacak fotoğrafları seçmek. Son: 25 Ekim, doğum günüm için yine geldi; peron 133'e koşu. */
const BA_DOKU={};
function _baTuval(w,h,ciz,tekrar,kalici=true){ const c=document.createElement("canvas"); c.width=w; c.height=h; ciz(c.getContext("2d"),w,h);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; if(tekrar){ t.wrapS=t.wrapT=THREE.RepeatWrapping; } t.__kalici=kalici; return t; } // önbelleğe girmeyen dokular sahneyle birlikte bırakılır (her oynayışta birikmesin)
// AŞTİ peron cephesi: bir peron genişliği (6 m) cam, ortada çift kanatlı kapı
function cepheDoku(){ if(BA_DOKU.cephe) return BA_DOKU.cephe;
  return BA_DOKU.cephe=_baTuval(256,256,(x,w,h)=>{
    const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,"#a9b9c6"); g.addColorStop(.42,"#5b6f80"); g.addColorStop(1,"#2a3642"); x.fillStyle=g; x.fillRect(0,0,w,h);
    x.fillStyle="rgba(255,212,150,.22)"; x.fillRect(0,h*.52,w,h*.48); // içerideki bekleme salonunun sıcak ışığı
    x.fillStyle="rgba(40,30,25,.35)"; for(let i=0;i<7;i++){ const px=10+i*36+Math.random()*8, ph=34+Math.random()*16; x.fillRect(px,h-8-ph,10,ph); x.beginPath(); x.arc(px+5,h-14-ph,6,0,7); x.fill(); } // içeride insan gölgeleri
    x.strokeStyle="rgba(255,255,255,.10)"; x.lineWidth=12; for(let i=0;i<4;i++){ x.beginPath(); x.moveTo(i*80-30,h); x.lineTo(i*80+70,0); x.stroke(); }
    x.fillStyle="#c6ccd2"; for(let i=0;i<=4;i++) x.fillRect(i*w/4-3,0,6,h); x.fillRect(0,h*.3-3,w,6); x.fillRect(0,0,w,7); x.fillRect(0,h-7,w,7);
    x.fillStyle="#34424e"; x.fillRect(w*.36,h*.38,w*.28,h*.62); x.fillStyle="#c6ccd2"; x.fillRect(w*.5-2,h*.38,4,h*.62); x.fillRect(w*.36,h*.38,w*.28,5);
    x.fillStyle="rgba(255,220,160,.35)"; x.fillRect(w*.37,h*.45,w*.12,h*.5); x.fillRect(w*.51,h*.45,w*.12,h*.5);
    x.fillStyle="#e9e9e9"; x.fillRect(w*.47,h*.66,3,24); x.fillRect(w*.52,h*.66,3,24); },true); }
function kutuGeo(w,h,d,o=3.5){ const g=new THREE.BoxGeometry(w,h,d); const uv=g.attributes.uv; const b=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]]; for(let i=0;i<uv.count;i++){ const f=Math.floor(i/4); uv.setXY(i,uv.getX(i)*b[f][0]/o,uv.getY(i)*b[f][1]/o); } return g; }
function silindirGeo(r1,r2,h,n,o=3.5){ const g=new THREE.CylinderGeometry(r1,r2,h,n); const uv=g.attributes.uv, c=Math.PI*(r1+r2); for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*c/o,uv.getY(i)*h/o); return g; }
// otobüs ön camı: gökyüzü yansıması, içeride koltuk sırtları, perde, şoför koltuğu
function onCamDoku(){ if(BA_DOKU.onCam) return BA_DOKU.onCam;
  return BA_DOKU.onCam=_baTuval(256,192,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,"#8d9db0"); g.addColorStop(.35,"#3b4652"); g.addColorStop(1,"#141a20"); x.fillStyle=g; x.fillRect(0,0,w,h);
    x.fillStyle="rgba(20,22,28,.85)"; for(let i=0;i<4;i++){ x.fillRect(18+i*58,h*.55,40,h*.45); } x.fillStyle="rgba(120,40,40,.6)"; for(let i=0;i<4;i++) x.fillRect(22+i*58,h*.55,32,10);
    x.fillStyle="rgba(230,220,200,.35)"; x.fillRect(0,0,w,14); x.fillStyle="#0c0e12"; x.fillRect(w*.62,h*.5,50,h*.5); x.beginPath(); x.ellipse(w*.7,h*.62,22,10,0,0,7); x.fill();
    x.strokeStyle="rgba(255,255,255,.18)"; x.lineWidth=14; x.beginPath(); x.moveTo(30,h); x.lineTo(120,0); x.stroke(); x.lineWidth=6; x.beginPath(); x.moveTo(150,h); x.lineTo(210,0); x.stroke();
    x.fillStyle="#111"; x.fillRect(0,h-6,w,6); }); }
function ledDoku(metin){ const k="led:"+metin; if(BA_DOKU[k]) return BA_DOKU[k]; const t=yaziDoku(metin,{w:512,h:64,zemin:"#090909",renk:"#ffb648",font:"700 40px 'Courier New',monospace"}); t.__kalici=true; return BA_DOKU[k]=t; }
// şehirlerarası otobüs: beyaz gövde, firma rengi şerit (marka yok), önde LED yön tabelası, sağ önde kapı
function otobusYap(serit,levha){
  const g=new THREE.Group(); const L=12.2, W=2.55;
  const gov=mat("#eceff1",{roughness:.32,metalness:.25}), sr=mat(serit,{roughness:.4,metalness:.2}), cam=new THREE.MeshStandardMaterial({color:renk("#121a23"),roughness:.06,metalness:.65}), lst=mat("#141416",{roughness:.95}), jnt=mat("#b5b9bf",{metalness:.8,roughness:.3});
  const b=new THREE.Mesh(new THREE.BoxGeometry(W,2.9,L),gov); b.position.y=2.0; b.castShadow=true; b.receiveShadow=true; g.add(b);
  const ust=new THREE.Mesh(new THREE.BoxGeometry(W-.1,.12,L-.4),gov); ust.position.y=3.5; g.add(ust);
  const yc=new THREE.Mesh(new THREE.BoxGeometry(W+.02,1.08,L-2.3),cam); yc.position.set(0,2.55,-.75); g.add(yc);
  const s1=new THREE.Mesh(new THREE.BoxGeometry(W+.03,.24,L-.1),sr); s1.position.set(0,1.62,0); g.add(s1);
  const s2=new THREE.Mesh(new THREE.BoxGeometry(W+.03,.07,L-.1),sr); s2.position.set(0,1.36,0); g.add(s2);
  const on=new THREE.Mesh(new THREE.PlaneGeometry(W-.16,1.95),new THREE.MeshStandardMaterial({map:onCamDoku(),roughness:.05,metalness:.3,envMapIntensity:1.1})); on.position.set(0,2.3,L/2+.012); g.add(on);
  for(const sx of [-.45,.5]){ const sl=new THREE.Mesh(new THREE.BoxGeometry(.035,.95,.02),mat("#121212")); sl.position.set(sx,1.75,L/2+.03); sl.rotation.z=sx<0?.55:.35; g.add(sl); } // silecekler
  const iz=new THREE.Mesh(new THREE.PlaneGeometry(W-.2,.36),mat(serit,{roughness:.4,metalness:.2})); iz.position.set(0,1.06,L/2+.013); g.add(iz);
  const lev=new THREE.Mesh(new THREE.PlaneGeometry(W-.36,.28),new THREE.MeshBasicMaterial({map:ledDoku(levha)})); lev.position.set(0,3.2,L/2+.016); g.add(lev);
  const tmp=new THREE.Mesh(new THREE.BoxGeometry(W-.1,.32,.08),mat("#2b2d30",{roughness:.5})); tmp.position.set(0,.72,L/2+.02); g.add(tmp);
  for(const sx of [-1,1]){ const f=new THREE.Mesh(new THREE.BoxGeometry(.46,.15,.05),new THREE.MeshStandardMaterial({color:renk("#fff8e8"),emissive:renk("#fff0cc"),emissiveIntensity:.7})); f.position.set(sx*.86,1.02,L/2+.02); g.add(f);
    const a=new THREE.Mesh(new THREE.BoxGeometry(.07,.38,.2),mat("#161616")); a.position.set(sx*(W/2+.3),2.55,L/2-.25); g.add(a); const k=new THREE.Mesh(new THREE.BoxGeometry(.32,.04,.04),mat("#161616")); k.position.set(sx*(W/2+.15),2.85,L/2-.2); g.add(k);
    const sl=new THREE.Mesh(new THREE.BoxGeometry(.3,.12,.04),new THREE.MeshStandardMaterial({color:renk("#5a0d0d"),emissive:renk("#ff2a1a"),emissiveIntensity:.5})); sl.position.set(sx*.95,1.1,-L/2-.02); g.add(sl); }
  for(const z of [L/2-2.3,-L/2+3.0,-L/2+1.75]) for(const sx of [-1,1]){ const t=new THREE.Mesh(new THREE.CylinderGeometry(.52,.52,.34,18),lst); t.rotation.z=Math.PI/2; t.position.set(sx*(W/2-.12),.52,z); g.add(t);
    const j=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.36,12),jnt); j.rotation.z=Math.PI/2; j.position.copy(t.position); g.add(j); }
  const kp=new THREE.Mesh(new THREE.PlaneGeometry(1.0,2.5),cam); kp.rotation.y=-Math.PI/2; kp.position.set(-W/2-.014,1.75,L/2-1.25); g.add(kp); // sağ ön kapı (aracın sağı = yerel -x)
  const bg=new THREE.Mesh(new THREE.BoxGeometry(.02,.5,7),mat("#b0b4b8",{metalness:.6,roughness:.4})); bg.position.set(W/2+.005,.85,-1); g.add(bg); // bagaj kapakları
  g.userData.engel={kutu:[W/2+.06,L/2+.06]};
  return g;
}
function gazozYap(renkH){ const g=new THREE.Group(); const cam=new THREE.MeshStandardMaterial({color:renk(renkH),transparent:true,opacity:.8,roughness:.06,metalness:.1});
  const s=new THREE.Mesh(new THREE.CylinderGeometry(.028,.031,.15,14),cam); s.position.y=.075; g.add(s);
  const b=new THREE.Mesh(new THREE.CylinderGeometry(.012,.027,.07,14),cam); b.position.y=.185; g.add(b);
  const k=new THREE.Mesh(new THREE.CylinderGeometry(.0145,.0145,.012,12),mat("#c9a23a",{metalness:.8,roughness:.3})); k.position.y=.225; k.name="kapak"; g.add(k);
  const et=new THREE.Mesh(new THREE.CylinderGeometry(.0315,.0315,.055,14,1,true),mat("#f3efe2",{roughness:.6})); et.position.y=.07; g.add(et); return g; }
function valizYap(renkH){ const g=new THREE.Group(); const b=new THREE.Mesh(new THREE.BoxGeometry(.42,.6,.25),mat(renkH,{roughness:.45})); b.position.y=.38; b.castShadow=true; g.add(b);
  for(const sx of [-.15,.15]){ const t=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.03,10),mat("#111")); t.rotation.z=Math.PI/2; t.position.set(sx,.04,-.1); g.add(t); }
  const s=new THREE.Mesh(new THREE.BoxGeometry(.2,.025,.025),mat("#222")); s.position.set(0,.98,-.1); g.add(s); for(const sx of [-.09,.09]){ const c=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.3,6),mat("#555",{metalness:.7})); c.position.set(sx,.83,-.1); g.add(c); } return g; }
function peronKup(no){ const t=yaziDoku(String(no),{w:256,h:190,zemin:"#1b3f8f",renk:"#ffffff",font:"800 124px Arial"}); t.anisotropy=4;
  const yuz=new THREE.MeshStandardMaterial({map:t,emissive:renk("#ffffff"),emissiveMap:t,emissiveIntensity:.32,roughness:.5}), kn=mat("#1b3f8f");
  return new THREE.Mesh(new THREE.BoxGeometry(.95,.7,.95),[yuz,yuz,kn,kn,yuz,yuz]); }
function simitciYap(){ const g=new THREE.Group(); const kr=mat("#b3221c",{roughness:.5}), cm=new THREE.MeshStandardMaterial({color:renk("#dfe8ee"),transparent:true,opacity:.35,roughness:.05});
  const a=new THREE.Mesh(new THREE.BoxGeometry(1.1,.7,.6),kr); a.position.y=.75; g.add(a); const v=new THREE.Mesh(new THREE.BoxGeometry(1.0,.5,.5),cm); v.position.y=1.35; g.add(v);
  const tp=new THREE.Mesh(new THREE.BoxGeometry(1.12,.05,.62),kr); tp.position.y=1.62; g.add(tp);
  const sm=mat("#b8742e",{roughness:.7}); for(let i=0;i<9;i++){ const s=new THREE.Mesh(new THREE.TorusGeometry(.075,.03,6,12),sm); s.rotation.x=Math.PI/2+rnd(-.3,.3); s.position.set(-.38+(i%5)*.19,1.14+Math.floor(i/5)*.07,rnd(-.1,.1)); g.add(s); }
  for(const sx of [-.45,.45]){ const t=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.06,14),mat("#222")); t.rotation.z=Math.PI/2; t.position.set(sx,.2,0); g.add(t); }
  const yz=new THREE.Mesh(new THREE.PlaneGeometry(.9,.22),new THREE.MeshBasicMaterial({map:yaziDoku("SİMİT",{w:256,h:64,zemin:"#b3221c",renk:"#fff3d6",font:"800 44px Arial"})})); yz.position.set(0,.85,.302); g.add(yz);
  g.userData.engel={kutu:[.6,.35]}; return g; }
// telefondaki konum haritası: Kastamonu → Çankırı → Ankara, mavi nokta yolun neresinde
function yolHarita(oran,etiket){
  const c=document.createElement("canvas"); c.width=480; c.height=300; const x=c.getContext("2d");
  x.fillStyle="#efe9dc"; x.fillRect(0,0,480,300);
  x.fillStyle="#dfe8cf"; for(let i=0;i<14;i++){ x.beginPath(); x.ellipse(Math.random()*480,Math.random()*300,30+Math.random()*60,18+Math.random()*30,Math.random()*3,0,7); x.fill(); }
  x.strokeStyle="#d9d1c0"; x.lineWidth=2; for(let i=0;i<9;i++){ x.beginPath(); x.moveTo(Math.random()*480,0); x.bezierCurveTo(Math.random()*480,120,Math.random()*480,200,Math.random()*480,300); x.stroke(); }
  const P=[[70,38],[130,70],[175,118],[215,150],[262,176],[318,214],[392,252]]; const L=[0]; for(let i=1;i<P.length;i++) L.push(L[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));
  x.lineCap="round"; x.lineJoin="round"; x.strokeStyle="#e0a64a"; x.lineWidth=9; x.beginPath(); P.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.stroke();
  x.strokeStyle="#ffd98a"; x.lineWidth=5; x.stroke();
  x.fillStyle="#5d5446"; x.font="600 17px Arial"; x.fillText("Kastamonu",34,24); x.fillText("Çankırı",196,132); x.fillText("ANKARA",350,236);
  for(const i of [0,3,6]){ x.fillStyle="#fff"; x.beginPath(); x.arc(P[i][0],P[i][1],6,0,7); x.fill(); x.strokeStyle="#8a7d66"; x.lineWidth=2; x.stroke(); }
  const t=oran*L[L.length-1]; let k=1; while(k<P.length-1&&L[k]<t) k++; const u=(t-L[k-1])/(L[k]-L[k-1]||1); const px=P[k-1][0]+(P[k][0]-P[k-1][0])*u, py=P[k-1][1]+(P[k][1]-P[k-1][1])*u;
  x.fillStyle="rgba(66,133,244,.22)"; x.beginPath(); x.arc(px,py,24,0,7); x.fill(); x.fillStyle="#fff"; x.beginPath(); x.arc(px,py,11,0,7); x.fill(); x.fillStyle="#4285f4"; x.beginPath(); x.arc(px,py,8,0,7); x.fill();
  x.fillStyle="rgba(255,255,255,.92)"; x.fillRect(0,262,480,38); x.fillStyle="#2b2b2b"; x.font="600 16px Arial"; x.fillText("📍 Canlı konum · "+etiket,14,286);
  return c.toDataURL("image/jpeg",.85);
}
// karakterin önünden kamera noktası (yüzüne bakan, biraz yandan)
function ondenNokta(c,uzak,yan=0,yuk=0){ const f=new THREE.Vector3(Math.sin(c.rotation.y),0,Math.cos(c.rotation.y)), r=new THREE.Vector3(-f.z,0,f.x); return bas(c).addScaledVector(f,uzak).addScaledVector(r,yan).add(new THREE.Vector3(0,yuk,0)); }
// kare yakalanamadığında (zayıf GPU) albüm boş kalmasın: çizilmiş küçük kartlar
function yerTutucuKareler(){
  const ciz=(ad,tur,ust,alt,f)=>{ const c=document.createElement("canvas"); c.width=240; c.height=320; const x=c.getContext("2d");
    const g=x.createLinearGradient(0,0,0,320); g.addColorStop(0,ust); g.addColorStop(1,alt); x.fillStyle=g; x.fillRect(0,0,240,320); f(x); return {ad,tur,v:c.toDataURL("image/jpeg",.8)}; };
  const kale=x=>{ x.fillStyle="#2a1c22"; x.fillRect(0,230,240,90); for(let i=0;i<8;i++) x.fillRect(10+i*30,200,18,34); x.fillRect(20,170,60,64); x.fillRect(150,160,70,74); for(let i=0;i<5;i++){ x.fillRect(20+i*13,160,8,12); x.fillRect(150+i*15,150,9,12); } };
  const isik=(x,n,y0)=>{ for(let i=0;i<n;i++){ x.fillStyle=`rgba(255,${190+Math.random()*50|0},120,${.5+Math.random()*.5})`; x.fillRect(Math.random()*240,y0+Math.random()*60,2,2); } };
  const kalp=(x,cx,cy,r,renk)=>{ x.fillStyle=renk; x.beginPath(); x.moveTo(cx,cy+r*.9); x.bezierCurveTo(cx-r*1.6,cy-r*.2,cx-r*.6,cy-r*1.3,cx,cy-r*.4); x.bezierCurveTo(cx+r*.6,cy-r*1.3,cx+r*1.6,cy-r*.2,cx,cy+r*.9); x.fill(); };
  return [
    ciz("Kaleden Ankara","manzara","#f7b37a","#6b3a5a",x=>{ x.fillStyle="#3a2438"; x.fillRect(0,250,240,70); isik(x,140,240); }),
    ciz("Kalede ikimiz","biz","#ffcf9a","#c0607a",x=>{ kale(x); kalp(x,104,120,26,"#ff8fab"); kalp(x,140,112,22,"#ffd1dc"); }),
    ciz("Surlardan gün batımı","manzara","#ffd27a","#c4566a",x=>{ x.fillStyle="#fff2c0"; x.beginPath(); x.arc(120,190,34,0,7); x.fill(); kale(x); }),
    ciz("Kale dibinde gazoz","biz","#bfe6c8","#4f8a76",x=>{ for(const [cx,r] of [[92,-.18],[148,.18]]){ x.save(); x.translate(cx,210); x.rotate(r); x.fillStyle="rgba(200,255,220,.85)"; x.fillRect(-14,-80,28,96); x.fillRect(-7,-112,14,34); x.restore(); } }),
    ciz("Seğmenler'den şehir","manzara","#1b2350","#0a0d22",x=>{ x.fillStyle="#05060f"; x.fillRect(0,250,240,70); isik(x,260,200); }),
    ciz("Seğmenler'de bankta","biz","#26305e","#0d1028",x=>{ x.fillStyle="#3a2a1e"; x.fillRect(40,230,160,12); x.fillRect(48,242,8,40); x.fillRect(184,242,8,40); kalp(x,120,150,30,"#ff8fab"); })
  ];
}
async function dmResim(kim,src){
  if(!DM.el) return; if(kim==="o"){ const y=DM.ekle(el(`<div class="dm-yaziyor"><i></i><i></i><i></i></div>`)); await bekle(900); y.remove(); Ses.efekt("mesaj"); }
  const b=el(`<div class="dm-bal ${kim} resim"><img alt=""></div>`); b.querySelector("img").src=src; DM.ekle(b); b.querySelector("img").onload=()=>{ const a=DM.el&&DM.el.querySelector(".dm-akis"); if(a) a.scrollTop=a.scrollHeight; };
  await bekle(900);
}
// eski Ankara evi: taş zemin kat, bağdadi üst kat (çıkma), kiremit kırma çatı
function ankaraEvi(renkH,genis,derin){
  const g=new THREE.Group(); const tas=BA_DOKU.tasM, W=genis||3.8, D=derin||4;
  const alt=new THREE.Mesh(kutuGeo(W,4.2,D),tas); alt.position.y=.9; alt.receiveShadow=true; g.add(alt);
  const pd=BA_DOKU.evPencere||(BA_DOKU.evPencere=_baTuval(128,64,(x,w,h)=>{ x.fillStyle="#fff"; x.fillRect(0,0,w,h); for(const px of [18,74]){ x.fillStyle="#6b4a2e"; x.fillRect(px-4,10,40,46); x.fillStyle="#2a3440"; x.fillRect(px,14,32,38); x.fillStyle="#6b4a2e"; x.fillRect(px+14,14,4,38); x.fillRect(px,30,32,3); } }));
  const um=new THREE.MeshStandardMaterial({color:renk(renkH),map:pd,roughness:.9});
  const ust=new THREE.Mesh(new THREE.BoxGeometry(W+.3,2.6,D+.5),[mat(renkH,{roughness:.9}),mat(renkH,{roughness:.9}),mat(renkH),mat("#6b4a2e"),um,mat(renkH,{roughness:.9})]); ust.position.set(0,4.3,.2); ust.castShadow=true; g.add(ust);
  const kr=BA_DOKU.kiremitM; const cat=new THREE.Mesh(new THREE.ConeGeometry(Math.max(W,D)*.82,1.7,4),kr); cat.rotation.y=Math.PI/4; cat.scale.set(1,1,(D+.6)/(W+.4)); cat.position.y=6.45; cat.castShadow=true; g.add(cat);
  const kp=new THREE.Mesh(new THREE.PlaneGeometry(1,2),mat("#5a3a22",{roughness:.8})); kp.position.set(0,1,D/2+.01); g.add(kp);
  return g;
}
function kaleMalzemeleri(){
  if(!BA_DOKU.tasM){ const t=_baTuval(256,256,(x,w,h)=>{ x.fillStyle="#8d8476"; x.fillRect(0,0,w,h);
      for(let j=0;j<11;j++){ let px=-(j%2)*20; while(px<w){ const bw=26+Math.random()*30, bh=18+Math.random()*6; x.fillStyle=`hsl(${30+Math.random()*14},${8+Math.random()*10}%,${44+Math.random()*20}%)`; x.fillRect(px+2,j*24+2,bw-3,bh); px+=bw; } }
      for(let i=0;i<900;i++){ x.fillStyle=`rgba(${Math.random()<.5?40:230},${Math.random()<.5?36:220},30,.08)`; x.fillRect(Math.random()*w,Math.random()*h,2,2); } },true);
    BA_DOKU.tasM=new THREE.MeshStandardMaterial({map:t,roughness:.95,bumpMap:t,bumpScale:.035}); BA_DOKU.tasM.userData.kalici=true; }
  if(!BA_DOKU.kiremitM){ const t=_baTuval(128,128,(x,w,h)=>{ for(let j=0;j<8;j++) for(let i=0;i<8;i++){ x.fillStyle=`hsl(${10+Math.random()*10},${48+Math.random()*16}%,${34+Math.random()*12}%)`; x.fillRect(i*16+(j%2)*8,j*16,15,15); x.fillStyle="rgba(0,0,0,.25)"; x.fillRect(i*16+(j%2)*8,j*16+13,15,3); } },true); t.repeat.set(3,3);
    BA_DOKU.kiremitM=new THREE.MeshStandardMaterial({map:t,roughness:.8}); BA_DOKU.kiremitM.userData.kalici=true; }
  if(!BA_DOKU.kaldirimM){ const t=_baTuval(256,256,(x,w,h)=>{ x.fillStyle="#5f574e"; x.fillRect(0,0,w,h); for(let i=0;i<260;i++){ x.fillStyle=`hsl(30,${5+Math.random()*8}%,${36+Math.random()*18}%)`; x.beginPath(); x.ellipse(Math.random()*w,Math.random()*h,7+Math.random()*5,6+Math.random()*4,Math.random()*3,0,7); x.fill(); } },true);
    BA_DOKU.kaldirimM=new THREE.MeshStandardMaterial({map:t,roughness:.9,bumpMap:t,bumpScale:.03}); BA_DOKU.kaldirimM.userData.kalici=true; }
}
// uzaktaki şehir: pencereli bloklar (gün batımında bazı pencereler yanar), tepelerde kiremit damlı eski evler
function sehirKur(alan,adet,yer,ops={}){
  const pd=_baTuval(128,256,(x,w,h)=>{ x.fillStyle="#fff"; x.fillRect(0,0,w,h); for(let j=0;j<8;j++) for(let i=0;i<4;i++){ x.fillStyle="#56606b"; x.fillRect(8+i*30,10+j*31,18,21); }  },false,false);
  const ed=_baTuval(128,256,(x,w,h)=>{ x.fillStyle="#000"; x.fillRect(0,0,w,h); for(let j=0;j<8;j++) for(let i=0;i<4;i++){ if(Math.random()<(ops.isik||.3)){ x.fillStyle=`hsl(${36+Math.random()*10},90%,${60+Math.random()*15}%)`; x.fillRect(8+i*30,10+j*31,18,21); } } },false,false);
  const m=new THREE.MeshStandardMaterial({map:pd,emissiveMap:ed,emissive:renk("#ffd28a"),emissiveIntensity:ops.parlak||.9,roughness:.85});
  const geo=new THREE.BoxGeometry(1,1,1); geo.translate(0,.5,0); const im=new THREE.InstancedMesh(geo,m,adet); const o=new THREE.Object3D(); const cl=new THREE.Color(); const renkler=ops.renkler||["#d8cbb5","#cbb89e","#e2d6c2","#b9ab98","#d6c3a8","#c4bdb2"];
  for(let i=0;i<adet;i++){ const p=alan(i); const w=p.w||rnd(7,14), d=p.d||rnd(7,14), h=p.h||rnd(8,24); o.position.set(p.x,yer(p.x,p.z)-1,p.z); o.rotation.set(0,p.r||0,0); o.scale.set(w,h,d); o.updateMatrix(); im.setMatrixAt(i,o.matrix); cl.set(renkler[i%renkler.length]).convertSRGBToLinear(); im.setColorAt(i,cl); }
  if(im.instanceColor) im.instanceColor.needsUpdate=true; im.receiveShadow=false; return im;
}
function damlar(alan,adet,yer){
  kaleMalzemeleri(); const g=new THREE.Group();
  const geoD=new THREE.BoxGeometry(1,1,1); geoD.translate(0,.5,0); const geoC=new THREE.ConeGeometry(.78,.5,4); geoC.rotateY(Math.PI/4); geoC.translate(0,.25,0);
  const d=new THREE.InstancedMesh(geoD,mat("#efe6d6",{roughness:.9}),adet), c=new THREE.InstancedMesh(geoC,BA_DOKU.kiremitM,adet); const o=new THREE.Object3D(); const cl=new THREE.Color(); const rk=["#efe6d6","#e7d6bc","#f3ebde","#dccab0","#efd9c8"];
  for(let i=0;i<adet;i++){ const p=alan(i); const w=rnd(4,7), dd=rnd(4,7), h=rnd(3,6.5), r=rnd(-.3,.3), y=yer(p.x,p.z)-.6;
    o.position.set(p.x,y,p.z); o.rotation.set(0,r,0); o.scale.set(w,h,dd); o.updateMatrix(); d.setMatrixAt(i,o.matrix); cl.set(rk[i%rk.length]).convertSRGBToLinear(); d.setColorAt(i,cl);
    o.position.set(p.x,y+h,p.z); o.scale.set(w*1.12,rnd(1.6,2.4),dd*1.12); o.updateMatrix(); c.setMatrixAt(i,o.matrix); }
  if(d.instanceColor) d.instanceColor.needsUpdate=true; d.castShadow=c.castShadow=false; d.receiveShadow=true; g.add(d,c); return g;
}

const BA={
  id:"ankara", no:3, ad:"Ankaram", tarih:"Eylül 2024", alt:"AŞTİ'de kavuşma, kalenin dibinde gazoz",
  // ---------- AŞTİ ----------
  async kur(){ await this.astiKur(false); },
  async astiKur(gece){
    this.faz="asti"; this.gece=gece; this.t=0; ETK=[]; DALGA=[]; this.serbest=false; this.birlikte=false; this.kosu=null; this.konusmaZ=null; if(!gece) this.kareler=[];
    if(!gece) sahneKur({sis:"#b7a495",sisYakin:26,sisUzak:185,ust:"#6c7ca4",ufuk:"#f2b07e",alt:"#8a7a70",gunesYon:new THREE.Vector3(.55,.035,.84).normalize(),isikYon:new THREE.Vector3(.5,.3,.8),gunesRenk:"#ffad6e",isik:"#ffc69c",isikGuc:1.05,zemin:"#7a6c63",hemi:.95,dolgu:.62,dolguRenk:"#cdd5ff"});
    else sahneKur({sis:"#161b2c",sisYakin:28,sisUzak:165,ust:"#090d1f",ufuk:"#2a2f4c",alt:"#0b0d16",gunesYon:new THREE.Vector3(-.3,.45,-.84).normalize(),isikYon:new THREE.Vector3(.35,.62,.6),gunesRenk:"#9fb4ff",isik:"#b9c4ff",isikGuc:.42,zemin:"#262632",hemi:.62,dolgu:.42,dolguRenk:"#ffd6a6",yildiz:.35});
    Ses.ortam("kalabalik",.8);
    const asf=new THREE.Mesh(new THREE.PlaneGeometry(260,150),mat(gece?"#2f3034":"#47474b",{roughness:.92,bumpMap:gurultuDoku(70),bumpScale:.012})); asf.rotation.x=-Math.PI/2; asf.position.z=50; asf.receiveShadow=true; scene.add(asf);
    // peron kaldırımı, sarı hissedilebilir şerit
    const kal=new THREE.Mesh(new THREE.BoxGeometry(160,.18,8),mat("#b4afa6",{roughness:.88,bumpMap:gurultuDoku(40),bumpScale:.006})); kal.position.set(0,.09,-3.6); kal.receiveShadow=true; scene.add(kal);
    const sar=new THREE.Mesh(new THREE.PlaneGeometry(160,.3),mat("#d7b43c",{roughness:.7})); sar.rotation.x=-Math.PI/2; sar.position.set(0,.185,-.45); scene.add(sar);
    // terminal binası: alt kat cam cephe (her peron bir kapı), üstte krem paneller ve tabela
    const bina=new THREE.Mesh(new THREE.BoxGeometry(150,10,14),mat("#d8d1c4",{roughness:.85})); bina.position.set(0,5,-14.5); bina.receiveShadow=true; scene.add(bina);
    const ct=cepheDoku(); ct.repeat.set(25,1); const cephe=new THREE.Mesh(new THREE.PlaneGeometry(150,4.82),new THREE.MeshStandardMaterial({map:ct,roughness:.15,metalness:.35,emissive:renk("#ffcf8a"),emissiveMap:ct,emissiveIntensity:gece?.32:.1})); cephe.position.set(0,2.6,-7.48); scene.add(cephe);
    for(const x of [-38,38]){ const tb=new THREE.Mesh(new THREE.PlaneGeometry(34,1.5),new THREE.MeshStandardMaterial({map:yaziDoku("ANKARA ŞEHİRLERARASI OTOBÜS TERMİNALİ",{w:1024,h:64,zemin:"#0e2d6b",renk:"#ffffff",font:"700 38px Arial"}),emissive:renk("#ffffff"),emissiveIntensity:gece?.25:.08})); tb.position.set(x,7.6,-7.45); scene.add(tb); }
    const as=new THREE.Mesh(new THREE.PlaneGeometry(10,2.4),new THREE.MeshStandardMaterial({map:yaziDoku("AŞTİ",{w:512,h:128,zemin:"#0e2d6b",renk:"#ffffff",font:"800 92px Arial"}),emissive:renk("#ffffff"),emissiveIntensity:gece?.3:.1})); as.position.set(0,7.7,-7.45); scene.add(as);
    // sundurma: kaldırımın üstünü örter, altında ışık bantları
    const sun=new THREE.Mesh(new THREE.BoxGeometry(152,.36,9.6),mat("#d9d6cf",{roughness:.6})); sun.position.set(0,5.35,-2.85); sun.castShadow=true; scene.add(sun);
    const bant=new THREE.MeshBasicMaterial({color:renk(gece?"#fff1d2":"#fff6e4")}); for(const z of [-6,-3.2,-.4]){ const b=new THREE.Mesh(new THREE.PlaneGeometry(150,.22),bant); b.rotation.x=Math.PI/2; b.position.set(0,5.16,z); scene.add(b); }
    this.peron={}; const xs=i=>-72+i*6; this.xs=xs;
    for(let i=0;i<=24;i++){ const no=120+i, x=xs(i); this.peron[no]=x;
      const k=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,5.2,10),mat("#9ba1a8",{metalness:.55,roughness:.4})); k.position.set(x+3,2.7,1.15); k.userData.engel=.22; scene.add(k);
      const pk=peronKup(no); pk.position.set(x,4.35,1.0); scene.add(pk); const cb=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.6,6),mat("#555")); cb.position.set(x,4.95,1.0); scene.add(cb);
      const cz=new THREE.Mesh(new THREE.PlaneGeometry(.12,13),mat("#e8e6df",{roughness:.8})); cz.rotation.x=-Math.PI/2; cz.position.set(x+3,.012,7.5); scene.add(cz); }
    const seritler=["#c8262a","#1f5fb0","#1d8a4a","#e07a1a","#6a2a8a","#c8262a","#0f7c8c"], yonler=["İSTANBUL","SAMSUN","İZMİR","KONYA","ANTALYA","ÇORUM","TRABZON","SİVAS","ADANA","BURSA"];
    this.bosPeron=gece?133:128;
    for(let i=0;i<=24;i++){ const no=120+i; if(no===this.bosPeron) continue; if((i*7)%5===2) continue;
      const sr=seritler[i%seritler.length]==="#1f5fb0"&&!gece?"#c8262a":seritler[i%seritler.length]; // ilk gelişte tek mavi şeritli otobüs onunki
      const ob=otobusYap(sr,yonler[i%yonler.length]+" – ANKARA"); ob.position.set(xs(i),0,8.4); ob.rotation.y=Math.PI; scene.add(ob); }
    // gelen otobüs (mavi şeritli, Kastamonu'dan)
    this.otobus=otobusYap("#1f5fb0","KASTAMONU – ANKARA"); this.otobus.rotation.y=Math.PI;
    if(gece){ this.otobus.position.set(this.peron[133],0,8.4); } else { this.otobus.position.set(-120,0,24); this.otobus.rotation.y=Math.PI/2; }
    scene.add(this.otobus);
    // otobüs yolu kenarında yüksek lambalar, karşıda ağaçlar ve Ankara'nın çıplak tepeleri
    for(let i=0;i<14;i++){ const g=new THREE.Group(); const d=new THREE.Mesh(new THREE.CylinderGeometry(.09,.14,8,8),mat("#55595f",{metalness:.5,roughness:.5})); d.position.y=4; g.add(d);
      const kol=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,1.6),mat("#55595f")); kol.position.set(0,7.95,-.7); g.add(kol);
      const ba=new THREE.Mesh(new THREE.BoxGeometry(.36,.12,.6),new THREE.MeshStandardMaterial({color:renk("#fff6e0"),emissive:renk("#ffd9a0"),emissiveIntensity:gece?1.1:.35})); ba.position.set(0,7.86,-1.4); g.add(ba);
      if(gece){ const p=parilti("#ffd9a0",3.2); p.position.set(0,7.7,-1.4); g.add(p); }
      g.position.set(-78+i*12,0,25.5); g.userData.engel=.2; scene.add(g); }
    for(let i=0;i<20;i++){ const a=agac(i%5?"yesil":"cam",rnd(.9,1.3)); a.position.set(-95+i*10+rnd(-3,3),0,33+rnd(0,6)); scene.add(a); }
    const tepeM=mat(gece?"#2a2730":"#9c8a76",{roughness:1,flatShading:true});
    for(let i=0;i<16;i++){ const t=new THREE.Mesh(new THREE.ConeGeometry(rnd(40,80),rnd(14,30),7),tepeM); t.position.set(-260+i*36+rnd(-10,10),-2,rnd(150,230)); t.scale.z=.6; scene.add(t); }
    // banklar, simitçi
    for(let x=-66;x<=66;x+=18){ const b=bank2(); b.position.set(x+1.5,.18,-6.6); scene.add(b); }
    this.simitci=simitciYap(); this.simitci.position.set(-41,.18,-1.7); this.simitci.rotation.y=-.2; scene.add(this.simitci);
    // yolcular: bavullu bekleyenler, yürüyenler
    this.yolcular=[]; const ust=["#3a3f4b","#5a4636","#2f4a5a","#6b6a64","#4a3a4a","#3d4a3a","#7a5a3a","#8a2f2f","#2c2c34"];
    for(let i=0;i<22;i++){ const kiz=i%4===3; const yuruyen=i%3===0; const c=kalabalik(kiz?"michelle":"rpm",{ust:ust[i%ust.length],alt:ust[(i+4)%ust.length],anim:yuruyen?"walk":"idle",telefon:!yuruyen&&i%5<2,boy:rnd(.94,1.05),sac:["#2a1d14","#151515","#4a3524","#3a2a20"][i%4],ton:kiz?["#f0e4da","#e9dccf"][i%2]:null}); if(!c) continue;
      let x=rnd(-70,70); if(Math.abs(x-this.peron[this.bosPeron])<6) x+=12; const z=kiz?rnd(-6.4,-5):rnd(-6,-1.2);
      c.position.set(x,.18,z); c.rotation.y=rnd(-3,3); c.userData.engelKisi=true;
      if(yuruyen){ c.userData.yol={hz:rnd(.75,1.05)*(i%2?1:-1)}; c.userData.hiz=1.2; }
      else if(i%2===0){ const v=valizYap(["#2a2a2e","#6a1f2a","#1f3b5a","#3a3a3a"][i%4]); v.position.set(x+.42,.18,z+.1); v.rotation.y=rnd(-.5,.5); scene.add(v); }
      scene.add(c); this.yolcular.push(c); }
    // karakterler
    this.kaan=karakter("kaan",gece?"deri":"gunluk"); this.kar=karakter("kardelen",gece?"deri":"gunluk");
    this.kaan.position.set(-63,.18,-5.6); this.kaan.rotation.y=Math.PI/2;
    this.kar.position.set(-200,.18,0); this.kar.visible=false;
    this.valiz=valizYap("#7a2a3a"); this.valiz.visible=false; scene.add(this.valiz);
    this.tel=telefonYap(); this.tel.userData.telefon=true; this.tel.visible=false; scene.add(this.tel);
    scene.add(this.kaan,this.kar); KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    Kamera.sinema=null; Kamera.aci=-Math.PI/2; Kamera.mesafe=6.4; Kamera.yukseklik=2.7; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(-70,3.5,-5.6);
    Ses.ton="sicak";
  },
  async basla(){
    katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle();
    const K=this.kaan, D=this.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(-48,10,30),new THREE.Vector3(-30,2.5,-4));
      await kameraNoktasi(s=>new THREE.Vector3(-48+s*2.4,10-s*.7,30-s*1.6),new THREE.Vector3(-30,2.5,-4),5);
      baslikKarti(this.ad,[this.tarih,"Bölüm "+this.no]);
      await kameraNoktasi(bas(K).add(new THREE.Vector3(1.5,.15,1.3)),bas(K),2.6);
      await anlat("27 Eylül 2024, cuma. Kastamonu'dan ilk kez Ankara'ya, yanıma geliyordu.");
      await anlat("Ben okuldan çıkıp AŞTİ'ye geldim. O hâlâ yoldaydı.",2800);
      await this.yolTakibi();
    });
    await this.otobusGelis();
    // oyuncu: peronlar boyunca mavi şeritli otobüsü bul
    gorev("Mavi şeritli Kastamonu otobüsünü bul");
    this.serbest=true; kameraIpucu(); gizliKalpler(this,[[-72.2,1.1,-6.0,0]]);
    await kosul(()=>K.position.distanceTo(D.position)<11);
    D.userData.salla=1; D.userData.gulumse=1; D.userData.bakNokta=bas(K);
    konus("kardelen",["Burdayım 🙈"],{kamera:false,sure:1.6});
    await kosul(()=>K.position.distanceTo(D.position)<6.5);
    this.serbest=false; gorev(null);
    await sahne(async()=>{ await this.kosarakSaril(K,D,"AŞTİ'de kavuşma");
      await konus("kardelen",["Geldiiim minikom 🙈","Beş saat sürdü yaa"],{gul:1});
      await konus("kaan","Hoş geldin minnakım. Ankara'ya, yanıma.",{gul:.7});
      await konus("kardelen",["Çantam ağır oldu","Sen taşı 😄"],{gul:.9});
      const c=await sec(["Ver bakalım, kocan taşır 😄","Seni de taşırım istersen"]);
      if(c===0){ await konus("kaan","Ver bakalım, kocan taşır 😄"); await konus("kardelen",["Centilmen kocam 😄"],{gul:1}); }
      else { await konus("kaan","Seni de taşırım istersen."); await konus("kardelen",["Deli 😄","Herkes bakıyor"],{gul:1}); }
      await konus("kaan","Yarın sana Ankara'yı gezdireceğim, haberin olsun.",{gul:.6});
    });
    await gecis(async()=>{ katmanTemizle(); await this.kaleKur(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await this.kale();
  },
  // yol boyu konum takibi: telefonda canlı konum, kısa kısa mesajlar
  async yolTakibi(){
    const K=this.kaan; this.tel.visible=true; eldeTut(K,this.tel,"S"); K.userData.telefon=2; K.userData.hiz=0;
    await kameraNoktasi(ondenNokta(K,1.3,.3,.08),bas(K).add(new THREE.Vector3(0,-.1,0)),1.2);
    const dm=DM.ac("Kardelen 💕","çevrimiçi"); dm.zaman("Bugün · 15:25");
    await dm.yaz("o","Mola verdik"); await dm.yaz("o","Uyuyakalmışım 😴");
    const c=await dm.sec(["Konum at bakayım 😄","Neredesin minnakım?"]); await dm.yaz("ben",c?"Neredesin minnakım?":"Konum at bakayım 😄");
    await dmResim("o",yolHarita(.3,"Çankırı yolu"));
    await dm.yaz("ben","Daha Çankırı'dasın 😄 İki buçuk saat var");
    await dm.yaz("o","Saatler geçmiyor yaa");
    dm.zaman("17:55");
    await dm.yaz("o","Yol bitmiyor 😩"); await dm.yaz("o","Camdan bakıp duruyorum"); await dm.yaz("o","Her yer bozkır kdkdkd");
    const c2=await dm.sec(["Bozkır da güzel 🙂 Az kaldı","Manzaraya değil saate bak, geliyorsun 😄"]); await dm.yaz("ben",c2?"Manzaraya değil saate bak, geliyorsun 😄":"Bozkır da güzel 🙂 Az kaldı");
    dm.zaman("18:45");
    await dmResim("o",yolHarita(.88,"Ankara girişi"));
    await dm.yaz("o","Ankara göründü!"); await dm.yaz("o","Ne kadar büyükmüş"); await dm.yaz("o","Biraz da puslu 😄");
    const c3=await dm.sec(["Sis değil, Ankara'nın havası bu 😄","Ankara hep böyle minnakım, alışırsın"]); await dm.yaz("ben",c3?"Ankara hep böyle minnakım, alışırsın":"Sis değil, Ankara'nın havası bu 😄");
    await dm.yaz("o","Beğenmedim kdkdkd"); await dm.yaz("o","Az kaldı");
    const c4=await dm.sec(["İnanmam 😄","Kocan peronda, gözü yolda ❤️"]); await dm.yaz("ben",c4?"Kocan peronda, gözü yolda ❤️":"İnanmam 😄");
    await dm.yaz("o",c4?"Geliyorum geliyorum 🙈":"İnan kdkdkd");
    dm.zaman("18:58"); await dm.yaz("o","Girdik otogara!"); await dm.yaz("o","Mavi şeritli otobüs");
    await bekle(700); DM.kapat();
    K.userData.telefon=0; K.userData.eldeki=null; this.tel.visible=false;
  },
  // mavi şeritli otobüs perona girer, kapı açılır, o iner
  async otobusGelis(){
    const K=this.kaan, D=this.kar, O=this.otobus; const px=this.peron[this.bosPeron];
    await sahne(async()=>{
      const yol=new THREE.CatmullRomCurve3([new THREE.Vector3(px-58,0,24),new THREE.Vector3(px-22,0,24),new THREE.Vector3(px-5,0,22),new THREE.Vector3(px,0,15.5),new THREE.Vector3(px,0,8.4)]);
      let s=0; const T=7.5; const kam=new THREE.Vector3(px-14,2.2,-1.2);
      await new Promise(r=>{ Kamera.sinema=dt=>{ s=Math.min(T,s+dt); const u=1-Math.pow(1-s/T,2.2); const p=yol.getPointAt(u), q=yol.getTangentAt(Math.min(.999,u+.001));
          O.position.copy(p); O.rotation.y=Math.atan2(q.x,q.z);
          camera.position.lerp(kam,1-Math.pow(.05,dt)); camera.lookAt(O.position.x,1.6,O.position.z); if(s>=T) r(); }; });
      Ses.efekt("vuru",.5); await bekle(600);
      // kapı (aracın sağı: perona bakan +x tarafı) — iner, valizini alır
      D.visible=true; this.valiz.visible=true;
      D.position.set(px+1.75,.05,3.4); D.rotation.y=Math.PI; this.valiz.position.set(px+2.2,.18,1.3);
      await kameraNoktasi(new THREE.Vector3(px+4.4,1.75,-3.4),new THREE.Vector3(px+1.9,1.25,1.2),1.4);
      await yuruHedef(D,new THREE.Vector3(px+1.9,.18,-.9),1);
      this.valiz.position.set(px+2.35,.18,-1.05); D.position.y=.18;
      D.rotation.y=-Math.PI/2; D.userData.bakNokta=new THREE.Vector3(px-10,1.6,-2);
      await bekle(900); D.userData.bakNokta=null;
      await kameraNoktasi(bas(K).add(new THREE.Vector3(-4,1.2,1.2)),bas(K),1.2);
    });
  },
  async kosarakSaril(K,D,kare){
    D.userData.salla=0; D.userData.bakNokta=null; K.userData.hiz=0;
    const m=K.position.clone().lerp(D.position,.55); m.y=K.position.y;
    const yan=new THREE.Vector3().subVectors(D.position,K.position).setY(0).normalize();
    const hK=m.clone().addScaledVector(yan,-.2), hD=m.clone().addScaledVector(yan,.2);
    let s=0; Kamera.sinema=dt=>{ s+=dt; const c=K.position.clone().lerp(D.position,.5); const a=Math.atan2(yan.x,yan.z)+Math.PI/2+Math.sin(s*.3)*.25; camera.position.set(c.x+Math.sin(a)*3.4,1.55,c.z+Math.cos(a)*3.4); camera.lookAt(c.x,1.3,c.z); };
    await Promise.all([yuruHedef(K,hK,2.3),yuruHedef(D,hD,2.6)]);
    yuzYuze(K,D); K.userData.saril=D.userData.saril=1; D.userData.gulumse=1; K.userData.gulumse=.8; Ses.efekt("buyuk");
    await bekle(1500); const v=await kareAl(); if(v) this.kareler.push({ad:kare,tur:"biz",v});
    await bekle(1400);
    K.userData.saril=D.userData.saril=0;
    // sarılmadan sonra yarım adım geri: konuşma mesafesi
    const yon=new THREE.Vector3().subVectors(D.position,K.position).setY(0).normalize(); const k0=K.position.clone(), d0=D.position.clone();
    for(let i=1;i<=12;i++){ const e=i/12; K.position.copy(k0).addScaledVector(yon,-.22*e); D.position.copy(d0).addScaledVector(yon,.22*e); await bekle(30); }
  },
  // ---------- ULUS: ANKARA KALESİ ----------
  tepe(x,z){ let a; if(z>16) a=-(z-16)*.085; else if(z<-30) a=9+(-30-z)*.03; else { const s=(16-z)/46; a=9*s*s*(3-2*s); }
    const w=clamp((30-z)/40,0,1), yd=Math.max(0,Math.abs(x)-11)*.17*w; return Math.max(a-yd,-Math.max(0,z-16)*.085); }, // kale tepesi: sırt boyunca yokuş, iki yana iner
  async kaleKur(){
    this.faz="kale"; this.t=0; ETK=[]; DALGA=[]; this.serbest=false; this.birlikte=false; this.konusmaZ=[6,-8,-21];
    kaleMalzemeleri();
    const gy=new THREE.Vector3(-.42,.09,1).normalize();
    sahneKur({sis:"#d4a586",sisYakin:50,sisUzak:330,ust:"#6576a8",ufuk:"#ffb070",alt:"#9a7a66",gunesYon:gy,isikYon:new THREE.Vector3(-.42,.42,1),gunesRenk:"#ffab62",isik:"#ffc28c",isikGuc:1.9,zemin:"#8a705c",hemi:.78,dolgu:.5,dolguRenk:"#c9c5ff"});
    Ses.ortam("sehir",.6);
    const T=(x,z)=>this.tepe(x,z);
    const zg=new THREE.PlaneGeometry(640,700,120,130); const zp=zg.attributes.position, zc=[];
    for(let i=0;i<zp.count;i++){ const x=zp.getX(i), z=-zp.getY(i); zp.setZ(i,T(x,z)); const sehir=z>24?1:0; const k=rnd(.92,1.06); zc.push((sehir?.78:.86)*k,(sehir?.74:.76)*k,(sehir?.7:.64)*k); }
    zg.setAttribute("color",new THREE.Float32BufferAttribute(zc,3)); zg.computeVertexNormals();
    const zem=new THREE.Mesh(zg,new THREE.MeshStandardMaterial({color:renk("#a08a72"),vertexColors:true,roughness:1,bumpMap:gurultuDoku(80),bumpScale:.02})); zem.rotation.x=-Math.PI/2; zem.receiveShadow=true; scene.add(zem);
    // Arnavut kaldırımı yokuş + kale kapısı önündeki meydan
    const serit=(x0,x1,z0,z1,nz)=>{ const p=[], u=[], ix=[]; for(let i=0;i<=nz;i++){ const z=z0+(z1-z0)*i/nz; for(const [k,x] of [[0,x0],[1,x1]]){ p.push(x,T(x,z)+.035,z); u.push(k*(x1-x0)/4,(z-z0)/4); } if(i<nz){ const a=i*2; ix.push(a,a+1,a+2,a+1,a+3,a+2); } }
      const g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.Float32BufferAttribute(p,3)); g.setAttribute("uv",new THREE.Float32BufferAttribute(u,2)); g.setIndex(ix); g.computeVertexNormals(); const m=new THREE.Mesh(g,BA_DOKU.kaldirimM); m.receiveShadow=true; return m; };
    scene.add(serit(-2.4,2.4,18,-30,60)); scene.add(serit(-10,10,-28,-40,8));
    // sur ve burçlar (taş), kapı, Ak Kale ve bayrak
    const tm=BA_DOKU.tasM; const sY=T(0,-40); this.surY=sY+8; this.surZ=-40;
    const duvar=(w,ust,alt,x,z,ry)=>{ const h=ust-alt; const m=new THREE.Mesh(kutuGeo(w,h,1.8),tm); m.position.set(x,alt+h/2,z); m.rotation.y=ry; m.castShadow=true; m.receiveShadow=true; scene.add(m);
      for(let k=-w/2+.5;k<w/2-.3;k+=1.25){ const d=new THREE.Mesh(kutuGeo(.75,.85,.5),tm); d.position.set(k,h/2+.42,.62); m.add(d); } m.userData.engel={kutu:[w/2,.9]}; return m; };
    duvar(30,sY+8,sY-1.4,0,-40,0); duvar(26,sY+7.2,1.5,-15,-27,Math.PI/2); duvar(26,sY+7.2,1.5,15,-27,-Math.PI/2);
    for(const x of [-15,-6,6,15]){ const b=new THREE.Mesh(silindirGeo(2.4,2.6,14.5,5),tm); b.position.set(x,sY+4,-39.6); b.castShadow=true; scene.add(b); b.userData.engel=2.5;
      for(let k=0;k<5;k++){ const a=k/5*Math.PI*2; const d=new THREE.Mesh(kutuGeo(.8,.9,.6),tm); d.position.set(x+Math.cos(a)*2.05,sY+11.7,-39.6+Math.sin(a)*2.05); d.rotation.y=-a; scene.add(d); } }
    const kemer=new THREE.Mesh(new THREE.CircleGeometry(1.9,24,0,Math.PI),mat("#241c15")); kemer.position.set(0,sY+1.6,-39.08); scene.add(kemer);
    const kapiAlt=new THREE.Mesh(new THREE.PlaneGeometry(3.8,2.8),mat("#241c15")); kapiAlt.position.set(0,sY+.2,-39.08); scene.add(kapiAlt);
    const ak=new THREE.Mesh(kutuGeo(9,7,9),tm); ak.position.set(4,sY+12,-62); ak.castShadow=true; scene.add(ak);
    const icSur=new THREE.Mesh(kutuGeo(44,10,2),tm); icSur.position.set(0,sY+8,-56); scene.add(icSur);
    const by=bayrak(9,4.2); by.position.set(4,sY+15.5,-62); scene.add(by);
    // yokuşun iki yanında eski Ankara evleri ve dükkânlar (kuruyemiş, baharat)
    const evRenk=["#efe3cf","#e3cdb0","#f2e8d8","#dfc7a8","#ead7c8","#d8cbb4"];
    for(let i=0;i<9;i++) for(const s of [-1,1]){ const z=13-i*4.4+(s>0?1.6:0); if(z<-26) continue; const ev=ankaraEvi(evRenk[(i*2+(s>0?1:0))%evRenk.length]);
      const x=s*4.7; ev.position.set(x,T(x,z)-.2,z); ev.rotation.y=s>0?-Math.PI/2:Math.PI/2; ev.userData.engel={kutu:[2.2,2.1]}; scene.add(ev);
      if((i+(s>0?1:0))%3===0){ const t=new THREE.Group(); const te=new THREE.Mesh(new THREE.BoxGeometry(1.6,.8,.7),mat("#6a4a32")); te.position.y=.4; t.add(te);
        const kr=["#c8862a","#8a3a1a","#d9b44a","#7a5a2a","#a8321e"]; for(let k=0;k<6;k++){ const y=new THREE.Mesh(new THREE.ConeGeometry(.12,.16,8),mat(kr[k%5],{roughness:.9})); y.position.set(-.6+k*.24,.88,0); t.add(y); }
        const tnt=new THREE.Mesh(new THREE.PlaneGeometry(2,1.1),mat(["#2a6a4a","#a8321e","#2a4a8a"][i%3],{side:THREE.DoubleSide,roughness:.8})); tnt.position.set(0,2.4,.4); tnt.rotation.x=-1.0; t.add(tnt);
        t.position.set(s*2.85,T(s*2.85,z),z); t.rotation.y=s>0?-Math.PI/2:Math.PI/2; t.userData.engel={kutu:[.8,.35]}; scene.add(t); } }
    // kale tepesinin yamaçlarında kiremit damlı evler, ileride şehir
    scene.add(damlar(i=>{ let x,z; do{ x=rnd(-72,72); z=rnd(-58,34); }while(Math.abs(x)<9&&z>-34||Math.abs(x)<18&&z<-26&&z>-66); return {x,z}; },300,T));
    scene.add(sehirKur(i=>{ const z=rnd(40,330), x=rnd(-260,260); return {x,z,h:rnd(8,20)+Math.max(0,z-120)*.08,w:rnd(8,16),d:rnd(8,16),r:rnd(-.2,.2)}; },620,(x,z)=>T(x,z),{isik:.22,parlak:.75}));
    const kule=new THREE.Group(); const kg=new THREE.Mesh(new THREE.CylinderGeometry(1.8,2.6,88,12),mat("#d9d4cc",{roughness:.6})); kg.position.y=44; kule.add(kg);
    const kb=new THREE.Mesh(new THREE.CylinderGeometry(7,5,7,16),mat("#cfc9bf",{roughness:.5,metalness:.2})); kb.position.y=90; kule.add(kb); const ka=new THREE.Mesh(new THREE.CylinderGeometry(.4,.6,14,8),mat("#d9d4cc")); ka.position.y=100; kule.add(ka);
    kule.position.set(-60,T(-60,215)-2,215); scene.add(kule); // uzakta Atakule'yi andıran kule
    // gazozcu: kale kapısının dibinde küçük kulübe, çizgili tente, buzdolabında renk renk şişeler
    const dk=new THREE.Group(); const dz=-33.2, dx=6.2; dk.position.set(dx,T(dx,dz),dz); dk.rotation.y=-Math.PI/2; scene.add(dk); dk.userData.engel={kutu:[1.7,1.0]};
    const kul=new THREE.Mesh(new THREE.BoxGeometry(3.2,2.4,1.6),mat("#7a5638",{roughness:.75})); kul.position.set(0,1.2,-.4); kul.castShadow=true; dk.add(kul);
    const tez=new THREE.Mesh(new THREE.BoxGeometry(3.2,.95,.7),mat("#5a3c26",{roughness:.7})); tez.position.set(0,.48,.6); dk.add(tez);
    const ten=new THREE.Mesh(new THREE.PlaneGeometry(3.6,1.6),new THREE.MeshStandardMaterial({map:_baTuval(256,32,(x,w,h)=>{ for(let i=0;i<16;i++){ x.fillStyle=i%2?"#f3efe6":"#b8262b"; x.fillRect(i*16,0,16,h); } },false,false),side:THREE.DoubleSide,roughness:.8})); ten.position.set(0,2.55,.75); ten.rotation.x=-1.15; dk.add(ten);
    const lv=new THREE.Mesh(new THREE.PlaneGeometry(2.6,.5),new THREE.MeshBasicMaterial({map:yaziDoku("GAZOZ · KALE DİBİ",{w:512,h:96,zemin:"#f3efe6",renk:"#8a1e22",font:"700 52px Georgia"})})); lv.position.set(0,2.15,.42); dk.add(lv);
    const dol=new THREE.Mesh(new THREE.BoxGeometry(.9,1.7,.6),mat("#e9e9ec",{roughness:.4,metalness:.3})); dol.position.set(-1.1,.85,.05); dk.add(dol);
    const dc=new THREE.Mesh(new THREE.PlaneGeometry(.74,1.4),new THREE.MeshStandardMaterial({color:renk("#cfe6f0"),transparent:true,opacity:.35,roughness:.05,emissive:renk("#bfe4ff"),emissiveIntensity:.25})); dc.position.set(-1.1,.9,.36); dk.add(dc);
    const renkler=["#cfe9ff","#ffb347","#f2e46a","#ff8a9a","#9fe0a0"]; this.gazozlar=[];
    for(let r=0;r<3;r++) for(let i=0;i<4;i++){ const gz=gazozYap(renkler[(i+r)%5]); gz.scale.setScalar(1.4); gz.position.set(-1.38+i*.18,.32+r*.42,.08); dk.add(gz); }
    for(let i=0;i<8;i++){ const gz=gazozYap(renkler[i%5]); gz.position.set(.3+i*.15,.96,.62); dk.add(gz); this.gazozlar.push(gz); }
    this.dukkan=dk; this.dukkanNokta=new THREE.Object3D(); this.dukkanNokta.position.set(dx-1.6,T(dx-1.6,dz),dz); scene.add(this.dukkanNokta);
    const satici=kalabalik("rpm",{ust:"#e9e4d8",alt:"#3a3a3a",anim:"idle",sac:"#5a5a5a"}); if(satici){ satici.position.set(dx+.7,T(dx,dz),dz); satici.rotation.y=-Math.PI/2; scene.add(satici); this.satici=satici; }
    // meydanda gezenler
    this.yolcular=[]; for(let i=0;i<7;i++){ const c=kalabalik(i%3===2?"michelle":"rpm",{ust:["#5a4636","#2f4a5a","#6b6a64","#8a2f2f"][i%4],alt:["#2c2c34","#3d4a3a","#4a3a4a"][i%3],anim:i%2?"idle":"walk",sac:"#2a1d14"}); if(!c) continue;
      const x=rnd(-8,-1.5), z=rnd(-37,-30); c.position.set(x,T(x,z),z); c.rotation.y=rnd(-3,3); c.userData.engelKisi=true; if(i%2===0){ c.userData.yol={hz:rnd(.5,.8)*(i%4?1:-1),x0:x}; c.userData.hiz=1; } scene.add(c); this.yolcular.push(c); }
    for(let i=0;i<6;i++){ const l=lamba2(); const x=i%2?3:-3, z=12-i*7; l.position.set(x,T(x,z),z); scene.add(l); }
    this.kaan=karakter("kaan","gunluk"); this.kar=karakter("kardelen","gunluk"); this.kaan.position.set(.5,T(.5,15),15); this.kar.position.set(-.5,T(-.5,15),15); this.kaan.rotation.y=this.kar.rotation.y=Math.PI;
    scene.add(this.kaan,this.kar); KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    Kamera.sinema=null; Kamera.aci=0; Kamera.mesafe=6.8; Kamera.yukseklik=2.9; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(0,T(0,22)+4,22);
  },
  async kale(){
    const K=this.kaan, D=this.kar, T=(x,z)=>this.tepe(x,z);
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(16,T(0,26)+15,26),new THREE.Vector3(0,this.surY,-40));
      await kameraNoktasi(s=>new THREE.Vector3(16-s*2.2,T(0,26)+15-s*.8,26-s*1.2),new THREE.Vector3(0,this.surY-2,-40),4.6);
      await anlat("Ertesi gün Ulus. Ankara Kalesi'ne çıkan taş yokuş.");
      await kameraNoktasi(bas(K).lerp(bas(D),.5).add(new THREE.Vector3(.4,.1,-2.6)),bas(K).lerp(bas(D),.5),1.6);
      await konus("kaan","Yukarıda, kalenin dibinde bir gazozcu var. Ödülün o.",{gul:.6});
    });
    gorev("Yokuşu çıkın · kale kapısındaki gazozcuya");
    this.serbest=true; this.birlikte=true; K.userData.elele=D.userData.elele=1; gizliKalpler(this,[[2.0,this.tepe(2.0,-8)+1.0,-8,1]]);
    await etkBekle(this.dukkanNokta,"Gazoz al",{mesafe:2.6,isaretY:1.7});
    this.serbest=false; this.birlikte=false; gorev(null);
    await sahne(async()=>{ await this.gazoz(); });
    await sahne(async()=>{ await this.surlar(); });
    await gecis(async()=>{ katmanTemizle(); await this.parkKur(); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await this.park();
  },
  // GAZOZ: tat seç, açacakla kapağı aç (pıt!), tam buluştuklarında tokuştur
  async gazoz(){
    const K=this.kaan, D=this.kar, p=this.dukkanNokta.position, T=(x,z)=>this.tepe(x,z);
    K.userData.elele=D.userData.elele=0;
    const kp=new THREE.Vector3(p.x-.2,0,p.z+.55), dp=new THREE.Vector3(p.x-.2,0,p.z-.55); kp.y=T(kp.x,kp.z); dp.y=T(dp.x,dp.z);
    await Promise.all([yuruHedef(K,kp,1.1,{yer:T}),yuruHedef(D,dp,1.1,{yer:T})]);
    const ic=this.dukkan.position.clone(); cevir(K,ic); cevir(D,ic);
    await kameraNoktasi(p.clone().add(new THREE.Vector3(-3.4,1.9,1.2)),p.clone().add(new THREE.Vector3(1.2,1.2,0)),1.3);
    await konus("kardelen",["Hangisini alsak","Hepsi çok güzel duruyor"],{gul:1,kamera:false});
    const tatlar=["Sade","Portakallı","Limonlu","Çilekli"], renk_={Sade:"#cfe9ff",Portakallı:"#ffb347",Limonlu:"#f2e46a",Çilekli:"#ff8a9a"};
    const t1=await sec(tatlar.map(t=>"Ona: "+t)); const t2=await sec(tatlar.map(t=>"Bana: "+t));
    if(t1===t2) await konus("kardelen",["Aynısından 😄","Beni taklit etme"],{gul:1,kamera:false});
    const gD=gazozYap(renk_[tatlar[t1]]), gK=gazozYap(renk_[tatlar[t2]]); scene.add(gD,gK);
    yuzYuze(K,D); const orta=K.position.clone().lerp(D.position,.5); const yan=new THREE.Vector3().subVectors(D.position,K.position).setY(0).normalize(); const dik=new THREE.Vector3(yan.z,0,-yan.x);
    // şişeyi dik tutan el (IK): göğüs önünde, avuç şişeye dönük; k=1'de şişeler ortada buluşur
    this.sise={k:0,L:[[K,gK],[D,gD]]};
    Kamera.sinema=dt=>{ camera.position.copy(orta).addScaledVector(dik,2.35).add(new THREE.Vector3(0,1.55,0)); camera.lookAt(orta.x,orta.y+1.3,orta.z); };
    // 1) kapakları aç
    const ui=el(`<div class="sim"><div class="baslik">Gazozları aç</div><div class="ipucu">Açacağı kapağa geçir, basılı tut, kaldır.</div><div class="olcek" style="align-self:center;width:100%"><div class="bar"><i style="width:0%"></i></div></div><div class="satir"><button class="tut">🍾 Basılı tut</button></div></div>`); katman.appendChild(ui);
    const btn=ui.querySelector("button"), bar=ui.querySelector(".bar i"), ip=ui.querySelector(".ipucu"); let bas_=false; const bit=()=>{ bas_=false; btn.classList.remove("basili"); };
    btn.addEventListener("pointerdown",e=>{ e.preventDefault(); bas_=true; btn.classList.add("basili"); }); btn.addEventListener("pointerup",bit); btn.addEventListener("pointercancel",bit); btn.addEventListener("pointerleave",bit);
    let acildi=0, g_=0, son=performance.now();
    await new Promise(res=>{ const f=()=>{ if(!ui.isConnected) return; const t=performance.now(), dt=Math.min(.25,(t-son)/1000); son=t; g_=bas_?g_+dt*1.25:Math.max(0,g_-dt*1.6); bar.style.width=Math.min(100,g_*100)+"%";
        if(g_>=1){ g_=0; bit(); const gz=acildi===0?gK:gD; acildi++; Ses.efekt("vuru"); const k=gz.getObjectByName("kapak"); if(k) k.visible=false;
          const kp_=tozlar(14,()=>({x:rnd(-.025,.025),y:.24+rnd(0,.1),z:rnd(-.025,.025)}),"#ffffff",.025); gz.add(kp_); setTimeout(()=>kp_.parent&&kp_.parent.remove(kp_),1100);
          ip.textContent=acildi===1?"Pıt! Seninki açıldı. Şimdi onunki.":"Pıt! İkisi de açık."; if(acildi>=2){ bekle(500).then(res); return; } }
        requestAnimationFrame(f); }; f(); });
    ui.remove();
    await konus("kardelen",["Pıt diye ses geldi kdkdkd"],{gul:1,kamera:false});
    // 2) tokuştur: şişeler birbirine yaklaşırken tam ortada dokun
    const ui2=el(`<div class="sim"><div class="baslik">Tokuştur</div><div class="ipucu">Şişeler tam buluştuğunda dokun.</div><div class="olcek" style="align-self:center;width:100%"><div class="bar"><span class="hedef" style="left:44%;width:12%"></span><i style="width:0%;background:#fff"></i></div></div><div class="satir"><button>🥂 Çın!</button></div></div>`); katman.appendChild(ui2);
    const b2=ui2.querySelector("button"), i2=ui2.querySelector(".bar i"), p2=ui2.querySelector(".ipucu"); let deneme=0, tamam=false;
    while(!tamam&&deneme<4){ let v=0, yon=1, bas2=false; b2.onclick=()=>{ bas2=true; };
      await new Promise(res=>{ let son2=performance.now(); const f=()=>{ if(!ui2.isConnected) return; const t=performance.now(), dt=Math.min(.1,(t-son2)/1000); son2=t; v+=yon*dt*(.85-deneme*.15); if(v>1){ v=1; yon=-1; } if(v<0){ v=0; yon=1; }
          i2.style.width=(v*100)+"%"; this.sise.k=Math.sin(v*Math.PI);
          if(bas2){ res(); return; } requestAnimationFrame(f); }; f(); });
      tamam=deneme>=3||(v>.42&&v<.58); deneme++;
      if(tamam){ Ses.efekt("parilti"); Ses.efekt("vuru",.7); p2.textContent="Çın! 🥂"; const v2=await kareAl(); if(v2) this.kareler.push({ad:"Kale dibinde gazoz",tur:"biz",v:v2}); await bekle(700); }
      else { p2.textContent=v<.42?"Erken oldu, şişeler buluşmadı 😄":"Kaçtı! Bir daha."; await bekle(800); } }
    ui2.remove();
    await konus("kaan","İlk Ankara gazozumuz. Afiyet olsun minnakım.",{gul:.8});
    await konus("kardelen",[tatlar[t1]==="Sade"?"Sade en güzeli":tatlar[t1]+" çok güzelmiş","Bu gazozcuyu hep hatırlayalım"],{gul:1});
    this.sise=null; K.userData.elHedef=D.userData.elHedef=null; if(gD.parent) gD.parent.remove(gD); if(gK.parent) gK.parent.remove(gK);
  },
  // SURLAR: bütün Ankara ayaklarının altında; manzara fotoğrafı ve ikimizin selfiesi
  async surlar(){
    const K=this.kaan, D=this.kar;
    await gecis(async()=>{ const y=this.surY, z=this.surZ-.35; K.position.set(-.25,y,z); D.position.set(.17,y,z); K.rotation.y=D.rotation.y=0; K.userData.hiz=D.userData.hiz=0; K.userData.elele=D.userData.elele=1;
      Kamera.sinema=null; camera.position.set(1.8,y+2.1,z-3.2); camera.userData.bakis=null; camera.lookAt(0,y-4,60); });
    let s=0; const y=this.surY, z=this.surZ; Kamera.sinema=dt=>{ s+=dt; camera.position.set(1.6-s*.05,y+2.2,z-3.4-s*.02); camera.lookAt(-6,y-5,70); };
    await anlat("Surlardan bütün Ankara ayaklarımızın altındaydı. Güneş yavaş yavaş şehrin üstüne iniyordu.",3400);
    const v1=await kareAl(); if(v1) this.kareler.push({ad:"Surlardan gün batımı",tur:"manzara",v:v1});
    await konus("kardelen",["Ankara güzelmiş ya","Puslu ama güzel"],{gul:.9});
    await konus("kaan","Sen buradayken güzel.",{gul:.6});
    await konus("kardelen",["Şov yapma 😄"],{gul:1});
    // Kaan'ın manzara fotoğrafı (her zamanki gibi)
    const goz=bas(K).add(new THREE.Vector3(0,.13,.24));
    await kameraNoktasi(goz,new THREE.Vector3(-8,y-6,80),1.2);
    const vm=await this.vizor("Manzara","Ankara ayaklarınızın altında · çek"); if(vm) this.kareler.push({ad:"Kaleden Ankara",tur:"manzara",v:vm});
    await konus("kardelen",["Yine manzara 😄","Bizi de çek ama"],{gul:1});
    // selfie: Kaan'ın kolu uzanır, kamera telefonda
    const sf=await this.selfie(K,D,"Kalede ikimiz · Eylül 2024",{yon:new THREE.Vector3(0,0,-1),tekrar:true}); if(sf) this.kareler.push({ad:"Kalede ikimiz",tur:"biz",v:sf});
    K.userData.omuz=D.userData.omuz=0;
    { let s2=0; const m=K.position.clone().lerp(D.position,.5); Kamera.sinema=dt=>{ s2+=dt; camera.position.set(m.x+.9-s2*.04,y+1.75,m.z-2.6-s2*.03); camera.lookAt(m.x-.3,y+1.25,m.z+6); }; } // önlerinden, arkada şehir ve gün batımı
    await anlat("O gün telefonum manzarayla doldu. Ama en güzel kare yine ikimizdik.",3000);
  },
  // telefon vizörü: ızgara + deklanşör (manzara için)
  async vizor(baslik,ipucu){
    const v=el(`<div class="selfie"><div class="ust">${baslik}</div><i class="izg"></i><small class="alt">${ipucu}</small><button class="dek" aria-label="Çek"></button></div>`); katman.appendChild(v);
    const fov0=camera.fov; camera.fov=Math.max(camera.fov,58); camera.updateProjectionMatrix();
    await new Promise(r=>{ v.querySelector(".dek").onclick=r; });
    v.style.visibility="hidden"; const veri=await hatiraFoto("Ankara Kalesi'nden · Eylül 2024",{kendi:true}); v.remove(); camera.fov=fov0; boyut(); return veri;
  },
  // ikimizin selfiesi: yan yana, başlar birbirine yakın; Kaan sağ kolunu öne-yukarı uzatır, kamera elindeki telefonun ön kamerasıdır.
  // İkisi de objektife bakar. Önceden telefon (kamera) tam elin içindeydi: uzanan kol kadrajın ortasından başının üstüne doğru
  // kıvrılmış görünüyor, yüzünü kapatıyordu; Kardelen başka yere bakıyordu; bankta aralarında 76 cm olduğu için ikisi kadraja sığmıyordu.
  async selfie(K,D,baslik,ops={}){
    const f=ops.yon.clone().setY(0).normalize(); const ry=Math.atan2(f.x,f.z); const sol=new THREE.Vector3(f.z,0,-f.x), sag=sol.clone().negate(), yuk=new THREE.Vector3(0,1,0);
    if(!ops.otur){ K.rotation.y=D.rotation.y=ry; D.position.copy(K.position).addScaledVector(sol,.34); D.position.y=K.position.y; }
    else { const m=K.position.clone().lerp(D.position,.5), y=K.position.y; K.position.copy(m).addScaledVector(sag,.2); D.position.copy(m).addScaledVector(sol,.2); K.position.y=D.position.y=y; }
    K.userData.elele=D.userData.elele=0; D.userData.omuz=K.userData.omuz=ops.otur?0:1; K.userData.gulumse=.9; D.userData.gulumse=1; D.userData.kafa.rotation.z=ops.otur?.12:.16;
    // telefonun ön kamerası gibi geniş açı: dikey ekranda yatay ~52°
    const fov0=camera.fov; camera.fov=camera.aspect<1?THREE.MathUtils.clamp(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(26))/camera.aspect)*180/Math.PI,60,100):60; camera.updateProjectionMatrix();
    const kamNok=()=>{ const hk=bas(K), hd=bas(D), orta=hk.clone().lerp(hd,.5); return {kam:orta.clone().addScaledVector(f,.72).addScaledVector(sag,.06).addScaledVector(yuk,.13), bak:orta.clone().addScaledVector(yuk,-.04)}; };
    // ön kameraya aynı karede kesme: Kardelen'in Kaan'ın yanına alınması bir önceki çekimde "ışınlanma" gibi görünmesin; kamera bir kez
    // yerleşir (yarım saniye sonra yeniden hesaplanınca küçük bir sıçrama oluyordu)
    K.updateMatrixWorld(true); D.updateMatrixWorld(true);
    const {kam,bak}=kamNok(); kameraNoktasi(kam,bak);
    K.userData.bakNokta=kam.clone(); D.userData.bakNokta=kam.clone();
    // telefonu tutan el: omuzdan öne ve biraz yukarı, kameranın hemen sağ altında (kadrajın dışında); kol yalnız kenardan görünür
    const omz=K.userData.kemik.RightArm.getWorldPosition(new THREE.Vector3()); const elP=omz.clone().addScaledVector(f,.5).addScaledVector(sag,.1).addScaledVector(yuk,.2);
    K.userData.elHedef={Right:{p:elP,F:yuk.clone().addScaledVector(f,.25).normalize(),N:f.clone().negate(),kutup:sag.clone().multiplyScalar(.7).add(new THREE.Vector3(0,-.7,0)).normalize(),kivrim:[1.2,1.35,.9]}};
    Kamera.sinema=dt=>{ camera.position.copy(kam).add(new THREE.Vector3(Math.sin(zaman*1.3)*.004,Math.sin(zaman*1.7)*.004,0)); camera.lookAt(bak); };
    await bekle(400); // kol ve bakışlar yerine otursun
    const v=el(`<div class="selfie"><div class="ust">Ön kamera</div><small class="alt">İkiniz de kadrajda, gülümseyin</small><button class="dek" aria-label="Çek"></button></div>`); katman.appendChild(v);
    let veri=null;
    for(let d=0;d<(ops.tekrar?2:1);d++){
      await new Promise(r=>{ v.querySelector(".dek").onclick=r; });
      if(ops.tekrar&&d===0){ Ses.efekt("deklansor"); const fl=el(`<div class="flas"></div>`); katman.appendChild(fl); setTimeout(()=>fl.remove(),900);
        v.style.visibility="hidden"; await konus("kardelen",["Gözüm kapalı çıktı","Bir daha çek 😄"],{gul:1,kamera:false}); v.style.visibility=""; continue; }
      v.style.visibility="hidden"; veri=await hatiraFoto(baslik,{kendi:true}); }
    // çekimden sonra kamera telefonda kalıp dar açıya dönünce yüzler ekranı kaplıyordu (yarım yüzler): karşıdan ikili çekime geçilir
    v.remove(); kameraNoktasi(bak.clone().addScaledVector(f,2.4).addScaledVector(yuk,.12),bak); camera.fov=fov0; boyut(); K.userData.elHedef=null; D.userData.kafa.rotation.z=0; K.userData.bakNokta=D.userData.bakNokta=null;
    await bekle(300); return veri;
  },
  // ---------- SEĞMENLER PARKI ----------
  async parkKur(){
    this.faz="park"; this.t=0; ETK=[]; DALGA=[]; this.serbest=false; this.birlikte=false; this.konusmaZ=null;
    sahneKur({sis:"#1a2038",sisYakin:30,sisUzak:200,ust:"#0b1130",ufuk:"#333d6e",alt:"#141626",gunesYon:new THREE.Vector3(.3,-.25,-1).normalize(),isikYon:new THREE.Vector3(-.4,.7,-.5),gunesRenk:"#cfd8ff",isik:"#b4c0ff",isikGuc:.55,zemin:"#2a2a3a",hemi:.6,dolgu:.42,dolguRenk:"#ffcf9a",yildiz:.75});
    Ses.ortam("gece",.8);
    const cim=cimZemin(140,96,"#2c4429","#3a5634",40); cim.position.z=-4; scene.add(cim); // park yamacın üstünde biter; ötesi şehir
    const korkuluk=new THREE.Mesh(new THREE.BoxGeometry(140,.9,.25),mat("#8a8478",{roughness:.9})); korkuluk.position.set(0,.45,-51.8); scene.add(korkuluk);
    { const g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.Float32BufferAttribute([-70,0,-52, 70,0,-52, 70,-26,-84, -70,-26,-84],3)); g.setIndex([0,1,2,0,2,3]); g.computeVertexNormals(); scene.add(new THREE.Mesh(g,mat("#161c16",{roughness:1}))); } // yamaç şehre iner
    const yolM=mat("#a39b8f",{roughness:.9,bumpMap:gurultuDoku(24),bumpScale:.01});
    const egri=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,24),new THREE.Vector3(-1.5,0,10),new THREE.Vector3(1.8,0,-4),new THREE.Vector3(.5,0,-16),new THREE.Vector3(-2,0,-34)]); this.egri=egri;
    const yg=new THREE.BufferGeometry(); const P=[], U=[], I=[]; const N=80; for(let i=0;i<=N;i++){ const t=i/N, p=egri.getPointAt(t), q=egri.getTangentAt(t); const n=new THREE.Vector3(q.z,0,-q.x).normalize(); for(const s of [-1,1]){ P.push(p.x+n.x*1.6*s,.02,p.z+n.z*1.6*s); U.push(s>0?1:0,t*20); } if(i<N){ const a=i*2; I.push(a,a+2,a+1,a+1,a+2,a+3); } }
    yg.setAttribute("position",new THREE.Float32BufferAttribute(P,3)); yg.setAttribute("uv",new THREE.Float32BufferAttribute(U,2)); yg.setIndex(I); yg.computeVertexNormals(); const yol=new THREE.Mesh(yg,yolM); yol.receiveShadow=true; scene.add(yol);
    for(let i=0;i<26;i++){ const t=i/26, p=egri.getPointAt(t), q=egri.getTangentAt(t); const n=new THREE.Vector3(q.z,0,-q.x).normalize(); const s=i%2?1:-1; const a=agac(i%5===0?"sonbahar":i%7===0?"cam":"yesil",rnd(.95,1.3)); a.position.copy(p).addScaledVector(n,s*rnd(5,9)); scene.add(a); }
    for(let i=0;i<9;i++){ const t=.04+i*.115; if(Math.abs(t-.62)<.08) continue; const p=egri.getPointAt(t), q=egri.getTangentAt(t); const n=new THREE.Vector3(q.z,0,-q.x).normalize(); const l=lamba2(); l.position.copy(p).addScaledVector(n,(i%2?1:-1)*2.3); scene.add(l);
      l.children[1].material.emissiveIntensity=1.3; const g=parilti("#ffd9a0",2.4); g.position.copy(l.position).add(new THREE.Vector3(0,3.9,0)); scene.add(g); }
    const bt=.62, bp=egri.getPointAt(bt), bq=egri.getTangentAt(bt); const bn=new THREE.Vector3(bq.z,0,-bq.x).normalize();
    this.bank=bank2(); this.bank.position.copy(bp).addScaledVector(bn,2.5); this.bank.rotation.y=Math.atan2(-bn.x,-bn.z); scene.add(this.bank);
    const bl=lamba2(); bl.position.copy(this.bank.position).addScaledVector(bq,1.4).addScaledVector(bn,.5); scene.add(bl); bl.children[1].material.emissiveIntensity=1.5; const blg=parilti("#ffd9a0",3); blg.position.copy(bl.position).add(new THREE.Vector3(0,3.9,0)); scene.add(blg);
    this.bankIsik=new THREE.PointLight(renk("#ffcf94"),1.6,11,2); this.bankIsik.position.copy(this.bank.position).addScaledVector(bn,-1.6).add(new THREE.Vector3(0,2.6,0)); scene.add(this.bankIsik); // yüzleri aydınlatan sıcak ışık (lambadan geliyormuş gibi)
    // aşağıda şehrin ışıkları (park yamaçta), uzakta Atakule'yi andıran ışıklı kule
    this.isiklar=tozlar(900,()=>{ const a=rnd(-1.2,1.2), r=rnd(90,260); return {x:Math.sin(a)*r*1.4,y:rnd(-24,-6)+r*.02,z:-60-Math.cos(a)*r}; },"#ffd59a",1.5); this.isiklar.material.fog=false; scene.add(this.isiklar); // uzaktaki şehir ışıkları sise gömülmesin (açılış çekimi kapkara kalıyordu)
    const zem2=new THREE.Mesh(new THREE.PlaneGeometry(800,500),mat("#0d0f18",{roughness:1})); zem2.rotation.x=-Math.PI/2; zem2.position.set(0,-26,-260); scene.add(zem2);
    const ak=new THREE.Group(); const ag=new THREE.Mesh(new THREE.CylinderGeometry(1.8,2.5,80,10),mat("#a8a6b8",{emissive:renk("#ffffff"),emissiveIntensity:.06})); ag.position.y=40; ak.add(ag);
    const ab=new THREE.Mesh(new THREE.CylinderGeometry(7,5,7,16),new THREE.MeshStandardMaterial({color:renk("#d9d6e8"),emissive:renk("#9fd0ff"),emissiveIntensity:.6})); ab.position.y=82; ak.add(ab); ak.position.set(70,-20,-210); ak.traverse(o=>{ if(o.material) o.material.fog=false; }); scene.add(ak);
    scene.add(otlar(()=>({x:rnd(-40,40),z:rnd(-50,30)}),900,"#3d5a35",.3,p=>{ const t=clamp((24-p.z)/58,0,1); const q=egri.getPointAt(t); return Math.abs(p.x-q.x)<2.2; }));
    // gece yürüyüşü yapan birkaç kişi
    this.yolcular=[]; for(let i=0;i<4;i++){ const c=kalabalik("rpm",{ust:["#2f3a4a","#4a3a2f","#3a3a3a","#2a4a3a"][i],alt:"#22252c",anim:"walk",sac:"#1a1a1a"}); if(!c) continue; c.userData.engelKisi=true; c.userData.parkT=rnd(0,1); c.userData.parkY=i%2?1:-1; c.userData.hiz=1; scene.add(c); this.yolcular.push(c); }
    this.kaan=karakter("kaan","gunluk"); this.kar=karakter("kardelen","gunluk"); const p0=egri.getPointAt(.02); this.kaan.position.set(p0.x+.3,0,p0.z); this.kar.position.set(p0.x-.3,0,p0.z); this.kaan.rotation.y=this.kar.rotation.y=Math.PI;
    scene.add(this.kaan,this.kar); KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    Kamera.sinema=null; Kamera.aci=0; Kamera.mesafe=6.4; Kamera.yukseklik=2.6; Kamera.hedef.copy(this.kaan.position); Kamera.poz.set(0,4,30);
  },
  async park(){
    const K=this.kaan, D=this.kar;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(-6,9,-30),new THREE.Vector3(0,-14,-200));
      await kameraNoktasi(s=>new THREE.Vector3(-6+s*.6,9-s*.3,-30+s*.4),new THREE.Vector3(0,-14,-200),4);
      await anlat("Akşam Seğmenler Parkı. Aşağıda bütün şehrin ışıkları yanıyordu.");
      const v=await kareAl(); if(v) this.kareler.push({ad:"Seğmenler'den şehir",tur:"manzara",v});
      await kameraNoktasi(bas(K).lerp(bas(D),.5).add(new THREE.Vector3(.4,.1,-2.6)),bas(K).lerp(bas(D),.5),1.8);
      await konus("kardelen",["Bacaklarım bitti bugün","Ama çok güzeldi"],{gul:.9});
      await konus("kaan","Şu bankı kapalım, biraz oturalım.",{gul:.6});
    });
    gorev("El ele, parktaki banka kadar yürüyün");
    this.parkSoz=[14,3]; this.serbest=true; this.birlikte=true; K.userData.elele=D.userData.elele=1; gizliKalpler(this,[[4.2,1.0,2,2]]);
    await etkBekle(this.bank,"Banka otur",{mesafe:2.6,isaretY:1.2});
    this.serbest=false; this.birlikte=false; gorev(null);
    await sahne(async()=>{
      const bq=this.bank.rotation.y, yan=new THREE.Vector3(Math.cos(bq),0,-Math.sin(bq)), ileri=new THREE.Vector3(Math.sin(bq),0,Math.cos(bq));
      K.position.copy(this.bank.position).addScaledVector(yan,-.38).addScaledVector(ileri,.05); D.position.copy(this.bank.position).addScaledVector(yan,.38).addScaledVector(ileri,.05); // o Kaan'ın solunda
      K.rotation.y=D.rotation.y=bq; K.userData.hiz=D.userData.hiz=0; K.userData.oturY=D.userData.oturY=.46; K.userData.otur=D.userData.otur=1; K.userData.elele=D.userData.elele=1;
      const m=this.bank.position.clone(); let s=0;
      Kamera.sinema=dt=>{ s+=dt; camera.position.copy(m).addScaledVector(ileri,3.1).add(new THREE.Vector3(0,1.25,0)).addScaledVector(yan,Math.sin(s*.12)*.5); camera.lookAt(m.x,.95,m.z); };
      D.userData.bakNokta=bas(K); K.userData.bakNokta=bas(D);
      await konus("kardelen",["Her şey için teşekkür ederim","Bütün gün nazımı çektin 🥲"],{gul:.9,kamera:false});
      const c=await sec(["Ssst. Bu daha başlangıç 😉","Asıl ben teşekkür ederim, geldin"]);
      await konus("kaan",c?"Asıl ben teşekkür ederim. Beş saat yol geldin.":"Ssst. Bu daha başlangıç 😉",{gul:.8,kamera:false});
      await konus("kardelen",["Sensiz hiçbirinin tadı olmazdı","Biliyorsun dimi"],{gul:1,kamera:false});
      await konus("kaan","Biliyorum minnakım.",{gul:.7,kamera:false});
      D.userData.bakNokta=null; K.userData.bakNokta=null;
      const q=el(`<div class="qte"><button class="btn qte-btn">🤳 Bankta bir selfie</button></div>`); katman.appendChild(q);
      await new Promise(r=>{ q.querySelector("button").onclick=r; }); q.remove();
      const sf=await this.selfie(K,D,"Seğmenler · Eylül 2024",{yon:ileri,otur:true}); if(sf) this.kareler.push({ad:"Seğmenler'de bankta",tur:"biz",v:sf});
      await bekle(600);
    });
    await gecis(async()=>{ katmanTemizle(); K.userData.otur=D.userData.otur=0; Kamera.sinema=null; camera.position.set(0,14,-34); camera.lookAt(0,-10,-200); Kamera.sinema=dt=>{ camera.lookAt(0,-10,-200); }; });
    await this.parkSonrasi();
  },
  async parkSonrasi(){
    await this.geceTelefon();
    await gecis(async()=>{ katmanTemizle(); await this.astiKur(true); katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); });
    await this.peron133();
  },
  // ---------- 29 EYLÜL GECESİ: hikâyeye atılacak fotoğraflar, iyi geceler ----------
  async geceTelefon(){
    ustDugmeler();
    await anlat("29 Eylül gecesi. O Kastamonu'ya dönmüştü, ben okula.",2600);
    const dm=DM.ac("Kardelen 💕","çevrimiçi"); dm.zaman("29 Eylül · 23:17");
    await dm.yaz("o","Fotoğrafları seçelim mi"); await dm.yaz("o","Bugünü paylaşalım 😍");
    const sec_=await this.fotoSec();
    const biz=sec_.filter(k=>k.tur==="biz").length, man=sec_.length-biz;
    for(const k of sec_){ if(!k.v) continue; const b=el(`<div class="dm-bal ben resim"><img alt=""></div>`); b.querySelector("img").src=k.v; DM.ekle(b); await bekle(220); }
    Ses.efekt("gonder"); await bekle(500);
    if(man>biz){ await dm.yaz("o","Manzara yine kazandı 😄"); await dm.yaz("o","Bizimkileri de koy ama"); }
    else if(sec_.length>=6){ await dm.yaz("o","Albüm yaptın resmen kdkdkd"); await dm.yaz("ben","Herkes görsün, bir şey olmaz 😄"); }
    else { await dm.yaz("o","Çok güzel seçmişsin 😍"); await dm.yaz("o","Etiketledim seni"); }
    await dm.yaz("o","Konum ne olsun");
    const c=await dm.sec(["Ankara yeterli 😄","Ulus · Ankara Kalesi"]); await dm.yaz("ben",c?"Ulus · Ankara Kalesi":"Ankara yeterli 😄");
    await dm.yaz("o","Okey"); await dm.yaz("o","Akşamki parkın adı neydi");
    const c2=await dm.sec(["Seğmenler","Kuğulu… yok yok, Seğmenler 😄"]); await dm.yaz("ben",c2?"Kuğulu… yok yok, Seğmenler 😄":"Seğmenler");
    await dm.yaz("o","Tamamdır 😘");
    dm.zaman("Gece yarısı");
    await dm.yaz("ben","Hadi yatalım minnakım, sabah erken kalkıyorum");
    await dm.yaz("o","Bugün her şey çok güzeldi 🥹");
    const c3=await dm.sec(["Geldiğin için teşekkür ederim ❤️","Asıl sen iyi ki geldin ❤️"]); await dm.yaz("ben",c3?"Asıl sen iyi ki geldin ❤️":"Geldiğin için teşekkür ederim ❤️");
    await dm.yaz("o","Yine gelirim, haberin olsun kdkdkd");
    await bekle(900); DM.kapat();
    await anlat("Her gece yaptığımız gibi: telefonda sarıldık, üstümüzü örttük, uyuduk.",3000);
  },
  // telefonda albüm: hikâyeye atılacak kareleri seç (manzara mı, biz mi?)
  fotoSec(){
    const kar=this.kareler&&this.kareler.length?this.kareler:yerTutucuKareler();
    return new Promise(r=>{
      const d=el(`<div class="foto-sec"><div class="fs-ust"><b>Hikâyene ekle</b><small>Hangileri paylaşılsın?</small></div><div class="fs-izgara">${kar.map((k,i)=>`<button class="fs-kare" data-i="${i}"><img src="${k.v}" alt=""><span>${k.ad}</span><i></i></button>`).join("")}</div><button class="btn kucuk fs-tamam" disabled>Paylaş</button></div>`);
      katman.appendChild(d); const secili=new Set(); const t=d.querySelector(".fs-tamam");
      d.querySelectorAll(".fs-kare").forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; if(secili.has(i)) secili.delete(i); else secili.add(i); b.classList.toggle("secili",secili.has(i)); t.disabled=!secili.size; t.textContent=secili.size?`Paylaş (${secili.size})`:"Paylaş"; Ses.efekt("vuru",.4); });
      t.onclick=()=>{ d.remove(); r([...secili].sort((a,b)=>a-b).map(i=>kar[i])); };
    });
  },
  // ---------- 25 EKİM 2024: doğum günüm için yine geldi, peron 133'e koşu ----------
  async peron133(){
    const K=this.kaan, D=this.kar; const px=this.peron[133];
    D.visible=true; D.position.set(px+1.9,.18,-.9); D.rotation.y=-Math.PI/2; this.valiz.visible=true; this.valiz.position.set(px+2.35,.18,-1.05);
    K.position.set(-66,.18,-5.4); K.rotation.y=Math.PI/2;
    await sahne(async()=>{
      kameraNoktasi(new THREE.Vector3(-40,12,26),new THREE.Vector3(-20,2,-4));
      await kameraNoktasi(s=>new THREE.Vector3(-40+s*2,12-s*.6,26-s),new THREE.Vector3(-20,2,-4),3.6);
      await anlat("Bir ay sonra, 25 Ekim. Doğum günüm için yine yola çıktı.");
      await anlat("Ben de ona süslenmek için berbere gitmiştim. Biraz geç kaldım.",2800);
      this.tel.visible=true; eldeTut(K,this.tel,"S"); K.userData.telefon=2;
      await kameraNoktasi(ondenNokta(K,1.3,.3,.08),bas(K).add(new THREE.Vector3(0,-.1,0)),1.1);
      const dm=DM.ac("Kardelen 💕","çevrimiçi"); dm.zaman("25 Ekim · 19:15");
      await dm.yaz("o","Geldim!");
      await dm.yaz("ben","Ben de Ankara'dayım, bekle beni geleyrum 😄");
      await dm.yaz("o","Nerdesin"); await dm.yaz("o","Otobüs durdu"); await dm.yaz("o","Peron 133");
      await dm.sec(["Geliyorum, koşuyorum! 🏃"]); await dm.yaz("ben","Geliyorum, koşuyorum! 🏃");
      await bekle(500); DM.kapat(); K.userData.telefon=0; K.userData.eldeki=null; this.tel.visible=false;
    });
    // koşu: kalabalığın arasından peron 133'e
    gorev("Peron 133'e koş");
    const ui=el(`<div class="kosu"><div class="sure"><b>0:20</b><small>o bekliyor</small></div><button class="btn kos-btn">🏃 Koş</button></div>`); katman.appendChild(ui);
    const kb=ui.querySelector(".kos-btn"), sb=ui.querySelector(".sure b"); this.kosu={hiz:0,bas:false,sure:20,mesaj:0};
    const ac=e=>{ e.preventDefault(); if(this.kosu) this.kosu.bas=true; kb.classList.add("basili"); }, kapa=()=>{ if(this.kosu){ this.kosu.bas=false; } kb.classList.remove("basili"); };
    kb.addEventListener("pointerdown",ac); kb.addEventListener("pointerup",kapa); kb.addEventListener("pointercancel",kapa); kb.addEventListener("pointerleave",kapa);
    const bildirim=t=>{ const b=el(`<div class="bildirim"><b>Kardelen 💕</b><span>${t}</span></div>`); katman.appendChild(b); Ses.efekt("mesaj"); requestAnimationFrame(()=>b.classList.add("gor")); setTimeout(()=>{ b.classList.remove("gor"); setTimeout(()=>b.remove(),500); },2600); };
    this.kosu.bildirim=bildirim; this.kosu.sb=sb;
    this.serbest=true;
    await kosul(()=>K.position.distanceTo(D.position)<7);
    this.serbest=false; gorev(null); const gecti=this.kosu&&this.kosu.sure<0; ui.remove(); this.kosu=null;
    D.userData.bakNokta=bas(K); D.userData.salla=1; D.userData.gulumse=1;
    await sahne(async()=>{
      await konus("kardelen",gecti?["Şapşik nerde kaldın 😄"]:["Burdayım 🙈"],{gul:1,kamera:false,sure:1.4});
      await this.kosarakSaril(K,D,"Peron 133");
      await konus("kardelen",["Nefes nefese kalmışsın kdkdkd","Koştun mu gerçekten"],{gul:1});
      await konus("kaan","Doğum günüm için berbere bile gittim, haberin olsun. Sana süslendim 😄",{gul:.8});
      await konus("kardelen",["Şapşik 😄","Saçın da yakışmış ama 😍"],{gul:1});
      await konus("kardelen",["İyi ki doğdun kocam","Hediyen çantamda 🙈"],{gul:1});
      const c=await sec(["En güzel hediye sensin zaten.","Açalım mı hemen? 😄"]);
      if(c===0){ await konus("kaan","En güzel hediye sensin zaten.",{gul:.7}); await konus("kardelen",["Laf ebesi 😄","Ama tatlısın"],{gul:1}); }
      else { await konus("kaan","Açalım mı hemen? 😄",{gul:.8}); await konus("kardelen",["Sabret","Otelde açacaksın"],{gul:1}); }
      const pk=this.peron[133]; K.position.set(pk+.2,.18,-1.3); D.position.set(pk-.16,.18,-1.3); K.rotation.y=D.rotation.y=Math.PI; K.userData.elele=D.userData.elele=0;
      K.userData.omuz=D.userData.omuz=1; K.userData.gulumse=.8; D.userData.gulumse=1; D.userData.kafa.rotation.z=.16; D.userData.bakNokta=null; D.userData.salla=0;
      kameraNoktasi(new THREE.Vector3(pk,1.62,-6.3),new THREE.Vector3(pk,2.0,-1.0)); // kesme: fotoğraf yerine alınmaları görünmesin
      await kameraNoktasi(new THREE.Vector3(pk,1.5,-5.3),new THREE.Vector3(pk,2.0,-1.0),1.4); // tepede "133" tabelası da kadrajda
      const q=el(`<div class="qte"><button class="btn qte-btn">📷 Peron 133'ün altında</button></div>`); katman.appendChild(q);
      await new Promise(r=>{ q.querySelector("button").onclick=r; }); q.remove();
      await hatiraFoto("AŞTİ · Peron 133 · Ekim 2024"); await bekle(1600);
      K.userData.omuz=D.userData.omuz=0; D.userData.kafa.rotation.z=0;
      await anlat("O günden sonra peron numaralarını hep aklımda tuttum.",2800);
      await anlat("Ankara artık ikimizin şehriydi.",3000);
    });
    bolumBitti(this.no);
  },
  guncelle(dt){
    this.t+=dt; const K=this.kaan, D=this.kar; if(!K) return; dalgaGuncelle(this.t);
    if(this.sise){ const S=this.sise, h0=bas(S.L[0][0]), h1=bas(S.L[1][0]); const bul=h0.clone().lerp(h1,.5).add(new THREE.Vector3(0,-.36,0));
      for(const [c,gz] of S.L){ const f=new THREE.Vector3(Math.sin(c.rotation.y),0,Math.cos(c.rotation.y)), r=new THREE.Vector3(-f.z,0,f.x); const h=bas(c);
        const dur=h.clone().addScaledVector(f,.27).addScaledVector(r,.13).add(new THREE.Vector3(0,-.46,0)); const p=dur.lerp(bul.clone().addScaledVector(r,.03),S.k*.92);
        c.userData.elHedef={Right:{p,F:f.clone().addScaledVector(r,-.25).normalize(),N:r.clone().negate(),kutup:r.clone().multiplyScalar(.55).add(new THREE.Vector3(0,-.75,0)).addScaledVector(f,-.2).normalize(),kivrim:[1.35,1.55,1.05],bas:[.8,.7,.5]}};
        gz.position.copy(p).addScaledVector(r,-.04).add(new THREE.Vector3(0,-.075,0)); gz.rotation.order="YXZ"; gz.rotation.set(S.k*.22,c.rotation.y,0); } }
    if(this.faz==="asti"){
      for(const c of this.yolcular||[]){ const y=c.userData.yol; if(!y) continue; c.position.x+=y.hz*dt*1.25; c.rotation.y=y.hz>0?Math.PI/2:-Math.PI/2; if(Math.abs(c.position.x)>74) y.hz*=-1; }
      const sinir=p=>{ p.x=clamp(p.x,-74,74); p.z=clamp(p.z,-6.9,.4); p.y=.18; };
      if(this.serbest&&!kilit){ const ks=this.kosu; let hz=2.3;
        if(ks){ ks.hiz=lerp(ks.hiz,ks.bas?1:0,Math.min(1,dt*4)); hz=2.3+ks.hiz*2.5; const once=ks.sure; ks.sure-=dt; const sn=Math.max(0,Math.ceil(ks.sure)); ks.sb.textContent="0:"+String(sn).padStart(2,"0");
          for(const [t,s] of [[18,"İndim 🙈"],[14,"Nerdesin"],[9,"Çok kalabalık burası"],[4,"133'ün önündeyim"],[0,"Şapşik nerde kaldın 😄"]]) if(once>t&&ks.sure<=t) ks.bildirim(s); }
        yuru(K,dt,sinir,hz); }
    } else if(this.faz==="kale"){
      for(const c of this.yolcular||[]){ const y=c.userData.yol; if(!y) continue; c.position.x+=y.hz*dt; c.rotation.y=y.hz>0?Math.PI/2:-Math.PI/2; if(c.position.x>-1.2||c.position.x<-9) y.hz*=-1; c.position.y=this.tepe(c.position.x,c.position.z); }
      const sinir=p=>{ const z=clamp(p.z,-37.5,16.5); const gen=z<-28?8.5:2.2; p.x=clamp(p.x,-gen,z<-28?7.6:gen); p.z=z; p.y=this.tepe(p.x,p.z); };
      if(this.serbest&&!kilit){ yuru(K,dt,sinir,1.9); if(this.birlikte){ eleleTakip(K,D,dt); sinir(D.position); }
        const zs=this.konusmaZ; if(zs&&zs.length&&K.position.z<zs[0]){ const i=3-zs.length; zs.shift();
          const r=[["kardelen",["Bu yokuş bitmez mi","Ayaklarım koptu 😄"]],["kaan","Az kaldı, yukarıda gazoz var 😄"],["kardelen",["Ooo kale 😍","Çok güzelmiş"]]][i]; if(r) konus(r[0],r[1],{kamera:false,sure:2.4,gul:.8}); } }
    } else if(this.faz==="park"){
      for(const c of this.yolcular||[]){ const u=c.userData; u.parkT=(u.parkT+dt*.012*u.parkY+1)%1; const p=this.egri.getPointAt(u.parkT), q=this.egri.getTangentAt(u.parkT); const n=new THREE.Vector3(q.z,0,-q.x).normalize();
        c.position.copy(p).addScaledVector(n,u.parkY*.8); c.rotation.y=Math.atan2(q.x*u.parkY,q.z*u.parkY); }
      const sinir=p=>{ p.x=clamp(p.x,-12,12); p.z=clamp(p.z,-36,24); p.y=0; };
      if(this.serbest&&!kilit){ yuru(K,dt,sinir,2); if(this.birlikte) eleleTakip(K,D,dt);
        const ps=this.parkSoz; if(ps&&ps.length&&K.position.z<ps[0]){ const i=2-ps.length; ps.shift();
          const r=[["kardelen",["Gece başka güzelmiş","Işıklara bak 😍"]],["kaan","Hepsi senin için yandı, haberin olsun."]][i]; if(r) konus(r[0],r[1],{kamera:false,sure:2.4,gul:.8}); } }
    }
    etkilesimGuncelle(K,this.btn);
    if(!Kamera.sinema) Kamera.hedef.lerp(this.birlikte?K.position.clone().lerp(D.position,.5):K.position,.12);
  },
  temizle(){ DM.kapat&&DM.kapat(); this.kosu=null; }
};
