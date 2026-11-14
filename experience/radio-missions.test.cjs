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

const crew=require('./crew-orders.js'),field=require('./field.js');
test('crew orders: loader line names the ammunition and fire waits only for a ready tank gun',()=>{assert.equal(crew.ammoLine(1),'Komutanım, HEAT mühimmatı yüklendi.');assert.equal(crew.ammoLine(9),'');const ok={playing:true,tank:true,aa:false,ready:true,pending:false};assert.equal(crew.shouldDelay(ok),true);for(const k of ['playing','tank','ready'])assert.equal(crew.shouldDelay({...ok,[k]:false}),false);assert.equal(crew.shouldDelay({...ok,aa:true}),false);assert.equal(crew.shouldDelay({...ok,pending:true}),false);assert.equal(crew.shouldDelay(null),false);});
test('mission end does not depend on pointer lock support',()=>{const src=fs.readFileSync(__dirname+'/../index.html','utf8');assert.doesNotMatch(src,/game='(?:over|pause)';document\.exitPointerLock\(\)/);});
test('random events can no longer add several game targets at once',()=>{const src=fs.readFileSync(__dirname+'/../index.html','utf8');assert.doesNotMatch(src,/k==='pusu'|k==='takviye'|k==='hedef'/);});
test('vehicles are pushed apart instead of passing through each other',()=>{const b=[{x:0,z:0,r:3,fixed:false,w:.25},{x:2,z:0,r:3,fixed:false,w:.75}];assert.equal(field.separate(b),1);assert.ok(Math.hypot(b[1].x-b[0].x,b[1].z-b[0].z)>=6-1e-9);assert.ok(Math.abs(b[0].x)<Math.abs(b[1].x-2));const f=[{x:0,z:0,r:3,fixed:true},{x:1,z:0,r:3,fixed:false}];field.separate(f);assert.deepEqual([f[0].x,f[0].z],[0,0]);assert.ok(f[1].x>=6-1e-9);const same=[{x:5,z:5,r:3,fixed:false},{x:5,z:5,r:3,fixed:false}];field.separate(same);assert.ok(Math.hypot(same[1].x-same[0].x,same[1].z-same[0].z)>=6-1e-9);assert.equal(field.separate([{x:0,z:0,r:3},{x:10,z:0,r:3}]),0);});
test('fast shells cannot skip over an object and allies keep clear of the player',()=>{assert.ok(field.segDist(0,0,10,0,5,.5)<=.5+1e-9);assert.equal(field.segDist(0,0,10,0,20,0),10);assert.equal(field.segDist(3,3,3,3,3,7),4);assert.deepEqual(field.segPoint(0,0,10,0,4,3),{x:4,z:0});assert.deepEqual(field.segPoint(0,0,10,0,-5,2),{x:0,z:0});assert.deepEqual(field.segPoint(0,0,10,0,50,2),{x:10,z:0});const P={x:0,z:0},a={x:2,z:0};assert.equal(field.keepAway(P,a,9),true);assert.deepEqual([P.x,P.z,a.x,a.z],[0,0,9,0]);assert.equal(field.keepAway(P,{x:20,z:0},9),false);const on={x:0,z:0};field.keepAway(P,on,9);assert.ok(Math.hypot(on.x,on.z)>=9-1e-9);});
// Mevzi yer seçimi için yapay arazi: düz zemin; ağaç, kaya ve bina dışarıdan verilir.
const flat=(extra)=>Object.assign({ground:()=>0,trees:[],rocks:[],blds:[],avoid:[]},extra||{});
const gapOf=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),turn=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
test('tank positions are placed on open flat ground near the mission points, never on them, and face outward',()=>{const env=flat(),ps=field.findPositions(env);assert.equal(ps.length,8,'two per mission point');
 for(const p of ps){assert.ok(field.roadDist(p.x,p.z)>=11,'road');for(const a of field.ANCHORS)assert.ok(Math.hypot(a[0]-p.x,a[1]-p.z)>=18,'not on a mission point');assert.ok(field.ANCHORS.some(a=>Math.hypot(a[0]-p.x,a[1]-p.z)<=58),'near a mission point');assert.ok(turn(p.h,Math.atan2(p.x,p.z))<1e-9,'faces away from base');assert.ok(p.clear>=42);}
 for(const a of field.ANCHORS)assert.equal(ps.filter(p=>Math.hypot(a[0]-p.x,a[1]-p.z)<=58).length>=2,true);
 for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++)assert.ok(gapOf(ps[i],ps[j])>=24,'spacing');
 assert.deepEqual(field.findPositions(env),ps,'same world gives the same positions');});
