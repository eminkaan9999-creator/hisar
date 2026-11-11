/* HİSAR SİMÜLATÖR · tank modeli (M60A3)
 * Kaynak: kök index.html, mkM60 ve model yardımcıları, satır satır aynen taşındı.
 * Dışa açılan: H.tankModel.mkM60(gövdeKamuflajRengi, düşmanMı) -> THREE.Group
 *   g.userData.tu  kule (döner, y ekseni)   g.userData.gn  namlu grubu (yükselir, x ekseni)
 *   namlu ucu gn yerelinde (0,0,6.6), ön yüz +Z
 */
(function () {
  'use strict';
  var H = window.HISAR;
  var rnd = function (a, b) { return a + Math.random() * (b - a); };  // kaynak: index.html rnd tanımı
const M=c=>new THREE.MeshLambertMaterial({color:c});
function bx(p,w,h,d,m,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);p.add(o);return o}
function cy(p,rt,rb,h,m,x,y,z,rx,rz){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,12),m);o.position.set(x,y,z);o.rotation.x=rx||0;o.rotation.z=rz||0;p.add(o);return o}
function shad(g){g.traverse(o=>{if(o.isMesh&&o.material.isMeshLambertMaterial){o.castShadow=true;o.receiveShadow=true}});return g}
const camoC={};
function camo(c){if(camoC[c])return camoC[c];const k=document.createElement('canvas');k.width=k.height=128;const g=k.getContext('2d');g.fillStyle='#'+c.toString(16).padStart(6,'0');g.fillRect(0,0,128,128);
 for(let i=0;i<14;i++){g.fillStyle=i%2?'rgba(0,0,0,.32)':'rgba(120,95,55,.38)';g.beginPath();g.ellipse(rnd(0,128),rnd(0,128),rnd(8,26),rnd(5,14),rnd(0,3),0,7);g.fill()}
 for(let i=0;i<260;i++){g.fillStyle='rgba(0,0,0,'+rnd(.03,.1)+')';g.fillRect(rnd(0,128),rnd(0,128),2,2)}
 return camoC[c]=new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(k)})}
function flagMat(){const k=document.createElement('canvas');k.width=96;k.height=64;const g=k.getContext('2d');g.fillStyle='#d4141c';g.fillRect(0,0,96,64);g.fillStyle='#fff';g.beginPath();g.arc(36,32,18,0,7);g.fill();g.fillStyle='#d4141c';g.beginPath();g.arc(42,32,14.5,0,7);g.fill();g.fillStyle='#fff';g.beginPath();for(let i=0;i<10;i++){const a=-1.5708+i*.6283,r=i%2?3.4:8;g.lineTo(60+Math.cos(a)*r,32+Math.sin(a)*r)}g.fill();return new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(k),side:THREE.DoubleSide})}
function ell(p,m,sx,sy,sz,x,y,z){const o=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),m);o.scale.set(sx,sy,sz);o.position.set(x,y,z);p.add(o);return o}
function mkM60(hc,en){
 const g=new THREE.Group(),H=camo(hc),K=M(0x1c1c1c),RB=M(0x101010),MT=M(0x5b6068),DK=M(0x2a2d2a),SL=M(0x3d4044),CL=M(0x555a55),RD=M(0xcc2222),Y=Math.PI/2,cl=[];
 bx(g,2.8,.8,5.2,H,0,.9,0);bx(g,2.8,.9,.4,H,0,.95,-2.8);bx(g,2.8,.14,.97,H,0,1.03,3).rotation.x=.6;bx(g,2.8,.14,.89,H,0,.48,3.05).rotation.x=-.67;
 bx(g,2.4,.05,1.6,DK,0,1.33,-2);bx(g,.5,.35,.5,DK,.8,1.5,-2.4);bx(g,.7,.3,.5,M(0x5a5238),-.7,1.48,-2.5);
 for(const s of[-1,1]){bx(g,.25,.14,.1,M(0xfff0b0),s*1.05,.85,3.35);const x=s*1.75;
  bx(g,.9,.14,6.4,K,x,1.2,.1);bx(g,.9,.14,5.8,K,x,.07,.1);cy(g,.55,.55,.9,K,x,.55,3.25,0,Y);cy(g,.6,.6,.9,K,x,.62,-3,0,Y);cy(g,.3,.3,.94,MT,x,.62,-3,0,Y);bx(g,.3,1,6,DK,s*1.45,.62,0);
  for(let i=0;i<6;i++){cy(g,.42,.42,.8,RB,x,.5,-2.3+i*.92,0,Y);cy(g,.2,.2,.84,MT,x,.5,-2.3+i*.92,0,Y)}
  for(let i=0;i<3;i++)cy(g,.17,.17,.5,RB,x,1.03,-1.6+i*1.6,0,Y);
  for(let i=0;i<4;i++)bx(g,.12,.7,.95,H,s*2.3,.95,-1.3+i*1.15);
  for(let i=0;i<14;i++){const c=bx(g,.95,.07,.2,CL,x,1.28,0);cl.push({c,i,s:s>0?0:1})}}
 const tu=new THREE.Group();tu.position.y=1.3;g.add(tu);
 cy(tu,1.3,1.3,.15,DK,0,.05,0);ell(tu,H,1.45,.62,2,0,.55,-.2);ell(tu,H,1.05,.5,.9,0,.5,-1.6);bx(tu,1.8,.3,.8,DK,0,.35,-2.4);
 ell(tu,H,.55,.42,.45,0,.65,1.75);bx(tu,.35,.3,.4,K,.8,.78,1.35);
 cy(tu,.34,.36,.28,H,.55,1.1,-.5);bx(tu,.14,.14,.4,K,.55,1.38,-.35);cy(tu,.04,.04,1.1,K,.55,1.38,.15,Y);cy(tu,.3,.3,.08,DK,-.55,1.1,-.7);
 cy(tu,.02,.02,2.2,K,-.9,1.7,-1.8);cy(tu,.02,.02,2.2,K,.9,1.7,-1.8);
 for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.PlaneGeometry(.8,.55),en?RD:flagMat());p.position.set(s*1.47,.62,-.25);p.rotation.y=s*Y;tu.add(p)}
 const gn=new THREE.Group();gn.position.set(0,.65,.5);tu.add(gn);
 cy(gn,.15,.15,6.6,K,0,0,3.3,Y);cy(gn,.2,.2,3.4,SL,0,0,3.1,Y);cy(gn,.24,.24,.5,SL,0,0,2.2,Y);cy(gn,.2,.2,.14,K,0,0,6.55,Y);
 g.userData.tu=tu;g.userData.gn=gn;g.userData.cl=cl;g.userData.tp=[0,0];return g}
  H.tankModel = { mkM60: mkM60, camo: camo };
})();
