// Page wiring for the Web Injection Lab.
//
// proof() is defined FIRST and put on window: payloads call it when
// they execute, including stored guestbook payloads that fire while
// the page renders. The detector turns red and logs each hit.

import { els } from "./els.js";
import { PAYLOADS } from "./payloads.js";
import {
  isSafeMode,
  renderGuestbookVulnerable, renderGuestbookSafe,
  renderProfileVulnerable, renderProfileSafe,
  renderGreetingVulnerable, renderGreetingSafe,
} from "./render.js";
import { loadPosts, savePosts, clearPosts } from "./store.js";

let proofCount = 0;
window.proof = (tag) => {
  proofCount += 1;
  els.detectorCard.classList.add("fired");
  els.detectorStatus.textContent = `INJECTION EXECUTED — ${tag}`;
  const li = document.createElement("li");
  const time = new Date().toLocaleTimeString();
  li.textContent = `${time} — proof('${tag}') ran (hit #${proofCount})`;
  els.proofLog.prepend(li);
};

// --- Panels ---

let posts = loadPosts();

function renderGuestbook() {
  (isSafeMode() ? renderGuestbookSafe : renderGuestbookVulnerable)(els.gbList, posts);
}

function profileFields() {
  return { name: els.pfName.value, bio: els.pfBio.value, avatar: els.pfAvatar.value, url: els.pfUrl.value };
}

function renderProfile() {
  (isSafeMode() ? renderProfileSafe : renderProfileVulnerable)(els.pfCard, profileFields());
}

function greetingName() {
  return new URLSearchParams(location.search).get("name") || "stranger";
}

function renderGreeting() {
  (isSafeMode() ? renderGreetingSafe : renderGreetingVulnerable)(els.greeting, greetingName());
}

function renderAll() {
  renderGuestbook();
  renderProfile();
  renderGreeting();
}

// --- Guestbook wiring ---

els.gbPost.addEventListener("click", () => {
  posts.push({ name: els.gbName.value, comment: els.gbComment.value });
  savePosts(posts);
  renderGuestbook();
});

// --- Profile wiring (live preview) ---

for (const el of [els.pfName, els.pfBio, els.pfAvatar, els.pfUrl]) {
  el.addEventListener("input", renderProfile);
}

// --- Reflected wiring ---

function updateReflLink() {
  const url = new URL(location.href);
  url.search = `?name=${encodeURIComponent(els.reflName.value)}`;
  els.reflLink.href = url.href;
  els.reflLink.textContent = url.href;
}
els.reflName.addEventListener("input", updateReflLink);
els.reflGo.addEventListener("click", () => { location.href = els.reflLink.href; });
// If we arrived via a crafted link, show that name in the box too.
if (new URLSearchParams(location.search).has("name")) els.reflName.value = greetingName();
updateReflLink();

// --- Payload library ---

// Where each payload goes, in plain words: the exact panel and field
// to paste it into, and what to do after pasting.
const TARGET_INFO = {
  guestbook: { field: () => els.gbComment, where: "Guestbook panel → the “Comment” field", after: "then click “Post comment”" },
  bio: { field: () => els.pfBio, where: "Profile preview panel → the “Bio” field", after: "the preview card updates as you type" },
  avatar: { field: () => els.pfAvatar, where: "Profile preview panel → the “Avatar image URL” field", after: "the preview card updates as you type" },
  url: { field: () => els.pfUrl, where: "Profile preview panel → the “Website” field", after: "then click the “Website” link in the preview card" },
  reflected: { field: () => els.reflName, where: "Reflected greeting panel → the “Name in the URL” field", after: "then click “Open test link”" },
};

// Pulse the target field so the eye lands exactly where the payload
// belongs.
function flashField(el) {
  if (!el) return;
  el.classList.remove("flash");
  void el.offsetWidth; // restart the animation if it was already flashing
  el.classList.add("flash");
  setTimeout(() => el.classList.remove("flash"), 2600);
}

function tryPayload(p) {
  const info = TARGET_INFO[p.target];
  if (p.target === "guestbook") {
    els.gbComment.value = p.payload;
    els.gbPost.click();
    document.getElementById("guestbook").scrollIntoView({ behavior: "smooth" });
  } else if (p.target === "bio") {
    els.pfBio.value = p.payload;
    renderProfile();
    document.getElementById("profile").scrollIntoView({ behavior: "smooth" });
  } else if (p.target === "avatar") {
    els.pfAvatar.value = p.payload;
    renderProfile();
    document.getElementById("profile").scrollIntoView({ behavior: "smooth" });
  } else if (p.target === "url") {
    els.pfUrl.value = p.payload;
    renderProfile();
    document.getElementById("profile").scrollIntoView({ behavior: "smooth" });
  } else if (p.target === "reflected") {
    els.reflName.value = p.payload;
    updateReflLink();
    location.href = els.reflLink.href;
    return; // page is navigating away; nothing to flash
  }
  setTimeout(() => flashField(info.field()), 350);
}

async function copyText(text, btn) {
  const original = btn.textContent;
  try { await navigator.clipboard.writeText(text); btn.textContent = "Copied!"; }
  catch (_) { btn.textContent = "Copy failed"; }
  setTimeout(() => { btn.textContent = original; }, 1200);
}

function buildLibrary() {
  const groups = new Map();
  for (const p of PAYLOADS) {
    if (!groups.has(p.group)) groups.set(p.group, []);
    groups.get(p.group).push(p);
  }
  for (const [group, items] of groups) {
    const h = document.createElement("h3");
    h.textContent = group;
    els.payloadLib.appendChild(h);
    for (const p of items) {
      const info = TARGET_INFO[p.target];
      const card = document.createElement("div");
      card.className = "payload";
      const title = document.createElement("strong");
      title.textContent = p.title;
      const where = document.createElement("p");
      where.className = "paste-target";
      where.textContent = `Paste into: ${info.where} — ${info.after}.`;
      const code = document.createElement("code");
      code.className = "payload-code";
      code.textContent = p.payload;
      code.title = "Click to copy this payload";
      code.addEventListener("click", () => copyText(p.payload, code));
      const expect = document.createElement("p");
      expect.className = "note";
      expect.textContent = p.expect;
      const tryBtn = document.createElement("button");
      tryBtn.type = "button";
      tryBtn.textContent = "Load it for me";
      tryBtn.addEventListener("click", () => tryPayload(p));
      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "secondary";
      copyBtn.textContent = "Copy payload";
      copyBtn.addEventListener("click", () => copyText(p.payload, copyBtn));
      const showBtn = document.createElement("button");
      showBtn.type = "button";
      showBtn.className = "secondary";
      showBtn.textContent = "Show me where";
      showBtn.addEventListener("click", () => {
        info.field().scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => flashField(info.field()), 350);
      });
      const classic = document.createElement("span");
      classic.className = "note";
      classic.textContent = ` classic form: ${p.classic}`;
      card.append(title, where, code, expect, tryBtn, copyBtn, showBtn, classic);
      els.payloadLib.appendChild(card);
    }
  }
}

// --- Mode + reset ---

els.safeMode.addEventListener("change", renderAll);
els.resetLab.addEventListener("click", () => {
  posts = clearPosts();
  proofCount = 0;
  els.proofLog.replaceChildren();
  els.detectorCard.classList.remove("fired");
  els.detectorStatus.textContent = "No injection yet";
  renderAll();
});

buildLibrary();
renderAll();