test('a tree in front turns the position or moves it; nothing is built next to trees, rocks, buildings or the supply point',()=>{const base=field.findPositions(flat()),first=base[0];
 // İlk mevzinin tam önüne, 20 metre ileriye bir ağaç dikilir.
 const tree={x:first.x+Math.sin(first.h)*20,z:first.z+Math.cos(first.h)*20},env=flat({trees:[tree]}),ps=field.findPositions(env);assert.ok(ps.length>=6);
 assert.ok(field.clearAhead(first.x,first.z,first.h,env)<=20+1e-9,'the tree really blocks the old heading');
 for(const p of ps){assert.ok(field.clearAhead(p.x,p.z,p.h,env)>=30,'field of fire stays open');assert.ok(gapOf(p,tree)>=13,'no tree beside the position');}
 const same=ps.find(p=>p.x===first.x&&p.z===first.z);if(same)assert.ok(turn(same.h,first.h)>=.5-1e-9,'turned away from the tree');
 const crowded=flat({trees:base.map(p=>({x:p.x+3,z:p.z})),rocks:[{x:base[1].x,z:base[1].z+4,r:2}],blds:[{x:base[2].x+9,z:base[2].z,r:4}],avoid:[{x:base[3].x,z:base[3].z,r:20}]}),qs=field.findPositions(crowded);assert.ok(qs.length>=4);
 for(const q of qs){for(const t of crowded.trees)assert.ok(gapOf(q,t)>=13);for(const r of crowded.rocks)assert.ok(gapOf(q,r)-r.r>=9);for(const b of crowded.blds)assert.ok(gapOf(q,b)-b.r>=14);for(const a of crowded.avoid)assert.ok(gapOf(q,a)>=a.r);}});
test('no position on uneven ground, beside the river or facing a rising slope',()=>{assert.equal(field.findPositions(flat({ground:(x,z)=>Math.sin(x*.35)*3+Math.cos(z*.31)*3})).length,0);
  // Oyun −1,2 m'nin altını ıslak zemin sayar: oraya mevzi kurulmaz; hafif alçak ama kuru zemine kurulur.
 assert.equal(field.findPositions(flat({ground:()=>-3})).length,0);assert.equal(field.findPositions(flat({ground:()=>-.8})).length,8);const wet=flat({river:()=>60}),ws=field.findPositions(wet);assert.ok(ws.length>=4);for(const p of ws)assert.ok(Math.abs(p.z-60)>=30,'away from the river');
 const hill=flat({ground:(x,z)=>z>12?6:0});assert.ok(field.clearAhead(0,0,0,hill)<=16);assert.equal(field.clearAhead(0,0,Math.PI,hill),70);
 // Her yerde kuzeye (+z) doğru yükselen yamaç: hiçbir mevzi yokuş yukarı bakmaz.
 const slope=flat({ground:(x,z)=>z*.1}),ss=field.findPositions(slope);assert.ok(ss.length>=4);for(const p of ss)assert.ok(slope.ground(p.x+Math.sin(p.h)*6.2,p.z+Math.cos(p.h)*6.2)-slope.ground(p.x,p.z)<=.3+1e-9,'front is not higher than the tank');});
test('flat ground is preferred; gentler slopes only top the count up to the minimum',()=>{
 // Batı yarısı düz, doğu yarısı 14 m'de 2,1 m eğimli (kabul edilebilir ama ikinci tercih).
 const mixed=flat({ground:(x,z)=>x>20?(x-20)*.15:0}),ps=field.findPositions(mixed),slope=p=>p.x>27,flatOnes=ps.filter(p=>!slope(p)).length;assert.ok(ps.length>=6,'count '+ps.length);assert.ok(flatOnes>=4,'flat first: '+flatOnes);
 const strict=field.findPositions(mixed,{flatMax:1.8});assert.ok(strict.every(p=>!slope(p)));assert.ok(strict.length<=ps.length);
 assert.equal(field.findPositions(flat({ground:(x,z)=>x*.25})).length,0,'too steep everywhere');
 // Görev noktalarının yakını tamamen kapalıysa (ör. her yer ağaç) biraz uzağa bakılır, ama yalnız en az sayıya (6) kadar.
 const blocked=flat({avoid:field.ANCHORS.map(a=>({x:a[0],z:a[1],r:60}))}),far=field.findPositions(blocked),nearest=p=>Math.min(...field.ANCHORS.map(a=>Math.hypot(a[0]-p.x,a[1]-p.z)));
 assert.equal(far.length,6);for(const p of far)assert.ok(nearest(p)>58&&nearest(p)<=92,'far tier '+nearest(p));assert.equal(field.findPositions(blocked,{reachMax:58}).length,0);});
