/* ================= HAYAT SİMÜLATÖRÜ · BİR GÜN BİRLİKTE =================
   Serbest mod: göl kıyısında bir kasaba (Gölbaşı esintili: iskele, çapraz ahşap korkuluklar, kafe, dondurmacı, çiçekçi, sinema, park).
   Kaan'ı oyuncu yönetir, Kardelen el ele yanında. Gün 10:00'da başlar, gece yarısı biter; gök, güneş, lambalar, pencereler saate göre değişir.
   Dört gösterge (tokluk, enerji, eğlence, mutluluk) zamanla azalır; mekânlar ve Kardelen'le yapılanlar doldurur. Kardelen ara ara bir şey
   ister (dondurma, fotoğraf, sinema...), yerine getirilince çok sevinir. Kurallar: ev/evlilik sahnesi yok, para yok, kavga yok;
   Kardelen kısa ve takılarak konuşur, Kaan'a adıyla seslenmez. */
const HB_SAAT0=600, HB_SAAT1=1440, HB_HIZ=1.25; // oyun dakikası; gerçek saniyede 1,25 oyun dakikası (bir gün ~11 dakika)
// saat anahtarları: [dk, gök üst, ufuk, alt, güneş yüksekliği°, güneş yönü° (0: göl/kuzey, 90: doğu), güneş rengi, güneş gücü, yarıküre, sis, yıldız, lamba]
const HB_ANAHTAR=[
  [600,"#5f93db","#cfe3f5","#b9c3c9",36,112,"#fff0d6",2.35,.78,"#cddcea",0,0],
  [780,"#4f86d6","#d8e8f6","#c0c8cc",54,178,"#fff7ea",2.6,.82,"#d3e0ec",0,0],
  [990,"#5a85c6","#efdcc6","#c4bdb4",29,236,"#ffe3b6",2.35,.72,"#e2d6c8",0,0],
  [1100,"#6a6aa6","#ffb27a","#97797a",9,280,"#ffb06c",1.9,.56,"#e3ae8e",0,.12],
  [1160,"#3c3e7a","#ff8b68","#5a4660",-1,296,"#ff7a50",.75,.42,"#97697a",.12,.6],
  [1230,"#141a3c","#3a3264","#1c1a2c",-14,320,"#8fa6ff",.36,.32,"#2a2a48",.8,1],
  [1440,"#070a1c","#1a1838","#0c0c18",-30,350,"#7f96ff",.3,.27,"#151528",1,1] ];
const HB_AY=new THREE.Vector3(.45,.62,.64).normalize(); // gece ışığı (ay): güneydoğudan
function hbYon(el,az){ const e=THREE.MathUtils.degToRad(el), a=THREE.MathUtils.degToRad(az); return new THREE.Vector3(Math.sin(a)*Math.cos(e),Math.sin(e),-Math.cos(a)*Math.cos(e)); }
const HB_ISTEK=[
  {ad:"dondurma",ortak:"Dondurma zamanı 🍦",soz:["Canım dondurma çekti 🍦","Alır mısın"],ipucu:"Kardelen dondurma istiyor 🍦"},
  {ad:"kafe",ortak:"Kafede bir mola verin ☕",soz:["Bir kahve içelim mi ☕","Ayaklarım koptu kdkdkd"],ipucu:"Kardelen kafeye oturmak istiyor ☕",kosul:B=>B.ih.enerji<80||B.ih.tok<75},
  {ad:"foto",ortak:"İskelede fotoğraf çekin 📸",soz:["Fotoğrafımızı çekelim 📸","İskelenin ucunda güzel çıkar"],ipucu:"İskelenin ucunda fotoğraf çekin 📸"},
  {ad:"sinema",ortak:"Sinemaya gidin 🎬",soz:["Film izleyelim mi 🎬","Bu sefer uyumayacağım söz kdkdkd"],ipucu:"Kardelen sinemaya gitmek istiyor 🎬",kosul:B=>B.saat>=870&&B.saat<1350},
  {ad:"ordek",ortak:"Ördekleri besleyin 🦆",soz:["Ördekleri gördün mü 🦆","Besleyelim mi"],ipucu:"Göl kenarında ördekleri besleyin 🦆",kosul:B=>B.saat<1200},
  {ad:"salincak",ortak:"Parkta salıncağa binin 🎠",soz:["Parkta salıncak var","Sallar mısın beni 🥺"],ipucu:"Parktaki salıncağa gidin 🎠"},
  {ad:"cicek",ortak:"Çiçekçiye uğrayın 🌷",soz:["Şu çiçekçiye bak 🌷","Ne güzel kokuyordur"],ipucu:"Çiçekçiden çiçek al 🌷",kosul:B=>!B.cicekAlindi},
  {ad:"saril",ortak:"Sarılın 🤗 (💗 düğmesi)",soz:["Üşüdüm biraz","Sarılsana bana 🤗"],ipucu:"Kardelen'e sarıl 💗 (kalp düğmesi)"},
  {ad:"bank",ortak:"Gün batımını bankta izleyin 🌅",soz:["Gün batıyor bak 🌅","Oturup izleyelim mi"],ipucu:"Göl kenarındaki banka oturun 🌅",kosul:B=>B.saat>=1070&&B.saat<=1185} ];
const HB_AD={kafe:"☕ Kafe",dondurma:"🍦 Dondurma",cicek:"🌷 Çiçek",sinema:"🎬 Sinema",bank:"🌅 Göl kenarında oturduk",ordek:"🦆 Ördekleri besledik",foto:"📸 Fotoğraf",salincak:"🎠 Salıncak",saril:"🤗 Sarılmalar",iltifat:"😍 İltifatlar",gidikla:"😆 Gıdıklama",selfie:"🤳 Selfie"};

/* ---------- yapılar ---------- */
// bina cephesi: gündüz dokusu ve gece ışıkları aynı pencere düzeninde (4 sütun × 8 kat bir karo)
// kıyı yolu döşemesi: şaşırtmalı dikdörtgen taşlar, hafif renk farkı ve derz çizgileri (fotoğraftaki gibi bej-gri)
function hbTasDoku(taban,derz){ const c=document.createElement("canvas"); c.width=c.height=512; const x=c.getContext("2d"); x.fillStyle=derz; x.fillRect(0,0,512,512);
  const T=new THREE.Color(taban); for(let j=0;j<8;j++) for(let i=-1;i<5;i++){ const ox=(j%2)*64, px=i*128+ox+3, py=j*64+3; const v=(Math.random()-.5)*.09, h=new THREE.Color().copy(T).offsetHSL(0,0,v);
    x.fillStyle="#"+h.getHexString(); x.fillRect(px,py,122,58); x.fillStyle="rgba(255,255,255,.05)"; x.fillRect(px,py,122,3); x.fillStyle="rgba(0,0,0,.05)"; x.fillRect(px,py+52,122,6);
    for(let k=0;k<14;k++){ x.fillStyle=`rgba(${Math.random()<.5?"0,0,0":"255,255,255"},${Math.random()*.05})`; x.fillRect(px+Math.random()*118,py+Math.random()*54,3+Math.random()*7,2+Math.random()*4); } }
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t; }
function hbCephe(renkH){
  const W=256,H=512, c=document.createElement("canvas"), e=document.createElement("canvas"); c.width=e.width=W; c.height=e.height=H;
  const x=c.getContext("2d"), y=e.getContext("2d"); x.fillStyle=renkH; x.fillRect(0,0,W,H); y.fillStyle="#000"; y.fillRect(0,0,W,H);
  x.fillStyle="rgba(0,0,0,.06)"; for(let j=0;j<8;j++) x.fillRect(0,j*64+58,W,3); // kat silmeleri
  for(let j=0;j<8;j++) for(let i=0;i<4;i++){ const px=16+i*62, py=12+j*64;
    x.fillStyle="#3b4756"; x.fillRect(px,py,36,44); x.fillStyle="rgba(255,255,255,.3)"; x.fillRect(px,py,36,4); x.fillStyle="rgba(255,255,255,.08)"; x.fillRect(px+18,py,2,44);
    x.fillStyle="rgba(0,0,0,.22)"; x.fillRect(px-3,py+44,42,5);
    if(Math.random()<.42){ const r=Math.random(); y.fillStyle=r<.62?"#ffd29a":r<.86?"#ffe8c6":"#c8dcff"; y.fillRect(px+2,py+3,32,39); } }
  const t=new THREE.CanvasTexture(c), te=new THREE.CanvasTexture(e);
  for(const k of [t,te]){ k.encoding=THREE.sRGBEncoding; k.wrapS=k.wrapT=THREE.RepeatWrapping; k.anisotropy=4; }
  return {on:new THREE.MeshStandardMaterial({map:t,emissiveMap:te,emissive:renk("#ffffff"),emissiveIntensity:0,roughness:.86}), yan:mat(renkH,{roughness:.9})};
}
function hbBina(B,w,h,d,v,tabela,tabelaZemin){
  const g=new THREE.Group(), C=B.cepheler[v%B.cepheler.length];
  const govde=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),C.yan); govde.position.set(0,h/2,d/2); govde.castShadow=true; govde.receiveShadow=true; g.add(govde);
  // üst katlar: göle bakan yüz (-z); pencere sayısı genişliğe göre tam sütun
  const pg=new THREE.PlaneGeometry(w,h-4.2); const uv=pg.attributes.uv, su=Math.max(1,Math.round(w/3.1))/4, sv=(h-4.2)/24.8;
  for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*su,uv.getY(i)*sv);
  const on=new THREE.Mesh(pg,C.on); on.position.set(0,4.2+(h-4.2)/2,-.02); on.rotation.y=Math.PI; on.receiveShadow=true; on.userData.gece=1; g.add(on);
  // zemin kat: koyu cam vitrin, gece içeriden ışık
  const vit=new THREE.Mesh(new THREE.PlaneGeometry(w-1.2,2.7),B.vitrinM); vit.position.set(0,1.75,-.03); vit.rotation.y=Math.PI; vit.userData.gece=1; g.add(vit);
  const sacak=new THREE.Mesh(new THREE.BoxGeometry(w,.18,1.1),mat("#4a403a",{roughness:.7})); sacak.position.set(0,3.55,-.5); sacak.castShadow=true; g.add(sacak);
  if(tabela){ const tb=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w-1.4,6),.85),new THREE.MeshStandardMaterial({map:yaziDoku(tabela,{w:512,h:72,zemin:tabelaZemin||"#7a2b25",renk:"#f8eedb",font:"600 46px Georgia"}),emissive:renk("#ffffff"),emissiveIntensity:0,roughness:.6}));
    tb.position.set(0,4.05,-.06); tb.rotation.y=Math.PI; tb.userData.gece=1; g.add(tb); B.tabelaM.push(tb.material); }
  g.userData.engel={kutu:[w/2+.05,d/2+.05],o:[0,d/2]}; g.userData.kameraEngel=true;
  return g;
}
// çapraz (X) dikmeli ahşap korkuluk: fotoğraftaki göl kıyısı gibi
function hbKorkuluk(g,a,b,M){
  const d=b.clone().sub(a), L=d.length(), n=Math.max(1,Math.round(L/1.8)), ry=Math.atan2(d.x,d.z), seg=L/n;
  for(let i=0;i<=n;i++){ const p=a.clone().lerp(b,i/n); const s=new THREE.Mesh(new THREE.BoxGeometry(.1,1.12,.1),M); s.position.set(p.x,.56,p.z); s.rotation.y=ry; s.castShadow=true; g.add(s); }
  for(const yk of [1.08,.16]){ const r=new THREE.Mesh(new THREE.BoxGeometry(.075,.075,L),M); r.position.set((a.x+b.x)/2,yk,(a.z+b.z)/2); r.rotation.y=ry; r.castShadow=true; g.add(r); }
  const boy=Math.hypot(seg,.86), aci=Math.atan2(.86,seg);
  for(let i=0;i<n;i++){ const p=a.clone().lerp(b,(i+.5)/n); for(const sg of [1,-1]){ const c=new THREE.Mesh(new THREE.BoxGeometry(.045,.045,boy),M); c.position.set(p.x,.62,p.z); c.rotation.set(0,ry,0); c.rotateX(sg*aci); g.add(c); } }
}
function hbSemsiye(renkH){ const g=new THREE.Group(); const d=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,2.3,8),mat("#d8d2c8",{metalness:.4,roughness:.5})); d.position.y=1.15; g.add(d);
  const k=new THREE.Mesh(new THREE.ConeGeometry(1.25,.5,10,1,true),mat(renkH,{roughness:.8,side:THREE.DoubleSide})); k.position.y=2.35; k.castShadow=true; g.add(k); return g; }
