// Summary Bar placeholder — OpenSpec Section 21, Function 7
// Hero: SAFE TO SPEND = Income - Committed
// Breakdown: INCOME | COMMITTED | ONE-TIME
// Glass-strong with glow border

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassCard } from '@/src/components/ui/Glass';
import { HeroText, SectionHeader, Sublabel, DataText } from '@/src/components/ui/Typography';
import { colors, spacing, fonts } from '@/src/theme';
import { formatAmount, amountColor } from '@/src/utils/formatAmount';

interface SummaryBarProps {
  income: number;       // cents
  committed: number;    // cents
  safeToSpend: number;  // cents
}

export function SummaryBar({ income, committed, safeToSpend }: SummaryBarProps) {
  return (
    <GlassCard
      tier="strong"
      glow={safeToSpend > 0 ? 'surplus' : safeToSpend < 0 ? 'warning' : undefined}
      style={styles.card}
    >
      <View style={styles.content}>
        <SectionHeader style={styles.label}>SAFE TO SPEND</SectionHeader>
        <HeroText style={{ color: amountColor(-safeToSpend) }}>
          {formatAmount(-safeToSpend)}
        </HeroText>

        <View style={styles.breakdown}>
          <View style={styles.breakdownItem}>
            <Sublabel style={styles.breakdownLabel}>INCOME</Sublabel>
            <DataText style={[styles.breakdownValue, { color: colors.data.surplus }]}>
              {formatAmount(-income)}
            </DataText>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownItem}>
            <Sublabel style={styles.breakdownLabel}>COMMITTED</Sublabel>
            <DataText style={[styles.breakdownValue, { color: colors.brand.deepSage }]}>
              {formatAmount(committed)}
            </DataText>
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.xl,
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  label: {
    marginBottom: spacing.sm,
  },
  breakdown: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.xl,
    alignItems: 'center',
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 8,
    fontWeight: '600',
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 13,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.brand.softTaupe,
  },
});
