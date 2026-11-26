"""A tiny client for Jev / System One decision models, stdlib only.

Decision models (the Jev family, and Cloudflare's Clef which Ollama Cloud
hosts) don't generate text. You send a *state* and a set of typed
*questions*; the model scores every option of every question in a single
forward pass and returns probabilities. No parsing, no JSON mode, no
"the model said something like..." — just numbers you can threshold on.

Configuration (environment variables):

    OLLAMA_HOST    Base URL of the Ollama endpoint.
                   Default: https://ollama.com  (Ollama Cloud)
                   For a local or self-hosted daemon use e.g.
                   http://localhost:11434
    OLLAMA_API_KEY Your Ollama Cloud API key (required for ollama.com,
                   not needed for a local daemon).
    JEV_MODEL      Model to call. Default: clef:cloud
                   Other options: clef (local), clef-flash (local),
                   actbro/minicpm5-2b-jev (local Jev model).
"""

from __future__ import annotations

import json
import os
import urllib.request

HOST = os.environ.get("OLLAMA_HOST", "https://ollama.com").rstrip("/")
API_KEY = os.environ.get("OLLAMA_API_KEY", "")
MODEL = os.environ.get("JEV_MODEL", "clef:cloud")


def decide(state, questions, model: str | None = None) -> dict:
    """Ask a decision model one or more questions about a state.

    `state` is the evidence: a string, or a JSON-serialisable object.
    `questions` maps a question name to a typed question:

        {"type": "choice", "instructions": "...",
         "criteria": {"label": "when this label applies", ...}}
        {"type": "noul",   "instructions": "Is ... ?"}          # yes/no
        {"type": "score",  "instructions": "...",
         "criteria": ["lowest level", ..., "highest level"]}

    Returns the `answers` object: one entry per question, each with the
    chosen option / probability and a confidence.
    """
    body = json.dumps(
        {"model": model or MODEL, "state": state, "questions": questions}
    ).encode()
    req = urllib.request.Request(
        f"{HOST}/v1/systemone",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    if API_KEY:
        req.add_header("Authorization", f"Bearer {API_KEY}")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read())["answers"]


# --- Pretty-printing helpers, so the examples read well in a demo. ---


def _pct(p: float) -> str:
    return f"{p * 100:.0f}%"


def show_choice(name: str, answer: dict) -> None:
    probs = answer.get("probabilities", {})
    ranked = sorted(probs.items(), key=lambda kv: kv[1], reverse=True)
    parts = ", ".join(f"{label} {_pct(p)}" for label, p in ranked)
    print(f"  {name}: {answer['choice']}  ({parts})")


def show_noul(name: str, answer: dict) -> None:
    p = answer["noul"]
    print(f"  {name}: {'yes' if p >= 0.5 else 'no'}  (yes {_pct(p)})")


def show_score(name: str, answer: dict) -> None:
    legend = answer.get("legend", {})
    level = legend.get(str(round(answer["score"])), "?")
    print(f"  {name}: {level}  (score {answer['score']:.2f} of {len(legend) - 1})")
