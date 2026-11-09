/* ================= AKIŞ ================= */
const BOLUMLER=[B0,B1,BA,BK,B2,BI,BY,B3,B4,B5,BD,B5K,BT,BN,B6];
BOLUMLER.forEach((B,i)=>{ B.no=i+1; }); KALP_TOPLAM=BOLUMLER.length*3; // bölüm numarası sıradan gelir; kayıt kalıcı kimlikle (id) tutulur
// eski kayıtlarda bölüm numaraları bir kaydı (yeni 1. bölüm: İlk Mesaj)
if(!kayit.v2){ const b={}; for(const k in kayit.bitti) b[+k+1]=kayit.bitti[k]; kayit.bitti=b; kayit.v2=1; kaydet(); }
// 3. bölüm olarak "Ankaram" eklendi: eski 3+ bölümler bir kaydı
if(!kayit.v3){ const b={}; for(const k in kayit.bitti) b[+k>=3?+k+1:+k]=kayit.bitti[k]; kayit.bitti=b; kayit.v3=1; kaydet(); }
// v4: bitirilen bölümler numarayla değil kimlikle saklanır (araya yeni bölüm girince kayıt kaymasın)
if(!kayit.v4){ const eski=["ilkmesaj","mezuniyet","ankara","eskisehir","kapadokya","pembe","cudi","patara"]; kayit.bittiId=kayit.bittiId||{};
  for(const k in kayit.bitti){ const id=eski[+k-1]; if(id&&kayit.bitti[k]) kayit.bittiId[id]=1; } if(kayit.bittiId.cudi) kayit.bittiId.yilbasi=1; kayit.v4=1; kaydet(); }
kayit.bittiId=kayit.bittiId||{};
async function bolumAc(B){
  let hata=null;
  await gecis(async()=>{ NESIL++; DK_DINLE=null; if(bolum&&bolum.temizle) bolum.temizle(); bolum=null; katmanTemizle(); hedefEl=null; dkKutu=null; ETK=[]; KOSUL=[]; HAREKET=[]; kilit=false;
    if(avatarlariYukle.kalab){ const y=el(`<div class="tost gor" style="bottom:auto;top:46%">Hazırlanıyor…</div>`); document.body.appendChild(y); try{ await avatarlariYukle.kalab; } finally{ y.remove(); } }
    try{ await (B.bolumKur?B.bolumKur():B.kur()); bolum=B; }catch(e){ console.error(e); hata=e; } });
  if(hata){ tost("Bu bölüm açılırken bir sorun çıktı",3200); return gecis(()=>Menu.ac()); }
  B.basla().catch(e=>{ console.error(e); if(bolum!==B) return; tost("Bir sorun çıktı, bölümlere dönüyorum",3000); bekle(3200).then(()=>{ if(bolum===B) gecis(()=>Menu.ac()); }); });
}
function bolumBitti(no){
  // sahne az önce bittiyse son kartın arkasında sahnenin son çekimi sürer (oyuncu kamerasına geri dönmez), arkada yürünmez
  if(SON_SINEMA&&SON_SINEMA.f&&SON_SINEMA.n===NESIL&&performance.now()-SON_SINEMA.t<400){ Kamera.sinema=SON_SINEMA.f; kilit=true; const j=katman&&katman.querySelector(".joy"); if(j) j.style.opacity=0; }
  const B=BOLUMLER.find(b=>b.no===no)||BOLUMLER.find(b=>bolum&&b.id===bolum.id)||BOLUMLER[0];
  kayit.bittiId[B.id]=1; kaydet(); gorev(null); aksiyonYazi(bolum&&bolum.btn,null);
  const sonraki=BOLUMLER[BOLUMLER.indexOf(B)+1];
  const d=el(`<div class="tam" style="justify-content:flex-end;background:linear-gradient(transparent 40%,#000a)"><div class="son-kart">
    <span class="ust-yazi">Bölüm ${B.no} · ${B.tarih}</span>
    <h2 style="font-size:40px">${B.ad}</h2>
    <div style="display:flex;flex-direction:column;gap:10px;width:100%;align-items:center">
      ${sonraki?`<button class="btn" id="ileri">Sıradaki: ${sonraki.ad}</button>`:`<button class="btn" id="final">Son sayfa</button>`}
      <button class="btn ince kucuk" id="menu">Bölümlere dön</button>
    </div></div></div>`);
  katman.appendChild(d);
  const i=d.querySelector("#ileri"); if(i) i.onclick=()=>bolumAc(sonraki);
  const f=d.querySelector("#final"); if(f) f.onclick=()=>gecis(()=>Final.ac());
  d.querySelector("#menu").onclick=()=>gecis(()=>Menu.ac());
}
function uygulamaMi(){ return (navigator.standalone===true)||matchMedia("(display-mode: standalone)").matches||matchMedia("(display-mode: fullscreen)").matches; }
function kurulumIpucu(){
  if(uygulamaMi()||kayit.ipucuKapat||/claude\.ai|claudeusercontent/.test(location.hostname)) return;
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent);
  const d=el(`<div class="kur"><b>Uygulama gibi aç</b><span>${ios?"Safari'de adres çubuğunun yanındaki <i>•••</i> düğmesine (eski iOS'ta alttaki <i>Paylaş ⬆︎</i> simgesine) dokun → <i>Paylaş</i> → <i>Ana Ekrana Ekle</i>. <i>Web uygulaması olarak aç</i> açık kalsın, <i>Ekle</i>'ye bas. Sonra oyunu ana ekrandaki simgeden aç: tam ekran ve daha hızlı açılır.":"Tarayıcı menüsünden <i>Ana ekrana ekle</i> ya da <i>Uygulamayı yükle</i>'yi seç."}</span><button aria-label="Kapat">✕</button></div>`);
  d.querySelector("button").onclick=()=>{ kayit.ipucuKapat=1; kaydet(); d.remove(); };
  const ust=katman.querySelector('.menu > div'); if(ust) ust.appendChild(d); else katman.appendChild(d);
}


