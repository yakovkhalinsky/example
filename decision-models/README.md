# Decision Model Examples

Worked examples for **Jev decision models** on **Ollama Cloud** — models
that don't generate text, but score typed questions (pick an option, yes/no,
rate on a scale) in a single forward pass and return probabilities.

Nothing here is hosted: check the repo out and run it yourself.
This is one example set in the `example` repo; others live in their
own folders alongside this one.

## What's in this folder

```
app/
  server.js        Entry point: starts the HTTP server
  lib/             Server modules — config (.env), router, proxy, static files
  public/          The web page
    index.html
    style.css
    js/            Browser modules — main, examples, api, render, settings, els
.env.example       Copy to .env and add your OLLAMA_API_KEY (git-ignored)
```

## Run it

Check the repo out, then run the Node server — the browser talks to
the server on the same origin, the server adds the key from `.env`,
and the key never reaches the browser. (This indirection is needed
because browsers can't call Ollama Cloud directly: its API doesn't
answer browser preflight/CORS requests.)

```bash
cd decision-models
cp .env.example .env   # put OLLAMA_API_KEY=... in .env
node app/server.js     # or: cd app && npm start — port 8000
# open http://localhost:8000
```

Editing `.env` needs no restart; the key is re-read per request.
No dependencies; Node 18+.

In server mode the page's Connection section is hidden entirely
(endpoint and key live in `.env`), leaving a **Models bar**: a dropdown
of the System One models verified against Ollama Cloud (`clef:cloud`,
`clef-flash:cloud`, `clef:27b`, `clef`, `clef-flash`) and a dropdown of
normal LLMs. Every example has two *Run* buttons — one per model —
and each fills its own side of the comparison with the whole input,
timing and token counts, so the two can be run in any order and
compared side by side.

Alternatively, serve `app/public/` statically and run it against a local
Ollama daemon (choose *Custom…* and point it at the daemon; no key
needed — daemons accept browser calls from localhost origins).

## Licence

MIT — see the repo root `LICENSE`.
