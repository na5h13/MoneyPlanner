// src/stores/iinStore.ts
// IIN state — income tracking, rules, neutralization events

import { create } from 'zustand';
import { IINConfig, IINEvent, IINRule } from '@/src/types';

interface IINState {
  config: IINConfig | null;
  pendingEvents: IINEvent[];
  isEnabled: boolean;
  isLoading: boolean;

  // Actions
  setConfig: (config: IINConfig | null) => void;
  setPendingEvents: (events: IINEvent[]) => void;
  addRule: (rule: IINRule) => void;
  updateRule: (ruleId: string, updates: Partial<IINRule>) => void;
  removeRule: (ruleId: string) => void;
  setEnabled: (enabled: boolean) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useIINStore = create<IINState>((set) => ({
  config: null,
  pendingEvents: [],
  isEnabled: false,
  isLoading: true,

  setConfig: (config) =>
    set({
      config,
      isEnabled: config?.enabled ?? false,
    }),

  setPendingEvents: (pendingEvents) => set({ pendingEvents }),

  addRule: (rule) =>
    set((state) => {
      if (!state.config) return state;
      return {
        config: {
          ...state.config,
          rules: [...state.config.rules, rule],
        },
      };
    }),

  updateRule: (ruleId, updates) =>
    set((state) => {
      if (!state.config) return state;
      return {
        config: {
          ...state.config,
          rules: state.config.rules.map((r) =>
            r.id === ruleId ? { ...r, ...updates } : r,
          ),
        },
      };
    }),

  removeRule: (ruleId) =>
    set((state) => {
      if (!state.config) return state;
      return {
        config: {
          ...state.config,
          rules: state.config.rules.filter((r) => r.id !== ruleId),
        },
      };
    }),

  setEnabled: (isEnabled) =>
    set((state) => ({
      isEnabled,
      config: state.config ? { ...state.config, enabled: isEnabled } : null,
    })),

  setLoading: (isLoading) => set({ isLoading }),
  reset: () =>
    set({
      config: null,
      pendingEvents: [],
      isEnabled: false,
      isLoading: true,
    }),
}));
