// src/components/budget/TransactionRow.tsx
// Single transaction row — merchant name, category badge, amount.
// Income = data.surplus green, debits = text.primary deep sage.
// Pending = italic + warm nude tint.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/src/theme';

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
}

interface TransactionRowProps {
  transaction: Transaction;
  onPress?: () => void;
}

// Category → emoji map
const CATEGORY_ICONS: Record<string, string> = {
  'Groceries': '🛒',
  'Dining Out': '🍽️',
  'Coffee': '☕',
  'Income': '💰',
  'Subscriptions': '📱',
  'Utilities': '💡',
  'Transport': '🚌',
  'Gas': '⛽',
  'Rent': '🏠',
  'Healthcare': '🏥',
  'Shopping': '🛍️',
  'Entertainment': '🎬',
  'Fitness': '💪',
  'Savings': '🏦',
  'Transfer': '↔️',
};

function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] || '💳';
}

export function TransactionRow({ transaction, onPress }: TransactionRowProps) {
  const isIncome = transaction.amount < 0;
  const displayAmount = Math.abs(transaction.amount);
  const amountStr = `${isIncome ? '+' : '-'}$${displayAmount.toFixed(2)}`;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Category icon bubble */}
      <View style={styles.iconBubble}>
        <Text style={styles.iconText}>
          {getCategoryIcon(transaction.budget_category || transaction.category)}
        </Text>
      </View>

      {/* Name + category */}
      <View style={styles.info}>
        <Text
          style={[styles.name, transaction.pending && styles.pendingText]}
          numberOfLines={1}
        >
          {transaction.merchant || transaction.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.category}>{transaction.budget_category || transaction.category}</Text>
          {transaction.pending && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
          )}
        </View>
      </View>

      {/* Amount */}
      <Text style={[
        styles.amount,
        isIncome ? styles.incomeAmount : styles.debitAmount,
      ]}>
        {amountStr}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: spacing.sm,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: 18,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: typography.size.base,
    fontWeight: '500',
    color: colors.text.primary,
  },
  pendingText: {
    fontStyle: 'italic',
    opacity: 0.75,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  category: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  pendingBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.warmNude,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  amount: {
    fontSize: typography.size.base,
    fontWeight: '600',
    fontFamily: typography.fontFamily.mono,
    flexShrink: 0,
    letterSpacing: -0.3,
  },
  incomeAmount: {
    color: colors.data.surplus,
  },
  debitAmount: {
    color: colors.text.primary,
  },
});
