import { baseApi, bff } from "@/lib/api/base-api";
import { buildQuery, fromMetaEnvelope } from "@/lib/api/pagination";
import { listTags } from "@/lib/api/tags";
import type { ApiSuccess, Paginated, UUID } from "@/types/api";
import type { Ledger } from "@/types/models";
import type { LedgerType } from "@/types/enums";

/**
 * Ledger (transaction history) endpoints.
 *
 * The ledger is append-only on the backend — there are no mutations here by
 * design. Every row is written as a side effect of a deposit, withdrawal,
 * trade or bonus, which is why `Ledger` is in `MONEY_MOVEMENT_TAGS`: those
 * operations invalidate this list rather than this module doing so itself.
 */

export interface LedgerParams {
  page?: number;
  limit?: number;
  type?: LedgerType;
  walletId?: UUID;
  referenceId?: UUID;
  /** ISO date (YYYY-MM-DD). Inclusive lower bound. */
  startDate?: string;
  /** ISO date (YYYY-MM-DD). Inclusive upper bound. */
  endDate?: string;
}

export const ledgerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ledgers: builder.query<Paginated<Ledger>, LedgerParams | void>({
      query: (params) => ({
        url: bff("/ledgers"),
        params: buildQuery({ ...(params ?? {}) }),
      }),
      transformResponse: (response: unknown) =>
        fromMetaEnvelope<Ledger>(response),
      providesTags: (result) => listTags("Ledger", result?.items),
    }),

    walletLedgers: builder.query<
      Paginated<Ledger>,
      { walletId: UUID } & LedgerParams
    >({
      query: ({ walletId, ...params }) => ({
        url: bff(`/ledgers/wallet/${walletId}`),
        params: buildQuery({ ...params }),
      }),
      transformResponse: (response: unknown) =>
        fromMetaEnvelope<Ledger>(response),
      providesTags: (result) => listTags("Ledger", result?.items),
    }),

    ledger: builder.query<Ledger, UUID>({
      query: (id) => bff(`/ledgers/${id}`),
      transformResponse: (response: ApiSuccess<Ledger>) => response.data,
      providesTags: (_result, _error, id) => [{ type: "Ledger" as const, id }],
    }),
  }),
  overrideExisting: false,
});

export const { useLedgersQuery, useWalletLedgersQuery, useLedgerQuery } =
  ledgerApi;
