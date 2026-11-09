/* ================= ALBÜM (IndexedDB), BİLGİ YARIŞMASI, BİZİM SÖZLÜK, GİZLİ KALPLER ================= */

/* ---------- Albüm deposu: fotoğraflar IndexedDB'de (localStorage dolmasın), açılmazsa localStorage yedeği ---------- */
const AlbumDB={
  _p:null,
  ac(){ if(this._p) return this._p;
    this._p=new Promise(r=>{ try{ const q=indexedDB.open("kk-album",1);
      q.onupgradeneeded=()=>{ const d=q.result; if(!d.objectStoreNames.contains("foto")) d.createObjectStore("foto",{keyPath:"ad"}); };
      q.onsuccess=()=>r(q.result); q.onerror=()=>r(null); q.onblocked=()=>r(null); }catch(e){ r(null); } });
    return this._p; },
  async yaz(f){ const d=await this.ac();
    if(!d){ try{ kayit.album=kayit.album||{}; kayit.album[f.ad]=f.veri; kaydet(); }catch(e){} return; }
    await new Promise(r=>{ try{ const t=d.transaction("foto","readwrite"); t.objectStore("foto").put(f); t.oncomplete=r; t.onerror=r; t.onabort=r; }catch(e){ r(); } }); },
  async hepsi(){ const d=await this.ac(); const L=[];
    if(d) await new Promise(r=>{ try{ const q=d.transaction("foto","readonly").objectStore("foto").getAll(); q.onsuccess=()=>{ L.push(...(q.result||[])); r(); }; q.onerror=r; }catch(e){ r(); } });
    if(kayit.album) for(const ad in kayit.album) if(!L.find(x=>x.ad===ad)) L.push({ad,veri:kayit.album[ad],bolum:albumBolumTahmin(ad),zaman:0});
    return L; },
  async sayi(){ return (await this.hepsi()).length; },
  async tasi(){ if(!kayit.album||!Object.keys(kayit.album).length) return; const d=await this.ac(); if(!d) return;
    const eski=kayit.album; for(const ad in eski) await this.yaz({ad,veri:eski[ad],bolum:albumBolumTahmin(ad),zaman:0});
    delete kayit.album; kaydet(); }
};
function albumBolumTahmin(ad){ const s=ad||"";
  const T=[[/2022|İlk buluşma|İlk kahvaltı/,"ilkmesaj"],[/Mezuniyet/,"mezuniyet"],[/Ankara|AŞTİ · Peron|Seğmenler|Kale/,"ankara"],[/Masal Şatosu|Eskişehir/,"eskisehir"],
    [/Kapadokya/,"kapadokya"],[/Bölüm birincisi|Balo|Pembe/,"pembe"],[/Yılbaşı 2026/,"yilbasi"],[/Cudi|Dağda bir gece|Dağdan çiçekler/,"cudi"],[/Patara|Aspendos/,"patara"]];
  for(const [r,id] of T) if(r.test(s)) return id; return null; }
setTimeout(()=>AlbumDB.tasi(),2500);

