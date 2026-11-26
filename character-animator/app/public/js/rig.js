// rig.js — the skeleton and the skinned mesh, built procedurally.
//
// Bones are THREE.Bone objects in a humanoid hierarchy. The mesh is
// generated in code: tube "chains" (torso, arms, legs) with shaped
// radius profiles, a blended sphere at every joint, and a hair cap.
// Rings at a joint blend 50/50 between the two bones that meet there;
// mid-segment rings belong wholly to their segment's bone, so posing
// bends the surface smoothly. Every quad is tagged with a clothing
// region (skin / top / bottom / shoes / hair / sleeve / legLower)
// and the geometry carries one material group per region, which is
// what lets outfits dress the figure realistically.

import * as THREE from "three";

// [name, parentName, localPosition] — relative to the parent bone.
// Rest pose is a relaxed A-pose.
export const BONE_DEFS = [
  ["hips",       null,        [ 0.00,  1.02,  0.00]],
  ["spine",      "hips",      [ 0.00,  0.16,  0.00]],
  ["chest",      "spine",     [ 0.00,  0.24,  0.00]],
  ["neck",       "chest",     [ 0.00,  0.22,  0.00]],
  ["head",       "neck",      [ 0.00,  0.10,  0.00]],
  ["upperArm.L", "chest",     [ 0.24,  0.16,  0.00]],
  ["lowerArm.L", "upperArm.L",[ 0.28, -0.08,  0.00]],
  ["hand.L",     "lowerArm.L",[ 0.26, -0.07,  0.00]],
  ["upperArm.R", "chest",     [-0.24,  0.16,  0.00]],
  ["lowerArm.R", "upperArm.R",[-0.28, -0.08,  0.00]],
  ["hand.R",     "lowerArm.R",[-0.26, -0.07,  0.00]],
  ["upperLeg.L", "hips",      [ 0.11, -0.06,  0.00]],
  ["lowerLeg.L", "upperLeg.L",[ 0.00, -0.44,  0.00]],
  ["foot.L",     "lowerLeg.L",[ 0.00, -0.44,  0.00]],
  ["upperLeg.R", "hips",      [-0.11, -0.06,  0.00]],
  ["lowerLeg.R", "upperLeg.R",[ 0.00, -0.44,  0.00]],
  ["foot.R",     "lowerLeg.R",[ 0.00, -0.44,  0.00]],
];

// Material indices in the outfit material array. "sleeve" and
// "legLower" are outfit-dependent (short sleeves / shorts expose
// skin) and are remapped by the app when an outfit is applied.
export const REGION_INDEX = { skin: 0, top: 1, bottom: 2, shoes: 3, hair: 4, sleeve: 1, legLower: 2 };

const BONE_INDEX = new Map(BONE_DEFS.map((d, i) => [d[0], i]));

function worldPositions() {
  const world = new Map();
  for (const [name, parent, local] of BONE_DEFS) {
    const p = parent ? world.get(parent) : new THREE.Vector3();
    world.set(name, p.clone().add(new THREE.Vector3(...local)));
  }
  return world;
}

const V3 = (a) => new THREE.Vector3(...a);

// Each chain: points [{at, r, bone}] where `bone` starts the segment
// at that point, and segRegions[i] is the clothing region of the
// segment from point i to point i+1.
function buildChains(world) {
  const at = (name, dy = 0) => world.get(name).clone().add(V3([0, dy, 0]));
  return [
    { radial: 20, segRegions: ["bottom", "bottom", "top", "top", "top", "top", "top", "skin", "skin", "skin", "skin", "skin"],
      points: [
        { at: V3([0, 0.94, 0]), r: 0.148, bone: "hips" },
        { at: "hips", r: 0.158, bone: "hips" },
        { at: V3([0, 1.10, 0]), r: 0.130, bone: "hips" },
        { at: "spine", r: 0.142, bone: "spine" },
        { at: V3([0, 1.30, 0]), r: 0.163, bone: "spine" },
        { at: "chest", r: 0.172, bone: "chest" },
        { at: V3([0, 1.54, 0]), r: 0.148, bone: "chest" },
        { at: "neck", r: 0.066, bone: "neck" },
        { at: "head", r: 0.098, bone: "head" },
        { at: at("head", 0.05), r: 0.094, bone: "head" },
        { at: at("head", 0.14), r: 0.117, bone: "head" },
        { at: at("head", 0.20), r: 0.088, bone: "head" },
        { at: at("head", 0.225), r: 0.015, bone: null },
      ], world },
    { radial: 16, segRegions: ["top", "sleeve", "skin", "skin"],
      points: [
        { at: V3([0.13, 1.56, 0]), r: 0.086, bone: "chest" },
        { at: "upperArm.L", r: 0.074, bone: "upperArm.L" },
        { at: "lowerArm.L", r: 0.056, bone: "lowerArm.L" },
        { at: "hand.L", r: 0.046, bone: "hand.L" },
        { at: world.get("hand.L").clone().add(V3([0.17, -0.045, 0])), r: 0.028, bone: null },
      ], world },
    { radial: 16, segRegions: ["top", "sleeve", "skin", "skin"],
      points: [
        { at: V3([-0.13, 1.56, 0]), r: 0.086, bone: "chest" },
        { at: "upperArm.R", r: 0.074, bone: "upperArm.R" },
        { at: "lowerArm.R", r: 0.056, bone: "lowerArm.R" },
        { at: "hand.R", r: 0.046, bone: "hand.R" },
        { at: world.get("hand.R").clone().add(V3([-0.17, -0.045, 0])), r: 0.028, bone: null },
      ], world },
    { radial: 16, segRegions: ["bottom", "bottom", "legLower", "shoes"],
      points: [
        { at: V3([0.10, 1.01, 0]), r: 0.102, bone: "hips" },
        { at: "upperLeg.L", r: 0.094, bone: "upperLeg.L" },
        { at: "lowerLeg.L", r: 0.070, bone: "lowerLeg.L" },
        { at: "foot.L", r: 0.050, bone: "foot.L" },
        { at: world.get("foot.L").clone().add(V3([0, -0.03, 0.19])), r: 0.034, bone: null },
      ], world },
    { radial: 16, segRegions: ["bottom", "bottom", "legLower", "shoes"],
      points: [
        { at: V3([-0.10, 1.01, 0]), r: 0.102, bone: "hips" },
        { at: "upperLeg.R", r: 0.094, bone: "upperLeg.R" },
        { at: "lowerLeg.R", r: 0.070, bone: "lowerLeg.R" },
        { at: "foot.R", r: 0.050, bone: "foot.R" },
        { at: world.get("foot.R").clone().add(V3([0, -0.03, 0.19])), r: 0.034, bone: null },
      ], world },
  ].map((c) => ({
    ...c,
    points: c.points.map((p) => ({
      pos: p.at instanceof THREE.Vector3 ? p.at : world.get(p.at).clone(),
      r: p.r,
      bone: p.bone ? BONE_INDEX.get(p.bone) : -1,
    })),
  }));
}

