// Guestbook persistence: posts live in localStorage, which is what
// makes the guestbook a *stored* injection demo — a payload posted
// once re-renders (and re-fires) on every visit until the lab is
// reset. Only ever in your own browser.

const KEY = "web-injection-lab:guestbook:v1";

const SEED = [
  { name: "Ada", comment: "First! Lovely guestbook you have here." },
  { name: "Grace", comment: "What could possibly go wrong?" },
];

export function loadPosts() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { /* corrupted storage — fall through to the seed */ }
  return [...SEED];
}

export function savePosts(posts) {
  try { localStorage.setItem(KEY, JSON.stringify(posts)); } catch (_) {}
}

export function clearPosts() {
  try { localStorage.removeItem(KEY); } catch (_) {}
  return [...SEED];
}
