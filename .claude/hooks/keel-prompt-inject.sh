#!/bin/bash
# Keel Prompt Injection — UserPromptSubmit hook
# Fires on every user prompt. Injects core rules into context.
# Per research: this survives context compaction because it re-injects on every prompt.

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Count session edits to estimate context usage
EDIT_COUNT=0
CHANGES_LOG="$PROJECT_DIR/.claude/logs/changes.log"
if [ -f "$CHANGES_LOG" ]; then
    EDIT_COUNT=$(wc -l < "$CHANGES_LOG" 2>/dev/null || echo 0)
fi

cat << 'RULES'
=== KEEL ACTIVE RULES ===
- ALL visual values from src/theme/tokens.ts — NEVER hardcode
- Glassmorphism v3.1: standard/strong/inset ONLY
- NO red in ambient (NNR-06). NO shame language (NNR-03)
- Check user phase before rendering features (Section 4)
- Source Code Pro + tabular-nums for ALL financial figures
- formatAmount(cents) for display — amounts are integers
=== SESSION DISCIPLINE ===
- ONE component per session. Finish fully before next.
- After OpenSpec approval → implement AUTONOMOUSLY (no stopping between steps)
- If context feels heavy (many edits, long conversation) → write HANDOFF.md → stop
=========================
RULES

# Warn when edit count suggests context is getting heavy
if [ "$EDIT_COUNT" -gt 20 ]; then
    echo "SESSION WARNING: $EDIT_COUNT edits this session."
    echo "Write HANDOFF.md and start a fresh session."
    echo "Command: /clear or exit and restart claude."
fi

exit 0
