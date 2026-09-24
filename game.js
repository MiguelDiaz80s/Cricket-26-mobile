import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import {loadCricketWasm} from "./engine/wasm-bridge.js";

let wasmEngine=null;
let wasmPhysicsActive=false;
loadCricketWasm().then(engine=>{
  wasmEngine=engine;
  wasmPhysicsActive=!!engine;
  if(engine)console.info("Cricket C++ aerodynamics online.");
});

const canvas=document.querySelector("#scene");
const isMobileDevice=window.innerWidth<900 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const renderer=new THREE.WebGLRenderer({canvas,antialias:!isMobileDevice,powerPreference:"high-performance",failIfMajorPerformanceCaveat:false});
const mobilePixelRatio=Math.min(devicePixelRatio||1,1);
renderer.setPixelRatio(isMobileDevice?mobilePixelRatio:Math.min(devicePixelRatio||1,1.35));
renderer.setSize(innerWidth,innerHeight,false);
renderer.shadowMap.enabled=window.innerWidth>=900;
renderer.shadowMap.type=isMobileDevice?THREE.BasicShadowMap:THREE.PCFSoftShadowMap;
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
sun.position.set(-38,55,24);sun.castShadow=!isMobileDevice;sun.shadow.mapSize.set(isMobileDevice?256:1024,isMobileDevice?256:1024);
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

const wood=material("#d4bd8c",.6);
function makeWicket(z){
 const g=new THREE.Group();
 [-.34,0,.34].forEach(x=>g.add(meshCyl(.055,2.25,wood,x,.98,0,14)));
 g.add(meshBox(.82,.09,.13,wood,0,2.08,0),meshBox(.82,.09,.13,wood,0,2.17,0));
 g.position.z=z;stadium.add(g);
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
  const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,Math.max(.08,v.length()-r*2),isMobileDevice?6:10,isMobileDevice?8:16),mat);
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
 mesh(new THREE.CapsuleGeometry(.40,.72,12,24),shirt,[0,1.18,0],[1.13,1,.76]);
 mesh(new THREE.CapsuleGeometry(.32,.18,10,18),shirt,[0,.79,0],[1.18,1,.82]);

 // Shoulder mass smoothly joins the torso instead of floating as separate balls.
 mesh(new THREE.CapsuleGeometry(.30,.24,10,18),shirt,[-.28,1.40,0],[1,.95,.82]);
 mesh(new THREE.CapsuleGeometry(.30,.24,10,18),shirt,[.28,1.40,0],[1,.95,.82]);

 // Neck, head and hair.
 mesh(new THREE.CapsuleGeometry(.115,.20,10,18),skin,[0,1.70,0],[1,1,1]);
 mesh(new THREE.CapsuleGeometry(.29,.23,12,20),skin,[0,2.00,0],[.94,1.08,.94]);
 mesh(new THREE.SphereGeometry(.30,isMobileDevice?12:24,isMobileDevice?10:18,0,Math.PI*2,0,Math.PI*.60),hair,[0,2.08,0],[.94,1,.94]);
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
  mesh(new THREE.SphereGeometry(.38,isMobileDevice?14:28,isMobileDevice?10:18,0,Math.PI*2,0,Math.PI*.52),helmet,[0,2.15,0],[1,.96,.98]);
  const peak=mesh(new THREE.CapsuleGeometry(.055,.30,8,12),helmet,[0,2.06,-.33],[1,.65,.65]);
  peak.rotation.x=Math.PI/2;
 } else {
  mesh(new THREE.SphereGeometry(.39,isMobileDevice?14:28,isMobileDevice?10:18,0,Math.PI*2,0,Math.PI*.60),helmet,[0,2.13,0],[1,.98,.98]);
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

const batter=player({team:0,role:"batter",x:.8,z:10.4,scale:1.12});batter.rotation.y=Math.PI;
const nonStriker=player({team:0,role:"batter",x:-.8,z:-12.2,scale:1.08});
nonStriker.rotation.y=0;
const keeper=player({team:1,role:"keeper",x:-.5,z:-13.9,scale:1.02});
const bowler=player({team:1,x:0,z:-20.5,scale:1.08});
const fielders=[[-16,-4],[17,-4],[-22,7],[22,8],[-18,22],[18,22],[-32,15],[31,15],[0,30],[0,-36]].slice(0,isMobileDevice?4:10).map(([x,z])=>player({team:1,x,z,scale:.9}));

const ball=new THREE.Mesh(new THREE.SphereGeometry(.19,24,18),new THREE.MeshStandardMaterial({color:0x8d1119,roughness:.3,clearcoat:.35}));
ball.position.set(0,.63,6.5);ball.castShadow=true;stadium.add(ball);
const seam=new THREE.Mesh(new THREE.TorusGeometry(.13,.018,8,28),material("#ead6cf",.55));seam.rotation.x=Math.PI/2;ball.add(seam);

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
 document.body.classList.toggle("device-phone",deviceType==="phone");
 document.body.classList.toggle("device-tablet",deviceType==="tablet");
 document.body.classList.toggle("device-pc",deviceType==="pc");
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
if(deviceType) deviceSetup.classList.remove("open"); else applyDeviceMode();

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
 batter:{pos:[5.8,4.2,17.8],target:[0,1.7,1]},
 bowler:{pos:[4.8,4,-25],target:[0,1.7,4]},
 wide:{pos:[65,29,68],target:[0,3,0]},
 cinematic:{pos:[-54,14,48],target:[0,4,0]}
};
let cameraMode="broadcast",cinematicTime=0,started=false;
function setCamera(name){cameraMode=name;document.querySelectorAll(".camera").forEach(b=>b.classList.toggle("active",b.dataset.camera===name));const c=cameras[name];camera.position.set(...c.pos);camera.lookAt(...c.target)}
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
 maxRuns:1,
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
const landingPreview=new THREE.Group();
const landingDisc=new THREE.Mesh(new THREE.RingGeometry(.32,.52,32),new THREE.MeshBasicMaterial({color:0xffd83d,transparent:true,opacity:.92,side:THREE.DoubleSide}));
landingDisc.rotation.x=-Math.PI/2;
landingPreview.add(landingDisc);
const landingCrossA=new THREE.Mesh(new THREE.BoxGeometry(.9,.025,.055),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9}));
const landingCrossB=landingCrossA.clone();
landingCrossB.rotation.y=Math.PI/2;
landingPreview.add(landingCrossA,landingCrossB);
landingPreview.position.y=.035;
landingPreview.visible=false;
stadium.add(landingPreview);

