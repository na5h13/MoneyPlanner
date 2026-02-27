// Settings Screen — OpenSpec Section 21, Function 4
// Accounts: SVG bank/card icons, last-4, balance (or used/limit for credit), chevron
// Categories: drag handle + name + chevron
// Preferences: budget period, currency (CAD), notifications toggle
// Bottom: Disconnect Plaid, Sign Out (centered, amber)

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { create as plaidCreate, open as plaidOpen, destroy as plaidDestroy } from 'react-native-plaid-link-sdk';
import { AmbientBackground, GlassCard } from '@/src/components/ui/Glass';
import {
  ScreenName,
  SectionHeader,
  BodyText,
  BodyBold,
  BodySmall,
  DataText,
  Sublabel,
} from '@/src/components/ui/Typography';
import { CategoryEditor } from '@/src/components/budget/CategoryEditor';
import { colors, spacing, fonts } from '@/src/theme';
import { useBudgetStore } from '@/src/stores/budgetStore';
import { categoryApi, accountApi, settingsApi } from '@/src/services/api';
import { Account, Category } from '@/src/types';
import { formatAmountUnsigned } from '@/src/utils/formatAmount';

// SVG bank icon (NNR-ICON: no emoji)
function BankIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18v-2H3v2zm0-4h18v-6H3v6zm0-8h18l-9-5-9 5z"
        fill={colors.brand.steelBlue}
      />
    </Svg>
  );
}

// SVG credit card icon (NNR-ICON: no emoji)
function CardIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={2} y={5} width={20} height={14} rx={2} stroke={colors.brand.steelBlue} strokeWidth={1.5} />
      <Path d="M2 10h20" stroke={colors.brand.steelBlue} strokeWidth={1.5} />
    </Svg>
  );
}

