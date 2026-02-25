# OpenSpec v1.0 — Deterministic Implementation Checklist

> Phase 1 deliverable: Complete spec decomposition.
> No implementation begins until this checklist is reviewed and approved.

---

## 1. STYLE TOKENS (from Design HTML)

### 1.1 Color Palette

**Brand Layer (UI chrome only):**

| Token | Hex | Usage |
|-------|-----|-------|
| `--brand-deep-sage` | `#3a4a3f` | Primary text, active icons, headers |
| `--brand-steel-blue` | `#51697a` | Interactive elements, links |
| `--brand-soft-taupe` | `#d6cec3` | Borders, separators |
| `--brand-warm-nude` | `#c1b19f` | Secondary UI chrome |
| `--brand-celadon` | `#a8c0a8` | Ambient backlight orbs |

**Data Layer (semantic encoding only):**

| Token | Hex | Usage |
|-------|-----|-------|
| `--data-positive` | `#51697a` | On-track data |
| `--data-positive-light` | `#7496b0` | On-track states, IIN partial |
| `--data-surplus` | `#5B8A72` | Positive, safe-to-spend, IIN liberated |
| `--data-warning` | `#9A7B4F` | Watch/over, IIN pending, attention |
| `--data-warning-glow` | `rgba(154,123,79,0.10)` | Amber glow backgrounds |
| `--data-deficit` | `#8B7260` | Negative deltas (**no red, ever**) |
| `--data-neutral` | `#8a8a8a` | Inactive, labels, timestamps |

**IIN-Specific:**

| Token | Hex | Usage |
|-------|-----|-------|
| `--iin-liberated` | `#5B8A72` | Fully liberated expense badge |
| `--iin-partial` | `#7496b0` | Partially offset badge |
| `--iin-pending` | `#9A7B4F` | Pending capture badge |
| `--iin-captured` | `#3a4a3f` | Captured amount |

**Backgrounds:**

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-eggshell` | `#f5f2ee` | Primary app background |
| `--bg-cloud` | `#eef2f1` | Section backgrounds |
| `--bg-linen` | `#e8e3da` | Card alternative |
| `--bg-misty` | `#d8dede` | Progress bar backgrounds |

### 1.2 Typography

| Role | Font Family | Size Range | Weight |
|------|------------|------------|--------|
| Display | `Playfair Display`, Georgia, serif | 24–32px | 600 |
| Body | `Source Sans Pro`, sans-serif | 14–16px | 400/600 |
| Data | `Source Code Pro`, Courier New, monospace | 10–28px | 500/600 |

**Specific text styles from Design HTML:**
- Section headers (`.sh`): body font, 600 weight, 11px, uppercase, 0.8px letter-spacing, deep sage
- Hero metric (`.hero`): data font, 600 weight, 28px
- Sublabel (`.sl`): 9px, neutral, 0.3px letter-spacing
- Subsmall (`.ss`): 8px, #999

### 1.3 Glassmorphism v3.1

| Tier | Class | White Opacity | Blur | Saturate | Usage |
|------|-------|---------------|------|----------|-------|
| Standard | `.glass` / `.g` | 38% | 24px | 1.4 | Regular cards |
| Strong | `.glass-strong` / `.gs` | 52% | 32px | 1.5 | Hero cards, CTAs |
| Inset | `.glass-inset` / `.gi` | 15% | 14px | 1.2 | Nested inside cards |

**Directional borders:** top + left brighter than bottom + right.

**Glow variants:**
- `.glow-s` (surplus): green border glow `rgba(91,138,114,0.25)` + shadow `rgba(91,138,114,0.10)`
- `.glow-w` (warning): amber border glow `rgba(154,123,79,0.30)` + shadow `rgba(154,123,79,0.14)`

**Ambient backlight:** Radial gradient orbs behind cards using celadon, steel-blue, taupe, and amber at low opacity.

### 1.4 Navigation

**3-tab bottom bar:**
- Budget (wallet glyph) | Transactions (stacked receipt) | Settings (gear)
- Active: `--brand-deep-sage` filled SVG
- Inactive: `--data-neutral` outlined SVG
- Icons: 18x18px inline SVGs — **no emoji** (inconsistent cross-OS rendering)
- Bar height: 54px with blur backdrop

### 1.5 NNR Color Rules

| Rule | Constraint |
|------|-----------|
| **NNR-01** | NO RED in ambient displays. Use deep sage for negatives, amber for attention |
| **NNR-06** | Cognitive load ≤7 data chunks per primary view |
| **NNR-10** | Same as NNR-06 — cards collapse when ceiling exceeded |
| **NNR-13** | IIN liberation badges always include "Funds redirected" disclaimer |

---

## 2. ENVIRONMENT DEPENDENCIES

### 2.1 Frontend (.env)

| Variable | Purpose | Required |
|----------|---------|----------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase client config | Yes (for full build) |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase client config | Yes |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase client config | Yes |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase client config | Yes |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase client config | Yes |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase client config | Yes |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google Sign-In | Yes |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Google Sign-In | Yes |
| `EXPO_PUBLIC_PLAID_ENV` | sandbox / production | Yes |
| `EXPO_PUBLIC_PLAID_ANDROID_PACKAGE_NAME` | `com.na5h13.keel` | Yes |
| `EXPO_PUBLIC_API_BASE_URL` | Backend URL | Yes |
| `EXPO_PUBLIC_DEV_MODE` | Enable dev mode overrides | Dev only |

