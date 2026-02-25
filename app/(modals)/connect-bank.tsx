// app/(modals)/connect-bank.tsx
// Plaid Link — connect a bank account.
// Creates link token → opens Plaid Link → exchanges public token → closes.

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PlaidLink, LinkSuccess, LinkExit, LinkLogLevel, LinkTokenConfiguration } from 'react-native-plaid-link-sdk';
import { colors, spacing, typography, borderRadius } from '@/src/theme';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { plaidService } from '@/src/services/plaid';

export default function ConnectBankModal() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    plaidService.createLinkToken()
      .then(token => { setLinkToken(token); setLoading(false); })
      .catch(e => { setError(e?.message || String(e)); setLoading(false); });
  }, []);

  async function handleSuccess(success: LinkSuccess) {
    try {
      await plaidService.exchangePublicToken(success.publicToken, success.metadata as any);
      setSuccess(true);
      setTimeout(() => router.back(), 1500);
    } catch (e: any) {
      setError(e?.message || 'Failed to connect account');
    }
  }

  function handleExit(exit: LinkExit) {
    if (exit.error) setError(`${exit.error.errorCode}: ${exit.error.errorMessage}`);
    else router.back();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.deepSage} size="large" />
          <Text style={styles.loadingText}>Preparing secure connection…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Account connected</Text>
          <Text style={styles.successSub}>Syncing your transactions…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Connection failed</Text>
          <Text style={styles.errorText} selectable>{error}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
            <Text style={styles.btnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const config: LinkTokenConfiguration = {
    token: linkToken!,
    logLevel: LinkLogLevel.ERROR,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Connect Bank</Text>
      </View>

      <View style={styles.center}>
        <GlassCard tier="strong" style={styles.card}>
          <Text style={styles.cardIcon}>🏦</Text>
          <Text style={styles.cardTitle}>Securely connect your bank</Text>
          <Text style={styles.cardSub}>
            Keel uses Plaid to read your transactions. We never store your banking credentials.
          </Text>
          <PlaidLink
            tokenConfig={config}
            onSuccess={handleSuccess}
            onExit={handleExit}
          >
            <View style={styles.plaidBtn}>
              <Text style={styles.plaidBtnText}>Connect with Plaid</Text>
            </View>
          </PlaidLink>
        </GlassCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.eggshell },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  closeBtn: { padding: spacing.sm, marginRight: spacing.sm },
  closeText: { fontSize: 18, color: colors.data.neutral, fontWeight: '600' },
  title: { fontSize: typography.size.lg, fontWeight: '700', color: colors.text.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  loadingText: { fontSize: typography.size.base, color: colors.data.neutral, marginTop: spacing.md },
  successIcon: {
    fontSize: 56, color: colors.data.surplus,
    width: 80, height: 80, textAlign: 'center', lineHeight: 80,
    backgroundColor: 'rgba(91,138,114,0.15)', borderRadius: 40, overflow: 'hidden',
    marginBottom: spacing.md,
  },
  successTitle: { fontSize: typography.size.xl, fontWeight: '700', color: colors.text.primary },
  successSub: { fontSize: typography.size.base, color: colors.data.neutral, marginTop: spacing.sm },
  errorIcon: { fontSize: 48, marginBottom: spacing.md },
  errorTitle: { fontSize: typography.size.lg, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.sm },
  errorText: {
    fontSize: typography.size.sm, color: colors.semantic.error,
    fontFamily: typography.fontFamily.mono, textAlign: 'center',
    marginBottom: spacing.lg, lineHeight: 18,
  },
  btn: {
    backgroundColor: colors.brand.deepSage, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  btnText: { fontSize: typography.size.base, fontWeight: '700', color: colors.text.inverse },
  card: { width: '100%', padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  cardIcon: { fontSize: 48 },
  cardTitle: { fontSize: typography.size.lg, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  cardSub: { fontSize: typography.size.base, color: colors.text.tertiary, textAlign: 'center', lineHeight: 22 },
  plaidBtn: {
    backgroundColor: colors.brand.deepSage, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  plaidBtnText: { fontSize: typography.size.base, fontWeight: '700', color: colors.text.inverse },
});
