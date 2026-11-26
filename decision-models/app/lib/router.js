"use strict";

// HTTP routing for the demo server:
//   POST /v1/systemone          -> proxied (decision models)
//   POST /v1/chat/completions   -> proxied (normal LLMs, for comparison)
//   GET  /healthz               -> { ok, keyConfigured, upstream }
//   GET/HEAD /*                 -> static files from app/public

const config = require("./config");
const { sendJson } = require("./respond");
const { proxyPost } = require("./proxy");
const { serveStatic, stripPrefix } = require("./static");

const PROXY_PATHS = ["/v1/systemone", "/v1/chat/completions"];

function createHandler() {
  return (req, res) => {
    const pathOnly = stripPrefix(new URL(req.url, "http://localhost").pathname);
    if (req.method === "POST" && PROXY_PATHS.some((p) => pathOnly.startsWith(p))) {
      proxyPost(req, res, pathOnly).catch((e) => sendJson(res, 500, { error: e.message }));
    } else if (req.method === "GET" && pathOnly === "/healthz") {
      sendJson(res, 200, {
        ok: true,
        keyConfigured: Boolean(config.get("OLLAMA_API_KEY")),
        upstream: config.upstream,
      });
    } else if (req.method === "GET" || req.method === "HEAD") {
      serveStatic(req, res);
    } else {
      sendJson(res, 405, { error: "Method not allowed" });
    }
  };
}

module.exports = { createHandler };
