// Zustand Budget Store — manages transactions, categories, budget, accounts, sync state
// Per OpenSpec data schemas from Section 21

import { create } from 'zustand';
import { format, subMonths, addMonths } from 'date-fns';
import {
  Transaction,
  Category,
  BudgetTarget,
  BudgetLineItem,
  BudgetCategoryDisplay,
  Account,
  TransactionFilter,
  SyncStatus,
  TrendingData,
} from '@/src/types';
import {
  transactionApi,
  categoryApi,
  budgetApi,
  accountApi,
} from '@/src/services/api';

interface BudgetState {
  // Transactions
  transactions: Transaction[];
  transactionsLoading: boolean;
  transactionsError: string | null;
  transactionFilter: TransactionFilter;
  transactionSearch: string;
  transactionMonth: string; // YYYY-MM

  // Categories
  categories: Category[];
  categoriesLoading: boolean;

  // Budget
  budgetDisplay: BudgetCategoryDisplay[];
  budgetLoading: boolean;
  budgetPeriod: string; // YYYY-MM
  collapsedCategories: Set<string>;

  // Accounts
  accounts: Account[];
  accountsLoading: boolean;

  // Sync
  syncStatus: SyncStatus;

  // Actions
  fetchTransactions: () => Promise<void>;
  setTransactionFilter: (filter: TransactionFilter) => void;
  setTransactionSearch: (search: string) => void;
  setTransactionMonth: (month: string) => void;
  navigateMonth: (direction: 'prev' | 'next') => void;

  fetchCategories: () => Promise<void>;
  updateTransactionCategory: (
    txnId: string,
    categoryId: string,
    applyToAll: boolean
  ) => Promise<void>;

  fetchBudget: (period?: string) => Promise<void>;
  setBudgetPeriod: (period: string) => void;
  navigateBudgetPeriod: (direction: 'prev' | 'next') => void;
  toggleCategoryCollapse: (categoryId: string) => void;
  updateBudgetTarget: (categoryId: string, amount: number) => Promise<void>;
  createLineItem: (categoryId: string, name: string) => Promise<void>;
  updateLineItem: (id: string, data: Partial<BudgetLineItem>) => Promise<void>;
  deleteLineItem: (id: string) => Promise<void>;

  fetchAccounts: () => Promise<void>;
  toggleAccountHidden: (id: string) => Promise<void>;

  syncTransactions: () => Promise<void>;
}

const currentMonth = () => format(new Date(), 'yyyy-MM');

export const useBudgetStore = create<BudgetState>((set, get) => ({
  // Initial state
  transactions: [],
  transactionsLoading: false,
  transactionsError: null,
  transactionFilter: 'all',
  transactionSearch: '',
  transactionMonth: currentMonth(),

  categories: [],
  categoriesLoading: false,

  budgetDisplay: [],
  budgetLoading: false,
  budgetPeriod: currentMonth(),
  collapsedCategories: new Set(),

  accounts: [],
  accountsLoading: false,

  syncStatus: {
    last_synced_at: null,
    is_syncing: false,
    error: null,
  },

  // Transaction actions
  fetchTransactions: async () => {
    const { transactionMonth, transactionFilter, transactionSearch } = get();
    set({ transactionsLoading: true, transactionsError: null });
    try {
      const params: Record<string, string> = { month: transactionMonth };
      if (transactionFilter !== 'all') params.type = transactionFilter;
      if (transactionSearch) params.search = transactionSearch;
      const res = await transactionApi.list(params);
      set({ transactions: res.data, transactionsLoading: false });
    } catch (err) {
      set({
        transactionsError: err instanceof Error ? err.message : 'Failed to load transactions',
        transactionsLoading: false,
      });
    }
  },

  setTransactionFilter: (filter) => {
    set({ transactionFilter: filter });
    get().fetchTransactions();
  },

  setTransactionSearch: (search) => {
    set({ transactionSearch: search });
  },

  setTransactionMonth: (month) => {
    set({ transactionMonth: month });
    get().fetchTransactions();
  },

  navigateMonth: (direction) => {
    const { transactionMonth } = get();
    const [year, month] = transactionMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    const newDate = direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1);
    get().setTransactionMonth(format(newDate, 'yyyy-MM'));
  },

  // Category actions
  fetchCategories: async () => {
    set({ categoriesLoading: true });
    try {
      const res = await categoryApi.list();
      set({ categories: res.data, categoriesLoading: false });
    } catch {
      set({ categoriesLoading: false });
    }
  },

  updateTransactionCategory: async (txnId, categoryId, applyToAll) => {
    await transactionApi.updateCategory(txnId, categoryId, applyToAll);
    // Refresh transactions to reflect the change
    get().fetchTransactions();
  },

  // Budget actions
  fetchBudget: async (period) => {
    const p = period || get().budgetPeriod;
    set({ budgetLoading: true });
    try {
      const res = await budgetApi.get(p);
      set({ budgetDisplay: res.data, budgetLoading: false });
    } catch {
      set({ budgetLoading: false });
    }
  },

  setBudgetPeriod: (period) => {
    set({ budgetPeriod: period });
    get().fetchBudget(period);
  },

  navigateBudgetPeriod: (direction) => {
    const { budgetPeriod } = get();
    const [year, month] = budgetPeriod.split('-').map(Number);
    const date = new Date(year, month - 1);
    const newDate = direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1);
    get().setBudgetPeriod(format(newDate, 'yyyy-MM'));
  },

  toggleCategoryCollapse: (categoryId) => {
    set((state) => {
      const next = new Set(state.collapsedCategories);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return { collapsedCategories: next };
    });
  },

  updateBudgetTarget: async (categoryId, amount) => {
    const { budgetPeriod } = get();
    await budgetApi.setTarget({
      category_id: categoryId,
      target_amount: amount,
      period_start: budgetPeriod,
    });
    get().fetchBudget();
  },

  createLineItem: async (categoryId, name) => {
    await budgetApi.createItem({ category_id: categoryId, display_name: name });
    get().fetchBudget();
  },

  updateLineItem: async (id, data) => {
    await budgetApi.updateItem(id, data);
    get().fetchBudget();
  },

  deleteLineItem: async (id) => {
    await budgetApi.deleteItem(id);
    get().fetchBudget();
  },

  // Account actions
  fetchAccounts: async () => {
    set({ accountsLoading: true });
    try {
      const res = await accountApi.list();
      set({ accounts: res.data, accountsLoading: false });
    } catch {
      set({ accountsLoading: false });
    }
  },

  toggleAccountHidden: async (id) => {
    const account = get().accounts.find((a) => a.id === id);
    if (!account) return;
    await accountApi.update(id, { hidden: !account.hidden });
    get().fetchAccounts();
  },

  // Sync
  syncTransactions: async () => {
    set({ syncStatus: { ...get().syncStatus, is_syncing: true, error: null } });
    try {
      await transactionApi.sync();
      set({
        syncStatus: {
          last_synced_at: new Date().toISOString(),
          is_syncing: false,
          error: null,
        },
      });
      // Refresh data after sync
      get().fetchTransactions();
      get().fetchBudget();
    } catch (err) {
      set({
        syncStatus: {
          ...get().syncStatus,
          is_syncing: false,
          error: err instanceof Error ? err.message : 'Sync failed',
        },
      });
    }
  },
}));
