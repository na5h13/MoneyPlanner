# Lessons Learned

> **Living Document** — Add entries after every non-trivial fix, debugging session, or discovery.
> Format: What happened, why, and what to do next time.
> Goal: Never hit the same issue twice.

---

## How to Add an Entry

```markdown
### YYYY-MM-DD — Short Title

**Context:** What were you trying to do?
**Problem:** What went wrong?
**Root Cause:** Why did it happen?
**Solution:** What fixed it?
**Rule:** One-line takeaway for future reference.
```

---

## Entries

### 2026-02-24 — MoneyPlanner-built Worktree Pollutes TypeScript

**Context:** Running `tsc --noEmit` after scaffolding the new codebase.
**Problem:** TypeScript errors from files in `MoneyPlanner-built/MoneyPlanner-main/` — an old git worktree.
**Root Cause:** tsconfig.json's default `include` glob (`**/*.ts`) picks up `.ts` files in all subdirectories, including worktrees.
**Solution:** Added `"exclude": ["node_modules", "MoneyPlanner-built", "backend", "original openspec"]` to tsconfig.json.
**Rule:** Always exclude worktree directories, backend, and non-app directories from frontend tsconfig.

### 2026-02-24 — Duplicate Properties from Spread Operator

**Context:** Creating the tab bar layout with `...shadows.navBar` spread plus explicit `elevation: 0`.
**Problem:** TypeScript/lint error for duplicate `elevation` property — the spread already included `elevation`.
**Root Cause:** Spread operator properties collide with explicitly set properties.
**Solution:** Move spread before explicit properties so explicit values override, or remove the duplicate.
**Rule:** When spreading style objects, check what properties they contain before adding explicit overrides.

### 2026-02-24 — Express v5 req.params.id Returns string | string[]

**Context:** Writing Express route handlers that use `req.params.id` with Firestore `.doc()`.
**Problem:** TypeScript error — Firestore `.doc()` requires `string` but Express v5 types define `req.params.id` as `string | string[]`.
**Root Cause:** Express v5 changed param types to be more permissive (supports array params).
**Solution:** Cast with `as string` on all `req.params.id` usages (13 fixes across 4 route files).
**Rule:** Express v5 params need `as string` cast for single-value usage. Check this when creating new routes.

### 2026-02-25 — Plaid SDK ESM Imports Missing .js Extensions

**Context:** Running `npx expo prebuild` — fails on Plaid SDK.
**Problem:** `ERR_MODULE_NOT_FOUND: Cannot find module '.../dist/PlaidLink'` — bare imports without `.js` extension.
**Root Cause:** react-native-plaid-link-sdk ships ESM in `dist/` with bare relative imports (`from './PlaidLink'`) that Node's strict ESM resolver rejects.
**Solution:** Created `scripts/fix-plaid-esm.js` postinstall script that walks `dist/` and patches all bare imports to add `.js` extensions. Patches 22 imports.
**Rule:** If an RN library ships ESM with bare imports, add a postinstall patch script. Check this on every Plaid SDK version bump.

### 2026-02-25 — Plaid SDK v12.8.0 Has No Expo Config Plugin

**Context:** app.json listed `react-native-plaid-link-sdk` in Expo plugins array with android config.
**Problem:** `PluginError: Package does not contain a valid config plugin` during `expo prebuild`.
**Root Cause:** v12.8.0 doesn't ship an `app.plugin.js` or plugin entry. Autolinking handles native module registration.
**Solution:** Removed `react-native-plaid-link-sdk` from the plugins array in app.json.
**Rule:** Before adding an RN library to Expo plugins, verify it actually ships a config plugin (`app.plugin.js` or `plugin` field in package.json).

### 2026-02-25 — Placeholder PNG Assets Must Be Valid

**Context:** Running `expo prebuild --platform android`.
**Problem:** `Crc error` in jimp during image processing.
**Root Cause:** Asset PNGs (icon.png, adaptive-icon.png, etc.) were 70-byte stub files, not valid PNG images.
**Solution:** Generated valid solid-color PNGs using ImageMagick (`convert -size 1024x1024 xc:'#f5f2ee' assets/icon.png`).
**Rule:** Always use valid PNG files for Expo assets, even as placeholders. Use ImageMagick to generate solid-color placeholders.

