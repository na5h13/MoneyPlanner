// Onboarding — DEV_MODE never reaches this. Production: redirect to tabs since
// bank connection happens from Settings. Keep minimal and functional.
import { Redirect } from 'expo-router';
export default function OnboardingScreen() {
  return <Redirect href="/(tabs)/budget" />;
}