### 2.2 Backend (.env)

| Variable | Purpose | Required |
|----------|---------|----------|
| `PORT` | Server port | Yes (default 5050) |
| `PLAID_CLIENT_ID` | Plaid server-side key | Yes |
| `PLAID_SECRET` | Plaid server-side secret | Yes |
| `PLAID_ENV` | sandbox / production | Yes |
| `PLAID_WEBHOOK_URL` | Webhook callback URL | Production |
| `FIREBASE_PROJECT_ID` | Firebase project | Yes |
| `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` | SA key file path | Dev |
| `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` | SA key base64 | Production |
| `ENCRYPTION_KEY` | AES key for token encryption | Yes |
| `ALLOWED_ORIGINS` | CORS origins | Yes |
| `NODE_ENV` | development / production | Yes |

### 2.3 External Services

| Service | Purpose | Status |
|---------|---------|--------|
| Firebase Auth | User authentication | Configured |
| Cloud Firestore | Database | Configured |
| Plaid API | Bank connectivity, transactions | Configured |
| Google Sign-In | OAuth provider | Configured |
| FCM / APNs | Push notifications | Needs setup |
| BLS CPI API | Inflation data for IIN | Not yet integrated |

### 2.4 Config Files (already in repo)

| File | Purpose |
|------|---------|
| `google-services.json` | Firebase Android config (com.na5h13.keel) |
| `GoogleService-Info.plist` | Firebase iOS config |
| `app.json` | Expo config (name: Keel, package: com.na5h13.keel) |
| `eas.json` | EAS Build config |

---

## 3. DATA SCHEMAS (from OpenSpec)

### 3.1 Budget Tracker Core (Section 21)

```
Account {
  id, user_id, plaid_account_id, name, official_name,
  type, subtype, mask, balance_current, balance_available,
  balance_limit, hidden, last_synced_at
}

Transaction {
  id, plaid_transaction_id, user_id, account_id,
  amount, date, name, merchant_name, pending,
  payment_channel, plaid_category,
  category_id, category_confidence, is_recurring,
  is_income, display_merchant,
  synced_at, categorized_at, categorized_by
}

Category {
  id, user_id, name, icon, sort_order,
  is_default, is_income, includes, created_at, updated_at
}

CategoryRule {
  id, user_id, normalized_merchant, category_id,
  created_from_txn, created_at, updated_at
}

BudgetTarget {
  id, user_id, category_id, period_type,
  period_start, target_amount, is_suggested,
  created_at, updated_at
}

BudgetLineItem {
  id, user_id, category_id, display_name,
  linked_merchant, budget_amount, source,
  is_active, renamed_by_user, sort_order,
  created_at, updated_at, deleted_at
}

UserSettings {
  user_id, budget_period, currency,
  notifications_enabled, plaid_access_token,
  plaid_item_id, created_at, updated_at
}
```

### 3.2 Trending Classification (Section 22)

```
SpendingClassification {
  id, user_id, merchant_normalized, category_id,
  classification_type (FIXED|RECURRING_VARIABLE|TRUE_VARIABLE|UNCLASSIFIED),
  source (AUTO_DETECTED|USER_OVERRIDE), confidence,
  expected_amount, expected_day, amount_range_low,
  amount_range_high, reclassification_flag,
  last_evaluated, created_at, updated_at
}
```

### 3.3 IIN Module (Sections 12-20)

```
EmployerSignature {
  id, user_id, normalized_name, plaid_merchant_patterns,
  first_seen, last_seen, pay_frequency, baseline_amount,
  baseline_computed_at, is_primary, confidence
}

RaiseEvent {
  id, user_id, employer_id, detected_at, confirmed_at,
  status (PENDING|CONFIRMED|EXPIRED|REJECTED_BY_USER),
  previous_baseline, new_amount, per_period_delta,
  percentage_delta, gross_annual_raise, cpi_rate_at_detection,
  real_annual_raise, event_type, classification_confidence,
  consecutive_confirmations, iin_capture_id
}

RaiseCapture {
  id, user_id, raise_event_id, capture_rate,
  captured_annual, captured_per_period,
  remaining_annual, remaining_per_period,
  status (PENDING_GRACE_PERIOD|CAPTURE_ACTIVE|
          CAPTURE_REJECTED|CAPTURE_SUSPENDED|CAPTURE_COMPLETED),
  effective_date, activated_at, suspended_at,
  grace_period_bypassed, bypass_reason,
  ceiling_applied, actual_captured,
  expense_liberations, created_at, updated_at
}

ExpenseLiberation {
  id, user_id, raise_capture_id, merchant_name,
  expense_category, expense_annual_cost,
  liberation_type (FULL|PARTIAL), liberated_amount,
  liberation_percentage, label, badge_icon,
  visible, created_at, liberated_since,
  is_user_selected, algorithm_rank
}

UserIINSettings {
  user_id, iin_enabled, capture_rate, couples_mode_enabled,
  partner_user_id, onboarding_completed,
  consent_acknowledged_at, created_at, updated_at
}

UserExpenseRating {
  id, user_id, merchant_name, category,
  resentment_rating (1-5), excluded_from_liberation,
  rated_at, updated_at
}

IINAuditLog {
  id, user_id, action, details (JSONB),
  timestamp, ip_address
}

CachedCPIData {
  id, period, cpi_all_items, trailing_12mo_rate,
  fetched_at, source
}

ConsentRecord {
  user_id, consent_type, disclosure_version,
  acknowledged_at, ip_address, device_info, checkbox_text
}
```