function updateScoreboard(){
 displayRuns=inningsRuns;displayBalls=inningsBalls;displayWickets=inningsWickets;
 const score=document.querySelector("#scoreValue"),overs=document.querySelector("#oversValue");
 if(score)score.textContent=inningsRuns+" / "+inningsWickets;
 if(overs)overs.textContent=Math.floor(inningsBalls/6)+"."+(inningsBalls%6)+" OVERS";
 const readout=document.querySelector("#inningsReadout");
 if(readout)readout.textContent=Math.floor(inningsBalls/6)+"."+ballsInOver+" OVERS · "+inningsRuns+" / "+inningsWickets;
}

function setDeliveryStatus(text){if(deliveryText)deliveryText.textContent=text;}

function resetFielders(){
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
  const speed=3.15+(i%3)*.45;
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
 document.querySelector(".batting-layout")?.classList.toggle("hidden",bowling);
 matchControls.classList.toggle("bowling-active",bowling);
 document.querySelector(".timing-meter")?.classList.toggle("hidden",bowling);
 document.querySelector(".control-foot")?.classList.toggle("hidden",bowling);
 document.querySelectorAll("[data-shot],[data-foot]").forEach(b=>b.disabled=bowling);
 if(bowling){deliveryBtn.disabled=true;setDeliveryStatus("BOWLING · SET YOUR DELIVERY");timingLabel.textContent="CHOOSE LENGTH · LINE · PACE";}
 else {deliveryBtn.disabled=deliveryActive||shotFlightActive;setDeliveryStatus("BATTER · WAIT FOR THE BALL");timingLabel.textContent="WAIT FOR THE BALL";}
}
function startBowlingDelivery(){
 if(controlMode!=="BOWL"||deliveryActive||shotFlightActive||inningsWickets>=10)return;
 bowlActive=true;deliveryActive=true;ballHit=false;shotFlightActive=false;bowlStart=performance.now();
 const paceMap={FAST:132,MEDIUM:112,SLOW:92};
 bowlSpeed=paceMap[bowlPace]+(Math.random()*6-3);
 deliverySpeed=bowlSpeed;deliveryLine=bowlLine==="OFF"?"OUTSIDE_OFF":bowlLine==="LEG"?"LEG":"ON_STUMPS";deliveryLength=bowlLength;
 deliveryLineX = deliveryLine === "OUTSIDE_OFF" ? -0.72 : (deliveryLine === "LEG" ? 0.72 : 0);
 deliveryBounceZ=deliveryLength==="FULL"?6.65:deliveryLength==="GOOD"?7.8:9;
 landingPreview.position.set(deliveryLineX,.035,deliveryBounceZ);landingPreview.visible=true;
 matchPhase="PREVIEW";setDeliveryStatus("BOWLER · "+bowlPace+" · "+bowlLength+" · "+bowlLine);ballSpeed.textContent=Math.round(bowlSpeed)+" KPH";
 bowlDeliver.disabled=true;
}
function updateBowlingDelivery(now){
 const elapsed=now-bowlStart;
 if(elapsed<700){
  bowler.position.copy(runUpStart);ball.position.copy(bowlerRelease).add(new THREE.Vector3(0,.05,0));landingPreview.visible=true;matchPhase="PREVIEW";return;
 }
 if(elapsed<2050){
  matchPhase="RUN_UP";const p=(elapsed-700)/1350;const e=p*p*(3-2*p);
  bowler.position.lerpVectors(runUpStart,bowlerRelease,e);ball.position.copy(bowlerRelease).add(new THREE.Vector3(0,.05,0));setDeliveryStatus("BOWLER RUN-UP · "+bowlPace);return;
 }
 if(elapsed<2300){
  matchPhase="RELEASE";const p=(elapsed-2050)/250;bowler.position.z=-16-p*.8;ball.position.set(0,1.95,-16);landingPreview.visible=false;setDeliveryStatus("RELEASE");return;
 }
 matchPhase="FLIGHT";const p=Math.min(1,(elapsed-2300)/720);const e=p*p*(3-2*p);
 const x=deliveryLineX*Math.sin(Math.PI*e);const z=releasePoint.z+(deliveryBounceZ-releasePoint.z)*e;
 let y=releasePoint.y+(bouncePoint.y-releasePoint.y)*e;
 if(p<.72)y+=1.65*Math.sin(Math.PI*(p/.72));else{const q=(p-.72)/.28;y=.24+.95*Math.sin(Math.PI*q);}
 ball.position.set(x,y,z);timingBar.style.width=Math.round(p*100)+"%";
 if(p>=1)resolveBowlingDelivery();
}
function resolveBowlingDelivery(){
 if(!bowlActive)return;
 bowlActive=false;deliveryActive=false;shotFlightActive=false;
 const paceFactor=Math.max(0,Math.min(1,(bowlSpeed-90)/50));
 const lineBonus=bowlLine==="STUMPS" ? .03 : 0;
 const lengthBonus=bowlLength==="GOOD" ? .025 : bowlLength==="FULL" ? .01 : 0;
 const wicketChance=Math.min(.18,.035+paceFactor*.04+lineBonus+lengthBonus);
 const r=Math.random();
 inningsBalls++;ballsInOver=inningsBalls%6;
 if(r<wicketChance){
  inningsWickets++;lastOutcome="WICKET · BOWLED / LBW";setDeliveryStatus("WICKET · "+(bowlLine==="STUMPS"?"BOWLED/LBW":"CAUGHT"));showToast("WICKET · "+(bowlLine==="STUMPS"?"BOWLED/LBW":"CAUGHT"));
 }else{
  const batR=Math.random();
  const runs=batR<.58?0:batR<.82?1:batR<.95?2:(batR<.99?4:6);
  inningsRuns+=runs;
  lastOutcome=runs?runs+" RUNS":"DOT BALL";
  setDeliveryStatus(runs?("AI BATTER · "+runs+" RUN"+(runs===1?"":"S")):"DOT BALL");
  if(runs)showToast(runs+" RUN"+(runs===1?"":"S"));
 }
 updateScoreboard();
 if(inningsWickets>=10){
  finishInningsAndSwitch();
  return;
 }
 setTimeout(()=>{resetDelivery();if(controlMode==="BOWL")setTimeout(startBowlingDelivery,700)},850);
}
function resetDelivery(){
 runState.active=false;runState.runs=0;runState.startedAt=0;runState.runnerProgress=0;runState.fielded=false;runState.throwActive=false;runState.deliveryCounted=false;runState.lastFrame=performance.now();
 if(runBtn){runBtn.classList.remove("active","running");runBtn.textContent="RUN";}
 deliveryActive=false;shotFlightActive=false;ballHit=false;matchPhase="READY";
 ball.position.set(0,.63,6.5);ball.visible=true;
 setDeliveryStatus("BOWLER READY");ballSpeed.textContent="-- KPH";
 timingLabel.textContent="WAIT FOR THE BALL";timingBar.style.width="0%";
 matchControls.classList.remove("ball-live","contact-window");
 document.querySelectorAll("[data-shot]").forEach(b=>b.disabled=true);
 document.querySelectorAll("[data-foot]").forEach(b=>b.classList.remove("selected"));
 deliveryBtn.disabled=false;deliveryBtn.textContent="DELIVER";
 resetJoystick();selectedFoot="";selectedShot="STROKE";currentRecommendation=null;
 resetFielders();updateScoreboard();showRecommendations();
}

