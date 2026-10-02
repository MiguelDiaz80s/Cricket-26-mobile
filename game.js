import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import {loadCricketWasm} from "./engine/wasm-bridge.js";

let wasmEngine=null;
let wasmPhysicsActive=false;
loadCricketWasm().then(engine=>{
  wasmEngine=engine;
  wasmPhysicsActive=false;
  if(engine)console.info("Cricket C++ aerodynamics online.");
});

const canvas=document.querySelector("#scene");
const isTabletDevice=/iPad|Tablet/i.test(navigator.userAgent) || (navigator.maxTouchPoints>1 && Math.max(window.innerWidth,window.innerHeight)>=700);
const isMobileDevice=window.innerWidth<900 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const renderer=new THREE.WebGLRenderer({canvas,antialias:!isMobileDevice||isTabletDevice,powerPreference:"high-performance",failIfMajorPerformanceCaveat:false});
const mobilePixelRatio=Math.min(devicePixelRatio||1,1);
const tabletPixelRatio=Math.min(devicePixelRatio||1.35,1.35);
renderer.setPixelRatio(isTabletDevice?tabletPixelRatio:(isMobileDevice?mobilePixelRatio:Math.min(devicePixelRatio||1,1.35)));
renderer.setSize(innerWidth,innerHeight,false);
renderer.shadowMap.enabled=window.innerWidth>=700;
renderer.shadowMap.type=isTabletDevice?THREE.PCFSoftShadowMap:(isMobileDevice?THREE.BasicShadowMap:THREE.PCFSoftShadowMap);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x07120f);
scene.fog=new THREE.FogExp2(0x07120f,.0068);

const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.1,1000);
camera.position.set(30,12,30);
camera.updateProjectionMatrix();

const countries={
 Australia:{flag:"🇦🇺",desc:"Green & Gold",a:"#0b6b3a",b:"#f5c400",c:"#ffffff"},
 India:{flag:"🇮🇳",desc:"Blue, Saffron & White",a:"#123b91",b:"#f28c28",c:"#ffffff"},
 England:{flag:"🏴",desc:"Navy, Red & White",a:"#102b55",b:"#d9272e",c:"#ffffff"},
 "South Africa":{flag:"🇿🇦",desc:"Green, Gold & Red",a:"#08783e",b:"#e4b82d",c:"#d83232"},
 "New Zealand":{flag:"🇳🇿",desc:"Black & Silver",a:"#111315",b:"#d4d8d6",c:"#ffffff"},
 Pakistan:{flag:"🇵🇰",desc:"Green & White",a:"#075b3d",b:"#f1f5ed",c:"#c9d9c7"},
 "West Indies":{flag:"🏝️",desc:"Maroon & Gold",a:"#6f1630",b:"#e7b93c",c:"#ffffff"},
 "Sri Lanka":{flag:"🇱🇰",desc:"Blue & Gold",a:"#0d3b76",b:"#e4b638",c:"#d88936"}
};
let selectedCountry="Australia";
let visualStyle="broadcast";
let theme=countries[selectedCountry];

function hex(h){return new THREE.Color(h)}
function material(c,r=.75,m=0){return new THREE.MeshStandardMaterial({color:hex(c),roughness:r,metalness:m})}
function meshBox(w,h,d,m,x=0,y=0,z=0){
 const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o;
}
function meshCyl(r,h,m,x=0,y=0,z=0,s=20){
 const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,s),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o;
}

const stadium=new THREE.Group();scene.add(stadium);
const accentObjects=[];
const playerShirts=[];
const playerTrim=[];

const hemi=new THREE.HemisphereLight(0xa9c8e5,0x11170f,1.25);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe7bd,3.0);
sun.position.set(-38,55,24);sun.castShadow=!isMobileDevice;sun.shadow.mapSize.set(isTabletDevice?512:(isMobileDevice?256:1024),isTabletDevice?512:(isMobileDevice?256:1024));
sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=65;sun.shadow.camera.bottom=-65;
scene.add(sun);

function canvasTexture(width,height,draw,repeatX=1,repeatY=1){
 const c=document.createElement("canvas");c.width=width;c.height=height;const x=c.getContext("2d");draw(x,width,height);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeatX,repeatY);t.anisotropy=isMobileDevice?Math.min(2,renderer.capabilities.getMaxAnisotropy()):renderer.capabilities.getMaxAnisotropy();return t;
}

const grassTexture=canvasTexture(512,512,(x,w,h)=>{
 x.fillStyle="#285c32";x.fillRect(0,0,w,h);
 for(let i=0;i<18000;i++){const v=28+Math.random()*30;x.fillStyle=`rgb(${20+v*.25},${65+v*.45},${28+v*.18})`;x.fillRect(Math.random()*w,Math.random()*h,.7,1+Math.random()*3)}
 for(let i=0;i<70;i++){x.strokeStyle="rgba(100,150,75,.12)";x.lineWidth=1;x.beginPath();x.moveTo(i*8,0);x.lineTo(i*8+180,h);x.stroke()}
},18,18);
const grassMat=new THREE.MeshStandardMaterial({map:grassTexture,roughness:.96});
const field=new THREE.Mesh(new THREE.CylinderGeometry(45,45,.42,128),grassMat);
field.scale.z=.82;field.position.y=-.22;field.receiveShadow=true;stadium.add(field);

const mowingTexture=canvasTexture(256,256,(x,w,h)=>{
 x.fillStyle="#315f35";x.fillRect(0,0,w,h);
 for(let i=0;i<(isMobileDevice?4:12);i++){x.fillStyle=i%2?"rgba(0,0,0,.045)":"rgba(255,255,255,.035)";x.fillRect(i*w/12,0,w/12,h)}
},1,8);
const mowing=new THREE.Mesh(new THREE.RingGeometry(27,43.8,128),new THREE.MeshStandardMaterial({map:mowingTexture,roughness:1}));
mowing.rotation.x=-Math.PI/2;mowing.scale.y=.82;mowing.position.y=.012;stadium.add(mowing);

const pitchTexture=canvasTexture(512,1024,(x,w,h)=>{
 x.fillStyle="#ae8c5c";x.fillRect(0,0,w,h);
 for(let i=0;i<26000;i++){const v=Math.random();x.fillStyle=v>.55?"rgba(92,66,38,.12)":"rgba(240,211,157,.1)";x.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*4)}
 for(let i=0;i<140;i++){x.strokeStyle="rgba(70,50,30,.12)";x.beginPath();x.moveTo(Math.random()*w,Math.random()*h);x.lineTo(Math.random()*w,Math.random()*h);x.stroke()}
},1,1);
const pitch=new THREE.Mesh(new THREE.BoxGeometry(5.5,.18,34),new THREE.MeshStandardMaterial({map:pitchTexture,roughness:1}));
pitch.position.y=.04;pitch.receiveShadow=true;stadium.add(pitch);

const pitchEdge=new THREE.Mesh(new THREE.BoxGeometry(4.9,.08,33.2),material("#9b784c",1));
pitchEdge.position.y=.145;pitchEdge.receiveShadow=true;stadium.add(pitchEdge);

const lineMat=material("#f5f0de",.7);
function addLine(w,d,x,z){const o=meshBox(w,.035,d,lineMat,x,.25,z);stadium.add(o)}
addLine(4.95,.075,0,-13.05);addLine(4.95,.075,0,13.05);
addLine(.075,5.9,-2.05,-11.0);addLine(.075,5.9,2.05,-11.0);
addLine(.075,5.9,-2.05,11.0);addLine(.075,5.9,2.05,11.0);
function addCreaseMarkings(){
 addLine(4.95,.055,0,-13.05);addLine(4.95,.055,0,13.05);
 [-2.55,2.55].forEach(x=>{addLine(.055,2.0,x,-13.67);addLine(.055,2.0,x,-12.43);addLine(.055,2.0,x,12.43);addLine(.055,2.0,x,13.67);});
}
addCreaseMarkings();


const wood=material("#d4bd8c",.6);
const wicketGroups=[];
function makeWicket(z){
 const g=new THREE.Group();
 [-.34,0,.34].forEach(x=>g.add(meshCyl(.055,2.25,wood,x,.98,0,14)));
 g.add(meshBox(.82,.09,.13,wood,0,2.08,0),meshBox(.82,.09,.13,wood,0,2.17,0));
 g.children.forEach(m=>{m.userData.home={position:m.position.clone(),rotation:m.rotation.clone()};});
 g.position.z=z;stadium.add(g);wicketGroups.push(g);
}
makeWicket(-12.2);makeWicket(12.2);

const rope=new THREE.Mesh(new THREE.TorusGeometry(43.5,.13,12,160),material("#e5e1cf",.65));
rope.rotation.x=Math.PI/2;rope.scale.y=.82;rope.position.y=.25;stadium.add(rope);

const standBase=material("#343b3b",.9,.1), seatMat=material("#8f292d",.72);
for(let tier=0;tier<(isMobileDevice?3:5);tier++){
 const r=48+tier*3.9;
 const standCount=isMobileDevice?18:36;
 for(let i=0;i<standCount;i++){
  const a=i/standCount*Math.PI*2;const x=Math.cos(a)*r,z=Math.sin(a)*r*.72;
  const block=meshBox(7.8,1.2,3.0,standBase,x,2.1+tier*1.9,z);block.rotation.y=-a;stadium.add(block);
  const seats=meshBox(7.2,.28,2.65,seatMat,x,2.78+tier*1.9,z);seats.rotation.y=-a;stadium.add(seats);
 }
}

const roof=material("#111817",.55,.35);
const roofCount=isMobileDevice?12:28;
for(let i=0;i<roofCount;i++){
 const a=i/roofCount*Math.PI*2,r=61;
 const panel=meshBox(15,.65,5.2,roof,Math.cos(a)*r,17.2,Math.sin(a)*r*.72);
 panel.rotation.y=-a;stadium.add(panel);
}
const roofRim=new THREE.Mesh(new THREE.TorusGeometry(61,.45,12,128),material("#303a37",.42,.5));
roofRim.scale.y=.72;roofRim.position.y=17.3;stadium.add(roofRim);

const crowd=new THREE.Group();stadium.add(crowd);
const crowdColors=[0xd9ddd9,0x7b8580,0x34433e,0xb6bfc0,0x563e3e,0xd0b35b];
const crowdGeo=new THREE.SphereGeometry(.15,6,5);
const crowdMats=crowdColors.map(c=>new THREE.MeshStandardMaterial({color:c,roughness:1}));
const crowdCount=isMobileDevice?180:700;
for(let i=0;i<crowdCount;i++){
 const a=Math.random()*Math.PI*2,r=49+Math.random()*11,y=3+Math.floor(Math.random()*5)*1.85+Math.random();
 const p=new THREE.Mesh(crowdGeo,crowdMats[Math.floor(Math.random()*crowdMats.length)]);
 p.position.set(Math.cos(a)*r,y,Math.sin(a)*r*.72);crowd.add(p);
}

const lights=[];
function floodlight(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);
 g.add(meshCyl(.25,25,material("#303736",.5,.6),0,12.5,0,18));
 g.add(meshBox(5.7,3.2,.7,material("#1b2221",.45,.6),0,25,0));
 for(let i=0;i<(isMobileDevice?4:12);i++){
  const bulb=new THREE.Mesh(new THREE.BoxGeometry(.42,.48,.12),new THREE.MeshStandardMaterial({color:0xffffe8,emissive:0xfff1b5,emissiveIntensity:9}));
  bulb.position.set(-2.25+(i%6)*.9,24.4+Math.floor(i/6)*.85,-.42);g.add(bulb);
 }
 const l=new THREE.SpotLight(0xfff0c7,isMobileDevice?16:115,85,Math.PI/4,.5,1.25);
 l.position.set(0,24,0);l.target.position.set(0,0,0);g.add(l,l.target);lights.push(l);
 stadium.add(g);
}
(isMobileDevice?[[-48,-35],[48,35]]:[[-48,-35],[48,-35],[-48,35],[48,35]]).forEach(p=>floodlight(...p));

// VISUAL POLISH v66 — presentation lighting and stadium depth.
const rimLight=new THREE.DirectionalLight(0xb8d9ff,1.15);
rimLight.position.set(34,28,-42);scene.add(rimLight);
const fillLight=new THREE.DirectionalLight(0x8fbf9a,.65);
fillLight.position.set(-12,18,-28);scene.add(fillLight);
const stadiumGlow=new THREE.PointLight(0xf5c400,10,75,2);
stadiumGlow.position.set(0,18,0);scene.add(stadiumGlow);

function limbBetween(a,b,r,mat){
 const mid=new THREE.Vector3().addVectors(a,b).multiplyScalar(.5);
 const len=a.distanceTo(b);
 const o=new THREE.Mesh(new THREE.CapsuleGeometry(r,Math.max(.08,len-r*2),6,10),mat);
 o.position.copy(mid);
 o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3().subVectors(b,a).normalize());
 return o;
}

function player({team=0,role="fielder",x=0,z=0,scale=.95}={}) {
 const g=new THREE.Group();
 g.position.set(x,.18,z);
 g.scale.setScalar(scale);

 // PLAYER ONLY — human-shaped continuous silhouette. No ball-like body pieces.
 const shirtColor=team===0?theme.a:"#e8ece8";
 const trimColor=team===0?theme.b:"#b8c1bd";
 const pantsColor=team===0?theme.a:"#f2f3ed";
 const skinColor=team===0?"#9b6849":"#8a573d";

 const shirt=material(shirtColor,.55); playerShirts.push(shirt);
 const trim=material(trimColor,.48,.06); playerTrim.push(trim);
 const pants=material(pantsColor,.72);
 const skin=material(skinColor,.8);
 const hair=material("#241a15",.9);
 const shoe=material("#111516",.3,.18);
 const helmet=material(team===0?theme.a:"#dce2df",.34,.28);
 const seamMat=material(team===0?theme.b:"#bfc8c4",.38,.1);

 const mesh=(geometry,mat,pos,scale=[1,1,1])=>{
  const m=new THREE.Mesh(geometry,mat);
  m.position.set(...pos);m.scale.set(...scale);
  m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
 };
 const segment=(a,b,r,mat)=>{
  const v=new THREE.Vector3().subVectors(b,a);
  const mid=new THREE.Vector3().addVectors(a,b).multiplyScalar(.5);
  const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,Math.max(.08,v.length()-r*2),isMobileDevice&&!isTabletDevice?8:12,isMobileDevice&&!isTabletDevice?10:18),mat);
  m.position.copy(mid);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());
  m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
 };

 // --- Pose first: the batter's hands are placed around the bat handle BEFORE the arms are built.
 let leftHand,rightHand;
 if(role==="batter"){
  leftHand=new THREE.Vector3(.39,1.25,-.34);
  rightHand=new THREE.Vector3(.39,1.48,-.34);
 } else {
  leftHand=new THREE.Vector3(-.47,.93,-.04);
  rightHand=new THREE.Vector3(.47,.93,-.04);
 }

 // Main silhouette: one tapered torso, chest/waist transition, and hips.
 // The torso is deliberately larger than the limbs so the player reads as a human at distance.
 mesh(new THREE.CapsuleGeometry(.40,.72,16,30),shirt,[0,1.18,0],[1.13,1,.76]);
 mesh(new THREE.CapsuleGeometry(.32,.18,14,22),shirt,[0,.79,0],[1.18,1,.82]);

 // Shoulder mass smoothly joins the torso instead of floating as separate balls.
 mesh(new THREE.CapsuleGeometry(.30,.24,14,22),shirt,[-.28,1.40,0],[1,.95,.82]);
 mesh(new THREE.CapsuleGeometry(.30,.24,10,18),shirt,[.28,1.40,0],[1,.95,.82]);

 // Neck, head and hair.
 mesh(new THREE.CapsuleGeometry(.115,.20,10,18),skin,[0,1.70,0],[1,1,1]);
 mesh(new THREE.CapsuleGeometry(.29,.23,16,24),skin,[0,2.00,0],[.94,1.08,.94]);
 mesh(new THREE.SphereGeometry(.30,isMobileDevice&&!isTabletDevice?18:28,isMobileDevice&&!isTabletDevice?14:20,0,Math.PI*2,0,Math.PI*.60),hair,[0,2.08,0],[.94,1,.94]);
 mesh(new THREE.SphereGeometry(.045,10,8),skin,[-.275,2.00,0]);
 mesh(new THREE.SphereGeometry(.045,10,8),skin,[.275,2.00,0]);

 // Arms are thick human limbs and actually terminate at the planned hand positions.
 const shoulderL=new THREE.Vector3(-.39,1.43,0);
 const shoulderR=new THREE.Vector3(.39,1.43,0);
 const elbowL=role==="batter"?new THREE.Vector3(-.02,1.31,-.22):new THREE.Vector3(-.53,1.13,-.02);
 const elbowR=role==="batter"?new THREE.Vector3(.10,1.38,-.27):new THREE.Vector3(.53,1.13,-.02);
 segment(shoulderL,elbowL,.14,shirt);
 segment(elbowL,leftHand,.115,skin);
 segment(shoulderR,elbowR,.14,shirt);
 segment(elbowR,rightHand,.115,skin);

 // Hands are rounded but small enough that they don't turn into body spheres.
 mesh(new THREE.CapsuleGeometry(.10,.10,8,12),skin,leftHand.toArray(),[1,.9,.82]);
 mesh(new THREE.CapsuleGeometry(.10,.10,8,12),skin,rightHand.toArray(),[1,.9,.82]);

 // Legs connect directly into the hips, with thick upper/lower sections and no gaps.
 const hipL=new THREE.Vector3(-.19,.78,0), hipR=new THREE.Vector3(.19,.78,0);
 const kneeL=new THREE.Vector3(-.21,.43,-.01), kneeR=new THREE.Vector3(.21,.43,-.01);
 const ankleL=new THREE.Vector3(-.21,.13,-.09), ankleR=new THREE.Vector3(.21,.13,-.09);
 segment(hipL,kneeL,.15,pants);
 segment(kneeL,ankleL,.135,pants);
 segment(hipR,kneeR,.15,pants);
 segment(kneeR,ankleR,.135,pants);

 // Rounded cricket shoes — attached to ankles, not floating.
 mesh(new THREE.CapsuleGeometry(.12,.24,10,16),shoe,[-.21,.08,-.16],[1.25,.55,1.65]);
 mesh(new THREE.CapsuleGeometry(.12,.24,10,16),shoe,[.21,.08,-.16],[1.25,.55,1.65]);

 // Helmet/headgear.
 if(role!=="keeper"){
  mesh(new THREE.SphereGeometry(.38,isMobileDevice&&!isTabletDevice?18:32,isMobileDevice&&!isTabletDevice?14:20,0,Math.PI*2,0,Math.PI*.52),helmet,[0,2.15,0],[1,.96,.98]);
  const peak=mesh(new THREE.CapsuleGeometry(.055,.30,8,12),helmet,[0,2.06,-.33],[1,.65,.65]);
  peak.rotation.x=Math.PI/2;
 } else {
  mesh(new THREE.SphereGeometry(.39,isMobileDevice&&!isTabletDevice?18:32,isMobileDevice&&!isTabletDevice?14:20,0,Math.PI*2,0,Math.PI*.60),helmet,[0,2.13,0],[1,.98,.98]);
  [-.18,0,.18].forEach((xx,i)=>{
   const bar=mesh(new THREE.CapsuleGeometry(.022,.45,6,10),seamMat,[xx,1.99,-.35],[1,1,.7]);
   bar.rotation.z=(i-1)*.08;
  });
 }

 // Batting equipment follows the actual legs and hands.
 if(role==="batter"){
  const pad=material("#e9e8df",.48);
  const glove=material("#e6e1d0",.48);

  mesh(new THREE.CapsuleGeometry(.14,.48,10,18),pad,[-.21,.53,-.15],[1.15,1,.72]);
  mesh(new THREE.CapsuleGeometry(.14,.48,10,18),pad,[.21,.53,-.15],[1.15,1,.72]);

  // One continuous bat handle passes directly through BOTH hands.
  const batBottom=new THREE.Vector3(.39,.98,-.34);
  const batTop=new THREE.Vector3(.39,1.70,-.34);
  const batBladeEnd=new THREE.Vector3(.39,.20,-.34);

  const batMat=material("#c99b54",.45);
  const gripMat=material("#4b3427",.7);

  // Blade is a long rounded cricket-bat body.
  segment(batBladeEnd,batBottom,.115,batMat);
  // Handle overlaps the upper blade and reaches through both hands.
  segment(batBottom,batTop,.052,gripMat);

  // Gloves are placed exactly around the handle.
  mesh(new THREE.CapsuleGeometry(.13,.13,8,12),glove,leftHand.toArray(),[1.12,.9,.9]);
  mesh(new THREE.CapsuleGeometry(.13,.13,8,12),glove,rightHand.toArray(),[1.12,.9,.9]);
 } else if(role==="keeper"){
  const glove=material("#eeeadd",.48);
  const pad=material("#e6e5dc",.52);
  mesh(new THREE.CapsuleGeometry(.20,.18,10,14),glove,[-.57,.95,-.10],[1.25,.9,.9]);
  mesh(new THREE.CapsuleGeometry(.20,.18,10,14),glove,[.57,.95,-.10],[1.25,.9,.9]);
  mesh(new THREE.CapsuleGeometry(.14,.48,10,18),pad,[-.21,.53,-.16],[1.15,1,.72]);
  mesh(new THREE.CapsuleGeometry(.14,.48,10,18),pad,[.21,.53,-.16],[1.15,1,.72]);
 }

 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
 stadium.add(g);
 return g;
}

