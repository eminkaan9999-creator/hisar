'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const core=require('./checkpoint.js'),{runtime,backup,key}=require('./test-support/harekat-runtime.cjs');
const setup=(options={})=>runtime({...options,campaign:true});
function position(r){r.to({x:70,z:58});r.run(.2);return r.c.HisarCheckpoint.read();}
function waveCleared(r){r.run(35);r.clear();r.run(.2);return r.c.HisarCheckpoint.read();}
const plain=v=>JSON.parse(JSON.stringify(v));
test('only a safe first-chapter boundary can create a checkpoint; active waves never overwrite it',()=>{
 const r=setup();r.start('safak-1');r.run(50);assert.equal(r.c.HisarCheckpoint.read(),null);const c=position(r);assert.equal(c.clearedWave,-1);assert.equal(c.phase,1);
 r.run(35);assert.equal(r.snapshot().wave,0);assert.ok(r.c.E.length);r.c.P.hp=20;r.run(5);assert.equal(r.c.HisarCheckpoint.read().player.hp,c.player.hp);assert.equal(r.c.HisarCheckpoint.read().updatedAt,c.updatedAt);
 const hp=r.c.P.hp;r.clear();r.run(.2);assert.equal(r.c.HisarCheckpoint.read().clearedWave,0);assert.equal(r.c.HisarCheckpoint.read().player.hp,hp);
});
test('continue after a page restart restores cleared waves, health, damaged parts, ammunition and surviving allies',()=>{
 const r=setup();r.start('safak-1');position(r);r.run(35);r.clear();r.c.P.hp=95;r.c.P.dz={trk:40,eng:70,tur:80};r.c.TA=[10,5,2,0];r.c.AL[1].dead=true;r.c.AL[0].hp=45;r.c.cd=2;r.run(.2);const saved=r.c.HisarCheckpoint.read();
 const next=setup({data:new Map(r.data)});next.c.SV.xp=900;assert.equal(next.hk.resumeCheckpoint(),true);assert.equal(next.snapshot().wave,0);assert.equal(next.snapshot().ph,1);assert.ok(Math.abs(next.c.P.hp-95)<.001);assert.deepEqual(plain(next.c.P.dz),{trk:40,eng:70,tur:80});assert.deepEqual(Array.from(next.c.TA),[10,5,2,0]);assert.equal(next.c.AL.length,2);assert.deepEqual(next.c.AL.map(a=>a.idx),[0,2]);assert.equal(next.c.AL[0].hp,45);assert.equal(next.c.SV.xp,900);assert.equal(next.c.SV.form,3);assert.ok(next.snapshot().t>=saved.elapsed);
 next.run(24);assert.equal(next.snapshot().wave,0);next.run(1.1);assert.equal(next.snapshot().wave,1);assert.ok(next.c.E.length>0);assert.equal(next.snapshot().won,false);
});
test('loss preserves the safe checkpoint and the final live wave still prevents an early win after continuing',()=>{
 const r=setup();r.start('safak-1');position(r);waveCleared(r);r.run(25);r.clear();r.run(.2);assert.equal(r.c.HisarCheckpoint.read().clearedWave,1);r.c.endGame(0,'test loss');assert.equal(r.hk.resumeCheckpoint(),true);
 r.run(30.1);assert.equal(r.snapshot().wave,2);assert.equal(r.snapshot().won,false);r.clear();r.run(.1);assert.equal(r.snapshot().won,true);assert.equal(r.c.HisarCheckpoint.read(),null);assert.equal(JSON.parse(r.data.get(core.KEY)).removed,true);
 assert.equal(JSON.parse(r.data.get(key)).done['safak-1'],1);
});
test('pause cannot restart the battle from a checkpoint and other chapters cannot replace it',()=>{
 const r=setup();r.start('safak-1');const c=position(r);r.c.openMenu();assert.equal(r.hk.resumeCheckpoint(),false);assert.equal(r.snapshot().op,'safak-1');r.start('safak-2');r.to({x:-560,z:178});r.run(1);assert.deepEqual(plain(r.c.HisarCheckpoint.read()),plain(c));
});
test('first chapter telegraphs each attacker once, then permits normal fire; legacy battles retain their first shot',()=>{
 const r=setup();r.start('safak-1');position(r);r.run(35);const e=r.c.E[0];r.c.eshot(e);assert.equal(r.events.filter(e=>e.kind==='enemy-shot').length,0);assert.equal(r.c.spotted(e),true);r.c.eshot(e);assert.equal(r.events.filter(e=>e.kind==='enemy-shot').length,1);const second=r.c.E[1];r.c.eshot(second);assert.equal(r.events.filter(e=>e.kind==='radio'&&e.text.includes('Düşman ateşe hazırlanıyor')).length,1);
 r.start('gecit');r.run(55);r.c.eshot(r.c.E[0]);assert.equal(r.events.filter(e=>e.kind==='enemy-shot').length,2);
});
test('a deferred enemy shot targeting an ally cannot access a missing projectile or retarget an older round',()=>{
 const vm=require('node:vm'),html=require('./test-support/harekat-runtime.cjs').production('index.html'),begin=html.indexOf('function fireEnemyAt('),end=html.indexOf('\nfunction eshot(',begin),code=html.slice(begin,end),old={al:'old target'},ally={hp:100},c={ebul:[old],hAt:()=>0,eshot(){}};vm.createContext(c);vm.runInContext(code,c);assert.equal(c.fireEnemyAt({bs:38},{x:1,z:2,al:ally}),null);assert.equal(old.al,'old target');c.eshot=()=>c.ebul.push({});const shot=c.fireEnemyAt({bs:38},{x:1,z:2,al:ally});assert.equal(shot.al,ally);assert.equal(old.al,'old target');
});
test('an active drone delays checkpoint creation until it is safely back at the tank',()=>{
 const r=setup();r.c.mode='tank';r.c.DR={on:true};r.start('safak-1');r.to({x:70,z:58});r.run(.2);assert.equal(r.c.HisarCheckpoint.read(),null);r.c.DR.on=false;r.run(.1);assert.ok(r.c.HisarCheckpoint.read());
});
test('malformed, future-schema, wrong-map and partial snapshots cannot start a game or alter progress',()=>{
 const r=setup();r.start('safak-1');const good=plain(position(r));
 for(const change of [{schema:2},{rules:9},{operation:'safak-4'},{clearedWave:2},{elapsed:NaN},{player:{...good.player,x:10000}},{ammunition:{capacity:[26,16,7,14],shells:[200,0,0,0]}},{allies:[good.allies[0],good.allies[0]]}])assert.equal(core.normalise({...good,...change}),null);
 const next=setup({data:new Map([[core.KEY,'{broken'],['unrelated-app','keep']])});next.c.SV.xp=800;assert.equal(next.hk.resumeCheckpoint(),false);assert.equal(next.c.game,'menu');assert.equal(next.c.SV.xp,800);assert.equal(next.data.get('unrelated-app'),'keep');
});
test('storage failure reports failure while retaining the last valid checkpoint and permanent achievements',()=>{
 const r=setup({saved:{done:{tepe:1},stars:{tepe:3}}});r.start('safak-1');const c=plain(position(r));r.run(35);r.clear();r.c.denyWrite=true;r.run(.2);assert.equal(r.c.HisarCheckpoint.diagnostics().error,'storage');assert.deepEqual(plain(r.c.HisarCheckpoint.read()),c);assert.equal(JSON.parse(r.data.get(key)).stars.tepe,3);
});
test('an older tab cannot overwrite or clear a checkpoint belonging to a newer session',()=>{
 const r=setup();r.start('safak-1');const c=plain(position(r));const newer={...c,sessionStartedAt:c.sessionStartedAt+1000,updatedAt:c.updatedAt+1000,clearedWave:1};assert.equal(r.c.HisarCheckpoint.write(newer),true);assert.equal(r.c.HisarCheckpoint.write(c),false);assert.equal(r.c.HisarCheckpoint.clear(c.sessionStartedAt),false);assert.equal(r.c.HisarCheckpoint.read().clearedWave,1);
});
test('backup restore chooses a complete checkpoint, keeps newer local state and honours completed-game tombstones',()=>{
 const r=setup();r.start('safak-1');const old=plain(position(r)),newer={...old,updatedAt:old.updatedAt+1000,clearedWave:1,player:{...old.player,x:80,hp:70},ammunition:{...old.ammunition,shells:[2,0,0,0]}};
 const save=v=>new Map([['m60v2',JSON.stringify({xp:100})],[core.KEY,JSON.stringify(v)],['unrelated-app','keep']]);
 const incoming=backup(save(old)),local=backup(save(newer));assert.equal(local.api.restore(incoming.api.code()).ok,true);assert.deepEqual(JSON.parse(local.data.get(core.KEY)),newer);assert.equal(local.data.get('unrelated-app'),'keep');
 const empty=backup();assert.equal(empty.api.restore(local.api.code()).ok,true);assert.deepEqual(JSON.parse(empty.data.get(core.KEY)),newer);
 const tombstone={schema:1,rules:1,operation:'safak-1',sessionStartedAt:newer.sessionStartedAt,updatedAt:newer.updatedAt+1000,removed:true};const completed=backup(save(tombstone));completed.api.restore(incoming.api.code());assert.equal(JSON.parse(completed.data.get(core.KEY)).removed,true);assert.equal(core.latest(newer,tombstone).removed,true);
});
test('a corrupt newer local checkpoint cannot prevent restoring a valid older backup, and a corrupt incoming record cannot replace a valid checkpoint',()=>{
 const r=setup();r.start('safak-1');const good=plain(position(r)),bad={...good,updatedAt:good.updatedAt+1000,player:{...good.player,hp:NaN}};
 const data=v=>new Map([['m60v2',JSON.stringify({xp:100})],[core.KEY,JSON.stringify(v)]]),valid=backup(data(good)),invalid=backup(data(bad));assert.equal(invalid.api.restore(valid.api.code()).ok,true);assert.deepEqual(JSON.parse(invalid.data.get(core.KEY)),good);
 const source=backup(data(bad));assert.equal(valid.api.restore(source.api.code()).ok,true);assert.deepEqual(JSON.parse(valid.data.get(core.KEY)),good);
});
