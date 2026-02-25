// Filter Chips — All | Income | Pending
// Per OpenSpec Design HTML chip styles

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { colors, fonts, spacing } from '@/src/theme';
import { TransactionFilter } from '@/src/types';

interface FilterChipsProps {
  active: TransactionFilter;
  onSelect: (filter: TransactionFilter) => void;
}

const FILTERS: { key: TransactionFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'pending', label: 'Pending' },
];

export function FilterChips({ active, onSelect }: FilterChipsProps) {
  return (
    <View style={styles.container}>
      {FILTERS.map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          onPress={() => onSelect(key)}
          style={[styles.chip, active === key ? styles.chipActive : styles.chipInactive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.label, active === key ? styles.labelActive : styles.labelInactive]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  chipActive: {
    backgroundColor: colors.brand.deepSage,
  },
  chipInactive: {
    backgroundColor: 'rgba(255,255,255,0.30)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.40)',
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    fontWeight: '600',
  },
  labelActive: {
    color: '#ffffff',
  },
  labelInactive: {
    color: colors.data.neutral,
  },
});
