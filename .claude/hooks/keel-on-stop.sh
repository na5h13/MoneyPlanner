#!/bin/bash
# Keel Stop Hook — runs when Claude finishes a task
# Chains: Keel checks (typecheck, drift, checkpoint, handoff) + original on-stop.sh
# Enhanced with checkpoint tagging + HANDOFF.md generation

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" 2>/dev/null || exit 0

echo "--- Keel Stop Checks ---"

# 1. TypeScript check
if [ -f "tsconfig.json" ]; then
    echo "Running typecheck..."
    TSC_OUTPUT=$(npx tsc --noEmit 2>&1 | head -15)
    if [ $? -ne 0 ]; then
        echo "  TypeScript errors:"
        echo "$TSC_OUTPUT" | head -10 | sed 's/^/    /'
    else
        echo "  TypeScript clean"
    fi
fi

# 2. Show drift summary if log exists
DRIFT_LOG=".claude/logs/drift-report.log"
if [ -f "$DRIFT_LOG" ]; then
    HIGH_DRIFT=$(tail -20 "$DRIFT_LOG" | awk -F'drift:' '{print $2}' | grep -oP '[0-9]+' | sort -rn | head -1)
    if [ -n "$HIGH_DRIFT" ] && [ "$HIGH_DRIFT" -gt 10 ]; then
        echo "  Highest drift: ${HIGH_DRIFT}% — check $DRIFT_LOG"
    else
        echo "  Drift within tolerance"
    fi
fi

# 3. Session size report
CHANGES_LOG=".claude/logs/changes.log"
if [ -f "$CHANGES_LOG" ]; then
    EDIT_COUNT=$(wc -l < "$CHANGES_LOG" 2>/dev/null || echo 0)
    FILE_COUNT=$(awk '{print $NF}' "$CHANGES_LOG" 2>/dev/null | sort -u | wc -l)
    echo "  Session: $EDIT_COUNT edits across $FILE_COUNT file(s)"
    if [ "$EDIT_COUNT" -gt 20 ]; then
        echo "  WARNING: Heavy session ($EDIT_COUNT edits). Next task should start fresh."
    fi
fi

# 4. HANDOFF.md reminder
if [ -f "HANDOFF.md" ]; then
    echo "  HANDOFF.md exists — next session should read it first"
elif [ -f "$CHANGES_LOG" ]; then
    EDIT_COUNT=$(wc -l < "$CHANGES_LOG" 2>/dev/null || echo 0)
    if [ "$EDIT_COUNT" -gt 15 ]; then
        echo "  Consider writing HANDOFF.md if work remains"
    fi
fi

# 5. Checkpoint commit with tag (tracked files only — never stages secrets/temp)
if git rev-parse --git-dir > /dev/null 2>&1; then
    git add -u 2>/dev/null
    if ! git diff-index --quiet HEAD 2>/dev/null; then
        TIMESTAMP=$(date '+%Y-%m-%d-%H%M')
        COMMIT_MSG="checkpoint: ${TIMESTAMP}"

        # Count files for commit message
        FILE_COUNT=$(git diff --cached --name-only 2>/dev/null | wc -l)
        [ "$FILE_COUNT" -gt 0 ] && COMMIT_MSG="checkpoint: ${TIMESTAMP} (${FILE_COUNT} files)"

        git commit -m "$COMMIT_MSG" 2>/dev/null
        git tag "checkpoint-${TIMESTAMP}" -m "Auto-checkpoint by Keel stop hook" 2>/dev/null
        echo "  Checkpoint committed + tagged: checkpoint-${TIMESTAMP}"
    fi
fi

# 6. Clear session logs for next session
# (drift-report.log is kept for history, only changes.log is per-session)
if [ -f "$CHANGES_LOG" ]; then
    EDIT_COUNT=$(wc -l < "$CHANGES_LOG" 2>/dev/null || echo 0)
    if [ "$EDIT_COUNT" -gt 0 ]; then
        # Archive to drift log, then clear for next session
        echo "[$(date '+%Y-%m-%d %H:%M')] Session ended: $EDIT_COUNT edits" >> "$DRIFT_LOG"
        > "$CHANGES_LOG"
    fi
fi

# 7. Show active OpenSpec changes if present
if [ -d "openspec/changes" ]; then
    CHANGES=$(ls openspec/changes/ 2>/dev/null | grep -v archive | head -5)
    if [ -n "$CHANGES" ]; then
        echo "  Active OpenSpec changes: $CHANGES"
    fi
fi

# 8. Chain to original on-stop.sh if it exists (adb screenshot, etc.)
ORIGINAL_STOP=".claude/hooks/on-stop.sh"
if [ -f "$ORIGINAL_STOP" ] && [ "$ORIGINAL_STOP" != "$0" ]; then
    echo "--- Original Stop Hook ---"
    bash "$ORIGINAL_STOP" 2>/dev/null || true
fi

echo "-------------------------"
exit 0
