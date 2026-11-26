// Connection settings: persistence in localStorage, the Forget
// control, and server-mode detection.
//
// When the Node server serves this page it answers /healthz; then the
// endpoint and API key live in the server's .env, so the page switches
// to the same-origin proxy and the whole Connection section is hidden.

import { els } from "./els.js";

const STORAGE_KEY = "decision-model-examples:connection:v1";

export function updateCustomVisibility() {
  els.customWrap.hidden = els.preset.value !== "custom";
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      endpointPreset: els.preset.value,
      endpoint: els.endpoint.value,
      model: els.model.value,
      llmModel: els.llmModel.value,
      apiKey: els.apiKey.value,
    }));
  } catch (_) { /* storage unavailable (private mode etc.) — page still works */ }
}

function setIfValid(select, value) {
  if (typeof value === "string" && [...select.options].some((o) => o.value === value)) {
    select.value = value;
  }
}

function loadSettings() {
  let saved = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) saved = JSON.parse(raw);
  } catch (_) { saved = null; }
  if (saved && typeof saved === "object") {
    setIfValid(els.preset, saved.endpointPreset);
    if (typeof saved.endpoint === "string") els.endpoint.value = saved.endpoint;
    setIfValid(els.model, saved.model);
    setIfValid(els.llmModel, saved.llmModel);
    if (typeof saved.apiKey === "string") els.apiKey.value = saved.apiKey;
  }
  updateCustomVisibility();
}

function forgetSettings() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  els.apiKey.value = "";
  els.endpoint.value = "";
  els.preset.selectedIndex = 0;
  els.model.value = "clef:cloud";
  els.llmModel.value = "gpt-oss:120b";
  updateCustomVisibility();
  if (els.forgetStatus) els.forgetStatus.textContent = "Saved key and settings forgotten.";
}

function detectServerMode() {
  fetch("/healthz").then((r) => r.json()).then((h) => {
    if (!h || !h.ok) return;
    els.preset.value = "same-origin";
    updateCustomVisibility();
    els.config.hidden = true;
    if (!h.keyConfigured) {
      console.warn("Node server reports NO API key configured in .env — runs will fail until one is added.");
    }
  }).catch(() => {});
}

export function initSettings() {
  loadSettings();
  detectServerMode();
  for (const el of [els.preset, els.endpoint, els.model, els.llmModel, els.apiKey]) {
    el.addEventListener("input", () => { updateCustomVisibility(); saveSettings(); });
    el.addEventListener("change", () => { updateCustomVisibility(); saveSettings(); });
  }
  els.forgetKey.addEventListener("click", forgetSettings);
}
