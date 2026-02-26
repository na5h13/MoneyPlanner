// Root Layout — loads fonts, shows splash screen, sync-on-open, renders slot
import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
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

export default function RootLayout() {
  useSyncOnOpen();

  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    SourceSans3_400Regular,
    SourceSans3_600SemiBold,
    SourceCodePro_500Medium,
    SourceCodePro_600SemiBold,
  });

  useEffect(() => {
    // Hide splash when fonts are ready OR if they failed — never leave splash up forever
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Keep splash visible while fonts are loading; proceed on error (fallback fonts)
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return <Slot />;
}
