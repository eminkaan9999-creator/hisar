export const games = {
  boru: {
    name:'Çelik Börü', title:'Beyaz Geçit', role:'Araç komutanı', place:'Kuzey vadisi', start:'06.10', type:'Arazi sürüşü',
    intro:'Gece yağan kar vadiyi kapattı. İlk ışıkta depodan çık, iki yerleşime yardım yükünü teslim et ve mürettebatını üsse geri getir.',
    stages:[['Hazırlık','Depoda iki yükü ve üç kişilik mürettebatı teslim al.'],['İntikal','İlk teslimden sonra dere ya da sırt yolunu seç. Yol işaretlerini izleyerek ikinci yerleşime ulaş.'],['Dönüş','İmzalı teslim fişleriyle üsse dön ve seferi kapat.']],
    order:['Kar yağışı nedeniyle Ihlamur köyü ısıtıcı, Çamlıova geçici barınma alanı battaniye bekliyor.','İki yükü doğru teslim noktalarına ulaştır ve üç kişilik mürettebatla üsse dön.','Depoda yükleri al. İlk durağı sen seç. İki yerleşim arasında kısa ve sisli dere yolunu veya uzun ve açık sırt yolunu kullan. Her durakta aracı durdurup teslim fişini al.','Depo iki sandık hazırladı. Kabulü alıcı temsilcisi yapacak.','Saha ekibi teslim fişlerini görev defterine işler. Dönüşte nöbetçi amirine sefer sonu raporu verilir.']
  },
  komuta: {
    name:'HİSAR: KOMUTA',title:'Gece Nöbeti',role:'Nöbetçi amiri',place:'Vadi koordinasyon merkezi',start:'21.40',type:'Karar ve koordinasyon',
    intro:'Taşkından sonra gece vardiyasını devral. Gelen talepleri doğrula, iki destek ekibini paylaştır ve sabah hangi noktanın önce kontrol edileceğine karar ver.',
    stages:[['Nöbeti devral','Önceki vardiyadan açık talepleri ve ekip mevcudunu öğren.'],['Koordine et','Saha teyitlerine göre ekipleri görevlendir ve süreyi yönet.'],['Devir teslim','Üç işin sonucunu kayda geçir ve sonraki vardiyaya bildir.']],
    order:['Vadideki taşkın sonrasında iki talep açık. İlçe merkezi gece boyunca yeni bildirim gönderebilir.','Barınma, enerji ve ulaştırma taleplerini ekip kapasitesine göre sonuçlandır.','Her bildirimi kaynağından teyit et. Bir ekibe aynı anda bir iş ver. Saha dönüşünü teslim kaydına işle.','Elde bir ulaştırma ekibi ve bir teknik ekip var. İki ekip de barınma malzemesini teslim edebilir.','Bildirimleri ilçe koordinasyon masası aktarır. Süresi geçen işler ve kapanış saatleri nöbet devir raporunda görünür.']
  }
};
export const orderLabels=['Durum','Vazife','Uygulama','İdari ve lojistik hususlar','Komuta ve irtibat'];
export const stops=[
  {name:'Ana depo',x:0,z:0,action:'Yükleri teslim al',short:'Depo'},
  {name:'Ihlamur köyü',x:-46,z:96,load:'Isıtıcı sandığı',recipient:'Köy irtibat görevlisi',short:'Ihlamur'},
  {name:'Çamlıova',x:58,z:150,load:'Battaniye sandığı',recipient:'Barınma alanı sorumlusu',short:'Çamlıova'}
];
export const requests=[
  {name:'Yurt için yatak takımı',place:'Güneş Yurdu',source:'Yurt sorumlusu',message:'Yurdun üst katına yerleşen aileler için yatak takımı bekleniyor.',confirm:'Yurt sorumlusu teslim yerini ve malzemeyi doğruladı.',teams:[0,1],time:2,due:5,arrives:0},
  {name:'Soğuk depo enerjisi',place:'Merkez deposu',source:'Depo görevlisi',message:'Geçici deponun enerji bağlantısı kesildi. Teknik ekip isteniyor.',confirm:'Görevli kesintiyi yerinde teyit etti. Teknik ekibe erişim açık.',teams:[1],time:2,due:4,arrives:0},
  {name:'İçme suyu sevki',place:'Kavaklı meydanı',source:'İlçe irtibatı',message:'Kavaklı dağıtım noktasının su stoğu bu vardiyada tamamlanmalı.',confirm:'İlçe irtibatı sevk miktarını ve teslim alacak kişiyi teyit etti.',teams:[0],time:2,due:7,arrives:2}
];
export const morning={
  ...games.komuta,title:'İlk Işık Vardiyası',start:'06.00',
  intro:'Geceki teslimlerin ardından üç saha kontrolü bekliyor. Devir notu ilk teyidi sağlıyor. Geciken teslimlerin sahada ek takibe ihtiyacı var.',
  stages:[['Devir notu','Öncelik verilen noktada saha teyidi hazır.'],['Saha kontrolü','İki ekibi takip görevlerine dağıt. Gece gecikmiş her teslim bir tur daha sürer.'],['Kapanış','Saha sonuçlarını kayda geçir ve sabah raporunu tamamla.']],
  order:['Gece vardiyasının üç teslim kaydı masada.','Sabah kontrollerini tamamla ve izleme sonuçlarını teslim et.','Öncelikli noktanın teyidi gece vardiyasından geldi. Diğer noktaların görevlilerini ara.','Gecikmiş gece teslimlerinin kontrolüne bir tur eklenir. İki ekip görevde.','Sonuçları sabah görev defterine işle ve vardiya raporunu kapat.']
};
const followUps=[
  {name:'Barınma sayımı',place:'Güneş Yurdu',source:'Yurt sorumlusu',message:'Yatak takımlarının ailelere ulaştığı teyit edilecek.',confirm:'Yurttaki aile listesi karşılaştırıldı.',teams:[0,1],time:2,due:4,arrives:0},
  {name:'Enerji sürekliliği',place:'Merkez deposu',source:'Depo görevlisi',message:'Gece sağlanan elektriğin sabah teslimine kadar sürdüğü kontrol edilecek.',confirm:'Depo görevlisi gece kesinti kaydını iletti.',teams:[1],time:2,due:3,arrives:0},
  {name:'Su dağıtım kaydı',place:'Kavaklı meydanı',source:'İlçe irtibatı',message:'İlk dağıtımın ardından kalan su mevcudu sayılacak.',confirm:'İlçe irtibatı sabah sayım noktasını doğruladı.',teams:[0],time:1,due:4,arrives:0}
];
export const configFor=(id,s)=>id==='komuta'&&s?.shift==='morning'?morning:games[id];
export const requestsFor=s=>s.shift==='morning'?followUps:requests;
export const durationFor=(s,i)=>requestsFor(s)[i].time+(s.shift==='morning'&&s.late.includes(i)?1:0);
export const routes={
  creek:{name:'Dere yolu',detail:'Kısa güzergâh. Vadi tabanında sis var ve sürüş hızı düşer.',points:[[-16,118],[12,134]],color:'#e9b874'},
  ridge:{name:'Sırt yolu',detail:'Daha uzun güzergâh. Görüş açık, araç normal yol hızını korur.',points:[[-68,129],[-43,161],[8,176],[47,170]],color:'#73dece'}
};
export function needsRoute(s){return s.receipts.length===1&&s.passage===null;}
export function pickRoute(s,route){
  if(!needsRoute(s)||!Object.hasOwn(routes,route)||s.done)return false;
  s.passage={route,step:0,startDistance:s.distance,startElapsed:s.elapsed};
  s.log.push(stops[s.receipts[0]].name+' · '+routes[route].name+' seçildi.');return true;
}
export function routePoint(s){
  if(s.receipts.length!==1||!s.passage)return null;
  const {route,step}=s.passage,points=routes[route].points;
  if(step>=points.length)return null;
  return points[s.receipts[0]===1?step:points.length-1-step];
}
export function passMarker(s){
  const point=routePoint(s);
  if(!point||Math.hypot(point[0]-s.x,point[1]-s.z)>8)return false;
  s.passage.step++;return true;
}
export function followUpPriority(s){
  if(Number.isInteger(s.priority)&&requests[s.priority])return s.priority;
  const lag=s.jobs.map((j,i)=>j.closed-requests[i].due);
  return lag.some(v=>v>0)?lag.indexOf(Math.max(...lag)):1;
}
export function startMorning(night){
  if(!valid(night,'komuta')||night.shift==='morning'||!night.done||night.jobs.some(j=>j.stage!=='closed'))return null;
  const s=newRun('komuta');s.shift='morning';s.parent=night.started;
  s.late=night.jobs.flatMap((j,i)=>j.closed>requests[i].due?[i]:[]);s.priority=followUpPriority(night);
  s.jobs[s.priority].stage='confirmed';s.log.push('06.00 · '+(Number.isInteger(night.priority)?'Gece devir notu alındı. ':'Gece kayıtları incelendi. ')+requests[s.priority].place+' için ön teyit hazır.');return s;
}
export const teams=['Ulaştırma ekibi','Teknik ekip'];
export function newRun(id){
  const base={id, schema:1, started:Date.now(), log:[], done:false};
  return id==='boru'?{...base,x:0,z:0,yaw:0,elapsed:0,distance:0,passage:null,loaded:false,crewChecked:false,loadChecked:false,receipts:[],target:0}
    :{...base,turn:0,jobs:requests.map(()=>({stage:'new',crew:null,finish:null,closed:null}))};
}
export function clock(turn,s){const m=(s?.shift==='morning'?360:1300)+turn*10;return String(Math.floor(m/60)%24).padStart(2,'0')+'.'+String(m%60).padStart(2,'0');}
export function valid(s,id){
  if(!s||s.id!==id||s.schema!==1||!Number.isFinite(s.started)||!Array.isArray(s.log)||!s.log.every(x=>typeof x==='string')||typeof s.done!=='boolean')return false;
  if(id==='boru' && s.passage!=null){
    const p=s.passage;if(!Object.hasOwn(routes,p.route)||!Number.isInteger(p.step)||p.step<0||p.step>routes[p.route].points.length||![p.startDistance,p.startElapsed].every(Number.isFinite))return false;
  }
  if(id==='komuta'&&s.shift==='morning'&&(!Number.isFinite(s.parent)||!Array.isArray(s.late)||!s.late.every(i=>Number.isInteger(i)&&requests[i])||!Number.isInteger(s.priority)||!requests[s.priority]))return false;
  if(id==='boru')return [s.x,s.z,s.yaw,s.elapsed,s.distance].every(Number.isFinite)&&s.elapsed>=0&&s.distance>=0&&typeof s.loaded==='boolean'&&Number.isInteger(s.target)&&!!stops[s.target]&&Array.isArray(s.receipts)&&s.receipts.length<=2&&s.receipts.every(i=>i===1||i===2)&&new Set(s.receipts).size===s.receipts.length;
  return Number.isSafeInteger(s.turn)&&s.turn>=0&&Array.isArray(s.jobs)&&s.jobs.length===requests.length&&s.jobs.every(j=>j&&['new','confirmed','busy','arrived','closed'].includes(j.stage)&&(j.crew===null||[0,1].includes(j.crew))&&(j.stage!=='busy'||Number.isSafeInteger(j.finish))&&(j.stage!=='closed'||Number.isSafeInteger(j.closed)));
}
export function stopDistance(s){const p=stops[s.target];return Math.hypot(p.x-s.x,p.z-s.z);}
export function chooseStop(s,id){
  if(s.done||!s.loaded||![1,2].includes(id)||s.receipts.includes(id))return false;
  s.target=id;return true;
}
export function preparation(s,part){
  if(s.loaded||s.done||stopDistance(s)>9||!['crewChecked','loadChecked'].includes(part))return false;
  s[part]=true;return true;
}
export function handover(s,speed=0,cargo=null){
  if(s.done||stopDistance(s)>9||Math.abs(speed)>1)return false;
  if(!s.loaded){if(!s.crewChecked||!s.loadChecked)return false;s.loaded=true;s.target=1;s.log.push('Ana depo · Üç personel ve iki yardım sandığı teslim alındı.');}
  else if(s.target!==0){
    const n=s.target;if(s.receipts.includes(n)||cargo!==n||needsRoute(s)||routePoint(s))return false;
    if(s.passage&&s.receipts.length===1){
      s.passage.metres=Math.round(s.distance-s.passage.startDistance);
      s.passage.seconds=Math.round(s.elapsed-s.passage.startElapsed);
      s.log.push(routes[s.passage.route].name+' tamamlandı · '+s.passage.metres+' m.');
    }
    s.receipts.push(n);s.log.push(stops[n].name+' · '+stops[n].load+' için teslim fişi alındı.');
    s.target=[1,2].find(i=>!s.receipts.includes(i))??0;
  }else if(s.receipts.length===2){s.done=true;s.log.push('Ana depo · İki teslim fişi ve üç personelle sefer kapatıldı.');}
  else return false;
  return true;
}
export function occupied(s,team){return s.jobs.some(j=>j.stage==='busy'&&j.crew===team);}
export function command(s,action,index,team){
  if(s.done)return false;
  const cases=requestsFor(s),note=t=>s.log.push(clock(s.turn,s)+' · '+t);
  if(action==='priority'){
    if(s.shift==='morning'||!cases[index]||!s.jobs.every(j=>j.stage==='closed'))return false;
    s.priority=index;return true;
  }
  if(action==='tick'){
    if(s.jobs.every(j=>j.stage==='closed'))return false;
    s.turn++;
    cases.forEach((r,i)=>{const j=s.jobs[i];if(r.arrives===s.turn)note(r.place+' yeni talep bildirdi.');if(j.stage==='busy'&&j.finish<=s.turn){j.stage='arrived';note(r.place+' saha ekibi işin bittiğini bildirdi.');}});return true;
  }
  if(action==='finish'){
    if(!s.jobs.every(j=>j.stage==='closed'))return false;
    if(s.shift!=='morning'){s.priority=followUpPriority(s);note(cases[s.priority].place+' sabah takibi için devir notuna alındı.');}
    s.done=true;note('Nöbet defteri ve ekip mevcudu yeni vardiyaya devredildi.');return true;
  }
  const r=cases[index],j=s.jobs[index];if(!r||r.arrives>s.turn)return false;
  if(action==='verify'&&j.stage==='new'){j.stage='confirmed';note(r.confirm);return true;}
  if(action==='assign'&&j.stage==='confirmed'&&r.teams.includes(team)&&!occupied(s,team)){
    Object.assign(j,{stage:'busy',crew:team,finish:s.turn+durationFor(s,index)});note(teams[team]+' görevlendirildi · '+r.place);return true;
  }
  if(action==='close'&&j.stage==='arrived'){j.stage='closed';j.closed=s.turn;note(r.place+' · teslim kaydı kapatıldı.');return true;}
  return false;
}
