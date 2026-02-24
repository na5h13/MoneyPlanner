// app/(tabs)/_layout.tsx
// Main tab navigation — the core app experience

import { Tabs } from 'expo-router';
import { colors } from '@/src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg.secondary,
          borderTopColor: colors.glass.border,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 30,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.green[400],
        tabBarInactiveTintColor: colors.neutral[500],
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          // TODO: Add custom tab icons
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
        }}
      />
      <Tabs.Screen
        name="iin"
        options={{
          title: 'IIN',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}
