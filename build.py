"""Build an independent, portrait-free HİSAR: KOMUTA. No network or hidden edits."""
from pathlib import Path
import re,json,shutil,base64,hashlib
ROOT=Path(__file__).resolve().parent
SRC=ROOT/'original';OUT=ROOT/'public';APP=ROOT/'app'
if OUT.exists():shutil.rmtree(OUT)
OUT.mkdir()
def save(path,text):
 p=OUT/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text,encoding='utf-8')
def required(text,old,new):
 if text.count(old)!=1:raise RuntimeError('Source contract changed: '+old[:100])
 return text.replace(old,new,1)
def span(text,start,end,replacement):
 a=text.index(start);b=text.index(end,a)
 return text[:a]+replacement+text[b:]
def remove_integrations(text):
 text=re.sub(r'<!-- hisar-kurulus-1 -->\s*<link[^>]+kurulus\.css[^>]*>\s*<script[^>]+kurulus-core[^>]*></script>\s*<script[^>]+kurulus-runtime[^>]*></script>\s*<script>if\(window\.HisarKurulus\).*?</script>','',text,flags=re.S)
 text=re.sub(r'<script[^>]+src=["\'][^"\']*shared/(?:tank-adapter|kurulus-entry)[^"\']*["\'][^>]*></script>','',text)
 text=re.sub(r'<link[^>]+(?:fonts\.googleapis|fonts\.gstatic)[^>]*>','',text)
 text=re.sub(r'navigator\.serviceWorker\.register\([^)]*\)',"Promise.resolve(null)",text)
 return text
personal=re.compile(r'^(?:chars\.json|face.*|eye.*|hair.*|kaan_.*|sohbetler\.txt)$',re.I)
for p in SRC.rglob('*'):
 if not p.is_file():continue
 r=p.relative_to(SRC)
 if personal.match(p.name):continue
 if str(r).startswith(('experience/','assets/radio/tr/','shared/vendor/','poligon/','santiye-250888c5/')) and p.suffix not in ('.cjs','.py') and not p.name.endswith('.test.js'):
  q=OUT/r;q.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,q)
for name in ['three.min.js','icon-192.png','icon-512.png','apple-touch-icon.png','favicon-32.png']:
 if (SRC/name).exists():shutil.copyfile(SRC/name,OUT/name)
if not (OUT/'favicon-32.png').exists():shutil.copyfile(OUT/'icon-192.png',OUT/'favicon-32.png')
for name in ['index.html','app.css','shell.js','core.js','scene.css']:
 shutil.copyfile(APP/name,OUT/name)
# Extract embedded images into separately cached assets without changing geometry.
embedded={}
def externalize(text,prefix):
 def repl(m):
  ext={'jpeg':'jpg','png':'png','webp':'webp'}.get(m[1],'bin');b=base64.b64decode(m[2]);key=hashlib.sha256(b).hexdigest()[:16];name=f'assets/embedded/{key}.{ext}';p=OUT/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b);embedded[name]=len(b);return prefix+name
 return re.sub(r'data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)',repl,text)
# Native tank Uçangöz visual, not the replacement procedural model.
tank=(SRC/'index.html').read_text();a=tank.index('window.DRNX_DATA=')+len('window.DRNX_DATA=');d,_=json.JSONDecoder().raw_decode(tank[a:])
for key in ('col','nrm'):
 if key in d:d[key]=externalize(d[key],'../')
