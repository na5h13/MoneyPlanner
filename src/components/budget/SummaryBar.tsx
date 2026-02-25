// src/components/budget/SummaryBar.tsx
// Function 7 — Budget summary bar.
// Safe-to-spend hero metric (glass-strong card, surplus glow).
// Income / Committed / One-time breakdown (glass-inset cells).
// Section 21, Function 7.

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { colors, spacing, typography, borderRadius, shadows } from '@/src/theme';

interface SummaryBarProps {
  income: number;
  committed: number;
  oneTime: number;
  safeToSpend: number;
  daysRemaining: number;
  loading?: boolean;
}

export function SummaryBar({
  income,
  committed,
  oneTime,
  safeToSpend,
  daysRemaining,
  loading = false,
}: SummaryBarProps) {
  const isPositive = safeToSpend >= 0;
  const dailyRate = daysRemaining > 0 ? safeToSpend / daysRemaining : 0;

  function fmt(n: number): string {
    const abs = Math.abs(n);
    if (abs >= 1000) return `${n < 0 ? '-' : ''}$${(abs / 1000).toFixed(1)}k`;
    return `${n < 0 ? '-' : ''}$${abs.toFixed(0)}`;
  }

  return (
    <View style={styles.wrapper}>
      {/* Hero: safe-to-spend */}
      <GlassCard
        tier="strong"
        shadow="md"
        surplusGlow={isPositive}
        style={styles.heroCard}
      >
        {loading ? (
          <ActivityIndicator color={colors.brand.deepSage} />
        ) : (
          <>
            <Text style={styles.heroLabel}>Safe to Spend</Text>
            <Text style={[styles.heroAmount, isPositive ? styles.surplus : styles.deficit]}>
              {fmt(safeToSpend)}
            </Text>
            <Text style={styles.heroSub}>
              {daysRemaining > 0
                ? `${fmt(dailyRate)}/day · ${daysRemaining} days left`
                : 'End of period'}
            </Text>
          </>
        )}
      </GlassCard>

      {/* Breakdown row */}
      <View style={styles.breakdownRow}>
        <BreakdownCell label="Income" amount={income} color={colors.data.surplus} />
        <BreakdownCell label="Committed" amount={committed} color={colors.data.neutral} />
        <BreakdownCell label="One-time" amount={oneTime} color={colors.data.warning} />
      </View>
    </View>
  );
}

function BreakdownCell({ label, amount, color }: { label: string; amount: number; color: string }) {
  function fmt(n: number): string {
    const abs = Math.abs(n);
    if (abs >= 1000) return `$${(abs / 1000).toFixed(1)}k`;
    return `$${abs.toFixed(0)}`;
  }

  return (
    <GlassCard tier="inset" shadow="none" style={styles.breakdownCell}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={[styles.breakdownAmount, { color }]}>{fmt(amount)}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  heroLabel: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.data.neutral,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  heroAmount: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: typography.fontFamily.mono,
    letterSpacing: -2,
    marginBottom: 4,
  },
  surplus: {
    color: colors.data.surplus,
  },
  deficit: {
    color: colors.data.deficit,
  },
  heroSub: {
    fontSize: typography.size.sm,
    color: colors.data.neutral,
    fontFamily: typography.fontFamily.mono,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  breakdownCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.data.neutral,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  breakdownAmount: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    fontFamily: typography.fontFamily.mono,
  },
});
