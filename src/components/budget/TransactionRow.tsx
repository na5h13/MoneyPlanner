// TransactionRow — single transaction in the date-grouped feed
// Per OpenSpec: merchant truncated at 24 chars, amount in Source Code Pro,
// expenses -$X.XX deep sage, income +$X.XX surplus green
// Tap → category bottom sheet (handled by parent)

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassCard } from '@/src/components/ui/Glass';
import { BodyBold, BodySmall, Sublabel } from '@/src/components/ui/Typography';
import { AmountText } from '@/src/components/ui/AmountText';
import { colors, spacing, fonts } from '@/src/theme';
import { Transaction } from '@/src/types';
import { truncateMerchant } from '@/src/utils/formatAmount';

interface TransactionRowProps {
  transaction: Transaction;
  categoryName?: string;
  onPress: (transaction: Transaction) => void;
}

export function TransactionRow({ transaction, categoryName, onPress }: TransactionRowProps) {
  const merchantDisplay = truncateMerchant(
    transaction.display_merchant || transaction.merchant_name || transaction.name
  );

  return (
    <TouchableOpacity
      onPress={() => onPress(transaction)}
      activeOpacity={0.7}
      style={styles.container}
    >
      <View style={styles.left}>
        <BodyBold numberOfLines={1} style={styles.merchant}>
          {merchantDisplay}
        </BodyBold>
        <Sublabel numberOfLines={1}>
          {categoryName || 'Uncategorized'}
          {transaction.pending && ' · Pending'}
        </Sublabel>
      </View>
      <View style={styles.right}>
        <AmountText cents={transaction.amount} fontSize={14} />
        {transaction.pending && (
          <Sublabel style={styles.pendingLabel}>pending</Sublabel>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(218,224,224,0.18)',
  },
  left: {
    flex: 1,
    marginRight: spacing.lg,
  },
  merchant: {
    fontSize: 13,
    color: colors.brand.deepSage,
  },
  right: {
    alignItems: 'flex-end',
  },
  pendingLabel: {
    marginTop: 1,
    fontStyle: 'italic',
  },
});
