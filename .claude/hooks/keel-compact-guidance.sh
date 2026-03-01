#!/bin/bash
# Keel PreCompact Guidance — adapted from Ruflo v3.5 compact hooks
# Injects critical context reminders before Claude compacts the conversation
# Also triggers HANDOFF.md creation since compaction = context exhaustion

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" 2>/dev/null || exit 0

# Read compact type from hook input (manual or auto)
COMPACT_TYPE="${1:-auto}"

echo "--- Keel PreCompact Guidance ---"
echo ""

if [ "$COMPACT_TYPE" = "manual" ]; then
    echo "BEFORE COMPACTING — Review these critical files:"
    echo "  1. CLAUDE.md — 10 absolute rules (token-only, no red, no shame, phase gates)"
    echo "  2. .claude/rules/01-design-system.md — Glass tiers, color encoding, typography"
    echo "  3. .claude/rules/02-architecture.md — Component patterns, ADRs"
    echo "  4. LESSONS_LEARNED.md — 29 verified failure patterns"
    echo "  5. DECISIONS.md — Architecture Decision Records"
else
    echo "AUTO-COMPACT (context window full) — Critical rules to preserve:"
    echo "  - ALL colors from src/theme/tokens.ts — NEVER hardcode hex/rgba"
    echo "  - GlassCard tier=standard|strong|inset — THREE tiers only"
    echo "  - NO red in ambient — Burnished Gold #9A7B4F for warnings"
    echo "  - NO shame language — 'trending' not 'over budget'"
    echo "  - Phase gating — check user phase before rendering features"
    echo "  - Amounts as cents (integer) — never floats"
    echo "  - Source Code Pro for ALL financial figures"
    echo ""
    echo "IMPORTANT: Context is full. You MUST:"
    echo "  1. Write HANDOFF.md with remaining work before compacting"
    echo "  2. After compact, read HANDOFF.md to resume"
    echo "  3. If task is done, delete HANDOFF.md"
fi

echo ""

# Show current session state
if [ -f ".claude/logs/drift-report.log" ]; then
    HIGH_DRIFT=$(tail -20 ".claude/logs/drift-report.log" 2>/dev/null | awk -F'drift:' '{print $2}' | grep -oP '[0-9]+' 2>/dev/null | sort -rn | head -1)
    if [ -n "$HIGH_DRIFT" ] && [ "$HIGH_DRIFT" -gt 10 ]; then
        echo "  Current drift: ${HIGH_DRIFT}% — review before compacting"
    fi
fi

if [ -f ".claude/logs/changes.log" ]; then
    EDIT_COUNT=$(wc -l < ".claude/logs/changes.log" 2>/dev/null)
    FILE_COUNT=$(awk '{print $NF}' ".claude/logs/changes.log" 2>/dev/null | sort -u | wc -l)
    echo "  Session edits: $EDIT_COUNT across $FILE_COUNT file(s)"
fi

echo ""
echo "--- End PreCompact Guidance ---"
exit 0
