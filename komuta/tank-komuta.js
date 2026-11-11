/* KOMUTA lifecycle bridge. Original tank models, missions and flight controls stay intact. */
(function(){
 'use strict';
 const H=window.parent?.KomutaHost;if(!H||window.parent===window)return;
 document.documentElement.classList.add('komuta-tank');
 let paused=false,wasPlaying=false,done=false,readyTimeout=null,contextLost=false;
 const attempt=fn=>{try{return fn();}catch{return undefined;}};
 function releaseInputs(){
  attempt(()=>window.HisarInputGuard?.release());
  attempt(()=>{if(typeof keys==='object')for(const key of Object.keys(keys))keys[key]=0;});
  attempt(()=>{if(typeof joy==='object'){joy.x=0;joy.y=0;}});
  attempt(()=>{if(typeof jid!=='undefined')jid=null;if(typeof lid!=='undefined')lid=null;if(typeof hold!=='undefined')hold=0;});
  attempt(()=>{if(typeof sv!=='undefined')sv=0;if(typeof gix!=='undefined')gix=0;if(typeof giy!=='undefined')giy=0;if(typeof gv!=='undefined')gv=0;});
  attempt(()=>{if(window.AA)window.AA.hold=0;if(window.CRUISE)window.CRUISE.on=0;});
  attempt(()=>window.HisarControls?.reset());
 }
 function stopAudio(){
  attempt(()=>window.HisarOperations?.close());
  attempt(()=>window.HisarRadioSound?.stop());
  attempt(()=>window.HisarImmersive?.stop());
 }
 function suspendAudio(){attempt(()=>{if(typeof AC!=='undefined'&&AC?.state==='running')Promise.resolve(AC.suspend()).catch(()=>{});});}
 function resumeAudio(){attempt(()=>{if(!done&&!document.hidden&&typeof AC!=='undefined'&&AC?.state==='suspended')Promise.resolve(AC.resume()).catch(()=>{});});}
 function pause(value){
  const next=!!value;if(done||next===paused)return;
  paused=next;
  if(next){
   // Native blur may already have paused the game before the parent button receives its click.
   wasPlaying=typeof game!=='undefined'&&(game==='play'||game==='pause');
   attempt(()=>{if(game==='play')game='pause';});
   releaseInputs();stopAudio();suspendAudio();
  }else{
   releaseInputs();
   attempt(()=>{if(wasPlaying&&game==='pause'){if(typeof closeMenu==='function')closeMenu();else game='play';}});
   wasPlaying=false;resumeAudio();
  }
 }
 function lost(event){
  if(done)return;event.preventDefault();contextLost=true;pause(true);
  if(typeof H.fail==='function')H.fail('tank',window,'Görüntü bağlantısı kesildi. Tank alanını yeniden açabilir veya ana menüye dönebilirsin.');
  else H.notice('Görüntü bağlantısı kesildi. Tank alanını yeniden aç.');
 }
 const api={owner:window,pause,
  sound(value){attempt(()=>{sndOn=value?1:0;SV.voice=value?1:0;SV.radioV=value?1:0;});if(!value)stopAudio();},
  snapshot:()=>({}),canLeave:()=>done||contextLost||typeof DR==='undefined'||!DR.on,
  dispose(){
   if(done)return;pause(true);done=true;clearInterval(timer);clearTimeout(readyTimeout);releaseInputs();stopAudio();
   attempt(()=>{game='menu';});
   attempt(()=>{R.domElement.removeEventListener('webglcontextlost',lost);R.setAnimationLoop?.(null);R.dispose();R.forceContextLoss?.();});
   attempt(()=>{if(typeof AC!=='undefined'&&AC&&AC.state!=='closed')Promise.resolve(AC.close()).catch(()=>{});});
  },
  diagnostics:()=>({ready:!done,paused,disposed:done,contextLost,vehicles:typeof MODELS==='undefined'?null:Object.keys(MODELS).length})
 };
 const timer=setInterval(()=>{
  if(done||typeof game==='undefined'||!window.HisarGameBridge?.snapshot().ready)return;
  clearInterval(timer);clearTimeout(readyTimeout);
  attempt(()=>R.domElement.addEventListener('webglcontextlost',lost));
  window.KomutaScene=api;H.connect('tank',api);
 },100);
 readyTimeout=setTimeout(()=>{if(!done&&!window.KomutaScene){clearInterval(timer);H.notice('Tank alanı hazırlanamadı. YENİDEN DENE ile açılışı tekrarlayabilirsin.');}},25000);
})();
