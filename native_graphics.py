"""Restore original HİSAR visuals; keep game models and flight/weapon behaviour intact.
Executed by bootstrap before build. All edits are guarded and idempotent.
"""
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def change(s,old,new):
    if new in s:return s
    if s.count(old)!=1:raise RuntimeError('Native graphics source contract: '+old[:100])
    return s.replace(old,new,1)

def remove_line(s,prefix,marker):
    if marker in s:return s
    lines=s.splitlines(keepends=True);found=[i for i,t in enumerate(lines) if t.startswith(prefix)]
    if len(found)!=1:raise RuntimeError('Native graphics source contract: '+prefix)
    lines[found[0]]=marker+'\n';return ''.join(lines)

p=ROOT/'build.py';s=p.read_text()
s=remove_line(s,"site=required(site,'const GFXLADDER",'# Native HİSAR quality selection preserved; no forced medium preset.')
s=remove_line(s,"rng=rng.replace('if(OPT.d3)init3D();'",'# Native range renderer preserved; no forced 2D override.')
s=change(s,'color.flipY=normal.flipY=false;','color.encoding=T.sRGBEncoding;color.flipY=normal.flipY=false;')
s=s.replace("komuta-1.0.0","komuta-1.1.0").replace("'v':'1.0.0','independent':True","'v':'1.1.0','independent':True")
p.write_text(s)

p=ROOT/'app/core.js';s=p.read_text();s=s.replace("VERSION='1.0.0'","VERSION='1.1.0'");p.write_text(s)
p=ROOT/'app/range.inc.js';s=p.read_text()
s=change(s,"OPT.motion=0;OPT.d3=false;","OPT.motion=0;/* Keep original 3D preference. */")
if 'threeD:!!(OPT.d3&&G3)' not in s:
    s=change(s,"ready:true,paused,shots:S.shots.length","ready:true,paused,threeD:!!(OPT.d3&&G3),rendererReady:!!G3,shots:S.shots.length")
s=change(s,"dispose(){disposed=true;S.started=false;S.trig.down=false;saveST();}","dispose(){disposed=true;S.started=false;S.trig.down=false;saveST();if(G3){G3.r.dispose();G3.r.forceContextLoss();G3=null;}}")
p.write_text(s)

p=ROOT/'app/site.inc.js';s=p.read_text()
s=change(s,"document.documentElement.classList.add('komuta-scene');","document.documentElement.classList.add('komuta-scene');document.body.classList.add('km-native-quality');bChar.id='bChar';bChar.hidden=true;bChar.setAttribute('aria-hidden','true');")
# Replace only the new oversized marker, not any original model or station geometry.
if '// Native-quality readable signs' not in s:
    start=s.index('function putSign(');end=s.index("putSign('POLİGON'",start)
    code="""// Native-quality readable signs: two front faces instead of mirrored double-sided text.
function putSign(text,x,z){
 const can=document.createElement('canvas');can.width=1024;can.height=320;const c=can.getContext('2d');c.fillStyle='#25362e';c.fillRect(0,0,1024,320);c.strokeStyle='#aabb99';c.lineWidth=8;c.strokeRect(8,8,1008,304);c.fillStyle='#edf1df';c.textAlign='center';c.font='bold 72px sans-serif';c.fillText(text,512,188);
 const t=new THREE.CanvasTexture(can);t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(4,R.capabilities.getMaxAnisotropy());
 const group=new THREE.Group();group.name='KOMUTA_SIGN_'+text;group.position.set(x-4.5,heightAt(x-4.5,z),z);
 const mat=new THREE.MeshStandardMaterial({map:t,roughness:.85,metalness:.05,side:THREE.FrontSide});
 for(const side of [1,-1]){const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.8,.875),mat);sign.position.set(0,2.1,side*.015);sign.rotation.y=side===1?0:Math.PI;sign.name='READABLE_SIGN_FACE';group.add(sign);}
 const stand=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,2.1,8),new THREE.MeshStandardMaterial({color:0x47554a,roughness:.72,metalness:.25}));stand.position.y=1.05;stand.castShadow=true;group.add(stand);scene.add(group);return group;
}
"""
    s=s[:start]+code+s[end:]
s=change(s,"personalPortraits:false,frames:perf.n","personalPortraits:false,graphicsReference:'native-hisar',quality:__hs.qual.g,frames:perf.n")
p.write_text(s)

p=ROOT/'app/scene.css';s=p.read_text()
if '/* Native HİSAR graphics boundary */' not in s:s+='''
/* Native HİSAR graphics boundary */
html.komuta-scene body.km-native-quality #bChar,
html.komuta-scene body.km-native-quality #hud .who,
html.komuta-scene body.km-native-quality #bMenu,
html.komuta-scene body.km-native-quality #sig,
html.komuta-scene body.km-native-quality .keys{display:none!important}
.km-native-quality #km-help{left:max(12px,env(safe-area-inset-left));transform:none;max-width:42vw;text-align:left;background:#182b24cf;border-color:#8ca18c55;font:600 12px/1.4 system-ui}
.km-native-quality #km-help small{font-size:10px;font-weight:400}
.km-native-quality #mini{width:112px;height:75px;opacity:.85}
.km-native-quality .tools .tb{font-size:11px;min-height:44px;border-radius:6px;padding:6px 10px}
@media(max-height:450px) and (orientation:landscape){.km-native-quality #km-help{font-size:11px;max-width:39vw}.km-native-quality #km-help small{display:none}.km-native-quality #mini{width:96px;height:64px}.km-native-quality .tools .tb{font-size:10px;padding:5px 8px}}
'''
p.write_text(s)
# Plain-source builds do not contain transport; keeping it must not fail a valid build.
p=ROOT/'.github/workflows/komuta.yml';s=p.read_text();s=s.replace('git rm -r transport','git rm -r --ignore-unmatch transport');p.write_text(s)
print('Native HİSAR graphics restored. Models, cameras, original flight and target logic unchanged.')
