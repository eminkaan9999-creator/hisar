/* One deployment, one persistent convoy and six causal orders on the same map. */
(function(root){'use strict';
const VERSION='1.1.0',ID='eve-donus',KEY='celik-boru-eve-donus-v1';
const OP=Object.freeze({id:ID,n:'Eve Dönüş',tur:'KONVOY KURTARMA',continuous:true,ford:-560,armor:180,preparation:15,
 start:{x:-548,z:20,h:0},obj:{x:-605,z:360,r:45,n:'Mahsur Kalan Konvoy'},
 story:'Batı yolundaki onarım konvoyuyla bağlantı kesildi. Ekip hayatta, araç hareket edemiyor. Çelik Börü’nün tek amacı ekibi bulup aynı araçla karakola geri getirmek. Yolun açılması, yerinde onarım ve dönüş birbirinin devamıdır; harita ve araç durumları sıfırlanmaz.',
 emir:'Toplanma noktasına ilerle, geçitteki pusuyu kaldır ve konvoyu bul. Ekibin onarımı bitirmesi için çevresinde kal. Araç hazır olduğunda aynı yoldan karakola kadar refakat et; dönüşteki karşı taarruzu durdur. Yalnızca konvoy ve sen güvenli bölgeye ulaştığında harekât tamamlanır.',
 waves:[{at:10,u:['apc']},{at:16,u:['tank','apc']}],spawn:[[-690,600],[-530,610]],
 qrf:{at:4,u:['tank','apc'],from:[-650,340],when:{x:-580,z:220,r:70},message:'Dönüş yolunda düşman takviyesi görüldü. Konvoyu koru; işaretlenen araçlar temizlenmeden teslim tamamlanmaz.'},
 escort:{hp:320,h:Math.PI,speed:5.5,follow:110,route:[[-605,360],[-600,300],[-560,208],[-560,178],[-560,90],[-548,20]]},
 rating:'convoy',
 phases:[
  {n:'Toplanma noktasına ilerle',why:'Takımınla batı yoluna gir. Konvoyun son konumuna buradan ulaşabilirsin.',k:'reach',x:-560,z:82,r:24},
  {n:'Geçitteki pusuyu kaldır',why:'Onarım ekibine ulaşmak ve dönüş yolunu açmak için geçit temizlenmeli.',k:'clear',x:-572,z:236,r:110,visit:130,spawn:[{type:'apc',x:-584,z:270,h:Math.PI},{type:'inf',x:-596,z:258,h:Math.PI},{type:'inf',x:-558,z:275,h:Math.PI}]},
  {n:'Mahsur kalan konvoyu tespit et',why:'Aracı görüş hattında bul; 4 saniye durarak ekiple bağlantı kur.',k:'scan',x:-605,z:360,r:150,seconds:4},
  {n:'Yerinde onarımı koru',why:'Ekip, konvoyun 65 m yakınındayken 12 saniyede onarımı bitirir. Uzaklaşırsan veya tehlike yaklaşırsa işe ara verir. Ekip kaldığı yerden devam eder. Dönüş için iki grubun da bölgeden temizlenmesi gerekir.',k:'defend',x:-605,z:360,r:65,seconds:12,local:true},
  {n:'Konvoyla birlikte karakola dön',why:'Konvoy 110 m içinde takip eder; yakın tehditte durur. Dönüşte çıkan takviyeyi temizle.',k:'escort',x:-548,z:20,clearAll:true},
  {n:'Güvenli bölgede teslimi tamamla',why:'Konvoy ve tank karakolda olmalı. Bölgeyi 5 saniye güvenli tut.',k:'extract',x:-548,z:20,r:50,threat:90,seconds:5,requireConvoy:true},
  {n:'Konvoy teslim edildi',k:'complete',x:-548,z:20}
 ],
 success:'Konvoy ve onarım ekibi karakola ulaştı. Eve Dönüş tamamlandı.',
 via:[[-548,20],[-560,82],[-560,178],[-572,236],[-600,300],[-605,360],[-600,300],[-560,178],[-548,20]]});
const num=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
const vehicleCore=typeof module==='object'&&module.exports?require('./checkpoint.js'):root.HisarCheckpoint&&root.HisarCheckpoint.core;
function normalise(v){
 if(!v||v.schema!==1||v.rules!==1||v.operation!==ID||!num(v.updatedAt,0,1e15)||!num(v.sessionStartedAt,0,1e15))return null;
 const base={schema:1,rules:1,operation:ID,updatedAt:v.updatedAt,sessionStartedAt:v.sessionStartedAt};
 if(v.removed===true)return {...base,removed:true};
 if(![2,3,4,5].includes(v.phase)||!v.convoy||!num(v.convoy.hp,.001,320))return null;
 const value=vehicleCore&&vehicleCore.payload(v);return value?{...base,...value,phase:v.phase,convoy:{hp:v.convoy.hp}}:null;
}
function latest(a,b){a=normalise(a);b=normalise(b);if(!a)return b;if(!b)return a;return b.updatedAt>a.updatedAt||b.updatedAt===a.updatedAt&&b.removed?b:a;}
const core=Object.freeze({VERSION,ID,KEY,OP,normalise,latest});if(typeof module==='object'&&module.exports)module.exports=core;
const doc=root.document;if(!doc)return;const safe=(f,d)=>{try{return f();}catch(e){return d;}};
let error=null,registered=false,installed=false;
const stored=()=>normalise(safe(()=>JSON.parse(root.localStorage.getItem(KEY)),null));
function read(){const v=stored();return v&&!v.removed?v:null;}
function write(value,prepare){const old=stored(),v=normalise(value);if(!v){error='invalid';return false;}if(old&&old.sessionStartedAt>v.sessionStartedAt){error='stale';return false;}
 v.updatedAt=Math.max(Date.now(),old?old.updatedAt+1:0);try{if(typeof prepare==='function')prepare();root.localStorage.setItem(KEY,JSON.stringify(v));error=null;safe(()=>doc.dispatchEvent(new root.CustomEvent('hisar:campaign-checkpoint')),null);return true;}catch(e){error='storage';return false;}}
function clear(sessionStartedAt){return write({schema:1,rules:1,operation:ID,updatedAt:Date.now(),sessionStartedAt,removed:true});}
const archive=()=>[...root.HisarSafak.core.IDS,...root.HisarSafak.core.LEGACY];
function choose(){root.HisarHarekat.showOperations([ID]);root.HisarHarekat.select(ID,'harekat');render();return true;}
function render(){const box=doc.getElementById('sf-campaign');if(!box)return false;const hk=root.HisarHarekat.diagnostics(),primary=hk.sel===ID,by=id=>doc.getElementById(id);
 doc.body.dataset.operationView=primary?'continuous':'archive';
 const toggle=by('sf-archive');if(toggle){toggle.textContent=primary?'Görev arşivi':'Eve Dönüş’e dön';toggle.setAttribute('aria-pressed',String(!primary));}
 let plan=by('operation-plan');if(!plan){plan=doc.createElement('ol');plan.id='operation-plan';plan.setAttribute('aria-label','Harekâtın sırası');for(const ph of OP.phases.slice(0,-1)){const li=doc.createElement('li');li.textContent=ph.n;plan.append(li);}box.insertBefore(plan,box.querySelector('.sf-campaign-actions'));}plan.hidden=!primary;
 const cards=by('hkCard');
 if(cards&&root.HisarJourney)root.HisarJourney.archive(cards,hk);
 if(!primary)return false;
 const title=by('ci-mission');if(title)title.textContent=OP.n;
 by('sf-title').textContent='Tek harekât · tek amaç';
 box.querySelector('.sf-heading>small').textContent='KESİNTİSİZ HAREKÂT · 6 AŞAMA · 2 × 2 KM';
 by('sf-summary').textContent=OP.story;
 const cp=read(),paused=safe(()=>game==='play'||game==='pause',false),active=paused&&hk.op===ID;
 by('sf-progress').textContent=active?'Aşama '+Math.min(hk.ph+1,6)+'/6':hk.done[ID]?'Tamamlandı · '+'★'.repeat(hk.best[ID]||1):cp?'Kayıtlı ilerleme · aşama '+(cp.phase+1)+'/6':'Konvoyu bul · onarımı koru · eve getir';
 [...plan.children].forEach((li,i)=>{li.className=active?(i<hk.ph?'done':i===hk.ph?'current':''):'';});
 const resume=by('sf-resume'),note=by('sf-checkpoint-note');if(resume){resume.hidden=!cp||paused;resume.disabled=!!by('go')?.disabled;resume.textContent='Harekâta devam · aşama '+(cp?cp.phase+1:1)+'/6';}
 if(note){note.hidden=!cp||paused;note.textContent='Güvenli aşamalar arasında kayıt: tank, mühimmat, kalan takım ve konvoy sağlığı korunur.';}
 if(by('sf-result'))by('sf-result').hidden=true;
 const readButton=box.querySelector('.sf-campaign-actions>button');if(readButton)readButton.textContent='Harekât planı';
 const mt=by('mt');if(mt)mt.textContent='Konvoyu bul. Takımını koru. Birlikte geri dön.';
 if(root.HisarJourney)root.HisarJourney.route(plan,OP,hk,cp,active);
 return true;
}
function install(){if(!doc.body||!doc.getElementById('sf-archive'))return false;
 if(!installed){installed=true;const toggle=doc.getElementById('sf-archive');toggle.onclick=()=>{const h=root.HisarHarekat;const primary=h.diagnostics().sel===ID;h.showOperations(primary?archive():[ID]);h.select(primary?'safak-1':ID,'harekat');render();};
 const resume=doc.getElementById('sf-resume');resume.onclick=()=>{const primary=root.HisarHarekat.diagnostics().sel===ID,ok=primary?root.HisarHarekat.resumeCampaignCheckpoint():root.HisarHarekat.resumeCheckpoint();if(!ok){const note=doc.getElementById('sf-checkpoint-note');note.hidden=false;note.textContent='Kayıt yüklenemedi. Önceki kayıt korunuyor.';}};
 }render();return true;
}
function connect(){if(registered||!root.HisarHarekat)return;registered=true;root.HisarHarekat.registerOperations([OP]);choose();const old=root.openMenu;if(typeof old==='function')root.openMenu=function(){const r=old.apply(this,arguments);install();render();return r;};}
root.HisarCampaign=Object.freeze({version:VERSION,core,read,write,clear,session:()=>{const v=stored();return Math.max(Date.now(),v?v.sessionStartedAt+1:0);},choose,render,install,diagnostics:()=>({registered,installed,available:!!read(),error})});
doc.addEventListener('hisar:campaign-checkpoint',render);doc.addEventListener('hisar:ui-ready',()=>{connect();install();});
connect();if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',install);else install();
})(typeof window!=='undefined'?window:globalThis);
