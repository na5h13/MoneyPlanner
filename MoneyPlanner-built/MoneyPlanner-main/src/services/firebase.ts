// src/services/firebase.ts
// Firebase initialization for React Native
//
// @react-native-firebase/app reads config automatically from:
//   - Android: google-services.json (in project root, copied by EAS Build)
//   - iOS: GoogleService-Info.plist (in project root, copied by EAS Build)
//
// No env vars needed here — native SDKs handle it.
// The EXPO_PUBLIC_FIREBASE_* vars are for web fallback only.

import { firebase } from '@react-native-firebase/app';

// Verify Firebase is initialized (native SDK does this automatically)
if (!firebase.apps.length) {
  console.warn('Firebase not auto-initialized — check google-services.json / GoogleService-Info.plist');
}

export const firebaseApp = firebase.app();
export default firebaseApp;
