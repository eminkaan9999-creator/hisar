import {config,eraFor} from './model.mjs';
export const positions=[[25,34],[50,66],[77,31]];
export function mountMap(canvas,s,{layer=()=> 'network',quality='auto'}={}) {
  const ctx=canvas.getContext('2d'),background=document.createElement('canvas'),base=background.getContext('2d');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const earth=eraFor(config(s)).key!=='far';
  const ratio=Math.min(devicePixelRatio,quality==='performance'?1:quality==='quality'?1.5:1.25);
  const interval=quality==='performance'?50:1000/30;
  let frame=0,start=performance.now(),last=0,width=0,height=0,lastLayer='',dirty=true,closed=false;
  let deployment=s.deployments?.[0],deploymentAt=start;
  function rebuild(w,h,selectedLayer) {
    width=w;height=h;lastLayer=selectedLayer;
    canvas.width=background.width=Math.round(w*ratio);canvas.height=background.height=Math.round(h*ratio);
    base.setTransform(ratio,0,0,ratio,0,0);
    const gradient=base.createLinearGradient(0,0,w,h);
    gradient.addColorStop(0,earth?'#152c30':'#081727');gradient.addColorStop(1,earth?'#29413b':'#0a2834');
    base.fillStyle=gradient;base.fillRect(0,0,w,h);
    base.strokeStyle=earth?'#4c6961':'#164757';base.lineWidth=.7;
    for(let i=-18;i<30;i++) {
      base.beginPath();base.moveTo(i*32,0);base.lineTo(i*32+h*.45,h);base.stroke();
      base.beginPath();base.moveTo(0,i*25);base.lineTo(w,i*25-w*.2);base.stroke();
    }
    if(selectedLayer!=='systems') {
      if(earth){
        for(let contour=0;contour<10;contour++){
          base.beginPath();base.strokeStyle='#77957d40';
          for(let x=0;x<=w;x+=8){const y=h*.1+contour*h*.085+Math.sin(x/w*9+contour*.3)*18;if(x)base.lineTo(x,y);else base.moveTo(x,y);}
          base.stroke();
        }
        base.strokeStyle='#84b2bc60';base.lineWidth=7;base.beginPath();base.moveTo(w*.07,h);base.bezierCurveTo(w*.8,h*.55,w*.05,h*.45,w*.62,0);base.stroke();
      }
      for(let i=0;i<30;i++) {
        const x=(.08+(i*37%87)/100)*w,y=(.1+(i*19%79)/100)*h;
        const size=8+i%4*3,height=earth?4+i%3*2:4+i%6*3;
        base.fillStyle=earth?'#314b45':'#0c3040';base.strokeStyle=earth?'#6a8373':'#225166';base.lineWidth=1;
        base.beginPath();base.moveTo(x-size,y);base.lineTo(x,y-size*.5-height);
        base.lineTo(x+size,y-height);base.lineTo(x+size,y+size*.5);base.lineTo(x,y+size);base.closePath();base.fill();base.stroke();
      }
    }
    base.fillStyle='#80dfdf';base.font='10px monospace';base.fillText('HİSAR / '+eraFor(config(s)).year+' / '+({network:'BİRLEŞİK AĞ',relief:'ARAZİ',systems:'BİRİMLER'}[selectedLayer]),14,h-14);
    canvas.dataset.backgroundBuilds=Number(canvas.dataset.backgroundBuilds||0)+1;
  }
  function draw(now) {
    frame=0;if(closed)return;
    if(!dirty&&now-last<interval){schedule();return;}
    if(document.hidden)return;
    last=now;dirty=false;
    const w=canvas.clientWidth,h=canvas.clientHeight,selectedLayer=layer();
    if(!w||!h){schedule();return;}
    if(w!==width||h!==height||selectedLayer!==lastLayer)rebuild(w,h,selectedLayer);
    canvas.dataset.layer=selectedLayer;
    ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(background,0,0);ctx.setTransform(ratio,0,0,ratio,0,0);
    const time=motion.matches?0:Math.max(0,(now-start)/1000);
    if(deployment!==s.deployments?.[0]){deployment=s.deployments?.[0];deploymentAt=now;}
    positions.forEach(([px,py],i)=>{
      const x=w*px/100,y=h*py/100,node=s.nodes[i],selected=s.selected===i;
      const color=node.shield<35?'#ff6689':selected?'#b3fff0':'#57e8e2';
      if(selectedLayer!=='relief'){
        ctx.strokeStyle=selected?'#65c9c9':'#256476';ctx.setLineDash([4,7]);ctx.lineDashOffset=-time*8;ctx.beginPath();ctx.moveTo(w*.5,h*.91);ctx.lineTo(x,y);ctx.stroke();ctx.setLineDash([]);ctx.lineDashOffset=0;
      }
      ctx.strokeStyle=color;ctx.lineWidth=1.2;
      for(let ring=0;ring<3;ring++){ctx.globalAlpha=.22+ring*.13;ctx.beginPath();ctx.ellipse(x,y,24+ring*11,9+ring*5,0,0,Math.PI*2);ctx.stroke();}
      ctx.globalAlpha=1;ctx.fillStyle='#133b4d';ctx.strokeStyle=color;
      ctx.beginPath();ctx.moveTo(x-10,y);ctx.lineTo(x-7,y-35);ctx.lineTo(x,y-48);ctx.lineTo(x+8,y-34);ctx.lineTo(x+11,y);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle=color;ctx.fillRect(x-1,y-40,2,34);
      if(node.guardUntil>s.turn){ctx.strokeStyle='#72f1ee';ctx.globalAlpha=.6;ctx.beginPath();ctx.ellipse(x,y-8,39,43,0,Math.PI,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
      if(selectedLayer!=='relief')for(let dot=0;dot<Math.min(12,Math.ceil(node.threat/6));dot++){
        const angle=dot*2.4+time*.12,ex=x+Math.cos(angle)*48,ey=y-12+Math.sin(angle)*26;
        ctx.fillStyle='#ff648e';ctx.beginPath();ctx.moveTo(ex,ey-3);ctx.lineTo(ex+3,ey+2);ctx.lineTo(ex-3,ey+2);ctx.closePath();ctx.fill();
      }
      if(deployment?.node===i) {
        const progress=motion.matches?1:Math.min(1,(now-deploymentAt)/1200);
        const dx=w*.5+(x-w*.5)*progress,dy=h*.91+(y-h*.91)*progress;
        ctx.strokeStyle=deployment.action==='repair'?'#ffd18b':'#90fff3';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(dx-8,dy+8);ctx.lineTo(dx,dy-5);ctx.lineTo(dx+8,dy+8);ctx.stroke();
      }
    });
    if(selectedLayer==='network'&&!motion.matches){
      ctx.strokeStyle='#50d3d2';ctx.globalAlpha=.14;ctx.beginPath();ctx.ellipse(w*.5,h*.5,(time*20)%w,(time*10)%h,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    }
    if(!motion.matches)schedule();
  }
  function schedule(){if(!closed&&!frame)frame=requestAnimationFrame(draw);}
  function update(){dirty=true;schedule();}
  const observer=new ResizeObserver(update);observer.observe(canvas);
  motion.addEventListener('change',update);document.addEventListener('visibilitychange',update);
  const close=()=>{closed=true;cancelAnimationFrame(frame);observer.disconnect();motion.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);};
  close.update=update;update();return close;
}
