"use strict";

// Configuration for the demo server.
//
// Values come from the process environment first, then from .env files,
// re-read on every lookup so editing .env takes effect without a
// restart. Two .env locations are supported, in priority order:
//   1. the repo root (../.env relative to this app/ folder)
//   2. this app/ folder (./.env)
// .env is git-ignored in both places; never commit a real key.

const fs = require("node:fs");
const path = require("node:path");

const APP_ROOT = path.join(__dirname, "..");
const REPO_ROOT = path.join(APP_ROOT, "..");
const PUBLIC_DIR = path.join(APP_ROOT, "public");
const ENV_FILES = [path.join(APP_ROOT, ".env"), path.join(REPO_ROOT, ".env")];

function parseEnvFile(file) {
  const out = {};
  let text;
  try { text = fs.readFileSync(file, "utf8"); } catch { return out; }
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[t.slice(0, eq).trim()] = val;
  }
  return out;
}

function get(name) {
  if (process.env[name]) return process.env[name];
  let merged = {};
  for (const f of ENV_FILES) merged = { ...merged, ...parseEnvFile(f) };
  return merged[name] || "";
}

module.exports = {
  APP_ROOT,
  PUBLIC_DIR,
  ENV_FILES,
  get,
  port: Number(process.env.PORT || 8000),
  host: process.env.HOST || "0.0.0.0",
  upstream: (process.env.OLLAMA_UPSTREAM || "https://ollama.com").replace(/\/+$/, ""),
};
