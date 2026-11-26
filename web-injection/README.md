# Web Injection Lab

A web page that is **deliberately vulnerable to script injection
(XSS)**, with a test UI for trying classic injection strings — and a
Safe mode that renders the same inputs the patched way, so you can
watch each payload go inert.

> **Warning:** this is an educational lab. Run it locally or on a
> private network only, and never deploy it publicly. The payloads
> only ever execute in your own browser, against this page.

## What's in this folder

```
app/
  server.js        Entry point: starts the HTTP server
  lib/             Server modules — config, router, static files
  public/          The lab page
    index.html
    style.css
    js/            Browser modules — main, payloads, render, store, els
```

## Run it

```bash
cd web-injection
node app/server.js     # or: cd app && npm start — port 8001
# open http://localhost:8001
```

No dependencies; Node 18+. The server deliberately sends **no
Content-Security-Policy header** — a CSP would block the inline event
handlers the lab exists to demonstrate.

## The lab

Three panels, three injection patterns:

1. **Guestbook (stored)** — posts persist in your browser's local
   storage and are rendered with `innerHTML`, so a payload posted
   once re-fires on every visit until you reset the lab.
2. **Profile preview (HTML + attribute + URL contexts)** — a card
   built from four fields: markup injection via name/bio, attribute
   breakout via the avatar URL, and a `javascript:` website link.
3. **Reflected greeting (DOM-based)** — the page greets the
   `?name=` URL parameter via `innerHTML`; the payload rides in a
   crafted link.

The **payload library** holds classic OWASP-style test strings
grouped by context, each with a *Try it* button that loads it into
its target panel, a *Copy* button, and a note on what to expect —
including the control case (a plain `<script>` tag, which does
*not* execute when inserted via `innerHTML`).

Payloads call `proof('…')` instead of `alert(1)`, and the
**detector** at the top of the page turns red and logs every
execution, so there's no guessing whether a payload worked.

**Safe mode** (toggle at the top) re-renders everything the patched
way — DOM APIs with `textContent`, attributes set with
`setAttribute`, and an http/https allowlist for links — and the same
payloads display as harmless text. Each panel also has a short
“Why it works / the fix” note.

## Licence

MIT — see the repo root `LICENSE`.