let batter=player({team:0,role:"batter",x:.8,z:10.4,scale:1.12});batter.rotation.y=Math.PI;
let nonStriker=player({team:0,role:"batter",x:-.8,z:-12.2,scale:1.08});
nonStriker.rotation.y=0;
const keeper=player({team:1,role:"keeper",x:0,z:13.9,scale:1.02});
keeper.rotation.y=Math.PI;
const bowler=player({team:1,x:0,z:-20.5,scale:1.08});
const fielders=[[-3.2,11.6],[-5.2,10.9],[-8.2,7.8],[-15.0,3.5],[-12.5,-3.5],[-7.5,-8.5],[7.5,-8.5],[14.5,3.8],[8.5,12.8]].map(([x,z])=>player({team:1,x,z,scale:.9}));

const REAL_FIELD_POSITIONS={
 "SLIP_1":{label:"1st Slip",x:-3.2,z:11.6},
 "SLIP_2":{label:"2nd Slip",x:-5.2,z:10.9},
 "GULLY":{label:"Gully",x:-8.2,z:7.8},
 "POINT":{label:"Point",x:-15.0,z:3.5},
 "COVER":{label:"Cover",x:-12.5,z:-3.5},
 "MID_OFF":{label:"Mid-off",x:-7.5,z:-8.5},
 "MID_ON":{label:"Mid-on",x:7.5,z:-8.5},
 "SQUARE_LEG":{label:"Square leg",x:14.5,z:3.8},
 "FINE_LEG":{label:"Fine leg",x:8.5,z:12.8},
 "THIRD_MAN":{label:"Third man",x:-20.0,z:13.0},
 "DEEP_POINT":{label:"Deep point",x:-22.0,z:1.5},
 "DEEP_COVER":{label:"Deep cover",x:-18.0,z:-8.0},
 "DEEP_MIDWICKET":{label:"Deep mid-wicket",x:19.0,z:-5.0},
 "LONG_ON":{label:"Long on",x:12.0,z:-17.0},
 "LONG_OFF":{label:"Long off",x:-12.0,z:-17.0}
};
let fieldAssignments=["SLIP_1","SLIP_2","GULLY","POINT","COVER","MID_OFF","MID_ON","SQUARE_LEG","FINE_LEG"];
function applyFieldAssignments(){
 fielders.forEach((f,i)=>{
  const key=fieldAssignments[i],p=REAL_FIELD_POSITIONS[key];
  if(!p)return;
  f.userData.fieldPositionKey=key;
  f.userData.fieldPositionLabel=p.label;
  f.userData.base=new THREE.Vector3(p.x,.18,p.z);
  if(!f.userData.running&&!f.userData.hasBall&&!shotFlightActive){
   f.position.copy(f.userData.base);
   f.rotation.y=Math.atan2(-p.x,Math.max(.001,-p.z));
  }
 });
}
function renderFieldSetup(){
 const root=document.querySelector("#fieldSlots");if(!root)return;
 root.innerHTML="";
 fieldAssignments.forEach((key,i)=>{
  const row=document.createElement("div");row.className="field-slot";
  const label=document.createElement("span");label.textContent=(i+1)+" · "+(fielders[i]?.userData.fieldPositionLabel||REAL_FIELD_POSITIONS[key].label);
  const select=document.createElement("select");select.dataset.fielder=String(i);
  Object.entries(REAL_FIELD_POSITIONS).forEach(([k,p])=>{
   const opt=document.createElement("option");opt.value=k;opt.textContent=p.label;
   opt.selected=k===key;
   if(k!==key&&fieldAssignments.some((v,j)=>j!==i&&v===k))opt.disabled=true;
   select.appendChild(opt);
  });
  select.addEventListener("change",()=>{
   const old=fieldAssignments[i],next=select.value;
   const other=fieldAssignments.indexOf(next);
   if(other>=0&&other!==i){fieldAssignments[other]=old;}
   fieldAssignments[i]=next;
   applyFieldAssignments();renderFieldSetup();
   showToast("FIELDER "+(i+1)+" · "+REAL_FIELD_POSITIONS[next].label);
  });
  row.append(label,select);root.appendChild(row);
 });
 const keeperLabel=document.querySelector("#keeperLockedLabel");
 if(keeperLabel)keeperLabel.textContent="WICKET KEEPER · LOCKED BEHIND BATTER";
}
applyFieldAssignments();

const ball=new THREE.Mesh(new THREE.SphereGeometry(.19,24,18),new THREE.MeshStandardMaterial({color:0x8d1119,roughness:.3,clearcoat:.35}));
ball.position.set(0,.63,6.5);ball.castShadow=true;stadium.add(ball);
const seam=new THREE.Mesh(new THREE.TorusGeometry(.13,.018,8,28),material("#ead6cf",.55));seam.rotation.x=Math.PI/2;ball.add(seam);
const ballTrailLength=18;
const ballTrailPositions=Array.from({length:ballTrailLength},()=>new THREE.Vector3());
const ballTrailGeometry=new THREE.BufferGeometry();
const ballTrailArray=new Float32Array(ballTrailLength*3);
ballTrailGeometry.setAttribute("position",new THREE.BufferAttribute(ballTrailArray,3));
const ballTrailMaterial=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.78,depthWrite:false});
const ballTrail=new THREE.Line(ballTrailGeometry,ballTrailMaterial);
ballTrail.frustumCulled=false;stadium.add(ballTrail);

let replayBuffer=[],replayActive=false,replayStart=0,replayFrames=[],replayReason="",replayOverlay=null;
const REPLAY_BUFFER_SIZE=300;
function updateBallTrail(){
 for(let i=ballTrailLength-1;i>0;i--)ballTrailPositions[i].lerp(ballTrailPositions[i-1],.72);
 ballTrailPositions[0].copy(ball.position);
 const a=ballTrailGeometry.attributes.position.array;
 for(let i=0;i<ballTrailLength;i++){a[i*3]=ballTrailPositions[i].x;a[i*3+1]=ballTrailPositions[i].y;a[i*3+2]=ballTrailPositions[i].z;}
 ballTrailGeometry.attributes.position.needsUpdate=true;
 ballTrailMaterial.color.set(bowlTypeState==="SLOWER"?0x8fc7ff:0xffffff);
 ballTrailMaterial.opacity=bowlTypeState==="SLOWER"?.42:.78;
}
function recordReplayFrame(now){
 replayBuffer.push({t:now,ball:ball.position.clone(),batter:batter.position.clone(),rot:batter.rotation.clone()});
 if(replayBuffer.length>REPLAY_BUFFER_SIZE)replayBuffer.shift();
}
function triggerActionReplay(reason){
 if(replayActive||replayBuffer.length<30)return;
 replayFrames=replayBuffer.slice(-300);replayActive=true;replayReason=reason;replayStart=performance.now();
 if(!replayOverlay){
  replayOverlay=document.createElement("div");replayOverlay.id="actionReplayOverlay";
  replayOverlay.innerHTML="<div class='replay-flash'></div><div class='replay-card'><span>ACTION REPLAY</span><b>0.5× SLOW MOTION</b><small id='replayReason'></small></div>";
  Object.assign(replayOverlay.style,{position:"fixed",inset:"0",display:"none",zIndex:"9800000",pointerEvents:"auto"});
  document.body.appendChild(replayOverlay);
 }
 replayOverlay.querySelector("#replayReason").textContent=reason;
 replayOverlay.style.display="block";document.body.classList.add("replay-active");
}
function updateActionReplay(now){
 if(!replayActive)return;
 const elapsed=(now-replayStart)*.5;
 const i=Math.min(replayFrames.length-1,Math.floor(elapsed/16.666));
 const f=replayFrames[i];
 if(f){
  ball.position.lerp(f.ball,.9);batter.position.lerp(f.batter,.9);
  batter.rotation.x+=(f.rot.x-batter.rotation.x)*.18;batter.rotation.y+=(f.rot.y-batter.rotation.y)*.18;batter.rotation.z+=(f.rot.z-batter.rotation.z)*.18;
  const a=-.8+(i/Math.max(1,replayFrames.length-1))*1.6;
  camera.position.lerp(new THREE.Vector3(ball.position.x+Math.cos(a)*18,7+Math.sin(i*.04)*1.5,ball.position.z+Math.sin(a)*18),.12);
  camera.lookAt(ball.position.x,ball.position.y+1.1,ball.position.z);
 }
 if(i>=replayFrames.length-1){replayActive=false;replayOverlay.style.display="none";document.body.classList.remove("replay-active");setCamera("broadcast");}
}


const boundaryBoards=[];
const boundaryMat=material(theme.a,.55,.1);
const boundaryCount=isMobileDevice?24:48;
for(let i=0;i<boundaryCount;i++){
 const a=i/boundaryCount*Math.PI*2,r=43.9;const b=meshBox(5,.7,.08,boundaryMat,Math.cos(a)*r,.7,Math.sin(a)*r*.82);b.rotation.y=-a;stadium.add(b);boundaryBoards.push(b);
}

function setCountry(name){
 selectedCountry=name;theme=countries[name];
 document.documentElement.style.setProperty("--accent",theme.b);
 document.documentElement.style.setProperty("--accent2",theme.a);
 document.querySelector("#countryReadout").textContent=name.toUpperCase();
 if(hudTeam) hudTeam.textContent=name.toUpperCase();
 document.querySelector("#countryDesc").textContent=name+" · "+theme.desc;
 document.querySelectorAll(".country").forEach(b=>b.classList.toggle("active",b.dataset.country===name));
 playerShirts.forEach(m=>m.color.set(theme.a));
 playerTrim.forEach(m=>m.color.set(theme.b));
 boundaryBoards.forEach(m=>m.material.color.set(theme.a));
}
const grid=document.querySelector("#countryGrid");
Object.entries(countries).forEach(([name,c])=>{
 const b=document.createElement("button");b.className="country";b.dataset.country=name;
 b.innerHTML=`<div class="swatches"><i class="swatch" style="background:${c.a}"></i><i class="swatch" style="background:${c.b}"></i><i class="swatch" style="background:${c.c}"></i></div><strong>${c.flag} ${name}</strong><small>${c.desc}</small>`;
 b.addEventListener("click",()=>setCountry(name));grid.appendChild(b);
});


// DEVICE / BATTER CONTROL SETTINGS
const deviceSetup=document.querySelector("#deviceSetup");
let deviceType=localStorage.getItem("cricket26-device")||"";
let phoneLandscape=localStorage.getItem("cricket26-phone-orientation")!=="portrait";
let recommendations=localStorage.getItem("cricket26-recommendations")!=="off";
let hitDirection={x:0,y:0};
let selectedShot="STROKE";
let selectedFoot="";
let currentRecommendation=null;
async function requestPhoneLandscape(){
 if(deviceType!=="phone"||!phoneLandscape)return;
 try{
  if(document.documentElement.requestFullscreen && !document.fullscreenElement) await document.documentElement.requestFullscreen();
 }catch(e){}
 try{
  if(screen.orientation?.lock) await screen.orientation.lock("landscape");
 }catch(e){}
}
function applyDeviceMode(){
 const iPadLike=navigator.maxTouchPoints>1 && Math.max(window.innerWidth,window.innerHeight)>=700;
 const effectiveTablet=deviceType==="tablet" || iPadLike;
 const effectivePhone=deviceType==="phone" && !iPadLike;
 document.body.classList.toggle("device-phone",effectivePhone);
 document.body.classList.toggle("device-tablet",effectiveTablet);
 document.body.classList.toggle("device-pc",deviceType==="pc"&&!effectiveTablet&&!effectivePhone);
 document.body.classList.toggle("phone-portrait",deviceType==="phone"&&!phoneLandscape);
 document.body.classList.toggle("phone-landscape",deviceType==="phone"&&phoneLandscape);
 const cd=document.querySelector("#controlDevice"); if(cd) cd.textContent=(deviceType==="phone"?(phoneLandscape?"PHONE · LANDSCAPE":"PHONE · PORTRAIT"):deviceType==="tablet"?"IPAD · WIDE":"PC · KEYBOARD");
 if(deviceType==="phone"&&phoneLandscape){requestPhoneLandscape();}
 if(deviceType==="phone"&&!phoneLandscape&&screen.orientation?.unlock)screen.orientation.unlock();
}
function chooseDevice(type){
 deviceType=type;localStorage.setItem("cricket26-device",type);applyDeviceMode();
 deviceSetup.classList.remove("open");
 if(type==="phone"){phoneLandscape=true;localStorage.setItem("cricket26-phone-orientation","landscape");}
 applyDeviceMode();
 if(type==="phone")requestPhoneLandscape();
 showToast(type==="phone"?"PHONE MODE · LANDSCAPE":"CONTROL LAYOUT · "+type.toUpperCase());
}
deviceSetup.querySelectorAll("[data-device]").forEach(b=>b.addEventListener("click",()=>chooseDevice(b.dataset.device)));
if(deviceType){
 deviceSetup.classList.remove("open");
 applyDeviceMode();
}else{
 applyDeviceMode();
}

const recOn=document.querySelector("#recommendationsToggle"),recOff=document.querySelector("#recommendationsOff");
function updateRecommendationUI(){
 recommendations=!!recommendations;
 localStorage.setItem("cricket26-recommendations",recommendations?"on":"off");
 recOn.classList.toggle("active",recommendations);recOff.classList.toggle("active",!recommendations);
 const r=document.querySelector("#recommendationText"); if(r) r.style.display=recommendations?"block":"none";
}
recOn.addEventListener("click",()=>{recommendations=true;updateRecommendationUI()});
recOff.addEventListener("click",()=>{recommendations=false;updateRecommendationUI()});
document.querySelector("#landscapeChoice").addEventListener("click",()=>{phoneLandscape=true;localStorage.setItem("cricket26-phone-orientation","landscape");applyDeviceMode();requestPhoneLandscape();document.querySelector("#landscapeChoice").classList.add("active");document.querySelector("#portraitChoice").classList.remove("active")});
document.querySelector("#portraitChoice").addEventListener("click",()=>{phoneLandscape=false;localStorage.setItem("cricket26-phone-orientation","portrait");applyDeviceMode();document.querySelector("#portraitChoice").classList.add("active");document.querySelector("#landscapeChoice").classList.remove("active")});
updateRecommendationUI();

const hitJoystick=document.querySelector("#hitJoystick"), joystickStick=document.querySelector("#joystickStick");
let joystickPointer=false;
function setJoystick(clientX,clientY){
 const r=hitJoystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
 let dx=clientX-cx,dy=clientY-cy,max=r.width*.30,mag=Math.hypot(dx,dy)||1;
 if(mag>max){dx=dx/mag*max;dy=dy/mag*max;}
 hitDirection.x=dx/max;hitDirection.y=-dy/max;
 joystickStick.style.transform="translate("+dx+"px,"+dy+"px)";
 if(recommendations){const r=document.querySelector("#recommendationText");if(r)r.textContent="TARGET: "+directionName(hitDirection);}
}
function resetJoystick(){joystickPointer=false;hitDirection={x:0,y:0};joystickStick.style.transform="translate(0,0)"}
function directionName(d){
 if(Math.abs(d.x)<.25&&Math.abs(d.y)<.25)return "STRAIGHT";
 if(Math.abs(d.x)>.55)return d.x<0?"OFF SIDE":"LEG SIDE";
 if(d.y>.55)return "FRONT / STRAIGHT";
 return "SQUARE / BACK";
}
["pointerdown","pointermove"].forEach(type=>hitJoystick.addEventListener(type,e=>{if(type==="pointerdown")joystickPointer=true;if(joystickPointer){e.preventDefault();setJoystick(e.clientX,e.clientY)}}));
hitJoystick.addEventListener("pointerup",resetJoystick);hitJoystick.addEventListener("pointercancel",resetJoystick);