const Album={
  async ac(){
    const L=await AlbumDB.hepsi();
    const sira=id=>{ const i=BOLUMLER.findIndex(B=>B.id===id); return i<0?999:i; };
    L.sort((a,b)=>sira(a.bolum)-sira(b.bolum)||(a.zaman||0)-(b.zaman||0));
    const gruplar=[]; for(const f of L){ const g=gruplar[gruplar.length-1]; if(g&&g.id===f.bolum) g.L.push(f); else gruplar.push({id:f.bolum,L:[f]}); }
    const ad=id=>{ if(id==="hayat") return "Bir Gün Birlikte · Hayat simülatörü"; const B=BOLUMLER.find(B=>B.id===id); return B?B.ad+" · "+B.tarih:"Diğer kareler"; };
    let sayac=0;
    const d=el(`<div class="tam album-ekran"><div class="album-ic">
      <span class="ust-yazi">Albüm</span><h2 style="font-size:40px;margin-bottom:2px">Hatıralarımız</h2>
      <p class="album-not">${L.length?`${L.length} kare · dokun, büyüt, telefonuna kaydet`:""}</p>
      ${L.length?gruplar.map(g=>`<h3 class="album-baslik">${ad(g.id)}</h3><div class="album-izgara">${g.L.map(f=>`<figure class="polaroid sabit" data-i="${sayac++}"><img src="${f.veri}" alt=""><figcaption>${f.ad}</figcaption></figure>`).join("")}</div>`).join("")
        :`<div class="album-izgara"><p class="bos">Bölümlerde çektiğiniz fotoğraflar burada birikecek.</p></div>`}
      <button class="btn ince kucuk" id="kapat">Kapat</button></div></div>`);
    const duz=gruplar.flatMap(g=>g.L);
    d.querySelector("#kapat").onclick=()=>d.remove();
    d.querySelectorAll("figure").forEach(f=>f.onclick=()=>this.goster(duz,+f.dataset.i));
    katman.appendChild(d);
  },
  goster(L,i){
    const d=el(`<div class="foto-bak"><div class="fb-ust"><span class="fb-sayi"></span><button class="fb-kapat" aria-label="Kapat">✕</button></div>
      <div class="fb-orta"><button class="fb-ok sol" aria-label="Önceki">‹</button><img alt=""><button class="fb-ok sag" aria-label="Sonraki">›</button></div>
      <div class="fb-alt"><b></b><small></small><button class="btn kucuk fb-kaydet">⬇ Telefona kaydet</button></div></div>`);
    const img=d.querySelector("img"), b=d.querySelector(".fb-alt b"), s=d.querySelector(".fb-alt small"), say=d.querySelector(".fb-sayi");
    const goster=()=>{ const f=L[i]; img.src=f.veri; b.textContent=f.ad; const B=BOLUMLER.find(B=>B.id===f.bolum); s.textContent=B?B.ad:""; say.textContent=(i+1)+" / "+L.length; };
    const git=k=>{ i=(i+k+L.length)%L.length; goster(); };
    d.querySelector(".sol").onclick=()=>git(-1); d.querySelector(".sag").onclick=()=>git(1);
    d.querySelector(".fb-kapat").onclick=()=>d.remove();
    d.querySelector(".fb-kaydet").onclick=()=>fotoPaylas(L[i]);
    let x0=null; img.addEventListener("pointerdown",e=>{ x0=e.clientX; }); img.addEventListener("pointerup",e=>{ if(x0!==null&&Math.abs(e.clientX-x0)>40) git(e.clientX<x0?1:-1); x0=null; });
    goster(); katman.appendChild(d);
  }
};
async function fotoPaylas(f){
  const dosya=(f.ad||"hatira").replace(/[^\wçğıöşüÇĞİÖŞÜ ·-]/g,"").replace(/[ ·]+/g,"-").slice(0,60)+".jpg";
  try{ const blob=await (await fetch(f.veri)).blob(); const file=new File([blob],dosya,{type:"image/jpeg"});
    if(navigator.canShare&&navigator.canShare({files:[file]})){ await navigator.share({files:[file],title:f.ad}); return; } }
  catch(e){ if(e&&e.name==="AbortError") return; }
  try{ const a=document.createElement("a"); a.href=f.veri; a.download=dosya; document.body.appendChild(a); a.click(); a.remove(); tost("Fotoğraf indirildi"); }
  catch(e){ tost("Fotoğrafa uzun basıp kaydedebilirsin"); }
}

