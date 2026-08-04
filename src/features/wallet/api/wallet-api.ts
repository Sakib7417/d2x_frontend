import { baseApi, bff } from "@/lib/api/base-api";
import { MONEY_MOVEMENT_TAGS, listTag } from "@/lib/api/tags";
import type { ApiSuccess, DecimalString } from "@/types/api";
import type { Wallet, WalletSummary, WalletSummaryEntry } from "@/types/models";
import { ALL_WALLET_TYPES, type WalletType } from "@/types/enums";

/**
 * Wallet endpoints.
 *
 * The interesting part here is `summary`, whose wire shape is hostile:
 *
 *   { principal: {...}, trading_profit: {...}, …, totalBalance: "123.45" }
 *
 * — lowercased wallet-type keys sitting at the same level as a scalar
 * `totalBalance`. Consuming that directly means every component does
 * `data[type.toLowerCase()]` and hopes, with no way to distinguish "wallet
 * absent" from "typo'd key". `transformResponse` normalises it once into
 * `WalletSummary` and nothing downstream ever sees the raw form.
 */

export interface TransferRequest {
  fromWalletType: WalletType;
  toWalletType: WalletType;
  /**
   * Whole-token amount as a decimal string. The backend's Zod schema is
   * `z.string().refine(parseFloat)` and then the controller calls `parseFloat`.
   */
  amount: string;
}

export interface TransferResult {
  fromWallet: Wallet;
  toWallet: Wallet;
}

export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    walletSummary: builder.query<WalletSummary, void>({
      query: () => bff("/wallets/summary"),
      transformResponse: (response: ApiSuccess<Record<string, unknown>>) => {
        const data = response.data ?? {};

        const wallets: Partial<Record<WalletType, WalletSummaryEntry>> = {};
        for (const type of ALL_WALLET_TYPES) {
          // The backend lowercases the enum member for the key.
          const entry = data[type.toLowerCase()];
          if (entry && typeof entry === "object") {
            wallets[type] = entry as WalletSummaryEntry;
          }
        }

        return {
          wallets,
          totalBalance: (data.totalBalance ?? "0") as DecimalString,
        };
      },
      providesTags: ["WalletSummary"],
    }),

    wallet: builder.query<Wallet, WalletType>({
      query: (type) => bff(`/wallets/${type}`),
      transformResponse: (response: ApiSuccess<Wallet>) => response.data,
      providesTags: (result, _error, type) => [
        { type: "Wallet" as const, id: result?.id ?? type },
      ],
    }),

    walletBalance: builder.query<DecimalString, WalletType>({
      query: (type) => bff(`/wallets/${type}/balance`),
      transformResponse: (response: ApiSuccess<{ balance: DecimalString }>) =>
        response.data.balance,
      providesTags: (_result, _error, type) => [
        { type: "Wallet" as const, id: type },
      ],
    }),

    transfer: builder.mutation<TransferResult, TransferRequest>({
      query: (body) => ({
        url: bff("/wallets/transfer"),
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiSuccess<TransferResult>) =>
        response.data,
      // A transfer is a balance change on both sides plus two ledger rows, so
      // it invalidates the full money-movement set rather than just the two
      // wallets involved.
      invalidatesTags: [...MONEY_MOVEMENT_TAGS, listTag("Wallet")],
    }),
  }),
  overrideExisting: false,
});

export const {
  useWalletSummaryQuery,
  useWalletQuery,
  useWalletBalanceQuery,
  useTransferMutation,
} = walletApi;
