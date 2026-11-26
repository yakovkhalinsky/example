# Decision Model Examples

Worked examples for **Jev decision models** on **Ollama Cloud** — models
that don't generate text, but score typed questions (pick an option, yes/no,
rate on a scale) in a single forward pass and return probabilities.

Everything lives in the [`examples/`](examples/) folder, which is
self-contained: a tiny stdlib-only Python client (`jev.py`), five runnable
examples, and a README explaining how to use each one.

**Prefer clicking to running code?** The same five examples run in your
browser — no installs, bring your own Ollama Cloud key:
**https://yakovkhalinsky.github.io/decision-model-examples/** (source in
[`docs/`](docs/)).

## Start here

```bash
cd examples
export OLLAMA_API_KEY=<your key from ollama.com/settings/keys>
./demo.sh            # run all five examples
```

Full guide: **[examples/README.md](examples/README.md)**

## Licence

MIT — see `LICENSE`.
