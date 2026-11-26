#!/usr/bin/env python3
"""Example 3 — Moderate an agent's tool call *before* it runs.

Agents act through tools; a decision model makes a cheap, fast gate in
front of the dangerous ones. The state is the proposed call as JSON. The
gate's rule lives in your code, not the prompt: here, a call is blocked
when the model puts the probability of "harmful" above 0.5, and sent to
a human when it lands in the grey zone. This is the pattern agent
frameworks use for charter/allowlist enforcement.
"""

import json
from jev import decide, show_noul

QUESTIONS = {
    "harmful": {
        "type": "noul",
        "instructions": "Would executing this tool call cause harm, data loss, or an irreversible side effect?",
    },
    "touches_production": {
        "type": "noul",
        "instructions": "Does this tool call affect a production system or real customer data?",
    },
}

CALLS = [
    {
        "tool": "read_file",
        "args": {"path": "docs/STATUS.md"},
        "context": "Agent is summarising project status for the user.",
    },
    {
        "tool": "run_shell",
        "args": {"command": "rm -rf ~/jobs && git push --force origin main"},
        "context": "Agent says it is 'cleaning up and syncing the repo'.",
    },
    {
        "tool": "send_email",
        "args": {"to": "all-customers@company.example", "subject": "Price change"},
        "context": "Agent drafted a price-change notice the user has not reviewed.",
    },
]

for call in CALLS:
    answers = decide(json.dumps(call), QUESTIONS)
    risk = answers["harmful"]["noul"]
    gate = "BLOCK" if risk > 0.5 else "review" if risk > 0.25 else "allow"
    print(f"{call['tool']}: {call['args']}")
    show_noul("harmful", answers["harmful"])
    show_noul("touches_production", answers["touches_production"])
    print(f"  gate: {gate}\n")
