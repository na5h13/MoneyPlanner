// Glassmorphism v3.1 components — from OpenSpec Design HTML
// Three tiers: Standard, Strong, Inset
// Directional borders: top+left brighter than bottom+right

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { glass, shadows, colors } from '@/src/theme';

type GlassTier = 'standard' | 'strong' | 'inset';

interface GlassCardProps {
  tier?: GlassTier;
  glow?: 'surplus' | 'warning';
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const blurIntensity: Record<GlassTier, number> = {
  standard: 24,
  strong: 32,
  inset: 14,
};

export function GlassCard({ tier = 'standard', glow, style, children }: GlassCardProps) {
  const tierStyle = glass[tier];
  const shadowStyle = tier === 'strong' ? shadows.cardStrong : tier === 'standard' ? shadows.card : {};

  const glowStyle: ViewStyle = glow === 'surplus'
    ? { borderColor: 'rgba(91,138,114,0.25)', shadowColor: '#5B8A72', shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 }
    : glow === 'warning'
    ? { borderColor: 'rgba(154,123,79,0.30)', shadowColor: '#9A7B4F', shadowOpacity: 0.30, shadowRadius: 14, elevation: 8 }
    : {};

  return (
    <View
      style={[
        styles.wrapper,
        {
          borderRadius: tierStyle.borderRadius,
          ...shadowStyle,
        },
        glowStyle,
        style,
      ]}
    >
      <BlurView
        intensity={blurIntensity[tier]}
        tint="light"
        style={[StyleSheet.absoluteFill, { borderRadius: tierStyle.borderRadius, overflow: 'hidden' }]}
      />
      <View
        style={[
          styles.content,
          {
            backgroundColor: tierStyle.backgroundColor,
            borderRadius: tierStyle.borderRadius,
            borderWidth: tierStyle.borderWidth,
            borderColor: tierStyle.borderColor,
            borderTopColor: tierStyle.borderTopColor,
            borderLeftColor: tierStyle.borderLeftColor,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

// Ambient backlight orbs — render behind glass cards
export function AmbientBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.ambientContainer}>
      {/* Celadon orb — top-left */}
      <View style={[styles.orb, styles.orbCeladon]} />
      {/* Steel blue orb — bottom-right */}
      <View style={[styles.orb, styles.orbSteelBlue]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    overflow: 'hidden',
  },
  ambientContainer: {
    flex: 1,
    backgroundColor: colors.bg.eggshell,
    position: 'relative',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orbCeladon: {
    width: 300,
    height: 300,
    top: -50,
    left: -80,
    backgroundColor: 'rgba(168,192,168,0.3)',
  },
  orbSteelBlue: {
    width: 250,
    height: 250,
    bottom: 100,
    right: -60,
    backgroundColor: 'rgba(116,150,176,0.2)',
  },
});
