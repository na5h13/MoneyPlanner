# Keel Architecture Rules

## Component Patterns
- `GlassCard tier="standard|strong|inset"` — the ONLY glass container
- `AmountText` for ALL financial displays — cents to formatted, Source Code Pro, tabular-nums
- `Typography` variants from tokens.ts — hero, sectionHeader, body, dataLabel
- SVG-only icons (NavIcons.tsx) — NO emoji, NO icon libraries not in the spec
- `IINBadge status="liberated|partial|pending"` — must include transparency disclaimer

## File Organization
- `src/theme/tokens.ts` — SINGLE source of truth (write-protected)
- `src/components/ui/` — design system primitives
- `src/components/budget/` — budget-specific components
- `app/(tabs)/` — Expo Router file-based screens (budget, transactions, settings)
- `web/src/` — standalone Vite SPA (NOT Expo Web)
- `backend/src/` — Express/TypeScript API

## State Management
- Zustand 5.0 — same store shape mobile + web
- All amounts as **cents (integer)** — never floats
- Error states per slice (budgetError, transactionsError, etc.)
- DEV_MODE bypasses auth + phase gates

## Data Flow
Plaid API → Express → AES-256-GCM encrypt → Firestore ← Zustand ← React

## Key ADRs to Respect (from DECISIONS.md)
- ADR-006: Midnight Navy for negatives, not red
- ADR-003: Firestore (not PostgreSQL)
- ADR-005: Plaid SDK v12.8.0 with postinstall ESM patch
- ADR-014: Standalone Vite web app (not Expo Web)
- ADR-019: Express serves web SPA (single Railway deploy)
