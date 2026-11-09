/* ================= ÇEVRİMİÇİ: İKİMİZ BİRLİKTE =================
   İki telefon aynı oda koduyla buluşur. Mesajlar hesap gerektirmeyen açık MQTT aracıları üzerinden (WebSocket) taşınır;
   iki aracıya birden bağlanılır, hangisi açıksa oradan gider (aynı mesaj iki kez gelirse biri atılır). Giden: yalnızca
   karakterin konumu, yönü ve oyun olayları (etkinlik başladı, seçim, deklanşör...). Kişisel bilgi gönderilmez. */
const AG_ARACI=["wss://broker.emqx.io:8084/mqtt","wss://broker.hivemq.com:8884/mqtt"];
const AG_KONU="kaankardelen-9b4bc121/oda/";
// en sade MQTT 3.1.1 istemcisi: bağlan, tek konuya abone ol, QoS 0 yayınla, 20 sn'de bir ping; kopunca kendiliğinden yeniden bağlanır
function mqttBag(url,istemci,konu,gelen,durum){
  const E=new TextEncoder(), C=new TextDecoder(); let ws=null, acik=false, ping=null, kapandi=false, tekrar=0, zaman=null, sonGelen=0;
  const uz=n=>{ const b=[]; do{ let x=n%128; n=Math.floor(n/128); if(n>0) x|=128; b.push(x); }while(n>0); return b; };
  const yazi=s=>{ const u=E.encode(s); return [u.length>>8,u.length&255,...u]; };
  const paket=(bas,govde)=>{ const h=uz(govde.length), p=new Uint8Array(1+h.length+govde.length); p[0]=bas; p.set(h,1); p.set(govde,1+h.length); return p; };
  const ham=p=>{ try{ if(ws&&ws.readyState===1){ ws.send(p); return true; } }catch(e){} return false; };
  const yeniden=()=>{ if(kapandi) return; clearTimeout(zaman); zaman=setTimeout(baglan,Math.min(9000,700*(++tekrar))); };
  // ölü bağlantıyı bırakıp hemen yeniden bağlan (telefon kilitlenip açılınca soket açık görünüp ölmüş olabilir)
  const tazele=()=>{ if(kapandi) return; const s=ws; ws=null; clearInterval(ping); if(s){ s.onclose=s.onmessage=s.onerror=null; try{ s.close(); }catch(e){} } if(acik){ acik=false; durum&&durum(false); } clearTimeout(zaman); tekrar=0; baglan(); };
  function baglan(){ if(kapandi) return; let s; try{ s=new WebSocket(url,["mqtt"]); }catch(e){ return yeniden(); } ws=s; s.binaryType="arraybuffer"; let tampon=new Uint8Array(0);
    s.onopen=()=>{ ham(paket(0x10,[...yazi("MQTT"),4,2,0,40,...yazi(istemci)])); };
    s.onmessage=e=>{ sonGelen=performance.now(); const d=new Uint8Array(e.data), t=new Uint8Array(tampon.length+d.length); t.set(tampon); t.set(d,tampon.length); tampon=t;
      while(tampon.length>=2){ let i=1, m=1, L=0, b; do{ if(i>=tampon.length) return; b=tampon[i++]; L+=(b&127)*m; m*=128; }while(b&128);
        if(tampon.length<i+L) return; const tip=tampon[0]>>4, g=tampon.subarray(i,i+L);
        if(tip===2){ if(g[1]===0){ acik=true; tekrar=0; ham(paket(0x82,[0,1,...yazi(konu),0])); clearInterval(ping); sonGelen=performance.now(); ping=setInterval(()=>{ if(performance.now()-sonGelen>50000) return tazele(); ham(new Uint8Array([0xC0,0])); },20000); durum&&durum(true); } }
        else if(tip===3){ const tl=(g[0]<<8)|g[1], qos=(tampon[0]>>1)&3; const o=2+tl+(qos>0?2:0); try{ gelen(C.decode(g.subarray(o))); }catch(er){} }
        tampon=tampon.slice(i+L); } };
    s.onerror=()=>{ try{ s.close(); }catch(e){} };
    s.onclose=()=>{ if(ws!==s) return; clearInterval(ping); if(acik){ acik=false; durum&&durum(false); } ws=null; yeniden(); }; }
  baglan();
  return { gonder(m){ if(!acik) return false; return ham(paket(0x30,[...yazi(konu),...E.encode(m)])); }, get acik(){ return acik; },
    yokla(){ if(kapandi) return; if(!acik||performance.now()-sonGelen>25000) tazele(); },
    kapat(){ kapandi=true; clearInterval(ping); clearTimeout(zaman); const s=ws; ws=null; try{ if(s&&s.readyState===1) s.send(new Uint8Array([0xE0,0])); s&&s.close(); }catch(e){} } };
}
const Ag={ baglar:[], id:Math.random().toString(36).slice(2,10), kod:null, gorulen:new Map(), dinle:null, esSon:0, oncekiSon:0, sira:0, sonGonder:0, nabiz:null,
  ac(kod){ this.kapat(); this.kod=kod; this.esSon=0; const urls=window.__kkAraci||AG_ARACI;
    this.baglar=urls.map((u,i)=>mqttBag(u,"kk"+this.id+i,AG_KONU+kod,m=>this.al(m)));
    // bir şey göndermediğimiz saniyelerde küçük bir "buradayım" (sahne ve konuşma sırasında eş bizi kopmuş sanmasın)
    this.nabiz=setInterval(()=>{ if(performance.now()-this.sonGonder>900) this.gonder({t:"h"}); },1000);
    if(!this._gorunur){ this._gorunur=1; document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") for(const b of this.baglar) b.yokla(); }); } },
  gonder(o){ if(!this.baglar.length) return false; this.sonGonder=performance.now(); o.i=this.id; o.q=++this.sira; const m=JSON.stringify(o); let ok=false; for(const b of this.baglar) ok=b.gonder(m)||ok; return ok; },
  al(m){ let o; try{ o=JSON.parse(m); }catch(e){ return; } if(!o||o.i===this.id) return; // aracı kendi mesajımızı da geri yollar
    const k=o.i+":"+o.q; if(this.gorulen.has(k)) return; this.gorulen.set(k,1);
    if(this.gorulen.size>600){ const it=this.gorulen.keys(); for(let j=0;j<300;j++) this.gorulen.delete(it.next().value); }
    this.oncekiSon=this.esSon; this.esSon=performance.now(); this.esId=o.i; if(this.dinle) try{ this.dinle(o); }catch(e){ console.error(e); } },
  get bagli(){ return this.baglar.some(b=>b.acik); },
  get esCanli(){ return performance.now()-this.esSon<6000; },
  kapat(){ clearInterval(this.nabiz); this.nabiz=null; for(const b of this.baglar) b.kapat(); this.baglar=[]; this.kod=null; this.dinle=null; } };
// oda kurma / katılma ekranları
const HayatGiris={
  ac(){ hbStil(); const d=el(`<div class="tam hb-giris"><div class="kart">
      <span class="ust-yazi">Hayat simülatörü</span><h2>Bir Gün Birlikte</h2><p>Göl kenarında ikinizin günü: kafe, sinema, gün batımı…</p>
      <button class="btn" id="cift">💞 İkimiz birlikte (çevrimiçi)</button>
      <button class="btn ince" id="tek">🚶 Tek başıma oyna</button>
      <button class="btn ince kucuk" id="kapat">Vazgeç</button></div></div>`); katman.appendChild(d);
    d.querySelector("#tek").onclick=()=>{ d.remove(); Ag.kapat(); BH.ag=null; bolumAc(BH); };
    d.querySelector("#cift").onclick=()=>{ d.remove(); this.cift(); };
    d.querySelector("#kapat").onclick=()=>d.remove(); },
  cift(){ const d=el(`<div class="tam hb-giris"><div class="kart"><span class="ust-yazi">İkimiz birlikte</span><h2>Oda</h2>
      <p>Biriniz oda kursun, öbürü kodu girip katılsın. İkinizin de internete bağlı olması yeter.</p>
      <button class="btn" id="kur">🏠 Oda kur</button><button class="btn ince" id="katil">🔑 Odaya katıl</button><button class="btn ince kucuk" id="geri">Geri</button></div></div>`); katman.appendChild(d);
    d.querySelector("#kur").onclick=()=>{ d.remove(); this.kur(); }; d.querySelector("#katil").onclick=()=>{ d.remove(); this.katil(); }; d.querySelector("#geri").onclick=()=>{ d.remove(); this.ac(); }; },
  kur(){ const d=el(`<div class="tam hb-giris"><div class="kart"><span class="ust-yazi">Oda kur</span><h2>Kimi oynayacaksın?</h2>
      <div class="hb-iki"><button class="btn" data-k="kaan">Kaan</button><button class="btn" data-k="kardelen">Kardelen</button></div><button class="btn ince kucuk" id="geri">Geri</button></div></div>`); katman.appendChild(d);
    d.querySelector("#geri").onclick=()=>{ d.remove(); this.cift(); };
    d.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{ d.remove(); this.bekle(b.dataset.k); }); },
  bekle(ben){ const kod=String(1000+Math.floor(Math.random()*9000)); Ag.ac(kod); const es=ben==="kaan"?"Kardelen":"Kaan";
    const d=el(`<div class="tam hb-giris"><div class="kart"><span class="ust-yazi">Oda kodu</span><h2 class="hb-kod">${kod}</h2>
      <p>Bu kodu ${es==='Kaan'?"Kaan'a":"Kardelen'e"} gönder. O, menüden <b>Bir Gün Birlikte → İkimiz birlikte → Odaya katıl</b>'a girip kodu yazacak.</p>
      <button class="btn" id="paylas">📤 Kodu gönder</button><p class="hb-durum">Bağlanıyor…</p><button class="btn ince kucuk" id="iptal">Vazgeç</button></div></div>`); katman.appendChild(d);
    const durum=d.querySelector(".hb-durum"); const gun=(kayit.hayat&&kayit.hayat.gun)||1;
    d.querySelector("#paylas").onclick=async()=>{ const metin=`Bir Gün Birlikte'de buluşalım 💞 Oda kodu: ${kod}`; try{ if(navigator.share){ await navigator.share({text:metin}); return; } }catch(e){ return; } try{ await navigator.clipboard.writeText(metin); tost("Kod kopyalandı"); }catch(e){ tost("Kod: "+kod); } };
    let bitti=false; const yayin=setInterval(()=>{ if(bitti) return; Ag.gonder({t:"oda",k:ben,g:gun}); durum.textContent=Ag.bagli?`${es} bekleniyor…`:"Bağlanıyor…"; },1500);
    Ag.dinle=o=>{ if(bitti||o.t!=="katil") return; bitti=true; clearInterval(yayin); const tohum=Math.floor(Math.random()*1e9);
      for(let i=0;i<3;i++) setTimeout(()=>Ag.gonder({t:"tamam",k:ben,g:gun,s:tohum}),i*400);
      durum.textContent=`${es} geldi 💞`; setTimeout(()=>{ d.remove(); BH.ag={ben,host:true,kod,tohum,gun}; bolumAc(BH); },900); };
    d.querySelector("#iptal").onclick=()=>{ bitti=true; clearInterval(yayin); Ag.kapat(); d.remove(); this.cift(); }; },
  katil(){ const d=el(`<div class="tam hb-giris"><div class="kart"><span class="ust-yazi">Odaya katıl</span><h2>Oda kodu</h2>
      <input class="hb-girdi" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="••••" autocomplete="off">
      <button class="btn" id="tamam">Katıl</button><p class="hb-durum"></p><button class="btn ince kucuk" id="geri">Geri</button></div></div>`); katman.appendChild(d);
    const g=d.querySelector("input"), durum=d.querySelector(".hb-durum"); setTimeout(()=>g.focus(),200);
    let dongu=null, bitti=false, sayac=null;
    const dur=()=>{ clearInterval(dongu); clearTimeout(sayac); };
    d.querySelector("#tamam").onclick=()=>{ const kod=(g.value||"").replace(/\D/g,""); if(kod.length!==4){ durum.textContent="4 haneli kodu yaz"; return; }
      dur(); Ag.ac(kod); durum.textContent="Oda aranıyor…";
      dongu=setInterval(()=>{ if(!bitti) Ag.gonder({t:"katil"}); if(!Ag.bagli) durum.textContent="Bağlanıyor…"; else durum.textContent="Oda aranıyor…"; },1200);
      sayac=setTimeout(()=>{ if(bitti) return; dur(); durum.textContent="Oda bulunamadı. Kod doğru mu, oda açık mı?"; },30000);
      Ag.dinle=o=>{ if(bitti) return; if(o.t==="oda") Ag.gonder({t:"katil"}); if(o.t!=="tamam") return; bitti=true; dur();
        const ben=o.k==="kaan"?"kardelen":"kaan"; durum.textContent="Buldum 💞"; setTimeout(()=>{ d.remove(); BH.ag={ben,host:false,kod,tohum:o.s,gun:o.g||1,atla:!!o.ic}; bolumAc(BH); },600); }; };
    d.querySelector("#geri").onclick=()=>{ bitti=true; dur(); Ag.kapat(); d.remove(); this.cift(); }; }
};
// basit tohumlu rastgele (iki telefonda aynı sırayla aynı sayılar: aynı sahne, aynı sözler)
function hbRng(t){ let a=t>>>0||1; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t2=Math.imul(a^a>>>15,1|a); t2=t2+Math.imul(t2^t2>>>7,61|t2)^t2; return ((t2^t2>>>14)>>>0)/4294967296; }; }
