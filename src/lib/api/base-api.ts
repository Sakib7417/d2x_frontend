import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

import { API_TAGS } from "./tags";
import { sessionExpired } from "@/store/slices/auth-slice";

/**
 * The single RTK Query API root.
 *
 * One `createApi` for the whole app, extended per feature via
 * `baseApi.injectEndpoints`. A single root is required (not merely preferred)
 * because cross-module invalidation is pervasive here — approving a deposit
 * has to invalidate wallet and ledger tags, which is impossible across
 * separate API slices without manual dispatch plumbing.
 *
 * Note what is NOT here: no token handling, no refresh logic, no
 * `prepareHeaders` reading localStorage. Auth lives entirely in the BFF proxy
 * (`/api/bff/*`), which attaches the bearer from an httpOnly cookie the client
 * cannot read. From the browser's point of view this is a same-origin,
 * cookie-authenticated API — which also means zero CORS surface.
 */

/**
 * Path helper for proxied backend endpoints.
 *
 * `bff("/wallets/summary")` -> "/bff/wallets/summary" -> proxied to
 * `<API_BASE_URL>/wallets/summary`.
 *
 * The base URL is "/api" rather than "/api/bff" because two different kinds of
 * endpoint live under it: proxied backend routes (`/api/bff/*`) and the BFF's
 * own auth routes (`/api/auth/*`), which capture tokens into cookies and have
 * no upstream equivalent. Keeping one baseQuery for both means a single cache,
 * a single 401 guard and no second `createApi`.
 */
export const bff = (path: string) => `/bff${path}`;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api",
  // Same-origin, but explicit: the session cookies must ride along.
  credentials: "same-origin",
  prepareHeaders: (headers, api) => {
    // Let FormData set its own Content-Type (with boundary) — don't override.
    const body = (api as { body?: unknown }).body;
    if (!(body instanceof FormData) && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    return headers;
  },
});

/**
 * Wraps the base query to react to a terminal 401.
 *
 * Token refresh itself happens server-side in the proxy, transparently. By the
 * time a 401 reaches this layer the proxy has already tried to refresh and
 * failed, and has cleared the session cookies. So there is nothing to retry —
 * the only correct action is to flip client state to logged-out so the UI can
 * redirect, rather than leaving components stuck on a spinner.
 *
 * The `/auth/session` probe is exempt: an unauthenticated answer from it is a
 * normal result, not a session expiry.
 */
const baseQueryWithSessionGuard: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const url = typeof args === "string" ? args : args.url;
    if (!url.startsWith("/auth/")) {
      api.dispatch(sessionExpired());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithSessionGuard,
  tagTypes: API_TAGS,
  /**
   * 60s. Long enough that navigating between dashboard tabs feels instant,
   * short enough that a balance is never served from cache after the user has
   * been away making a deposit. Individual endpoints override this — trade
   * sessions and notification counts use much shorter windows.
   */
  keepUnusedDataFor: 60,
  /**
   * Refetch when the tab regains focus. Essential here: a user who leaves the
   * dashboard open, goes to their wallet app, sends USDT and comes back must
   * not be looking at a five-minute-old balance.
   */
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