/* ================= GÜNCELLEME (telefondan) ================= */
const SURUM="__SURUM__";
async function sunucuSurumu(){ try{ const r=await fetch("surum.json?t="+Date.now(),{cache:"no-store"}); if(!r.ok) return null; const j=await r.json(); return j.surum||null; }catch(e){ return null; } }
function tost(t,sure=2600){ const d=el(`<div class="tost">${t}</div>`); document.body.appendChild(d); requestAnimationFrame(()=>d.classList.add("gor")); setTimeout(()=>{ d.classList.remove("gor"); setTimeout(()=>d.remove(),500); },sure); }
async function guncelle(){
  const d=el(`<div class="guncel-perde"><div><b>Güncelleniyor…</b><small>Yeni sürüm indiriliyor, birkaç saniye sürebilir</small></div></div>`); document.body.appendChild(d);
  try{ if("serviceWorker" in navigator){ const rs=await navigator.serviceWorker.getRegistrations(); for(const r of rs){ try{ await r.update(); }catch(e){} } } }catch(e){}
  try{ const ks=await caches.keys(); await Promise.all(ks.filter(k=>k.startsWith("kk-")).map(k=>caches.delete(k))); }catch(e){}
  setTimeout(()=>location.reload(),300);
}
function guncellemeBandi(){
  if(document.querySelector(".guncel-band")) return;
  const b=el(`<div class="guncel-band"><span><b>Yeni güncelleme var</b><small>Dokun, oyun kendini yenilesin</small></span><button class="btn kucuk">Güncelle</button><button class="kapat" aria-label="Sonra">✕</button></div>`);
  b.querySelector(".btn").onclick=guncelle; b.querySelector(".kapat").onclick=()=>b.remove();
  document.body.appendChild(b); requestAnimationFrame(()=>b.classList.add("gor"));
}
async function guncellemeKontrol(elle){
  if(/claude\.ai|claudeusercontent/.test(location.hostname)) { if(elle) tost("Bu sürüm zaten en güncel hâliyle açılıyor"); return; }
  const s=await sunucuSurumu();
  if(s&&s!==SURUM){ if(elle) guncelle(); else guncellemeBandi(); return; }
  if(elle) tost(s?"Oyun güncel ✓":"İnternet yok, sonra tekrar dene");
}
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") guncellemeKontrol(false); });
setInterval(()=>guncellemeKontrol(false),10*60*1000);

