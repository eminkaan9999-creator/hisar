/* HİSAR experience v1.0 — pure, testable helpers; no network, no model API. */
(function(root){
  'use strict';
  const defaults=Object.freeze({quality:'mevcut',autoQuality:true,showFPS:false,largeText:false,voice:false});
  const finite=(x,f=0)=>{const n=Number(x);return Number.isFinite(n)?n:f;};
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,finite(x,a)));
  function settings(value){const v=value&&typeof value==='object'?value:{};return {
    quality:['mevcut','dusuk','orta','yuksek'].includes(v.quality)?v.quality:'mevcut',
    autoQuality:v.autoQuality!==false,showFPS:v.showFPS===true,largeText:v.largeText===true,voice:v.voice===true
  };}
  function normalize(text){return String(text??'').slice(0,500).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');}
  function duration(seconds){const s=Math.floor(clamp(seconds,0,864000));return Math.floor(s/60)+' dk '+s%60+' sn';}
  function sample(value){const v=value||{};return {id:String(v.id||'').slice(0,80),at:String(v.at||'').slice(0,40),activeSeconds:Math.round(clamp(v.activeSeconds,0,864000)),fps:Math.round(clamp(v.fps,0,240)),xp:Math.round(clamp(v.xp,0,1e9)),credits:Math.round(clamp(v.credits,0,1e9))};}
  function reply(text,data){const q=normalize(text),d=sample(data);
    if(!q.trim())return 'Bir oyun sorusu yaz veya aşağıdaki hazır konulardan birini seç.';
    if(/fps|kas|performans|yavas|grafik|kalite/.test(q))return 'Bu oturumun ölçülen ortalama kare hızı: '+(d.fps?d.fps+' FPS':'henüz yeterli ölçüm yok')+'. Ayarlar bölümünde Dengeli veya Akıcı seçebilirsin. Otomatik kalite açıkken, oyun sırasında düşük kare hızı sürerse grafik seviyesi ve çizim çözünürlüğü azaltılır; oyun kuralları değişmez.';
    if(/rapor|oturum|istatistik|degerlendir|puan/.test(q))return 'Aktif oyun süresi: '+duration(d.activeSeconds)+'. Ortalama: '+(d.fps?d.fps+' FPS':'henüz ölçülmedi')+'. Kayıtlı toplam XP: '+d.xp+'; kredi: '+d.credits+'. Bunlar oyundan okunan verilerdir; yapay bir başarı puanı üretmiyorum. Oturum sekmesinden raporunu kaydedebilirsin.';
    if(/ses|konus|oku/.test(q))return 'Ayarlar bölümünden İTİ yanıtlarını seslendir seçeneğini aç. Tarayıcında Türkçe ses varsa onu kullanırım. Ses bulunmazsa yazılı yanıtlar kullanılmaya devam eder.';
    if(/internet|cevrimdisi|baglanti|guncelle/.test(q))return 'İlk açılış ve güncelleme için internet gerekir. Ana oyun ile İTİ ayrı adreslerde önbelleğe alınır. Güncel sürümü almak için oyunun GÜNCELLE düğmesini kullan. Bu yardımcı sorularını bir sunucuya göndermez.';
    if(/yardim|merhaba|neler|kontrol/.test(q))return 'Ben İTİ, çevrimdışı ve kural tabanlı oyun yardımcınım. Performansını açıklayabilir, arayüz ve grafik ayarlarında yardımcı olabilirim. Bu panel açıkken oyun duraklatılır. F2 ile paneli açıp Escape ile kapatabilirsin.';
    return 'Bu konuda doğrulanmış bir oyun yanıtım yok. Performans, grafik ayarları, oturum raporu, seslendirme veya çevrimdışı kullanım hakkında sorabilirsin. Bu sürüm bir üretken yapay zekâ modeline bağlı değil.';
  }
  const api=Object.freeze({version:'1.0.0',defaults,settings,normalize,duration,sample,reply,finite});
  root.HisarExperienceCore=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
