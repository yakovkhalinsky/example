// rig.js — the skeleton and the skinned mesh, built procedurally.
//
// Bones are THREE.Bone objects in a humanoid hierarchy. The mesh is a
// set of tube "chains" (torso, arms, legs) generated ring by ring:
// each ring sits at a joint (blended 50/50 between the two bones that
// meet there) or mid-segment (100% its segment's bone), so posing a
// bone bends the tube smoothly instead of tearing it apart.

import * as THREE from "three";

// [name, parentName, localPosition] — positions are relative to the
// parent bone, in metres-ish units. Rest pose is a relaxed A-pose.
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

const BONE_INDEX = new Map(BONE_DEFS.map((d, i) => [d[0], i]));

function worldPositions() {
  // Rest-pose world position of every bone head, by walking the tree.
  const world = new Map();
  for (const [name, parent, local] of BONE_DEFS) {
    const p = parent ? world.get(parent) : new THREE.Vector3();
    world.set(name, p.clone().add(new THREE.Vector3(...local)));
  }
  return world;
}

// A chain is a list of joints: { at: boneName | Vector3, r: radius,
// bone: name of the bone whose segment STARTS at this joint }.
// The last joint has no segment; its ring takes the previous bone.
function chainPoints(spec, world) {
  return spec.map((j) => ({
    pos: j.at instanceof THREE.Vector3 ? j.at : world.get(j.at).clone(),
    r: j.r,
    bone: j.bone ? BONE_INDEX.get(j.bone) : -1,
  }));
}

function buildChains(world) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const headTop = world.get("head").clone().add(V(0, 0.20, 0));
  const headMid = world.get("head").clone().add(V(0, 0.10, 0));
  const pelvis = world.get("hips").clone().add(V(0, -0.08, 0));
  const tipL = world.get("hand.L").clone().add(V(0.17, -0.045, 0));
  const tipR = world.get("hand.R").clone().add(V(-0.17, -0.045, 0));
  const toeL = world.get("foot.L").clone().add(V(0, -0.03, 0.19));
  const toeR = world.get("foot.R").clone().add(V(0, -0.03, 0.19));

  return [
    { radial: 12, points: chainPoints([ // torso + head
      { at: pelvis, r: 0.155, bone: "hips" },
      { at: "hips", r: 0.165, bone: "hips" },
      { at: "spine", r: 0.150, bone: "spine" },
      { at: "chest", r: 0.170, bone: "chest" },
      { at: "neck", r: 0.065, bone: "neck" },
      { at: "head", r: 0.110, bone: "head" },
      { at: headMid, r: 0.125, bone: "head" },
      { at: headTop, r: 0.020, bone: null },
    ], world) },
    { radial: 9, points: chainPoints([ // arm L
      { at: "upperArm.L", r: 0.075, bone: "upperArm.L" },
      { at: "lowerArm.L", r: 0.058, bone: "lowerArm.L" },
      { at: "hand.L", r: 0.048, bone: "hand.L" },
      { at: tipL, r: 0.030, bone: null },
    ], world) },
    { radial: 9, points: chainPoints([ // arm R
      { at: "upperArm.R", r: 0.075, bone: "upperArm.R" },
      { at: "lowerArm.R", r: 0.058, bone: "lowerArm.R" },
      { at: "hand.R", r: 0.048, bone: "hand.R" },
      { at: tipR, r: 0.030, bone: null },
    ], world) },
    { radial: 10, points: chainPoints([ // leg L
      { at: "upperLeg.L", r: 0.095, bone: "upperLeg.L" },
      { at: "lowerLeg.L", r: 0.072, bone: "lowerLeg.L" },
      { at: "foot.L", r: 0.052, bone: "foot.L" },
      { at: toeL, r: 0.036, bone: null },
    ], world) },
    { radial: 10, points: chainPoints([ // leg R
      { at: "upperLeg.R", r: 0.095, bone: "upperLeg.R" },
      { at: "lowerLeg.R", r: 0.072, bone: "lowerLeg.R" },
      { at: "foot.R", r: 0.052, bone: "foot.R" },
      { at: toeR, r: 0.036, bone: null },
    ], world) },
  ];
}

// Expand a chain's joints into rings: one ring per joint plus a
// mid-segment ring between each pair, each ring carrying the skin
// weights described at the top of this file.
function chainRings(chain) {
  const rings = [];
  const pts = chain.points;
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) { // mid-segment ring: 100% the segment's bone
      const a = pts[i - 1], b = pts[i];
      rings.push({
        pos: a.pos.clone().lerp(b.pos, 0.5),
        r: (a.r + b.r) / 2,
        weights: [[a.bone, 1]],
      });
    }
    let weights;
    if (i === 0) weights = [[pts[0].bone, 1]];
    else if (i === pts.length - 1) weights = [[pts[i - 1].bone, 1]];
    else weights = [[pts[i - 1].bone, 0.5], [pts[i].bone, 0.5]];
    rings.push({ pos: pts[i].pos.clone(), r: pts[i].r, weights });
  }
  return rings;
}

function buildGeometry(world) {
  const positions = [], skinIndices = [], skinWeights = [], indices = [];

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
      for (let s = 0; s <= radial; s++) {
        const a = (s / radial) * Math.PI * 2;
        const p = ring.pos.clone()
          .addScaledVector(u, Math.cos(a) * ring.r)
          .addScaledVector(v, Math.sin(a) * ring.r);
        positions.push(p.x, p.y, p.z);
        skinIndices.push(...idx);
        skinWeights.push(...wgt);
      }
    });

    const ringVerts = radial + 1;
    for (let ri = 0; ri < rings.length - 1; ri++) {
      for (let s = 0; s < radial; s++) {
        const a = base + ri * ringVerts + s, b = a + ringVerts;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndices, 4));
  geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
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
  const material = new THREE.MeshStandardMaterial({
    color: 0x8fa8d0, roughness: 0.65, metalness: 0.05,
  });
  const mesh = new THREE.SkinnedMesh(geometry, material);
  const skeleton = new THREE.Skeleton(boneList);
  mesh.add(root);
  mesh.bind(skeleton);
  mesh.frustumCulled = false;

  // Eyes ride on the head bone so they follow posing for free.
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.35 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), eyeMat);
    eye.position.set(side * 0.048, 0.085, 0.105);
    bonesByName.get("head").add(eye);
  }

  const rest = new Map(boneList.map((b) => [b.name, b.quaternion.clone()]));
  return { bonesByName, boneList, root, skeleton, mesh, rest };
}
