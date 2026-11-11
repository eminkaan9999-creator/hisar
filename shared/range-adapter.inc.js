// Retain all original range models, targets and modes. Story completion observes actual game shots only.
if(window.HisarKurulus){
 const H=window.HisarKurulus.host,free=H.chapter().mode==='free';let paused=false,wasStarted=true,done=false;
 OPT.voice=0;if(!free){OPT.diff='kolay';OPT.motion=0;startMode('serbest');}
 document.getElementById('menu').hidden=true;document.getElementById('splash')?.remove();if(!free)S.started=true;
 const savedFire=fire;fire=function(){if(paused||(!free&&done))return;const before=S.shots.length,r=savedFire.apply(this,arguments);if(S.shots.length>before){H.fleet({['range:'+S.rifle]:{name:RIFLES[S.rifle]?.name||S.rifle,used:1,lastSeen:new Date().toISOString()}});if(!free){H.progress('range-shots',S.shots.length);H.goal('Poligon tanışması · '+Math.min(5,S.shots.length)+'/5 oyun atışı.');if(S.shots.length>=5){done=true;S.trig.down=false;H.complete();}}}return r;};
 const api={pause(v){if(paused===!!v)return;paused=!!v;if(paused){wasStarted=S.started;S.started=false;S.trig.down=false;}else S.started=wasStarted;},dispose(){S.trig.down=false;saveST();},
 catalogue:()=>[...Object.entries(RIFLES).map(([id,v])=>({id:'equipment:'+id,label:v.name,group:'Poligon ekipmanları'})),...Object.entries(TG).map(([id,v])=>({id:'target:'+id,label:v.name,group:'Hedef kartları'})),...(free?Object.entries(TASKS).map(([id,v])=>({id:'mode:'+id,label:v.name,group:'Bütün poligon oyunları'})):[]),{id:'sight:iron',label:'Gez ve arpacık görünümü',group:'Görüşler'},{id:'sight:optic',label:'Optik görünüm',group:'Görüşler'},...(free?[{id:'native-menu',label:'Bütün özgün ayarlar, kayıtlar ve modlar',group:'Tam içerik'}]:[])],
 activate(key){const [kind,id]=String(key).split(':');if(kind==='equipment'&&RIFLES[id]){S.rifle=id;startMode('serbest');return {ok:true};}if(kind==='target'&&TG[id]){S.target=id;startMode('serbest');return {ok:true};}if(kind==='mode'&&free&&TASKS[id]){startMode(id);return {ok:true};}if(kind==='sight'&&['iron','optic'].includes(id)){S.sight=id;syncUI();return {ok:true};}if(key==='native-menu'&&free)return {ok:true,after:()=>document.getElementById('menu').hidden=false};return {ok:false};},
 diagnostics:()=>({scene:'range',free,paused,shots:S.shots.length,done,rifle:S.rifle,target:S.target,mode:S.mode})};
 window.HisarKurulusSession=api;H.connect('range',api);H.goal(free?'Bütün ekipmanları, hedefleri ve oyunları ARAÇ / GÖRÜŞ bölümünden açabilirsin.':'Beş oyun atışı yap. İsabet şartı ve süre sınırı yok.');
 document.documentElement.classList.add('kurulus-scene');if(free)document.documentElement.classList.add('kurulus-free');
}
