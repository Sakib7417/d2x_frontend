import { baseApi, bff } from "@/lib/api/base-api";
import { buildQuery, fromMetaEnvelope } from "@/lib/api/pagination";
import { MONEY_MOVEMENT_TAGS, listTag, listTags } from "@/lib/api/tags";
import type { ApiSuccess, Paginated, UUID } from "@/types/api";
import type { P2PRecipientLookup, P2PTransfer } from "@/types/models";
import type { WalletType } from "@/types/enums";

/**
 * P2P transfer endpoints.
 *
 * A transfer moves money between two users' same-type wallets in one atomic
 * backend transaction, so it invalidates the full money-movement set — both
 * the sender's and (indirectly) balances platform-wide are stale afterwards.
 */

export interface P2PTransferRequest {
  /** Recipient email or referral code. */
  recipient: string;
  walletType: WalletType;
  /** Whole-token amount as a decimal string. */
  amount: string;
}

export interface P2PTransferResult {
  transfer: P2PTransfer;
  senderWallet: { id: UUID; balance: string };
  receiverWallet: { id: UUID; balance: string };
  /** Receiver is always credited into PRINCIPAL. */
  receiverWalletType: WalletType;
  receiverName: string;
  feeAmount: string;
  feePercent: number;
  /** What the sender's wallet was actually debited: amount + fee. */
  totalDebit: string;
}

export interface P2PTransfersParams {
  page?: number;
  limit?: number;
}

export const p2pApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    p2pLookup: builder.query<P2PRecipientLookup, string>({
      query: (identifier) => ({
        url: bff("/p2p/lookup"),
        params: buildQuery({ identifier }),
      }),
      transformResponse: (response: ApiSuccess<P2PRecipientLookup>) =>
        response.data,
    }),

    p2pTransfer: builder.mutation<P2PTransferResult, P2PTransferRequest>({
      query: (body) => ({ url: bff("/p2p/transfer"), method: "POST", body }),
      transformResponse: (response: ApiSuccess<P2PTransferResult>) =>
        response.data,
      invalidatesTags: [
        ...MONEY_MOVEMENT_TAGS,
        listTag("P2PTransfer"),
        listTag("Notification"),
        "NotificationCount",
      ],
    }),

    p2pTransfers: builder.query<Paginated<P2PTransfer>, P2PTransfersParams | void>({
      query: (params) => ({
        url: bff("/p2p/transfers"),
        params: buildQuery({ ...(params ?? {}) }),
      }),
      transformResponse: (response: unknown) =>
        fromMetaEnvelope<P2PTransfer>(response),
      providesTags: (result) => listTags("P2PTransfer", result?.items),
    }),
  }),
  overrideExisting: false,
});

export const {
  useP2pLookupQuery,
  useLazyP2pLookupQuery,
  useP2pTransferMutation,
  useP2pTransfersQuery,
} = p2pApi;