save('assets/ucangoz/model.json',json.dumps(d,separators=(',',':')))
js="""(function(){let data;async function create(T){if(!data){const r=await fetch('../assets/ucangoz/model.json');if(!r.ok)throw Error('Uçangöz model');data=await r.json();}const D=data,s=atob(D.bin),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);const G=D.parts.map(p=>{const q=new Uint16Array(b.buffer,p.off,p.nv*3),u=new Uint16Array(b.buffer,p.off+p.nv*6,p.nv*2),ix=new Uint16Array(b.buffer,p.off+p.nv*10,p.ni),pos=new Float32Array(p.nv*3),uv=new Float32Array(p.nv*2);for(let i=0;i<p.nv;i++){for(let k=0;k<3;k++)pos[i*3+k]=p.mn[k]+q[i*3+k]*p.sc[k];uv[i*2]=u[i*2]/65535;uv[i*2+1]=u[i*2+1]/65535;}const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setIndex(new T.BufferAttribute(new Uint16Array(ix),1));g.computeVertexNormals();return g;});const loader=new T.TextureLoader(),load=url=>new Promise((ok,no)=>loader.load(url,ok,undefined,no));const [color,normal]=await Promise.all([load(D.col),load(D.nrm)]);color.flipY=normal.flipY=false;const m=new T.MeshStandardMaterial({map:color,normalMap:normal,normalMapType:T.ObjectSpaceNormalMap,roughness:.62,metalness:.25});const root=new T.Group(),body=new T.Mesh(G[0],m);root.add(body);const rot=[];for(let i=0;i<4;i++){const r=new T.Group();r.position.fromArray(D.hubs[i]);r.add(new T.Mesh(G[i+1],m));root.add(r);rot.push(r);}root.userData.rot=rot;root.name='UCANGOZ-ORIGINAL-TANK-MODEL';return root;}window.KomutaNativeDrone={create};})();"""
save('native-ucangoz.js',js)
site=(SRC/'santiye-250888c5/index.html').read_text();site=remove_integrations(site)
site=span(site,'// Installed inside the existing construction scene closure;',"})().catch(e =>",'\n'+(APP/'site.inc.js').read_text()+'\n')
site=span(site,'  // the officers: heads reshaped to their photos','  if (el) el.textContent = "YÜKLENİYOR %0";','  // Personal faces and scanned heads are not loaded in KOMUTA.\n')
site=span(site,'function loadTexts() {','// ---------------- per frame ----------------', 'function loadTexts() {}\n')
site=span(site,'function checkVersion() {','function lifeStart()', 'function checkVersion() {}\n')
site=span(site,'function portraitOf(o) {','const PLAYABLE =',"function portraitOf(o) { return ''; }\n")
site=span(site,'function officerCards() {','officerCards();',"function officerCards() { const el=document.getElementById('cards');if(el){el.hidden=true;el.replaceChildren();} }\n")
site=span(site,'function openPicker() {','function closePicker(',"function openPicker(){ return; }\n")
site=span(site,'(function warmUp() {','window.__hs.detl = DETL;','// First visible frame only: no all-world synchronous shader warmup.\n')
site=span(site,'function mkOfficer(key, scale) {','// faces stay readable',"function mkOfficer(key, scale) { const S=mkSoldier(null,scale);if(S){S.setHelmet(true);S.key=key;}return S; }\n")
site=required(site,'const GFXLADDER = ["ultra", "high", "mid", "low"], GFX0 = MOBILE ? 2 : 0;','const GFXLADDER = ["ultra", "high", "mid", "low"], GFX0 = 2;')
site=required(site,'const dt = Math.min(.05, (now - last) / 1000);','const elapsed=(now-last)/1000;const dt=Number.isFinite(elapsed)?Math.max(0,Math.min(.05,elapsed)):0;')
site=required(site,'last = now; TT += dt;', 'last = now; if(!running||document.hidden){if(!stopped)requestAnimationFrame(loop);return;} TT += dt;')
site=site.replace('setTimeout(end, 60000);','setTimeout(end, 15000);')
site=site.replace('<title>Hisar Şantiye</title>','<title>HİSAR KOMUTA · Üs</title>')
site=site.replace('</head>','<link rel="stylesheet" href="../scene.css"><script src="../core.js"></script><script src="../native-ucangoz.js"></script></head>',1)
site=externalize(site,'../');site=site.replace('const PNAME = "FURKAN TEĞMEN";','const PNAME = "KOMUTAN";')
save('site/index.html',site)
# Move only generic world assets. Personal photo/head assets never enter the published site.
shutil.move(str(OUT/'santiye-250888c5/assets'),str(OUT/'site/assets'));shutil.rmtree(OUT/'santiye-250888c5')
save('site/version.json',json.dumps({'v':'komuta-1.0.0','note':'Bağımsız KOMUTA üssü'},ensure_ascii=False))
# Preserve the complete original tank code, cameras and models in its own scene.
tank=remove_integrations(tank);tank=externalize(tank,'')
tank=tank.replace('<head>','<head><base href="../">',1)
tank=tank.replace('</body>','<script src="tank-komuta.js"></script></body>')
# Native Turkish voice must be installed before legacy speech adapters.
tank=tank.replace('<!-- HISAR EXPERIENCE v1 -->','<script src="radio-tr.js"></script>\n<!-- HISAR EXPERIENCE v1 -->')
save('tank/index.html',tank);shutil.copyfile(APP/'tank.js',OUT/'tank-komuta.js')
radio=(SRC/'shared/radio-tr.js').read_text().replace("new URL('../assets/radio/tr/'","new URL('assets/radio/tr/'")
save('radio-tr.js',radio)
# A physically reached range; its selection comes before firing, not another scenario list.
rng=(SRC/'poligon/index.html').read_text();rng=remove_integrations(rng)
a=rng.index('// Retain all original range models, targets and modes.');b=rng.index('\n})();',a)
rng=rng[:a]+(APP/'range.inc.js').read_text()+rng[b:]
rng=rng.replace('href="manifest.webmanifest"','href="../manifest.webmanifest"')
rng=rng.replace('https://eminkaan9999-creator.github.io/hisar/poligon/','./').replace('https://eminkaan9999-creator.github.io/hisar/','../')
rng=rng.replace('</head>','<link rel="stylesheet" href="../scene.css"></head>',1)
rng=rng.replace('if(OPT.d3)init3D();','OPT.d3=false;if(OPT.d3)init3D();')
rng=rng.replace('setTimeout(()=>wLoadAll(false),1500);','// Equipment images load when selected, not all at startup.')
rng=rng.replace('if(!handleHash())openMenu();','// KOMUTA opens its equipment bench after arriving on foot.')
save('poligon/index.html',rng)
# Runtime fonts are local system fonts; unused original app manifests/workers are removed.
for q in [OUT/'poligon/sw.js',OUT/'poligon/manifest.webmanifest']:
 if q.exists():q.unlink()
