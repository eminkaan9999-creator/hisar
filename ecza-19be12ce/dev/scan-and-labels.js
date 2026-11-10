/* Kardelen v8: progressive barcode scanner and shelf labels */
(()=>{'use strict';
const $=s=>document.querySelector(s);
const field=$('[name="barcode"]');
const panel=document.createElement('section');
panel.id='scan-panel';
panel.innerHTML='<h2>Barkod ve raf araçları</h2><p class="hint">Kamera taraması yalnızca tarayıcı destekliyorsa çalışır. Ürün adı ve etken madde barkoddan otomatik doğrulanmaz; bunları kontrol ederek girin.</p><div class="actions"><button type="button" id="scan-start">Kamerayla barkod tara</button><button type="button" id="scan-stop" class="secondary" disabled>Kamerayı kapat</button><button type="button" id="print-shelf" class="secondary">Raf etiketlerini yazdır</button></div><p class="hint" id="scan-status" role="status"></p><video id="scan-video" playsinline muted autoplay hidden style="max-width:100%;width:400px;border-radius:14px;margin-top:12px"></video>';
const sections=document.querySelectorAll('main section');
sections[0].before(panel);
const video=$('#scan-video'), status=$('#scan-status'), start=$('#scan-start'), stop=$('#scan-stop');
let stream=null,active=false,raf=null;
const setStatus=s=>{status.textContent=s;};
function end(){active=false;if(raf)cancelAnimationFrame(raf);raf=null;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}video.srcObject=null;video.hidden=true;start.disabled=false;stop.disabled=true;}
stop.addEventListener('click',()=>{end();setStatus('Kamera kapatıldı.');});
window.addEventListener('pagehide',end);
start.addEventListener('click',async()=>{
 if(!navigator.mediaDevices?.getUserMedia||typeof BarcodeDetector==='undefined'){setStatus('Bu tarayıcıda barkod taraması desteklenmiyor. Barkodu elle girebilirsiniz.');return;}
 let detector;try{detector=new BarcodeDetector({formats:['ean_13','ean_8','code_128','upc_a','upc_e']});}catch{setStatus('Barkod okuyucu başlatılamadı. Barkodu elle girebilirsiniz.');return;}
 try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});video.srcObject=stream;video.hidden=false;await video.play();active=true;start.disabled=true;stop.disabled=false;setStatus('Barkodu kameranın önünde sabit tutun.');}
 catch{end();setStatus('Kamera açılamadı. Tarayıcı izinlerini kontrol edin veya barkodu elle girin.');return;}
 let busy=false;
 const scan=async()=>{if(!active)return;if(!busy&&video.readyState>=2){busy=true;try{const codes=await detector.detect(video);const code=codes.find(x=>/^\d{8,32}$/.test(x.rawValue));if(code){field.value=code.rawValue;field.dispatchEvent(new Event('input',{bubbles:true}));end();setStatus('Barkod okundu: '+code.rawValue+'. Ürün bilgilerini kontrol edin.');field.focus();return;}}catch{}finally{busy=false;}}if(active)raf=requestAnimationFrame(scan);};
 raf=requestAnimationFrame(scan);
});
$('#print-shelf').addEventListener('click',()=>{
 let records=[];try{const raw=JSON.parse(localStorage.getItem('kardelen.inventory.v1')||'[]');if(Array.isArray(raw))records=raw;}catch{}
 const shelves=[...new Set(records.map(x=>typeof x.shelf==='string'?x.shelf.trim():'').filter(Boolean))].sort((a,b)=>a.localeCompare(b,'tr')).slice(0,300);
 if(!shelves.length){setStatus('Önce raf konumu içeren en az bir stok kaydı ekleyin.');return;}
 const popup=window.open('','_blank','noopener,noreferrer');
 if(!popup){setStatus('Yazdırma penceresi engellendi. Açılır pencerelere izin verin.');return;}
 const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 popup.document.write('<!doctype html><html lang="tr"><meta charset="utf-8"><title>Kardelen Raf Etiketleri</title><style>body{font:16px system-ui;margin:20px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.tag{border:2px solid #222;border-radius:10px;padding:20px;min-height:95px;break-inside:avoid}b{font-size:21px}@media print{button{display:none}}</style><button onclick="print()">Yazdır</button><h1>Raf Etiketleri</h1><main>'+shelves.map(s=>'<div class="tag"><small>KARDELEN • RAF KONUMU</small><p><b>'+esc(s)+'</b></p></div>').join('')+'</main></html>');popup.document.close();
 setStatus(shelves.length+' raf etiketi yazdırmaya hazır.');
});
})();