import { handleOfflineRequest } from './fallback';

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: string | null;
}

export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: string | null;

  constructor(status: number, code: string, message: string, details?: string | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

let isUsingFallback = false;

export function getIsUsingFallback(): boolean {
  return isUsingFallback;
}

export async function apiClient<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 4000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!res.ok) {
      let code = `HTTP_${res.status}`;
      let message = res.statusText || 'An unexpected error occurred';
      let details: string | null = null;

      try {
        const body = await res.json();
        if (body?.error) {
          code = body.error.code || code;
          message = body.error.message || message;
          details = body.error.details || null;
        } else if (body?.detail) {
          message = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
        }
      } catch {
        // Response was not JSON
      }

      throw new ApiError(res.status, code, message, details);
    }

    if (isUsingFallback) {
      isUsingFallback = false;
      window.dispatchEvent(new CustomEvent('shadowsafe:fallback-mode', { detail: { active: false } }));
    }

    if (res.status === 204) {
      return {} as T;
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    // If it is a real HTTP error response from server (e.g. 401, 404, 409), preserve it
    if (err instanceof ApiError && err.status !== 0) {
      throw err;
    }

    // Backend offline / network unreachable / timeout: Seamlessly activate local fallback engine
    isUsingFallback = true;
    window.dispatchEvent(new CustomEvent('shadowsafe:fallback-mode', { detail: { active: true } }));
    return await handleOfflineRequest<T>(url, options);
  } finally {
    clearTimeout(timeoutId);
  }
}