// Chevron right
function Chevron() {
  return (
    <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
      <Path d="M1 1l6 6-6 6" stroke={colors.data.neutral} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function SettingsScreen() {
  const {
    accounts,
    accountsLoading,
    categories,
    categoriesLoading,
    syncStatus,
    fetchAccounts,
    fetchCategories,
    toggleAccountHidden,
    syncTransactions,
  } = useBudgetStore();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryEditorVisible, setCategoryEditorVisible] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [budgetPeriod, setBudgetPeriod] = useState('Monthly');
  const [currency, setCurrency] = useState('CAD');

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await settingsApi.get();
      if (res.data) {
        setNotificationsEnabled(res.data.notifications_enabled ?? true);
        const period = res.data.budget_period || 'monthly';
        setBudgetPeriod(period.charAt(0).toUpperCase() + period.slice(1));
        setCurrency(res.data.currency || 'CAD');
      }
    } catch {
      // Use defaults
    }
  };

  // === Account Actions ===
  const handleAddAccount = useCallback(async () => {
    try {
      const res = await accountApi.createLinkToken();
      const linkToken = res.link_token;
      await plaidDestroy();
      const plaidConfig: any = { token: linkToken, noLoadingState: true };
      plaidCreate(plaidConfig);
      plaidOpen({
        onSuccess: async (success) => {
          try {
            await accountApi.exchangeToken(success.publicToken, success.metadata);
            await fetchAccounts();
            syncTransactions();
            Alert.alert('Account Linked', 'Your bank account has been connected successfully.');
          } catch (exchangeErr: any) {
            const detail = exchangeErr?.data?.error || exchangeErr?.message || 'Unknown error';
            Alert.alert('Exchange Error', detail);
          }
        },
        onExit: (exit) => {
          if (exit?.error?.errorMessage) {
            Alert.alert('Link Error', exit.error.errorMessage);
          }
        },
      });
    } catch (err: any) {
      const msg = err?.message || err?.data?.error || 'Unknown error';
      Alert.alert('Bank Link Error', `${msg}${err?.status ? ` (${err.status})` : ''}`);
    }
  }, [fetchAccounts, syncTransactions]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await GoogleSignin.signOut();
            await auth().signOut();
          } catch {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  }, []);

  const handleDisconnect = useCallback(() => {
    Alert.alert(
      'Disconnect Bank',
      'This will remove all linked accounts and transaction data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await accountApi.disconnect();
              fetchAccounts();
            } catch {
              Alert.alert('Error', 'Failed to disconnect');
            }
          },
        },
      ]
    );
  }, [fetchAccounts]);

  // === Category Actions ===
  const handleCreateCategory = useCallback(() => {
    setEditingCategory(null);
    setIsCreatingCategory(true);
    setCategoryEditorVisible(true);
  }, []);

  const handleEditCategory = useCallback((category: Category) => {
    setEditingCategory(category);
    setIsCreatingCategory(false);
    setCategoryEditorVisible(true);
  }, []);

  const handleDeleteCategory = useCallback((category: Category) => {
    if (category.is_default && category.name === 'Uncategorized') {
      Alert.alert('Cannot Delete', 'The Uncategorized category cannot be deleted.');
      return;
    }
    Alert.alert(
      'Delete Category',
      `Delete "${category.name}"? Transactions will be moved to Uncategorized.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await categoryApi.delete(category.id);
              fetchCategories();
            } catch {
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  }, [fetchCategories]);

  const handleSaveCategory = useCallback(async (data: { name: string; includes: string[] }) => {
    try {
      if (isCreatingCategory) {
        await categoryApi.create({ name: data.name, icon: 'custom', includes: data.includes });
      } else if (editingCategory) {
        await categoryApi.update(editingCategory.id, { name: data.name, includes: data.includes });
      }
      fetchCategories();
      setCategoryEditorVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to save category');
    }
  }, [isCreatingCategory, editingCategory, fetchCategories]);

  // === Preferences ===
  const handleNotificationToggle = useCallback(async (value: boolean) => {
    setNotificationsEnabled(value);
    try {
      await settingsApi.update({ notifications_enabled: value });
    } catch {
      setNotificationsEnabled(!value);
    }
  }, []);

  // Account display helpers
  const isCredit = (account: Account) =>
    account.type === 'credit' || account.subtype === 'credit card';

  const renderAccountBalance = (account: Account) => {
    if (isCredit(account)) {
      const used = Math.abs(account.balance_current || 0);
      const limit = account.balance_limit || 0;
      return (
        <DataText style={styles.accountBalance}>
          {formatAmountUnsigned(used)} / {formatAmountUnsigned(limit)}
        </DataText>
      );
    }
    const balance = account.balance_available ?? account.balance_current ?? 0;
    return (
      <View>
        <DataText style={styles.accountBalance}>
          {formatAmountUnsigned(Math.abs(balance))}
          {account.balance_available != null && (
            <Sublabel style={styles.availableLabel}> available</Sublabel>
          )}
        </DataText>
      </View>
    );
  };

  return (
    <AmbientBackground>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ScreenName>Settings</ScreenName>
        </View>

        {/* === ACCOUNTS === */}
        <View style={styles.section}>
          <SectionHeader>ACCOUNTS</SectionHeader>

          {accountsLoading ? (
            <ActivityIndicator size="small" color={colors.brand.steelBlue} style={styles.loader} />
          ) : accounts.length === 0 ? (
            <GlassCard tier="standard" style={styles.card}>
              <View style={styles.cardContent}>
                <BodyText style={styles.emptyText}>No accounts linked</BodyText>
                <Sublabel>Connect your bank to get started</Sublabel>
              </View>
            </GlassCard>
          ) : (
            <GlassCard tier="standard" style={styles.card}>
              <View style={styles.cardContent}>
                {accounts.map((account: Account, index: number) => (
                  <TouchableOpacity
                    key={account.id}
                    activeOpacity={0.6}
                    style={[
                      styles.accountRow,
                      index < accounts.length - 1 && styles.rowBorder,
                    ]}
                  >
                    {/* SVG icon */}
                    <View style={styles.accountIcon}>
                      {isCredit(account) ? <CardIcon /> : <BankIcon />}
                    </View>

                    {/* Name + mask + balance */}
                    <View style={styles.accountInfo}>
                      <BodyBold numberOfLines={1} style={styles.accountName}>
                        {account.name} {'\u00B7\u00B7\u00B7'}{account.mask}
                      </BodyBold>
                      {renderAccountBalance(account)}
                    </View>

                    {/* Chevron */}
                    <View style={styles.chevronContainer}>
                      <Chevron />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>
          )}

          <TouchableOpacity onPress={handleAddAccount} style={styles.actionButton} activeOpacity={0.7}>
            <BodyBold style={styles.actionButtonText}>+ Add Account</BodyBold>
          </TouchableOpacity>
        </View>

        {/* === CATEGORIES === */}
        <View style={styles.section}>
          <SectionHeader>CATEGORIES</SectionHeader>

          <GlassCard tier="standard" style={styles.card}>
            <View style={styles.cardContent}>
              {categories
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((category, index) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => handleEditCategory(category)}
                    activeOpacity={0.6}
                    style={[
                      styles.categoryRow,
                      index < categories.length - 1 && styles.rowBorder,
                    ]}
                  >
                    {/* Drag handle */}
                    <BodySmall style={styles.dragHandle}>{'\u2630'}</BodySmall>

                    {/* Category name */}
                    <View style={styles.categoryInfo}>
                      <BodyText>{category.name}</BodyText>
                    </View>

                    {/* Chevron */}
                    <View style={styles.chevronContainer}>
                      <Chevron />
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          </GlassCard>

          <TouchableOpacity onPress={handleCreateCategory} style={styles.actionButton} activeOpacity={0.7}>
            <BodyBold style={styles.actionButtonText}>+ Add Category</BodyBold>
          </TouchableOpacity>
        </View>

        {/* === PREFERENCES === */}
        <View style={styles.section}>
          <SectionHeader>PREFERENCES</SectionHeader>

          <GlassCard tier="standard" style={styles.card}>
            <View style={styles.cardContent}>
              {/* Budget Period */}
              <View style={[styles.prefRow, styles.rowBorder]}>
                <BodyText>Budget Period</BodyText>
                <BodyBold style={styles.prefValue}>{budgetPeriod}</BodyBold>
              </View>

              {/* Currency */}
              <View style={[styles.prefRow, styles.rowBorder]}>
                <BodyText>Currency</BodyText>
                <BodyBold style={styles.prefValue}>{currency}</BodyBold>
              </View>

              {/* Notifications */}
              <View style={styles.prefRow}>
                <BodyText>Notifications</BodyText>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ false: colors.bg.misty, true: colors.brand.celadon }}
                  thumbColor={colors.white}
                />
              </View>
            </View>
          </GlassCard>
        </View>

        {/* === Bottom actions (centered, no card) === */}
        <View style={styles.bottomActions}>
          {accounts.length > 0 && (
            <TouchableOpacity onPress={handleDisconnect} activeOpacity={0.6} style={styles.bottomAction}>
              <BodyText style={styles.warningText}>Disconnect Plaid</BodyText>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSignOut} activeOpacity={0.6} style={styles.bottomAction}>
            <BodyText style={styles.warningText}>Sign Out</BodyText>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Category Editor */}
      <CategoryEditor
        visible={categoryEditorVisible}
        category={isCreatingCategory ? null : editingCategory}
        onSave={handleSaveCategory}
        onClose={() => setCategoryEditorVisible(false)}
      />
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  section: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  card: {
    marginTop: spacing.md,
  },
  cardContent: {
    padding: spacing.lg,
  },
  loader: {
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    marginBottom: spacing.xs,
  },

  // Shared row border
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(218,224,224,0.18)',
  },

  // Account rows
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: spacing.lg,
  },
  accountIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(81,105,122,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 13,
  },
  accountBalance: {
    fontSize: 12,
    color: colors.data.neutral,
    marginTop: 2,
  },
  availableLabel: {
    fontSize: 9,
    color: colors.data.neutral,
  },
  chevronContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Category rows
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: spacing.md,
  },
  dragHandle: {
    fontSize: 14,
    color: colors.data.neutral,
    width: 20,
    textAlign: 'center',
  },
  categoryInfo: {
    flex: 1,
  },

  // Action button
  actionButton: {
    marginTop: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.xl,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(218,224,224,0.4)',
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.brand.steelBlue,
    fontSize: 13,
  },

  // Preferences
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  prefValue: {
    color: colors.brand.steelBlue,
    fontSize: 13,
  },

  // Bottom actions (centered, no card)
  bottomActions: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.lg,
  },
  bottomAction: {
    paddingVertical: spacing.md,
  },
  warningText: {
    color: colors.data.warning,
    textAlign: 'center',
  },

  bottomPad: {
    height: 120,
  },
});
