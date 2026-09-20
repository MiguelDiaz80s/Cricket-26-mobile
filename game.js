import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js";

const canvas = document.querySelector("#scene");
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07100d);
scene.fog = new THREE.FogExp2(0x07100d, 0.008);

const camera = new THREE.PerspectiveCamera(48, innerWidth/innerHeight, 0.1, 900);
camera.position.set(31, 18, 34);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = .055;
controls.enablePan = false;
controls.minDistance = 10;
controls.maxDistance = 105;
controls.maxPolarAngle = Math.PI * .48;
controls.target.set(0, 2, 0);

const hemi = new THREE.HemisphereLight(0xaac7ff, 0x10150f, 1.5);
scene.add(hemi);
const moon = new THREE.DirectionalLight(0xdbe7ff, 2.4);
moon.position.set(-45,70,30);
moon.castShadow = true;
moon.shadow.mapSize.set(1024,1024);
moon.shadow.camera.left=-70; moon.shadow.camera.right=70; moon.shadow.camera.top=70; moon.shadow.camera.bottom=-70;
scene.add(moon);

const stadium = new THREE.Group();
scene.add(stadium);

function mat(color, rough=.8, metal=0){
  return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
}
function box(w,h,d,material,x=0,y=0,z=0){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; return m;
}
function cyl(r,h,material,x=0,y=0,z=0,segments=32){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),material);
  m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; return m;
}

const grassCanvas=document.createElement("canvas");
grassCanvas.width=256; grassCanvas.height=256;
const gx=grassCanvas.getContext("2d");
gx.fillStyle="#244d2d"; gx.fillRect(0,0,256,256);
for(let i=0;i<9000;i++){
  gx.fillStyle=Math.random()>.52?"#2f6138":"#1e4328";
  gx.fillRect(Math.random()*256,Math.random()*256,1,Math.random()*3+1);
}
const grassTex=new THREE.CanvasTexture(grassCanvas);
grassTex.wrapS=grassTex.wrapT=THREE.RepeatWrapping;
grassTex.repeat.set(24,24);
const grassMat=new THREE.MeshStandardMaterial({map:grassTex,roughness:1});
const field=new THREE.Mesh(new THREE.CylinderGeometry(45,45,.35,96),grassMat);
field.scale.z=.82;
field.position.y=-.2;
field.receiveShadow=true;
stadium.add(field);

const outfieldRing=new THREE.Mesh(new THREE.RingGeometry(38,44.5,96),new THREE.MeshStandardMaterial({color:0x2b5b32,roughness:1}));
outfieldRing.rotation.x=-Math.PI/2;
outfieldRing.position.y=.02;
outfieldRing.scale.y=.82;
stadium.add(outfieldRing);

const pitchMat=mat(0xb89a68,1,0);
const pitch=new THREE.Mesh(new THREE.BoxGeometry(5.4,.16,34),pitchMat);
pitch.position.y=.04;
pitch.receiveShadow=true;
stadium.add(pitch);

const pitchDust=new THREE.Mesh(new THREE.BoxGeometry(4.65,.17,33),mat(0xa98a5b,1));
pitchDust.position.y=.13;
pitchDust.receiveShadow=true;
stadium.add(pitchDust);

const lineMat=new THREE.MeshStandardMaterial({color:0xf4eee0,roughness:.8});
function line(w,d,x,z){
  const l=box(w,.035,d,lineMat,x,.235,z); stadium.add(l); return l;
}
line(4.9,.07,0,-13.1); line(4.9,.07,0,13.1);
line(.07,5.8,-2.05,-11.0); line(.07,5.8,2.05,-11.0);
line(.07,5.8,-2.05,11.0); line(.07,5.8,2.05,11.0);

const wicketMat=mat(0xd9c18c,.7);
function wicket(z){
  const g=new THREE.Group();
  [-.34,0,.34].forEach(x=>g.add(cyl(.055,2.25,wicketMat,x,.95,z,12)));
  const b1=box(.8,.09,.12,wicketMat,0,2.08,z-.01);
  const b2=box(.8,.09,.12,wicketMat,0,2.17,z-.01);
  g.add(b1,b2); stadium.add(g);
}
wicket(-12.2); wicket(12.2);

const boundary=new THREE.Mesh(new THREE.TorusGeometry(43.5,.11,10,128),new THREE.MeshStandardMaterial({color:0xe6dfc7,roughness:.7}));
boundary.rotation.x=Math.PI/2; boundary.scale.y=.82; boundary.position.y=.2; stadium.add(boundary);

