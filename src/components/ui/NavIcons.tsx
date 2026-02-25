// SVG Navigation Icons — 18x18px inline SVGs per OpenSpec Design HTML
// NO EMOJI (inconsistent cross-OS rendering)
// Active: deep sage filled | Inactive: neutral outlined

import React from 'react';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';
import { colors } from '@/src/theme';

interface IconProps {
  active?: boolean;
  size?: number;
}

const activeColor = colors.brand.deepSage;
const inactiveColor = colors.data.neutral;

// Wallet glyph — Budget tab
export function WalletIcon({ active = false, size = 18 }: IconProps) {
  const color = active ? activeColor : inactiveColor;
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      {active ? (
        // Filled variant
        <G>
          <Path
            d="M2 4.5C2 3.67 2.67 3 3.5 3H14.5C15.33 3 16 3.67 16 4.5V13.5C16 14.33 15.33 15 14.5 15H3.5C2.67 15 2 14.33 2 13.5V4.5Z"
            fill={color}
          />
          <Rect x="11" y="7.5" width="4" height="3" rx="1" fill={colors.bg.eggshell} />
        </G>
      ) : (
        // Outlined variant
        <G>
          <Path
            d="M2 4.5C2 3.67 2.67 3 3.5 3H14.5C15.33 3 16 3.67 16 4.5V13.5C16 14.33 15.33 15 14.5 15H3.5C2.67 15 2 14.33 2 13.5V4.5Z"
            stroke={color}
            strokeWidth={1.2}
          />
          <Rect x="11" y="7.5" width="4" height="3" rx="1" stroke={color} strokeWidth={1} />
        </G>
      )}
    </Svg>
  );
}

// Stacked receipt glyph — Transactions tab
export function ReceiptIcon({ active = false, size = 18 }: IconProps) {
  const color = active ? activeColor : inactiveColor;
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      {active ? (
        <G>
          <Path
            d="M4 2L3 3V15L4.5 14L6 15L7.5 14L9 15L10.5 14L12 15L13.5 14L15 15V3L14 2H4Z"
            fill={color}
          />
          <Path d="M6 6H12M6 8.5H12M6 11H10" stroke={colors.bg.eggshell} strokeWidth={1} strokeLinecap="round" />
        </G>
      ) : (
        <G>
          <Path
            d="M4 2L3 3V15L4.5 14L6 15L7.5 14L9 15L10.5 14L12 15L13.5 14L15 15V3L14 2H4Z"
            stroke={color}
            strokeWidth={1.2}
          />
          <Path d="M6 6H12M6 8.5H12M6 11H10" stroke={color} strokeWidth={1} strokeLinecap="round" />
        </G>
      )}
    </Svg>
  );
}

// Gear glyph — Settings tab
export function GearIcon({ active = false, size = 18 }: IconProps) {
  const color = active ? activeColor : inactiveColor;
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      {active ? (
        <G>
          <Path
            d="M9 1.5L10.3 3.1L12.3 2.7L12.7 4.7L14.7 5.3L13.9 7.2L15.5 8.7L14.1 10.3L14.9 12.2L12.9 12.8L12.7 14.8L10.7 14.6L9 16L7.3 14.6L5.3 14.8L5.1 12.8L3.1 12.2L3.9 10.3L2.5 8.7L4.1 7.2L3.3 5.3L5.3 4.7L5.7 2.7L7.7 3.1L9 1.5Z"
            fill={color}
          />
          <Circle cx="9" cy="9" r="2.5" fill={colors.bg.eggshell} />
        </G>
      ) : (
        <G>
          <Path
            d="M9 1.5L10.3 3.1L12.3 2.7L12.7 4.7L14.7 5.3L13.9 7.2L15.5 8.7L14.1 10.3L14.9 12.2L12.9 12.8L12.7 14.8L10.7 14.6L9 16L7.3 14.6L5.3 14.8L5.1 12.8L3.1 12.2L3.9 10.3L2.5 8.7L4.1 7.2L3.3 5.3L5.3 4.7L5.7 2.7L7.7 3.1L9 1.5Z"
            stroke={color}
            strokeWidth={1.2}
          />
          <Circle cx="9" cy="9" r="2.5" stroke={color} strokeWidth={1.2} />
        </G>
      )}
    </Svg>
  );
}
