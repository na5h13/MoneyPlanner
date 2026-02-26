// API Service Layer — HTTP client for backend communication
// All requests include Firebase ID token for auth (or DEV_MODE bypass)

import Constants from 'expo-constants';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5050';
const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

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
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: { timeout?: number }
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = await getHeaders();
  const timeout = options?.timeout ?? 30000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

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

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

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

export const api = {
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
    return api.get<{ data: import('@/src/types').Transaction[] }>(
      `/api/v1/transactions${qs ? `?${qs}` : ''}`
    );
  },
  get: (id: string) =>
    api.get<{ data: import('@/src/types').Transaction }>(`/api/v1/transactions/${id}`),
  updateCategory: (id: string, categoryId: string, applyToAll: boolean) =>
    api.put(`/api/v1/transactions/${id}/category`, {
      category_id: categoryId,
      apply_to_all: applyToAll,
    }),
  sync: () => api.post<{ data: { synced: number } }>('/api/v1/transactions/sync'),
};

// === Category endpoints ===
export const categoryApi = {
  list: () => api.get<{ data: import('@/src/types').Category[] }>('/api/v1/categories'),
  create: (data: { name: string; icon: string; includes?: string[] }) =>
    api.post<{ data: import('@/src/types').Category }>('/api/v1/categories', data),
  update: (id: string, data: Partial<import('@/src/types').Category>) =>
    api.put<{ data: import('@/src/types').Category }>(`/api/v1/categories/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/categories/${id}`),
  reorder: (ids: string[]) => api.put('/api/v1/categories/reorder', { ids }),
};

// === Budget endpoints ===
export const budgetApi = {
  get: (period?: string) => {
    const qs = period ? `?period=${period}` : '';
    return api.get<{
      data: import('@/src/types').BudgetCategoryDisplay[];
      summary: import('@/src/types').BudgetSummary;
    }>(`/api/v1/budget${qs}`);
  },
  setTarget: (data: { category_id: string; target_amount: number; period_start: string }) =>
    api.post<{ data: import('@/src/types').BudgetTarget }>('/api/v1/budget/targets', data),
  updateTarget: (id: string, data: { target_amount: number }) =>
    api.put<{ data: import('@/src/types').BudgetTarget }>(`/api/v1/budget/targets/${id}`, data),
  getSuggestions: () =>
    api.get<{ data: Array<{ category_id: string; suggested_amount: number }> }>(
      '/api/v1/budget/suggestions'
    ),
  createItem: (data: { category_id: string; display_name: string; budget_amount?: number }) =>
    api.post<{ data: import('@/src/types').BudgetLineItem }>('/api/v1/budget/items', data),
  updateItem: (id: string, data: Partial<import('@/src/types').BudgetLineItem>) =>
    api.put<{ data: import('@/src/types').BudgetLineItem }>(`/api/v1/budget/items/${id}`, data),
  deleteItem: (id: string) => api.delete(`/api/v1/budget/items/${id}`),
  reorderItems: (ids: string[]) => api.put('/api/v1/budget/items/reorder', { ids }),
};

// === Account endpoints ===
export const accountApi = {
  list: () => api.get<{ data: import('@/src/types').Account[] }>('/api/v1/accounts'),
  update: (id: string, data: { hidden?: boolean }) =>
    api.put<{ data: import('@/src/types').Account }>(`/api/v1/accounts/${id}`, data),
  createLinkToken: () =>
    api.post<{ link_token: string }>('/api/v1/accounts/link'),
  disconnect: () => api.delete('/api/v1/accounts/disconnect'),
};

// === Classification endpoints (M8) ===
export const classificationApi = {
  list: () =>
    api.get<{ data: import('@/src/types').SpendingClassification[] }>('/api/v1/classifications'),
  detect: () =>
    api.post<{ data: { classified: number } }>('/api/v1/classifications/detect'),
  override: (id: string, classification_type: import('@/src/types').ClassificationType) =>
    api.put(`/api/v1/classifications/${id}`, { classification_type }),
};

// === Settings endpoints ===
export const settingsApi = {
  get: () => api.get<{ data: import('@/src/types').UserSettings }>('/api/v1/settings'),
  update: (data: Partial<import('@/src/types').UserSettings>) =>
    api.put<{ data: import('@/src/types').UserSettings }>('/api/v1/settings', data),
  export: () => api.post<{ data: { url: string } }>('/api/v1/export'),
};
