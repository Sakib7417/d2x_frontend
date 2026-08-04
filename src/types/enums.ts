/**
 * Mirrors `prisma/schema.prisma` in the backend, verbatim.
 *
 * Authored as `as const` objects rather than TS `enum` for three reasons:
 *   1. TS enums emit runtime code and are not erasable — they break
 *      `verbatimModuleSyntax` and `isolatedModules` boundaries in RSC.
 *   2. `as const` gives us both the value map (for iteration / Select options)
 *      and the union type, from one declaration.
 *   3. The union type is a string literal union, so it structurally matches the
 *      raw JSON coming off the wire with zero casting.
 *
 * KEEP IN SYNC: if the backend adds an enum member, add it here. The
 * `ALL_*` arrays below drive filter dropdowns, so a missing member silently
 * disappears from the UI rather than throwing — hence the exhaustiveness
 * helpers in `@/lib/utils/enum.ts`.
 */

export const UserRole = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const WalletType = {
  PRINCIPAL: "PRINCIPAL",
  DEPOSIT_BONUS: "DEPOSIT_BONUS",
  REFERRAL: "REFERRAL",
  TRADING_PROFIT: "TRADING_PROFIT",
  RANK_BONUS: "RANK_BONUS",
  POOL_BONUS: "POOL_BONUS",
  ADMIN_COMMISSION: "ADMIN_COMMISSION",
} as const;
export type WalletType = (typeof WalletType)[keyof typeof WalletType];

export const LedgerType = {
  DEPOSIT: "DEPOSIT",
  DEPOSIT_BONUS: "DEPOSIT_BONUS",
  REFERRAL_BONUS: "REFERRAL_BONUS",
  TRADE_ENTRY: "TRADE_ENTRY",
  TRADE_PROFIT: "TRADE_PROFIT",
  ADMIN_COMMISSION: "ADMIN_COMMISSION",
  COMPOUND_TRANSFER: "COMPOUND_TRANSFER",
  WITHDRAWAL: "WITHDRAWAL",
  WITHDRAWAL_FEE: "WITHDRAWAL_FEE",
  PENALTY: "PENALTY",
  RANK_BONUS: "RANK_BONUS",
  POOL_BONUS: "POOL_BONUS",
  REFUND: "REFUND",
  ADJUSTMENT: "ADJUSTMENT",
  TRADE_EXIT: "TRADE_EXIT",
  AUTO_TRADE_ENTRY: "AUTO_TRADE_ENTRY",
  TRADE_CANCEL: "TRADE_CANCEL",
} as const;
export type LedgerType = (typeof LedgerType)[keyof typeof LedgerType];

export const ReferenceType = {
  DEPOSIT: "DEPOSIT",
  WITHDRAWAL: "WITHDRAWAL",
  TRADE: "TRADE",
  REFERRAL: "REFERRAL",
  RANK: "RANK",
  CYCLE: "CYCLE",
  WALLET: "WALLET",
  AUTO_TRADE: "AUTO_TRADE",
  SYSTEM: "SYSTEM",
} as const;
export type ReferenceType = (typeof ReferenceType)[keyof typeof ReferenceType];

export const DepositStatus = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  FAILED: "FAILED",
} as const;
export type DepositStatus = (typeof DepositStatus)[keyof typeof DepositStatus];

export const WithdrawalStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
  FAILED: "FAILED",
} as const;
export type WithdrawalStatus =
  (typeof WithdrawalStatus)[keyof typeof WithdrawalStatus];

/**
 * NOTE: this is a strict subset of WalletType — ADMIN_COMMISSION is absent,
 * because users cannot withdraw from the platform's commission wallet.
 * POOL_BONUS is also absent — it requires admin approval via pool bonus request.
 * Do not substitute WalletType here; the backend will 400.
 */
export const WithdrawalWalletType = {
  PRINCIPAL: "PRINCIPAL",
  TRADING_PROFIT: "TRADING_PROFIT",
  REFERRAL: "REFERRAL",
  DEPOSIT_BONUS: "DEPOSIT_BONUS",
  RANK_BONUS: "RANK_BONUS",
} as const;
export type WithdrawalWalletType =
  (typeof WithdrawalWalletType)[keyof typeof WithdrawalWalletType];

export const TradeStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;
export type TradeStatus = (typeof TradeStatus)[keyof typeof TradeStatus];

export const TradeType = {
  MORNING: "MORNING",
  EVENING: "EVENING",
} as const;
export type TradeType = (typeof TradeType)[keyof typeof TradeType];

