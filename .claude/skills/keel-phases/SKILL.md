# Keel Phase Gating — Section 4 State Machine

## Lifecycle: Onboarding → Phase 1 → 2 → 3 → 4 → 5

### Onboarding
- Link ≥1 account + ≥1 income deposit identified
- UI: account linking flow only

### Phase 1 — Observation (28 days)
- LOCKED: goals, budgets, alerts, automation
- VISIBLE: transaction feed, basic categorization, spending patterns
- Purpose: "We're learning your patterns"

### Phase 2 — Automation Setup
- Guard: 28 days transaction data
- UNLOCKED: auto-transfer setup
- LOCKED: goals, budget limits
- Transition: auto-transfer ARMED ≥7 consecutive days → Phase 3

### Phase 3 — Goal Anchoring
- UNLOCKED: goals (max 3), budget categories
- Guard: auto-transfer active (NNR-01: automation before restriction)
- Transition: ≥1 ACTIVE goal + 1 complete budget cycle → Phase 4

### Phase 4 — Active Monitoring
- UNLOCKED: full dashboard, all budget features, alerts
- Weekly reviews mandatory (NNR-05)
- IIN Gate: Phase 4 active ≥30 days + 6 months income history

### Phase 5 — Accountability (Month 6+)
- UNLOCKED: peer benchmarking (opt-in), group goals
- Guard: ≥180 days since Phase 2 activation

## Regression Rule
Users can regress in capability. Automation NEVER regresses.

## Component Checklist
Before rendering ANY feature:
1. What phase is the user in?
2. Is this feature unlocked for that phase?
3. If locked, show phase-appropriate explanation (not just hidden)
