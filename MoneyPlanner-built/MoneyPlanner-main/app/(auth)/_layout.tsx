// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import { colors } from '@/src/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.primary },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
