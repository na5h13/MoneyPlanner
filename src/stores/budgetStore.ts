// src/stores/budgetStore.ts
// Budget state — categories, allocations, spending

import { create } from 'zustand';
import { Budget, BudgetCategory, ConnectedAccount, Transaction } from '@/src/types';

interface BudgetState {
  budget: Budget | null;
  accounts: ConnectedAccount[];
  transactions: Transaction[];
  isLoadingBudget: boolean;
  isLoadingTransactions: boolean;

  // Actions
  setBudget: (budget: Budget | null) => void;
  setAccounts: (accounts: ConnectedAccount[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  updateCategory: (categoryId: string, updates: Partial<BudgetCategory>) => void;
  setLoadingBudget: (loading: boolean) => void;
  setLoadingTransactions: (loading: boolean) => void;
  reset: () => void;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  budget: null,
  accounts: [],
  transactions: [],
  isLoadingBudget: true,
  isLoadingTransactions: false,

  setBudget: (budget) => set({ budget }),
  setAccounts: (accounts) => set({ accounts }),
  setTransactions: (transactions) => set({ transactions }),

  updateCategory: (categoryId, updates) =>
    set((state) => {
      if (!state.budget) return state;
      return {
        budget: {
          ...state.budget,
          categories: state.budget.categories.map((cat) =>
            cat.id === categoryId ? { ...cat, ...updates } : cat,
          ),
        },
      };
    }),

  setLoadingBudget: (isLoadingBudget) => set({ isLoadingBudget }),
  setLoadingTransactions: (isLoadingTransactions) => set({ isLoadingTransactions }),
  reset: () =>
    set({
      budget: null,
      accounts: [],
      transactions: [],
      isLoadingBudget: true,
      isLoadingTransactions: false,
    }),
}));
