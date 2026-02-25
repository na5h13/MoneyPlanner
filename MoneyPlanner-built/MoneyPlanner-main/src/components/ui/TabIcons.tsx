// src/components/ui/TabIcons.tsx
// Tab bar icons — fill/outline paradigm per spec.
// Active = solid filled in deep sage (#3a4a3f)
// Inactive = stroke outline in neutral (#8a8a8a)

import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color: string;
  filled?: boolean;
}

export function HomeIcon({ size = 24, color, filled = false }: IconProps) {
  if (filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill={color} />
        <Rect x="9" y="14" width="6" height="7" rx="1" fill="white" opacity="0.5" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M9 21V14h6v7" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

export function BudgetIcon({ size = 24, color, filled = false }: IconProps) {
  if (filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="4" width="18" height="16" rx="2" fill={color} />
        <Rect x="6" y="9" width="6" height="1.5" rx="0.75" fill="white" opacity="0.8" />
        <Rect x="6" y="12" width="9" height="1.5" rx="0.75" fill="white" opacity="0.8" />
        <Rect x="6" y="15" width="4" height="1.5" rx="0.75" fill="white" opacity="0.8" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth={1.5} />
      <Path d="M7 9h5M7 12h8M7 15h4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function TransactionsIcon({ size = 24, color, filled = false }: IconProps) {
  if (filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M4 6h16M4 12h16M4 18h10" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        <Circle cx="19" cy="18" r="3" fill={color} />
        <Path d="M18 18l1 1 2-2" stroke="white" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M4 12h16M4 18h10" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx="19" cy="18" r="3" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

export function GoalsIcon({ size = 24, color, filled = false }: IconProps) {
  if (filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" fill={color} />
        <Circle cx="12" cy="12" r="5" fill="white" opacity="0.3" />
        <Circle cx="12" cy="12" r="2" fill="white" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.5} />
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth={1.5} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
    </Svg>
  );
}

export function IINIcon({ size = 24, color, filled = false }: IconProps) {
  if (filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" fill={color} />
        <Path d="M8 12l2.5 2.5L16 9" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 7v2M12 15v2" stroke="white" strokeWidth={1.5} strokeLinecap="round" opacity="0.6" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" stroke={color} strokeWidth={1.5} />
      <Path d="M9 12.5l2 2 4-4" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SettingsIcon({ size = 24, color, filled = false }: IconProps) {
  if (filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path fillRule="evenodd" clipRule="evenodd"
          d="M12 1l1.5 2.6c.4.7 1.2 1.1 2 .9l2.9-.8 1.5 2.6-2.1 2c-.6.5-.8 1.4-.5 2.1l1.2 2.7-2.6 1.5-1.8-2.3a2 2 0 00-2.2 0L11.6 15l-2.6-1.5 1.2-2.7c.3-.7.1-1.6-.5-2.1l-2.1-2L9 4.1l2.9.8c.8.2 1.6-.2 2-.9L15.5 1H12z"
          fill={color} />
        <Circle cx="12" cy="12" r="2.5" fill="white" opacity="0.7" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.5} />
      <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}
