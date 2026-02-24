// app/(tabs)/index.tsx
// Home Dashboard — the less you see here, the healthier your finances
// Shows: financial health score, automation status, any pending IIN events

import { View, Text } from 'react-native';
import { colors } from '@/src/theme';

export default function HomeScreen() {
  // TODO: Implement dashboard
  // - Financial health indicator (green pulse = all automated, no action needed)
  // - Monthly overview (income vs. spending, minimal detail)
  // - Pending IIN events (if income change detected)
  // - Connected accounts status
  // - "Nothing to do" state = the ideal state
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary }}>
      <Text style={{ color: colors.text.primary, fontSize: 24 }}>Dashboard</Text>
      <Text style={{ color: colors.text.secondary, marginTop: 8 }}>Home — To Be Implemented</Text>
    </View>
  );
}