function chainRings(chain) {
  const rings = [];
  const pts = chain.points;
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) {
      const a = pts[i - 1], b = pts[i];
      rings.push({ pos: a.pos.clone().lerp(b.pos, 0.5), r: (a.r + b.r) / 2, weights: [[a.bone, 1]] });
    }
    let weights;
    if (i === 0) weights = [[pts[0].bone, 1]];
    else if (i === pts.length - 1) weights = [[pts[i - 1].bone, 1]];
    else weights = [[pts[i - 1].bone, 0.5], [pts[i].bone, 0.5]];
    rings.push({ pos: pts[i].pos.clone(), r: pts[i].r, weights });
  }
  return rings;
}

// Joint spheres: [centreBone, offset, radius, weights, region]
const BALLS = [
  ["hips",       [0, -0.04, 0], 0.150, [["hips", 1]], "bottom"],
  ["neck",       null, 0.072, [["chest", 0.5], ["neck", 0.5]], "skin"],
  ["head",       null, 0.116, [["neck", 0.4], ["head", 0.6]], "skin"],
  ["upperArm.L", null, 0.088, [["chest", 0.5], ["upperArm.L", 0.5]], "sleeve"],
  ["upperArm.R", null, 0.088, [["chest", 0.5], ["upperArm.R", 0.5]], "sleeve"],
  ["lowerArm.L", null, 0.064, [["upperArm.L", 0.5], ["lowerArm.L", 0.5]], "sleeve"],
  ["lowerArm.R", null, 0.064, [["upperArm.R", 0.5], ["lowerArm.R", 0.5]], "sleeve"],
  ["hand.L",     null, 0.050, [["lowerArm.L", 0.5], ["hand.L", 0.5]], "skin"],
  ["hand.R",     null, 0.050, [["lowerArm.R", 0.5], ["hand.R", 0.5]], "skin"],
  ["upperLeg.L", null, 0.098, [["hips", 0.5], ["upperLeg.L", 0.5]], "bottom"],
  ["upperLeg.R", null, 0.098, [["hips", 0.5], ["upperLeg.R", 0.5]], "bottom"],
  ["lowerLeg.L", null, 0.075, [["upperLeg.L", 0.5], ["lowerLeg.L", 0.5]], "bottom"],
  ["lowerLeg.R", null, 0.075, [["upperLeg.R", 0.5], ["lowerLeg.R", 0.5]], "bottom"],
  ["foot.L",     null, 0.056, [["lowerLeg.L", 0.5], ["foot.L", 0.5]], "legLower"],
  ["foot.R",     null, 0.056, [["lowerLeg.R", 0.5], ["foot.R", 0.5]], "legLower"],
];

