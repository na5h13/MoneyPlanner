// API Service Layer — fetch wrapper with Firebase token injection
// Ported from mobile src/services/api.ts

import type {
  Transaction,
  Category,
  BudgetCategoryDisplay,
  BudgetSummary,
  BudgetTarget,
  BudgetLineItem,
  Account,
  UserSettings,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050';
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

let getAuthToken: (() => Promise<string | null>) | null = null;

export function setAuthTokenProvider(provider: () => Promise<string | null>) {
  getAuthToken = provider;
}

async function getHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (DEV_MODE) {
    headers['X-Dev-Mode'] = 'true';
  }

  if (getAuthToken) {
    try {
      const token = await getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (err) {
      console.error('Auth token provider threw:', err);
    }
  }

  return headers;
}

class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = await getHeaders();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(
        errorData?.error || `Request failed with status ${response.status}`,
        response.status,
        errorData
      );
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

// === Transaction endpoints ===
export const transactionApi = {
  list: (params: { month?: string; category?: string; search?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params.month) query.set('month', params.month);
    if (params.category) query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.type) query.set('type', params.type);
    const qs = query.toString();
    return api.get<{ data: Transaction[] }>(`/api/v1/transactions${qs ? `?${qs}` : ''}`);
  },
  updateCategory: (id: string, categoryId: string, applyToAll: boolean) =>
    api.put(`/api/v1/transactions/${id}/category`, {
      category_id: categoryId,
      apply_to_all: applyToAll,
    }),
  sync: () => api.post<{ data: { synced: number } }>('/api/v1/transactions/sync'),
};

// === Category endpoints ===
export const categoryApi = {
  list: () => api.get<{ data: Category[] }>('/api/v1/categories'),
  create: (data: { name: string; icon: string; includes?: string[] }) =>
    api.post<{ data: Category }>('/api/v1/categories', data),
  update: (id: string, data: Partial<Category>) =>
    api.put<{ data: Category }>(`/api/v1/categories/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/categories/${id}`),
  reorder: (ids: string[]) => api.put('/api/v1/categories/reorder', { ids }),
};

// === Budget endpoints ===
export const budgetApi = {
  get: (period?: string) => {
    const qs = period ? `?period=${period}` : '';
    return api.get<{ data: BudgetCategoryDisplay[]; summary: BudgetSummary }>(
      `/api/v1/budget${qs}`
    );
  },
  setTarget: (data: { category_id: string; target_amount: number; period_start: string }) =>
    api.post<{ data: BudgetTarget }>('/api/v1/budget/targets', data),
  createItem: (data: { category_id: string; display_name: string; budget_amount?: number }) =>
    api.post<{ data: BudgetLineItem }>('/api/v1/budget/items', data),
  updateItem: (id: string, data: Partial<BudgetLineItem>) =>
    api.put<{ data: BudgetLineItem }>(`/api/v1/budget/items/${id}`, data),
  deleteItem: (id: string) => api.delete(`/api/v1/budget/items/${id}`),
};

// === Account endpoints ===
export const accountApi = {
  list: () => api.get<{ data: Account[] }>('/api/v1/accounts'),
  update: (id: string, data: { hidden?: boolean }) =>
    api.put<{ data: Account }>(`/api/v1/accounts/${id}`, data),
  disconnect: () => api.delete('/api/v1/accounts/disconnect'),
};

// === Settings endpoints ===
export const settingsApi = {
  get: () => api.get<{ data: UserSettings }>('/api/v1/settings'),
  update: (data: Partial<UserSettings>) =>
    api.put<{ data: UserSettings }>('/api/v1/settings', data),
};

// === Amount formatting (ported from mobile) ===
function formatDollarValue(cents: number): string {
  const abs = Math.abs(cents);
  const dollars = abs / 100;
  return dollars.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatAmountSigned(cents: number, isIncome: boolean): string {
  const formatted = formatDollarValue(cents);
  if (cents === 0) return `$${formatted}`;
  return isIncome ? `+$${formatted}` : `-$${formatted}`;
}

export function formatAmountUnsigned(cents: number): string {
  return `$${formatDollarValue(cents)}`;
}