const standMat=mat(0x222b2b,.9);
const redSeat=mat(0x9a2429,.82);
for(let tier=0;tier<4;tier++){
  const r=49+tier*4.3;
  const rows=24;
  for(let i=0;i<rows;i++){
    const a=(i/rows)*Math.PI*2;
    const x=Math.cos(a)*r;
    const z=Math.sin(a)*r*.72;
    const s=box(9.5,1.25,3.4,standMat,x,2.5+tier*2.0,z);
    s.rotation.y=-a;
    stadium.add(s);
    const seats=box(8.5,.35,2.7,redSeat,x,3.25+tier*2.0,z);
    seats.rotation.y=-a; stadium.add(seats);
  }
}

const roofMat=new THREE.MeshStandardMaterial({color:0x151b1a,roughness:.65,metalness:.15,side:THREE.DoubleSide,transparent:true,opacity:.9});
for(let i=0;i<24;i++){
  const a=(i/24)*Math.PI*2;
  const r=59;
  const roof=new THREE.Mesh(new THREE.CylinderGeometry(16,16,.7,16,1,false,0,Math.PI/1.7),roofMat);
  roof.position.set(Math.cos(a)*r,18,Math.sin(a)*r*.72);
  roof.rotation.y=-a+Math.PI/2;
  roof.rotation.x=.15;
  roof.scale.set(1.5,.5,2.7);
  stadium.add(roof);
}

const crowdGroup=new THREE.Group();
const crowdMat=new THREE.MeshStandardMaterial({color:0xc4c9c5,roughness:1});
const crowdDark=mat(0x58625d,1);
for(let i=0;i<1500;i++){
  const a=Math.random()*Math.PI*2;
  const r=50+Math.random()*12;
  const y=3+Math.floor(Math.random()*4)*2+Math.random()*.8;
  const p=new THREE.Mesh(new THREE.SphereGeometry(.13+Math.random()*.08,6,5),Math.random()>.72?crowdDark:crowdMat);
  p.position.set(Math.cos(a)*r,y,Math.sin(a)*r*.72);
  crowdGroup.add(p);
}
stadium.add(crowdGroup);

function floodlight(x,z){
  const g=new THREE.Group();
  g.position.set(x,0,z);
  const pole=cyl(.28,24,mat(0x343a38,.5,.5),0,12,0,16); g.add(pole);
  const head=box(5.4,2.8,.55,mat(0x202625,.4,.55),0,24.5,0); g.add(head);
  for(let i=0;i<8;i++){
    const bulb= new THREE.Mesh(new THREE.BoxGeometry(.48,.5,.12),new THREE.MeshStandardMaterial({color:0xffffe0,emissive:0xfff4bd,emissiveIntensity:7}));
    bulb.position.set(-1.9+(i%4)*1.27,24.5+(i>3?.7:-.7),-.35);
    g.add(bulb);
  }
  const light=new THREE.SpotLight(0xfff5d6,150,80,Math.PI/4,.55,1.2);
  light.position.set(0,23.8,0); light.target.position.set(0,0,0); g.add(light,light.target);
  stadium.add(g);
}
[[-47,-35],[47,-35],[-47,35],[47,35]].forEach(([x,z])=>floodlight(x,z));

function createPlayer({team=0,role="fielder",x=0,z=0,scale=1}={}){
  const g=new THREE.Group();
  g.position.set(x,.18,z); g.scale.setScalar(scale);
  const shirt=team===0?mat(0x1e2633,.72):mat(0xd9dfe0,.75);
  const trousers=team===0?mat(0x17202c,.78):mat(0xf0f0e8,.8);
  const skin=mat(0x9b6849,.82);
  const shoe=mat(0x141719,.55,.15);
  const helmetMat=mat(team===0?0x17273d:0xeeeeea,.6,.2);

  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.48,.95,5,10),shirt);
  torso.position.y=1.15; torso.castShadow=true; g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.32,16,12),skin);
  head.position.y=2.05; head.castShadow=true; g.add(head);
  const helmet=new THREE.Mesh(new THREE.SphereGeometry(.39,16,10,0,Math.PI*2,0,Math.PI*.58),helmetMat);
  helmet.position.y=2.12; helmet.castShadow=true; g.add(helmet);
  const leg1=cyl(.18,.9,trousers,-.22,.48,0,12), leg2=cyl(.18,.9,trousers,.22,.48,0,12);
  g.add(leg1,leg2);
  g.add(box(.3,.12,.55,shoe,-.22,.04,-.12),box(.3,.12,.55,shoe,.22,.04,-.12));

  if(role==="batter"){
    const pad=mat(0xe8e5d8,.7);
    g.add(box(.22,.72,.22,pad,-.22,.58,-.12),box(.22,.72,.22,pad,.22,.58,-.12));
    const bat=new THREE.Mesh(new THREE.BoxGeometry(.16,1.55,.07),mat(0xd5b06d,.65));
    bat.position.set(.58,1.05,-.35); bat.rotation.z=-.22; bat.rotation.x=.1; bat.castShadow=true; g.add(bat);
    const handle=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.5,10),mat(0x4d3020,.8));
    handle.position.set(.68,1.8,-.35); handle.rotation.z=-.22; g.add(handle);
    const guard=box(.55,.13,.05,mat(0xd5d7d2,.7),0,1.93,-.18); g.add(guard);
  }
  if(role==="keeper"){
    const glove=mat(0xf1f0df,.75);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),glove));
  }
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  stadium.add(g);
  return g;
}

