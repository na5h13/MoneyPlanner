// app/(modals)/_layout.tsx
import { Stack } from 'expo-router';
import { colors } from '@/src/theme';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.primary },
        presentation: 'modal',
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="connect-bank" />
      <Stack.Screen name="iin-setup" />
      <Stack.Screen name="iin-review" />
    </Stack>
  );
}