### 3.4 Behavioral Engine (Sections 1-11)

```
IncomeEvent {
  user_id, detected_at, previous_amount, new_amount,
  delta_percentage, source (plaid|manual), confidence
}

Goal {
  user_id, name, target_amount, current_amount,
  deadline, commitment_statement, daily_amount,
  milestones, status, created_at
}

AutoTransfer {
  user_id, savings_rate_pct, destination_account_id,
  status (ARMED|ACTIVE|PAUSED), rate_change_history,
  created_at, updated_at
}

UserPhaseState {
  user_id, current_phase (0-5), phase_entered_at,
  transition_history, observation_start_date,
  automation_armed_date, goal_created_date
}
```

---

## 4. API ENDPOINTS (from OpenSpec)

### 4.1 Budget Tracker Endpoints (Section 21)

| Method | Endpoint | Function |
|--------|----------|----------|
| GET | `/api/v1/transactions` | List transactions (filters: month, category, search, type) |
| GET | `/api/v1/transactions/{id}` | Single transaction detail |
| PUT | `/api/v1/transactions/{id}/category` | Reassign category |
| POST | `/api/v1/transactions/sync` | Trigger Plaid sync |
| GET | `/api/v1/categories` | List categories |
| POST | `/api/v1/categories` | Create category |
| PUT | `/api/v1/categories/{id}` | Update category |
| DELETE | `/api/v1/categories/{id}` | Delete category |
| PUT | `/api/v1/categories/reorder` | Batch reorder |
| GET | `/api/v1/category-rules` | List merchant→category rules |
| DELETE | `/api/v1/category-rules/{id}` | Delete rule |
| GET | `/api/v1/budget` | Budget display for current period |
| GET | `/api/v1/budget?period=YYYY-MM` | Budget for specific period |
| POST | `/api/v1/budget/targets` | Set budget target |
| PUT | `/api/v1/budget/targets/{id}` | Update target |
| GET | `/api/v1/budget/suggestions` | System-suggested targets |
| POST | `/api/v1/budget/items` | Create line item |
| PUT | `/api/v1/budget/items/{id}` | Update line item |
| DELETE | `/api/v1/budget/items/{id}` | Delete line item |
| PUT | `/api/v1/budget/items/reorder` | Batch reorder |
| GET | `/api/v1/accounts` | List linked accounts |
| PUT | `/api/v1/accounts/{id}` | Update account (hide/show) |
| POST | `/api/v1/accounts/link` | Initiate Plaid Link |
| DELETE | `/api/v1/accounts/disconnect` | Disconnect Plaid |
| GET | `/api/v1/settings` | Get preferences |
| PUT | `/api/v1/settings` | Update preferences |
| POST | `/api/v1/export` | Generate CSV |

### 4.2 Trending Classification Endpoints (Section 22)

| Method | Endpoint | Function |
|--------|----------|----------|
| GET | `/api/v1/classifications` | All spending classifications |
| GET | `/api/v1/classifications/{merchant}` | Classification for merchant |
| PUT | `/api/v1/classifications/{id}` | User override |
| DELETE | `/api/v1/classifications/{id}` | Reset to auto-detect |
| POST | `/api/v1/classifications/evaluate` | Force re-evaluation |

### 4.3 IIN Endpoints (Section 17)

| Method | Endpoint | Function |
|--------|----------|----------|
| GET | `/api/v1/iin/status` | IIN status + eligibility |
| POST | `/api/v1/iin/enable` | Enable IIN (with consent) |
| POST | `/api/v1/iin/disable` | Disable IIN (immediate) |
| GET | `/api/v1/iin/settings` | IIN configuration |
| PUT | `/api/v1/iin/settings` | Update capture rate |
| GET | `/api/v1/iin/raises` | List raise events |
| GET | `/api/v1/iin/raises/{id}` | Raise event detail |
| POST | `/api/v1/iin/raises/{id}/accept` | Accept capture |
| POST | `/api/v1/iin/raises/{id}/reject` | Reject capture |
| PUT | `/api/v1/iin/raises/{id}/configure` | Update capture config |
| GET | `/api/v1/iin/liberations` | List liberations |
| GET | `/api/v1/iin/liberations/{id}` | Liberation detail |
| PUT | `/api/v1/iin/expenses/ratings` | Update resentment ratings |
| GET | `/api/v1/iin/expenses/recurring` | Recurring expenses |
| GET | `/api/v1/iin/audit-log` | Audit trail |
| GET | `/api/v1/iin/export` | Export CSV |
| POST | `/api/v1/iin/couples/invite` | Partner invite |
| POST | `/api/v1/iin/couples/accept` | Accept invite |
| POST | `/api/v1/iin/couples/confirm-raise` | Partner confirmation |
| GET | `/api/v1/system/cpi` | CPI data |

