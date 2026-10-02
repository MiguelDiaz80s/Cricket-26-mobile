import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

// Perfect-contact feedback: short camera impulse + 3D ribbon tail.
const DEFAULTS = {
  velocityThreshold: 62,
  shakeDuration: 150,
  shakeStrength: 0.075,
  tailDuration: 520,
  tailLength: 14,
  tailWidth: 0.18
};

function smoothstep(t){
  t=Math.max(0,Math.min(1,t));
  return t*t*(3-2*t);
}

function createTailMaterial(){
  return new THREE.ShaderMaterial({
    transparent:true,
    depthWrite:false,
    depthTest:true,
    blending:THREE.AdditiveBlending,
    uniforms:{
      uColor:{value:new THREE.Color(0xffffff)},
      uOpacity:{value:.82}
    },
    vertexShader:`
      attribute float aFade;
      varying float vFade;
      void main(){
        vFade=aFade;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }
    `,
    fragmentShader:`
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vFade;
      void main(){
        float edge=1.0-smoothstep(.0,1.0,abs(vFade-.5)*2.0);
        gl_FragColor=vec4(uColor,uOpacity*vFade*edge);
      }
    `
  });
}

export function createContactFeedback(scene,camera,options={}){
  const cfg=Object.assign({},DEFAULTS,options);
  const tailPoints=Array.from({length:cfg.tailLength*2},()=>new THREE.Vector3());
  const positions=new Float32Array(cfg.tailLength*2*3);
  const fades=new Float32Array(cfg.tailLength*2);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));
  geometry.setAttribute("aFade",new THREE.BufferAttribute(fades,1));
  const material=createTailMaterial();
  const ribbon=new THREE.LineSegments(geometry,material);
  ribbon.frustumCulled=false;
  ribbon.visible=false;
  scene.add(ribbon);

  const state={
    shakeUntil:0,
    shakeStrength:0,
    tailUntil:0,
    tailActive:false,
    speed:0,
    positions:[],
    duration:cfg.tailDuration
  };

  function triggerPerfectContact(ball,exitVelocity,shot="STROKE"){
    const speed=Math.abs(Number(exitVelocity)||0);
    if(speed<cfg.velocityThreshold)return false;

    const now=performance.now();
    state.shakeUntil=now+cfg.shakeDuration;
    state.shakeStrength=cfg.shakeStrength*Math.min(1.35,speed/cfg.velocityThreshold);
    state.tailUntil=now+cfg.tailDuration;
    state.tailActive=true;
    state.speed=speed;
    state.positions.length=0;
    state.positions.push(ball.position.clone());

    material.uniforms.uColor.value.setHex(shot==="LOFT"?0xffe8a3:0xffffff);
    material.uniforms.uOpacity.value=shot==="LOFT"?.9:.72;
    ribbon.visible=true;
    return true;
  }

  function update(ball,now=performance.now()){
    if(state.tailActive){
      state.positions.unshift(ball.position.clone());
      if(state.positions.length>cfg.tailLength)state.positions.length=cfg.tailLength;
      if(now>=state.tailUntil){state.tailActive=false;ribbon.visible=false;state.positions.length=0;}
      else if(state.positions.length>=2){
        for(let i=0;i<cfg.tailLength;i++){
          const p=state.positions[Math.min(i,state.positions.length-1)];
          const prev=state.positions[Math.min(i+1,state.positions.length-1)]||p;
          const tangent=new THREE.Vector3().subVectors(p,prev);
          if(tangent.lengthSq()<1e-7)tangent.set(0,1,0);else tangent.normalize();
          const viewDir=new THREE.Vector3().subVectors(camera.position,p).normalize();
          let side=new THREE.Vector3().crossVectors(tangent,viewDir);
          if(side.lengthSq()<1e-7)side.set(1,0,0);else side.normalize();
          const age=i/Math.max(1,cfg.tailLength-1);
          const width=cfg.tailWidth*(1-age)*(0.45+0.55*Math.min(1,state.speed/cfg.velocityThreshold));
          const left=p.clone().addScaledVector(side,width);
          const right=p.clone().addScaledVector(side,-width);
          tailPoints[i*2].copy(left);tailPoints[i*2+1].copy(right);
          const fade=(1-age)*(1-age);
          fades[i*2]=fade;fades[i*2+1]=fade;
        }
        for(let i=0;i<cfg.tailLength*2;i++){
          positions[i*3]=tailPoints[i].x;
          positions[i*3+1]=tailPoints[i].y;
          positions[i*3+2]=tailPoints[i].z;
        }
        geometry.attributes.position.needsUpdate=true;
        geometry.attributes.aFade.needsUpdate=true;
      }
    }

    if(now<state.shakeUntil){
      const remaining=(state.shakeUntil-now)/cfg.shakeDuration;
      const envelope=smoothstep(remaining);
      const amount=state.shakeStrength*envelope;
      camera.position.x+=((Math.random()-.5)*2)*amount;
      camera.position.y+=((Math.random()-.5)*2)*amount;
      camera.position.z+=((Math.random()-.5)*2)*amount;
    }
  }

  function dispose(){
    geometry.dispose();material.dispose();scene.remove(ribbon);
  }

  return {triggerPerfectContact,update,dispose,state,ribbon,threshold:cfg.velocityThreshold};
}
