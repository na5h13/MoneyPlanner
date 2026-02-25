// Budget Screen — OpenSpec Section 21, Function 5
// Scrollable category cards with line items, budget column with user-set targets,
// tap-to-edit target, long-press rename, swipe-left delete, "+ Add item",
// initial budget suggestion (3-month average, rounded to $25),
// category collapse/expand, period navigation, Summary bar placeholder

import React, { useEffect, useCallback, useMemo } from 'react';
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

  // Compute summary bar values
  const summaryValues = useMemo(() => {
    let income = 0;
    let committed = 0;

    for (const cat of budgetDisplay) {
      if (cat.category?.is_income) {
        income += cat.spent;
      } else {
        committed += cat.spent;
      }
    }

    return {
      income,
      committed,
      safeToSpend: income - committed,
    };
  }, [budgetDisplay]);

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
            income={summaryValues.income}
            committed={summaryValues.committed}
            safeToSpend={summaryValues.safeToSpend}
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
