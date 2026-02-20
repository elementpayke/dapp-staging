/**
 * Authenticated fetch wrapper.
 * Attaches the Bearer token to all requests and handles 401 → logout.
 */

import { useAuthStore } from "@/stores/authStore";

type FetchOptions = RequestInit & {
  /** Skip auth header (for public endpoints) */
  skipAuth?: boolean;
};

/**
 * Wrapper around `fetch` that injects the auth token and handles expiry.
 */
export async function authFetch(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const { skipAuth, ...fetchOptions } = options;

  const token = useAuthStore.getState().token;

  const headers = new Headers(fetchOptions.headers);

  if (!skipAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && fetchOptions.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...fetchOptions, headers });

  // 401 → token expired or invalid → clear auth
  if (res.status === 401 && !skipAuth) {
    useAuthStore.getState().clearAuth();
    // Redirect to landing (in SPA context)
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }

  return res;
}
