/**
 * Authenticated fetch wrapper.
 * Auth tokens are now stored in HTTP-only cookies and sent automatically.
 * This wrapper handles 401 → logout.
 */

import { useAuthStore } from "@/stores/authStore";

type FetchOptions = RequestInit & {
  /** Skip auth handling (for public endpoints) */
  skipAuth?: boolean;
};

/**
 * Wrapper around `fetch` that handles token expiry.
 * Cookies are sent automatically on same-origin requests.
 */
export async function authFetch(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const { skipAuth, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);

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
