import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js";

const canvas=document.querySelector("#scene");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x07120f);
scene.fog=new THREE.FogExp2(0x07120f,.0068);

const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.1,1000);
camera.position.set(30,12,30);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true; controls.dampingFactor=.055; controls.enablePan=false;
controls.minDistance=8; controls.maxDistance=110; controls.maxPolarAngle=Math.PI*.49;
controls.target.set(0,2,0);

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
sun.position.set(-38,55,24);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);
sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=65;sun.shadow.camera.bottom=-65;
scene.add(sun);

function canvasTexture(width,height,draw,repeatX=1,repeatY=1){
 const c=document.createElement("canvas");c.width=width;c.height=height;const x=c.getContext("2d");draw(x,width,height);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeatX,repeatY);t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
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
for(let i=0;i<2400;i++){
 const a=Math.random()*Math.PI*2,r=49+Math.random()*11,y=3+Math.floor(Math.random()*5)*1.85+Math.random();
 const p=new THREE.Mesh(new THREE.SphereGeometry(.12+Math.random()*.09,7,6),material("#"+crowdColors[Math.floor(Math.random()*crowdColors.length)].toString(16).padStart(6,"0"),1));
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
 const l=new THREE.SpotLight(0xfff0c7,115,85,Math.PI/4,.5,1.25);
 l.position.set(0,24,0);l.target.position.set(0,0,0);g.add(l,l.target);lights.push(l);
 stadium.add(g);
}
[[-48,-35],[48,-35],[-48,35],[48,35]].forEach(p=>floodlight(...p));

function limbBetween(a,b,r,mat){
 const mid=new THREE.Vector3().addVectors(a,b).multiplyScalar(.5);
 const len=a.distanceTo(b);
 const o=new THREE.Mesh(new THREE.CapsuleGeometry(r,Math.max(.08,len-r*2),6,10),mat);
 o.position.copy(mid);
 o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3().subVectors(b,a).normalize());
 return o;
}

