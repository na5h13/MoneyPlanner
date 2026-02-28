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

### ADR-010: Minimal Plaid linkTokenCreate (No OAuth Params by Default)

**Date:** 2026-02-26
**Status:** Accepted
**Context:** Adding `redirect_uri` to linkTokenCreate caused ALL bank linking to fail because the URI wasn't registered in Plaid Dashboard. TD/Wealthsimple (OAuth banks) need these params, but CIBC (non-OAuth) doesn't.
**Decision:** linkTokenCreate sends only minimal params by default (products, client_name, country_codes, language, user). OAuth params (redirect_uri, android_package_name) are conditionally added via PLAID_REDIRECT_URI and PLAID_ANDROID_PACKAGE_NAME env vars — only when registered in Plaid Dashboard.
**Alternatives Considered:**
- Always include OAuth params — breaks all banks if not Dashboard-registered
- Separate link token endpoints for OAuth vs non-OAuth — over-engineering
- Use Plaid institutions API to detect OAuth banks — adds complexity, still needs Dashboard registration
**Consequences:**
- (+) Non-OAuth banks (CIBC) always work
- (+) OAuth banks work when user registers values in Plaid Dashboard
- (-) TD/Wealthsimple won't work until Dashboard is configured (user action required)

### ADR-011: Evidence-Based Behavioral Architecture (from budgeting-app)

**Date:** 2026-02-26
**Status:** Accepted (informing future milestones M11+)
**Context:** Research from budgeting-app project demonstrates that traditional budgeting apps increase engagement but NOT spending reduction. The reference project implemented a 4-layer behavioral stack grounded in Tier 1 RCTs.
**Decision:** Future behavioral engine (M11+) should follow the 4-layer architecture: Automation → Goals → Monitoring → Accountability, with phase-gated feature unlocking.
**Consequences:**
- (+) Every feature maps to documented evidence tier
- (+) Automation as behavioral floor works even if user disengages
- (-) Complex state machine to implement
- (-) Users may be frustrated by locked features early on

### ADR-012: Firestore update() for Nested Dot-Notation Paths

**Date:** 2026-02-27
**Status:** Accepted
**Context:** Exchange endpoint stored Plaid access tokens in Firestore under `plaid_items.{item_id}`. Using `.set()` with computed dot-notation keys created literal flat field names instead of nested objects.
**Decision:** Always use `.update()` for dot-notation nested paths (it interprets dots as path separators). Use `.set({}, { merge: true })` first to ensure the document exists.
**Alternatives Considered:**
- Nested object structure with `.set({ merge: true })` — works but risky for deep merges (may overwrite siblings)
- Always use `.update()` — fails on missing docs, need the `.set()` guard
**Consequences:**
- (+) Dot-notation works correctly as nested paths
- (+) Guard `.set()` ensures doc exists for first-time users
- (-) Two Firestore calls instead of one (negligible perf impact)

### ADR-013: Shared ensureCategories() Service

**Date:** 2026-02-27
**Status:** Accepted
**Context:** Categories were only seeded on `GET /categories`. Budget and sync read categories directly, leading to empty categories and misassigned transactions.
**Decision:** Extract `ensureCategories()` as a shared service. Call from all endpoints that read categories: categories route, budget route, sync service.
**Consequences:**
- (+) Categories always exist before being read
- (+) Single source of truth for default category definitions
- (+) Re-categorizes orphaned transactions on sync
- (-) Extra Firestore read on every call (mitigated by early-return if categories exist)

### ADR-014: Standalone Vite+React Web App (Not Expo Web)

**Date:** 2026-02-27
**Status:** Accepted
**Context:** Need a web version of the budget tracker. Mobile app uses RN-only deps: expo-blur, react-native-plaid-link-sdk, @react-native-firebase/auth, react-native-svg. These either don't work on web or require complex polyfills via Expo Web.
**Decision:** Create a standalone `web/` directory with Vite 6 + React 19 + TypeScript. Pure CSS glassmorphism, Firebase JS SDK, standard HTML/SVG. Share types, store patterns, and design tokens with mobile — not code directly.
**Alternatives Considered:**
- Expo Web (`expo start --web`) — would need polyfills for expo-blur (heavy), Plaid SDK (impossible), RN Firebase (different API). More fights than solutions.
- Next.js — SSR unnecessary for a dashboard SPA, adds server complexity
- Remix — same SSR overhead, backend already exists as Express
**Consequences:**
- (+) Zero compatibility fights with RN-native packages
- (+) Pure CSS glassmorphism is smaller and faster than expo-blur
- (+) Firebase JS SDK is the canonical web SDK — no polyfill needed
- (+) Vite dev server is instant (<1s hot reload)
- (-) Code duplication for types, store patterns, format utilities (mitigated by copying, not sharing via monorepo)
- (-) Two separate `npm install` roots (mobile + web)

