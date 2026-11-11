"""Package the verified game for its own URL. Never edit sibling applications."""
from pathlib import Path
import hashlib,json,re
root=Path('public').resolve()
script=r'''/* KOMUTA save isolation: no writes to sibling-game keys. */
(function(){'use strict';const prefix='hisar-komuta-standalone-v1:';
for(const name of ['localStorage','sessionStorage']){let raw;try{raw=window[name];}catch{continue;}
 const own=()=>{const keys=[];for(let i=0;i<raw.length;i++){const k=raw.key(i);if(k&&k.startsWith(prefix))keys.push(k.slice(prefix.length));}return keys;};
 const methods={getItem(k){return raw.getItem(prefix+String(k));},setItem(k,v){raw.setItem(prefix+String(k),String(v));},removeItem(k){raw.removeItem(prefix+String(k));},key(i){return own()[Number(i)]??null;},clear(){for(const k of own())raw.removeItem(prefix+k);}};
 const storage=new Proxy(methods,{get(t,k){if(k==='length')return own().length;if(k===Symbol.toStringTag)return 'Storage';if(typeof k==='symbol')return undefined;if(k in t)return t[k];return t.getItem(k)??undefined;},set(t,k,v){t.setItem(k,v);return true;},deleteProperty(t,k){t.removeItem(k);return true;},ownKeys(){return own();},getOwnPropertyDescriptor(t,k){if(own().includes(k))return {configurable:true,enumerable:true,writable:true,value:t.getItem(k)};}});
 Object.defineProperty(window,name,{configurable:true,get:()=>storage});
}window.KomutaStorageIsolation=Object.freeze({prefix});})();
'''
(root/'storage-scope.js').write_text(script)
for rel,src in [('index.html','storage-scope.js'),('site/index.html','../storage-scope.js'),('poligon/index.html','../storage-scope.js'),('tank/index.html','storage-scope.js')]:
 p=root/rel;s=p.read_text()
 if rel=='tank/index.html':
  marker='<base href="../">'
  if s.count(marker)!=1:raise RuntimeError('Tank base contract changed')
  s=s.replace(marker,marker+'<script src="'+src+'"></script>',1)
 else:
  m=re.search(r'<head\b[^>]*>',s,re.I)
  if not m:raise RuntimeError('Missing head '+rel)
  s=s[:m.end()]+'<script src="'+src+'"></script>'+s[m.end():]
 p.write_text(s)
worker=root/'sw.js';s=worker.read_text()
s=s.replace("komuta-1.1.0","hisar-komuta-site-1.1.1").replace("startsWith('komuta-')","startsWith('hisar-komuta-site-')")
s=s.replace("CORE=['./'","CORE=['storage-scope.js','./'")
s=s.replace("if(e.request.method!=='GET'||u.origin!==self.location.origin)return;","if(e.request.method!=='GET'||u.origin!==self.location.origin||!u.pathname.startsWith(new URL(self.registration.scope).pathname))return;")
worker.write_text(s)
p=root/'manifest.webmanifest';m=json.loads(p.read_text());m.update(id='./',start_url='./',scope='./');p.write_text(json.dumps(m,ensure_ascii=False,indent=2))
p=root/'version.json';v=json.loads(p.read_text());v.update(v='1.1.1',sourceCommit='1de116f4055da9d8845554d05cd688df3736efa7',publication='standalone-pages',independent=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2))
p=root/'core.js';s=p.read_text().replace("VERSION='1.1.0'","VERSION='1.1.1'");p.write_text(s)
(root/'.nojekyll').touch()
files=[p for p in root.rglob('*') if p.is_file()]
assert not any(re.search(r'^(?:face.*|chars\.json|eye.*|hair.*|kaan_.*|sohbetler\.txt)$',p.name,re.I) for p in files)
Path('standalone-hashes.json').write_text(json.dumps({p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files},indent=2))
print('Independent package ready:',len(files),'files. Sibling apps unchanged.')
