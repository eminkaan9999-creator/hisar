const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
const a=require('./arazi.js'),html=fs.readFileSync(__dirname+'/../index.html','utf8'),sw=fs.readFileSync(__dirname+'/../sw.js','utf8'),re=fs.readFileSync(__dirname+'/realism.js','utf8');
test('olive and pistachio groves are planted in straight rows',()=>{const g=a.grove(0,0,0,4,3);assert.equal(g.length,12);const xs=[...new Set(g.map(p=>p.x.toFixed(3)))];assert.equal(xs.length,4);assert.ok(Math.abs(Math.abs(xs[1]-xs[0])-a.GROVE.col)<1e-9);});
test('south-east border terrain: Syria is dry, no pines there, flat-roofed mud-brick houses, no snow on the horizon',()=>{
 assert.ok(html.includes("if(z>riv(x)-70)continue; // Suriye tarafında ve nehir boyunda çam yok"));assert.ok(html.includes("function kerpic(b,w,d){"));assert.ok(html.includes("kind==='barn')&&z>riv(x)+20)kind='kerpic';"));
 assert.ok(html.includes("float sy=smoothstep(-30.,70.,vWP.z-(94.+sin((vWP.x+60.)*.03)*15.));"));assert.ok(re.includes("snow:9,rock:0x8a7a64"));assert.ok(re.includes("const sy=t.z>riv(t.x)+10;"));});
test('loaded after the menu module and precached',()=>{assert.ok(html.indexOf('experience/menu.js?v=')<html.indexOf('experience/arazi.js?v='));assert.ok(sw.includes("'experience/arazi.js'"));});
