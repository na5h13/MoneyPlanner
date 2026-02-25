// app/(tabs)/settings.tsx
// Function 4 — Settings screen.
// Sections: Accounts (Plaid), Categories (reorderable), Preferences.
// Section 21, Function 4.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius, shadows } from '@/src/theme';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { plaidService } from '@/src/services/plaid';
import { useAuthStore } from '@/src/stores/authStore';
import { authService } from '@/src/services/auth';

interface Account {
  id: string;
  item_id: string;
  name: string;
  institution_name: string;
  type: string;
  mask: string;
  current_balance: number | null;
  available_balance: number | null;
}

export default function SettingsScreen() {
  const { user } = useAuthStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [budgetPeriod, setBudgetPeriod] = useState<'monthly' | 'biweekly' | 'weekly'>('monthly');
  const [currency, setCurrency] = useState('CAD');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      const accs = await plaidService.getAccounts();
      setAccounts(accs);
    } catch {
      // DEV fallback
      setAccounts(MOCK_ACCOUNTS);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await plaidService.syncAll();
      Alert.alert('Synced', 'Your accounts are up to date.');
    } catch (e) {
      Alert.alert('Sync failed', 'Could not sync accounts. Try again.');
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect(account: Account) {
    Alert.alert(
      'Disconnect account?',
      `Remove ${account.institution_name} — ${account.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await plaidService.disconnectAccount(account.item_id);
              setAccounts((prev) => prev.filter((a) => a.id !== account.id));
            } catch {
              Alert.alert('Error', 'Could not disconnect account.');
            }
          },
        },
      ]
    );
  }

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        onPress: async () => {
          await authService.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          {user && (
            <Text style={styles.userEmail}>{user.email}</Text>
          )}
        </View>

        {/* === Accounts === */}
        <SectionHeader title="Connected Accounts" />
        <GlassCard style={styles.section}>
          {accounts.length === 0 ? (
            <Text style={styles.emptyAccounts}>No accounts connected.</Text>
          ) : (
            accounts.map((acc, idx) => (
              <React.Fragment key={acc.id}>
                <View style={styles.accountRow}>
                  <View style={styles.accountBubble}>
                    <Text style={styles.accountBubbleText}>
                      {acc.institution_name?.[0] || '🏦'}
                    </Text>
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>
                      {acc.institution_name} ···{acc.mask}
                    </Text>
                    <Text style={styles.accountType}>
                      {acc.type} · {acc.name}
                    </Text>
                  </View>
                  <View style={styles.accountRight}>
                    {acc.current_balance != null && (
                      <Text style={styles.accountBalance}>
                        ${acc.current_balance.toFixed(2)}
                      </Text>
                    )}
                    <TouchableOpacity onPress={() => handleDisconnect(acc)}>
                      <Text style={styles.disconnectBtn}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {idx < accounts.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))
          )}
          <View style={styles.accountActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(modals)/connect-bank')}
            >
              <Text style={styles.actionBtnText}>+ Add Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={handleSync}
              disabled={syncing}
            >
              <Text style={styles.actionBtnText}>{syncing ? 'Syncing…' : '↻ Sync Now'}</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* === Preferences === */}
        <SectionHeader title="Preferences" />
        <GlassCard style={styles.section}>
          {/* Budget period */}
          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>Budget Period</Text>
            <View style={styles.segmented}>
              {(['monthly', 'biweekly', 'weekly'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.segment, budgetPeriod === p && styles.segmentActive]}
                  onPress={() => setBudgetPeriod(p)}
                >
                  <Text style={[styles.segmentText, budgetPeriod === p && styles.segmentTextActive]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.divider} />

          {/* Currency */}
          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>Currency</Text>
            <View style={styles.segmented}>
              {(['CAD', 'USD'] as const).map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.segment, currency === c && styles.segmentActive]}
                  onPress={() => setCurrency(c)}
                >
                  <Text style={[styles.segmentText, currency === c && styles.segmentTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.divider} />

          {/* Notifications */}
          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.brand.softTaupe, true: colors.data.surplus }}
              thumbColor={colors.text.inverse}
            />
          </View>
        </GlassCard>

        {/* === IIN === */}
        <SectionHeader title="Automation" />
        <GlassCard style={styles.section}>
          <TouchableOpacity
            style={styles.prefRow}
            onPress={() => router.push('/(modals)/iin-setup')}
          >
            <View>
              <Text style={styles.prefLabel}>Income Increase Neutralization</Text>
              <Text style={styles.prefSub}>Automatically route income raises to savings</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* === Account === */}
        <SectionHeader title="Account" />
        <GlassCard style={styles.section}>
          <TouchableOpacity style={styles.prefRow} onPress={handleSignOut}>
            <Text style={[styles.prefLabel, { color: colors.data.deficit }]}>Sign Out</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Version */}
        <Text style={styles.version}>MoneyPlanner v0.1.0 · DEV MODE</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={styles.sectionHeader}>{title}</Text>
  );
}

const MOCK_ACCOUNTS: Account[] = [
  {
    id: '1',
    item_id: 'item1',
    name: 'Chequing',
    institution_name: 'TD Bank',
    type: 'depository',
    mask: '4521',
    current_balance: 3480.22,
    available_balance: 3480.22,
  },
  {
    id: '2',
    item_id: 'item1',
    name: 'Savings',
    institution_name: 'TD Bank',
    type: 'depository',
    mask: '8823',
    current_balance: 12500.00,
    available_balance: 12500.00,
  },
];

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.eggshell,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: typography.fontFamily.display,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: typography.size.sm,
    color: colors.data.neutral,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.data.neutral,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    paddingLeft: spacing.xs,
  },
  section: {
    paddingVertical: spacing.xs,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  accountBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.celadon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountBubbleText: {
    fontSize: 18,
    color: colors.brand.deepSage,
    fontWeight: '700',
  },
  accountInfo: { flex: 1 },
  accountName: {
    fontSize: typography.size.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  accountType: {
    fontSize: typography.size.sm,
    color: colors.data.neutral,
    marginTop: 2,
  },
  accountRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  accountBalance: {
    fontSize: typography.size.base,
    fontWeight: '700',
    fontFamily: typography.fontFamily.mono,
    color: colors.data.surplus,
  },
  disconnectBtn: {
    fontSize: 12,
    color: colors.data.deficit,
    fontWeight: '700',
    padding: 4,
  },
  accountActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: colors.brand.softTaupe,
    marginTop: spacing.xs,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.brand.deepSage,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionBtnSecondary: {
    backgroundColor: colors.brand.steelBlue,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  emptyAccounts: {
    fontSize: typography.size.base,
    color: colors.data.neutral,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.md,
  },
  prefLabel: {
    fontSize: typography.size.base,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  prefSub: {
    fontSize: typography.size.sm,
    color: colors.data.neutral,
    marginTop: 2,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.brand.softTaupe,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  segmentActive: {
    backgroundColor: colors.brand.deepSage,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  segmentTextActive: {
    color: colors.text.inverse,
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.brand.softTaupe,
    marginHorizontal: spacing.md,
    opacity: 0.5,
  },
  chevron: {
    fontSize: 22,
    color: colors.data.neutral,
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.data.neutral,
    marginTop: spacing.xl,
    fontFamily: typography.fontFamily.mono,
  },
});
