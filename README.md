# Decision Model Examples

Worked examples for **Jev decision models** on **Ollama Cloud** — models
that don't generate text, but score typed questions (pick an option, yes/no,
rate on a scale) in a single forward pass and return probabilities.

Everything lives in the [`examples/`](examples/) folder, which is
self-contained: a tiny stdlib-only Python client (`jev.py`), five runnable
examples, and a README explaining how to use each one.

**Prefer clicking to running code?** The same five examples run as a web
page: **https://yakov.khalinsky.com/decision-model-examples/** (source in
[`docs/`](docs/)). One catch: browsers can't call Ollama Cloud directly —
its API doesn't answer browser preflight (CORS) requests — so run the
page against an Ollama daemon instead:

```bash
cd docs && python3 -m http.server 8000   # then open http://localhost:8000
```

Choose *Custom…* as the endpoint and point it at your daemon (local, or a
host on your own network), model `clef:cloud`, no API key needed —
daemons accept browser calls from localhost origins by default.

## Start here

```bash
cd examples
export OLLAMA_API_KEY=<your key from ollama.com/settings/keys>
./demo.sh            # run all five examples
```

Full guide: **[examples/README.md](examples/README.md)**

## Licence

MIT — see `LICENSE`.