### 2026-02-25 — Expo Prebuild Generates signingConfigs with Debug Only

**Context:** CI workflow patches build.gradle to add release signing config.
**Problem:** `Could not get unknown property 'release' for SigningConfig container` — Gradle build fails.
**Root Cause:** The Python patch checked `if 'signingConfigs' not in content` — but Expo prebuild ALREADY generates a `signingConfigs` block (with `debug` only). So the patch skipped inserting the release config, then tried to reference `signingConfigs.release` which didn't exist.
**Solution:** Rewrote the patch to insert a `release` block INSIDE the existing `signingConfigs` (after the debug block) and update the release buildType reference from `signingConfigs.debug` to `signingConfigs.release`.
**Rule:** When patching Expo-generated build.gradle, always inspect the actual generated output first. Don't assume the structure — `expo prebuild` generates its own signing config.

### 2026-02-25 — google-services.json Mangled by Shell echo

**Context:** CI writes google-services.json from a GitHub Secret.
**Problem:** `Malformed root json at .../google-services.json` during Gradle build.
**Root Cause:** `echo '${{ secrets.GOOGLE_SERVICES_JSON }}'` in the workflow — single quotes can break if the JSON contains single quotes, and shell interpolation can mangle the content.
**Solution:** Use `printenv` to write the secret: set it as an env var, then `printenv GOOGLE_SERVICES_JSON > google-services.json`.
**Rule:** Never use `echo '...'` to write JSON secrets in CI. Use `printenv` with an environment variable to avoid shell quoting issues.

### 2026-02-25 — google-services.json Placeholder Missing `configuration_version`

**Context:** CI builds when `GOOGLE_SERVICES_JSON` secret is not set fall back to a Python-generated placeholder.
**Problem:** `Malformed root json at .../android/app/google-services.json` — Gradle build fails even though `python3 json.load()` validates it as valid JSON.
**Root Cause:** The `com.google.gms:google-services` Gradle plugin requires `"configuration_version": "1"` as a root-level field. Python's `json.load()` doesn't check for required domain fields — only syntax. The placeholder omitted `configuration_version` entirely.
**Solution:** Added `"configuration_version": "1"` (and `oauth_client`/`services` for completeness) to the placeholder. Also hardened the CI validation step to assert `configuration_version == "1"` before continuing.
**Rule:** After writing google-services.json in CI, validate domain requirements (configuration_version, project_info, client), not just JSON syntax.

### 2026-02-25 — Heredoc Indentation Adds Leading Whitespace to .env

**Context:** CI writes .env file using an indented heredoc in YAML.
**Problem:** .env values had leading spaces (e.g., `          EXPO_PUBLIC_DEV_MODE=true`).
**Root Cause:** YAML indentation is preserved in heredoc content. `<<-` only strips tabs, not spaces.
**Solution:** Use individual `echo` statements instead of heredoc for .env values.
**Rule:** In GitHub Actions YAML, don't use heredocs for config files — indentation leaks into content. Use individual echo/printf statements.

### 2026-02-26 — Railway Deployed Python Start Command for Node Backend

**Context:** Backend was rewritten from Flask/Python to Express/TypeScript.
**Problem:** All API requests returned 404. Railway logs showed backend failing to start.
**Root Cause:** `railway.json` still had `gunicorn` start command from the old Python backend.
**Solution:** Changed railway.json start command to `cd backend && npm run start`.
**Rule:** When migrating backend languages, update ALL deployment configs (railway.json, Dockerfile, Procfile). Check the start command FIRST when debugging 404s.

### 2026-02-26 — Unregistered Plaid redirect_uri Kills ALL Bank Linking

**Context:** Adding OAuth support for TD and Wealthsimple banks.
**Problem:** Adding `redirect_uri: 'keel://plaid-oauth'` to linkTokenCreate caused ALL banks (including non-OAuth CIBC) to fail with INVALID_INPUT.
**Root Cause:** Any `redirect_uri` passed to Plaid must be pre-registered in the Plaid Dashboard. Unregistered URIs cause immediate API rejection — even for non-OAuth banks.
**Solution:** Stripped linkTokenCreate to minimal params (products, client_name, country_codes, language, user). Made redirect_uri and android_package_name conditionally added via env vars, only when registered in Plaid Dashboard.
**Rule:** NEVER hardcode Plaid redirect_uri or android_package_name. Use env vars so they're only sent when registered in Dashboard. Both reference projects use minimal linkTokenCreate with no OAuth params.

