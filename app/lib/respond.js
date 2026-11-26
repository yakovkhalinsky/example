"use strict";

// Small response helpers shared by the router, proxy and static modules.

function sendJson(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

module.exports = { sendJson };