export const RankLevel = {
  LV1: "LV1",
  LV2: "LV2",
  LV3: "LV3",
  LV4: "LV4",
  LV5: "LV5",
  LV6: "LV6",
  LV7: "LV7",
} as const;
export type RankLevel = (typeof RankLevel)[keyof typeof RankLevel];

export const CycleBonusStatus = {
  PENDING: "PENDING",
  CREDITED: "CREDITED",
  FAILED: "FAILED",
} as const;
export type CycleBonusStatus =
  (typeof CycleBonusStatus)[keyof typeof CycleBonusStatus];

export const PoolBonusRequestStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PROCESSED: "PROCESSED",
  FAILED: "FAILED",
} as const;
export type PoolBonusRequestStatus =
  (typeof PoolBonusRequestStatus)[keyof typeof PoolBonusRequestStatus];

export const PoolBonusRequestType = {
  TRANSFER_TO_PRINCIPAL: "TRANSFER_TO_PRINCIPAL",
  WITHDRAW: "WITHDRAW",
} as const;
export type PoolBonusRequestType =
  (typeof PoolBonusRequestType)[keyof typeof PoolBonusRequestType];

export const TicketStatus = {
  OPEN: "OPEN",
  REPLIED: "REPLIED",
  CLOSED: "CLOSED",
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TicketPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;
export type TicketPriority =
  (typeof TicketPriority)[keyof typeof TicketPriority];

export const NotificationType = {
  DEPOSIT: "DEPOSIT",
  WITHDRAWAL: "WITHDRAWAL",
  TRADE: "TRADE",
  REFERRAL: "REFERRAL",
  RANK: "RANK",
  CYCLE: "CYCLE",
  SYSTEM: "SYSTEM",
  SECURITY: "SECURITY",
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export const BlockchainTransactionType = {
  DEPOSIT: "DEPOSIT",
  WITHDRAWAL: "WITHDRAWAL",
} as const;
export type BlockchainTransactionType =
  (typeof BlockchainTransactionType)[keyof typeof BlockchainTransactionType];

export const BlockchainTransactionStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  FAILED: "FAILED",
} as const;
export type BlockchainTransactionStatus =
  (typeof BlockchainTransactionStatus)[keyof typeof BlockchainTransactionStatus];

/**
 * Admin user moderation actions. Source: `admin.validator.ts` userActionSchema.
 * Note the asymmetry — BAN/UNBAN and SUSPEND/ACTIVATE are not a clean pair set;
 * both UNBAN and ACTIVATE map to UserStatus.ACTIVE on the backend.
 */
export const AdminUserAction = {
  BAN: "BAN",
  SUSPEND: "SUSPEND",
  UNBAN: "UNBAN",
  ACTIVATE: "ACTIVATE",
} as const;
export type AdminUserAction =
  (typeof AdminUserAction)[keyof typeof AdminUserAction];

/* -------------------------------------------------------------------------- */
/* Iteration helpers — drive <Select> options and filter chips.               */
/* Ordered for display, not alphabetically.                                    */
/* -------------------------------------------------------------------------- */

export const ALL_WALLET_TYPES = [
  WalletType.PRINCIPAL,
  WalletType.TRADING_PROFIT,
  WalletType.REFERRAL,
  WalletType.DEPOSIT_BONUS,
  WalletType.RANK_BONUS,
  WalletType.POOL_BONUS,
  WalletType.ADMIN_COMMISSION,
] as const;

/** Wallets a normal user actually owns — excludes the platform commission pot. */
export const USER_WALLET_TYPES = [
  WalletType.PRINCIPAL,
  WalletType.TRADING_PROFIT,
  WalletType.REFERRAL,
  WalletType.DEPOSIT_BONUS,
  WalletType.RANK_BONUS,
  WalletType.POOL_BONUS,
] as const;

export const ALL_WITHDRAWAL_WALLET_TYPES = Object.values(WithdrawalWalletType);
export const ALL_DEPOSIT_STATUSES = Object.values(DepositStatus);
export const ALL_WITHDRAWAL_STATUSES = Object.values(WithdrawalStatus);
export const ALL_TRADE_STATUSES = Object.values(TradeStatus);
export const ALL_TRADE_TYPES = Object.values(TradeType);
export const ALL_LEDGER_TYPES = Object.values(LedgerType);
export const ALL_USER_STATUSES = Object.values(UserStatus);
export const ALL_USER_ROLES = Object.values(UserRole);
export const ALL_RANK_LEVELS = Object.values(RankLevel);
export const ALL_NOTIFICATION_TYPES = Object.values(NotificationType);
export const ALL_CYCLE_BONUS_STATUSES = Object.values(CycleBonusStatus);
