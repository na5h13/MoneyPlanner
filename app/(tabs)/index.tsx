// app/(tabs)/index.tsx
// Home Dashboard — Phase 4 primary screen.
// Safe-to-spend hero, goal bullets, category bars, 7-day lookahead.
// "The less you see here, the healthier your finances."

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '@/src/theme';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { budgetService } from '@/src/services/budget';
import { useAuthStore } from '@/src/stores/authStore';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [safeToSpend, setSafeToSpend] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    budgetService.getSafeToSpend()
      .then((d) => setSafeToSpend(d.safe_to_spend))
      .catch(() => setSafeToSpend(847))
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.displayName?.split(' ')[0] || '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {greeting}{firstName ? `, ${firstName}` : ''}
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Safe-to-spend hero */}
        <GlassCard
          tier="strong"
          style={styles.heroCard}
          surplusGlow={(safeToSpend ?? 0) > 0}
        >
          <View style={styles.automationBadge}>
            <Text style={styles.automationBadgeText}>● Automated</Text>
          </View>
          {loading ? (
            <ActivityIndicator color={colors.brand.deepSage} size="large" />
          ) : (
            <>
              <Text style={styles.heroLabel}>Safe to Spend Today</Text>
              <Text style={[
                styles.heroAmount,
                (safeToSpend ?? 0) >= 0 ? styles.surplus : styles.deficit,
              ]}>
                ${Math.abs(safeToSpend ?? 0).toFixed(0)}
              </Text>
              <Text style={styles.heroSub}>
                {(safeToSpend ?? 0) >= 0
                  ? 'Your finances are on track'
                  : 'Consider adjusting spending'}
              </Text>
            </>
          )}
        </GlassCard>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <StatCard label="This Month" value="$2,140" sublabel="spent" color={colors.data.neutral} />
          <StatCard label="Savings Rate" value="18%" sublabel="of income" color={colors.data.positiveLight} />
          <StatCard label="Streak" value="23d" sublabel="on budget" color={colors.data.surplus} />
        </View>

        {/* Category health bars */}
        <Text style={styles.sectionTitle}>Category Health</Text>
        <GlassCard style={styles.healthCard}>
          {MOCK_CATEGORIES.map((cat, idx) => (
            <React.Fragment key={cat.name}>
              <CategoryBar {...cat} />
              {idx < MOCK_CATEGORIES.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </GlassCard>

        {/* Upcoming */}
        <Text style={styles.sectionTitle}>Coming Up</Text>
        <GlassCard style={styles.upcomingCard}>
          {MOCK_UPCOMING.map((item, idx) => (
            <React.Fragment key={item.name}>
              <View style={styles.upcomingRow}>
                <Text style={styles.upcomingIcon}>{item.icon}</Text>
                <View style={styles.upcomingInfo}>
                  <Text style={styles.upcomingName}>{item.name}</Text>
                  <Text style={styles.upcomingDate}>{item.date}</Text>
                </View>
                <Text style={styles.upcomingAmount}>${item.amount}</Text>
              </View>
              {idx < MOCK_UPCOMING.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </GlassCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, sublabel, color }: { label: string; value: string; sublabel: string; color: string }) {
  return (
    <GlassCard tier="inset" style={styles.statCard} shadow="none">
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statSub}>{sublabel}</Text>
    </GlassCard>
  );
}

function CategoryBar({ name, spent, budget, icon }: { name: string; spent: number; budget: number; icon: string }) {
  const pct = Math.min(spent / budget, 1);
  const over = spent > budget;
  const barColor = over ? colors.data.warning : colors.data.surplus;

  return (
    <View style={styles.catRow}>
      <Text style={styles.catIcon}>{icon}</Text>
      <View style={styles.catInfo}>
        <View style={styles.catLabelRow}>
          <Text style={styles.catName}>{name}</Text>
          <Text style={[styles.catAmt, over && { color: colors.data.warning }]}>
            ${spent} / ${budget}
          </Text>
        </View>
        <View style={styles.catBarBg}>
          <View style={[styles.catBarFill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
        </View>
      </View>
    </View>
  );
}

const MOCK_CATEGORIES = [
  { name: 'Food', spent: 387, budget: 550, icon: '🛒' },
  { name: 'Transport', spent: 156, budget: 196, icon: '🚌' },
  { name: 'Bills', spent: 163, budget: 163, icon: '📱' },
  { name: 'Entertainment', spent: 68, budget: 100, icon: '🎬' },
];

const MOCK_UPCOMING = [
  { name: 'Rent', date: 'Mar 1', amount: '1,800', icon: '🏠' },
  { name: 'Phone bill', date: 'Mar 3', amount: '70', icon: '📱' },
  { name: 'Netflix', date: 'Mar 7', amount: '16', icon: '🎬' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.eggshell },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.size['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: typography.fontFamily.display,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: typography.size.sm,
    color: colors.data.neutral,
    marginTop: 4,
  },
  heroCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  automationBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(91,138,114,0.15)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  automationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.data.surplus,
  },
  heroLabel: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.data.neutral,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 56,
    fontWeight: '700',
    fontFamily: typography.fontFamily.mono,
    letterSpacing: -3,
    marginBottom: 6,
  },
  surplus: { color: colors.data.surplus },
  deficit: { color: colors.data.deficit },
  heroSub: {
    fontSize: typography.size.sm,
    color: colors.data.neutral,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.data.neutral,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    fontFamily: typography.fontFamily.mono,
    marginBottom: 2,
  },
  statSub: {
    fontSize: 10,
    color: colors.data.neutral,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.data.neutral,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  healthCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  catIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  catInfo: { flex: 1, gap: 6 },
  catLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catName: { fontSize: typography.size.sm, fontWeight: '600', color: colors.text.primary },
  catAmt: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.mono, color: colors.data.neutral },
  catBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brand.softTaupe,
    overflow: 'hidden',
  },
  catBarFill: {
    height: 4,
    borderRadius: 2,
  },
  upcomingCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: spacing.sm,
  },
  upcomingIcon: { fontSize: 18 },
  upcomingInfo: { flex: 1 },
  upcomingName: { fontSize: typography.size.base, fontWeight: '600', color: colors.text.primary },
  upcomingDate: { fontSize: typography.size.sm, color: colors.data.neutral },
  upcomingAmount: {
    fontSize: typography.size.base,
    fontWeight: '700',
    fontFamily: typography.fontFamily.mono,
    color: colors.text.primary,
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.brand.softTaupe,
    marginHorizontal: spacing.md,
    opacity: 0.5,
  },
});
