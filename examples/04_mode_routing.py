#!/usr/bin/env python3
"""Example 4 — Route work by size: the production pattern behind this repo.

This is a decision model doing a real job: an agent supervisor receives
a task brief and must decide how much process the task deserves — a
quick single-pass job, a standard build/verify cycle, or the full
lifecycle with design review. A generative model would waffle and cost
real tokens; a decision model answers in one pass with probabilities,
and a low-confidence answer can itself be the signal to escalate.

(The criteria below are a compressed version of a real routing policy
used with clef:cloud in production.)
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from jev import decide, show_choice

QUESTIONS = {
    "mode": {
        "type": "choice",
        "instructions": "How much process does this task brief need?",
        "criteria": {
            "micro": "One small, well-specified change with an obvious check; a single package, no design questions, no test writing",
            "lite": "A known-approach build in one area: implement to a clear spec, then verify (including writing or updating tests); some judgement calls but no open design",
            "full": "Design, security, persistence, or cross-system work; ambiguous requirements, irreversible steps, or anything needing a design review first",
        },
    }
}

BRIEFS = [
    "Write a haiku about autumn leaves into a file called haiku.txt.",
    "Fix the off-by-one error in the pagination helper and add a "
    "regression test. The failing case is described in issue #112.",
    "Redesign our authentication: replace session cookies with signed "
    "tokens, migrate the user store, and keep old sessions valid during "
    "rollout. Security review required before anything ships.",
]

for brief in BRIEFS:
    answers = decide(brief, QUESTIONS)
    print(f"Brief: {brief[:72]}...")
    show_choice("mode", answers["mode"])
    print()
