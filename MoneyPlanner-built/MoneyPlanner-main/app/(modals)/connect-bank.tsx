// app/(modals)/connect-bank.tsx
// Opens Plaid Link to connect a new bank account

import { View, Text } from 'react-native';
import { colors } from '@/src/theme';

export default function ConnectBankModal() {
  // TODO: Implement Plaid Link flow
  // 1. Call plaidService.createLinkToken()
  // 2. Open Plaid Link with the token
  // 3. On success, call plaidService.exchangePublicToken()
  // 4. Show success state
  // 5. Navigate back
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary }}>
      <Text style={{ color: colors.text.primary, fontSize: 24 }}>Connect Bank</Text>
    </View>
  );
}
