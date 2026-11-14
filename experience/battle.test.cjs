'use strict';
// "Son Takım" savaş çekirdeği: daralan güvenli alan, takımların yerleşimi, uzaktaki takımların hesabı, sıralama ve ödül.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const b=require('./battle.js'),radio=require('./radio-missions.js');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const seeded=seed=>()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
const WS=800;

test('zone runs through every phase and closes after the planned time',()=>{
 const rnd=seeded(11),z=b.zoneInit(WS,rnd);let t=0;while(z.state!=='closed'&&t<5000){b.zoneStep(z,1,WS,rnd);t++;}
 assert.equal(z.state,'closed');assert.equal(z.r,0);assert.ok(Math.abs(t-b.TOTAL_TIME)<=1,'closed at '+t);
 assert.ok(b.TOTAL_TIME>=600&&b.TOTAL_TIME<=900,'a match lasts 10–15 minutes');
});
test('first circle covers the whole map so nobody starts outside',()=>{const z=b.zoneInit(WS,seeded(3));for(const [x,y] of [[WS,WS],[-WS,WS],[WS,-WS],[-WS,-WS],[0,0]])assert.ok(b.outsideBy(z,x,y)<=0);});
for(const seed of [1,7,42,99,2026])test('circles only shrink, stay inside the previous one and keep their centre on the map (seed '+seed+')',()=>{
 const rnd=seeded(seed),z=b.zoneInit(WS,rnd);let prev={x:z.cx,z:z.cz,r:z.r},lastR=z.r;
 for(let t=0;t<b.TOTAL_TIME+5&&z.state!=='closed';t++){
  if(z.state==='wait'){const d=Math.hypot(z.nx-z.cx,z.nz-z.cz);assert.ok(d+z.nr<=z.r+1e-6,'next circle fits inside the current one');assert.ok(Math.abs(z.nx)<=WS&&Math.abs(z.nz)<=WS,'next centre on the map');}
  b.zoneStep(z,1,WS,rnd);assert.ok(z.r<=lastR+1e-6,'radius never grows');lastR=z.r;
 }
});
test('zone timer survives odd time steps',()=>{const rnd=seeded(5);
 for(const dt of [0,-1,NaN,Infinity]){const z=b.zoneInit(WS,rnd),r0=z.r;b.zoneStep(z,dt,WS,rnd);if(dt!==Infinity)assert.equal(z.r,r0);}
 const z=b.zoneInit(WS,rnd);b.zoneStep(z,b.TOTAL_TIME*3,WS,rnd);assert.equal(z.state,'closed');
});
test('zone info reports phase, countdown and state for the status card',()=>{const rnd=seeded(9),z=b.zoneInit(WS,rnd);let i=b.zoneInfo(z);
 assert.deepEqual([i.phase,i.total,i.state,i.left],[1,b.PHASES.length,'wait',b.PHASES[0].wait]);
 b.zoneStep(z,b.PHASES[0].wait+10,WS,rnd);i=b.zoneInfo(z);assert.equal(i.state,'shrink');assert.equal(Math.round(i.left),b.PHASES[0].shrink-10);
 assert.equal(b.clock(125),'2:05');assert.equal(b.clock(0),'0:00');assert.equal(b.clock(-3),'0:00');assert.equal(b.clock(59.2),'1:00');
});
test('damage applies only outside the zone and grows with phase and distance',()=>{const z=b.zoneInit(WS,seeded(2));
 assert.equal(b.zoneDamage(z,0,1),0);assert.equal(b.zoneDamage(z,-5,1),0);assert.equal(b.zoneDamage(z,10,0),0);
 const near=b.zoneDamage(z,5,1),far=b.zoneDamage(z,400,1);assert.ok(near>0&&far>near&&far<=b.PHASES[0].dps*2+1e-9);
 const late={...z,i:b.PHASES.length-1};assert.ok(b.zoneDamage(late,5,1)>near*4,'late circles hurt much more');
 for(let k=1;k<b.PHASES.length;k++)assert.ok(b.PHASES[k].dps>b.PHASES[k-1].dps);
});
test('team sizes follow the squad choice: solo, pair or platoon',()=>{
 assert.deepEqual(b.plan(0),{size:1,squads:14,tanks:14,teams:15});assert.deepEqual(b.plan(1),{size:2,squads:7,tanks:14,teams:8});assert.deepEqual(b.plan(3),{size:4,squads:4,tanks:16,teams:5});
});
test('enemy squads start on valid ground, away from the player and from each other',()=>{const rnd=seeded(21),player={x:300,z:-400};
 const ok=(x,z)=>Math.abs(z-120)>40;const pts=b.placeSquads(14,WS,ok,rnd,player);assert.equal(pts.length,14);
 for(const p of pts){assert.ok(ok(p.x,p.z));assert.ok(Math.abs(p.x)<=WS-60&&Math.abs(p.z)<=WS-60);assert.ok(Math.hypot(p.x-player.x,p.z-player.z)>=380*.6-1e-9);}
 for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++)assert.ok(Math.hypot(pts[i].x-pts[j].x,pts[i].z-pts[j].z)>=230*.5-1e-9);
 assert.equal(b.placeSquads(4,WS,()=>false,rnd,player).length,0,'no valid ground, no squad');
});
test('squads are built with full-health tanks and unique names',()=>{const s=b.makeSquads([{x:1,z:2},{x:3,z:4},{x:5,z:6}],4);
 assert.equal(s.length,3);assert.equal(b.tanksLeft(s),12);assert.equal(b.teamsLeft(s),3);assert.equal(new Set(s.map(q=>q.name)).size,3);assert.ok(s.every(q=>!q.active&&!q.dead));
});
test('an off-field squad walks into the next circle and then stays near it',()=>{const rnd=seeded(4),z={i:0,state:'wait',t:0,cx:0,cz:0,r:1150,nx:200,nz:-100,nr:300};
 const s=b.makeSquads([{x:-700,z:600}],2)[0];const d0=Math.hypot(s.x-z.nx,s.z-z.nz);for(let t=0;t<190;t++)b.driftSquad(s,z,1,rnd);
 const d1=Math.hypot(s.x-z.nx,s.z-z.nz);assert.ok(d1<d0-500,'moved towards the circle');assert.ok(d1<=z.nr,'inside the next circle before it closes: '+d1.toFixed(0));
 for(let t=0;t<300;t++)b.driftSquad(s,z,1,rnd);assert.ok(Math.hypot(s.x-z.nx,s.z-z.nz)<=z.nr+1);
 const on={...s,active:true,x:5,z:5};b.driftSquad(on,z,10,rnd);assert.deepEqual([on.x,on.z],[5,5],'squads on the field are driven by the game, not by this');
});
test('a squad keeps one destination until it arrives or the circle changes, and never leaves the map',()=>{const rnd=seeded(6),z={i:0,state:'wait',t:0,cx:0,cz:0,r:1150,nx:700,nz:700,nr:400};
 const s=b.makeSquads([{x:-600,z:-600}],4)[0];assert.equal(b.squadGoal(s,z,1,rnd,760),true);const w={x:s.wx,z:s.wz};
 assert.ok(Math.abs(w.x)<=760&&Math.abs(w.z)<=760,'destination clamped to the map');assert.ok(Math.hypot(w.x-z.nx,w.z-z.nz)<=z.nr*.6+1||Math.abs(w.x)===760||Math.abs(w.z)===760);
 for(let t=0;t<20;t++)b.squadGoal(s,z,1,rnd,760);assert.deepEqual({x:s.wx,z:s.wz},w,'same destination while marching');
 s.x=z.nx;s.z=z.nz;assert.equal(b.squadGoal(s,z,1,rnd,760),false);assert.notDeepEqual({x:s.wx,z:s.wz},w,'inside the circle it picks a nearby patrol point');assert.ok(Math.hypot(s.wx-s.x,s.wz-s.z)<=111);
});
test('two off-field squads that meet fight until one is gone',()=>{const rnd=seeded(8),[a,c]=b.makeSquads([{x:0,z:0},{x:50,z:0}],4);let kills=0,t=0;
 while(!a.dead&&!c.dead&&t<3000){kills+=b.clashStep(a,c,1,rnd);t++;}
 assert.ok(a.dead||c.dead);assert.ok(t>40,'a platoon fight is not over in seconds: '+t);assert.ok(kills>=4);
 const loser=a.dead?a:c,winner=a.dead?c:a;assert.equal(b.aliveTanks(loser),0);assert.ok(b.aliveTanks(winner)>=0);
 assert.equal(b.clashStep(loser,winner,1,rnd),0,'a dead squad deals and takes nothing');
});
test('placement and rewards: better place, more reward; winner is first',()=>{
 assert.equal(b.placement(0,true),1);assert.equal(b.placement(3,false),4);assert.equal(b.placement(0,false),1);
 const first=b.reward({place:1,teams:5,kills:6}),mid=b.reward({place:3,teams:5,kills:6}),last=b.reward({place:5,teams:5,kills:0});
 assert.ok(first.kr>mid.kr&&mid.kr>last.kr);assert.ok(first.xp>mid.xp&&mid.xp>=last.xp);assert.deepEqual(last,{kr:0,xp:0});
 for(const bad of [{place:0,teams:0},{place:99,teams:5},{}]){const r=b.reward(bad);assert.ok(Number.isFinite(r.kr)&&r.kr>=0&&Number.isFinite(r.xp)&&r.xp>=0);}
});
test('old missions are gone: the radio module only carries orders',()=>{
 for(const gone of ['SCENARIOS','FOES','objectiveStep'])assert.equal(radio[gone],undefined,gone);
 const src=read('experience/radio-missions.js');for(const gone of ['op_temas','convoy','hr-objective','debrief','initMission','hisar-operations-v1'])assert.ok(!src.includes(gone),gone);
 assert.equal(Object.keys(radio.ORDERS).length,10);
});
test('the game loads the battle module and keeps it for offline play',()=>{const html=read('index.html'),sw=read('sw.js');
 assert.match(html,/<script src="experience\/battle\.js\?v=\d+"><\/script>/);assert.ok(sw.includes("'experience/battle.js'"));
 assert.match(html,/<section id="tg">\s*<div id="btCard"><\/div>\s*<\/section>/);assert.match(html,/<button data-t="g">Savaş<\/button>/);
 assert.match(html,/if\(window\.MAPX\)for\(const f of window\.MAPX\)/);
});
test('battle module never touches the garage save or other apps',()=>{const src=read('experience/battle.js');
 assert.doesNotMatch(src,/setItem\(['"](?:m60v2|hisar-)/);assert.doesNotMatch(src,/localStorage\.(?:clear|removeItem)/);assert.match(src,/SAVE='celik-boru-savas-v1'/);
});
const html=read('index.html'),code=html.replace(/data:[a-z]+\/[-a-z0-9+.]+;base64,[A-Za-z0-9+/=]+/g,'data:,'),battle=read('experience/battle.js');
test('engine reads long-range battle settings from the enemy and the difficulty, with the old values as defaults',()=>{
 for(const hook of ['else if(d>(e.pr||75)){','if(d>(e.pr?e.pr*.7:55))mvg=L.sp;',"e.type==='mgn'?60:e.fr||70)",'tg.z,e.bs||38,','life:e.bl||4,','cd=T.cd*(L.rl||1)*','let bd=L.ar||95;','life:L.ar?3.4:2.6'])assert.ok(code.includes(hook),hook);
 assert.match(code,/const a=L\.cone\*18\*\(e\.fr\?\.5\+Math\.hypot\(tx-e\.x,tz-e\.z\)\/120:1\)/,'spread grows with range only in long-range mode');
});
test('fast shells advance in small steps so they cannot pass through a tank between two frames',()=>{
 assert.match(code,/for\(const s of shells\)\{const q=s\.m\.position,ns=Math\.max\(1,Math\.ceil\(Math\.hypot\(s\.vx,s\.vy,s\.vz\)\*dt\/2\)\)/);
 assert.match(code,/for\(const b of ebul\)\{const p=b\.m\.position,ns=Math\.max\(1,Math\.ceil\(Math\.hypot\(b\.vx,b\.vy,b\.vz\)\*dt\/2\)\)/);
 assert.match(code,/for\(const b of abul\)\{const p=b\.m\.position,ns=Math\.max\(1,Math\.ceil\(75\*dt\/2\)\)/);
});
test('fire control leads a moving target for the player and for allied tanks',()=>{
 assert.ok(code.includes('e.vx=Math.sin(e.h)*mvg;e.vz=Math.cos(e.h)*mvg;'));
 assert.ok(code.includes('if(tgt.vx||tgt.vz){qx+=tgt.vx*tt;qz+=tgt.vz*tt;'));assert.ok(code.includes('qx=tg.x+(tg.vx||0)*td/75,qz=tg.z+(tg.vz||0)*td/75'));
});
test('enemy losses not caused by the player give no score, credits, medals or praise',()=>{
 assert.ok(code.includes("if(!e.nc){score+=pt;"));assert.ok(code.includes("if(!e.nc&&(Math.random()<.5||T==='fuel'))radio("));
 assert.equal(code.split('if(was&&!E.includes(e)&&!e.nc){').length-1,2,'credit and crew wrappers');assert.ok(code.includes("if(was&&!E.includes(e)&&game==='play'&&!e.nc){ST.kills++;"));
 assert.match(battle,/function quietKill\(e\)\{e\.nc=1;/);
});
test('battle tuning covers every difficulty and squads never start inside the wake-up range',()=>{
 assert.match(battle,/const TUNE=Object\.freeze\(\{kolay:\{[^}]+\},normal:\{sp:6\.5,cd:4\.2,dmg:22,hp:2\.2\},zor:\{[^}]+\},serbest:\{[^}]+\}\}\)/);
 assert.match(battle,/const MODE='savas',ACTIVATE=400,SLEEP=560,ALERT=250,FOE=210,CLASH=110;/);assert.ok(battle.includes('placeSquads(pl.squads,ws,okSpot,rnd,sp,ACTIVATE+40)'));
 assert.ok(battle.includes('L=Object.assign({},LV[key]||LV.normal,{sp:tune.sp,cd:tune.cd,dmg:tune.dmg,rl:RELOAD,ar:ALLY_RANGE});'));
});
test('result screen shows the placement and six figures; medals use drawn icons, not emoji',()=>{
 const m=code.slice(code.indexOf('// ===== m_stats ====='),code.indexOf('// ===== m_ctx ====='));
 assert.ok(m.includes("(br?'<div class=\"pl\"><b>'+br.place+'</b><span>/ '+br.teams+' takım</span></div>':'')"));
 for(const label of ['İMHA','KREDİ','SÜRE','İSABET','EN UZAK','HASAR'])assert.ok(m.includes('<small>'+label+'</small>'),label);
 for(const gone of ['<small>SKOR</small>','ATIŞ / İSABET','class="st"','REP_LAST','MADALYA KAZANILDI',"id:'hav'","id:'tem'",'Görev Adamı'])assert.ok(!m.includes(gone),gone);
 assert.doesNotMatch(m,/\p{Extended_Pictographic}/u);assert.equal((m.match(/\{id:'[a-z0-9]+',n:'/g)||[]).length,12);
 assert.ok(m.includes("function showMed(m){if(game!=='play')return;"));assert.ok(m.includes("persist();mq.length=0;mt.classList.remove('on');"));
});
test('mission leftovers are deleted from the game, not hidden',()=>{
 for(const gone of ['const STG={q:','window.EVRUN','TOPÇU BASKINI','ÖNCELİKLİ HEDEF','KOMUTA TANKI','const shuf=','const ATP={','window.DAILY','görev bonusu','GERÇEK GÖREVE','karistirici\n{const sm=window.startMission'])assert.ok(!code.includes(gone),gone);
 assert.match(code,/window\.stagePending=\(\)=>false;/);assert.match(code,/window\.startMission=function\(\)\{mT=0;if\(mis==='egitim'\)practice\(\);radio\(MI\[mis\]\.r\)\};/);
});
