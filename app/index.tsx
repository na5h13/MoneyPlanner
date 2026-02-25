// app/index.tsx
// Entry point — DEV_MODE goes straight to tabs, production checks auth.

import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/src/theme';

const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (DEV_MODE) {
    return <Redirect href="/(tabs)/budget" />;
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.eggshell }}>
        <ActivityIndicator size="large" color={colors.brand.deepSage} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)/budget" />;
}
