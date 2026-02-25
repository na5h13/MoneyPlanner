// app/(tabs)/budget.tsx
// Budget screen — Functions 5, 6, 7.
// Category cards with line items, Budget + Trending columns.
// Safe-to-spend summary bar at top.
// Section 21, Functions 5-7 + Section 22 (Trending Classification).

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/src/theme';
import { SummaryBar } from '@/src/components/budget/SummaryBar';
import { CategoryCard } from '@/src/components/budget/CategoryCard';
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

// Default category structure — populated from backend, seeded here for DEV_MODE
const DEFAULT_CATEGORIES: CategoryState[] = [
  {
    id: 'housing',
    name: 'Housing',
    icon: '🏠',
    items: [
      { id: 'h1', name: 'Rent', budgetAmount: 1800, trendingAmount: 1800, classification: 'FIXED' },
      { id: 'h2', name: 'Utilities', budgetAmount: 120, trendingAmount: 134, classification: 'RECURRING_VARIABLE' },
      { id: 'h3', name: 'Internet', budgetAmount: 65, trendingAmount: 65, classification: 'FIXED' },
    ],
  },
  {
    id: 'food',
    name: 'Food',
    icon: '🛒',
    items: [
      { id: 'f1', name: 'Groceries', budgetAmount: 400, trendingAmount: 438, classification: 'RECURRING_VARIABLE' },
      { id: 'f2', name: 'Dining Out', budgetAmount: 150, trendingAmount: 187, classification: 'TRUE_VARIABLE' },
      { id: 'f3', name: 'Coffee', budgetAmount: 50, trendingAmount: 63, classification: 'TRUE_VARIABLE' },
    ],
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: '🚌',
    items: [
      { id: 't1', name: 'Transit Pass', budgetAmount: 156, trendingAmount: 156, classification: 'FIXED' },
      { id: 't2', name: 'Ride Share', budgetAmount: 40, trendingAmount: 28, classification: 'TRUE_VARIABLE' },
    ],
  },
  {
    id: 'bills',
    name: 'Bills & Subscriptions',
    icon: '📱',
    items: [
      { id: 'b1', name: 'Phone', budgetAmount: 70, trendingAmount: 70, classification: 'FIXED' },
      { id: 'b2', name: 'Netflix', budgetAmount: 17, trendingAmount: 17, classification: 'FIXED' },
      { id: 'b3', name: 'Spotify', budgetAmount: 11, trendingAmount: 11, classification: 'FIXED' },
    ],
  },
  {
    id: 'health',
    name: 'Health & Fitness',
    icon: '💪',
    items: [
      { id: 'hh1', name: 'Gym', budgetAmount: 50, trendingAmount: 50, classification: 'FIXED' },
      { id: 'hh2', name: 'Pharmacy', budgetAmount: 30, trendingAmount: 22, classification: 'TRUE_VARIABLE' },
    ],
  },
  {
    id: 'savings',
    name: 'Savings & Goals',
    icon: '🏦',
    items: [
      { id: 's1', name: 'Emergency Fund', budgetAmount: 300, trendingAmount: 300, classification: 'FIXED' },
      { id: 's2', name: 'Vacation', budgetAmount: 200, trendingAmount: 200, classification: 'FIXED' },
    ],
  },
];

export default function BudgetScreen() {
  const [period, setPeriod] = useState<Period>('Monthly');
  const [categories, setCategories] = useState<CategoryState[]>(DEFAULT_CATEGORIES);
  const [safeToSpend, setSafeToSpend] = useState({ income: 0, committed: 0, oneTime: 0, safe: 0, daysLeft: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchData(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [sts, summary] = await Promise.all([
        budgetService.getSafeToSpend(),
        budgetService.getSummary(),
      ]);

      setSafeToSpend({
        income: sts.monthly_income,
        committed: sts.fixed_expenses,
        oneTime: sts.month_spending - sts.fixed_expenses,
        safe: sts.safe_to_spend,
        daysLeft: sts.days_remaining,
      });

      // Build category state from backend envelopes
      if (summary.envelopes?.length) {
        const fromBackend: CategoryState[] = summary.envelopes.map((env: any) => ({
          id: env.name.toLowerCase().replace(/\s+/g, '_'),
          name: env.name,
          icon: ENVELOPE_ICONS[env.name] || '📁',
          items: env.categories.map((cat: any) => ({
            id: cat.name.toLowerCase(),
            name: cat.name,
            budgetAmount: cat.monthly_avg,
            trendingAmount: cat.total / Math.max(1, summary.months_analyzed),
            classification: 'RECURRING_VARIABLE' as TrendingClassification,
          })),
        }));
        setCategories(fromBackend);
      }
    } catch {
      // DEV fallback: keep mock data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function updateCategory(catId: string, newItems: LineItemData[]) {
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, items: newItems } : c))
    );
  }

  // Aggregate for summary bar when backend is unavailable
  const totalCommitted = categories.reduce(
    (s, c) => s + c.items.filter((i) => i.classification === 'FIXED').reduce((a, i) => a + i.budgetAmount, 0), 0
  );
  const totalBudgeted = categories.reduce((s, c) => s + c.items.reduce((a, i) => a + i.budgetAmount, 0), 0);
  const mockIncome = 4200;

  const displaySafe = safeToSpend.income > 0 ? safeToSpend.safe : mockIncome - totalBudgeted;
  const displayIncome = safeToSpend.income > 0 ? safeToSpend.income : mockIncome;
  const displayCommitted = safeToSpend.committed > 0 ? safeToSpend.committed : totalCommitted;

  const multiplier = period === 'Weekly' ? 0.23 : period === 'Biweekly' ? 0.46 : 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Budget</Text>

          {/* Period selector */}
          <View style={styles.periodRow}>
            {(['Monthly', 'Biweekly', 'Weekly'] as Period[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodChip, period === p && styles.periodActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                  {p}
                </Text>
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
          {/* Summary bar — Function 7 */}
          <SummaryBar
            income={displayIncome * multiplier}
            committed={displayCommitted * multiplier}
            oneTime={(displayIncome - displayCommitted - displaySafe) * multiplier}
            safeToSpend={displaySafe * multiplier}
            daysRemaining={safeToSpend.daysLeft}
            loading={loading && safeToSpend.income === 0}
          />

          {/* Category cards — Functions 5-6 */}
          <View style={styles.categoriesPad}>
            {loading && categories.length === 0 ? (
              <ActivityIndicator color={colors.brand.deepSage} style={{ marginTop: 40 }} />
            ) : (
              categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  categoryId={cat.id}
                  name={cat.name}
                  icon={cat.icon}
                  items={cat.items.map((item) => ({
                    ...item,
                    budgetAmount: item.budgetAmount * multiplier,
                    trendingAmount: item.trendingAmount * multiplier,
                  }))}
                  onItemsChange={(newItems) => updateCategory(cat.id, newItems.map((i) => ({
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

const ENVELOPE_ICONS: Record<string, string> = {
  'Housing': '🏠',
  'Food & Dining': '🛒',
  'Transport': '🚌',
  'Bills & Utilities': '📱',
  'Health': '💪',
  'Shopping': '🛍️',
  'Entertainment': '🎬',
  'Savings': '🏦',
  'Income': '💰',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.eggshell,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg.eggshell,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: typography.fontFamily.display,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  periodChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.brand.softTaupe,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  periodActive: {
    backgroundColor: colors.brand.deepSage,
    borderColor: colors.brand.deepSage,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  periodTextActive: {
    color: colors.text.inverse,
  },
  categoriesPad: {
    paddingHorizontal: spacing.lg,
  },
});
