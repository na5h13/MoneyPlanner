// app/(tabs)/transactions.tsx
// Function 2 — Transaction List Screen
// Date-grouped transaction feed from Plaid.
// Month navigation, search, filter chips.
// Tap → Category reassignment bottom sheet.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography, shadows } from '@/src/theme';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { TransactionRow } from '@/src/components/budget/TransactionRow';
import { CategoryPicker } from '@/src/components/budget/CategoryPicker';
import { plaidService } from '@/src/services/plaid';

type FilterType = 'All' | 'Income' | 'Pending';

interface Transaction {
  transaction_id: string;
  date: string;
  name: string;
  merchant: string;
  amount: number;
  category: string;
  budget_category: string;
  pending: boolean;
  account_id: string;
  item_id: string;
}

function getMonthRange(offset: number): { start: string; end: string; label: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${lastDay}`;
  const label = d.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
  return { start, end, label };
}

function groupByDate(txns: Transaction[]): Record<string, Transaction[]> {
  return txns.reduce((acc, t) => {
    const d = t.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function TransactionsScreen() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('All');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  const month = getMonthRange(monthOffset);

  const fetchTransactions = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await plaidService.getTransactions(month.start, month.end);
      setTransactions(data.transactions || []);
    } catch (e) {
      console.error('Failed to fetch transactions:', e);
      // DEV_MODE: show mock data
      setTransactions(MOCK_TRANSACTIONS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [month.start, month.end]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filtered = transactions.filter((t) => {
    if (filter === 'Income' && t.amount >= 0) return false;
    if (filter === 'Pending' && !t.pending) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.name.toLowerCase().includes(q) && !t.merchant?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Sort descending by date
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  const grouped = groupByDate(sorted);
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  function handleTxnPress(txn: Transaction) {
    setSelectedTxn(txn);
    setCategoryPickerVisible(true);
  }

  function handleCategoryAssigned(txnId: string, newCategory: string) {
    setTransactions((prev) =>
      prev.map((t) => t.transaction_id === txnId ? { ...t, budget_category: newCategory } : t)
    );
    setCategoryPickerVisible(false);
    setSelectedTxn(null);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Activity</Text>

          {/* Month navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              style={styles.monthArrow}
              onPress={() => setMonthOffset((o) => o - 1)}
            >
              <Text style={styles.monthArrowText}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{month.label}</Text>
            <TouchableOpacity
              style={styles.monthArrow}
              onPress={() => setMonthOffset((o) => Math.min(o + 1, 0))}
              disabled={monthOffset === 0}
            >
              <Text style={[styles.monthArrowText, monthOffset === 0 && styles.disabled]}>▶</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
        <GlassCard tier="inset" style={styles.searchContainer} shadow="none">
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions…"
            placeholderTextColor={colors.data.neutral}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          {(['All', 'Income', 'Pending'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, filter === f && styles.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.countText}>{sorted.length} items</Text>
        </View>

        {/* Transaction list */}
        {loading ? (
          <ActivityIndicator color={colors.brand.deepSage} style={{ marginTop: 40 }} />
        ) : dates.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchTransactions(true)}
                tintColor={colors.brand.deepSage}
              />
            }
          >
            {dates.map((date) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>{formatDateHeader(date)}</Text>
                <GlassCard style={styles.txnCard}>
                  {grouped[date].map((txn, idx) => (
                    <React.Fragment key={txn.transaction_id}>
                      <TransactionRow
                        transaction={txn}
                        onPress={() => handleTxnPress(txn)}
                      />
                      {idx < grouped[date].length - 1 && <View style={styles.divider} />}
                    </React.Fragment>
                  ))}
                </GlassCard>
              </View>
            ))}
            <View style={{ height: 32 }} />
          </ScrollView>
        )}
      </View>

      {/* Category picker bottom sheet */}
      {categoryPickerVisible && selectedTxn && (
        <CategoryPicker
          transaction={selectedTxn}
          onAssign={handleCategoryAssigned}
          onDismiss={() => {
            setCategoryPickerVisible(false);
            setSelectedTxn(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No activity yet</Text>
      <Text style={styles.emptySubtitle}>Connect a bank account to see your transactions here.</Text>
    </View>
  );
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { transaction_id: '1', date: new Date().toISOString().split('T')[0], name: 'Grocery Store', merchant: 'Whole Foods', amount: 87.43, category: 'Food', budget_category: 'Groceries', pending: false, account_id: 'acc1', item_id: 'item1' },
  { transaction_id: '2', date: new Date().toISOString().split('T')[0], name: 'Salary Deposit', merchant: 'Employer', amount: -4200.00, category: 'Income', budget_category: 'Income', pending: false, account_id: 'acc1', item_id: 'item1' },
  { transaction_id: '3', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], name: 'Netflix', merchant: 'Netflix', amount: 16.49, category: 'Entertainment', budget_category: 'Subscriptions', pending: false, account_id: 'acc1', item_id: 'item1' },
  { transaction_id: '4', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], name: 'Coffee', merchant: 'Starbucks', amount: 6.75, category: 'Food', budget_category: 'Dining Out', pending: true, account_id: 'acc1', item_id: 'item1' },
  { transaction_id: '5', date: new Date(Date.now() - 172800000).toISOString().split('T')[0], name: 'Hydro Bill', merchant: 'Toronto Hydro', amount: 124.00, category: 'Utilities', budget_category: 'Utilities', pending: false, account_id: 'acc1', item_id: 'item1' },
];

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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  monthArrow: {
    padding: spacing.xs,
  },
  monthArrowText: {
    fontSize: 14,
    color: colors.brand.steelBlue,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.3,
  },
  monthLabel: {
    fontSize: typography.size.base,
    fontWeight: '600',
    color: colors.text.primary,
    minWidth: 160,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text.primary,
    padding: 0,
  },
  clearBtn: {
    fontSize: 12,
    color: colors.data.neutral,
    paddingLeft: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.brand.softTaupe,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  chipActive: {
    backgroundColor: colors.brand.deepSage,
    borderColor: colors.brand.deepSage,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.text.inverse,
  },
  countText: {
    marginLeft: 'auto',
    fontSize: 12,
    color: colors.data.neutral,
  },
  list: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  dateGroup: {
    marginBottom: spacing.md,
  },
  dateHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.data.neutral,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  txnCard: {
    paddingVertical: spacing.xs,
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.brand.softTaupe,
    marginHorizontal: spacing.md,
    opacity: 0.5,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.size.base,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
