// src/components/budget/CategoryCard.tsx
// Function 5 — Budget category card with line items.
// Glass card with directional borders.
// Header: category name, total budget, total trending.
// Line items below, "+ Add item" at bottom.
// Section 21, Functions 5-6.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { LineItem, LineItemData } from './LineItem';
import { colors, spacing, typography, borderRadius, shadows } from '@/src/theme';
import { api } from '@/src/services/api';

interface CategoryCardProps {
  categoryId: string;
  name: string;
  icon: string;
  items: LineItemData[];
  onItemsChange: (newItems: LineItemData[]) => void;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export function CategoryCard({
  categoryId,
  name,
  icon,
  items,
  onItemsChange,
}: CategoryCardProps) {
  const [collapsed, setCollapsed] = useState(false);

  const totalBudget = items.reduce((s, i) => s + i.budgetAmount, 0);
  const totalTrending = items.reduce((s, i) => s + i.trendingAmount, 0);
  const trendDelta = totalTrending - totalBudget;
  const trendColor = trendDelta > 0 ? colors.data.warning : colors.data.surplus;

  async function handleAddItem() {
    const newItem: LineItemData = {
      id: genId(),
      name: 'New item',
      budgetAmount: 0,
      trendingAmount: 0,
      classification: 'TRUE_VARIABLE',
      isNew: true,
    };
    const updated = [...items, newItem];
    onItemsChange(updated);

    // Persist to backend
    try {
      await api.post('/api/budget/items', {
        category_id: categoryId,
        name: newItem.name,
        budget_amount: newItem.budgetAmount,
      });
    } catch {
      // Optimistic; handle errors silently in DEV
    }
  }

  async function handleUpdate(id: string, updates: Partial<LineItemData>) {
    const updated = items.map((i) => (i.id === id ? { ...i, ...updates } : i));
    onItemsChange(updated);

    try {
      await api.put(`/api/budget/items/${id}`, {
        name: updates.name,
        budget_amount: updates.budgetAmount,
        classification: updates.classification,
      });
    } catch {}
  }

  async function handleDelete(id: string) {
    onItemsChange(items.filter((i) => i.id !== id));
    try {
      await api.delete(`/api/budget/items/${id}`);
    } catch {}
  }

  return (
    <GlassCard style={styles.card}>
      {/* Card header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setCollapsed((c) => !c)}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.categoryName}>{name}</Text>
        </View>
        <View style={styles.headerRight}>
          {/* Budget total */}
          <View style={styles.totalCol}>
            <Text style={styles.totalLabel}>Budget</Text>
            <Text style={styles.totalAmount}>${totalBudget.toFixed(0)}</Text>
          </View>
          {/* Trending total */}
          <View style={styles.totalCol}>
            <Text style={styles.totalLabel}>Trending</Text>
            <Text style={[styles.totalAmount, { color: trendColor }]}>
              ${totalTrending.toFixed(0)}
            </Text>
          </View>
          <Text style={styles.chevron}>{collapsed ? '›' : '⌄'}</Text>
        </View>
      </TouchableOpacity>

      {/* Column headers */}
      {!collapsed && (
        <>
          <View style={styles.colHeaders}>
            <Text style={[styles.colHeader, styles.colName]}>Item</Text>
            <Text style={[styles.colHeader, styles.colBudget]}>Budget</Text>
            <Text style={[styles.colHeader, styles.colTrending]}>Trending</Text>
          </View>
          <View style={styles.divider} />

          {/* Line items */}
          {items.map((item) => (
            <LineItem
              key={item.id}
              item={item}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}

          {/* Add item */}
          <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
            <Text style={styles.addIcon}>+</Text>
            <Text style={styles.addText}>Add item</Text>
          </TouchableOpacity>
        </>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  icon: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: typography.fontFamily.display,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  totalCol: {
    alignItems: 'flex-end',
    minWidth: 56,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.data.neutral,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: typography.size.base,
    fontWeight: '700',
    fontFamily: typography.fontFamily.mono,
    color: colors.text.primary,
  },
  chevron: {
    fontSize: 18,
    color: colors.data.neutral,
    marginLeft: spacing.xs,
  },
  colHeaders: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: 4,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.data.neutral,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colName: { flex: 1 },
  colBudget: { width: 68, textAlign: 'right', marginRight: spacing.sm },
  colTrending: { width: 68, textAlign: 'right' },
  divider: {
    height: 0.5,
    backgroundColor: colors.brand.softTaupe,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    opacity: 0.5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    marginTop: 4,
  },
  addIcon: {
    fontSize: 16,
    color: colors.brand.steelBlue,
    fontWeight: '700',
  },
  addText: {
    fontSize: typography.size.sm,
    color: colors.brand.steelBlue,
    fontWeight: '600',
  },
});
