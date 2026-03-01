Run full Keel compliance verification.

## What This Does

1. Run `scripts/lint-tokens.sh` — scans all src/ for hardcoded values
2. Run `npx tsc --noEmit` — TypeScript type check
3. Show `.claude/logs/drift-report.log` — drift percentage per file
4. Show `.claude/logs/changes.log` — files modified this session
5. Report overall compliance status

## Usage
```
/keel-verify
```

## Expected Output
```
✅ Token lint: 0 violations
✅ TypeScript: clean
✅ Drift: all files <10%
📊 Files modified this session: 3
```

If any check fails, fix violations before committing.
