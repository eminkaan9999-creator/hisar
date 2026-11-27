import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,restore,begin,finish,goals,qualityFor,nextQuality,MISSIONS} from './model.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
test('only supported construction chapters are launched',()=>{assert.deepEqual(MISSIONS.map(m=>m.chapter),[0,1,4,7]);assert.deepEqual([...new Set(MISSIONS.map(m=>m.era))],[2026,2045]);const s=fresh();assert.equal(begin(s,'bad'),false);assert.equal(s.run,null);assert.ok(begin(s,'ikmal'));assert.equal(s.flight,null);});
test('flight completion requires actual flight and a returned drone',()=>{assert.deepEqual(goals('tarama'),[false,false,false]);assert.deepEqual(goals('tarama',{drone:{flight:{seconds:9,status:'airborne'}}}),[true,true,false]);assert.deepEqual(goals('tarama',{drone:{flight:{seconds:9,status:'docked'}}}),[true,true,true]);assert.equal(goals('ikmal',{progress:{scan:2},drone:{flight:{status:'airborne'}}})[1],false);});
test('new saves restore active work and reject corrupt records without touching legacy keys',()=>{const s=fresh();begin(s,'yol');s.run.seconds=41;s.flight={progress:{road:3}};const restored=restore(JSON.parse(JSON.stringify(s)));assert.equal(restored.run.seconds,41);assert.equal(restored.flight.progress.road,3);assert.equal(restore({schema:29,run:{id:'oops',seconds:1}}).run,null);assert.deepEqual(restore({schema:29,records:[null]}).records,[]);});
test('reports are created once and free play does not invent a completed task',()=>{const s=fresh();begin(s,'tarama');s.run.seconds=38.6;assert.equal(finish(s).seconds,39);assert.equal(finish(s),null);assert.equal(s.records.length,1);begin(s,'free');assert.equal(finish(s),null);assert.equal(s.records.length,1);});
test('automatic quality starts cheaply and can reduce the load',()=>{assert.equal(qualityFor('auto',false),'low');assert.equal(qualityFor('high',true),'high');assert.equal(nextQuality('high',50),'mid');assert.equal(nextQuality('mid',50),'low');assert.equal(nextQuality('mid',20),'mid');});
test('shell defers the full engine',async()=>{const html=await readFile(new URL('./index.html',import.meta.url),'utf8');assert.doesNotMatch(html,/three\.min|simulator\.html|assets\//);});
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
test('simplification removes repeated faces while preserving winding and texture coordinates',async()=>{
 const THREE=require('../three.min.js');const source=await readFile(new URL('./simulator.html',import.meta.url),'utf8');const start=source.indexOf('function decimateGeo('),end=source.indexOf('\nconst grid =',start);const simplify=new Function('THREE',source.slice(start,end)+';return decimateGeo;')(THREE);
 const geometry=new THREE.PlaneGeometry(2,2,1,1),index=Array.from(geometry.index.array);geometry.setIndex([...index,...index]);const result=simplify(geometry,.001);
 assert.equal(result.index.count,6);assert.ok(result.attributes.uv);assert.ok(result.attributes.normal);for(const n of result.attributes.normal.array)assert.ok(Number.isFinite(n));result.computeBoundingBox();assert.equal(result.boundingBox.min.x,-1);assert.equal(result.boundingBox.max.x,1);
});
