// app/(tabs)/iin.tsx
// IIN (Income Increase Neutralization) — the core differentiator
// Shows: current rules, income history, neutralization events

import { View, Text } from 'react-native';
import { colors } from '@/src/theme';

export default function IINScreen() {
  // TODO: Implement IIN dashboard
  // - Current income baseline vs detected income
  // - Active rules list (% redirections to savings/investments/debt)
  // - History of neutralization events
  // - "Add Rule" button
  // - Toggle IIN on/off
  // - Visualization: income growth vs lifestyle inflation (kept flat by IIN)
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary }}>
      <Text style={{ color: colors.text.primary, fontSize: 24 }}>IIN</Text>
      <Text style={{ color: colors.text.secondary, marginTop: 8 }}>Income Increase Neutralization — To Be Implemented</Text>
    </View>
  );
}