---

## 5. SCREEN INVENTORY (from Screen Map HTML)

### 5.1 Budget Tracker (3 screens — bottom tab navigation)

| Screen | Tab | Description |
|--------|-----|-------------|
| **Budget** | Budget (default) | Category cards, Budget + Trending columns, Summary bar |
| **Transactions** | Transactions | Date-grouped feed, search, filters, category reassignment |
| **Settings** | Settings | Accounts, categories, preferences, sync, export |

### 5.2 Core Platform (10 screens — phased unlock)

| ID | Screen | Phase | Gate |
|----|--------|-------|------|
| ONBOARD-01 | Welcome & Account Creation | 0 | App install |
| ONBOARD-02 | Plaid Link | 0 | Account created |
| S1 | Observation Dashboard | 1 | ≥1 account linked |
| S2 | Automation Setup | 2 | Phase 1 complete (28 days) |
| S3 | Goal Creation | 3 | Auto-transfer ARMED ≥7 days |
| S0/S4 | Home / Primary Dashboard | 4 | ≥1 goal + ≥1 budget cycle |
| S5 | Flow View — Sankey | 4 | Same as dashboard |
| S6 | Weekly Review | 4 | Auto-generated every Sunday |
| S7 | Category 80% Warning | 4 | Transaction pushes ≥80% |
| S8 | Category 100% Breach | 4 | Category exceeds 100% |
| S9 | Escalation Prompt | 5 | Income increase / goal complete |

### 5.3 IIN Module (9 screens — parallel track from Phase 4)

| ID | Screen | Trigger |
|----|--------|---------|
| IIN-01 | IIN Overview | IIN enabled → persistent |
| IIN-02 | Enable & Consent | User initiates activation |
| IIN-03 | Onboarding (Expense Rating) | After consent |
| IIN-04 | Raise Detection Confirmation | Raise detected |
| IIN-05 | Capture Configuration | From IIN-04 or IIN-07 |
| IIN-06 | Liberation Visualization | ≥1 capture active |
| IIN-07 | Advanced Controls | IIN settings access |
| IIN-08 | Legal & Transparency | Always accessible |
| DASH-MOD | Modified Dashboard (badges) | IIN active |

### 5.4 Phase 5 (2 additional screens)

| ID | Screen | Trigger |
|----|--------|---------|
| SOC-01 | Peer Benchmarking | User opts in |
| SOC-02 | Group Goals | User creates/joins group |

---

## 6. FUNCTIONAL REQUIREMENTS

### 6.1 Transaction Categorization Engine (Section 21, Function 3)

**4-priority auto-categorization pipeline:**
1. Exact merchant rule (user-created) → confidence 1.0
2. Historical pattern (same merchant categorized before) → confidence 0.95
3. Plaid category mapping → confidence varies
4. Keyword matching against category includes → confidence 0.70
5. Fallback: Uncategorized → confidence 0.0

**Default categories:** Home & Personal, Food & Transportation, Family, Loans & Debt, Entertainment & Other, Uncategorized

**Category bottom sheet:** Tap transaction → category picker → optional "Apply to all {merchant}" checkbox → creates CategoryRule

### 6.2 Budget Computation (Section 21, Function 5)

- Category cards with line items (merchant-grouped)
- Budget column: user-set targets per category per period
- Initial suggestion: 3-month average, rounded up to nearest $25
- Line item CRUD: add (inline editor), rename (long-press), delete (swipe-left)
- Safe-to-spend = Income - Committed

### 6.3 Trending Engine (Section 21, Function 6)

**Daily run-rate projection:**
```
trending = (spent_so_far / days_elapsed) * days_in_period
```

**Status assignment:**
- ON_TRACK: projected ≤ budget
- WATCH: projected ≤ budget × 1.10
- OVER: projected > budget × 1.10
- INSUFFICIENT_DATA: < 3 days elapsed
- NO_TARGET: no budget set

**Color encoding (NNR-01: no red):**
- ON_TRACK: deep sage (neutral)
- WATCH: amber `#9A7B4F` (subtle background)
- OVER: amber `#9A7B4F` (card glow)

### 6.4 Trending Classification (Section 22)

**Three behavior types:**
1. **FIXED**: Same amount ±5%, same day ±3 days, once/period → show known amount
2. **RECURRING_VARIABLE**: Once/period, amount varies → show 3-month average
3. **TRUE_VARIABLE**: Unpredictable → daily run-rate projection

**Auto-detection:** Requires 3+ months history. Uses coefficient of variation and posting day range.

**User override:** Long-press trending cell → classification picker. Override always wins.

**Indicators:** 📌 Fixed, 🔄 Recurring-Variable, (none) True Variable

### 6.5 Summary Bar (Section 21, Function 7)

```
Hero: SAFE TO SPEND = Income - Committed
Breakdown: INCOME | COMMITTED | ONE-TIME
```

### 6.6 Background Sync (Section 21, Function 8)

- Webhook-driven (Plaid TRANSACTIONS webhooks)
- Periodic fallback: every 4 hours
- On app open: if last_synced > 30 minutes
- Manual: "Sync Now" button