test('earth position: one piled-earth ridge around front and sides, low in front, open at the rear',()=>{const f=field;
 for(const seed of [13,110,207,304,401,498,595,692]){let front=0,side=0,floor=0,lane=0,far=0;
  for(let x=-10;x<=10;x+=.5)for(let z=-10;z<=12;z+=.5){const s=f.surface(x,z,seed);assert.ok(s.b>=0&&s.b<2.2&&s.a>=0&&s.a<=1&&s.c>.5&&s.c<1.3);
   if(Math.abs(x)<2.3&&z>4)front=Math.max(front,s.b);if(Math.abs(x)>3.5&&z>-3&&z<3)side=Math.max(side,s.b);if(Math.abs(x)<=1.9&&z>=-3.6&&z<=3.6)floor=Math.max(floor,s.b);if(Math.abs(x)<=1.9&&z<-3.6)lane=Math.max(lane,s.b);if(Math.abs(x)>=9.5&&z<-8)far=Math.max(far,s.a);}
  assert.ok(front>=.85&&front<=1.3,'front ridge is low enough to fire over: '+front);assert.ok(side>=1.3&&side>front+.2,'sides are higher: '+side);assert.equal(floor,0,'the tank stands on bare ground');assert.equal(lane,0,'rear entry is open');assert.equal(far,0,'soil fades out into the grass');
  // Sırt kesintisizdir: sırt çizgisi boyunca (uçlar hariç) toprak hiçbir yerde yere inmez.
  for(const q of f.PATH)if(q[1]>-3)assert.ok(f.surface(q[0],q[1],seed).b>.7,'gap in the ridge at '+q[0]+','+q[1]);
  assert.equal(f.surface(0,0,seed).a,1);assert.ok(f.surface(0,-7,seed).a>.5,'tracks lead in from the rear');}
 assert.deepEqual(f.surface(3.2,5.1,42),f.surface(3.2,5.1,42));assert.notDeepEqual(f.surface(4.9,1,13),f.surface(4.9,1,110),'each position is piled differently');});
test('earth position blocks vehicles on three sides and leaves the rear lane free',()=>{const p={x:10,z:20,h:Math.PI/2},bl=field.blocksOf(p);assert.equal(bl.length,field.BLOCKS.length);
 // h=90°: ileri +x yönüdür. Ön sırt mevzinin 6,2 m ilerisinde, giriş 9,5 m gerisindedir.
 assert.ok(bl.some(b=>Math.abs(b.x-16.2)<1e-9&&Math.abs(b.z-20)<1e-9));const en=field.entryOf(p);assert.ok(Math.abs(en.x-.5)<1e-9&&Math.abs(en.z-20)<1e-9);
 const l=field.toLocal(p,16.2,20);assert.ok(Math.abs(l.x)<1e-9&&Math.abs(l.z-6.2)<1e-9);const w=field.toWorld(p,l.x,l.z);assert.ok(Math.abs(w.x-16.2)<1e-9&&Math.abs(w.z-20)<1e-9);
 // Oyunun itme kuralı: araç merkezi daireye (yarıçap×0,85 + 2,6) metreden fazla yaklaşamaz.
 const free=(lx,lz)=>field.BLOCKS.every(([bx,bz,r])=>Math.hypot(lx-bx,lz-bz)>=r*.85+2.6-1e-9);
 for(let z=-12;z<=1;z+=.25)assert.ok(free(0,z),'lane '+z);assert.ok(free(1,-6)&&free(-1,0)&&free(1,0),'room to steer');
 assert.equal(free(0,2),false,'cannot drive through the front');assert.equal(free(2.5,0),false,'cannot drive through the side');
 // Dışarıdan hiçbir yönden içeri sızılamaz: önden ve yanlardan merkeze giden her doğru bir daireye takılır.
 for(let a=-2.2;a<=2.2;a+=.1){let blocked=false;for(let d=14;d>1.2;d-=.2)if(!free(Math.sin(a)*d,Math.cos(a)*d)){blocked=true;break;}assert.ok(blocked,'open gap at angle '+a.toFixed(1));}
 assert.equal(field.covered(p,{x:60,z:20},p),true);assert.equal(field.covered(p,{x:10,z:60},p),true);assert.equal(field.covered(p,{x:-40,z:20},p),false);assert.equal(field.covered(p,null,p),true);assert.equal(field.covered(null,{x:60,z:20},p),false);
 assert.equal(field.inPosition(11,21,[p]),p);assert.equal(field.inPosition(14,20,[p]),null);assert.equal(field.inPosition(14,20,[p],5),p);assert.ok(field.BLOCKS[0][3]<1.2,'front block is low');});