/* ---------- Kim daha iyi hatırlıyor? İki kişilik, sırayla ---------- */
const SORULAR=[
  {s:"İlk mesaj hangi gün atıldı?", c:["2 Ağustos 2021","29 Ocak 2022","1 Şubat 2021"]},
  {s:"İlk buluşma nerede ve saat kaçtaydı?", c:["İzmit'te saat kulesinin dibinde, 11:00","Ankara'da AŞTİ'de, 20:00","Kastamonu'da kalede, 14:00"]},
  {s:"Mezuniyet töreninde Kaan'ın gözü hep neredeydi?", c:["Tribündeki o yüzde","Kılıcının ucunda","Bandonun önünde"]},
  {s:"Ankara Kalesi'nin dibinde ne içtiniz?", c:["Gazoz","Ayran","Salep"]},
  {s:"Kaan'ın doğum gününde Kardelen kaç numaralı perona geldi?", c:["133","46","26"]},
  {s:"25 Ekim 2024 doğum günü hediyesi neydi?", c:["Kemer","Saat","Cüzdan"]},
  {s:"2024'ün son gününde kargodan ne çıktı?", c:["Bileklik ve iki charm","Kolye","Küpe"]},
  {s:"Kemanın rengi neydi?", c:["Simli siyah","Beyaz","Kahverengi"]},
  {s:"Keman gelince Kardelen ne sordu?", c:["Solakken çalabilir mi diye","Kaç telli diye","Yayı nerede diye"]},
  {s:"İzmit'teki otel odasında iz görünce Kaan ne dedi?", c:["Kuş 46 numara mı giyiyormuş?","Kediye süt verelim","Odayı değiştirelim"]},
  {s:"O izleri bırakan neydi?", c:["Balkondan giren bir kedi","Bir martı","Bir güvercin"]},
  {s:"Kaan ehliyetini aldığı gün nereye gitti?", c:["İzmit'e, trenle","Kastamonu'ya, arabayla","Samsun'a, otobüsle"]},
  {s:"Film izlemeye karar verdiğinizde genelde ne olur?", c:["İkimiz de uyuyakalırız","Sonuna kadar izleriz","Filmi seçemeyiz"]},
  {s:"Kaan yola çıkınca Kardelen'den gelen ilk mesaj nedir?", c:["Kemerini tak","Hızlı gel","Müziği aç"]},
  {s:"İlk uzun yolda deniz kenarında ne çektiniz?", c:["Dans videosu","Timelapse","Belgesel"]},
  {s:"Eskişehir'de hangi yapının önünde fotoğraf çektiniz?", c:["Masal Şatosu","Saat Kulesi","Anıtkabir"]},
  {s:"Kapadokya'da neye bindiniz?", c:["ATV'ye","Sıcak hava balonuna","Ata"]},
  {s:"Baloda Kaan'ın kravatı nasıldı?", c:["Elbisesiyle aynı pembe","Siyah papyon","Lacivert"]},
  {s:"Kardelen törende ne aldı?", c:["Bölüm birincisi plaketi","Onur belgesi","Teşekkür belgesi"]},
  {s:"Dağda telefon en iyi nerede çekiyordu?", c:["Tepede","Konteynerin içinde","Hiçbir yerde"]},
  {s:"Dağdaki konteyner odaya ne dediniz?", c:["Makam odası","Kule","Ev"]},
  {s:"Dağdan hangi çiçekler gönderildi?", c:["Kırmızı gerbera ve okaliptüs","Beyaz güller","Laleler"]},
  {s:"Diploma günü nerede kavuştunuz?", c:["AŞTİ'de","İzmit Otogarı'nda","Kastamonu'da"]},
  {s:"Diploma günü otobüsten inince Kaan ne diye takıldı?", c:["Ankaralı mısın çen","Diplomayı göster","Çok geç kaldın"]},
  {s:"2026 yılbaşında dağda kar ne kadardı?", c:["Boyu aşan","Hiç yağmadı","Bilek hizası"]},
  {s:"Ocak 2026'da Kaan neden gece yarısı otobüsüne bindi?", c:["Bekleyemedi","Tren iptal oldu","Otel dolmuştu"]},
  {s:"Kaan otelde onu beklerken ne yazdı?", c:["Paytak paytak gel","Çabuk gel","Neredesin"]},
  {s:"Nişanda sahnede kaç dakika dans ettiniz?", c:["7 dakika 24 saniye","2 dakika","Yarım saat"]},
  {s:"Patara'da kiralık arabanın vitesi neydi?", c:["Manuel","Otomatik","Yarı otomatik"]},
  {s:"Patara'da toplam kaç fotoğraf çektiniz?", c:["Bin iki yüzden fazla","Yüz kadar","Beş yüz"]},
  {s:"Aspendos'ta ne denediniz?", c:["Fısıltının en üst sıradan duyulmasını","Sahnede şarkı söylemeyi","Taşları saymayı"]},
  {s:"Kaan'ın neredeyse her mesajın sonuna eklediği söz?", c:["Haberin olsun","Tamam mı","Bak bakalım"]},
  {s:"Kardelen kendine ne der?", c:["Keman aşığı","Piyano kurdu","Gitar ustası"]},
  {s:"Kardelen'in gülüşü klavyede nasıl yazılır?", c:["kdkdkd","hahaha","sjsjsj"]}
];
const Yarisma={
  ac(){
    const d=el(`<div class="tam album-ekran yarisma"><div class="album-ic">
      <span class="ust-yazi">İki kişilik</span><h2 style="font-size:38px;margin-bottom:4px">Kim daha iyi hatırlıyor?</h2>
      <div class="yr-govde"></div><button class="btn ince kucuk" id="kapat">Kapat</button></div></div>`);
    d.querySelector("#kapat").onclick=()=>d.remove(); katman.appendChild(d); this.d=d; this.giris(); },
  giris(){ const g=this.d.querySelector(".yr-govde");
    g.innerHTML=`<p class="yr-not">Sırayla soru gelecek. Telefonu birbirinize uzatın, kim daha çok hatırlıyor bakalım.</p>
      <div class="yr-kim"><span>İlk kim başlasın?</span><button class="btn kucuk" data-k="kardelen">Kardelen</button><button class="btn kucuk" data-k="kaan">Kaan</button></div>`;
    g.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>this.basla(b.dataset.k)); },
  basla(ilk){ const havuz=SORULAR.slice().sort(()=>Math.random()-.5).slice(0,12);
    this.durum={havuz,i:0,sira:ilk,puan:{kaan:0,kardelen:0}}; this.soru(); },
  soru(){ const D=this.durum, g=this.d.querySelector(".yr-govde");
    if(D.i>=D.havuz.length) return this.sonuc();
    const q=D.havuz[D.i], sec=q.c.map((t,i)=>({t,dogru:i===0})).sort(()=>Math.random()-.5);
    const kim=D.sira==="kaan"?"Kaan":"Kardelen";
    g.innerHTML=`<div class="yr-skor"><span class="${D.sira==="kardelen"?"aktif":""}">Kardelen <b>${D.puan.kardelen}</b></span><span class="${D.sira==="kaan"?"aktif":""}">Kaan <b>${D.puan.kaan}</b></span></div>
      <div class="yr-sira">Sıra ${D.sira==="kaan"?"Kaan'da":"Kardelen'de"} · ${D.i+1}/${D.havuz.length}</div><h3 class="yr-soru">${q.s}</h3>
      <div class="yr-sec">${sec.map((o,i)=>`<button class="yr-btn" data-i="${i}">${o.t}</button>`).join("")}</div><div class="yr-geri"></div>`;
    g.querySelectorAll(".yr-btn").forEach(b=>b.onclick=()=>{ g.querySelectorAll(".yr-btn").forEach(x=>x.disabled=true);
      const o=sec[+b.dataset.i]; const dogruBtn=g.querySelector(`.yr-btn[data-i="${sec.findIndex(x=>x.dogru)}"]`); dogruBtn.classList.add("dogru");
      const geri=g.querySelector(".yr-geri");
      if(o.dogru){ D.puan[D.sira]++; Ses.efekt("parilti"); geri.textContent=["Aferin 😍","Tam isabet!","Hatırladın 🥹","Bravo!"][Math.floor(Math.random()*4)]; }
      else { b.classList.add("yanlis"); Ses.efekt("vuru",.4); geri.textContent=D.sira==="kaan"?["Ayıp ettin kdkdkd","Şapşik 😄","Unuttun mu yoksa?"][Math.floor(Math.random()*3)]:["Olsun, yine de en güzel sensin","Bir dahakine 😄","Kaan bunu not etti"][Math.floor(Math.random()*3)]; }
      setTimeout(()=>{ D.i++; D.sira=D.sira==="kaan"?"kardelen":"kaan"; this.soru(); },1500); }); },
  sonuc(){ const P=this.durum.puan, g=this.d.querySelector(".yr-govde");
    const t=P.kardelen>P.kaan?["Kardelen kazandı! 👑","Zaten anıları o hep daha iyi hatırlar."]:P.kaan>P.kardelen?["Kaan kazandı! 😎","Bu sefer… Ama rövanş hakkı her zaman var."]:["Berabere 🤝","Aynı anıları aynı yerden hatırlıyorsunuz."];
    Ses.efekt("buyuk"); kayit.yarisma={...P,t:Date.now()}; kaydet();
    g.innerHTML=`<div class="yr-skor son"><span>Kardelen <b>${P.kardelen}</b></span><span>Kaan <b>${P.kaan}</b></span></div><h3 class="yr-soru">${t[0]}</h3><p class="yr-not">${t[1]}</p>
      <button class="btn kucuk" id="tekrar">Rövanş</button>`;
    g.querySelector("#tekrar").onclick=()=>this.giris(); }
};

