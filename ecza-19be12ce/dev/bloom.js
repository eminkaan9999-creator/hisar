/* Kardelen Bloom — personal visual layer, educational progress only. */
(() => {
  'use strict';
  const flower = '<svg viewBox="0 0 80 90" width="52" height="58" aria-hidden="true"><path d="M39 80Q39 57 42 34" stroke="#4b8869" stroke-width="3" fill="none"/><path d="M41 58Q23 46 20 57Q30 65 41 58" fill="#79ae8b"/><path d="M42 37Q19 14 23 6Q43 6 43 37" fill="#fff" stroke="#b7d7c7" stroke-width="2"/><path d="M43 37Q46 7 61 12Q66 28 43 37" fill="#fefafc" stroke="#b7d7c7" stroke-width="2"/><path d="M43 37Q35 16 34 8Q53 11 43 37" fill="#f5e9ee" stroke="#b7d7c7" stroke-width="2"/><circle cx="43" cy="37" r="4" fill="#e9c75d"/></svg>';
  const greeting = () => {
    const hour = new Date().getHours();
    return hour < 11 ? 'Günaydın Kardelen' : hour < 18 ? 'Güzel bir gün Kardelen' : 'İyi akşamlar Kardelen';
  };
  const flowerCount = () => {
    const fav = D.fav && typeof D.fav === 'object' ? Object.keys(D.fav).filter(id => Object.prototype.hasOwnProperty.call(U,id) && D.fav[id]).length : 0;
    const visits = D.son && Array.isArray(D.son) ? D.son.filter(id => Object.prototype.hasOwnProperty.call(U,id)).length : 0;
    return {fav,visits,petals:Math.min(8,Math.floor((fav+visits)/3))};
  };
  const home = vAra;
  vAra = function(){
    const html=home();
    if (S.q.trim() || S.nav.length) return html;
    return '<section class="bloom-welcome" aria-label="Kardelen karşılama"><span class="bloom-flower">'+flower+'</span><div><span class="bloom-eyebrow">KARDELEN BLOOM</span><h2>'+greeting()+' 🌸</h2><p>Bilginin çiçek açtığı yer. Bugün yeni bir şey keşfetmeye ne dersin?</p></div></section>'+html;
  };
  const notebook=vDefter;
  vDefter=function(){
    const {fav,visits,petals}=flowerCount();
    const progress=Math.round(petals/8*100);
    return '<section class="bloom-garden" aria-label="Öğrenme bahçesi"><div class="bloom-garden-head"><span class="bloom-flower">'+flower+'</span><div><span class="bloom-eyebrow">KARDELEN’İN ÖĞRENME BAHÇESİ</span><h2>Her bilgi bir çiçek 🌷</h2></div></div><p>Favorilerine eklediğin ve tekrar baktığın ürünlerle bahçen gelişiyor.</p><div class="bloom-progress" role="progressbar" aria-label="Bahçe ilerlemesi" aria-valuenow="'+progress+'" aria-valuemin="0" aria-valuemax="100"><span style="width:'+progress+'%"></span></div><p class="bloom-count">'+petals+'/8 yaprak · '+fav+' favori · '+visits+' yakın zamanda görüntülenen ürün</p><p class="hint">Bu, öğrenme motivasyonu içindir; tıbbi yeterlilik ölçümü değildir.</p><button type="button" class="bloom-secret-trigger" data-bloom="surprise">Kardelen’e küçük bir sürpriz ✨</button></section>'+notebook();
  };
  const dock=document.querySelector('.ux-dock');
  if(dock){
    dock.classList.add('bloom-dock');
    const names={ara:'Keşfet',gruplar:'İlaçlar',raflar:'Raflar',defterim:'Bahçem'};
    dock.querySelectorAll('button').forEach(button=>{const label=button.querySelector('span');if(label&&names[button.dataset.id])label.textContent=names[button.dataset.id];});
  }
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-bloom="surprise"]');
    if(!btn)return;
    if(document.querySelector('#bloom-surprise'))return;
    const overlay=document.createElement('div');overlay.id='bloom-surprise';overlay.className='bloom-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Kardelen için küçük bir not');
    overlay.innerHTML='<div class="bloom-letter"><button class="bloom-close" type="button" aria-label="Sürprizi kapat">×</button><div class="bloom-letter-flower">'+flower+'</div><span class="bloom-eyebrow">SANA ÖZEL</span><h2>Sevgili Kardelen 🌸</h2><p>Bu küçük defter, merakının ve öğrendiğin her güzel şeyin yanında olsun diye hazırlandı.</p><p>Her yeni bilgi, senin bahçende açan bir çiçek gibi.</p><p class="bloom-sign">İyi ki varsın. ♡</p></div>';
    document.body.append(overlay);
    const close=()=>{overlay.remove();btn.focus({preventScroll:true});document.removeEventListener('keydown',escClose);};
    const escClose=ev=>{if(ev.key==='Escape')close();};
    overlay.querySelector('.bloom-close').addEventListener('click',close);
    overlay.addEventListener('click',ev=>{if(ev.target===overlay)close();});
    document.addEventListener('keydown',escClose);
    overlay.querySelector('.bloom-close').focus();
  });
  // The splash is decorative and never blocks interaction; no timers or storage resets.
  const splash=document.createElement('div');
  splash.className='bloom-splash';
  splash.setAttribute('aria-hidden','true');
  splash.innerHTML='<span class="bloom-splash-flower">'+flower+'</span><strong>Kardelen’in İlaç Defteri</strong><small>Bilginin çiçek açtığı yer</small>';
  document.body.append(splash);
  splash.addEventListener('animationend',event=>{if(event.target===splash)splash.remove();});
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)splash.remove();
  else setTimeout(()=>splash.remove(),3600);
})();