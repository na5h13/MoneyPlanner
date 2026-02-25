// src/theme/index.ts
// MoneyPlanner Design System — Glassmorphism v3.1
// Light / nude palette. Less UI = better financial health.
// Source of truth: OpenSpec_v1_0_Unified.md Section 12.1

export const colors = {
  brand: {
    deepSage: '#3a4a3f',
    steelBlue: '#51697a',
    softTaupe: '#d6cec3',
    warmNude: '#c1b19f',
    celadon: '#a8c0a8',
  },
  data: {
    surplus: '#5B8A72',
    positiveLight: '#7496b0',
    warning: '#9A7B4F',
    deficit: '#8B7260',
    neutral: '#8a8a8a',
  },
  bg: {
    eggshell: '#f5f2ee',
    cloud: '#eef2f1',
    linen: '#e8e3da',
    misty: '#d8dede',
    primary: '#f5f2ee',
    secondary: '#eef2f1',
    tertiary: '#e8e3da',
  },
  glass: {
    background: 'rgba(255, 255, 255, 0.38)',
    backgroundHover: 'rgba(255, 255, 255, 0.45)',
    backgroundStrong: 'rgba(255, 255, 255, 0.52)',
    backgroundInset: 'rgba(255, 255, 255, 0.15)',
    border: 'rgba(255, 255, 255, 0.72)',
    borderSubtle: 'rgba(255, 255, 255, 0.40)',
    borderBottom: 'rgba(214, 206, 195, 0.5)',
  },
  text: {
    primary: '#3a4a3f',
    secondary: '#51697a',
    tertiary: '#8a8a8a',
    inverse: '#f5f2ee',
    accent: '#5B8A72',
  },
  semantic: {
    error: '#C0392B',
    warning: '#9A7B4F',
    success: '#5B8A72',
    info: '#51697a',
  },
  // Legacy aliases for backwards compat
  green: {
    400: '#5B8A72',
    500: '#5B8A72',
  },
  neutral: {
    50: '#f5f2ee',
    100: '#eef2f1',
    200: '#e8e3da',
    300: '#d6cec3',
    400: '#c1b19f',
    500: '#8a8a8a',
    600: '#51697a',
    700: '#3a4a3f',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 9999,
} as const;

export const typography = {
  fontFamily: {
    display: 'Georgia', // Playfair Display fallback
    regular: 'System',
    semibold: 'System',
    mono: 'Courier',
    monoBold: 'Courier',
  },
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 32,
    '4xl': 40,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const glassCard = {
  default: {
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
  },
  strong: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderRadius: borderRadius.xl,
  },
  inset: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.40)',
    borderWidth: 1,
    borderRadius: borderRadius.md,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#3a4a3f',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#3a4a3f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#3a4a3f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
  },
  surplusGlow: {
    shadowColor: '#5B8A72',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
