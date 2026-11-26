"use strict";

// HTTP routing: a health check, and static files for everything else.
// All the interesting (deliberately unsafe) behaviour is client-side.

const { sendJson } = require("./respond");
const { serveStatic } = require("./static");

function createHandler() {
  return (req, res) => {
    const pathOnly = new URL(req.url, "http://localhost").pathname;
    if (req.method === "GET" && pathOnly === "/healthz") {
      sendJson(res, 200, { ok: true, lab: "web-injection" });
    } else if (req.method === "GET" || req.method === "HEAD") {
      serveStatic(req, res);
    } else {
      sendJson(res, 405, { error: "Method not allowed" });
    }
  };
}

module.exports = { createHandler };
