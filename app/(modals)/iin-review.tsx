// app/(modals)/iin-review.tsx — Review detected income change
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/src/theme';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { iinService } from '@/src/services/iin';

export default function IINReviewModal() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    try {
      await iinService.acceptEscalation();
      router.back();
    } catch (e: any) {
      setError(e?.message || 'Failed to apply');
      setLoading(false);
    }
  }

  async function handleReject() {
    setLoading(true);
    try {
      await iinService.rejectEscalation();
      router.back();
    } catch (e: any) {
      setError(e?.message || 'Failed to dismiss');
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Income Change Detected</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        <GlassCard tier="strong" style={styles.card} surplusGlow>
          <Text style={styles.cardIcon}>📈</Text>
          <Text style={styles.cardTitle}>Income increase detected</Text>
          <Text style={styles.cardSub}>
            IIN is ready to route a portion of this raise to your savings — stopping lifestyle inflation before it starts.
          </Text>
          {eventId && <Text style={styles.eventId}>Event: {eventId}</Text>}
        </GlassCard>

        {error && <Text style={styles.error} selectable>{error}</Text>}

        <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} disabled={loading}>
          {loading
            ? <ActivityIndicator color={colors.text.inverse} />
            : <Text style={styles.acceptBtnText}>Apply Neutralization</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} disabled={loading}>
          <Text style={styles.rejectBtnText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.eggshell },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  closeText: { fontSize: 18, color: colors.data.neutral, fontWeight: '600', padding: spacing.xs },
  title: { fontSize: typography.size.lg, fontWeight: '700', color: colors.text.primary },
  content: { flex: 1, padding: spacing.lg, gap: spacing.md },
  card: { padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  cardIcon: { fontSize: 48 },
  cardTitle: { fontSize: typography.size.xl, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  cardSub: { fontSize: typography.size.base, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 },
  eventId: { fontSize: 10, color: colors.data.neutral, fontFamily: typography.fontFamily.mono },
  error: { fontSize: typography.size.sm, color: colors.semantic.error, fontFamily: typography.fontFamily.mono },
  acceptBtn: { backgroundColor: colors.brand.deepSage, borderRadius: borderRadius.full, paddingVertical: 14, alignItems: 'center' },
  acceptBtnText: { fontSize: typography.size.base, fontWeight: '700', color: colors.text.inverse },
  rejectBtn: { borderRadius: borderRadius.full, paddingVertical: 14, alignItems: 'center' },
  rejectBtnText: { fontSize: typography.size.base, fontWeight: '600', color: colors.data.neutral },
});
