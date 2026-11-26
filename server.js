"use strict";

// Zero-dependency Node server for the web demo.
//
// Why: browsers can't call Ollama Cloud directly (it doesn't answer CORS
// preflight), so the browser talks to THIS server on the same origin, and
// the server forwards the call to Ollama Cloud with the API key attached
// server-side. The key never reaches the browser.
//
// Usage:
//   cp .env.example .env   # then put OLLAMA_API_KEY=... in .env
//   node server.js
//   open http://localhost:8000  (or http://<this-host>:8000 on your tailnet/LAN)
//
// On the page, pick the endpoint preset
//   "Node server — same origin (key lives on the server)"
// and leave the API key field on the page blank.
//
// The .env file is re-read on every proxied request, so editing .env
// takes effect without restarting the server. Real environment variables
// take precedence over .env values.

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const DOCS = path.join(ROOT, "docs");
const ENV_FILE = path.join(ROOT, ".env");

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "0.0.0.0";
const UPSTREAM = (process.env.OLLAMA_UPSTREAM || "https://ollama.com").replace(/\/+$/, "");

function parseEnvFile() {
  const out = {};
  let text;
  try { text = fs.readFileSync(ENV_FILE, "utf8"); } catch { return out; }
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function config(name) {
  return process.env[name] || parseEnvFile()[name] || "";
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8",
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

async function proxySystemOne(req, res) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);

  const key = config("OLLAMA_API_KEY");
  const headers = { "Content-Type": "application/json" };
  if (key) headers["Authorization"] = `Bearer ${key}`;
  else if (req.headers.authorization) headers["Authorization"] = req.headers.authorization;

  let upstream;
  try {
    upstream = await fetch(`${UPSTREAM}/v1/systemone`, { method: "POST", headers, body });
  } catch (e) {
    return sendJson(res, 502, { error: `Proxy could not reach ${UPSTREAM}: ${e.message}` });
  }
  const text = await upstream.text();
  res.writeHead(upstream.status, { "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8" });
  res.end(text);
}

// The GitHub Pages URL has a /decision-model-examples/ prefix, so people
// (and saved bookmarks) ask for it here too — accept it as an alias of /.
const PREFIX = "/decision-model-examples";
function stripPrefix(p) {
  return (p === PREFIX || p.startsWith(PREFIX + "/")) ? p.slice(PREFIX.length) || "/" : p;
}

function serveStatic(req, res) {
  let urlPath;
  try { urlPath = stripPrefix(decodeURIComponent(new URL(req.url, "http://localhost").pathname)); }
  catch { return sendJson(res, 400, { error: "Bad URL" }); }
  if (urlPath === "/") urlPath = "/index.html";
  const file = path.normalize(path.join(DOCS, urlPath));
  if (!file.startsWith(DOCS + path.sep)) return sendJson(res, 403, { error: "Forbidden" });
  fs.readFile(file, (err, data) => {
    if (err) return sendJson(res, 404, { error: "Not found" });
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const pathOnly = stripPrefix(new URL(req.url, "http://localhost").pathname);
  if (req.method === "POST" && pathOnly.startsWith("/v1/systemone")) {
    proxySystemOne(req, res).catch((e) => sendJson(res, 500, { error: e.message }));
  } else if (req.method === "GET" && pathOnly === "/healthz") {
    sendJson(res, 200, { ok: true, keyConfigured: Boolean(config("OLLAMA_API_KEY")), upstream: UPSTREAM });
  } else if (req.method === "GET" || req.method === "HEAD") {
    serveStatic(req, res);
  } else {
    sendJson(res, 405, { error: "Method not allowed" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Decision-model demo: http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
  console.log(`  upstream: ${UPSTREAM}  API key configured: ${Boolean(config("OLLAMA_API_KEY"))}`);
  console.log(`  key source: environment or ${ENV_FILE} (re-read per request)`);
});