function hbKiosk(){ // dondurma büfesi: çizgili tente, vitrin, tabela
  const g=new THREE.Group(); const gv=new THREE.Mesh(new THREE.BoxGeometry(2.6,2.3,1.8),mat("#f3ece2",{roughness:.7})); gv.position.y=1.15; gv.castShadow=true; gv.receiveShadow=true; g.add(gv);
  const cc=document.createElement("canvas"); cc.width=128; cc.height=16; const cx=cc.getContext("2d"); for(let i=0;i<8;i++){ cx.fillStyle=i%2?"#ffffff":"#e8577a"; cx.fillRect(i*16,0,16,16); }
  const ct=new THREE.CanvasTexture(cc); ct.encoding=THREE.sRGBEncoding;
  const tente=new THREE.Mesh(new THREE.BoxGeometry(3.0,.08,1.2),new THREE.MeshStandardMaterial({map:ct,roughness:.8})); tente.position.set(0,2.45,-1.25); tente.rotation.x=.28; tente.castShadow=true; g.add(tente);
  const tz=new THREE.Mesh(new THREE.BoxGeometry(2.62,.95,.06),mat("#d9e4ea",{roughness:.15,metalness:.2})); tz.position.set(0,1.25,-.92); g.add(tz);
  for(let i=0;i<5;i++){ const t=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),mat(["#f7e3c4","#7a4a2e","#f2a7bf","#a8e0b8","#fff6e8"][i],{roughness:.6})); t.position.set(-.8+i*.4,1.12,-.86); g.add(t); }
  const tb=new THREE.Mesh(new THREE.PlaneGeometry(2.2,.5),new THREE.MeshStandardMaterial({map:yaziDoku("DONDURMA",{w:512,h:116,zemin:"#e8577a",renk:"#fff",font:"700 74px Georgia"}),emissive:renk("#ffffff"),emissiveIntensity:0,roughness:.6}));
  tb.position.set(0,2.95,-.75); tb.rotation.y=Math.PI; tb.userData.gece=1; g.add(tb);
  const kul=new THREE.Mesh(new THREE.ConeGeometry(.22,.55,12),mat("#d9a05a",{roughness:.7})); kul.position.set(1.1,3.1,-.75); kul.rotation.x=Math.PI; g.add(kul);
  const top=new THREE.Mesh(new THREE.SphereGeometry(.24,12,10),mat("#f2a7bf",{roughness:.5})); top.position.set(1.1,3.42,-.75); g.add(top);
  g.userData.engel={kutu:[1.35,.95]}; g.userData.tabela=tb; return g; }
function hbCicekTezgah(){ const g=new THREE.Group(); const ah=mat("#8a5a3a",{roughness:.8});
  const ust=new THREE.Mesh(new THREE.BoxGeometry(2.4,.08,1.0),ah); ust.position.y=.82; ust.castShadow=true; g.add(ust);
  for(const [a,b] of [[-1.1,-.42],[1.1,-.42],[-1.1,.42],[1.1,.42]]){ const ay=new THREE.Mesh(new THREE.BoxGeometry(.07,.82,.07),ah); ay.position.set(a,.41,b); g.add(ay); }
  const renkler=["#d01628","#ffd34d","#f7f2ea","#f28ab0","#b46ae0","#ff8a3a"];
  for(let i=0;i<6;i++){ const kova=new THREE.Mesh(new THREE.CylinderGeometry(.17,.13,.3,12),mat("#6f7a86",{metalness:.5,roughness:.4})); kova.position.set(-.95+i*.38,1.0,-.1); g.add(kova);
    for(let k=0;k<7;k++){ const c=new THREE.Mesh(new THREE.IcosahedronGeometry(.055,0),mat(renkler[i],{roughness:.6,flatShading:true})); c.position.set(-.95+i*.38+rnd(-.1,.1),1.27+rnd(0,.12),-.1+rnd(-.1,.1)); g.add(c); }
    const yap=new THREE.Mesh(new THREE.ConeGeometry(.16,.3,6),mat("#3f7a3a",{roughness:.8})); yap.position.set(-.95+i*.38,1.2,-.1); g.add(yap); }
  const tente=new THREE.Mesh(new THREE.BoxGeometry(2.8,.06,1.4),mat("#3f7a5a",{roughness:.8})); tente.position.set(0,2.3,0); tente.castShadow=true; g.add(tente);
  for(const a of [-1.3,1.3]){ const d=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,2.3,6),mat("#2a2a2a")); d.position.set(a,1.15,.6); g.add(d); }
  g.userData.engel={kutu:[1.25,.55]}; return g; }
function hbSalincak(){ const g=new THREE.Group(); const dm=mat("#c4573a",{metalness:.4,roughness:.5});
  for(const x of [-1.6,1.6]) for(const z of [-.7,.7]){ const ay=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.75,8),dm); ay.position.set(x,1.3,z*.5); ay.rotation.x=z>0?-.27:.27; ay.castShadow=true; g.add(ay); }
  const ust=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,3.4,10),dm); ust.rotation.z=Math.PI/2; ust.position.y=2.6; ust.castShadow=true; g.add(ust);
  const salinimlar=[]; for(const x of [-.75,.75]){ const p=new THREE.Group(); p.position.set(x,2.58,0); g.add(p);
    for(const s of [-.24,.24]){ const ip=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,2.0,5),mat("#3a3a3a")); ip.position.set(s,-1.0,0); p.add(ip); }
    const ot=new THREE.Mesh(new THREE.BoxGeometry(.6,.05,.26),mat("#3a2a22",{roughness:.7})); ot.position.y=-2.0; ot.castShadow=true; p.add(ot); p.userData.oturak=ot; salinimlar.push(p); }
  g.userData.salinimlar=salinimlar; g.userData.engel={kutu:[1.75,.5]}; return g; }
function hbOrdek(){ const g=new THREE.Group(); const disi=Math.random()<.4;
  const v=new THREE.Mesh(new THREE.SphereGeometry(1,12,9),mat(disi?"#8a6a48":"#cfc6b8",{roughness:.8})); v.scale.set(.13,.09,.2); v.position.y=.05; g.add(v);
  const k=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),mat(disi?"#7a5a3a":"#5a4a3a",{roughness:.8})); k.scale.set(.06,.035,.09); k.position.set(0,.12,-.1); g.add(k); // kuyruk
  const b=new THREE.Mesh(new THREE.SphereGeometry(.065,12,10),mat(disi?"#7a5a3a":"#1f5a3a",{roughness:.5,metalness:.15})); b.position.set(0,.2,.13); g.add(b);
  const ga=new THREE.Mesh(new THREE.ConeGeometry(.026,.08,8),mat("#f0a020",{roughness:.6})); ga.rotation.x=Math.PI/2; ga.position.set(0,.19,.21); g.add(ga);
  if(!disi){ const h=new THREE.Mesh(new THREE.TorusGeometry(.045,.008,6,12),mat("#ffffff")); h.rotation.x=Math.PI/2; h.position.set(0,.15,.12); g.add(h); }
  g.userData.faz=Math.random()*6; return g; }
function hbDondurma(renkH){ const g=new THREE.Group(); const kul=new THREE.Mesh(new THREE.ConeGeometry(.032,.12,10),mat("#d9a05a",{roughness:.75})); kul.rotation.x=Math.PI; kul.position.y=.06; g.add(kul);
  const t=new THREE.Mesh(new THREE.SphereGeometry(.036,12,10),mat(renkH,{roughness:.5})); t.position.y=.135; g.add(t); g.userData.dik=true; g.userData.tutY=.03; return g; }
function hbBuket(renkH){ const g=new THREE.Group();
  const kag=new THREE.Mesh(new THREE.ConeGeometry(.11,.34,12,1,true),mat("#e8dcc4",{roughness:.85,side:THREE.DoubleSide})); kag.rotation.x=Math.PI; kag.position.y=.17; g.add(kag);
  for(let i=0;i<9;i++){ const a=i/9*Math.PI*2, r=i?.06:0; const c=new THREE.Mesh(new THREE.IcosahedronGeometry(.042,1),mat(renkH,{roughness:.55})); c.position.set(Math.cos(a)*r,.36+(i?-.02:.01),Math.sin(a)*r); g.add(c); }
  for(let i=0;i<5;i++){ const a=i/5*Math.PI*2+.3; const y=new THREE.Mesh(new THREE.ConeGeometry(.02,.1,4),mat("#3f7a3a",{roughness:.8})); y.position.set(Math.cos(a)*.09,.32,Math.sin(a)*.09); y.rotation.z=Math.cos(a)*.6; y.rotation.x=-Math.sin(a)*.6; g.add(y); }
  g.userData.dik=true; g.userData.tutY=.1; return g; }
// sinema salonu: kasabanın uzağında kapalı bir oda (güneş girmez), koltuk sıraları ve ışığı titreşen perde
function hbSinemaSalonu(B){ const g=new THREE.Group(); g.position.set(300,0,0);
  const duvar=mat("#2a1a22",{roughness:.95,side:THREE.BackSide}); const oda=new THREE.Mesh(new THREE.BoxGeometry(14,6,16),duvar); oda.position.y=3; oda.castShadow=true; g.add(oda);
  const zem=new THREE.Mesh(new THREE.PlaneGeometry(14,16),mat("#3a1a24",{roughness:.95})); zem.rotation.x=-Math.PI/2; zem.position.y=.01; g.add(zem);
  const pc=document.createElement("canvas"); pc.width=256; pc.height=128; const px=pc.getContext("2d"); const pt=new THREE.CanvasTexture(pc); pt.encoding=THREE.sRGBEncoding;
  const perde=new THREE.Mesh(new THREE.PlaneGeometry(9,4.2),new THREE.MeshBasicMaterial({map:pt})); perde.position.set(0,3.2,-7.9); g.add(perde);
  B.perde={c:pc,x:px,t:pt};
  const kol=mat("#8a1f2a",{roughness:.7}); B.koltuklar=[];
  for(let s=0;s<4;s++) for(let i=0;i<7;i++){ const k=new THREE.Group(); const o=new THREE.Mesh(new THREE.BoxGeometry(.56,.12,.5),kol); o.position.y=.42; k.add(o); const sr=new THREE.Mesh(new THREE.BoxGeometry(.56,.7,.1),kol); sr.position.set(0,.8,.25); k.add(sr);
    k.position.set(-2.4+i*.8,0,-1+s*1.4); g.add(k); if(s===1) B.koltuklar.push(k); }
  return g; }

function hbStil(){ if(document.getElementById("hb-stil")) return; const st=document.createElement("style"); st.id="hb-stil"; st.textContent=`
      .hb-hud{position:absolute;top:calc(env(safe-area-inset-top,0px) + 58px);left:50%;transform:translateX(-50%);width:min(250px,62vw);padding:8px 12px 9px;border-radius:16px;background:rgba(18,14,31,.62);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);color:#fff3e0;font:600 12px var(--f-ui,system-ui);pointer-events:none;transition:opacity .3s}
      .hb-hud.gizli{opacity:0}
      .hb-ust{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px}.hb-ust b{font:700 17px var(--f-ui,system-ui);letter-spacing:.02em}.hb-ust span{opacity:.75;font-weight:500}
      .hb-bar{display:grid;grid-template-columns:18px 1fr;align-items:center;gap:6px;margin-top:3px}.hb-bar span{height:6px;border-radius:4px;background:rgba(255,255,255,.14);overflow:hidden}.hb-bar em{display:block;height:100%;border-radius:4px;background:#8fe3a2;transition:width .5s,background .5s}
      .hb-istek{margin-top:7px;padding:6px 8px;border-radius:10px;background:rgba(255,159,180,.18);font-weight:500;line-height:1.3}
      .hb-kalp{position:absolute;right:max(34px,env(safe-area-inset-right,0px));bottom:calc(env(safe-area-inset-bottom,0px) + 150px);width:62px;height:62px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:radial-gradient(circle at 40% 35%,#ffb3c6,#e8577a);font-size:26px;pointer-events:auto;box-shadow:0 6px 18px rgba(0,0,0,.35);touch-action:manipulation}
      .hb-kalp.gizli{opacity:0;pointer-events:none}
      .hb-balon{position:absolute;transform:translate(-50%,-100%);max-width:190px;padding:7px 11px;border-radius:14px;background:#fffaf2;color:#2a1f2a;font:600 13px var(--f-ui,system-ui);line-height:1.3;text-align:center;pointer-events:none;box-shadow:0 4px 14px rgba(0,0,0,.28);opacity:0;transition:opacity .25s}
      .hb-balon.gor{opacity:1}.hb-balon::after{content:"";position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);border:6px solid transparent;border-top-color:#fffaf2;border-bottom:0}
      .hb-yuzen{position:absolute;left:50%;top:38%;transform:translate(-50%,0);font:700 17px var(--f-ui,system-ui);color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.6);pointer-events:none;animation:hbYuz 1.8s ease-out forwards;white-space:nowrap}
      @keyframes hbYuz{0%{opacity:0;transform:translate(-50%,10px)}15%{opacity:1}100%{opacity:0;transform:translate(-50%,-44px)}}
      .hb-ozet{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(8,6,16,.55);pointer-events:auto;padding:20px}
      .hb-ozet .kart{width:min(340px,100%);padding:22px 20px;border-radius:22px;background:rgba(24,18,38,.94);border:1px solid rgba(255,255,255,.12);color:#fff3e0;text-align:center}
      .hb-ozet h2{font:500 32px var(--f-serif,Georgia);margin:4px 0 8px}.hb-ozet ul{list-style:none;padding:0;margin:10px 0 16px;text-align:left;font-size:14px;line-height:1.7}
      .hb-ozet .yuzde{font:700 40px var(--f-ui,system-ui);color:#ff9fb4}
      .hb-perde{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .45s;pointer-events:none}.hb-perde.ac{opacity:1}
      .hb-giris{background:rgba(8,6,16,.62);pointer-events:auto;padding:20px}
      .hb-giris .kart{width:min(340px,100%);padding:24px 20px;border-radius:22px;background:rgba(24,18,38,.95);border:1px solid rgba(255,255,255,.12);color:#fff3e0;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center}
      .hb-giris h2{font:500 34px var(--f-serif,Georgia);margin:2px 0}.hb-giris p{margin:0 0 6px;font-size:14px;line-height:1.45;color:rgba(255,243,224,.82)}.hb-giris .btn{width:100%}
      .hb-iki{display:flex;gap:10px;width:100%}.hb-iki .btn{flex:1 1 0;min-width:0;width:auto;padding:14px 10px}
      .hb-giris .hb-kod{font:700 56px var(--f-ui,system-ui);letter-spacing:.18em;color:#ffd3df}
      .hb-girdi{width:190px;font:700 36px var(--f-ui,system-ui);letter-spacing:.3em;text-align:center;padding:10px;border-radius:14px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;outline:none}
      .hb-durum{min-height:20px;font-size:14px}
      .hb-mesaj{position:absolute;right:max(38px,env(safe-area-inset-right,0px));bottom:calc(env(safe-area-inset-bottom,0px) + 222px);width:54px;height:54px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(18,14,31,.72);font-size:24px;pointer-events:auto;touch-action:manipulation}
      .hb-mesaj.gizli{opacity:0;pointer-events:none}
      .hb-mesaj-panel{position:absolute;right:max(16px,env(safe-area-inset-right,0px));bottom:calc(env(safe-area-inset-bottom,0px) + 284px);display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px;max-width:min(330px,calc(100% - 32px));max-height:calc(100% - 400px - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px));overflow-y:auto;-webkit-overflow-scrolling:touch;pointer-events:auto}
      .hb-mesaj-panel button{padding:9px 14px;border-radius:16px;border:1px solid rgba(255,255,255,.2);background:rgba(255,250,242,.96);color:#2a1f2a;font:600 14px var(--f-ui,system-ui)}
      .hb-bag{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;background:#888;vertical-align:middle}.hb-bag.iyi{background:#6fe39a}.hb-bag.zayif{background:#ffc04d}.hb-bag.yok{background:#ff6b6b}`; document.head.appendChild(st); }