### 6.7 Raise Detection Engine (Section 13)

- Merchant name normalization (strip payroll prefixes, fuzzy match)
- Amount clustering (DBSCAN, ±5% tolerance)
- Frequency detection (weekly/biweekly/semi-monthly/monthly)
- Raise detection: ≥1.5% and ≥$25/period delta
- Classification: structural_raise, one_time_bonus, overtime_spike, noise
- Confirmation: 2+ consecutive elevated deposits required
- CPI adjustment: only above-CPI portion is capturable

### 6.8 Capture Logic (Section 14)

- Default rate: 50% of real raise (above CPI)
- Bounds: 30%–80% (NNR-11, hard-enforced)
- Grace period: 28 days (notifications at day 1, 7, 21)
- Auto-activates at day 28 if no user action
- Ceiling: 50% savings rate cap

### 6.9 Expense Liberation (Section 15)

- Recurring expense detection (≥3 occurrences, periodic intervals)
- Psychological weight scoring (resentment × salience × frequency × burden)
- Greedy matching: ranked expenses matched against captured amount
- FULL liberation (expense ≤ remaining) or PARTIAL (percentage offset)
- Mandatory disclaimer on every liberation element (NNR-13)

### 6.10 Phase State Machine (Section 4)

```
Phase 0: Onboarding → Phase 1: ≥1 account + ≥1 income deposit
Phase 1: Observation (28 days min) → Phase 2: user accepts exit
Phase 2: Automation → Phase 3: auto-transfer ARMED ≥7 days
Phase 3: Goal Anchoring → Phase 4: ≥1 goal + ≥1 budget cycle
Phase 4: Active Monitoring → Phase 5: ≥180 days since Phase 2
```

### 6.11 DEV_MODE (Section 10)

When `DEV_MODE=true`:
- Phase gates bypassed (all screens accessible)
- Observation timer → 0 days
- Automation ARMED delay → 0 days
- Income detection latency → immediate
- Grace period → 0 days
- CPI → fixed 3.0%
- Mock income events injectable

---

## 7. UI CONSTRAINTS

### 7.1 Global

- Portrait only (all screens)
- No red anywhere in ambient displays (NNR-01)
- ≤7 data chunks per primary view (NNR-06/10)
- Navigation icons are SVG, not emoji
- Glassmorphism with ambient backlight orbs
- Merchant names truncated at 24 characters with ellipsis
- All amounts in Source Code Pro monospace font
- Amount formatting: expenses show "-$X.XX" in deep sage; income shows "+$X.XX" in surplus green

### 7.2 Budget Screen Specific

- Category cards collapse/expand (tap header)
- Period navigation (month arrows)
- Progress bar per category: 4px height, 2px radius
- Budget marker: 2px vertical line at target position in `--brand-deep-sage`
- Amber glow on OVER category cards
- Amber background on WATCH line items
- Category header with icon + name + subtotal

### 7.3 Transaction Screen Specific

- Date-grouped, newest first
- Search with 300ms debounce
- Filter chips: All | Income | Pending
- Tap → category bottom sheet
- Pull-to-refresh → Plaid sync

### 7.4 Settings Screen Specific

- Accounts with type icon, last-4, balance
- Categories with drag handle (☰) for reorder
- Swipe-left to delete category (with confirmation)

---

## 8. DEVIATIONS FROM OPENSPEC (documented per mandate)

### 8.1 Database: Firestore vs PostgreSQL

**OpenSpec specifies:** PostgreSQL
**Implementation uses:** Cloud Firestore
**Justification:** User has existing Firebase/Firestore infrastructure configured with active project `money-planner-ca2c0`. Migrating to PostgreSQL would require new infrastructure provisioning and would break existing Plaid token storage. All OpenSpec data schemas will be implemented as Firestore collections with equivalent structure.

### 8.2 Backend: Express/TypeScript vs OpenSpec's implied Python

**OpenSpec mentions:** "Python → Plaid → Historical Txns" (Section 21, Function 1)
**Implementation uses:** Express/TypeScript
**Justification:** Existing backend is Express/TypeScript with working Plaid integration. The OpenSpec's Python reference is to the data pipeline, not the API server. Backend will remain Express/TypeScript.

### 8.3 Fonts: Google Fonts vs System Fonts

**OpenSpec specifies:** Playfair Display, Source Sans Pro, Source Code Pro (Google Fonts)
**Implementation:** Will use expo-google-fonts packages to load these exact fonts in the React Native app.
**Deviation:** None — exact fonts will be used.

### 8.4 Navigation Icons: SVG vs Emoji

**OpenSpec specifies:** Inline SVGs, 18x18px
**Implementation:** Will use `react-native-svg` for custom SVG icons per the exact specifications in the Design HTML.
**Deviation:** None.

### 8.5 App Identity

**OpenSpec names:** "MoneyPlanner"
**Current app:** "Keel" (com.na5h13.keel)
**Justification:** User renamed the app. All internal references use "Keel" branding. OpenSpec logic and behavior are unchanged.

---

## 9. DETERMINISTIC IMPLEMENTATION ORDER

The OpenSpec mandates: **"Build one function at a time."**
The app is **"usable after Function 4 and feature-complete after Function 7."**

