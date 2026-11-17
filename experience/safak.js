/* Şafak Hattı: a connected, fictional campaign. Legacy operation IDs stay intact. */
(function(root){'use strict';
const VERSION='1.0.0',SAVE='celik-boru-safak-v1',TITLE='Şafak Hattı';
const OPS=Object.freeze([
 {id:'safak-1',chapter:1,n:'İlk Işık',tur:'HAT SAVUNMASI',ford:70,start:{x:62,z:28,h:0},obj:{x:70,z:160,r:40,n:'İleri Karakol'},armor:165,preparation:12,
  story:'Kurgusal Yalçın Vadisi’nde ana haberleşme hattı kesildi. Çelik Börü takımı, ikmal birliği gelene kadar ileri karakolu korumakla görevlendirildi. Bu ilk görevin amacı hattı tutmak; tek başına ileri atılmak değil.',
  emir:'İşaretli mevziye ulaş. Hazırlık süresini kullan, yaklaşan üç dalgayı durdur ve takımını koru. Karakolun yanında mühimmat ve onarım alabilirsin.',
  waves:[{at:35,u:['apc','tank']},{at:25,u:['tank','apc']},{at:30,u:['tank','tank','apc']}],spawn:[[70,720],[35,700],[105,700]],
  phases:[{n:'İşaretli savunma mevzisine ulaş',k:'reach',x:70,z:58,r:28},{n:'Üç dalga boyunca karakolu koru',k:'defend',x:70,z:160},{n:'Hattın tutulduğunu bildir',k:'complete',x:70,z:160}],
  success:'İleri karakol güvende. İkmal birliği vadiye girebilir.',via:[[62,28],[70,84],[70,160],[70,420],[70,720]]},
 {id:'safak-2',chapter:2,n:'Kırık Bağlantı',tur:'KONVOY REFAKATİ',ford:-560,start:{x:-548,z:20,h:0},obj:{x:-610,z:420,r:45,n:'Aktarma İstasyonu'},armor:165,preparation:12,par:660,
  story:'Karakol tutuldu, ancak vadinin batısındaki aktarma istasyonu yakıtsız. Onarım ekibinin ikmal kamyonu geçitte bekliyor. Aracı istasyona ulaştırmadan haberleşme yeniden kurulamayacak.',
  emir:'Batı Geçidi’ni aş, yol karakolundaki tehdidi kaldır. İkmal kamyonuna dön ve aktarma istasyonuna kadar eşlik et. Konvoy senden uzaklaşırsa veya yakın tehdit görürse bekler.',
  outpost:{x:-588,z:290,u:['tank','apc','inf','inf']},qrf:{at:1,u:['tank','apc'],from:[-640,520]},
  escort:{hp:280,speed:5.5,follow:110,route:[[-560,208],[-600,300],[-610,420]]},
  phases:[{n:'Batı Geçidi’nin karşı kıyısına ulaş',k:'reach',x:-560,z:178,r:32},{n:'Yol karakolunu güvene al',k:'clear',x:-588,z:290,r:95,visit:180},{n:'İkmal kamyonunu istasyona ulaştır',k:'escort',x:-610,z:420},{n:'İstasyon çevresinde 5 sn güvenliği sağla',k:'extract',x:-610,z:420,r:50,threat:65,seconds:5},{n:'İkmal teslimini bildir',k:'complete',x:-610,z:420}],
  success:'İkmal ulaştı. İstasyon yeniden çalışıyor; gece görevi için bağlantı kuruldu.',via:[[-548,20],[-560,90],[-560,178],[-600,300],[-610,420]]},
 {id:'safak-3',chapter:3,n:'Gece Feneri',tur:'GECE KEŞFİ',wx:'gece',ford:400,start:{x:392,z:40,h:0},obj:{x:430,z:480,r:55,n:'Karıştırıcı Mevzisi'},armor:165,preparation:12,par:600,
  story:'Onarım ekibi bağlantıyı kurdu, fakat üç karıştırıcı vadiyi yeniden susturuyor. Çelik Börü gece görüşüyle bölgeye girecek, hedefi doğrulayacak ve görevin ardından buluşma noktasına dönecek.',
  emir:'Söğüt Geçidi’ni aş. Hedefi görüş hattında, durarak 5 sn gözetle. Üç karıştırıcı aracını devre dışı bırak ve işaretli buluşma noktasına geri dön.',
  depot:['radar','truck','radar'],guard:{u:['tank','apc','kornet','inf','inf'],r:46},qrf:{at:1,u:['tank','apc'],from:[500,600]},
  phases:[{n:'Söğüt Geçidi’ni geç',k:'reach',x:400,z:200,r:32},{n:'Mevziyi görüş hattında 5 sn gözetle',k:'scan',x:430,z:480,r:240,seconds:5},{n:'Üç karıştırıcı aracını devre dışı bırak',k:'destroy',target:'dep',x:430,z:480},{n:'Buluşma noktasına dön ve 4 sn bekle',k:'extract',x:400,z:200,r:38,threat:55,seconds:4},{n:'Gece görevini raporla',k:'complete',x:400,z:200}],
  success:'Karıştırıcılar sustu, takım geri döndü. Tahliye hattı artık kullanılabilir.',via:[[392,40],[400,108],[400,250],[400,400],[430,480],[400,250],[400,200]]},
 {id:'safak-4',chapter:4,n:'Son Geçit',tur:'TAHLİYE HATTI',ford:660,start:{x:650,z:30,h:0},obj:{x:690,z:640,r:55,n:'Doğu Bataryası'},armor:165,preparation:12,par:900,
  story:'Vadideki son ekip doğu hattında mahsur kaldı. Düşman bataryası geçiş yolunu ateş altında tutuyor. Bataryayı susturmak tek başına yeterli değil: ikmal ve onarım ekibini güvenli bölgeye getirmelisin.',
  emir:'Doğu Geçidi’nden ilerle, bataryayı durarak 4 sn doğrula ve üç obüsü sustur. Bekleyen ikmal aracına eşlik ederek geçitten geri dön. Konvoy güvenli karakola ulaştığında harekât tamamlanır.',
  battery:['arty','arty','arty'],guard:{u:['tank','apc','kornet','inf'],r:62},qrf:{at:1,u:['tank','apc'],from:[740,500]},shell:{x:480,z:20,n:'Taşlıdere tahliye yolu',every:24,fly:6},
  escort:{hp:320,speed:6,follow:110,route:[[690,510],[650,360],[660,185],[660,100],[650,30]]},
  phases:[{n:'Doğu Geçidi’ni aş',k:'reach',x:660,z:185,r:32},{n:'Bataryayı görüş hattında 4 sn doğrula',k:'scan',x:690,z:640,r:280,seconds:4},{n:'Üç obüsü sustur',k:'destroy',target:'bat',x:690,z:640},{n:'İkmal aracını güvenli karakola getir',k:'escort',x:650,z:30},{n:'Tahliye hattını kapat ve rapor ver',k:'complete',x:650,z:30}],
  success:'Şafak Hattı tamamlandı. Ekip ve konvoy güvenli bölgede; vadinin bağlantısı yeniden kuruldu.',via:[[650,30],[660,100],[660,185],[650,360],[690,640],[690,510],[650,360],[660,185],[660,100],[650,30]]}
].map(o=>Object.freeze(o)));
const IDS=OPS.map(o=>o.id),LEGACY=['gecit','tepe','depo','batarya'];
const record=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
function normalise(v){v=record(v);const done={...record(v.done)},stars={...record(v.stars)},best={...record(v.best)};for(const id of IDS){done[id]=done[id]===true||done[id]===1?1:0;stars[id]=Number.isFinite(stars[id])?Math.min(3,Math.max(0,Math.floor(stars[id]))):0;if(!(Number.isFinite(best[id])&&best[id]>0))delete best[id];}
 return {...v,revision:1,selected:IDS.includes(v.selected)?v.selected:IDS[0],view:v.view==='archive'?'archive':'campaign',done,stars,best};}
function merge(a,b){a=normalise(a);b=normalise(b);const out=normalise({...a,...b,done:{...a.done,...b.done},stars:{...a.stars,...b.stars},best:{...a.best,...b.best}});
 for(const id of IDS){out.done[id]=Math.max(a.done[id],b.done[id]);out.stars[id]=Math.max(a.stars[id],b.stars[id]);if(a.best[id]&&b.best[id])out.best[id]=Math.min(a.best[id],b.best[id]);}return out;}
const core=Object.freeze({VERSION,SAVE,TITLE,OPS,IDS,LEGACY,normalise,merge});if(typeof module==='object'&&module.exports)module.exports=core;
const doc=root.document;if(!doc)return;const safe=(f,d)=>{try{return f();}catch(e){return d;}};
let C=normalise(safe(()=>JSON.parse(root.localStorage.getItem(SAVE)),{})),saveError=false,registered=false,installed=false,lastResult=null;
function write(){C=merge(safe(()=>JSON.parse(root.localStorage.getItem(SAVE)),{}),C);try{root.localStorage.setItem(SAVE,JSON.stringify(C));saveError=false;return true;}catch(e){saveError=true;return false;}}
function choose(id){if(!IDS.includes(id))return false;C.selected=id;C.view='campaign';write();root.HisarHarekat.showOperations(IDS);root.HisarHarekat.select(id,'harekat');render();return true;}
function complete(id,stars,time){if(!IDS.includes(id))return false;C.done[id]=1;C.stars[id]=Math.max(C.stars[id]||0,Math.min(3,Math.max(1,stars|0)));if(time>0)C.best[id]=Math.min(C.best[id]||Infinity,time);const saved=write();lastResult={id,stars,time,saved};return saved;}
function el(t,cls,text){const e=doc.createElement(t);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
function render(){const box=doc.getElementById('sf-campaign');if(!box)return;const hk=root.HisarHarekat.diagnostics(),current=OPS.find(o=>o.id===hk.sel)||OPS[0],n=IDS.filter(id=>C.done[id]).length;box.hidden=hk.mode!=='harekat';
 const progress=doc.getElementById('sf-progress');progress.textContent=n+'/4 bölüm · '+IDS.reduce((a,id)=>a+(C.stars[id]||0),0)+'/12 yıldız';
 const title=doc.getElementById('sf-title');title.textContent=C.view==='archive'?'Önceki Harekâtlar':TITLE;
 doc.getElementById('sf-summary').textContent=C.view==='archive'?'Eski dört görevin ve yıldız kayıtların burada korunur.':current.story;
 const toggle=doc.getElementById('sf-archive');toggle.textContent=C.view==='archive'?'Şafak Hattı’na dön':'Önceki harekâtlar';toggle.setAttribute('aria-pressed',String(C.view==='archive'));
 doc.body.dataset.sfView=C.view;const result=doc.getElementById('sf-result');if(lastResult){result.hidden=false;const o=OPS.find(o=>o.id===lastResult.id),next=OPS[o.chapter];doc.getElementById('sf-result-title').textContent=o.n+' tamamlandı · '+'★'.repeat(lastResult.stars);doc.getElementById('sf-result-text').textContent=o.success+(lastResult.saved?'':' İlerleme cihaza yazılamadı.');const b=doc.getElementById('sf-next');b.textContent=next?'Sonraki bölüm: '+next.n:'Hikâyeyi yeniden oyna';b.onclick=()=>{choose((next||OPS[0]).id);safe(()=>doc.getElementById('go').click(),null);};}else result.hidden=true;}
function install(){if(installed||!doc.body||!root.HisarHarekat)return;const tg=doc.getElementById('tg');if(!tg)return;installed=true;const box=el('article');box.id='sf-campaign';const heading=el('div','sf-heading');heading.append(el('small',null,'YENİ HİKÂYE · KURGUSAL HAREKÂT'));const title=el('h2');title.id='sf-title';heading.append(title);const progress=el('span');progress.id='sf-progress';heading.append(progress);box.append(heading);const desc=el('p');desc.id='sf-summary';box.append(desc);
 const actions=el('div','sf-campaign-actions'),select=el('button',null,'Seçili bölümün emrini oku');select.type='button';select.onclick=()=>root.HisarHarekat.brief();const archive=el('button');archive.id='sf-archive';archive.type='button';archive.onclick=()=>{C.view=C.view==='archive'?'campaign':'archive';write();root.HisarHarekat.showOperations(C.view==='archive'?LEGACY:IDS);root.HisarHarekat.select(C.view==='archive'?'gecit':C.selected,'harekat');lastResult=null;render();};actions.append(select,archive);box.append(actions);
 const result=el('section');result.id='sf-result';result.hidden=true;const rh=el('strong');rh.id='sf-result-title';const rp=el('p');rp.id='sf-result-text';const next=el('button');next.id='sf-next';next.type='button';const close=el('button',null,'Kapat');close.type='button';close.onclick=()=>{lastResult=null;render();};result.append(rh,rp,next,close);box.append(result);tg.prepend(box);
 const cards=doc.getElementById('hkCard');if(cards&&root.MutationObserver)new root.MutationObserver(render).observe(cards,{childList:true});render();}
function connect(){if(registered||!root.HisarHarekat||typeof root.HisarHarekat.registerOperations!=='function')return;registered=true;root.HisarHarekat.registerOperations(OPS);root.HisarHarekat.showOperations(C.view==='archive'?LEGACY:IDS);root.HisarHarekat.select(C.view==='archive'?'gecit':C.selected,'harekat');
 const old=root.openMenu;if(typeof old==='function')root.openMenu=function(){const r=old.apply(this,arguments);render();return r;};
 doc.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-op]');if(b&&IDS.includes(b.dataset.op)){C.selected=b.dataset.op;write();lastResult=null;render();}});}
root.HisarSafak=Object.freeze({version:VERSION,core,connect,install,choose,complete,diagnostics:()=>({version:VERSION,selected:C.selected,view:C.view,done:{...C.done},stars:{...C.stars},best:{...C.best},saveError,installed,registered})});
connect();if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',install);else install();doc.addEventListener('hisar:ui-ready',()=>{connect();install();});
})(typeof window!=='undefined'?window:globalThis);
