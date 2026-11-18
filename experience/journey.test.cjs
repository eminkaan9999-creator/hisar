'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {fold,time,recent,previousBest}=require('./journey.js');
const row=(i,fields={})=>({id:'sefer-'+i,at:i,name:'Eve Dönüş',mission:'eve-donus',difficulty:'normal',elapsed:i*10,won:true,...fields});
test('Turkish archive and control searches accept a keyboard without Turkish letters',()=>{
  for(const [name,query] of [['Kırık Bağlantı','kirik baglanti'],['İlk Işık','ilk isik'],['Görüş','gorus']])assert.equal(fold(name),query);
});
test('journal keeps eight newest distinct stored entries, ignores incomplete old data and leaves caller order untouched',()=>{
  const source=Array.from({length:12},(_,i)=>row(i));
  assert.deepEqual(recent([...source,null,{},row(99,{elapsed:-1}),row(98,{difficulty:'something'})]).map(x=>x.at),[11,10,9,8,7,6,5,4]);
  assert.equal(source[0].at,0);
});
test('comparison is limited to previous completed runs of the same mission and difficulty',()=>{
  const run=row(9);assert.equal(previousBest([run,row(5),row(4,{won:false}),row(3,{difficulty:'kolay'}),row(2,{mission:'tepe'})],run),50);
  assert.equal(previousBest([run],run),null);assert.equal(time(359.9),'6:00');assert.equal(time(62),'1:02');
});