### MILESTONE 0: Foundation (prerequisite)

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 0.1 | Replace theme file with OpenSpec design tokens | `src/theme/index.ts` | — |
| 0.2 | Install Google Fonts (Playfair Display, Source Sans Pro, Source Code Pro) | `package.json`, font config | — |
| 0.3 | Create glass morphism component library | `src/components/ui/Glass.tsx` | 0.1 |
| 0.4 | Create SVG navigation icons | `src/components/ui/NavIcons.tsx` | — |
| 0.5 | Rebuild tab layout with 3-tab bottom bar (Budget, Transactions, Settings) | `app/(tabs)/_layout.tsx` | 0.1, 0.4 |
| 0.6 | Create shared UI primitives (text styles, amount formatting) | `src/components/ui/` | 0.1, 0.2 |
| 0.7 | Set up Zustand stores for budget data | `src/stores/budgetStore.ts` | — |
| 0.8 | Set up API service layer | `src/services/api.ts` | — |

### MILESTONE 1: Function 2 — Transaction List Screen

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 1.1 | Transaction list UI with date grouping | `app/(tabs)/transactions.tsx` | 0.* |
| 1.2 | Month navigation (arrows + swipe) | same | 1.1 |
| 1.3 | Search bar with 300ms debounce | same | 1.1 |
| 1.4 | Filter chips (All / Income / Pending) | same | 1.1 |
| 1.5 | Amount formatting (Plaid convention) | `src/utils/formatAmount.ts` | — |
| 1.6 | Transaction row component | `src/components/budget/TransactionRow.tsx` | 0.3, 1.5 |
| 1.7 | Pull-to-refresh → sync | same | 1.1 |
| 1.8 | Loading/empty/error/offline states | same | 1.1 |
| 1.9 | Backend: GET `/api/v1/transactions` | `backend/src/routes/transactions.ts` | — |
| 1.10 | Backend: POST `/api/v1/transactions/sync` | same | — |

### MILESTONE 2: Function 3 — Categorization Engine

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 2.1 | Default category seed data | `src/constants/categories.ts` | — |
| 2.2 | Auto-categorization pipeline (4-priority) | `backend/src/services/categorization.ts` | — |
| 2.3 | Category bottom sheet UI | `src/components/budget/CategoryPicker.tsx` | 0.3 |
| 2.4 | "Apply to all" checkbox for bulk reassignment | same | 2.3 |
| 2.5 | CategoryRule creation on manual assignment | backend | 2.2 |
| 2.6 | Plaid-to-app category mapping table | backend | 2.2 |
| 2.7 | Keyword matching engine | backend | 2.2 |
| 2.8 | Backend: category CRUD endpoints | `backend/src/routes/categories.ts` | — |
| 2.9 | Backend: PUT `/api/v1/transactions/{id}/category` | backend | 2.2 |
| 2.10 | Transaction tap → bottom sheet integration | `app/(tabs)/transactions.tsx` | 2.3 |

### MILESTONE 3: Function 4 — Settings Screen

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 3.1 | Accounts list with balances | `app/(tabs)/settings.tsx` | 0.3 |
| 3.2 | Plaid Link integration (add account) | same | — |
| 3.3 | Account hide/show toggle | same | 3.1 |
| 3.4 | Category management (create, edit, delete, reorder) | same | 2.1 |
| 3.5 | Category edit sheet (name, icon, keywords) | `src/components/budget/CategoryEditor.tsx` | 0.3 |
| 3.6 | Preferences (budget period, currency, notifications) | same | 3.1 |
| 3.7 | Manual sync button | same | 1.10 |
| 3.8 | CSV export | backend + frontend | — |
| 3.9 | Plaid disconnect with confirmation | same | 3.1 |
| 3.10 | Backend: settings + accounts endpoints | backend | — |

### MILESTONE 4: Function 5 — Budget Screen (Budget Column)

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 4.1 | Budget screen with scrollable category cards | `app/(tabs)/budget.tsx` | 0.3, 2.1 |
| 4.2 | Category header with icon, name, subtotal | `src/components/budget/CategoryCard.tsx` | 0.3 |
| 4.3 | Line items within cards (merchant-grouped) | same | 4.2 |
| 4.4 | Budget column with user-set targets | same | 4.1 |
| 4.5 | Tap-to-edit budget target (number input) | same | 4.4 |
| 4.6 | Long-press to rename line item | same | 4.3 |
| 4.7 | Swipe-left to delete line item | same | 4.3 |
| 4.8 | "+ Add item" row at bottom of each card | same | 4.3 |
| 4.9 | Initial budget suggestion (historical average) | backend | 4.4 |
| 4.10 | Category card collapse/expand | same | 4.2 |
| 4.11 | Period navigation (month arrows) | same | 4.1 |
| 4.12 | Backend: budget endpoints | `backend/src/routes/budget.ts` | — |

**APP IS USABLE AT THIS POINT**