### 2026-02-26 — Plaid SDK metadata.institution.id vs institution_id

**Context:** Storing institution info from Plaid Link's onSuccess metadata.
**Problem:** Backend stored empty institution_id because it looked for `metadata.institution.institution_id`.
**Root Cause:** react-native-plaid-link-sdk returns `institution.id`, not `institution.institution_id`.
**Solution:** Check both: `metadata?.institution?.id || metadata?.institution?.institution_id || ''`.
**Rule:** Check the ACTUAL SDK object shape, not assumed naming. Plaid's web vs mobile SDKs may differ.

### 2026-02-26 — Duplicate .env Entries Use Last Value Only

**Context:** .env file had two `EXPO_PUBLIC_API_BASE_URL` entries (localhost and Railway URL).
**Problem:** App connected to the wrong backend depending on which value was used.
**Root Cause:** Copy-paste during development left duplicate entries. Expo's env loading picks the first or last depending on the loader.
**Solution:** Deduplicate .env entries. Use a single source of truth.
**Rule:** Before debugging API connection issues, check .env for duplicate keys. Use `grep` to find duplicates.

### 2026-02-26 — OAuth Banks (TD, Wealthsimple) Need Plaid Dashboard Registration

**Context:** TD and Wealthsimple fail immediately when selected in Plaid Link.
**Problem:** These OAuth banks redirect users to the bank's website, then back to the app. Without registered redirect_uri + android_package_name, the redirect fails.
**Root Cause:** OAuth institutions require: (1) redirect_uri registered in Plaid Dashboard, (2) android_package_name registered in Dashboard, (3) both values passed in linkTokenCreate.
**Solution:** Code supports conditional OAuth via PLAID_REDIRECT_URI and PLAID_ANDROID_PACKAGE_NAME env vars. User must register values in Plaid Dashboard before setting env vars.
**Rule:** OAuth banks are a Dashboard configuration issue, not just a code issue. Non-OAuth banks (CIBC) work without any OAuth config.

### 2026-02-26 — aarch64 Machines Cannot Build Android APKs Locally

**Context:** Attempting `./gradlew assembleDebug` on Ubuntu aarch64.
**Problem:** AAPT2 daemon failed: "Exec format error" — the binary is x86-64.
**Root Cause:** Android SDK tools (AAPT2) only ship x86-64 binaries. aarch64 hosts cannot execute them.
**Solution:** Use GitHub Actions CI for all Android builds. Never attempt local builds on aarch64.
**Rule:** If `uname -m` returns aarch64, don't try local Android builds. Use CI exclusively.

### 2026-02-27 — Firestore set() with Dot-Notation Creates Flat Keys

**Context:** Exchange endpoint stored Plaid items using `.set({ [`plaid_items.${itemId}`]: {...} }, { merge: true })`.
**Problem:** Accounts endpoint found zero plaid_items. Data existed but as a flat key `"plaid_items.KkMx0bad..."` not a nested `plaid_items` object.
**Root Cause:** Firestore `.set()` treats JavaScript computed property keys as **literal field names**. Only `.update()` interprets dot-notation as nested field paths.
**Solution:** Changed to `.update()` (which interprets dots as paths). Use `.set({}, { merge: true })` first to ensure doc exists.
**Rule:** NEVER use `.set()` with dot-notation computed keys for nested fields. Use `.update()` or nested object structure.

### 2026-02-27 — Firestore Named Database Needs Modular Import

**Context:** Added `FIRESTORE_DATABASE_ID` env var support for named Firestore databases.
**Problem:** `admin.app().firestore(dbName)` — TypeScript error, `firestore()` accepts 0 arguments.
**Root Cause:** Firebase Admin v12 requires the modular import `getFirestore(app, databaseId)` from `firebase-admin/firestore` for named databases.
**Solution:** `import { getFirestore as getFirestoreDb } from 'firebase-admin/firestore'` and call `getFirestoreDb(admin.app(), dbName)`.
**Rule:** For named Firestore databases in firebase-admin v12+, use the modular `getFirestore()` import, not the namespaced `admin.app().firestore()`.

