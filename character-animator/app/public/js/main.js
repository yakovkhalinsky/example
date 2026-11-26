// main.js — scene, pose mode, weights view, timeline, save/load.
//
// Poses are stored as full-pose quaternion snapshots per keyframe:
// { time, pose: { boneName: [x, y, z, w] } }. Playback slerps every
// bone between the two surrounding keys.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { buildRig, BONE_DEFS } from "./rig.js";
import { PRESETS } from "./presets.js";

const $ = (id) => document.getElementById(id);
const status = (msg) => { $("status").textContent = msg; };
const DEG = 180 / Math.PI, RAD = Math.PI / 180;

// ---------- scene ----------
const container = $("viewport");
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x11161d);
scene.fog = new THREE.Fog(0x11161d, 8, 20);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(2.4, 1.7, 3.2);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.target.set(0, 1.0, 0);
orbit.enableDamping = true;

scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x2a2118, 0.9));
const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(3, 5, 4);
scene.add(key);
const rim = new THREE.DirectionalLight(0x88aaff, 0.5);
rim.position.set(-4, 3, -3);
scene.add(rim);

const grid = new THREE.GridHelper(8, 16, 0x3a4353, 0x232a35);
scene.add(grid);
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(4, 40),
  new THREE.MeshStandardMaterial({ color: 0x161c25, roughness: 1 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.001;
scene.add(floor);

// ---------- rig ----------
const rig = buildRig();
scene.add(rig.mesh);
const helper = new THREE.SkeletonHelper(rig.mesh);
helper.material.depthTest = false;
helper.renderOrder = 2;
scene.add(helper);

// Wireframe overlay: a second SkinnedMesh sharing the geometry and
// bound to the same skeleton, so it deforms in lockstep.
const wireMesh = new THREE.SkinnedMesh(rig.mesh.geometry, new THREE.MeshBasicMaterial({
  wireframe: true, color: 0x58a6ff, transparent: true, opacity: 0.25,
}));
wireMesh.bind(rig.skeleton);
wireMesh.frustumCulled = false;
wireMesh.visible = false;
scene.add(wireMesh);

// ---------- selection & pose mode ----------
const gizmo = new TransformControls(camera, renderer.domElement);
gizmo.setMode("rotate");
gizmo.setSpace("local");
gizmo.setSize(0.85);
scene.add(gizmo);
gizmo.addEventListener("dragging-changed", (e) => { orbit.enabled = !e.value; });
gizmo.addEventListener("objectChange", syncSlidersFromBone);

let selected = null;

function buildOutliner() {
  const childrenOf = new Map();
  for (const [name, parent] of BONE_DEFS) {
    if (!childrenOf.has(parent)) childrenOf.set(parent, []);
    childrenOf.get(parent).push(name);
  }
  const make = (name) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.textContent = name;
    btn.dataset.bone = name;
    btn.addEventListener("click", () => selectBone(name));
    li.appendChild(btn);
    const kids = childrenOf.get(name) || [];
    if (kids.length) {
      const ul = document.createElement("ul");
      kids.forEach((k) => ul.appendChild(make(k)));
      li.appendChild(ul);
    }
    return li;
  };
  $("outliner").appendChild(make("hips"));
}

function selectBone(name) {
  selected = name ? rig.bonesByName.get(name) : null;
  document.querySelectorAll("#outliner button").forEach((b) =>
    b.classList.toggle("selected", b.dataset.bone === name));
  $("selectedName").textContent = name ? name : "— none —";
  if (selected) gizmo.attach(selected); else gizmo.detach();
  syncSlidersFromBone();
  if ($("showWeights").checked) applyWeightsView();
}

const _e = new THREE.Euler();
function syncSlidersFromBone() {
  if (!selected) { $("rx").value = $("ry").value = $("rz").value = 0; }
  else {
    _e.setFromQuaternion(selected.quaternion, "XYZ");
    $("rx").value = Math.round(_e.x * DEG);
    $("ry").value = Math.round(_e.y * DEG);
    $("rz").value = Math.round(_e.z * DEG);
  }
  $("rxVal").textContent = `${$("rx").value}°`;
  $("ryVal").textContent = `${$("ry").value}°`;
  $("rzVal").textContent = `${$("rz").value}°`;
}
function slidersToBone() {
  if (!selected) return;
  selected.quaternion.setFromEuler(new THREE.Euler(
    Number($("rx").value) * RAD, Number($("ry").value) * RAD, Number($("rz").value) * RAD, "XYZ"));
  syncSlidersFromBone();
}
for (const id of ["rx", "ry", "rz"]) $(id).addEventListener("input", slidersToBone);

$("resetBone").addEventListener("click", () => {
  if (!selected) return;
  selected.quaternion.copy(rig.rest.get(selected.name));
  syncSlidersFromBone();
});
$("resetPose").addEventListener("click", resetPose);
function resetPose() {
  for (const b of rig.boneList) b.quaternion.copy(rig.rest.get(b.name));
  syncSlidersFromBone();
}

// Click-to-pick: raycast the mesh, take the primary bone of the
// nearest intersected vertex.
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downAt = null;
renderer.domElement.addEventListener("pointerdown", (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
  downAt = null;
  if (moved > 5 || gizmo.dragging) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1,
              -((e.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(rig.mesh, false)[0];
  if (!hit || !hit.face) return;
  const skinIndex = rig.mesh.geometry.getAttribute("skinIndex");
  const boneIdx = skinIndex.getX(hit.face.a);
  selectBone(rig.boneList[boneIdx].name);
});

// ---------- view toggles & weights view ----------
$("showSkeleton").addEventListener("change", (e) => { helper.visible = e.target.checked; });
$("wireframe").addEventListener("change", (e) => { wireMesh.visible = e.target.checked; });
$("showWeights").addEventListener("change", (e) => {
  if (e.target.checked) applyWeightsView(); else clearWeightsView();
});

const baseMaterial = rig.mesh.material;
function applyWeightsView() {
  const geo = rig.mesh.geometry;
  const si = geo.getAttribute("skinIndex"), sw = geo.getAttribute("skinWeight");
  const colors = new Float32Array(si.count * 3);
  const target = selected ? rig.boneList.indexOf(selected) : -1;
  const hot = new THREE.Color(0xff2a1a), cold = new THREE.Color(0x1a3aff), mid = new THREE.Color();
  const idxArr = [0, 0, 0, 0], wgtArr = [0, 0, 0, 0];
  for (let i = 0; i < si.count; i++) {
    idxArr[0] = si.getX(i); idxArr[1] = si.getY(i); idxArr[2] = si.getZ(i); idxArr[3] = si.getW(i);
    wgtArr[0] = sw.getX(i); wgtArr[1] = sw.getY(i); wgtArr[2] = sw.getZ(i); wgtArr[3] = sw.getW(i);
    let w = 0;
    for (let k = 0; k < 4; k++) if (idxArr[k] === target) w = wgtArr[k];
    mid.copy(cold).lerp(hot, w);
    colors.set([mid.r, mid.g, mid.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  rig.mesh.material = new THREE.MeshBasicMaterial({ vertexColors: true });
  status(selected ? `Weights view: how much each vertex follows ${selected.name}.`
                  : "Weights view needs a selected bone — pick one first.");
}
function clearWeightsView() {
  rig.mesh.geometry.deleteAttribute("color");
  rig.mesh.material = baseMaterial;
}

// ---------- animation: keyframes, playback, presets ----------
const anim = {
  keys: [],            // [{time, pose:{name:[x,y,z,w]}}], sorted by time
  duration: 4,
  time: 0,
  playing: false,
};

function capturePose() {
  const pose = {};
  for (const b of rig.boneList) pose[b.name] = b.quaternion.toArray();
  return pose;
}
function setPose(pose) {
  for (const b of rig.boneList) {
    const q = pose[b.name];
    if (q) b.quaternion.fromArray(q);
  }
  syncSlidersFromBone();
}
function applyAtTime(t) {
  const ks = anim.keys;
  if (!ks.length) return;
  if (t <= ks[0].time) return setPose(ks[0].pose);
  if (t >= ks[ks.length - 1].time) return setPose(ks[ks.length - 1].pose);
  let i = 0;
  while (i < ks.length - 2 && ks[i + 1].time < t) i++;
  const a = ks[i], b = ks[i + 1];
  const f = (t - a.time) / Math.max(1e-6, b.time - a.time);
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
  for (const bone of rig.boneList) {
    qa.fromArray(a.pose[bone.name]);
    qb.fromArray(b.pose[bone.name]);
    qa.slerp(qb, f);
    bone.quaternion.copy(qa);
  }
  syncSlidersFromBone();
}

function refreshTimelineUI() {
  $("scrub").max = anim.duration;
  $("scrub").value = anim.time;
  $("duration").value = anim.duration;
  $("timeLabel").textContent = `${anim.time.toFixed(2)}s / ${anim.duration.toFixed(2)}s`;
  const track = $("keyTrack");
  track.querySelectorAll(".key-marker, .playhead").forEach((n) => n.remove());
  for (const k of anim.keys) {
    const m = document.createElement("button");
    m.className = "key-marker";
    m.style.left = `${(k.time / anim.duration) * 100}%`;
    m.title = `Key at ${k.time.toFixed(2)}s`;
    m.addEventListener("click", () => { setTime(k.time); });
    track.appendChild(m);
  }
  const head = document.createElement("div");
  head.className = "playhead";
  head.style.left = `${(anim.time / anim.duration) * 100}%`;
  track.appendChild(head);
  const list = $("keyList");
  list.innerHTML = "";
  anim.keys.forEach((k, i) => {
    const li = document.createElement("li");
    const jump = document.createElement("button");
    jump.className = "jump"; jump.textContent = `${k.time.toFixed(2)}s`;
    jump.addEventListener("click", () => setTime(k.time));
    const del = document.createElement("button");
    del.className = "secondary"; del.textContent = "✕";
    del.title = "Delete this keyframe";
    del.addEventListener("click", () => { anim.keys.splice(i, 1); refreshTimelineUI(); });
    li.append(jump, del);
    list.appendChild(li);
  });
}
function setTime(t) {
  anim.time = THREE.MathUtils.clamp(t, 0, anim.duration);
  applyAtTime(anim.time);
  refreshTimelineUI();
}

$("scrub").addEventListener("input", (e) => { anim.playing = false; $("playBtn").textContent = "▶ Play"; setTime(Number(e.target.value)); });
$("duration").addEventListener("change", (e) => {
  anim.duration = THREE.MathUtils.clamp(Number(e.target.value) || 4, 0.5, 30);
  anim.keys = anim.keys.filter((k) => k.time <= anim.duration);
  refreshTimelineUI();
});
$("addKey").addEventListener("click", () => {
  const t = Math.round(anim.time * 100) / 100;
  const existing = anim.keys.findIndex((k) => Math.abs(k.time - t) < 1e-6);
  const entry = { time: t, pose: capturePose() };
  if (existing >= 0) anim.keys[existing] = entry; else anim.keys.push(entry);
  anim.keys.sort((a, b) => a.time - b.time);
  refreshTimelineUI();
  status(`Keyframed the current pose at ${t.toFixed(2)}s (${anim.keys.length} key${anim.keys.length === 1 ? "" : "s"}).`);
});
$("clearKeys").addEventListener("click", () => { anim.keys = []; refreshTimelineUI(); status("Timeline cleared."); });
$("playBtn").addEventListener("click", () => {
  if (!anim.keys.length) { status("No keyframes yet — pose the character and add a key, or load a preset."); return; }
  anim.playing = !anim.playing;
  $("playBtn").textContent = anim.playing ? "⏸ Pause" : "▶ Play";
});
$("stopBtn").addEventListener("click", () => {
  anim.playing = false; $("playBtn").textContent = "▶ Play"; setTime(0);
});

function loadPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  anim.duration = preset.duration;
  anim.keys = preset.keys.map((k) => {
    const pose = {};
    for (const b of rig.boneList) {
      const e = k.pose[b.name];
      pose[b.name] = e
        ? new THREE.Quaternion().setFromEuler(new THREE.Euler(e[0] * RAD, e[1] * RAD, e[2] * RAD, "XYZ")).toArray()
        : rig.rest.get(b.name).toArray();
    }
    return { time: k.time, pose };
  });
  anim.playing = false; $("playBtn").textContent = "▶ Play";
  setTime(0);
  status(`Loaded the “${preset.label}” preset (${anim.keys.length} keys, ${preset.duration}s). Press Play.`);
}
$("presetRow").addEventListener("click", (e) => {
  const name = e.target.dataset?.preset;
  if (name) loadPreset(name);
});

// ---------- save / load ----------
function animToJson() {
  return JSON.stringify({ app: "character-animator", version: 1, duration: anim.duration, keys: anim.keys }, null, 2);
}
function loadAnimJson(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.keys)) throw new Error("not a character-animator file");
  anim.duration = THREE.MathUtils.clamp(Number(data.duration) || 4, 0.5, 30);
  anim.keys = data.keys
    .filter((k) => k && typeof k.time === "number" && k.pose)
    .map((k) => ({ time: k.time, pose: k.pose }))
    .sort((a, b) => a.time - b.time);
  anim.playing = false; $("playBtn").textContent = "▶ Play";
  setTime(0);
}
$("exportBtn").addEventListener("click", () => {
  const blob = new Blob([animToJson()], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "character-animation.json";
  a.click();
  URL.revokeObjectURL(a.href);
  status("Exported the timeline as JSON.");
});
$("importBtn").addEventListener("click", () => $("importFile").click());
$("importFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try { loadAnimJson(await file.text()); status(`Imported ${anim.keys.length} keyframes from ${file.name}.`); }
  catch { status("That file didn't parse as a character-animator animation."); }
  e.target.value = "";
});
$("storeSave").addEventListener("click", () => {
  localStorage.setItem("character-animator", animToJson());
  status("Saved the timeline to this browser's local storage.");
});
$("storeLoad").addEventListener("click", () => {
  const text = localStorage.getItem("character-animator");
  if (!text) { status("Nothing saved in this browser yet."); return; }
  try { loadAnimJson(text); status(`Loaded ${anim.keys.length} saved keyframes.`); }
  catch { status("The saved data didn't parse."); }
});

// ---------- resize & render loop ----------
function resize() {
  const w = container.clientWidth, h = container.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(container);
resize();

const clock = new THREE.Clock();
let firstFrame = true;
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (anim.playing && anim.keys.length) {
    anim.time += dt;
    if (anim.time > anim.duration) {
      if ($("loop").checked) anim.time %= anim.duration;
      else { anim.time = anim.duration; anim.playing = false; $("playBtn").textContent = "▶ Play"; }
    }
    applyAtTime(anim.time);
    refreshTimelineUI();
  }
  orbit.update();
  renderer.render(scene, camera);
  if (firstFrame) {
    firstFrame = false;
    document.body.dataset.ready = "1";
    status("Ready. Pick a bone, pose it, key it — or load the Wave preset and press Play.");
  }
}

buildOutliner();
refreshTimelineUI();
selectBone("upperArm.R");
tick();

// Hooks for automated checks and curious consoles.
window.__animator = {
  rig, anim, selectBone, setTime, loadPreset, resetPose,
  boneCount: rig.boneList.length,
  vertexCount: rig.mesh.geometry.getAttribute("position").count,
};
