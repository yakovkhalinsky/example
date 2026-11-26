#!/usr/bin/env python3
"""Example 2 — Policy enforcement: refund decisions against a written policy.

You give the model the policy as part of the state and the allowed
outcomes as a choice question. The model applies the policy; your code
decides what each outcome means (approve pays out automatically, deny
sends the standard reply, escalate goes to a human). The side questions
show *why*: was it inside the window, was proof provided?
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from jev import decide, show_choice, show_noul

POLICY = """Refund policy:
- Full refund if the request is within 30 days of purchase and the
  customer provides proof of purchase (receipt or order number).
- Requests 31-60 days after purchase, or without proof, go to a human.
- No refunds after 60 days, except where consumer law requires one.
"""

QUESTIONS = {
    "decision": {
        "type": "choice",
        "instructions": "Under the policy in the state, what happens to this refund request?",
        "criteria": {
            "approve": "The policy clearly allows a full refund",
            "deny": "The policy clearly refuses this refund",
            "escalate": "The policy sends this case to a human",
        },
    },
    "within_window": {
        "type": "noul",
        "instructions": "Was the request made within 30 days of purchase?",
    },
    "proof_provided": {
        "type": "noul",
        "instructions": "Did the customer provide proof of purchase?",
    },
}

CASES = [
    "Bought the annual plan 10 days ago (order #88123, receipt attached). "
    "Changed my mind — please refund in full.",
    "I purchased this 45 days ago and no longer need it. "
    "I don't have the receipt any more.",
    "Bought this 5 months ago and it stopped working last week. "
    "Your support team told me to ask for my money back.",
]

for request in CASES:
    state = f"{POLICY}\nCustomer request: {request}"
    answers = decide(state, QUESTIONS)
    print(f"Request: {request[:72]}...")
    show_choice("decision", answers["decision"])
    show_noul("within_window", answers["within_window"])
    show_noul("proof_provided", answers["proof_provided"])
    print()
