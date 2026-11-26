#!/bin/sh
# Run the full demo: all five examples, in order.
set -e
cd "$(dirname "$0")"
for f in 0*.py; do
    echo "===== $f ====="
    python3 "$f"
done