function recommendationForDelivery(){
 const options=[];
 if(deliveryLength==="FULL") options.push({dir:{x:0,y:.85},shot:"STROKE",foot:"FRONT"});
 if(deliveryLength==="SHORT") options.push({dir:{x:.7,y:.05},shot:"STROKE",foot:"BACK"});
 if(deliveryLine==="OUTSIDE_OFF") options.push({dir:{x:-.8,y:.35},shot:"STROKE",foot:"FRONT"});
 if(deliveryLine==="ON_STUMPS") options.push({dir:{x:0,y:.7},shot:"PUSH",foot:"FRONT"});
 if(deliveryLine==="LEG") options.push({dir:{x:.8,y:.2},shot:"LOFT",foot:"FRONT"});
 if(!options.length) options.push({dir:{x:0,y:.6},shot:"STROKE",foot:"FRONT"});
 return options;
}
function renderRecommendationVisuals(options){
 const tickHost=document.querySelector("#joystickTicks");
 const recText=document.querySelector("#recommendationText");
 document.querySelectorAll("[data-shot]").forEach(el=>el.classList.remove("recommended"));
 document.querySelectorAll("[data-foot]").forEach(el=>el.classList.remove("recommended"));
 if(!tickHost)return;

 // Eight directional triangles, like the reference controls.
 // Only the direction(s) that are recommended for this delivery
 // receive the country's selected accent colour.
 tickHost.innerHTML="";
 const dirs=[
  {x:0,y:1},{x:.707,y:.707},{x:1,y:0},{x:.707,y:-.707},
  {x:0,y:-1},{x:-.707,y:-.707},{x:-1,y:0},{x:-.707,y:.707}
 ];
 const recommendedIndexes=new Set();
 options.forEach(o=>{
  let best=0,bestDot=-Infinity;
  dirs.forEach((d,i)=>{
   const len=Math.hypot(o.dir.x,o.dir.y)||1;
   const dot=(o.dir.x/len)*d.x+(o.dir.y/len)*d.y;
   if(dot>bestDot){bestDot=dot;best=i;}
  });
  recommendedIndexes.add(best);
 });

 dirs.forEach((d,i)=>{
  const tri=document.createElement("span");
  tri.className="joystick-triangle"+(recommendedIndexes.has(i)?" recommended":"");
  const angle=Math.atan2(d.x,d.y)*180/Math.PI;
  tri.style.setProperty("--angle",angle+"deg");
  tickHost.appendChild(tri);
 });

 if(!recommendations){
  if(recText)recText.textContent="Drag to aim your shot";
  return;
 }

 options.forEach(o=>{
  const shot=document.querySelector('[data-shot="'+o.shot+'"]');
  const foot=document.querySelector('[data-foot="'+o.foot+'"]');
  if(shot)shot.classList.add("recommended");
  if(foot)foot.classList.add("recommended");
 });
 if(recText)recText.textContent=options.length>1?"MULTIPLE GOOD OPTIONS":"RECOMMENDED OPTION";
}
function showRecommendations(){
 const recText=document.querySelector("#recommendationText");
 if(!recommendations){
  currentRecommendation=null;
  renderRecommendationVisuals([]);
  return;
 }
 const options=chooseRecommendationSet();
 currentRecommendation=options[Math.floor(Math.random()*options.length)];
 renderRecommendationVisuals(options);
 if(recText)recText.textContent=options.length>1?"MULTIPLE GOOD OPTIONS":"RECOMMENDED OPTION";
}

const settings=document.querySelector("#settings");
document.querySelector("#settingsFloat").addEventListener("click",()=>settings.classList.add("open"));
document.querySelector("#closeSettings").addEventListener("click",()=>settings.classList.remove("open"));
settings.addEventListener("click",e=>{if(e.target===settings)settings.classList.remove("open")});

document.querySelectorAll(".style-choice").forEach(b=>b.addEventListener("click",()=>{
 visualStyle=b.dataset.style;document.querySelectorAll(".style-choice").forEach(x=>x.classList.toggle("active",x===b));
 if(visualStyle==="bright"){renderer.toneMappingExposure=1.3;scene.fog.color.set(0x52786f);scene.fog.density=.004;sun.intensity=4;hemi.intensity=1.7}
 else if(visualStyle==="cinematic"){renderer.toneMappingExposure=.98;scene.fog.color.set(0x050a09);scene.fog.density=.009;sun.intensity=2.3;hemi.intensity=1.05}
 else{renderer.toneMappingExposure=1.12;scene.fog.color.set(0x07120f);scene.fog.density=.0068;sun.intensity=3;hemi.intensity=1.25}
}));

const cameras={
 broadcast:{pos:[28,11.5,29],target:[0,2,2]},
 batter:{pos:[0,5.2,21.5],target:[0,1.6,2.5]},
 bowler:{pos:[0,5.2,-28.5],target:[0,1.6,4.5]},
 wide:{pos:[65,29,68],target:[0,3,0]},
 cinematic:{pos:[-54,14,48],target:[0,4,0]}
};
let cameraMode="broadcast",cinematicTime=0,started=false;
function setCamera(name){cameraMode=name;document.querySelectorAll(".camera").forEach(b=>b.classList.toggle("active",b.dataset.camera===name));const c=cameras[name];camera.position.set(...c.pos);camera.lookAt(...c.target)}
const smoothBroadcastTarget=new THREE.Vector3(0,1.5,2),smoothBroadcastPosition=new THREE.Vector3(28,11.5,29);
function updateDynamicBroadcastCamera(dt){
 if(replayActive||cameraMode!=="broadcast"||!started)return;
 if(shotFlightActive){
  smoothBroadcastPosition.copy(ball.position).add(new THREE.Vector3(17,8,17));
  smoothBroadcastTarget.copy(ball.position);smoothBroadcastTarget.y+=1.1;
 }else if(deliveryActive||ballHit){
  smoothBroadcastPosition.set(20,8,22);
  smoothBroadcastTarget.copy(batter.position).lerp(ball.position,.5);smoothBroadcastTarget.y=1.5;
 }else{
  smoothBroadcastPosition.set(...cameras.broadcast.pos);smoothBroadcastTarget.set(...cameras.broadcast.target);
 }
 camera.position.lerp(smoothBroadcastPosition,Math.min(1,dt*3.6));
 camera.lookAt(smoothBroadcastTarget);
}

document.querySelectorAll(".camera").forEach(b=>b.addEventListener("click",()=>setCamera(b.dataset.camera)));
const cover=document.querySelector("#intro");
const menuPanel=document.querySelector("#menuPanel");
const hud=document.querySelector("#hud");
const hudTeam=document.querySelector("#hudTeam");
document.querySelector("#enterBtn").addEventListener("click",()=>{
 cover.classList.add("hidden"); hud.classList.remove("hidden"); started=true;
 setCamera("cinematic"); setTimeout(()=>setCamera("broadcast"),4200);
});
document.querySelector("#showVisuals").addEventListener("click",()=>{
 cover.classList.add("hidden"); hud.classList.remove("hidden"); started=true; setCamera("cinematic");
});
document.querySelector("#backHome").addEventListener("click",()=>{ menuPanel.classList.add("open"); });
document.querySelector("#menuClose").addEventListener("click",()=>menuPanel.classList.remove("open"));
document.querySelector("#menuSettings").addEventListener("click",()=>{menuPanel.classList.remove("open");settings.classList.add("open")});
document.querySelector("#cameraHud").addEventListener("click",()=>{
 menuPanel.classList.remove("open"); document.querySelector(".bottom-ui").scrollIntoView?.({block:"nearest"});
});
menuPanel.addEventListener("click",e=>{
 const card=e.target.closest(".mode-card");
 if(card){document.querySelectorAll(".mode-card").forEach(x=>x.classList.remove("selected"));card.classList.add("selected");}
 const b=e.target.closest(".menu-grid button");
 if(b && b.textContent==="SETTINGS"){menuPanel.classList.remove("open");settings.classList.add("open");}
});


setCountry("Australia");
let last=performance.now(); let displayRuns=0; let displayBalls=0; let displayWickets=0;
function animate(now){
 requestAnimationFrame(animate);
 const rawDt=(now-last)/1000; last=now;
 const dt=Number.isFinite(rawDt)?Math.min(Math.max(rawDt,0),.05):0;
 const t=now*.001;
 batter.position.y=.18+Math.sin(t*2)*.012;keeper.position.y=.18+Math.sin(t*2.5+.8)*.01;bowler.position.y=.18+Math.sin(t*1.8+.4)*.01;
 fielders.forEach((p,i)=>p.position.y=.18+Math.sin(t*1.5+i)*.007);
 crowd.rotation.y+=dt*.0007;if(!deliveryActive&&!ballHit){ball.position.y=.63+Math.sin(t*2.4)*.018;}ball.rotation.y+=dt*1.8;
 document.querySelector("#scoreValue").textContent=displayRuns+" / "+displayWickets;
 document.querySelector("#oversValue").textContent=Math.floor(displayBalls/6)+"."+(displayBalls%6)+" OVERS";
 if(!isMobileDevice)lights.forEach((l,i)=>l.intensity=visualStyle==="bright"?75+Math.sin(t*1.3+i)*1:115+Math.sin(t*1.3+i)*2);
 if(cameraMode==="cinematic"&&started){cinematicTime+=dt;const a=cinematicTime*.16;camera.position.x=-45+Math.sin(a)*12;camera.position.z=45+Math.cos(a)*10;camera.position.y=12+Math.sin(a*1.7)*2;camera.lookAt(0,3,0)}
 renderer.render(scene,camera);
}
requestAnimationFrame(animate);
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(isMobileDevice?Math.min(devicePixelRatio||1,1):Math.min(devicePixelRatio||1,1.35));renderer.setSize(innerWidth,innerHeight,false)});

/* =========================================================
   NEXT-GEN UI CONTROLLER
   ========================================================= */
const preMatch=document.querySelector("#preMatch");
const preMatchClose=document.querySelector("#preMatchClose");
const startMatchBtn=document.querySelector("#startMatchBtn");
const playerHub=document.querySelector("#playerHub");
const playerHubClose=document.querySelector("#playerHubClose");
const toast=document.querySelector("#toast");
let selectedFormat="T20";
let homeTeam="Australia";
let awayTeam="India";

function showToast(message){
 const t=toast.querySelector("span");
 t.textContent=message;
 toast.classList.add("show");
 clearTimeout(window.__toastTimer);
 window.__toastTimer=setTimeout(()=>toast.classList.remove("show"),1800);
}
function openPreMatch(){preMatch.classList.add("open")}
function closePreMatch(){preMatch.classList.remove("open")}

// Capture phase owns PLAY NOW so the old showcase action cannot skip setup.
document.querySelector("#enterBtn").addEventListener("click",e=>{
 e.preventDefault();e.stopImmediatePropagation();openPreMatch();
},{capture:true});

document.querySelectorAll("#formatChoices .setup-choice").forEach(b=>b.addEventListener("click",()=>{
 selectedFormat=b.dataset.format;
 document.querySelectorAll("#formatChoices .setup-choice").forEach(x=>x.classList.toggle("active",x===b));
 document.querySelector("#conditionText").textContent=selectedFormat==="TEST"?"DAYLIGHT · FRESH PITCH":selectedFormat==="ODI"?"DAYLIGHT · HARD SURFACE":"NIGHT · FRESH PITCH";
 showToast(selectedFormat+" FORMAT SELECTED");
}));

document.querySelectorAll(".team-choice").forEach(b=>b.addEventListener("click",()=>{
 const strip=b.parentElement.id;
 if(strip==="homeTeamStrip")homeTeam=b.dataset.team;else awayTeam=b.dataset.team;
 b.parentElement.querySelectorAll(".team-choice").forEach(x=>x.classList.toggle("active",x===b));
 showToast((strip==="homeTeamStrip"?"HOME: ":"AWAY: ")+b.dataset.team.toUpperCase());
}));

preMatchClose.addEventListener("click",closePreMatch);
preMatch.addEventListener("click",e=>{if(e.target===preMatch)closePreMatch()});

startMatchBtn.addEventListener("click",()=>{
 closePreMatch();
 cover.classList.add("hidden");
 hud.classList.remove("hidden");
 started=true;
 selectedCountry=homeTeam;
 if(countries[homeTeam])setCountry(homeTeam);
 hudTeam.textContent=homeTeam.toUpperCase();
 document.querySelector(".match-pill span").textContent=selectedFormat+" MATCH";
 document.querySelector(".match-pill b").textContent=selectedFormat==="TEST"?"DAY 1":"INNINGS 1";
 setCamera("cinematic");
 setTimeout(()=>setCamera("broadcast"),3600);
 showToast(homeTeam.toUpperCase()+" VS "+awayTeam.toUpperCase()+" · MATCH LIVE");
});

// Navigation is now functional rather than decorative.
document.querySelectorAll(".top-nav span").forEach(item=>item.addEventListener("click",()=>{
 const name=item.textContent.trim();
 if(name==="HOME"){cover.classList.remove("hidden");hud.classList.add("hidden");preMatch.classList.remove("open");showToast("HOME")}
 else if(name==="CAREER"){playerHub.classList.add("open");showToast("CAREER HUB")}
 else if(name==="PLAY"){openPreMatch()}
 else if(name==="MY CRICKETER"){playerHub.classList.add("open");showToast("MY CRICKETER")}
}));

document.querySelectorAll(".mode-card").forEach(card=>card.addEventListener("click",()=>{
 const title=card.querySelector("strong")?.textContent||"MODE";
 if(title==="QUICK MATCH")openPreMatch();
 if(title==="CREATE PLAYER"||title==="CAREER")playerHub.classList.add("open");
 if(title==="TOURNAMENTS")showToast("TOURNAMENT HUB · COMING NEXT");
}));
playerHubClose.addEventListener("click",()=>playerHub.classList.remove("open"));
playerHub.addEventListener("click",e=>{if(e.target===playerHub)playerHub.classList.remove("open")});

// Give the cover a living broadcast feel while it is visible.
const coverBall=document.querySelector(".art-ball");
const coverBat=document.querySelector(".art-bat");
const coverRings=document.querySelectorAll(".cover-orbit");
let coverMotion=0;
function animateCoverPresentation(dt){
 if(!cover.classList.contains("hidden")){
  coverMotion+=dt;
  if(coverBall)coverBall.style.transform="translate3d("+(Math.sin(coverMotion*1.7)*10)+"px,"+(Math.cos(coverMotion*1.2)*8)+"px,0)";
  if(coverBat)coverBat.style.transform="rotate("+(21+Math.sin(coverMotion)*2)+"deg) translateY("+(Math.sin(coverMotion*.8)*3)+"px)";
  coverRings.forEach((r,i)=>r.style.transform="rotateX("+(68+i*2)+"deg) rotateZ("+((i?18:-20)+coverMotion*(i?1.8:-1.2))+"deg)");
 }
}
let uiClock=performance.now();
function presentationLoop(now){
 const rawDt=(now-uiClock)/1000;uiClock=now;
 const dt=Number.isFinite(rawDt)?Math.min(Math.max(rawDt,0),.05):0;
 animateCoverPresentation(dt);
 requestAnimationFrame(presentationLoop);
}
requestAnimationFrame(presentationLoop);


/* Batter HUD: live delivery controls are installed below. */
/* =========================================================
   FULL BALL-BY-BALL MATCH ENGINE
   bowler run-up -> release -> physics -> bounce -> timing ->
   shot -> flight -> fielders -> catches/boundaries -> score
   ========================================================= */
const coinToss=document.querySelector("#coinToss");
const coin=document.querySelector("#coin");
const tossPrompt=document.querySelector("#tossPrompt");
const tossResult=document.querySelector("#tossResult");
const continueFromToss=document.querySelector("#continueFromToss");
const tossChoices=document.querySelectorAll(".toss-choice");
const tossDecision=document.querySelector("#tossDecision");
const tossDecisionText=document.querySelector("#tossDecisionText");
const chooseBat=document.querySelector("#chooseBat");
const chooseField=document.querySelector("#chooseField");
const deliveryBtn=document.querySelector("#deliveryBtn");
const deliveryText=document.querySelector("#deliveryText");
const ballSpeed=document.querySelector("#ballSpeed");

let tossWinner="",tossComplete=false,battingFirst="",tossDecisionMade=false;
let matchPhase="IDLE",deliveryActive=false,shotFlightActive=false,ballHit=false;
let deliveryStart=0,deliveryDuration=1450,deliverySpeed=0;
let deliveryLine="ON_STUMPS",deliveryLength="FULL";
let inningsBalls=0,inningsRuns=0,inningsWickets=0,totalOvers=20,ballsInOver=0;
let strikerRuns=0,strikerBalls=0,lastOutcome="";
let controlMode="BAT";
let bowlLength="GOOD",bowlLine="STUMPS",bowlPace="FAST",bowlActive=false,bowlStart=0,bowlSpeed=0;
const bowlingControls=document.querySelector("#bowlingControls");
const modeToggle=document.querySelector("#modeToggle");
const bowlDeliver=document.querySelector("#bowlDeliver");
const controlModeTitle=document.querySelector("#controlModeTitle");
const runBtn=document.querySelector("#runBtn");
const runState={
 active:false,
 runs:0,
 maxRuns:4,
 startedAt:0,
 nextStartZ:10.4,
 nextTargetZ:-12.2,
 runnerProgress:0,
 fielder:null,
 fielded:false,
 throwStart:0,
 throwEnd:0,
 throwTargetZ:-12.2,
 throwActive:false,
 deliveryCounted:false
};

const releasePoint=new THREE.Vector3(0,1.95,-16);
const bouncePoint=new THREE.Vector3(0,.24,7.8);
const runUpStart=new THREE.Vector3(0,.18,-25.5);
const bowlerRelease=new THREE.Vector3(0,.18,-16.0);
let deliveryBounceZ=7.8;
let deliveryLineX=0;
let pitchMarkerCleared=false;
let pitchMarkerShownAt=0;
const landingPreview=new THREE.Group();
const landingDisc=new THREE.Mesh(new THREE.RingGeometry(.32,.52,32),new THREE.MeshBasicMaterial({color:0xffd83d,transparent:true,opacity:.96,side:THREE.DoubleSide}));
landingDisc.rotation.x=-Math.PI/2;
const landingOuter=new THREE.Mesh(new THREE.RingGeometry(.72,.79,40),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.72,side:THREE.DoubleSide}));
landingOuter.rotation.x=-Math.PI/2;
const landingInner=new THREE.Mesh(new THREE.RingGeometry(.12,.17,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,side:THREE.DoubleSide}));
landingInner.rotation.x=-Math.PI/2;
const landingDot=new THREE.Mesh(new THREE.CircleGeometry(.105,20),new THREE.MeshBasicMaterial({color:0xfff3a0,transparent:true,opacity:1,side:THREE.DoubleSide}));
landingDot.rotation.x=-Math.PI/2;
landingDot.position.y=.012;
const landingCrossA=new THREE.Mesh(new THREE.BoxGeometry(1.05,.025,.055),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.92}));
const landingCrossB=landingCrossA.clone();
landingCrossB.rotation.y=Math.PI/2;
const landingGlow=new THREE.Mesh(new THREE.CircleGeometry(.9,40),new THREE.MeshBasicMaterial({color:0xffd83d,transparent:true,opacity:.075,side:THREE.DoubleSide,depthWrite:false}));
landingGlow.rotation.x=-Math.PI/2;
landingGlow.position.y=-.002;
landingPreview.add(landingGlow,landingOuter,landingDisc,landingInner,landingDot,landingCrossA,landingCrossB);
landingPreview.position.y=.035;
landingPreview.visible=false;
stadium.add(landingPreview);

function predictBounceIntersection(position,velocity,targetY=.24){
 const v=velocity.clone();
 if(Math.abs(v.z)<1e-6)return new THREE.Vector3(position.x,targetY,position.z);
 const t=(deliveryBounceZ-position.z)/v.z;
 if(t<=0)return new THREE.Vector3(deliveryLineX,targetY,deliveryBounceZ);
 return new THREE.Vector3(position.x+v.x*t,targetY,position.z+v.z*t);
}
function setPitchMarkerColor(){
 const color=deliveryLength==="SHORT"?0xffcc00:(deliveryLength==="FULL"?0xff3333:0x33cc33);
 landingDisc.material.color.setHex(color);
 landingDot.material.color.setHex(0xffffff);
 landingOuter.material.color.setHex(color);
 landingInner.material.color.setHex(color);
 landingGlow.material.color.setHex(color);
 landingPreview.scale.setScalar(deliveryLength==="SHORT"?1.08:deliveryLength==="FULL"?.94:1);
}
function calculateAndShowPitchMarker(){
 const horizontal=new THREE.Vector3(deliveryLineX,0,deliveryBounceZ-releasePoint.z);
 const distance=Math.max(.001,horizontal.length());
 const speed=Math.max(1,deliverySpeed);
 const velocity=horizontal.normalize().multiplyScalar(speed);
 velocity.y=-(releasePoint.y-.24)/(distance/speed);
 const projected=predictBounceIntersection(releasePoint,velocity,.24);
 landingPreview.position.set(projected.x,.035,projected.z);
 setPitchMarkerColor();
 landingPreview.visible=true;
 pitchMarkerCleared=false;
 pitchMarkerShownAt=performance.now();
}
function clearPitchMarkerOnBounce(){
 if(pitchMarkerCleared)return;
 pitchMarkerCleared=true;
 landingPreview.visible=false;
}

