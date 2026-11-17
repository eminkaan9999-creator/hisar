'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {backup,key}=require('./test-support/harekat-runtime.cjs');
test('backup round trip includes mission completions and stars on a fresh device',()=>{
 const src=backup(new Map([['m60v2',JSON.stringify({xp:120,kr:50})],[key,JSON.stringify({mode:'harekat',sel:'depo',done:{tepe:1},stars:{tepe:3}})]]));
 const code=src.api.code(),dst=backup();assert.equal(dst.api.restore(code).ok,true);
 assert.equal(JSON.parse(dst.data.get(key)).done.tepe,1);assert.equal(JSON.parse(dst.data.get(key)).stars.tepe,3);
 assert.equal(JSON.parse(dst.data.get('m60v2')).xp,120);
});
test('restore preserves greater current stars and unions completed missions',()=>{
 const src=backup(new Map([['m60v2','{"xp":10}'],[key,'{"done":{"depo":1},"stars":{"tepe":1,"depo":2}}']]));
 const dst=backup(new Map([['m60v2','{"xp":30}'],[key,'{"done":{"tepe":1},"stars":{"tepe":3}}']]));
 assert.equal(dst.api.restore(src.api.code()).ok,true);const s=JSON.parse(dst.data.get(key));
 assert.equal(s.done.tepe,1);assert.equal(s.done.depo,1);assert.equal(s.stars.tepe,3);assert.equal(s.stars.depo,2);
});
test('legacy backup without missions still restores and leaves current mission bytes intact',()=>{
 const src=backup(new Map([['m60v2','{"xp":10}'],['celik-boru-savas-v1','{"wins":4}']]));
 const current='{"done":{"batarya":1},"stars":{"batarya":3}}',dst=backup(new Map([[key,current]]));
 assert.equal(dst.api.restore(src.api.code()).ok,true);assert.equal(dst.data.get(key),current);
 assert.equal(JSON.parse(dst.data.get('celik-boru-savas-v1')).wins,4);
});
test('invalid checksum does not write any save',()=>{
 const src=backup(new Map([['m60v2','{"xp":10}']])),dst=backup();
 assert.equal(dst.api.restore(src.api.code()+'bad').ok,false);assert.equal(dst.writes.length,0);
});
test('mission backup addition does not include or write unrelated application keys',()=>{
 const src=backup(new Map([['m60v2','{"xp":10}'],['hisar-akademi-private','{"secret":1}']])),dst=backup();
 assert.equal(dst.api.restore(src.api.code()).ok,true);assert.equal(dst.data.has('hisar-akademi-private'),false);
 assert.ok(dst.writes.every(k=>['m60v2','celik-boru-savas-v1',key].includes(k)));
});
