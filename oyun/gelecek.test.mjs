import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,config,stepVehicle,activateDome,fire,canFire,advanceWave,fleetAction,validRun,rating,forecast} from '../komuta/gelecek/model.mjs';
test('both fictional vehicle missions can be completed with normal controls and resumed state',()=>{
  for(const mission of ['neon','eclipse']){
    let s=createRun('boru',mission);
    for(let frame=0;frame<7000&&!s.done;frame++){
      if(s.shield<45)activateDome(s);
      stepVehicle(s,new Set(['go','assist','fire']),.03);
      if(frame===100){s=JSON.parse(JSON.stringify(s));assert.ok(validRun(s,'boru'));}
    }
    assert.ok(s.won,mission);assert.equal(s.kills,config(s).waves*config(s).bots);
    assert.ok(validRun(s,'boru'));assert.ok(rating(s)>0);
    const completed=JSON.stringify(s);stepVehicle(s,new Set(['fire']),.04);assert.equal(JSON.stringify(s),completed);
  }
});
test('vehicle energy, heat, shield costs and cooldowns cannot be bypassed',()=>{
  const s=createRun('boru','neon');
  s.energy=5;assert.equal(fire(s),false);assert.equal(activateDome(s),false);
  s.energy=100;assert.ok(activateDome(s));assert.equal(s.energy,75);assert.equal(activateDome(s),false);
  s.heat=95;assert.equal(canFire(s),false);
  s.heat=0;s.elapsed=100;
  s.enemies.forEach(e=>{e.x=s.x;e.z=s.z+10;e.nextPulse=200;});
  assert.ok(fire(s));assert.equal(fire(s),false);
  assert.equal(validRun({...s,shield:NaN},'boru'),false);
  assert.equal(validRun({...s,mission:'unknown'},'boru'),false);
  assert.equal(validRun({...s,enemies:[null]},'boru'),false);
});
test('both command missions can be won by managing the shared fleet and energy pool',()=>{
  for(const mission of ['orbit','storm']){
    let s=createRun('komuta',mission);
    for(let turn=0;turn<config(s).waves&&!s.done;turn++){
      const worst=s.nodes.map((n,i)=>({n,i})).sort((a,b)=>b.n.threat-a.n.threat)[0].i;
      const weakest=s.nodes.map((n,i)=>({n,i})).sort((a,b)=>a.n.shield-b.n.shield)[0].i;
      fleetAction(s,'strike',worst);fleetAction(s,'guard',weakest);
      for(let i=0;i<3;i++)if(s.nodes[i].shield<65)fleetAction(s,'repair',i);
      advanceWave(s);
      s=JSON.parse(JSON.stringify(s));assert.ok(validRun(s,'komuta'));
    }
    assert.ok(s.done);assert.ok(s.won,mission);assert.equal(s.turn,config(s).waves);
    assert.equal(advanceWave(s),false);
  }
});
test('an undefended command network can fail; resources and cooldowns remain authoritative',()=>{
  const s=createRun('komuta','storm');
  assert.equal(fleetAction(s,'repair',0),false);
  assert.ok(fleetAction(s,'strike',0));
  assert.equal(fleetAction(s,'strike',1),false);
  assert.ok(fleetAction(s,'guard',0));
  assert.equal(fleetAction(s,'guard',1),false);
  const before=forecast(s);advanceWave(s);
  assert.equal(s.nodes[0].threat,Math.max(0,before[0]-9));
  while(!s.done)advanceWave(s);
  assert.equal(s.won,false);assert.equal(rating(s),0);
  assert.equal(fleetAction(s,'repair',0),false);
  assert.equal(validRun({...s,selected:99},'komuta'),false);
  assert.equal(validRun({...s,nodes:[null]},'komuta'),false);
});