function addBounceMarkerLabel(){
 if(landingPreview.userData.labelSprite)return;
 const c=document.createElement("canvas");c.width=256;c.height=64;
 const x=c.getContext("2d");x.clearRect(0,0,256,64);
 x.fillStyle="rgba(3,12,8,.86)";x.roundRect(4,8,248,48,14);x.fill();
 x.strokeStyle="#ffffff";x.lineWidth=3;x.stroke();
 x.fillStyle="#ffffff";x.font="900 24px Arial";x.textAlign="center";x.textBaseline="middle";x.fillText("BOUNCE HERE",128,32);
 const tex=new THREE.CanvasTexture(c);const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false});
 const sp=new THREE.Sprite(mat);sp.scale.set(2.5,.62,1);sp.position.set(0,1.05,0);
 landingPreview.add(sp);landingPreview.userData.labelSprite=sp;
}
addBounceMarkerLabel();

function updateScoreboard(){
 displayRuns=inningsRuns;displayBalls=inningsBalls;displayWickets=inningsWickets;
 const team=document.querySelector("#scorecardTeam"),runs=document.querySelector("#scorecardRuns"),scorecardOvers=document.querySelector("#scorecardOvers"),inn=document.querySelector("#scorecardInnings");
 if(team)team.textContent=(hudTeam?.textContent||homeTeam||"TEAM").toUpperCase();
 if(runs)runs.textContent=inningsRuns+" / "+inningsWickets;
 if(scorecardOvers)scorecardOvers.textContent=Math.floor(inningsBalls/6)+"."+(inningsBalls%6)+" OVERS";
 if(inn)inn.textContent=document.querySelector(".match-pill b")?.textContent.match(/INNINGS\s+(\d+)/)?.[1]||"1";
 const sr=document.querySelector("#strikerRunsUi"),sb=document.querySelector("#strikerBallsUi");
 if(sr)sr.textContent=strikerRuns;
 if(sb)sb.textContent=strikerBalls;
 const bo=document.querySelector("#bowlerOversUi"),br=document.querySelector("#bowlerRunsUi"),bw=document.querySelector("#bowlerWicketsUi");
 if(bo)bo.textContent=Math.floor(inningsBalls/6)+"."+(inningsBalls%6);
 if(br)br.textContent=inningsRuns;
 if(bw)bw.textContent=inningsWickets;
 const score=document.querySelector("#scoreValue"),overs=document.querySelector("#oversValue");
 if(score)score.textContent=inningsRuns+" / "+inningsWickets;
 if(overs)overs.textContent=Math.floor(inningsBalls/6)+"."+(inningsBalls%6)+" OVERS";
 const readout=document.querySelector("#inningsReadout");
 if(readout)readout.textContent=Math.floor(inningsBalls/6)+"."+ballsInOver+" OVERS · "+inningsRuns+" / "+inningsWickets;
}

function setDeliveryStatus(text){if(deliveryText)deliveryText.textContent=text;}

function resetFielders(){
 applyFieldAssignments();
 fielders.forEach(p=>{
  if(!p.userData.base)p.userData.base=p.position.clone();
  p.position.copy(p.userData.base);p.userData.target=null;p.userData.running=false;
 });
}

function moveFieldersToBall(ballPos,dt){
 fielders.forEach((p,i)=>{
  if(!p.userData.base)p.userData.base=p.position.clone();
  if(p.userData.target&&!p.userData.running)return;
  const target=ballPos.clone();target.y=.18;
  const dx=target.x-p.position.x,dz=target.z-p.position.z;
  const dist=Math.hypot(dx,dz);
  const speed=2.35+(i%3)*.28;
  if(dist>.8){
   const step=Math.min(dist,speed*dt);
   p.position.x+=(dx/dist)*step;
   p.position.z+=(dz/dist)*step;
   p.userData.running=true;
   p.rotation.y=Math.atan2(dx,dz);
  }else{
   p.userData.running=false;
  }
 });
}

function setControlMode(mode){
 controlMode=mode;
 const bowling=mode==="BOWL";
 if(bowlingControls)bowlingControls.classList.toggle("hidden",!bowling);
 if(modeToggle){modeToggle.textContent=bowling?"BAT":"BOWL";modeToggle.classList.toggle("active",bowling);}
 if(controlModeTitle)controlModeTitle.textContent=bowling?"BOWLER CONTROL":"BATTER CONTROL";
 const battingLayout=document.querySelector(".batting-layout");
 if(battingLayout){
  battingLayout.classList.toggle("hidden",bowling);
  if(!bowling){
   battingLayout.style.display="";
   battingLayout.style.visibility="visible";
  }else{
   battingLayout.style.display="none";
  }
 }
 matchControls.classList.toggle("bowling-active",bowling);
 document.querySelector(".timing-meter")?.classList.toggle("hidden",bowling);
 document.querySelector(".control-foot")?.classList.toggle("hidden",bowling);
 document.querySelectorAll("[data-shot],[data-foot]").forEach(b=>b.disabled=bowling);
 if(bowling){deliveryBtn.disabled=true;setDeliveryStatus("BOWLING · SET YOUR DELIVERY");timingLabel.textContent="CHOOSE LENGTH · LINE · PACE";}
 else {deliveryBtn.disabled=deliveryActive||shotFlightActive;setDeliveryStatus("BATTER · WAIT FOR THE BALL");timingLabel.textContent="WAIT FOR THE BALL";}
}
function resetDelivery(){
 batCanHitBall=true;deliveryAnimationRate=1;
 pitchMarkerCleared=false;
 pitchMarkerShownAt=0;
 landingPreview.visible=false;
 wicketGroups.forEach(g=>g.children.forEach(m=>{const h=m.userData.home;if(h){m.position.copy(h.position);m.rotation.copy(h.rotation);}}));
 if(controlMode==="BOWL"){
  bowlStage=0;
  bowlAimLockedState=false;
  bowlAimState.x=0;
  bowlAimState.y=0;
  document.querySelector("#bowlJoystick")?.classList.remove("locked");
  const stick=document.querySelector("#bowlJoystickStick");
  if(stick)stick.style.transform="translate(0,0)";
  bouncePoint.set(0,.24,7.8);
  deliveryBounceZ=7.8;
  deliveryLineX=0;
  landingPreview.position.set(0,.035,7.8);
  landingPreview.visible=false;
 }

 runState.active=false;runState.runs=0;runState.startedAt=0;runState.runnerProgress=0;runState.fielded=false;runState.throwActive=false;runState.deliveryCounted=false;runState.lastFrame=performance.now();
 if(runBtn){runBtn.disabled=false;runBtn.classList.remove("active","running");runBtn.textContent="RUN";}
 deliveryActive=false;shotFlightActive=false;ballHit=false;matchPhase="READY";
 ball.position.set(0,.63,6.5);ball.visible=true;
 setDeliveryStatus("BOWLER READY");ballSpeed.textContent="-- KPH";
 timingLabel.textContent="WAIT FOR THE BALL";timingBar.style.width="0%";
 matchControls.classList.remove("ball-live","contact-window");
 document.querySelectorAll("[data-shot]").forEach(b=>b.disabled=true);
 document.querySelectorAll("[data-foot]").forEach(b=>b.classList.remove("selected"));
 deliveryBtn.disabled=false;deliveryBtn.textContent="DELIVER";
 resetJoystick();selectedFoot="";selectedShot="STROKE";selectedDeliveryShot="STROKE";pendingBatAction=null;currentRecommendation=null;
 resetFielders();updateScoreboard();showRecommendations();
}

function startDelivery(){
 if(replayActive||controlMode!=="BAT")return;
 if(deliveryActive||shotFlightActive||inningsWickets>=10)return;
 deliveryActive=true;ballHit=false;shotFlightActive=false;deliveryStart=performance.now();
 deliveryDuration=3250;
 deliverySpeed=118+Math.random()*29;
 deliveryLine=["ON_STUMPS","OUTSIDE_OFF","LEG"][Math.floor(Math.random()*3)];
 deliveryLength=["FULL","GOOD","SHORT"][Math.floor(Math.random()*3)];
 deliveryLineX = deliveryLine === "OUTSIDE_OFF" ? -0.72 : (deliveryLine === "LEG" ? 0.72 : 0);
 deliveryBounceZ=deliveryLength==="FULL"?6.65:deliveryLength==="GOOD"?7.8:9.0;
 pitchMarkerCleared=false;
 pitchMarkerShownAt=0;
 landingPreview.position.set(deliveryLineX,0.035,deliveryBounceZ);
 landingPreview.visible=false;
 if(wasmEngine){
  wasmEngine.reset();
  wasmEngine.startDelivery(deliverySpeed,deliveryLineX,deliveryLength==="FULL" ? 0.42 : deliveryLength==="GOOD" ? 0.55 : .72,
    (Math.random()*2-1)*.55,(Math.random()*2-1)*.7,deliveryLength==="FULL"?1.05:deliveryLength==="GOOD"?1:.88);
 }
 landingPreview.visible=true;
 matchPhase="PREVIEW";
 setDeliveryStatus("LANDING SPOT");
 ballSpeed.textContent=Math.round(deliverySpeed)+" KPH";
 deliveryBtn.disabled=true;
 document.querySelectorAll("[data-shot]").forEach(b=>b.disabled=true);
 matchControls.classList.add("ball-live");showRecommendations();
}

function chooseRecommendationSet(){
 const options=[];
 if(deliveryLength==="FULL"){
  options.push({dir:{x:0,y:.82},shot:"STROKE",foot:"FRONT"});
  if(deliveryLine==="OUTSIDE_OFF")options.push({dir:{x:-.72,y:.36},shot:"STROKE",foot:"FRONT"});
 }
 if(deliveryLength==="GOOD"){
  options.push({dir:{x:0,y:.58},shot:"PUSH",foot:"FRONT"});
  if(deliveryLine==="OUTSIDE_OFF")options.push({dir:{x:-.78,y:.12},shot:"STROKE",foot:"BACK"});
 }
 if(deliveryLength==="SHORT"){
  options.push({dir:{x:.70,y:.05},shot:"STROKE",foot:"BACK"});
  if(deliveryLine==="LEG")options.push({dir:{x:.82,y:.15},shot:"LOFT",foot:"BACK"});
 }
 if(deliveryLine==="LEG"&&deliveryLength!=="SHORT")options.push({dir:{x:.82,y:.22},shot:"LOFT",foot:"FRONT"});
 if(!options.length)options.push({dir:{x:0,y:.6},shot:"STROKE",foot:"FRONT"});
 return options;
}

function footChoice(foot){
 if(!deliveryActive||matchPhase!=="FLIGHT"||ballHit)return;
 selectedFoot=foot;
 document.querySelectorAll("[data-foot]").forEach(b=>b.classList.toggle("selected",b.dataset.foot===foot));
}
document.querySelectorAll("[data-foot]").forEach(b=>b.addEventListener("click",()=>footChoice(b.dataset.foot)));

function calculateTiming(elapsed){
 // The real contact point is the instant just around the bowler's release.
 // 0ms = perfect release timing. Early and late contacts still work, but lose power.
 const releaseContactMs=2425;
 const contactWindowMs=575;
 return Math.max(0,1-Math.abs(elapsed-releaseContactMs)/contactWindowMs);
}
function timingQuality(elapsed){
 const delta=elapsed-2425;
 const abs=Math.abs(delta);
 if(abs<=75)return "PERFECT";
 if(abs<=190)return delta<0?"EARLY · GOOD":"LATE · GOOD";
 if(abs<=380)return delta<0?"EARLY":"LATE";
 return delta<0?"TOO EARLY":"TOO LATE";
}
function timingPower(elapsed){
 const releaseContactMs=2425;
 const contactWindowMs=575;
 return Math.max(0,1-Math.abs(elapsed-releaseContactMs)/contactWindowMs);
}

function resolveWicket(reason){
 triggerActionReplay("WICKET · "+reason);
 deliveryActive=false;shotFlightActive=false;ballHit=true;
 inningsWickets++;inningsBalls++;ballsInOver=inningsBalls%6;strikerBalls++;
 lastOutcome="WICKET · "+reason;setDeliveryStatus("WICKET · "+reason);
 timingLabel.textContent=reason;showToast("WICKET · "+reason);updateScoreboard();
 setTimeout(()=>{
  if(inningsWickets>=10)finishInningsAndSwitch();
  else resetDelivery();
 },2100);
}

function finishInningsAndSwitch(){
 const completedInningsRuns=inningsRuns;
 const completedInningsWickets=inningsWickets;
 const nextMode=controlMode==="BAT"?"BOWL":"BAT";
 inningsRuns=0;inningsBalls=0;inningsWickets=0;ballsInOver=0;strikerRuns=0;strikerBalls=0;
 matchPhase="READY";
 lastOutcome="";
 runState.active=false;runState.runs=0;runState.throwActive=false;runState.deliveryCounted=false;
 document.querySelector(".match-pill b").textContent="INNINGS 2 · "+(nextMode==="BAT"?homeTeam:awayTeam);
 hudTeam.textContent=nextMode==="BAT"?homeTeam.toUpperCase():awayTeam.toUpperCase();
 updateScoreboard();
 resetFielders();
 resetDelivery();
 setControlMode(nextMode);
 showToast("INNINGS 1 COMPLETE · "+completedInningsRuns+" / "+completedInningsWickets);
 setTimeout(()=>{
  if(nextMode==="BAT"){
   showToast("YOUR INNINGS · BAT NOW");
   setTimeout(()=>{if(matchPhase==="READY"&&inningsWickets<10)startDelivery()},900);
  }else{
   showToast("YOUR INNINGS · BOWL NOW");
  }
 },1250);
}

function resolveDot(){
 deliveryActive=false;shotFlightActive=false;ballHit=false;
 inningsBalls++;ballsInOver=inningsBalls%6;strikerBalls++;
 lastOutcome="DOT BALL";setDeliveryStatus("DOT BALL");showToast("DOT BALL");updateScoreboard();
 setTimeout(()=>{resetDelivery();setTimeout(()=>{if(matchPhase==="READY")startDelivery()},700)},650);
}

function showBoundaryBanner(runs){
 const text=runs===6?"6 RUNS":"4 RUNS";
 let banner=document.querySelector("#boundaryBanner");
 if(!banner){
  banner=document.createElement("div");
  banner.id="boundaryBanner";
  banner.className="boundary-banner";
  document.body.appendChild(banner);
 }
 banner.textContent=text;
 banner.classList.remove("show");
 void banner.offsetWidth;
 banner.classList.add("show");
 clearTimeout(window.__boundaryBannerTimer);
 window.__boundaryBannerTimer=setTimeout(()=>banner.classList.remove("show"),1250);
}
function finishRuns(runs,label){
 if(runs>=4)triggerActionReplay(label||"BOUNDARY");
 inningsRuns+=runs;inningsBalls++;ballsInOver=inningsBalls%6;strikerRuns+=runs;strikerBalls++;
 lastOutcome=label||String(runs)+" RUNS";updateScoreboard();
 if(runs>=4)showBoundaryBanner(runs);
 if(label)showToast(label);
}
function finishRunningDelivery(runs,label=""){
 if(runState.deliveryCounted)return;
 runState.deliveryCounted=true;
 inningsRuns+=runs;
 inningsBalls++;
 ballsInOver=inningsBalls%6;
 strikerRuns+=runs;
 strikerBalls++;
 lastOutcome=label||String(runs)+" RUNS";
 updateScoreboard();
 if(label)showToast(label);
 runState.active=false;runState.throwActive=false;shotFlightActive=false;ballHit=false;
 if(runBtn){runBtn.classList.remove("active","running");runBtn.textContent="RUN";}
 setTimeout(()=>{resetDelivery();setTimeout(()=>{if(matchPhase==="READY"&&inningsWickets<10)startDelivery()},700)},750);
}

const BOUNDARY_X_RADIUS=43.5;
const BOUNDARY_Z_RADIUS=43.5*.82;
function getFieldSector(x,z){
 const angle=Math.atan2(x,-z);
 const index=(Math.round((angle/(Math.PI*2))*8)+8)%8;
 return ["STRAIGHT","COVER","OFF_SIDE","THIRD_MAN","FINE_LEG","MID_WICKET","LEG_SIDE","SQUARE_LEG"][index];
}
function getBoundaryMetrics(position){
 const nx=position.x/BOUNDARY_X_RADIUS;
 const nz=position.z/BOUNDARY_Z_RADIUS;
 return {distance:Math.hypot(nx,nz),touchingGround:position.y<=.34};
}
function checkBoundaryCollision(position,isAerial){
 const metrics=getBoundaryMetrics(position);
 if(metrics.distance<1)return null;
 // A ball that crosses the rope while still airborne is a six; one that
 // reaches the perimeter on/near the ground is a four.
 if(isAerial && position.y>.34)return {runs:6,label:"SIX! · OVER THE ROPE",sector:getFieldSector(position.x,position.z)};
 return {runs:4,label:"FOUR · BOUNDARY",sector:getFieldSector(position.x,position.z)};
}

