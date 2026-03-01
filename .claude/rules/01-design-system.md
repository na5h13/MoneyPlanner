# Design System Rules — OpenSpec Section 3

## Glass Tiers (Glassmorphism v3.1)

ALL glass effects MUST use tokens. Three tiers only:

| Tier | Background | Blur | Saturate | Border | Use |
|------|-----------|------|----------|--------|-----|
| standard (.g) | rgba(255,255,255,0.38) | blur(24px) | saturate(1.4) | top+left brighter (0.5 alpha), bottom+right dimmer (0.18 alpha) | Primary cards, dashboard blocks |
| strong (.gs) | rgba(255,255,255,0.52) | blur(32px) | saturate(1.4) | Same directional pattern | Hero metrics, modal overlays |
| inset (.gi) | rgba(255,255,255,0.15) | blur(14px) | saturate(1.4) | Same directional pattern | Nested elements, input fields |

Box shadow on all: `0 8px 32px rgba(58,74,63,0.10)`. Border radius: 14px (pill).

## Color Encoding (MUST FOLLOW)

| Context | Color Token | Hex | When |
|---------|------------|-----|------|
| Positive/surplus | tokens.data.surplus | #5B8A72 | Income, savings, on-track |
| Positive light | tokens.data.positiveLight | #7496b0 | Secondary positive |
| Warning/attention | tokens.data.warning | #9A7B4F | 80% threshold, needs attention |
| Deficit/expense | tokens.data.deficit | #8B7260 | Spending categories |
| Neutral | tokens.data.neutral | #8a8a8a | Labels, inactive elements |
| RED — DECISION ONLY | tokens.semantic.error | #c0392b | ONLY: 100% breach, hard-stop, BEHIND goal. NEVER ambient. |

ALL color MUST be redundant — color + icon/arrow + text label. Never color-only encoding.

## Typography (3 families ONLY)

- Display: Playfair Display — section headers, hero numbers (28-48px)
- Body: Source Sans Pro — all body text, labels, descriptions (14px base)
- Data: Source Code Pro — ALL financial figures, amounts, percentages. MUST use `fontVariantNumeric: 'tabular-nums'`

Hero numbers: 28-48px. Section headers: 11px uppercase tracking 1.6px. Body: 14px/1.5. Data labels: 11px. Tiny: 8px.

## Cognitive Load Ceiling (NNR-10)

| View | Max Chunks | Max Decisions | Enforcement |
|------|-----------|---------------|-------------|
| Primary dashboard | 5 | 2 | Programmatic — collapse lowest-priority block |
| Weekly summary | 4 | 1 | Template-locked |
| Monthly review | 7 | 5 | Maximum allowed |
| Goal creation | 6 | 1 | Single-path flow |
| Escalation prompt | 2 | 1 | Binary choice only |

## Chart Constraints

BANNED: Pie, donut, 3D, gauge, speedometer, rainbow color map.
REQUIRED: Bullet chart (budget vs actual), diverging bar (surplus/deficit), Sankey (flow visualization).

## Nav Bar

Height: 54px. Backdrop: blur(28px) saturate(1.4). Icons: 18px, fill/outline paradigm (active = deep sage fill, inactive = neutral outline). Label: 8px below icon.

## Ambient Background

5-layer radial gradient orbs. NEVER flat white backgrounds on primary screens. See `tokens.ambient.backgroundGradient` for the exact CSS string.

## IIN Badge Styles

| Status | Background | Text Color | Prefix |
|--------|-----------|------------|--------|
| liberated | tokens.iin.liberated + 15% alpha | tokens.iin.liberated | ✓ Liberated |
| partial | tokens.iin.partial + 15% alpha | tokens.iin.partial | ◐ Partial |
| pending | tokens.iin.pending + 15% alpha | tokens.iin.pending | ○ Pending |

Every liberation badge MUST show: "Funds redirected — expense still active" (NNR-13).
