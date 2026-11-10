"""Turkish-only game dialogue. Normal speed, original pitch, no voice cloning."""
import ast, asyncio, hashlib, json, ssl, subprocess
from pathlib import Path
import edge_tts, edge_tts.communicate
edge_tts.communicate._SSL_CTX=ssl.create_default_context()
VOICE='tr-TR-AhmetNeural'
OUT=Path('assets/radio/tr')
source=ast.parse(Path('scripts/comfort-voices.py').read_text())
PHRASES=next(ast.literal_eval(n.value) for n in source.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='PHRASES' for t in n.targets))
PHRASES.update({
 'cmd-follow':'Beni takip edin.', 'cmd-hold':'Bulunduğunuz yerde bekleyin.',
 'cmd-target':'İşaretli hedefe yönelin.', 'cmd-free':'Ateş serbest.',
 'cmd-cease':'Ateşi kesin.', 'cmd-spread':'Aralık açın.', 'cmd-back':'Geri gelin.',
 'cmd-status':'Durum bildirin.', 'cmd-regroup':'Yanımda toplanın.',
 'cmd-move':'Seçtiğim noktaya gidin ve orada bekleyin.',
 'address-all':'Tüm birlik.', 'address-two':'Kaplan bir iki.',
 'address-three':'Kaplan bir üç.', 'address-four':'Kaplan bir dört.', 'address-convoy':'İkmal bir.',
 'move':'Emredersiniz komutanım. Seçtiğiniz noktaya ilerliyorum.',
 'arrived':'Komutanım, gösterdiğiniz noktaya ulaştım. Burada bekliyorum.',
 'blocked':'Komutanım, o noktaya ulaşamıyorum. Başka bir nokta gösterebilir misiniz?',
 'unclear':'Komut anlaşılmadı. Lütfen tekrar eder misiniz?',
 'point-needed':'Gideceğimiz noktayı haritada işaretler misiniz?',
 'contact-front':'Komutanım, ön tarafta bir hedef görüyorum.',
 'contact-right':'Komutanım, sağ tarafta bir hedef görüyorum.',
 'contact-left':'Komutanım, sol tarafta bir hedef görüyorum.',
 'contact-rear':'Komutanım, arka tarafta bir hedef görüyorum.',
 'drone-camera':'Kamera hazır komutanım.',
})
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def validate(p):
 r=subprocess.run(['ffmpeg','-v','error','-nostdin','-xerror','-i',str(p),'-f','null','-'],capture_output=True)
 if r.returncode or r.stderr:raise RuntimeError('MP3 decode failed: '+p.name)
 d=float(json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(p)]))['format']['duration'])
 if not .25<d<45:raise RuntimeError('Invalid duration: '+p.name)
 return d
async def main():
 OUT.mkdir(parents=True,exist_ok=True);clips={}
 for key,text in PHRASES.items():
  path=OUT/(key+'.mp3')
  for attempt in range(3):
   try:
    await asyncio.wait_for(edge_tts.Communicate(text,VOICE,rate='+0%',pitch='+0Hz',volume='+0%').save(str(path)),timeout=45)
    clips[key]={'file':key+'.mp3','text':text,'duration':validate(path),'sha256':sha(path)}
    print('VERIFIED',key,flush=True);break
   except Exception:
    path.unlink(missing_ok=True)
    if attempt==2:raise
    await asyncio.sleep(1+attempt)
 manifest={'version':'2.0.0','provider':'Microsoft Speech','voice':VOICE,'language':'tr-TR','rate':'+0%','pitch':'+0Hz','playbackRate':1,'neural':True,'synthetic':True,'clips':clips}
 (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print('COMPLETE',len(clips),'Turkish Ahmet clips; subjective listening quality not asserted',flush=True)
asyncio.run(main())
