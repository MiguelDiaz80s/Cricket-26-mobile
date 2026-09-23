import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas=document.querySelector("#scene");
const isMobileDevice=window.innerWidth<900 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);\nconst renderer=new THREE.WebGLRenderer({canvas,antialias:!isMobileDevice,powerPreference:"high-performance",failIfMajorPerformanceCaveat:false});
const mobilePixelRatio=Math.min(devicePixelRatio||1,1);\nrenderer.setPixelRatio(isMobileDevice?mobilePixelRatio:Math.min(devicePixelRatio||1,1.35));
renderer.setSize(innerWidth,innerHeight);
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
 for(let i=0;i<12;i++){x.fillStyle=i%2?"rgba(0,0,0,.045)":"rgba(255,255,255,.035)";x.fillRect(i*w/12,0,w/12,h)}
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
for(let tier=0;tier<5;tier++){
 const r=48+tier*3.9;
 for(let i=0;i<36;i++){
  const a=i/36*Math.PI*2;const x=Math.cos(a)*r,z=Math.sin(a)*r*.72;
  const block=meshBox(7.8,1.2,3.0,standBase,x,2.1+tier*1.9,z);block.rotation.y=-a;stadium.add(block);
  const seats=meshBox(7.2,.28,2.65,seatMat,x,2.78+tier*1.9,z);seats.rotation.y=-a;stadium.add(seats);
 }
}

const roof=material("#111817",.55,.35);
for(let i=0;i<28;i++){
 const a=i/28*Math.PI*2,r=61;
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
 for(let i=0;i<12;i++){
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
  const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,Math.max(.08,v.length()-r*2),10,16),mat);
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
 mesh(new THREE.SphereGeometry(.30,24,18,0,Math.PI*2,0,Math.PI*.60),hair,[0,2.08,0],[.94,1,.94]);
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
  mesh(new THREE.SphereGeometry(.38,28,18,0,Math.PI*2,0,Math.PI*.52),helmet,[0,2.15,0],[1,.96,.98]);
  const peak=mesh(new THREE.CapsuleGeometry(.055,.30,8,12),helmet,[0,2.06,-.33],[1,.65,.65]);
  peak.rotation.x=Math.PI/2;
 } else {
  mesh(new THREE.SphereGeometry(.39,28,18,0,Math.PI*2,0,Math.PI*.60),helmet,[0,2.13,0],[1,.98,.98]);
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
const keeper=player({team:1,role:"keeper",x:-.5,z:-13.9,scale:1.02});
const bowler=player({team:1,x:0,z:-20.5,scale:1.08});
const fielders=[[-16,-4],[17,-4],[-22,7],[22,8],[-18,22],[18,22],[-32,15],[31,15],[0,30],[0,-36]].map(([x,z])=>player({team:1,x,z,scale:.9}));

const ball=new THREE.Mesh(new THREE.SphereGeometry(.19,24,18),new THREE.MeshStandardMaterial({color:0x8d1119,roughness:.3,clearcoat:.35}));
ball.position.set(0,.63,6.5);ball.castShadow=true;stadium.add(ball);
const seam=new THREE.Mesh(new THREE.TorusGeometry(.13,.018,8,28),material("#ead6cf",.55));seam.rotation.x=Math.PI/2;ball.add(seam);

const boundaryBoards=[];
for(let i=0;i<48;i++){
 const a=i/48*Math.PI*2,r=43.9;const b=meshBox(5,.7,.08,material(theme.a,.55,.1),Math.cos(a)*r,.7,Math.sin(a)*r*.82);b.rotation.y=-a;stadium.add(b);boundaryBoards.push(b);
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
 requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;const t=now*.001;
 batter.position.y=.18+Math.sin(t*2)*.012;keeper.position.y=.18+Math.sin(t*2.5+.8)*.01;bowler.position.y=.18+Math.sin(t*1.8+.4)*.01;
 fielders.forEach((p,i)=>p.position.y=.18+Math.sin(t*1.5+i)*.007);
 crowd.rotation.y+=dt*.0007;if(!deliveryActive&&!ballHit){ball.position.y=.63+Math.sin(t*2.4)*.018;}ball.rotation.y+=dt*1.8;
 document.querySelector("#scoreValue").textContent=displayRuns+" / "+displayWickets;
 document.querySelector("#oversValue").textContent=Math.floor(displayBalls/6)+"."+(displayBalls%6)+" OVERS";
 lights.forEach((l,i)=>l.intensity=visualStyle==="bright"?(isMobileDevice?10:75)+Math.sin(t*1.3+i)*1:(isMobileDevice?16:115)+Math.sin(t*1.3+i)*2);
 if(cameraMode==="cinematic"&&started){cinematicTime+=dt;const a=cinematicTime*.16;camera.position.x=-45+Math.sin(a)*12;camera.position.z=45+Math.cos(a)*10;camera.position.y=12+Math.sin(a*1.7)*2;camera.lookAt(0,3,0)}
 renderer.render(scene,camera);
}
requestAnimationFrame(animate);
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(isMobileDevice?1:Math.min(devicePixelRatio||1,1.35))});

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
 const dt=Math.min((now-uiClock)/1000,.05);uiClock=now;
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
const deliveryBtn=document.querySelector("#deliveryBtn");
const deliveryText=document.querySelector("#deliveryText");
const ballSpeed=document.querySelector("#ballSpeed");