test('mevzilen approach: a tank from any side drives around the earth and enters from the rear',()=>{const p={x:-20,z:40,h:.7},bl=field.blocksOf(p);
 const push=o=>{for(const c of bl){const dx=o.x-c.x,dz=o.z-c.z,d=Math.hypot(dx,dz),mm=c.r*.85+2.6;if(d<mm){o.x=c.x+(d?dx/d:1)*mm;o.z=c.z+(d?dz/d:0)*mm;}}};
 for(let k=0;k<48;k++){const ang=k/16*Math.PI*2+p.h,dist=[45,22,13][Math.floor(k/16)],a={x:p.x+Math.sin(ang)*dist,z:p.z+Math.cos(ang)*dist},stages=[];let steps=0,crossed=false;
  // Oyundaki dost tank gibi: hedefe 2 m kala durur. Ara hedefte durup kalırsa (aşama ilerlemezse) test düşer.
  while(steps++<2500){const t=field.approach(p,a);if(stages[stages.length-1]!==t.stage)stages.push(t.stage);const dx=t.x-a.x,dz=t.z-a.z,d=Math.hypot(dx,dz);if(d<=2){if(t.stage===2)break;assert.fail('start '+k+' stopped short at stage '+t.stage);}const v=Math.min(.25,d-2+.01);a.x+=dx/d*v;a.z+=dz/d*v;push(a);
   const l=field.toLocal(p,a.x,a.z);if(l.z>-4&&l.z<5&&Math.abs(l.x)<3.5&&stages[stages.length-1]!==2)crossed=true;}
  assert.ok(steps<2500,'start '+k+' never arrived');assert.equal(stages[stages.length-1],2);assert.equal(crossed,false,'start '+k+' cut through the earth');assert.ok(Math.hypot(a.x-p.x,a.z-p.z)<=2.01);}
 const rear=field.approach(p,field.toWorld(p,0,-30)),side=field.approach(p,field.toWorld(p,9,0)),front=field.approach(p,field.toWorld(p,-2,20)),inside=field.approach(p,field.toWorld(p,.5,-6));
 assert.equal(rear.stage,1);assert.ok(gapOf(rear,field.entryOf(p))<1e-9);assert.equal(side.stage,0);assert.ok(field.toLocal(p,side.x,side.z).x>0);assert.equal(front.stage,0);assert.ok(field.toLocal(p,front.x,front.z).x<0,'goes round the nearer side');assert.equal(inside.stage,2);assert.ok(gapOf(inside,p)<1e-9);});
