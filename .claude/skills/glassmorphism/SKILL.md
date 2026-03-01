# Glassmorphism v3.1 Design System — Exact Token Values

> Load this skill when implementing ANY visual component.
> All values must come from src/theme/tokens.ts — never inline.

## Three Card Tiers (the ONLY glass containers)

### Standard (.g) — Primary cards
- background: rgba(255, 255, 255, 0.38)
- backdropFilter: blur(24px) saturate(1.4)
- border: directional (top+left brighter, bottom+right darker)
- borderRadius: 20px

### Strong (.gs) — Elevated/hero sections
- background: rgba(255, 255, 255, 0.52)
- backdropFilter: blur(32px) saturate(1.4)
- borderRadius: 24px

### Inset (.gi) — Nested/secondary elements
- background: rgba(255, 255, 255, 0.15)
- backdropFilter: blur(14px) saturate(1.4)
- borderRadius: 14px

## Ambient Background (behind all glass)
5-layer radial gradient — celadon, steel blue, taupe, nude, eggshell base

## Nav Bar
height: 54px, blur(28px), fill icons active / outline inactive

## Typography
- Display: Playfair Display (headers only)
- Body: Source Sans Pro
- Data: Source Code Pro (ALL numbers, font-variant-numeric: tabular-nums)

## NEVER: hardcoded blur/rgba/colors, custom glass variants, glass without ambient bg