/* ---------- Bizim sözlük: bölüm bittikçe açılan kartlar ---------- */
const SOZLUK=[
  {k:"Minnakım", a:"Kaan'ın ona en sık dediği söz. Minnacık, minicik, bir tanecik.", b:"ilkmesaj"},
  {k:"Haberin olsun", a:"Kaan'ın neredeyse her mesajın sonuna eklediği imza.", b:"ilkmesaj"},
  {k:"kdkdkd", a:"Kardelen'in gülüşü. Klavyede kahkaha böyle yazılır.", b:"ilkmesaj"},
  {k:"Şapşik", a:"Kardelen'in Kaan'a sevgiyle kızarken dediği.", b:"mezuniyet"},
  {k:"Minikom", a:"Kardelen'in Kaan'a dediği. Minik ama kocaman.", b:"ankara"},
  {k:"Premses", a:"Kardelen'in şakayla Kaan'a taktığı ad.", b:"bileklik"},
  {k:"Çal kemancı", a:"Kardelen'in “hadi bakalım” yerine dediği. Keman gelince anlamı ikiye katlandı.", b:"bileklik"},
  {k:"Kuş 46 numara mı giyiyormuş?", a:"İzmit'te odaya kedi girdiğinde Kaan'ın ilk tepkisi.", b:"kus"},
  {k:"Filmde uyuyoruz ya", a:"Film izleme planlarının değişmeyen sonu.", b:"kus"},
  {k:"Civcivim", a:"Kaan'ın ona, özellikle uykulu hâline dediği.", b:"kus"},
  {k:"Kemerini tak", a:"Kaan ne zaman yola çıksa Kardelen'den gelen ilk mesaj.", b:"uzunyol"},
  {k:"Kocam", a:"Kardelen'in Kaan'a dediği. En güzel unvan.", b:"pembe"},
  {k:"Dağda çay", a:"Dağdan gelen neredeyse her fotoğrafta bir bardak çay vardı.", b:"cudi"},
  {k:"Makam odası", a:"Dağdaki konteyner oda. Kardelen'e göre “kocamın odası”.", b:"cudi"},
  {k:"Ankaralı mısın çen", a:"Diploma günü AŞTİ'de Kaan'ın ona takılması.", b:"diploma"},
  {k:"Sarıldım, uyuduk", a:"Uzaktayken her gece telefonda yapılan ritüel.", b:"yilbasi"},
  {k:"Pıt", a:"Telefondan gönderilen öpücüğün sesi.", b:"yilbasi"},
  {k:"Paytak paytak gel", a:"Kaan'ın otelde onu beklerken yazdığı.", b:"bekleyemedim"},
  {k:"Prova şart", a:"Kardelen'in dans konusundaki kesin kararı.", b:"nisan"},
  {k:"Ralli pilotu", a:"Manuel vitesli arabada Kaan'a takılan lakap.", b:"patara"},
  {k:"Minik kaplumbağa", a:"Patara'da carettaları görünce Kaan'ın yeni adı.", b:"patara"},
  {k:"Fotoğrafçım", a:"Bin iki yüz fotoğrafın sorumlusu.", b:"patara"}
];
function bittiMi(id){ return !!(kayit.bittiId&&kayit.bittiId[id]); }
const Sozluk={
  ac(){ const acik=s=>!s.b||bittiMi(s.b)||!BOLUMLER.find(B=>B.id===s.b); const n=SOZLUK.filter(acik).length;
    const d=el(`<div class="tam album-ekran"><div class="album-ic">
      <span class="ust-yazi">${n} / ${SOZLUK.length} kelime</span><h2 style="font-size:40px;margin-bottom:2px">Bizim sözlük</h2>
      <p class="album-not">Sadece ikimizin anladığı kelimeler. Bölümleri bitirdikçe yenileri açılır.</p>
      <div class="sozluk">${SOZLUK.map(s=>{ const B=BOLUMLER.find(B=>B.id===s.b); return acik(s)?`<div class="sz-kart"><b>${s.k}</b><p>${s.a}</p>${B?`<small>${B.ad}</small>`:""}</div>`:`<div class="sz-kart kilit"><b>🔒</b><p>“${B.ad}” bölümünü bitirince açılır.</p></div>`; }).join("")}</div>
      <button class="btn ince kucuk" id="kapat">Kapat</button></div></div>`);
    d.querySelector("#kapat").onclick=()=>d.remove(); katman.appendChild(d); }
};

