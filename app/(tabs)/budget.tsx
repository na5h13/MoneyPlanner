// app/(tabs)/budget.tsx
// Budget screen — real data only from backend.
// No mock data. Failed fetch = visible error with retry.

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/src/theme';
import { SummaryBar } from '@/src/components/budget/SummaryBar';
import { CategoryCard } from '@/src/components/budget/CategoryCard';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { budgetService } from '@/src/services/budget';
import { LineItemData } from '@/src/components/budget/LineItem';
import { TrendingClassification } from '@/src/components/budget/TrendingCell';

type Period = 'Monthly' | 'Biweekly' | 'Weekly';

interface CategoryState {
  id: string;
  name: string;
  icon: string;
  items: LineItemData[];
}

interface SafeToSpendData {
  income: number;
  committed: number;
  oneTime: number;
  safe: number;
  daysLeft: number;
}

const ENVELOPE_ICONS: Record<string, string> = {
  'Housing': '🏠', 'Food & Dining': '🛒', 'Transport': '🚌',
  'Bills & Utilities': '📱', 'Health': '💪', 'Shopping': '🛍️',
  'Entertainment': '🎬', 'Savings': '🏦', 'Income': '💰',
  'Food': '🛒', 'Utilities': '💡', 'Medical': '🏥',
};

const PERIOD_MULTIPLIER: Record<Period, number> = {
  Monthly: 1, Biweekly: 0.46, Weekly: 0.23,
};

export default function BudgetScreen() {
  const [period, setPeriod] = useState<Period>('Monthly');
  const [categories, setCategories] = useState<CategoryState[]>([]);
  const [safeToSpend, setSafeToSpend] = useState<SafeToSpendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorContext, setErrorContext] = useState<string>('');

  async function fetchData(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Fetch safe-to-spend first
      let stsData: SafeToSpendData | null = null;
      try {
        const sts = await budgetService.getSafeToSpend();
        stsData = {
          income: sts.monthly_income,
          committed: sts.fixed_expenses,
          oneTime: sts.month_spending - sts.fixed_expenses,
          safe: sts.safe_to_spend,
          daysLeft: sts.days_remaining,
        };
        setSafeToSpend(stsData);
      } catch (e: any) {
        setErrorContext('GET /api/safe-to-spend');
        throw e;
      }

      // Fetch budget summary
      try {
        const summary = await budgetService.getSummary();
        if (summary.envelopes?.length) {
          const cats: CategoryState[] = summary.envelopes.map((env: any) => ({
            id: env.name.toLowerCase().replace(/\s+/g, '_'),
            name: env.name,
            icon: ENVELOPE_ICONS[env.name] || '📁',
            items: env.categories.map((cat: any) => ({
              id: cat.name.toLowerCase().replace(/\s+/g, '_'),
              name: cat.name,
              budgetAmount: cat.monthly_avg || 0,
              trendingAmount: summary.months_analyzed > 0
                ? cat.total / summary.months_analyzed
                : cat.monthly_avg || 0,
              classification: 'RECURRING_VARIABLE' as TrendingClassification,
            })),
          }));
          setCategories(cats);
        } else {
          setCategories([]);
        }
      } catch (e: any) {
        setErrorContext('GET /api/budget/summary');
        throw e;
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const multiplier = PERIOD_MULTIPLIER[period];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.deepSage} size="large" />
          <Text style={styles.loadingText}>Loading budget…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ErrorState
          error={error}
          context={errorContext}
          onRetry={() => fetchData()}
        />
      </SafeAreaView>
    );
  }

  function updateCategory(catId: string, newItems: LineItemData[]) {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, items: newItems } : c));
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Budget</Text>
          <View style={styles.periodRow}>
            {(['Monthly', 'Biweekly', 'Weekly'] as Period[]).map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.periodChip, period === p && styles.periodActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
          {safeToSpend ? (
            <SummaryBar
              income={safeToSpend.income * multiplier}
              committed={safeToSpend.committed * multiplier}
              oneTime={safeToSpend.oneTime * multiplier}
              safeToSpend={safeToSpend.safe * multiplier}
              daysRemaining={safeToSpend.daysLeft}
              loading={false}
            />
          ) : (
            <View style={styles.noDataBanner}>
              <Text style={styles.noDataText}>No income data yet — connect a bank account to get started.</Text>
            </View>
          )}

          <View style={styles.categoriesPad}>
            {categories.length === 0 ? (
              <View style={styles.emptyCategories}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyTitle}>No budget data yet</Text>
                <Text style={styles.emptySubtitle}>
                  Sync your bank account to generate budget categories from your real transactions.
                </Text>
              </View>
            ) : (
              categories.map(cat => (
                <CategoryCard
                  key={cat.id}
                  categoryId={cat.id}
                  name={cat.name}
                  icon={cat.icon}
                  items={cat.items.map(item => ({
                    ...item,
                    budgetAmount: item.budgetAmount * multiplier,
                    trendingAmount: item.trendingAmount * multiplier,
                  }))}
                  onItemsChange={newItems => updateCategory(cat.id, newItems.map(i => ({
                    ...i,
                    budgetAmount: i.budgetAmount / multiplier,
                    trendingAmount: i.trendingAmount / multiplier,
                  })))}
                />
              ))
            )}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg.eggshell },
  container: { flex: 1, backgroundColor: colors.bg.eggshell },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { fontSize: typography.size.base, color: colors.data.neutral },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: {
    fontSize: typography.size['2xl'], fontWeight: '700', color: colors.text.primary,
    fontFamily: typography.fontFamily.display, letterSpacing: -0.5, marginBottom: spacing.sm,
  },
  periodRow: { flexDirection: 'row', gap: spacing.xs },
  periodChip: {
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.brand.softTaupe, backgroundColor: 'rgba(255,255,255,0.4)',
  },
  periodActive: { backgroundColor: colors.brand.deepSage, borderColor: colors.brand.deepSage },
  periodText: { fontSize: 13, fontWeight: '600', color: colors.text.secondary },
  periodTextActive: { color: colors.text.inverse },
  noDataBanner: {
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    padding: spacing.lg, backgroundColor: 'rgba(154,123,79,0.1)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(154,123,79,0.25)',
  },
  noDataText: { fontSize: typography.size.base, color: colors.data.warning, textAlign: 'center', lineHeight: 22 },
  categoriesPad: { paddingHorizontal: spacing.lg },
  emptyCategories: { alignItems: 'center', paddingVertical: spacing['3xl'], gap: spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: typography.size.lg, fontWeight: '700', color: colors.text.primary },
  emptySubtitle: {
    fontSize: typography.size.base, color: colors.text.tertiary,
    textAlign: 'center', lineHeight: 22, maxWidth: 300,
  },
});
