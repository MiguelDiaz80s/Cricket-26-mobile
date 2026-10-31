import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_3LRlAv2uPx2EFAeCwQsULxcm2g6/hf_20261031_061736_416008bf-02fc-4adb-a84d-0168faa66e12.glb";
const core = window.C26Core;

if (core?.scene) {
  const loader = new GLTFLoader();
  loader.load(
    MODEL_URL,
    (gltf) => {
      const scene = core.scene;
      const oldWickets = [];
      scene.traverse((object) => {
        if (
          object.isGroup &&
          object.children.length === 5 &&
          object.children.every((child) => child.isMesh && child.userData.home)
        ) oldWickets.push(object);
      });

      if (!oldWickets.length) {
        console.warn("Cricket 26: procedural wicket groups were not found; keeping the existing scene.");
        return;
      }

      const source = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(source);
      const size = bounds.getSize(new THREE.Vector3());
      if (!Number.isFinite(size.y) || size.y <= 0.001) {
        console.error("Cricket 26: generated wicket model has invalid dimensions.");
        return;
      }

      const fitScale = 2.25 / size.y;
      const fittedBounds = bounds.clone();
      fittedBounds.min.multiplyScalar(fitScale);
      fittedBounds.max.multiplyScalar(fitScale);
      const groundOffset = -fittedBounds.min.y;

      oldWickets.forEach((oldWicket) => {
        const modelRoot = new THREE.Group();
        const model = source.clone(true);
        modelRoot.add(model);
        modelRoot.scale.setScalar(fitScale);
        modelRoot.position.set(oldWicket.position.x, groundOffset, oldWicket.position.z);
        modelRoot.rotation.copy(oldWicket.rotation);
        modelRoot.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = true;
          }
        });
        oldWicket.parent.add(modelRoot);
        oldWicket.visible = false;
      });

      console.info("Cricket 26: generated GLB wickets loaded.");
    },
    undefined,
    (error) => console.error("Cricket 26: generated wicket GLB could not load; procedural wickets remain active.", error)
  );
} else {
  console.warn("Cricket 26: scene bridge not ready; generated wicket model was not loaded.");
}
