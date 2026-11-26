"use strict";

// Configuration for the animator server. No secrets here — just bind
// settings from the environment, with defaults for local use.

const path = require("node:path");

module.exports = {
  PUBLIC_DIR: path.join(__dirname, "..", "public"),
  port: Number(process.env.PORT || 8002),
  host: process.env.HOST || "0.0.0.0",
};
