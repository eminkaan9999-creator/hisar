"""Deterministic patch release. No sibling applications or tank models are edited."""
from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[1];app=root/'komuta';v='1.2.1'
def edit(path,old,new):
    s=path.read_text()
    if new in s:return
    if s.count(old)!=1:raise RuntimeError('Unexpected source: '+str(path))
    path.write_text(s.replace(old,new,1))
for filename in ['core.js','sw.js','index.html']:
    p=app/filename;s=p.read_text()
    if '1.2.1' not in s:
        if '1.2.0' not in s:raise RuntimeError('Unexpected release in '+filename)
        p.write_text(s.replace('1.2.0',v))
edit(app/'shell.js',"addEventListener('pagehide',()=>{saveScene();try{api?.pause(true);}catch{}});","addEventListener('pagehide',()=>{saveScene();setPause(true);});")
css=app/'app.css';s=css.read_text()
if '/* Keep the outer bar' not in s:
    s+='''\n/* Keep the outer bar from squeezing game controls on compact landscape screens. */
#bar{min-width:0}#bar strong,#bar button{flex-shrink:0}#place{min-width:0;max-width:28vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.spacer{min-width:0}#stage{touch-action:none}#stage iframe{overscroll-behavior:none}#load-message{overflow-wrap:anywhere}
@media(max-width:740px){#place{max-width:18vw;font-size:11px}#bar{gap:6px}#bar strong{letter-spacing:1px}}
'''
    css.write_text(s)
p=root/'scripts/komuta-tank-only-browser.cjs'
edit(p,"out=path.resolve('tank-only-reports')","out=path.resolve(process.env.KOMUTA_STABILITY==='1'?'stability-reports':'tank-only-reports')")
old='await wait("caches.keys().then(k=>k.includes(\'hisar-komuta-site-1.2.0\')&&!k.includes(\'hisar-komuta-site-1.1.1\')&&k.includes(\'hisar-main-KEEP\'))")'
new='await wait("caches.keys().then(k=>k.includes("+JSON.stringify("hisar-komuta-site-"+JSON.parse(fs.readFileSync(root+"/version.json")).v)+")&&!k.includes(\'hisar-komuta-site-1.1.1\')&&k.includes(\'hisar-main-KEEP\'))")'
edit(p,old,new)
edit(p,"await shot('tank');","await shot('tank');\n if(process.env.KOMUTA_STABILITY==='1')await require('./komuta-stability-browser.cjs').checks({ev,child,wait,sleep,send,shot,ok});")
p=app/'version.json';data=json.loads(p.read_text())
if data.get('v') not in ['1.2.0',v] or data.get('construction') is not False:raise RuntimeError('Unexpected game scope')
data['v']=v
data['changes']=['İnşaat oyunu kaldırılmış olarak kalır','Tekrarlanan duraklatma ve ekrana dönüşte kontrol düzeltmesi','Takılı hareket, dokunma ve tetik girişlerini bırakma','Tank görüntü bağlantısı koptuğunda yeniden deneme','Sahne değişiminde grafik ve ses kaynaklarını serbest bırakma']
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
files={str(p.relative_to(app)):hashlib.sha256(p.read_bytes()).hexdigest() for p in app.rglob('*') if p.is_file() and p.name!='publication-hashes.json'}
(app/'publication-hashes.json').write_text(json.dumps(files,sort_keys=True,indent=2)+'\n')
print('KOMUTA',v,len(files),'files; construction remains removed')
