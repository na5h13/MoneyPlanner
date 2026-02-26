// Category Card — OpenSpec Section 21, Functions 5 + 6 (M5: Trending Column)
// Collapsible category cards with line items, budget targets, progress bar,
// trending projection (daily run-rate → month-end), status badge (ON_TRACK/WATCH/OVER)

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
import { formatAmount } from '@/src/utils/formatAmount';

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

function statusLabel(status: TrendingStatus): string | null {
  switch (status) {
    case 'ON_TRACK': return 'ON TRACK';
    case 'WATCH':    return 'WATCH';
    case 'OVER':     return 'OVER';
    default:         return null;
  }
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

  // Show trending projection when we have enough data
  const showTrending = (
    trendingStatus === 'ON_TRACK' ||
    trendingStatus === 'WATCH' ||
    trendingStatus === 'OVER'
  ) && projected > 0;

  const badge = statusLabel(trendingStatus);
  const sColor = statusColor(trendingStatus);

  return (
    <GlassCard
      tier="standard"
      glow={statusGlow(trendingStatus)}
      style={styles.card}
    >
      <View style={styles.cardInner}>
        {/* Category Header — tap to collapse/expand */}
        <TouchableOpacity onPress={handleHeaderPress} activeOpacity={0.7} style={styles.header}>
          <View style={styles.headerLeft}>
            <BodyBold style={styles.categoryName}>{category.name}</BodyBold>
            <BodySmall style={styles.collapseIndicator}>
              {isCollapsed ? '▸' : '▾'}
            </BodySmall>
          </View>

          {/* Right: SPENT → PROJECTED + STATUS BADGE */}
          <View style={styles.headerRight}>
            <View style={styles.headerMetrics}>
              <View style={styles.headerMetric}>
                <Sublabel style={styles.metricLabel}>SPENT</Sublabel>
                <DataText style={styles.metricAmount}>
                  {formatAmount(-spent)}
                </DataText>
              </View>

              {showTrending && (
                <>
                  <Sublabel style={styles.metricArrow}>→</Sublabel>
                  <View style={styles.headerMetric}>
                    <Sublabel style={[styles.metricLabel, { color: sColor }]}>PROJ</Sublabel>
                    <DataText style={[styles.metricAmount, { color: sColor }]}>
                      {formatAmount(-projected)}
                    </DataText>
                  </View>
                </>
              )}

              {!showTrending && targetAmount > 0 && (
                <Sublabel style={styles.ofTarget}>
                  of {formatAmount(-targetAmount)}
                </Sublabel>
              )}
            </View>

            {badge && (
              <View style={[styles.statusBadge, { borderColor: sColor + '55' }]}>
                <Sublabel style={[styles.statusText, { color: sColor }]}>
                  {badge}
                </Sublabel>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Progress bar: projected (faded) behind spent (solid) */}
        {targetAmount > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              {/* Projected fill — faded, behind spent */}
              {showTrending && projectedPct > spentPct && (
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${projectedPct}%`,
                      backgroundColor: sColor + '28',
                    },
                  ]}
                />
              )}
              {/* Spent fill — solid, on top */}
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${spentPct}%`,
                    backgroundColor: sColor,
                  },
                ]}
              />
              {/* Budget marker at 100% */}
              <View style={styles.budgetMarker} />
            </View>
          </View>
        )}

        {/* Expanded content */}
        {!isCollapsed && (
          <View style={styles.expandedContent}>
            {/* Column headers */}
            <View style={styles.columnHeaders}>
              <Sublabel style={styles.colHeaderLeft}>ITEM</Sublabel>
              <Sublabel style={styles.colHeaderRight}>BUDGET</Sublabel>
            </View>

            {/* Line items */}
            {line_items.map((item) => (
              <TouchableOpacity
                key={item.id}
                onLongPress={() => handleLongPressItem(item)}
                activeOpacity={0.8}
                style={styles.lineItem}
              >
                <View style={styles.lineItemLeft}>
                  <BodySmall numberOfLines={1} style={styles.lineItemName}>
                    {item.display_name}
                  </BodySmall>
                </View>
                {item.classification_type && classificationBadge(item.classification_type) ? (
                  <TouchableOpacity
                    onLongPress={() => handleLongPressClassification(item)}
                    activeOpacity={0.7}
                    style={styles.classBadge}
                  >
                    <Sublabel style={styles.classBadgeText}>
                      {classificationBadge(item.classification_type)}
                    </Sublabel>
                  </TouchableOpacity>
                ) : null}
                <DataText style={styles.lineItemAmount}>
                  {item.budget_amount ? formatAmount(-item.budget_amount) : '—'}
                </DataText>
                <TouchableOpacity
                  onPress={() => handleDeleteItem(item)}
                  style={styles.lineDeleteBtn}
                  activeOpacity={0.6}
                >
                  <BodySmall style={styles.lineDeleteText}>×</BodySmall>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

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
                    {targetAmount ? formatAmount(-targetAmount) : 'Set target'}
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingTop: 2,
  },
  categoryName: {
    fontSize: 14,
    color: colors.brand.deepSage,
  },
  collapseIndicator: {
    fontSize: 10,
    color: colors.data.neutral,
  },

  // Right side: metrics + status badge
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  headerMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerMetric: {
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.data.neutral,
    marginBottom: 1,
  },
  metricAmount: {
    fontSize: 12,
    color: colors.brand.deepSage,
  },
  metricArrow: {
    fontSize: 9,
    color: colors.data.neutral,
    marginTop: 10,
  },
  ofTarget: {
    fontSize: 9,
    color: colors.data.neutral,
    marginTop: 10,
  },

  // Status badge
  statusBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
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
  columnHeaders: {
    flexDirection: 'row',
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(218,224,224,0.18)',
    marginBottom: spacing.sm,
  },
  colHeaderLeft: {
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 8,
    fontWeight: '600',
  },
  colHeaderRight: {
    width: 65,
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 8,
    fontWeight: '600',
  },

  // Line items
  lineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(218,224,224,0.10)',
  },
  lineItemLeft: {
    flex: 1,
  },
  lineItemName: {
    fontSize: 12,
    color: colors.brand.deepSage,
  },
  lineItemAmount: {
    width: 65,
    textAlign: 'right',
    fontSize: 11,
    color: colors.brand.deepSage,
  },
  classBadge: {
    borderWidth: 1,
    borderColor: 'rgba(138,138,138,0.35)',
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginRight: 4,
  },
  classBadgeText: {
    fontSize: 7,
    color: colors.data.neutral,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  lineDeleteBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  lineDeleteText: {
    fontSize: 14,
    color: colors.data.neutral,
    fontWeight: '600',
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
