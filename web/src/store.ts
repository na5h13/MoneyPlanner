// Zustand store — with visible error handling
import { create } from 'zustand';
import { format, subMonths, addMonths } from 'date-fns';
import type {
  Transaction,
  Category,
  BudgetCategoryDisplay,
  BudgetSummary,
  BudgetLineItem,
  Account,
  UserSettings,
  TransactionFilter,
} from './types';
import {
  transactionApi,
  categoryApi,
  budgetApi,
  accountApi,
  settingsApi,
} from './api';

interface BudgetState {
  // Connection
  connectionError: string | null;

  // Transactions
  transactions: Transaction[];
  transactionsLoading: boolean;
  transactionsError: string | null;
  transactionFilter: TransactionFilter;
  transactionSearch: string;
  transactionMonth: string;

  // Categories
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: string | null;

  // Budget
  budgetDisplay: BudgetCategoryDisplay[];
  budgetSummary: BudgetSummary | null;
  budgetLoading: boolean;
  budgetError: string | null;
  budgetPeriod: string;
  collapsedGroups: Set<string>;
  expandedCategories: Set<string>;

  // Accounts
  accounts: Account[];
  accountsLoading: boolean;
  accountsError: string | null;

  // Settings
  settings: UserSettings | null;
  settingsLoading: boolean;

  // Actions
  fetchTransactions: () => Promise<void>;
  setTransactionFilter: (filter: TransactionFilter) => void;
  setTransactionSearch: (search: string) => void;
  navigateMonth: (direction: 'prev' | 'next') => void;

  fetchCategories: () => Promise<void>;
  updateTransactionCategory: (txnId: string, categoryId: string, applyToAll: boolean) => Promise<void>;

  fetchBudget: (period?: string) => Promise<void>;
  navigateBudgetPeriod: (direction: 'prev' | 'next') => void;
  toggleGroupCollapse: (group: string) => void;
  toggleCategoryExpand: (categoryId: string) => void;
  updateBudgetTarget: (categoryId: string, amount: number) => Promise<void>;
  createLineItem: (categoryId: string, name: string) => Promise<void>;
  updateLineItem: (id: string, data: Partial<BudgetLineItem>) => Promise<void>;
  deleteLineItem: (id: string) => Promise<void>;

  fetchAccounts: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;

  syncTransactions: () => Promise<void>;
}

const currentMonth = () => format(new Date(), 'yyyy-MM');

function extractError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
}

export const useStore = create<BudgetState>((set, get) => ({
  connectionError: null,

  transactions: [],
  transactionsLoading: false,
  transactionsError: null,
  transactionFilter: 'all',
  transactionSearch: '',
  transactionMonth: currentMonth(),

  categories: [],
  categoriesLoading: false,
  categoriesError: null,

  budgetDisplay: [],
  budgetSummary: null,
  budgetLoading: false,
  budgetError: null,
  budgetPeriod: currentMonth(),
  collapsedGroups: new Set(['Essentials', 'Daily Living', 'Family & Home', 'Leisure', 'Financial']),
  expandedCategories: new Set(),

  accounts: [],
  accountsLoading: false,
  accountsError: null,

  settings: null,
  settingsLoading: false,

  fetchTransactions: async () => {
    const { transactionMonth, transactionFilter, transactionSearch } = get();
    set({ transactionsLoading: true, transactionsError: null });
    try {
      const params: Record<string, string> = { month: transactionMonth };
      if (transactionFilter !== 'all') params.type = transactionFilter;
      if (transactionSearch) params.search = transactionSearch;
      const res = await transactionApi.list(params);
      set({ transactions: res.data, transactionsLoading: false, connectionError: null });
    } catch (err) {
      const msg = extractError(err);
      set({ transactionsError: msg, transactionsLoading: false, connectionError: msg });
    }
  },

  setTransactionFilter: (filter) => {
    set({ transactionFilter: filter });
    get().fetchTransactions();
  },

  setTransactionSearch: (search) => {
    set({ transactionSearch: search });
  },

  navigateMonth: (direction) => {
    const { transactionMonth } = get();
    const [year, month] = transactionMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    const newDate = direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1);
    set({ transactionMonth: format(newDate, 'yyyy-MM') });
    get().fetchTransactions();
  },

  fetchCategories: async () => {
    set({ categoriesLoading: true, categoriesError: null });
    try {
      const res = await categoryApi.list();
      set({ categories: res.data, categoriesLoading: false, connectionError: null });
    } catch (err) {
      set({ categoriesError: extractError(err), categoriesLoading: false });
    }
  },

  updateTransactionCategory: async (txnId, categoryId, applyToAll) => {
    await transactionApi.updateCategory(txnId, categoryId, applyToAll);
    get().fetchTransactions();
  },

  fetchBudget: async (period) => {
    const p = period || get().budgetPeriod;
    set({ budgetLoading: true, budgetError: null });
    try {
      const res = await budgetApi.get(p);
      set({
        budgetDisplay: res.data,
        budgetSummary: res.summary ?? null,
        budgetLoading: false,
        connectionError: null,
      });
    } catch (err) {
      const msg = extractError(err);
      set({ budgetError: msg, budgetLoading: false, connectionError: msg });
    }
  },

  navigateBudgetPeriod: (direction) => {
    const { budgetPeriod } = get();
    const [year, month] = budgetPeriod.split('-').map(Number);
    const date = new Date(year, month - 1);
    const newDate = direction === 'prev' ? subMonths(date, 1) : addMonths(date, 1);
    const newPeriod = format(newDate, 'yyyy-MM');
    set({ budgetPeriod: newPeriod });
    get().fetchBudget(newPeriod);
  },

  toggleGroupCollapse: (group) => {
    set((state) => {
      const next = new Set(state.collapsedGroups);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return { collapsedGroups: next };
    });
  },

  toggleCategoryExpand: (categoryId) => {
    set((state) => {
      const next = new Set(state.expandedCategories);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return { expandedCategories: next };
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

  fetchAccounts: async () => {
    set({ accountsLoading: true, accountsError: null });
    try {
      const res = await accountApi.list();
      set({ accounts: res.data, accountsLoading: false, connectionError: null });
    } catch (err) {
      set({ accountsError: extractError(err), accountsLoading: false });
    }
  },

  fetchSettings: async () => {
    set({ settingsLoading: true });
    try {
      const res = await settingsApi.get();
      set({ settings: res.data, settingsLoading: false });
    } catch {
      set({ settingsLoading: false });
    }
  },

  updateSettings: async (data) => {
    await settingsApi.update(data);
    get().fetchSettings();
  },

  syncTransactions: async () => {
    try {
      await transactionApi.sync();
      get().fetchTransactions();
      get().fetchBudget();
    } catch (err) {
      console.error('Sync failed:', err);
    }
  },
}));
