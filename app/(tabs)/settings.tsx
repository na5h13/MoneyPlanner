// Settings Screen — OpenSpec Section 21, Function 4
// Accounts list (type icon, last-4, balance), Plaid Link for adding accounts,
// Account hide/show, Category management (create, edit, delete, reorder with drag handles),
// Preferences (budget period, currency, notifications), Manual sync, CSV export, Plaid disconnect

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
import { AmountText } from '@/src/components/ui/AmountText';
import { CategoryEditor } from '@/src/components/budget/CategoryEditor';
import { colors, spacing, fonts } from '@/src/theme';
import { useBudgetStore } from '@/src/stores/budgetStore';
import { categoryApi, accountApi, settingsApi } from '@/src/services/api';
import { Account, Category } from '@/src/types';

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [budgetPeriod, setBudgetPeriod] = useState('monthly');

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
        setBudgetPeriod(res.data.budget_period || 'monthly');
      }
    } catch {
      // Use defaults
    }
  };

  // === Account Actions ===
  const handleAddAccount = useCallback(async () => {
    try {
      // 1. Get a link token from backend
      const res = await accountApi.createLinkToken();
      const linkToken = res.link_token;

      // 2. Clear any prior Plaid session
      await plaidDestroy();

      // 3. Initialize Plaid Link (noLoadingState prevents blank screen)
      const plaidConfig: any = { token: linkToken, noLoadingState: true };
      plaidCreate(plaidConfig);

      // 4. Open Plaid Link
      plaidOpen({
        onSuccess: async (success) => {
          try {
            // Exchange public token for access token
            await accountApi.exchangeToken(success.publicToken, success.metadata);
            // Sync transactions for the new account
            await fetchAccounts();
            syncTransactions();
            Alert.alert('Account Linked', 'Your bank account has been connected successfully.');
          } catch {
            Alert.alert('Error', 'Failed to complete account linking');
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

  const handleToggleAccount = useCallback(async (id: string) => {
    await toggleAccountHidden(id);
  }, [toggleAccountHidden]);

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
            // _layout.tsx auth router redirects to /auth/login
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

  // === Sync ===
  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    await syncTransactions();
    setIsSyncing(false);
  }, [syncTransactions]);

  // === Export ===
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await settingsApi.export();
      Alert.alert('Export', 'CSV export generated successfully.');
    } catch {
      Alert.alert('Error', 'Failed to export data');
    }
    setIsExporting(false);
  }, []);

  // === Preferences ===
  const handleNotificationToggle = useCallback(async (value: boolean) => {
    setNotificationsEnabled(value);
    try {
      await settingsApi.update({ notifications_enabled: value });
    } catch {
      setNotificationsEnabled(!value);
    }
  }, []);

  // Account type icon (text-based, no emoji per spec — using abbreviated labels)
  const accountTypeLabel = (type: string): string => {
    switch (type) {
      case 'depository': return 'DEP';
      case 'credit': return 'CC';
      case 'loan': return 'LN';
      case 'investment': return 'INV';
      default: return 'ACC';
    }
  };

  return (
    <AmbientBackground>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ScreenName>Settings</ScreenName>
        </View>

        {/* === ACCOUNTS SECTION === */}
        <View style={styles.section}>
          <SectionHeader>LINKED ACCOUNTS</SectionHeader>

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
                  <View
                    key={account.id}
                    style={[
                      styles.accountRow,
                      index < accounts.length - 1 && styles.accountRowBorder,
                    ]}
                  >
                    {/* Type icon */}
                    <View style={styles.accountTypeIcon}>
                      <BodySmall style={styles.accountTypeText}>
                        {accountTypeLabel(account.type)}
                      </BodySmall>
                    </View>

                    {/* Name + last 4 */}
                    <View style={styles.accountInfo}>
                      <BodyBold numberOfLines={1} style={styles.accountName}>
                        {account.name}
                      </BodyBold>
                      <Sublabel>···{account.mask}</Sublabel>
                    </View>

                    {/* Balance */}
                    <AmountText
                      cents={-(account.balance_current || 0)}
                      fontSize={13}
                    />

                    {/* Hide/Show toggle */}
                    <Switch
                      value={!account.hidden}
                      onValueChange={() => handleToggleAccount(account.id)}
                      trackColor={{ false: colors.bg.misty, true: colors.brand.celadon }}
                      thumbColor={colors.white}
                      style={styles.toggleSwitch}
                    />
                  </View>
                ))}
              </View>
            </GlassCard>
          )}

          {/* Add Account Button */}
          <TouchableOpacity onPress={handleAddAccount} style={styles.actionButton} activeOpacity={0.7}>
            <BodyBold style={styles.actionButtonText}>+ Add Account</BodyBold>
          </TouchableOpacity>
        </View>

        {/* === CATEGORIES SECTION === */}
        <View style={styles.section}>
          <SectionHeader>CATEGORIES</SectionHeader>

          <GlassCard tier="standard" style={styles.card}>
            <View style={styles.cardContent}>
              {categories
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((category, index) => (
                  <View
                    key={category.id}
                    style={[
                      styles.categoryRow,
                      index < categories.length - 1 && styles.categoryRowBorder,
                    ]}
                  >
                    {/* Drag handle */}
                    <View style={styles.dragHandle}>
                      <BodySmall style={styles.dragHandleText}>☰</BodySmall>
                    </View>

                    {/* Category name */}
                    <TouchableOpacity
                      onPress={() => handleEditCategory(category)}
                      style={styles.categoryName}
                      activeOpacity={0.6}
                    >
                      <BodyText>{category.name}</BodyText>
                      {category.is_default && (
                        <Sublabel style={styles.defaultBadge}>default</Sublabel>
                      )}
                    </TouchableOpacity>

                    {/* Delete */}
                    {category.name !== 'Uncategorized' && (
                      <TouchableOpacity
                        onPress={() => handleDeleteCategory(category)}
                        style={styles.deleteBtn}
                        activeOpacity={0.6}
                      >
                        <BodySmall style={styles.deleteText}>×</BodySmall>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
            </View>
          </GlassCard>

          {/* Add Category Button */}
          <TouchableOpacity onPress={handleCreateCategory} style={styles.actionButton} activeOpacity={0.7}>
            <BodyBold style={styles.actionButtonText}>+ Add Category</BodyBold>
          </TouchableOpacity>
        </View>

        {/* === PREFERENCES SECTION === */}
        <View style={styles.section}>
          <SectionHeader>PREFERENCES</SectionHeader>

          <GlassCard tier="standard" style={styles.card}>
            <View style={styles.cardContent}>
              {/* Budget Period */}
              <View style={[styles.prefRow, styles.prefRowBorder]}>
                <BodyText>Budget Period</BodyText>
                <BodyBold style={styles.prefValue}>{budgetPeriod}</BodyBold>
              </View>

              {/* Currency */}
              <View style={[styles.prefRow, styles.prefRowBorder]}>
                <BodyText>Currency</BodyText>
                <BodyBold style={styles.prefValue}>USD</BodyBold>
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

        {/* === ACTIONS SECTION === */}
        <View style={styles.section}>
          <SectionHeader>ACTIONS</SectionHeader>

          <GlassCard tier="standard" style={styles.card}>
            <View style={styles.cardContent}>
              {/* Manual Sync */}
              <TouchableOpacity
                onPress={handleSync}
                disabled={isSyncing}
                style={[styles.prefRow, styles.prefRowBorder]}
                activeOpacity={0.6}
              >
                <BodyText>Sync Now</BodyText>
                {isSyncing ? (
                  <ActivityIndicator size="small" color={colors.brand.steelBlue} />
                ) : (
                  <Sublabel>
                    {syncStatus.last_synced_at
                      ? `Last: ${new Date(syncStatus.last_synced_at).toLocaleTimeString()}`
                      : 'Never synced'}
                  </Sublabel>
                )}
              </TouchableOpacity>

              {/* Export CSV */}
              <TouchableOpacity
                onPress={handleExport}
                disabled={isExporting}
                style={[styles.prefRow, styles.prefRowBorder]}
                activeOpacity={0.6}
              >
                <BodyText>Export CSV</BodyText>
                {isExporting && <ActivityIndicator size="small" color={colors.brand.steelBlue} />}
              </TouchableOpacity>

              {/* Disconnect */}
              {accounts.length > 0 && (
                <TouchableOpacity
                  onPress={handleDisconnect}
                  style={[styles.prefRow, styles.prefRowBorder]}
                  activeOpacity={0.6}
                >
                  <BodyText style={styles.dangerText}>Disconnect Bank</BodyText>
                </TouchableOpacity>
              )}

              {/* Sign Out */}
              <TouchableOpacity
                onPress={handleSignOut}
                style={styles.prefRow}
                activeOpacity={0.6}
              >
                <BodyText style={styles.dangerText}>Sign Out</BodyText>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>

        {/* Bottom padding for tab bar */}
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

  // Account rows
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: spacing.md,
  },
  accountRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(218,224,224,0.18)',
  },
  accountTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(81,105,122,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTypeText: {
    fontSize: 9,
    fontFamily: fonts.dataBold,
    fontWeight: '600',
    color: colors.brand.steelBlue,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 13,
  },
  toggleSwitch: {
    marginLeft: spacing.sm,
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
  },

  // Category rows
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: spacing.md,
  },
  categoryRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(218,224,224,0.18)',
  },
  dragHandle: {
    width: 20,
    alignItems: 'center',
  },
  dragHandleText: {
    fontSize: 14,
    color: colors.data.neutral,
  },
  categoryName: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  defaultBadge: {
    fontSize: 8,
    color: colors.data.neutral,
    fontStyle: 'italic',
  },
  deleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(139,114,96,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontSize: 16,
    color: colors.data.deficit,
    fontWeight: '600',
    lineHeight: 18,
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
  prefRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(218,224,224,0.18)',
  },
  prefValue: {
    color: colors.brand.steelBlue,
    fontSize: 13,
  },
  dangerText: {
    color: colors.data.warning,
  },

  bottomPad: {
    height: 120,
  },
});
