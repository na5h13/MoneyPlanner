// AmountText — renders financial amounts in Source Code Pro with semantic coloring
// Per OpenSpec: expenses -$X.XX deep sage, income +$X.XX surplus green

import React from 'react';
import { Text, TextProps } from 'react-native';
import { fonts } from '@/src/theme';
import { formatAmount, amountColor } from '@/src/utils/formatAmount';

interface AmountTextProps extends TextProps {
  cents: number;
  fontSize?: number;
}

export function AmountText({ cents, fontSize = 14, style, ...props }: AmountTextProps) {
  return (
    <Text
      style={[
        {
          fontFamily: fonts.dataBold,
          fontSize,
          fontWeight: '600',
          color: amountColor(cents),
        },
        style,
      ]}
      {...props}
    >
      {formatAmount(cents)}
    </Text>
  );
}
