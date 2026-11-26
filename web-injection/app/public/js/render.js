// Renderers — the heart of the lab. Every panel has two versions:
//   vulnerable: string concatenation into innerHTML, the classic bug.
//   safe:       DOM APIs + textContent, plus a protocol allowlist for
//               links. Same visual result for honest input.
// main.js picks the pair based on the Safe mode toggle.

export function isSafeMode() {
  return document.getElementById("safeMode").checked;
}

// --- Guestbook ---

export function renderGuestbookVulnerable(listEl, posts) {
  listEl.innerHTML = posts.map((p) =>
    `<div class="comment"><span class="cname">${p.name}</span><p>${p.comment}</p></div>`
  ).join("");
}

export function renderGuestbookSafe(listEl, posts) {
  listEl.replaceChildren(...posts.map((p) => {
    const div = document.createElement("div");
    div.className = "comment";
    const name = document.createElement("span");
    name.className = "cname";
    name.textContent = p.name;
    const body = document.createElement("p");
    body.textContent = p.comment;
    div.append(name, body);
    return div;
  }));
}

// --- Profile preview ---

export function renderProfileVulnerable(cardEl, f) {
  cardEl.innerHTML = `
    <img class="avatar" src="${f.avatar}" alt="">
    <div>
      <h3>${f.name}</h3>
      <p>${f.bio}</p>
      <a href="${f.url}" rel="noopener">Website</a>
    </div>`;
}

// Only http:/https: links are honoured in safe mode; anything else
// (javascript:, data:, …) becomes a dead "#".
export function safeUrl(raw) {
  try {
    const u = new URL(raw, location.href);
    return (u.protocol === "http:" || u.protocol === "https:") ? u.href : "#";
  } catch { return "#"; }
}

export function renderProfileSafe(cardEl, f) {
  const img = document.createElement("img");
  img.className = "avatar";
  img.setAttribute("src", f.avatar); // value can't break out of the attribute
  img.alt = "";
  const name = document.createElement("h3");
  name.textContent = f.name;
  const bio = document.createElement("p");
  bio.textContent = f.bio;
  const link = document.createElement("a");
  link.setAttribute("href", safeUrl(f.url));
  link.setAttribute("rel", "noopener");
  link.textContent = "Website";
  const wrap = document.createElement("div");
  wrap.append(name, bio, link);
  cardEl.replaceChildren(img, wrap);
}

// --- Reflected greeting ---

export function renderGreetingVulnerable(el, name) {
  el.innerHTML = `Welcome, ${name}!`;
}

export function renderGreetingSafe(el, name) {
  el.textContent = `Welcome, ${name}!`;
}
