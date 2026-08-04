/**
 * RTK Query cache tags.
 *
 * Centralised because invalidation in this domain is heavily cross-cutting:
 * approving a single deposit moves money, so it must invalidate the deposit
 * list, the wallet balances, the ledger, the referral bonuses it triggered,
 * the sponsor's rank progress, and the admin dashboard totals. Scattering
 * those strings across feature files guarantees someone eventually forgets
 * one and ships a stale balance.
 *
 * Convention:
 *   { type: 'Wallet', id: 'LIST' }   the collection
 *   { type: 'Wallet', id: <uuid> }   a single entity
 */

export const API_TAGS = [
  "Session",
  "Profile",
  "UserDashboard",
  "User",
  "Wallet",
  "WalletSummary",
  "Ledger",
  "Deposit",
  "DepositStats",
  "Withdrawal",
  "WithdrawalStats",
  "Trade",
  "TradeStats",
  "Referral",
  "ReferralBonus",
  "ReferralTree",
  "ReferralStats",
  "Rank",
  "CycleBonus",
  "PoolBonusRequest",
  "Post",
  "News",
  "Ticket",
  "AdminDashboard",
  "AdminAnalytics",
  "AuditLog",
  "Notification",
  "NotificationCount",
  "Setting",
  "Blockchain",
] as const;

export type ApiTag = (typeof API_TAGS)[number];

export const LIST_ID = "LIST" as const;

/** `{ type, id: 'LIST' }` — the collection-level tag. */
export const listTag = (type: ApiTag) => ({ type, id: LIST_ID }) as const;

/** Tag every row plus the collection, so both detail and list views refresh. */
export function listTags<T extends { id: string }>(
  type: ApiTag,
  items: readonly T[] | undefined,
) {
  return [
    listTag(type),
    ...(items ?? []).map((item) => ({ type, id: item.id }) as const),
  ];
}

/**
 * Everything a balance change touches.
 *
 * Used by: deposit approve/reject, withdrawal create/process/reject, wallet
 * transfer, trade settlement, cycle bonus processing.
 *
 * Deliberately broad. In a financial UI a stale figure is a correctness bug,
 * not a performance nicety — over-invalidating costs a refetch, while
 * under-invalidating shows the user money that isn't there.
 */
export const MONEY_MOVEMENT_TAGS = [
  listTag("Wallet"),
  "WalletSummary",
  listTag("Ledger"),
  "UserDashboard",
  "AdminDashboard",
] as const;
