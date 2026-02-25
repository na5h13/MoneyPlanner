// app/(auth)/onboarding.tsx
// Onboarding flow — connect bank, set income baseline, configure IIN rules

import { View, Text } from 'react-native';
import { colors } from '@/src/theme';

export default function OnboardingScreen() {
  // TODO: Multi-step onboarding flow
  // Step 1: Welcome / value prop (automation-first philosophy)
  // Step 2: Connect bank via Plaid Link
  // Step 3: Confirm detected income streams
  // Step 4: Set up initial IIN rules (% of future raises to redirect)
  // Step 5: Auto-generate budget categories from transaction history
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary }}>
      <Text style={{ color: colors.text.primary, fontSize: 24 }}>Welcome</Text>
      <Text style={{ color: colors.text.secondary, marginTop: 8 }}>Onboarding — To Be Implemented</Text>
    </View>
  );
}