/* ================= MENÜ ================= */
const Menu={
  async ac(){
    NESIL++; DK_DINLE=null; ETK=[]; KOSUL=[]; HAREKET=[]; kilit=false;
    if(bolum&&bolum.temizle) bolum.temizle();
    await B6.kur(); B6.menuPozu();
    bolum={ guncelle:dt=>B6.arkaGuncelle(dt), temizle:()=>Ses.denizDurdur() };
    katmanTemizle(); hedefEl=null; dkKutu=null;
    const g=Math.floor((Date.now()-BASLANGIC)/864e5);
    katman.appendChild(el(`<div class="menu-ort"></div>`));
    const d=el(`<div class="tam menu" style="justify-content:space-between">
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:2vh">
        <h1 class="logo">Kaan <i>&amp;</i> Kardelen</h1>
        <span class="ust-yazi" style="color:var(--krem);text-shadow:0 1px 10px #000c">${g.toLocaleString("tr-TR")} gündür beraber</span>
      </div>
      <div class="bolumler">
        ${(()=>{ const S=BOLUMLER.find(B=>!bittiMi(B.id)); return S?`<button class="bolum devam-btn" data-id="${S.id}"><span class="no">▶</span><span><b>${BOLUMLER.some(B=>bittiMi(B.id))?"Devam et":"Hikâyeye başla"}</b><small>${S.no}. bölüm · ${S.ad}</small></span></button>`:""; })()}
        <div class="menu-hizli"><button class="mh" id="anilar">💌<span>Anılar</span></button><button class="mh" id="album">📷<span>Albüm</span></button><button class="mh" id="sozluk">📖<span>Sözlük</span></button><button class="mh" id="yarisma">🧠<span>Yarışma</span></button></div>
        <button class="bolum hayat-btn" id="hayat"><span class="no">✦</span><span><b>Bir Gün Birlikte</b><small>Hayat simülatörü · serbest gezinti</small><small class="b-kalp dolu">${(kayit.hayat&&kayit.hayat.gun>1)?`${kayit.hayat.gun-1} gün geçirdiniz · en mutlu %${kayit.hayat.enIyi||0}`:"Yeni · ikinizle bir gün"}</small></span></button>
        ${BOLUMLER.map(B=>`<button class="bolum" data-id="${B.id}"><span class="no">${B.no}</span><span><b>${B.ad}</b><small>${B.tarih} · ${B.alt}</small><small class="b-kalp${kalpBolum(B.id)>=3?" dolu":""}">💗 ${kalpBolum(B.id)} / 3</small></span>${bittiMi(B.id)?'<span class="tik">❤</span>':""}</button>`).join("")}
        <div class="menu-alt">
          <button class="menu-kalp" id="kalpler">💗 ${kalpSayisi()} / ${KALP_TOPLAM} gizli kalp</button>
          ${bittiMi(BOLUMLER[BOLUMLER.length-1].id)?`<button class="btn ince kucuk" id="final">✦ Son sayfa</button>`:""}
          <button class="btn ince kucuk" id="ses">${kayit.ses?"♪":"✕"}</button>
          <button class="btn ince kucuk" id="guncelle" aria-label="Güncellemeleri denetle">⟳ Güncelle</button>
        </div>
      </div>
    </div>`);
    katman.appendChild(d);
    d.querySelectorAll(".bolum").forEach(b=>b.onclick=()=>{ Ses.baslat(); if(b.id==="hayat"){ HayatGiris.ac(); return; } const B=BOLUMLER.find(x=>x.id===b.dataset.id); if(B) bolumAc(B); });
    d.querySelector("#ses").onclick=e=>{ Ses.baslat(); Ses.sesAc(!kayit.ses); e.target.textContent=kayit.ses?"♪":"✕"; };
    d.querySelector("#album").onclick=()=>Album.ac(); AlbumDB.sayi().then(n=>{ const a=d.querySelector("#album span"); if(n&&a) a.textContent=`Albüm (${n})`; });
    d.querySelector("#sozluk").onclick=()=>Sozluk.ac(); d.querySelector("#yarisma").onclick=()=>Yarisma.ac();
    d.querySelector("#anilar").onclick=()=>Anilar.ac();
    d.querySelector("#kalpler").onclick=()=>tost(kalpSayisi()>=KALP_TOPLAM?"Hepsini buldun 💗 Son sayfada bir sürpriz var":"Her bölümde 3 kalp saklı. Serbest gezerken pembe parıltıya yürü 💗",4200);
    d.querySelector("#guncelle").onclick=()=>guncellemeKontrol(true);
    const f=d.querySelector("#final"); if(f) f.onclick=()=>gecis(()=>Final.ac());
    kurulumIpucu();
  }
};
/* ================= ANILARIMIZ: birlikte yaşadıklarımızın zaman çizelgesi ================= */
const Anilar={
  ac(){
    const d=el(`<div class="tam album-ekran"><div class="album-ic">
      <span class="ust-yazi">Anı defteri</span><h2 style="font-size:40px;margin-bottom:2px">Anılarımız</h2>
      <p style="font:italic 18px var(--f-serif);color:rgba(255,243,224,.8);margin:0 0 4px;text-align:center">2 Ağustos 2021'den bugüne, bizim hikâyemiz</p>
      <div class="zaman">${ANILAR.map((a,i)=>`<div class="ani"><div class="tarih">${a.tarih}<span class="yer">${a.yer||""}</span></div><h3>${a.baslik}</h3><p>${a.metin}</p>${a.bolum&&BOLUMLER.find(B=>B.id===a.bolum)?`<button class="btn ince kucuk oyna" data-b="${a.bolum}">▶ Bu anıyı oyna</button>`:""}</div>`).join("")}</div>
      <button class="btn ince kucuk" id="kapat">Kapat</button></div></div>`);
    d.querySelector("#kapat").onclick=()=>d.remove();
    d.querySelectorAll(".oyna").forEach(b=>b.onclick=()=>{ d.remove(); Ses.baslat(); const B=BOLUMLER.find(x=>x.id===b.dataset.b); if(B) bolumAc(B); });
    katman.appendChild(d);
  }
};
/* ================= SON SAYFA ================= */
const Final={
  async ac(){
    NESIL++; DK_DINLE=null; ETK=[]; KOSUL=[]; HAREKET=[]; kilit=false;
    if(bolum&&bolum.temizle) bolum.temizle();
    await B6.kur(); B6.menuPozu(true);
    bolum={ guncelle:dt=>B6.arkaGuncelle(dt), temizle:()=>Ses.denizDurdur() };
    katmanTemizle(); hedefEl=null; dkKutu=null; ustDugmeler();
    const g=Math.floor((Date.now()-BASLANGIC)/864e5);
    const d=el(`<div class="tam" style="justify-content:flex-end"><div class="son-kart mektup">
      <span class="ust-yazi">2 Ağustos 2021'den beri</span>
      <h2 style="font-size:46px">${g.toLocaleString("tr-TR")} gün</h2>
      <p>Bir mesajla başladı bu oyun, bir kumsalda bitti. Arada bir sahil, kılıçlar, kalenin dibinde bir gazoz, bir bileklik ve simli siyah bir keman, şatolar, 46 numaralı bir kuş, kemer takılarak gidilen ilk uzun yol, balonlar, pembe bir elbise, çok uzak bir dağ, bir diploma, boyumu aşan kar, gece yarısı otobüsleri, sahnede yedi dakika yirmi dört saniye ve bitmeyen yollar vardı.</p>
      <p>Hepsinde aynı şey değişmedi: Yanımda sen vardın.</p>
      ${kalpSayisi()>=KALP_TOPLAM?`<p style="color:#ff9fb4">Bütün gizli kalpleri buldun. Zaten hepsi senindi.</p>`:`<p style="font-size:15px;color:var(--sis)">Bölümlere saklanmış ${KALP_TOPLAM-kalpSayisi()} kalp daha var 💗</p>`}
      <p class="imza">Seni seviyorum.<br>— Kaan</p>
      <button class="btn ince kucuk" id="menu">Bölümlere dön</button>
    </div></div>`);
    katman.appendChild(d); d.querySelector("#menu").onclick=()=>gecis(()=>Menu.ac());
  }
};

