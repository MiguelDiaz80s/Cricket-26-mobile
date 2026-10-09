# Player model assets

Place the licensed, web-optimized player model at:

`assets/players/cricketer.glb`

Recommended asset requirements:
- glTF Binary (.glb), ideally under 5–8 MB for mobile.
- One skinned mesh / coherent human silhouette with a facial mesh and textures packed into the file.
- Humanoid skeleton with named animation clips that include at least `idle`, `batting`, `bowling`, `run`, `catch`, and `throw` (the loader also matches partial clip names).
- Model faces forward along its local -Z axis, stands upright, and has feet near the ground.
- Use baked/packed textures and avoid unnecessary materials, bones, and 4K textures.

## Asset licensing

Do not commit a Mixamo, Ready Player Me, or community model until its current licence permits this use and redistribution. Keep the source/licence URL and attribution requirements with the asset.

## Current integration status

`player-models.js` provides the Three.js `GLTFLoader` wrapper, a stable model root for physics poses, animation mixer support, and safe delta-time updates. The existing procedural players remain the fallback until a compatible licensed GLB is added and calibrated against the game's current player positions, bat/keeper equipment, and animations. This prevents a missing model from breaking game startup.