### ADR-015: Desktop Sidebar Layout with Mobile Responsive Breakpoint

**Date:** 2026-02-27
**Status:** Accepted
**Context:** Initial web layout used a 430px phone column with bottom tab bar — direct copy of mobile mockups. User feedback: "designed for mobile not desktop, bad design."
**Decision:** Desktop-first layout with 220px fixed sidebar navigation. Content area has `max-width: 800px` with 32px padding. At <768px viewport, sidebar hides and a mobile bottom nav appears (same as phone layout). CSS media query handles the switch — no JavaScript.
**Alternatives Considered:**
- Phone-width column centered on desktop — wastes 80% of screen space
- Top horizontal navbar — loses vertical space, doesn't match the brand aesthetic
- Collapsible sidebar — over-engineering for 3 navigation items
**Consequences:**
- (+) Full desktop utilization — content stretches appropriately
- (+) Sidebar always visible on desktop — no hamburger menu needed
- (+) Mobile users still get the familiar bottom tab bar
- (-) CSS is more complex (two layout modes)

### ADR-016: Lazy Firebase Initialization for Web

**Date:** 2026-02-27
**Status:** Accepted
**Context:** Firebase `initializeApp()` was called at module import time in `auth.ts`. When any VITE_FIREBASE_* env var was missing, it threw synchronously before React rendered → blank white screen with no error feedback.
**Decision:** Firebase is initialized lazily via `getFirebaseAuth()` function — only runs when auth is actually needed. App.tsx in DEV_MODE never calls auth functions, so Firebase never initializes (no crash). In production, first auth attempt triggers init.
**Alternatives Considered:**
- Try/catch around module-level `initializeApp()` — still runs before React, error can't be shown in UI
- Check env vars in index.html before loading app — fragile, can't use React error boundaries
- Always require valid Firebase config — breaks local development without Firebase
**Consequences:**
- (+) DEV_MODE works without any Firebase config
- (+) Missing config shows a proper error in the UI (after React mounts)
- (+) No blank screen crash
- (-) First auth call has slight delay (one-time init)

### ADR-017: Error State Surfacing on All Pages

**Date:** 2026-02-27
**Status:** Accepted
**Context:** Initial implementation caught all API errors silently (console.log). All 3 screens showed empty states identically whether data was loading, genuinely empty, or failing. User saw "No transactions" and had no way to know the API was returning 401.
**Decision:** Zustand store has explicit error states per slice: `budgetError`, `transactionsError`, `categoriesError`, `accountsError`, `connectionError`. Every page renders `ErrorBanner` (amber, with retry button) when its error state is set. Sidebar shows a connection status dot (green/amber/spinning).
**Alternatives Considered:**
- Global error toast — loses context of which page/section failed
- Console-only logging — invisible to users, already proven insufficient
- Error boundary for crashes — doesn't catch fetch failures (they're caught in store)
**Consequences:**
- (+) Users always know when something is wrong
- (+) Retry is one click — no page refresh needed
- (+) Connection dot gives ambient API health feedback
- (-) More state to manage in the store

### ADR-018: Firebase Web App Config Separate from Android

**Date:** 2026-02-27
**Status:** Accepted
**Context:** Firebase project has multiple registered apps (Android + Web). Each has a different API key and app ID. `google-services.json` has the Android key. The web app needs the web-specific config from Firebase Console.
**Decision:** Web config is stored in `web/.env` with `VITE_*` prefix. Values come from Firebase Console → Project Settings → Web App (NOT from google-services.json). The `.env.example` documents all required vars. Root `.env` contains the same values under `EXPO_PUBLIC_FIREBASE_*` prefix.
**Config mapping:**
| Value | Android source | Web source |
|-------|---------------|------------|
| API Key | `google-services.json` → `api_key.current_key` | Firebase Console → Web App config |
| App ID | `google-services.json` → `mobilesdk_app_id` | Firebase Console → Web App config |
| Auth Domain | N/A (handled by RN Firebase) | `{project-id}.firebaseapp.com` |
**Consequences:**
- (+) Clear separation between platform configs
- (+) .env.example prevents guessing which values to use
- (-) Must register web app in Firebase Console before web auth works

### ADR-019: Express Serves Web SPA (Single Railway Deploy)

