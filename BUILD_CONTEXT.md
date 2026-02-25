# BUILD CONTEXT — Read This Before Starting

> This document contains everything needed to continue the OpenSpec greenfield rebuild.
> The previous session completed Phase 1 (Spec Decomposition) and was about to begin implementation.

---

## PROJECT IDENTITY

- **App Name:** Keel
- **Package:** `com.na5h13.keel`
- **Working Directory:** `/home/nashie/Development/MoneyPlanner`
- **Old Copy (reference only, do not modify):** `/home/nashie/Development/MoneyPlanner_old`
- **OpenSpec Documents:** `/home/nashie/Development/MoneyPlanner/original openspec/`
  - `OpenSpec_v1_0_Unified.md` (5,464 lines, 271KB — THE source of truth)
  - `OpenSpec_v1_0_Unified_Design.html` (design system, screen mockups)
  - `OpenSpec_UserJourney_ScreenMap.html` (phase gating, screen sequencing)
- **Exported Real Transactions (for seeding/reference):** `/home/nashie/Development/openclaw-workspace/budgeting-app/exports/`
- **Implementation Checklist:** `/home/nashie/Development/MoneyPlanner/IMPLEMENTATION_CHECKLIST.md`

---

## TECH STACK (existing, do not change)

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 52 + React Native 0.76.5 (New Architecture) |
| Navigation | Expo Router 4.0 (file-based routing) |
| State | Zustand 5.0 |
| Auth | Firebase Auth (native SDK via @react-native-firebase/app + /auth) |
| Google Sign-In | @react-native-google-signin/google-signin |
| Banking | react-native-plaid-link-sdk (Plaid Link) |
| Backend | Express/TypeScript (deployed on Railway) |
| Database | Cloud Firestore |
| Animations | react-native-reanimated 3.16 |
| Gestures | react-native-gesture-handler 2.20 |
| SVG | react-native-svg 15.8 |
| Charts | react-native-chart-kit 6.12 |
| Secure Storage | expo-secure-store |
| Date Utils | date-fns 4.0 |

---

## CONFIG FILES TO PRESERVE (do not delete)

These files are already configured and must survive any rebuild:

- `.env` — Frontend env vars (API URL, dev mode)
- `.env.example` — Template
- `app.json` — Expo config (Keel, com.na5h13.keel, plugins, splash)
- `eas.json` — EAS Build config
- `google-services.json` — Firebase Android config
- `GoogleService-Info.plist` — Firebase iOS config
- `.gitignore`
- `.github/workflows/build-android.yml` — GitHub Actions APK build
- `backend/.env` — Backend secrets (Plaid keys, Firebase, encryption)
- `backend/.env.example`
- `backend/package.json` — Backend dependencies
- `backend/tsconfig.json`
- `package.json` — Frontend dependencies
- `tsconfig.json` — TypeScript config
- `Procfile` — Railway deployment
- `assets/` — Placeholder PNGs (icon, splash, adaptive-icon, favicon)
- `original openspec/` — Source of truth documents
- `IMPLEMENTATION_CHECKLIST.md` — Phase 1 deliverable

---

## WHAT TO NUKE (delete and rebuild from scratch)

All source code in these directories gets deleted and rewritten per OpenSpec:

```
app/                    — All route files (rebuild with new screens)
src/components/         — All components (rebuild with glass morphism)
src/hooks/              — All hooks
src/services/           — All service files (rebuild API layer)
src/stores/             — All Zustand stores (rebuild with OpenSpec schemas)
src/theme/              — Theme file (replace with OpenSpec design tokens)
src/types/              — Type definitions (rebuild with OpenSpec schemas)
src/utils/              — Utility files
src/constants/          — Constants
backend/src/            — All backend source (rebuild routes, services, middleware)
```

---

## DESIGN SYSTEM (from OpenSpec Design HTML — extract exactly)

### Colors

```typescript
// Brand Layer (UI chrome only)
'--brand-deep-sage': '#3a4a3f',      // Primary text, active icons, headers
'--brand-steel-blue': '#51697a',     // Interactive, links
'--brand-soft-taupe': '#d6cec3',     // Borders, separators
'--brand-warm-nude': '#c1b19f',      // Secondary UI chrome
'--brand-celadon': '#a8c0a8',        // Ambient backlight orbs

// Data Layer (semantic encoding only)
'--data-positive': '#51697a',        // On-track data
'--data-positive-light': '#7496b0',  // On-track states
'--data-surplus': '#5B8A72',         // Positive, safe-to-spend, income
'--data-warning': '#9A7B4F',         // Watch/over, attention (NO RED EVER)
'--data-deficit': '#8B7260',         // Negative deltas
'--data-neutral': '#8a8a8a',         // Inactive, labels

// Backgrounds
'--bg-eggshell': '#f5f2ee',         // Primary background
'--bg-cloud': '#eef2f1',            // Section backgrounds
'--bg-linen': '#e8e3da',            // Card alternative
'--bg-misty': '#d8dede',            // Progress bar bg
```

### Typography

```
Display: 'Playfair Display', Georgia, serif (headers, 24-32px, weight 600)
Body: 'Source Sans Pro', sans-serif (UI text, 14-16px, weight 400/600)
Data: 'Source Code Pro', monospace (financial amounts, 10-28px, weight 500/600)
```

### Glassmorphism v3.1

```
Standard (.glass): rgba(255,255,255,0.38), blur 24px, saturate 1.4
Strong (.glass-strong): rgba(255,255,255,0.52), blur 32px, saturate 1.5
Inset (.glass-inset): rgba(255,255,255,0.15), blur 14px, saturate 1.2
```

Directional borders: top+left brighter. Ambient backlight orbs behind cards.

### Navigation (3-tab bottom bar)