/* ---------- Gizli kalpler: her bölümde üç tane saklı; yakınından geçince toplanır ---------- */
let KALP_TOPLAM=45;
let GIZLI=[];
function kalpGeo(){ if(kalpGeo.g) return kalpGeo.g;
  const s=new THREE.Shape(); s.moveTo(0,.06); s.bezierCurveTo(0,.06,-.02,.15,-.1,.15); s.bezierCurveTo(-.2,.15,-.2,.03,-.2,.03); s.bezierCurveTo(-.2,-.04,-.12,-.12,0,-.19);
  s.bezierCurveTo(.12,-.12,.2,-.04,.2,.03); s.bezierCurveTo(.2,.03,.2,.15,.1,.15); s.bezierCurveTo(.03,.15,0,.06,0,.06);
  const g=new THREE.ExtrudeGeometry(s,{depth:.05,bevelEnabled:true,bevelThickness:.03,bevelSize:.025,bevelSegments:4,curveSegments:16}); g.center(); kalpGeo.g=g; return g; }
function kalpSayisi(){ return Object.keys(kayit.kalpler||{}).length; }
function kalpBolum(id){ return Object.keys(kayit.kalpler||{}).filter(k=>k.startsWith(id+":")).length; }
function gizliKalpler(B,noktalar){ // noktalar: [[x,y,z,no],...] — no bölüm içinde sabit (0,1,2)
  if(!scene||!B||!B.id) return; kayit.kalpler=kayit.kalpler||{};
  for(const p of noktalar){ const id=B.id+":"+p[3]; if(kayit.kalpler[id]||GIZLI.some(g=>g.userData.kalpId===id&&g.parent===scene)) continue;
    const g=new THREE.Group(); const m=new THREE.Mesh(kalpGeo(),new THREE.MeshStandardMaterial({color:renk("#ff4f7f"),emissive:renk("#ff2f6a"),emissiveIntensity:.55,roughness:.3,metalness:.1}));
    m.castShadow=true; g.add(m); const p2=parilti("#ff8fb0",.9); g.add(p2);
    g.position.set(p[0],p[1],p[2]); g.userData={kalpId:id,y0:p[1],f:Math.random()*6,bolumId:B.id}; scene.add(g); GIZLI.push(g); } }
