export const missions = {
  boru: [
    {key:'neon',title:'Neon Kuşatma',tag:'ARK-7 · ZIRHLI MUHAREBE',description:'Otonom sürüler sınır kubbesine ulaştı. Çelik Börü ile enerji sahasına gir, üç dalgayı durdur ve kalkan ağını yeniden aç.',waves:3,bots:3,pressure:5,region:'Kırık Yörünge',target:100},
    {key:'eclipse',title:'Tutulma Hattı',tag:'ARK-7 · GECE MUHAREBESİ',description:'Yörünge halkası karanlıkta. Dört dalga boyunca hareketli makinelere karşı enerji rezervini ve araç kalkanını yönet.',waves:4,bots:4,pressure:6,region:'Kızıl Ufuk',target:150}
  ],
  komuta: [
    {key:'orbit',title:'Yörünge Kalkanı',tag:'HİSAR AĞI · ÜS SAVUNMASI',description:'Üç enerji çekirdeği, iki drone filosu. Yaklaşan sürüleri holografik haritada izle. Filoları gönder, kalkanları güçlendir ve sekiz dalgayı karşıla.',waves:8,pressure:1,region:'Atlas İstasyonu'},
    {key:'storm',title:'İyon Fırtınası',tag:'HİSAR AĞI · KRİTİK SAVUNMA',description:'İyon cephesi istasyona yaklaşıyor. On dalga boyunca azalan enerjiyle drone filolarını ve onarım sürülerini koordine et.',waves:10,pressure:1.1,region:'Vega İstasyonu'}
  ]
};
export const nodeNames = ['Kuzey çekirdeği','Merkez kubbe','Doğu rölesi'];
export const fleetNames = ['Öncü filosu','Koruyucu filo'];
export const config = s => missions[s.id].find(m => m.key === s.mission);
export const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
export const distance = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
export function createRun(id,key) {
  const mission=missions[id].find(m=>m.key===key)||missions[id][0];
  const s={schema:3,id,mission:mission.key,started:Date.now(),done:false,won:false,log:[]};
  if(id==='boru') {
    Object.assign(s,{x:0,z:-46,yaw:0,speed:0,elapsed:0,hull:100,shield:100,energy:100,heat:0,
      wave:1,kills:0,shots:0,nextShot:0,lastHit:-10,domeUntil:0,nextDome:0,target:0,enemies:[]});
    spawnWave(s);
  } else {
    Object.assign(s,{turn:0,energy:100,nodes:nodeNames.map(name=>({name,shield:100,threat:12,guardUntil:-1})),
      fleets:[0,0],deployments:[],selected:0});
    note(s,'Kalkan ağı çevrimiçi. Filolar göreve hazır.');
  }
  return s;
}
function note(s,text) {
  s.log.push(text);
  s.log=s.log.slice(-40);
}
function spawnWave(s) {
  const m=config(s);
  s.enemies=Array.from({length:m.bots},(_,i)=>{
    const angle=i*Math.PI*2/m.bots+(s.wave-1)*.62;
    return {id:i,x:Math.sin(angle)*26,z:Math.cos(angle)*26+8,anchorX:Math.sin(angle)*26,anchorZ:Math.cos(angle)*26+8,
      hp:5,nextPulse:s.elapsed+3+i*.65,phase:i*2+s.wave};
  });
  s.target=nearestEnemy(s)?.id??0;
  note(s,s.wave+'. dalga · '+m.bots+' otonom birim algılandı.');
}
export function nearestEnemy(s) {
  return s.enemies.filter(e=>e.hp>0).sort((a,b)=>distance(s,a)-distance(s,b))[0];
}
export function lockedEnemy(s) {
  return s.enemies.find(e=>e.id===s.target&&e.hp>0)||nearestEnemy(s);
}
export function cycleTarget(s) {
  const alive=s.enemies.filter(e=>e.hp>0);
  if(!alive.length)return;
  const index=alive.findIndex(e=>e.id===s.target);
  s.target=alive[(index+1)%alive.length].id;
}
export function canFire(s) {
  const target=lockedEnemy(s);
  return !s.done&&!!target&&distance(s,target)<=56&&s.energy>=12&&s.heat<=84&&s.elapsed>=s.nextShot;
}
export function fire(s) {
  if(!canFire(s))return false;
  const target=lockedEnemy(s);
  s.energy-=12;s.heat+=16;s.shots++;s.nextShot=s.elapsed+.42;
  s.lastShot={time:s.elapsed,x:s.x,z:s.z,toX:target.x,toZ:target.z};
  target.hp--;
  if(target.hp===0) {
    s.kills++;
    s.lastBurst={time:s.elapsed,x:target.x,z:target.z};
    s.target=nearestEnemy(s)?.id??0;
    if(s.enemies.every(e=>e.hp===0)) {
      if(s.wave===config(s).waves){s.done=true;s.won=true;note(s,'Sürü durduruldu. Kalkan ağı yeniden açıldı.');}
      else {s.wave++;s.energy=Math.min(100,s.energy+24);spawnWave(s);}
    }
  }
  return true;
}
export function activateDome(s) {
  if(s.done||s.energy<25||s.elapsed<s.nextDome)return false;
  s.energy-=25;s.domeUntil=s.elapsed+4;s.nextDome=s.elapsed+12;
  note(s,'Enerji kubbesi etkin · 4 saniye.');return true;
}
export function stepVehicle(s,controls,dt) {
  if(s.done)return;
  dt=clamp(dt,0,.06);
  s.elapsed+=dt;
  s.energy=Math.min(100,s.energy+13*dt);
  s.heat=Math.max(0,s.heat-24*dt);
  if(s.elapsed-s.lastHit>5)s.shield=Math.min(100,s.shield+5*dt);
  const turn=Number(controls.has('right'))-Number(controls.has('left'));
  const forward=controls.has('go'),back=controls.has('back');
  const desired=forward?14:back?-9:0;
  s.speed+=clamp(desired-s.speed,-22*dt,22*dt);
  if(turn)s.yaw+=turn*dt*1.8*(s.speed<0?-1:1);
  else if(forward&&controls.has('assist')) {
    const target=lockedEnemy(s);
    if(target) {
      const angle=Math.atan2(target.x-s.x,target.z-s.z);
      const diff=Math.atan2(Math.sin(angle-s.yaw),Math.cos(angle-s.yaw));
      s.yaw+=clamp(diff,-dt*1.8,dt*1.8);
      if(distance(s,target)<20)s.speed=Math.min(s.speed,Math.max(0,distance(s,target)-13));
    }
  }
  s.x=clamp(s.x+Math.sin(s.yaw)*s.speed*dt,-65,65);
  s.z=clamp(s.z+Math.cos(s.yaw)*s.speed*dt,-60,65);
  for(const e of s.enemies) {
    if(e.hp<=0)continue;
    e.x=e.anchorX+Math.sin(s.elapsed*.32+e.phase)*7;
    e.z=e.anchorZ+Math.cos(s.elapsed*.26+e.phase)*5;
    if(s.elapsed>=e.nextPulse) {
      e.nextPulse=s.elapsed+2.8;
      if(distance(s,e)>43)continue;
      const damage=config(s).pressure*(s.elapsed<s.domeUntil?.15:1);
      const absorbed=Math.min(s.shield,damage);
      s.shield-=absorbed;s.hull=Math.max(0,s.hull-damage+absorbed);
      s.lastHit=s.elapsed;
      s.lastThreat={time:s.elapsed,x:e.x,z:e.z,toX:s.x,toZ:s.z};
      if(s.hull===0){s.done=true;s.won=false;note(s,'Araç bağlantısı kesildi. Görev sona erdi.');return;}
    }
  }
  if(controls.has('fire'))fire(s);
}
export function forecast(s) {
  return s.nodes.map((_,i)=>Math.round((7+((s.turn*7+i*11+(s.mission==='storm'?4:0))%16))*config(s).pressure));
}
export function fleetAction(s,action,nodeIndex) {
  if(s.done||!s.nodes[nodeIndex]||s.nodes[nodeIndex].shield<=0)return false;
  const n=s.nodes[nodeIndex],time=s.turn;
  if(action==='strike') {
    if(s.energy<24||s.fleets[0]>time||n.threat===0)return false;
    s.energy-=24;s.fleets[0]=time+2;n.threat=Math.max(0,n.threat-42);
    note(s,n.name+' · Öncü filo sürüyü dağıttı.');
  } else if(action==='guard') {
    if(s.energy<20||s.fleets[1]>time||n.guardUntil>time)return false;
    s.energy-=20;s.fleets[1]=time+2;n.guardUntil=time+2;
    note(s,n.name+' · Koruyucu filo iki dalga boyunca destek veriyor.');
  } else if(action==='repair') {
    if(s.energy<18||n.shield>=100)return false;
    s.energy-=18;n.shield=Math.min(100,n.shield+24);
    note(s,n.name+' · Onarım sürüsü kalkanı güçlendirdi.');
  } else return false;
  s.deployments=[{node:nodeIndex,action}];
  return true;
}
export function advanceWave(s) {
  if(s.done)return false;
  const incoming=forecast(s);
  s.nodes.forEach((n,i)=>{
    n.threat+=incoming[i];
    const damage=Math.round(n.threat*.34*(n.guardUntil>s.turn?.35:1));
    n.shield=Math.max(0,n.shield-damage);
    n.threat=Math.max(0,n.threat-9);
  });
  s.turn++;
  s.energy=Math.min(100,s.energy+(s.mission==='storm'?20:22));
  s.deployments=[];
  note(s,s.turn+'. dalga karşılandı. Çekirdek kalkanları güncellendi.');
  if(s.nodes.some(n=>n.shield===0)){s.done=true;s.won=false;note(s,'Kalkan ağı koptu. İstasyon bağlantısı kesildi.');}
  else if(s.turn===config(s).waves){s.done=true;s.won=true;note(s,'Son dalga durduruldu. İstasyon güvende.');}
  return true;
}
export function rating(s) {
  if(!s.done||!s.won)return 0;
  const integrity=s.id==='boru'?s.hull:s.nodes.reduce((sum,n)=>sum+n.shield,0)/3;
  return 1+Number(integrity>=45)+Number(integrity>=80);
}
export function validRun(s,id) {
  if(!s||s.schema!==3||s.id!==id||!missions[id]?.some(m=>m.key===s.mission)||!Number.isFinite(s.started)||
    typeof s.done!=='boolean'||typeof s.won!=='boolean'||!Array.isArray(s.log)||!s.log.every(x=>typeof x==='string'))return false;
  if(id==='boru') {
    const finite=['x','z','yaw','speed','elapsed','hull','shield','energy','heat','kills','shots','nextShot','lastHit','domeUntil','nextDome'];
    if(!finite.every(k=>Number.isFinite(s[k]))||s.elapsed<0||![s.hull,s.shield,s.energy,s.heat].every(n=>n>=0&&n<=100))return false;
    if(!Number.isInteger(s.wave)||s.wave<1||s.wave>config(s).waves||!Array.isArray(s.enemies)||s.enemies.length!==config(s).bots)return false;
    return s.enemies.every((e,i)=>e&&e.id===i&&['x','z','anchorX','anchorZ','nextPulse','phase','hp'].every(k=>Number.isFinite(e[k]))&&Number.isInteger(e.hp)&&e.hp>=0&&e.hp<=5);
  }
  return Number.isInteger(s.turn)&&s.turn>=0&&s.turn<=config(s).waves&&Number.isFinite(s.energy)&&s.energy>=0&&s.energy<=100&&
    Array.isArray(s.nodes)&&s.nodes.length===3&&s.nodes.every(n=>n&&Number.isFinite(n.shield)&&n.shield>=0&&n.shield<=100&&Number.isFinite(n.threat)&&n.threat>=0&&Number.isInteger(n.guardUntil))&&
    Array.isArray(s.fleets)&&s.fleets.length===2&&s.fleets.every(Number.isInteger)&&Number.isInteger(s.selected)&&s.selected>=0&&s.selected<3;
}
