/* Keep the complete original tank engine. Only campaign flow and shared vehicle controls are added. */
(function(root){'use strict';if(!root.HisarKurulus)return;const K=root.HisarKurulus,H=K.host;let attempts=0;
function install(){if(root.HisarKurulusSession)return;if(!root.HisarSimpleSettings||!root.HisarOperations||typeof DR==='undefined'){if(++attempts<450)setTimeout(install,100);return;}
 const ch=H.chapter(),free=ch.mode==='free';if(ch.scene!=='tank')return;
 let session,wasPlaying=false,finished=false,waveTimer=6,reportTime=0;const pending=[];
 const originalAdd=root.addE;if(!free)root.addE=function(){const before=E.length,result=originalAdd.apply(this,arguments),unit=E.length>before?E[E.length-1]:null;if(unit&&(E.length>1||pending.length)){const at=E.indexOf(unit);if(at>=0){E.splice(at,1);unit.g.visible=false;pending.push(unit);}}return result;};
 if(!free&&typeof root.spawnHeli==='function')root.spawnHeli=()=>null;
 if(free){setG('kesif');reset('kolay');}else{setL('kolay');root.HisarOperations.start(ch.mission);}
 root.HisarGameplay.set({droneView:'fpv'});
 for(const child of DR.g.children)child.visible=false;const common=K.model(THREE);DR.g.add(common);
 const oldCamera=root.camUpdate,oldUpdate=root.update,oldEnd=root.endGame;
 const names={tank:'Tank',bunker:'Korugan',aa:'Hava savunma aracı',apc:'Zırhlı araç',arty:'Topçu aracı',inf:'Piyade oyun hedefi',fuel:'Yakıt aracı',radar:'Radar',truck:'Kamyon',mgn:'Destek aracı',ew:'Elektronik destek aracı'};
 function fleet(){const id=SV.tank||'m60';H.fleet({['tank:'+id]:{name:TANKS[id]?.n||id,health:Math.max(0,P.hp/P.mx*100),used:1,lastSeen:new Date().toISOString()}});}
 const a={scene:'tank',model:common,ground:hAt,bounds:{x0:-180,x1:180,z0:-180,z1:180},
 origin:()=>({x:P.x,y:hAt(P.x,P.z)+1.5,z:P.z}),
 launch(d){if(game!=='play')return false;DR.on=true;DR.rt=0;DR.fall=0;DR.kz=0;DR.sp=1;DR.hp=d.health*.6;dk=0;mode='drone';iv=0;this.pose(d,0);return true;},
 pose(d,dt){const p=d.flight.pos;DR.x=p.x;DR.y=p.y;DR.z=p.z;DR.ty=p.y;DR.bat=d.battery;DR.rt=0;DR.fall=0;DR.kz=0;DR.on=d.flight.status!=='docked';DR.g.visible=DR.on;DR.sp=1;DR.sig=1;DR.g.position.set(p.x,p.y,p.z);DR.g.scale.setScalar(1);DR.g.rotation.set(-d.flight.vz*.015,d.camera.yaw,d.flight.vx*.015,'YXZ');for(const r of common.userData.rot)r.rotation.y+=dt*50;shadow.visible=false;},
 land(d){DR.on=false;DR.g.visible=false;shadow.visible=false;mode='tank';pitch=.3;dk=1;chg=d.battery;CAM.up.set(0,1,0);},
 release(){root.HisarInputGuard?.release();joy.x=joy.y=0;hold=0;},
 pause(v){if(v){wasPlaying=game==='play';if(wasPlaying)game='pause';root.HisarRadioSound?.stop();}else if(wasPlaying)game='play';},save(){fleet();save();},
 catalogue(){return [
 ...Object.entries(TANKS).map(([id,t])=>({id:'tank:'+id,label:t.n,group:'Tanklar · mevcut garaj',enabled:(SV.tanks||['m60']).includes(id)})),
 ...['Dış görünüş','Nişangâh','Kabin içi','Sürücü mahalli'].map((n,i)=>({id:'view:'+i,label:n,group:'Kameralar'})),
 ...['Nişancı','Komutan','Doldurucu','Kapak açık'].map((n,i)=>({id:'crew:'+i,label:n,group:'Mürettebat bölümleri'})),
 ...Object.keys(HPT).map(id=>({id:'target:'+id,label:names[id]||id,group:'Korunan hedef türleri',readOnly:true})),
 ...(free?[{id:'native-menu',label:'Bütün görevler, garaj ve mevcut menüler',group:'Tam içerik'}]:[])];},
 activate(key){const [type,id]=String(key).split(':');if(type==='tank'&&TANKS[id]){if(!(SV.tanks||['m60']).includes(id))return {ok:false,reason:'Bu tank mevcut garajda henüz açılmamış.'};applyTank(id);fleet();save();return {ok:true};}if(type==='view'&&['0','1','2','3'].includes(id)){iv=+id;mode='tank';if(iv===1)zm=22;camUpdate();return {ok:true};}if(type==='crew'&&root.CAB&&['0','1','2','3'].includes(id)){iv=2;mode='tank';CAB.st=+id;CAB.hy=CAB.hp=0;camUpdate();return {ok:true};}if(key==='native-menu'&&free)return {ok:true,after:()=>root.openMenu()};return {ok:false,reason:'Bu seçenek burada kullanılamıyor.'};},
 actions:()=>[{id:'release',label:'Bırak · mevcut oyun mühimmatı'},{id:'mark',label:'Görünen oyun hedefini işaretle'},{id:'heat',label:'Isı kamerasını aç / kapat'}],
 action(id){if(game!=='play'||mode!=='drone'||!DR.on)return false;if(id==='release'){root.fire();return true;}if(id==='mark'){root.markAim();return true;}if(id==='heat'){DR.th=!DR.th;return true;}return false;},
 tick(dt){if(game!=='play')return;reportTime+=dt;if(reportTime>3){reportTime=0;fleet();}
  if(!free){if(E.length)waveTimer=6;else if(pending.length){waveTimer-=dt;if(waveTimer<=0){const e=pending.shift();e.g.visible=true;E.push(e);waveTimer=6;}}edT=Math.max(edT,30);const m=HisarOperations.diagnostics().mission;if(m&&!m.finished)H.goal(m.goal?.text||ch.goal);}
 }
 };
 session=K.mount(a);session.pendingThreats=()=>pending.length;fleet();
 root.sw=function(){if(session.active())return session.recall();return session.start();};root.recall=()=>session.recall();
 root.update=function(dt){const active=session.active(),x=joy.x,y=joy.y,ty=DR.ty,b=DR.bat;if(active){joy.x=joy.y=0;DR.ty=DR.y;}let result;try{result=oldUpdate.apply(this,arguments);}finally{if(active){joy.x=x;joy.y=y;DR.bat=b;DR.ty=ty;session.damage(Math.max(0,100-DR.hp/60*100));a.pose(session.drone(),0);}}return result;};
 root.camUpdate=function(){const r=oldCamera.apply(this,arguments);if(session.active()){DR.g.scale.setScalar(1);session.camera(CAM);}return r;};
 root.endGame=function(ok){const r=oldEnd.apply(this,arguments);if(!free&&game==='over'&&!finished){if(ok){finished=true;session.done();}else H.failed('Görev tamamlanamadı. Üs menüsünden bölümü yeniden başlat.');}return r;};
 FRAME_HOOKS.push(dt=>{if(game==='play'||session.drone().flight.status==='returning')session.frame(dt);});
 const style=document.createElement('style');style.textContent=(free?'':'.kurulus-scene #menu,.kurulus-scene #rep{display:none!important}')+'.kurulus-flying #hud,.kurulus-flying #ch,.kurulus-flying #fpvhud{visibility:hidden!important}';document.head.appendChild(style);
 root.HisarTankCampaign={session,pendingThreats:()=>pending.length,diagnostics:()=>({pending:pending.length,active:E.length,finished,free,mission:HisarOperations.diagnostics().mission})};
}
install();
})(window);
