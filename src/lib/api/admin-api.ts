import { baseApi, bff } from "@/lib/api/base-api";
import {
  buildQuery,
  fromInlineEnvelope,
  type PaginationParams,
} from "@/lib/api/pagination";
import { listTag, listTags } from "@/lib/api/tags";
import type { ApiSuccess, Paginated, UUID } from "@/types/api";
import type { AdminUserAction } from "@/types/enums";
import type {
  AdminAnalytics,
  AdminDashboard,
  AppNotification,
  AuditLog,
  BlockchainTransaction,
  CycleBonus,
  Deposit,
  Rank,
  Referral,
  Setting,
  Trade,
  TradeExclusion,
  TradeSchedule,
  TradingStatus,
  UpdateTradeScheduleRequest,
  User,
  Wallet,
  Withdrawal,
} from "@/types/models";

export interface AdminListParams extends PaginationParams {
  search?: string;
  status?: string;
}

/**
 * Body for `PUT /admin/config` — the generic setting upsert endpoint.
 *
 * The backend's `updateConfigSchema` (zod) enforces:
 *   key:         string, 1..100
 *   value:       string, 1..1000
 *   description: string, max 500, optional
 */
export interface UpdateConfigRequest {
  key: string;
  value: string;
  description?: string;
}

export interface ManageUserRequest {
  userId: UUID;
  action: AdminUserAction;
  reason?: string;
}

export interface ToggleTradingRequest {
  enabled: boolean;
}

export interface AddTradeExclusionRequest {
  userId: UUID;
  reason?: string;
}

export interface GiveRewardRequest {
  userId: UUID;
  amount: number;
  walletType: string;
  reason: string;
}

export interface AdminTeamMember {
  id: UUID;
  userId: UUID;
  level: number;
  investedAmount: number;
  directReferralCount: number;
  teamSize: number;
  joinedAt: string | null;
  user: { id: UUID; name: string | null; email: string } | null;
}

