// Root Layout — font loading, auth routing, sync-on-open
import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/src/hooks/useAuth';
import { useSyncOnOpen } from '@/src/hooks/useSyncOnOpen';
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
} from '@expo-google-fonts/playfair-display';
import {
  SourceSans3_400Regular,
  SourceSans3_600SemiBold,
} from '@expo-google-fonts/source-sans-3';
import {
  SourceCodePro_500Medium,
  SourceCodePro_600SemiBold,
} from '@expo-google-fonts/source-code-pro';

SplashScreen.preventAutoHideAsync();

function AuthRouter() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Sync on foreground — only when authenticated
  useSyncOnOpen();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/budget');
    }
  }, [user, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    SourceSans3_400Regular,
    SourceSans3_600SemiBold,
    SourceCodePro_500Medium,
    SourceCodePro_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return <AuthRouter />;
}
