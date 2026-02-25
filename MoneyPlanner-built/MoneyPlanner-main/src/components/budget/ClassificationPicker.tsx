// src/components/budget/ClassificationPicker.tsx
// Section 22 — User override for trending classification.
// Appears on long-press of a trending cell.

import React from 'react';
import {
  View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, StyleSheet,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/src/theme';
import type { TrendingClassification } from './TrendingCell';

interface ClassificationPickerProps {
  current: TrendingClassification;
  onSelect: (c: TrendingClassification) => void;
  onDismiss: () => void;
}

const OPTIONS: { value: TrendingClassification; icon: string; label: string; desc: string }[] = [
  {
    value: 'FIXED',
    icon: '📌',
    label: 'Fixed',
    desc: 'Same amount every period (rent, loan payment)',
  },
  {
    value: 'RECURRING_VARIABLE',
    icon: '🔄',
    label: 'Recurring, variable',
    desc: 'Happens regularly but amount varies (groceries, hydro)',
  },
  {
    value: 'TRUE_VARIABLE',
    icon: '〰️',
    label: 'True variable',
    desc: 'Irregular or discretionary (dining out, shopping)',
  },
];

export function ClassificationPicker({ current, onSelect, onDismiss }: ClassificationPickerProps) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.centered}>
        <View style={styles.card}>
          <Text style={styles.title}>How should this be tracked?</Text>
          <Text style={styles.subtitle}>Override the auto-detected classification</Text>
          {OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.option, current === opt.value && styles.optionActive]}
              onPress={() => onSelect(opt.value)}
            >
              <Text style={styles.optIcon}>{opt.icon}</Text>
              <View style={styles.optText}>
                <Text style={[styles.optLabel, current === opt.value && styles.optLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={styles.optDesc}>{opt.desc}</Text>
              </View>
              {current === opt.value && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(58, 74, 63, 0.4)',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.bg.eggshell,
    borderRadius: 20,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 360,
    ...shadows.lg,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.data.neutral,
    marginBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: colors.brand.softTaupe,
  },
  optionActive: {
    backgroundColor: 'rgba(58,74,63,0.08)',
    borderColor: colors.brand.deepSage,
  },
  optIcon: { fontSize: 20, marginRight: spacing.md },
  optText: { flex: 1 },
  optLabel: {
    fontSize: typography.size.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  optLabelActive: { color: colors.brand.deepSage },
  optDesc: {
    fontSize: 12,
    color: colors.data.neutral,
    marginTop: 2,
    lineHeight: 16,
  },
  checkmark: {
    fontSize: 16,
    color: colors.brand.deepSage,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  cancelText: {
    fontSize: typography.size.base,
    color: colors.data.neutral,
    fontWeight: '600',
  },
});
