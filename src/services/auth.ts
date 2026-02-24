// src/services/auth.ts
// Authentication service — Google Sign-In + Firebase Auth

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In with env variable
GoogleSignin.configure({
  webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
});

export const authService = {
  /** Sign in with Google and link to Firebase */
  async signInWithGoogle(): Promise<FirebaseAuthTypes.UserCredential> {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const signInResult = await GoogleSignin.signIn();
    const idToken = signInResult?.data?.idToken;

    if (!idToken) {
      throw new Error('Google Sign-In failed: No ID token returned');
    }

    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    return auth().signInWithCredential(googleCredential);
  },

  /** Sign in with email/password */
  async signInWithEmail(email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> {
    return auth().signInWithEmailAndPassword(email, password);
  },

  /** Create account with email/password */
  async signUpWithEmail(email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> {
    return auth().createUserWithEmailAndPassword(email, password);
  },

  /** Sign out */
  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch {
      // User may not have signed in with Google
    }
    return auth().signOut();
  },

  /** Get current user */
  getCurrentUser(): FirebaseAuthTypes.User | null {
    return auth().currentUser;
  },

  /** Subscribe to auth state changes */
  onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void) {
    return auth().onAuthStateChanged(callback);
  },

  /** Get ID token for API calls to backend */
  async getIdToken(): Promise<string | null> {
    const user = auth().currentUser;
    if (!user) return null;
    return user.getIdToken();
  },
};
