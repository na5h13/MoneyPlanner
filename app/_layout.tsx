// app/_layout.tsx
// Root layout — wraps the entire app with auth state listener and theme

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/src/stores/authStore';
import { authService } from '@/src/services/auth';
import { colors } from '@/src/theme';

// Keep splash screen visible while we check auth
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // TODO: Fetch full UserProfile from Firestore
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
          onboardingComplete: false, // Will be fetched from Firestore
          settings: {
            currency: 'CAD',
            notificationsEnabled: true,
            automationLevel: 'full',
            incomeCheckFrequency: 'monthly',
          },
        });
      } else {
        setUser(null);
      }
      setLoading(false);
      await SplashScreen.hideAsync();
    });

    return unsubscribe;
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg.eggshell },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="(modals)"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}
