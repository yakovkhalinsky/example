#!/usr/bin/env python3
"""Example 1 — Support ticket triage in a single decision call.

The classic decision-model demo: route the ticket, score its urgency and
check two yes/no conditions — four questions, one forward pass, zero
generated tokens. With a chat LLM you'd prompt, parse and hope; here you
get probabilities you can set thresholds on (e.g. "if the top team's
probability is under 0.6, send it to a human instead").
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from jev import decide, show_choice, show_noul, show_score

QUESTIONS = {
    "team": {
        "type": "choice",
        "instructions": "Which team should handle this ticket?",
        "criteria": {
            "billing": "Payments, charges, invoices and refunds",
            "technical": "Bugs, errors, and how-to problems with the product",
            "account": "Sign-up, login, passwords and account settings",
            "other": "Anything that does not fit the other teams",
        },
    },
    "urgency": {
        "type": "score",
        "instructions": "How urgent is this ticket?",
        "criteria": ["Routine", "Soon", "Immediate"],
    },
    "blocked": {
        "type": "noul",
        "instructions": "Is the customer currently blocked from doing their work?",
    },
    "refund_requested": {
        "type": "noul",
        "instructions": "Is the customer asking for a refund?",
    },
}

TICKETS = [
    "I was charged twice for my subscription this month. "
    "Please refund the extra amount today.",
    "Since this morning's update, clicking Export to PDF closes the app. "
    "Our whole team of 40 is locked out of reporting until this is fixed.",
    "How do I change the email address on my account? "
    "No rush, just tidying things up.",
]

for ticket in TICKETS:
    answers = decide(ticket, QUESTIONS)
    print(f"Ticket: {ticket[:72]}...")
    show_choice("team", answers["team"])
    show_score("urgency", answers["urgency"])
    show_noul("blocked", answers["blocked"])
    show_noul("refund_requested", answers["refund_requested"])
    print()
