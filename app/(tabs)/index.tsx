// app/(tabs)/index.tsx
// Home Dashboard — real data only.
// No hardcoded amounts, no mock categories, no fake stats.
// Failed fetch = visible error.

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/src/theme';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { budgetService } from '@/src/services/budget';
import { useAuthStore } from '@/src/stores/authStore';

interface DashboardData {
  safeToSpend: number;
  monthlyIncome: number;
  monthSpending: number;
  fixedExpenses: number;
  daysRemaining: number;
  envelopes: Array<{
    name: string;
    total: number;
    monthly_avg: number;
  }>;
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  async function fetchData(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [sts, summary] = await Promise.all([
        budgetService.getSafeToSpend(),
        budgetService.getSummary(),
      ]);

      setData({
        safeToSpend: sts.safe_to_spend,
        monthlyIncome: sts.monthly_income,
        monthSpending: sts.month_spending,
        fixedExpenses: sts.fixed_expenses,
        daysRemaining: sts.days_remaining,
        envelopes: summary.envelopes?.map((e: any) => ({
          name: e.name,
          total: e.subtotal,
          monthly_avg: e.categories?.reduce((s: number, c: any) => s + (c.monthly_avg || 0), 0) || 0,
        })) || [],
      });
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const firstName = user?.displayName?.split(' ')[0] || '';

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.deepSage} size="large" />
          <Text style={styles.loadingText}>Loading dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ErrorState
          error={error}
          context="GET /api/safe-to-spend + /api/budget/summary"
          onRetry={() => fetchData()}
        />
      </SafeAreaView>
    );
  }

  const isPositive = (data?.safeToSpend ?? 0) >= 0;
  const savingsRate = data && data.monthlyIncome > 0
    ? Math.round(((data.monthlyIncome - data.monthSpending) / data.monthlyIncome) * 100)
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            tintColor={colors.brand.deepSage}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}{firstName ? `, ${firstName}` : ''}</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Safe-to-spend hero */}
        <GlassCard tier="strong" style={styles.heroCard} surplusGlow={isPositive}>
          <View style={styles.automationBadge}>
            <Text style={styles.automationBadgeText}>● Live</Text>
          </View>
          <Text style={styles.heroLabel}>Safe to Spend</Text>
          <Text style={[styles.heroAmount, isPositive ? styles.surplus : styles.deficit]}>
            {isPositive ? '' : '-'}${Math.abs(data?.safeToSpend ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={styles.heroSub}>
            {data && data.daysRemaining > 0 ? `${data.daysRemaining} days remaining this period` : 'End of period'}
          </Text>
        </GlassCard>

        {/* Stats */}
        {data && (
          <View style={styles.statsRow}>
            <StatCard
              label="Income"
              value={`$${(data.monthlyIncome / 1000).toFixed(1)}k`}
              sublabel="this month"
              color={colors.data.surplus}
            />
            <StatCard
              label="Spent"
              value={`$${(data.monthSpending / 1000).toFixed(1)}k`}
              sublabel="this month"
              color={colors.data.neutral}
            />
            {savingsRate !== null && (
              <StatCard
                label="Savings"
                value={`${savingsRate}%`}
                sublabel="of income"
                color={savingsRate >= 20 ? colors.data.surplus : savingsRate >= 10 ? colors.data.positiveLight : colors.data.warning}
              />
            )}
          </View>
        )}

        {/* Envelope breakdown */}
        {data && data.envelopes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            <GlassCard style={styles.envelopeCard}>
              {data.envelopes
                .filter(e => e.name !== 'Income')
                .sort((a, b) => b.total - a.total)
                .slice(0, 6)
                .map((env, idx, arr) => (
                  <React.Fragment key={env.name}>
                    <EnvelopeRow
                      name={env.name}
                      spent={env.total}
                      budget={env.monthly_avg}
                    />
                    {idx < arr.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                ))}
            </GlassCard>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, sublabel, color }: {
  label: string; value: string; sublabel: string; color: string;
}) {
  return (
    <GlassCard tier="inset" style={styles.statCard} shadow="none">
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statSub}>{sublabel}</Text>
    </GlassCard>
  );
}

function EnvelopeRow({ name, spent, budget }: { name: string; spent: number; budget: number }) {
  const pct = budget > 0 ? Math.min(spent / budget, 1) : 0;
  const over = budget > 0 && spent > budget;
  const barColor = over ? colors.data.warning : colors.data.surplus;

  return (
    <View style={styles.envRow}>
      <View style={styles.envInfo}>
        <View style={styles.envLabelRow}>
          <Text style={styles.envName}>{name}</Text>
          <Text style={[styles.envAmt, over && { color: colors.data.warning }]}>
            ${spent.toFixed(0)}{budget > 0 ? ` / $${budget.toFixed(0)}` : ''}
          </Text>
        </View>
        {budget > 0 && (
          <View style={styles.envBarBg}>
            <View style={[styles.envBarFill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.eggshell },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { fontSize: typography.size.base, color: colors.data.neutral },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },
  greeting: {
    fontSize: typography.size['2xl'], fontWeight: '700', color: colors.text.primary,
    fontFamily: typography.fontFamily.display, letterSpacing: -0.5,
  },
  date: { fontSize: typography.size.sm, color: colors.data.neutral, marginTop: 4 },
  heroCard: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg,
  },
  automationBadge: {
    position: 'absolute', top: spacing.md, right: spacing.md,
    backgroundColor: 'rgba(91,138,114,0.15)', borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  automationBadgeText: { fontSize: 11, fontWeight: '700', color: colors.data.surplus },
  heroLabel: {
    fontSize: typography.size.sm, fontWeight: '700', color: colors.data.neutral,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
  },
  heroAmount: {
    fontSize: 52, fontWeight: '700', fontFamily: typography.fontFamily.mono,
    letterSpacing: -2, marginBottom: 6,
  },
  surplus: { color: colors.data.surplus },
  deficit: { color: colors.data.deficit },
  heroSub: { fontSize: typography.size.sm, color: colors.data.neutral },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: spacing.lg,
    gap: spacing.sm, marginBottom: spacing.lg,
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  statLabel: {
    fontSize: 10, fontWeight: '600', color: colors.data.neutral,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  statValue: { fontSize: typography.size.lg, fontWeight: '700', fontFamily: typography.fontFamily.mono, marginBottom: 2 },
  statSub: { fontSize: 10, color: colors.data.neutral },
  sectionTitle: {
    fontSize: typography.size.sm, fontWeight: '700', color: colors.data.neutral,
    textTransform: 'uppercase', letterSpacing: 1,
    paddingHorizontal: spacing.lg, marginBottom: spacing.sm,
  },
  envelopeCard: { marginHorizontal: spacing.lg, marginBottom: spacing.lg, paddingVertical: spacing.sm },
  envRow: { paddingHorizontal: spacing.md, paddingVertical: 10 },
  envInfo: { gap: 6 },
  envLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  envName: { fontSize: typography.size.sm, fontWeight: '600', color: colors.text.primary },
  envAmt: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.mono, color: colors.data.neutral },
  envBarBg: { height: 4, borderRadius: 2, backgroundColor: colors.brand.softTaupe, overflow: 'hidden' },
  envBarFill: { height: 4, borderRadius: 2 },
  divider: { height: 0.5, backgroundColor: colors.brand.softTaupe, marginHorizontal: spacing.md, opacity: 0.5 },
});
