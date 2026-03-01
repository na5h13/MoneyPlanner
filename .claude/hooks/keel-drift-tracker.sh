#!/bin/bash
# Keel Drift Tracker — PostToolUse hook (Write|Edit|MultiEdit)
# Logs changes, calculates drift %, warns on scope creep.
# Per Paul Duvall's 30-repo study: violation rates drop from 12→2
# as the agent learns from correction examples accumulated in context.

LOG_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/logs"
CHANGES_LOG="$LOG_DIR/changes.log"
DRIFT_LOG="$LOG_DIR/drift-report.log"
mkdir -p "$LOG_DIR"

# Parse tool input
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; print(json.loads(sys.stdin.read()).get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "unknown")
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# ─── Log the change ───
echo "[$TIMESTAMP] MODIFIED: $FILE_PATH" >> "$CHANGES_LOG"

# ─── Drift analysis (only for src/ files) ───
if echo "$FILE_PATH" | grep -qE '^(src/|app/|web/src/)' && [ -f "$FILE_PATH" ]; then
    # Count token references vs hardcoded values
    TOKEN_REFS=$(grep -c 'tokens\.\|theme\.\|colors\.\|glass\.\|typography\.' "$FILE_PATH" 2>/dev/null || echo 0)
    HARDCODED_HEX=$(grep -oP "(?<!['\"/a-zA-Z])#[0-9a-fA-F]{3,8}" "$FILE_PATH" 2>/dev/null | wc -l || echo 0)
    HARDCODED_RGBA=$(grep -oP 'rgba?\([^)]+\)' "$FILE_PATH" 2>/dev/null | wc -l || echo 0)
    HARDCODED_TOTAL=$((HARDCODED_HEX + HARDCODED_RGBA))
    TOTAL=$((TOKEN_REFS + HARDCODED_TOTAL))

    if [ "$TOTAL" -gt 0 ]; then
        DRIFT_PCT=$((HARDCODED_TOTAL * 100 / TOTAL))
        echo "[$TIMESTAMP] $FILE_PATH — tokens:$TOKEN_REFS hardcoded:$HARDCODED_TOTAL drift:${DRIFT_PCT}%" >> "$DRIFT_LOG"

        if [ "$DRIFT_PCT" -gt 10 ]; then
            echo "⚠️  DRIFT WARNING: $FILE_PATH has ${DRIFT_PCT}% hardcoded values ($HARDCODED_TOTAL of $TOTAL visual references)"
            echo "   Replace hardcoded values with imports from src/theme/tokens.ts"
        fi
    fi
fi

# ─── Scope creep detection ───
if [ -f "$CHANGES_LOG" ]; then
    # Count unique files modified this session (last 50 entries)
    UNIQUE_FILES=$(tail -50 "$CHANGES_LOG" | grep "MODIFIED:" | awk '{print $NF}' | sort -u | wc -l)
    if [ "$UNIQUE_FILES" -gt 5 ]; then
        echo "⚠️  SCOPE CREEP: $UNIQUE_FILES files modified this session."
        echo "   Consider committing and starting a fresh scoped session."
        echo "   Research shows quality degrades sharply at >5 files per session."
    fi
fi

exit 0
