"""Generate ordinary game dialogue with the existing HİSAR Akademi Microsoft voice.
No passwords, real military documents, or live microphone data are sent.
Normal rate/pitch; fail instead of manufacturing an eSpeak replacement.
"""
import asyncio, hashlib, json, ssl, subprocess, sys
from pathlib import Path
import edge_tts, edge_tts.communicate
edge_tts.communicate._SSL_CTX = ssl.create_default_context()
VOICE = 'en-US-BrianMultilingualNeural'
OUT = Path('assets/radio/neural')
PHRASES = {
 'ack':'Emredersiniz komutanım.',
 'follow':'Emredersiniz komutanım. Sizi takip ediyorum.',
 'hold':'Emredersiniz komutanım. Burada bekliyorum.',
 'target':'Emredersiniz komutanım. İşaretli hedefe yöneliyorum.',
 'free':'Emredersiniz komutanım. Anlaşıldı.',
 'cease':'Emredersiniz komutanım. Ateşi kestim.',
 'spread':'Emredersiniz komutanım. Aralık açıyorum.',
 'back':'Emredersiniz komutanım. Geri geliyorum.',
 'regroup':'Emredersiniz komutanım. Yanınızda toplanıyorum.',
 'convoy-wait':'Emredersiniz komutanım. Konvoy bekliyor.',
 'convoy-go':'Emredersiniz komutanım. Konvoy devam ediyor.',
 'status':'Komutanım, durum raporum ekranda. Göreve devam ediyorum.',
 'ready':'Birlik hazır komutanım. Önce çevreyi inceleyelim.',
 'phase':'Bu aşama tamamlandı. Sıradaki görev ekranda.',
 'rest':'Bölge temiz. Yeni hedef gelmeden önce hazırlanabilirsiniz.',
 'ground':'Yeni bir kara hedefi geliyor. Acele etmeyin.',
 'air':'Kara hedefi temizlendi. Sırada tek bir helikopter var.',
 'drone':'Uçangöz hazır. Kontrol sizde komutanım.',
 'reload':'Yeniden dolduruluyor.',
 'hit':'Hedef vuruldu.',
 'success':'Görev tamamlandı komutanım. Güzel iş çıkardık.',
 'failure':'Bu kez olmadı komutanım. Hazır olduğunuzda tekrar deneyebiliriz.',
 'damage':'Araç hasar aldı. Biraz geri çekilip toparlanalım.',
 'rescue':'Kayıp ekibin işaretini uçangözle bulalım. Ardından tankla ekibi alıp birlikte üsse döneceğiz.',
 'convoy':'İkmal aracını yalnız bırakmayalım. Hazır olduğunuzda telsizden takip emri verin.',
 'relay':'Önce iki bağlantıyı onaralım. Ardından sırayla gelen hedeflere karşı bölgeyi koruyacağız.',
 'fog':'Rota işaretlerini sırayla geçelim. Son noktada dost tanklarımızı bekleyeceğiz.',
 'record':'Üç işareti uçangözle inceleyelim. Kaydı bulduktan sonra tankla alıp üsse götüreceğiz.',
 'return':'Birliğimizle buluşup bölgedeki görevi tamamlayalım. Dönüşte kimseyi geride bırakmayacağız.',
}
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def validate(p):
 result=subprocess.run(['ffmpeg','-v','error','-nostdin','-xerror','-i',str(p),'-f','null','-'],capture_output=True)
 if result.returncode or result.stderr:raise RuntimeError('Invalid audio '+p.name)
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(p)]))
 duration=float(info['format']['duration'])
 if not .5 < duration < 45:raise RuntimeError('Unexpected audio length '+p.name)
 return duration
async def main():
 OUT.mkdir(parents=True,exist_ok=True);items={}
 for key,text in PHRASES.items():
  path=OUT/(key+'.mp3');error=None
  for attempt in range(3):
   try:
    await asyncio.wait_for(edge_tts.Communicate(text,VOICE,rate='+0%',pitch='+0Hz',volume='+0%').save(str(path)),timeout=50)
    items[key]={'file':key+'.mp3','text':text,'duration':validate(path),'sha256':digest(path)}
    print('VERIFIED',key,round(items[key]['duration'],2),flush=True);error=None;break
   except Exception as e:
    error=e;path.unlink(missing_ok=True);await asyncio.sleep(1+attempt)
  if error:raise RuntimeError('Microsoft audio failed: '+key) from error
 manifest={'version':'1.0.0','provider':'Microsoft Speech','voice':VOICE,'rate':'+0%','pitch':'+0Hz','playbackRate':1,'synthetic':True,'neural':True,'clips':items}
 (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print('COMPLETE',len(items),'normal-speed neural clips',flush=True)
asyncio.run(main())