test('a tank without the order never gets trapped in a position: it backs out and everything else goes round',()=>{const p={x:5,z:-12,h:2.1},bl=field.blocksOf(p);
 const push=o=>{for(const c of bl){const dx=o.x-c.x,dz=o.z-c.z,d=Math.hypot(dx,dz),mm=c.r*.85+2.6;if(d<mm){o.x=c.x+(d?dx/d:1)*mm;o.z=c.z+(d?dz/d:0)*mm;}}};
 const free=(x,z)=>bl.every(c=>Math.hypot(x-c.x,z-c.z)>=c.r*.85+2.6-1e-6);
 // Tek daire bütün siperi ve itme payını örter: dışarıdaki araç toprağa hiç değmez, dolanırken köşe aralarına takılamaz.
 const pc=field.toWorld(p,field.PLUG[0],field.PLUG[1]);for(const c of bl)assert.ok(Math.hypot(c.x-pc.x,c.z-pc.z)+c.r*.85+2.6<=field.PLUG[2]+.05,'plug circle covers the earth');
 assert.equal(field.insideRing(p,p.x,p.z),true);const en=field.entryOf(p);assert.equal(field.insideRing(p,en.x,en.z),false);
 // (1) İçerideki tank geri geri, toprağa değmeden çıkar ve çıkışta mevziyle aynı yöne bakar.
 const ex={lx:.9,lz:.6,h:p.h+.7};let pose,n=0;do{pose=field.exitStep(p,ex,.05);n++;assert.ok(free(pose.x,pose.z),'backing out touches the earth');}while(!pose.done&&n<400);
 assert.ok(n<400);const l=field.toLocal(p,pose.x,pose.z);assert.ok(l.z<=-9.9&&Math.abs(l.x)<.1&&turn(pose.h,p.h)<.05);assert.equal(field.plugPush(p,{x:pose.x,z:pose.z}),false,'ends outside the plug');
 // (2) Hedefi mevzinin öbür yanında olan emirsiz tank içeri girmez, çevresinden dolanıp hedefe varır (her yönden).
 for(let k=0;k<12;k++){const ang=k/12*Math.PI*2,a={x:pc.x+Math.sin(ang)*40,z:pc.z+Math.cos(ang)*40},T={x:pc.x-Math.sin(ang)*40,z:pc.z-Math.cos(ang)*40};let steps=0;
  while(steps++<3000){const dx=T.x-a.x,dz=T.z-a.z,d=Math.hypot(dx,dz);if(d<1)break;const v=Math.min(.25,d);a.h=Math.atan2(dx,dz);a.x+=dx/d*v;a.z+=dz/d*v;push(a);field.plugPush(p,a,.1);assert.equal(field.insideRing(p,a.x,a.z),false);assert.ok(Math.hypot(a.x-pc.x,a.z-pc.z)>=field.PLUG[2]-1e-6);}
  assert.ok(steps<3000,'direction '+k+' got stuck');}
 // Hedefi dairenin içinde olan (ör. mevzideki oyuncuyu izleyen) araç kaydırılmaz: çemberde bekler, çevresinde dönmez.
 const w8={x:pc.x+3,z:pc.z+2,h:1};field.plugPush(p,w8);const w9={x:w8.x,z:w8.z,h:Math.atan2(pc.x-w8.x,pc.z-w8.z)};w9.x-=(w9.x-pc.x)*.01;w9.z-=(w9.z-pc.z)*.01;field.plugPush(p,w9);assert.ok(Math.hypot(w9.x-w8.x,w9.z-w8.z)<1e-9);
 const o={x:pc.x,z:pc.z};assert.equal(field.plugPush(p,o),true);assert.ok(Math.abs(Math.hypot(o.x-pc.x,o.z-pc.z)-field.PLUG[2])<1e-9);assert.ok(field.toLocal(p,o.x,o.z).z<0,'dead centre is pushed out to the rear');});
test('earth sits on the drawn terrain surface, not on the smooth formula',()=>{const g=(x,z)=>Math.sin(x*.2)*3+z*.1;
 for(const [x,z] of [[0,0],[5,5],[-450,-450],[10,-35]])assert.ok(Math.abs(field.terrainY(g,x,z)-g(x,z))<1e-9,'grid corners match');
 const mid=field.terrainY(g,2.5,2.5),chord=(g(0,5)+g(5,0))/2;assert.ok(Math.abs(mid-chord)<1e-9,'diagonal is a straight edge');assert.ok(Math.abs(field.terrainY(g,1,1)-(g(0,0)+(g(5,0)-g(0,0))*.2+(g(0,5)-g(0,0))*.2))<1e-9);
 assert.ok(Math.abs(field.terrainY(g,4,4)-(g(5,5)+(g(0,5)-g(5,5))*.2+(g(5,0)-g(5,5))*.2))<1e-9);});
