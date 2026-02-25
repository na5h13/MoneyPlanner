// SearchBar with 300ms debounce — OpenSpec Transaction screen requirement

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, spacing, glass } from '@/src/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search transactions...' }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((text: string) => {
    setLocalValue(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChangeText(text);
    }, 300); // 300ms debounce per OpenSpec
  }, [onChangeText]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChangeText('');
  }, [onChangeText]);

  return (
    <View style={styles.container}>
      {/* Search icon */}
      <Svg width={14} height={14} viewBox="0 0 14 14" fill="none" style={styles.icon}>
        <Path
          d="M6 1C3.24 1 1 3.24 1 6s2.24 5 5 5 5-2.24 5-5S8.76 1 6 1zM13 13l-3.5-3.5"
          stroke={colors.data.neutral}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </Svg>
      <TextInput
        style={styles.input}
        value={localValue}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.data.neutral}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {localValue.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
            <Path d="M2 2l8 8M10 2l-8 8" stroke={colors.data.neutral} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(218,224,224,0.4)',
    paddingHorizontal: 10,
    height: 36,
  },
  icon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.brand.deepSage,
    padding: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
});
