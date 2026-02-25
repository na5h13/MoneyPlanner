// app/(tabs)/iin.tsx — IIN Dashboard
// Shows income baseline, active rules, neutralization history.
// Real data from backend. No mock data.

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Switch, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/src/theme';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { iinService } from '@/src/services/iin';

export default function IINScreen() {
  const [config, setConfig] = useState<any>(null);
  const [incomeHistory, setIncomeHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  async function fetchData(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [cfg, history] = await Promise.all([
        iinService.getConfig(),
        iinService.getIncomeHistory(),
      ]);
      setConfig(cfg);
      setIncomeHistory(history);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  async function toggleIIN(value: boolean) {
    setToggling(true);
    try {
      const updated = await iinService.updateConfig({ 
        savings_rate_pct: config?.savings_rate_pct || 50,
        is_active: value 
      });
      setConfig(updated);
    } catch (e: any) {
      setError(e?.message || 'Failed to update IIN');
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.deepSage} size="large" />
          <Text style={styles.loadingText}>Loading IIN data…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ErrorState error={error} context="GET /api/iin/config" onRetry={() => fetchData()} />
      </SafeAreaView>
    );
  }

  const isActive = config?.is_active ?? false;
  const savingsRate = config?.savings_rate_pct ?? 0;
  const baseline = incomeHistory?.events?.[0]?.amount ?? null;
  const latest = incomeHistory?.rolling_average ?? null;
  const events = incomeHistory?.events ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.brand.deepSage} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Neutralization</Text>
            <Text style={styles.subtitle}>Income Increase Neutralization</Text>
          </View>
          <TouchableOpacity style={styles.setupBtn} onPress={() => router.push('/(modals)/iin-setup')}>
            <Text style={styles.setupBtnText}>⚙ Setup</Text>
          </TouchableOpacity>
        </View>

        {/* IIN Toggle */}
        <GlassCard tier="strong" style={styles.heroCard} surplusGlow={isActive}>
          <View style={styles.heroRow}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroLabel}>IIN Active</Text>
              <Text style={styles.heroSub}>
                {isActive
                  ? `${savingsRate}% of every raise goes to savings`
                  : 'Enable to neutralize lifestyle inflation'}
              </Text>
            </View>
            {toggling
              ? <ActivityIndicator color={colors.brand.deepSage} />
              : <Switch
                  value={isActive}
                  onValueChange={toggleIIN}
                  trackColor={{ false: colors.brand.softTaupe, true: colors.data.surplus }}
                  thumbColor={colors.text.inverse}
                />
            }
          </View>
        </GlassCard>

        {/* Income snapshot */}
        {(baseline || latest) && (
          <>
            <Text style={styles.sectionTitle}>Income</Text>
            <View style={styles.statsRow}>
              {baseline && (
                <GlassCard tier="inset" style={styles.statCard} shadow="none">
                  <Text style={styles.statLabel}>Baseline</Text>
                  <Text style={styles.statValue}>${Number(baseline).toLocaleString('en-CA', { maximumFractionDigits: 0 })}</Text>
                </GlassCard>
              )}
              {latest && (
                <GlassCard tier="inset" style={styles.statCard} shadow="none">
                  <Text style={styles.statLabel}>3mo Average</Text>
                  <Text style={[styles.statValue, { color: colors.data.surplus }]}>
                    ${Number(latest).toLocaleString('en-CA', { maximumFractionDigits: 0 })}
                  </Text>
                </GlassCard>
              )}
            </View>
          </>
        )}

        {/* History */}
        {events.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Income History</Text>
            <GlassCard style={styles.historyCard}>
              {events.slice(0, 10).map((event: any, idx: number) => (
                <React.Fragment key={event.id || idx}>
                  <View style={styles.eventRow}>
                    <View>
                      <Text style={styles.eventDate}>{event.date ? new Date(event.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</Text>
                      <Text style={styles.eventSource}>{event.source_description || event.source || 'Income'}</Text>
                    </View>
                    <Text style={styles.eventAmount}>
                      ${Number(event.amount).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  {idx < Math.min(events.length, 10) - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </GlassCard>
          </>
        )}

        {!config && events.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>IIN not configured</Text>
            <Text style={styles.emptySub}>Set up IIN to automatically route income raises to savings.</Text>
            <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/(modals)/iin-setup')}>
              <Text style={styles.ctaBtnText}>Set Up IIN</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.eggshell },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { fontSize: typography.size.base, color: colors.data.neutral },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size['2xl'], fontWeight: '700', color: colors.text.primary,
    fontFamily: typography.fontFamily.display, letterSpacing: -0.5,
  },
  subtitle: { fontSize: typography.size.sm, color: colors.data.neutral, marginTop: 2 },
  setupBtn: {
    backgroundColor: colors.brand.deepSage, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  setupBtnText: { fontSize: 13, fontWeight: '700', color: colors.text.inverse },
  heroCard: { marginHorizontal: spacing.lg, marginBottom: spacing.lg, padding: spacing.lg },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLeft: { flex: 1, marginRight: spacing.md },
  heroLabel: { fontSize: typography.size.base, fontWeight: '700', color: colors.text.primary },
  heroSub: { fontSize: typography.size.sm, color: colors.text.tertiary, marginTop: 4, lineHeight: 18 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: colors.data.neutral,
    textTransform: 'uppercase', letterSpacing: 1,
    paddingHorizontal: spacing.lg, marginBottom: spacing.sm,
  },
  statsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statLabel: { fontSize: 10, fontWeight: '600', color: colors.data.neutral, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: typography.size.lg, fontWeight: '700', fontFamily: typography.fontFamily.mono, color: colors.text.primary },
  historyCard: { marginHorizontal: spacing.lg, marginBottom: spacing.lg, paddingVertical: spacing.xs },
  eventRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 12 },
  eventDate: { fontSize: typography.size.sm, fontWeight: '600', color: colors.text.primary },
  eventSource: { fontSize: typography.size.sm, color: colors.data.neutral, marginTop: 2 },
  eventAmount: { fontSize: typography.size.base, fontWeight: '700', fontFamily: typography.fontFamily.mono, color: colors.data.surplus },
  divider: { height: 0.5, backgroundColor: colors.brand.softTaupe, marginHorizontal: spacing.md, opacity: 0.5 },
  emptyState: { alignItems: 'center', padding: spacing['2xl'], gap: spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: typography.size.lg, fontWeight: '700', color: colors.text.primary },
  emptySub: { fontSize: typography.size.base, color: colors.text.tertiary, textAlign: 'center', lineHeight: 22 },
  ctaBtn: {
    backgroundColor: colors.brand.deepSage, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md, marginTop: spacing.sm,
  },
  ctaBtnText: { fontSize: typography.size.base, fontWeight: '700', color: colors.text.inverse },
});
