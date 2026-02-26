// Entry point — auth routing handled in _layout.tsx
// If authenticated → routed to /(tabs)/budget
// If not authenticated → routed to /auth/login
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)/budget" />;
}