# Dedicated PWA metadata and lazy, versioned cache; no sibling-app cache deletion.
save('manifest.webmanifest',json.dumps({'name':'HİSAR: KOMUTA','short_name':'KOMUTA','description':'Yürüyerek üs, poligon, iş makineleri, tank ve Uçangöz.','lang':'tr','start_url':'./','scope':'./','display':'standalone','orientation':'landscape','background_color':'#10181a','theme_color':'#121a1d','icons':[{'src':'icon-192.png','sizes':'192x192','type':'image/png'},{'src':'icon-512.png','sizes':'512x512','type':'image/png'}]},ensure_ascii=False,indent=2))
save('sw.js',"""'use strict';const CACHE='komuta-1.0.0',CORE=['./','index.html','app.css','core.js','shell.js','manifest.webmanifest','icon-192.png'];self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('komuta-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;if(u.pathname.endsWith('/version.json'))return;const key=new Request(u.origin+u.pathname);e.respondWith((async()=>{const c=await caches.open(CACHE),hit=await c.match(key);if(hit)return hit;const r=await fetch(e.request);if(r.ok&&r.type!=='opaque')await c.put(key,r.clone());return r;})().catch(()=>new Response('Alan çevrimdışı hazır değil. İnternet bağlantısıyla bir kez aç.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})));});""")
save('version.json',json.dumps({'name':'HİSAR: KOMUTA','v':'1.0.0','independent':True,'changes':['Yaya üs başlangıcı','Yakınlık gerektiren poligon ve Uçangöz etkileşimi','Kişisel yüz modelleri ve kartları kaldırıldı','Özgün araçlar ve Uçangöz hareketi korundu']},ensure_ascii=False,indent=2))
save('_headers','/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: same-origin\n  Cache-Control: public, max-age=0, must-revalidate\n')
# No personal-face assets or other apps in either output or source selection.
for p in OUT.rglob('*'):
 if p.is_file() and personal.match(p.name):raise AssertionError('Personal asset leaked: '+str(p))
report={'files':sum(p.is_file() for p in OUT.rglob('*')),'bytes':sum(p.stat().st_size for p in OUT.rglob('*') if p.is_file()),'siteHtmlBytes':(OUT/'site/index.html').stat().st_size,'tankHtmlBytes':(OUT/'tank/index.html').stat().st_size,'externalImages':len(embedded),'personalAssets':0}
(ROOT/'build-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
