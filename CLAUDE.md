# Keel (MoneyPlanner) — Claude Context

> **Living Document** — Update whenever project structure, patterns, or conventions change.
> Claude reads this automatically. Keep it accurate for one-shot solutions.

## Project Overview

**Research-backed behavioral budgeting platform** connecting to Canadian banks via Plaid API. Grounded in peer-reviewed financial psychology (Thaler & Benartzi's SMarT, Madrian & Shea auto-enrollment, Locke & Latham goal theory). Measures success by **savings rate delta** — not engagement metrics.

**Target:** Expo React Native mobile app (iOS + Android) + Vite/React web app, with Express/TypeScript backend on Railway.

## Architecture

```
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│  Expo React Native App          │  │  Vite/React Web App (web/)      │
│  ├── Plaid Link RN SDK         │  │  ├── CSS glassmorphism          │  ← backdrop-filter: blur()
│  ├── react-native-svg charts   │  │  ├── Firebase JS Auth           │  ← Google Sign-In popup
│  ├── Zustand state management  │  │  ├── Zustand state management  │  ← Same store shape
│  └── Firebase RN Auth          │  │  ├── Desktop sidebar + mobile   │  ← Responsive layout
│                                 │  │  └── react-router-dom          │  ← Client-side routing
├─────────────────────────────────┤  └────────────────┬────────────────┘
│  Express/TypeScript Backend     │  ← Shared by both │ clients
│  ├── Plaid Node SDK            │  ← Transaction sync, cursor-based
│  ├── Firebase Admin            │  ← Auth verification, Firestore
│  ├── AES-256-GCM encryption   │  ← Plaid token encryption at rest
│  └── 4-priority categorization │  ← Merchant rule → historical → Plaid → keyword
├─────────────────────────────────┤
│  Cloud Firestore                │  ← User data, transactions, budget
└─────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile App** | Expo SDK 52 + React Native 0.76.5 (New Architecture) |
| **Navigation** | Expo Router 4.0 (file-based routing) |
| **State** | Zustand 5.0 |
| **Blur/Glass** | expo-blur |
| **Typography** | Playfair Display (headers), Source Sans Pro (body), Source Code Pro (data) |
| **Fonts** | @expo-google-fonts/* packages |
| **Bank Linking** | react-native-plaid-link-sdk 12.8.0 |
| **Auth** | @react-native-firebase/auth + @react-native-google-signin |
| **Backend** | Express/TypeScript |
| **Bank API** | plaid (Node SDK) |
| **Database** | Cloud Firestore |
| **Encryption** | AES-256-GCM (Plaid tokens at rest) |
| **CI/CD** | GitHub Actions → APK artifact |
| | |
| **Web App** | Vite 6 + React 19 + TypeScript |
| **Web Routing** | react-router-dom 7 (hash router) |
| **Web State** | Zustand 5.0 (same store shape as mobile) |
| **Web Glass** | CSS `backdrop-filter: blur()` (no expo-blur) |
| **Web Fonts** | Google Fonts via `<link>` in index.html |
| **Web Auth** | Firebase JS SDK (`firebase/auth`) — Google Sign-In popup |
| **Web Layout** | Desktop sidebar (220px) + mobile bottom nav (<768px) |
| **Web Deploy** | Static build (`npm run build` → `dist/`) — any static host |

## Project Structure

```
MoneyPlanner/
├── app/                              # Expo Router file-based routes
│   ├── _layout.tsx                   # Root layout (font loading, splash)
│   ├── index.tsx                     # Entry redirect → /(tabs)/budget
│   └── (tabs)/
│       ├── _layout.tsx               # 3-tab bottom bar (Budget/Transactions/Settings)
│       ├── budget.tsx                # Budget screen (Milestone 4)
│       ├── transactions.tsx          # Transaction list (Milestone 1+2)
│       └── settings.tsx              # Settings (Milestone 3)
├── src/
│   ├── components/
│   │   ├── ui/                       # Design system components
│   │   │   ├── Glass.tsx             # GlassCard (3 tiers) + AmbientBackground
│   │   │   ├── Typography.tsx        # All text components
│   │   │   ├── NavIcons.tsx          # SVG wallet/receipt/gear icons
│   │   │   ├── AmountText.tsx        # Financial amount display
│   │   │   ├── SearchBar.tsx         # 300ms debounce search
│   │   │   ├── FilterChips.tsx       # All|Income|Pending chips
│   │   │   └── MonthNavigator.tsx    # Month navigation arrows
│   │   └── budget/                   # Budget-specific components
│   │       ├── CategoryCard.tsx      # Collapsible budget category
│   │       ├── CategoryEditor.tsx    # Category CRUD modal
│   │       ├── CategoryPicker.tsx    # Transaction recategorization
│   │       ├── SummaryBar.tsx        # Safe to Spend hero
│   │       └── TransactionRow.tsx    # Single transaction row
│   ├── theme/index.ts                # Design tokens (colors, fonts, glass, etc.)
│   ├── types/index.ts                # TypeScript interfaces
│   ├── services/api.ts               # HTTP client + endpoint wrappers
│   ├── stores/budgetStore.ts         # Zustand store
│   ├── constants/categories.ts       # Default categories + keywords
│   └── utils/formatAmount.ts         # Amount formatting (cents → display)
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Express server
│   │   ├── middleware/auth.ts        # Firebase auth middleware
│   │   ├── services/
│   │   │   ├── firebaseAdmin.ts      # Firebase Admin init (supports named databases)
│   │   │   ├── plaidService.ts       # Plaid client wrapper
│   │   │   ├── categorization.ts     # 4-priority auto-categorization
│   │   │   ├── ensureCategories.ts   # Shared: seeds default categories if none exist
│   │   │   ├── syncService.ts        # Plaid cursor-based transaction sync
│   │   │   └── ../utils/encryption.ts
│   │   └── routes/
│   │       ├── transactions.ts       # CRUD + sync + categorize
│   │       ├── categories.ts         # Category management
│   │       ├── budget.ts             # Budget targets + line items
│   │       ├── accounts.ts           # Plaid account linking
│   │       └── settings.ts           # User preferences
│   ├── package.json
│   └── tsconfig.json
├── web/                              # Vite/React Web App (standalone SPA)
│   ├── index.html                    # Entry HTML (Google Fonts loaded here)
│   ├── vite.config.ts                # Vite config
│   ├── package.json                  # Web-only deps: zustand, date-fns, firebase, react-router-dom
│   ├── .env.example                  # Template for required env vars
│   ├── .env                          # GITIGNORED — real Firebase config + Railway URL
│   ├── src/
│   │   ├── main.tsx                  # React root mount
│   │   ├── App.tsx                   # Auth guard + router + layout shell (Sidebar/MobileNav)
│   │   ├── theme.css                 # All CSS: design tokens, glassmorphism, layout, responsive
│   │   ├── types.ts                  # Shared interfaces (copied from mobile src/types/index.ts)
│   │   ├── auth.ts                   # Firebase JS Auth — LAZY init (see Lessons Learned)
│   │   ├── api.ts                    # HTTP client + Firebase token injection + formatAmount utils
│   │   ├── store.ts                  # Zustand store (budget, transactions, settings, error states)
│   │   ├── components/
│   │   │   ├── TabBar.tsx            # Sidebar (desktop) + MobileNav (mobile) — connection status dot
│   │   │   ├── GlassCard.tsx         # 3-tier glassmorphism (standard/strong/inset) + optional glow
│   │   │   ├── ErrorBanner.tsx       # Amber warning banner with retry button
│   │   │   ├── AmountText.tsx        # Cents → formatted display (Source Code Pro)
│   │   │   ├── MonthNavigator.tsx    # Period navigation arrows
│   │   │   └── SearchBar.tsx         # 300ms debounced search input
│   │   └── pages/
│   │       ├── Budget.tsx            # SummaryBar + CategoryCards (collapsible, badges, progress bars)
│   │       ├── Transactions.tsx      # Date-grouped feed + filter chips + CategoryPicker modal
│   │       ├── Settings.tsx          # Accounts, categories, preferences, sign out
│   │       └── Login.tsx             # Firebase Google Sign-In popup
│   └── dist/                         # GITIGNORED — production build output
├── scripts/
│   └── fix-plaid-esm.js             # Postinstall: patch Plaid SDK ESM imports
├── assets/                           # App icons (placeholder PNGs)
├── .github/workflows/
│   └── build-android.yml             # GitHub Actions APK build
├── app.json                          # Expo config
├── tsconfig.json
├── package.json
├── CLAUDE.md                         # This file
├── LESSONS_LEARNED.md
└── DECISIONS.md
```

## Design System

| Element | Spec |
|---------|------|
| **Brand Colors** | Deep Sage (#3a4a3f), Steel Blue (#51697a), Soft Taupe, Warm Nude, Alabaster |
| **Data Colors** | Sage Surplus (#5B8A72 + income), Dusky Blue (#7496b0), Burnished Gold (#9A7B4F + warning), Umber (#8B7260 + expense), Midnight Navy (#2a3f52) |
| **Glass Effect** | Glassmorphism v3.1 — 3 tiers: standard, strong, inset |
| **Typography** | Playfair Display (headers), Source Sans Pro (body), Source Code Pro (monospace data) |
| **Touch Targets** | 44x44pt minimum |
| **BANNED** | Pie charts, donut charts, 3D effects, gauges, rainbow color maps, emoji for icons |

## Non-Negotiable Rules (NNR)

| Rule | Constraint |
|------|-----------|
| NNR-COLOR | NO RED ever — amber #9A7B4F is maximum severity. Midnight Navy for breach. |
| NNR-ICON | NO EMOJI for icons — SVG only (inconsistent cross-OS rendering) |
| NNR-DATA | NO MOCK DATA — real API calls, real errors, real empty states |
| NNR-AMOUNT | All amounts stored as **cents (integer)** — no floating-point |
| NNR-FONT | Source Code Pro for all financial data display |
| NNR-DEV | DEV_MODE=true bypasses all phase gates for development |
| NNR-01 | Automation before restriction |
| NNR-02 | Observation before targets |
| NNR-06 | Loss framing = decision-context only (no push notifications, no ambient) |
| NNR-07 | Category reallocation = 1-tap, zero shame language |

## Success Metric

**Single metric:** Savings rate delta = post-system savings rate − baseline savings rate

**Explicitly rejected metrics (never OKRs):** DAU/MAU, session duration, screens/session, notification open rates.

## Key Patterns

### Frontend (Expo/React Native)
- **Expo Router** file-based routing in `app/` directory
- **Zustand** for state management (no Redux)
- **GlassCard** containers with BlurView — data always opaque
- **SVG-only icons** — NavIcons.tsx for tab bar, inline SVG elsewhere
- `formatAmount(cents)` for all financial display
- `font-variant-numeric: tabular-nums` via Source Code Pro
- Color redundancy always (color + icon + label)

### Web App (Vite/React)
- **Standalone SPA** — NOT Expo Web. Separate `web/` directory, own `package.json`, own `node_modules`
- **Desktop-first** responsive layout: sidebar nav (220px) on desktop, bottom tab bar on mobile (<768px)
- **CSS glassmorphism** — `backdrop-filter: blur(24px) saturate(1.4)`, NOT expo-blur
- **Firebase JS SDK** (not RN Firebase) — `firebase/auth` with Google Sign-In popup
- **LAZY Firebase init** — Firebase is initialized on first `getFirebaseAuth()` call, NOT at module load time. Module-level `initializeApp()` crashes if env vars are missing → blank screen
- **Zustand store** — same shape as mobile `budgetStore.ts`, with added error states (`connectionError`, `budgetError`, `categoriesError`, `accountsError`)
- **Error surfacing** — every page shows `ErrorBanner` with retry on API failures; sidebar shows connection status dot
- **CSS custom properties** in `theme.css` — all design tokens from `visual-reference.html`
- **Google Fonts** loaded via `<link>` in `index.html` (Playfair Display, Source Code Pro, Source Sans 3)
- **Environment variables** — `VITE_*` prefix required for Vite to expose them to client code
- **DEV_MODE** — `VITE_DEV_MODE=true` bypasses Firebase auth on web (same as mobile EXPO_PUBLIC_DEV_MODE)
- **Production API** — web/.env must point to Railway URL: `VITE_API_BASE_URL=https://web-production-794b4.up.railway.app`
- **Firebase web config** differs from Android — web API key is `AIzaSyDxBuR6u9BB77C2fWHADBA6KC7CtvPoMIg`, NOT the Android key. Web app ID: `1:230366313824:web:47b3e3a77bb8090249b205`. See web/.env.example

### Backend (Express/TypeScript)
- Firebase Auth middleware (DEV_MODE falls back to user-1)
- Plaid cursor-based sync (iterates has_more loop)
- AES-256-GCM encryption for Plaid access tokens
- 4-priority categorization: merchant rule → historical → Plaid map → keyword → Uncategorized
- `ensureCategories()` shared service — seeds defaults before budget, sync, or category reads
- Firestore: use `.update()` for dot-notation nested paths, NOT `.set()` (creates flat keys)
- All routes under `/api/v1/`

### Data Flow
```
Plaid API → Express Backend (sync, encrypt, categorize) → Firestore
                                                             ↓
                                                   ┌────────┴────────┐
                                                   ↓                 ↓
                                            React Native        Vite/React Web
                                            (mobile app)        (web/ SPA)
```
Both clients use identical API endpoints (`/api/v1/*`) with Firebase ID tokens for auth.
CORS on Railway is `ALLOWED_ORIGINS=*` — supports both localhost dev and any deployed domain.

## Implementation Status

| Milestone | Name | Status |
|-----------|------|--------|
| **M0** | Foundation (theme, glass, nav, types, API) | **COMPLETE** |
| **M0B** | Backend Express/TypeScript | **COMPLETE** |
| **M1** | Transaction List Screen | **COMPLETE** |
| **M2** | Categorization (CategoryPicker) | **COMPLETE** |
| **M3** | Settings Screen | **COMPLETE** |
| **M4** | Budget Screen | **COMPLETE** |
| **M5** | Trending Column | **COMPLETE** |
| **M6** | Summary Bar Enhancement | **COMPLETE** |
| **M7** | Background Sync + Webhook | **COMPLETE** |
| **M8** | Trending Classification Engine | **COMPLETE** |
| **M9** | Edge Cases + Error Handling | PENDING |
| **M10** | Auth + Onboarding | **COMPLETE** (Firebase Auth + Google Sign-In) |
| **M11** | Behavioral Engine | PENDING |
| **M12** | IIN Module | PENDING |
| **Web** | Vite/React Web SPA (Budget, Transactions, Settings, Login) | **COMPLETE** |

## What NOT to Do

- Do NOT use red for negative states — use Midnight Navy (#2a3f52) per Bazley et al.
- Do NOT use emoji for icons — SVG only
- Do NOT use mock/fake data — real API calls or empty states
- Do NOT use pie charts, donut charts, gauges, or 3D effects
- Do NOT commit `.env`, `google-services.json`, or keystores
- Do NOT optimize for engagement metrics — optimize for savings rate delta
- Do NOT use shame language ("failed", "overspent") — use opportunity framing
- Do NOT add loss framing outside decision-context (NNR-06)
- Do NOT store amounts as floats — always cents (integer)
- Do NOT initialize Firebase at module load time on web — use lazy init pattern (blank screen crash)
- Do NOT use the Android Firebase API key for web — they are different keys (see web/.env.example)
- Do NOT design web layouts mobile-first with fixed 430px width — desktop-first with responsive breakpoint
- Do NOT silently swallow API errors — surface them with ErrorBanner + retry on every page
- Do NOT use expo-blur or any RN-only packages in web/ — pure CSS + standard npm packages only
- Do NOT hardcode localhost API URLs for web — use VITE_API_BASE_URL env var pointing to Railway production

## Living Documents

| File | Purpose | When to Update |
|------|---------|---------------|
| `CLAUDE.md` | Project context for Claude | Structure, stack, or pattern changes |
| `LESSONS_LEARNED.md` | Mistakes, solutions, gotchas | After every non-trivial fix or discovery |
| `DECISIONS.md` | Architecture Decision Records | When making or revisiting design choices |

## Development Workflow

See the Development Workflow section in the global `~/.claude/CLAUDE.md` for full automation details.

### Web Development
```bash
cd web
cp .env.example .env              # Fill in real values (see below)
npm install
npm run dev                       # http://localhost:5173
npm run build                     # Production build → dist/
```

**Required web/.env values (NOT committed — .gitignored):**
```
VITE_API_BASE_URL=https://web-production-794b4.up.railway.app
VITE_FIREBASE_API_KEY=AIzaSyDxBuR6u9BB77C2fWHADBA6KC7CtvPoMIg
VITE_FIREBASE_AUTH_DOMAIN=money-planner-ca2c0.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=money-planner-ca2c0
VITE_FIREBASE_STORAGE_BUCKET=money-planner-ca2c0.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=230366313824
VITE_FIREBASE_APP_ID=1:230366313824:web:47b3e3a77bb8090249b205
```

**For local dev without Firebase auth:** add `VITE_DEV_MODE=true` to web/.env (backend must also have DEV_MODE=true)

**Firebase Console setup for web:** The Firebase web app must be registered in Firebase Console → Project Settings → General → Your apps → Add app → Web. The config values above come from there. Firebase Auth automatically allows `localhost` as an authorized domain for Google Sign-In.

### CI/CD
- **Mobile Build:** GitHub Actions → `expo prebuild` → `./gradlew assembleRelease` → APK artifact
- **Signing:** CI generates ephemeral keystore, patches Expo-generated build.gradle
- **Secrets:** google-services.json, .env vars via GitHub Secrets
- **Backend Deploy:** Push to main → Railway auto-deploys (railway.json: `cd backend && npm run start`)
- **Web Deploy:** `cd web && npm run build` → deploy `dist/` to any static host (Netlify, Vercel, etc.)
