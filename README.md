# Decision Model Examples

Worked examples for **Jev decision models** on **Ollama Cloud** — models
that don't generate text, but score typed questions (pick an option, yes/no,
rate on a scale) in a single forward pass and return probabilities.

## What's in this repo

```
python/    The five examples in Python (stdlib only) + the jev.py client
docs/      The same five examples as a web page (GitHub Pages serves it
           from this folder — that's why it's called docs/)
server.js  Node server: serves docs/ and proxies the API calls, adding
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

The same five examples as a web page:
**https://yakov.khalinsky.com/decision-model-examples/** (source in
[`docs/`](docs/)).

Browsers can't call Ollama Cloud directly — its API doesn't answer
browser preflight (CORS) requests — so the hosted page is best run
against an Ollama daemon: serve `docs/` locally, choose *Custom…* as
the endpoint and point it at your daemon, model `clef:cloud`, no key
needed (daemons accept browser calls from localhost origins).

**Or run the Node server** and use Ollama Cloud through it — the
browser talks to the server on the same origin, the server adds the
key, and the key never reaches the browser:

```bash
cp .env.example .env   # put OLLAMA_API_KEY=... in .env
node server.js         # port 8000; editing .env needs no restart
```

In server mode the page's Connection section is hidden entirely
(endpoint and key live in `.env`), leaving a **Models bar**: a dropdown
of the System One models verified against Ollama Cloud (`clef:cloud`,
`clef-flash:cloud`, `clef:27b`, `clef`, `clef-flash`) and a dropdown of
normal LLMs. The single *Run decision* button on every example runs
the same state and questions through both models, side by side, with
the whole input, timing and token counts for each. No dependencies;
Node 18+.

## Licence

MIT — see `LICENSE`.
