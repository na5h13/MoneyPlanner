// app/(tabs)/budget.tsx
// Budget view — auto-categorized spending from Plaid transactions
// Minimal interaction needed; categories auto-adjust based on IIN rules

import { View, Text } from 'react-native';
import { colors } from '@/src/theme';

export default function BudgetScreen() {
  // TODO: Implement budget view
  // - Category cards (glassmorphism) with green progress bars
  // - Auto-categorized from Plaid transaction data
  // - Tap category → see transactions (minimal detail)
  // - "Automated" badge on IIN-managed categories
  // - Period selector (weekly/biweekly/monthly)
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary }}>
      <Text style={{ color: colors.text.primary, fontSize: 24 }}>Budget</Text>
      <Text style={{ color: colors.text.secondary, marginTop: 8 }}>Budget — To Be Implemented</Text>
    </View>
  );
}
