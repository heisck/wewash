"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Thin typed client over our /api/v1/* routes.
 * Unwraps the standard { success, data, meta } envelope and throws ApiError
 * on failure so callers can try/catch or surface toast messages.
 */

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type Envelope<T> =
  | { success: true; data: T; meta?: PaginationMeta }
  | { success: false; error: { code: string; message: string; details?: unknown } };

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  signal?: AbortSignal
): Promise<{ data: T; meta?: PaginationMeta }> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError(
      "Network error — check your connection and try again.",
      "NETWORK_ERROR",
      0
    );
  }

  let json: Envelope<T> | null = null;
  try {
    // 204 No Content
    if (res.status === 204) {
      return { data: undefined as T };
    }
    json = (await res.json()) as Envelope<T>;
  } catch {
    // non-JSON body
  }

  if (!res.ok || !json || json.success === false) {
    const err = json && json.success === false ? json.error : undefined;
    throw new ApiError(
      err?.message || res.statusText || "Request failed",
      err?.code || "REQUEST_FAILED",
      res.status,
      err?.details
    );
  }

  return { data: json.data, meta: json.meta };
}

export const api = {
  async get<T>(path: string, signal?: AbortSignal): Promise<T> {
    return (await request<T>("GET", path, undefined, signal)).data;
  },
  async getWithMeta<T>(path: string, signal?: AbortSignal) {
    return request<T>("GET", path, undefined, signal);
  },
  async post<T>(path: string, body?: unknown): Promise<T> {
    return (await request<T>("POST", path, body)).data;
  },
  async patch<T>(path: string, body?: unknown): Promise<T> {
    return (await request<T>("PATCH", path, body)).data;
  },
  async put<T>(path: string, body?: unknown): Promise<T> {
    return (await request<T>("PUT", path, body)).data;
  },
  async del<T>(path: string, body?: unknown): Promise<T> {
    return (await request<T>("DELETE", path, body)).data;
  },
};

/**
 * useApi — load data on mount (and when `path` changes). Returns
 * { data, meta, loading, error, reload }. Aborts in-flight requests on unmount.
 */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(!!path);
  const [error, setError] = useState<ApiError | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!path) return;
    ctrl.current?.abort();
    const controller = new AbortController();
    ctrl.current = controller;
    setLoading(true);
    setError(null);
    try {
      const { data, meta } = await request<T>("GET", path, undefined, controller.signal);
      if (!controller.signal.aborted) {
        setData(data);
        setMeta(meta);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (!controller.signal.aborted) setError(e as ApiError);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
    return () => ctrl.current?.abort();
  }, [load]);

  return { data, meta, loading, error, reload: load, setData };
}

/**
 * useMutation — wraps an async action with pending/error state.
 */
export function useMutation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>
) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const mutate = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      setPending(true);
      setError(null);
      try {
        return await fn(...args);
      } catch (e) {
        setError(e as ApiError);
        throw e;
      } finally {
        setPending(false);
      }
    },
    [fn]
  );

  return { mutate, pending, error };
}
