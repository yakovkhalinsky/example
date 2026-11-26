#!/bin/sh
# Run all five Python examples, in order.
# Needs OLLAMA_API_KEY in the environment, unless OLLAMA_HOST points at a
# local daemon or the Node proxy (which adds the key server-side).
set -e
cd "$(dirname "$0")"
for f in 01_ticket_triage.py 02_refund_policy.py 03_agent_tool_call_guard.py 04_mode_routing.py 05_business_decisions.py; do
    echo "===== $f ====="
    python3 "$f"
done
