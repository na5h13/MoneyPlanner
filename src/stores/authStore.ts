// src/stores/authStore.ts
// Global auth state managed with Zustand

import { create } from 'zustand';
import { UserProfile } from '@/src/types';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;

  // Actions
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboarded: (onboarded: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isOnboarded: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isOnboarded: user?.onboardingComplete ?? false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setOnboarded: (isOnboarded) => set({ isOnboarded }),

  reset: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isOnboarded: false,
    }),
}));
