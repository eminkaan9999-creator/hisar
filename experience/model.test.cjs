const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
const M=require('./model.js'),sw=fs.readFileSync(__dirname+'/../sw.js','utf8'),yml=fs.readFileSync(__dirname+'/../.github/workflows/live-smoke.yml','utf8'),src=fs.readFileSync(__dirname+'/model.js','utf8');
const dir=__dirname+'/../assets/mdl/',files=fs.readdirSync(dir).filter(f=>f.endsWith('.bin')).sort();
const rd=f=>{const b=fs.readFileSync(dir+f);return M.parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));};
test('every supplied model is shipped as a small binary with its own normals and stays within a phone budget',()=>{assert.equal(files.length,30);
 for(const f of files){const d=rd(f),t=d.ni/3,far=/_uzak|_orta/.test(f);assert.ok(d.nor&&d.nor.length===d.nv*3,f+' carries normals');assert.equal(d.pos.length,d.nv*3);assert.equal(d.uv.length,d.nv*2);
  assert.ok(t>300&&t<(f==='mahalle.bin'?60000:far?8000:25000),f+' triangles '+t);let mx=0;for(let i=0;i<d.idx.length;i++)mx=Math.max(mx,d.idx[i]);assert.ok(mx<d.nv,f+' indices in range');
  for(let i=0;i<Math.min(d.nor.length,3000);i+=3){const l=Math.hypot(d.nor[i],d.nor[i+1],d.nor[i+2]);assert.ok(l>.9&&l<1.1,f+' unit normal '+l);}}
 assert.ok(rd('mahalle.bin').grid&&rd('mahalle.bin').grid.n===16,'the old quarter keeps its height grid');});
test('each near model has a far version at least four times lighter',()=>{for(const f of files){if(/_uzak|_orta/.test(f))continue;const lo=files.find(q=>q===f.replace('.bin','_uzak.bin'))||files.find(q=>q===f.replace('.bin','_orta.bin'));assert.ok(lo,f+' has a far version');
  if(/_uzak/.test(lo))assert.ok(rd(lo).ni*4<rd(f).ni,f+' far is much lighter');assert.deepEqual(rd(lo).size.map(v=>+v.toFixed(3)),rd(f).size.map(v=>+v.toFixed(3)),f+' same bounding box');}});
test('detail levels go to the nearest objects first and overflow to the next level',()=>{assert.deepEqual(Array.from(M.assign([5,50,10,300,70,20],[{r:30,max:2},{r:100,max:2},{r:1e9}])),[0,1,0,2,2,1]);
 assert.deepEqual(Array.from(M.assign([5,500],[{r:30,max:1},{r:100}])),[0,-1],'beyond the last level nothing is drawn');assert.deepEqual(Array.from(M.assign([],[{r:1}])),[]);});
test('far cards: a tree is two crossed quads on the trunk axis, a wall section one quad in the wall plane',()=>{const t=M.treeCard(4,5);assert.equal(t.pos.length,24);assert.equal(t.idx.length,24,'both faces of both quads');assert.deepEqual(t.idx.slice(6,9),[0,2,1],'second face is the first one reversed');for(let i=1;i<24;i+=3)assert.equal(t.nor[i],1,'lit from above on every side');assert.deepEqual(t.uv.slice(0,8),[0,0,.5,0,.5,1,0,1]);assert.deepEqual(t.uv.slice(8),[.5,0,1,0,1,1,.5,1]);
 for(let i=0;i<24;i+=3)assert.ok(t.pos[i+1]===0||t.pos[i+1]===5);const w=M.wallCard(6,-1,5);assert.deepEqual(w.pos,[0,-1,3,0,-1,-3,0,5,-3,0,5,3]);assert.equal(w.idx.length,6);});
test('parts cut from one model keep their place: the parser reports where each box centre sat in the original',()=>{const b=rd('ejderha_govde.bin'),d=rd('ejderha_canak.bin');assert.equal(b.off.length,2);
 assert.ok(d.off[1]>b.off[1]+.2,'the dish sits toward the rear of the trailer '+d.off[1]+' '+b.off[1]);assert.ok(Math.abs(b.min[0]+b.size[0]/2)<1e-6&&Math.abs(b.min[2]+b.size[2]/2)<1e-6,'x and z are centred on the box');});
test('helpers: wheel axis, move and scale, normals follow a non-uniform scale',()=>{const pos=new Float32Array([0,0,0, 2,0,0, 1,10,5]);const a=M.axis(pos,0,.1);assert.equal(a.x,1);assert.equal(a.z,0);assert.equal(a.n,2);
 M.move(pos,-1,0,0,2,3,4);assert.deepEqual(Array.from(pos),[-2,0,0,2,0,0,0,30,20]);const n=M.scaleNormals(new Float32Array([1,1,0]),1,2,1);assert.ok(Math.abs(Math.hypot(n[0],n[1],n[2])-1)<1e-6&&n[0]>n[1]);});
test('driving scene imports the model reader and all active models and textures are available offline',()=>{
 const driving=fs.readFileSync(__dirname+'/../oyun/surus.mjs','utf8'),release=JSON.parse(fs.readFileSync(__dirname+'/../version.json','utf8'));
 assert.ok(driving.includes("import '../experience/model.js'"));
 assert.ok(yml.includes("readFileSync('version.json'"));
 for(const match of driving.matchAll(/new URL\('\.\.\/(assets\/[^']+)'/g)){
  const asset=match[1];assert.ok(fs.existsSync(__dirname+'/../'+asset));assert.ok(release.assets.includes(asset));assert.ok(sw.includes(JSON.stringify(asset)));
 }
 assert.ok(src.includes('p.gone&&(p.seen||++p.age>600)'),'props of removed infantry are dropped');assert.ok(src.includes('if(p.force){p.isHi=true;nh++;continue;}'));});

// Exercise actual prop creation: distant models do not add shadow casters.
test('supplied vehicle props receive ground shadows while only the near detail casts a shadow',()=>{
 const vm=require('node:vm'),c={document:{},THREE:{Mesh:class {constructor(g,m){this.geometry=g;this.material=m;}}}};c.window=c;vm.runInNewContext(src,c);const g={add(){}},p=c.HisarModel.prop(g,{},null,{},{});assert.equal(p.hi.castShadow,true);assert.equal(p.lo.castShadow,false);assert.equal(p.hi.receiveShadow,true);const off=c.HisarModel.prop(g,{},null,{},{shadow:false,receive:false});assert.equal(off.hi.castShadow,false);assert.equal(off.hi.receiveShadow,false);
});