test('mevzilen order sends each tank to its own nearest free position',()=>{assert.equal(c.parse('tüm tanklar mevzilen').code,10);assert.equal(c.parse('Kaplan bir iki mevziye gir').code,10);assert.equal(c.parse('burada bekle').code,2);const pos=[{x:0,z:0,h:1},{x:50,z:0,h:2},{x:100,z:0,h:3}],u=[{x:48,z:1,hp:100,cs:'a'},{x:52,z:0,hp:100,cs:'b'},{x:2,z:2,hp:100,cs:'d'}];const m=c.assignPositions(u,pos,{x:100,z:0,r:10});assert.equal(m.get(u[0]),pos[1]);assert.equal(m.get(u[1]),pos[0]);assert.equal(m.get(u[2]),undefined);assert.equal(new Set(m.values()).size,m.size);assert.equal(c.applyOrder(u[0],10,pos[1]).ok,true);const en=field.entryOf(pos[1]),hd=u[0].hold;assert.deepEqual([u[0].cmd,hd.position,hd.stage,hd.cx,hd.cz,hd.h],['hold',true,1,50,0,2]);assert.ok(Math.abs(hd.x-en.x)<1e-9&&Math.abs(hd.z-en.z)<1e-9,'first stop is the open rear entry');const stay={x:50,z:0,hp:100,cmd:'hold',hold:{x:50,z:0,h:2,position:true,in:true,cx:50,cz:0}},keep=stay.hold;c.applyOrder(stay,2);assert.equal(stay.hold,keep,'hold order keeps a tank in its position');c.applyOrder(stay,1);assert.equal(stay.cmd,'follow');assert.equal(c.applyOrder(u[2],10,null).reason,'no-position');assert.equal(c.applyOrder({convoy:true,hp:100},10,pos[0]).reason,'no-position');assert.match(c.reply(u[0],10),/Mevziye giriyorum/);assert.match(c.reply(u[0],8),/mevziye gidiyorum/);u[0].hold.in=true;assert.match(c.reply(u[0],8),/mevzideyim/);});
test('screen stays quiet: view names never pop up and mission route chatter is dropped',()=>{const play={tutorial:false,mission:false},mission={tutorial:false,mission:true},tut={tutorial:true,mission:true};
 for(const t of ['DIŞ GÖRÜŞ','NİŞANGÂH','NİŞANGÂH · tekerlek: yakınlaştır','KABİN · NİŞANCI','KABİN İÇİ','SÜRÜCÜ MAHALLİ','TANK kontrolü','UÇANGÖZ kontrolü']){assert.equal(c.quietSay(t,play),true,t);assert.equal(c.quietSay(t,tut),false,t);}
 assert.equal(c.quietSay('📍 VARDINIZ · Köprü',mission),true);assert.equal(c.quietSay('Köprüyü tut',{...mission,goal:'Köprüyü tut'}),true,'goal text lives on the mission card only');assert.equal(c.quietSay('Köprüyü tut',{...play,goal:'Köprüyü tut'}),false);assert.equal(c.quietSay('Mühimmat bitti',{...mission,goal:'Köprüyü tut'}),false);assert.equal(c.quietSay('📍 VARDINIZ · Köprü',play),false);assert.equal(c.quietSay('İSABET',mission),false);assert.equal(c.quietSay('ANA TOP',mission),false,'weapon change is still confirmed');assert.equal(c.quietSay('DIŞ GÖRÜŞ',null),false);
 assert.equal(c.quietRadio('Navigasyon: Köprü noktasına ulaştınız.',mission),'drop');assert.equal(c.quietRadio('Navigasyon: Rota yeniden hesaplanıyor…',mission),'drop');assert.equal(c.quietRadio('Navigasyon: 150 metre sonra sağa dönün',mission),'voice');
 assert.equal(c.quietRadio('Navigasyon: İkmal Noktası · 120 m',mission),'');assert.equal(c.quietRadio('Navigasyon: Köprü noktasına ulaştınız.',play),'');assert.equal(c.quietRadio('Navigasyon: Köprü noktasına ulaştınız.',tut),'');assert.equal(c.quietRadio('Kaplan 1: Anlaşıldı.',mission),'');});
test('remote has no screen and crew file no longer carries terrain code',()=>{const html=fs.readFileSync(__dirname+'/../index.html','utf8'),css=fs.readFileSync(__dirname+'/ui.css','utf8'),cr=fs.readFileSync(__dirname+'/crew-orders.js','utf8');
 assert.doesNotMatch(html,/data-v="alt"|data-v="bat"|canvas class="gim"|gimbalFrame/);assert.doesNotMatch(css,/#kmd[^{]*\.sc\b|canvas\.gim/);assert.match(html,/experience\/field\.js\?v=/);assert.doesNotMatch(cr,/POSITIONS|separate|keepAway/);
 const sw=fs.readFileSync(__dirname+'/../sw.js','utf8');assert.match(sw,/'experience\/field\.js'/);});
test('mission points sit on valid ground away from base',()=>{const src=fs.readFileSync(__dirname+'/radio-missions.js','utf8');assert.match(src,/c:point\(62,-34\)/);assert.doesNotMatch(src,/point\(-58,8\)/);});
test('armoured carriers no longer unload extra infantry',()=>{const src=fs.readFileSync(__dirname+'/../index.html','utf8');assert.doesNotMatch(src,/dismount\(/);});