```
Budget (wallet SVG) | Transactions (receipt SVG) | Settings (gear SVG)
Active: deep sage filled | Inactive: neutral outlined
Bar: 54px, backdrop blur
Icons: 18x18px inline SVG — NO EMOJI
```

---

## BACKEND CURRENT STATE

The backend at `backend/src/` is Express/TypeScript with:

- `index.ts` — Express server, CORS, Helmet, routes
- `middleware/auth.ts` — Firebase ID token verification
- `routes/plaid.ts` — Plaid Link token exchange, accounts, transactions, income
- `routes/iin.ts` — IIN config CRUD, events, income check (mostly TODO)
- `services/firebaseAdmin.ts` — Firebase Admin init (supports base64, file, auto-detect)
- `services/plaidService.ts` — Plaid client wrapper (createLinkToken, exchangePublicToken, getAccounts, getTransactions, getRecurringTransactions)
- `utils/encryption.ts` — AES encrypt/decrypt for Plaid tokens

**Plaid is WORKING.** It connects, fetches real transactions. The backend needs to be EXTENDED (not replaced) with new endpoints per the OpenSpec.

---

## IMPLEMENTATION ORDER (Milestones 0-4, then PAUSE)

### MILESTONE 0: Foundation
- Replace `src/theme/index.ts` with OpenSpec design tokens
- Install Google Fonts (expo-google-fonts packages for Playfair Display, Source Sans Pro, Source Code Pro)
- Create glass morphism components (`src/components/ui/Glass.tsx`)
- Create SVG navigation icons (`src/components/ui/NavIcons.tsx`)
- Rebuild `app/(tabs)/_layout.tsx` with 3-tab bottom bar (Budget, Transactions, Settings)
- Create shared UI primitives (typography components, amount formatter)
- Set up Zustand stores with OpenSpec data schemas
- Set up API service layer

### MILESTONE 1: Transaction List Screen (Section 21, Function 2)
- Date-grouped transaction feed from Plaid
- Month navigation (arrows)
- Search with 300ms debounce
- Filter chips: All | Income | Pending
- Amount formatting (+$X.XX green for income, -$X.XX sage for expenses)
- Pull-to-refresh → Plaid sync
- Loading/empty/error/offline states
- Backend: GET `/api/v1/transactions`, POST `/api/v1/transactions/sync`

### MILESTONE 2: Categorization Engine (Section 21, Function 3)
- Default categories: Home & Personal, Food & Transportation, Family, Loans & Debt, Entertainment & Other, Uncategorized
- 4-priority auto-categorization (merchant rule → history → Plaid map → keyword)
- Category bottom sheet (tap transaction → pick category)
- "Apply to all {merchant}" checkbox
- Backend: category CRUD + transaction category reassignment endpoints

### MILESTONE 3: Settings Screen (Section 21, Function 4)
- Accounts list (type icon, last-4, balance)
- Plaid Link for adding accounts
- Account hide/show
- Category management (create, edit, delete, reorder with drag handles)
- Preferences (budget period, currency, notifications)
- Manual sync, CSV export, Plaid disconnect

### MILESTONE 4: Budget Screen — Budget Column (Section 21, Function 5)
- Scrollable category cards with line items
- Budget column with user-set targets
- Tap-to-edit target (number input)
- Long-press to rename line item
- Swipe-left to delete
- "+ Add item" at bottom of each card
- Initial budget suggestion (3-month average, rounded to $25)
- Category collapse/expand, period navigation
- Summary bar placeholder (Safe to Spend hero)

**>>> PAUSE HERE FOR USER VERIFICATION <<<**

---

## CRITICAL RULES

1. **NO RED.** Ever. In any ambient display. Amber #9A7B4F is maximum severity.
2. **NO MOCK DATA.** All data from real Plaid transactions or the exported CSVs.
3. **NO EMOJI for icons.** SVG only (emoji renders inconsistently cross-OS).
4. **≤7 data chunks** per primary view (Miller's law).
5. **Amounts in Source Code Pro** monospace font.
6. **Glassmorphism on all cards** with ambient backlight orbs.
7. **DEV_MODE=true** bypasses all phase gates for development.
8. **Plaid is READ-ONLY.** App never writes to bank accounts.
9. **Copy-paste from OpenSpec.** No reinterpretation, no UX improvements.
10. **Document ALL deviations** with justification.

---

## KEY FILES TO READ

Before implementing, read these in order:
1. This file (`BUILD_CONTEXT.md`) — you're reading it
2. `IMPLEMENTATION_CHECKLIST.md` — Full spec decomposition with all schemas, endpoints, screens
3. `original openspec/OpenSpec_v1_0_Unified.md` — Sections 21 (Budget Tracker) and 22 (Trending Classification) are the immediate build targets
4. `original openspec/OpenSpec_v1_0_Unified_Design.html` — Exact CSS/design tokens to copy
5. `app.json` — Current Expo config
6. `backend/src/` — Existing backend to extend

---

## BACKEND .env (current values for reference)

```
PLAID_CLIENT_ID=699876495bac5400226fffe7
PLAID_SECRET=ecedbfeaec5c17e8fec661bc4147c8
PLAID_ENV=production
FIREBASE_SERVICE_ACCOUNT=config/firebase-service-account.json
FIREBASE_PROJECT_ID=money-planner-ca2c0
ENCRYPTION_KEY=          # NEEDS TO BE GENERATED: openssl rand -hex 32
DEV_MODE=true
PORT=5050
ALLOWED_ORIGINS=*
```

## FRONTEND .env (current values)

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:5050
EXPO_PUBLIC_DEV_MODE=true
```

---

*This document was generated from a complete reading of the OpenSpec v1.0 Unified (5,464 lines), Design HTML, Screen Map HTML, and all existing project source files.*
