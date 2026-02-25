// Category Card — OpenSpec Section 21, Function 5
// Scrollable category cards with line items, budget column with user-set targets,
// tap-to-edit target, long-press rename, swipe-left delete, "+ Add item",
// category collapse/expand, progress bar per category

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
  BodyText,
  BodyBold,
  BodySmall,
  SectionHeader,
  DataText,
  Sublabel,
} from '@/src/components/ui/Typography';
import { AmountText } from '@/src/components/ui/AmountText';
import { colors, spacing, fonts, glass } from '@/src/theme';
import { BudgetCategoryDisplay, BudgetLineItem, TrendingStatus } from '@/src/types';
import { formatAmount } from '@/src/utils/formatAmount';

interface CategoryCardProps {
  data: BudgetCategoryDisplay;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onEditTarget: (categoryId: string, amount: number) => void;
  onAddItem: (categoryId: string, name: string) => void;
  onRenameItem: (itemId: string, name: string) => void;
  onDeleteItem: (itemId: string) => void;
}

// Status → color mapping (NNR-01: NO RED)
function statusColor(status: TrendingStatus): string {
  switch (status) {
    case 'ON_TRACK': return colors.brand.deepSage;
    case 'WATCH': return colors.data.warning;
    case 'OVER': return colors.data.warning;
    default: return colors.data.neutral;
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
}: CategoryCardProps) {
  const { category, target, line_items, spent, trending } = data;
  const targetAmount = target?.target_amount || 0;
  const trendingStatus = trending?.status || 'NO_TARGET';

  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Tap header → toggle collapse
  const handleHeaderPress = useCallback(() => {
    onToggleCollapse();
  }, [onToggleCollapse]);

  // Tap budget target → edit
  const handleTargetPress = useCallback(() => {
    setTargetInput(targetAmount ? String(targetAmount / 100) : '');
    setEditingTarget(true);
  }, [targetAmount]);

  const handleTargetSubmit = useCallback(() => {
    const parsed = parseFloat(targetInput);
    if (!isNaN(parsed) && parsed >= 0) {
      onEditTarget(category.id, Math.round(parsed * 100)); // Convert to cents
    }
    setEditingTarget(false);
  }, [targetInput, category.id, onEditTarget]);

  // Long-press line item → rename
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
    // Fallback for Android (no Alert.prompt)
    if (!Alert.prompt) {
      onRenameItem(item.id, item.display_name);
    }
  }, [onRenameItem]);

  // Swipe-left to delete (simplified as tap delete for now)
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

  // Add item
  const handleAddItem = useCallback(() => {
    if (newItemName.trim()) {
      onAddItem(category.id, newItemName.trim());
      setNewItemName('');
      setAddingItem(false);
    }
  }, [newItemName, category.id, onAddItem]);

  // Progress bar calculations
  const progressPercent = targetAmount > 0 ? Math.min(spent / targetAmount, 1.5) : 0;
  const markerPercent = targetAmount > 0 ? 1 : 0; // Budget marker at 100%

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
          <View style={styles.headerRight}>
            {/* Spent subtotal */}
            <AmountText cents={spent} fontSize={13} />
            {/* Budget target */}
            {targetAmount > 0 && (
              <Sublabel style={styles.targetLabel}>
                of {formatAmount(-targetAmount)}
              </Sublabel>
            )}
          </View>
        </TouchableOpacity>

        {/* Progress bar — 4px height, 2px radius */}
        {targetAmount > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(progressPercent * 100, 100)}%`,
                    backgroundColor: statusColor(trendingStatus),
                  },
                ]}
              />
              {/* Budget marker — 2px vertical line at target position */}
              <View
                style={[
                  styles.budgetMarker,
                  { left: `${Math.min(markerPercent * 100, 100)}%` },
                ]}
              />
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
              <Sublabel style={styles.colHeaderRight}>SPENT</Sublabel>
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
                <DataText style={styles.lineItemAmount}>
                  {item.budget_amount ? formatAmount(-item.budget_amount) : '—'}
                </DataText>
                {/* Delete button (swipe-left substitute) */}
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
    alignItems: 'flex-end',
  },
  targetLabel: {
    fontSize: 9,
    marginTop: 1,
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
    width: 2,
    height: 8,
    backgroundColor: colors.brand.deepSage,
    borderRadius: 1,
    marginLeft: -1,
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
