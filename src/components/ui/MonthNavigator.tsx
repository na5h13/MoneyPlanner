// Month Navigation — left/right arrows to change month
// Used in both Transactions and Budget screens

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BodyBold } from '@/src/components/ui/Typography';
import { colors, spacing, fonts } from '@/src/theme';
import { format, parse } from 'date-fns';

interface MonthNavigatorProps {
  month: string;  // YYYY-MM
  onNavigate: (direction: 'prev' | 'next') => void;
}

export function MonthNavigator({ month, onNavigate }: MonthNavigatorProps) {
  const date = parse(month, 'yyyy-MM', new Date());
  const label = format(date, 'MMMM yyyy');

  // Don't allow navigating past current month
  const now = new Date();
  const isCurrentMonth = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => onNavigate('prev')} style={styles.arrow} activeOpacity={0.6}>
        <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
          <Path d="M10 3L5 8l5 5" stroke={colors.brand.deepSage} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>

      <BodyBold style={styles.label}>{label}</BodyBold>

      <TouchableOpacity
        onPress={() => onNavigate('next')}
        style={[styles.arrow, isCurrentMonth && styles.arrowDisabled]}
        activeOpacity={isCurrentMonth ? 1 : 0.6}
        disabled={isCurrentMonth}
      >
        <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
          <Path
            d="M6 3l5 5-5 5"
            stroke={isCurrentMonth ? colors.data.neutral : colors.brand.deepSage}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  arrow: {
    padding: 8,
  },
  arrowDisabled: {
    opacity: 0.3,
  },
  label: {
    fontSize: 15,
    minWidth: 140,
    textAlign: 'center',
  },
});
