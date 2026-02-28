# Recovery Prompt — Keel Web SPA Checkpoint

> **Use this prompt to restore context if you need to revert or continue from this exact point.**
> **Commit:** `c37d77e` (2026-02-27)
> **Git restore:** `git reset --hard c37d77e`

---

## What Was Done (Chronological)

### Phase 1: 19 Granular Categories with Group Field
**Commit `0b04404`**

Replaced the original 6 broad categories with 19 granular categories organized into 7 hierarchical groups:

| Group | Categories |
|-------|-----------|
| Income | Income |
| Essentials | Mortgage & Rent, Utilities, Insurance, Groceries |
| Daily Living | Dining & Takeout, Alcohol, Transportation, Health & Wellness, Personal Care |
| Family & Home | Family & Kids, Shopping |
| Leisure | Entertainment & Social, Subscriptions, Travel |
| Financial | Loans & Debt, Fees & Charges, Savings & Investments |
| Uncategorized | Uncategorized |

**Files changed:**
- `src/types/index.ts` — Added `CategoryGroup` union type, `group` field to `Category` interface
- `web/src/types.ts` — Same changes (web copy)
- `backend/src/services/ensureCategories.ts` — All 19 DEFAULT_CATEGORIES with `group` field
- `src/constants/categories.ts` — Frontend copy of 19 categories with groups
- `backend/src/services/categorization.ts` — Updated PLAID_CATEGORY_MAP to new category names

### Phase 2: Budget Screen Drill-Down UI
**Commit `d69a478`**

Rewrote `web/src/pages/Budget.tsx` with hierarchical drill-down:
- `GroupCard` → `CategoryCard` → `LineItems` hierarchy
- Groups start collapsed (all 5 in `collapsedGroups` Set)
- Categories start collapsed (empty `expandedCategories` Set)
- Progress bar track always visible (was previously gated on `totalTarget > 0`)
- `GlassCard tier="inset"` for nested categories

**Store changes (`web/src/store.ts`):**
- Added `collapsedGroups: Set<string>` — initialized with all 5 expense groups
- Renamed `collapsedCategories` → `expandedCategories` — inverted semantics (empty = all collapsed)
- Added `toggleGroupCollapse` and `toggleCategoryExpand` actions

### Phase 3: Firestore Migration + Category Route Fixes
**Commit `f2383d0`**

- `backend/src/services/ensureCategories.ts` — Added migration logic:
  - `NAME_TO_GROUP` map: current 19 category names → groups
  - `LEGACY_NAME_TO_GROUP` map: old 6 category names → groups
  - Detects categories missing `group` field, batch-updates them
  - Re-reads after migration to return fresh data
- `backend/src/routes/categories.ts` — POST accepts `group` (defaults to 'Uncategorized'), PUT allows updating `group`
- `backend/src/routes/budget.ts` — Added diagnostic logging for period, date range, transaction count

### Phase 4: Web SPA Deployment (Express Serves SPA)
**Commit `c37d77e`**

Root cause fix: web app had NO deployment pipeline. Express now serves the Vite-built SPA.

- `backend/src/index.ts`:
  - Added `import path from 'path'`
  - Added `express.static(webDistPath)` after API routes
  - Added SPA fallback: `app.get('*', ...)` serves `index.html` for non-API GET requests
  - Helmet CSP disabled (`contentSecurityPolicy: false`) for Vite inline scripts
- `railway.json`:
  - Build: `cd backend && npm install && npm run build && cd ../web && npm install && VITE_API_BASE_URL= npm run build`
  - Start: `cd backend && node dist/index.js`
- `web/src/api.ts`:
  - `API_BASE_URL` logic: `envUrl !== undefined ? envUrl : 'http://localhost:5050'`
  - Production: `VITE_API_BASE_URL=""` → same origin
  - Local dev: not set → localhost:5050 fallback
- `web/src/firebase-config.ts` (NEW):
  - Hardcoded public Firebase web client config as fallback
- `web/src/auth.ts`:
  - Imports `firebaseConfig` from `firebase-config.ts` as defaults
  - Env vars override if present
  - Removed `throw new Error('Firebase config missing')` — hardcoded fallback always available
- `.github/workflows/deploy-backend.yml`:
  - Renamed to "Deploy to Railway"
  - Added `web/**` to paths trigger

---

## Current Architecture