const BH={
  id:"hayat", ad:"Bir Gün Birlikte", tarih:"Hayat simülatörü", alt:"Serbest gezinti",
  cepheler:null,
  async kur(){
    const hy=kayit.hayat||(kayit.hayat={gun:1,enIyi:0,foto:0}); this.gun=hy.gun||1; if(this.ag) this.gun=this.ag.gun||this.gun;
    // iki kişilik mod: her telefon kendi karakterini yönetir; saat, göstergeler ve istekler oda kuranda (ev sahibi)
    this.eid=0; this.adimNo=0; this.esAdimlar={}; this.secimler={}; this.uzak=null; this.esHazir=false; this._hzT=0; this.rastgele=Math.random; this.elele=this.ag?null:"kaan";
    this._agT=0; this._wT=0; this._sonD=null; this._sonDT=0; this._yeniGun=false; this.esGitti=false; this.ben=this.ag?this.ag.ben:"kaan";
    const gy=hbYon(36,112);
    sahneKur({sis:"#cddcea",sisYakin:60,sisUzak:300,ust:"#5f93db",ufuk:"#cfe3f5",alt:"#b9c3c9",gunesYon:gy,isikYon:gy,gunesRenk:"#fff0d6",isik:"#fff0d6",isikGuc:2.35,zemin:"#7a6a58",hemi:.78,dolgu:.75});
    this.t=0; ETK=[]; this.saat=HB_SAAT0; this.ih={tok:72,enerji:88,eglence:55,mutlu:72}; this.yapilan={}; this.istekSay=0; this.fotoSay=0; this.cicekAlindi=false;
    this.istek=null; this.istekT=HB_SAAT0+18; this.sohbetT=24; this.balonlar=[]; this.aktif=null; this.serbest=false; this.bitiyor=false; this.dondurmaBitis=0; this.sonSaril=-999; this.sonIltifat=-999; this.ortamDilim=Math.floor(HB_SAAT0/90); this.ozette=false;
    this.hemi=scene.children.find(o=>o.isHemisphereLight)||null;
    this.tabelaM=[]; this.lambaM=new THREE.MeshStandardMaterial({color:renk("#fff3dc"),emissive:renk("#ffd59a"),emissiveIntensity:.2,roughness:.4});
    this.vitrinM=new THREE.MeshStandardMaterial({color:renk("#2b3138"),emissive:renk("#ffcf8a"),emissiveIntensity:.05,roughness:.12,metalness:.35});
    this.cepheler=[hbCephe("#efe3cf"),hbCephe("#d9a98a"),hbCephe("#c9ccd0"),hbCephe("#e8d2a8")];
    const S=scene;
    // ---- zemin: kıyı yolu (taş), cadde (asfalt), kaldırım, park çimi ----
    const tasD=hbTasDoku("#a89c8a","#6e665c"); tasD.repeat.set(124/2.6,13/2.6); const tasM=new THREE.MeshStandardMaterial({map:tasD,roughness:.9,bumpMap:gurultuDoku(40),bumpScale:.015});
    const zm=(w,d,x,z,M,y=.012)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),M); m.rotation.x=-Math.PI/2; m.position.set(x,y,z); m.receiveShadow=true; S.add(m); return m; };
    zm(240,60,0,22,mat("#8a8378",{roughness:.95}),0); // kasaba zemini (binaların arkası)
    zm(124,13,0,-1.5,tasM);                                     // kıyı yolu z: -8 .. 5
    const asf=mat("#3b3d42",{roughness:.88,bumpMap:gurultuDoku(60),bumpScale:.01}); zm(240,7,0,8.5,asf,.008); // cadde z: 5 .. 12
    const serit=mat("#e9e6de",{roughness:.7}); for(let x=-110;x<110;x+=6) zm(2.6,.14,x,8.5,serit,.016);
    for(const cx of [-30,0,26]) for(let i=0;i<7;i++) zm(.5,6.6,cx-1.5+i*.5,8.5,serit,.017); // yaya geçitleri
    const kalD=hbTasDoku("#9a958c","#5f5b55"); kalD.repeat.set(240/2.2,4.6/2.2); zm(240,4.6,0,14.3,new THREE.MeshStandardMaterial({map:kalD,roughness:.92}),.02); // kaldırım
    const kenar=mat("#8f8a82",{roughness:.85}); for(const z of [5.05,11.95]){ const k=new THREE.Mesh(new THREE.BoxGeometry(240,.12,.18),kenar); k.position.set(0,.06,z); k.receiveShadow=true; S.add(k); }
    const cim=cimZemin(30,13,"#5f7f3a","#7a944a",12); cim.position.set(49,.02,-1.5); S.add(cim); // park
    // ---- göl ----
    const kiyiTas=new THREE.Mesh(new THREE.BoxGeometry(124,.9,.7),mat("#b0a48e",{roughness:.9})); kiyiTas.position.set(0,-.3,-8.3); kiyiTas.receiveShadow=true; S.add(kiyiTas);
    if(THREE.Water){ const sn=new THREE.TextureLoader().load(SU_NORMAL); sn.wrapS=sn.wrapT=THREE.RepeatWrapping;
      this.su=new THREE.Water(new THREE.PlaneGeometry(420,220),{textureWidth:256,textureHeight:256,waterNormals:sn,sunDirection:gy.clone(),sunColor:0xfff0d6,waterColor:0x2a5468,distortionScale:1.6,fog:true});
      this.su.rotation.x=-Math.PI/2; this.su.position.set(0,-.35,-118.6); S.add(this.su); }
    else { const su=new THREE.Mesh(new THREE.PlaneGeometry(420,220),mat("#3a6a80",{roughness:.12,metalness:.6})); su.rotation.x=-Math.PI/2; su.position.set(0,-.35,-118.6); S.add(su); }
    // karşı kıyı: alçak tepeler ve uzakta birkaç yüksek bina (fotoğraftaki gibi)
    const tepeM=mat("#7d7a5c",{roughness:1}); for(let i=0;i<9;i++){ const t=new THREE.Mesh(new THREE.SphereGeometry(1,16,8,0,Math.PI*2,0,Math.PI/2),tepeM); t.scale.set(rnd(30,55),rnd(6,13),rnd(14,22)); t.position.set(-200+i*50+rnd(-10,10),-.4,-228+rnd(-8,8)); S.add(t); }
    const kuleM=mat("#d6d2c8",{roughness:.8}); for(let i=0;i<6;i++){ const k=new THREE.Mesh(new THREE.BoxGeometry(5,rnd(26,40),5),kuleM); k.position.set(55+i*8,k.geometry.parameters.height/2-.4,-222); S.add(k); }
    for(let i=0;i<24;i++){ const k=new THREE.Mesh(new THREE.BoxGeometry(rnd(4,8),rnd(3,7),rnd(4,8)),mat(["#e6dccb","#d9cbb4","#c9b9a2","#efe7da"][i%4],{roughness:.9})); k.position.set(-150+i*10+rnd(-3,3),1,-212+rnd(-4,4)); S.add(k); }
    // ---- korkuluklar ve iskele ----
    const ahM=mat("#b8915e",{roughness:.82}); const kork=new THREE.Group(); S.add(kork);
    hbKorkuluk(kork,new THREE.Vector3(-61,0,-7.9),new THREE.Vector3(8.1,0,-7.9),ahM); hbKorkuluk(kork,new THREE.Vector3(11.9,0,-7.9),new THREE.Vector3(61,0,-7.9),ahM);
    const iskM=mat("#a07a4e",{roughness:.85,bumpMap:gurultuDoku(10),bumpScale:.012});
    const isk=new THREE.Mesh(new THREE.BoxGeometry(3.8,.2,12.4),iskM); isk.position.set(10,-.09,-14.1); isk.receiveShadow=true; isk.castShadow=true; S.add(isk);
    for(const x of [8.3,11.7]) for(let z=-9;z>=-20;z-=2.2){ const k=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,1.6,8),iskM); k.position.set(x,-.9,z); S.add(k); }
    hbKorkuluk(kork,new THREE.Vector3(8.1,0,-8),new THREE.Vector3(8.1,0,-20.2),ahM); hbKorkuluk(kork,new THREE.Vector3(11.9,0,-8),new THREE.Vector3(11.9,0,-20.2),ahM); hbKorkuluk(kork,new THREE.Vector3(8.1,0,-20.2),new THREE.Vector3(11.9,0,-20.2),ahM);
    this.iskeleUc=new THREE.Object3D(); this.iskeleUc.position.set(10,0,-18.6); S.add(this.iskeleUc);
    // ---- binalar (caddenin güneyi, göle bakar) ----
    const binalar=[[-58,12,16,0],[-44,14,13,1,"Fırın","#6a4a2a"],[-30,12,10,0,"Göl Kafe","#2f5a4a"],[-17,13,19,2],[-3,11,13,3,"Kitapçı","#3a4a6a"],[10,13,16,1],[24,15,12,2,"SİNEMA","#7a1f2a"],[40,12,18,0],[54,14,14,3]];
    this.binaList=[]; for(const [x,w,h,v,t,tz] of binalar){ const b=hbBina(this,w-.3,h,10,v,t,tz); b.position.set(x,0,16.6); S.add(b); this.binaList.push(b); }
    // sinema: ışıklı afiş çerçevesi
    const afis=new THREE.Mesh(new THREE.PlaneGeometry(1.6,2.2),new THREE.MeshStandardMaterial({map:yaziDoku("Bu akşam",{w:256,h:352,zemin:"#1a1f3a",renk:"#ffd36a",font:"italic 44px Georgia"}),emissive:renk("#ffffff"),emissiveIntensity:0,roughness:.5}));
    afis.position.set(29,1.9,16.55); afis.rotation.y=Math.PI; afis.userData.gece=1; S.add(afis); this.tabelaM.push(afis.material);
    this.sinemaKapi=new THREE.Object3D(); this.sinemaKapi.position.set(24,0,15.2); S.add(this.sinemaKapi);
    // ---- kafe terası ----
    this.kafeMasalar=[]; for(let i=0;i<3;i++){ const m=masa(.42,"#f4efe6"); m.position.set(-34.2+i*4.2,0,13.4); S.add(m); this.kafeMasalar.push(m);
      for(const s of [-1,1]){ const c=sandalye("#2f4a3a"); c.position.set(-34.2+i*4.2+s*.72,0,13.4); c.rotation.y=-s*Math.PI/2; S.add(c); }
      const sm=hbSemsiye(i%2?"#e9e2d4":"#2f5a4a"); sm.position.set(-34.2+i*4.2,0,14.05); S.add(sm); }
    this.kafeMasa=this.kafeMasalar[1]; this.fincanlar=[0,1].map(()=>{ const f=new THREE.Mesh(new THREE.CylinderGeometry(.04,.032,.08,12),mat("#fbf7f0",{roughness:.4})); f.visible=false; S.add(f); return f; });
    // ---- dondurmacı (kıyı yolunda), çiçekçi (kaldırımda) ----
    this.kiosk=hbKiosk(); this.kiosk.position.set(-15,0,2.6); S.add(this.kiosk);
    this.tezgah=hbCicekTezgah(); this.tezgah.position.set(-6,0,14.2); this.tezgah.rotation.y=Math.PI; S.add(this.tezgah);
    // ---- banklar, lambalar, ağaçlar ----
    this.banklar=[]; for(const x of [-40,-26,-6,22,34]){ const b=bank2(); b.position.set(x,0,-6.6); b.rotation.y=Math.PI; S.add(b); this.banklar.push(b); }
    for(let x=-56;x<=58;x+=9.5){ if(Math.abs(x-10)<2.5) continue; const l=lamba2(); l.position.set(x,0,-7.1); l.traverse(o=>{ if(o.isMesh&&o.geometry.type==="SphereGeometry"){ o.material=this.lambaM; o.userData.gece=1; } }); S.add(l);
      const p=parilti("#ffd59a",1.1); p.position.set(x,3.9,-7.1); p.material.opacity=0; S.add(p); (this.lambaParilti||(this.lambaParilti=[])).push(p); }
    for(let x=-58;x<=58;x+=7.2){ if(Math.abs(x+15)<3||Math.abs(x+6)<2) continue; const a=agac(Math.random()<.7?"sonbahar":"yesil",rnd(.9,1.15)); a.position.set(x+rnd(-.8,.8),0,4.1); S.add(a); }
    [[38.5,-5.2],[40.5,2.8],[44,3.6],[56,-5.6],[58.5,2.0],[60.5,-3.0],[53.5,3.5]].forEach(([x,z],i)=>{ const a=agac(i%3?"sonbahar":"cam",rnd(.95,1.2)); a.position.set(x,0,z); S.add(a); });
    S.add(otlar(()=>({x:rnd(35,62),z:rnd(-7,4)}),700,"#7d9450",.26,p=>Math.hypot(p.x-47,p.z+1.5)<3.4||(p.x>46&&p.x<54&&p.z<-2)));
    // ---- park: salıncak ----
    this.salincak=hbSalincak(); this.salincak.position.set(47,0,-1.5); S.add(this.salincak);
    // ---- akşam ışıkları: kafe, büfe, sinema kapısı, iskele (sayı sabit: gölgelendiriciler yeniden derlenmez) ----
    this.isiklar=[[-30,2.6,12.6],[-15,2.8,1.2],[24,3.2,14.6],[10,2.4,-18]].map(([x,y,z])=>{ const l=new THREE.PointLight(renk("#ffc98a"),0,11,1.6); l.position.set(x,y,z); S.add(l); return l; });
    // ---- ördekler ----
    this.ordekler=[]; for(let i=0;i<6;i++){ const o=hbOrdek(); o.position.set(rnd(-9,3),-.3,rnd(-13,-19)); o.rotation.y=rnd(0,6); S.add(o); this.ordekler.push(o); }
    this.ordekNokta=new THREE.Object3D(); this.ordekNokta.position.set(-3,0,-7.3); S.add(this.ordekNokta);
    // ---- sinema salonu ----
    this.salon=hbSinemaSalonu(this); S.add(this.salon);
    // ---- arabalar ----
    this.arabalar=[["#c9ccd2",1],["#7a2236",-1],["#2a3a5a",1],["#f2f2ee",-1]].map(([r,yon],i)=>{ const a=karsiAraba(r); a.userData.yon=yon; a.userData.v=rnd(6,8.5); a.userData.vh=a.userData.v; a.position.set(-70+i*42,0,yon>0?7.0:10.1); a.rotation.y=yon>0?Math.PI/2:-Math.PI/2; S.add(a); return a; });
    // ---- kalabalık: kıyıda ve kaldırımda yürüyenler, korkulukta göle bakanlar, büfe ve çiçekçi ----
    this.yuruyenler=[]; const ust=["#3a3f4b","#5a4636","#2f4a5a","#6b6a64","#7a5a3a","#8a2f2f","#2c2c34","#4a3a4a","#3d4a3a"];
    for(let i=0;i<10;i++){ const kiz=i%3===1; const c=kalabalik(kiz?"michelle":"rpm",{ust:ust[i%ust.length],alt:ust[(i+3)%ust.length],anim:"walk",boy:rnd(.95,1.04),sac:["#2a1d14","#151515","#4a3524"][i%3],ton:kiz?["#f0e4da","#e9dccf"][i%2]:null}); if(!c) continue;
      const kaldirim=i>=7; const z=kaldirim?15.6+rnd(-.15,.15):[-5.0,-3.2,-1.0,.6][i%4]; c.position.set(rnd(-52,52),0,z); c.userData.engelKisi=true; c.userData.yol={hz:rnd(.8,1.1)*(i%2?1:-1)}; c.userData.hiz=1.2; S.add(c); this.yuruyenler.push(c); }
    this.duranlar=[]; for(const [x,z,ry,kiz] of [[-21,-7.0,Math.PI,0],[-20.4,-7.0,Math.PI,1],[30,-7.0,Math.PI,0],[-15.6,.6,0,1]]){ const c=kalabalik(kiz?"michelle":"rpm",{ust:kiz?"#7a2236":"#2f4a5a",alt:"#2a2a33",anim:"idle",sac:"#2a1d14",ton:kiz?"#efe2d6":null}); if(!c) continue; c.position.set(x,0,z); c.rotation.y=ry; c.userData.engelKisi=true; S.add(c); this.duranlar.push(c); }
    this.saticilar=[]; for(const [x,z,ry] of [[-13.25,1.45,Math.PI],[-6,14.95,Math.PI]]){ const c=kalabalik("rpm",{ust:"#e9e4d8",alt:"#3a3a3a",anim:"idle",sac:"#4a4a4a"}); if(!c) continue; c.position.set(x,0,z); c.rotation.y=ry; S.add(c); this.saticilar.push(c); }
    // ---- karakterler: ikisi de siyah ceketli (fotoğraftaki gibi) ----
    this.kaan=karakter("kaan","deri"); this.kar=karakter("kardelen","deri");
    this.kaan.position.set(-.5,0,-3); this.kar.position.set(-.5+.52,0,-3); this.kaan.rotation.y=this.kar.rotation.y=Math.PI; S.add(this.kaan); S.add(this.kar);
    KONUSANLAR={kaan:this.kaan,kardelen:this.kar};
    this.oyuncu=this.ben==="kardelen"?this.kar:this.kaan; this.esKar=this.oyuncu===this.kaan?this.kar:this.kaan;
    if(this.ag) Ag.dinle=o=>this.agMesaj(o);
    Kamera.sinema=null; Kamera.aci=0; Kamera.mesafe=6.4; Kamera.yukseklik=2.6; Kamera.hedef.copy(this.oyuncu.position); Kamera.poz.set(this.oyuncu.position.x,3.2,3.5);
    this.gokGuncelle(true); Ses.ton="sicak"; Ses.ortam("kus",.45); this.sesGece=false;
  },
  async basla(){
    katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); this.hudKur();
    const K=this.kaan, D=this.kar;
    this.etkilesimleriKur();
    if(this.ag){ const es=this.ben==="kaan"?"Kardelen":"Kaan"; const y=el(`<div class="tost gor" style="bottom:auto;top:44%">${es} bekleniyor…</div>`); document.body.appendChild(y);
      const t0=performance.now(); while(!this.esHazir&&performance.now()-t0<45000){ Ag.gonder({t:"hz"}); await bekle(700); } y.remove(); Ag.gonder({t:"hz"});
      if(!this.esHazir) tost(`${es} henüz gelmedi, gelince yanında belirecek`,3600); }
    this.eid=1; this.adimNo=0; this.rastgele=hbRng((this.ag&&this.ag.tohum)||1);
    if(!(this.ag&&this.ag.atla)) await sahne(async()=>{
      // açılış: gölün üstünden ikisine doğru süzülen çekim (ağaçların içinden geçmez)
      const ort=K.position.clone().lerp(D.position,.5).add(new THREE.Vector3(0,1.3,0));
      kameraNoktasi(new THREE.Vector3(4,6.5,-22),ort);
      const ilk=this.gun===1; baslikKarti("Bir Gün Birlikte",[ilk?"Hayat simülatörü":this.gun+". gün","Göl kenarında bir gün"]);
      await kameraNoktasi(s=>new THREE.Vector3(4-s*.7,6.5-s*.85,-22+s*2.6),ort,4.2);
      yuzYuze(K,D);
      if(ilk){ await this.soz("kardelen",["Bugün nereye gidiyoruz","Plan senin kocam 😄"],{gul:1});
        await this.soz("kaan","Haberin olsun, bugün bütün gün seninim.",{gul:.6});
        await this.soz("kardelen",["O zaman önce dondurma","Sonra bakarız kdkdkd"],{gul:1}); }
      else { const L=[[["Günaydın minikom ☀️","Bugün ne yapıyoruz"],"Göl kenarında yürüyelim, gerisi gelir."],[["Yine buluştuk kdkdkd","Özledin mi"],"Daha dün ayrıldık ama evet, özledim."],[["Hava çok güzel","Bugün bol fotoğraf istiyorum 📸"],"Fotoğrafçın hazır, haberin olsun."]][(this.gun-2)%3];
        await this.soz("kardelen",L[0],{gul:1}); await this.soz("kaan",L[1],{gul:.6}); }
      K.rotation.y=D.rotation.y=Math.PI; this.yaninaAl();
    });
    this.serbest=true; gorev("Gününüzü planlayın: ışıltılı yerlere yürü");
    if(this.ag){ this.yanYana(); this.elEtk=etkilesim(this.esKar,"🤝 Elini tut",()=>this.eleleDegistir(),{isaret:false,mesafe:1.6}); this.sohbetKur();
      setTimeout(()=>tost(`Sen ${this.ben==="kaan"?"Kaan'sın":"Kardelen'sin"} 💞 Yanına gidip 🤝 elini tutabilir, 💬 ile mesaj atabilirsin`,5600),900); }
    else if(!kayit.hayatIpucu){ kayit.hayatIpucu=1; kaydet(); setTimeout(()=>tost("Işıltılı yerlere yürü, düğmeye dokun. 💗 ile Kardelen'e sarıl, selfie çek",5200),1200); }
  },
  /* ---------- etkileşim noktaları ---------- */
  etkilesimleriKur(){
    const nokta=(x,z)=>{ const o=new THREE.Object3D(); o.position.set(x,0,z); scene.add(o); return o; };
    const E=(o,yazi,ad,m=2,arg)=>etkilesim(o,yazi,()=>this.baslat(ad,arg),{mesafe:m,isaretY:1.9,isaretBoy:.65});
    E(nokta(-30.0,12.2),"☕ Kafeye otur","kafe",2.6);
    E(nokta(-15,.9),"🍦 Dondurma al","dondurma",2.3);
    E(nokta(-6,12.9),"🌷 Çiçek al","cicek",2.3);
    E(this.sinemaKapi,"🎬 Sinemaya gir","sinema",2.6);
    this.banklar.forEach((b,i)=>E(b,"🪑 Banka otur","bank",1.9,i));
    E(this.ordekNokta,"🦆 Ördekleri besle","ordek",2.2);
    E(this.iskeleUc,"📸 Fotoğraf çek","foto",2.0);
    E(this.salincak,"🎠 Salıncak","salincak",2.6);
  },
  eylemler(){ return { kafe:()=>this.kafe(), dondurma:()=>this.dondurma(), cicek:()=>this.cicek(), sinema:()=>this.sinema(), bank:i=>this.bank(this.banklar[i||0]), ordek:()=>this.ordek(),
    foto:()=>this.foto(), salincak:()=>this.salincakSalla(), kalp:(i,kim)=>this.kalpMenu(kim) }; },
  // oyuncu bir etkinliği başlatır: iki kişilik modda eşi de yakındaysa iki telefonda aynı anda (aynı tohum, aynı sözler)
  baslat(ad,arg){ if(this.bitiyor||!this.serbest) return;
    if(this.ag&&Ag.esCanli&&this.oyuncu.position.distanceTo(this.esKar.position)>(ad==="kalp"?3.2:10)){ this.balon(this.oyuncu,ad==="kalp"?"Önce yanına gideyim 😄":(this.ben==="kaan"?"Kardelen'i bekleyeyim 😄":"Kaan'ı bekleyeyim 😄"),2400); return; }
    const tohum=1+Math.floor(Math.random()*1e9); if(this.ag) Ag.gonder({t:"e",a:ad,r:arg===undefined?null:arg,s:tohum,k:this.ben});
    this.yap(ad,arg,tohum,this.ben); },
  async yap(ad,arg,tohum,kim){ if(this.bitiyor||!this.serbest) return; const fn=this.eylemler()[ad]; if(!fn) return;
    this.serbest=false; this.eid=tohum; this.adimNo=0; this.rastgele=hbRng(tohum); this.tetik=kim||this.ben;
    if(this._mesajPanel){ this._mesajPanel.remove(); this._mesajPanel=null; }
    if(this.ag&&this.elele) this.eleleBirak(false);
    const K=this.kaan, D=this.kar; K.userData.elele=D.userData.elele=0; K.userData.hiz=D.userData.hiz=0;
    try{ await fn(arg,kim); } catch(e){ console.error(e); }
    finally{ for(const c of [K,D]){ const u=c.userData; u.otur=0; u.oturY=0; u.saril=0; u.bakNokta=null; u.kafa.rotation.z=0; u.govde.rotation.set(0,0,0); u.uyku=0; u.kolPoz=null; u.omuz=0; }
      if(!this.ag) this.yaninaAl(); else this.yanYana(); Kamera.hedef.copy(this.oyuncu.position); this.serbest=true; this.ortamYenile(); } },
  // iki kişilik modda etkinlik bitince el ele değil, yan yana dururlar (ikisi de serbestçe yürüyebilsin)
  yanYana(){ const K=this.kaan, D=this.kar; const sol=new THREE.Vector3(Math.cos(K.rotation.y),0,-Math.sin(K.rotation.y)); D.position.copy(K.position).addScaledVector(sol,.75); D.position.y=K.position.y; D.rotation.y=K.rotation.y; this.uzak=null; },
  /* ---------- iki kişilik mod: eşzamanlı konuşma, seçim, el ele, mesaj ---------- */
  async soz(kim,metin,ops={}){ if(!this.ag) return konus(kim,metin,ops);
    const n=++this.adimNo, L=(Array.isArray(metin)?metin.join(" "):metin).length;
    await konus(kim,metin,Object.assign({},ops,{sure:ops.sure||Math.min(5200,1500+L*52)})); await this.esitle(n); },
  async esitle(n){ if(!this.ag||!Ag.esCanli) return; const e=this.eid; Ag.gonder({t:"a",e,n}); const t0=performance.now(); let son=t0;
    while((this.esAdimlar[e]||0)<n&&performance.now()-t0<9000&&Ag.esCanli){ await bekle(60); if(performance.now()-son>1500){ son=performance.now(); Ag.gonder({t:"a",e,n}); } } },
  async secim(L,sahip){ if(!this.ag) return sec(L); const n=++this.adimNo, e=this.eid, k=e+":"+n; let v;
    if(sahip===this.ben||!Ag.esCanli){ v=await sec(L,sahip); for(let i=0;i<2;i++) setTimeout(()=>Ag.gonder({t:"c",e,n,v}),i*300); }
    else { const y=el(`<div class="tost gor" style="bottom:auto;top:42%">${sahip==="kaan"?"Kaan":"Kardelen"} seçiyor…</div>`); document.body.appendChild(y);
      const t0=performance.now(); while(this.secimler[k]===undefined&&performance.now()-t0<40000&&Ag.esCanli) await bekle(80); y.remove(); v=this.secimler[k]!==undefined?this.secimler[k]:0; }
    return v; },
  eleleDegistir(){ if(this.elele) this.eleleBirak(true); else if(this.esGitti||!Ag.esCanli) this.balon(this.oyuncu,`${this.ben==="kaan"?"Kardelen":"Kaan"} henüz burada değil 🥺`,2400); else { this.elele=this.ben; Ag.gonder({t:"el",l:this.ben}); Ses.efekt("kalp"); } },
  eleleBirak(gonder){ this.elele=null; this.uzak=null; this.kaan.userData.elele=this.kar.userData.elele=0; if(gonder) Ag.gonder({t:"el",l:null}); },
  sohbetKur(){ const b=el(`<button class="hb-mesaj" aria-label="Mesaj">💬</button>`); katman.appendChild(b); this.mesajBtn=b;
    const L=this.ben==="kaan"?["Gel buraya minnakım 😄","Bekle beni","Seni seviyorum 💗","Hadi kafeye ☕","Fotoğraf çekelim mi 📸","Elini ver 🤝","Haberin olsun 😌"]:["Paytak paytak gel 😄","Bekle şapşik","Seni seviyorum 💗","Dondurma istiyorum 🍦","Fotoğraf çekelim 📸","Kdkdkd 😂","Ankaralı mısın çen"];
    b.onclick=e=>{ e.stopPropagation(); if(this._mesajPanel){ this._mesajPanel.remove(); this._mesajPanel=null; return; } if(!this.serbest) return;
      const p=el(`<div class="hb-mesaj-panel">${L.map((m,i)=>`<button data-i="${i}">${m}</button>`).join("")}</div>`); katman.appendChild(p); this._mesajPanel=p;
      p.querySelectorAll("button").forEach(x=>x.onclick=ev=>{ ev.stopPropagation(); const m=L[+x.dataset.i]; this.balon(this.oyuncu,m,3600); Ag.gonder({t:"b",m}); p.remove(); this._mesajPanel=null; }); }; },
  agMesaj(o){ const es=this.esKar;
    if(o.t==="d"){ this.uzak={x:o.p[0],z:o.p[1],r:o.p[2],h:o.p[3],t:performance.now()}; if(this.esGitti){ this.esGitti=false; tost(`${this.ben==="kaan"?"Kardelen":"Kaan"} geri geldi 💞`); } }
    else if(o.t==="hz"){ this.esHazir=true; if(this.elele&&this.serbest) this.eleleBirak(false); // eş oyuna yeni girdi: onun tarafında el ele değiliz
      if(performance.now()-this._hzT>900){ this._hzT=performance.now(); Ag.gonder({t:"hz"}); } }
    else if(o.t==="w"&&!this.ag.host){ const f=o.s-this.saat; this.saat=Math.abs(f)>3?o.s:this.saat+f*.5; if(o.ih) [this.ih.tok,this.ih.enerji,this.ih.eglence,this.ih.mutlu]=o.ih;
      const ad=o.ist||null; if(ad!==(this.istek&&this.istek.ad||null)){ const I=HB_ISTEK.find(x=>x.ad===ad); this.istek=I?{...I,t0:this.saat}:null; if(this.serbest) gorev(I?I.ortak:"Gününüzü planlayın: ışıltılı yerlere yürü"); } }
    else if(o.t==="e"){ if(o.a==="son"){ if(!this.bitiyor) this.gunSonu(!!o.r,true); } else if(this.serbest&&!this.bitiyor) this.yap(o.a,o.r===null?undefined:o.r,o.s,o.k); }
    else if(o.t==="a"){ this.esAdimlar[o.e]=Math.max(this.esAdimlar[o.e]||0,o.n); }
    else if(o.t==="c"){ this.secimler[o.e+":"+o.n]=o.v; }
    else if(o.t==="k"){ if(o.e===this.eid){ const b=document.querySelector(".selfie .dek"); if(b){ this._dekUzak=true; b.click(); this._dekUzak=false; } } }
    else if(o.t==="el"){ this.elele=o.l||null; this.uzak=null; if(!this.elele) this.kaan.userData.elele=this.kar.userData.elele=0; else Ses.efekt("kalp"); }
    else if(o.t==="b"){ this.balon(es,o.m,4800); Ses.efekt("mesaj"); }
    else if(o.t==="yeni"){ if(this.ozette){ this._yeniGun=true; this.ag.gun=o.g; this.ag.tohum=o.s; bolumAc(BH); } }
    else if(o.t==="katil"&&(this.ag.host||this.esGitti||performance.now()-Ag.oncekiSon>6000)){ this.ag.host=true; Ag.gonder({t:"tamam",k:this.ben,g:this.gun,s:this.ag.tohum,ic:1}); }
    else if(o.t==="x"){ this.esGitti=true; this.uzak=null; es.userData.hiz=0; if(this.elele) this.eleleBirak(false); tost(`${this.ben==="kaan"?"Kardelen":"Kaan"} oyundan çıktı`,3200); } },
  // eşin telefonundan gelen konuma yumuşakça gider (ağdan saniyede ~8 güncelleme gelir)
  uzakUygula(c,dt){ const u=this.uzak; if(!u) return; const dx=u.x-c.position.x, dz=u.z-c.position.z;
    if(dx*dx+dz*dz>16){ c.position.x=u.x; c.position.z=u.z; } else { const k=1-Math.pow(.0035,dt); c.position.x+=dx*k; c.position.z+=dz*k; } c.position.y=0;
    let f=u.r-c.rotation.y; f=Math.atan2(Math.sin(f),Math.cos(f)); c.rotation.y+=f*Math.min(1,dt*9);
    c.userData.hiz=lerp(c.userData.hiz||0,Ag.esCanli?u.h:0,.25); },
  deklansorEsle(){ if(!this.ag) return; const e=this.eid; let n=0; const iv=setInterval(()=>{ const b=document.querySelector(".selfie .dek"); if(b&&!b._kk){ b._kk=1; b.addEventListener("click",()=>{ if(!this._dekUzak) Ag.gonder({t:"k",e}); }); } if(++n>400||this.eid!==e) clearInterval(iv); },100); },
  // Kardelen el ele yürüyüşteki yerine (Kaan'ın solunda) geçer: serbest yürüyüş başında onun çevresinden dolaşmasın
  yaninaAl(){ const K=this.kaan, D=this.kar; const sol=new THREE.Vector3(Math.cos(K.rotation.y),0,-Math.sin(K.rotation.y)); D.position.copy(K.position).addScaledVector(sol,.52); D.position.y=K.position.y; D.rotation.y=K.rotation.y; },
  /* ---------- zaman ve göstergeler ---------- */
  ihtiyac(dk){ const I=this.ih, yorgun=Math.min(1,(this.kaan.userData.hiz||0)/2);
    I.tok-=dk*.1; I.enerji-=dk*(.06+.03*yorgun); I.eglence-=dk*.105; I.mutlu-=dk*(.03+((I.tok<25||I.enerji<20||I.eglence<25)?.05:0));
    for(const k in I) I[k]=clamp(I[k],0,100); },
  ekle(d){ for(const k in d) this.ih[k]=clamp(this.ih[k]+d[k],0,100); this.hudGuncelle(true);
    const yaz=Object.entries(d).filter(([,v])=>v>0).map(([k,v])=>({tok:"🍔",enerji:"⚡",eglence:"🎈",mutlu:"💗"}[k]+" +"+Math.round(v))).join("  "); if(yaz) this.yuzen(yaz); },
  async zamanAtla(dk){ const s0=this.saat, s1=Math.min(HB_SAAT1-1,s0+dk); const t0=performance.now(), T=1100; this._zamanAkiyor=true; this.hudGuncelle(true);
    await new Promise(r=>{ const f=()=>{ const k=Math.min(1,(performance.now()-t0)/T); const yeni=s0+(s1-s0)*k; this.ihtiyac(yeni-this.saat); this.saat=yeni; this.hudGuncelle(true); if(k<1) requestAnimationFrame(f); else r(); }; f(); }); await bekle(500); this._zamanAkiyor=false; },
  saatYazi(dk){ const s=Math.floor(dk/60)%24, m=Math.floor(dk%60); return String(s).padStart(2,"0")+":"+String(m).padStart(2,"0"); },
  /* ---------- gökyüzü, güneş, lambalar ---------- */
  gokGuncelle(ilk){ const s=clamp(this.saat,HB_SAAT0,HB_SAAT1); let i=0; while(i<HB_ANAHTAR.length-2&&HB_ANAHTAR[i+1][0]<s) i++;
    const A=HB_ANAHTAR[i], B=HB_ANAHTAR[i+1], k=clamp((s-A[0])/(B[0]-A[0]),0,1), r=j=>renk(A[j]).lerp(renk(B[j]),k), n=j=>A[j]+(B[j]-A[j])*k;
    const el=n(4), az=n(5), gunes=hbYon(el,az);
    const g=scene.userData.gok; if(g){ const U=g.material.uniforms; U.ust.value.copy(r(1)); U.ufuk.value.copy(r(2)); U.alt.value.copy(r(3)); U.gunes.value.copy(gunes); U.gRenk.value.copy(r(6)); U.yildiz.value=n(10); U.parlak.value=clamp((el+4)/12,0,1); }
    // ışık: güneş batınca ay devralır (yükseklik 2° ile -6° arasında yumuşak geçiş)
    const gy=clamp((el+6)/8,0,1), isikYon=gunes.clone().setY(Math.max(gunes.y,.08)).normalize().multiplyScalar(gy).add(HB_AY.clone().multiplyScalar(1-gy)).normalize();
    scene.userData.gunesYon.copy(isikYon);
    const ic=this.filmAcik?1:0; // sinema salonu içi: dışarının ışığı girmez
    const gun=scene.userData.gun; if(gun){ gun.color.copy(r(6)); gun.intensity=n(7)*(1-ic); }
    if(this.hemi){ this.hemi.intensity=n(8)*(ic?.18:1); this.hemi.color.copy(r(1)).lerp(renk("#ffffff"),.35); }
    const dl=scene.userData.dolgu; if(dl){ dl.intensity=.75*clamp(n(8)/.78,.25,1)*(ic?.08:1); dl.color.copy(r(2)).lerp(renk("#ffe6d0"),.5); }
    if(scene.fog) scene.fog.color.copy(r(9));
    if(this.su&&this.su.material.uniforms){ const U=this.su.material.uniforms; if(U.sunDirection) U.sunDirection.value.copy(gy>.5?gunes:HB_AY); if(U.sunColor) U.sunColor.value.copy(r(6)).multiplyScalar(gy>.5?1:.5); }
    const L=n(11); this.lamba=L; this.lambaM.emissiveIntensity=.2+L*2.6; this.vitrinM.emissiveIntensity=.05+L*1.25;
    for(const c of this.cepheler) c.on.emissiveIntensity=L*1.15; for(const m of this.tabelaM) m.emissiveIntensity=L*.9;
    if(this.kiosk) this.kiosk.userData.tabela.material.emissiveIntensity=L*.9;
    for(const p of this.lambaParilti||[]) p.material.opacity=L*.85; for(const l of this.isiklar||[]) l.intensity=L*1.7;
    if(!ilk&&L>.5!==this.sesGece){ this.sesGece=L>.5; Ses.ortam(this.sesGece?"gece":"kus",this.sesGece?.7:.45); } },
  ortamYenile(){ if(typeof ortamYakala==="function"){ try{ ortamYakala(scene); }catch(e){} } this.ortamDilim=Math.floor(this.saat/90); },
  /* ---------- gösterge paneli ---------- */
  hudKur(){
    hbStil();
    const h=el(`<div class="hb-hud"><div class="hb-ust"><b class="hb-saat">10:00</b><span>${this.ag?'<i class="hb-bag"></i>':""}<span class="hb-gun"></span></span></div>
      ${[["tok","🍔"],["enerji","⚡"],["eglence","🎈"],["mutlu","💗"]].map(([k,i])=>`<div class="hb-bar"><i>${i}</i><span><em data-k="${k}"></em></span></div>`).join("")}
      </div>`);
    katman.appendChild(h); this.hud=h;
    const kb=el(`<button class="hb-kalp" aria-label="Kardelen">💗</button>`); kb.onclick=e=>{ e.stopPropagation(); if(this.serbest&&!kilit&&!this.bitiyor) this.baslat("kalp"); }; katman.appendChild(kb); this.kalpBtn=kb;
    this.hudGuncelle(true); },
  hudGuncelle(hemen){ const h=this.hud; if(!h||!h.isConnected) return; if(!hemen&&(this._hudT=(this._hudT||0)+1)%10) return;
    h.querySelector(".hb-saat").textContent=this.saatYazi(this.saat); h.querySelector(".hb-gun").textContent=this.gun+". gün";
    for(const e of h.querySelectorAll("em")){ const v=this.ih[e.dataset.k]; e.style.width=v.toFixed(0)+"%"; e.style.background=v>60?"#8fe3a2":v>30?"#ffd36a":"#ff7a7a"; }
    const bg=h.querySelector(".hb-bag"); if(bg) bg.className="hb-bag "+(Ag.esCanli?"iyi":Ag.bagli?"zayif":"yok");
    if(this.mesajBtn) this.mesajBtn.classList.toggle("gizli",!this.serbest||kilit||!!this.ozette);
    const sahnede=kilit&&!this.serbest; h.classList.toggle("gizli",!!(sahnede&&!this._zamanAkiyor)||!!this.ozette); if(this.kalpBtn) this.kalpBtn.classList.toggle("gizli",!this.serbest||kilit); },
  yuzen(t){ const d=el(`<div class="hb-yuzen">${t}</div>`); katman.appendChild(d); setTimeout(()=>d.remove(),1900); },
  /* ---------- konuşma balonu (oyunu durdurmadan) ---------- */
  balon(c,metin,sure=3200){ if(!c||!katman) return; const d=el(`<div class="hb-balon"></div>`); d.textContent=metin; katman.appendChild(d); const b={c,d,son:performance.now()+sure}; this.balonlar.push(b); requestAnimationFrame(()=>d.classList.add("gor")); return b; },
  balonGuncelle(){ const H=ekranYuksekligi(), v=new THREE.Vector3();
    this.balonlar=this.balonlar.filter(b=>{ if(performance.now()>b.son||!b.d.isConnected){ b.d.classList.remove("gor"); setTimeout(()=>b.d.remove(),300); return false; }
      const u=b.c.userData; if(u.kafa) v.copy(bas(b.c)); else if(u.kemik&&u.kemik.Head) u.kemik.Head.getWorldPosition(v); else v.copy(b.c.position).add(new THREE.Vector3(0,1.7,0));
      v.add(new THREE.Vector3(0,.32,0)).project(camera); const gor=v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1;
      b.d.style.display=gor?"":"none"; if(gor){ b.d.style.left=((v.x+1)/2*innerWidth).toFixed(1)+"px"; b.d.style.top=((1-v.y)/2*H).toFixed(1)+"px"; } return true; }); },
  /* ---------- Kardelen'in istekleri ve kendiliğinden sözleri ---------- */
  istekGuncelle(){ if(this.bitiyor) return;
    if(this.istek){ if(this.saat-this.istek.t0>150){ const i=this.istek; this.istek=null; this.istekT=this.saat+70; this.ih.mutlu=clamp(this.ih.mutlu-4,0,100); this.hudGuncelle(true);
        if(this.serbest&&!this.ag) this.balon(this.kar,["Neyse 🙄 kdkdkd","Unuttun mu yoksa 🥺","Peki 😌 Sonra"][Math.floor(Math.random()*3)]); gorev("Gününüzü planlayın: ışıltılı yerlere yürü"); } return; }
    if(this.saat<this.istekT||!this.serbest||kilit) return;
    const aday=HB_ISTEK.filter(I=>(!I.kosul||I.kosul(this))&&I.ad!==this.sonIstek); if(!aday.length) return;
    // gün batımında banka oturmak öncelikli
    const I=aday.find(x=>x.ad==="bank")&&Math.random()<.7? aday.find(x=>x.ad==="bank") : aday[Math.floor(Math.random()*aday.length)];
    this.istek={...I,t0:this.saat}; this.sonIstek=I.ad; if(!this.ag) this.balon(this.kar,I.soz.join(" "),4200); gorev(this.ag?I.ortak:I.ipucu); Ses.efekt("mesaj"); this.hudGuncelle(true); },
  istekTamam(ad){ if(!this.istek||this.istek.ad!==ad) return false; this.istek=null; this.istekSay++; this.istekT=this.saat+rnd(70,120); gorev("Gününüzü planlayın: ışıltılı yerlere yürü"); this.ekle({mutlu:12}); return true; },
  sohbetGuncelle(dt){ if(!this.serbest||kilit||this.bitiyor||this.ag) return; this.sohbetT-=dt; if(this.sohbetT>0) return; this.sohbetT=rnd(42,80);
    const I=this.ih; let L;
    if(I.tok<25) L=[this.kar,"Karnım zil çalıyor 🍔"]; else if(I.enerji<20) L=[this.kar,"Premses yoruldu ama 🥱"]; else if(I.eglence<25) L=[this.kar,"Sıkıldım biraz, bir şey yapalım 🥺"];
    else if(!this.ag){ const P=[[this.kar,"Paytak paytak gel 😄"],[this.kar,"Ankaralı mısın çen"],[this.kar,"Ellerin sıcacık"],[this.kar,"Göl ne güzel parlıyor"],[this.kar,"Hızlı yürüme şapşik"],[this.kar,"Minikom acıktın mı"],[this.kar,"Kocam bugün çok yakışıklı kdkdkd"],
        [this.kaan,"Haberin olsun, bugün bütün gün seninim"],[this.kaan,"Minnakım üşüdün mü?"],[this.kaan,"Civcivim, bak ördekler"]];
      if(this.lamba>.5) P.push([this.kar,"Yıldızlara bak ✨"],[this.kar,"Gece de ne güzelmiş burası"]); L=P[Math.floor(Math.random()*P.length)]; }
    if(L) this.balon(L[0],L[1]); },
  /* ---------- etkinlikler ---------- */
  async kafe(){ const K=this.kaan, D=this.kar, M=this.kafeMasa;
    await sahne(async()=>{ const p=M.position;
      K.position.set(p.x-.72,0,p.z); D.position.set(p.x+.72,0,p.z); K.rotation.y=Math.PI/2; D.rotation.y=-Math.PI/2;
      for(const c of [K,D]){ c.userData.otur=1; c.userData.oturY=.46; }
      this.fincanlar[0].position.set(p.x-.2,.81,p.z+.05); this.fincanlar[1].position.set(p.x+.22,.81,p.z-.06); for(const f of this.fincanlar) f.visible=true;
      kameraNoktasi(new THREE.Vector3(p.x+.25,1.6,p.z-3.2),new THREE.Vector3(p.x,1.0,p.z));
      await bekle(500);
      const L=[ [["kaan","Ne içersin minnakım?"],["kardelen",["Sıcak çikolata","Üstüne de krema 😋"]],["kaan","Krema benden, haberin olsun."]],
        [["kardelen",["Burası çok tatlıymış","Göl de tam karşıda"]],["kaan","Senin kadar değil."],["kardelen",["Kurtardın yine kdkdkd"]]],
        [["kardelen",["Bir dilim de pasta alsak mı","Yarı yarıya"]],["kaan","Yarısı benim haberin olsun."],["kardelen",["Büyük yarısı benim ama 😄"]]] ][Math.floor(this.rastgele()*3)];
      for(const [kim,m] of L) await this.soz(kim,m,{gul:kim==="kardelen"?1:.5});
      const ist=this.istek&&this.istek.ad==="kafe"; if(ist) await this.soz("kardelen",["Tam da bunu istiyordum 🥰"],{gul:1,sure:2200});
      await this.zamanAtla(45); this.ekle({tok:35,enerji:18,eglence:6,mutlu:8}); this.istekTamam("kafe");
      for(const f of this.fincanlar) f.visible=false; for(const c of [K,D]){ c.userData.otur=0; c.userData.oturY=0; }
      K.position.set(p.x-.3,0,p.z-1.3); K.rotation.y=Math.PI; });
    this.yapildi("kafe"); },
  async dondurma(){ const K=this.kaan, D=this.kar, kp=this.kiosk.position;
    await sahne(async()=>{ K.position.set(kp.x-.35,0,kp.z-2.0); D.position.set(kp.x+.45,0,kp.z-2.0); K.rotation.y=D.rotation.y=0;
      kameraNoktasi(new THREE.Vector3(kp.x+1.8,1.6,kp.z-4.6),new THREE.Vector3(kp.x,1.3,kp.z-1.2));
      const sat=this.saticilar[0]; if(sat) this.balon(sat,"Buyrun, ne olsun? 🍦",2600);
      await bekle(900);
      await this.soz("kardelen",["Ben çikolatalı","Sen de fıstıklı al, tadına bakarım kdkdkd"],{gul:1,kamera:false});
      await this.soz("kaan","Tadına bakmak dediğin yarısı oluyor ama.",{gul:.5,kamera:false});
      this.dondurmaKaldir(); const c1=hbDondurma("#cfe3b0"), c2=hbDondurma("#6b3f26"); scene.add(c1); scene.add(c2); eldeTut(K,c1,"S"); eldeTut(D,c2,"D"); this.dondurmalar=[c1,c2]; this.dondurmaBitis=this.saat+80;
      Ses.efekt("parilti"); await bekle(700);
      yuzYuze(K,D); const ist=this.istek&&this.istek.ad==="dondurma";
      await this.soz("kardelen",ist?["Aklımdan geçeni okudun 😍","En sevdiğim"]:["Mmm 😋","Bunu her gün yapalım"],{gul:1});
      await this.zamanAtla(12); this.ekle({tok:12,eglence:18,mutlu:10}); this.istekTamam("dondurma"); K.rotation.y=D.rotation.y=Math.PI; });
    this.yapildi("dondurma"); },
  dondurmaKaldir(){ if(!this.dondurmalar) return; for(const c of [this.kaan,this.kar]) if(c.userData.eldeki&&this.dondurmalar.includes(c.userData.eldeki)) c.userData.eldeki=null; for(const d of this.dondurmalar) if(d.parent) d.parent.remove(d); this.dondurmalar=null; },
  async cicek(){ const K=this.kaan, D=this.kar, tp=this.tezgah.position;
    if(this.cicekAlindi){ this.balon(D,"Bugün aldın zaten 🥰 Yeter bana",2600); return; }
    await sahne(async()=>{ K.position.set(tp.x-.4,0,tp.z-1.35); D.position.set(tp.x+.9,0,tp.z-1.9); K.rotation.y=0; D.rotation.y=-.6;
      kameraNoktasi(new THREE.Vector3(tp.x+.6,1.7,tp.z-4.4),new THREE.Vector3(tp.x,1.2,tp.z-.8));
      const sat=this.saticilar[1]; if(sat) this.balon(sat,"Hoş geldiniz 🌷",2400); await bekle(700);
      const c=await this.secim(["🌹 Kırmızı gül","🌼 Papatya","🌷 Pembe lale"],"kaan"); const renkH=["#c8102e","#f7f2ea","#f28ab0"][c];
      this.dondurmaKaldir(); const b=hbBuket(renkH); scene.add(b); this.buket=b;
      yuzYuze(K,D); D.position.copy(K.position).add(new THREE.Vector3(Math.sin(K.rotation.y),0,Math.cos(K.rotation.y)).multiplyScalar(.62));
      eldeTut(D,b,"S"); D.userData.kolPoz="buket"; Ses.efekt("parilti");
      const ist=this.istek&&this.istek.ad==="cicek";
      await this.soz("kardelen",ist?["Gerçekten aldın mı 😍","Aklımı okuyorsun"]:["Bunlar benim mi 😍","Çok güzeller"],{gul:1});
      await this.soz("kaan",c===1?"Papatya gibi sade ve güzel. Aynı sen.":"Sen bunlardan da güzelsin, haberin olsun.",{gul:.6});
      await this.soz("kardelen",["Of kdkdkd","Şapşik 🙈"],{gul:1});
      await this.zamanAtla(10); this.ekle({mutlu:18}); this.istekTamam("cicek"); this.cicekAlindi=true;
      D.userData.kolPoz=null; eldeTut(D,b,"D"); K.rotation.y=D.rotation.y=Math.PI; });
    this.yapildi("cicek"); },
  async sinema(){ const K=this.kaan, D=this.kar;
    if(this.saat>=1380){ this.balon(D,"Son seans kaçmış 🥺 Yarın gelelim",2800); return; }
    const perde=el(`<div class="hb-perde"></div>`); katman.appendChild(perde);
    await sahne(async()=>{ requestAnimationFrame(()=>perde.classList.add("ac")); await bekle(550);
      const S0=this.salon.position, k1=this.koltuklar[3], k2=this.koltuklar[4]; this.dondurmaKaldir();
      const wp=o=>o.getWorldPosition(new THREE.Vector3());
      K.position.copy(wp(k1)).add(new THREE.Vector3(0,0,-.02)); D.position.copy(wp(k2)).add(new THREE.Vector3(0,0,-.02)); K.rotation.y=D.rotation.y=Math.PI;
      for(const c of [K,D]){ c.userData.otur=1; c.userData.oturY=.45; }
      if(D.userData.eldeki===this.buket&&this.buket) this.buket.visible=false;
      this.isiklar[3].position.set(S0.x,3.0,S0.z-5); this.isiklar[3].distance=14; this.filmAcik=true; const eskiL=this.isiklar[3].intensity;
      const m=K.position.clone().lerp(D.position,.5);
      Kamera.sinema=()=>{ camera.position.set(m.x+.7,1.62,m.z-2.0); camera.lookAt(m.x,1.05,m.z); };
      await bekle(300); perde.classList.remove("ac"); await bekle(700);
      await anlat("Film başladı. Işıklar söndü, salon sessizleşti.",2600);
      await this.soz("kardelen",["Bu sefer uyumayacağım","Söz kdkdkd"],{gul:.8,kamera:false});
      await bekle(1200);
      D.userData.kafa.rotation.z=-.34; D.userData.uyku=1; D.userData.gulumse=.3;
      await anlat("On dakika sonra omzumda tatlı bir ağırlık vardı.",3000);
      await this.zamanAtla(110);
      D.userData.uyku=0; D.userData.kafa.rotation.z=0; D.userData.gulumse=1;
      await this.soz("kardelen",["Filmde uyuyoruz ya kdkdkd","Sonu nasıl bitti?"],{gul:1,kamera:false});
      await this.soz("kaan","Bilmiyorum. Ben de seni izledim.",{gul:.6,kamera:false});
      const ist=this.istek&&this.istek.ad==="sinema"; if(ist) await this.soz("kardelen",["Ama çok güzeldi 🥰","İyi ki geldik"],{gul:1,kamera:false,sure:2400});
      this.ekle({enerji:30,eglence:26,mutlu:10}); this.istekTamam("sinema");
      perde.classList.add("ac"); await bekle(550);
      this.filmAcik=false; this.isiklar[3].position.set(10,2.4,-18); this.isiklar[3].distance=11; this.isiklar[3].intensity=eskiL;
      for(const c of [K,D]){ c.userData.otur=0; c.userData.oturY=0; }
      const kp=this.sinemaKapi.position; K.position.set(kp.x-.3,0,kp.z-1.6); K.rotation.y=Math.PI; if(this.buket) this.buket.visible=true;
      this.ortamYenile(); oyuncuKamerasi(); await bekle(200); perde.classList.remove("ac"); await bekle(500); });
    perde.remove(); this.yapildi("sinema"); },
  async bank(b){ const K=this.kaan, D=this.kar;
    await sahne(async()=>{ const bq=b.rotation.y, yan=new THREE.Vector3(Math.cos(bq),0,-Math.sin(bq)), ileri=new THREE.Vector3(Math.sin(bq),0,Math.cos(bq));
      K.position.copy(b.position).addScaledVector(yan,.38).addScaledVector(ileri,.06); D.position.copy(b.position).addScaledVector(yan,-.38).addScaledVector(ileri,.06);
      K.rotation.y=D.rotation.y=bq; for(const c of [K,D]){ c.userData.otur=1; c.userData.oturY=.46; } K.userData.elele=D.userData.elele=1;
      const m=b.position.clone(); let s=0;
      Kamera.sinema=dt=>{ s+=dt; camera.position.copy(m).addScaledVector(ileri,3.4+s*.03).add(new THREE.Vector3(0,2.05,0)).addScaledVector(yan,Math.sin(s*.12)*.45); camera.lookAt(m.x,.92,m.z); };
      await bekle(900); const batim=this.saat>=1060&&this.saat<=1190, gece=this.lamba>.6;
      D.userData.kafa.rotation.z=-.28;
      if(batim){ await this.soz("kardelen",["Bak gün batıyor 🌅","Gökyüzü pembe pembe"],{gul:.9,kamera:false}); await this.soz("kaan","En güzel gün batımları seninle olanlar.",{gul:.6,kamera:false}); await this.soz("kardelen",["Bugün çok romantiksin","Hoşuma gidiyor ama kdkdkd"],{gul:1,kamera:false}); }
      else if(gece){ await this.soz("kardelen",["Yıldızlar çıkmış ✨","Şuraya bak, kayan yıldız mı o"],{gul:.9,kamera:false}); await this.soz("kaan","Dilek tuttum. Söylemem.",{gul:.5,kamera:false}); await this.soz("kardelen",["Ben biliyorum zaten 😌"],{gul:1,kamera:false}); }
      else { await this.soz("kardelen",["Burada saatlerce oturabilirim","Sen yanımdaysan"],{gul:.9,kamera:false}); await this.soz("kaan","Ben de. Göl de güzel ama manzaranın en güzeli yanımda.",{gul:.6,kamera:false}); }
      await this.zamanAtla(30); this.ekle({enerji:14,mutlu:batim?14:6}); this.istekTamam("bank");
      D.userData.kafa.rotation.z=0; for(const c of [K,D]){ c.userData.otur=0; c.userData.oturY=0; } K.userData.elele=D.userData.elele=0;
      K.position.copy(b.position).addScaledVector(ileri,-1.0).addScaledVector(yan,.3); K.rotation.y=bq+Math.PI; });
    this.yapildi("bank"); },
  async ordek(){ const K=this.kaan, D=this.kar, n=this.ordekNokta.position;
    await sahne(async()=>{ K.position.set(n.x-.35,0,n.z+.35); D.position.set(n.x+.4,0,n.z+.35); K.rotation.y=D.rotation.y=Math.PI;
      kameraNoktasi(new THREE.Vector3(n.x+.4,1.9,n.z+4.2),new THREE.Vector3(n.x,.7,n.z-3));
      this.ordekCagir=true; await bekle(1200);
      this.ekmekAt(K); await bekle(600); this.ekmekAt(D); await bekle(500);
      await this.soz("kardelen",["Kuş 46 numara mı giyiyormuş? kdkdkd","Ayaklarına bak"],{gul:1,kamera:false});
      await this.soz("kaan","Paytak paytak yürüyorlar. Aynı sen.",{gul:.6,kamera:false});
      await this.soz("kardelen",["Hey 😤","Ama doğru kdkdkd"],{gul:1,kamera:false});
      this.ekmekAt(K); await bekle(800); const ist=this.istek&&this.istek.ad==="ordek"; if(ist) await this.soz("kardelen",["En tatlısı şu küçük olan 🦆"],{gul:1,kamera:false,sure:2200});
      await this.zamanAtla(20); this.ekle({eglence:15,mutlu:7}); this.istekTamam("ordek"); this.ordekCagir=false; });
    this.yapildi("ordek"); },
  ekmekAt(c){ const p=c.userData.kemik.RightHand.getWorldPosition(new THREE.Vector3()); for(let i=0;i<5;i++){ const k=new THREE.Mesh(new THREE.BoxGeometry(.025,.02,.025),mat("#e8d2a8",{roughness:.9})); k.position.copy(p); scene.add(k);
      (this.ekmekler||(this.ekmekler=[])).push({m:k,v:new THREE.Vector3(rnd(-.6,.6),rnd(1.6,2.4),rnd(-2.6,-1.6)),t:0}); } Ses.efekt("vuru"); },
  async foto(){ const K=this.kaan, D=this.kar, u=this.iskeleUc.position;
    await sahne(async()=>{ K.position.set(u.x+.2,0,u.z+.4); D.position.set(u.x-.3,0,u.z+.4); K.rotation.y=D.rotation.y=0;
      kameraNoktasi(new THREE.Vector3(u.x+1.6,1.7,u.z+3.4),new THREE.Vector3(u.x,1.3,u.z));
      await this.soz("kardelen",["Prova şart","Gülümse bakalım 😄"],{gul:1,kamera:false});
      const baslik=`Bir Gün Birlikte · ${this.gun}. gün · ${this.saatYazi(this.saat)}`;
      this.deklansorEsle(); const veri=await BA.selfie(K,D,baslik,{yon:new THREE.Vector3(0,0,1)});
      if(veri){ this.fotoSay++; kayit.hayat.foto=(kayit.hayat.foto||0)+1; kaydet(); }
      const ist=this.istek&&this.istek.ad==="foto"; const mo=K.position.clone().lerp(D.position,.5); kameraNoktasi(mo.clone().add(new THREE.Vector3(.35,1.5,2.6)),mo.clone().add(new THREE.Vector3(0,1.25,0)));
      await this.soz("kardelen",ist?["Tam istediğim gibi 😍","Albüme koy bunu"]:["Bu çok güzel olmuş 😍","Göl de çıkmış arkada"],{gul:1,kamera:false});
      await this.zamanAtla(10); this.ekle({eglence:8,mutlu:8}); this.istekTamam("foto"); K.rotation.y=D.rotation.y=0; });
    this.yapildi("foto"); },
  async salincakSalla(){ const K=this.kaan, D=this.kar, S=this.salincak, P=S.userData.salinimlar[0];
    await sahne(async()=>{ this.dondurmaKaldir(); const hb=D.userData.eldeki===this.buket&&this.buket; if(hb) this.buket.visible=false;
      this.salinim={P,aci:0,hiz:0,t:0}; D.userData.otur=1; D.userData.oturY=.5; D.userData._otur=1; this.salinimGuncelle(0);
      const sp=S.position; K.position.set(sp.x-.75,0,sp.z+1.35); K.rotation.y=Math.PI;
      kameraNoktasi(new THREE.Vector3(sp.x+1.2,1.6,sp.z-2.9),new THREE.Vector3(sp.x-.75,1.05,sp.z+.55)); // önden çapraz: Kardelen salıncakta, Kaan arkasında iterken görünür
      await bekle(600); this.salinim.it=true;
      await this.soz("kardelen",["Daha yüksek! kdkdkd"],{gul:1,kamera:false,sure:2600});
      await bekle(1800); await this.soz("kardelen",["Yavaş şapşik 😱","Uçacağım"],{gul:1,kamera:false,sure:2600});
      await this.soz("kaan","Tuttum seni, korkma minnakım.",{gul:.6,kamera:false,sure:2400});
      const ist=this.istek&&this.istek.ad==="salincak"; await this.soz("kardelen",ist?["Çocukluğuma döndüm 🥹","Teşekkür ederim"]:["Çocukluğuma döndüm 🥹"],{gul:1,kamera:false,sure:2600});
      this.salinim.it=false; await bekle(2200);
      await this.zamanAtla(20); this.ekle({eglence:20,mutlu:8}); this.ih.enerji=clamp(this.ih.enerji-4,0,100); this.istekTamam("salincak");
      this.salinim=null; P.rotation.x=0; D.userData.otur=0; D.userData.oturY=0; if(hb) this.buket.visible=true;
      D.position.set(sp.x-.2,0,sp.z+1.6); K.position.set(sp.x-.72,0,sp.z+1.6); K.rotation.y=D.rotation.y=Math.PI; K.userData.kolS.rotation.set(0,0,0); K.userData.kolD.rotation.set(0,0,0); });
    this.yapildi("salincak"); },
  salinimGuncelle(dt){ const s=this.salinim; if(!s) return; const D=this.kar, K=this.kaan;
    const once=s.hiz; s.hiz+=(-9.8/2.0*Math.sin(s.aci))*dt; s.hiz*=Math.pow(s.it?.97:.55,dt);
    if(s.it){ if(Math.abs(s.aci)<.02&&Math.abs(s.hiz)<.05) s.hiz=1.0; else if(once<0&&s.hiz>=0&&s.aci<-.05) s.hiz+=.85; } // Kaan arkadan iter: salıncak ona gelip dönerken
    s.aci=clamp(s.aci+s.hiz*dt,-.78,.78);
    s.P.rotation.x=s.aci; const o=s.P.userData.oturak; o.updateMatrixWorld(true); const w=o.getWorldPosition(new THREE.Vector3());
    D.position.set(w.x,w.y-.5+.03,w.z); D.rotation.y=Math.PI+(this.salincak.rotation.y||0); D.userData.govde.rotation.x=-s.aci*.4;
    // Kaan arkada: salıncak geri gelince kollarıyla iter
    const it=s.it&&s.aci<-.12?1:0; K.userData.kolS.rotation.set(-1.25*it,0,0); K.userData.kolD.rotation.set(-1.25*it,0,0); },
  /* ---------- Kardelen'le: sarıl, iltifat, gıdıkla, selfie ---------- */
  async kalpMenu(kim){ kim=kim||this.ben; const K=this.kaan, D=this.kar;
    await sahne(async()=>{ yuzYuze(K,D); const ileri=new THREE.Vector3(Math.sin(K.rotation.y),0,Math.cos(K.rotation.y)); D.position.copy(K.position).addScaledVector(ileri,.85); yuzYuze(K,D);
      konusmaKamerasi(K,D);
      const c=await this.secim(["🤗 Sarıl","😍 İltifat et","😆 Gıdıkla","🤳 Selfie çek","Vazgeç"],kim);
      if(c===0){ D.position.copy(K.position).addScaledVector(ileri,.55); K.userData.saril=D.userData.saril=1; Ses.efekt("kalp");
        const m=K.position.clone().lerp(D.position,.5), yan=new THREE.Vector3(ileri.z,0,-ileri.x);
        Kamera.sinema=()=>{ camera.position.copy(m).addScaledVector(yan,1.7).add(new THREE.Vector3(0,1.45,0)); camera.lookAt(m.x,1.35,m.z); };
        await bekle(1600); const ist=this.istek&&this.istek.ad==="saril"; const tekrar=this.saat-this.sonSaril<60;
        await this.soz("kardelen",ist?["Böyle kalalım biraz 🥺","Isındım"]:tekrar?["Az önce sarıldın","Ama yine olur kdkdkd"]:["Böyle kalalım biraz 🥺"],{gul:1,kamera:false});
        await bekle(900); K.userData.saril=D.userData.saril=0; this.ekle({mutlu:tekrar?2:6}); this.sonSaril=this.saat; this.istekTamam("saril"); this.yapildi("saril"); }
      else if(c===1){ const s=await this.secim(kim==="kaan"?["Bugün çok güzelsin","Seninle her yer güzel","Gülüşüne bayılıyorum"]:["Bugün çok yakışıklısın","Seninle her yer güzel","Gülüşüne bayılıyorum"],kim);
        if(kim==="kaan"){ await this.soz("kaan",["Bugün çok güzelsin.","Seninle her yer güzel.","Gülüşüne bayılıyorum."][s],{gul:.6});
          await this.soz("kardelen",[["Biliyorum kdkdkd","Ama yine de söyle"],["Of şapşik 🙈","Ama doğru"],["Sen de fena değilsin kocam 😌"]][s],{gul:1}); }
        else { await this.soz("kardelen",[["Bugün çok yakışıklısın kocam"],["Seninle her yer güzel minikom"],["Gülüşüne bayılıyorum şapşik"]][s],{gul:1});
          await this.soz("kaan",["Biliyorum, haberin olsun 😌","Seninle her yer güzel minnakım.","Sen gülünce ben de gülüyorum civcivim."][s],{gul:.7}); }
        this.ekle({mutlu:this.saat-this.sonIltifat<30?1:4}); this.sonIltifat=this.saat; this.yapildi("iltifat"); }
      else if(c===2){ if(kim==="kaan"){ D.userData.gulumse=1; await this.soz("kardelen",["Dur kdkdkd","Gıdıklanmıyorum ben 😂","Tamam tamam pes!"],{gul:1}); }
        else { K.userData.gulumse=1; await this.soz("kaan","Dur, gıdıklanıyorum! 😂 Tamam pes!",{gul:1}); await this.soz("kardelen",["Kazandım kdkdkd"],{gul:1}); } this.ekle({eglence:5,mutlu:3}); this.yapildi("gidikla"); }
      else if(c===3){ const f=this.ag? new THREE.Vector3(0,0,K.position.z<5?1:-1) : camera.position.clone().sub(K.position).setY(0); if(f.lengthSq()<.01) f.set(0,0,1);
        const baslik=`Bir Gün Birlikte · ${this.gun}. gün · ${this.saatYazi(this.saat)} 🤳`; this.deklansorEsle(); const veri=await BA.selfie(K,D,baslik,{yon:f.normalize()});
        if(veri){ this.fotoSay++; kayit.hayat.foto=(kayit.hayat.foto||0)+1; kaydet(); } await this.soz("kardelen",["Bunu profil fotoğrafı yapıyorum 😍"],{gul:1,sure:2400}); this.ekle({eglence:5,mutlu:6}); this.istekTamam("foto"); this.yapildi("selfie"); }
      K.rotation.y=D.rotation.y=K.rotation.y; });
  },
  yapildi(ad){ this.yapilan[ad]=(this.yapilan[ad]||0)+1; },
  /* ---------- günün sonu ---------- */
  async gunSonu(yorgun,uzaktan){ if(this.bitiyor) return; this.bitiyor=true; if(this.ag&&!uzaktan) Ag.gonder({t:"e",a:"son",r:yorgun?1:null,s:1});
    if(this._mesajPanel){ this._mesajPanel.remove(); this._mesajPanel=null; }
    const t0=performance.now(); while((!this.serbest||kilit)&&performance.now()-t0<60000) await bekle(200); this.serbest=false; if(this.elele&&this.ag) this.eleleBirak(false); this.eid=777+this.gun; this.adimNo=0;
    const K=this.kaan, D=this.kar, u=this.iskeleUc.position; this.dondurmaKaldir();
    await sahne(async()=>{ K.position.set(u.x+.25,0,u.z-.3); D.position.set(u.x-.27,0,u.z-.3); K.rotation.y=D.rotation.y=Math.PI; K.userData.omuz=1;
      const m=K.position.clone().lerp(D.position,.5); let s=0;
      Kamera.sinema=dt=>{ s+=dt; camera.position.set(m.x+.6-s*.02,1.4+s*.01,m.z+3.4+s*.05); camera.lookAt(m.x,1.25,m.z-6); };
      await bekle(1200);
      if(yorgun) await this.soz("kardelen",["Çok yoruldum 🥱","Ayaklarım beni taşımıyor kdkdkd"],{gul:.7,kamera:false});
      await this.soz("kaan","Bugün çok güzeldi minnakım.",{gul:.6,kamera:false});
      await this.soz("kardelen",["Bence de 🥰","Yarın yine gezelim mi"],{gul:1,kamera:false});
      await this.soz("kaan","Her gün, haberin olsun.",{gul:.7,kamera:false});
      K.userData.omuz=0; });
    const I=this.ih, puan=Math.round(I.mutlu), hy=kayit.hayat; hy.enIyi=Math.max(hy.enIyi||0,puan); hy.gun=this.gun+1; kaydet();
    const L=Object.entries(this.yapilan).map(([k,v])=>`<li>${HB_AD[k]||k}${v>1?" ×"+v:""}</li>`).join("")||"<li>Bugün sadece yürüdük, o da güzeldi 🙂</li>";
    const d=el(`<div class="hb-ozet"><div class="kart"><span class="ust-yazi">${this.gun}. gün bitti</span><h2>Bir Gün Birlikte</h2>
      <div class="yuzde">💗 ${puan}%</div><small style="opacity:.75">Kardelen'in mutluluğu${this.istekSay?(this.ben==="kardelen"?` · ${this.istekSay} isteğin yerine geldi`:` · ${this.istekSay} isteğini yerine getirdin`):""}${this.fotoSay?` · ${this.fotoSay} fotoğraf`:""}</small>
      <ul>${L}</ul><div style="display:flex;flex-direction:column;gap:10px;align-items:center"><button class="btn" id="yeni">☀️ Yeni gün</button><button class="btn ince kucuk" id="menu">Menüye dön</button></div></div></div>`);
    katman.appendChild(d); this.ozette=true; if(this.hud) this.hud.classList.add("gizli"); gorev(null); for(const e of katman.querySelectorAll(".joy,.aksiyon,.hb-kalp,.hb-mesaj")) e.style.display="none";
    d.querySelector("#yeni").onclick=()=>{ if(this.ag){ const t=1+Math.floor(Math.random()*1e9); Ag.gonder({t:"yeni",g:this.gun+1,s:t}); this._yeniGun=true; this.ag.gun=this.gun+1; this.ag.tohum=t; } bolumAc(BH); };
    d.querySelector("#menu").onclick=()=>gecis(()=>Menu.ac()); },
  /* ---------- her kare ---------- */
  guncelle(dt){
    this.t+=dt; const K=this.kaan, D=this.kar;
    if(this.su&&this.su.material.uniforms.time) this.su.material.uniforms.time.value=this.t*.45;
    if(!this.bitiyor){ const dk=dt*HB_HIZ; this.saat=Math.min(HB_SAAT1,this.saat+dk); this.ihtiyac(dk); }
    this.gokGuncelle(); this.hudGuncelle();
    if(this.dondurmalar&&this.saat>this.dondurmaBitis&&this.serbest) this.dondurmaKaldir();
    if(this.filmAcik&&this.perde){ const P=this.perde, x=P.x, f=this.t; const g=x.createLinearGradient(0,0,256,128); g.addColorStop(0,`hsl(${(f*20)%360},55%,${30+15*Math.sin(f*1.3)}%)`); g.addColorStop(1,`hsl(${(f*20+120)%360},50%,${22+12*Math.sin(f*.9+1)}%)`);
      x.fillStyle=g; x.fillRect(0,0,256,128); P.t.needsUpdate=true; const l=this.isiklar[3]; l.intensity=.9+.5*Math.sin(f*2.1)*Math.sin(f*.7); l.color.setHSL(((f*20)%360)/360,.4,.7); }
    // kalabalık: yürüyenler kıyı yolunda ve kaldırımda gidip gelir
    for(const c of this.yuruyenler){ const y=c.userData.yol; c.position.x+=y.hz*dt*1.25; c.rotation.y=y.hz>0?Math.PI/2:-Math.PI/2; if(c.position.x>56||c.position.x<-56) y.hz*=-1; }
    // arabalar: önlerinde yaya varsa yavaşlar, durur
    for(const a of this.arabalar){ const y=a.userData.yon; let engel=false; for(const c of [K,D,...this.yuruyenler]){ const dx=(c.position.x-a.position.x)*y; if(dx>0&&dx<7.5&&Math.abs(c.position.z-a.position.z)<1.6){ engel=true; break; } }
      a.userData.v=lerp(a.userData.v,engel?0:a.userData.vh,1-Math.pow(engel?.02:.4,dt)); a.position.x+=y*a.userData.v*dt; if(a.position.x*y>80) a.position.x=-80*y; }
    // ördekler: süzülür; beslenirken iskelenin yanına toplanır
    for(const o of this.ordekler){ const f=o.userData.faz+this.t*.35; let hx, hz;
      if(this.ordekCagir){ hx=this.ordekNokta.position.x+Math.sin(o.userData.faz*3)*1.4; hz=-9.4-Math.abs(Math.cos(o.userData.faz*2))*1.2; } else { hx=-3+Math.sin(f)*6+Math.sin(o.userData.faz)*3; hz=-15+Math.cos(f*.8)*3.5; }
      const dx=hx-o.position.x, dz=hz-o.position.z, L=Math.hypot(dx,dz); if(L>.05){ const v=Math.min(L,(this.ordekCagir?.9:.35)*dt); o.position.x+=dx/L*v; o.position.z+=dz/L*v; let a=Math.atan2(dx,dz)-o.rotation.y; a=Math.atan2(Math.sin(a),Math.cos(a)); o.rotation.y+=a*Math.min(1,dt*2); }
      o.position.y=-.3+Math.sin(this.t*2+o.userData.faz)*.012; }
    if(this.ekmekler) this.ekmekler=this.ekmekler.filter(e=>{ e.t+=dt; e.v.y-=9.8*dt; e.m.position.addScaledVector(e.v,dt); if(e.m.position.y<-.32){ scene.remove(e.m); e.m.geometry.dispose(); return false; } return true; });
    this.salinimGuncelle(dt);
    if(this._aciSon!==undefined&&Math.abs(Kamera.aci-this._aciSon)>1e-4) this._kaydirT=1.8; this._kaydirT=Math.max(0,(this._kaydirT||0)-dt);
    const O=this.oyuncu, P=this.esKar;
    if(this.serbest&&!kilit){
      if(!this.ag){ yuru(O,dt,this.sinir,2.15); eleleTakip(O,P,dt); }
      else if(this.elele){ const L=this.elele==="kaan"?K:D, F=L===K?D:K; if(L===O) yuru(O,dt,this.sinir,2.15); else this.uzakUygula(L,dt); eleleTakip(L,F,dt); }
      else { yuru(O,dt,this.sinir,2.15); this.uzakUygula(P,dt); }
      // kamera yürürken yavaşça oyuncunun arkasına döner (GTA gibi); oyuncu ekranı kaydırınca bir süre onun açısı korunur
      const v=girdiVek(), ileri=Math.max(0,-v.y); if(ileri>.2&&this._kaydirT<=0&&!(this.ag&&this.elele&&this.elele!==this.ben)){ let f=(O.rotation.y+Math.PI)-Kamera.aci; f=Math.atan2(Math.sin(f),Math.cos(f)); Kamera.aci+=f*(1-Math.pow(.45,dt))*ileri; } }
    this._aciSon=Kamera.aci;
    // ağ: kendi konumumu gönderirim (el ele tutulan taraf değilsem); ev sahibi saati, göstergeleri ve isteği yollar
    if(this.ag){ this._agT-=dt; if(this._agT<=0&&this.serbest){ this._agT=.12; if(!(this.elele&&this.elele!==this.ben)){ const p=[+O.position.x.toFixed(2),+O.position.z.toFixed(2),+O.rotation.y.toFixed(2),+(O.userData.hiz||0).toFixed(2)], o=this._sonD;
        const ayni=o&&Math.abs(o[0]-p[0])<.02&&Math.abs(o[1]-p[1])<.02&&Math.abs(o[2]-p[2])<.02&&o[3]===p[3]; if(!ayni||performance.now()-this._sonDT>1000){ this._sonD=p; this._sonDT=performance.now(); Ag.gonder({t:"d",p}); } } }
      if(this.ag.host){ this._wT-=dt; if(this._wT<=0){ this._wT=1; const I=this.ih; Ag.gonder({t:"w",s:+this.saat.toFixed(1),ih:[I.tok,I.enerji,I.eglence,I.mutlu].map(v=>Math.round(v)),ist:this.istek?this.istek.ad:null}); } }
      if(this.elEtk) this.elEtk.yazi=this.elele?"✋ Bırak":"🤝 Elini tut"; }
    etkilesimGuncelle(O,this.btn);
    if(!Kamera.sinema) Kamera.hedef.lerp(O.position,.1);
    this.balonGuncelle(); if(!this.ag||this.ag.host) this.istekGuncelle(); this.sohbetGuncelle(dt);
    // aydınlatma değişince ortam yansıması tazelenir (oyuncu dururken, sahne dışındayken)
    if(this.serbest&&!kilit&&Math.floor(this.saat/90)!==this.ortamDilim&&(O.userData.hiz||0)<.3) this.ortamYenile();
    if(!this.bitiyor&&this.serbest&&!kilit&&(!this.ag||this.ag.host||!Ag.esCanli)){ if(this.saat>=HB_SAAT1-2) this.gunSonu(false); else if(this.ih.enerji<=0) this.gunSonu(true); }
  },
  sinir(p){ // göl kıyısı (iskele hariç), binaların önü, kasabanın uçları
    const iskele=p.x>8.35&&p.x<11.65&&p.z<-7.4;
    if(iskele){ p.x=clamp(p.x,8.45,11.55); p.z=Math.max(p.z,-19.8); }
    else if(p.z<-7.45) p.z=-7.45;
    p.z=Math.min(p.z,16.1); p.x=clamp(p.x,-60,61); p.y=0; },
  temizle(){ if(this.ag&&!this._yeniGun){ Ag.gonder({t:"x"}); const a=Ag; setTimeout(()=>a.kapat(),400); this.ag=null; } if(this._mesajPanel){ this._mesajPanel.remove(); this._mesajPanel=null; } this.dondurmaKaldir(); for(const b of this.balonlar||[]) b.d.remove(); this.balonlar=[]; this.salinim=null; this.filmAcik=false; Ses.ortamDur&&Ses.ortamDur(); }
};