const listQuery = (path: string, params: AdminListParams) => ({
  url: bff(path),
  params: buildQuery({
    page: params.page,
    limit: params.limit,
    search: params.search,
    status: params.status,
  }),
});

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    adminDashboard: builder.query<AdminDashboard, void>({
      query: () => bff("/admin/dashboard"),
      transformResponse: (response: ApiSuccess<AdminDashboard>) => response.data,
      providesTags: ["AdminDashboard"],
    }),
    adminAnalytics: builder.query<AdminAnalytics, void>({
      query: () => bff("/admin/analytics"),
      transformResponse: (response: ApiSuccess<AdminAnalytics>) => response.data,
      providesTags: ["AdminAnalytics"],
    }),
    adminUsers: builder.query<Paginated<User>, AdminListParams>({
      query: (params) => listQuery("/admin/users", params),
      transformResponse: (response: unknown) =>
        fromInlineEnvelope<User>(response, "users"),
      providesTags: (result) => listTags("User", result?.items),
    }),
    /**
     * Single user detail (admin). Returns the full user record including
     * government ID photos for KYC review.
     */
    adminUserDetail: builder.query<User, UUID>({
      query: (userId) => bff(`/admin/users/${userId}`),
      transformResponse: (response: ApiSuccess<User>) => response.data,
      providesTags: (result) =>
        result
          ? [listTag("User"), { type: "User" as const, id: result.id }]
          : [listTag("User")],
    }),
    /**
     * Team members under a user (all levels) with each member's approved
     * deposit total — the per-member investment breakdown on Referrals.
     */
    adminUserTeam: builder.query<{ members: AdminTeamMember[] }, UUID>({
      query: (userId) => bff(`/admin/users/${userId}/team`),
      transformResponse: (response: ApiSuccess<{ members: AdminTeamMember[] }>) =>
        response.data,
    }),
    adminDeposits: builder.query<Paginated<Deposit>, AdminListParams>({
      query: (params) => listQuery("/admin/deposits", params),
      transformResponse: (response: unknown) =>
        fromInlineEnvelope<Deposit>(response, "deposits"),
      providesTags: (result) => listTags("Deposit", result?.items),
    }),
    adminWithdrawals: builder.query<Paginated<Withdrawal>, AdminListParams>({
      query: (params) => listQuery("/admin/withdrawals", params),
      transformResponse: (response: unknown) =>
        fromInlineEnvelope<Withdrawal>(response, "withdrawals"),
      providesTags: (result) => listTags("Withdrawal", result?.items),
    }),
    adminTrades: builder.query<Paginated<Trade>, AdminListParams>({
      query: (params) => listQuery("/admin/trades", params),
      transformResponse: (response: unknown) =>
        fromInlineEnvelope<Trade>(response, "items"),
      providesTags: (result) => listTags("Trade", result?.items),
    }),
    adminWallets: builder.query<Paginated<Wallet>, AdminListParams>({
      query: (params) => listQuery("/admin/wallets", params),
      transformResponse: (response: unknown) =>
        fromInlineEnvelope<Wallet>(response, "items"),
      providesTags: (result) => listTags("Wallet", result?.items),
    }),
    adminReferrals: builder.query<Paginated<Referral>, AdminListParams>({
      query: (params) => listQuery("/admin/referrals", params),
      transformResponse: (response: unknown) =>
        fromInlineEnvelope<Referral>(response, "items"),
      providesTags: (result) => listTags("Referral", result?.items),
    }),
    adminRanks: builder.query<Paginated<Rank>, AdminListParams>({
      query: (params) => listQuery("/admin/ranks", params),
      transformResponse: (response: unknown) =>
        fromInlineEnvelope<Rank>(response, "items"),
      providesTags: (result) => listTags("Rank", result?.items),
    }),
    adminCycleBonuses: builder.query<Paginated<CycleBonus>, AdminListParams>({
      query: (params) => listQuery("/admin/cycle-bonuses", params),
      transformResponse: (response: unknown) =>
        fromInlineEnvelope<CycleBonus>(response, "items"),
      providesTags: (result) => listTags("CycleBonus", result?.items),
    }),
    adminBlockchain: builder.query<
      Paginated<BlockchainTransaction>,
      AdminListParams
    >({
      query: (params) => listQuery("/admin/blockchain", params),
      transformResponse: (response: unknown) =>
        fromInlineEnvelope<BlockchainTransaction>(response, "items"),
      providesTags: (result) => listTags("Blockchain", result?.items),
    }),
    adminNotifications: builder.query<
      Paginated<AppNotification>,
      AdminListParams
    >({
      query: (params) => listQuery("/admin/notifications", params),
      transformResponse: (response: unknown) =>
        fromInlineEnvelope<AppNotification>(response, "items"),
      providesTags: (result) => listTags("Notification", result?.items),
    }),
    adminAuditLogs: builder.query<Paginated<AuditLog>, AdminListParams>({
      query: (params) => listQuery("/admin/audit-logs", params),
      transformResponse: (response: unknown) =>
        fromInlineEnvelope<AuditLog>(response, "items"),
      providesTags: (result) => listTags("AuditLog", result?.items),
    }),
    adminSettings: builder.query<Paginated<Setting>, AdminListParams>({
      query: (params) => listQuery("/admin/settings", params),
      transformResponse: (response: unknown) =>
        fromInlineEnvelope<Setting>(response, "items"),
      providesTags: (result) => listTags("Setting", result?.items),
    }),

    /**
     * Upsert a platform setting via `PUT /admin/config`.
     *
     * Used today for `DEPOSIT_WALLET_ADDRESS` (the wallet users send USDT to),
     * but the endpoint is generic so this mutation is too — pass any known
     * setting key. Invalidates the settings list so the table refreshes.
     */
    updateConfig: builder.mutation<Setting, UpdateConfigRequest>({
      query: (body) => ({ url: bff("/admin/config"), method: "PUT", body }),
      transformResponse: (response: ApiSuccess<Setting>) => response.data,
      invalidatesTags: [listTag("Setting"), "AdminDashboard"],
    }),

    /**
     * Get the two daily trade execution windows.
     *
     * Returns `{ morning: { hour, minute, time }, evening: { hour, minute, time } }`.
     */
    adminTradeSchedule: builder.query<TradeSchedule, void>({
      query: () => bff("/admin/trade-schedule"),
      transformResponse: (response: ApiSuccess<TradeSchedule>) => response.data,
      providesTags: ["Setting"],
    }),

    /**
     * Update both daily trade execution windows.
     *
     * Accepts `morning` and `evening` as `HH:MM` strings. The backend reschedules
     * the cron jobs automatically, so the new times take effect immediately.
     */
    updateTradeSchedule: builder.mutation<TradeSchedule, UpdateTradeScheduleRequest>({
      query: (body) => ({ url: bff("/admin/trade-schedule"), method: "PUT", body }),
      transformResponse: (response: ApiSuccess<TradeSchedule>) => response.data,
      invalidatesTags: ["Setting"],
    }),

    /**
     * Global auto-trading on/off switch.
     *
     * When disabled, no new trade sessions are executed by cron or manual trigger.
     * Pending trades already created still settle on schedule.
     */
    adminTradingStatus: builder.query<TradingStatus, void>({
      query: () => bff("/admin/trading/status"),
      transformResponse: (response: ApiSuccess<TradingStatus>) => response.data,
      providesTags: ["Setting"],
    }),

    toggleTrading: builder.mutation<{ enabled: boolean }, ToggleTradingRequest>({
      query: (body) => ({ url: bff("/admin/trading/toggle"), method: "PUT", body }),
      transformResponse: (response: ApiSuccess<{ enabled: boolean }>) => response.data,
      invalidatesTags: ["Setting"],
    }),

    /**
     * Users explicitly excluded from auto-trading. Even when trading is globally
     * enabled, these users are skipped during trade session execution.
     */
    adminTradeExclusions: builder.query<Paginated<TradeExclusion>, AdminListParams>({
      query: (params) => listQuery("/admin/trading/exclusions", params),
      transformResponse: (response: unknown) =>
        fromInlineEnvelope<TradeExclusion>(response, "exclusions"),
      providesTags: (result) => listTags("TradeExclusion", result?.items),
    }),

    addTradeExclusion: builder.mutation<TradeExclusion, AddTradeExclusionRequest>({
      query: (body) => ({ url: bff("/admin/trading/exclusions"), method: "POST", body }),
      transformResponse: (response: ApiSuccess<TradeExclusion>) => response.data,
      invalidatesTags: [{ type: "TradeExclusion", id: "LIST" }],
    }),

    removeTradeExclusion: builder.mutation<{ userId: UUID; excluded: boolean }, UUID>({
      query: (userId) => ({ url: bff(`/admin/trading/exclusions/${userId}`), method: "DELETE" }),
      transformResponse: (response: ApiSuccess<{ userId: UUID; excluded: boolean }>) => response.data,
      invalidatesTags: [{ type: "TradeExclusion", id: "LIST" }],
    }),

    /**
     * Manually credit a reward to a user's wallet (`POST /admin/users/reward`).
     * The backend writes an ADJUSTMENT ledger entry and notifies the user.
     */
    giveReward: builder.mutation<unknown, GiveRewardRequest>({
      query: (body) => ({ url: bff("/admin/users/reward"), method: "POST", body }),
      invalidatesTags: [listTag("Wallet"), listTag("Ledger"), "AdminDashboard"],
    }),
    manageUser: builder.mutation<User, ManageUserRequest>({
      query: (body) => ({ url: bff("/admin/users/action"), method: "POST", body }),
      transformResponse: (response: ApiSuccess<User>) => response.data,
      invalidatesTags: ["User"],
    }),
    toggleContentCreator: builder.mutation<unknown, { userId: UUID; isContentCreator: boolean }>({
      query: ({ userId, isContentCreator }) => ({
        url: bff(`/admin/users/${userId}/content-creator`),
        method: "PUT",
        body: { isContentCreator },
      }),
      invalidatesTags: ["User"],
    }),
    adminContentCreators: builder.query<unknown[], void>({
      query: () => bff("/admin/content-creators"),
      transformResponse: (response: ApiSuccess<unknown[]>) => response.data,
      providesTags: ["User"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useAdminDashboardQuery,
  useAdminAnalyticsQuery,
  useAdminUsersQuery,
  useAdminUserDetailQuery,
  useAdminUserTeamQuery,
  useAdminDepositsQuery,
  useAdminWithdrawalsQuery,
  useAdminTradesQuery,
  useAdminWalletsQuery,
  useAdminReferralsQuery,
  useAdminRanksQuery,
  useAdminCycleBonusesQuery,
  useAdminBlockchainQuery,
  useAdminNotificationsQuery,
  useAdminAuditLogsQuery,
  useAdminSettingsQuery,
  useUpdateConfigMutation,
  useManageUserMutation,
  useGiveRewardMutation,
  useAdminTradeScheduleQuery,
  useUpdateTradeScheduleMutation,
  useAdminTradingStatusQuery,
  useToggleTradingMutation,
  useAdminTradeExclusionsQuery,
  useAddTradeExclusionMutation,
  useRemoveTradeExclusionMutation,
  useToggleContentCreatorMutation,
  useAdminContentCreatorsQuery,
} = adminApi;