```
Push to main (backend/** or web/**)
  → GitHub Actions: railway up --service 8f07e133-...
    → Nixpacks builds:
      1. cd backend && npm install && npm run build (TypeScript → dist/)
      2. cd ../web && npm install && VITE_API_BASE_URL= npm run build (Vite → dist/)
    → Start: cd backend && node dist/index.js
      → Express serves:
        - /health (no auth)
        - /api/v1/* (Firebase auth middleware)
        - Static files from web/dist/ (express.static)
        - SPA fallback: index.html for all other GET requests
```

**Railway URL:** `https://web-production-794b4.up.railway.app`
- `/` → Web SPA (Login → Budget/Transactions/Settings)
- `/api/v1/budget` → Budget API (requires Firebase auth)
- `/health` → Health check (no auth)

---

## Key State at This Checkpoint

### Git
- **Branch:** main
- **HEAD:** `c37d77e`
- **Clean working tree** (no uncommitted changes)
- All 4 commits pushed to origin/main

### Firestore
- Categories collection has 19 default categories
- `ensureCategories()` migrates existing categories missing `group` field on first API call
- Budget route calls `ensureCategories()` before reading categories

### Web Budget Screen
- `groupBudgetData()` groups `BudgetCategoryDisplay[]` by `category.group`
- `GROUP_ORDER`: Essentials → Daily Living → Family & Home → Leisure → Financial
- Income categories skipped (line 26: `if (cat.category.is_income) continue`)
- Uncategorized rendered separately at bottom (only if has spending)
- Groups start collapsed, categories start collapsed
- Progress bar track always visible, fill only when budget targets exist
- Line items shown when category expanded: column headers + FX/RV/TV badges + trending

### Environment
- `web/.env` (GITIGNORED): `VITE_API_BASE_URL=https://web-production-794b4.up.railway.app` + Firebase config
- `web/src/firebase-config.ts` (COMMITTED): Hardcoded public Firebase web config as fallback
- Railway backend: No VITE_* env vars needed (firebase-config.ts provides defaults, VITE_API_BASE_URL="" set at build time)

---

## To Revert to This Point

```bash
# Hard reset to this commit
git reset --hard c37d77e
git push --force-with-lease

# Or create a branch from this point
git checkout -b recovery-checkpoint c37d77e
```

---

## Known Issues at This Checkpoint

1. **Railway deploy in progress** — Commit `c37d77e` was pushed and deploy started but may not be complete yet. Check: `gh run list --limit 1`
2. **Firestore migration not yet verified** — The `ensureCategories` migration should run on first API call after deploy, but hasn't been visually verified
3. **Budget month filtering** — Backend code looks correct (`.where('date', '>=', startDate).where('date', '<', endDate)`) but diagnostic logging was just added — check Railway logs to verify
4. **No automated tests** — All changes verified via TypeScript checks + Vite build, but no unit/integration tests exist

---

## File Inventory (All Changed Files)

| File | Status | Purpose |
|------|--------|---------|
| `src/types/index.ts` | Modified | Added `CategoryGroup` type, `group` field to `Category` |
| `web/src/types.ts` | Modified | Same `CategoryGroup` + `group` (web copy) |
| `backend/src/services/ensureCategories.ts` | Modified | 19 categories, migration logic, legacy name mapping |
| `backend/src/routes/categories.ts` | Modified | POST/PUT accept `group` field |
| `backend/src/routes/budget.ts` | Modified | Diagnostic logging |
| `backend/src/index.ts` | Modified | Serves web SPA, helmet CSP off |
| `src/constants/categories.ts` | Modified | Frontend 19 categories with groups |
| `backend/src/services/categorization.ts` | Modified | PLAID_CATEGORY_MAP updated to new names |
| `web/src/pages/Budget.tsx` | Modified | GroupCard → CategoryCard → LineItems drill-down |
| `web/src/store.ts` | Modified | collapsedGroups, expandedCategories, toggle actions |
| `web/src/api.ts` | Modified | API_BASE_URL same-origin logic |
| `web/src/auth.ts` | Modified | Firebase config fallback from firebase-config.ts |
| `web/src/firebase-config.ts` | **NEW** | Hardcoded public Firebase web client config |
| `railway.json` | Modified | Builds both backend + web, new start command |
| `.github/workflows/deploy-backend.yml` | Modified | Triggers on web/** too, renamed |
| `CLAUDE.md` | Modified | Updated architecture, deployment, patterns |
| `LESSONS_LEARNED.md` | Modified | 3 new entries + quick reference items |
| `DECISIONS.md` | Modified | ADR-019, ADR-020, ADR-021 |
