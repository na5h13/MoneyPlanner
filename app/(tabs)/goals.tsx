// app/(tabs)/goals.tsx
// Phase 3 — Goal Creation screen stub.
// Full build in Phase 2 of the build plan.
// Section 21, Platform Screen 3.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/src/theme';
import { GlassCard } from '@/src/components/ui/GlassCard';

export default function GoalsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Goals</Text>

        <GlassCard tier="strong" style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyTitle}>Set your first goal</Text>
          <Text style={styles.emptyText}>
            Define up to 3 savings goals. Daily framing keeps motivation high.
          </Text>
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Create Goal</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.eggshell },
  container: { flex: 1, padding: spacing.lg },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: typography.fontFamily.display,
    letterSpacing: -0.5,
    marginBottom: spacing.xl,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptyText: {
    fontSize: typography.size.base,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
  addBtn: {
    backgroundColor: colors.brand.deepSage,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 999,
    marginTop: spacing.sm,
  },
  addBtnText: {
    fontSize: typography.size.base,
    fontWeight: '700',
    color: colors.text.inverse,
  },
});
