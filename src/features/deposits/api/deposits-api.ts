import { baseApi, bff } from "@/lib/api/base-api";
import { buildQuery, fromMetaEnvelope } from "@/lib/api/pagination";
import { MONEY_MOVEMENT_TAGS, listTag, listTags } from "@/lib/api/tags";
import type { ApiSuccess, Paginated, UUID } from "@/types/api";
import type { Deposit, DepositStatistics } from "@/types/models";
import type { DepositStatus } from "@/types/enums";

/**
 * Deposit endpoints.
 *
 * Flow: the user submits a transaction hash they have already broadcast
 * on-chain; the backend queues it for blockchain verification, then an admin
 * approves it. So `create` is not a money movement — nothing is credited until
 * approval — which is why it invalidates only the deposit list and stats,
 * while `approve` invalidates the full money set plus referral bonuses.
 */

export interface CreateDepositRequest {
  amount: number;
  transactionHash: string;
  senderAddress: string;
  receiverAddress: string;
  tokenContract: string;
  network: string;
}

/** Response of `GET /deposits/address` — the admin-configured deposit wallet. */
export interface DepositWalletAddress {
  address: string | null;
}

export interface DepositParams {
  page?: number;
  limit?: number;
  status?: DepositStatus;
  startDate?: string;
  endDate?: string;
}

/** Admin list additionally supports a free-text search across user/tx hash. */
export interface AdminDepositParams extends DepositParams {
  search?: string;
}

export const depositsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createDeposit: builder.mutation<Deposit, CreateDepositRequest>({
      query: (body) => ({ url: bff("/deposits"), method: "POST", body }),
      transformResponse: (response: ApiSuccess<Deposit>) => response.data,
      invalidatesTags: [listTag("Deposit"), "DepositStats", "AdminDashboard"],
    }),

    /**
     * The platform deposit wallet address, set by an admin via
     * `PUT /admin/config` (key `DEPOSIT_WALLET_ADDRESS`). Shown on the deposit
     * form so the user knows where to send USDT, and used to prefill the
     * `receiverAddress` field. Returns `address: null` when no admin has
     * configured one and no env fallback exists.
     */
    depositWalletAddress: builder.query<DepositWalletAddress, void>({
      query: () => bff("/deposits/address"),
      transformResponse: (response: ApiSuccess<DepositWalletAddress>) =>
        response.data,
      providesTags: ["DepositStats"],
    }),

    deposits: builder.query<Paginated<Deposit>, DepositParams | void>({
      query: (params) => ({
        url: bff("/deposits"),
        params: buildQuery({ ...(params ?? {}) }),
      }),
      transformResponse: (response: unknown) =>
        fromMetaEnvelope<Deposit>(response),
      providesTags: (result) => listTags("Deposit", result?.items),
    }),

    depositStatistics: builder.query<DepositStatistics, void>({
      query: () => bff("/deposits/statistics"),
      transformResponse: (response: ApiSuccess<DepositStatistics>) =>
        response.data,
      providesTags: ["DepositStats"],
    }),

    deposit: builder.query<Deposit, UUID>({
      query: (id) => bff(`/deposits/${id}`),
      transformResponse: (response: ApiSuccess<Deposit>) => response.data,
      providesTags: (_result, _error, id) => [{ type: "Deposit" as const, id }],
    }),

    /* -- admin ------------------------------------------------------------- */

    adminDeposits: builder.query<Paginated<Deposit>, AdminDepositParams | void>(
      {
        query: (params) => ({
          url: bff("/deposits/admin/all"),
          params: buildQuery({ ...(params ?? {}) }),
        }),
        transformResponse: (response: unknown) =>
          fromMetaEnvelope<Deposit>(response),
        providesTags: (result) => listTags("Deposit", result?.items),
      },
    ),

    /**
     * Approving credits the principal wallet, pays the deposit bonus and
     * cascades referral bonuses up the sponsor chain — which can promote a
     * sponsor's rank. Hence the broad invalidation: anything less leaves a
     * sponsor looking at a stale balance immediately after an approval.
     */
    approveDeposit: builder.mutation<Deposit, UUID>({
      query: (id) => ({ url: bff(`/deposits/${id}/approve`), method: "POST" }),
      transformResponse: (response: ApiSuccess<Deposit>) => response.data,
      invalidatesTags: (_result, _error, id) => [
        ...MONEY_MOVEMENT_TAGS,
        { type: "Deposit" as const, id },
        listTag("Deposit"),
        "DepositStats",
        listTag("ReferralBonus"),
        "ReferralStats",
        listTag("Rank"),
        listTag("Notification"),
        "NotificationCount",
      ],
    }),

    rejectDeposit: builder.mutation<
      Deposit,
      { id: UUID; rejectionReason: string }
    >({
      query: ({ id, ...body }) => ({
        url: bff(`/deposits/${id}/reject`),
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiSuccess<Deposit>) => response.data,
      // No money moved, so this stays narrow — only the row, the list and the
      // counters change.
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Deposit" as const, id },
        listTag("Deposit"),
        "DepositStats",
        "AdminDashboard",
        listTag("Notification"),
        "NotificationCount",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateDepositMutation,
  useDepositWalletAddressQuery,
  useDepositsQuery,
  useDepositStatisticsQuery,
  useDepositQuery,
  useAdminDepositsQuery,
  useApproveDepositMutation,
  useRejectDepositMutation,
} = depositsApi;
