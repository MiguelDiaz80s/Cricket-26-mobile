import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/utils/SkeletonUtils.js";

const loader = new GLTFLoader();
const assetCache = new Map();

/**
 * Optional rigged GLB path. Set window.CRICKET_PLAYER_MODEL_URL to a licensed,
 * rigged cricket-player .glb URL. Procedural players remain visible if loading fails.
 * Model-specific scale/forward direction can be tuned in the GLB before export.
 */
export async function attachRiggedPlayerModel(playerRoot, { url, role = "fielder" } = {}) {
  if (!url || typeof url !== "string") return false;
  try {
    let promise = assetCache.get(url);
    if (!promise) {
      promise = new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
      assetCache.set(url, promise);
    }
    const gltf = await promise;
    const model = cloneSkinned(gltf.scene);
    model.name = "ImportedRiggedPlayer";
    model.traverse((node) => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      if (node.material) {
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        for (const material of materials) {
          if ("roughness" in material) material.roughness = Math.max(material.roughness ?? .7, .38);
          if ("envMapIntensity" in material) material.envMapIntensity = .55;
        }
      }
    });

    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const height = Math.max(size.y, .001);
    model.scale.setScalar(2.04 / height);
    const scaledBounds = new THREE.Box3().setFromObject(model);
    model.position.y -= scaledBounds.min.y;

    // Keep procedural geometry as a fallback but hide it after a real model loads.
    playerRoot.traverse((node) => {
      if (node.userData && node.userData.proceduralFallback) node.visible = false;
    });
    playerRoot.add(model);

    if (gltf.animations && gltf.animations.length) {
      const mixer = new THREE.AnimationMixer(model);
      playerRoot.userData.importedAnimationMixer = mixer;
      playerRoot.userData.importedAnimationClips = gltf.animations;
      const preferred = role === "batter" ? /bat|idle|ready/i : /idle|stand|ready/i;
      const clip = gltf.animations.find((entry) => preferred.test(entry.name)) || gltf.animations[0];
      const action = mixer.clipAction(clip);
      action.play();
      playerRoot.userData.importedAnimationAction = action;
    }
    playerRoot.userData.importedPlayerModel = model;
    return true;
  } catch (error) {
    console.warn("[Cricket 26] Rigged player model unavailable; keeping procedural fallback.", error);
    return false;
  }
}

export function updateRiggedPlayerModel(playerRoot, deltaSeconds) {
  playerRoot.userData.importedAnimationMixer?.update(Math.min(Math.max(deltaSeconds, 0), .05));
}
