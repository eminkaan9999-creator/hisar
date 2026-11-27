export const games = {
  boru: {
    name:'Çelik Börü', title:'Beyaz Geçit', role:'Araç komutanı', place:'Kuzey vadisi', start:'06.10', type:'Arazi sürüşü',
    intro:'Gece yağan kar vadiyi kapattı. İlk ışıkta depodan çık, iki yerleşime yardım yükünü teslim et ve mürettebatını üsse geri getir.',
    stages:[['Hazırlık','Depoda iki yükü ve üç kişilik mürettebatı teslim al.'],['İntikal','İki teslim noktasının sırasını seç ve aracı vadide sür.'],['Dönüş','İmzalı teslim fişleriyle üsse dön ve seferi kapat.']],
    order:['Kar yağışı nedeniyle Ihlamur köyü ısıtıcı, Çamlıova geçici barınma alanı battaniye bekliyor.','İki yükü doğru teslim noktalarına ulaştır ve üç kişilik mürettebatla üsse dön.','Depoda yükleri al. İlk durağı sen seç. Her durakta aracı durdurup teslim fişini al.','Depo iki sandık hazırladı. Kabulü alıcı temsilcisi yapacak.','Saha ekibi teslim fişlerini görev defterine işler. Dönüşte nöbetçi amirine sefer sonu raporu verilir.']
  },
  komuta: {
    name:'HİSAR: KOMUTA',title:'Gece Nöbeti',role:'Nöbetçi amiri',place:'Vadi koordinasyon merkezi',start:'21.40',type:'Karar ve koordinasyon',
    intro:'Taşkından sonra gece vardiyasını devral. Gelen talepleri doğrula, iki destek ekibini paylaştır ve sabah vardiyası için kayıt bırak.',
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
export const teams=['Ulaştırma ekibi','Teknik ekip'];
export function newRun(id){
  const base={id, schema:1, started:Date.now(), log:[], done:false};
  return id==='boru'?{...base,x:0,z:0,yaw:0,elapsed:0,distance:0,loaded:false,crewChecked:false,loadChecked:false,receipts:[],target:0}
    :{...base,turn:0,jobs:requests.map(()=>({stage:'new',crew:null,finish:null,closed:null}))};
}
export function clock(turn){const m=21*60+40+turn*10;return String(Math.floor(m/60)%24).padStart(2,'0')+'.'+String(m%60).padStart(2,'0');}
export function valid(s,id){
  if(!s||s.id!==id||s.schema!==1||!Number.isFinite(s.started)||!Array.isArray(s.log)||!s.log.every(x=>typeof x==='string')||typeof s.done!=='boolean')return false;
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
    const n=s.target;if(s.receipts.includes(n)||cargo!==n)return false;
    s.receipts.push(n);s.log.push(stops[n].name+' · '+stops[n].load+' için teslim fişi alındı.');
    s.target=[1,2].find(i=>!s.receipts.includes(i))??0;
  }else if(s.receipts.length===2){s.done=true;s.log.push('Ana depo · İki teslim fişi ve üç personelle sefer kapatıldı.');}
  else return false;
  return true;
}
export function occupied(s,team){return s.jobs.some(j=>j.stage==='busy'&&j.crew===team);}
export function command(s,action,index,team){
  if(s.done)return false;
  const note=t=>s.log.push(clock(s.turn)+' · '+t);
  if(action==='tick'){
    if(s.jobs.every(j=>j.stage==='closed'))return false;
    s.turn++;
    requests.forEach((r,i)=>{const j=s.jobs[i];if(r.arrives===s.turn)note(r.place+' yeni talep bildirdi.');if(j.stage==='busy'&&j.finish<=s.turn){j.stage='arrived';note(r.place+' saha ekibi işin bittiğini bildirdi.');}});return true;
  }
  if(action==='finish'){
    if(!s.jobs.every(j=>j.stage==='closed'))return false;
    s.done=true;note('Nöbet defteri ve ekip mevcudu yeni vardiyaya devredildi.');return true;
  }
  const r=requests[index],j=s.jobs[index];if(!r||r.arrives>s.turn)return false;
  if(action==='verify'&&j.stage==='new'){j.stage='confirmed';note(r.confirm);return true;}
  if(action==='assign'&&j.stage==='confirmed'&&r.teams.includes(team)&&!occupied(s,team)){
    Object.assign(j,{stage:'busy',crew:team,finish:s.turn+r.time});note(teams[team]+' görevlendirildi · '+r.place);return true;
  }
  if(action==='close'&&j.stage==='arrived'){j.stage='closed';j.closed=s.turn;note(r.place+' · teslim kaydı kapatıldı.');return true;}
  return false;
}
