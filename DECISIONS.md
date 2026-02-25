# Architecture Decision Records

> **Living Document** — Record every significant technical choice here.
> Captures *why* so we don't revisit settled decisions or suggest rejected approaches.

---

## How to Add an Entry

```markdown
### ADR-NNN: Short Title

**Date:** YYYY-MM-DD
**Status:** Accepted | Superseded | Deprecated
**Context:** What situation prompted this decision?
**Decision:** What did we decide?
**Alternatives Considered:** What else was evaluated?
**Consequences:** What are the trade-offs?
```

---

## Decisions

### ADR-001: Expo SDK 52 with Expo Router

**Date:** 2026-02-24
**Status:** Accepted
**Context:** Need cross-platform mobile app with file-based routing, managed build workflow, and Google Fonts support.
**Decision:** Expo SDK 52 with Expo Router 4.0 (file-based routing in `app/` directory). New Architecture enabled.
**Alternatives Considered:**
- Bare React Native + React Navigation — more control but manual build config, no managed workflow
- The reference project (budgeting-app) used bare RN — worked but required manual android/ management
**Consequences:**
- (+) `expo prebuild` generates native projects — no manual android/ios maintenance
- (+) File-based routing is simpler than manual navigator config
- (+) @expo-google-fonts packages for easy font loading
- (-) Expo config plugins required for native modules (Plaid SDK complication)
- (-) Generated build.gradle needs CI patching for release signing

### ADR-002: Express/TypeScript Backend (Replacing Flask)

**Date:** 2026-02-24
**Status:** Accepted (supersedes original Flask/Python backend)
**Context:** BUILD_CONTEXT.md specified Express/TypeScript backend. Original codebase had Flask/Python.
**Decision:** Greenfield Express/TypeScript backend with Firebase Admin, Plaid Node SDK, and modular route structure.
**Alternatives Considered:**
- Keep Flask backend — would work but mismatched with OpenSpec specification
- Migrate Flask incrementally — more risk of partial state
**Consequences:**
- (+) TypeScript end-to-end (frontend + backend)
- (+) Plaid Node SDK is well-maintained
- (+) Firebase Admin for auth + Firestore access
- (-) Lost existing Flask logic (reimplemented from spec)

### ADR-003: Cloud Firestore (Not PostgreSQL)

**Date:** 2026-02-24
**Status:** Accepted
**Context:** OpenSpec mentioned PostgreSQL but Firebase Auth was already chosen for authentication. Need a database.
**Decision:** Cloud Firestore — integrates natively with Firebase Auth, serverless scaling, no schema migrations.
**Alternatives Considered:**
- PostgreSQL — more query power, but requires separate hosting and connection management
- JSON files (dev) + SQL (prod) — what the reference project used, adds migration complexity
**Consequences:**
- (+) Zero infrastructure management
- (+) Native Firebase Auth integration (security rules use auth.uid)
- (+) Real-time listeners available for future features
- (-) No SQL queries — all filtering in application code
- (-) Firestore pricing based on reads/writes (need to be mindful)

### ADR-004: Zustand 5.0 for State Management

**Date:** 2026-02-24
**Status:** Accepted
**Context:** Need client-side state for transactions, budget, categories, sync status.
**Decision:** Zustand 5.0 — minimal boilerplate, TypeScript-first, no providers needed.
**Alternatives Considered:**
- Redux Toolkit — more ecosystem but heavyweight for this scope
- React Context — simpler but performance issues with frequent updates
- MobX — reactive but larger API surface
**Consequences:**
- (+) Single store file, no boilerplate
- (+) Works outside React components (useful for API interceptors)
- (-) Less structured than Redux for large teams

### ADR-005: Plaid SDK v12.8.0 with Postinstall ESM Patch

