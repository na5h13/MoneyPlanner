// app/(auth)/login.tsx
// Login — Google Sign-In + Email/Password
// Production only — DEV_MODE never reaches this screen.

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/src/theme';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { authService } from '@/src/services/auth';
import { useAuthStore } from '@/src/stores/authStore';

type Mode = 'signin' | 'signup';

export default function LoginScreen() {
  const { setUser } = useAuthStore();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);
    try {
      const result = await authService.signInWithGoogle();
      setUser({
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        createdAt: result.user.metadata.creationTime || new Date().toISOString(),
        onboardingComplete: true,
        settings: { currency: 'CAD', notificationsEnabled: true, automationLevel: 'full', incomeCheckFrequency: 'monthly' },
      });
      router.replace('/(tabs)/budget');
    } catch (e: any) {
      setError(e?.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleEmail() {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = mode === 'signin'
        ? await authService.signInWithEmail(email.trim(), password)
        : await authService.signUpWithEmail(email.trim(), password);

      setUser({
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        createdAt: result.user.metadata.creationTime || new Date().toISOString(),
        onboardingComplete: true,
        settings: { currency: 'CAD', notificationsEnabled: true, automationLevel: 'full', incomeCheckFrequency: 'monthly' },
      });
      router.replace('/(tabs)/budget');
    } catch (e: any) {
      setError(e?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email address first');
      return;
    }
    try {
      await authService.sendPasswordReset(email.trim());
      Alert.alert('Check your email', `Password reset sent to ${email}`);
    } catch (e: any) {
      setError(e?.message || 'Failed to send reset email');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branding */}
          <View style={styles.brand}>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>K</Text>
            </View>
            <Text style={styles.appName}>Keel</Text>
            <Text style={styles.tagline}>Financial clarity, automated.</Text>
          </View>

          {/* Auth card */}
          <GlassCard tier="strong" style={styles.card}>
            {/* Mode toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'signin' && styles.modeBtnActive]}
                onPress={() => { setMode('signin'); setError(null); }}
              >
                <Text style={[styles.modeBtnText, mode === 'signin' && styles.modeBtnTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'signup' && styles.modeBtnActive]}
                onPress={() => { setMode('signup'); setError(null); }}
              >
                <Text style={[styles.modeBtnText, mode === 'signup' && styles.modeBtnTextActive]}>Create Account</Text>
              </TouchableOpacity>
            </View>

            {/* Google */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogle}
              disabled={googleLoading}
            >
              {googleLoading
                ? <ActivityIndicator color={colors.text.primary} size="small" />
                : <>
                    <Text style={styles.googleIcon}>G</Text>
                    <Text style={styles.googleText}>Continue with Google</Text>
                  </>
              }
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email */}
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={colors.data.neutral}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            {/* Password */}
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.data.neutral}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleEmail}
            />

            {/* Error */}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText} selectable>{error}</Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleEmail}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={colors.text.inverse} size="small" />
                : <Text style={styles.submitText}>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
              }
            </TouchableOpacity>

            {/* Forgot password */}
            {mode === 'signin' && (
              <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}
          </GlassCard>

          <Text style={styles.footer}>
            Your financial data is encrypted and never sold.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.eggshell },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  brand: { alignItems: 'center', marginBottom: spacing['2xl'] },
  logoMark: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: colors.brand.deepSage,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: { fontSize: 36, fontWeight: '800', color: colors.text.inverse },
  appName: {
    fontSize: typography.size['3xl'], fontWeight: '700',
    color: colors.text.primary, fontFamily: typography.fontFamily.display,
    letterSpacing: -1,
  },
  tagline: { fontSize: typography.size.base, color: colors.data.neutral, marginTop: 4 },
  card: { padding: spacing.lg, gap: spacing.md },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.bg.linen,
    borderRadius: borderRadius.md,
    padding: 3,
  },
  modeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: borderRadius.sm },
  modeBtnActive: { backgroundColor: colors.bg.eggshell },
  modeBtnText: { fontSize: typography.size.base, fontWeight: '600', color: colors.data.neutral },
  modeBtnTextActive: { color: colors.text.primary },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1, borderColor: colors.brand.softTaupe,
    borderRadius: borderRadius.md, paddingVertical: 13, gap: spacing.sm,
  },
  googleIcon: { fontSize: 18, fontWeight: '700', color: '#4285F4' },
  googleText: { fontSize: typography.size.base, fontWeight: '600', color: colors.text.primary },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: colors.brand.softTaupe },
  dividerText: { fontSize: typography.size.sm, color: colors.data.neutral },
  input: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1, borderColor: colors.brand.softTaupe,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: 13,
    fontSize: typography.size.base, color: colors.text.primary,
  },
  errorBox: {
    backgroundColor: 'rgba(192,57,43,0.08)',
    borderRadius: borderRadius.md, borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.2)', padding: spacing.md,
  },
  errorText: { fontSize: typography.size.sm, color: colors.semantic.error, lineHeight: 18 },
  submitBtn: {
    backgroundColor: colors.brand.deepSage,
    borderRadius: borderRadius.md,
    paddingVertical: 14, alignItems: 'center',
  },
  submitText: { fontSize: typography.size.base, fontWeight: '700', color: colors.text.inverse },
  forgotBtn: { alignItems: 'center', paddingVertical: spacing.xs },
  forgotText: { fontSize: typography.size.sm, color: colors.brand.steelBlue, fontWeight: '600' },
  footer: {
    textAlign: 'center', fontSize: 11,
    color: colors.data.neutral, marginTop: spacing.xl,
  },
});
