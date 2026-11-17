'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {runtime,backup}=require('./test-support/harekat-runtime.cjs'),core=require('./campaign.js');
const ID=core.ID,KEY=core.KEY;
function setup(options={}){const r=runtime({...options,connected:true});if(r.data.get('m60v2'))Object.assign(r.c.SV,JSON.parse(r.data.get('m60v2')));r.c.HisarModern={spawnConvoy(c){c.modelReady=true;},removeConvoy(){},syncConvoy(){},convoyPassable:()=>true};return r;}
function begin(r){assert.equal(r.start(ID),true);r.to({x:-560,z:82});r.run(.2);assert.equal(r.snapshot().ph,1);r.run(.1);}
function find(r){r.clear();r.to({x:-572,z:236});r.run(.1);assert.equal(r.snapshot().ph,2);r.to({x:-605,z:270});r.run(4.1);assert.equal(r.snapshot().ph,3);}
function repair(r){r.to({x:-605,z:330});r.run(10.1);assert.equal(r.snapshot().wave,0);r.clear();r.run(16.1);assert.equal(r.snapshot().wave,1);r.clear();for(let i=0;i<130&&r.snapshot().ph===3;i++)r.run(.1);assert.equal(r.snapshot().ph,4);}
function deliver(r){for(let i=0;i<1500&&r.snapshot().ph===4;i++){const c=r.snapshot().convoy;r.to({x:c.x+18,z:c.z});r.clear();r.run(.1);}assert.equal(r.snapshot().ph,5);}
test('the primary game is one operation; old missions, stars and unknown metadata remain in their own records',()=>{
 const old={sel:'tepe',mode:'harekat',done:{tepe:1},stars:{tepe:3},future:{value:8}},r=setup({saved:old});assert.equal(r.hk.diagnostics().sel,ID);assert.equal(r.hk.diagnostics().best.tepe,3);assert.equal(JSON.parse(r.data.get('celik-boru-harekat-v1')).future.value,8);
 assert.equal(core.OP.phases.length,7);assert.equal(core.OP.escort.route[0][1],core.OP.obj.z);assert.deepEqual(core.OP.escort.route.at(-1),[core.OP.start.x,core.OP.start.z]);
 r.c.HisarSafak.choose('safak-3');assert.equal(r.hk.diagnostics().sel,'safak-3');r.c.HisarCampaign.choose();assert.equal(r.hk.diagnostics().sel,ID);
});
test('orders are causal: later locations do not skip the approach, ambush, observation or local repair',()=>{
 const r=setup();r.start(ID);r.to({x:-605,z:360});r.run(120);assert.equal(r.snapshot().ph,0);assert.equal(r.c.E.length,0);assert.equal(r.snapshot().convoy.active,false);
 begin(r);assert.equal(r.c.E.length,3);for(const e of r.c.E){e.x=-100;e.z=700;}r.to({x:-572,z:236});r.run(.2);assert.equal(r.snapshot().ph,1,'living ambush units outside the marker cannot count as destroyed');assert.equal(r.c.MAPVIEW_HK().obj.n,core.OP.phases[1].n);r.to({x:-605,z:360});r.run(30);assert.equal(r.snapshot().ph,1);assert.equal(r.c.E.length,3);find(r);
 r.to({x:-548,z:20});r.run(100);assert.equal(r.snapshot().wave,-1);assert.equal(r.snapshot().ph,3);assert.equal(r.snapshot().convoy.active,false);
 r.to({x:-605,z:330});r.run(10.1);assert.equal(r.snapshot().wave,0);r.run(100);assert.equal(r.snapshot().ph,3,'live attackers prevent repair completion');
 assert.equal(r.snapshot().convoy.x,-605);assert.equal(r.snapshot().convoy.z,360,'the same truck remains at the repair site');
});
test('a failed mandatory enemy spawn cannot count as a cleared ambush or an automatic win',()=>{
 const r=setup();r.c.addE=()=>null;r.start(ID);r.to({x:-560,z:82});r.run(.3);assert.equal(r.snapshot().lost,true);assert.equal(r.snapshot().won,false);assert.equal(r.hk.diagnostics().done[ID],undefined);
});
test('counterattack belongs to the return route, fires once, and outstanding enemies prevent delivery',()=>{
 const r=setup();begin(r);find(r);repair(r);assert.equal(r.c.E.length,0);assert.equal(r.snapshot().convoy.z,360);r.to({x:0,z:20});
 let spawned=0,old=r.c.addE;r.c.addE=function(){spawned++;return old.apply(this,arguments);};
 r.run(20);assert.equal(spawned,0,'waiting beside the repair site cannot spawn the return ambush');
 for(let i=0;i<1500&&!spawned;i++){const c=r.snapshot().convoy;r.to({x:c.x+18,z:c.z});r.run(.1);}assert.equal(spawned,2);assert.equal(r.snapshot().ph,4);r.run(30);assert.equal(spawned,2);
 r.clear();deliver(r);assert.equal(r.snapshot().won,false);r.to({x:-548,z:20});r.run(5.1);assert.equal(r.snapshot().won,true);assert.equal(r.snapshot().stars,3);assert.equal(r.hk.diagnostics().done[ID],1);assert.equal(r.c.HisarCampaign.read(),null);
});
test('convoy health is a genuine mission condition and the third star measures its survival',()=>{
 const star=require('./harekat.js').stars;
 assert.equal(star(core.OP,{won:true,hp:1,convoy:.74,allies:true,t:1}),2);assert.equal(star(core.OP,{won:true,hp:.49,convoy:.9}),2);assert.equal(star(core.OP,{won:false,hp:1,convoy:1}),0);
 const r=setup();begin(r);find(r);r.to({x:-605,z:330});r.run(.2);const e=r.c.E[0]||{hk:{},x:-605,z:340};const t=r.c.pickTgt(e,999);assert.ok(t.al&&t.al.hkConvoy,'broken convoy can be hit during repair');r.c.hitAl(t.al,1000);r.run(.1);assert.equal(r.snapshot().lost,true);assert.equal(r.hk.diagnostics().done[ID],undefined);
});
test('safe phase checkpoints restore the same tank, ammunition, surviving allies and convoy without replaying prior enemies',()=>{
 const r=setup({rewards:true});begin(r);r.c.P.hp=112;r.c.P.dz.eng=42;r.c.TA=[12,5,2,0];r.c.AL.pop();r.c.score=160;find(r);const cp=r.c.HisarCampaign.read();assert.equal(cp.phase,3);assert.equal(cp.player.hp,112);assert.equal(cp.allies.length,2);
 r.c.endGame(0,'controlled loss');assert.equal(r.c.HisarCampaign.read().rewarded,true);const xp=r.c.SV.xp;
 const s=setup({data:r.data,rewards:true});assert.equal(s.hk.resumeCampaignCheckpoint(),true);assert.equal(s.snapshot().ph,3);assert.equal(s.c.E.length,0);assert.equal(s.c.P.hp,112);assert.equal(s.c.P.dz.eng,42);assert.deepEqual(Array.from(s.c.TA),[12,5,2,0]);assert.equal(s.c.AL.length,2);assert.equal(s.c.score,0);assert.equal(s.c.SV.xp,xp,'resume preserves permanent progress without minting stored points');
 assert.equal(JSON.parse(s.data.get('m60v2')).xp,xp);assert.equal(xp,160);
 repair(s);const phase4=s.c.HisarCampaign.read();assert.equal(phase4.phase,4);s.c.game='menu';assert.equal(s.hk.resumeCampaignCheckpoint(),true);assert.equal(s.snapshot().ph,4);assert.equal(s.snapshot().convoy.z,360);assert.equal(s.c.E.length,0);
 deliver(s);s.c.game='menu';assert.equal(s.hk.resumeCampaignCheckpoint(),true);assert.equal(s.snapshot().ph,5);assert.equal(s.snapshot().convoy.delivered,true);assert.equal(s.snapshot().convoy.x,-548);
});
test('old checkpoint, XP, stars and unrelated applications survive new checkpoint backups and tombstones',()=>{
 const r=setup();r.data.set('celik-boru-ilk-isik-v1',JSON.stringify({sentinel:'old-safe-data'}));r.data.set('independent-app','keep');begin(r);find(r);const cp=JSON.parse(r.data.get(KEY)),b=backup(r.data),code=b.api.code();assert.equal(b.api.restore(code).ok,true);assert.equal(r.data.get('independent-app'),'keep');assert.equal(JSON.parse(r.data.get('celik-boru-ilk-isik-v1')).sentinel,'old-safe-data');
 r.c.HisarCampaign.clear(cp.sessionStartedAt);const tomb=JSON.parse(r.data.get(KEY));assert.equal(b.api.restore(code).ok,true);assert.deepEqual(JSON.parse(r.data.get(KEY)),tomb);assert.equal(core.latest({...cp,player:{...cp.player,hp:-2}},cp).player.hp,cp.player.hp);
});
test('invalid checkpoints, failed storage and a stale tab cannot replace a coherent safe snapshot',()=>{
 const r=setup();begin(r);find(r);const cp=r.c.HisarCampaign.read();for(const bad of [{...cp,phase:1},{...cp,schema:2},{...cp,convoy:{hp:0}},{...cp,ammunition:{capacity:[1],shells:[1]}}]){assert.equal(r.c.HisarCampaign.write(bad),false);assert.equal(core.normalise(bad),null);}
 r.c.denyWrite=true;assert.equal(r.c.HisarCampaign.clear(cp.sessionStartedAt),false);assert.equal(r.c.HisarCampaign.read().phase,3);r.c.denyWrite=false;assert.equal(r.c.HisarCampaign.write({...cp,sessionStartedAt:cp.sessionStartedAt+100}),true);assert.equal(r.c.HisarCampaign.clear(cp.sessionStartedAt),false);assert.equal(r.c.HisarCampaign.diagnostics().error,'stale');
});