function resolveBallFlight(origin,direction,exitSpeed,shot,quality){
 shotFlightActive=true;ballHit=true;deliveryActive=false;
 const startPos=origin.clone(),dir=direction.clone().normalize(),horizontal=new THREE.Vector3(dir.x,0,dir.z).normalize();
 const isLoft=shot==="LOFT";
 const distance=isLoft?16+exitSpeed*.28:8+exitSpeed*.20;
 const target=startPos.clone().add(horizontal.multiplyScalar(distance));
 target.y=isLoft?2.4:.28;
 const flightStart=performance.now();
 const flightDuration=Math.min(2400,850+exitSpeed*8);
 const highCatch=isLoft&&quality<.72;
 let resolved=false,pickup=false,nearestIndex=-1,nearestDist=999;

 fielders.forEach((f,i)=>{
  const d=Math.hypot(f.position.x-target.x,f.position.z-target.z);
  if(d<nearestDist){nearestDist=d;nearestIndex=i;}
 });
 const fielder=nearestIndex>=0?fielders[nearestIndex]:null;
 if(fielder)fielder.userData.target=target.clone();

 // A real hit gives the batter the decision to run. The button does NOT exist before contact.
 if(runBtn){runBtn.disabled=false;runBtn.classList.add("active");runBtn.textContent="RUN";}

 function endDot(){
  if(resolved)return;
  resolved=true;pickup=true;shotFlightActive=false;
  if(runBtn){runBtn.classList.remove("active","running");runBtn.textContent="RUN";}
  inningsBalls++;ballsInOver=inningsBalls%6;strikerBalls++;
  lastOutcome="DOT BALL";setDeliveryStatus("FIELDING · DOT BALL");showToast("DOT BALL");updateScoreboard();
  setTimeout(()=>{resetDelivery();setTimeout(()=>{if(matchPhase==="READY")startDelivery()},650)},700);
 }

 function beginThrow(now){
  if(runState.throwActive||resolved)return;
  runState.fielded=true;
  runState.throwActive=true;
  if(runBtn){runBtn.disabled=true;runBtn.classList.remove("active","running");runBtn.textContent="FIELDER HAS BALL";}
  runState.throwStart=now;
  const randomThrowDelay=180+Math.random()*520;
  const throwTime=randomThrowDelay+520+Math.min(240,Math.max(0,Math.hypot(fielder.position.x-target.x,fielder.position.z-target.z)*45));
  runState.throwEnd=now+throwTime;
  runState.throwTargetZ=runState.runs%2===1?-12.2:10.4;
  setDeliveryStatus("FIELDER · THROWING");
  if(runBtn)runBtn.textContent="RUN "+(runState.runs+1);
 }

 function resolveRunOut(){
  if(resolved)return;
  resolved=true;runState.throwActive=false;shotFlightActive=false;ballHit=true;
  if(runBtn){runBtn.classList.remove("active","running");runBtn.textContent="RUN";}
  inningsWickets++;inningsBalls++;ballsInOver=inningsBalls%6;strikerBalls++;
  const safeRuns=runState.runs;
  inningsRuns+=safeRuns;
  strikerRuns+=safeRuns;
  lastOutcome="RUN OUT · "+safeRuns+" RUN"+(safeRuns===1?"":"S");
  updateScoreboard();setDeliveryStatus("RUN OUT");showToast("RUN OUT · "+safeRuns+" RUN"+(safeRuns===1?"":"S"));
  setTimeout(()=>{
   if(inningsWickets>=10)finishInningsAndSwitch();
   else resetDelivery();
  },1100);
 }

 function animateShot(now){
  if(!shotFlightActive)return;
  const p=Math.min(1,Math.max(0,(now-flightStart)/flightDuration));
  const eased=p*p*(3-2*p);

  if(!pickup){
   if(p<1){
    ball.position.lerpVectors(startPos,target,eased);
    ball.position.y=isLoft
      ?startPos.y+(target.y-startPos.y)*eased+3.4*Math.sin(Math.PI*eased)
      :Math.max(.28,startPos.y+(target.y-startPos.y)*eased+.7*Math.sin(Math.PI*eased));
   }else{
    ball.position.copy(target);ball.position.y=.28;
   }
   ball.rotation.x+=.28;ball.rotation.y+=.34;

   // Boundary resolves before anyone can run after a boundary.
   const boundaryResult=checkBoundaryCollision(ball.position,isLoft);
   if(!resolved&&boundaryResult){
    resolved=true;shotFlightActive=false;
    if(runBtn)runBtn.classList.remove("active","running");
    finishRuns(boundaryResult.runs,boundaryResult.label);
    setDeliveryStatus(boundaryResult.label+" · "+boundaryResult.sector);
    setTimeout(()=>{resetDelivery();setTimeout(()=>{if(matchPhase==="READY")startDelivery()},700)},850);
    return;
   }

   moveFieldersToBall(ball.position,.016);
   if(!runState.fielded&&fielder){
    const fd=Math.hypot(fielder.position.x-ball.position.x,fielder.position.z-ball.position.z);
    if(fd<.1){
     pickup=true;
     ball.position.copy(fielder.position);ball.position.y=.72;
     if(runState.active)beginThrow(now);
     else endDot();
    }
   }

   if(!resolved&&highCatch&&p>.48&&p<.90&&fielder){
    const fd=Math.hypot(fielder.position.x-ball.position.x,fielder.position.z-ball.position.z);
    if(fd<1.55){
     resolved=true;shotFlightActive=false;
     if(runBtn)runBtn.classList.remove("active","running");
     resolveWicket("CAUGHT");return;
    }
   }

   if(p>=1&&!runState.fielded){
    // Ball has reached its landing point; keep it there while the fielder closes in.
    ball.position.copy(target);ball.position.y=.28;
   }
  }else{
   // Ball is held by the fielder until the throw animation begins/ends.
   if(fielder){
    if(!runState.throwActive){
     ball.position.copy(fielder.position);ball.position.y=.72;
    }else{
     const q=Math.min(1,Math.max(0,(now-runState.throwStart)/(runState.throwEnd-runState.throwStart)));
     const sx=fielder.position.x,sz=fielder.position.z;
     const tz=runState.throwTargetZ;
     ball.position.x=sx*(1-q);
     ball.position.z=sz*(1-q)+tz*q;
     ball.position.y=.72+Math.sin(Math.PI*q)*1.2;
     if(q>=1){
      ball.position.set(0,.95,tz);
      // If the runner has not reached the wicket, the throw beats them.
      const runnerZ=batter.position.z;
      const targetZ=tz;
      const distanceToWicket=Math.abs(runnerZ-targetZ);
      if(runState.active&&distanceToWicket>1.0){resolveRunOut();return;}
      if(runState.active&&distanceToWicket<=1.0){
       runState.runs=1;
       runState.active=false;
       runState.throwActive=false;
       setDeliveryStatus("1 RUN · SAFE");
       finishRunningDelivery(1,"1 RUN · SAFE");
       return;
      }
     }
    }
   }
  }

  // Animate both batters between the wickets at a believable running pace.
  if(runState.active&&!runState.fielded){
   const runDistance=22.6;
   const runSpeed=5.0;
   runState.runnerProgress=Math.min(1,runState.runnerProgress+(runSpeed*.016)/runDistance);
   const q=runState.runnerProgress;
   batter.position.z=10.4+(-22.6*q);
   nonStriker.position.z=-12.2+(22.6*q);
   batter.rotation.y=Math.PI+(q<.5?0:Math.PI);
   nonStriker.rotation.y=q<.5?0:Math.PI;
   if(q>=1){
    runState.runs++;
    runState.runnerProgress=0;
    const oldB=batter.position.z;batter.position.z=10.4;nonStriker.position.z=-12.2;
    setDeliveryStatus(runState.runs+" RUN · SAFE");
    runState.active=false;
    finishRunningDelivery(1,"1 RUN · SAFE");
    return;
   }
  }

  requestAnimationFrame(animateShot);
 }
 requestAnimationFrame(animateShot);
}

function resolvedRunState(){return !shotFlightActive||runState.deliveryCounted||runState.throwActive;}

function playShot(shot){
 if(replayActive||!deliveryActive||ballHit)return;
 selectedShot=shot;
 const elapsed=performance.now()-deliveryStart;

 // A valid batting input always makes contact. Timing controls
 // contact quality and power instead of deciding whether contact happens.
 const timing=timingPower(elapsed);
 const quality=timingQuality(elapsed);
 const foot=selectedFoot||"";
 const specialAllowed=deliveryLength==="SHORT"&&deliveryLine!=="ON_STUMPS";
 if(foot==="LEAVE"){
  if(deliveryLine==="OUTSIDE_OFF"&&deliveryLength!=="FULL"){resolveDot();return;}
  resolveWicket("LEAVE · BOWLED");return;
 }
 if(foot==="SPECIAL"&&!specialAllowed){resolveWicket("SPECIAL · WRONG DELIVERY");return;}
 if(timing<=0){
   const weakPower=.08;
   const launch=shot==="LOFT"?10:shot==="STROKE"?4:2;
   const weakDir=new THREE.Vector3(Math.max(-1,Math.min(1,hitDirection.x)),Math.sin(launch*Math.PI/180),-Math.max(-1,Math.min(1,hitDirection.y))).normalize();
   setDeliveryStatus("CONTACT · VERY EARLY/LATE · WEAK");
   showToast("WEAK CONTACT");
   resolveBallFlight(ball.position.clone(),weakDir,8,shot,weakPower);
   return;
 }
 const shotMultiplier=shot==="LOFT"?1.12:shot==="STROKE"?1:.82;
 // Perfect timing gets full power; every millisecond away from release reduces power.
 const power=shotMultiplier*(0.48+0.52*timing);
 const exitSpeed=20+deliverySpeed*.18+38*timing*power;
 timingLabel.textContent="TIMING · "+quality;timingBar.style.width=Math.round(timing*100)+"%";
 if((quality==="LATE"||quality==="OK"&&deliveryLine==="OUTSIDE_OFF")&&Math.random()<.34){resolveWicket("EDGED");return;}
 const launch=shot==="LOFT"?48:shot==="STROKE"?24:10;
 // Map the batting joystick directly into the cricket field:
 // up = straight down the ground, down = behind the batter,
 // left/right = off-side/leg-side. The old system only used X/yaw,
 // so left/right still looked almost straight and backward shots were impossible.
 const aimX=Math.max(-1,Math.min(1,hitDirection.x));
 const aimForward=Math.max(-1,Math.min(1,hitDirection.y));
 let groundX=aimX;
 let groundZ=-aimForward;
 if(Math.hypot(groundX,groundZ)<.12){groundZ=-1;}
 const groundLen=Math.hypot(groundX,groundZ)||1;
 groundX/=groundLen;groundZ/=groundLen;
 const flightDirection=new THREE.Vector3(groundX,Math.sin(launch*Math.PI/180),groundZ);
 setDeliveryStatus("SHOT · "+quality);showToast(shot+" · "+quality);
 resolveBallFlight(ball.position.clone(),flightDirection,exitSpeed,shot,timing);
}


if(runBtn)runBtn.addEventListener("click",()=>{if(!replayActive)startRun();});



function openCoinToss(){
 coinToss.classList.add("open");tossPrompt.textContent="Choose HEADS or TAILS.";tossResult.textContent="WAITING FOR CALL";
 tossResult.classList.remove("winner");continueFromToss.disabled=true;tossComplete=false;tossDecisionMade=false;
 tossDecision?.classList.add("hidden");tossChoices.forEach(b=>b.disabled=false);
}
function closeCoinToss(){coinToss.classList.remove("open")}

tossChoices.forEach(btn=>btn.addEventListener("click",()=>{
 if(tossComplete)return;
 tossChoices.forEach(b=>b.disabled=true);
 const call=btn.dataset.call,outcome=Math.random()<.5?"HEADS":"TAILS";
 tossWinner=outcome===call?homeTeam:awayTeam;
 coin.classList.remove("flipping");void coin.offsetWidth;coin.classList.add("flipping");
 tossPrompt.textContent="THE COIN IS IN THE AIR...";
 setTimeout(()=>{
  tossResult.textContent=outcome+" · "+tossWinner.toUpperCase()+" WON THE TOSS";
  tossResult.classList.add("winner");
  tossComplete=true;
  if(tossWinner===homeTeam){
   tossPrompt.textContent="YOU WON THE TOSS — CHOOSE WHAT TO DO.";
   tossDecisionText.textContent="YOU WON THE TOSS";
   tossDecision.classList.remove("hidden");
   continueFromToss.disabled=true;
  }else{
   const aiBatsFirst=Math.random()<.5;
   battingFirst=aiBatsFirst?awayTeam:homeTeam;
   tossDecisionMade=true;
   tossDecision.classList.add("hidden");
   tossResult.textContent=awayTeam.toUpperCase()+" WON THE TOSS · "+(aiBatsFirst?"BAT FIRST":"FIELD FIRST");
   continueFromToss.disabled=false;
  }
 },1150);
}));

function chooseTossDecision(batFirst){
 if(!tossComplete||tossDecisionMade||tossWinner!==homeTeam)return;
 tossDecisionMade=true;
 battingFirst=batFirst?homeTeam:awayTeam;
 tossDecision.classList.add("hidden");
 tossResult.textContent="YOU WON THE TOSS · "+(batFirst?"BAT FIRST":"FIELD FIRST");
 continueFromToss.disabled=false;
}
chooseBat.addEventListener("click",()=>chooseTossDecision(true));
chooseField.addEventListener("click",()=>chooseTossDecision(false));

function finishTossSetup(){
 closeCoinToss();
 cover.classList.add("hidden");
 hud.classList.remove("hidden");
 matchControls.classList.remove("hidden");
 matchControls.style.display="block";
 matchControls.style.visibility="visible";
 matchControls.style.opacity="1";
 started=true;
 inningsRuns=0;inningsBalls=0;inningsWickets=0;strikerRuns=0;strikerBalls=0;ballsInOver=0;
 totalOvers=selectedFormat==="T20"?20:selectedFormat==="ODI"?50:9999;
 hudTeam.textContent=battingFirst.toUpperCase();
 document.querySelector(".match-pill b").textContent="INNINGS 1 · "+battingFirst.toUpperCase();
 setDefaultMatchCamera();resetFielders();resetDelivery();
 if(battingFirst===homeTeam){
  setControlMode("BAT");
  showToast("YOU BAT FIRST · BOWLER RUN-UP");
  setTimeout(()=>{if(matchPhase==="READY"&&inningsWickets<10)startDelivery()},900);
 }else{
  setControlMode("BOWL");
  showToast("YOU FIELD FIRST · YOU BOWL");
 }
}

continueFromToss.addEventListener("click",()=>{
 if(!tossDecisionMade)return;
 finishTossSetup();
});

deliveryBtn.addEventListener("click",startDelivery);
if(modeToggle)modeToggle.addEventListener("click",()=>setControlMode(controlMode==="BOWL"?"BAT":"BOWL"));
if(bowlDeliver)bowlDeliver.addEventListener("click",startBowlingDelivery);
document.querySelectorAll("[data-bowl-length]").forEach(b=>b.addEventListener("click",()=>{bowlLength=b.dataset.bowlLength;document.querySelectorAll("[data-bowl-length]").forEach(x=>x.classList.toggle("active",x===b));}));
document.querySelectorAll("[data-bowl-line]").forEach(b=>b.addEventListener("click",()=>{bowlLine=b.dataset.bowlLine;document.querySelectorAll("[data-bowl-line]").forEach(x=>x.classList.toggle("active",x===b));}));
document.querySelectorAll("[data-bowl-pace]").forEach(b=>b.addEventListener("click",()=>{bowlPace=b.dataset.bowlPace;document.querySelectorAll("[data-bowl-pace]").forEach(x=>x.classList.toggle("active",x===b));}));
let wasmLastTime=performance.now();
function liveBallLoop(now){
 const dt=Number.isFinite(now)?Math.min(Math.max((now-wasmLastTime)/1000,0),.033):0;
 wasmLastTime=now;
 if(deliveryActive && Number.isFinite(now)){
  if(controlMode==="BOWL"){updateBowlingDelivery(now);}
  else if(wasmPhysicsActive && matchPhase==="FLIGHT"){
   wasmEngine.update(dt);
   const p=wasmEngine.position();
   ball.position.set(p.x,p.y,p.z);
   const s=wasmEngine.spin();
   ball.rotation.x+=s.x*dt;
   ball.rotation.y+=s.y*dt;
   ball.rotation.z+=s.z*dt;
   if(!wasmEngine.active())resolveDot();
  }else{
   updateBatDelivery(now);
  }
 }
 requestAnimationFrame(liveBallLoop);
}
requestAnimationFrame(liveBallLoop);

startMatchBtn.addEventListener("click",e=>{
 e.preventDefault();
 preMatch.classList.remove("open");
 matchControls.classList.add("hidden");
 closeCoinToss();
 // Open the toss immediately. The old delayed callback could leave the match
 // visually running while matchControls was still hidden on iPad/Split View.
 requestAnimationFrame(()=>openCoinToss());
});



/* CONSOLIDATED GAMEPLAY CLEANUP */
let selectedDeliveryShot=selectedShot||"STROKE",pendingBatAction=null,swingAnimation=null,wicketPresentation=null,catchCameraUntil=0,batRagdoll=null,contactEdgeToSlips=false;
const SHOT_POWER_MODIFIERS={LOFT:1.8,STROKE:1.2,PUSH:.6};
let batCanHitBall=true;
let completedRuns=0;
let deliveryAnimationRate=1;
let bowlAimState={x:0,y:0},bowlAimLockedState=false,bowlTypeState="STRAIGHT",bowlStage=0;
const DEFAULT_BATTER_POS=new THREE.Vector3(.8,.18,10.4),DEFAULT_NONSTRIKER_POS=new THREE.Vector3(-.8,.18,-12.2);

function setDefaultMatchCamera(){setCamera(controlMode==="BOWL"?"bowler":"batter");}
const __cleanBaseSetControlMode=setControlMode;
setControlMode=function(mode){
 __cleanBaseSetControlMode(mode);setDefaultMatchCamera();
 if(mode==="BOWL"){
 bowlAimLockedState=false;bowlAimState={x:0,y:0};bowlTypeState="STRAIGHT";bowlStage=0;
 document.querySelectorAll("[data-bowl-type]").forEach(b=>b.classList.toggle("active",b.dataset.bowlType==="STRAIGHT"));
}
 refreshCleanBowlingUI();
};

