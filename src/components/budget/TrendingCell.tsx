// src/components/budget/TrendingCell.tsx
// Section 22 — Trending Classification Engine display cell.
// FIXED (📌): auto-detected fixed amount
// RECURRING_VARIABLE (🔄): variable but recurring
// TRUE_VARIABLE: daily run-rate, no icon
// Long-press → ClassificationPicker override

import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography } from '@/src/theme';
import { ClassificationPicker } from './ClassificationPicker';

export type TrendingClassification = 'FIXED' | 'RECURRING_VARIABLE' | 'TRUE_VARIABLE';

interface TrendingCellProps {
  amount: number;
  classification: TrendingClassification;
  lineItemId: string;
  onClassificationChange?: (itemId: string, newClass: TrendingClassification) => void;
}

const CLASSIFICATION_ICONS: Record<TrendingClassification, string> = {
  FIXED: '📌',
  RECURRING_VARIABLE: '🔄',
  TRUE_VARIABLE: '',
};

export function TrendingCell({
  amount,
  classification,
  lineItemId,
  onClassificationChange,
}: TrendingCellProps) {
  const [pickerVisible, setPickerVisible] = useState(false);

  function formatAmount(v: number): string {
    return `$${Math.abs(v).toFixed(0)}`;
  }

  const icon = CLASSIFICATION_ICONS[classification];
  const isOver = amount > 0 && amount > amount * 1.1; // placeholder comparison

  return (
    <>
      <TouchableOpacity
        style={styles.cell}
        onLongPress={() => setPickerVisible(true)}
        delayLongPress={400}
      >
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={[styles.amount, isOver && styles.over]}>
          {formatAmount(amount)}
        </Text>
      </TouchableOpacity>

      {pickerVisible && (
        <ClassificationPicker
          current={classification}
          onSelect={(c) => {
            onClassificationChange?.(lineItemId, c);
            setPickerVisible(false);
          }}
          onDismiss={() => setPickerVisible(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  icon: {
    fontSize: 11,
  },
  amount: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    fontFamily: typography.fontFamily.mono,
    color: colors.text.primary,
  },
  over: {
    color: colors.data.warning,
  },
});
