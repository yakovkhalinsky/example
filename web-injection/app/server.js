"use strict";

// Web Injection Lab — server (zero dependencies, Node 18+).
//
// This serves a DELIBERATELY VULNERABLE page so injection attacks can
// be tried safely against your own browser. Run it locally or on a
// private network only — never expose it publicly.
//
// Usage (from the web-injection/ folder):
//   node app/server.js     # or: cd app && npm start
//   open http://localhost:8001
//
// Layout: lib/config.js (bind settings), lib/router.js (routes),
// lib/static.js (app/public files, intentionally no CSP header).

const http = require("node:http");
const config = require("./lib/config");
const { createHandler } = require("./lib/router");

const server = http.createServer(createHandler());

server.listen(config.port, config.host, () => {
  console.log(`Web Injection Lab: http://${config.host}:${config.port} (bound to ${config.host})`);
  console.log(`  WARNING: the page served is deliberately vulnerable. Local/private use only.`);
});
