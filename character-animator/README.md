# Character Animator

A **Blender-style character animator in the browser**, built on
three.js: a humanoid skeleton, a procedurally generated skinned mesh,
pose mode with a rotation gizmo, a skin-weights view, and a keyframe
timeline. The character is generated entirely in code — there are no
model files to download, and three.js is vendored, so a fresh
checkout runs offline with no build step and no `npm install`.

## What's in this folder

```
app/
  server.js        Entry point: starts the HTTP server
  lib/             Server modules — config, router, static files
  public/          The animator page
    index.html
    style.css
    js/            Browser modules — main (scene/UI/timeline),
                   rig (skeleton + skinned mesh), presets
    vendor/        three.js r160 (three.module.js, OrbitControls,
                   TransformControls), pinned and vendored
```

## Run it

```bash
cd character-animator
node app/server.js     # or: cd app && npm start — port 8002
# open http://localhost:8002
```

No dependencies; Node 18+. The server only serves static files (plus
a `/healthz` check) — everything else happens in your browser.

## The animator

Blender's core character workflow, shrunk to one page:

- **Skeleton** — 17 `THREE.Bone`s in a humanoid hierarchy (hips →
  spine → chest → neck → head; arms and legs with hands and feet),
  drawn with a skeleton helper and listed in a clickable
  **outliner** panel.
- **Skinning** — the mesh is a set of tube “chains” (torso, arms,
  legs) generated ring by ring in `js/rig.js`. Rings at a joint blend
  50/50 between the two bones that meet there; mid-segment rings
  belong wholly to their segment's bone. Posing a bone therefore
  bends the mesh smoothly instead of tearing it. **Show weights**
  recolours the mesh as a heatmap of the selected bone's influence —
  red follows it fully, blue ignores it.
- **Pose mode** — select a bone by clicking the character (the pick
  reads the clicked vertex's skin weights), clicking the outliner,
  then rotate it with the **TransformControls gizmo** or the X/Y/Z
  sliders. Reset works per bone or for the whole pose.
- **Animation** — pose, scrub the **timeline** to a time, and
  *Key pose at current time*. Playback interpolates between keys
  with quaternion slerp, with loop on/off, clickable keyframe
  markers, and per-key delete.
- **Presets** — *Wave*, *Idle sway* and *Walk cycle* load ready-made
  keyframes so the character moves the moment the page opens.
- **Save / load** — export the timeline as JSON, import it back, or
  stash it in the browser's local storage.

## Licence

MIT — see the repo root `LICENSE`. three.js is MIT-licensed; its
license header is kept in the vendored files.
