// presets.js — three ready-made animations, expressed as keyframes
// of Euler rotations in degrees per bone. Bones not mentioned in a
// key sit at the rest pose. main.js turns these into full-pose
// quaternion keys, so presets and hand-made keys share one format.
//
// Axis cheat-sheet for this rig (rest pose, facing +Z):
//   X rotation swings a limb forward (−) / backward (+)
//   Z rotation raises the left arm (+) / the right arm (−)

const K = (time, pose) => ({ time, pose });

export const PRESETS = {
  wave: {
    label: "Wave",
    duration: 2.4,
    keys: [
      K(0.0, { "upperArm.R": [0, 0, -118], "lowerArm.R": [0, 0, -18], "head": [0, 0, 4] }),
      K(0.6, { "upperArm.R": [0, 0, -118], "lowerArm.R": [0, 0, -52], "head": [0, 0, 4] }),
      K(1.2, { "upperArm.R": [0, 0, -118], "lowerArm.R": [0, 0, -14], "head": [0, 0, 4] }),
      K(1.8, { "upperArm.R": [0, 0, -118], "lowerArm.R": [0, 0, -52], "head": [0, 0, 4] }),
      K(2.4, { "upperArm.R": [0, 0, -118], "lowerArm.R": [0, 0, -18], "head": [0, 0, 4] }),
    ],
  },
  idle: {
    label: "Idle sway",
    duration: 3.2,
    keys: [
      K(0.0, { "spine": [2, 0, 0], "chest": [2, 0, 1], "head": [0, -4, 0], "upperArm.L": [0, 0, 3], "upperArm.R": [0, 0, -3] }),
      K(1.6, { "spine": [4, 0, -1], "chest": [5, 0, -2], "head": [1, 5, -1], "upperArm.L": [2, 0, 5], "upperArm.R": [2, 0, -5], "hips": [0, 2, 0] }),
      K(3.2, { "spine": [2, 0, 0], "chest": [2, 0, 1], "head": [0, -4, 0], "upperArm.L": [0, 0, 3], "upperArm.R": [0, 0, -3] }),
    ],
  },
  walk: {
    label: "Walk cycle",
    duration: 1.6,
    keys: [
      K(0.0, { "upperLeg.L": [-28, 0, 0], "lowerLeg.L": [6, 0, 0], "upperLeg.R": [24, 0, 0], "lowerLeg.R": [28, 0, 0],
               "upperArm.L": [22, 0, 2], "lowerArm.L": [-14, 0, 0], "upperArm.R": [-24, 0, -2], "lowerArm.R": [-10, 0, 0],
               "chest": [0, -6, 0], "foot.L": [10, 0, 0], "foot.R": [-8, 0, 0] }),
      K(0.4, { "upperLeg.L": [0, 0, 0], "lowerLeg.L": [22, 0, 0], "upperLeg.R": [0, 0, 0], "lowerLeg.R": [8, 0, 0],
               "upperArm.L": [0, 0, 2], "lowerArm.L": [-12, 0, 0], "upperArm.R": [0, 0, -2], "lowerArm.R": [-12, 0, 0],
               "chest": [0, 0, 0] }),
      K(0.8, { "upperLeg.L": [24, 0, 0], "lowerLeg.L": [28, 0, 0], "upperLeg.R": [-28, 0, 0], "lowerLeg.R": [6, 0, 0],
               "upperArm.L": [-24, 0, 2], "lowerArm.L": [-10, 0, 0], "upperArm.R": [22, 0, -2], "lowerArm.R": [-14, 0, 0],
               "chest": [0, 6, 0], "foot.L": [-8, 0, 0], "foot.R": [10, 0, 0] }),
      K(1.2, { "upperLeg.L": [0, 0, 0], "lowerLeg.L": [8, 0, 0], "upperLeg.R": [0, 0, 0], "lowerLeg.R": [22, 0, 0],
               "upperArm.L": [0, 0, 2], "lowerArm.L": [-12, 0, 0], "upperArm.R": [0, 0, -2], "lowerArm.R": [-12, 0, 0],
               "chest": [0, 0, 0] }),
      K(1.6, { "upperLeg.L": [-28, 0, 0], "lowerLeg.L": [6, 0, 0], "upperLeg.R": [24, 0, 0], "lowerLeg.R": [28, 0, 0],
               "upperArm.L": [22, 0, 2], "lowerArm.L": [-14, 0, 0], "upperArm.R": [-24, 0, -2], "lowerArm.R": [-10, 0, 0],
               "chest": [0, -6, 0], "foot.L": [10, 0, 0], "foot.R": [-8, 0, 0] }),
    ],
  },
};
