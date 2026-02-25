// src/components/ui/ErrorState.tsx
// Real error display — shows the actual error message, never hides failures.
// No mock data. No silent fallbacks. If it broke, the user sees why.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/src/theme';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  context?: string; // Which endpoint/service failed
}

export function ErrorState({ error, onRetry, context }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Something went wrong</Text>
      {context && <Text style={styles.context}>{context}</Text>}
      <View style={styles.errorBox}>
        <ScrollView style={styles.errorScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.errorText} selectable>{error}</Text>
        </ScrollView>
      </View>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  icon: { fontSize: 40 },
  title: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  context: {
    fontSize: typography.size.sm,
    color: colors.data.neutral,
    fontFamily: typography.fontFamily.mono,
  },
  errorBox: {
    width: '100%',
    maxHeight: 160,
    backgroundColor: 'rgba(192,57,43,0.08)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.2)',
    padding: spacing.md,
  },
  errorScroll: { flex: 1 },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.semantic.error,
    fontFamily: typography.fontFamily.mono,
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: colors.brand.deepSage,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  retryText: {
    fontSize: typography.size.base,
    fontWeight: '700',
    color: colors.text.inverse,
  },
});
