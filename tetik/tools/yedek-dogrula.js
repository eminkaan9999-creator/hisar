#!/usr/bin/env node
/* HİSAR Tetik v2 yedek dosyası kontrolü.
   Dosyayı değiştirmez, içeriğini dışarı göndermez, kişisel verileri yazdırmaz.
   Kullanım: node tetik/tools/yedek-dogrula.js /yol/yedek.json
*/
'use strict';
const fs=require('node:fs');
const MAX_BYTES=25*1024*1024, MAX_SESSIONS=20000, MAX_SHOTS=10000;
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function validate(data){
 const errors=[],warnings=[];
 if(!obj(data)||data.app!=='hisar-tetik'||data.v!==2)errors.push('HİSAR Tetik v2 yedeği değil.');
 if(!Array.isArray(data?.sessions))errors.push('Oturum listesi bulunamadı.');
 if(!obj(data?.settings))warnings.push('Ayarlar bulunamadı.');
 const sessions=Array.isArray(data?.sessions)?data.sessions:[];
 if(sessions.length>MAX_SESSIONS)errors.push('Oturum sayısı izin verilen sınırı aşıyor.');
 const ids=new Set();let shots=0;
 for(let i=0;i<Math.min(sessions.length,MAX_SESSIONS);i++){
  const s=sessions[i],prefix='Oturum '+(i+1);
  if(!obj(s)){errors.push(prefix+': nesne değil.');continue;}
  if(typeof s.id!=='string'||s.id.length<1||s.id.length>120)errors.push(prefix+': geçersiz kimlik.');
  else if(ids.has(s.id))errors.push(prefix+': tekrar eden kimlik.');
  else ids.add(s.id);
  if(!finite(s.date,0,4102444800000))errors.push(prefix+': geçersiz tarih.');
  if(!Array.isArray(s.shots)){errors.push(prefix+': atış listesi yok.');continue;}
  if(s.shots.length>MAX_SHOTS){errors.push(prefix+': çok fazla kayıt.');continue;}
  shots+=s.shots.length;
  for(let j=0;j<s.shots.length;j++){
   const q=s.shots[j],at='Oturum '+(i+1)+' kayıt '+(j+1);
   if(!obj(q)){errors.push(at+': nesne değil.');continue;}
   if(q.sc!==undefined&&!finite(q.sc,0,100))errors.push(at+': skor 0-100 arasında olmalı.');
   if(q.at!==undefined&&!finite(q.at,0,86400000))errors.push(at+': geçersiz zaman.');
   for(const field of ['tr','ho','hx','hy','dx','dy','ca','dr','rv']){
    if(q[field]!==undefined&&q[field]!==null&&!finite(q[field],-100000,100000))errors.push(at+': '+field+' geçersiz.');
   }
  }
  if(errors.length>100){errors.push('Çok sayıda hata: denetim erken sonlandırıldı.');break;}
 }
 return {valid:errors.length===0,sessionCount:sessions.length,recordCount:shots,errors,warnings};
}
if(require.main===module){
 const file=process.argv[2];
 if(!file){console.error('Kullanım: node tetik/tools/yedek-dogrula.js dosya.json');process.exit(2);}
 try{
  const stat=fs.statSync(file);
  if(stat.size>MAX_BYTES)throw Error('Dosya 25 MB sınırını aşıyor.');
  const result=validate(JSON.parse(fs.readFileSync(file,'utf8')));
  console.log(JSON.stringify(result,null,2));
  process.exitCode=result.valid?0:1;
 }catch(e){console.error('Yedek doğrulanamadı: '+e.message);process.exitCode=1;}
}
module.exports={validate};
