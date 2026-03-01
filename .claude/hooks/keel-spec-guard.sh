#!/bin/bash
# Keel Spec Guard — PreToolUse hook (Write|Edit|MultiEdit)
# Blocks writes that violate OpenSpec design rules.
# Exit 2 = BLOCK the write. Exit 0 = allow.
#
# Per research: "Prompts are suggestions; hooks are guarantees."
# This is the single highest-reliability enforcement pattern (95%+).

set -euo pipefail

# Read tool input from stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; print(json.loads(sys.stdin.read()).get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")
CONTENT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()).get('tool_input',{}); print(d.get('content','') or d.get('new_str','') or d.get('insert',''))" 2>/dev/null || echo "")

# If we can't parse, allow (fail-open)
[ -z "$FILE_PATH" ] && exit 0

VIOLATIONS=""

# ─── CHECK 1: Protect lint configs and tokens.ts ───
if echo "$FILE_PATH" | grep -qE '\.(eslintrc|stylelintrc|eslint\.config|prettierrc)'; then
    VIOLATIONS="${VIOLATIONS}\n🚫 BLOCKED: Cannot modify lint configuration ($FILE_PATH)"
fi

if echo "$FILE_PATH" | grep -q 'src/theme/tokens\.ts$'; then
    VIOLATIONS="${VIOLATIONS}\n🚫 BLOCKED: tokens.ts is write-protected. Discuss changes explicitly before modifying."
fi

# Only check content violations for src/ files (not configs, docs, etc.)
if echo "$FILE_PATH" | grep -q '^src/\|^app/\|^web/src/'; then

    # ─── CHECK 2: Hardcoded hex colors (not in comments/imports/token references) ───
    HEX_HITS=$(echo "$CONTENT" | grep -oP "(?<!['\"/a-zA-Z])#[0-9a-fA-F]{3,8}(?![a-zA-Z])" | grep -v "tokens\." | head -5 || true)
    if [ -n "$HEX_HITS" ]; then
        VIOLATIONS="${VIOLATIONS}\n🚫 HARDCODED HEX: Found ${HEX_HITS}. Import from tokens.ts instead."
    fi

    # ─── CHECK 3: Hardcoded rgba() not from token reference ───
    RGBA_HITS=$(echo "$CONTENT" | grep -oP 'rgba?\([^)]+\)' | head -3 || true)
    if [ -n "$RGBA_HITS" ]; then
        VIOLATIONS="${VIOLATIONS}\n🚫 HARDCODED RGBA: Found ${RGBA_HITS}. Use glassmorphism tokens."
    fi

    # ─── CHECK 4: Banned chart types ───
    BANNED=$(echo "$CONTENT" | grep -oiP '(PieChart|DonutChart|Pie|Donut|GaugeChart|Gauge|SpeedometerChart|Speedometer)' | head -3 || true)
    if [ -n "$BANNED" ]; then
        VIOLATIONS="${VIOLATIONS}\n🚫 BANNED CHART: ${BANNED}. Use bullet, diverging bar, or Sankey (OpenSpec §3.3)."
    fi

    # ─── CHECK 5: Shame language (NNR-03) ───
    SHAME=$(echo "$CONTENT" | grep -oiP '\b(over ?budget|overspent|failed|cut ?back|you spent too|you went over|negative balance)\b' | head -3 || true)
    if [ -n "$SHAME" ]; then
        VIOLATIONS="${VIOLATIONS}\n🚫 SHAME LANGUAGE: '${SHAME}'. Use: committed/trending/adjust/remaining/reallocate."
    fi

    # ─── CHECK 6: Red color in non-decision contexts ───
    RED_HITS=$(echo "$CONTENT" | grep -oiP "(red|#[fF][fF]0000|#[cC]0392[bB]|'red'|\"red\"|color:.*red)" | head -3 || true)
    if [ -n "$RED_HITS" ]; then
        # Check if it's in an allowed decision-context
        if ! echo "$CONTENT" | grep -qiP '(breach|hardStop|hard_stop|BEHIND|100.*percent|decision.?context)'; then
            VIOLATIONS="${VIOLATIONS}\n🚫 RED IN AMBIENT: Red only for 100% breach/hard-stop/BEHIND goal (NNR-06). Use warning (amber) or deficit (umber)."
        fi
    fi

    # ─── CHECK 7: Non-spec font families ───
    FONT_HITS=$(echo "$CONTENT" | grep -oiP "fontFamily:\s*['\"](?!Playfair|Source Sans|Source Code|System)[A-Za-z ]+" | head -3 || true)
    if [ -n "$FONT_HITS" ]; then
        VIOLATIONS="${VIOLATIONS}\n🚫 NON-SPEC FONT: ${FONT_HITS}. Only Playfair Display, Source Sans Pro, Source Code Pro."
    fi

    # ─── CHECK 8: Mock/fake data ───
    MOCK_HITS=$(echo "$CONTENT" | grep -oiP '(mockData|fakeData|dummyData|placeholder.*transaction|sampleAmount|testBalance)' | head -3 || true)
    if [ -n "$MOCK_HITS" ]; then
        VIOLATIONS="${VIOLATIONS}\n🚫 MOCK DATA: ${MOCK_HITS}. No fake financial data (NNR-05). Use real API or empty states."
    fi
fi

# ─── VERDICT ───
if [ -n "$VIOLATIONS" ]; then
    echo "═══════════════════════════════════════════════════════"
    echo "  KEEL SPEC GUARD — WRITE BLOCKED"
    echo "═══════════════════════════════════════════════════════"
    echo -e "$VIOLATIONS"
    echo ""
    echo "Fix these violations and try again."
    echo "═══════════════════════════════════════════════════════"
    exit 2
fi

exit 0
