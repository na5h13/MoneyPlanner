Start a Keel feature using spec-driven development.

## Usage
```
/keel-start <feature-description>
```

## What This Does

1. **Check for HANDOFF.md** — if it exists, read it first (previous session state)
2. **Identify the OpenSpec section(s)** relevant to this feature
3. **Read the section(s)** from `specs/OpenSpec_v1_0_Unified.md`
4. **Read the design rules** from `.claude/rules/01-design-system.md`
5. **Check DECISIONS.md** for relevant ADRs
6. **Check LESSONS_LEARNED.md** for known gotchas
7. **Scope the work** to fit within ONE session (50% context max)
8. **Create a plan** in Plan Mode (no code yet)
9. **Present the plan** and STOP for approval

## Protocol

```
PHASE 0: Context Loading
    [ ] If HANDOFF.md exists, read it (previous session's state)
    [ ] Read CLAUDE.md (quote proof rule)
    [ ] Read relevant OpenSpec section(s)
    [ ] Read .claude/rules/01-design-system.md
    [ ] Check DECISIONS.md for relevant ADRs
    [ ] Check LESSONS_LEARNED.md for gotchas

PHASE 1: Plan + Scope (NO CODE)
    [ ] Identify affected files
    [ ] List components to create/modify
    [ ] Verify phase gating requirements
    [ ] Check token usage plan
    [ ] Note any design system constraints
    [ ] SCOPE CHECK: If >3 components or >5 files, split into multiple tasks
        - Task 1 fits this session (50% context budget)
        - Remaining tasks go in HANDOFF.md for next session

    STOP — Present plan, wait for "approved"

PHASE 2: AUTONOMOUS Implementation (after "approved")
    IMPORTANT: After approval, execute ALL steps without stopping.
    Do NOT pause for confirmation between components.
    Do NOT ask "should I continue?" — just implement the full plan.

    [ ] One component at a time, in the planned order
    [ ] Import ALL visual values from tokens.ts
    [ ] Verify phase gating in each component
    [ ] formatAmount(cents) for financial display
    [ ] Test after each component

PHASE 3: Verify + Handoff
    [ ] npx tsc --noEmit
    [ ] Run scripts/lint-tokens.sh
    [ ] Check .claude/logs/drift-report.log
    [ ] If more tasks remain: write HANDOFF.md with remaining work
    [ ] If complete: delete HANDOFF.md if it exists
    [ ] Commit: feat(section-N): description
```

## HANDOFF.md Template (when splitting tasks)

```markdown
# HANDOFF — <feature name>

## Completed This Session
- [x] Component A — implemented + tested
- [x] Component B — implemented + tested

## Next Session Must Do
- [ ] Component C — <brief description>
- [ ] Component D — <brief description>

## Context
- OpenSpec section: <N>
- Design constraints: <any gotchas discovered>
- Files modified so far: <list>
- Tests passing: yes/no

## Key Decisions Made
- <any implementation choices that next session needs to know>
```

## DO NOT
- Write code before plan approval
- Hardcode any visual values
- Skip the OpenSpec section read
- Modify tokens.ts or lint configs
- Add features not in the plan
- Stop between steps after approval — execute autonomously
- Cram more than 3 components into one session
