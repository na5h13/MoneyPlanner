// Transaction List Screen — OpenSpec Section 21, Function 2
// Date-grouped feed from Plaid, month navigation, search with 300ms debounce,
// filter chips (All | Income | Pending), pull-to-refresh → Plaid sync,
// loading/empty/error/offline states

import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
  View,
  SectionList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import { AmbientBackground, GlassCard } from '@/src/components/ui/Glass';
import { ScreenName, BodyText, SectionHeader, Sublabel } from '@/src/components/ui/Typography';
import { SearchBar } from '@/src/components/ui/SearchBar';
import { FilterChips } from '@/src/components/ui/FilterChips';
import { MonthNavigator } from '@/src/components/ui/MonthNavigator';
import { TransactionRow } from '@/src/components/budget/TransactionRow';
import { CategoryPicker } from '@/src/components/budget/CategoryPicker';
import { colors, spacing, fonts } from '@/src/theme';
import { useBudgetStore } from '@/src/stores/budgetStore';
import { Transaction, TransactionFilter } from '@/src/types';

// Group transactions by date (newest first)
function groupByDate(transactions: Transaction[]): Array<{ title: string; data: Transaction[] }> {
  const groups = new Map<string, Transaction[]>();

  for (const txn of transactions) {
    const dateKey = txn.date;
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(txn);
  }

  // Sort by date descending
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, data]) => ({
      title: formatDateHeader(date),
      data,
    }));
}

function formatDateHeader(dateStr: string): string {
  const date = parseISO(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === format(today, 'yyyy-MM-dd')) return 'Today';
  if (dateStr === format(yesterday, 'yyyy-MM-dd')) return 'Yesterday';
  return format(date, 'EEEE, MMMM d');
}

export default function TransactionsScreen() {
  const {
    transactions,
    transactionsLoading,
    transactionsError,
    transactionFilter,
    transactionSearch,
    transactionMonth,
    categories,
    syncStatus,
    fetchTransactions,
    fetchCategories,
    setTransactionFilter,
    setTransactionSearch,
    navigateMonth,
    syncTransactions,
    updateTransactionCategory,
  } = useBudgetStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  // Category name lookup map
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categories) {
      map.set(cat.id, cat.name);
    }
    return map;
  }, [categories]);

  // Load on mount
  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 300);
    return () => clearTimeout(timer);
  }, [transactionSearch]);

  // Group transactions by date
  const sections = useMemo(() => groupByDate(transactions), [transactions]);

  // Pull-to-refresh → Plaid sync
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await syncTransactions();
    setIsRefreshing(false);
  }, [syncTransactions]);

  // Transaction tap → category bottom sheet
  const handleTransactionPress = useCallback((txn: Transaction) => {
    setSelectedTransaction(txn);
    setCategoryPickerVisible(true);
  }, []);

  const handleCategorySelect = useCallback(async (categoryId: string, applyToAll: boolean) => {
    if (selectedTransaction) {
      await updateTransactionCategory(selectedTransaction.id, categoryId, applyToAll);
    }
    setCategoryPickerVisible(false);
    setSelectedTransaction(null);
  }, [selectedTransaction, updateTransactionCategory]);

  const handleCategoryPickerClose = useCallback(() => {
    setCategoryPickerVisible(false);
    setSelectedTransaction(null);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setTransactionSearch(text);
  }, [setTransactionSearch]);

  // Render date section header
  const renderSectionHeader = useCallback(({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <SectionHeader>{section.title}</SectionHeader>
    </View>
  ), []);

  // Render transaction row
  const renderItem = useCallback(({ item }: { item: Transaction }) => (
    <TransactionRow
      transaction={item}
      categoryName={item.category_id ? categoryMap.get(item.category_id) : undefined}
      onPress={handleTransactionPress}
    />
  ), [categoryMap, handleTransactionPress]);

  // Empty state
  const renderEmpty = useCallback(() => {
    if (transactionsLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <GlassCard tier="standard" style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <BodyText style={styles.emptyTitle}>
              {transactionsError ? 'Unable to load transactions' : 'No transactions found'}
            </BodyText>
            <Sublabel style={styles.emptySubtitle}>
              {transactionsError
                ? transactionsError
                : transactionSearch
                ? 'Try a different search term'
                : 'Pull down to sync with your bank'}
            </Sublabel>
          </View>
        </GlassCard>
      </View>
    );
  }, [transactionsLoading, transactionsError, transactionSearch]);

  return (
    <AmbientBackground>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ScreenName>Transactions</ScreenName>
        </View>

        {/* Month Navigator */}
        <MonthNavigator
          month={transactionMonth}
          onNavigate={navigateMonth}
        />

        {/* Search + Filters */}
        <View style={styles.controls}>
          <SearchBar
            value={transactionSearch}
            onChangeText={handleSearch}
          />
          <View style={styles.filtersRow}>
            <FilterChips
              active={transactionFilter}
              onSelect={setTransactionFilter}
            />
          </View>
        </View>

        {/* Loading indicator */}
        {transactionsLoading && transactions.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.brand.steelBlue} />
          </View>
        )}

        {/* Transaction List */}
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListEmptyComponent={renderEmpty}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brand.steelBlue}
              colors={[colors.brand.steelBlue]}
            />
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Sync status */}
        {syncStatus.is_syncing && (
          <View style={styles.syncBanner}>
            <ActivityIndicator size="small" color={colors.brand.steelBlue} />
            <Sublabel style={styles.syncText}>Syncing...</Sublabel>
          </View>
        )}
      </View>

      {/* Category Picker Bottom Sheet */}
      <CategoryPicker
        visible={categoryPickerVisible}
        transaction={selectedTransaction}
        categories={categories}
        onSelect={handleCategorySelect}
        onClose={handleCategoryPickerClose}
      />
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
  controls: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  filtersRow: {
    marginTop: spacing.sm,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: 100, // Tab bar clearance
  },
  sectionHeader: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    paddingTop: spacing.xxxl,
    alignItems: 'center',
  },
  emptyCard: {
    width: '100%',
  },
  emptyContent: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    textAlign: 'center',
    fontSize: 11,
  },
  syncBanner: {
    position: 'absolute',
    top: 52,
    right: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncText: {
    fontSize: 9,
    color: colors.brand.steelBlue,
  },
});
