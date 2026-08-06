import { baseApi, bff } from "@/lib/api/base-api";
import {
  sessionCleared,
  sessionEstablished,
} from "@/store/slices/auth-slice";
import type { ApiSuccess } from "@/types/api";
import type { AuthUser, User } from "@/types/models";

/**
 * Auth endpoints.
 *
 * Split across two origins on purpose:
 *
 *   /api/auth/*  — BFF-owned. login, signup, logout, session. These are the
 *                  only routes that touch raw JWTs; they move tokens into
 *                  httpOnly cookies and return just the user.
 *   /api/bff/*   — proxied straight through to Express. Password reset and
 *                  change-password carry no tokens, so they need no special
 *                  handling.
 */

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Signup payload is `multipart/form-data` because it carries two government ID
 * photos (`govIdFront`, `govIdBack`) alongside the text fields. Built by
 * `toSignupRequest` in the auth schemas.
 */
export type SignupRequest = FormData;

interface AuthPayload {
  user: AuthUser | null;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthUser, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (response: ApiSuccess<AuthPayload>) => {
        if (!response.data?.user) {
          throw new Error("Login response did not include a user");
        }
        return response.data.user;
      },
      /**
       * Push the identity into the auth slice as soon as it lands, so the
       * shell can render the signed-in state before the router finishes
       * navigating. Waiting for a `/users/profile` round trip here would show
       * an empty header for a beat after login.
       */
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const user = await queryFulfilled;
          dispatch(sessionEstablished(user.data));
        } catch {
          // Failure is surfaced by the component via the mutation's error.
        }
      },
      // Nothing to invalidate on the way in — the cache is empty pre-login —
      // but every user-scoped tag must be dropped so a previous session's
      // cached data can never bleed into the new one.
      invalidatesTags: ["Profile", "UserDashboard", "WalletSummary", "Session"],
    }),

    signup: builder.mutation<AuthUser, SignupRequest>({
      query: (body) => ({ url: "/auth/signup", method: "POST", body }),
      transformResponse: (response: ApiSuccess<AuthPayload>) => {
        if (!response.data?.user) {
          throw new Error("Signup response did not include a user");
        }
        return response.data.user;
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const user = await queryFulfilled;
          dispatch(sessionEstablished(user.data));
        } catch {
          /* surfaced by the component */
        }
      },
      invalidatesTags: ["Profile", "UserDashboard", "WalletSummary", "Session"],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          // Clear locally even if the upstream revocation failed — the cookies
          // are gone either way, so the UI must not claim the user is signed
          // in. See the note in the logout route handler.
          dispatch(sessionCleared());
          // Drop every cached response. Without this, signing in as a
          // different user on the same device would briefly show the previous
          // user's balances from cache.
          dispatch(baseApi.util.resetApiState());
        }
      },
    }),

    forgotPassword: builder.mutation<{ message?: string }, { email: string }>({
      query: (body) => ({
        url: bff("/auth/forgot-password"),
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => ({
        message: response.message,
      }),
    }),

    resetPassword: builder.mutation<
      { message?: string },
      { token: string; newPassword: string }
    >({
      query: (body) => ({
        url: bff("/auth/reset-password"),
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => ({
        message: response.message,
      }),
    }),

    changePassword: builder.mutation<
      { message?: string },
      { oldPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: bff("/auth/change-password"),
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => ({
        message: response.message,
      }),
    }),

    /**
     * Authoritative current user.
     *
     * The auth slice holds the trimmed `AuthUser` from login; this returns the
     * full record (phone, country, wallet address, timestamps) and is what
     * profile screens bind to.
     */
    profile: builder.query<User, void>({
      query: () => bff("/users/profile"),
      transformResponse: (response: ApiSuccess<User>) => response.data,
      providesTags: ["Profile"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useSignupMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useProfileQuery,
} = authApi;