let tossWinner="",tossComplete=false,battingFirst="";
let matchPhase="IDLE",deliveryActive=false,shotFlightActive=false,ballHit=false;
let deliveryStart=0,deliveryDuration=1450,deliverySpeed=0;
let deliveryLine="ON_STUMPS",deliveryLength="FULL";
let inningsBalls=0,inningsRuns=0,inningsWickets=0,totalOvers=20,ballsInOver=0;
let strikerRuns=0,strikerBalls=0,lastOutcome="";

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
  const base=p.userData.base;
  const target=ballPos.clone();target.y=.18;
  const dist=Math.hypot(target.x-base.x,target.z-base.z);
  if(dist>2.8){
   const speed=.035+(i%3)*.009;
   p.position.x+=(target.x-p.position.x)*Math.min(1,dt*speed*28);
   p.position.z+=(target.z-p.position.z)*Math.min(1,dt*speed*28);
   p.userData.running=true;
  }else{
   p.position.x+=(base.x-p.position.x)*Math.min(1,dt*2);
   p.position.z+=(base.z-p.position.z)*Math.min(1,dt*2);
   p.userData.running=false;
  }
 });
}

function resetDelivery(){
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
 if(deliveryActive||shotFlightActive||inningsWickets>=10)return;
 deliveryActive=true;ballHit=false;shotFlightActive=false;deliveryStart=performance.now();
 deliveryDuration=3250;
 deliverySpeed=118+Math.random()*29;
 deliveryLine=["ON_STUMPS","OUTSIDE_OFF","LEG"][Math.floor(Math.random()*3)];
 deliveryLength=["FULL","GOOD","SHORT"][Math.floor(Math.random()*3)];
 deliveryLineX=deliveryLine==="OUTSIDE_OFF"?-.72:deliveryLine==="LEG"?.72:0;
 deliveryBounceZ=deliveryLength==="FULL"?6.65:deliveryLength==="GOOD"?7.8:9.0;
 landingPreview.position.set(deliveryLineX,0.035,deliveryBounceZ);
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

function calculateTiming(progress){
 return Math.max(0,1-Math.abs(progress-.84)/.25);
}

function resolveWicket(reason){
 deliveryActive=false;shotFlightActive=false;ballHit=true;
 inningsWickets++;inningsBalls++;ballsInOver=inningsBalls%6;strikerBalls++;
 lastOutcome="WICKET · "+reason;setDeliveryStatus("WICKET · "+reason);
 timingLabel.textContent=reason;showToast("WICKET · "+reason);updateScoreboard();
 setTimeout(()=>{
  if(inningsWickets<10)resetDelivery();
  else{matchPhase="INNINGS_OVER";deliveryBtn.disabled=true;showToast("INNINGS COMPLETE · "+inningsRuns+" / "+inningsWickets);}
 },1100);
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

function resolveBallFlight(origin,direction,exitSpeed,shot,quality){
 shotFlightActive=true;ballHit=true;deliveryActive=false;
 const start=origin.clone(),dir=direction.clone().normalize(),horizontal=new THREE.Vector3(dir.x,0,dir.z).normalize();
 const isLoft=shot==="LOFT",distance=isLoft?16+exitSpeed*.28:8+exitSpeed*.20;
 const target=start.clone().add(horizontal.multiplyScalar(distance));target.y=isLoft?2.4:.28;
 const flightStart=performance.now(),flightDuration=Math.min(2400,850+exitSpeed*8);
 const highCatch=isLoft&&quality<.72;
 let resolved=false,nearestIndex=-1,nearestDist=999;
 fielders.forEach((f,i)=>{const d=Math.hypot(f.position.x-target.x,f.position.z-target.z);if(d<nearestDist){nearestDist=d;nearestIndex=i;}});
 if(nearestIndex>=0)fielders[nearestIndex].userData.target=target.clone();

 function animateShot(now){
  if(!shotFlightActive)return;
  const p=Math.min(1,(now-flightStart)/flightDuration),eased=p*p*(3-2*p);
  ball.position.lerpVectors(start,target,eased);
  ball.position.y=isLoft?start.y+(target.y-start.y)*eased+3.4*Math.sin(Math.PI*eased):Math.max(.28,start.y+(target.y-start.y)*eased+.7*Math.sin(Math.PI*eased));
  ball.rotation.x+=.28;ball.rotation.y+=.34;moveFieldersToBall(ball.position,.016);
  const fielder=nearestIndex>=0?fielders[nearestIndex]:null;
  const fd=fielder?Math.hypot(fielder.position.x-ball.position.x,fielder.position.z-ball.position.z):999;
  if(!resolved&&highCatch&&p>.48&&p<.90&&fd<1.55){resolved=true;shotFlightActive=false;resolveWicket("CAUGHT");return;}
  const boundaryDistance=Math.hypot(ball.position.x,ball.position.z*.82);
  if(!resolved&&boundaryDistance>=43.5){
   resolved=true;shotFlightActive=false;const six=isLoft&&ball.position.y>1.5;
   finishRuns(six?6:4,six?"SIX!":"FOUR · BOUNDARY");setDeliveryStatus(six?"SIX · OVER THE ROPE":"FOUR · BOUNDARY");
   setTimeout(()=>{resetDelivery();setTimeout(()=>{if(matchPhase==="READY")startDelivery()},700)},850);return;
  }
  if(p>=1&&!resolved){
   resolved=true;shotFlightActive=false;let runs=1;
   if(!isLoft&&quality>.72&&exitSpeed>42)runs=2;
   finishRuns(runs,runs===2?"TWO RUNS":"ONE RUN");setDeliveryStatus(runs+" RUN"+(runs===1?"":"S"));
   setTimeout(()=>{resetDelivery();setTimeout(()=>{if(matchPhase==="READY")startDelivery()},700)},750);return;
  }
  requestAnimationFrame(animateShot);
 }
 requestAnimationFrame(animateShot);
}

function playShot(shot){
 if(!deliveryActive||matchPhase!=="FLIGHT"||ballHit)return;
 selectedShot=shot;
 const progress=Math.max(0,Math.min(1,(performance.now()-deliveryStart)/deliveryDuration));
 if(progress<.56)return;
 const timing=calculateTiming(progress);
 const quality=timing>.84?"PERFECT":timing>.62?"GOOD":timing>.38?"OK":"LATE";
 const foot=selectedFoot||"";
 const specialAllowed=deliveryLength==="SHORT"&&deliveryLine!=="ON_STUMPS";
 if(foot==="LEAVE"){
  if(deliveryLine==="OUTSIDE_OFF"&&deliveryLength!=="FULL"){resolveDot();return;}
  resolveWicket("LEAVE · BOWLED");return;
 }
 if(foot==="SPECIAL"&&!specialAllowed){resolveWicket("SPECIAL · WRONG DELIVERY");return;}
 if(timing<.28){resolveWicket("MISTIMED");return;}
 const power=(shot==="LOFT"?1.12:shot==="STROKE"?1:.82)*(0.72+.28*timing);
 const exitSpeed=22+deliverySpeed*.18+32*timing*power;
 timingLabel.textContent="TIMING · "+quality;timingBar.style.width=Math.round(timing*100)+"%";
 if((quality==="LATE"||quality==="OK"&&deliveryLine==="OUTSIDE_OFF")&&Math.random()<.34){resolveWicket("EDGED");return;}
 const launch=shot==="LOFT"?48:shot==="STROKE"?24:10,yaw=hitDirection.x*.9;
 const flightDirection=new THREE.Vector3(Math.sin(yaw),Math.sin(launch*Math.PI/180),-Math.cos(yaw));
 setDeliveryStatus("SHOT · "+quality);showToast(shot+" · "+quality);
 resolveBallFlight(ball.position.clone(),flightDirection,exitSpeed,shot,timing);
}

document.querySelectorAll("[data-shot]").forEach(btn=>btn.addEventListener("click",()=>playShot(btn.dataset.shot)));

function updateRunUpAndDelivery(now){
 if(!deliveryActive)return;
 const elapsed=now-deliveryStart;
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
 else if(p>=.78){document.querySelectorAll("[data-shot]").forEach(b=>b.disabled=false);timingLabel.textContent="CONTACT WINDOW";}
 timingBar.style.width=Math.round(p*100)+"%";
 if(p>=1)resolveDot();
}

function openCoinToss(){
 coinToss.classList.add("open");tossPrompt.textContent="Choose HEADS or TAILS.";tossResult.textContent="WAITING FOR CALL";
 tossResult.classList.remove("winner");continueFromToss.disabled=true;tossComplete=false;tossChoices.forEach(b=>b.disabled=false);
}
function closeCoinToss(){coinToss.classList.remove("open")}

tossChoices.forEach(btn=>btn.addEventListener("click",()=>{
 if(tossComplete)return;tossChoices.forEach(b=>b.disabled=true);
 const call=btn.dataset.call,outcome=Math.random()<.5?"HEADS":"TAILS";
 tossWinner=outcome===call?homeTeam:awayTeam;battingFirst=tossWinner;
 coin.classList.remove("flipping");void coin.offsetWidth;coin.classList.add("flipping");tossPrompt.textContent="THE COIN IS IN THE AIR...";
 setTimeout(()=>{tossResult.textContent=outcome+" · "+tossWinner.toUpperCase()+" BATS FIRST";tossResult.classList.add("winner");tossPrompt.textContent=tossWinner.toUpperCase()+" WON THE TOSS.";continueFromToss.disabled=false;tossComplete=true;},1150);
}));

continueFromToss.addEventListener("click",()=>{
 closeCoinToss();cover.classList.add("hidden");hud.classList.remove("hidden");matchControls.classList.remove("hidden");started=true;
 inningsRuns=0;inningsBalls=0;inningsWickets=0;strikerRuns=0;strikerBalls=0;ballsInOver=0;
 totalOvers=selectedFormat==="T20"?20:selectedFormat==="ODI"?50:9999;
 hudTeam.textContent=battingFirst.toUpperCase();document.querySelector(".match-pill b").textContent="INNINGS 1 · "+battingFirst.toUpperCase();
 setCamera("broadcast");resetFielders();resetDelivery();showToast(battingFirst.toUpperCase()+" BAT FIRST · BOWLER RUN-UP");
 setTimeout(()=>{if(matchPhase==="READY"&&inningsWickets<10)startDelivery()},900);
});

deliveryBtn.addEventListener("click",startDelivery);
function liveBallLoop(now){if(deliveryActive)updateRunUpAndDelivery(now);requestAnimationFrame(liveBallLoop);}
requestAnimationFrame(liveBallLoop);

startMatchBtn.addEventListener("click",()=>{setTimeout(()=>{preMatch.classList.remove("open");openCoinToss();},80);});
