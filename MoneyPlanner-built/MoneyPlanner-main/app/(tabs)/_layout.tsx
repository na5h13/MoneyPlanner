// app/(tabs)/_layout.tsx
// Tab navigation — DEV_MODE shows ALL tabs simultaneously.
// Production: phase-gated via useFeatureAccess().

import { Tabs } from 'expo-router';
import { colors } from '@/src/theme';
import { useFeatureAccess } from '@/src/hooks/useFeatureAccess';
import {
  HomeIcon,
  BudgetIcon,
  TransactionsIcon,
  GoalsIcon,
  IINIcon,
  SettingsIcon,
} from '@/src/components/ui/TabIcons';

export default function TabsLayout() {
  const access = useFeatureAccess();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(245, 242, 238, 0.92)',
          borderTopColor: 'rgba(214, 206, 195, 0.6)',
          borderTopWidth: 0.5,
          height: 88,
          paddingBottom: 28,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.brand.deepSage,
        tabBarInactiveTintColor: colors.data.neutral,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
      }}
    >
      {/* Home — Phase 4+ */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          href: access.showHome ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <HomeIcon color={color} filled={focused} size={22} />
          ),
        }}
      />

      {/* Budget — always visible */}
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarIcon: ({ color, focused }) => (
            <BudgetIcon color={color} filled={focused} size={22} />
          ),
        }}
      />

      {/* Transactions — always visible */}
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, focused }) => (
            <TransactionsIcon color={color} filled={focused} size={22} />
          ),
        }}
      />

      {/* Goals — Phase 3+ */}
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          href: access.showGoals ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <GoalsIcon color={color} filled={focused} size={22} />
          ),
        }}
      />

      {/* IIN — Phase 5 + feature flag */}
      <Tabs.Screen
        name="iin"
        options={{
          title: 'IIN',
          href: access.showIIN ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <IINIcon color={color} filled={focused} size={22} />
          ),
        }}
      />

      {/* Settings — always visible */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <SettingsIcon color={color} filled={focused} size={22} />
          ),
        }}
      />
    </Tabs>
  );
}