### 2026-02-27 — Firestore Composite Index Required for Multi-Field Queries

**Context:** Transaction sync calls categorization which queries `where('display_merchant') + where('categorized_by') + orderBy('categorized_at')`.
**Problem:** Sync failed with `9 FAILED_PRECONDITION: The query requires an index`.
**Root Cause:** Firestore requires composite indexes for queries with multiple where/orderBy on different fields.
**Solution:** Wrapped the historical categorization query in try/catch — falls through to lower priority levels gracefully. User should also create the index via Firebase Console link.
**Rule:** Any Firestore query with multiple where + orderBy needs a composite index. Always wrap in try/catch with graceful fallback.

### 2026-02-27 — Categories Must Be Seeded Before Sync and Budget

**Context:** Budget screen showed zero despite 133 synced transactions.
**Problem:** Budget endpoint reads categories → finds none → returns empty display. Sync categorized all transactions with fallback `'uncategorized'` string instead of real category IDs.
**Root Cause:** Only `GET /categories` called `ensureCategories()`. Budget and sync endpoints read categories directly without seeding.
**Solution:** Extracted `ensureCategories()` as shared service. Called from categories route, budget route, and sync service. Added orphan repair to re-categorize transactions with literal `'uncategorized'` string.
**Rule:** Any endpoint that reads categories must call `ensureCategories()` first. Extract shared initialization logic as reusable services.

### 2026-02-27 — Firebase JS Init at Module Load Causes Blank Screen on Web

**Context:** Building web SPA with Firebase JS Auth. `initializeApp()` called at top of `auth.ts` module.
**Problem:** App rendered a completely blank white screen with no errors in the UI.
**Root Cause:** Firebase `initializeApp()` executes at module import time. If any VITE_FIREBASE_* env vars are missing or empty, Firebase throws synchronously — BEFORE React even mounts. No error boundary can catch it because React hasn't rendered yet.
**Solution:** Lazy initialization pattern — wrap Firebase init in a `getFirebaseAuth()` function that only initializes on first call. App.tsx checks DEV_MODE and only calls auth functions when needed.
```typescript
let auth: Auth | null = null;
function getFirebaseAuth(): Auth {
  if (auth) return auth;
  const config = { apiKey: import.meta.env.VITE_FIREBASE_API_KEY, ... };
  if (!config.apiKey) throw new Error('Firebase config missing');
  app = initializeApp(config);
  auth = getAuth(app);
  return auth;
}
```
**Rule:** NEVER call `initializeApp()` at module scope in web apps. Always use lazy init behind a function. Check env vars before calling.

### 2026-02-27 — Firebase Web vs Android API Keys Are Different

**Context:** Setting up Firebase auth for the web SPA. Used the API key from `google-services.json`.
**Problem:** Firebase auth calls failed silently. Google Sign-In didn't work.
**Root Cause:** `google-services.json` contains the **Android** API key (`AIzaSyC8bJ9MLwaSD0pSjvprnX4z65z_Y9idmPU`). The **web** app needs a different API key (`AIzaSyDxBuR6u9BB77C2fWHADBA6KC7CtvPoMIg`) from Firebase Console → Project Settings → Web App. Each platform (iOS, Android, Web) has its own registered app with its own API key and app ID.
**Solution:** Found the correct web config in the root `.env` file under `EXPO_PUBLIC_FIREBASE_*` vars (which were actually the web config, not Android). Copied to `web/.env` as `VITE_FIREBASE_*` vars.
**Rule:** Firebase API keys are per-platform. Android key comes from google-services.json, Web key comes from Firebase Console → Web App config. NEVER use google-services.json values for web Firebase.

### 2026-02-27 — Web App Must Be Desktop-First (Not Mobile Phone Width)

