// ─── Client-side API helper ───────────────────────────────────────────────────
// Every mutation goes through apiMutate so a failed request is never mistaken for
// success: the server's error message is shown as a toast and returned to the caller.

import { toast } from 'sonner';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

export async function apiMutate<T = Record<string, unknown>>(
  url: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body?: unknown,
  options: { silent?: boolean } = {},
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = (data && (data.error || data.message)) || `Request failed (${res.status})`;
      if (!options.silent) toast.error(error);
      return { ok: false, status: res.status, error };
    }
    return { ok: true, data: data as T };
  } catch {
    const error = 'Network error. Check your connection and try again.';
    if (!options.silent) toast.error(error);
    return { ok: false, status: 0, error };
  }
}
