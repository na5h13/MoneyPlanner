// app/(modals)/iin-setup.tsx
// Set up or edit IIN rules

import { View, Text } from 'react-native';
import { colors } from '@/src/theme';

export default function IINSetupModal() {
  // TODO: Implement IIN rule creation/editing
  // - Select rule target (savings, investment, debt, category)
  // - Set percentage of income increase to redirect
  // - Set priority order
  // - Preview with example scenario
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary }}>
      <Text style={{ color: colors.text.primary, fontSize: 24 }}>IIN Setup</Text>
    </View>
  );
}
