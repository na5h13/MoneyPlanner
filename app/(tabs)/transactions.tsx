// app/(tabs)/transactions.tsx
// Transaction list — real data only from Plaid via backend.
// If fetch fails: show the actual error. No mock data. No silent fallbacks.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/src/theme';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { ErrorState } from '@/src/components/ui/ErrorState';
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
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  const year = d.getFullYear();
  const month = d.getMonth();
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
  const label = d.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
  return { start, end, label };
}

function groupByDate(txns: Transaction[]): Record<string, Transaction[]> {
  return txns.reduce((acc, t) => {
    if (!acc[t.date]) acc[t.date] = [];
    acc[t.date].push(t);
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
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('All');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  const month = getMonthRange(monthOffset);

  const fetchTransactions = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await plaidService.getTransactions(month.start, month.end);
      setTransactions(data.transactions || []);
    } catch (e: any) {
      setError(e?.message || String(e));
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [month.start, month.end]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.deepSage} size="large" />
          <Text style={styles.loadingText}>Loading transactions…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ErrorState
          error={error}
          context="GET /api/plaid/transactions"
          onRetry={() => fetchTransactions()}
        />
      </SafeAreaView>
    );
  }

  const filtered = transactions.filter((t) => {
    if (filter === 'Income' && t.amount >= 0) return false;
    if (filter === 'Pending' && !t.pending) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.name?.toLowerCase().includes(q) && !t.merchant?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  const grouped = groupByDate(sorted);
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Activity</Text>
          <View style={styles.monthNav}>
            <TouchableOpacity style={styles.monthArrow} onPress={() => setMonthOffset(o => o - 1)}>
              <Text style={styles.monthArrowText}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{month.label}</Text>
            <TouchableOpacity
              style={styles.monthArrow}
              onPress={() => setMonthOffset(o => Math.min(o + 1, 0))}
              disabled={monthOffset === 0}
            >
              <Text style={[styles.monthArrowText, monthOffset === 0 && styles.disabled]}>▶</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
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

        {/* Filters */}
        <View style={styles.filterRow}>
          {(['All', 'Income', 'Pending'] as FilterType[]).map(f => (
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

        {/* List */}
        {dates.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No transactions</Text>
            <Text style={styles.emptySubtitle}>
              {transactions.length === 0
                ? 'No transactions found for this period.'
                : 'No transactions match your filter.'}
            </Text>
          </View>
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
            {dates.map(date => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>{formatDateHeader(date)}</Text>
                <GlassCard style={styles.txnCard}>
                  {grouped[date].map((txn, idx) => (
                    <React.Fragment key={txn.transaction_id}>
                      <TransactionRow
                        transaction={txn}
                        onPress={() => { setSelectedTxn(txn); setCategoryPickerVisible(true); }}
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

      {categoryPickerVisible && selectedTxn && (
        <CategoryPicker
          transaction={selectedTxn}
          onAssign={(txnId, newCategory) => {
            setTransactions(prev =>
              prev.map(t => t.transaction_id === txnId ? { ...t, budget_category: newCategory } : t)
            );
            setCategoryPickerVisible(false);
            setSelectedTxn(null);
          }}
          onDismiss={() => { setCategoryPickerVisible(false); setSelectedTxn(null); }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg.eggshell },
  container: { flex: 1, backgroundColor: colors.bg.eggshell },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { fontSize: typography.size.base, color: colors.data.neutral, marginTop: spacing.sm },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: {
    fontSize: typography.size['2xl'], fontWeight: '700', color: colors.text.primary,
    fontFamily: typography.fontFamily.display, letterSpacing: -0.5, marginBottom: spacing.sm,
  },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  monthArrow: { padding: spacing.xs },
  monthArrowText: { fontSize: 14, color: colors.brand.steelBlue, fontWeight: '600' },
  disabled: { opacity: 0.3 },
  monthLabel: {
    fontSize: typography.size.base, fontWeight: '600', color: colors.text.primary,
    minWidth: 160, textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  searchIcon: { fontSize: 14, marginRight: spacing.sm, opacity: 0.5 },
  searchInput: { flex: 1, fontSize: typography.size.base, color: colors.text.primary, padding: 0 },
  clearBtn: { fontSize: 12, color: colors.data.neutral, paddingLeft: spacing.sm },
  filterRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.brand.softTaupe, backgroundColor: 'rgba(255,255,255,0.4)',
  },
  chipActive: { backgroundColor: colors.brand.deepSage, borderColor: colors.brand.deepSage },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text.secondary },
  chipTextActive: { color: colors.text.inverse },
  countText: { marginLeft: 'auto', fontSize: 12, color: colors.data.neutral },
  list: { flex: 1, paddingHorizontal: spacing.lg },
  dateGroup: { marginBottom: spacing.md },
  dateHeader: {
    fontSize: 12, fontWeight: '600', color: colors.data.neutral,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: spacing.sm, paddingLeft: spacing.xs,
  },
  txnCard: { paddingVertical: spacing.xs },
  divider: {
    height: 0.5, backgroundColor: colors.brand.softTaupe,
    marginHorizontal: spacing.md, opacity: 0.5,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: typography.size.lg, fontWeight: '600', color: colors.text.primary },
  emptySubtitle: { fontSize: typography.size.base, color: colors.text.tertiary, textAlign: 'center' },
});
