// app/_layout.tsx
// Root layout.
// DEV_MODE=true → skip Firebase auth entirely, go straight to tabs.
// Production → Firebase auth listener gates access.

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/src/stores/authStore';
import { authService } from '@/src/services/auth';
import { colors } from '@/src/theme';

SplashScreen.preventAutoHideAsync();

const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

export default function RootLayout() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    if (DEV_MODE) {
      // Skip Firebase entirely in dev — go straight to app
      setUser({
        uid: 'dev-user',
        email: 'dev@keel.app',
        displayName: 'Dev User',
        photoURL: null,
        createdAt: new Date().toISOString(),
        onboardingComplete: true,
        settings: {
          currency: 'CAD',
          notificationsEnabled: true,
          automationLevel: 'full',
          incomeCheckFrequency: 'monthly',
        },
      });
      setLoading(false);
      SplashScreen.hideAsync();
      return;
    }

    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
          onboardingComplete: true,
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
