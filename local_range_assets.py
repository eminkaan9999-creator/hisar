"""Keep HİSAR's local photographic surfaces available in the independent range."""
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def edit(s,old,new):
 if new in s:return s
 if s.count(old)!=1:raise RuntimeError('Local graphics source contract: '+old[:100])
 return s.replace(old,new,1)
p=ROOT/'build.py';s=p.read_text()
needle="rng=(SRC/'poligon/index.html').read_text();rng=remove_integrations(rng)"
replacement=needle+"\n"+'''# Native HİSAR environment files are already part of the independent build.
rng=span(rng,'function realAssets(sc,skyM,ground,r,aniso){','const HAVA=',(APP/'local-range-assets.inc.js').read_text()+'\\n')
rng=required(rng,'const treeG=new T3.ConeGeometry(2.6,11,7);treeG.translate(0,5.5,0);','const treeG=komutaFoliageGeometry(T3);')
rng=required(rng,'new T3.MeshLambertMaterial({color:0x3f4d2f}),340','new T3.MeshLambertMaterial({color:0x3f4d2f,transparent:true,opacity:0}),340')
rng=required(rng,"if(OPT.gq!=='dusuk'&&OPT.real!==0)setTimeout(()=>realAssets(sc,skyM,ground,r,aniso),400);","if(OPT.real!==0)setTimeout(()=>realAssets(sc,skyM,ground,r,aniso),0);")
rng=required(rng,'new T3.ConeGeometry(rr,h,7),hillMat','new T3.SphereGeometry(rr,16,10).scale(1,h/(2*rr),.85),hillMat')
'''
s=edit(s,needle,replacement);p.write_text(s)
p=ROOT/'app/range.inc.js';s=p.read_text();s=edit(s,"document.documentElement.classList.add('komuta-scene');","document.documentElement.classList.add('komuta-scene');document.body.classList.add('km-native-range');")
s=edit(s,"rendererReady:!!G3,shots:","rendererReady:!!G3,localAssetsReady:!!(G3&&G3.localAssets&&G3.localAssets.ground&&G3.localAssets.berm&&G3.localAssets.foliage),localAssetErrors:G3?.localAssets?.errors||[],shots:")
p.write_text(s)
p=ROOT/'app/scene.css';s=p.read_text()
if '/* Native range viewport */' not in s:s+='''
/* Native range viewport */
.km-native-range .top,.km-native-range .fig{display:none!important}
.km-native-range #km-range-menu{top:8px;right:50%;transform:translateX(50%);min-height:44px;font-size:11px;padding:6px 12px;background:#192b23e8;border-color:#9aad8a75}
'''
p.write_text(s)
print('Local original textures replace external range downloads; cone vegetation replaced with original photo cutouts.')
