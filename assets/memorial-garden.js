const places = [
  {key:'circle',x:-6.1,z:-2.6}, {key:'profile',x:.75,z:-6.4}, {key:'timeline',x:6.1,z:-2.6},
  {key:'path',x:-5.9,z:3.9}, {key:'support',x:-.25,z:6.6}, {key:'trees',x:5.9,z:3.9},
  {key:'memories',x:0,z:0}
];

function buildWorld(host, T) {
  let renderer;
  try { renderer = new T.WebGLRenderer({antialias:true, alpha:true, powerPreference:'low-power'}); } catch { return; }
  const mapRoot=host.closest('[data-garden-map]'), canvas=renderer.domElement;
  const controls=mapRoot.querySelector('[data-map-controls]'), pins=mapRoot.querySelector('[data-garden-pins]');
  const status=mapRoot.querySelector('[data-map-status]'), buttons=[...pins.querySelectorAll('[data-place]')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), send=(name,detail)=>document.dispatchEvent(new CustomEvent(name,{detail}));
  host.append(canvas); host.removeAttribute('aria-hidden');
  canvas.tabIndex=0; canvas.setAttribute('aria-label','Walk in the garden with the arrow keys or W, A, S, D. Press plus or minus to zoom, P to pet your companion, or Enter near a landmark to visit.');
  host.style.background='radial-gradient(ellipse at 50% 40%,#fbf4dc 0%,#e6efe8 55%,#c4e1dd 100%)';
  mapRoot.classList.add('garden-map-ready'); controls.hidden=false; pins.hidden=false;
  status.textContent='Tap a path to walk with your pet. Drag to look around.';
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.65)); renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene(), camera=new T.OrthographicCamera(-12,12,8,-8,.1,80);
  const sun=new T.DirectionalLight(0xffe6cc,2.05);sun.position.set(-8,15,6);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,far:45});sun.shadow.normalBias=.026;
  scene.add(sun,new T.HemisphereLight(0xfff7ee,0xb0bcac,2.05));
  const materials=new Map(),geometries=new Map(), refSize=new T.Vector3(), center=new T.Vector3(), ray=new T.Raycaster();
  const PI=Math.PI,TAU=2*PI,clamp=T.MathUtils.clamp,ground=new T.Plane(new T.Vector3(0,1,0),-.05);
  const palette={wood:0x987059,edge:0xab8068,cream:0xffedcf,rose:0xe8a7a3,salmon:0xdf8279,
    mint:0x94cbbb,teal:0x5a958d,honey:0xebbb67,sky:0x9fbad5,lilac:0xc6a5d5,leaf:0x8fbb84,ink:0x554741};
  const {wood,cream,rose,salmon,mint,teal,honey,sky,lilac,leaf,ink}=palette;
  function geo(key,fn){if(!geometries.has(key))geometries.set(key,fn());return geometries.get(key);}
  function mat(color){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.79}));return materials.get(color);}
  function group(parent,x=0,y=0,z=0){const o=new T.Group();o.position.set(x,y,z);parent.add(o);return o;}
  function solid(parent,geometry,color,x,y,z,w=1,h=1,d=1){
    const o=new T.Mesh(geometry,mat(color));o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=o.receiveShadow=true;parent.add(o);return o;
  }
  function box(parent,x,y,z,w,h,d,c){return solid(parent,geo('box',()=>new T.BoxGeometry(1,1,1)),c,x,y,z,w,h,d);}
  function orb(parent,x,y,z,rx,ry,rz,c){return solid(parent,geo('sphere',()=>new T.SphereGeometry(1,14,11)),c,x,y,z,rx,ry,rz);}
  function cyl(parent,x,y,z,rt,rb,h,c,n=20){
    const ratio=rt/rb;return solid(parent,geo('c'+ratio+'-'+n,()=>new T.CylinderGeometry(ratio,1,1,n)),c,x,y,z,rb,h,rb);
  }
  function hoop(parent,x,y,z,r,t,c,span=TAU){
    return solid(parent,geo('ring'+r+','+t+','+span,()=>new T.TorusGeometry(r,t,8,32,span)),c,x,y,z);
  }
  function stroke(parent,x,y,z,X,Y,Z,t,c){
    const a=new T.Vector3(x,y,z), b=new T.Vector3(X,Y,Z), v=b.sub(a);
    const o=cyl(parent,x+v.x/2,y+v.y/2,z+v.z/2,t,t,v.length(),c,9);
    o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;
  }
  // Batching local geometry keeps a flower bed or cottage inexpensive to draw on a phone.
  function batch(g){
    const rows=new Map();
    for(const o of [...g.children])if(o.isMesh&&!o.isInstancedMesh&&!o.material.map){const key=o.geometry.uuid+o.material.uuid;if(!rows.has(key))rows.set(key,[]);rows.get(key).push(o);}
    for(const list of rows.values())if(list.length>1){const a=list[0], m=new T.InstancedMesh(a.geometry,a.material,list.length);m.castShadow=m.receiveShadow=true;
      list.forEach((o,i)=>{o.updateMatrix();m.setMatrixAt(i,o.matrix);g.remove(o);});m.computeBoundingSphere();g.add(m);}
  }
  function label(parent,word,x,y,z,w,h,color='#282d32',background='#f2efe8'){
    const c=document.createElement('canvas');c.width=360;c.height=76;
    const ctx=c.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=color;
    ctx.font='700 44px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(word,180,39,334);
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
    const sign=new T.Mesh(geo('plaque',()=>new T.PlaneGeometry(1,1)),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}));
    sign.position.set(x,y,z);sign.scale.set(w,h,1);parent.add(sign);return sign;
  }
  function petal(parent,x,y,z,c,size=.12){
    for(let i=0;i<5;i++){const a=i*TAU/5;orb(parent,x+size*.65*Math.cos(a),y,z+size*.65*Math.sin(a),size*.51,size*.27,size*.50,c);}
    orb(parent,x,y+.024,z,size*.38,size*.28,size*.38,honey);
  }
  function tree(parent,x,z,s,c=leaf){
    cyl(parent,x,.65*s,z,.11*s,.16*s,1.30*s,wood);
    stroke(parent,x,.73*s,z,x-.36*s,1.04*s,z,.072*s,wood);
    orb(parent,x,1.61*s,z,.69*s,.77*s,.61*s,c);
    orb(parent,x-.43*s,1.35*s,z+.03*s,.47*s,.53*s,.47*s,c);
    orb(parent,x+.38*s,1.46*s,z-.07*s,.46*s,.55*s,.46*s,c);
  }
  function lantern(parent,x,y,z,s=1){
    cyl(parent,x,y+.12*s,z,.14*s,.16*s,.21*s,wood,8);
    orb(parent,x,y+.32*s,z,.15*s,.23*s,.15*s,0xffcf85);
    cyl(parent,x,y+.56*s,z,.03*s,.22*s,.15*s,teal,8);
  }
  const island=group(scene), terrain=group(island);
  const water=cyl(terrain,0,-.52,0,10.9,10.7,.23,0x9ecdc8,80);water.scale.z*=.98;
  cyl(terrain,0,-.36,0,10.45,10.25,.34,0xdac2a0,80);cyl(terrain,0,-.11,0,10.27,10.45,.20,0xa7bf88,80);
  const ring=solid(terrain,geo('pathring',()=>new T.RingGeometry(3.00,3.89,80)),0xf4ddb1,0,.03,0);
  ring.rotation.x=-PI/2;ring.castShadow=false;
  for(const {x,z,key} of places)if(key!=='memories'){
    const d=Math.hypot(x,z),strip=box(terrain,x/2,.011,z/2,.99,.07,d,0xf2dcb5);strip.rotation.y=Math.atan2(x,z);
  }
  let seed=294;const rand=()=>((seed=(seed*16807)%2147483647)/2147483647);
  const treeClusters=[];
  for(let i=0;i<24;i++){
    const a=(i+.13*rand())*TAU/24,r=9.25+.25*rand(),x=Math.cos(a)*r,z=Math.sin(a)*r;
    const size=(z>4?.65:.88)+rand()*.4, colors=[0x94bd88,0xa4cfb4,0xe7abab,0xacbf8d,0xc4a7c6,0xe7bc9a];
    const part=Math.floor(i/3);let cluster=treeClusters[part];
    if(!cluster){const middle=(i+1)*TAU/24;cluster=group(island,Math.cos(middle)*9.5,0,Math.sin(middle)*9.5);treeClusters.push(cluster);}
    const tx=x-cluster.position.x,tz=z-cluster.position.z;tree(cluster,tx,tz,size,colors[i%6]);
    if(i%3===0)for(let j=0;j<5;j++){const b=j*TAU/5;orb(cluster,tx+Math.cos(b)*.55*size,(1.52+rand()*.35)*size,tz+Math.sin(b)*.45*size,.080,.081,.080,0xf7d1bd);}
  }
  treeClusters.forEach(batch);
  for(let i=0;i<72;i++){
    const a=rand()*TAU,r=4.2+rand()*4.8,x=Math.cos(a)*r,z=Math.sin(a)*r;
    if(places.some(p=>Math.hypot(x-p.x,z-p.z)<1.8))continue;
    if(i%3===0)petal(terrain,x,.14,z,[rose,cream,lilac][i%5%3],.11);
    else{orb(terrain,x,.12,z,.18,.14,.16,0x97b97e);orb(terrain,x+.14,.09,z+.06,.12,.10,.13,0xb3ca8f);}
  }
  for(let i=0;i<7;i++){const a=i*TAU/7+.25;lantern(terrain,3.96*Math.cos(a),0,3.96*Math.sin(a),.82);}
  // A little lily pond and stepping stones lead to the support bench.
  const pond=group(terrain,-3.18,.052,6.06);
  orb(pond,0,.044,0,1.31,.085,.82,0xc7aa85);
  orb(pond,0,.098,0,1.22,.070,.73,0x77bdb9);
  for(const [x,z,r] of [[-.57,.15,.24],[.54,-.24,.18],[.22,.38,.16]]){
    orb(pond,x,.17,z,r,.02,r*.75,0x8eb88c);petal(pond,x+.03,.22,z,rose,.095);
  }
  for(let i=0;i<4;i++)orb(pond,-.79+i*.46,.22,-.29+i*.15,.16,.10,.17,0xcec5a9);
  batch(pond);
  batch(terrain);
  const landmarks=new Map(), picks=[];
  function pick(g,type,value){g.userData.action=type;g.userData.value=value;picks.push(g);}
  const court=group(island,3.85,.05,.62);
  cyl(court,0,.01,0,1.58,1.66,.09,0xc9aa89,40);
  cyl(court,0,.062,0,1.48,1.57,.045,0xf8e4c3,40);
  const mosaic=hoop(court,0,.09,0,1.26,.024,teal);mosaic.rotation.x=-PI/2;
  for(const side of [-1,1]){
    const post=group(court,side*1.15,0,-.55);
    cyl(post,0,.8,0,.06,.088,1.55,wood,12);
    cyl(post,0,1.66,0,.13,.11,.29,honey,8);
    cyl(post,0,1.87,0,.02,.18,.12,teal,8);
    const seat=group(court,side*.93,.11,-.27);seat.rotation.y=side*-.5;
    box(seat,0,.23,0,.44,.12,.74,wood);
    for(const end of [-1,1])box(seat,0,.11,end*.25,.28,.2,.09,teal);
  }
  for(let i=0;i<6;i++){
    const x=-1.15+i*.46,X=x+.46,y=t=>1.45+.29*(t/1.15)**2;
    if(i<5)stroke(court,x,y(x),-.55,X,y(X),-.55,.017,wood);
    if(i>0&&i<5){stroke(court,x,y(x),-.55,x,y(x)-.1,-.55,.015,wood);orb(court,x,y(x)-.17,-.55,.088,.11,.088,i%2?cream:honey);}
  }
  // A high timber arch and amber lanterns make the meeting place visible across the island.
  for(const x of [-1.15,1.15]){
    cyl(court,x,1.06,-.75,.076,.09,2.1,wood,12);
    box(court,x,2.09,-.72,.45,.11,.20,teal);
    cyl(court,x,1.62,-.51,.20,.20,.39,0xffbb5b,12);
    cyl(court,x,1.89,-.51,.07,.25,.15,teal,12);
    cyl(court,x,1.39,-.51,.09,.18,.065,wood,12);
  }
  box(court,0,2.16,-.75,2.59,.14,.20,teal);
  box(court,0,1.90,-.70,1.71,.37,.12,0x865b40);
  label(court,'Lantern Court',0,1.91,-.626,1.61,.30,'#f2efe8','#2446a8');
  batch(court);pick(court,'court');
  for(const stop of places){
    const g=group(island,stop.x,0,stop.z);landmarks.set(stop.key,g);pick(g,'place',stop.key);
    if(stop.key==='memories')continue;
    cyl(g,0,.075,0,1.60,1.68,.15,0xe2bc98,32);cyl(g,0,.16,0,1.55,1.6,.06,0xf9e6c8,32);
    if(stop.key==='circle'){
      for(const i of [-1,1])for(const k of [-1,1])cyl(g,i*.77,.94,k*.62,.075,.097,1.54,cream,12);
      cyl(g,0,1.91,0,.20,1.38,.69,salmon,8).rotation.y=PI/8;
      for(let i=0;i<12;i++){const a=i*TAU/12;orb(g,1.18*Math.cos(a),1.57,1.18*Math.sin(a),.27,.15,.26,i%2?rose:cream);}
      orb(g,0,2.30,0,.21,.16,.21,honey);
      cyl(g,0,.57,0,.51,.51,.11,wood);cyl(g,0,.37,0,.13,.19,.37,wood);
      for(const i of [-1,1]){cyl(g,i*.77,.36,.22,.27,.24,.23,mint);cyl(g,i*.77,.24,.22,.10,.12,.17,wood);}
      cyl(g,-.12,.72,0,.14,.10,.18,cream);hoop(g,.024,.73,0,.065,.02,cream);
    }else if(stop.key==='profile'){
      box(g,0,.90,0,1.69,1.42,1.25,0xf4d2a1);
      cyl(g,0,1.87,0,.13,1.46,.74,mint,4).rotation.y=PI/4;
      for(const i of [-1,1])orb(g,i*.52,2.03,.03,.31,.50,.23,teal).rotation.z=i*-.38;
      orb(g,0,.77,.65,.67,.68,.044,cream);box(g,0,.54,.70,.49,.70,.09,wood);
      for(const i of [-1,1]){orb(g,i*.35,1.12,.72,.055,.065,.038,ink);orb(g,i*.50,.95,.72,.11,.06,.025,rose);}
      orb(g,0,1.01,.73,.085,.067,.038,ink);cyl(g,.99,.38,.70,.06,.075,.38,wood);
      box(g,1,.68,.70,.41,.3,.29,salmon);box(g,.99,.69,.86,.23,.03,.035,cream);
    }else if(stop.key==='timeline'){
      box(g,0,1.03,0,1.07,1.72,.97,sky);
      cyl(g,0,2.11,0,.08,1.13,.67,teal,4).rotation.y=PI/4;
      orb(g,0,2.51,0,.11,.15,.11,honey);box(g,0,.58,.51,.62,.74,.08,cream);
      const bezel=cyl(g,0,1.51,.515,.40,.41,.08,honey,32);bezel.rotation.x=PI/2;
      const face=cyl(g,0,1.51,.564,.337,.337,.03,cream,32);face.rotation.x=PI/2;
      stroke(g,0,1.51,.60,0,1.73,.60,.027,ink);stroke(g,0,1.51,.60,.15,1.43,.60,.029,ink);
      for(let i=0;i<4;i++){const a=i*PI/2;orb(g,.269*Math.cos(a),1.51+.269*Math.sin(a),.60,.025,.025,.01,wood);}
      for(const i of [-1,1]){stroke(g,i*.92,.26,0,i*.92,.76,0,.055,wood);orb(g,i*.92,.85,0,.18,.24,.18,i<0?rose:mint);}
    }else if(stop.key==='path'){
      cyl(g,0,1.04,0,.094,.14,1.81,wood,12);orb(g,0,2.03,0,.14,.14,.14,honey);
      for(const [i,c,y] of [[1,mint,1.68],[-1,rose,1.24],[1,honey,.84]]){
        box(g,.23*i,y,0,.99,.25,.17,c);cyl(g,.76*i,y,0,.018,.21,.28,c,4).rotation.z=-i*PI/2;
      }
      for(let i=0;i<6;i++){const a=i*TAU/6;orb(g,Math.cos(a)*.93,.235,Math.sin(a)*.93,.18,.055,.18,i%2?rose:sky);}
    }else if(stop.key==='support'){
      for(const i of [-1,1]){cyl(g,i*.89,.96,0,.09,.12,1.58,0x9f9b78);orb(g,i*.9,.41,-.12,.4,.26,.34,leaf);}
      hoop(g,0,1.66,0,.89,.11,leaf,PI);
      for(let i=0;i<11;i++){const a=i*PI/10,x=.89*Math.cos(a),y=1.66+.89*Math.sin(a);orb(g,x,y,.08,.16,.15,.13,i%3?rose:lilac);}
      const seat=group(g);seat.userData.action='object';seat.userData.value={key:'support',action:'sit'};
      box(seat,0,.53,.18,1.24,.15,.53,honey);box(seat,0,.78,-.05,1.22,.36,.12,honey);
      for(const i of [-1,1])box(seat,i*.46,.33,.13,.14,.32,.34,wood);batch(seat);
      lantern(g,.90,.18,.49,.7);
    }else{
      cyl(g,0,.215,-.28,.76,.77,.065,0x997258,32);
      const edging=hoop(g,0,.26,-.28,.76,.04,wood);edging.rotation.x=-PI/2;
      cyl(g,1,.29,.07,.33,.24,.28,0xe6ac8b);stroke(g,1,.37,.07,1,.75,.07,.038,wood);orb(g,.89,.61,.07,.15,.08,.08,leaf);
    }
    batch(g);
  }
  // Each working object lives at its landmark. The labels face visitors on the path.
  const stationObjects=new Map(),objectsByAction=new Map();
  function star(parent,x,y,z,size,color){
    const shape=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.46:1;const x=r*Math.cos(a),y=r*Math.sin(a);if(i)shape.lineTo(x,y);else shape.moveTo(x,y);}shape.closePath();
    return solid(parent,geo('wishing-star',()=>new T.ExtrudeGeometry(shape,{depth:.14,bevelEnabled:false})),color,x,y,z,size,size,size);
  }
  function envelope(g){box(g,0,.27,0,.58,.38,.12,cream);for(const i of [-1,1])stroke(g,i*.26,.43,.075,0,.24,.075,.019,salmon);orb(g,0,.23,.09,.045,.045,.023,salmon);}
  function notebook(g,open){
    if(open){for(const i of [-1,1]){const side=group(g,i*.13,.24,0);side.rotation.z=i*.12;side.rotation.x=-.35;box(side,0,0,0,.265,.37,.09,teal);box(side,0,0,.06,.24,.33,.04,cream);for(let j=0;j<3;j++)box(side,0,.08-j*.07,.09,.16,.012,.012,wood);}}
    else{box(g,0,.26,0,.43,.47,.13,mint);box(g,-.16,.26,.081,.034,.44,.024,teal);box(g,.03,.28,.078,.20,.11,.013,cream);}
  }
  function actionModel(g,kind){
    if(kind==='letter'){envelope(g);return;}
    if(kind==='book'||kind==='journal'){notebook(g,kind==='book');return;}
    if(kind==='candle'){cyl(g,0,.10,0,.28,.25,.11,teal);cyl(g,0,.30,0,.14,.14,.36,cream);stroke(g,0,.47,0,0,.52,0,.013,ink);return;}
    if(kind==='stone'){orb(g,0,.19,0,.34,.20,.25,0xa8b8b2);petal(g,.09,.35,0,cream,.080);return;}
    if(kind==='plant'||kind==='tree'){
      cyl(g,0,.13,0,.21,.15,.25,0xda9e80);stroke(g,0,.22,0,0,.55,0,.027,wood);
      if(kind==='tree'){orb(g,0,.50,0,.24,.23,.19,leaf);orb(g,-.17,.43,.02,.13,.14,.13,mint);}
      else for(const i of [-1,1])orb(g,i*.11,.40+.04*i,0,.14,.073,.063,leaf).rotation.z=i*.45;return;}
    if(kind==='community'){for(const i of [-1,1]){const m=group(g,i*.16,.01,i*.04);cyl(m,0,.20,0,.125,.088,.22,i<0?rose:sky);hoop(m,i*.13,.20,.01,.067,.020,i<0?rose:sky);cyl(m,0,.316,0,.104,.104,.009,wood);}return;}
    if(kind==='portrait'){box(g,0,.28,0,.52,.47,.10,honey);box(g,0,.28,.06,.43,.39,.025,cream);orb(g,0,.29,.095,.11,.12,.03,0xd1a481);for(const i of [-1,1]){orb(g,i*.10,.35,.095,.054,.09,.029,wood);orb(g,i*.049,.31,.13,.014,.015,.013,ink);}return;}
    if(kind==='files'){for(let i=0;i<3;i++){const cover=box(g,(i-1)*.12,.24,0,.09,.40+i*.036,.24,[salmon,mint,sky][i]);cover.rotation.z=-.09*(i-1);}return;}
    if(kind==='clock'){const c=cyl(g,0,.28,0,.23,.23,.1,honey);c.rotation.x=PI/2;orb(g,0,.28,.07,.19,.19,.022,cream);stroke(g,0,.28,.10,0,.41,.10,.02,ink);stroke(g,0,.28,.10,.095,.24,.10,.02,ink);return;}
    if(kind==='sign'){stroke(g,0,.09,0,0,.52,0,.035,wood);box(g,.035,.41,.004,.37,.13,.07,mint);box(g,-.035,.25,.004,.37,.12,.07,rose);return;}
    // A flower cushioned bench for the loss-support guide.
    box(g,0,.17,0,.51,.09,.25,honey);box(g,0,.28,-.09,.52,.18,.055,mint);for(const i of [-1,1])box(g,i*.17,.09,0,.055,.15,.17,wood);
  }
  const features={
    circle:[['ask','Ask a question','letter'],['community','Care Circle','community'],['lessons','Care lessons','book']],
    profile:[['profile','My companion','portrait']],
    timeline:[['log','Add a note','journal'],['records','Add health records','files'],['history','My records','clock']],
    path:[['path','Care path','sign']],
    support:[['guidance','Quiet bench','bench'],['stone','Memory stone','stone'],['candle','Light a candle','candle'],['letter','Write a letter','letter']],
    trees:[['plant','Garden tree','plant'],['real-tree','Living tree','tree']],
    memories:[['cabinet','My cabinet','portrait'],['visitors','Guest book','book']]
  };
  for(const [key,actions] of Object.entries(features)){
    const row=group(landmarks.get(key),0,0,key==='memories'?2.12:1.68);row.visible=false;stationObjects.set(key,row);
    for(const [i,[action,title,kind]] of actions.entries()){
      const x=(i-(actions.length-1)/2)*(key==='memories'?1.64:1.10),desk=group(row,x,.03,-Math.abs(x)*.09);
      const size=1.15;desk.scale.setScalar(size);desk.userData.action='object';desk.userData.value={key,action};objectsByAction.set(key+'/team-review/'+action,desk);
      cyl(desk,0,.095,0,.37,.41,.16,0xbf9479,20);cyl(desk,0,.20,0,.41,.39,.12,cream,20);
      const model=group(desk,0,.25,-.035);actionModel(model,kind);batch(model);
      box(desk,0,.165,.344,.90,.205,.08,wood).rotation.x=-.52;label(desk,title,0,.185,.400,.87,.19).rotation.x=-.52;
      if(kind==='candle'){const fire=group(model,0,.59,0);orb(fire,0,0,0,.060,.12,.063,honey);orb(fire,.014,-.025,.042,.032,.064,.026,0xffeab3);desk.userData.flame=fire;}
      batch(desk);
    }
  }
  const skyGate=landmarks.get('support');
  for(const i of [-1,0,1]){
    const x=i*.48,top=2.40-.20*Math.abs(i),y=top-.18-.14*(i===0);
    stroke(skyGate,x,top,-.05,x,y,-.05,.012,honey);star(skyGate,x,y-.065,-.02,i===0?.11:.075,0xffca7d);
  }
  const wallBase=landmarks.get('memories');cyl(wallBase,0,.10,0,2.45,2.54,.20,0xe3c4a6,46);cyl(wallBase,0,.24,0,2.32,2.45,.13,cream,46);
  const loader=new T.TextureLoader(), clickableMemories=[], worldMemories=group(island);
  const plantedGrove=group(landmarks.get('trees'),0,.25,-.28), plantedTrees=new Map();
  let generation=0,selectedMemory=null,dedication=null,growingTree=null,growthStarted=0;
  function showTrees(memories){
    discard(plantedGrove);plantedTrees.clear();growingTree=null;
    const saved=memories.filter(m=>m.tree);
    saved.forEach((m,i)=>{
      const angle=i*2.399963, radius=i?Math.sqrt(i)*1.12:0;
      const trunk=group(plantedGrove,Math.cos(angle)*radius,0,Math.sin(angle)*radius);
      tree(trunk,0,0,.90,[0x89b482,0xa9bf83,0xcd9994][i%3]);
      cyl(trunk,0,.04,0,.42,.49,.08,0x896749,18);
      for(const x of [-.42,.42])box(trunk,x,.28,.53,.05,.48,.055,wood);
      box(trunk,0,.44,.52,1.16,.25,.08,wood);
      label(trunk,m.tree,0,.45,.57,1.10,.22);
      batch(trunk);plantedTrees.set(m.id,trunk);
    });
    canvas.dataset.plantedTrees=String(saved.length);
  }
  function discard(g){g.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.material?.map){o.material.map.dispose();o.material.dispose();}});g.clear();}
  function gift(g,kind,x,z,size=.82){
    const prop=group(g,x,.30,z);prop.scale.setScalar(size);
    if(kind==='flower'){cyl(prop,0,.15,0,.16,.11,.27,0xe0a08e);for(const [i,c] of [[-.13,rose],[.06,lilac],[.16,honey]]){stroke(prop,0,.26,0,i,.61,0,.022,leaf);petal(prop,i,.62,0,c,.14);}}
    else if(kind==='treat'){box(prop,0,.13,0,.64,.13,.18,0xd9a565);for(const i of [-1,1])for(const k of [-1,1])orb(prop,i*.28,.14,k*.083,.10,.086,.10,0xe4b777);}
    else if(kind==='toy'){orb(prop,0,.25,0,.24,.24,.24,sky);hoop(prop,0,.25,0,.232,.02,cream).rotation.x=.7;}
    else{cyl(prop,0,.17,0,.13,.13,.32,cream);orb(prop,0,.42,0,.06,.12,.06,honey);orb(prop,.011,.41,.04,.025,.068,.025,0xfff0ca);}
    batch(prop);return prop;
  }
  function refreshMemories(event) {
    const detail=event?.detail?.tributes?event.detail:{};if(!detail.tributes)send('garden:query-memories',detail);
    const all=detail.tributes?.length?detail.tributes:[{id:'bobby',pet:'Bobby',photo:'/team-review/assets/bobby-happy-real.webp',candle:true},...tributes];
    selectedMemory=detail.tribute??all[0];
    objectsByAction.get('support/candle').userData.flame.visible=!!selectedMemory.candle;
    const v=++generation;clickableMemories.length=0;discard(worldMemories);
    // Place the selected locker at the center, with the next two neighbors alongside it.
    const selected=Math.max(0,all.findIndex(p=>p.id===selectedMemory.id)),shown=[all.length>1?all[(selected+1)%all.length]:null,all[selected],all.length>2?all[(selected+2)%all.length]:null];
    shown.forEach((entry,i)=>{
      const x=(i-1)*1.24, g=group(worldMemories,x,.27,-.09-Math.abs(i-1)*.10);
      g.rotation.y=(1-i)*.13;
      box(g,0,.71,0,1.16,1.39,.44,0xc49378);box(g,0,.75,.23,1.01,1.17,.08,cream);
      box(g,0,.79,.285,.84,.98,.05,entry?0xa28c83:(i===0?0xadccc2:0xcdb4c7));
      const arch=hoop(g,0,1.37,0,.53,.095,i===1?salmon:mint,PI);arch.position.z=.15;
      orb(g,0,1.86,.14,.075,.075,.075,honey);box(g,0,.20,.33,1.19,.12,.27,0xdab18e);
      if(entry){
        g.userData.action='memory';g.userData.value=entry.id;clickableMemories.push(g);
        label(g,entry.pet,0,.23,.484,.93,.20);
        if(entry.photo){const backing=box(g,0,.85,.33,.80,.86,.02,cream);loader.load(entry.photo,texture=>{
          if(v!==generation){texture.dispose();return;}
          texture.colorSpace=T.SRGBColorSpace;
          const ratio=texture.image.width/texture.image.height,h=Math.min(.82,.76/ratio);
          const frame=new T.Mesh(geo('plaque',()=>new T.PlaneGeometry(1,1)),new T.MeshBasicMaterial({map:texture}));
          frame.scale.set(h*ratio,h,1);frame.position.set(backing.position.x,.85,.35);g.add(frame);draw();
        });}
        if(entry.candle)gift(g,'candle',-.43,.60,.8);
        for(const [j,k] of ['flower','toy','treat'].entries())if(entry.gifts?.[k])gift(g,k,-.22+j*.30,.75,.68);
      }else{
        g.userData.action='new-memory';clickableMemories.push(g);
        orb(g,0,.82,.335,.23,.14,.02,cream);for(let j=0;j<3;j++)orb(g,(j-1)*.15,.98+.06*(j===1),.335,.068,.082,.022,cream);
      }
      batch(g);
    });
    const bench=landmarks.get('support');
    showTrees(all);
    if(dedication){for(const g of dedication){g.removeFromParent();discard(g);}}
    const stone=group(bench,-.76,.19,.96);dedication=[stone];
    if(selectedMemory.stone){orb(stone,0,.15,0,.44,.24,.34,0x9eaaa3);label(stone,selectedMemory.stone,0,.19,.285,.67,.14,'#434b45','#c4cec5');}
    draw();
  }

  // Only explicitly published memorials can enter the two neighboring 3D guest cabinets.
  const publicWall=group(wallBase);publicWall.visible=false;let guestGeneration=0;
  function refreshPublicWall(event){
    const state=event?.detail||{};if(!Array.isArray(state.cabinets))return;
    const revision=++guestGeneration;discard(publicWall);
    state.cabinets.slice(0,2).forEach((entry,i)=>{
      const side=i?1:-1,cabinet=group(publicWall,side*2.28,.20,.09);cabinet.rotation.y=-side*.19;
      cabinet.userData.action='public-cabinet';cabinet.userData.value=entry.id;
      box(cabinet,0,.50,0,.91,.99,.34,teal);box(cabinet,0,.52,.18,.80,.85,.07,mint);
      const cover=hoop(cabinet,0,.96,0,.38,.075,honey,PI);cover.position.z=.06;
      const fallback=group(cabinet,0,.42,.26);envelope(fallback);label(cabinet,entry.pet,0,.23,.245,.77,.18);
      if(entry.photo){let url;try{url=new URL(entry.photo,location.origin);}catch{}if(url?.origin===location.origin)loader.load(url.href,texture=>{
        if(revision!==guestGeneration){texture.dispose();return;}
        texture.colorSpace=T.SRGBColorSpace;const ratio=texture.image.width/texture.image.height,h=Math.min(.53,.60/ratio);
        const frame=new T.Mesh(geo('plaque',()=>new T.PlaneGeometry(1,1)),new T.MeshBasicMaterial({map:texture}));
        frame.position.set(0,.64,.26);frame.scale.set(h*ratio,h,1);fallback.visible=false;cabinet.add(frame);draw();
      });}
      for(const [j,k] of ['candle','flower','treat','toy'].entries()){
        const x=(j-1.5)*.23,stand=group(cabinet,x,-.09,.42);
        cyl(stand,0,.19,0,.12,.13,.08,entry.gifts?.[k]?honey:cream,12);gift(stand,k,0,0,.43);
        stand.userData.action='public-gift';stand.userData.value={id:entry.id,gift:k};
      }
      batch(cabinet);
    });
    draw();
  }
  document.addEventListener('garden:community-changed',refreshPublicWall);
  function person(parent,opts={}){
    const g=group(parent), body=group(g), head=group(body,0,1.04,0), pet=group(body,.54,0,.17), legs=[],fur=opts.color||'#d3a56b';
    // Soft bob, knitted jacket, small boots and a blue satchel.
    for(const i of [-1,1]){const l=group(body,i*.113,.44,0);orb(l,0,-.14,0,.096,.19,.095,0x62747c);orb(l,0,-.32,.04,.12,.074,.15,0x835f50);legs.push(l);}
    orb(body,0,.68,0,.27,.31,.215,opts.coat||'#58796e');
    const arms=[];for(const i of [-1,1]){const arm=group(body,i*.239,.80,0);arms.push(arm);orb(arm,i*.024,-.15,0,.088,.20,.095,opts.coat||'#58796e').rotation.z=i*.19;orb(arm,i*.051,-.33,.035,.078,.088,.08,0xe6b28d);batch(arm);}
    orb(head,0,.02,0,.30,.31,.262,0xeac09e);
    orb(head,0,.17,-.045,.312,.227,.257,0x715348);
    for(const i of [-1,1]){orb(head,i*.097,.025,.246,.032,.043,.019,ink);orb(head,i*.17,-.059,.225,.054,.031,.018,0xe9a195);}
    orb(head,-.078,.20,.157,.23,.099,.096,0x715348).rotation.z=.12;
    orb(body,0,.90,0,.215,.093,.189,honey);orb(body,-.201,.80,.13,.068,.14,.049,honey);
    const cat=opts.pet==='cat',breed=opts.breed;
    const coats={
      golden:['#d8a354','#bc8749','#ffe2a6'],husky:['#657786','#596b7a','#fcf6e9'],
      beagle:['#c78d55','#4a423e','#fff3db'],poodle:['#b9794d','#a66645','#e8b78e'],
      corgi:['#c58a4a','#b57342','#fff0d0'],shorthair:['#8395a2','#728496','#a9b6bc'],
      siamese:['#e8d5b3','#5f4943','#6f5148'],ragdoll:['#f4e8db','#92857f','#fff4e6'],
      coon:['#8d7964','#574d45','#d7b68a'],bengal:['#d49b57','#694b39','#f4d499']
    };
    const [base,accent,bib]=coats[breed]||[fur,fur,0xffe9cc];
    const fluffy=['golden','husky','ragdoll','coon'].includes(breed);
    const points=breed==='siamese', upright=cat||breed==='husky'||breed==='corgi';
    if(breed==='corgi')pet.scale.set(1.08,.80,1.22);
    if(breed==='coon')pet.scale.set(1.12,1.12,1.20);
    if(breed==='siamese')pet.scale.set(.88,1.04,1.08);
    orb(pet,0,.31,0,.20,.20,.29,base);
    for(const i of [-1,1])for(const k of [-1,1])orb(pet,i*.113,.134,k*.17,.071,.107,.078,points?accent:base);
    if(['beagle','husky','coon'].includes(breed))orb(pet,0,.39,-.065,.19,.143,.235,accent);
    if(coats[breed]&&!points)orb(pet,0,.34,.19,.166,.17,.133,bib);
    if(fluffy)for(let j=0;j<7;j++){const a=j*TAU/7;orb(pet,.166*Math.cos(a),.43+.054*Math.sin(a),.13+.12*Math.sin(a),.089,.11,.08,bib);}
    if(breed==='bengal'||breed==='coon')for(const i of [-1,1])for(let j=0;j<3;j++)orb(pet,i*(.17-.014*Math.abs(j-1)),.36,.105-j*.109,.032,breed==='coon'?.082:.039,.045,accent);
    const ph=group(pet,0,.57,.17);
    orb(ph,0,0,0,.245,.236,.22,base);
    for(const i of [-1,1]){
      if(upright){
        const e=cyl(ph,i*.145,.186,-.025,.004,.11,breed==='coon'?.32:.24,accent,3);e.rotation.z=i*-.16;
        const n=cyl(ph,i*.146,.194,.019,.003,.066,.15,rose,3);n.rotation.z=i*-.16;
      }else{const e=orb(ph,i*.221,-.015,-.02,.098,breed==='beagle'?.245:.215,.10,breed==='beagle'?base:accent);e.rotation.z=i*.17;}
      if(['husky','corgi','beagle','ragdoll'].includes(breed))orb(ph,i*.091,-.025,.165,.095,.113,.066,breed==='ragdoll'?accent:bib);
      if(points&&i===-1)orb(ph,0,-.03,.18,.175,.133,.058,accent);
      orb(ph,i*.086,.015,.229,.026,.035,.017,['husky','siamese','ragdoll'].includes(breed)?0x486a7d:ink);
      orb(ph,i*.092,.027,.242,.009,.009,.009,cream);
    }
    if(breed==='poodle'){
      for(let j=0;j<9;j++){const a=j*TAU/9;orb(ph,.17*Math.cos(a),.14+.055*Math.sin(a),.10*Math.sin(a),.11,.108,.106,base);}
      for(const side of [-1,1])orb(ph,side*.22,-.11,-.02,.113,.116,.11,accent);
    }
    orb(ph,0,-.074,.196,.153,.096,.105,bib);orb(ph,0,-.044,.290,.046,.035,.030,cat?salmon:ink);
    if(!cat)orb(ph,.024,-.138,.243,.034,.05,.024,rose);
    if(cat)for(const i of [-1,1])for(const k of [0,1])stroke(ph,i*.07,-.067+k*.028,.252,i*.222,-.074+k*.052,.247,.007,wood);
    const tail=group(pet,0,.33,-.23);
    orb(tail,0,.105,-.05,fluffy?.10:.066,cat?.21:.14,fluffy?.125:.079,points?accent:base).rotation.x=-.46;
    if(breed==='poodle')orb(tail,0,.23,-.115,.095,.10,.1,base);
    orb(pet,0,.44,.10,.179,.060,.18,salmon);orb(pet,0,.40,.265,.045,.057,.023,honey);
    for(const o of [body,head,pet,ph,...legs])batch(o);
    return {g,body,pet,head,legs,tail,arms};
  }
  function companionOptions(input){
    const color=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
    return {pet:input?.pet==='cat'?'cat':'dog',breed:input?.breed||'',coat:color(input?.coat)?input.coat:'#58796e',color:color(input?.color)?input.color:'#d3a56b'};
  }
  let options=companionOptions({});try{options=companionOptions(JSON.parse(localStorage.getItem('woafypet-garden-avatar-v1')));}catch{}
  let player=person(scene,options);player.g.position.set(2.40,.055,3.40);player.g.scale.setScalar(1.28);player.g.rotation.y=.36;
  const remotes=new Map(),heart=group(scene);heart.visible=false;
  for(const i of [-1,1])orb(heart,i*.083,.048,0,.117,.133,.054,salmon).rotation.z=i*-.43;
  const tip=cyl(heart,0,-.076,0,.13,.005,.16,salmon,4);tip.rotation.y=PI/4;
  const comfortHeart=heart.clone();comfortHeart.visible=false;scene.add(comfortHeart);
  let embrace=null;
  function finishHug(){
    if(!embrace)return;
    for(const actor of embrace.actors){actor.body.position.set(0,0,0);actor.body.rotation.y=0;for(const arm of actor.arms)arm.rotation.set(0,0,0);}
    comfortHeart.visible=false;embrace=null;
  }
  function animateHug(now){
    if(!embrace)return false;
    const t=(now-embrace.start)/2300;
    if(t>=1){finishHug();return false;}
    const hold=reduced.matches?1:T.MathUtils.smoothstep(t,0,.30)*(1-T.MathUtils.smoothstep(t,.75,1));
    const [self,other]=embrace.actors,mid=self.g.position.clone().lerp(other.g.position,.5);
    const dx=self.g.position.x-other.g.position.x,dz=self.g.position.z-other.g.position.z,length=Math.hypot(dx,dz);
    const ux=length>.15?dx/length:1,uz=length>.15?dz/length:0;
    embrace.actors.forEach((actor,i)=>{
      const side=i?-1:1,target=new T.Vector3(mid.x+ux*side*.285,actor.g.position.y,mid.z+uz*side*.285);
      actor.body.position.copy(actor.g.worldToLocal(target)).multiplyScalar(hold);
      const yaw=Math.atan2(-ux*side,-uz*side)-actor.g.rotation.y;
      actor.body.rotation.y=Math.atan2(Math.sin(yaw),Math.cos(yaw))*hold;
      actor.arms.forEach((arm,i)=>{arm.rotation.z=(i?1:-1)*.86*hold;arm.rotation.x=-1.13*hold;});
    });
    comfortHeart.visible=true;comfortHeart.position.set(mid.x,1.97+hold*.14,mid.z);comfortHeart.quaternion.copy(camera.quaternion);comfortHeart.scale.setScalar(1.3);
    return true;
  }
  document.addEventListener('garden:hug',event=>{
    const other=remotes.get(String(event.detail?.id));if(!other)return;
    finishHug();leaveBench();route=[];keys.clear();walkMarker.visible=false;
    embrace={start:performance.now(),actors:[player,other.figure]};status.textContent='You share a quiet hug in the garden.';startLoop();
  });
  const walkMarker=hoop(scene,0,.071,0,.24,.028,teal);walkMarker.rotation.x=-PI/2;walkMarker.visible=false;
  const pinFor=k=>buttons.find(b=>b.dataset.place===k);
  const initialAngle=.19;
  let angle=initialAngle,zoom=1,focus=0,focusGoal=0,focusX=0,focusZ=0,goalX=0,goalZ=0;
  let seated=false,viewTarget=null;
  const zoomLevel=controls.querySelector('[data-zoom-level]');
  function changeZoom(value){
    zoom=clamp(value,.25,5);
    if(zoom<1){
      // Ease back to the whole island even from a close-up or landmark.
      const sceneScale=(focused||viewTarget)?clamp((zoom-.5)*2,0,1):0;
      focus=focusGoal=sceneScale;
      if(!sceneScale)focusX=goalX=focusZ=goalZ=0;
    }else if(focused||viewTarget){
      const place=viewTarget==='court'?court.position:focused?places.find(p=>p.key===focused):null;
      if(place){focusGoal=1;goalX=place.x;goalZ=place.z;}
    }
    if(!focused&&!viewTarget){
      const t=clamp((zoom-1)/2,0,1);
      focusX=goalX=player.g.position.x*t;focusZ=goalZ=player.g.position.z*t;
    }
    startLoop();
  }
  function framePoint(x,z,type){
    viewTarget=type;goalX=x;goalZ=z;focusGoal=1;zoom=type==='companion'?1.75:1;
    startLoop();
  }
  document.addEventListener('garden:tree-grown',e=>{
    const trunk=plantedTrees.get(e.detail.id);if(!trunk)return;
    trunk.getWorldPosition(center);framePoint(center.x,center.z,'tree');zoom=1.45;
    growingTree=trunk;growthStarted=performance.now();trunk.scale.setScalar(reduced.matches?1:.12);
    status.textContent='A tree for '+e.detail.name+'. Your dedication is saved in this garden.';
  });
  document.addEventListener('garden:close-up',()=>framePoint(player.g.position.x+.23,player.g.position.z,'companion'));
  document.addEventListener('garden:court',()=>framePoint(court.position.x,court.position.z,'court'));
  document.addEventListener('garden:gather',event=>{
    const i=Number(event.detail?.slot)||0,theta=i*2.39996,r=.65+(i%3)*.12;
    walkTo(court.position.x+Math.cos(theta)*r,court.position.z+.12+Math.sin(theta)*r);
    framePoint(court.position.x,court.position.z,'court');
  });
  document.addEventListener('garden:approach',event=>{
    const peer=remotes.get(String(event.detail?.id));
    if(!peer){status.textContent='That visitor has left the walk.';return;}
    const pos=peer.figure.g.position;
    for(let j=0;j<8;j++){
      const x=pos.x+1.05*Math.cos(j*PI/4),z=pos.z+1.05*Math.sin(j*PI/4);
      if(walkTo(x,z)){framePoint((x+pos.x)/2,(z+pos.z)/2,'visitor');status.textContent='Walking over with your companion.';return;}
    }
    status.textContent='The path is busy. You can still wave from here.';
  });
  let turning=null,lastWidth=0,lastHeight=0,focused=null,frame=0,prior=0,phase=0,bondUntil=0,route=[],keys=new Set();
  function draw(){
    const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    const percent=Math.round(zoom*100)+'%';
    if(zoomLevel.textContent!==percent)zoomLevel.textContent=percent;
    const aspect=w/h,over=Math.max(8.37,10.99/aspect),near=Math.max(2.35,3.18/aspect);
    const vertical=T.MathUtils.lerp(over,near,focus)/zoom;
    camera.left=-vertical*aspect;camera.right=vertical*aspect;camera.top=vertical;camera.bottom=-vertical;
    camera.position.set(focusX+Math.sin(angle)*23,20,focusZ+Math.cos(angle)*23);
    camera.lookAt(focusX,.5+focus*.30,focusZ);camera.updateProjectionMatrix();
    if(w!==lastWidth||h!==lastHeight){renderer.setSize(w,h,false);lastWidth=w;lastHeight=h;}
    for(const cluster of treeClusters){
      const dx=cluster.position.x-focusX,dz=cluster.position.z-focusZ;
      const nearSide=dx*Math.sin(angle)+dz*Math.cos(angle)>1.0;
      const inFront=Math.abs(dx*Math.cos(angle)-dz*Math.sin(angle))<5.5;
      cluster.visible=focus<.55||!nearSide||!inFront;
    }
    renderer.render(scene,camera);
    for(const p of places){const b=pinFor(p.key);if(!b)continue;
      b.style.visibility=focused||viewTarget||zoom<.65?'hidden':'';if(focused||viewTarget||zoom<.65)continue;
      center.set(p.x,p.key==='memories'?2.55:3.05,p.z).project(camera);
      const inset=b.offsetWidth/2+3;
      b.style.left=clamp((center.x+1)*w/2,inset,w-inset)+'px';b.style.top=clamp((1-center.y)*h/2,21,h-27)+'px';
    }
  }
  function leaveBench(){
    if(!seated)return;
    seated=false;const bench=landmarks.get('support').position;
    player.g.position.set(bench.x+1.12,.055,bench.z+1.12);player.legs.forEach(l=>l.rotation.x=0);player.pet.position.set(.54,0,.17);
    send('garden:sitting',{active:false});publishPosition();draw();
  }
  document.addEventListener('garden:sit',()=>{
    if(seated){leaveBench();status.textContent='You stand up beside your companion.';return;}
    if(focused!=='support')return;
    const bench=landmarks.get('support').position;finishHug();keys.clear();stopWalk();seated=true;
    player.g.position.set(bench.x-.18,.055,bench.z+.17);player.g.rotation.y=0;
    player.legs.forEach(l=>l.rotation.x=-1.24);player.pet.position.set(.84,0,.54);
    status.textContent='You sit together under the wishing stars.';send('garden:sitting',{active:true});publishPosition();draw();
  });
  function objectsHere(){return [...places].map(p=>({x:p.x,z:p.z,r:p.key==='memories'?1.64:p.key==='support'?.83:.97}));}
  const obstacles=objectsHere().concat({x:-3.18,z:6.06,r:.81});
  function canWalk(x,z){return Math.hypot(x,z)<9.02&&obstacles.every(o=>Math.hypot(x-o.x,z-o.z)>=o.r+.13);}
  // Find a short walk around the buildings, even when the camera turns.
  function walkTo(x,z){
    if(!canWalk(x,z))return false;leaveBench();
    const pos=player.g.position,step=.49, cell=n=>Math.round(n/step), code=(x,z)=>x+':'+z;
    const tx=cell(x),tz=cell(z),sx=cell(pos.x),sz=cell(pos.z),start=code(sx,sz);
    const queue=[[sx,sz]],prev=new Map([[start,null]]);let end=null;
    for(let i=0;i<queue.length;i++){
      const [a,b]=queue[i],at=code(a,b);
      if(Math.hypot((a-tx)*step,(b-tz)*step)<.66){end=at;break;}
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
        const nx=a+dx,nz=b+dz,k=code(nx,nz);if(prev.has(k)||!canWalk(nx*step,nz*step)||!canWalk((a+.5*dx)*step,(b+.5*dz)*step))continue;
        prev.set(k,at);queue.push([nx,nz]);}
    }
    if(!end)return false;
    const next=[[x,z]];
    for(let k=end;k&&k!==start;k=prev.get(k)){const [a,b]=k.split(':').map(Number);next.push([a*step,b*step]);}
    route=next.reverse();walkMarker.position.set(x,.072,z);walkMarker.visible=!focused;
    startLoop();return true;
  }
  function publishPosition(){const p=player.g.position;send('garden:position',{x:p.x,z:p.z});}
  function stopWalk(){route=[];walkMarker.visible=false;player.g.position.y=.055;player.legs.forEach(l=>l.rotation.x=0);publishPosition();}
  function locomote(dx,dz,step){
    const p=player.g.position,length=Math.hypot(dx,dz);if(!length)return;
    const travel=Math.min(length,step),nx=p.x+dx/length*travel,nz=p.z+dz/length*travel;
    if(canWalk(nx,nz)){p.x=nx;p.z=nz;}else if(canWalk(nx,p.z))p.x=nx;else if(canWalk(p.x,nz))p.z=nz;
    player.g.rotation.y=Math.atan2(dx,dz);phase+=travel*10;
    if(!reduced.matches){player.legs.forEach((l,i)=>l.rotation.x=Math.sin(phase+i*PI)*.39);player.g.position.y=.055+.024*Math.abs(Math.sin(phase));player.tail.rotation.z=Math.sin(phase)*.38;}
  }
  function loop(now){
    frame=0;
    const dt=Math.min(.05,prior?(now-prior)/1000:.016);prior=now;
    let moving=false;
    if(keys.size){
      const x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
      const z=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));
      locomote(x*Math.cos(angle)+z*Math.sin(angle),z*Math.cos(angle)-x*Math.sin(angle),dt*4.0);moving=true;
    }else if(route.length){
      const [x,z]=route[0],p=player.g.position,oldX=p.x,oldZ=p.z;locomote(x-p.x,z-p.z,dt*4.9);
      if(oldX===p.x&&oldZ===p.z&&Math.hypot(p.x-x,p.z-z)>.09)route=[];
      if(Math.hypot(p.x-x,p.z-z)<.09)route.shift();
      if(!route.length)stopWalk();else moving=true;
    }
    if(viewTarget==='companion'){goalX=player.g.position.x+.23;goalZ=player.g.position.z;}
    const ratio=reduced.matches?1:Math.min(1,dt*9);
    focus=T.MathUtils.lerp(focus,focusGoal,ratio);focusX=T.MathUtils.lerp(focusX,goalX,ratio);focusZ=T.MathUtils.lerp(focusZ,goalZ,ratio);
    const focusing=Math.abs(focus-focusGoal)+Math.abs(focusX-goalX)+Math.abs(focusZ-goalZ)>.005;
    if(!focusing){focus=focusGoal;focusX=goalX;focusZ=goalZ;}
    if(turning!==null){angle=T.MathUtils.lerp(angle,turning,ratio);if(Math.abs(angle-turning)<.002){angle=turning;turning=null;}}
    if(heart.visible){
      const t=1-clamp((bondUntil-now)/1100,0,1);player.pet.getWorldPosition(center);
      heart.position.set(center.x,1.05+.8*t,center.z);heart.quaternion.copy(camera.quaternion);
      heart.scale.setScalar(.84+Math.sin(PI*t)*.40);player.tail.rotation.z=reduced.matches?0:Math.sin(t*40)*.6;
      if(!reduced.matches){player.head.rotation.z=-.22*Math.sin(t*PI);player.arms[1].rotation.z=(.9+.10*Math.sin(t*23))*Math.sin(t*PI);}
      if(now>=bondUntil){heart.visible=false;player.tail.rotation.z=player.head.rotation.z=player.arms[1].rotation.z=0;}
    }
    let waving=false;
    for(const r of remotes.values())if(r.waveUntil>now){waving=true;r.figure.arms[1].rotation.z=reduced.matches?1.8:2.25+Math.sin(now/125)*.29;}else r.figure.arms[1].rotation.z=0;
    if(growingTree){
      const t=reduced.matches?1:clamp((now-growthStarted)/1200,0,1);
      growingTree.scale.setScalar(.12+.88*T.MathUtils.smoothstep(t,0,1));
      if(t===1)growingTree=null;
    }
    const hugging=animateHug(now);draw();
    if(moving||focusing||turning!==null||heart.visible||waving||hugging||growingTree)frame=requestAnimationFrame(loop);else prior=0;
  }
  function startLoop(){if(!frame)frame=requestAnimationFrame(loop);}
  function pet(){
    bondUntil=performance.now()+1100;heart.visible=true;status.textContent=options.pet==='cat'?'Your cat leans into your hand.':'Your dog gives a little tail wag.';
    startLoop();
  }
  function visitPlace(key){
    if(key==='bobby')key='memories';const p=places.find(s=>s.key===key);if(!p)return;
    viewTarget=null;focused=key;publicWall.visible=key==='memories';
    if(publicWall.visible){const state={};send('garden:query-community',state);refreshPublicWall({detail:state});}
    for(const [at,row] of stationObjects)row.visible=at===key;focusGoal=1;goalX=p.x;goalZ=p.z+.32;zoom=1;
    turning=Math.round((angle-initialAngle)/TAU)*TAU+initialAngle;
    walkTo(p.x+(key==='memories'?1.72:1.67),p.z+(key==='memories'?.82:.88));
    walkMarker.visible=false;startLoop();
  }
  document.addEventListener('garden:visit',e=>visitPlace(e.detail?.key));
  document.addEventListener('garden:home',()=>{leaveBench();viewTarget=null;focused=null;publicWall.visible=false;for(const row of stationObjects.values())row.visible=false;focusGoal=goalX=goalZ=0;zoom=1;status.textContent='Tap a path to walk with your pet. Drag to look around.';startLoop();});
  document.addEventListener('garden:pet',pet);
  document.addEventListener('garden:avatar',e=>{
    if(JSON.stringify(companionOptions(e.detail))===JSON.stringify(options))return;
    leaveBench();options=companionOptions(e.detail);const before=player;player=person(scene,options);
    player.g.position.copy(before.g.position);player.g.rotation.copy(before.g.rotation);player.g.scale.copy(before.g.scale);scene.remove(before.g);discard(before.g);draw();
  });
  document.addEventListener('garden:visitors',e=>{
    const list=Array.isArray(e.detail?.visitors)?e.detail.visitors:[],ids=new Set();
    for(const v of list.slice(0,24)){
      if(!v?.id||!Number.isFinite(v.x)||!Number.isFinite(v.z))continue;
      const id=String(v.id),config=companionOptions(v),key=JSON.stringify(config);ids.add(id);
      let r=remotes.get(id);
      if(!r||r.key!==key){if(r){scene.remove(r.figure.g);discard(r.figure.g);}
        r={key,figure:person(scene,config),waveUntil:0,lastWave:null};r.figure.g.scale.setScalar(1.12);r.figure.g.userData.action='visitor';r.figure.g.userData.value=id;remotes.set(id,r);}
      r.figure.g.position.set(clamp(v.x,-9,9),.055,clamp(v.z,-9,9));
      if(v.wave&&v.wave!==r.lastWave)r.waveUntil=performance.now()+1200;
      r.lastWave=v.wave;
    }
    for(const [id,r] of remotes)if(!ids.has(id)){scene.remove(r.figure.g);discard(r.figure.g);remotes.delete(id);}
    startLoop();
  });
  const gifts=group(scene,0,0,1.25);
  for(const [index,key] of ['flower','candle','treat','toy'].entries()){
    const x=(index-1.5)*.60,stand=group(gifts,x,0,0);cyl(stand,0,.22,0,.28,.31,.14,0xe0bb9e,18);
    gift(stand,key,0,0,.76);stand.userData.action='gift';stand.userData.value=key;
  }
  const plots=group(landmarks.get('trees'),-.65,.18,1);
  cyl(plots,0,.08,0,.36,.35,.14,0x9b775d,20);
  stroke(plots,0,.13,0,0,.40,0,.033,leaf);orb(plots,-.09,.30,.006,.14,.064,.077,leaf).rotation.z=-.4;
  plots.userData.action='plant';
  function activate(hit){
    let target=hit?.object;while(target&&!target.userData.action)target=target.parent;
    if(!target)return false;
    const {action,value}=target.userData;
    if(action==='object'){
      if(focused!==value.key)pinFor(value.key)?.click();
      else send('garden:object',value);
    }else if(action==='public-cabinet')send('garden:public-cabinets',{id:value});
    else if(action==='public-gift')send('garden:public-gift',value);
    else if(action==='new-memory')send('garden:new-memory',{});
    else if(action==='memory')send('garden:select-memory',{id:value});
    else if(action==='gift'){
      if(focused!=='memories'){pinFor('memories')?.click();return true;}
      send('garden:gift',{id:selectedMemory?.id,gift:value});
    }else if(action==='plant'){
      if(focused!=='trees')pinFor('trees')?.click();
      else send('garden:object',{key:'trees',action:'plant'});
    }else if(action==='court')send('garden:meet',{});
    else if(action==='visitor')send('garden:wave-to',{id:value});
    else if(action==='pet')pet();
    else pinFor(value)?.click();
    return true;
  }
  const pointers=new Map();
  let gesture=null;
  const span=()=>{const [a,b]=pointers.values();return Math.hypot(a.x-b.x,a.y-b.y);};
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0||pointers.size>=2)return;
    turning=null;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2)gesture={pinch:true,start:Math.max(1,span()),zoom};
    else gesture={x:e.clientX,y:e.clientY,angle};
    canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});
  });
  canvas.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId)||!gesture)return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(gesture.pinch){if(pointers.size===2)changeZoom(gesture.zoom*span()/gesture.start);return;}
    if(Math.abs(e.clientX-gesture.x)>5){angle=gesture.angle+(gesture.x-e.clientX)*.009;draw();}
  });
  canvas.addEventListener('wheel',e=>{
    if(e.ctrlKey||e.metaKey)return;
    e.preventDefault();
    const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?host.clientHeight:1);
    changeZoom(zoom*Math.exp(-clamp(delta,-300,300)*.0022));
  },{passive:false});
  canvas.addEventListener('pointerup',e=>{
    if(!pointers.has(e.pointerId)||!gesture||gesture.pinch||Math.hypot(gesture.x-e.clientX,gesture.y-e.clientY)>6)return;
    const r=canvas.getBoundingClientRect();
    ray.setFromCamera({x:2*(e.clientX-r.left)/r.width-1,y:1-2*(e.clientY-r.top)/r.height},camera);
    player.pet.userData.action='pet';
    const objects=[...picks,...clickableMemories,gifts,player.pet,...[...remotes.values()].map(v=>v.figure.g)];
    const hit=ray.intersectObjects(objects,true).find(hit=>{for(let o=hit.object;o;o=o.parent)if(!o.visible)return false;return true;});if(activate(hit))return;
    if(ray.ray.intersectPlane(ground,refSize))walkTo(refSize.x,refSize.z);
  });
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{pointers.delete(e.pointerId);gesture=null;});
  canvas.addEventListener('keydown',e=>{
    const k=e.key.toLowerCase();
    if(!e.ctrlKey&&!e.metaKey&&['+','=','-','_'].includes(k)){e.preventDefault();changeZoom(zoom*(k==='+'||k==='='?1.25:.8));}
    else if(['w','a','s','d','arrowup','arrowdown','arrowright','arrowleft'].includes(k)){e.preventDefault();leaveBench();keys.add(k);route=[];walkMarker.visible=false;startLoop();}
    else if(k==='p'){e.preventDefault();pet();}
    else if(k==='enter'){e.preventDefault();const p=player.g.position,closest=places.reduce((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)<Math.hypot(b.x-p.x,b.z-p.z)?a:b);pinFor(closest.key)?.click();}
  });
  canvas.addEventListener('keyup',e=>{if(keys.delete(e.key.toLowerCase())&&!keys.size)stopWalk();});
  canvas.addEventListener('blur',()=>{if(keys.size){keys.clear();stopWalk();}});
  controls.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.zoom){changeZoom(zoom*(b.dataset.zoom==='1'?1.25:.8));}
    else if(b.hasAttribute('data-reset-map')){zoom=1;viewTarget=null;
      if(!focused){goalX=goalZ=focusGoal=0;mapRoot.querySelector('[data-meet-menu]').open=false;}
      turning=Math.round((angle-initialAngle)/TAU)*TAU+initialAngle;startLoop();}
    else if(b.dataset.turn){turning=angle+Number(b.dataset.turn)*PI/4;startLoop();}
  });
  new ResizeObserver(draw).observe(host);document.addEventListener('garden:changed',refreshMemories);
  document.addEventListener('garden-memory-change',refreshMemories);
  refreshMemories();publishPosition();
  const initial=buttons.find(b=>b.getAttribute('aria-current')==='location');if(initial)visitPlace(initial.dataset.place);
}

