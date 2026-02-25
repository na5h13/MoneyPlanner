// src/components/ui/GlassCard.tsx
// Three-tier glass card system per spec.
// Tier 1 (default): 38% white — standard cards
// Tier 2 (strong): 52% white — hero metrics
// Tier 3 (inset): 15% white — inner cells, search

import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { glassCard, shadows } from '@/src/theme';

type GlassTier = 'default' | 'strong' | 'inset';

interface GlassCardProps {
  children: React.ReactNode;
  tier?: GlassTier;
  style?: ViewStyle | ViewStyle[];
  shadow?: 'sm' | 'md' | 'lg' | 'none';
  surplusGlow?: boolean;
}

export function GlassCard({
  children,
  tier = 'default',
  style,
  shadow = 'md',
  surplusGlow = false,
}: GlassCardProps) {
  const cardStyle = glassCard[tier];
  const shadowStyle = surplusGlow
    ? shadows.surplusGlow
    : shadow !== 'none'
    ? shadows[shadow]
    : {};

  return (
    <View
      style={[
        styles.base,
        cardStyle,
        shadowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
