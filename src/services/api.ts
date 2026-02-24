// src/services/api.ts
// HTTP client for Railway backend — all Plaid token exchanges
// and sensitive operations go through here

import { authService } from './auth';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  const token = await authService.getIdToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return { data: data as T, status: response.status };
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: Record<string, unknown>) => request<T>('POST', path, body),
  put: <T>(path: string, body?: Record<string, unknown>) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: Record<string, unknown>) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