### MILESTONE 5: Function 6 — Trending Column

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 5.1 | Trending computation (daily run-rate) | `backend/src/services/trending.ts` | — |
| 5.2 | Trending column in budget category cards | `src/components/budget/CategoryCard.tsx` | 4.2 |
| 5.3 | Category progress bar (actual + projected + marker) | same | 5.2 |
| 5.4 | Progress bar color encoding | same | 5.3 |
| 5.5 | Line-item level trending | same | 5.2 |
| 5.6 | Status assignment (ON_TRACK, WATCH, OVER) | backend + frontend | 5.1 |
| 5.7 | Amber glow on OVER categories | same | 5.6 |
| 5.8 | "Early estimate" label for first 3 days | same | 5.6 |
| 5.9 | Past-period shows actual (not projected) | same | 5.1 |

### MILESTONE 6: Function 7 — Summary Bar

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 6.1 | Summary bar component (glass-strong, glow border) | `src/components/budget/SummaryBar.tsx` | 0.3 |
| 6.2 | Safe-to-spend computation | backend + frontend | 5.1 |
| 6.3 | Income/committed/one-time breakdown | same | 6.2 |
| 6.4 | Color encoding by sign | same | 6.1 |
| 6.5 | One-time detection (non-recurring > threshold) | backend | — |

**APP IS FEATURE-COMPLETE AT THIS POINT**

### MILESTONE 7: Function 8 — Background Sync + Push

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 7.1 | Plaid webhook listener | backend | — |
| 7.2 | Periodic sync fallback (4-hour interval) | backend | — |
| 7.3 | Sync-on-open (if stale >30 min) | frontend | — |
| 7.4 | Trending recomputation on new transactions | backend | 5.1 |
| 7.5 | Push notification service (FCM) | backend + frontend | — |
| 7.6 | Notification frequency capping | backend | 7.5 |

### MILESTONE 8: Trending Classification Engine (Section 22)

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 8.1 | SpendingClassification schema | backend | — |
| 8.2 | Auto-detection algorithm (3-month history) | `backend/src/services/classification.ts` | — |
| 8.3 | Fixed item trending (posted vs expected) | backend + frontend | 8.2 |
| 8.4 | Recurring-variable trending (3-month average) | backend + frontend | 8.2 |
| 8.5 | Composite category trending | backend + frontend | 8.3, 8.4 |
| 8.6 | Classification indicators (📌, 🔄) | frontend | 8.2 |
| 8.7 | User override bottom sheet (long-press) | frontend | 8.6 |
| 8.8 | Reclassification monitoring | backend | 8.2 |
| 8.9 | Classification API endpoints | backend | 8.2 |

### MILESTONE 9: Function 9+10 — Edge Cases + Production Hardening

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 9.1 | Plaid error handling (all documented codes) | backend + frontend | — |
| 9.2 | Offline mode with cached data | frontend | — |
| 9.3 | Plaid Link re-authentication flow | frontend | — |
| 9.4 | Duplicate transaction prevention | backend | — |
| 9.5 | Pending transaction handling | backend | — |
| 9.6 | Budget edge case guards | backend + frontend | — |
| 9.7 | Encryption verification | backend | — |
| 9.8 | Accessibility audit (VoiceOver / TalkBack) | frontend | — |

### MILESTONE 10: Auth + Onboarding (Section 4, Phases 0-1)

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 10.1 | Welcome & Account Creation screen | `app/(auth)/` | — |
| 10.2 | Firebase Auth integration (Google Sign-In) | `src/services/auth.ts` | — |
| 10.3 | Plaid Link onboarding flow | `app/(modals)/connect-bank.tsx` | — |
| 10.4 | Phase state machine | `src/stores/phaseStore.ts` | — |
| 10.5 | Phase-gated navigation (hide locked screens) | `app/(tabs)/_layout.tsx` | 10.4 |
| 10.6 | Observation dashboard (Phase 1) | `app/(tabs)/index.tsx` | 0.3 |

### MILESTONE 11: Behavioral Engine (Sections 1-11, Phases 2-5)

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 11.1 | Automation Setup screen (Phase 2) | new screen | 10.4 |
| 11.2 | Goal Creation screen (Phase 3) | new screen | 10.4 |
| 11.3 | Home Dashboard (Phase 4) — 5-block F-pattern | new screen | 10.4 |
| 11.4 | Sankey Flow View (Phase 4) | new screen | 10.4 |
| 11.5 | Weekly Review (Phase 4) | new screen | 10.4 |
| 11.6 | Category 80% Warning (triggered) | modal | — |
| 11.7 | Category 100% Breach (triggered) | modal | — |
| 11.8 | Escalation Prompt (Phase 5) | modal | 10.4 |

### MILESTONE 12: IIN Module (Sections 12-20)

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 12.1 | Feature flag architecture (IIN_ENABLED) | backend + frontend | — |
| 12.2 | Raise Detection Engine | `backend/src/services/raiseDetection.ts` | — |
| 12.3 | Capture Logic Engine | `backend/src/services/captureLogic.ts` | 12.2 |
| 12.4 | Expense Liberation Engine | `backend/src/services/expenseLiberation.ts` | 12.3 |
| 12.5 | IIN-01: Overview screen | new screen | 12.1 |
| 12.6 | IIN-02: Enable/Disable toggle | new screen | 12.1 |
| 12.7 | IIN-03: Onboarding (Expense Rating) | new screen | 12.6 |
| 12.8 | IIN-04: Raise Detection Confirmation | new screen | 12.2 |
| 12.9 | IIN-05: Capture Configuration | new screen | 12.3 |
| 12.10 | IIN-06: Liberation Visualization | new screen | 12.4 |
| 12.11 | IIN-07: Advanced Controls | new screen | 12.1 |
| 12.12 | IIN-08: Legal & Transparency | new screen | — |
| 12.13 | DASH-MOD: Dashboard badge overlay | modification | 12.4 |
| 12.14 | IIN API endpoints (19 endpoints) | backend | 12.1–12.4 |
| 12.15 | Grace period processor (cron job) | backend | 12.3 |
| 12.16 | Couples mode | backend + frontend | 12.1 |

