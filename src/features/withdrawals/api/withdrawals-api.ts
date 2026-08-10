import { baseApi, bff } from "@/lib/api/base-api";
import { buildQuery, fromMetaEnvelope } from "@/lib/api/pagination";
import { MONEY_MOVEMENT_TAGS, listTag, listTags } from "@/lib/api/tags";
import type { ApiSuccess, Paginated, UUID } from "@/types/api";
import type { Withdrawal, WithdrawalStatistics } from "@/types/models";
import type { WithdrawalStatus, WithdrawalWalletType } from "@/types/enums";

/**
 * Withdrawal endpoints.
 *
 * Unlike deposits, creating a withdrawal *does* move money immediately: the
 * backend debits the source wallet up front and holds the funds while the
 * request is pending, so the user cannot spend the same balance twice. That is
 * why `create` invalidates the full money set — the balance drops the moment
 * the request is filed, not when an admin processes it.
 */

export interface CreateWithdrawalRequest {
  amount: string;
  walletAddress: string;
  /**
   * Source wallet. Note this is `WithdrawalWalletType`, a strict subset of
   * `WalletType` — ADMIN_COMMISSION is not withdrawable and the backend 400s
   * on it.
   */
  walletType: WithdrawalWalletType;
}

export interface WithdrawalParams {
  page?: number;
  limit?: number;
  status?: WithdrawalStatus;
  startDate?: string;
  endDate?: string;
}

export interface AdminWithdrawalParams extends WithdrawalParams {
  search?: string;
}

export const withdrawalsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createWithdrawal: builder.mutation<Withdrawal, CreateWithdrawalRequest>({
      query: (body) => ({ url: bff("/withdrawals"), method: "POST", body }),
      transformResponse: (response: ApiSuccess<Withdrawal>) => response.data,
      invalidatesTags: [
        ...MONEY_MOVEMENT_TAGS,
        listTag("Withdrawal"),
        "WithdrawalStats",
      ],
    }),

    withdrawals: builder.query<Paginated<Withdrawal>, WithdrawalParams | void>({
      query: (params) => ({
        url: bff("/withdrawals"),
        params: buildQuery({ ...(params ?? {}) }),
      }),
      transformResponse: (response: unknown) =>
        fromMetaEnvelope<Withdrawal>(response),
      providesTags: (result) => listTags("Withdrawal", result?.items),
    }),

    withdrawalStatistics: builder.query<WithdrawalStatistics, void>({
      query: () => bff("/withdrawals/statistics"),
      transformResponse: (response: ApiSuccess<WithdrawalStatistics>) =>
        response.data,
      providesTags: ["WithdrawalStats"],
    }),

    withdrawal: builder.query<Withdrawal, UUID>({
      query: (id) => bff(`/withdrawals/${id}`),
      transformResponse: (response: ApiSuccess<Withdrawal>) => response.data,
      providesTags: (_result, _error, id) => [
        { type: "Withdrawal" as const, id },
      ],
    }),

    /** Marks the payout as sent on-chain and records the transaction hash. */
    processWithdrawal: builder.mutation<
      Withdrawal,
      { id: UUID; transactionHash: string }
    >({
      query: ({ id, ...body }) => ({
        url: bff(`/withdrawals/${id}/process`),
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiSuccess<Withdrawal>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        ...MONEY_MOVEMENT_TAGS,
        { type: "Withdrawal" as const, id },
        listTag("Withdrawal"),
        "WithdrawalStats",
        listTag("Notification"),
        "NotificationCount",
      ],
    }),

    /**
     * Rejection refunds the held amount back to the source wallet, so this is
     * a money movement even though nothing left the platform.
     */
    rejectWithdrawal: builder.mutation<
      Withdrawal,
      { id: UUID; rejectionReason: string }
    >({
      query: ({ id, ...body }) => ({
        url: bff(`/withdrawals/${id}/reject`),
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiSuccess<Withdrawal>) => response.data,
      invalidatesTags: (_result, _error, { id }) => [
        ...MONEY_MOVEMENT_TAGS,
        { type: "Withdrawal" as const, id },
        listTag("Withdrawal"),
        "WithdrawalStats",
        listTag("Notification"),
        "NotificationCount",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateWithdrawalMutation,
  useWithdrawalsQuery,
  useWithdrawalStatisticsQuery,
  useWithdrawalQuery,
  useProcessWithdrawalMutation,
  useRejectWithdrawalMutation,
} = withdrawalsApi;
