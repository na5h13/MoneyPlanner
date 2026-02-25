// Category Bottom Sheet — OpenSpec Section 21, Function 3
// Tap transaction → category picker → optional "Apply to all {merchant}" checkbox
// Creates CategoryRule on "Apply to all" selection

import React, { useState, useCallback } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
} from 'react-native';
import { GlassCard } from '@/src/components/ui/Glass';
import { ScreenName, BodyText, BodyBold, Sublabel } from '@/src/components/ui/Typography';
import { AmountText } from '@/src/components/ui/AmountText';
import { colors, spacing, fonts, glass } from '@/src/theme';
import { Category, Transaction } from '@/src/types';
import { truncateMerchant } from '@/src/utils/formatAmount';

interface CategoryPickerProps {
  visible: boolean;
  transaction: Transaction | null;
  categories: Category[];
  onSelect: (categoryId: string, applyToAll: boolean) => void;
  onClose: () => void;
}

export function CategoryPicker({
  visible,
  transaction,
  categories,
  onSelect,
  onClose,
}: CategoryPickerProps) {
  const [applyToAll, setApplyToAll] = useState(false);

  const handleSelect = useCallback((categoryId: string) => {
    onSelect(categoryId, applyToAll);
    setApplyToAll(false);
  }, [onSelect, applyToAll]);

  const handleClose = useCallback(() => {
    setApplyToAll(false);
    onClose();
  }, [onClose]);

  if (!transaction) return null;

  const merchantName = transaction.display_merchant || transaction.merchant_name || transaction.name;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.sheetInner}>
                {/* Handle bar */}
                <View style={styles.handleBar} />

                {/* Transaction info */}
                <View style={styles.txnInfo}>
                  <BodyBold numberOfLines={1}>{truncateMerchant(merchantName)}</BodyBold>
                  <AmountText cents={transaction.amount} fontSize={16} />
                </View>

                {/* Category list */}
                <Sublabel style={styles.sectionLabel}>SELECT CATEGORY</Sublabel>
                <ScrollView
                  style={styles.categoryList}
                  showsVerticalScrollIndicator={false}
                >
                  {categories
                    .filter(c => !c.is_income)
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryRow,
                          transaction.category_id === category.id && styles.categoryRowActive,
                        ]}
                        onPress={() => handleSelect(category.id)}
                        activeOpacity={0.6}
                      >
                        <BodyText
                          style={[
                            styles.categoryName,
                            transaction.category_id === category.id && styles.categoryNameActive,
                          ]}
                        >
                          {category.name}
                        </BodyText>
                        {transaction.category_id === category.id && (
                          <View style={styles.checkmark}>
                            <BodyText style={styles.checkmarkText}>✓</BodyText>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Apply to all checkbox */}
                <View style={styles.applyAllRow}>
                  <Pressable
                    onPress={() => setApplyToAll(!applyToAll)}
                    style={styles.applyAllPressable}
                  >
                    <View style={[styles.checkbox, applyToAll && styles.checkboxActive]}>
                      {applyToAll && <BodyText style={styles.checkboxMark}>✓</BodyText>}
                    </View>
                    <BodyText style={styles.applyAllText}>
                      Apply to all from "{truncateMerchant(merchantName)}"
                    </BodyText>
                  </Pressable>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg.eggshell,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  sheetInner: {
    padding: spacing.xxl,
    paddingBottom: 40,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: colors.brand.softTaupe,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  txnInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.brand.softTaupe,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    fontWeight: '600',
    color: colors.data.neutral,
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    marginBottom: 2,
  },
  categoryRowActive: {
    backgroundColor: 'rgba(58,74,63,0.08)',
  },
  categoryName: {
    fontSize: 14,
  },
  categoryNameActive: {
    fontFamily: fonts.bodyBold,
    fontWeight: '600',
    color: colors.brand.deepSage,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand.deepSage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  applyAllRow: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.brand.softTaupe,
  },
  applyAllPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.brand.softTaupe,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.brand.deepSage,
    borderColor: colors.brand.deepSage,
  },
  checkboxMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  applyAllText: {
    flex: 1,
    fontSize: 13,
    color: colors.brand.deepSage,
  },
});
