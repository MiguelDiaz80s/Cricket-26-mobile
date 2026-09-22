/* CRICKET 26 MOBILE — advanced browser systems */
(function(){
"use strict";
const C=window.Cricket26Advanced={};

C.state={weather:"CLEAR",cloud:0,wetness:0,commentary:[],career:{season:1,form:.5,fatigue:0,cash:0},pattern:{off:0,straight:0,leg:0,dots:0},network:{connected:false,role:"offline"}};

C.pitch={days:0,wear:0,roughness:0,cracks:0,impact(x,z,e){this.wear=Math.min(1,this.wear+e*.0007);this.roughness=Math.min(1,this.roughness+e*.0008);this.cracks=Math.min(1,this.cracks+e*.00035);return this.sample(x,z)},sample(x,z){const edge=Math.min(1,Math.hypot(x/2.75,z/17));return {hardness:1-this.wear*.45,roughness:Math.min(1,this.roughness*(.65+.35*Math.abs(Math.sin(x*3.1+z*1.7)))),crack:this.cracks*edge,moisture:this.stateWet||.35}}};
C.pitch.stateWet=.35;

C.weather={set(type){C.state.weather=type;C.pitch.stateWet=type==="RAIN"?Math.min(1,C.pitch.stateWet+.25):type==="DRY"?Math.max(.05,C.pitch.stateWet-.15):C.pitch.stateWet;document.documentElement.dataset.weather=type},tick(dt){C.state.cloud=(C.state.cloud+dt*.004)%1;return C.state.cloud}};

C.commentary={
 lines:{dot:["Another dot ball. Pressure building."],boundary:["That's into the boundary!"],six:["Huge strike — maximum!"],wicket:["WICKET! The fielding side has the breakthrough."],milestone:["A milestone moment in the innings."],pressure:["The run rate is climbing and the bowler is under pressure."]},
 say(kind,extra=""){const list=this.lines[kind]||this.lines.pressure;const text=list[Math.floor(Math.random()*list.length)]+(extra?" "+extra:"");C.state.commentary.push(text);C.state.commentary=C.state.commentary.slice(-12);const el=document.querySelector("#liveCommentary");if(el){el.textContent=text;el.classList.add("show");clearTimeout(this.timer);this.timer=setTimeout(()=>el.classList.remove("show"),2800)}return text},
 event({runs=0,wicket=false,dots=0,score=0,balls=0}){C.state.pattern.dots=dots;if(wicket)return this.say("wicket");if(runs===6)return this.say("six");if(runs===4)return this.say("boundary");if(score&&score%50===0)return this.say("milestone");if(dots>=4)return this.say("pressure");return this.say("dot")}
};

C.career={
 state(){return C.state.career},
 train(type){const s=C.state.career;if(type==="bat")s.form=Math.min(1,s.form+.025);if(type==="bowl")s.form=Math.min(1,s.form+.02);if(type==="fitness")s.fatigue=Math.max(0,s.fatigue-.08);return s},
 match(minutes=120,won=false){const s=C.state.career;s.fatigue=Math.min(1,s.fatigue+minutes/2400);s.form=Math.max(0,Math.min(1,s.form+(won?.025:-.015)-s.fatigue*.01));s.cash+=won?125:35;return s}
};

C.tactics={
 choose(){const p=C.state.pattern;if(p.leg>p.off)return {line:"OFF_STUMP",length:"GOOD",field:"LEG_SIDE_TRAP"};if(p.off>p.leg)return {line:"OUTSIDE_OFF",length:"FULL",field:"SLIP_ATTACK"};return {line:"ON_STUMPS",length:"GOOD",field:"BALANCED"}},
 record(direction,runs){C.state.pattern[direction]=(C.state.pattern[direction]||0)+1;if(!runs)C.state.pattern.dots++}
};

C.audio={
 ctx:null,master:null,init(){if(this.ctx)return;this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.16;this.master.connect(this.ctx.destination)},
 tone(freq,duration=.08){this.init();const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.value=freq;o.type="triangle";g.gain.setValueAtTime(.0001,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.12,this.ctx.currentTime+.008);g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+duration);o.connect(g).connect(this.master);o.start();o.stop(this.ctx.currentTime+duration)},
 hit(){this.tone(170,.06)},boundary(){this.tone(90,.25)},wicket(){this.tone(55,.35)}
};

C.audioSpatial={cameraMode:"broadcast",setCamera(mode){this.cameraMode=mode;C.audio.master&&(C.audio.master.gain.value=mode==="batter"?.28:mode==="bowler"?.22:.16)}};

C.careerSave=()=>localStorage.setItem("cricket26-career",JSON.stringify(C.state.career));
C.careerLoad=()=>{try{Object.assign(C.state.career,JSON.parse(localStorage.getItem("cricket26-career")||"{}"))}catch{}};

C.assets={
 cache:new Map(),async load(url){if(this.cache.has(url))return this.cache.get(url);const p=fetch(url).then(r=>{if(!r.ok)throw Error("asset "+r.status);return r}).then(r=>r.blob());this.cache.set(url,p);return p},prefetch(urls){return Promise.all(urls.map(u=>this.load(u).catch(()=>null)))}};

C.net={
 pc:null,channel:null,signal:null,room:null,role:"offline",signalUrl:"",
 async create({signalUrl="",room="cricket26-demo"}={}){
  if(!("RTCPeerConnection" in window)||!("WebSocket" in window))return false;
  this.signalUrl=signalUrl||localStorage.getItem("cricket26-signal-url")||"";
  this.room=room;
  if(!this.signalUrl){C.state.network.role="offline";return false;}
  this.pc=new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"}]});
  this.pc.onicecandidate=e=>{if(e.candidate)this.signal({type:"ice",candidate:e.candidate})};
  this.pc.onconnectionstatechange=()=>{const s=this.pc.connectionState;C.state.network.connected=s==="connected"||s==="completed";if(s==="failed")this.disconnect()};
  this.pc.ondatachannel=e=>this.attachChannel(e.channel);
  this.signal=new WebSocket(this.signalUrl);
  this.signal.onmessage=async e=>{let m;try{m=JSON.parse(e.data)}catch{return}await this.handleSignal(m)};
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error("Signaling timeout")),8000);this.signal.onopen=()=>{clearTimeout(timer);resolve()};this.signal.onerror=()=>{clearTimeout(timer);reject(Error("Signaling connection failed"))}}).catch(()=>false);
  if(this.signal.readyState!==WebSocket.OPEN){this.disconnect();return false}
  this.signal({type:"join",room:this.room});
  C.state.network.role="waiting";
  return true;
 },
 attachChannel(ch){this.channel=ch;this.channel.onopen=()=>{C.state.network.connected=true;C.state.network.role=this.role};this.channel.onclose=()=>{C.state.network.connected=false}},
 signal(msg){if(this.signal?.readyState===WebSocket.OPEN)this.signal.send(JSON.stringify(msg))},
 async handleSignal(msg){
  if(msg.type==="joined"){if(msg.peers===2){this.role="guest";C.state.network.role="guest"}}
  if(msg.type==="peer-joined"&&!this.pc.localDescription){this.role="host";C.state.network.role="host";this.channel=this.pc.createDataChannel("cricket26");this.attachChannel(this.channel);const offer=await this.pc.createOffer();await this.pc.setLocalDescription(offer);this.signal({type:"offer",sdp:offer})}
  if(msg.type==="offer"){this.role="guest";C.state.network.role="guest";await this.pc.setRemoteDescription(msg.sdp);const answer=await this.pc.createAnswer();await this.pc.setLocalDescription(answer);this.signal({type:"answer",sdp:answer})}
  if(msg.type==="answer"&&this.role==="host")await this.pc.setRemoteDescription(msg.sdp);
  if(msg.type==="ice"&&msg.candidate)try{await this.pc.addIceCandidate(msg.candidate)}catch{}
  if(msg.type==="peer-left"){C.state.network.connected=false;C.state.network.role="waiting"}
 },
 disconnect(){try{this.channel?.close()}catch{}try{this.pc?.close()}catch{}try{this.signal?.close()}catch{}this.channel=null;this.pc=null;this.signal=null;C.state.network.connected=false;C.state.network.role="offline"},
 send(input){if(this.channel?.readyState==="open")this.channel.send(JSON.stringify({t:performance.now(),input}))}
};

C.pwa=()=>{if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{})};
C.save=()=>localStorage.setItem("cricket26-state",JSON.stringify(C.state));
C.load=()=>{try{const x=JSON.parse(localStorage.getItem("cricket26-state")||"null");if(x)Object.assign(C.state,x)}catch{}};
C.load();C.careerLoad();C.pwa();
window.addEventListener("beforeunload",C.careerSave);
document.addEventListener("pointerdown",()=>C.audio.init(),{once:true});
})();