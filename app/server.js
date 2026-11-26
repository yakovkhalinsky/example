"use strict";

// Decision Model Examples — demo server (zero dependencies, Node 18+).
//
// Why a server at all: browsers can't call Ollama Cloud directly (it
// doesn't answer CORS preflight), so the browser talks to this server
// on the same origin, and the server forwards the calls to Ollama
// Cloud with the API key attached server-side. The key never reaches
// the browser.
//
// Usage:
//   cp .env.example .env   # at the repo root, put OLLAMA_API_KEY=... in it
//   node app/server.js     # or: cd app && npm start
//   open http://localhost:8000
//
// Layout: lib/config.js (env/.env), lib/router.js (routes),
// lib/proxy.js (upstream calls), lib/static.js (app/public files).

const http = require("node:http");
const config = require("./lib/config");
const { createHandler } = require("./lib/router");

const server = http.createServer(createHandler());

server.listen(config.port, config.host, () => {
  console.log(`Decision-model demo: http://${config.host}:${config.port} (bound to ${config.host})`);
  console.log(`  upstream: ${config.upstream}  API key configured: ${Boolean(config.get("OLLAMA_API_KEY"))}`);
  console.log(`  key source: environment or .env at repo root / app folder (re-read per request)`);
});
