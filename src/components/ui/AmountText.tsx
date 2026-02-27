// AmountText — renders financial amounts in Source Code Pro with semantic coloring
// Per OpenSpec: expenses -$X.XX deep sage, income +$X.XX surplus green
// Supports is_income flag (preferred) or legacy sign-based formatting

import React from 'react';
import { Text, TextProps } from 'react-native';
import { fonts } from '@/src/theme';
import { formatAmount, amountColor, formatAmountSigned, amountColorFromFlag } from '@/src/utils/formatAmount';

interface AmountTextProps extends TextProps {
  cents: number;
  fontSize?: number;
  isIncome?: boolean;  // Use is_income flag instead of sign-based detection
}

export function AmountText({ cents, fontSize = 14, isIncome, style, ...props }: AmountTextProps) {
  const displayText = isIncome !== undefined
    ? formatAmountSigned(cents, isIncome)
    : formatAmount(cents);
  const displayColor = isIncome !== undefined
    ? amountColorFromFlag(isIncome)
    : amountColor(cents);

  return (
    <Text
      style={[
        {
          fontFamily: fonts.dataBold,
          fontSize,
          fontWeight: '600',
          color: displayColor,
        },
        style,
      ]}
      {...props}
    >
      {displayText}
    </Text>
  );
}