/* ================= DÖNGÜ ================= */
let onceki=0;
function dongu(t){
  const ham=(t-(onceki||t))/1000; const dt=Math.min(window.__dtMax||.05,ham)*ZAMAN_OLCEK; onceki=t; zaman+=dt; BITKI.ruzgar.value=zaman; cozunurlukAyarla(ham);
  try{
    if(bolum&&bolum.guncelle) bolum.guncelle(dt);
    hikayeGuncelle(dt); kalpGuncelle(dt);
    kameraGuncelle(dt);
    karakterleriGuncelle(dt);
    // gökyüzü kameranın yeni yerini izler, gölge kutusu kameranın baktığı yere oturur (kamera güncellendikten sonra: bir kare geriden gelmesin)
    if(scene){ const g=scene.userData.gok; if(g){ g.position.copy(camera.position); g.material.uniforms.zaman.value=zaman; } golgeKadraj(scene); }
    statikIzle(dt);
    Ses.guncelle();
  }catch(e){ console.error(e); }
  Girdi.aksiyonBas=false;
  if(sonPass) sonPass.uniforms.zaman.value=zaman;
  if(scene&&!YUKLENIYOR&&!window.__cizme){ if(!scene.userData.dengeli) isiklariDengele(scene); if(composer){ // __cizme: yalnız otomatik testlerde (çizim atlanır, mantık çalışır)
    composer.passes[0].scene=scene; composer.passes[0].camera=camera; composer.render(dt); } else renderer.render(scene,camera); }
  yeniProgramlariIgnele();
  if(ICSAHNE&&ICSAHNE.el&&ICSAHNE.el.isConnected){ try{ const r=ICSAHNE.el.getBoundingClientRect(), H=ekranYuksekligi(); const tm=renderer.toneMapping;
    renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.setScissorTest(true); renderer.setViewport(r.left+3,H-r.bottom+3,r.width-6,r.height-6); renderer.setScissor(r.left+3,H-r.bottom+3,r.width-6,r.height-6);
    ICSAHNE.camera.aspect=(r.width-6)/(r.height-6); ICSAHNE.camera.updateProjectionMatrix(); renderer.render(ICSAHNE.scene,ICSAHNE.camera);
    renderer.setScissorTest(false); renderer.setViewport(0,0,innerWidth,ekranYuksekligi()); renderer.toneMapping=tm; }catch(e){ console.error(e); } }
  fotoAl(); kareleriAl();
  requestAnimationFrame(dongu);
}
(async()=>{
  const yk=el(`<div class="yukleme"><div class="yk-ic"><div class="yk-baslik">Kaan <span>&amp;</span> Kardelen</div><div class="yk-cubuk"><i></i></div><div class="yk-yazi">Karakterler hazırlanıyor…</div></div></div>`);
  document.body.appendChild(yk); const cub=yk.querySelector("i");
  try{ await avatarlariYukle(MODEL_KOK,p=>{ cub.style.width=(p*100).toFixed(0)+"%"; }); }
  catch(e){ console.error(e); yk.querySelector(".yk-yazi").textContent="Yüklenemedi. İnternet bağlantını kontrol edip tekrar aç."; return; }
  cub.style.width="100%"; await bekle(250);
  await Menu.ac(); yk.classList.add("bitti"); setTimeout(()=>yk.remove(),900); PERDE.classList.remove("kapali"); requestAnimationFrame(dongu);
  setTimeout(()=>guncellemeKontrol(false),1500); })();
