# Jev Decision Models — worked examples

**Decision models don't write essays. They make decisions.**

A Jev-family decision model (served by [Ollama](https://ollama.com) through
its System One API, `/v1/systemone`) takes a *state* — text, JSON, or an
image — plus a set of typed questions, and scores **every option of every
question in a single forward pass**. You get back probabilities, not prose:

- `choice` — pick one of your labelled options, with a probability per option
- `noul` — a yes/no question, answered as the probability of "yes"
- `score` — rate on an ordered scale you define

No output tokens, no JSON-mode pleading, no parsing. Just numbers your code
can threshold on: *if confidence < 0.6, hand it to a human.*

This repo is five small, runnable examples against **Ollama Cloud**
(`clef:cloud` — Cloudflare's Clef, a 27B decision model fine-tuned from
Qwen, hosted by Ollama). The same code runs unchanged against a local
Ollama daemon serving Clef, Clef-Flash, or a community Jev model such as
`actbro/minicpm5-2b-jev`.

## Quickstart

You need Python 3.10+ (standard library only — no installs) and one of:

**Ollama Cloud** — grab an API key from
[ollama.com/settings/keys](https://ollama.com/settings/keys), then:

```bash
export OLLAMA_API_KEY=<your key>
python3 01_ticket_triage.py
```

**Local / self-hosted daemon** — point at any Ollama 0.40.6+ host instead:

```bash
export OLLAMA_HOST=http://localhost:11434
python3 01_ticket_triage.py
```

Configuration is all environment variables (see `.env.example`):
`OLLAMA_HOST`, `OLLAMA_API_KEY`, and `JEV_MODEL` (default `clef:cloud`).

Or run the whole demo end to end:

```bash
./demo.sh
```

## The examples

### 1. Ticket triage — `01_ticket_triage.py`

Route a support ticket, score its urgency, and check two yes/no
conditions — four questions in **one** call.

```
Ticket: I was charged twice for my subscription this month. Please refund the ex...
  team: billing  (billing 99%, technical 1%, other 0%, account 0%)
  urgency: Immediate  (score 1.93 of 2)
  blocked: no  (yes 3%)
  refund_requested: yes  (yes 99%)
```

### 2. Refund policy — `02_refund_policy.py`

Apply a written policy: the policy text goes in the state, the allowed
outcomes are a `choice`, and side questions show the model's reasoning
trail (inside the window? proof provided?).

```
Request: Bought the annual plan 10 days ago (order #88123, receipt attached). Cha...
  decision: approve  (approve 99%, deny 1%, escalate 0%)
  within_window: yes  (yes 99%)
  proof_provided: yes  (yes 98%)
```

### 3. Agent tool-call guard — `03_agent_tool_call_guard.py`

Moderate an agent's proposed tool call *before* it runs. The gate rule
lives in your code (block if P(harmful) > 0.5), not in a prompt.

```
run_shell: {'command': 'rm -rf ~/jobs && git push --force origin main'}
  harmful: yes  (yes 97%)
  touches_production: yes  (yes 55%)
  gate: BLOCK
```

### 4. Mode routing — `04_mode_routing.py`

The production pattern: an agent supervisor decides how much process a
task brief deserves — micro, lite, or the full lifecycle. (A compressed
version of a routing policy that runs against `clef:cloud` in
production.) Low confidence is itself a signal: escalate the routing
decision to a human.

```
Brief: Fix the off-by-one error in the pagination helper and add a regression t...
  mode: lite  (lite 87%, micro 11%, full 2%)
```

### 5. Business decisions over JSON — `05_business_decisions.py`

States don't have to be prose. Feed a JSON period summary (members,
cancellations, revenue) and get a management decision back.

```
Period: November (cancelled 34, revenue 15980)
  action: retention_outreach  (retention_outreach 84%, no_action 6%, freeze_offer 5%, class_schedule_review 5%)
  churn_risk: High  (score 1.78 of 2)
  healthy: no  (yes 37%)
```

*(Outputs above are real, captured from `clef:cloud`. Probabilities vary
slightly between runs — that's rather the point of returning them.)*

## The API in one screen

```http
POST /v1/systemone
{
  "model": "clef:cloud",
  "state": "I was charged twice and I want my money back today.",
  "questions": {
    "intent": {"type": "choice", "instructions": "What does the customer want?",
               "criteria": {"refund": "wants money back", "info": "asks a question"}},
    "upset":  {"type": "noul", "instructions": "Is the customer upset?"}
  }
}
```

```json
{"answers": {
  "intent": {"type": "choice", "choice": "refund", "confidence": 0.99,
             "probabilities": {"refund": 0.995, "info": 0.005}},
  "upset":  {"type": "noul", "noul": 0.94}
}, "usage": {"input_tokens": 246, "output_tokens": 0}}
```

`jev.py`, right here in this folder is a ~60-line, stdlib-only client wrapping exactly
this. Read it, steal it.

## When to use a decision model (and when not)

Use one when the answer is one of a known set: routing, triage,
classification, policy application, risk scoring, gating. It's fast
(a single pass), cheap (zero output tokens), calibrated enough to
threshold, and it cannot hallucinate an option you didn't offer.

Don't use one to *produce* anything — explanations, drafts, code. It
decides; it cannot write. Pair it with a generative model when you need
both: the decision model routes and gates, the LLM does the talking.

## Links

- Clef on Ollama: https://ollama.com/library/clef
- A local Jev model: https://ollama.com/ActBro/minicpm5-2b-jev
- Ollama Cloud: https://ollama.com/cloud

## Licence

MIT — see `LICENSE`.