**Context:** Built web SPA with 430px fixed-width phone column layout and bottom tab bar.
**Problem:** User feedback: "its designed for mobile not desktop with nav buttons at the bottom, bad design...i cant do anything on the app, you are prioritizing task completion over task compliance, very bad"
**Root Cause:** Copied mobile phone mockup layout from `visual-reference.html` literally — 430px column, bottom tabs. Web users expect desktop-first layouts with sidebar navigation. The visual reference was for phone screens, NOT for web.
**Solution:** Complete rewrite: 220px sidebar navigation on desktop, responsive breakpoint at 768px switches to mobile bottom nav. Content area uses `max-width: 800px` with `padding: 32px 40px`. Typography scaled up for desktop (22px screen names, 32px hero text).
**Rule:** When building a web app from a mobile design, ALWAYS adapt to desktop-first. Sidebar nav for desktop, bottom tabs for mobile via media query. Never use fixed phone-width columns.

### 2026-02-27 — Silent API Errors Make Web App Appear Broken

**Context:** Web app showed all 3 screens with empty states — "No transactions", "No budget data", "No linked accounts".
**Problem:** User saw empty screens and assumed the app was broken. No indication that API calls were failing.
**Root Cause:** All API fetch calls caught errors silently (console.log only). The UI showed empty states identically to "data loaded but genuinely empty" states. Railway backend returned 401 (Firebase auth required) but the UI gave no feedback.
**Solution:** Added error state to every store slice (`budgetError`, `transactionsError`, `categoriesError`, `accountsError`, `connectionError`). Every page renders `ErrorBanner` with retry button when errors occur. Sidebar shows connection status dot (green/amber/spinning).
**Rule:** NEVER silently swallow API errors in web apps. Every fetch must surface failures to the UI. Differentiate between "loading", "empty but ok", and "error" states. Add retry mechanisms. Show connection status.

### 2026-02-27 — Vite Env Vars Need VITE_ Prefix

**Context:** Setting up environment variables for the web app.
**Problem:** `import.meta.env.API_BASE_URL` was undefined at runtime.
**Root Cause:** Vite only exposes env vars prefixed with `VITE_` to client-side code (security measure — prevents accidental exposure of server-side secrets).
**Solution:** All web env vars use `VITE_` prefix: `VITE_API_BASE_URL`, `VITE_FIREBASE_API_KEY`, etc.
**Rule:** Vite requires `VITE_` prefix. Expo requires `EXPO_PUBLIC_` prefix. Both are security measures. Never expect unprefixed env vars to work in client code.

### 2026-02-27 — Standalone Vite App vs Expo Web for RN Projects

**Context:** Needed a web version of the Expo React Native budget tracker app.
**Problem:** Mobile app uses heavy RN-only dependencies: expo-blur, react-native-plaid-link-sdk, @react-native-firebase/auth, react-native-svg.
**Root Cause:** Expo Web transpiles RN components but RN-only native modules (Plaid SDK, expo-blur, RN Firebase) either don't work or need complex polyfills. Building web via Expo would mean fighting compatibility issues.
**Solution:** Created standalone `web/` directory with its own Vite + React setup. Pure CSS glassmorphism replaces expo-blur. Firebase JS SDK replaces RN Firebase. Standard HTML/CSS replaces react-native-svg. Shared: TypeScript types, Zustand store patterns, API endpoint structure, design tokens.
**Rule:** When adding web to an RN project with native-only deps, create a standalone Vite app. Don't fight Expo Web compatibility. Share types, store patterns, and design tokens — not code directly.

---

## Quick Reference — Common Gotchas

> Add one-liners here for fast lookup. Link to full entry above if details needed.

