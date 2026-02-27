// Category Card — OpenSpec Section 21, Functions 5 + 6
// Collapsible category cards with dual Budget/Trending columns,
// $spent/$target header, classification badges, per-item trending,
// status indicators (watch/over), progress bar, warning glow

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { GlassCard } from '@/src/components/ui/Glass';
import {
  BodySmall,
  BodyBold,
  DataText,
  Sublabel,
} from '@/src/components/ui/Typography';
import { colors, spacing, fonts } from '@/src/theme';
import { BudgetCategoryDisplay, BudgetLineItem, TrendingStatus, ClassificationType } from '@/src/types';
import { formatAmountUnsigned } from '@/src/utils/formatAmount';

interface CategoryCardProps {
  data: BudgetCategoryDisplay;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onEditTarget: (categoryId: string, amount: number) => void;
  onAddItem: (categoryId: string, name: string) => void;
  onRenameItem: (itemId: string, name: string) => void;
  onDeleteItem: (itemId: string) => void;
  onReclassify?: (merchant: string, type: ClassificationType) => void;
}

// Classification badge labels (NNR-ICON: no emoji, text only)
function classificationBadge(type: ClassificationType): string {
  switch (type) {
    case 'FIXED':              return 'FX';
    case 'RECURRING_VARIABLE': return 'RV';
    case 'TRUE_VARIABLE':      return 'TV';
    default:                   return '';
  }
}

// Per-item trending prefix: ✓ posted, ~ estimated
function trendingPrefix(item: BudgetLineItem): string {
  if (!item.item_trending) return '';
  if (item.item_trending.posted) return '\u2713';  // ✓
  if (item.classification_type === 'RECURRING_VARIABLE') return '~';
  return '';
}

// Per-item status indicator
function itemStatusIcon(item: BudgetLineItem): string {
  if (!item.item_trending) return '';
  if (item.item_trending.status === 'over') return '\u25B2';   // ▲
  if (item.item_trending.status === 'watch') return '\u26A0';  // ⚠
  return '';
}

// Status → color mapping (NNR-COLOR: NO RED ever)
function statusColor(status: TrendingStatus): string {
  switch (status) {
    case 'ON_TRACK': return colors.brand.deepSage;
    case 'WATCH':    return colors.data.warning;
    case 'OVER':     return colors.data.warning;
    default:         return colors.data.neutral;
  }
}

function statusGlow(status: TrendingStatus): 'warning' | undefined {
  return status === 'OVER' ? 'warning' : undefined;
}

