#!/bin/bash
# Keel Checkpoint Manager — adapted from Ruflo v3.5
# Provides checkpoint listing, rollback, and diff since checkpoint
# Usage: bash .claude/helpers/checkpoint-manager.sh <command> [options]

set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" 2>/dev/null || exit 1

CHECKPOINT_DIR=".claude/checkpoints"

show_help() {
    cat << 'EOF'
Keel Checkpoint Manager
=======================

Usage: checkpoint-manager.sh <command> [options]

Commands:
  list              List all checkpoints (tags + branches)
  show <id>         Show checkpoint details
  rollback <id>     Rollback to checkpoint (creates backup first)
  diff <id>         Show changes since checkpoint
  clean [days]      Remove checkpoints older than N days (default: 7)

Options for rollback:
  --soft            git reset --soft (default — keeps changes staged)
  --branch          Create new branch from checkpoint (safest)

Examples:
  checkpoint-manager.sh list
  checkpoint-manager.sh show checkpoint-2026-02-28-1430
  checkpoint-manager.sh rollback checkpoint-2026-02-28-1430 --branch
  checkpoint-manager.sh diff checkpoint-2026-02-28-1430
  checkpoint-manager.sh clean 14
EOF
}

list_checkpoints() {
    echo "Checkpoints:"
    echo ""

    # Git tags
    TAGS=$(git tag -l 'checkpoint-*' --sort=-creatordate 2>/dev/null | head -20)
    if [ -n "$TAGS" ]; then
        echo "  Tags:"
        echo "$TAGS" | while read tag; do
            DATE=$(git log -1 --format='%ai' "$tag" 2>/dev/null | cut -d' ' -f1,2)
            MSG=$(git log -1 --format='%s' "$tag" 2>/dev/null)
            echo "    $tag  ($DATE)  $MSG"
        done
    else
        echo "  Tags: none"
    fi

    echo ""

    # Checkpoint branches
    BRANCHES=$(git branch -a 2>/dev/null | grep "checkpoint/" | sed 's/^[ *]*//')
    if [ -n "$BRANCHES" ]; then
        echo "  Branches:"
        echo "$BRANCHES" | sed 's/^/    /'
    else
        echo "  Branches: none"
    fi

    echo ""

    # JSON checkpoint files
    if [ -d "$CHECKPOINT_DIR" ]; then
        FILES=$(find "$CHECKPOINT_DIR" -name "*.json" -type f 2>/dev/null | sort -r | head -10)
        if [ -n "$FILES" ]; then
            echo "  Files:"
            echo "$FILES" | while read f; do echo "    $(basename "$f")"; done
        fi
    fi
}

show_checkpoint() {
    local id="$1"
    [ -z "$id" ] && echo "Error: specify checkpoint ID" && exit 1

    echo "Checkpoint: $id"
    echo ""

    if git tag -l "$id" | grep -q "$id" 2>/dev/null; then
        echo "  Type:    Git Tag"
        echo "  Commit:  $(git rev-list -n 1 "$id" 2>/dev/null)"
        echo "  Date:    $(git log -1 --format='%ai' "$id" 2>/dev/null)"
        echo "  Message: $(git log -1 --format='%s' "$id" 2>/dev/null)"
        echo ""
        echo "  Files changed:"
        git diff-tree --no-commit-id --name-status -r "$id" 2>/dev/null | sed 's/^/    /'
    elif git branch -a 2>/dev/null | grep -q "$id"; then
        echo "  Type:    Git Branch"
        echo "  Latest:  $(git log -1 --oneline "$id" 2>/dev/null)"
    else
        echo "  Not found: $id"
        exit 1
    fi
}

rollback_checkpoint() {
    local id="$1"
    local mode="${2:---soft}"

    [ -z "$id" ] && echo "Error: specify checkpoint ID" && exit 1

    # Verify checkpoint exists
    if ! git tag -l "$id" 2>/dev/null | grep -q "$id" && \
       ! git branch -a 2>/dev/null | grep -q "$id"; then
        echo "  Not found: $id"
        exit 1
    fi

    # Always create a backup tag first
    BACKUP="backup-$(date +%Y%m%d-%H%M%S)"
    git tag "$BACKUP" -m "Backup before rollback to $id" 2>/dev/null
    echo "  Backup created: $BACKUP"

    case "$mode" in
        --branch)
            BRANCH="rollback-$(date +%Y%m%d-%H%M%S)"
            git checkout -b "$BRANCH" "$id" 2>/dev/null
            echo "  Created branch: $BRANCH from $id"
            ;;
        --soft|*)
            git stash push -m "Stash before rollback to $id" 2>/dev/null
            git reset --soft "$id" 2>/dev/null
            echo "  Soft reset to $id"
            echo "  Changes stashed. Use 'git stash pop' to restore."
            ;;
    esac
}

diff_checkpoint() {
    local id="$1"
    [ -z "$id" ] && echo "Error: specify checkpoint ID" && exit 1

    if git tag -l "$id" 2>/dev/null | grep -q "$id" || \
       git branch -a 2>/dev/null | grep -q "$id"; then
        echo "Changes since $id:"
        echo ""
        git diff --stat "$id" 2>/dev/null
    else
        echo "  Not found: $id"
        exit 1
    fi
}

clean_checkpoints() {
    local days=${1:-7}
    echo "Cleaning checkpoints older than $days days..."

    if [ -d "$CHECKPOINT_DIR" ]; then
        FOUND=$(find "$CHECKPOINT_DIR" -name "*.json" -type f -mtime +"$days" 2>/dev/null | wc -l)
        find "$CHECKPOINT_DIR" -name "*.json" -type f -mtime +"$days" -delete 2>/dev/null
        echo "  Removed $FOUND checkpoint file(s)"
    fi

    echo ""
    echo "  Old tags (remove manually with git tag -d):"
    git tag -l 'checkpoint-*' --sort=-creatordate 2>/dev/null | tail -n +20 | head -10 || echo "    none"
}

case "${1:-help}" in
    list)       list_checkpoints ;;
    show)       show_checkpoint "$2" ;;
    rollback)   rollback_checkpoint "$2" "$3" ;;
    diff)       diff_checkpoint "$2" ;;
    clean)      clean_checkpoints "$2" ;;
    help|--help|-h) show_help ;;
    *)          echo "Unknown: $1"; show_help; exit 1 ;;
esac
