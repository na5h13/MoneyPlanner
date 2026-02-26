// Login Screen — Firebase Auth via Google Sign In
// No email/password — Google only per simplicity and reliability
import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { AmbientBackground, GlassCard } from '@/src/components/ui/Glass';
import {
  ScreenName,
  BodyText,
  BodyBold,
  Sublabel,
} from '@/src/components/ui/Typography';
import { colors, spacing } from '@/src/theme';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
});

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      // v13 API returns { type, data } — v12 returns { idToken, ... } directly
      const idToken =
        (response as any)?.data?.idToken ??
        (response as any)?.idToken;

      if (!idToken) {
        throw new Error('No ID token returned from Google');
      }

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);
      // Auth state change in _layout.tsx routes to /(tabs)/budget
    } catch (err: any) {
      const msg = err?.message || 'Sign in failed. Please try again.';
      Alert.alert('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AmbientBackground>
      <View style={styles.container}>
        {/* Hero */}
        <View style={styles.hero}>
          <ScreenName style={styles.appName}>Keel</ScreenName>
          <BodyText style={styles.tagline}>Behavioral budgeting for Canadians</BodyText>
        </View>

        {/* Sign In Card */}
        <GlassCard tier="standard" style={styles.card}>
          <View style={styles.cardContent}>
            <BodyBold style={styles.cardTitle}>Sign in to continue</BodyBold>
            <Sublabel style={styles.cardSub}>
              Your data is encrypted with AES-256 and stays yours
            </Sublabel>

            <TouchableOpacity
              onPress={handleGoogleSignIn}
              disabled={loading}
              style={[styles.signInButton, loading && styles.signInButtonDisabled]}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <BodyBold style={styles.signInText}>Continue with Google</BodyBold>
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
  },
  appName: {
    fontSize: 48,
    textAlign: 'center',
  },
  tagline: {
    textAlign: 'center',
    color: colors.data.neutral,
  },
  card: {
    marginTop: spacing.lg,
  },
  cardContent: {
    padding: spacing.xxl,
    gap: spacing.lg,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    color: colors.brand.deepSage,
  },
  cardSub: {
    textAlign: 'center',
    color: colors.data.neutral,
  },
  signInButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.brand.deepSage,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInText: {
    color: colors.white,
    fontSize: 15,
  },
});
