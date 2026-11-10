/* Kardelen Bloom — personal visual layer, educational progress only. */
(() => {
  'use strict';
  const flower = '<svg viewBox="0 0 80 90" width="52" height="58" aria-hidden="true"><path d="M39 80Q39 57 42 34" stroke="#4b8869" stroke-width="3" fill="none"/><path d="M41 58Q23 46 20 57Q30 65 41 58" fill="#79ae8b"/><path d="M42 37Q19 14 23 6Q43 6 43 37" fill="#fff" stroke="#b7d7c7" stroke-width="2"/><path d="M43 37Q46 7 61 12Q66 28 43 37" fill="#fefafc" stroke="#b7d7c7" stroke-width="2"/><path d="M43 37Q35 16 34 8Q53 11 43 37" fill="#f5e9ee" stroke="#b7d7c7" stroke-width="2"/><circle cx="43" cy="37" r="4" fill="#e9c75d"/></svg>';
  // Original, affectionate messages inspired by the user's tone. No private chat excerpts are published.
  const greetings = [
    'Günaydın minnakım 🌸', 'Yavrumm, bugün de harikasın ♡', 'Aşkım, yeni bir şey öğrenelim mi?',
    'Minnakım, bu defter senin için ✨', 'Güzel bir gün olsun yavrum 🌷',
    'Benim güzel Kardelen’im, hoş geldin', 'Yavrumm, bugün bir çiçek daha açsın',
    'İyi ki varsın minnakım ♡'
  ];
  const letters = [
    ['Yavrummm ♡', 'Bu küçücük defteri senin için hazırladım. Her açtığında yüzünde minicik bir gülümseme olsun istedim.', 'İyi ki varsın minnakım.'],
    ['Minnakım 🌸', 'Sen bir şeyler öğrenirken ben de senin heyecanını görmeyi seviyorum. Bu çiçekler de o güzel heyecanına eşlik etsin.', 'Seni çook seviyorum yavrumm.'],
    ['Aşkımmm ♡', 'Burası sadece ilaç defteri değil; senin için uğraştığım, içine biraz da sevgimi sakladığım küçücük bir yer.', 'Hep gül olur mu minnakım?'],
    ['Benim Kardelen’im 🌷', 'Gün ne kadar yoğun geçerse geçsin, burada seni bekleyen bir çiçek ve sana ait küçücük bir sürpriz var.', 'İyi ki benimlesin yavrumm.'],
    ['Yavrummm ✨', 'Bugün ne öğrendiysen, ne başardıysan seninle gurur duyuyorum. Bir de böyle minik bir not bırakmak istedim.', 'Kocaman seviyorum seni.'],
    ['Minnak kuşum ♡', 'Bu defteri her açtığında seni düşündüğümü hatırla. Bir çiçek daha açsın, sen de biraz daha gül.', 'İyi ki tanımışım seni aşkım.'],
    ['Kardelen’im 🌸', 'Senin adın çiçek gibi ya, uygulamanın her köşesinde bir kardelen açsın istedim. Hepsi sana özel.', 'Seni seviyorum minnakım.'],
    ['Bebekkk ♡', 'Bak, bugün de sana yeni bir sürpriz sakladım. Biraz ders, biraz çiçek, biraz da bizden bir şey olsun.', 'Hep mutlu ol yavrum.']
  ];
  let greetingIndex = 0, letterIndex = -1;
  const greeting = () => greetings[(greetingIndex++) % greetings.length];
  const nextLetter = () => { letterIndex=(letterIndex+1)%letters.length; return letters[letterIndex]; };
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
  // Flower ornaments in the existing red drawer; purely decorative, never block controls.
  const drawer=document.querySelector('#menunav') || document.querySelector('.menu');
  if(drawer){
    drawer.classList.add('bloom-floral-drawer');
    if(!drawer.querySelector('.bloom-drawer-flowers')){
      const flowers=document.createElement('div');
      flowers.className='bloom-drawer-flowers';
      flowers.setAttribute('aria-hidden','true');
      flowers.innerHTML=Array.from({length:7},(_,i)=>'<span class="bloom-drawer-flower bloom-drawer-flower-'+i+'">'+flower+'</span>').join('');
      drawer.prepend(flowers);
    }
  }
  const menuButton=document.querySelector('#navbtn');
  if(menuButton)menuButton.addEventListener('click',()=>{drawer?.classList.remove('bloom-reopen');void drawer?.offsetWidth;drawer?.classList.add('bloom-reopen');});
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-bloom="surprise"]');
    if(!btn)return;
    if(document.querySelector('#bloom-surprise'))return;
    const overlay=document.createElement('div');overlay.id='bloom-surprise';overlay.className='bloom-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Kardelen için küçük bir not');
    const [heading,first,sign]=nextLetter();
    overlay.innerHTML='<div class="bloom-letter"><button class="bloom-close" type="button" aria-label="Sürprizi kapat">×</button><div class="bloom-letter-flower">'+flower+'</div><span class="bloom-eyebrow">SANA ÖZEL · HER AÇIŞTA YENİ BİR NOT</span><h2>'+heading+'</h2><p>'+first+'</p><p class="bloom-sign">'+sign+'</p><button type="button" class="bloom-next-note">Bir not daha oku ♡</button></div>';
    overlay.querySelector('.bloom-next-note').addEventListener('click',()=>{
      const [h,p,s]=nextLetter();
      overlay.querySelector('h2').textContent=h;
      overlay.querySelector('.bloom-letter p:not(.bloom-sign)').textContent=p;
      overlay.querySelector('.bloom-sign').textContent=s;
      overlay.querySelector('.bloom-letter').classList.remove('bloom-letter-refresh');
      void overlay.querySelector('.bloom-letter').offsetWidth;
      overlay.querySelector('.bloom-letter').classList.add('bloom-letter-refresh');
    });
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