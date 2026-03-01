#!/bin/bash
# toggle-inference.sh — Switch between Anthropic cloud and local DGX Spark
# Usage: ./scripts/toggle-inference.sh [anthropic|local|status]

SETTINGS=".claude/settings.json"

case "${1:-status}" in
    local)
        node -e "
const fs = require('fs');
const s = JSON.parse(fs.readFileSync('$SETTINGS','utf8'));
s.env = s.env || {};
s.env.KEEL_INFERENCE_MODE = 'local';
s.env.ANTHROPIC_BASE_URL = 'http://localhost:8080';
s.env.ANTHROPIC_AUTH_TOKEN = 'local-placeholder';
s.env.ANTHROPIC_MODEL = 'MiniMax-M2.5';
s.env.API_TIMEOUT_MS = '3000000';
fs.writeFileSync('$SETTINGS', JSON.stringify(s, null, 2));
"
        echo "🖥️  Now using LOCAL DGX Spark (MiniMax-M2.5)"
        echo "   Verify: curl http://localhost:8080/v1/models"
        ;;
    anthropic)
        node -e "
const fs = require('fs');
const s = JSON.parse(fs.readFileSync('$SETTINGS','utf8'));
s.env = s.env || {};
s.env.KEEL_INFERENCE_MODE = 'anthropic';
delete s.env.ANTHROPIC_BASE_URL;
delete s.env.ANTHROPIC_AUTH_TOKEN;
delete s.env.ANTHROPIC_MODEL;
delete s.env.API_TIMEOUT_MS;
fs.writeFileSync('$SETTINGS', JSON.stringify(s, null, 2));
"
        echo "☁️  Now using ANTHROPIC cloud (subscription)"
        ;;
    status)
        MODE=$(node -e "const s=JSON.parse(require('fs').readFileSync('$SETTINGS','utf8'));console.log(s.env?.KEEL_INFERENCE_MODE||'anthropic')" 2>/dev/null || echo "anthropic")
        echo "Current mode: $MODE"
        if [ "$MODE" = "local" ]; then
            echo "Target: localhost:8080 (MiniMax-M2.5)"
            curl -s --max-time 3 http://localhost:8080/v1/models > /dev/null 2>&1 && echo "Health: ✅ reachable" || echo "Health: ❌ unreachable"
        else
            echo "Target: Anthropic API (subscription quota)"
        fi
        ;;
    *)
        echo "Usage: $0 [anthropic|local|status]"
        ;;
esac
