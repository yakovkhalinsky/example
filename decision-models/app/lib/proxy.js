"use strict";

// Forward POSTs to the upstream Ollama endpoint with the API key
// attached server-side. The key comes from config (env / .env); if no
// server key is configured, a browser-supplied Authorization header is
// forwarded instead (daemon mode).

const config = require("./config");
const { sendJson } = require("./respond");

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

async function proxyPost(req, res, upstreamPath) {
  const body = await readBody(req);
  const headers = { "Content-Type": "application/json" };
  const key = config.get("OLLAMA_API_KEY");
  if (key) headers["Authorization"] = `Bearer ${key}`;
  else if (req.headers.authorization) headers["Authorization"] = req.headers.authorization;

  let upstream;
  try {
    upstream = await fetch(`${config.upstream}${upstreamPath}`, { method: "POST", headers, body });
  } catch (e) {
    return sendJson(res, 502, { error: `Proxy could not reach ${config.upstream}: ${e.message}` });
  }
  const text = await upstream.text();
  res.writeHead(upstream.status, {
    "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
  });
  res.end(text);
}

module.exports = { proxyPost };
