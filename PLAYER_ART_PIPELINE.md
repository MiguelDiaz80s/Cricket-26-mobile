# Player art pipeline

The game now supports lightweight procedural PBR surface maps for its built-in fallback players and an optional rigged GLB import path.

## Current built-in improvements

- Repeating fabric albedo, normal, and roughness maps for shirts and trousers.
- Subtle skin albedo, normal, and roughness detail.
- A lightweight stylised AO map for cloth meshes.
- Restrained skin highlights that gradually change with match overs.
- Shared textures to avoid creating a new set of GPU textures for every player.

These procedural maps are approximations, not artist-authored textures or baked AO.

## Add a real rigged player model

1. Add a licensed, optimised, rigged model at `assets/players/cricketer.glb`, and keep its licence/attribution with the asset.
2. Export a humanoid skeleton and at least one looping idle/ready animation. Optional clips include batting, bowling, running, catching and throwing.
3. Keep the model facing its forward direction consistently. The loader normalises model height to about 2.04 game units.
4. In `index.html`, set `window.CRICKET_PLAYER_MODEL_URL = "./assets/players/cricketer.glb";` before the dynamic import of `game.js`.
5. Reload the site. If the file fails to load, the procedural player remains visible.

The loader clones skinned meshes, uses the GLB's embedded PBR materials, enables shadows, and starts a suitable idle/ready clip when one exists. Batting and bowling clip selection still needs to be connected to gameplay events.

## Important limits

This does not create console-quality NBA 2K art by itself. A real high-detail GLB, properly authored UVs, albedo/normal/roughness maps, baked AO, facial detail, and cricket-specific motion capture are still required. Mobile GPU memory, draw calls and animation complexity should be profiled on real devices.
