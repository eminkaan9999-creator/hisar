export const positions=[[25,34],[50,66],[77,31]];
export function mountMap(canvas,s) {
  const ctx=canvas.getContext('2d');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame,start=performance.now(),last=0;
  function draw(now) {
    if(now-last<40){frame=requestAnimationFrame(draw);return;}
    last=now;
    const ratio=Math.min(devicePixelRatio,1.5),w=canvas.clientWidth,h=canvas.clientHeight;
    if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=w*ratio;canvas.height=h*ratio;}
    ctx.setTransform(ratio,0,0,ratio,0,0);
    const time=Math.max(0,(now-start)/1000);
    const gradient=ctx.createLinearGradient(0,0,w,h);gradient.addColorStop(0,'#081727');gradient.addColorStop(1,'#0a2834');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#164757';ctx.lineWidth=.7;
    for(let i=-18;i<30;i++) {
      ctx.beginPath();ctx.moveTo(i*32,0);ctx.lineTo(i*32+h*.45,h);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,i*25);ctx.lineTo(w,i*25-w*.2);ctx.stroke();
    }
    // The raised blocks give the network map a fixed isometric terrain silhouette.
    for(let i=0;i<30;i++) {
      const x=(.08+(i*37%87)/100)*w,y=(.1+(i*19%79)/100)*h;
      const size=8+i%4*3,height=4+i%6*3;
      ctx.fillStyle='#0c3040';ctx.strokeStyle='#225166';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x-size,y);ctx.lineTo(x,y-size*.5-height);
      ctx.lineTo(x+size,y-height);ctx.lineTo(x+size,y+size*.5);ctx.lineTo(x,y+size);ctx.closePath();ctx.fill();ctx.stroke();
    }
    positions.forEach(([px,py],i)=>{
      const x=w*px/100,y=h*py/100,node=s.nodes[i];
      const color=node.shield<35?'#ff6689':'#57e8e2';
      ctx.strokeStyle='#256476';ctx.setLineDash([4,7]);ctx.beginPath();ctx.moveTo(w*.5,h*.91);ctx.lineTo(x,y);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=color;ctx.lineWidth=1.2;
      for(let ring=0;ring<3;ring++){ctx.globalAlpha=.22+ring*.13;ctx.beginPath();ctx.ellipse(x,y,24+ring*11,9+ring*5,0,0,Math.PI*2);ctx.stroke();}
      ctx.globalAlpha=1;
      const halo=ctx.createRadialGradient(x,y-18,0,x,y-18,42);
      halo.addColorStop(0,color+'45');halo.addColorStop(1,color+'00');ctx.fillStyle=halo;ctx.fillRect(x-42,y-60,84,84);
      ctx.fillStyle='#133b4d';ctx.strokeStyle=color;
      ctx.beginPath();ctx.moveTo(x-10,y);ctx.lineTo(x-7,y-35);ctx.lineTo(x,y-48);ctx.lineTo(x+8,y-34);ctx.lineTo(x+11,y);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle=color;ctx.fillRect(x-1,y-40,2,34);
      if(node.guardUntil>s.turn){
        ctx.strokeStyle='#72f1ee';ctx.globalAlpha=.6;ctx.beginPath();ctx.ellipse(x,y-8,39,43,0,Math.PI,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
      }
      for(let dot=0;dot<Math.min(12,Math.ceil(node.threat/6));dot++){
        const angle=dot*2.4+time*.12;
        const ex=x+Math.cos(angle)*48,ey=y-12+Math.sin(angle)*26;
        ctx.fillStyle='#ff648e';ctx.beginPath();ctx.moveTo(ex,ey-3);ctx.lineTo(ex+3,ey+2);ctx.lineTo(ex-3,ey+2);ctx.closePath();ctx.fill();
      }
      if(s.deployments?.[0]?.node===i&&time<2) {
        const f=Math.min(1,time/1.2),dx=w*.5+(x-w*.5)*f,dy=h*.91+(y-h*.91)*f;
        ctx.strokeStyle='#90fff3';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(dx-8,dy+8);ctx.lineTo(dx,dy-5);ctx.lineTo(dx+8,dy+8);ctx.stroke();
      }
    });
    ctx.fillStyle='#80dfdf';ctx.font='11px monospace';ctx.fillText('HİSAR // AĞ GÖRÜNÜMÜ',16,h-16);
    ctx.strokeStyle='#50d3d2';ctx.globalAlpha=.14;ctx.beginPath();ctx.ellipse(w*.5,h*.5,(time*20)%w,(time*10)%h,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    if(!reduced)frame=requestAnimationFrame(draw);
  }
  frame=requestAnimationFrame(draw);
  return ()=>cancelAnimationFrame(frame);
}
