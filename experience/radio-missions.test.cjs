'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c=require('./radio-missions.js');
test('scripts parse',()=>{for(const p of ['radio-missions.js','radio-sound.js'])new vm.Script(fs.readFileSync(__dirname+'/'+p,'utf8'));});
for(const [text,recipient,code]of [
 ['Kaplan bir iki, beni takip et','KAPLAN 1-2',1],['KAPLAN 1-3 burada bekle','KAPLAN 1-3',2],['Kaplan bir dört durum bildir','KAPLAN 1-4',8],
 ['Tüm birlik ateşi kes','all',5],['Bütün birlik yanımda toplan','all',9],['İkmal devam et',null,null],['İkmal beni takip et','İKMAL 1',1],
 ['Kaplan bir iki ateş etme','KAPLAN 1-2',5],['Herkes aralık aç','all',6],['Tüm birlik geri gel','all',7],['Kaplan 1-2 işaretli hedef','KAPLAN 1-2',3],['Tüm birlik ateş serbest','all',4]
 ])test('Turkish command '+text,()=>{const p=c.parse(text);if(recipient===null)assert.equal(p,null);else assert.deepEqual(p,{recipient,code});});
for(const t of ['',null,123,{},'radyoyu aç','bekleme','beni takip etme','tamam'])test('unknown or negative ignored '+String(t),()=>assert.equal(c.parse(t),null));
test('selected recipient is preserved without explicit address',()=>assert.deepEqual(c.parse('durum bildir','KAPLAN 1-3'),{recipient:'KAPLAN 1-3',code:8}));
test('long and untrusted text bounded',()=>assert.ok(c.clean('x'.repeat(10000)).length<=160));
const unit=()=>({hp:60,mx:100,dead:false,cmd:'attack',fire:1,x:7,z:9,tgt:{id:1},cs:'KAPLAN 1-2'});
for(let i=1;i<=9;i++)test('command changes actual actor '+i,()=>{const u=unit();assert.equal(c.applyOrder(u,i,{id:2}).ok,true);assert.match(c.reply(u,i),i===8?/Komutanım/:/^Emredersiniz komutanım\./);});
test('ceasefire leaves attack mode',()=>{const u=unit();c.applyOrder(u,5);assert.equal(u.fire,0);assert.equal(u.cmd,'hold');assert.equal(u.tgt,null);assert.deepEqual(u.hold,{x:7,z:9});});
test('hold records current point and clears target',()=>{const u=unit();c.applyOrder(u,2);assert.deepEqual(u.hold,{x:7,z:9});assert.equal(u.cmd,'hold');});
test('follow does not undo a ceasefire decision',()=>{const u=unit();c.applyOrder(u,5);c.applyOrder(u,1);assert.equal(u.fire,0);assert.equal(u.cmd,'follow');});
test('no target does not lie about accepting attack',()=>{const u=unit(),old={...u};assert.equal(c.applyOrder(u,3,null).ok,false);assert.deepEqual(u,old);});
for(const u of [null,{dead:true,hp:100},{dead:false,hp:0}])test('unavailable unit is not commanded '+JSON.stringify(u),()=>assert.equal(c.applyOrder(u,1).ok,false));
test('status request does not move actor',()=>{const u=unit(),old={...u};c.applyOrder(u,8);assert.deepEqual(u,old);assert.match(c.reply(u,8),/yüzde 60/);});
test('convoy handles only its supported orders',()=>{const u={...unit(),convoy:true};assert.equal(c.applyOrder(u,3,{}).ok,false);c.applyOrder(u,2);assert.equal(u.waiting,true);c.applyOrder(u,1);assert.equal(u.waiting,false);});
test('eight fresh scenarios have different real objective sequences',()=>{assert.equal(c.SCENARIOS.length,8);assert.equal(new Set(c.SCENARIOS.map(s=>s.goals.map(g=>g.type).join('/'))).size,8);assert.equal(new Set(c.SCENARIOS.map(s=>s.id)).size,8);});
test('every scenario mixes tank and drone work or squad work and has sequential game targets',()=>{for(const s of c.SCENARIOS){assert.ok(s.goals.some(g=>g.foes&&g.foes.length>0),s.id);for(const g of s.goals)for(const f of g.foes||[])assert.ok(c.FOES[f],f);assert.ok(s.title&&s.brief&&s.tag&&s.icon);}assert.ok(c.SCENARIOS.filter(s=>s.goals.some(g=>g.type==='scan')).length>=5);});
test('hunt completes only when no game target is left',()=>{let a=0,r;for(let i=0;i<10;i++){r=c.objectiveStep({type:'hunt'},a,{...state(),foesLeft:0},.1);a=r.amount;}assert.equal(r.done,true);assert.equal(c.objectiveStep({type:'hunt'},.5,{...state(),foesLeft:1},.1).done,false);assert.equal(c.objectiveStep({type:'hunt'},.5,{...state(),foesLeft:undefined},.1).done,false);});
test('targets are released one at a time',()=>{const src=fs.readFileSync(__dirname+'/radio-missions.js','utf8');assert.match(src,/!active\.foes\.length\|\|E\.length>0\)return/);assert.doesNotMatch(src,/for\(const q of positions\)/);});
const state=()=>({tank:true,playerNear:true,drone:true,droneNear:true,signal:1,interacting:true,nearAllies:3,aliveAllies:3,convoyNear:true,enemies:0});
for(const type of ['scan','interact','reach','regroup','all-home','escort','defend'])test('objective '+type+' completes only with predicate and duration',()=>{const g={type,seconds:2};let a=0,r;for(let i=0;i<25;i++){r=c.objectiveStep(g,a,state(),.1);a=r.amount;}assert.equal(r.done,true);});
for(const [type,patch]of [['scan',{drone:false}],['scan',{signal:0}],['scan',{droneNear:false}],['interact',{interacting:false}],['interact',{tank:false}],['regroup',{nearAllies:0}],['all-home',{aliveAllies:0,nearAllies:0}],['all-home',{nearAllies:1,aliveAllies:2}],['escort',{convoyNear:false}],['defend',{enemies:1}],['reach',{playerNear:false}]])test('objective guard '+type+JSON.stringify(patch),()=>assert.equal(c.objectiveStep({type,seconds:2},2,{...state(),...patch},.1).done,false));
test('repair stops on release instead of auto completing',()=>{const r=c.objectiveStep({type:'interact',seconds:4},3,{...state(),interacting:false},.1);assert.equal(r.amount,0);assert.equal(r.done,false);});
test('defence timer does not advance outside objective',()=>{const r=c.objectiveStep({type:'defend',seconds:35},12,{...state(),playerNear:false},.1);assert.equal(r.amount,12);});
for(const dt of [NaN,Infinity,-1,100])test('time bounded '+dt,()=>{const r=c.objectiveStep({type:'scan',seconds:4},0,state(),dt);assert.ok(r.amount>=0&&r.amount<=.1);});
test('source does not include source PDFs or modify save key',()=>{const src=fs.readFileSync(__dirname+'/radio-missions.js','utf8');assert.doesNotMatch(src,/localStorage\.(?:setItem|removeItem)\(['"]m60v2/);assert.doesNotMatch(src,/getUserMedia|\.pdf/i);});
test('microphone requires action and separate remote processing consent',()=>{const src=fs.readFileSync(__dirname+'/radio-missions.js','utf8');assert.match(src,/micButton\.onclick=listen/);assert.match(src,/!local&&!allowRemote/);assert.match(src,/r\.continuous=false/);assert.match(src,/setTimeout\(cancelMic,8000\)/);});
test('radio command callbacks use sim time rather than stale timeout',()=>{const src=fs.readFileSync(__dirname+'/radio-missions.js','utf8');assert.match(src,/versions\.get\(q\.unit\)!==q\.version/);assert.match(src,/!units\(\)\.includes\(q\.unit\)/);});

const crew=require('./crew-orders.js');
test('crew orders: loader line names the ammunition and fire waits only for a ready tank gun',()=>{assert.equal(crew.ammoLine(1),'Komutanım, HEAT mühimmatı yüklendi.');assert.equal(crew.ammoLine(9),'');const ok={playing:true,tank:true,aa:false,ready:true,pending:false};assert.equal(crew.shouldDelay(ok),true);for(const k of ['playing','tank','ready'])assert.equal(crew.shouldDelay({...ok,[k]:false}),false);assert.equal(crew.shouldDelay({...ok,aa:true}),false);assert.equal(crew.shouldDelay({...ok,pending:true}),false);assert.equal(crew.shouldDelay(null),false);});
test('mission end does not depend on pointer lock support',()=>{const src=fs.readFileSync(__dirname+'/../index.html','utf8');assert.doesNotMatch(src,/game='(?:over|pause)';document\.exitPointerLock\(\)/);});
test('random events can no longer add several game targets at once',()=>{const src=fs.readFileSync(__dirname+'/../index.html','utf8');assert.doesNotMatch(src,/k==='pusu'|k==='takviye'|k==='hedef'/);});
