#!/usr/bin/env bash
# ── health-check.sh ───────────────────────────────────────────────────────────
# Checks the health of a running instance from outside the containers.
# Usage: ./scripts/health-check.sh [base-url]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE_URL="${1:-http://localhost}"
HEALTH_URL="${BASE_URL}/api/health/"

echo "Checking ${HEALTH_URL}..."
echo ""

RESPONSE=$(curl -sf --max-time 10 "${HEALTH_URL}" 2>&1) || {
    echo "✗ Could not reach ${HEALTH_URL}"
    exit 1
}

echo "${RESPONSE}" | python3 -c "
import sys, json

data = json.load(sys.stdin)
status = data.get('status', 'unknown')
version = data.get('version', '?')
env = data.get('environment', '?')

icons = {'up': '✓', 'healthy': '✓', 'degraded': '⚠', 'down': '✗', 'unhealthy': '✗'}

print(f'Open Learn Grid v{version} ({env})')
print(f'Overall: {icons.get(status, \"?\")}{status.upper()}')
print()

for name, info in data.get('components', {}).items():
    s = info.get('status', '?')
    icon = icons.get(s, '?')
    extra = ''
    if 'latency_ms' in info:
        extra = f' ({info[\"latency_ms\"]}ms)'
    if 'workers' in info:
        extra = f' ({info[\"workers\"]} workers)'
    if 'reachable_instances' in info:
        extra = f' ({info[\"reachable_instances\"]} reachable, {info[\"unreachable\"]} unreachable)'
    if 'error' in info:
        extra = f' — {info[\"error\"]}'
    print(f'  {icon} {name:<20} {s}{extra}')
"

echo ""
