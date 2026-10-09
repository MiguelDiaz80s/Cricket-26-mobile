import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";

/**
 * Web-optimized player model loader for Cricket 26 Mobile.
 *
 * Add a licensed, rigged GLB at ./assets/players/cricketer.glb.
 * This module intentionally does not download a third-party model automatically:
 * asset licences and model-specific scale/rig conventions must be checked first.
 */
export class PlayerModelRig {
  constructor({ url = "./assets/players/cricketer.glb", onLoad, onError } = {}) {
    this.url = url;
    this.onLoad = onLoad;
    this.onError = onError;
    this.loader = new GLTFLoader();
    this.root = new THREE.Group();
    this.mixer = null;
    this.actions = new Map();
    this.currentAction = null;
    this.clips = [];
    this.ready = false;
  }

  load() {
    return new Promise((resolve, reject) => {
      this.loader.load(this.url, (gltf) => {
        const model = gltf.scene;
        model.traverse((node) => {
          if (!node.isMesh) return;
          node.castShadow = true;
          node.receiveShadow = true;
          if (node.material) {
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            for (const material of materials) {
              if ("roughness" in material) material.roughness = Math.max(material.roughness ?? 0.7, 0.45);
            }
          }
        });

        // Keep physics position/yaw on this stable root; scale/offset the visual asset inside it.
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const height = Math.max(size.y, 0.001);
        model.scale.setScalar(2.0 / height);
        const scaledBounds = new THREE.Box3().setFromObject(model);
        model.position.y -= scaledBounds.min.y;
        this.root.add(model);

        this.mixer = new THREE.AnimationMixer(model);
        this.clips = gltf.animations || [];
        for (const clip of this.clips) this.actions.set(clip.name.toLowerCase(), this.mixer.clipAction(clip));
        this.ready = true;
        if (this.onLoad) this.onLoad(this);
        resolve(this);
      }, undefined, (error) => {
        if (this.onError) this.onError(error);
        reject(error);
      });
    });
  }

  /** Apply C++/WASM world pose to the model root. Coordinates are world units. */
  setPhysicsPose({ x, y = 0.18, z, yaw = 0, scale = 1 }) {
    this.root.position.set(x, y, z);
    this.root.rotation.y = yaw;
    this.root.scale.setScalar(scale);
  }

  /** Play a matching imported clip, e.g. idle, batting, bowling, run, catch or throw. */
  play(name, { fade = 0.18, loop = THREE.LoopRepeat } = {}) {
    if (!this.mixer || !this.actions.size) return false;
    const wanted = name.toLowerCase();
    let action = this.actions.get(wanted);
    if (!action) action = [...this.actions.entries()].find(([key]) => key.includes(wanted))?.[1];
    if (!action) return false;
    action.reset();
    action.setLoop(loop);
    action.clampWhenFinished = loop === THREE.LoopOnce;
    action.enabled = true;
    action.fadeIn(fade);
    if (this.currentAction && this.currentAction !== action) this.currentAction.fadeOut(fade);
    action.play();
    this.currentAction = action;
    return true;
  }

  update(deltaSeconds) {
    if (this.mixer) this.mixer.update(Math.min(Math.max(deltaSeconds, 0), 0.05));
  }
}

export function loadPlayerModel(options) {
  return new PlayerModelRig(options).load();
}
