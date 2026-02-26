// Firebase Auth hook — manages auth state, sets API token provider
import { useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { setAuthTokenProvider } from '@/src/services/api';

export function useAuth() {
  // undefined = still loading, null = not authenticated, User = authenticated
  const [user, setUser] = useState<FirebaseAuthTypes.User | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        setAuthTokenProvider(async () => {
          try {
            return await firebaseUser.getIdToken();
          } catch {
            return null;
          }
        });
      } else {
        setAuthTokenProvider(async () => null);
      }
    });

    return unsubscribe;
  }, []);

  return { user, isLoading: user === undefined };
}
