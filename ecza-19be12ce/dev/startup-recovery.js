/* Kardelen startup recovery. No storage or service-worker deletion. */
(function(){
 'use strict';
 var seenErrors=[];
 function notice(){
   if(document.getElementById('ecza-recovery'))return;
   var view=document.getElementById('view');
   if(view && view.textContent && view.textContent.trim().length>25)return;
   var box=document.createElement('section');
   box.id='ecza-recovery';
   box.setAttribute('role','alert');
   box.style.cssText='position:fixed;z-index:2147483646;inset:0;overflow:auto;display:flex;align-items:center;justify-content:center;background:#f6f6f8;color:#25252b;padding:24px;font:16px/1.5 system-ui,-apple-system,sans-serif';
   box.innerHTML='<div style="max-width:440px;background:#fff;border:1px solid #e3e3e9;border-radius:20px;padding:24px;box-shadow:0 12px 40px #0002"><h1 style="font-size:25px;margin:0 0 10px">İlaç Defteri açılamadı</h1><p>Uygulama başlatılamadı. İnternet bağlantınızı kontrol edin veya güvenli yeniden yüklemeyi deneyin.</p><p style="font-size:13px;color:#666">Notlarınız, favorileriniz ve stok kayıtlarınız silinmez.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button id="ecza-retry" style="background:#bd2433;color:white;border:0;border-radius:12px;padding:12px 18px;font:600 16px system-ui;min-height:48px">Yeniden dene</button><button id="ecza-support" style="background:#eee;border:0;border-radius:12px;padding:12px 18px;font:600 16px system-ui;min-height:48px">Hata bilgisini göster</button></div><pre id="ecza-diagnostic" hidden style="white-space:pre-wrap;word-break:break-word;background:#f4f4f6;padding:10px;border-radius:10px;font-size:12px"></pre></div>';
   document.body.appendChild(box);
   document.getElementById('ecza-retry').addEventListener('click',async function(){
     this.disabled=true;this.textContent='Güncelleniyor…';
     try{if(navigator.serviceWorker){var reg=await navigator.serviceWorker.getRegistration();if(reg)await Promise.race([reg.update(),new Promise(function(resolve){setTimeout(resolve,2500)})]);}}catch(e){}
     var u=new URL(location.href);u.searchParams.set('reload',Date.now().toString());location.replace(u.href);
   });
   document.getElementById('ecza-support').addEventListener('click',function(){
     var p=document.getElementById('ecza-diagnostic');p.hidden=!p.hidden;
     p.textContent='Sürüm: '+(window.ECZ&&window.ECZ.surum||'bilinmiyor')+'\nÇevrimiçi: '+navigator.onLine+'\nHatalar: '+(seenErrors.slice(-3).join(' | ')||'Bilinmiyor')+'\nTarayıcı: '+navigator.userAgent.slice(0,180);
   });
 }
 window.addEventListener('error',function(e){seenErrors.push(String(e.message||'JavaScript hatası').slice(0,200));});
 window.addEventListener('unhandledrejection',function(e){seenErrors.push(String(e.reason&&e.reason.message||'Başlatma hatası').slice(0,200));});
 function check(){setTimeout(notice,7000);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',check,{once:true});else check();
})();
