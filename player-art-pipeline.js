import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

/**
 * Mobile-friendly procedural PBR surface maps for the fallback players.
 * The generated cloth/skin detail is a lightweight approximation, not artist-baked data.
 * Licensed GLB assets with authored textures can replace these maps later.
 */
function canvasTexture(size, draw, colorSpace = THREE.NoColorSpace) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { alpha: false });
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = colorSpace;
  texture.anisotropy = 2;
  texture.needsUpdate = true;
  return texture;
}

function makeFabricSet() {
  const map = canvasTexture(128, (ctx, s) => {
    ctx.fillStyle = "#f3f1eb"; ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 4) {
      ctx.fillStyle = y % 8 === 0 ? "rgba(65,75,68,.10)" : "rgba(255,255,255,.30)";
      ctx.fillRect(0, y, s, 1);
    }
    for (let x = 0; x < s; x += 4) {
      ctx.fillStyle = x % 8 === 0 ? "rgba(65,75,68,.09)" : "rgba(255,255,255,.22)";
      ctx.fillRect(x, 0, 1, s);
    }
  }, THREE.SRGBColorSpace);
  map.repeat.set(2.2, 2.8);

  const normalMap = canvasTexture(128, (ctx, s) => {
    ctx.fillStyle = "rgb(128,128,255)"; ctx.fillRect(0, 0, s, s);
    for (let i = -s; i < s * 2; i += 5) {
      ctx.strokeStyle = "rgba(158,128,255,.52)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + s, s); ctx.stroke();
      ctx.strokeStyle = "rgba(98,128,255,.48)";
      ctx.beginPath(); ctx.moveTo(i + 2, 0); ctx.lineTo(i + s + 2, s); ctx.stroke();
    }
  });
  normalMap.repeat.set(2.2, 2.8);

  const roughnessMap = canvasTexture(64, (ctx, s) => {
    ctx.fillStyle = "#d9d9d9"; ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 3) for (let x = 0; x < s; x += 3) {
      const v = 195 + ((x * 13 + y * 7) % 45);
      ctx.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
      ctx.fillRect(x, y, 2, 2);
    }
  });
  roughnessMap.repeat.set(2.2, 2.8);

  const aoMap = canvasTexture(64, (ctx, s) => {
    ctx.fillStyle = "#eeeeee"; ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 8) {
      ctx.fillStyle = "rgba(25,30,27,.10)"; ctx.fillRect(0, y, s, 1);
    }
  });
  return { map, normalMap, roughnessMap, aoMap, normalScale: new THREE.Vector2(.16, .16), aoMapIntensity: .28 };
}

function makeSkinSet() {
  const map = canvasTexture(128, (ctx, s) => {
    ctx.fillStyle = "#f4e5d7"; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 320; i++) {
      const x = (i * 37) % s, y = (i * 61 + (i % 11) * 7) % s;
      ctx.fillStyle = i % 3 === 0 ? "rgba(118,76,54,.11)" : "rgba(255,255,255,.15)";
      ctx.beginPath(); ctx.arc(x, y, i % 5 === 0 ? 1.05 : .55, 0, Math.PI * 2); ctx.fill();
    }
  }, THREE.SRGBColorSpace);
  const normalMap = canvasTexture(128, (ctx, s) => {
    ctx.fillStyle = "rgb(128,128,255)"; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 220; i++) {
      const x = (i * 37) % s, y = (i * 61 + (i % 13) * 5) % s;
      ctx.fillStyle = i % 2 ? "rgba(136,126,255,.34)" : "rgba(120,132,255,.30)";
      ctx.beginPath(); ctx.arc(x, y, i % 4 === 0 ? 1.1 : .65, 0, Math.PI * 2); ctx.fill();
    }
  });
  const roughnessMap = canvasTexture(64, (ctx, s) => {
    ctx.fillStyle = "#d8d8d8"; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 180; i++) {
      const v = 185 + (i % 55), x = (i * 17) % s, y = (i * 29) % s;
      ctx.fillStyle = "rgb(" + v + "," + v + "," + v + ")"; ctx.fillRect(x, y, 1, 1);
    }
  });
  return { map, normalMap, roughnessMap, normalScale: new THREE.Vector2(.075, .075) };
}

let sharedSets = null;
export function createPlayerSurfaceSet() {
  if (!sharedSets) sharedSets = { fabric: makeFabricSet(), skin: makeSkinSet() };
  return sharedSets;
}

export function applyPlayerSurface(material, maps) {
  material.map = maps.map;
  material.normalMap = maps.normalMap;
  material.normalScale = maps.normalScale;
  material.roughnessMap = maps.roughnessMap;
  if (maps.aoMap) {
    material.aoMap = maps.aoMap;
    material.aoMapIntensity = maps.aoMapIntensity;
  }
  material.needsUpdate = true;
  return material;
}