**Date:** 2026-02-25
**Status:** Accepted
**Context:** react-native-plaid-link-sdk v12.8.0 has broken ESM imports (bare `./PlaidLink` without `.js` extension) that fail under Node's strict ESM resolution during `expo prebuild`.
**Decision:** Keep v12.8.0 (latest) with a postinstall script (`scripts/fix-plaid-esm.js`) that patches bare imports to add `.js` extensions.
**Alternatives Considered:**
- Pin to v11.x — same ESM issue PLUS no Expo config plugin
- Fork the SDK — maintenance burden
- Exclude from Expo plugins — adopted (v12.8.0 has no config plugin anyway)
**Consequences:**
- (+) Latest SDK version with all features
- (+) Automated fix via npm postinstall
- (-) Fragile — patch may break on SDK updates
- (-) Extra build step

### ADR-006: Midnight Navy for Negative States (Not Red)

**Date:** 2026-02-24
**Status:** Accepted
**Context:** Bazley, Cronqvist & Mormann (2021, N=1,451) found red reduces risk-taking by 25%. Red on financial dashboards causes panic-driven poor decisions.
**Decision:** Use Midnight Navy (#2a3f52) for breach/negative states. Burnished Gold (#9A7B4F) for warnings. Red is banned from the UI.
**Consequences:**
- (+) Evidence-backed — avoids panic responses
- (+) Maintains urgency without triggering loss aversion
- (-) Unconventional — users expect red for warnings

### ADR-007: Savings Rate Delta as Single Success Metric

**Date:** 2026-02-24
**Status:** Accepted
**Context:** Need a primary metric that measures actual behavior change, not engagement.
**Decision:** Savings rate delta (post-system − baseline) is the single success metric. Engagement metrics explicitly rejected as OKRs.
**Consequences:**
- (+) Forces product decisions toward behavior change
- (+) Directly measurable, hard to game
- (-) Slow feedback loop (months, not days)

### ADR-008: AES-256-GCM for Plaid Token Encryption

**Date:** 2026-02-24
**Status:** Accepted
**Context:** Plaid access tokens must be stored securely. Tokens grant ongoing access to user bank accounts.
**Decision:** AES-256-GCM encryption at rest. Key derived from ENCRYPTION_KEY env var via SHA-256. Format: `iv:authTag:ciphertext` (hex).
**Alternatives Considered:**
- Store plaintext in Firestore with security rules only — insufficient for financial tokens
- Use Cloud KMS — adds latency and cost, overkill for this scale
**Consequences:**
- (+) Strong authenticated encryption
- (+) Simple implementation, no external dependencies
- (-) Key management responsibility on us (env var)
- (-) Dev fallback key for local development

### ADR-009: CI Signing via Ephemeral Keystore + Gradle Patching

**Date:** 2026-02-25
**Status:** Accepted
**Context:** Expo prebuild generates android/app/build.gradle with only debug signing. Need release signing for APK distribution.
**Decision:** CI generates ephemeral keystore, writes gradle.properties, and patches the Expo-generated build.gradle to add a release signing config.
**Alternatives Considered:**
- EAS Build — Expo's managed build service, but adds dependency and cost
- Pre-commit android/ directory — loses Expo prebuild benefits
- Store keystore as GitHub Secret — would work but ephemeral is simpler for dev builds
**Consequences:**
- (+) Fully automated in CI
- (+) No secrets stored in repo
- (-) Patch script is fragile — depends on Expo's build.gradle format
- (-) Ephemeral keystore means APKs aren't reproducibly signed

---

## Rejected Approaches

| Rejected Approach | Why | Date |
|-------------------|-----|------|
| Flask/Python backend | OpenSpec specifies Express/TypeScript | 2026-02-24 |
| Plaid SDK v11.x | No Expo config plugin + same ESM issues | 2026-02-25 |
| Red for negative UI states | Bazley et al.: triggers panic, reduces risk-taking 25% | 2026-02-24 |
| Pie/donut charts | Cleveland & McGill: angle comparison exceeds perceptual capacity | 2026-02-24 |
| Emoji for icons | Inconsistent cross-OS rendering | 2026-02-24 |
| Mock/fake data | Masks real integration issues, delays debugging | 2026-02-24 |
| Engagement metrics as OKRs | Proven not to correlate with behavior change (Irrational Labs) | 2026-02-24 |
| Float for amounts | Floating-point precision errors in financial calculations | 2026-02-24 |