| Gotcha | Solution |
|--------|----------|
| Plaid SDK ESM bare imports | Postinstall script `scripts/fix-plaid-esm.js` patches them |
| Plaid SDK has no Expo plugin | Don't add to app.json plugins — autolinking handles it |
| Expo prebuild generates signingConfigs | Patch INSIDE existing block, don't try to add new block |
| google-services.json in CI | Use `printenv`, never `echo '...'`; placeholder MUST include `configuration_version: "1"` |
| .env heredoc in YAML | Use individual `echo` lines, not heredoc |
| Placeholder PNGs must be valid | Use ImageMagick to generate solid-color PNGs |
| Express v5 params are `string \| string[]` | Cast with `as string` for Firestore |
| tsconfig picks up worktrees | Add worktree dirs to `exclude` |
| Backend is in `backend/` not root | All backend commands need `cd backend/` or absolute paths |
| All amounts are cents (integer) | Use `formatAmount(cents)` for display, never divide by 100 inline |
| Plaid linkTokenCreate must be minimal | Only: products, client_name, country_codes, language, user. OAuth params via env vars only |
| OAuth banks need Dashboard registration | redirect_uri + android_package_name must be registered in Plaid Dashboard first |
| Unregistered Plaid params kill ALL banks | Don't add redirect_uri/android_package_name unless registered — INVALID_INPUT error |
| railway.json must match current stack | Always verify start command matches backend language after migration |
| aarch64 cannot build APKs locally | Use GitHub Actions CI exclusively for Android builds |
| Duplicate .env keys cause confusion | Check for duplicates before debugging API connection issues |
| Plaid SDK: institution.id not institution_id | Mobile SDK uses `.id`, some web examples use `.institution_id` |
| Merchant regex overrides | Catches edge cases Plaid miscategorizes (from budgeting-app) |
| Rolling average must exclude current event | When comparing new value vs historical average, exclude the new value |
| Firestore `.set()` with dot-notation | Creates FLAT keys, not nested paths. Use `.update()` for nested fields |
| Firestore composite index needed | Multi-field where+orderBy queries fail without index. Wrap in try/catch |
| Categories must be seeded before use | Budget + sync must call `ensureCategories()` — not just GET /categories |
| Named Firestore database | Use `getFirestore(app, dbName)` from `firebase-admin/firestore`, not `admin.app().firestore(dbName)` |
| Firebase JS init at module load → blank screen | Use lazy init pattern: `getFirebaseAuth()` function, NOT top-level `initializeApp()` |
| Firebase web vs Android API key | Different keys per platform. Web key from Firebase Console, NOT from google-services.json |
| Web layout mobile-first → bad UX | Desktop sidebar (220px) + mobile bottom nav (<768px breakpoint). Never fixed phone-width |
| Silent API errors → "empty" screens | Surface all errors with ErrorBanner + retry. Differentiate empty/loading/error states |
| Vite env vars need VITE_ prefix | `import.meta.env.VITE_*` — unprefixed vars are NOT exposed to client code |
| Expo Web with RN-native deps | Use standalone Vite app. Don't fight expo-blur/Plaid/RN Firebase compatibility |
| Web Firebase config location | Root `.env` has EXPO_PUBLIC_FIREBASE_* values — these ARE the web config. Copy to web/.env as VITE_* |

---

## Patterns That Work Well

> Things that went right — keep doing these.

| Pattern | Why It Works |
|---------|-------------|
| Cursor-based Plaid sync | Only fetches new/modified transactions — efficient and idempotent |
| Postinstall patch scripts | Automated fix for broken npm packages, runs on every install |
| `printenv` for CI secrets | Avoids all shell quoting issues with JSON |
| Expo prebuild in CI | Generates fresh native project every build — no stale configs |
| GlassCard component tiers | standard/strong/inset covers all use cases consistently |
| Zustand single store | Simple, TypeScript-inferred, no provider boilerplate |
| formatAmount(cents) utility | Single source of truth for financial display formatting |
| DEV_MODE env var | Bypasses auth + phase gates for fast development iteration |
| ImageMagick for placeholder assets | Valid PNGs in one command |
| Individual echo for .env | Clean values, no whitespace issues |
| Temporary debug endpoints | `/debug/*` no-auth endpoints for tracing pipeline failures — remove after fixing |
| `ensureCategories()` shared service | Prevents empty-category bugs across budget, sync, and categories routes |
| Lazy Firebase init (web) | Prevents blank screen crash from missing env vars; init only when auth is needed |
| Desktop sidebar + mobile bottom nav | Single responsive layout covers both desktop and mobile; CSS media query at 768px |
| ErrorBanner with retry on every page | Users always know when something is wrong and can self-recover |
| Connection status dot in sidebar | Quick visual indicator of API health without checking each page |
| Standalone Vite app for web | Clean separation from RN-native deps; share only types + patterns |
| CSS custom properties for design tokens | All colors, fonts, glass effects in one `theme.css` — easy to sync with mobile theme |
| .env.example in web/ | Documents all required config vars with placeholder values; prevents guessing |
