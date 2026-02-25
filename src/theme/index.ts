// OpenSpec v1.0 Design Tokens — extracted from OpenSpec_v1_0_Unified_Design.html
// DO NOT MODIFY without documenting deviation per mandate.

export const colors = {
  // Brand Layer (UI chrome only)
  brand: {
    deepSage: '#3a4a3f',       // Primary text, active icons, headers
    steelBlue: '#51697a',      // Interactive elements, links
    softTaupe: '#d6cec3',      // Borders, separators
    warmNude: '#c1b19f',       // Secondary UI chrome
    celadon: '#a8c0a8',        // Ambient backlight orbs
  },

  // Data Layer (semantic encoding only)
  data: {
    positive: '#51697a',       // On-track data
    positiveLight: '#7496b0',  // On-track states, IIN partial
    surplus: '#5B8A72',        // Positive, safe-to-spend, income
    warning: '#9A7B4F',        // Watch/over, attention (NO RED EVER)
    warningGlow: 'rgba(154,123,79,0.10)', // Amber glow backgrounds
    deficit: '#8B7260',        // Negative deltas
    neutral: '#8a8a8a',        // Inactive, labels, timestamps
  },

  // IIN-Specific
  iin: {
    liberated: '#5B8A72',      // Fully liberated expense badge
    partial: '#7496b0',        // Partially offset badge
    pending: '#9A7B4F',        // Pending capture badge
    captured: '#3a4a3f',       // Captured amount
  },

  // Backgrounds
  bg: {
    eggshell: '#f5f2ee',       // Primary app background
    cloud: '#eef2f1',          // Section backgrounds
    linen: '#e8e3da',          // Card alternative
    misty: '#d8dede',          // Progress bar backgrounds
  },

  // Functional (derived)
  white: '#ffffff',
  transparent: 'transparent',
} as const;

export const fonts = {
  display: 'PlayfairDisplay_600SemiBold',
  displayRegular: 'PlayfairDisplay_400Regular',
  body: 'SourceSans3_400Regular',
  bodyBold: 'SourceSans3_600SemiBold',
  data: 'SourceCodePro_500Medium',
  dataBold: 'SourceCodePro_600SemiBold',
} as const;

export const typography = {
  // Display heading: Playfair Display, 26px, 600
  displayHeading: {
    fontFamily: fonts.display,
    fontSize: 26,
    fontWeight: '600' as const,
    color: colors.brand.deepSage,
  },
  // Section title: Playfair Display, 20px, 600
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.brand.deepSage,
  },
  // Screen name: Playfair Display, 17px, 600
  screenName: {
    fontFamily: fonts.display,
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.brand.deepSage,
  },
  // Section header: Source Sans Pro, 11px, 600, uppercase, 0.8px tracking
  sectionHeader: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    color: colors.brand.deepSage,
  },
  // Body: Source Sans Pro, 14px, 400
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.brand.deepSage,
  },
  // Body bold: Source Sans Pro, 14px, 600
  bodyBold: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.brand.deepSage,
  },
  // Body small: Source Sans Pro, 12px, 400
  bodySmall: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '400' as const,
    color: colors.brand.deepSage,
  },
  // Hero metric: Source Code Pro, 28px, 600
  hero: {
    fontFamily: fonts.dataBold,
    fontSize: 28,
    fontWeight: '600' as const,
    color: colors.brand.deepSage,
  },
  // Data amount: Source Code Pro, 14px, 600
  dataAmount: {
    fontFamily: fonts.dataBold,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  // Data small: Source Code Pro, 11px, 500
  dataSmall: {
    fontFamily: fonts.data,
    fontSize: 11,
    fontWeight: '500' as const,
  },
  // Sublabel: 9px, neutral, 0.3px tracking
  sublabel: {
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
    color: colors.data.neutral,
  },
  // Subsmall: 8px, #999
  subsmall: {
    fontFamily: fonts.body,
    fontSize: 8,
    fontWeight: '400' as const,
    color: '#999999',
  },
  // Tab label: Source Sans Pro, 8px, 600, 0.2px tracking
  tabLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
} as const;

// Glassmorphism v3.1 — three-tier system
export const glass = {
  // Standard (.g): rgba(255,255,255,0.38), blur 24px, saturate 1.4
  standard: {
    backgroundColor: 'rgba(255,255,255,0.38)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    borderTopColor: 'rgba(255,255,255,0.70)',
    borderLeftColor: 'rgba(255,255,255,0.60)',
    // Note: backdrop-filter must be applied via BlurView in RN
  },
  // Strong (.gs): rgba(255,255,255,0.52), blur 32px, saturate 1.5
  strong: {
    backgroundColor: 'rgba(255,255,255,0.52)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.65)',
    borderTopColor: 'rgba(255,255,255,0.80)',
    borderLeftColor: 'rgba(255,255,255,0.70)',
  },
  // Inset (.gi): rgba(255,255,255,0.15), blur 14px, saturate 1.2
  inset: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    borderTopColor: 'rgba(255,255,255,0.30)',
    borderLeftColor: 'rgba(255,255,255,0.25)',
  },
  blur: {
    standard: 24,
    strong: 32,
    inset: 14,
  },
} as const;

// Glow variants for cards
export const glows = {
  surplus: {
    shadowColor: '#5B8A72',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  warning: {
    shadowColor: '#9A7B4F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 8,
  },
} as const;

// Spacing tokens
export const spacing = {
  xs: 3,
  sm: 4,
  md: 6,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 30,
  max: 40,
} as const;

// Border radius scale
export const radii = {
  micro: 2,
  small: 3,
  medium: 8,
  large: 14,
  xl: 18,
  xxl: 20,
  full: 9999,
} as const;

// Navigation bar constants
export const nav = {
  barHeight: 54,
  iconSize: 18,
  labelFontSize: 8,
} as const;

// Shadows
export const shadows = {
  card: {
    shadowColor: 'rgba(42,63,82,1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 4,
  },
  cardStrong: {
    shadowColor: 'rgba(42,63,82,1)',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 48,
    elevation: 6,
  },
  navBar: {
    shadowColor: 'rgba(42,63,82,1)',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
} as const;

// Ambient backlight orb positions for background
export const ambientOrbs = {
  celadon: 'rgba(168,192,168,0.3)',
  steelBlue: 'rgba(116,150,176,0.2)',
  taupe: 'rgba(214,206,195,0.25)',
  amber: 'rgba(154,123,79,0.15)',
} as const;
