// Budget Screen — OpenSpec Section 21, Functions 5 + 7 (M6: Summary Bar Enhancement)
// Scrollable category cards with line items, budget targets, trending projection,
// Summary Bar with safe-to-spend hero + income/committed/one-time breakdown

import React, { useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { AmbientBackground } from '@/src/components/ui/Glass';
import { ScreenName } from '@/src/components/ui/Typography';
import { MonthNavigator } from '@/src/components/ui/MonthNavigator';
import { CategoryCard } from '@/src/components/budget/CategoryCard';
import { SummaryBar } from '@/src/components/budget/SummaryBar';
import { colors, spacing } from '@/src/theme';
import { useBudgetStore } from '@/src/stores/budgetStore';

export default function BudgetScreen() {
  const {
    budgetDisplay,
    budgetSummary,
    budgetLoading,
    budgetPeriod,
    collapsedCategories,
    fetchBudget,
    fetchCategories,
    navigateBudgetPeriod,
    toggleCategoryCollapse,
    updateBudgetTarget,
    createLineItem,
    updateLineItem,
    deleteLineItem,
  } = useBudgetStore();

  // Load on mount
  useEffect(() => {
    fetchBudget();
    fetchCategories();
  }, []);

  const handleEditTarget = useCallback(async (categoryId: string, amount: number) => {
    await updateBudgetTarget(categoryId, amount);
  }, [updateBudgetTarget]);

  const handleAddItem = useCallback(async (categoryId: string, name: string) => {
    await createLineItem(categoryId, name);
  }, [createLineItem]);

  const handleRenameItem = useCallback(async (itemId: string, name: string) => {
    await updateLineItem(itemId, { display_name: name });
  }, [updateLineItem]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    await deleteLineItem(itemId);
  }, [deleteLineItem]);

  return (
    <AmbientBackground>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ScreenName>Budget</ScreenName>
        </View>

        {/* Period Navigator */}
        <MonthNavigator
          month={budgetPeriod}
          onNavigate={navigateBudgetPeriod}
        />

        {/* Summary Bar (Safe to Spend hero) */}
        <View style={styles.content}>
          <SummaryBar
            income={budgetSummary?.income ?? 0}
            committed={budgetSummary?.committed ?? 0}
            oneTime={budgetSummary?.one_time ?? 0}
            safeToSpend={budgetSummary?.safe_to_spend ?? 0}
          />

          {/* Loading */}
          {budgetLoading && budgetDisplay.length === 0 && (
            <ActivityIndicator
              size="small"
              color={colors.brand.steelBlue}
              style={styles.loader}
            />
          )}

          {/* Category Cards */}
          {budgetDisplay
            .filter(d => !d.category?.is_income)
            .map((data) => (
              <CategoryCard
                key={data.category.id}
                data={data}
                isCollapsed={collapsedCategories.has(data.category.id)}
                onToggleCollapse={() => toggleCategoryCollapse(data.category.id)}
                onEditTarget={handleEditTarget}
                onAddItem={handleAddItem}
                onRenameItem={handleRenameItem}
                onDeleteItem={handleDeleteItem}
              />
            ))}
        </View>

        {/* Bottom padding for tab bar */}
        <View style={styles.bottomPad} />
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xl,
  },
  loader: {
    paddingVertical: spacing.xxl,
  },
  bottomPad: {
    height: 120,
  },
});
