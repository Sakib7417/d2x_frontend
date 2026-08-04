import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AuthUser } from "@/types/models";
import { UserRole } from "@/types/enums";

/**
 * Client-side auth state.
 *
 * This slice holds NO tokens — they live in httpOnly cookies the browser
 * cannot read. What it holds is the identity the UI needs in order to render:
 * display name, role, referral code, rank.
 *
 * It is hydrated on the server (the root layout reads the session cookie and
 * passes a preloaded state into the store), so the correct chrome renders on
 * the very first paint. That is why `status` starts as `unknown` rather than
 * `unauthenticated`: rendering a "Sign in" button for one frame to a user who
 * is in fact signed in is exactly the flicker this design exists to avoid.
 */

export type AuthStatus =
  /** Not yet determined — server hydration has not run. Render skeletons. */
  | "unknown"
  | "authenticated"
  | "unauthenticated";

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  /**
   * Set when the proxy reported a terminal 401. Consumed by
   * `SessionExpiryWatcher`, which shows a toast and redirects once, then
   * clears it — a flag rather than a side effect so that ten concurrent 401s
   * produce one redirect, not ten.
   */
  expired: boolean;
}

const initialState: AuthState = {
  status: "unknown",
  user: null,
  expired: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Server-side hydration, or a successful login/signup. */
    sessionEstablished(state, action: PayloadAction<AuthUser>) {
      state.status = "authenticated";
      state.user = action.payload;
      state.expired = false;
    },

    /** Definitively signed out — hydration found no cookie, or logout ran. */
    sessionCleared(state) {
      state.status = "unauthenticated";
      state.user = null;
      state.expired = false;
    },

    /** A request returned 401 after the proxy's refresh attempt failed. */
    sessionExpired(state) {
      // Guard against redundant dispatches from parallel failed requests.
      if (state.status === "unauthenticated") return;
      state.status = "unauthenticated";
      state.user = null;
      state.expired = true;
    },

    /** Acknowledge the expiry notice so it fires exactly once. */
    expiryAcknowledged(state) {
      state.expired = false;
    },

    /**
     * Patch the cached identity after a profile update or an auto-trade
     * toggle, so the shell reflects the change without a full refetch.
     */
    userPatched(state, action: PayloadAction<Partial<AuthUser>>) {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
    },
  },
});

export const {
  sessionEstablished,
  sessionCleared,
  sessionExpired,
  expiryAcknowledged,
  userPatched,
} = authSlice.actions;

export const authReducer = authSlice.reducer;

/* -------------------------------------------------------------------------- */
/* Selectors                                                                   */
/* -------------------------------------------------------------------------- */

interface WithAuth {
  auth: AuthState;
}

export const selectAuthStatus = (state: WithAuth): AuthStatus =>
  state.auth.status;

export const selectCurrentUser = (state: WithAuth): AuthUser | null =>
  state.auth.user;

export const selectIsAuthenticated = (state: WithAuth): boolean =>
  state.auth.status === "authenticated";

/**
 * Role check.
 *
 * Convenience for rendering — it decides whether to *show* an admin link.
 * It is not a security control: the Express `authorize('ADMIN')` middleware is.
 * Anyone can flip this in devtools and see an admin shell that 403s on every
 * request.
 */
export const selectIsAdmin = (state: WithAuth): boolean =>
  state.auth.user?.role === UserRole.ADMIN;

export const selectSessionExpired = (state: WithAuth): boolean =>
  state.auth.expired;
