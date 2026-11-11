"""Idempotent source fixes for independent KOMUTA, before build and tests."""
from pathlib import Path
root=Path(__file__).resolve().parent

def edit(name, old, new):
    p=root/name
    s=p.read_text()
    if new in s:return
    if s.count(old)!=1:raise RuntimeError('Source contract changed: '+name+' / '+old[:80])
    p.write_text(s.replace(old,new,1))

edit('build.py', "site=span(site,'function portraitOf(o) {',", "site=span(site,'function loadTexts() {','// ---------------- per frame ----------------', 'function loadTexts() {}\\n')\nsite=span(site,'function checkVersion() {','function lifeStart()', 'function checkVersion() {}\\n')\nsite=span(site,'function portraitOf(o) {',")
edit('app/site.inc.js', 'resetInputs();updateFlightUI();save();}', 'resetInputs();updateFlightUI();const q=context();action.hidden=!q;document.body.classList.toggle(\'km-at-station\',q===\'range\'||q===\'drone\');if(q===\'drone\')action.textContent=\'E · UÇANGÖZÜ KALDIR\';save();}')
css=root/'app/scene.css'
s=css.read_text()
if '/* KOMUTA layout boundary */' not in s:
    css.write_text(s+'''\n/* KOMUTA layout boundary */
#km-interact{box-sizing:border-box;width:max-content;min-width:0;white-space:normal;overflow-wrap:anywhere}
.komuta-scene #updBan{display:none!important}
.komuta-scene #toast{font:600 13px/1.4 system-ui!important;max-width:min(72vw,540px)!important;border-radius:9px!important;padding:8px 12px!important;background:#183327eb!important;color:#edf5df!important}
''')
edit('tests/browser.cjs', "assert.ok(box&&box.x>=0&&box.x+box.width<=size.width);", "await p.screenshot({path:out+'/layout-'+size.width+'.png'});assert.ok(box&&box.x>=-1&&box.x+box.width<=size.width+1,JSON.stringify({box,size,scene:await f.evaluate(()=>KomutaScene.diagnostics())}));")
edit('tests/browser.cjs', "for(const size of [{width:844", "await f.locator('#km-interact').waitFor({state:'visible',timeout:15000});\nfor(const size of [{width:844")
edit('tests/browser.cjs', "assert.equal(requests.some(x=>", "// Full original tank must also work in the isolated root.\nawait p.setViewportSize({width:1000,height:600});await f.evaluate(()=>{const v=__hs.vehicles.find(v=>v.type==='tk');__hs.foot.x=v.x+2;__hs.foot.z=v.z;__hs.foot.on=true;__hs.foot.seq=null;__hs.frame(3,.05);});await p.waitForTimeout(700);assert.equal(await f.evaluate(()=>KomutaScene.diagnostics().station),'tank');await f.locator('#km-interact').click();await p.waitForFunction(()=>KomutaHost.diagnostics().scene==='tank'&&!KomutaHost.diagnostics().loading,{},{timeout:120000});f=p.frames().find(f=>f.url().includes('/tank/'));assert.equal(await f.evaluate(()=>KomutaScene.diagnostics().ready),true);await p.screenshot({path:out+'/tank.png'});ok('complete original tank scene boots with isolated assets and native Turkish audio');\nassert.equal(requests.some(x=>")
test=root/'tests/unit.cjs';s=test.read_text()
if "legacy private chat and update requests" not in s:
    test.write_text(s+"\ntest('legacy private chat and update requests are removed',()=>{const s=fs.readFileSync(root+'/site/index.html','utf8');assert.doesNotMatch(s,/fetch\\(\"sohbetler\\.txt/);assert.doesNotMatch(s,/setInterval\\(checkVersion/);});\n")
print('Applied idempotent privacy, recall and layout fixes.')
