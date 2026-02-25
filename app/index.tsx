// Entry point — redirects to tabs (DEV_MODE bypasses auth)
import { Redirect } from 'expo-router';

export default function Index() {
  // DEV_MODE=true bypasses all phase gates per OpenSpec Section 10
  return <Redirect href="/(tabs)/budget" />;
}
