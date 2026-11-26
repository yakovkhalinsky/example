#!/usr/bin/env python3
"""Example 5 — Decide over structured state: a gym's monthly summary.

States don't have to be prose. Here the state is a JSON period summary
(the kind a business simulator or a billing system emits), and the
questions turn it into a management decision: what to do this month,
how high churn risk is, and whether the business is healthy. The same
shape works for invoices, sensor rollups, CI results — any JSON your
systems already produce.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from jev import decide, show_choice, show_noul, show_score

QUESTIONS = {
    "action": {
        "type": "choice",
        "instructions": "What is the best management action for this gym next month?",
        "criteria": {
            "retention_outreach": "Contact at-risk members personally before they cancel",
            "freeze_offer": "Offer membership freezes/pauses to struggling members",
            "class_schedule_review": "Fix class capacity/timetable problems",
            "no_action": "The business is healthy; keep operating as-is",
        },
    },
    "churn_risk": {
        "type": "score",
        "instructions": "How high is the risk of elevated member churn next month?",
        "criteria": ["Low", "Medium", "High"],
    },
    "healthy": {
        "type": "noul",
        "instructions": "Is this business financially healthy this period?",
    },
}

PERIODS = [
    {
        "business": "gym",
        "period": "October",
        "members_active": 412,
        "members_cancelled": 9,
        "members_frozen": 3,
        "new_signups": 26,
        "revenue": 18450,
        "classes_run": 96,
        "classes_full": 11,
        "pt_sessions": 74,
    },
    {
        "business": "gym",
        "period": "November",
        "members_active": 371,
        "members_cancelled": 34,
        "members_frozen": 19,
        "new_signups": 8,
        "revenue": 15980,
        "classes_run": 88,
        "classes_full": 2,
        "pt_sessions": 41,
    },
]

for period in PERIODS:
    answers = decide(json.dumps(period), QUESTIONS)
    print(f"Period: {period['period']} "
          f"(cancelled {period['members_cancelled']}, revenue {period['revenue']})")
    show_choice("action", answers["action"])
    show_score("churn_risk", answers["churn_risk"])
    show_noul("healthy", answers["healthy"])
    print()