function updateButtonHighlights(newIntent){
 document.querySelectorAll("[data-shot]").forEach(b=>{
  const active=b.dataset.shot===newIntent;
  b.classList.toggle("selected",active);
  b.setAttribute("aria-pressed",active?"true":"false");
 });
}
function handleIntentInput(newIntent){
 if(replayActive||controlMode!=="BAT")return;
 selectedDeliveryShot=newIntent;
 selectedShot=newIntent;
 if(pendingBatAction&&!batCanHitBall)pendingBatAction.shot=newIntent;
 updateButtonHighlights(newIntent);
 const power=SHOT_POWER_MODIFIERS[newIntent]||1.2;
 const pv=document.querySelector("#powerValue");
 if(pv)pv.textContent=Math.round(power/1.8*100)+"%";
 setDeliveryStatus("SHOT INTENT · "+newIntent+" · "+power.toFixed(1)+"× POWER");
}
function chooseShotOnly(shot){handleIntentInput(shot);}
document.querySelectorAll("[data-shot]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();chooseShotOnly(b.dataset.shot);}));

function startSwingAnimation(foot,shot){
 const now=performance.now();
 swingAnimation={start:now,foot,shot,contactAt:now+520};
}
function updateSwingAnimation(now){
 if(!swingAnimation)return;
 const elapsed=now-swingAnimation.start;
 const p=Math.min(1,Math.max(0,elapsed/760));
 const eased=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
 const foot=swingAnimation.foot;
 const shot=swingAnimation.shot;
 // Load into a compact stance, then rotate through the ball, then recover.
 const side=hitDirection.x<0?-1:1;
 const baseY=foot==="BACK"?Math.PI:Math.PI;
 const swingArc=shot==="LOFT"?.92:shot==="PUSH"?.42:.68;
 const contactPhase=Math.min(1,Math.max(0,(elapsed-180)/260));
 const followPhase=Math.min(1,Math.max(0,(elapsed-430)/190));
 const contactEase=contactPhase*contactPhase*(3-2*contactPhase);
 const followEase=followPhase*followPhase*(3-2*followPhase);
 batter.rotation.y=baseY + side*swingArc*contactEase*(1-.22*followEase);
 batter.rotation.x=-.06*contactEase + .16*followEase;
 batter.rotation.z=side*.10*contactEase;
 batter.position.y=DEFAULT_BATTER_POS.y + .035*Math.sin(Math.PI*p);
 if(foot==="BACK")batter.position.x=DEFAULT_BATTER_POS.x+side*.055*contactEase;
 if(foot==="FRONT")batter.position.x=DEFAULT_BATTER_POS.x-side*.035*contactEase;
 if(p>=1){
  batter.rotation.set(0,Math.PI,0);
  batter.position.copy(DEFAULT_BATTER_POS);
  swingAnimation=null;
 }
}
function animateWicketPresentation(now){
 if(!wicketPresentation)return;
 const elapsed=(now-wicketPresentation.start)/1000;
 const w=wicketPresentation.group;
 if(batRagdoll){
  const bp=Math.min(1,(now-batRagdoll.start)/1300),bq=bp*bp*(3-2*bp);
  batter.rotation.z=batRagdoll.baseRotZ+batRagdoll.dir*bq*1.15;
  batter.rotation.x=batRagdoll.baseRotX-bq*.35;
  batter.position.y=Math.max(.18,batRagdoll.baseY-bq*.22);
  if(bp>=1)batRagdoll=null;
 }
 if(w){
  w.children.forEach((m,i)=>{
   const v=wicketPresentation.velocities[i];
   const a=wicketPresentation.angular[i];
   if(!v||!a)return;
   v.y-=5.8*.016;
   m.position.x+=v.x*.016;m.position.y=Math.max(.08,m.position.y+v.y*.016);m.position.z+=v.z*.016;
   m.rotation.x+=a.x*.016;m.rotation.y+=a.y*.016;m.rotation.z+=a.z*.016;
  });
 }
 if(elapsed>=1.9)wicketPresentation=null;
}
function startWicketPresentation(reason){
 const w=wicketGroups[1]||wicketGroups[0];if(!w)return;
 wicketPresentation={
  start:performance.now(),group:w,
  velocities:w.children.map((m,i)=>new THREE.Vector3((i%2?-1:1)*(.55+.22*i),2.2+.55*(i%2),.12*(i-2))),
  angular:w.children.map((m,i)=>new THREE.Vector3((i%2?-1:1)*(1.6+i*.35),(i%2?1:-1)*1.1,(i%2?-1:1)*.8))
 };
 if(String(reason).includes("BOWLED")||String(reason).includes("LBW")){batRagdoll={start:performance.now(),baseRotZ:batter.rotation.z,baseRotX:batter.rotation.x,baseY:batter.position.y,dir:batter.position.x>=0?1:-1};}
 showToast(reason==="BOWLED"?"WICKETS BROKEN":"WICKET · "+reason);
}
function showSlowDRS(reason,done){
 let p=document.querySelector("#drsReview");
 if(!p){
  p=document.createElement("div");p.id="drsReview";
  p.innerHTML="<b>DRS REVIEW</b><span>THIRD UMPIRE · SLOW MOTION</span><i>PITCHING · CHECKING</i><i>IMPACT · CHECKING</i><i>WICKET · CHECKING</i><strong>DECISION · REVIEWING</strong>";
  Object.assign(p.style,{position:"fixed",left:"50%",top:"14%",transform:"translateX(-50%)",zIndex:"9500000",display:"none",flexDirection:"column",gap:"8px",padding:"16px 24px",minWidth:"290px",textAlign:"center",border:"2px solid #f5c400",borderRadius:"14px",background:"rgba(3,16,10,.97)",color:"#fff",fontFamily:"system-ui,sans-serif"});
  document.body.appendChild(p);
 }
 const previousCamera=cameraMode;
 const previousPosition=camera.position.clone();
 const previousTarget=new THREE.Vector3(0,1.5,4);
 cameraMode="drs";
 camera.position.set(7.5,4.8,8.5);
 camera.lookAt(0,.5,7.8);
 p.style.display="flex";
 const rows=p.querySelectorAll("i"),d=p.querySelector("strong");
 let drsLine=document.querySelector("#drsPathLine");
 if(!drsLine){
  drsLine=document.createElement("div");drsLine.id="drsPathLine";
  Object.assign(drsLine.style,{position:"fixed",left:"50%",top:"50%",width:"4px",height:"120px",background:"#f5c400",boxShadow:"0 0 18px #f5c400",transform:"translate(-50%,-50%) scaleY(.1)",transformOrigin:"bottom",zIndex:"9500001",opacity:"0",transition:"transform 900ms ease,opacity 300ms ease"});
  document.body.appendChild(drsLine);
 }
 drsLine.style.opacity="1";drsLine.style.transform="translate(-50%,-50%) scaleY(.1)";
 d.textContent="DECISION · REVIEWING";
 rows[0].textContent="PITCHING · CHECKING";
 rows[1].textContent="IMPACT · CHECKING";
 rows[2].textContent="WICKET · CHECKING";
 showToast("DRS REVIEW · THIRD UMPIRE");
 clearTimeout(window.__drs1);clearTimeout(window.__drs2);clearTimeout(window.__drs3);clearTimeout(window.__drs4);clearTimeout(window.__drs5);
 window.__drs1=setTimeout(()=>{camera.position.set(3.8,2.8,9.2);camera.lookAt(0,.35,7.8);rows[0].textContent="PITCHING · IN LINE";},1800);
 window.__drs2=setTimeout(()=>{camera.position.set(2.6,2.2,10.8);camera.lookAt(0,.75,9.8);rows[1].textContent="IMPACT · IN LINE";drsLine.style.transform="translate(-50%,-50%) scaleY(.55)";},3800);
 window.__drs3=setTimeout(()=>{camera.position.set(2.2,2.0,11.8);camera.lookAt(0,1.0,11.2);rows[2].textContent="WICKET · "+(reason==="LBW"?"HITTING":"CHECKING");drsLine.style.transform="translate(-50%,-50%) scaleY(1)";},5800);
 window.__drs4=setTimeout(()=>{d.textContent=reason==="LBW"?"DECISION · OUT":"DECISION · "+reason;},7600);
 window.__drs5=setTimeout(()=>{
  p.style.display="none";drsLine.style.opacity="0";
  if(previousCamera==="catch"){cameraMode="catch";}else{cameraMode=previousCamera;camera.position.copy(previousPosition);}
  if(cameraMode!=="catch")camera.lookAt(previousTarget);
  done&&done();
 },9000);
}
function showCatchCamera(f){
 if(!f)return;catchCameraUntil=performance.now()+3200;cameraMode="catch";camera.position.set(f.position.x+4.8,4.2,f.position.z+5.8);camera.lookAt(f.position.x,.95,f.position.z);document.querySelectorAll(".camera").forEach(b=>b.classList.remove("active"));setDeliveryStatus("CATCH · CAMERA");
}
function updateCatchCamera(now){if(cameraMode==="drs")return;if(cameraMode!=="catch")return;const f=fielders.find(x=>x.userData.target)||fielders[0];if(f)camera.lookAt(f.position.x,.95,f.position.z);if(now>=catchCameraUntil)setDefaultMatchCamera();}

function executeBatAction(foot){
 if(controlMode!=="BAT"||!deliveryActive||ballHit)return;
 const elapsed=performance.now()-deliveryStart;
 // Any swing during the playable delivery window is valid contact intent.
 // Timing now controls quality/power; it does not decide whether the bat connects.
 if(elapsed<3800||elapsed>7600)return;
 selectedFoot=foot;
 pendingBatAction={foot,shot:selectedDeliveryShot,requestedAt:performance.now()};
 startSwingAnimation(foot,selectedDeliveryShot);
 timingLabel.textContent="SWING · "+foot;
 setDeliveryStatus(foot==="LEAVE"?"LEAVE · WATCH THE BALL":"SWING · TIMING SET");
}
document.querySelectorAll("[data-foot]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();executeBatAction(b.dataset.foot);}));

function updateBatDelivery(now){
 if(!deliveryActive)return;
 const elapsed=now-deliveryStart,contactMs=6800;
 if(elapsed<700){matchPhase="PREVIEW";bowler.position.copy(runUpStart);ball.position.copy(bowlerRelease).add(new THREE.Vector3(0,.05,0));setDeliveryStatus("LANDING SPOT");timingLabel.textContent="READ THE LANDING SPOT";document.querySelectorAll("[data-foot]").forEach(b=>b.disabled=true);return;}
 if(elapsed<5000){matchPhase="RUN_UP";const p=(elapsed-850)/4150,e=p*p*(3-2*p);bowler.position.lerpVectors(runUpStart,bowlerRelease,e);bowler.rotation.z=Math.sin(p*Math.PI)*.06;setDeliveryStatus("BOWLER RUN-UP");timingLabel.textContent="GET READY";document.querySelectorAll("[data-foot]").forEach(b=>b.disabled=true);return;}
 if(elapsed<5350){matchPhase="RELEASE";const p=(elapsed-5000)/350;bowler.position.z=-16-p*.8;ball.position.set(0,1.95,-16);if(!pitchMarkerShownAt)calculateAndShowPitchMarker();setDeliveryStatus("RELEASE · BALL AWAY");document.querySelectorAll("[data-foot]").forEach(b=>b.disabled=false);return;}
 matchPhase="FLIGHT";const fp=Math.min(1,Math.max(0,(elapsed-5350)/1450)),bounceT=.58;bowler.rotation.x=.08;bowler.rotation.z=0;let z,y;
 if(fp<=bounceT){const q=fp/bounceT;z=releasePoint.z+(deliveryBounceZ-releasePoint.z)*q;y=releasePoint.y+(bouncePoint.y-releasePoint.y)*q+1.55*Math.sin(Math.PI*q);}
 else{const q=(fp-bounceT)/(1-bounceT);z=deliveryBounceZ+(10.05-deliveryBounceZ)*q;y=.24+.78*Math.sin(Math.PI*q);}
 ball.position.set(deliveryLineX*Math.sin(Math.PI*fp),y,z);
 if(fp>=bounceT)clearPitchMarkerOnBounce();
 timingBar.style.width=Math.round(fp*100)+"%";
 if(elapsed>=contactMs){
   if(pendingBatAction){
    const a=pendingBatAction;pendingBatAction=null;resolvePendingBatContact(a,contactMs);
    return;
   }
   if(elapsed>=7350){resolveDot();return;}
 }
 if(elapsed>=4700){timingLabel.textContent=timingQuality(elapsed)+" · SWING NOW";document.querySelectorAll("[data-shot],[data-foot]").forEach(b=>b.disabled=false);}
}
function resolvePendingBatContact(a,contactMs){
 const elapsed=performance.now()-deliveryStart;
 const timing=Math.max(.04,1-Math.abs(elapsed-contactMs)/1150);
 const quality=timing>.82?"PERFECT":timing>.62?(elapsed<contactMs?"EARLY · GOOD":"LATE · GOOD"):timing>.34?(elapsed<contactMs?"EARLY":"LATE"):"VERY LATE / VERY EARLY";
 if(a.foot==="LEAVE"){
  batCanHitBall=false;
  if(Math.abs(deliveryLineX)<.42){
   startWicketPresentation("BOWLED");resolveWicket("LEAVE · BOWLED");
  }else{
   inningsBalls++;ballsInOver=inningsBalls%6;strikerBalls++;updateScoreboard();setDeliveryStatus("LEAVE · DOT BALL");
   setTimeout(()=>{resetDelivery();if(matchPhase==="READY")startDelivery()},650);
  }
  return;
}
 if(a.foot==="SPECIAL"&&!(deliveryLength==="SHORT"&&deliveryLine!=="ON_STUMPS")){startWicketPresentation("BOWLED");resolveWicket("SPECIAL · WRONG DELIVERY");return;}
 // A chosen batting action always makes contact. Timing controls the
 // quality/power of that contact instead of deciding whether the bat can hit.
 const shot=a.shot||"STROKE";
 const powerMultiplier=SHOT_POWER_MODIFIERS[shot]||1.2;
 const badTiming=timing<.34;
 const veryBadTiming=timing<.16;
 let contactQuality=timing;
 let edgeToSlips=false;
 if(badTiming){
   // Poor timing creates a weak/mis-hit ball rather than an automatic miss.
   contactQuality=Math.max(.08,timing*.72);
   edgeToSlips=veryBadTiming || Math.random()<(.34-timing)*1.35;
 }
 const exitSpeed=(veryBadTiming?9:(badTiming?14:20)+deliverySpeed*.18+38*contactQuality)*powerMultiplier;
 const launch=shot==="LOFT"?(badTiming?18:48):shot==="STROKE"?(badTiming?10:24):(badTiming?4:10);
 const ax=Math.max(-1,Math.min(1,hitDirection.x)),af=Math.max(-1,Math.min(1,hitDirection.y));
 let gx=ax,gz=-af;
 if(edgeToSlips){
   // Edge/mishit is redirected toward the slip cord.
   gx=-.32+(Math.random()*.64);
   gz=-.94;
 }
 if(Math.hypot(gx,gz)<.12)gz=-1;
 const len=Math.hypot(gx,gz)||1;gx/=len;gz/=len;
 contactEdgeToSlips=edgeToSlips;
 const finalQuality=veryBadTiming?"VERY LATE/VERY EARLY":badTiming?"POOR TIMING":quality;
 timingLabel.textContent="CONTACT · "+finalQuality;
 setDeliveryStatus(edgeToSlips?"BAT CONTACT · EDGE TO SLIPS":"BAT CONTACT · "+finalQuality);
 showToast(edgeToSlips?"EDGE! · SLIPS":shot+" · "+finalQuality);
 resolveBallFlight(ball.position.clone(),new THREE.Vector3(gx,Math.sin(launch*Math.PI/180),gz),exitSpeed,shot,contactQuality);
}

function resetRunners(){batter.position.copy(DEFAULT_BATTER_POS);nonStriker.position.copy(DEFAULT_NONSTRIKER_POS);batter.rotation.set(0,Math.PI,0);nonStriker.rotation.set(0,0,0);runState.runnerProgress=0;runState.active=false;runState.runs=0;runState.deliveryCounted=false;}

function startRun(){
 if(!shotFlightActive||runState.deliveryCounted||runState.throwActive||runState.fielded||runState.active)return;
 if(runState.runs>=6){setDeliveryStatus("MAX 6 RUNS · BALL LIVE");return;}
 runState.active=true;runState.startedAt=performance.now();runState.runnerProgress=0;completedRuns=runState.runs;
 if(runBtn){runBtn.classList.add("running");runBtn.textContent=runState.runs>0?"RUN AGAIN":"RUN";}
 setDeliveryStatus("RUNNING · TAP RUN AGAIN");
}
function updateRunning(dt){
 if(!runState.active||runState.fielded)return;
 const dist=22.6,speed=6.2;runState.runnerProgress=Math.min(1,runState.runnerProgress+(speed*dt)/dist);const q=runState.runnerProgress;
 batter.position.z=10.4-22.6*q;nonStriker.position.z=-12.2+22.6*q;batter.rotation.y=q<.5?Math.PI:0;nonStriker.rotation.y=q<.5?0:Math.PI;
 if(q>=1){runState.runs++;completedRuns=runState.runs;runState.runnerProgress=0;batter.position.z=10.4;nonStriker.position.z=-12.2;runState.active=false;if(runBtn){runBtn.classList.remove("running");runBtn.classList.add("active");runBtn.textContent="RUN AGAIN";}inningsRuns++;strikerRuns++;updateScoreboard();setDeliveryStatus(runState.runs+" RUN"+(runState.runs===1?"":"S")+" · SAFE");showToast(runState.runs+" RUN"+(runState.runs===1?"":"S")+" · SAFE");}
}
function endCleanRunningDelivery(){if(runState.deliveryCounted)return;runState.deliveryCounted=true;runState.active=false;shotFlightActive=false;ballHit=false;if(runBtn){runBtn.classList.remove("active","running");runBtn.textContent="RUN";}setTimeout(()=>{resetRunners();resetDelivery();if(matchPhase==="READY"&&inningsWickets<10)startDelivery()},800);}

function applyCleanBowlAim(){
 const x=Math.max(-1,Math.min(1,bowlAimState.x));
 const y=Math.max(-1,Math.min(1,bowlAimState.y));

 // The joystick directly maps to a legal area of the pitch.
 // X controls line across the 5.5m pitch; Y controls length down the pitch.
 const maxAimX=1.78;
 const minBounceZ=4.8;
 const maxBounceZ=10.9;
 deliveryLineX=x*maxAimX;
 deliveryBounceZ=minBounceZ+((y+1)*.5)*(maxBounceZ-minBounceZ);

 // Keep the old descriptive labels, but derive them from the actual target.
 bowlLine=x<-.28?"OFF":x>.28?"LEG":"STUMPS";
 bowlLength=deliveryBounceZ<6.7?"FULL":deliveryBounceZ>9.0?"SHORT":"GOOD";
 deliveryLine=deliveryLineX<-.42?"OUTSIDE_OFF":deliveryLineX>.42?"LEG":"ON_STUMPS";
 deliveryLength=bowlLength;

 // This marker is the exact point the released ball will reach at bounce,
 // including the selected swing/cutter variation.
 let predictedBounceX=deliveryLineX;
 if(bowlTypeState==="OUT_SWING")predictedBounceX+=-.62;
 if(bowlTypeState==="IN_SWING")predictedBounceX+=.62;
 if(bowlTypeState==="REVERSE_SWING")predictedBounceX+=.48;
 bouncePoint.set(predictedBounceX,.24,deliveryBounceZ);
 landingPreview.position.set(predictedBounceX,.035,deliveryBounceZ);
 setPitchMarkerColor();
 landingPreview.userData.bounceLabel="BOUNCE HERE";
 landingPreview.visible=true;
}
function setupCleanBowlJoystick(){
 const j=document.querySelector("#bowlJoystick"),stick=document.querySelector("#bowlJoystickStick");if(!j||!stick)return;let dragging=false;
 const move=e=>{const r=j.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=Math.max(10,r.width*.36);let x=e.clientX-cx,y=e.clientY-cy,m=Math.hypot(x,y)||1;if(m>max){x=x/m*max;y=y/m*max;}bowlAimState.x=x/max;bowlAimState.y=-y/max;stick.style.transform="translate("+x+"px,"+y+"px)";applyCleanBowlAim();};
 j.addEventListener("pointerdown",e=>{if(controlMode!=="BOWL"||bowlAimLockedState)return;dragging=true;j.setPointerCapture?.(e.pointerId);move(e);e.preventDefault();});
 j.addEventListener("pointermove",e=>{if(dragging){move(e);e.preventDefault();}});
 const end=()=>{if(!dragging)return;dragging=false;bowlAimLockedState=true;stick.style.transform="translate(0,0)";j.classList.add("locked");bowlStage=1;refreshCleanBowlingUI();setDeliveryStatus("BOUNCE SET · CHOOSE DELIVERY TYPE");};
 j.addEventListener("pointerup",end);j.addEventListener("pointercancel",end);
}
function refreshCleanBowlingUI(){
 const active=controlMode==="BOWL",j=document.querySelector("#bowlJoystick"),v=document.querySelector("#bowlVariation");
 if(j)j.classList.toggle("hidden",!active||bowlStage!==0);
 if(v)v.classList.toggle("hidden",!active||bowlStage!==1);
 if(bowlDeliver){bowlDeliver.classList.toggle("hidden",!active||bowlStage!==2);bowlDeliver.disabled=!active||bowlStage!==2||deliveryActive;}

}
const fieldSetupBtn=document.querySelector("#fieldSetupBtn"),fieldSetupPanel=document.querySelector("#fieldSetupPanel"),fieldSetupClose=document.querySelector("#fieldSetupClose");
fieldSetupBtn?.addEventListener("click",()=>{
 if(controlMode!=="BOWL")return;
 renderFieldSetup();fieldSetupPanel?.classList.remove("hidden");fieldSetupPanel?.classList.add("open");
});
fieldSetupClose?.addEventListener("click",()=>fieldSetupPanel?.classList.remove("open"));
setupCleanBowlJoystick();
document.querySelectorAll("[data-bowl-type]").forEach(b=>b.addEventListener("click",()=>{
 if(controlMode!=="BOWL"||!bowlAimLockedState)return;
 bowlTypeState=b.dataset.bowlType;
 document.querySelectorAll("[data-bowl-type]").forEach(x=>x.classList.toggle("active",x===b));
 bowlStage=2;refreshCleanBowlingUI();
 setDeliveryStatus(bowlTypeState.replaceAll("_"," ")+" · READY TO BOWL");
}));

function startBowlingDelivery(){
 if(controlMode!=="BOWL"||deliveryActive||shotFlightActive||inningsWickets>=10||!bowlAimLockedState)return;
 bowlActive=true;deliveryActive=true;ballHit=false;shotFlightActive=false;bowlStart=performance.now();
 const paceMap={FAST:132,MEDIUM:112,SLOW:92};
 const basePace=paceMap[bowlPace];
 const variationMultiplier=bowlTypeState==="SLOWER"?.75:1;
 bowlSpeed=basePace*variationMultiplier+(Math.random()*6-3);
 deliveryAnimationRate=bowlTypeState==="SLOWER"?.80:1;
 deliverySpeed=bowlSpeed;// Use the exact point selected by the joystick; do not re-snap it.
 bouncePoint.set(deliveryLineX,.24,deliveryBounceZ);
 applyCleanBowlAim();
 // Keep the bounce marker visible through the run-up and flight so the bowler
 // can see the exact target that was locked before release.
 setPitchMarkerColor();
 landingPreview.visible=true;
 matchPhase="PREVIEW";
 bowlStage=3;refreshCleanBowlingUI();setDeliveryStatus("RUN-UP · "+bowlPace+" · "+bowlTypeState.replaceAll("_"," "));
}
function updateBowlingDelivery(now){
 if(!deliveryActive||!bowlActive)return;
 const elapsed=now-bowlStart;
 if(elapsed<1000){
  matchPhase="PREVIEW";
  bowler.position.copy(runUpStart);
  bowler.rotation.set(0,0,0);
  ball.position.copy(bowlerRelease).add(new THREE.Vector3(0,.05,0));
  setDeliveryStatus("LANDING SPOT");
  return;
 }
 if(elapsed<1000+6200/deliveryAnimationRate){
  matchPhase="RUN_UP";
  const runUpDuration=6200/deliveryAnimationRate;
  const p=Math.min(1,(elapsed-1000)/runUpDuration);
  const e=p*p*(3-2*p);
  bowler.position.lerpVectors(runUpStart,bowlerRelease,e);
  const strideBob=Math.sin(p*Math.PI*10)*(.018+.025*p);
  bowler.position.y=.18+strideBob;
  bowler.rotation.z=Math.sin(p*Math.PI*5)*.045;
  bowler.rotation.x=-.035*p;
  bowler.scale.y=1+.018*Math.sin(p*Math.PI*10);
  ball.position.copy(bowlerRelease).add(new THREE.Vector3(0,.05,0));
  setDeliveryStatus(p>.72?"BOWLER · DELIVERY STRIDE":"BOWLER · RUN-UP");
  return;
 }
 if(elapsed<1000+6200/deliveryAnimationRate+400/deliveryAnimationRate){
  matchPhase="RELEASE";
  const releaseStart=1000+6200/deliveryAnimationRate;
  const p=Math.min(1,(elapsed-releaseStart)/(400/deliveryAnimationRate));
  bowler.position.z=-16-p*.95;
  bowler.position.y=.18+Math.sin(p*Math.PI)*.08;
  bowler.rotation.x=-.10+p*.34;
  bowler.rotation.z=-.06+p*.14;
  bowler.scale.y=1+.035*Math.sin(p*Math.PI);
  ball.position.set(0,1.95,-16);
  setDeliveryStatus("RELEASE · BALL AWAY");
  return;
 }
 if(elapsed<1000+6200/deliveryAnimationRate+400/deliveryAnimationRate+1650/deliveryAnimationRate){
  matchPhase="FLIGHT";
  const flightStart=1000+6200/deliveryAnimationRate+400/deliveryAnimationRate;
  const p=Math.min(1,(elapsed-flightStart)/(1650/deliveryAnimationRate));
  const e=p*p*(3-2*p);
  let swingOffset=0;
  if(bowlTypeState==="OUT_SWING")swingOffset=-.62*e;
  if(bowlTypeState==="IN_SWING")swingOffset=.62*e;
  if(bowlTypeState==="REVERSE_SWING")swingOffset=.48*Math.sin(Math.PI*e);
  if(bowlTypeState==="OFF_CUTTER")swingOffset=-.22*Math.sin(Math.PI*e);
  if(bowlTypeState==="LEG_CUTTER")swingOffset=.22*Math.sin(Math.PI*e);
  const variationX=deliveryLineX+swingOffset;
  const z=releasePoint.z+(deliveryBounceZ-releasePoint.z)*e;
  const y=releasePoint.y+(bouncePoint.y-releasePoint.y)*e;
  // The ball reaches the displayed bounce marker at the end of flight.
  ball.position.set(variationX*e,y,z);
  bowler.rotation.x=.24+.10*Math.sin(Math.PI*e);
  bowler.rotation.z=-.02+.05*Math.sin(Math.PI*e);
  bowler.scale.y=1+.028*Math.sin(Math.PI*e);
  if(p>=1){
   landingPreview.visible=false;
   resolveBowlingDelivery();
 }
  return;
 }
}
function resolveBowlingDelivery(){
 if(!bowlActive)return;bowlActive=false;deliveryActive=false;shotFlightActive=false;
 const paceFactor=Math.max(0,Math.min(1,(bowlSpeed-90)/50));
 const variationBonus=bowlTypeState==="STRAIGHT" ? 0.006 : (bowlTypeState==="SLOWER" ? 0.010 : 0.014);
 const lineBonus=bowlLine==="STUMPS" ? 0.015 : 0;
 const lengthBonus=bowlLength==="GOOD" ? 0.012 : (bowlLength==="FULL" ? 0.005 : 0);
 const wicketChance=Math.min(0.085,0.02+paceFactor*0.02+lineBonus+lengthBonus+variationBonus);
 inningsBalls++;ballsInOver=inningsBalls%6;
 if(Math.random()<wicketChance){inningsWickets++;strikerBalls++;updateScoreboard();startWicketPresentation("BOWLED");if(bowlLine==="STUMPS"&&Math.random()<.55)showSlowDRS("LBW",()=>{if(inningsWickets>=10)finishInningsAndSwitch();else resetDelivery();});else setTimeout(()=>{if(inningsWickets>=10)finishInningsAndSwitch();else resetDelivery();},1900);}
 else{const r=Math.random(),runs=r<.55?0:r<.78?1:r<.93?2:r<.99?4:6;inningsRuns+=runs;updateScoreboard();setDeliveryStatus(runs?runs+" RUNS":"DOT BALL");setTimeout(()=>{resetDelivery();if(controlMode==="BOWL")setTimeout(startBowlingDelivery,650)},1000);}
}

const __cleanBaseAnimate=animate;
animate=function(now){
 if(controlMode==="BAT" && deliveryActive && landingPreview.visible && !pitchMarkerCleared){
  const pulse=1+Math.sin(now*.009)*.07;
  landingPreview.scale.setScalar((deliveryLength==="SHORT"?1.08:deliveryLength==="FULL"?.94:1)*pulse);
 }
 if(controlMode==="BOWL" && bowlStage===0 && !bowlAimLockedState && landingPreview.visible){
  const pulse=1+Math.sin(now*.006)*.10;
  landingPreview.scale.set(pulse,pulse,pulse);
 }
 updateSwingAnimation(now);animateWicketPresentation(now);updateCatchCamera(now);__cleanBaseAnimate(now);};
const __cleanBaseFinishRuns=finishRuns;
finishRuns=function(runs,label){__cleanBaseFinishRuns(runs,label);};
const __cleanBaseResolveWicket=resolveWicket;
resolveWicket=function(reason){__cleanBaseResolveWicket(reason);startWicketPresentation(reason.includes("BOWLED")?"BOWLED":reason);};

function endBallAfterRuns(){
 if(!shotFlightActive)return;
 runState.deliveryCounted=true;runState.active=false;shotFlightActive=false;ballHit=false;
 if(runBtn){runBtn.classList.remove("active","running");runBtn.textContent="RUN";}
 setTimeout(()=>{resetRunners();resetDelivery();if(matchPhase==="READY"&&inningsWickets<10)startDelivery()},800);
}

/* Wrap the original flight so the RUN button can be used repeatedly; its original fielding/throw logic remains intact. */

/* Replace the old one-run flight with a single authoritative ball-flight state machine. */
const __oldResolveWicketForFlight=resolveWicket;
function resolveCleanWicket(reason){
 __oldResolveWicketForFlight(reason);
}
resolveBallFlight=function(origin,direction,exitSpeed,shot,quality){
 shotFlightActive=true;ballHit=true;deliveryActive=false;
 runState.runs=0;runState.active=false;runState.fielded=false;runState.throwActive=false;runState.deliveryCounted=false;runState.runnerProgress=0;
 if(runBtn){runBtn.classList.add("active");runBtn.classList.remove("running");runBtn.textContent="RUN";}
 const start=origin.clone(),dir=direction.clone().normalize(),flat=new THREE.Vector3(dir.x,0,dir.z);
 if(flat.lengthSq()<.001)flat.set(0,0,-1);else flat.normalize();
 const target=start.clone().add(flat.multiplyScalar(9.5+exitSpeed*.24));target.y=.25;
 const isLoft=shot==="LOFT",startTime=performance.now(),duration=Math.min(4200,2200+exitSpeed*9);
 let resolved=false,picked=false,throwStarted=false,throwStart=0,throwEnd=0,throwTarget=10.4,fielder=null;
 let nearest=Infinity;
 fielders.forEach((f,i)=>{const d=Math.hypot(f.position.x-target.x,f.position.z-target.z);if(d<nearest){nearest=d;fielder=f;}});
 if(fielder)fielder.userData.target=target.clone();

 const finishDotClean=()=>{
  if(resolved)return;resolved=true;shotFlightActive=false;ballHit=false;
  if(runBtn)runBtn.classList.remove("active","running");
  inningsBalls++;ballsInOver=inningsBalls%6;strikerBalls++;lastOutcome="DOT BALL";updateScoreboard();setDeliveryStatus("DOT BALL");
  setTimeout(()=>{resetRunners();resetDelivery();if(matchPhase==="READY"&&inningsWickets<10)startDelivery()},700);
 };
 const finishEndOfBall=()=>{
  if(resolved)return;resolved=true;shotFlightActive=false;ballHit=false;runState.deliveryCounted=true;
  if(runBtn){runBtn.classList.remove("active","running");runBtn.textContent="RUN";}
  setTimeout(()=>{resetRunners();resetDelivery();if(matchPhase==="READY"&&inningsWickets<10)startDelivery()},700);
 };
 const startThrow=now=>{
  if(throwStarted||!fielder)return;
  throwStarted=true;runState.throwActive=true;throwStart=now;
  const targetZ=runState.runs%2===1?-12.2:10.4;throwTarget=targetZ;
  throwEnd=now+Math.max(620,Math.min(1100,620+Math.hypot(fielder.position.x-target.x,fielder.position.z-target.z)*35));
  setDeliveryStatus("FIELDER · THROWING");
 };
 const runOut=()=>{
  if(resolved)return;resolved=true;shotFlightActive=false;ballHit=true;runState.throwActive=false;
  inningsWickets++;inningsBalls++;ballsInOver=inningsBalls%6;strikerBalls++;updateScoreboard();setDeliveryStatus("RUN OUT · "+runState.runs);showToast("RUN OUT");
  setTimeout(()=>{if(inningsWickets>=10)finishInningsAndSwitch();else resetDelivery()},1100);
 };

 let last=performance.now();
 const tick=now=>{
  if(!shotFlightActive||resolved)return;
  const dt=Math.min(.033,Math.max(0,(now-last)/1000));last=now;
  const p=Math.min(1,(now-startTime)/duration),e=p*p*(3-2*p);
  ball.position.lerpVectors(start,target,e);
  const lift=isLoft?3.2*Math.sin(Math.PI*e):.72*Math.sin(Math.PI*e);
  ball.position.y=Math.max(.24,start.y+(target.y-start.y)*e+lift);
  ball.rotation.x+=dt*10;ball.rotation.y+=dt*12;

  if(!runState.fielded&&!resolved&&isLoft&&p>.48&&p<.92&&fielder){
   const fd=Math.hypot(fielder.position.x-ball.position.x,fielder.position.z-ball.position.z);
   if(fd<1.45){showCatchCamera(fielder);showToast("CATCH · TAKEN");setTimeout(()=>{startWicketPresentation("CAUGHT");resolveWicket("CAUGHT");},900);return;}
  }

  if(!runState.fielded&&!resolved){
   const boundary=Math.hypot(ball.position.x,ball.position.z*.82);
   if(boundary>=43.5){finishRuns(isLoft&&ball.position.y>1.5?6:4,isLoft&&ball.position.y>1.5?"SIX!":"FOUR · BOUNDARY");finishEndOfBall();return;}
  }

  if(fielder&&!runState.fielded){
   moveFieldersToBall(ball.position,dt);
   const fd=Math.hypot(fielder.position.x-ball.position.x,fielder.position.z-ball.position.z);
   if(fd<.9){
    runState.fielded=true;picked=true;ball.position.copy(fielder.position);ball.position.y=.72;
    if(runState.active)startThrow(now);else{finishDotClean();return;}
   }
  }

  if(runState.active&&!runState.fielded){
   const dist=22.6,speed=6.2;
   runState.runnerProgress=Math.min(1,runState.runnerProgress+(speed*dt)/dist);
   const q=runState.runnerProgress;
   batter.position.z=10.4-22.6*q;nonStriker.position.z=-12.2+22.6*q;
   batter.rotation.y=q<.5?Math.PI:0;nonStriker.rotation.y=q<.5?0:Math.PI;
   if(q>=1){
    runState.runs++;runState.runnerProgress=0;runState.active=false;
    batter.position.z=10.4;nonStriker.position.z=-12.2;
    const oldStriker=batter;batter=nonStriker;nonStriker=oldStriker;
    batter.position.z=10.4;nonStriker.position.z=-12.2;
    batter.rotation.set(0,Math.PI,0);nonStriker.rotation.set(0,0,0);
    inningsRuns++;strikerRuns++;updateScoreboard();
    setDeliveryStatus(runState.runs+" RUN"+(runState.runs===1?"":"S")+" · SAFE");
    showToast(runState.runs+" RUN"+(runState.runs===1?"":"S")+" · SAFE");
    if(runBtn){runBtn.classList.remove("running");runBtn.classList.add("active");runBtn.textContent=runState.runs<4?"RUN AGAIN":"BALL DEAD";}
   }
  }

  if(runState.fielded&&throwStarted){
   const q=Math.min(1,Math.max(0,(now-throwStart)/(throwEnd-throwStart)));
   const sx=fielder.position.x,sz=fielder.position.z;
   ball.position.x=sx*(1-q);ball.position.z=sz*(1-q)+throwTarget*q;ball.position.y=.72+Math.sin(Math.PI*q)*1.15;
   if(q>=1){
    runState.throwActive=false;ball.position.set(0,.95,throwTarget);
    if(runState.active){
     if(Math.abs(batter.position.z-throwTarget)>1.0){runOut();return;}
     runState.runs++;runState.active=false;inningsRuns++;strikerRuns++;updateScoreboard();setDeliveryStatus(runState.runs+" RUN · SAFE");
    }
    finishEndOfBall();return;
   }
  }

  if(p>=1&&!runState.fielded){
   // Keep the ball live briefly so the fielder can collect it and the player can call runs.
   ball.position.copy(target);ball.position.y=.25;
   if(!runState.active&&!runState.runs){setDeliveryStatus("BALL FIELDING · TAP RUN");}
  }
  requestAnimationFrame(tick);
 };
 requestAnimationFrame(tick);
};

/* Functional mode menus — single delegated controller. */
function closeCleanPanels(){["#careerPanel","#tournamentPanel","#playerHub"].forEach(id=>document.querySelector(id)?.classList.remove("open"));}
function openCleanPanel(id){closeCleanPanels();const panel=document.querySelector(id);if(panel){panel.classList.add("open");panel.style.pointerEvents="auto";panel.removeAttribute("hidden");}menuPanel?.classList.remove("open");document.querySelectorAll(".top-nav span").forEach(x=>x.classList.toggle("nav-active",x.textContent.trim()==="HOME"));}
document.querySelector(".top-nav")?.addEventListener("click",e=>{const item=e.target.closest("span");if(!item)return;const n=item.textContent.trim();if(n==="CAREER")openCleanPanel("#careerPanel");else if(n==="MY CRICKETER")openCleanPanel("#playerHub");else if(n==="PLAY")openPreMatch();});
document.querySelector(".menu-inner")?.addEventListener("click",e=>{const card=e.target.closest(".mode-card");if(card){const n=card.querySelector("strong")?.textContent.trim();if(n==="QUICK MATCH")openPreMatch();else if(n==="CAREER")openCleanPanel("#careerPanel");else if(n==="TOURNAMENTS")openCleanPanel("#tournamentPanel");else if(n==="CREATE PLAYER")openCleanPanel("#playerHub");return;}const b=e.target.closest(".menu-grid button");if(!b)return;const n=b.textContent.trim();if(n==="MY CRICKETER")openCleanPanel("#playerHub");else if(n==="STADIUMS"||n==="TEAMS")showToast(n+" · HUB READY");});
document.querySelectorAll(".game-panel-close").forEach(b=>b.addEventListener("click",closeCleanPanels));
document.querySelectorAll("#careerPanel .career-grid button").forEach(b=>b.addEventListener("click",()=>{
 const n=b.textContent.trim();
 showToast(n==="START CAREER"?"CAREER · NEW SEASON READY":n+" · HUB READY");
}));
document.querySelectorAll("#tournamentPanel .career-grid button").forEach(b=>b.addEventListener("click",()=>{
 const n=b.textContent.trim();
 selectedFormat=n==="WORLD CUP"?"ODI":n;
 closeCleanPanels();openPreMatch();showToast((n==="WORLD CUP"?"WORLD CUP":"FORMAT")+" · MATCH SETUP");
}));
document.querySelectorAll("#menuPanel .mode-card").forEach(card=>card.addEventListener("pointerup",()=>{
 const n=card.querySelector("strong")?.textContent.trim();
 if(n==="QUICK MATCH")openPreMatch();
 if(n==="CAREER")openCleanPanel("#careerPanel");
 if(n==="TOURNAMENTS")openCleanPanel("#tournamentPanel");
 if(n==="CREATE PLAYER")openCleanPanel("#playerHub");
}));

document.querySelectorAll("#tournamentPanel .career-grid button").forEach(b=>b.addEventListener("click",()=>{const n=b.textContent.trim();if(n==="TEST"||n==="ODI"||n==="T20"){selectedFormat=n;openPreMatch();}else showToast(n+" · SETUP");}));
document.querySelectorAll("#careerPanel .career-grid button").forEach(b=>b.addEventListener("click",()=>showToast(b.textContent.trim()+" · SELECTED")));

/* Keep fixed HUD/control layers aligned to Safari's actually visible viewport.
   This matters when the game is running in iPad split-screen with Safari's toolbar visible. */
(function syncVisibleViewport(){
 const update=()=>{
  const vv=window.visualViewport;
  const h=vv && Number.isFinite(vv.height) ? vv.height : window.innerHeight;
  const w=vv && Number.isFinite(vv.width) ? vv.width : window.innerWidth;
  document.documentElement.style.setProperty("--visible-vh",h+"px");
  document.documentElement.style.setProperty("--visible-vw",w+"px");
 };
 update();
 if(window.visualViewport){
  window.visualViewport.addEventListener("resize",update,{passive:true});
  window.visualViewport.addEventListener("scroll",update,{passive:true});
 }
 window.addEventListener("resize",update,{passive:true});
})();



/* FINAL CLEANUP v51: robust menu/animation helpers */
function resetPlayerPresentation(){
 batter.rotation.set(0,Math.PI,0);batter.position.set(DEFAULT_BATTER_POS.x,DEFAULT_BATTER_POS.y,DEFAULT_BATTER_POS.z);
 nonStriker.rotation.set(0,0,0);nonStriker.position.set(DEFAULT_NONSTRIKER_POS.x,DEFAULT_NONSTRIKER_POS.y,DEFAULT_NONSTRIKER_POS.z);
 batRagdoll=null;swingAnimation=null;
}
window.__cricket26ResetPresentation=resetPlayerPresentation;

const scorecard=document.querySelector("#matchScorecard"),scorecardToggle=document.querySelector("#scorecardToggle");
scorecardToggle?.addEventListener("click",()=>{
 if(!scorecard)return;
 const expanded=scorecard.classList.toggle("expanded");
 scorecardToggle.textContent=expanded?"CLOSE":"DETAILS";
});
updateScoreboard();


/* CRICKET26_PHASE12_SCORE_FIELDING
   Score resolution, sector-aware fielding, 200ms aerial catch window,
   three-second delivery recovery, and database-ready delivery payload. */
(function phase12ScoreAndFielding(){
 const X_RADIUS=43.5;
 const Z_RADIUS=43.5*.82;
 const RECOVERY_MS=3000;
 const CATCH_ALTITUDE=1.2;
 const CATCH_WINDOW_MS=200;
 const CATCH_RADIUS=1.65;
 const SECTORS=["STRAIGHT","COVER","OFF_SIDE","THIRD_MAN","FINE_LEG","MID_WICKET","LEG_SIDE","SQUARE_LEG"];
 let phase12Active=false,phase12Finalized=false,phase12Counted=false;
 let phase12CatchWindowUntil=0,phase12PreviousY=.25;
 let phase12Fielder=null,phase12Throwing=false,phase12ThrowStart=0,phase12ThrowEnd=0,phase12ThrowTargetZ=10.4;
 let phase12RunsCommitted=0;

 const style=document.createElement("style");
 style.textContent=`
 .phase12-recovery{transition:opacity .42s ease,filter .42s ease!important;opacity:.28!important;filter:blur(1px)!important;pointer-events:none!important}
 .phase12-recovery-overlay{position:fixed;inset:0;z-index:9899999;pointer-events:none;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .42s ease;background:rgba(0,8,5,.28);backdrop-filter:blur(2px)}
 .phase12-recovery-overlay.show{opacity:1}
 .phase12-recovery-card{font:900 clamp(18px,3vw,34px)/1 Arial,sans-serif;letter-spacing:.12em;color:#fff;text-align:center;text-shadow:0 3px 12px #000;padding:14px 20px;border:2px solid rgba(255,255,255,.45);border-radius:14px;background:rgba(2,18,11,.76)}
 .phase12-sector{position:fixed;left:50%;top:16%;transform:translate(-50%,-50%);z-index:9900001;pointer-events:none;opacity:0;font:900 13px/1 Arial,sans-serif;letter-spacing:.14em;color:#fff;padding:7px 12px;border-radius:999px;background:rgba(3,16,10,.72);border:1px solid rgba(255,255,255,.28);transition:opacity .2s ease}
 .phase12-sector.show{opacity:1}
 `;
 document.head.appendChild(style);
 const recovery=document.createElement("div");
 recovery.className="phase12-recovery-overlay";
 recovery.innerHTML='<div class="phase12-recovery-card"><span>DELIVERY COMPLETE</span></div>';
 document.body.appendChild(recovery);
 const sectorHud=document.createElement("div");sectorHud.className="phase12-sector";document.body.appendChild(sectorHud);

 function sectorForVelocity(v){
  const angle=Math.atan2(v.x,-v.z);
  return SECTORS[(Math.round((angle/(Math.PI*2))*8)+8)%8];
 }
 function boundaryMetric(p){return Math.hypot(p.x/X_RADIUS,p.z/Z_RADIUS);}
 function showSector(sector){
  sectorHud.textContent="FIELD SECTOR · "+sector;
  sectorHud.classList.remove("show");void sectorHud.offsetWidth;sectorHud.classList.add("show");
  clearTimeout(window.__phase12SectorTimer);window.__phase12SectorTimer=setTimeout(()=>sectorHud.classList.remove("show"),900);
 }
 function setHasBall(fielder,has){
  if(!fielder)return;fielder.userData.hasBall=!!has;fielder.userData.running=false;fielder.userData.target=null;
 }
 function fadeRecovery(show,label){
  const controls=document.querySelector("#matchControls"),hud=document.querySelector("#hud");
  if(show){controls?.classList.add("phase12-recovery");hud?.classList.add("phase12-recovery");recovery.querySelector("span").textContent=label||"DELIVERY COMPLETE";recovery.classList.add("show");}
  else{controls?.classList.remove("phase12-recovery");hud?.classList.remove("phase12-recovery");recovery.classList.remove("show");}
 }
 function buildPayload(runs,dismissal,action,timing){
  const payload={variation:(typeof bowlTypeState!=="undefined"?bowlTypeState:"UNKNOWN"),intent:(typeof selectedDeliveryShot!=="undefined"?selectedDeliveryShot:"STROKE"),action:action||pendingBatAction?.foot||"NONE",timing:timing||"Unknown",runs:Number(runs)||0,dismissal:dismissal||"None"};
  window.currentBallRunsScored=payload.runs;window.lastDeliveryPayload=payload;window.deliveryHistory=window.deliveryHistory||[];window.deliveryHistory.push(payload);
  window.dispatchEvent(new CustomEvent("cricket26:delivery",{detail:payload}));return payload;
 }
 function commitScore(runs,dismissal,timing,action){
  const n=Math.max(0,Math.floor(Number(runs)||0));
  if(phase12Counted)return window.lastDeliveryPayload||buildPayload(n,dismissal,action,timing);
  phase12Counted=true;inningsRuns+=n;inningsBalls++;ballsInOver=inningsBalls%6;strikerRuns+=n;strikerBalls++;
  lastOutcome=dismissal&&dismissal!=="None"?"WICKET · "+dismissal:(n?String(n)+" RUNS":"DOT BALL");updateScoreboard();
  return buildPayload(n,dismissal,action,timing);
 }
 function commitWicket(reason,timing,action){
  if(phase12Counted)return window.lastDeliveryPayload||buildPayload(phase12RunsCommitted,reason,action,timing);
  phase12Counted=true;inningsWickets++;inningsBalls++;ballsInOver=inningsBalls%6;strikerBalls++;lastOutcome="WICKET · "+reason;setDeliveryStatus("WICKET · "+reason);updateScoreboard();
  return buildPayload(phase12RunsCommitted,reason,action,timing);
 }
 function beginRecovery(label,runs,dismissal,timing,action,scoreAlreadyApplied=false){
  if(phase12Finalized)return;phase12Finalized=true;phase12Active=false;shotFlightActive=false;ballHit=false;deliveryActive=false;runState.active=false;runState.throwActive=false;
  if(runBtn){runBtn.classList.remove("active","running");runBtn.textContent="RUN";runBtn.disabled=true;}
  if(!scoreAlreadyApplied)commitScore(runs,dismissal,timing,action);else buildPayload(runs,dismissal,action,timing);
  setDeliveryStatus(label||"DELIVERY COMPLETE");showToast(label||"DELIVERY COMPLETE");fadeRecovery(true,label||"DELIVERY COMPLETE");
  setTimeout(()=>{fadeRecovery(false);resetRunners();resetDelivery();phase12CatchWindowUntil=0;phase12Fielder=null;phase12Throwing=false;phase12Finalized=false;phase12Counted=false;phase12RunsCommitted=0;if(runBtn)runBtn.disabled=false;if(matchPhase==="READY"&&inningsWickets<10)setTimeout(()=>startDelivery(),250);},RECOVERY_MS);
 }
 function chooseFielder(target,sector){
  let best=null,bestScore=Infinity;
  fielders.forEach((f,i)=>{const angleSector=sectorForVelocity(new THREE.Vector3(f.position.x,0,f.position.z));const penalty=angleSector===sector?0:12;const speed=4.2+(i%4)*.45;const d=Math.hypot(f.position.x-target.x,f.position.z-target.z);const score=penalty+d/speed;if(score<bestScore){bestScore=score;best=f;best.userData.skill=.68+(i%5)*.06;best.userData.fieldSector=angleSector;best.userData.phase12Speed=speed;}});
  if(best)best.userData.target=target.clone();return best;
 }
 function moveFielder(f,dt){
  if(!f||f.userData.hasBall||!f.userData.target)return;const t=f.userData.target,dx=t.x-f.position.x,dz=t.z-f.position.z,d=Math.hypot(dx,dz);if(d>.04){const step=Math.min(d,(f.userData.phase12Speed||4.5)*dt);f.position.x+=dx/d*step;f.position.z+=dz/d*step;f.userData.running=true;f.rotation.y=Math.atan2(dx,dz);}else f.userData.running=false;
 }
 function phase12ResolveCatch(timing,action){
  if(phase12Finalized)return;setHasBall(phase12Fielder,true);if(runBtn){runBtn.classList.remove("active","running");runBtn.disabled=true;}showCatchCamera(phase12Fielder);if(typeof triggerActionReplay==="function")triggerActionReplay("CAUGHT");setDeliveryStatus("CAUGHT · "+(phase12Fielder.userData.fieldSector||"FIELD"));showToast("CAUGHT!");phase12RunsCommitted=runState.runs||0;commitWicket("Caught",timing,action);startWicketPresentation("CAUGHT");fadeRecovery(true,"CAUGHT!");phase12Finalized=true;phase12Active=false;shotFlightActive=false;ballHit=true;deliveryActive=false;runState.active=false;
  setTimeout(()=>{fadeRecovery(false);resetRunners();resetDelivery();phase12CatchWindowUntil=0;phase12Fielder=null;phase12Throwing=false;phase12Finalized=false;phase12Counted=false;phase12RunsCommitted=0;if(inningsWickets>=10)finishInningsAndSwitch();else if(matchPhase==="READY")setTimeout(()=>startDelivery(),250);},RECOVERY_MS);
 }

 resolveBallFlight=function(origin,direction,exitSpeed,shot,quality){
  phase12Active=true;phase12Finalized=false;phase12Counted=false;phase12RunsCommitted=0;phase12CatchWindowUntil=0;phase12Throwing=false;
  shotFlightActive=true;ballHit=true;deliveryActive=false;runState.runs=0;runState.active=false;runState.fielded=false;runState.throwActive=false;runState.deliveryCounted=false;runState.runnerProgress=0;
  const start=origin.clone(),velocity=direction.clone().normalize(),flat=new THREE.Vector3(velocity.x,0,velocity.z);if(flat.lengthSq()<.001)flat.set(0,0,-1);else flat.normalize();
  const isLoft=shot==="LOFT",isEdge=contactEdgeToSlips,power=SHOT_POWER_MODIFIERS[shot]||1.2,distance=(isLoft?28:22)+Math.max(0,exitSpeed)*(.82*power),target=start.clone().add(flat.multiplyScalar(distance));target.y=.25;
  const duration=Math.min(5000,2100+Math.max(0,exitSpeed)*34),sector=sectorForVelocity(flat);showSector(isEdge?"SLIPS":sector);
  const catchPoint=start.clone().lerp(target,isEdge?.58:.86);catchPoint.y=isEdge?.72:1.05;phase12Fielder=chooseFielder(isLoft||isEdge?catchPoint:target,sector);
  if(runBtn){runBtn.disabled=false;runBtn.classList.add("active");runBtn.classList.remove("running");runBtn.textContent="RUN";}
  const started=performance.now();let previousY=start.y;let resolved=false;
  const finishBoundary=(runs,label)=>{if(resolved||phase12Finalized)return;resolved=true;phase12RunsCommitted=runs;shotFlightActive=false;ballHit=false;if(runBtn)runBtn.classList.remove("active","running");finishRuns(runs,label);beginRecovery(label,runs,"None",quality,pendingBatAction?.foot||"NONE",true);};
  const finishDot=()=>{if(resolved||phase12Finalized)return;resolved=true;const runs=runState.runs||0;phase12RunsCommitted=runs;setHasBall(phase12Fielder,true);beginRecovery(runs?runs+" RUN"+(runs===1?"":"S")+" · SAFE":"DOT BALL",runs,"None",quality,pendingBatAction?.foot||"NONE");};
  const finishRunsAfterFielding=()=>{if(resolved||phase12Finalized)return;resolved=true;const runs=runState.runs||0;phase12RunsCommitted=runs;setHasBall(phase12Fielder,true);beginRecovery(runs?runs+" RUN"+(runs===1?"":"S")+" · SAFE":"DOT BALL",runs,"None",quality,pendingBatAction?.foot||"NONE");};
  const runOut=()=>{if(resolved||phase12Finalized)return;resolved=true;const runs=runState.runs||0;phase12RunsCommitted=runs;inningsRuns+=runs;phase12Counted=true;inningsWickets++;inningsBalls++;ballsInOver=inningsBalls%6;strikerRuns+=runs;strikerBalls++;lastOutcome="RUN OUT · "+runs;updateScoreboard();buildPayload(runs,"Run out",pendingBatAction?.foot||"NONE",quality);setDeliveryStatus("RUN OUT · "+runs);showToast("RUN OUT");if(runBtn)runBtn.disabled=true;fadeRecovery(true,"RUN OUT");setTimeout(()=>{fadeRecovery(false);resetRunners();resetDelivery();phase12Finalized=false;phase12Counted=false;phase12Fielder=null;if(inningsWickets>=10)finishInningsAndSwitch();else if(matchPhase==="READY")setTimeout(()=>startDelivery(),250);},RECOVERY_MS);};
  const tick=now=>{
   if(!phase12Active||phase12Finalized||resolved)return;const dt=Math.min(.033,Math.max(.001,(now-started)/1000));const p=Math.min(1,(now-started)/duration),e=p*p*(3-2*p);ball.position.lerpVectors(start,target,e);const lift=isLoft?3.25*Math.sin(Math.PI*e):.72*Math.sin(Math.PI*e);ball.position.y=Math.max(.25,start.y+(target.y-start.y)*e+lift);ball.rotation.x+=dt*10;ball.rotation.y+=dt*12;moveFielder(phase12Fielder,dt);
   const descending=ball.position.y<previousY;
   const catchableAerial=isLoft||isEdge;
   const catchAltitude=isEdge?.72:CATCH_ALTITUDE;
   if(catchableAerial&&descending&&ball.position.y<=catchAltitude&&previousY>catchAltitude&&phase12CatchWindowUntil<=now){phase12CatchWindowUntil=now+CATCH_WINDOW_MS;const fd=phase12Fielder?Math.hypot(phase12Fielder.position.x-ball.position.x,phase12Fielder.position.z-ball.position.z):Infinity;if(phase12Fielder&&fd<=CATCH_RADIUS){const skill=phase12Fielder.userData.skill||.78;if(Math.random()<skill){phase12ResolveCatch(quality,pendingBatAction?.foot||"NONE");return;}showToast("CATCH DROPPED");setDeliveryStatus(isEdge?"EDGE · CATCH DROPPED · BALL LIVE":"CATCH DROPPED · BALL LIVE");}}
   previousY=ball.position.y;
   if(boundaryMetric(ball.position)>=1){finishBoundary(ball.position.y>.34?6:4,ball.position.y>.34?"6 RUNS · OVER THE ROPE":"4 RUNS · BOUNDARY");return;}
   if(phase12Fielder&&!phase12Fielder.userData.hasBall){const fd=Math.hypot(phase12Fielder.position.x-ball.position.x,phase12Fielder.position.z-ball.position.z);if(!isLoft&&fd<.85&&ball.position.y<=.6){setHasBall(phase12Fielder,true);if(runState.active)phase12Throwing=true;else finishDot();if(runState.active&&runBtn)runBtn.disabled=true;}}
   if(phase12Fielder?.userData.hasBall&&phase12Throwing&&!phase12Finalized){if(!phase12ThrowStart){phase12ThrowStart=now;phase12ThrowEnd=now+820;phase12ThrowTargetZ=(runState.runs%2===1)?-12.2:10.4;setDeliveryStatus("FIELDER · THROWING");}const q=Math.min(1,(now-phase12ThrowStart)/(phase12ThrowEnd-phase12ThrowStart)),sx=phase12Fielder.position.x,sz=phase12Fielder.position.z;ball.position.x=sx*(1-q);ball.position.z=sz*(1-q)+phase12ThrowTargetZ*q;ball.position.y=.72+Math.sin(Math.PI*q)*1.15;if(q>=1){ball.position.set(0,.95,phase12ThrowTargetZ);const runnerZ=batter.position.z;if(runState.active&&Math.abs(runnerZ-phase12ThrowTargetZ)>1){runOut();return;}if(runState.active){runState.runs++;runState.active=false;}phase12Throwing=false;finishRunsAfterFielding();return;}}
   if(runState.active&&!phase12Fielder?.userData.hasBall){const runDistance=22.6,runSpeed=5.4;runState.runnerProgress=Math.min(1,runState.runnerProgress+(runSpeed*dt)/runDistance);const q=runState.runnerProgress;batter.position.z=10.4-22.6*q;nonStriker.position.z=-12.2+22.6*q;batter.rotation.y=q<.5?Math.PI:0;nonStriker.rotation.y=q<.5?0:Math.PI;if(q>=1){runState.runs++;runState.runnerProgress=0;runState.active=false;batter.position.z=10.4;nonStriker.position.z=-12.2;const oldB=batter;batter=nonStriker;nonStriker=oldB;batter.position.z=10.4;nonStriker.position.z=-12.2;batter.rotation.set(0,Math.PI,0);nonStriker.rotation.set(0,0,0);setDeliveryStatus(runState.runs+" RUN"+(runState.runs===1?"":"S")+" · SAFE");showToast(runState.runs+" RUN"+(runState.runs===1?"":"S")+" · SAFE");if(runBtn){runBtn.classList.remove("running");runBtn.classList.add("active");runBtn.textContent=runState.runs<6?"RUN AGAIN":"BALL DEAD";}}}
   if(p>=1&&!phase12Fielder?.userData.hasBall){ball.position.copy(target);ball.position.y=.25;if(!runState.active&&!runState.runs)setDeliveryStatus("BALL FIELDING · TAP RUN");}
   requestAnimationFrame(tick);
  };requestAnimationFrame(tick);
 };
 window.__cricket26Phase12={sectors:SECTORS,getPayload:()=>window.lastDeliveryPayload||null,getHistory:()=>window.deliveryHistory||[]};
})();
