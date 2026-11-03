import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/utils/SkeletonUtils.js";

const loader = new GLTFLoader();
const assetCache = new Map();

/**
 * Player assets must be genuine, rigged 3D models.
 * A JPG/PNG reference photo is never accepted as an in-game player.
 * Requirements: .glb/.gltf file, at least one SkinnedMesh, and real width/depth.
 */
export async function attachRiggedPlayerModel(playerRoot, { url, role = "fielder" } = {}) {
  if (!url || typeof url !== "string") return false;
  if (!/\.glb(?:$|[?#])|\.gltf(?:$|[?#])/i.test(url)) {
    console.warn("[Cricket 26] Player model rejected: use a real .glb or .gltf 3D asset, never a photo.");
    return false;
  }

  try {
    let promise = assetCache.get(url);
    if (!promise) {
      promise = new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
      assetCache.set(url, promise);
    }
    const gltf = await promise;
    const model = cloneSkinned(gltf.scene);
    model.name = "ImportedRigged3DPlayer";

    let skinnedMeshCount = 0;
    model.traverse((node) => {
      if (node.isSkinnedMesh) skinnedMeshCount++;
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      if (node.material) {
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        for (const material of materials) {
          if ("roughness" in material) material.roughness = Math.max(material.roughness ?? .7, .38);
          if ("envMapIntensity" in material) material.envMapIntensity = .7;
        }
      }
    });

    if (!skinnedMeshCount) {
      throw new Error("Player asset has no rigged SkinnedMesh; flat images and unrigged props are not valid player models.");
    }

    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const height = Math.max(size.y, .001);
    if (size.x / height < .12 || size.z / height < .12) {
      throw new Error("Player asset does not have enough 3D body depth; a flat photo/plane is not accepted.");
    }

    model.scale.setScalar(2.04 / height);
    const scaledBounds = new THREE.Box3().setFromObject(model);
    model.position.y -= scaledBounds.min.y;

    // Replace the procedural fallback only after a valid, volumetric rigged model loads.
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
    console.info("[Cricket 26] Rigged 3D player loaded:", model.name);
    return true;
  } catch (error) {
    console.warn("[Cricket 26] 3D player rejected/unavailable; keeping the 3D procedural fallback.", error);
    return false;
  }
}

export function updateRiggedPlayerModel(playerRoot, deltaSeconds) {
  playerRoot.userData.importedAnimationMixer?.update(Math.min(Math.max(deltaSeconds, 0), .05));
}
