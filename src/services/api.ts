// src/services/api.ts
// HTTP client for Flask backend on Railway.
// DEV_MODE: skips Firebase token entirely — backend also runs in DEV_MODE with user-1 fallback.

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5050';
const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
}

async function getToken(): Promise<string | null> {
  if (DEV_MODE) return null; // Backend handles DEV_MODE with user-1 fallback
  try {
    const { authService } = await import('./auth');
    return await authService.getIdToken();
  } catch {
    return null;
  }
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: `HTTP ${response.status} — ${url}` }));
    throw new Error(error.error || error.message || `API Error ${response.status}`);
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