const batter=createPlayer({team:0,role:"batter",x:.8,z:10.4,scale:1.12});
batter.rotation.y=Math.PI;
const keeper=createPlayer({team:1,role:"keeper",x:-.5,z:-13.9,scale:1.02});
keeper.rotation.y=0;

const bowler=createPlayer({team:1,role:"fielder",x:0,z:-20.5,scale:1.08});
bowler.rotation.y=0;

const fieldPositions=[[-16,-4],[17,-4],[-22,7],[22,8],[-18,22],[18,22],[-32,15],[31,15],[0,30],[0,-36]];
const fielders=fieldPositions.map(([x,z],i)=>createPlayer({team:1,role:"fielder",x,z,scale:.9}));

const ball=new THREE.Mesh(new THREE.SphereGeometry(.19,20,14),new THREE.MeshStandardMaterial({color:0x8e1017,roughness:.4}));
ball.position.set(0,.6,6.5); ball.castShadow=true; stadium.add(ball);

const ballSeam=new THREE.Mesh(new THREE.TorusGeometry(.13,.018,6,24),new THREE.MeshStandardMaterial({color:0xf0d8d0,roughness:.6}));
ball.add(ballSeam); ballSeam.rotation.x=Math.PI/2;

const cameras={
 broadcast:{pos:[27,11,28],target:[0,1.8,2]},
 batter:{pos:[5.8,4.2,17.8],target:[0,1.6,1]},
 bowler:{pos:[4.8,3.8,-25],target:[0,1.6,4]},
 wide:{pos:[62,28,67],target:[0,3,0]},
 cinematic:{pos:[-54,13,48],target:[0,4,0]}
};

let cameraMode="broadcast", cinematicTime=0, started=false;
function setCamera(name){
  cameraMode=name;
  document.querySelectorAll(".camera").forEach(b=>b.classList.toggle("active",b.dataset.camera===name));
  const c=cameras[name];
  camera.position.set(...c.pos);
  controls.target.set(...c.target);
  controls.update();
}
document.querySelectorAll(".camera").forEach(b=>b.addEventListener("click",()=>setCamera(b.dataset.camera)));

document.querySelector("#enterBtn").addEventListener("click",()=>{
  document.querySelector("#intro").classList.add("hidden");
  document.querySelector("#hint").classList.add("hide");
  started=true;
  setCamera("cinematic");
  setTimeout(()=>setCamera("broadcast"),4200);
});

let last=performance.now();
function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min((now-last)/1000,.05); last=now;
  controls.update();

  const t=now*.001;
  batter.position.y=.18+Math.sin(t*2)*.015;
  keeper.position.y=.18+Math.sin(t*2.5+.8)*.012;
  bowler.position.y=.18+Math.sin(t*1.8+.4)*.012;
  fielders.forEach((p,i)=>p.position.y=.18+Math.sin(t*1.5+i)*.008);

  crowdGroup.rotation.y=0.00035;
  ball.position.y=.62+Math.sin(t*2.4)*.025;
  ball.rotation.y+=dt*1.7;

  if(cameraMode==="cinematic" && started){
    cinematicTime+=dt;
    const a=cinematicTime*.16;
    camera.position.x=-45+Math.sin(a)*12;
    camera.position.z=45+Math.cos(a)*10;
    camera.position.y=12+Math.sin(a*1.7)*2;
    controls.target.lerp(new THREE.Vector3(0,3,0),.025);
  }

  renderer.render(scene,camera);
}
requestAnimationFrame(animate);

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
});