// app/(modals)/iin-setup.tsx — IIN Setup / Edit
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/src/theme';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { iinService } from '@/src/services/iin';

const DESTINATIONS = [
  { id: 'savings', label: 'Savings Account', icon: '🏦' },
  { id: 'investment', label: 'Investment Account', icon: '📈' },
  { id: 'debt', label: 'Debt Repayment', icon: '💳' },
];

export default function IINSetupModal() {
  const [rate, setRate] = useState('50');
  const [destination, setDestination] = useState('savings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    iinService.getConfig()
      .then(cfg => {
        if (cfg) {
          setRate(String(cfg.savings_rate_pct || 50));
          setDestination(cfg.destination || 'savings');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    const pct = parseFloat(rate);
    if (isNaN(pct) || pct < 1 || pct > 100) {
      setError('Enter a percentage between 1 and 100');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await iinService.updateConfig({ savings_rate_pct: pct, destination, is_active: true });
      router.back();
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>IIN Setup</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brand.deepSage} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.desc}>
            Every time your income increases, IIN automatically routes a percentage to your chosen destination — stopping lifestyle inflation before it starts.
          </Text>

          <Text style={styles.label}>Redirect this % of every raise</Text>
          <GlassCard tier="inset" style={styles.inputRow} shadow="none">
            <TextInput
              style={styles.rateInput}
              value={rate}
              onChangeText={setRate}
              keyboardType="decimal-pad"
              maxLength={5}
              selectTextOnFocus
            />
            <Text style={styles.pct}>%</Text>
          </GlassCard>

          <Text style={styles.label}>Destination</Text>
          {DESTINATIONS.map(d => (
            <TouchableOpacity key={d.id} onPress={() => setDestination(d.id)}>
              <GlassCard style={[styles.destCard, destination === d.id && styles.destCardActive]} shadow="none">
                <Text style={styles.destIcon}>{d.icon}</Text>
                <Text style={[styles.destLabel, destination === d.id && styles.destLabelActive]}>{d.label}</Text>
                {destination === d.id && <Text style={styles.check}>✓</Text>}
              </GlassCard>
            </TouchableOpacity>
          ))}

          {error && <Text style={styles.error} selectable>{error}</Text>}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator color={colors.text.inverse} />
              : <Text style={styles.saveBtnText}>Save & Activate IIN</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.eggshell },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  closeText: { fontSize: 18, color: colors.data.neutral, fontWeight: '600', padding: spacing.xs },
  title: { fontSize: typography.size.lg, fontWeight: '700', color: colors.text.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, gap: spacing.md },
  desc: { fontSize: typography.size.base, color: colors.text.secondary, lineHeight: 22, marginBottom: spacing.sm },
  label: { fontSize: 11, fontWeight: '700', color: colors.data.neutral, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  rateInput: { fontSize: 36, fontWeight: '700', fontFamily: typography.fontFamily.mono, color: colors.text.primary, flex: 1 },
  pct: { fontSize: typography.size.xl, color: colors.data.neutral, fontWeight: '600' },
  destCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 14 },
  destCardActive: { borderColor: colors.brand.deepSage, borderWidth: 1.5 },
  destIcon: { fontSize: 24 },
  destLabel: { flex: 1, fontSize: typography.size.base, fontWeight: '600', color: colors.text.secondary },
  destLabelActive: { color: colors.text.primary },
  check: { fontSize: 16, color: colors.data.surplus, fontWeight: '700' },
  error: { fontSize: typography.size.sm, color: colors.semantic.error, fontFamily: typography.fontFamily.mono, lineHeight: 18 },
  saveBtn: { backgroundColor: colors.brand.deepSage, borderRadius: borderRadius.full, paddingVertical: 14, alignItems: 'center', marginTop: spacing.md },
  saveBtnText: { fontSize: typography.size.base, fontWeight: '700', color: colors.text.inverse },
});