function buildGeometry(world) {
  const positions = [], skinIndices = [], skinWeights = [], indices = [], ranges = [];
  const pushRange = (start, region) => {
    const last = ranges[ranges.length - 1];
    if (last && last.region === region && last.start + last.count === start) last.count = indices.length - last.start;
    else ranges.push({ start, count: indices.length - start, region });
  };

  for (const chain of buildChains(world)) {
    const rings = chainRings(chain);
    const radial = chain.radial;
    const base = positions.length / 3;

    rings.forEach((ring, ri) => {
      const prev = rings[Math.max(0, ri - 1)].pos;
      const next = rings[Math.min(rings.length - 1, ri + 1)].pos;
      const tangent = next.clone().sub(prev).normalize();
      const ref = Math.abs(tangent.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const u = new THREE.Vector3().crossVectors(ref, tangent).normalize();
      const v = new THREE.Vector3().crossVectors(tangent, u).normalize();
      const idx = [0, 0, 0, 0], wgt = [0, 0, 0, 0];
      ring.weights.forEach(([b, w], k) => { idx[k] = b; wgt[k] = w; });
      for (let s = 0; s < radial; s++) { // no duplicated seam vertex: indices wrap
        const a = (s / radial) * Math.PI * 2;
        const p = ring.pos.clone()
          .addScaledVector(u, Math.cos(a) * ring.r)
          .addScaledVector(v, Math.sin(a) * ring.r);
        positions.push(p.x, p.y, p.z);
        skinIndices.push(...idx);
        skinWeights.push(...wgt);
      }
    });

    for (let ri = 0; ri < rings.length - 1; ri++) {
      const region = chain.segRegions[Math.floor(ri / 2)];
      const start = indices.length;
      for (let s = 0; s < radial; s++) {
        const a = base + ri * radial + s, b = a + radial;
        const a1 = base + ri * radial + ((s + 1) % radial), b1 = a1 + radial;
        indices.push(a, b, a1, b, b1, a1);
      }
      pushRange(start, region);
    }
  }

  const addBall = (centre, radius, weights, region, thetaLength = Math.PI) => {
    const sphere = new THREE.SphereGeometry(radius, 16, 12, 0, Math.PI * 2, 0, thetaLength);
    const sp = sphere.getAttribute("position");
    const si = sphere.getIndex();
    const base = positions.length / 3;
    const idx = [0, 0, 0, 0], wgt = [0, 0, 0, 0];
    weights.forEach(([name, w], k) => { idx[k] = BONE_INDEX.get(name); wgt[k] = w; });
    for (let i = 0; i < sp.count; i++) {
      positions.push(centre.x + sp.getX(i), centre.y + sp.getY(i), centre.z + sp.getZ(i));
      skinIndices.push(...idx);
      skinWeights.push(...wgt);
    }
    const start = indices.length;
    for (let i = 0; i < si.count; i++) indices.push(base + si.getX(i));
    pushRange(start, region);
    sphere.dispose();
  };

  for (const [atName, offset, radius, weights, region] of BALLS) {
    const centre = world.get(atName).clone();
    if (offset) centre.add(V3(offset));
    addBall(centre, radius, weights, region);
  }

  // Hair cap: a slightly larger partial sphere over the crown,
  // tipped back, wholly owned by the head bone.
  const hairCentre = world.get("head").clone().add(V3([0, 0.10, -0.014]));
  addBall(hairCentre, 0.128, [["head", 1]], "hair", Math.PI * 0.62);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndices, 4));
  geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  weldNormals(geo);
  for (const r of ranges) geo.addGroup(r.start, r.count, REGION_INDEX[r.region]);
  geo.userData.groupRegions = ranges.map((r, i) => ({ group: geo.groups[i], region: r.region }));
  return geo;
}

// Average the normals of vertices that share a position, so the
// tube seams and sphere poles shade smoothly instead of faceting.
function weldNormals(geo) {
  const pos = geo.getAttribute("position"), nor = geo.getAttribute("normal");
  const buckets = new Map();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(i);
  }
  const avg = new THREE.Vector3();
  for (const ids of buckets.values()) {
    if (ids.length < 2) continue;
    avg.set(0, 0, 0);
    for (const i of ids) avg.x += nor.getX(i), avg.y += nor.getY(i), avg.z += nor.getZ(i);
    avg.normalize();
    for (const i of ids) nor.setXYZ(i, avg.x, avg.y, avg.z);
  }
  nor.needsUpdate = true;
}

export function buildRig() {
  const bonesByName = new Map();
  const boneList = [];
  for (const [name, parentName, local] of BONE_DEFS) {
    const bone = new THREE.Bone();
    bone.name = name;
    bone.position.set(...local);
    bonesByName.set(name, bone);
    boneList.push(bone);
    if (parentName) bonesByName.get(parentName).add(bone);
  }
  const root = bonesByName.get("hips");
  root.updateMatrixWorld(true);

  const geometry = buildGeometry(worldPositions());
  const material = new THREE.MeshStandardMaterial({ color: 0x8fa8d0, roughness: 0.65, metalness: 0.05 });
  const mesh = new THREE.SkinnedMesh(geometry, material);
  const skeleton = new THREE.Skeleton(boneList);
  mesh.add(root);
  mesh.bind(skeleton);
  mesh.frustumCulled = false;

  // Eyes ride on the head bone so they follow posing for free.
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.35 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), eyeMat);
    eye.position.set(side * 0.044, 0.085, 0.100);
    bonesByName.get("head").add(eye);
  }

  const rest = new Map(boneList.map((b) => [b.name, b.quaternion.clone()]));
  return { bonesByName, boneList, root, skeleton, mesh, rest };
}
