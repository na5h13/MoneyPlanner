// src/components/budget/CategoryPicker.tsx
// Function 3 — Category reassignment bottom sheet.
// Slides up when user taps a transaction.
// POSTs to /api/transactions/{id}/category on select.

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/src/theme';
import { api } from '@/src/services/api';

interface Transaction {
  transaction_id: string;
  name: string;
  merchant: string;
  amount: number;
  budget_category: string;
}

interface CategoryPickerProps {
  transaction: Transaction;
  onAssign: (txnId: string, newCategory: string) => void;
  onDismiss: () => void;
}

// Master category list — mirrors backend services/categories.py BUDGET_ENVELOPES
const BUDGET_CATEGORIES = [
  { section: 'Income', items: ['Income', 'Freelance', 'Side Income'] },
  { section: 'Housing', items: ['Rent', 'Mortgage', 'Maintenance', 'Insurance'] },
  { section: 'Food', items: ['Groceries', 'Dining Out', 'Coffee', 'Alcohol'] },
  { section: 'Transport', items: ['Transit', 'Gas', 'Parking', 'Car Insurance', 'Ride Share'] },
  { section: 'Bills', items: ['Utilities', 'Internet', 'Phone', 'Subscriptions'] },
  { section: 'Health', items: ['Healthcare', 'Pharmacy', 'Fitness', 'Mental Health'] },
  { section: 'Shopping', items: ['Clothing', 'Electronics', 'Home', 'Personal Care'] },
  { section: 'Entertainment', items: ['Entertainment', 'Hobbies', 'Travel', 'Gifts'] },
  { section: 'Finance', items: ['Savings', 'Investment', 'Debt Payment', 'Transfer', 'Fees'] },
  { section: 'Other', items: ['Miscellaneous', 'Cash', 'Unknown'] },
];

export function CategoryPicker({ transaction, onAssign, onDismiss }: CategoryPickerProps) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  }, []);

  function dismiss() {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 220,
      useNativeDriver: true,
    }).start(onDismiss);
  }

  async function handleSelect(category: string) {
    setSaving(true);
    try {
      await api.put(`/api/transactions/${transaction.transaction_id}/category`, {
        category,
      });
    } catch {
      // Optimistic update even if backend fails in DEV
    } finally {
      setSaving(false);
      onAssign(transaction.transaction_id, category);
    }
  }

  const isNegative = transaction.amount >= 0;
  const displayAmount = `${isNegative ? '-' : '+'}$${Math.abs(transaction.amount).toFixed(2)}`;

  return (
    <Modal transparent animationType="none" onRequestClose={dismiss}>
      <TouchableWithoutFeedback onPress={dismiss}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Transaction summary */}
        <View style={styles.txnSummary}>
          <View>
            <Text style={styles.txnName} numberOfLines={1}>
              {transaction.merchant || transaction.name}
            </Text>
            <Text style={styles.currentCat}>
              Currently: <Text style={styles.currentCatValue}>{transaction.budget_category}</Text>
            </Text>
          </View>
          <Text style={[styles.txnAmount, isNegative ? styles.debit : styles.income]}>
            {displayAmount}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Reassign to…</Text>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {BUDGET_CATEGORIES.map(({ section, items }) => (
            <View key={section} style={styles.categorySection}>
              <Text style={styles.sectionHeader}>{section}</Text>
              <View style={styles.categoryGrid}>
                {items.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      transaction.budget_category === cat && styles.categoryChipActive,
                    ]}
                    onPress={() => handleSelect(cat)}
                    disabled={saving}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        transaction.budget_category === cat && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>

        {saving && (
          <View style={styles.savingOverlay}>
            <ActivityIndicator color={colors.brand.deepSage} />
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(58, 74, 63, 0.35)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg.eggshell,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingTop: spacing.sm,
    ...shadows.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brand.softTaupe,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  txnSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.brand.softTaupe,
    marginBottom: spacing.md,
  },
  txnName: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.text.primary,
    maxWidth: 220,
  },
  currentCat: {
    fontSize: typography.size.sm,
    color: colors.data.neutral,
    marginTop: 2,
  },
  currentCatValue: {
    color: colors.brand.steelBlue,
    fontWeight: '600',
  },
  txnAmount: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    fontFamily: typography.fontFamily.mono,
  },
  income: { color: colors.data.surplus },
  debit: { color: colors.text.primary },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.data.neutral,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  list: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  categorySection: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.warmNude,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: colors.brand.softTaupe,
  },
  categoryChipActive: {
    backgroundColor: colors.brand.deepSage,
    borderColor: colors.brand.deepSage,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.primary,
  },
  categoryChipTextActive: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245,242,238,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});
