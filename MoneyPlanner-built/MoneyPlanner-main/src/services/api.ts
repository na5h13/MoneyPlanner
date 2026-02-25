// src/services/api.ts
// HTTP client for the Flask backend on Railway
// All Plaid token exchanges and sensitive operations go through here

import { authService } from './auth';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5050';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const token = await authService.getIdToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: `Request failed: ${response.status}` }));
      throw new Error(error.error || error.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    return { data: data as T, status: response.status };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      throw new Error(
        'Unable to connect to server. Check your internet connection and API URL.'
      );
    }
    throw error;
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: Record<string, unknown>) =>
    request<T>('POST', path, body),
  put: <T>(path: string, body?: Record<string, unknown>) =>
    request<T>('PUT', path, body),
  patch: <T>(path: string, body?: Record<string, unknown>) =>
    request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
