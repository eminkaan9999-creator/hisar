// Use the already shipped HİSAR environment textures, never a third-party download.
function realAssets(sc,skyM,ground,r,aniso){
 const T=THREE,ld=new T.TextureLoader(),owner=G3;
 if(!owner||owner.sc!==sc)return;
 const status={ground:false,berm:false,foliage:false,errors:[]};owner.localAssets=status;
 function texture(file,rx,ry,done,key){
  ld.load('../site/assets/'+file,t=>{
   if(G3!==owner){t.dispose();return;}
   t.encoding=T.sRGBEncoding;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=Math.min(8,aniso);done(t);status[key]=true;
  },undefined,()=>{status.errors.push(file);});
 }
 texture('rocky_terrain_02_d.jpg',820,820,t=>{const previous=ground.material.map;ground.material.map=t;ground.material.color.setHex(0xeee9df);ground.material.needsUpdate=true;if(previous)previous.dispose();},'ground');
 texture('rubble_d.jpg',32,2,t=>{const previous=owner.berm.material.map;owner.berm.material.map=t;owner.berm.material.color.setHex(0xc5bca7);owner.berm.material.needsUpdate=true;if(previous)previous.dispose();},'berm');
 texture('bush1.webp',1,1,t=>{
  t.wrapS=t.wrapT=T.ClampToEdgeWrapping;
  const previous=owner.trees3.material;owner.trees3.material=new T.MeshLambertMaterial({map:t,color:0xffffff,side:T.DoubleSide,alphaTest:.4,transparent:false});previous.dispose();
 },'foliage');
}
// Crossed cutout cards retain instancing and replace solid cone trees.
function komutaFoliageGeometry(T){
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-3.2,0,0,3.2,0,0,3.2,3.4,0,-3.2,3.4,0,0,0,-3.2,0,0,3.2,0,3.4,3.2,0,3.4,-3.2],3));
 g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,1],2));g.setIndex([0,1,2,0,2,3,4,5,6,4,6,7]);g.computeVertexNormals();return g;
}
