# Decision Model Examples

Worked examples for **Jev decision models** on **Ollama Cloud** — models
that don't generate text, but score typed questions (pick an option, yes/no,
rate on a scale) in a single forward pass and return probabilities.

Nothing here is hosted: check the repo out and run it yourself.

## What's in this repo

```
python/    The five examples in Python (stdlib only) + the jev.py client
web/       The same five examples as a web page (index.html, app.js, style.css)
server.js  Node server: serves web/ and proxies the API calls, adding
           the Ollama Cloud key server-side (see "Web demo" below)
.env.example   Copy to .env and add your OLLAMA_API_KEY (git-ignored)
```

## Python

```bash
cd python
export OLLAMA_API_KEY=<your key from ollama.com/settings/keys>
./run_all.sh            # all five examples, or run one: python3 01_ticket_triage.py
```

Full guide: **[python/README.md](python/README.md)**

## Web demo

Check the repo out, then run the Node server — the browser talks to
the server on the same origin, the server adds the key from `.env`,
and the key never reaches the browser. (This indirection is needed
because browsers can't call Ollama Cloud directly: its API doesn't
answer browser preflight/CORS requests.)

```bash
cp .env.example .env   # put OLLAMA_API_KEY=... in .env
node server.js         # port 8000; editing .env needs no restart
# open http://localhost:8000
```

In server mode the page's Connection section is hidden entirely
(endpoint and key live in `.env`), leaving a **Models bar**: a dropdown
of the System One models verified against Ollama Cloud (`clef:cloud`,
`clef-flash:cloud`, `clef:27b`, `clef`, `clef-flash`) and a dropdown of
normal LLMs. The single *Run decision* button on every example runs
the same state and questions through both models, side by side, with
the whole input, timing and token counts for each. No dependencies;
Node 18+.

Alternatively, serve `web/` statically and run it against a local
Ollama daemon (choose *Custom…* and point it at the daemon; no key
needed — daemons accept browser calls from localhost origins).

## Licence

MIT — see `LICENSE`.