---

## 10. ACCEPTANCE TESTS (from OpenSpec)

### 10.1 Budget Tracker (Section 21, Function 10)

| ID | Test | Pass Criteria |
|----|------|--------------|
| AT-01 | Transactions display from Plaid | Visible within 60s of sync |
| AT-02 | Transaction search | Known merchant returns matches |
| AT-03 | Category reassignment persists | Sticks after restart |
| AT-04 | Merchant rule auto-categorizes | New txn from known merchant correct |
| AT-05 | Budget target editable | Set → persist → summary updates |
| AT-06 | Trending projection computes | Day 5+ → values visible |
| AT-07 | Safe-to-spend accurate | Income - committed = displayed |
| AT-08 | Offline mode functional | Cached data visible; "Offline" badge |
| AT-09 | Month navigation works | Previous month correct |
| AT-10 | No red in any screen | Zero red elements |
| AT-11 | Category CRUD complete | Create, rename, reorder, delete |
| AT-12 | Push notification fires | Trending OVER → notification |
| AT-13 | Plaid re-auth works | Re-auth banner → reconnect |
| AT-14 | CSV export contains all data | All transactions with categories |
| AT-15 | Cognitive load ≤7 chunks | Collapsed budget ≤7 visible |

### 10.2 Trending Classification (Section 22)

| ID | Test | Pass Criteria |
|----|------|--------------|
| TC-01 | Mortgage → FIXED | confidence ≥ 0.90 |
| TC-02 | Electricity → RECURRING_VARIABLE | 3+ months varying |
| TC-03 | Groceries → TRUE_VARIABLE | 8+ txns/month |
| TC-04 | Fixed posted → ✓ actual | Shows actual amount |
| TC-05 | Fixed not posted → expected | Lighter text |
| TC-06 | Recurring not posted → ~estimate | Shows ~$X |
| TC-07 | Category trending = sum of types | Correct composite |
| TC-08 | Override persists | Still set next month |
| TC-09 | Reset to auto-detect | System reclassifies |
| TC-10 | Behavior change → flag | "?" indicator |
| TC-11 | <3 months → UNCLASSIFIED | Daily rate fallback |
| TC-12 | <3 months graceful fallback | TRUE_VARIABLE behavior |

### 10.3 IIN (Section 20)

| ID | Test | Pass Criteria |
|----|------|--------------|
| AC-IIN-001 | Enable requires consent | Cannot activate without checkbox |
| AC-IIN-002 | Disable is immediate, 1-tap | ≤1 second |
| AC-IIN-003 | Capture rate bounded 30–80% | API rejects out-of-bounds |
| AC-IIN-004 | CPI floor prevents sub-inflation | capturable_amount = 0 |
| AC-IIN-005 | Grace period 28 days | No early activation without bypass |
| AC-IIN-006 | Liberation badges have disclaimer | ⓘ links to disclosure |
| AC-IIN-007 | Couples blocks unilateral | Partner confirmation required |
| AC-IIN-008 | Feature flag enforced | IIN_ENABLED=false → 403 |
| AC-IIN-009 | Raise reversal suspends | CAPTURE_SUSPENDED |
| AC-IIN-010 | Variable-income excluded | CV > 0.15 → disabled |
| AC-IIN-011 | Audit log immutable | Update/delete rejected |
| AC-IIN-012 | IIN no Plaid writes | Zero write API calls |
| AC-IIN-013 | Liberation matching correct | Greedy algorithm verified |
| AC-IIN-014 | Dashboard ≤7 chunks | With IIN badges |
| AC-IIN-015 | Accessibility passes | VoiceOver + TalkBack |

---

## 11. CRITICAL INVARIANTS

1. **Layer 1 never regresses.** If automation is activated, it runs indefinitely regardless of user engagement.
2. **No screen in a later phase is accessible before its gate conditions are met.** UI physically hides locked elements — no "coming soon."
3. **No red. Ever. In ambient displays.** Amber is the maximum severity color.
4. **IIN does NOT write to Plaid.** Read-only. No transfers, no modifications.
5. **Disable = immediate.** No cooling period, no confirmation chain, no guilt copy.
6. **All amounts in cents (integer) in API responses** to avoid floating-point precision.
7. **DEV_MODE bypasses all phase gates and timing constraints** for development.

---

*This checklist extracts every functional requirement, UI constraint, style token, and environment dependency from the OpenSpec v1.0 Unified (5,464 lines), Design HTML (537 lines), and Screen Map HTML (311 lines). Implementation proceeds in milestone order. Any deviation from the OpenSpec is documented in Section 8.*

*Ready for review.*
