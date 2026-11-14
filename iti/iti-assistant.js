/* HİSAR İTİ — standalone, offline-first training feedback assistant.
   No tactical targeting or operational planning. */
(function(global){
  "use strict";
  const topics = [
    {pattern:/yardım|neler yapabilirsin|merhaba/i,answer:"Ben İTİ, ÇELİK BÖRÜ eğitim asistanıyım. Eğitim hedeflerini açıklayabilir, oturum sonunda performansını değerlendirebilir ve gelişim önerileri sunabilirim."},
    {pattern:/sürüş|kontrol|manevra/i,answer:"Sürüş eğitiminde kontrollü hız, dengeli yönlendirme ve güvenli duruşa odaklan. Simülasyon sonunda tamamlanan parkur ve hata sayısını karşılaştır."},
    {pattern:/uçangöz|drone|dron|uçuş/i,answer:"Uçuş eğitiminde arayüz hâkimiyeti, istikrarlı kontrol ve güvenli iniş performansını değerlendir. Gerçek uçuşlarda yerel kurallara uy."},
    {pattern:/puan|performans|değerlendir|sonuç/i,answer:"Değerlendirme için oturum verisi gerekir. evaluateSession({durationSeconds,objectivesCompleted,objectivesTotal,errors}) fonksiyonuyla eğitim puanını hesaplayabilirsin."},
    {pattern:/görev|eğitim/i,answer:"Eğitim oturumunda önce kontrolleri öğren, ardından güvenli sürüş veya sanal uçuş parkurunu tamamla. Sonunda gelişim raporunu incele."}
  ];
  function respond(input){
    const text=String(input||"").trim().slice(0,500);
    if(!text)return "Bir eğitim sorusu yazabilirsin.";
    const item=topics.find(x=>x.pattern.test(text));
    return item?item.answer:"Bu konuda henüz doğrulanmış bir eğitim yanıtım yok. Sürüş, uçuş, kontroller veya performans değerlendirmesi hakkında sorabilirsin.";
  }
  function evaluateSession(data){
    const d=data||{};
    const total=Math.max(0,Math.floor(Number(d.objectivesTotal)||0));
    const done=Math.min(total,Math.max(0,Math.floor(Number(d.objectivesCompleted)||0)));
    const errors=Math.max(0,Math.floor(Number(d.errors)||0));
    const seconds=Math.max(0,Number(d.durationSeconds)||0);
    if(!total)return {score:null,summary:"Değerlendirme için en az bir eğitim hedefi tanımlanmalı.",recommendations:["Eğitim hedeflerini belirle."]};
    const score=Math.max(0,Math.round((done/total)*100-Math.min(40,errors*5)));
    const recommendations=[];
    if(done<total)recommendations.push("Tamamlanmayan eğitim hedeflerini yeniden çalış.");
    if(errors)recommendations.push("Hata yapılan kontrolleri düşük tempoda tekrar et.");
    if(!seconds)recommendations.push("Oturum süresini kaydet.");
    if(!recommendations.length)recommendations.push("Bir sonraki oturumda daha tutarlı performans hedefle.");
    return {score,summary:done+"/"+total+" eğitim hedefi tamamlandı; "+errors+" hata kaydedildi.",recommendations};
  }
  global.HisarITI=Object.freeze({respond,evaluateSession,version:"0.1.0"});
})(typeof window!=="undefined"?window:globalThis);