function player({team=0,role="fielder",x=0,z=0,scale=.95}={}){
 const g=new THREE.Group();g.position.set(x,.18,z);g.scale.setScalar(scale);
 // PLAYER-ONLY: connected, smooth human anatomy. Body parts overlap at joints so they read as one person.
 const shirtColor=team===0?theme.a:"#e8ece8", trimColor=team===0?theme.b:"#b8c1bd", pantsColor=team===0?theme.a:"#f2f3ed";
 const skinColor=team===0?"#9b6849":"#8a573d";
 const shirt=material(shirtColor,.5),trim=material(trimColor,.42,.08),pants=material(pantsColor,.7),skin=material(skinColor,.78),hair=material("#241a15",.9),shoe=material("#111516",.3,.18);
 const helmet=material(team===0?theme.a:"#dce2df",.34,.3),seamMat=material(team===0?theme.b:"#bfc8c4",.38,.12);
 const add=(geo,mat,pos,sc=[1,1,1])=>{const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.scale.set(...sc);m.castShadow=true;m.receiveShadow=true;g.add(m);return m};
 const capsule=(r,len,mat,a,b)=>{const v=new THREE.Vector3().subVectors(b,a),mid=new THREE.Vector3().addVectors(a,b).multiplyScalar(.5);const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,Math.max(.06,len-r*2),10,18),mat);m.position.copy(mid);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());m.castShadow=true;m.receiveShadow=true;g.add(m);return m};
 // A broad athletic torso with tapered shoulders and a defined waist.
 add(new THREE.CapsuleGeometry(.39,.72,12,24),shirt,[0,1.18,0],[1.02,1,.80]);
 add(new THREE.SphereGeometry(.32,24,18),shirt,[0,.83,0],[1.10,.58,.84]);
 // Neck joins deeply into the torso and head.
 add(new THREE.CapsuleGeometry(.12,.18,10,18),skin,[0,1.69,0],[1,1,1]);
 add(new THREE.SphereGeometry(.285,28,22),skin,[0,2.00,0],[.95,1.06,.96]);
 add(new THREE.SphereGeometry(.295,24,18,0,Math.PI*2,0,Math.PI*.60),hair,[0,2.08,0],[.95,1,.96]);
 add(new THREE.SphereGeometry(.048,12,10),skin,[-.275,2.00,0]);
 add(new THREE.SphereGeometry(.048,12,10),skin,[.275,2.00,0]);
 // Shoulders are rounded and substantially thicker than before; upper/lower arms overlap.
 const shoulderL=new THREE.Vector3(-.39,1.43,0),shoulderR=new THREE.Vector3(.39,1.43,0);
 const elbowL=new THREE.Vector3(-.53,1.15,-.015),elbowR=new THREE.Vector3(.53,1.15,-.015);
 const handL=new THREE.Vector3(-.46,.91,-.055),handR=new THREE.Vector3(.46,.91,-.055);
 capsule(.145,.30,shirt,shoulderL,elbowL);
 capsule(.115,.27,skin,elbowL,handL);
 capsule(.145,.30,shirt,shoulderR,elbowR);
 capsule(.115,.27,skin,elbowR,handR);
 add(new THREE.SphereGeometry(.11,18,14),skin,handL.toArray(),[1,.9,.85]);
 add(new THREE.SphereGeometry(.11,18,14),skin,handR.toArray(),[1,.9,.85]);
 // Legs are thicker and overlap the hips/knees instead of looking like detached rods.
 const hipL=new THREE.Vector3(-.17,.82,0),hipR=new THREE.Vector3(.17,.82,0);
 const kneeL=new THREE.Vector3(-.20,.43,-.01),kneeR=new THREE.Vector3(.20,.43,-.01);
 const ankleL=new THREE.Vector3(-.20,.12,-.09),ankleR=new THREE.Vector3(.20,.12,-.09);
 capsule(.145,.36,pants,hipL,kneeL);capsule(.13,.31,pants,kneeL,ankleL);
 capsule(.145,.36,pants,hipR,kneeR);capsule(.13,.31,pants,kneeR,ankleR);
 add(new THREE.SphereGeometry(.155,18,14),shoe,[-.20,.09,-.15],[1.08,.48,1.7]);
 add(new THREE.SphereGeometry(.155,18,14),shoe,[.20,.09,-.15],[1.08,.48,1.7]);
 // Headgear is rounded, not blocky.
 if(role!=="keeper"){
  add(new THREE.SphereGeometry(.38,28,18,0,Math.PI*2,0,Math.PI*.52),helmet,[0,2.15,0],[1,1,.98]);
  add(new THREE.CapsuleGeometry(.055,.34,8,14),helmet,[0,2.04,-.34],[1,.55,.7]).rotation.x=Math.PI/2;
 }else{
  add(new THREE.SphereGeometry(.39,28,18,0,Math.PI*2,0,Math.PI*.60),helmet,[0,2.13,0],[1,1,.98]);
  [-.19,0,.19].forEach((xx,i)=>{const bar=add(new THREE.CapsuleGeometry(.02,.46,6,10),seamMat,[xx,1.99,-.35],[1,1,.7]);bar.rotation.z=(i-1)*.1});
 }
 if(role==="batter"){
  const pad=material("#e9e8df",.48),glove=material("#e6e1d0",.48);
  // Pads hug the legs rather than floating beside them.
  add(new THREE.CapsuleGeometry(.125,.50,10,18),pad,[-.20,.52,-.145],[1.12,1,.72]);
  add(new THREE.CapsuleGeometry(.125,.50,10,18),pad,[.20,.52,-.145],[1.12,1,.72]);
  add(new THREE.SphereGeometry(.145,18,14),glove,handL.toArray(),[1.05,.9,.85]);
  add(new THREE.SphereGeometry(.145,18,14),glove,handR.toArray(),[1.05,.9,.85]);
  // Bat is positioned into the hands, not beside them: both hands grip the handle.
  const batGroup=new THREE.Group();batGroup.position.set(.43,.95,-.22);batGroup.rotation.z=-.16;batGroup.rotation.x=.05;
  const blade=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.88,10,18),material("#c99b54",.45));blade.scale.set(1.15,1,.52);blade.position.y=.02;blade.castShadow=true;blade.receiveShadow=true;
  const handle=new THREE.Mesh(new THREE.CapsuleGeometry(.052,.42,8,14),material("#4b3427",.7));handle.position.y=.62;handle.castShadow=true;handle.receiveShadow=true;
  batGroup.add(blade,handle);g.add(batGroup);
  // Move the hands onto the bat handle so the bat and arms visibly connect.
  const gripTop=new THREE.Vector3(.43,.95,-.22).add(new THREE.Vector3(0,.83,0));
  const gripBottom=new THREE.Vector3(.43,.95,-.22).add(new THREE.Vector3(0,.48,0));
  handL.copy(gripBottom);handR.copy(gripTop);
  // Overlay gloves exactly at the grip points.
  add(new THREE.SphereGeometry(.145,18,14),glove,handL.toArray(),[1.05,.9,.85]);
  add(new THREE.SphereGeometry(.145,18,14),glove,handR.toArray(),[1.05,.9,.85]);
 } else if(role==="keeper"){
  const glove=material("#eeeadd",.48),pad=material("#e6e5dc",.52);
  // Keeper gloves sit directly at the ends of the arms.
  add(new THREE.SphereGeometry(.23,20,16),glove,[-.56,.95,-.10],[1.15,.9,.9]);
  add(new THREE.SphereGeometry(.23,20,16),glove,[.56,.95,-.10],[1.15,.9,.9]);
  add(new THREE.CapsuleGeometry(.125,.50,10,18),pad,[-.20,.52,-.16],[1.12,1,.72]);
  add(new THREE.CapsuleGeometry(.125,.50,10,18),pad,[.20,.52,-.16],[1.12,1,.72]);
 }
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
 stadium.add(g);return g;
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
function setCamera(name){cameraMode=name;document.querySelectorAll(".camera").forEach(b=>b.classList.toggle("active",b.dataset.camera===name));const c=cameras[name];camera.position.set(...c.pos);controls.target.set(...c.target);controls.update()}
document.querySelectorAll(".camera").forEach(b=>b.addEventListener("click",()=>setCamera(b.dataset.camera)));
document.querySelector("#enterBtn").addEventListener("click",()=>{document.querySelector("#intro").classList.add("hidden");document.querySelector("#hint").classList.add("hide");started=true;setCamera("cinematic");setTimeout(()=>setCamera("broadcast"),4200)});

setCountry("Australia");
let last=performance.now();
function animate(now){
 requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;controls.update();const t=now*.001;
 batter.position.y=.18+Math.sin(t*2)*.012;keeper.position.y=.18+Math.sin(t*2.5+.8)*.01;bowler.position.y=.18+Math.sin(t*1.8+.4)*.01;
 fielders.forEach((p,i)=>p.position.y=.18+Math.sin(t*1.5+i)*.007);
 crowd.rotation.y+=dt*.0007;ball.position.y=.63+Math.sin(t*2.4)*.018;ball.rotation.y+=dt*1.8;
 lights.forEach((l,i)=>l.intensity=visualStyle==="bright"?75+Math.sin(t*1.3+i)*3:115+Math.sin(t*1.3+i)*4);
 if(cameraMode==="cinematic"&&started){cinematicTime+=dt;const a=cinematicTime*.16;camera.position.x=-45+Math.sin(a)*12;camera.position.z=45+Math.cos(a)*10;camera.position.y=12+Math.sin(a*1.7)*2;controls.target.lerp(new THREE.Vector3(0,3,0),.025)}
 renderer.render(scene,camera);
}
requestAnimationFrame(animate);
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65))});