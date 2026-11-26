"use strict";

// Character Animator — server (zero dependencies, Node 18+).
//
// Serves a three.js character animator: a procedurally built, skinned
// humanoid you can pose bone by bone and keyframe, Blender-style.
// Everything interesting happens in the browser; this is just a
// static file server so ES modules and the import map load cleanly.
//
// Usage (from the character-animator/ folder):
//   node app/server.js     # or: cd app && npm start
//   open http://localhost:8002
//
// Layout: lib/config.js (bind settings), lib/router.js (routes),
// lib/static.js (app/public files). three.js is vendored under
// app/public/vendor/ so a fresh checkout runs fully offline.

const http = require("node:http");
const config = require("./lib/config");
const { createHandler } = require("./lib/router");

const server = http.createServer(createHandler());

server.listen(config.port, config.host, () => {
  console.log(`Character Animator: http://${config.host}:${config.port} (bound to ${config.host})`);
});
