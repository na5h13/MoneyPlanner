// TransactionRow — single transaction in the date-grouped feed
// Per OpenSpec: merchant truncated at 24 chars, amount in Source Code Pro,
// expenses -$X.XX deep sage, income +$X.XX surplus green
// Subtitle: Category · Payment Channel
// Tap → category bottom sheet (handled by parent)

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { BodyBold, Sublabel } from '@/src/components/ui/Typography';
import { AmountText } from '@/src/components/ui/AmountText';
import { colors, spacing } from '@/src/theme';
import { Transaction } from '@/src/types';
import { truncateMerchant } from '@/src/utils/formatAmount';

// Map Plaid payment_channel to display label
function channelLabel(channel: string): string {
  switch (channel) {
    case 'online':    return 'Online';
    case 'in store':  return 'In Store';
    default:          return 'Other';
  }
}

interface TransactionRowProps {
  transaction: Transaction;
  categoryName?: string;
  onPress: (transaction: Transaction) => void;
}

export function TransactionRow({ transaction, categoryName, onPress }: TransactionRowProps) {
  const merchantDisplay = truncateMerchant(
    transaction.display_merchant || transaction.merchant_name || transaction.name
  );

  const category = categoryName || 'Uncategorized';
  const channel = channelLabel(transaction.payment_channel);
  const subtitle = transaction.pending
    ? `${category} · Pending`
    : `${category} · ${channel}`;

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
        <Sublabel numberOfLines={1}>{subtitle}</Sublabel>
      </View>
      <View style={styles.right}>
        <AmountText
          cents={transaction.amount}
          isIncome={transaction.is_income}
          fontSize={14}
        />
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
});
