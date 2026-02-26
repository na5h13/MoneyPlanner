# Keel (MoneyPlanner) — Claude Context

> **Living Document** — Update whenever project structure, patterns, or conventions change.
> Claude reads this automatically. Keep it accurate for one-shot solutions.

## Project Overview

**Research-backed behavioral budgeting platform** connecting to Canadian banks via Plaid API. Grounded in peer-reviewed financial psychology (Thaler & Benartzi's SMarT, Madrian & Shea auto-enrollment, Locke & Latham goal theory). Measures success by **savings rate delta** — not engagement metrics.

**Target:** Expo React Native mobile app (iOS + Android) with Express/TypeScript backend.

## Architecture

```
┌─────────────────────────────────┐
│  Expo React Native App          │  ← Glassmorphic UI, Expo Router
│  ├── Plaid Link RN SDK         │  ← Bank account linking
│  ├── react-native-svg charts   │  ← Bullet, sparklines
│  ├── Zustand state management  │  ← Budget/transaction stores
│  └── Firebase Auth + Google    │  ← Authentication
├─────────────────────────────────┤
│  Express/TypeScript Backend     │  ← Business logic, categorization
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
│   │   │   ├── firebaseAdmin.ts      # Firebase Admin init
│   │   │   ├── plaidService.ts       # Plaid client wrapper
│   │   │   ├── categorization.ts     # 4-priority auto-categorization
│   │   │   └── ../utils/encryption.ts
│   │   └── routes/
│   │       ├── transactions.ts       # CRUD + sync + categorize
│   │       ├── categories.ts         # Category management
│   │       ├── budget.ts             # Budget targets + line items
│   │       ├── accounts.ts           # Plaid account linking
│   │       └── settings.ts           # User preferences
│   ├── package.json
│   └── tsconfig.json
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

### Backend (Express/TypeScript)
- Firebase Auth middleware (DEV_MODE falls back to user-1)
- Plaid cursor-based sync (iterates has_more loop)
- AES-256-GCM encryption for Plaid access tokens
- 4-priority categorization: merchant rule → historical → Plaid map → keyword → Uncategorized
- All routes under `/api/v1/`

### Data Flow
```
Plaid API → Express Backend (sync, encrypt, categorize) → Firestore → React Native (display)
```

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
| **M10** | Auth + Onboarding | PENDING |
| **M11** | Behavioral Engine | PENDING |
| **M12** | IIN Module | PENDING |

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

## Living Documents

| File | Purpose | When to Update |
|------|---------|---------------|
| `CLAUDE.md` | Project context for Claude | Structure, stack, or pattern changes |
| `LESSONS_LEARNED.md` | Mistakes, solutions, gotchas | After every non-trivial fix or discovery |
| `DECISIONS.md` | Architecture Decision Records | When making or revisiting design choices |

## Development Workflow

See the Development Workflow section in the global `~/.claude/CLAUDE.md` for full automation details.

### CI/CD
- **Build:** GitHub Actions → `expo prebuild` → `./gradlew assembleRelease` → APK artifact
- **Signing:** CI generates ephemeral keystore, patches Expo-generated build.gradle
- **Secrets:** google-services.json, .env vars via GitHub Secrets
