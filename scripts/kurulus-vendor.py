"""Vendor existing pinned Three r128 dependencies and verified native Turkish audio."""
from pathlib import Path
import re, urllib.request, hashlib, json, subprocess
root=Path(__file__).resolve().parents[1]
source=(root/'santiye-250888c5/index.html').read_text()
urls=re.findall(r'<script src="(https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/[^"]+)"',source)
out=root/'shared/vendor/three-r128';out.mkdir(parents=True,exist_ok=True)
records={}
for u in urls:
 rel=u.split('examples/js/')[1];url='https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/js/'+rel
 p=out/Path(rel).name
 if not p.exists():
  with urllib.request.urlopen(url,timeout=40) as r:p.write_bytes(r.read())
 records[p.name]={'source':url,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
license=out/'LICENSE.txt'
if not license.exists():
 with urllib.request.urlopen('https://raw.githubusercontent.com/mrdoob/three.js/r128/LICENSE',timeout=40) as r:license.write_bytes(r.read())
if records:(out/'provenance.json').write_text(json.dumps(records,indent=2)+'\n')
voice=root/'assets/radio/tr';donor='20f1078238a03bbe1043ac62522e3851af202a2d'
if not (voice/'manifest.json').exists():
 subprocess.run(['git','fetch','--no-tags','--depth=1','origin',donor],check=True)
 files=subprocess.check_output(['git','ls-tree','-r','--name-only',donor,'assets/radio/tr/'],text=True).splitlines()
 if not files:raise RuntimeError('No verified voice files found')
 for name in files:
  if not re.fullmatch(r'assets/radio/tr/[a-z0-9-]+\.(mp3|json)',name):raise ValueError(name)
  p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(subprocess.check_output(['git','show',donor+':'+name]))
m=json.loads((voice/'manifest.json').read_text())
assert m['voice']=='tr-TR-AhmetNeural' and m['rate']=='+0%' and m['pitch']=='+0Hz' and m['playbackRate']==1
for clip in m['clips'].values():
 assert re.fullmatch(r'[a-z0-9-]+\.mp3',clip['file'])
 assert hashlib.sha256((voice/clip['file']).read_bytes()).hexdigest()==clip['sha256']
print('Verified',len(records),'Three dependencies and',len(m['clips']),'native Turkish clips')