**Date:** 2026-02-27
**Status:** Accepted (supersedes separate web hosting approach)
**Context:** Web app changes were never deployed because the SPA had no hosting pipeline. Railway only deployed the Express backend. User reported "changes not taking effect" after pushing.
**Decision:** Express backend serves the Vite-built SPA: `express.static(web/dist)` for assets, SPA fallback (`res.sendFile('index.html')`) for React Router client-side routes. `railway.json` builds both backend + web in sequence. Deploy workflow triggers on `backend/**` OR `web/**` changes.
**Alternatives Considered:**
- Separate Netlify/Vercel deployment for web — adds second deploy target, CORS complexity, separate domain
- Serve from S3/CloudFront — over-engineering for a dashboard app
- Keep web as local-only dev — user explicitly wants deployed web
**Consequences:**
- (+) One push → one deploy → both API and SPA go live
- (+) Same-origin API calls — no CORS issues in production
- (+) Simple — no additional hosting service to manage
- (-) Slightly larger Railway build (web npm install + vite build adds ~30s)
- (-) Helmet CSP disabled (Vite uses inline scripts) — acceptable for internal tool

### ADR-020: Firebase Web Config Hardcoded as Fallback

**Date:** 2026-02-27
**Status:** Accepted
**Context:** `web/.env` is gitignored (correctly). Railway builds don't have the Firebase config env vars unless manually set in Railway dashboard. Without Firebase config, the web app can't authenticate.
**Decision:** Public Firebase web client config is hardcoded in `web/src/firebase-config.ts`. `auth.ts` uses env vars as override, falls back to hardcoded values. Firebase web API keys are PUBLIC by design — they're in every page load. Security is enforced by Firebase Security Rules.
**Alternatives Considered:**
- Set VITE_FIREBASE_* in Railway env vars — requires manual dashboard config per deploy
- Backend `/config` endpoint — adds network round-trip before app init
- Commit web/.env — gitignore exists for good reason (other env files have actual secrets)
**Consequences:**
- (+) Zero-config Railway deploy — no env vars needed for Firebase auth
- (+) Env vars still override for local dev flexibility
- (-) Config changes require code change + redeploy (rare — Firebase project doesn't change)

### ADR-021: 19 Hierarchical Categories with Group Field + Migration

**Date:** 2026-02-27
**Status:** Accepted (supersedes flat 6-category system)
**Context:** Original system had 6 broad categories (Income, Home & Personal, Food & Transportation, Family, Entertainment & Other, Uncategorized). Too coarse for meaningful budget tracking. Web budget screen needed hierarchical drill-down.
**Decision:** 19 granular categories organized into 7 groups: Income, Essentials (4), Daily Living (5), Family & Home (2), Leisure (3), Financial (3), Uncategorized. `group` field added as `CategoryGroup` union type. `ensureCategories()` both seeds new users AND migrates existing users' categories missing `group` field. Web Budget screen renders: Group → Category → Line Items waterfall.
**Alternatives Considered:**
- Keep 6 broad categories — too coarse, can't distinguish Groceries from Insurance
- Let users create their own hierarchy — over-engineering, most users want defaults
- Store groups as separate Firestore collection — adds complexity, group is a category attribute
**Consequences:**
- (+) Budget drill-down UI: 5 collapsible groups → categories → line items
- (+) Auto-migration ensures existing Firestore data gets the new field
- (+) Legacy category names mapped to reasonable groups
- (-) Migration runs on every `ensureCategories()` call until all categories are migrated (one-time cost)

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
| Expo Web for web SPA | RN-only deps (expo-blur, Plaid SDK, RN Firebase) need polyfills or don't work | 2026-02-27 |
| Module-level Firebase init (web) | Crashes before React renders if env vars missing → blank screen | 2026-02-27 |
| Phone-width column for web layout | Wastes 80% of desktop screen, bad UX, user explicitly rejected | 2026-02-27 |
| Silent API error handling | Users can't distinguish empty data from broken API → appears broken | 2026-02-27 |
| Android Firebase API key for web | Different key per platform — web key from Firebase Console, not google-services.json | 2026-02-27 |
| Separate web hosting (Netlify/Vercel) | Adds second deploy target, CORS complexity. Express serves SPA instead | 2026-02-27 |
| Firebase config via Railway env vars only | Requires manual dashboard config. Hardcoded fallback is simpler | 2026-02-27 |
| Flat 6-category system | Too coarse for meaningful budgeting. 19 categories in 7 groups provides drill-down | 2026-02-27 |
