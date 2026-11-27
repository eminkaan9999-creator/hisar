export const KEY='hisar-santiye-29';
export const MISSIONS=Object.freeze([
 {id:'tarama',chapter:0,era:2026,title:'Saha taraması',tag:'UÇANGÖZ',duration:'2 dk',lead:'Sahaya yukarıdan bak. Uçangözü uçur, kamerayı kullan ve güvenle geri getir.',steps:['Uçangözü kaldır','En az 8 saniye havada kal','Geri çağır ve inişi bekle'],brief:'W A S D uçuş · E / Q yükselme ve alçalma · ok tuşları kamera. Telefonda iki uçuş kumandasını kullan.'},
 {id:'yol',chapter:1,era:2026,title:'Ulaşım hattı',tag:'İŞ MAKİNELERİ',duration:'3 dk',lead:'Garnizonun ulaşım yolunu hazırla. Greyderin bıçağını indirerek altı yol bölümünü düzelt.',steps:['Greyderi çalıştır','Bıçağı indir','Yolda altı bölümü düzelt'],brief:'W / S ileri ve geri · A / D yön · I / K bıçak. Telefonda sol kumanda sürüşü, sağ kumanda bıçağı yönetir.'},
 {id:'ikmal',chapter:4,era:2045,title:'Sayısal ikmal',tag:'BAĞLI SAHA',duration:'4 dk',lead:'Uçangözle teslim alanını kontrol et. İşaretlenen noktayı taradıktan sonra hizmet aracını alana ulaştır.',steps:['Sarı halka üzerinde iki saniye kal','Uçangözü geri çağır','Hizmet aracını sarı halkada durdur'],brief:'Uçuşta sarı halkayı ara. Kamera ve aşağı bak düğmelerini kullan. İnişten sonra hizmet aracının sürüşü açılır.'},
 {id:'teslim',chapter:7,era:2045,title:'Akıllı bakım alanı',tag:'ARAÇ TESLİMİ',duration:'2 dk',lead:'Sahadaki zırhlı aracı bakım parkına getir. Yeşil halkanın içinde durarak teslimi tamamla.',steps:['Aracı hareket ettir','Yeşil park halkasına ulaş','Halka içinde dur'],brief:'W / S ileri ve geri · A / D yön. S veya geri kumandasıyla frenle. Telefonda sol sürüş kumandasını kullan.'}
]);
export const mission=id=>MISSIONS.find(m=>m.id===id);
export function fresh(){return {schema:29,era:2026,quality:'auto',digital:true,run:null,records:[],flight:null};}
export function restore(raw){
 const s=fresh();if(!raw||raw.schema!==29)return s;
 if([2026,2045].includes(raw.era))s.era=raw.era;
 if(['auto','low','mid','high'].includes(raw.quality))s.quality=raw.quality;
 s.digital=raw.digital!==false;
 s.records=Array.isArray(raw.records)?raw.records.filter(r=>r&&mission(r.id)&&Number.isFinite(r.seconds)&&r.seconds>=0&&typeof r.at==='string').slice(0,24):[];
 if(raw.run&&(mission(raw.run.id)||raw.run.id==='free')&&Number.isFinite(raw.run.seconds)&&raw.run.seconds>=0)s.run={id:raw.run.id,seconds:raw.run.seconds};
 if(s.run&&raw.flight&&typeof raw.flight==='object')s.flight=raw.flight;
 return s;
}
export function begin(s,id){if(id!=='free'&&!mission(id))return false;s.run={id,seconds:0};s.flight=null;return true;}
export function finish(s){if(!s.run||!mission(s.run.id))return null;const record={id:s.run.id,seconds:Math.round(s.run.seconds),at:new Date().toISOString()};s.records.unshift(record);s.records=s.records.slice(0,24);s.run=null;s.flight=null;return record;}
export function goals(id,flight={},metrics={}){
 const f=flight.drone?.flight||{},p=flight.progress||{};
 if(id==='tarama')return [f.seconds>0,f.seconds>=8,f.seconds>=8&&f.status==='docked'];
 if(id==='yol')return [Number(p.road)>0,Number(p.road)>0,Number(p.road)>=6||!!metrics.done];
 if(id==='ikmal')return [p.scan>=2,p.scan>=2&&f.status==='docked',!!metrics.done];
 if(id==='teslim')return [metrics.travel>1,metrics.travel>8&&!!metrics.done,!!metrics.done];
 return [];
}
export function qualityFor(mode,mobile){return mode==='auto'?'low':mode;}
export function nextQuality(current,mean){if(mean>42)return current==='high'?'mid':'low';return current;}