const map = document.querySelector('[data-world]');
const mapPins = document.querySelector('[data-garden-pins]');
const visit = document.querySelector('[data-visit]');
const visitTitle = document.getElementById('visit-title');
const visitBody = document.querySelector('[data-visit-body]');
const wall = document.querySelector('[data-wall]');
const back = visit.querySelector('[data-back]');
const mapRoot = map.closest('[data-garden-map]');
const stations = new Map();
let visiting = null;
const sceneTools = document.querySelector('[data-scene-tools]');
const objectMenu = sceneTools.querySelector('[data-object-menu]');
const objectOptions = sceneTools.querySelector('[data-object-options]');
const townBack = sceneTools.querySelector('[data-town-back]');
const placeActions = {
  circle: {ask:'Ask a private question', community:'Community conversations', lessons:'Open the care books'},
  profile: {profile:'Open my pet’s profile'},
  timeline: {log:'Record a change', records:'Add health records', history:'My records'},
  path: {path:'Choose a care path'},
  support: {sit:'Sit beside my companion',candle:'Light or put out a candle', letter:'Garden letters', stone:'Memory stones', guidance:'Find support'},
  trees: {plant:'Dedicate a garden tree', 'real-tree':'Dedicate a real tree'},
  memories: {cabinet:'Open a memory cabinet',visitors:'Visit shared cabinets'}
};
const sceneHints = {
  circle:'Tap the envelope to ask a question or the open book to read a care lesson.',
  profile:'Tap the portrait to open your pet’s profile.',
  timeline:'Tap the journal to record a change in your dog’s day.',
  path:'Tap the signpost to choose a care path for your dog.',
  support:'Tap the bench to sit with your companion, or the envelope to leave a letter.',
  trees:'Tap a sapling to plant a tree in your pet’s name.',
  memories:'Tap a portrait to visit a cabinet or the guest book to meet other pets.'
};
let sceneKey = null;
const stationLoads = new Map();
let actionVersion = 0;
function enterScene(key, trigger) {
  if (!placeActions[key] || !mapRoot.classList.contains('garden-map-ready')) { openPlace(key,trigger);return; }
  const pin = mapPins.querySelector(`[data-place="${key}"]`);
  if (visit.open) visit.close();
  sceneKey=key;mapRoot.dataset.exploring=key;
  for(const p of mapPins.querySelectorAll('[aria-current]'))p.removeAttribute('aria-current');
  pin.setAttribute('aria-current','location');
  sceneTools.querySelector('[data-scene-name]').textContent=pin.textContent.trim();
  objectMenu.open=false;sceneTools.hidden=false;
  document.querySelector('[data-avatar-menu]').open=false;
  objectOptions.replaceChildren(...Object.entries(placeActions[key]).map(([action,label])=>{
    const button=document.createElement('button');button.type='button';button.textContent=label;
    button.dataset.sceneAction=action;button.addEventListener('click',()=>sendGardenEvent('garden:object',{key,action}));return button;
  }));
  sendGardenEvent('garden:visit',{key});
  document.querySelector('[data-map-status]').textContent=sceneHints[key];
  if(trigger)townBack.focus({preventScroll:true});
}
function leaveScene() {
  ++actionVersion;sceneKey=null;delete mapRoot.dataset.exploring;sceneTools.hidden=true;objectMenu.open=false;
  const pin=mapPins.querySelector('[aria-current]');
  if(pin){pin.removeAttribute('aria-current');pin.focus({preventScroll:true});}
  sendGardenEvent('garden:home',{});
}
townBack.addEventListener('click',leaveScene);
document.addEventListener('garden:sitting',event=>{
  const button=objectOptions.querySelector('[data-scene-action="sit"]');
  if(button){button.setAttribute('aria-pressed',String(event.detail.active));button.textContent=event.detail.active?'Stand up':'Sit beside my companion';}
});
const objectTargets={
  ask:'[data-account-ask-form]',community:'[data-owner-circle]',lessons:'.station-topics',
  profile:'[data-account-form]',log:'[data-health-log-form]',records:'[data-health-record-form]',history:'.health-timeline-section',
  path:'.station-action',guidance:'[data-grief-stages]',stone:'.station-note',plant:'.station-note','real-tree':'[data-checkout-form]'
};
async function useSceneObject({key,action}={}) {
  if(!Object.hasOwn(placeActions[key]||{},action))return;
  objectMenu.open=false;
  if(sceneKey!==key)enterScene(key);
  if(key==='support'&&action==='sit'){sendGardenEvent('garden:sit',{});return;}
  if(key==='support'&&action==='candle'){
    const {tribute}=getGardenMemories();sendGardenEvent('garden:gift',{id:tribute.id,gift:'candle'});
    document.querySelector('[data-map-status]').textContent=pageStatus.textContent;return;
  }
  if(key==='support'&&['stone','letter'].includes(action)){
    sendGardenEvent('garden:public-keepsakes',{kind:action});return;
  }
  openPlace(key);
  const version=++actionVersion;
  if(key==='memories'){
    if(action==='visitors')sendGardenEvent('garden:public-cabinets',{});
    return;
  }
  await stationLoads.get(key);
  if(version!==actionVersion || visiting!==key || !visit.open)return;
  const host=stations.get(key);
  let target=host?.querySelector(objectTargets[action]);
  if(target?.closest('[hidden]'))target=host.querySelector('[data-health-account-gate]:not([hidden]),[data-account-current]:not([hidden])')||target;
  if(!target)return;
  // Keep the chosen activity together with its label, response, and controls.
  const activity=target.closest('.station-fold,[data-health-account-gate]') || (['community','history','plant','guidance'].includes(action)?target:null);
  if(activity){
    for(const sibling of activity.parentElement.children){
      if(sibling!==activity)sibling.setAttribute('data-scene-secondary','');
    }
  }
  visitTitle.textContent=action==='guidance'?mapPins.querySelector('[data-place="support"]').textContent.trim():placeActions[key][action];
  for(let node=target;node&&node!==host;node=node.parentElement){if(node.tagName==='DETAILS')node.open=true;}
  const control=target.matches('button,input,textarea,select,summary')?target:target.querySelector('input:not([type="hidden"]),textarea,select,summary,button,a[href]');
  const focus=control?.getClientRects().length?control:target;
  if(!focus.matches('input,textarea,select,summary,button,a[href]'))focus.tabIndex=-1;
  if(action==='ask'||action==='community'){
    visitTitle.tabIndex=-1;visitTitle.focus({preventScroll:true});host.scrollTop=0;
  }else{
    focus.focus({preventScroll:true});host.scrollTop+=target.getBoundingClientRect().top-host.getBoundingClientRect().top-10;
  }
}
document.addEventListener('garden:object',event=>useSceneObject(event.detail));


