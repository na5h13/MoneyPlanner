// app/(auth)/login.tsx
// Login screen — Google Sign-In + Email/Password

import { View, Text } from 'react-native';
import { colors } from '@/src/theme';

export default function LoginScreen() {
  // TODO: Implement login UI with glassmorphism
  // - Google Sign-In button
  // - Email/password fields
  // - App branding / splash animation
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary }}>
      <Text style={{ color: colors.text.primary, fontSize: 24 }}>MoneyPlanner</Text>
      <Text style={{ color: colors.text.secondary, marginTop: 8 }}>Login Screen — To Be Implemented</Text>
    </View>
  );
}