export function CategoryCard({
  data,
  isCollapsed,
  onToggleCollapse,
  onEditTarget,
  onAddItem,
  onRenameItem,
  onDeleteItem,
  onReclassify,
}: CategoryCardProps) {
  const { category, target, line_items, spent, trending } = data;
  const targetAmount = target?.target_amount || 0;
  const trendingStatus = trending?.status || 'NO_TARGET';
  const projected = trending?.projected || 0;
  const isOver = trendingStatus === 'OVER';

  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const handleHeaderPress = useCallback(() => {
    onToggleCollapse();
  }, [onToggleCollapse]);

  const handleTargetPress = useCallback(() => {
    setTargetInput(targetAmount ? String(targetAmount / 100) : '');
    setEditingTarget(true);
  }, [targetAmount]);

  const handleTargetSubmit = useCallback(() => {
    const parsed = parseFloat(targetInput);
    if (!isNaN(parsed) && parsed >= 0) {
      onEditTarget(category.id, Math.round(parsed * 100));
    }
    setEditingTarget(false);
  }, [targetInput, category.id, onEditTarget]);

  const handleLongPressItem = useCallback((item: BudgetLineItem) => {
    Alert.prompt?.(
      'Rename Item',
      `Rename "${item.display_name}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Rename', onPress: (text) => text && onRenameItem(item.id, text) },
      ],
      'plain-text',
      item.display_name
    );
    if (!Alert.prompt) {
      onRenameItem(item.id, item.display_name);
    }
  }, [onRenameItem]);

  const handleDeleteItem = useCallback((item: BudgetLineItem) => {
    Alert.alert(
      'Delete Item',
      `Remove "${item.display_name}" from budget?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteItem(item.id) },
      ]
    );
  }, [onDeleteItem]);

  // Long-press classification badge → reclassify sheet
  const handleLongPressClassification = useCallback((item: BudgetLineItem) => {
    if (!item.linked_merchant || !onReclassify) return;
    const merchant = item.linked_merchant;
    Alert.alert(
      'Classify Spending',
      `How does "${item.display_name}" typically post?`,
      [
        { text: 'Fixed (same amount every time)', onPress: () => onReclassify(merchant, 'FIXED') },
        { text: 'Recurring Variable (varies monthly)', onPress: () => onReclassify(merchant, 'RECURRING_VARIABLE') },
        { text: 'True Variable (irregular)', onPress: () => onReclassify(merchant, 'TRUE_VARIABLE') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [onReclassify]);

  const handleAddItem = useCallback(() => {
    if (newItemName.trim()) {
      onAddItem(category.id, newItemName.trim());
      setNewItemName('');
      setAddingItem(false);
    }
  }, [newItemName, category.id, onAddItem]);

  // Progress bar calculations
  const spentPct = targetAmount > 0 ? Math.min((spent / targetAmount) * 100, 100) : 0;
  const projectedPct = targetAmount > 0 ? Math.min((projected / targetAmount) * 100, 145) : 0;
  const showTrending = (
    trendingStatus === 'ON_TRACK' ||
    trendingStatus === 'WATCH' ||
    trendingStatus === 'OVER'
  ) && projected > 0;

  const sColor = statusColor(trendingStatus);

  return (
    <GlassCard
      tier="standard"
      glow={statusGlow(trendingStatus)}
      style={styles.card}
    >
      <View style={styles.cardInner}>
        {/* Category Header: name left, $spent / $target right */}
        <TouchableOpacity onPress={handleHeaderPress} activeOpacity={0.7} style={styles.header}>
          <View style={styles.headerLeft}>
            <BodyBold style={styles.categoryName}>{category.name}</BodyBold>
            <BodySmall style={styles.collapseIndicator}>
              {isCollapsed ? '\u25B8' : '\u25BE'}
            </BodySmall>
          </View>

          <View style={styles.headerRight}>
            <DataText style={[styles.headerAmount, isOver && { color: colors.data.warning }]}>
              {formatAmountUnsigned(spent)}
              {targetAmount > 0 && (
                <DataText style={styles.headerTarget}>/{formatAmountUnsigned(targetAmount)}</DataText>
              )}
            </DataText>
            {isOver && <BodySmall style={styles.overIndicator}>{'\u25B2'}</BodySmall>}
          </View>
        </TouchableOpacity>

        {/* Progress bar */}
        {targetAmount > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              {showTrending && projectedPct > spentPct && (
                <View
                  style={[
                    styles.progressFill,
                    { width: `${projectedPct}%`, backgroundColor: sColor + '28' },
                  ]}
                />
              )}
              <View
                style={[
                  styles.progressFill,
                  { width: `${spentPct}%`, backgroundColor: sColor },
                ]}
              />
              <View style={styles.budgetMarker} />
            </View>
          </View>
        )}

        {/* Expanded content — dual columns */}
        {!isCollapsed && (
          <View style={styles.expandedContent}>
            {/* Dual column headers */}
            <View style={styles.columnHeaders}>
              <Sublabel style={styles.colHeaderItem}>{/* badge space */}</Sublabel>
              <Sublabel style={styles.colHeaderName}>ITEM</Sublabel>
              <Sublabel style={styles.colHeaderBudget}>BUDGET</Sublabel>
              <Sublabel style={styles.colHeaderTrending}>TRENDING</Sublabel>
              <Sublabel style={styles.colHeaderStatus}>{/* status */}</Sublabel>
            </View>

            {/* Line items — 4-column: badge+name | budget | trending | status */}
            {line_items.map((item) => {
              const badge = item.classification_type ? classificationBadge(item.classification_type) : '';
              const prefix = trendingPrefix(item);
              const statusIcon = itemStatusIcon(item);
              const itemOver = item.item_trending?.status === 'over';
              const itemWatch = item.item_trending?.status === 'watch';

              return (
                <TouchableOpacity
                  key={item.id}
                  onLongPress={() => handleLongPressItem(item)}
                  activeOpacity={0.8}
                  style={styles.lineItem}
                >
                  {/* Classification badge */}
                  {badge ? (
                    <TouchableOpacity
                      onLongPress={() => handleLongPressClassification(item)}
                      activeOpacity={0.7}
                      style={styles.classBadge}
                    >
                      <Sublabel style={styles.classBadgeText}>{badge}</Sublabel>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.classBadgeSpacer} />
                  )}

                  {/* Item name */}
                  <View style={styles.lineItemName}>
                    <BodySmall numberOfLines={1} style={styles.lineItemNameText}>
                      {item.display_name}
                    </BodySmall>
                  </View>

                  {/* Budget amount (unsigned) */}
                  <DataText style={styles.lineItemBudget}>
                    {item.budget_amount ? formatAmountUnsigned(item.budget_amount) : '\u2014'}
                  </DataText>

                  {/* Trending amount */}
                  <DataText style={[
                    styles.lineItemTrending,
                    itemOver && { color: colors.data.warning, fontWeight: '700' },
                    itemWatch && { color: colors.data.warning },
                  ]}>
                    {item.item_trending
                      ? `${prefix}${formatAmountUnsigned(item.item_trending.amount)}`
                      : '\u2014'}
                  </DataText>

                  {/* Status indicator */}
                  <View style={styles.lineItemStatus}>
                    {statusIcon ? (
                      <BodySmall style={[
                        styles.statusIndicator,
                        { color: colors.data.warning },
                      ]}>
                        {statusIcon}
                      </BodySmall>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Budget target row — tap to edit */}
            <View style={styles.targetRow}>
              <Sublabel style={styles.targetRowLabel}>TARGET</Sublabel>
              {editingTarget ? (
                <TextInput
                  style={styles.targetInput}
                  value={targetInput}
                  onChangeText={setTargetInput}
                  onSubmitEditing={handleTargetSubmit}
                  onBlur={handleTargetSubmit}
                  keyboardType="numeric"
                  autoFocus
                  placeholder="0.00"
                  placeholderTextColor={colors.data.neutral}
                />
              ) : (
                <TouchableOpacity onPress={handleTargetPress} activeOpacity={0.6}>
                  <DataText style={styles.targetValue}>
                    {targetAmount ? formatAmountUnsigned(targetAmount) : 'Set target'}
                  </DataText>
                </TouchableOpacity>
              )}
            </View>

            {/* + Add item */}
            {addingItem ? (
              <View style={styles.addItemRow}>
                <TextInput
                  style={styles.addItemInput}
                  value={newItemName}
                  onChangeText={setNewItemName}
                  onSubmitEditing={handleAddItem}
                  onBlur={() => { if (!newItemName.trim()) setAddingItem(false); }}
                  placeholder="Item name"
                  placeholderTextColor={colors.data.neutral}
                  autoFocus
                />
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setAddingItem(true)}
                style={styles.addItemButton}
                activeOpacity={0.6}
              >
                <BodySmall style={styles.addItemText}>+ Add item</BodySmall>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  cardInner: {
    padding: spacing.lg,
  },

  // Header: category name | $spent/$target
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    color: colors.brand.deepSage,
  },
  collapseIndicator: {
    fontSize: 10,
    color: colors.data.neutral,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerAmount: {
    fontSize: 13,
    color: colors.brand.deepSage,
  },
  headerTarget: {
    fontSize: 11,
    color: colors.data.neutral,
  },
  overIndicator: {
    fontSize: 10,
    color: colors.data.warning,
  },

  // Progress bar
  progressContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bg.misty,
    position: 'relative',
    overflow: 'visible',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  budgetMarker: {
    position: 'absolute',
    top: -2,
    left: '100%',
    marginLeft: -1,
    width: 2,
    height: 8,
    backgroundColor: colors.brand.deepSage,
    borderRadius: 1,
  },

  // Expanded content
  expandedContent: {
    marginTop: spacing.lg,
  },

  // Dual column headers
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(218,224,224,0.18)',
    marginBottom: spacing.sm,
  },
  colHeaderItem: {
    width: 24,
    fontSize: 8,
  },
  colHeaderName: {
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 8,
    fontWeight: '600',
  },
  colHeaderBudget: {
    width: 70,
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 8,
    fontWeight: '600',
  },
  colHeaderTrending: {
    width: 74,
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 8,
    fontWeight: '600',
  },
  colHeaderStatus: {
    width: 16,
    fontSize: 8,
  },

  // Line items — 5 columns: badge | name | budget | trending | status
  lineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(218,224,224,0.10)',
  },
  classBadge: {
    width: 22,
    borderWidth: 1,
    borderColor: 'rgba(138,138,138,0.35)',
    borderRadius: 3,
    paddingHorizontal: 2,
    paddingVertical: 1,
    marginRight: 2,
    alignItems: 'center',
  },
  classBadgeText: {
    fontSize: 7,
    color: colors.data.neutral,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  classBadgeSpacer: {
    width: 24,
  },
  lineItemName: {
    flex: 1,
  },
  lineItemNameText: {
    fontSize: 12,
    color: colors.brand.deepSage,
  },
  lineItemBudget: {
    width: 70,
    textAlign: 'right',
    fontSize: 11,
    color: colors.brand.deepSage,
  },
  lineItemTrending: {
    width: 74,
    textAlign: 'right',
    fontSize: 11,
    color: colors.brand.deepSage,
  },
  lineItemStatus: {
    width: 16,
    alignItems: 'center',
  },
  statusIndicator: {
    fontSize: 10,
  },

  // Target row
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(218,224,224,0.18)',
    marginTop: spacing.sm,
  },
  targetRowLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 9,
    fontWeight: '600',
  },
  targetInput: {
    fontFamily: fonts.dataBold,
    fontSize: 14,
    color: colors.brand.deepSage,
    textAlign: 'right',
    minWidth: 80,
    borderBottomWidth: 1,
    borderBottomColor: colors.brand.steelBlue,
    paddingVertical: 2,
  },
  targetValue: {
    fontSize: 13,
    color: colors.brand.steelBlue,
  },

  // Add item
  addItemRow: {
    paddingVertical: spacing.sm,
  },
  addItemInput: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.brand.deepSage,
    borderBottomWidth: 1,
    borderBottomColor: colors.brand.softTaupe,
    paddingVertical: 4,
  },
  addItemButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addItemText: {
    color: colors.brand.steelBlue,
    fontSize: 11,
  },
});
