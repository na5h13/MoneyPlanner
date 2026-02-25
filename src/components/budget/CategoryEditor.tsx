// Category Editor — create/edit category bottom sheet
// Per OpenSpec: name, icon, keywords (includes)

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  StyleSheet,
} from 'react-native';
import { BodyText, BodyBold, Sublabel } from '@/src/components/ui/Typography';
import { colors, spacing, fonts } from '@/src/theme';
import { Category } from '@/src/types';

interface CategoryEditorProps {
  visible: boolean;
  category: Category | null; // null = create new
  onSave: (data: { name: string; includes: string[] }) => void;
  onClose: () => void;
}

export function CategoryEditor({ visible, category, onSave, onClose }: CategoryEditorProps) {
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name);
      setKeywords(category.includes.join(', '));
    } else {
      setName('');
      setKeywords('');
    }
  }, [category, visible]);

  const handleSave = useCallback(() => {
    if (!name.trim()) return;
    const includes = keywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0);
    onSave({ name: name.trim(), includes });
  }, [name, keywords, onSave]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.sheetInner}>
                <View style={styles.handleBar} />

                <BodyBold style={styles.title}>
                  {category ? 'Edit Category' : 'New Category'}
                </BodyBold>

                <Sublabel style={styles.label}>NAME</Sublabel>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Category name"
                  placeholderTextColor={colors.data.neutral}
                  autoFocus
                />

                <Sublabel style={styles.label}>KEYWORDS (comma-separated)</Sublabel>
                <TextInput
                  style={[styles.input, styles.keywordsInput]}
                  value={keywords}
                  onChangeText={setKeywords}
                  placeholder="e.g. grocery, food, restaurant"
                  placeholderTextColor={colors.data.neutral}
                  multiline
                />

                <View style={styles.buttons}>
                  <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
                    <BodyText style={styles.cancelText}>Cancel</BodyText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
                    activeOpacity={0.7}
                    disabled={!name.trim()}
                  >
                    <BodyBold style={styles.saveText}>Save</BodyBold>
                  </TouchableOpacity>
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
  title: {
    fontSize: 17,
    marginBottom: spacing.xl,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    fontWeight: '600',
    color: colors.data.neutral,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(218,224,224,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.brand.deepSage,
    marginBottom: spacing.xl,
  },
  keywordsInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(218,224,224,0.4)',
    alignItems: 'center',
  },
  cancelText: {
    color: colors.data.neutral,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.brand.deepSage,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveText: {
    color: '#fff',
  },
});