function sendGardenEvent(type,detail) {
  document.dispatchEvent(new CustomEvent(type,{detail}));
}
function closeVisit() { if (visit.open) visit.close(); }
function fetchStation(key,host) {
  if (key==='bobby') {
    const card = document.createElement('article');
    card.className = 'garden-family-letter';
    const image = document.createElement('img');
    image.src = '/team-review/assets/bobby-happy-real.webp';
    image.alt = 'Bobby looking up at Rob';
    const quote = document.createElement('blockquote');
    quote.textContent = '“The photographs I keep are simple ones. Bobby smiling at home. Asleep on the cool floor. Beside me on a day out. They are not big milestones. They are our life together.”';
    const signature = document.createElement('p');
    signature.textContent = 'Rob, Bobby’s dad';
    card.append(image,quote,signature);
    host.replaceChildren(card);
    return;
  }
  host.setAttribute('aria-busy','true');
  host.textContent = 'Opening…';
  const loading=import(document.querySelector('#garden-stations-module').href)
    .then(module=>module.mountStation(key,host,{openPlace,closeVisit}))
    .catch(()=>{
      host.replaceChildren();
      const retry = document.createElement('button');
      retry.type='button';
      retry.textContent='Try opening this place again';
      retry.onclick=()=>fetchStation(key,host);
      host.append(retry);
    })
    .finally(()=>host.removeAttribute('aria-busy'));
  stationLoads.set(key,loading);
}
function openPlace(key,trigger,landmark=key) {
  const pin = [...mapPins.querySelectorAll('[data-place]')].find(item=>item.dataset.place===key);
  if (!pin && key!=='bobby') return;
  for(const node of visitBody.querySelectorAll('[data-scene-secondary]'))node.removeAttribute('data-scene-secondary');
  const active = [...mapPins.querySelectorAll('[data-place]')].find(item=>item.dataset.place===landmark) || pin || mapPins.querySelector('[data-place="memories"]');
  for (const item of mapPins.querySelectorAll('[aria-current]')) item.removeAttribute('aria-current');
  active.setAttribute('aria-current','location');
  visiting = key;
  mapRoot.dataset.visiting = key;
  visitTitle.textContent = pin?.textContent.trim() || 'Rob’s memory of Bobby';
  wall.hidden = key!=='memories';
  for (const [station,host] of stations) host.hidden = station!==key;
  if (wall.hidden && !stations.has(key)) {
    const host = document.createElement('section');
    host.className='garden-station';
    host.dataset.station=key;
    visitBody.append(host);
    stations.set(key,host);
    fetchStation(key,host);
  }
  if (!visit.open) visit.show();
  const returnLabel=key==='bobby'?'Return to Memory Wall':sceneKey?'Return to '+sceneTools.querySelector('[data-scene-name]').textContent:'Return to garden';
  back.setAttribute('aria-label',returnLabel);back.title=returnLabel;
  document.querySelector('[data-avatar-menu]').open = false;
  visitBody.scrollTop=0;
  sendGardenEvent('garden:visit',{key:landmark==='bobby'?'memories':landmark});
  if (trigger) back.focus({preventScroll:true});
}
mapPins.addEventListener('click',event=>{
  const pin=event.target.closest('[data-place]');
  if (!pin || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  enterScene(pin.dataset.place,pin);
});
wall.addEventListener('click',event=>{
  if(event.target.closest('[data-visit-family-wall]')){sendGardenEvent('garden:public-cabinets',{});return;}
  const link=event.target.closest('[data-bobby-story]');
  if (link && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
    event.preventDefault();openPlace('bobby',link);
  }
});
document.addEventListener('garden:open',event=>openPlace(event.detail?.key,null,event.detail?.landmark));
back.addEventListener('click',()=>visiting==='bobby'?openPlace('memories',back):closeVisit());
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||document.querySelector('dialog:modal'))return;
  if(visit.open)closeVisit();else if(objectMenu.open)objectMenu.open=false;else if(sceneKey)leaveScene();
});
visit.addEventListener('close',()=>{
  if (visit.open) return;
  delete mapRoot.dataset.visiting;
  visiting=null;
  ++actionVersion;
  if(sceneKey){const pin=mapPins.querySelector(`[data-place="${sceneKey}"]`);enterScene(sceneKey,pin);}
  else leaveScene();
});
function openDestination(key) {
  mapRoot.scrollIntoView({block:'center',behavior:'instant'});
  if(key==='stone'||key==='letter'){useSceneObject({key:'support',action:key});return;}
  if(key==='plant'){useSceneObject({key:'trees',action:'plant'});return;}
  if(key==='memories'){useSceneObject({key:'memories',action:'visitors'});return;}
  const showCourt=()=>{
    leaveScene();
    if(!mapRoot.classList.contains('garden-map-ready')){
      document.querySelector('[data-map-status]').textContent='Enable 3D graphics in your browser to visit Lantern Court.';
      return;
    }
    sendGardenEvent('garden:meet',{});
    document.querySelector('[data-meet-menu] summary').focus({preventScroll:true});
  };
  if(visit.open){visit.addEventListener('close',showCourt,{once:true});visit.close();}else showCourt();
}
const shortcuts=document.querySelector('.garden-destinations');
shortcuts.addEventListener('click',e=>{
  const link=e.target.closest('[data-garden-shortcut]');
  if(!link||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  e.preventDefault();openDestination(link.dataset.gardenShortcut);
});
function openLinkedPlace() {
  const shortcut=[...shortcuts.querySelectorAll('a')].find(link=>link.hash===location.hash);
  if(shortcut){openDestination(shortcut.dataset.gardenShortcut);return;}
  const params = new URLSearchParams(location.hash.slice(1));
  const pet = params.get('pet')?.trim(), memory = params.get('memory')?.trim();
  shared.hidden = true;
  if (pet && memory && pet.length<=55 && memory.length<=800) {
    shared.querySelector('h3').textContent = pet;
    shared.querySelector('p').textContent = memory;
    const kept = tributes.some(item => item.pet===pet && item.memory===memory);
    keep.disabled = kept;
    keep.textContent = kept?'Saved to your garden':'Keep in my garden';
    shared.hidden = false;
    openPlace('memories');
  } else if (location.hash==='#tributes') openPlace('memories');
  else if (location.hash.startsWith('#garden-')) {
    const key = location.hash.slice(8);
    if ([...mapPins.querySelectorAll('[data-place]')].some(item => item.dataset.place===key)) enterScene(key);
  }
}
window.addEventListener('hashchange',openLinkedPlace);

const storageKey = 'woafypet-garden-tributes-v1';
const memoryList = document.querySelector('[data-memory-list]');
const shared = memoryList.querySelector('[data-shared]');
const keep = shared.querySelector('[data-keep]');
const shareLink = document.querySelector('[data-share-link]');
const dialog = document.querySelector('[data-tribute-dialog]');
const form = dialog.querySelector('form');
const formStatus = form.querySelector('[data-form-status]');
const pageStatus = document.querySelector('[data-tribute-status]');
const create = document.querySelector('[data-create-tribute]');
const heading = document.getElementById('tribute-heading');
const removePhoto = dialog.querySelector('[data-remove-photo]');
const picker = memoryList.querySelector('[data-cabinet-picker]');
const cabinet = memoryList.querySelector('.pet-cabinet');
const giftNames = {
  flower:['🌷','Flowers'], candle:['🕯️','Candle'], treat:['🦴','Treat'], toy:['🧸','Toy'],
};
const bobby = {id:'bobby',pet:'Bobby',memory:'The dog who inspired WoafyPet.',photo:'/team-review/assets/bobby-happy-real.webp'};
let editing = null, returnFocus = null, tributes = [], bobbyOfferings = {}, selectedId = 'bobby';

function loadCabinets() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    tributes = Array.isArray(saved) ? saved.filter(item => item && typeof item.id==='string' && item.id!=='bobby' && typeof item.pet==='string' && typeof item.memory==='string') : [];
    bobbyOfferings = JSON.parse(localStorage.getItem(storageKey+'-bobby') || '{}') || {};
    selectedId = localStorage.getItem(storageKey+'-cabinet') || 'bobby';
  } catch {
    pageStatus.textContent = 'Saved cabinets could not be read in this browser.';
  }
}
function getGardenMemories() {
  const familyMemory = {
    ...bobby, candle:Boolean(bobbyOfferings.candle), gifts:bobbyOfferings.gifts || {},
    tree:bobbyOfferings.tree || '', stone:bobbyOfferings.stone || '',
  };
  const all = [familyMemory,...tributes];
  return {tribute:all.find(item=>item.id===selectedId) || familyMemory,tributes:all};
}
function selectCabinet(id) {
  selectedId = id;
  try { localStorage.setItem(storageKey+'-cabinet',id); } catch {}
  shareLink.hidden = true;
  renderTributes();
}
function save(next, id=selectedId) {
  try {
    localStorage.setItem(storageKey,JSON.stringify(next));
  } catch { return false; }
  tributes = next;
  selectCabinet(id);
  return true;
}
function changeOffering(id, changes) {
  if (id!=='bobby') {
    if (!tributes.some(item=>item.id===id)) return false;
    return save(tributes.map(item=>item.id===id?{...item,...changes}:item),id);
  }
  const next = {...bobbyOfferings,...changes};
  try { localStorage.setItem(storageKey+'-bobby',JSON.stringify(next)); } catch { return false; }
  bobbyOfferings = next;
  selectCabinet(id);
  return true;
}
function cardButton(text, action) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  button.dataset.memoryAction = action;
  return button;
}
function datesFor(tribute) {
  function display(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '';
    const date = new Date(value+'T12:00:00');
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  }
  const from = display(tribute.fromDate), until = display(tribute.toDate);
  return from && until ? from+' – '+until : from ? 'Together since '+from : until ? 'Together until '+until : '';
}
function renderTributes() {
  const state = getGardenMemories(), tribute = state.tribute;
  picker.hidden = state.tributes.length===1;
  picker.querySelector('select').replaceChildren(...state.tributes.map(entry=>new Option(entry.pet,entry.id,false,entry.id===tribute.id)));
  cabinet.dataset.memoryId = tribute.id;
  const img = cabinet.querySelector('[data-portrait]'), initial = cabinet.querySelector('[data-initial]');
  img.hidden = !tribute.photo;
  if (tribute.photo) {
    if (img.getAttribute('src')!==tribute.photo) img.src = tribute.photo;
    img.alt = 'Portrait of '+tribute.pet;
  } else img.removeAttribute('src');
  initial.hidden = Boolean(tribute.photo);
  initial.textContent = [...tribute.pet][0] || '♡';
  cabinet.querySelector('[data-pet-name]').textContent = tribute.pet;
  cabinet.querySelector('[data-words]').textContent = tribute.memory;
  const dates = cabinet.querySelector('[data-dates]');
  dates.textContent = datesFor(tribute);
  dates.hidden = !dates.textContent;
  cabinet.querySelector('[data-bobby-story]').hidden = tribute.id!=='bobby';
  const gifts = Object.entries(giftNames).map(([key,[symbol,label]])=>{
    const button = cardButton(label,key), icon = document.createElement('span');
    icon.setAttribute('aria-hidden','true'); icon.textContent = symbol; button.prepend(icon);
    const placed = key==='candle'?tribute.candle:tribute.gifts?.[key];
    button.setAttribute('aria-pressed',String(Boolean(placed)));
    button.title = placed ? 'Remove '+label.toLowerCase() : 'Leave '+label.toLowerCase();
    return button;
  });
  cabinet.querySelector('[data-gifts]').replaceChildren(...gifts);
  const tree = cabinet.querySelector('[data-plant-tree]'), stone = cabinet.querySelector('[data-private-stone]');
  tree.elements.tree.value = tribute.tree || tribute.pet;
  tree.querySelector('button').textContent = tribute.tree?'Update tree':'Plant tree';
  stone.hidden = !tribute.stone;
  stone.textContent = tribute.stone ? 'Your private stone · '+tribute.stone : '';
  const tools = [cardButton('Share words','share'),cardButton('Download keepsake','download')];
  if (tribute.id!=='bobby') tools.push(cardButton('Edit','edit'),cardButton('Remove','remove'));
  cabinet.querySelector('[data-cabinet-tools]').replaceChildren(...tools);
  document.dispatchEvent(new CustomEvent('garden:changed',{detail:state}));
  document.dispatchEvent(new Event('garden-memory-change'));
}
function toggleGift(tribute, gift) {
  if (!giftNames[gift]) return;
  const placed = gift==='candle'?Boolean(tribute.candle):Boolean(tribute.gifts?.[gift]);
  const update = gift==='candle'?{candle:!placed}:{gifts:{...tribute.gifts,[gift]:!placed}};
  if (!changeOffering(tribute.id,update)) {
    pageStatus.textContent = 'This browser could not save your gift.';
    return;
  }
  const actions = {candle:'A candle is glowing',flower:'Fresh flowers are waiting',treat:'A treat is waiting',toy:'A toy is waiting'};
  pageStatus.textContent = placed?'Gift removed.':actions[gift]+' for '+tribute.pet+'.';
  cabinet.querySelector('[data-memory-action="'+gift+'"]').focus({preventScroll:true});
}
function dedicate(tribute, key, value, newCompanion=false) {
  const text = typeof value==='string'?value.trim():'';
  if (!text || text.length>(key==='tree'?55:120)) return;
  const ok = newCompanion
    ? save([...tributes,{...tribute,tree:text}],tribute.id)
    : changeOffering(tribute.id,{[key]:text});
  pageStatus.textContent = !ok?'This browser could not save the dedication.':key==='tree'?'Planted a virtual tree for '+text+'.':'Your words are on '+tribute.pet+'’s garden stone.';
  if(ok && key==='tree' && mapRoot.classList.contains('garden-map-ready')){
    const reveal=()=>{enterScene('trees');sendGardenEvent('garden:tree-grown',{id:tribute.id,name:text});townBack.focus({preventScroll:true});};
    if(visit.open){visit.addEventListener('close',reveal,{once:true});closeVisit();}else reveal();
  }
  return ok;
}
picker.querySelector('select').addEventListener('change',event=>{
  selectCabinet(event.target.value);
  pageStatus.textContent = '';
});
keep.addEventListener('click',()=>{
  const pet=shared.querySelector('h3').textContent, memory=shared.querySelector('p').textContent;
  const found=tributes.find(item=>item.pet===pet && item.memory===memory);
  const tribute=found || {id:crypto.randomUUID(),pet,memory,photo:'',candle:false};
  if (found || save([...tributes,tribute],tribute.id)) {
    if (found) selectCabinet(found.id);
    shared.hidden=true;
    pageStatus.textContent='Memory saved in your garden.';
  } else pageStatus.textContent='This browser could not save the memory.';
});
function openTribute(tribute, trigger, pet='') {
  editing=tribute;
  returnFocus=trigger;
  form.reset();
  formStatus.textContent='';
  removePhoto.hidden=!tribute?.photo;
  heading.textContent=tribute?'Edit their cabinet':'Make a memory cabinet';
  form.elements.pet.value=tribute?.pet || pet;
  form.elements.memory.value=tribute?.memory || '';
  form.elements.fromDate.value=tribute?.fromDate || '';
  form.elements.toDate.value=tribute?.toDate || '';
  if (!dialog.open) dialog.showModal();
  form.elements.pet.focus();
}
function readPhoto(file) {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG or WebP photo.');
  return createImageBitmap(file).then(bitmap => {
    const ratio = Math.min(1,900/Math.max(bitmap.width,bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1,Math.round(bitmap.width*ratio));
    canvas.height = Math.max(1,Math.round(bitmap.height*ratio));
    const paint = canvas.getContext('2d',{alpha:false});
    paint.fillStyle = '#fbf6ef';
    paint.fillRect(0,0,canvas.width,canvas.height);
    paint.drawImage(bitmap,0,0,canvas.width,canvas.height);
    bitmap.close();
    return canvas.toDataURL('image/jpeg',.84);
  },() => { throw new Error('This photo could not be opened. Choose another image.'); });
}
create.hidden = false;
document.querySelector('[data-tribute-hint]').hidden = false;
create.addEventListener('click', () => openTribute(null,create));
dialog.querySelector('[data-close-tribute]').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => { (returnFocus?.isConnected?returnFocus:create).focus({preventScroll:true}); });
form.addEventListener('submit', async event => {
  event.preventDefault();
  const fields = form.elements;
  const pet = fields.pet.value.trim(), memory = fields.memory.value.trim();
  if (!pet || !memory) {
    formStatus.textContent = 'Enter their name and a memory.';
    return;
  }
  const fromDate=fields.fromDate.value, toDate=fields.toDate.value;
  if (fromDate && toDate && fromDate>toDate) {
    formStatus.textContent='Choose an end date on or after the start date.';
    fields.toDate.focus(); return;
  }
  const submit = form.querySelector('[type=submit]');
  submit.disabled = true;
  try {
    let photo = fields.removePhoto.checked?'':editing?.photo || '';
    if (fields.photo.files.length) photo = await readPhoto(fields.photo.files[0]);
    const tribute = {...editing,id:editing?.id || crypto.randomUUID(),pet,memory,photo,fromDate,toDate,candle:editing?.candle || false};
    const next = editing?tributes.map(item => item.id===tribute.id?tribute:item):[...tributes,tribute];
    if (!save(next,tribute.id)) throw new Error('This browser could not save the tribute. Try a smaller photo or save just the words.');
    pageStatus.textContent = 'Tribute saved in this browser.';
    returnFocus = cabinet.querySelector('[data-memory-action="edit"]');
    dialog.close();
  } catch (error) {
    formStatus.textContent = error.message;
  } finally {
    submit.disabled = false;
  }
});
async function downloadCabinet(tribute) {
  const keepsake=document.implementation.createHTMLDocument('In memory of '+tribute.pet);
  const charset=keepsake.createElement('meta'), viewport=keepsake.createElement('meta');
  charset.charset='utf-8'; viewport.name='viewport'; viewport.content='width=device-width,initial-scale=1';
  const style=keepsake.createElement('style');
  style.textContent='body{box-sizing:border-box;margin:5vh auto;padding:clamp(20px,6vw,54px);max-width:42rem;background:#faf4e6;color:#3c4437;font:1.1rem/1.65 Georgia,serif;text-align:center}main{padding:1rem;border-block:1px solid #bcab92}h1{margin:.25rem 0;font-size:clamp(2rem,8vw,3rem)}p{white-space:pre-wrap;overflow-wrap:anywhere}img{display:block;max-width:100%;max-height:48vh;margin:1rem auto;border-radius:14px}small{color:#765d48}';
  keepsake.head.prepend(charset,viewport,style);
  const main=keepsake.createElement('main');
  function add(tag,text) {
    const node=keepsake.createElement(tag);
    node.textContent=text; main.append(node);
  }
  add('small','WoafyPet Memorial Garden');
  add('h1',tribute.pet);
  if (datesFor(tribute)) add('small',datesFor(tribute));
  let photo=tribute.photo;
  if (tribute.id==='bobby') {
    const response=await fetch(bobby.photo);
    if (!response.ok) throw new Error('The portrait could not be downloaded.');
    const blob=await response.blob();
    photo=await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(reader.result); reader.onerror=()=>reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
  if (/^data:image\/(?:jpeg|png|webp);base64,/.test(photo || '')) {
    const image=keepsake.createElement('img'); image.src=photo; image.alt=tribute.pet; main.append(image);
  }
  add('p',tribute.memory);
  if (tribute.tree) add('p','Their garden tree · '+tribute.tree);
  if (tribute.stone) add('p','On their stone · '+tribute.stone);
  const gifts=Object.entries(giftNames).filter(([key])=>key==='candle'?tribute.candle:tribute.gifts?.[key]);
  if (gifts.length) add('small',gifts.map(([,value])=>value.join(' ')).join('  ·  '));
  keepsake.body.append(main);
  const blob=new Blob(['<!doctype html>'+keepsake.documentElement.outerHTML],{type:'text/html;charset=utf-8'});
  const link=document.createElement('a');
  link.href=URL.createObjectURL(blob);
  link.download=(tribute.pet.replace(/[\\/:*?"<>|]/g,'').trim() || 'My pet')+' — memory.html';
  link.click(); setTimeout(()=>URL.revokeObjectURL(link.href),1000);
}
memoryList.addEventListener('click', async event => {
  const button = event.target.closest('[data-memory-action]');
  if (!button) return;
  const id = button.closest('[data-memory-id]').dataset.memoryId;
  const tribute = getGardenMemories().tributes.find(item=>item.id===id);
  if (!tribute) return;
  const action = button.dataset.memoryAction;
  if (Object.hasOwn(giftNames,action)) { toggleGift(tribute,action); return; }
  switch (action) {
    case 'share': {
      const url = new URL(location.pathname,location.origin);
      url.hash = new URLSearchParams({pet:tribute.pet,memory:tribute.memory}).toString();
      const input = shareLink.querySelector('input');
      input.value = url.href;
      shareLink.hidden = false;
      try {
        await navigator.clipboard.writeText(url.href);
        pageStatus.textContent = ['localhost','127.0.0.1','[::1]'].includes(location.hostname)
          ? 'Local preview link copied. Use Download keepsake to share outside this computer.'
          : 'Memory link copied. Anyone with the link can read their name and your words.';
      } catch {
        input.focus();
        input.select();
        pageStatus.textContent = 'Copy the selected link to share their name and your words.';
      }
      break;
    }
    case 'download':
      try { await downloadCabinet(tribute); pageStatus.textContent='Your keepsake is ready to save.'; }
      catch { pageStatus.textContent='The keepsake could not be downloaded. Try again.'; }
      break;
    case 'edit':
      openTribute(tribute,button);
      break;
    case 'remove':
      if (!confirm('Remove this tribute from this browser?')) return;
      if (save(tributes.filter(item => item.id!==id),'bobby')) {
        pageStatus.textContent = 'Tribute removed from this browser.';
        create.focus();
      } else pageStatus.textContent = 'The tribute could not be removed.';
      break;
  }
});
cabinet.querySelector('[data-plant-tree]').addEventListener('submit',event=>{
  event.preventDefault();
  dedicate(getGardenMemories().tribute,'tree',event.target.elements.tree.value);
});
document.addEventListener('click',event=>{
  const link=event.target.closest('[data-read-keepsakes]');
  if(link)sendGardenEvent('garden:public-keepsakes',{kind:link.dataset.readKeepsakes});
});
document.addEventListener('garden:query-memories',event=>{
  if (event.detail) Object.assign(event.detail,getGardenMemories());
});
document.addEventListener('garden:select-memory',event=>{
  const id=event.detail?.id;
  if (!getGardenMemories().tributes.some(item=>item.id===id)) return;
  selectCabinet(id);
  pageStatus.textContent='';
  document.dispatchEvent(new CustomEvent('garden:open',{detail:{key:'memories'}}));
});
document.addEventListener('garden:new-memory',event=>{
  document.dispatchEvent(new CustomEvent('garden:open',{detail:{key:'memories'}}));
  openTribute(null,create,String(event.detail?.pet || '').slice(0,55));
});
for (const [type, key] of [['garden:plant','tree'],['garden:stone','stone'],['garden:gift','gift']]) {
  document.addEventListener(type,event=>{
    const data=event.detail || {}, state=getGardenMemories();
    const newCompanion=key==='tree'&&data.newCompanion===true&&!data.id;
    const tribute=newCompanion?{id:crypto.randomUUID(),pet:String(data.name||'').trim(),memory:''}
      :data.id?state.tributes.find(item=>item.id===data.id):state.tribute;
    if (!tribute) return;
    if (key==='gift') toggleGift(tribute,data.gift);
    else data.saved=dedicate(tribute,key,key==='tree'?data.name:data.text,newCompanion)===true;
  });
}
window.addEventListener('storage',event=>{
  if (event.key===storageKey || event.key===storageKey+'-bobby') {
    const localId=selectedId;
    loadCabinets(); selectedId=localId; renderTributes();
  }
});
loadCabinets();
renderTributes();
import('./vendor/three-r160.min.js').then(THREE => {
  buildWorld(map,THREE);
  if (visiting) sendGardenEvent('garden:visit',{key:visiting==='bobby'?'memories':visiting});
}).catch(() => {}).finally(openLinkedPlace);
