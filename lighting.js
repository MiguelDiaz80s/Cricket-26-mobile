import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

// Cricket 26 Mobile stadium lighting.
// The rig uses the same light types supported by glTF's KHR_lights_punctual
// extension: one directional "sun" and four point lights for the flood towers.

const LIGHTING_PRESETS = {
  DAYLIGHT: {
    ambientIntensity: 1.25,
    ambientColor: 0xa9c8e5,
    sunIntensity: 3.0,
    sunColor: 0xffe7bd,
    towerIntensity: 0.0,
    towerColor: 0xfff1c7,
    exposure: 1.12,
    fogColor: 0x07120f
  },
  "NIGHT SESSION": {
    ambientIntensity: 0.42,
    ambientColor: 0x20324d,
    sunIntensity: 0.08,
    sunColor: 0x6d82a8,
    towerIntensity: 105.0,
    towerColor: 0xfff4d0,
    exposure: 1.28,
    fogColor: 0x050912
  }
};

const TOWER_POSITIONS = [
  [-48, 24, -35],
  [ 48, 24, -35],
  [-48, 24,  35],
  [ 48, 24,  35]
];

function smoothstep01(t){
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

function makeFloodTower(scene, position, color=0xfff4d0, intensity=0){
  const light = new THREE.PointLight(color, intensity, 95, 2.0);
  light.position.set(position[0], position[1], position[2]);
  light.castShadow = false;
  scene.add(light);
  return light;
}

/**
 * Creates the stadium lighting rig and returns a controller.
 *
 * @param {THREE.Scene} scene
 * @param {THREE.WebGLRenderer} renderer
 * @param {object} [options]
 * @returns {{sun:THREE.DirectionalLight, ambient:THREE.HemisphereLight,
 *            towers:THREE.PointLight[], setMode:function, update:function}}
 */
export function createStadiumLighting(scene, renderer, options={}){
  const mobile = !!options.mobile;
  const tablet = !!options.tablet;

  const ambient = new THREE.HemisphereLight(0xa9c8e5, 0x11170f, 1.25);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffe7bd, 3.0);
  sun.position.set(-38, 55, 24);
  sun.castShadow = !mobile;
  const shadowSize = tablet ? 512 : (mobile ? 256 : 1024);
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  sun.shadow.camera.left = -65;
  sun.shadow.camera.right = 65;
  sun.shadow.camera.top = 65;
  sun.shadow.camera.bottom = -65;
  scene.add(sun);

  // Four glTF-style punctual point lights. On phones we still create all four,
  // but disable their shadows and use the same physically decaying light model.
  const towers = TOWER_POSITIONS.map(p => makeFloodTower(scene, p));

  const state = {
    mode: "DAYLIGHT",
    targetMode: "DAYLIGHT",
    progress: 0,
    targetProgress: 0,
    duration: Math.max(250, options.transitionMs ?? 1400),
    startAmbientIntensity: ambient.intensity,
    startAmbientColor: ambient.color.clone(),
    startSunIntensity: sun.intensity,
    startSunColor: sun.color.clone(),
    startTowerIntensity: 0,
    startTowerColor: towers[0].color.clone(),
    startExposure: renderer.toneMappingExposure,
    startFogColor: scene.fog?.color?.clone() ?? new THREE.Color(0x07120f),
    fromMode: "DAYLIGHT"
  };

  function beginTransition(mode){
    const next = mode === "NIGHT" || mode === "NIGHT SESSION" ? "NIGHT SESSION" : "DAYLIGHT";
    state.fromMode = state.targetMode;
    state.targetMode = next;
    state.startAmbientIntensity = ambient.intensity;
    state.startAmbientColor.copy(ambient.color);
    state.startSunIntensity = sun.intensity;
    state.startSunColor.copy(sun.color);
    state.startTowerIntensity = towers[0]?.intensity ?? 0;
    state.startTowerColor.copy(towers[0]?.color ?? new THREE.Color(0xfff4d0));
    state.startExposure = renderer.toneMappingExposure;
    if(scene.fog?.color) state.startFogColor.copy(scene.fog.color);
    state.progress = 0;
    state.targetProgress = 1;
    state.mode = next;
  }

  function setMode(mode, immediate=false){
    const next = mode === "NIGHT" || mode === "NIGHT SESSION" ? "NIGHT SESSION" : "DAYLIGHT";
    if(immediate){
      state.targetMode = next;
      state.mode = next;
      state.progress = 1;
      state.targetProgress = 1;
      const preset = LIGHTING_PRESETS[next];
      ambient.color.setHex(preset.ambientColor);
      ambient.intensity = preset.ambientIntensity;
      sun.color.setHex(preset.sunColor);
      sun.intensity = preset.sunIntensity;
      towers.forEach(t => { t.color.setHex(preset.towerColor); t.intensity = preset.towerIntensity; });
      renderer.toneMappingExposure = preset.exposure;
      if(scene.fog?.color) scene.fog.color.setHex(preset.fogColor);
      return;
    }
    if(next === state.targetMode && state.progress >= 1) return;
    beginTransition(next);
  }

  function update(deltaMs){
    if(state.progress >= 1) return;
    state.progress = Math.min(1, state.progress + deltaMs / state.duration);
    const t = smoothstep01(state.progress);
    const target = LIGHTING_PRESETS[state.targetMode];

    ambient.intensity = THREE.MathUtils.lerp(state.startAmbientIntensity, target.ambientIntensity, t);
    ambient.color.copy(state.startAmbientColor).lerp(new THREE.Color(target.ambientColor), t);
    sun.intensity = THREE.MathUtils.lerp(state.startSunIntensity, target.sunIntensity, t);
    sun.color.copy(state.startSunColor).lerp(new THREE.Color(target.sunColor), t);

    towers.forEach(tower => {
      tower.intensity = THREE.MathUtils.lerp(state.startTowerIntensity, target.towerIntensity, t);
      tower.color.copy(state.startTowerColor).lerp(new THREE.Color(target.towerColor), t);
      // Keep the point-light attenuation enabled at all times.
      tower.distance = 95;
      tower.decay = 2.0;
    });

    renderer.toneMappingExposure = THREE.MathUtils.lerp(state.startExposure, target.exposure, t);
    if(scene.fog?.color) scene.fog.color.copy(state.startFogColor).lerp(new THREE.Color(target.fogColor), t);
  }

  // Convenience hook for game-state systems.
  function setGameState(gameState){
    setMode(gameState === "NIGHT SESSION" || gameState === "NIGHT" ? "NIGHT SESSION" : "DAYLIGHT");
  }

  return { ambient, sun, towers, setMode, setGameState, update, state };
}

export { LIGHTING_PRESETS };
