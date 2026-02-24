// app/(modals)/iin-review.tsx
// Review a detected income change and approve/dismiss IIN allocations

import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors } from '@/src/theme';

export default function IINReviewModal() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  // TODO: Implement IIN event review
  // - Show: previous income → new income (increase amount)
  // - Show: proposed allocations based on active rules
  // - "Apply" button (execute the allocations)
  // - "Dismiss" button (ignore this event)
  // - "Adjust" option (modify allocations before applying)
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary }}>
      <Text style={{ color: colors.text.primary, fontSize: 24 }}>Review Income Change</Text>
      <Text style={{ color: colors.text.secondary, marginTop: 8 }}>Event: {eventId}</Text>
    </View>
  );
}
