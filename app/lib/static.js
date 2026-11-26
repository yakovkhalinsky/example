"use strict";

// Static file serving for app/public, with a path-traversal guard.
// The old hosted URL had a /decision-model-examples/ prefix, so that
// prefix is accepted as an alias of / for bookmarks' sake.

const fs = require("node:fs");
const path = require("node:path");
const config = require("./config");
const { sendJson } = require("./respond");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8",
};

const PREFIX = "/decision-model-examples";
function stripPrefix(p) {
  return (p === PREFIX || p.startsWith(PREFIX + "/")) ? p.slice(PREFIX.length) || "/" : p;
}

function serveStatic(req, res) {
  let urlPath;
  try { urlPath = stripPrefix(decodeURIComponent(new URL(req.url, "http://localhost").pathname)); }
  catch { return sendJson(res, 400, { error: "Bad URL" }); }
  if (urlPath === "/") urlPath = "/index.html";
  const file = path.normalize(path.join(config.PUBLIC_DIR, urlPath));
  if (!file.startsWith(config.PUBLIC_DIR + path.sep)) return sendJson(res, 403, { error: "Forbidden" });
  fs.readFile(file, (err, data) => {
    if (err) return sendJson(res, 404, { error: "Not found" });
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}

module.exports = { serveStatic, stripPrefix };