function startDelivery(){
 if(controlMode!=="BAT")return;
 if(deliveryActive||shotFlightActive||inningsWickets>=10)return;
 deliveryActive=true;ballHit=false;shotFlightActive=false;deliveryStart=performance.now();
 deliveryDuration=3250;
 deliverySpeed=118+Math.random()*29;
 deliveryLine=["ON_STUMPS","OUTSIDE_OFF","LEG"][Math.floor(Math.random()*3)];
 deliveryLength=["FULL","GOOD","SHORT"][Math.floor(Math.random()*3)];
 deliveryLineX = deliveryLine === "OUTSIDE_OFF" ? -0.72 : (deliveryLine === "LEG" ? 0.72 : 0);
 deliveryBounceZ=deliveryLength==="FULL"?6.65:deliveryLength==="GOOD"?7.8:9.0;
 landingPreview.position.set(deliveryLineX,0.035,deliveryBounceZ);
 if(wasmEngine){
  wasmEngine.reset();
  wasmEngine.startDelivery(deliverySpeed,deliveryLineX,deliveryLength==="FULL" ? .42 : deliveryLength==="GOOD" ? .55 : .72,
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
 deliveryActive=false;shotFlightActive=false;ballHit=true;
 inningsWickets++;inningsBalls++;ballsInOver=inningsBalls%6;strikerBalls++;
 lastOutcome="WICKET · "+reason;setDeliveryStatus("WICKET · "+reason);
 timingLabel.textContent=reason;showToast("WICKET · "+reason);updateScoreboard();
 setTimeout(()=>{
  if(inningsWickets>=10)finishInningsAndSwitch();
  else resetDelivery();
 },1100);
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

function finishRuns(runs,label){
 inningsRuns+=runs;inningsBalls++;ballsInOver=inningsBalls%6;strikerRuns+=runs;strikerBalls++;
 lastOutcome=label||String(runs)+" RUNS";updateScoreboard();
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
 if(runBtn){runBtn.classList.add("active");runBtn.textContent="RUN";}

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
  runState.throwStart=now;
  const throwTime=520+Math.min(240,Math.max(0,Math.hypot(fielder.position.x-target.x,fielder.position.z-target.z)*45));
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
   const boundaryDistance=Math.hypot(ball.position.x,ball.position.z*.82);
   if(!resolved&&boundaryDistance>=43.5){
    resolved=true;shotFlightActive=false;
    if(runBtn)runBtn.classList.remove("active","running");
    const six=isLoft&&ball.position.y>1.5;
    finishRuns(six?6:4,six?"SIX!":"FOUR · BOUNDARY");
    setDeliveryStatus(six?"SIX · OVER THE ROPE":"FOUR · BOUNDARY");
    setTimeout(()=>{resetDelivery();setTimeout(()=>{if(matchPhase==="READY")startDelivery()},700)},850);
    return;
   }

   moveFieldersToBall(ball.position,.016);
   if(!runState.fielded&&fielder){
    const fd=Math.hypot(fielder.position.x-ball.position.x,fielder.position.z-ball.position.z);
    if(fd<1.0){
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

function startRun(){
 if(!shotFlightActive||resolvedRunState())return;
 if(runState.fielded){
  if(runState.throwActive)return;
  return;
 }
 if(runState.active)return;
 runState.active=true;
 runState.runs=runState.runs||0;
 runState.startedAt=performance.now();
 runState.runnerProgress=0;
 runState.deliveryCounted=false;
 if(runBtn){runBtn.classList.add("running");runBtn.textContent="RUNNING";}
 setDeliveryStatus("RUNNING · WATCH THE FIELDER");
 showToast("RUN!");
}
function resolvedRunState(){return !shotFlightActive||runState.deliveryCounted||runState.throwActive;}

function playShot(shot){
 if(!deliveryActive||ballHit)return;
 selectedShot=shot;
 const elapsed=performance.now()-deliveryStart;

 // Batting is now release-timed: click just before/at release for the strongest hit.
 // The game accepts contacts from 575ms early through 575ms late.
 if(elapsed<1850||elapsed>3000)return;

 const timing=timingPower(elapsed);
 const quality=timingQuality(elapsed);
 const foot=selectedFoot||"";
 const specialAllowed=deliveryLength==="SHORT"&&deliveryLine!=="ON_STUMPS";
 if(foot==="LEAVE"){
  if(deliveryLine==="OUTSIDE_OFF"&&deliveryLength!=="FULL"){resolveDot();return;}
  resolveWicket("LEAVE · BOWLED");return;
 }
 if(foot==="SPECIAL"&&!specialAllowed){resolveWicket("SPECIAL · WRONG DELIVERY");return;}
 if(timing<=0){resolveWicket(quality);return;}
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

document.querySelectorAll("[data-shot]").forEach(btn=>btn.addEventListener("click",()=>playShot(btn.dataset.shot)));
if(runBtn)runBtn.addEventListener("click",startRun);

function updateRunUpAndDelivery(now){
 if(!deliveryActive)return;
 const elapsed=now-deliveryStart;
 // Arm the bat buttons shortly before release so the player can react to the bowler.
 if(elapsed>=1850&&elapsed<=3000){
  document.querySelectorAll("[data-shot]").forEach(b=>b.disabled=false);
  const q=timingQuality(elapsed);
  timingLabel.textContent=q==="PERFECT"?"PERFECT RELEASE · HIT NOW":q+" · HIT NOW";
 }else if(elapsed<1850){
  document.querySelectorAll("[data-shot]").forEach(b=>b.disabled=true);
 }
 if(elapsed<750){
  matchPhase="PREVIEW";
  bowler.position.copy(runUpStart);
  setDeliveryStatus("LANDING SPOT");
  timingLabel.textContent="READ THE LANDING SPOT";
  return;
 }
 if(elapsed<2300){
  matchPhase="RUN_UP";
  const p=(elapsed-750)/1550;
  const eased=p*p*(3-2*p);
  bowler.position.lerpVectors(runUpStart,bowlerRelease,eased);
  bowler.rotation.y=Math.sin(p*Math.PI)*.08;
  ball.position.copy(bowlerRelease).add(new THREE.Vector3(0,.05,0));
  setDeliveryStatus("BOWLER RUN-UP");
  timingLabel.textContent="GET READY";
  return;
 }
 if(elapsed<2550){
  matchPhase="RELEASE";
  const p=(elapsed-2300)/250;
  bowler.position.z=-16.0-p*.8;
  ball.position.set(0,1.95,-16.0);
  landingPreview.visible=false;
  setDeliveryStatus("RELEASE");
  return;
 }
 matchPhase="FLIGHT";
 const p=Math.min(1,(elapsed-2550)/700);
 const eased=p*p*(3-2*p);
 const lineX=deliveryLineX*Math.sin(Math.PI*eased);
 const z=releasePoint.z+(deliveryBounceZ-releasePoint.z)*eased;
 let y=releasePoint.y+(bouncePoint.y-releasePoint.y)*eased;
 if(p<.72)y+=1.65*Math.sin(Math.PI*(p/.72));
 else{const q=(p-.72)/.28;y=.24+.95*Math.sin(Math.PI*q);}
 ball.position.set(lineX,y,z);
 if(p>.62&&p<.78){matchControls.classList.add("contact-window");timingLabel.textContent="BOUNCE · READ THE BALL";}
 else if(p>=0.28){document.querySelectorAll("[data-shot]").forEach(b=>b.disabled=false);timingLabel.textContent="CONTACT WINDOW · RELEASE TIMING";}
 timingBar.style.width=Math.round(p*100)+"%";
 if(p>=1)resolveDot();
}

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
 closeCoinToss();cover.classList.add("hidden");hud.classList.remove("hidden");matchControls.classList.remove("hidden");started=true;
 inningsRuns=0;inningsBalls=0;inningsWickets=0;strikerRuns=0;strikerBalls=0;ballsInOver=0;
 totalOvers=selectedFormat==="T20"?20:selectedFormat==="ODI"?50:9999;
 hudTeam.textContent=battingFirst.toUpperCase();
 document.querySelector(".match-pill b").textContent="INNINGS 1 · "+battingFirst.toUpperCase();
 setCamera("broadcast");resetFielders();resetDelivery();
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
   updateRunUpAndDelivery(now);
  }
 }
 requestAnimationFrame(liveBallLoop);
}
requestAnimationFrame(liveBallLoop);

startMatchBtn.addEventListener("click",()=>{setTimeout(()=>{preMatch.classList.remove("open");openCoinToss();},80);});


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
