// 3-Tab Bottom Bar — Budget | Transactions | Settings
// Per OpenSpec Navigation spec:
// - Active: deep sage filled SVG
// - Inactive: neutral outlined SVG
// - Bar: 54px, backdrop blur
// - Icons: 18x18px inline SVG — NO EMOJI

import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { WalletIcon, ReceiptIcon, GearIcon } from '@/src/components/ui/NavIcons';
import { colors, nav, fonts, shadows } from '@/src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView
            intensity={28}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarActiveTintColor: colors.brand.deepSage,
        tabBarInactiveTintColor: colors.data.neutral,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: styles.tabIcon,
      }}
    >
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarIcon: ({ focused }) => <WalletIcon active={focused} size={nav.iconSize} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ focused }) => <ReceiptIcon active={focused} size={nav.iconSize} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <GearIcon active={focused} size={nav.iconSize} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    height: nav.barHeight + (Platform.OS === 'ios' ? 20 : 0),
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.50)',
    backgroundColor: 'rgba(235,231,224,0.45)',
    ...shadows.navBar,
    elevation: 0,
  },
  tabLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 0,
  },
  tabIcon: {
    marginBottom: -2,
  },
});
