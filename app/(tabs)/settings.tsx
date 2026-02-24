// app/(tabs)/settings.tsx
// Settings — account, connected banks, preferences

import { View, Text } from 'react-native';
import { colors } from '@/src/theme';

export default function SettingsScreen() {
  // TODO: Implement settings
  // - Profile info
  // - Connected bank accounts (manage via Plaid)
  // - Currency preference
  // - Notification settings
  // - Automation level (full / suggest / manual)
  // - Income check frequency
  // - Sign out
  // - Delete account
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary }}>
      <Text style={{ color: colors.text.primary, fontSize: 24 }}>Settings</Text>
      <Text style={{ color: colors.text.secondary, marginTop: 8 }}>Settings — To Be Implemented</Text>
    </View>
  );
}
