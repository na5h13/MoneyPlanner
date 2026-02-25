// src/components/budget/LineItem.tsx
// Budget line item row — name, Budget amount column, Trending column.
// Long-press name → rename. Swipe-left → delete.
// Tap budget amount → inline edit.
// Section 21, Functions 5-6.

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  PanResponder,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/src/theme';
import { TrendingCell, TrendingClassification } from './TrendingCell';

export interface LineItemData {
  id: string;
  name: string;
  budgetAmount: number;
  trendingAmount: number;
  classification: TrendingClassification;
  isNew?: boolean;
}

interface LineItemProps {
  item: LineItemData;
  onUpdate: (id: string, updates: Partial<LineItemData>) => void;
  onDelete: (id: string) => void;
}

const DELETE_THRESHOLD = -80;

export function LineItem({ item, onUpdate, onDelete }: LineItemProps) {
  const [editingBudget, setEditingBudget] = useState(item.isNew || false);
  const [budgetDraft, setBudgetDraft] = useState(String(item.budgetAmount || ''));
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(item.name);
  const slideX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy),
      onPanResponderMove: (_, { dx }) => {
        if (dx < 0) {
          slideX.setValue(dx);
          deleteOpacity.setValue(Math.min(-dx / 80, 1));
        }
      },
      onPanResponderRelease: (_, { dx }) => {
        if (dx < DELETE_THRESHOLD) {
          Alert.alert('Delete item', `Remove "${item.name}" from budget?`, [
            { text: 'Cancel', onPress: resetSlide },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) },
          ]);
        } else {
          resetSlide();
        }
      },
    })
  ).current;

  function resetSlide() {
    Animated.parallel([
      Animated.spring(slideX, { toValue: 0, useNativeDriver: true }),
      Animated.timing(deleteOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
  }

  function commitBudget() {
    const val = parseFloat(budgetDraft.replace(/[^0-9.]/g, ''));
    if (!isNaN(val)) onUpdate(item.id, { budgetAmount: val });
    setEditingBudget(false);
  }

  function commitName() {
    if (nameDraft.trim()) onUpdate(item.id, { name: nameDraft.trim() });
    setEditingName(false);
  }

  return (
    <View style={styles.wrapper}>
      {/* Delete background */}
      <Animated.View style={[styles.deleteBackground, { opacity: deleteOpacity }]}>
        <Text style={styles.deleteIcon}>🗑️</Text>
      </Animated.View>

      {/* Row content */}
      <Animated.View
        style={[styles.row, { transform: [{ translateX: slideX }] }]}
        {...panResponder.panHandlers}
      >
        {/* Name */}
        {editingName ? (
          <TextInput
            style={styles.nameInput}
            value={nameDraft}
            onChangeText={setNameDraft}
            onBlur={commitName}
            onSubmitEditing={commitName}
            autoFocus
            returnKeyType="done"
          />
        ) : (
          <TouchableOpacity
            style={styles.nameArea}
            onLongPress={() => setEditingName(true)}
            delayLongPress={500}
          >
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          </TouchableOpacity>
        )}

        {/* Budget amount */}
        {editingBudget ? (
          <TextInput
            style={styles.budgetInput}
            value={budgetDraft}
            onChangeText={setBudgetDraft}
            onBlur={commitBudget}
            onSubmitEditing={commitBudget}
            keyboardType="decimal-pad"
            autoFocus={!item.isNew}
            placeholder="0"
            placeholderTextColor={colors.data.neutral}
            returnKeyType="done"
          />
        ) : (
          <TouchableOpacity onPress={() => { setBudgetDraft(String(item.budgetAmount)); setEditingBudget(true); }}>
            <Text style={styles.budgetAmount}>
              ${item.budgetAmount > 0 ? item.budgetAmount.toFixed(0) : '—'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Trending column */}
        <TrendingCell
          amount={item.trendingAmount}
          classification={item.classification}
          lineItemId={item.id}
          onClassificationChange={(id, c) => onUpdate(id, { classification: c })}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: colors.data.deficit,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  deleteIcon: {
    fontSize: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.0)',
  },
  nameArea: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
  },
  nameInput: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.brand.steelBlue,
    paddingVertical: 2,
    marginRight: spacing.sm,
  },
  budgetAmount: {
    fontSize: typography.size.base,
    fontWeight: '600',
    fontFamily: typography.fontFamily.mono,
    color: colors.text.primary,
    minWidth: 60,
    textAlign: 'right',
    marginRight: spacing.sm,
  },
  budgetInput: {
    fontSize: typography.size.base,
    fontWeight: '600',
    fontFamily: typography.fontFamily.mono,
    color: colors.text.primary,
    minWidth: 60,
    textAlign: 'right',
    marginRight: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.brand.steelBlue,
  },
});