function kalpGuncelle(dt){
  if(!GIZLI.length) return; GIZLI=GIZLI.filter(g=>(g.parent===scene&&!g.userData.alindi)||(g.userData.anim!==undefined&&g.parent));
  const o=bolum&&(bolum.oyuncu||bolum.kaan); const v=new THREE.Vector3();
  for(const g of GIZLI){ const u=g.userData;
    if(u.anim!==undefined){ u.anim+=dt; g.scale.setScalar(1+u.anim*2); g.position.y+=dt*1.2; g.children[0].material.opacity=Math.max(0,1-u.anim*1.4); g.children[0].material.transparent=true;
      if(u.anim>.75){ g.parent&&g.parent.remove(g); u.anim=undefined; } continue; }
    g.rotation.y+=dt*1.6; g.position.y=u.y0+Math.sin(zaman*2+u.f)*.07;
    if(!o||kilit||o.parent!==scene) continue; o.getWorldPosition(v);
    if(Math.hypot(v.x-g.position.x,v.z-g.position.z)<.85&&Math.abs(v.y+.9-g.position.y)<1.6){
      u.alindi=true; u.anim=0; kayit.kalpler=kayit.kalpler||{}; kayit.kalpler[u.kalpId]=Date.now(); kaydet(); Ses.efekt("parilti"); Ses.efekt("kalp",.6);
      const n=kalpSayisi(); tost(n>=KALP_TOPLAM?"💗 Bütün gizli kalpleri buldun! Son sayfaya bak":"💗 Gizli kalp bulundu · "+n+" / "+KALP_TOPLAM); } }
}
