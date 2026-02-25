// app/index.tsx
// Entry point — redirects to auth or main app based on state

import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/src/theme';

export default function Index() {
  const { isAuthenticated, isLoading, isOnboarded } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary }}>
        <ActivityIndicator size="large" color={colors.green[500]} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!isOnboarded) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
