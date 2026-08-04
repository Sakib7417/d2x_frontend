import { baseApi, bff } from "@/lib/api/base-api";
import { fromInlineEnvelope, buildQuery } from "@/lib/api/pagination";
import { listTags } from "@/lib/api/tags";
import { userPatched } from "@/store/slices/auth-slice";
import type { ApiSuccess, Paginated } from "@/types/api";
import type { User, UserDashboard } from "@/types/models";
import type { UserRole, UserStatus } from "@/types/enums";

/**
 * User endpoints.
 *
 * `GET /users/profile` deliberately lives in `auth-api.ts` instead of here: it
 * is the session's identity probe, and colocating it with login/logout keeps
 * the `Profile` tag owned by one module. Everything that *mutates* the user is
 * here.
 */

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  country?: string;
  walletAddress?: string;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    updateProfile: builder.mutation<User, UpdateProfileRequest>({
      query: (body) => ({ url: bff("/users/profile"), method: "PUT", body }),
      transformResponse: (response: ApiSuccess<User>) => response.data,
      /**
       * Mirror the new name into the auth slice so the topbar and user menu
       * update immediately. They read `AuthUser` from the store, not the
       * `Profile` query, so invalidation alone would leave the old name in the
       * header until the next full page load.
       */
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(userPatched({ name: data.name }));
        } catch {
          /* surfaced by the form */
        }
      },
      invalidatesTags: ["Profile", "UserDashboard"],
    }),

    /**
     * Aggregate landing payload: profile + all wallet balances + network counts
     * in one round trip.
     *
     * Note `totalDeposits` / `totalWithdrawals` in this response are hardcoded
     * 0 on the backend and must not be rendered — see the warning on
     * `UserDashboard`. The dashboard screen pulls those from the deposit and
     * withdrawal statistics endpoints instead.
     */
    userDashboard: builder.query<UserDashboard, void>({
      query: () => bff("/users/dashboard"),
      transformResponse: (response: ApiSuccess<UserDashboard>) => response.data,
      providesTags: ["UserDashboard"],
    }),

    toggleAutoTrade: builder.mutation<{ autoTradeStatus: boolean }, void>({
      query: () => ({ url: bff("/users/auto-trade/toggle"), method: "POST" }),
      transformResponse: (
        response: ApiSuccess<{ autoTradeStatus: boolean }>,
      ) => response.data,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(userPatched({ autoTradeStatus: data.autoTradeStatus }));
        } catch {
          /* surfaced by the toggle */
        }
      },
      /**
       * Not `Trade`: toggling only changes eligibility for the *next* session,
       * it does not create or alter any trade. Invalidating the trade list here
       * would refetch a page of rows that cannot have changed.
       */
      invalidatesTags: ["Profile", "UserDashboard"],
    }),

    /**
     * Admin user list. Pagination is inline in `data` under the `users` key —
     * shape B in `pagination.ts`.
     */
    listUsers: builder.query<Paginated<User>, ListUsersParams | void>({
      query: (params) => ({
        url: bff("/users"),
        params: buildQuery({ ...(params ?? {}) }),
      }),
      transformResponse: (response: unknown) =>
        fromInlineEnvelope<User>(response, "users"),
      providesTags: (result) => listTags("User", result?.items),
    }),
  }),
  overrideExisting: false,
});

export const {
  useUpdateProfileMutation,
  useUserDashboardQuery,
  useToggleAutoTradeMutation,
  useListUsersQuery,
} = usersApi;