window.__oyun3d={testBasla:(B,kurAd,basAd,arg)=>{ const T=Object.create(B); T.kareler=[]; T.bolumKur=null; const kurF=B[kurAd], basF=B[basAd]; T.kur=async function(){ await kurF.call(this,arg); }; T.basla=async function(){ katmanTemizle(); ustDugmeler(); joystickEkle(); this.btn=aksiyonEkle(); const f=basF||this[basAd]; await f.call(this); window.__segmentBitti=true; }; window.__B=T; bolumAc(T); return T; },B0,B1,BA,BK,B2,BI,BY,B3,B4,B5,BD,B5K,BT,BN,B6,BH,Ag,HayatGiris,BOLUMLER,Album,AlbumDB,Yarisma,Sozluk,Menu,Final,bolumAc,Girdi,kayit,Kamera,camera,get bolum(){return bolum;},get kilit(){return kilit;},get GIZLI(){return GIZLI;},gizliKalpler,joystickEkle,get ETK(){return ETK;},get scene(){return scene;},kalabalik,AVATAR,karakter,kilicYap,kinYap,sapkaYap,eldeTut,uniformaHazirla,kemigeBagla,torenHazirla,kisHazirla,takimHazirla,pembeHazirla,yazHazirla,ceketAktar,bindPoz,eslemeMatris,parcaBagla,TU,Ses,get KARAKTERLER(){return KARAKTERLER;},get renderer(){return renderer;},karakterleriGuncelle,engelIt,engelleriTopla,agac,otlar,hatiraFoto,konus,DM,GECIS_OLC,get STATIK(){return STATIK;}};
})();
</script>
