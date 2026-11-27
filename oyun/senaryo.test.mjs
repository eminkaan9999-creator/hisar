import test from 'node:test';import assert from 'node:assert/strict';
import {newRun,valid,stops,chooseStop,preparation,handover,command,occupied} from '../komuta/ortak/senaryo.mjs';
test('Beyaz Geçit requires a stationary handover at both distinct destinations before returning',()=>{
  for(const first of [1,2]){
    const s=newRun('boru');assert.equal(chooseStop(s,first),false);
    assert.equal(handover(s),false);preparation(s,'crewChecked');assert.equal(handover(s),false);preparation(s,'loadChecked');assert.equal(handover(s),true);assert.equal(chooseStop(s,first),true);
    for(const target of [first,3-first,0]){assert.equal(s.target,target);assert.equal(handover(s),false);Object.assign(s,{x:stops[target].x,z:stops[target].z});assert.equal(handover(s,4),false);if(target)assert.equal(handover(s,0,3-target),false);assert.equal(handover(s,0,target),true);}
    assert.ok(s.done);assert.equal(s.receipts.length,2);assert.ok(valid(JSON.parse(JSON.stringify(s)),'boru'));assert.equal(handover(s),false);
  }
});
test('Gece Nöbeti verifies requests, enforces crew availability and requires signed returns',()=>{
  const s=newRun('komuta');const doIt=(a,i,t)=>assert.equal(command(s,a,i,t),true);
  assert.equal(command(s,'assign',0,1),false);assert.equal(command(s,'verify',2),false);assert.equal(command(s,'finish'),false);
  doIt('verify',1);assert.equal(command(s,'assign',1,0),false);doIt('assign',1,1);doIt('verify',0);assert.equal(command(s,'assign',0,1),false);doIt('assign',0,0);assert.ok(occupied(s,0));
  doIt('tick');assert.equal(command(s,'close',0),false);doIt('tick');doIt('verify',2);doIt('assign',2,0);doIt('close',1);doIt('close',0);
  doIt('tick');doIt('tick');doIt('close',2);doIt('finish');assert.equal(command(s,'tick'),false);assert.ok(valid(s,'komuta'));
});
test('late completions retain the real closure time and remain playable',()=>{
  const s=newRun('komuta');for(let i=0;i<8;i++)command(s,'tick');
  command(s,'verify',1);command(s,'assign',1,1);command(s,'tick');command(s,'tick');command(s,'close',1);
  assert.equal(s.jobs[1].closed,10);
});
test('invalid and old save formats are rejected without touching legacy keys',()=>{
  for(const x of [null,{},newRun('boru'),{...newRun('komuta'),jobs:[null]}])assert.equal(valid(x,'komuta'),false);
});
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
test('release receipts, worker caches and both HTML entry points match the shipped files',async()=>{
  for(const [app,id] of [['','boru'],['komuta/','komuta']]){
    const base=new URL('../'+app,import.meta.url);
    const file=name=>readFile(new URL(name,base));
    const version=JSON.parse(await file('version.json')),ctx={self:{},importScripts(){}};
    vm.runInNewContext(String(await file('sw.js')),ctx);
    assert.equal(String(version.v),ctx.self.gameRevision);assert.match(String(await file('index.html')),new RegExp('data-game="'+id+'"'));
    const receipts=id==='komuta'?JSON.parse(await file('publication-hashes.json')):null;
    for(const name of version.assets){const data=await file(name);assert.ok(data.length);if(receipts)assert.equal(createHash('sha256').update(data).digest('hex'),receipts[name]);}
    for(const path of ctx.self.gameFiles)assert.ok(version.assets.includes(path));
  }
});
import {drive} from './surus.mjs';
test('both delivery orders and the return leg remain drivable with route assistance',()=>{
  for(const first of [1,2]){
    const s=newRun('boru'),held=new Set(['go']);preparation(s,'crewChecked');preparation(s,'loadChecked');handover(s);chooseStop(s,first);
    for(const dest of [first,3-first,0]){
      let speed=0,accepted=false;
      for(let i=0;i<1800&&!accepted;i++){speed=drive(s,speed,held,.025,true);accepted=handover(s,speed,dest);}
      assert.ok(accepted,'stop '+dest+' in order '+first);
    }assert.ok(s.done);
  }
});
