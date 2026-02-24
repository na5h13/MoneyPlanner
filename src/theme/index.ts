// src/theme/index.ts
// MoneyPlanner Design System
// Glassmorphism + green-only palette + dark-first
// Core principle: green = healthy finances, less UI = better financial health

export const colors = {
  // Background layers (dark, rich depth for glassmorphism)
  bg: {
    primary: '#0A0F1C',
    secondary: '#111827',
    tertiary: '#1A2236',
  },

  // Green spectrum — the ONLY accent color family
  green: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Primary action color
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Neutrals (for text, borders, subtle elements)
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Semantic (minimal use — only for system states)
  semantic: {
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },

  // Glassmorphism
  glass: {
    background: 'rgba(255, 255, 255, 0.05)',
    backgroundHover: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.10)',
    borderLight: 'rgba(255, 255, 255, 0.15)',
  },

  // Text
  text: {
    primary: '#F9FAFB',
    secondary: '#9CA3AF',
    tertiary: '#6B7280',
    inverse: '#0A0F1C',
    accent: '#34D399',
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
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  // Font families (system fonts — fast, no loading)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  // Type scale
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 36,
    '4xl': 48,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Glassmorphism card presets
export const glassCard = {
  default: {
    backgroundColor: colors.glass.background,
    borderColor: colors.glass.border,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
  },
  elevated: {
    backgroundColor: colors.glass.backgroundHover,
    borderColor: colors.glass.borderLight,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
  },
} as const;

// Shadow presets (subtle, for depth without breaking glass effect)
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.green[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
