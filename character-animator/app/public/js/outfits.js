// outfits.js — realistic clothing "skins".
//
// An outfit is a palette over the mesh's clothing regions (see
// rig.js): skin, top, bottom, shoes and hair, each a PBR material
// with a procedurally painted canvas texture — skin mottling, fabric
// weave, denim twill — so the figure reads as a dressed person
// rather than a painted statue. `sleeve` and `legLower` say whether
// the upper arm / lower leg wear the top/bottom material or bare
// skin (a singlet and shorts, in the Sport outfit).

import * as THREE from "three";

function canvasTexture(size, painter, repeat = 3) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  painter(c.getContext("2d"), size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function speckle(ctx, s, n, alpha, light) {
  for (let i = 0; i < n; i++) {
    const v = Math.floor(Math.random() * 60) - 30;
    ctx.fillStyle = light && v > 0 ? `rgba(255,240,220,${alpha})` : `rgba(20,10,5,${alpha})`;
    ctx.fillRect(Math.random() * s, Math.random() * s, 1.5, 1.5);
  }
}

function skinTexture(base) {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) { // soft mottling
      const x = Math.random() * s, y = Math.random() * s, r = 8 + Math.random() * 26;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const warm = Math.random() > 0.5;
      g.addColorStop(0, warm ? "rgba(190,110,70,0.10)" : "rgba(120,70,40,0.10)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    speckle(ctx, s, 2600, 0.05, true);
  }, 2);
}

function fabricTexture(base, { weave = 0.05, rib = false } = {}) {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = `rgba(0,0,0,${weave})`;
    for (let y = 0; y < s; y += 2) ctx.fillRect(0, y, s, 1);
    ctx.fillStyle = `rgba(255,255,255,${weave})`;
    for (let x = 0; x < s; x += 2) ctx.fillRect(x, 0, 1, s);
    if (rib) {
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      for (let x = 0; x < s; x += 7) ctx.fillRect(x, 0, 2, s);
    }
    speckle(ctx, s, 1500, 0.04, true);
  }, 3);
}

function denimTexture(base) {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    for (let i = -s; i < s; i += 3) { // diagonal twill
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + s, s); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(0,0,0,0.09)";
    for (let i = -s; i < s; i += 3) {
      ctx.beginPath(); ctx.moveTo(i + 1, 0); ctx.lineTo(i + 1 + s, s); ctx.stroke();
    }
    speckle(ctx, s, 1800, 0.05, true);
  }, 3);
}

export const OUTFITS = {
  casual: {
    label: "Casual",
    skinTone: "#c68863", hairColor: "#4a3220", hairRough: 0.8,
    top: () => new THREE.MeshStandardMaterial({ map: fabricTexture("#54687f"), roughness: 0.9 }),
    bottom: () => new THREE.MeshStandardMaterial({ map: denimTexture("#33507c"), roughness: 0.92 }),
    shoes: () => new THREE.MeshStandardMaterial({ map: fabricTexture("#dcdcdc"), roughness: 0.55 }),
    sleeve: "top", legLower: "bottom",
  },
  business: {
    label: "Business",
    skinTone: "#b57e56", hairColor: "#241d18", hairRough: 0.65,
    top: () => new THREE.MeshStandardMaterial({ map: fabricTexture("#30343c", { weave: 0.035 }), roughness: 0.82 }),
    bottom: () => new THREE.MeshStandardMaterial({ map: fabricTexture("#26292f", { weave: 0.035 }), roughness: 0.82 }),
    shoes: () => new THREE.MeshStandardMaterial({ color: 0x131416, roughness: 0.28, metalness: 0.05 }),
    sleeve: "top", legLower: "bottom",
  },
  sport: {
    label: "Sport",
    skinTone: "#8a5a34", hairColor: "#17130f", hairRough: 0.85,
    top: () => new THREE.MeshStandardMaterial({ map: fabricTexture("#c93a30", { rib: true }), roughness: 0.5 }),
    bottom: () => new THREE.MeshStandardMaterial({ map: fabricTexture("#1e2126", { rib: true }), roughness: 0.55 }),
    shoes: () => new THREE.MeshStandardMaterial({ map: fabricTexture("#eef0ee"), roughness: 0.4 }),
    sleeve: "skin", legLower: "skin",
  },
  summer: {
    label: "Summer",
    skinTone: "#cf9264", hairColor: "#8a6a34", hairRough: 0.8,
    top: () => new THREE.MeshStandardMaterial({ map: fabricTexture("#d8dde2"), roughness: 0.9 }),
    bottom: () => new THREE.MeshStandardMaterial({ map: fabricTexture("#b39d72"), roughness: 0.9 }),
    shoes: () => new THREE.MeshStandardMaterial({ color: 0x6e4a2c, roughness: 0.6 }),
    sleeve: "top", legLower: "skin",
  },
};

// Build the 5-material array for an outfit, in REGION_INDEX order:
// [skin, top, bottom, shoes, hair].
export function buildOutfitMaterials(name) {
  const outfit = OUTFITS[name] || OUTFITS.casual;
  const skin = new THREE.MeshStandardMaterial({ map: skinTexture(outfit.skinTone), roughness: 0.55 });
  const hair = new THREE.MeshStandardMaterial({ color: new THREE.Color(outfit.hairColor), roughness: outfit.hairRough });
  return { outfit, materials: [skin, outfit.top(), outfit.bottom(), outfit.shoes(), hair] };
}

export function disposeMaterials(materials) {
  for (const m of Array.isArray(materials) ? materials : [materials]) {
    if (!m) continue;
    if (m.map) m.map.dispose();
    m.dispose();
  }
}
