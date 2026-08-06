/**
 * Domain models exactly as they arrive over the wire.
 *
 * Derived by reading the backend service/repository source, not the OpenAPI
 * spec (swagger-jsdoc there documents requests but almost no response bodies).
 *
 * Conventions:
 *   - `Decimal(20,8)` columns  -> DecimalString
 *   - `DateTime` columns       -> ISODateString
 *   - Prisma `?` (nullable)    -> `| null` (the key is always present)
 *   - Prisma relation includes -> optional key (`?`), because whether it is
 *     present depends on the specific endpoint's `include`. Marking these
 *     optional rather than required is deliberate: the same `Deposit` type is
 *     returned by six endpoints with four different include sets.
 */

import type {
  DecimalString,
  EvmAddress,
  ISODateString,
  TxHash,
  UUID,
} from "./api";
import type {
  BlockchainTransactionStatus,
  BlockchainTransactionType,
  CycleBonusStatus,
  DepositStatus,
  GovIdType,
  LedgerType,
  NotificationType,
  RankLevel,
  ReferenceType,
  TradeStatus,
  TradeType,
  UserRole,
  UserStatus,
  WalletType,
  WithdrawalStatus,
  WithdrawalWalletType,
  PoolBonusRequestStatus,
  PoolBonusRequestType,
} from "./enums";

/* -------------------------------------------------------------------------- */
/* User                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The trimmed user object embedded in the auth response. Note it is a strict
 * subset of `User` — no phone/country/timestamps. Do not widen it.
 */
export interface AuthUser {
  id: UUID;
  email: string;
  name: string | null;
  role: UserRole;
  referralCode: string;
  rank: RankLevel;
  autoTradeStatus: boolean;
  status: UserStatus;
  govIdType?: GovIdType | null;
  govIdFrontUrl?: string | null;
  govIdBackUrl?: string | null;
}

/** Full user, as returned by GET /users/profile (password stripped server-side). */
export interface User {
  id: UUID;
  email: string;
  name: string | null;
  phone: string | null;
  country: string | null;
  role: UserRole;
  referralCode: string;
  sponsorId: UUID | null;
  walletAddress: EvmAddress | null;
  rank: RankLevel;
  autoTradeStatus: boolean;
  status: UserStatus;
  isContentCreator?: boolean;
  /** Government ID type chosen at signup (AADHAAR/PAN/PASSPORT/DRIVING_LICENSE/VOTER_ID). */
  govIdType?: GovIdType | null;
  /** Relative path to the front-side photo, e.g. /uploads/kyc/kyc-...jpg. */
  govIdFrontUrl?: string | null;
  /** Relative path to the back-side photo. */
  govIdBackUrl?: string | null;
  lastLogin: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  deletedAt: ISODateString | null;
  sponsorTradeBonusExpiry: ISODateString | null;
  sponsorTradeBonusRate: number | null;

  sponsor?: User | null;
  referrals?: User[];
  wallets?: Wallet[];
}

/** Narrowed user shape embedded in admin list rows (`select` of 3 fields). */
export interface UserRef {
  id: UUID;
  email: string;
  name: string | null;
}

/* -------------------------------------------------------------------------- */
/* Wallet & Ledger                                                             */
/* -------------------------------------------------------------------------- */

export interface Wallet {
  id: UUID;
  userId: UUID;
  type: WalletType;
  balance: DecimalString;
  totalCredit: DecimalString;
  totalDebit: DecimalString;
  createdAt: ISODateString;
  updatedAt: ISODateString;

  user?: User | UserRef;
}

/** Per-wallet figures inside GET /wallets/summary. */
export interface WalletSummaryEntry {
  balance: DecimalString;
  totalCredit: DecimalString;
  totalDebit: DecimalString;
}

/**
 * GET /wallets/summary returns a heterogeneous object: lowercased wallet-type
 * keys mapping to WalletSummaryEntry, PLUS a sibling `totalBalance` string at
 * the same level. That union is hostile to consume directly, so the endpoint
 * normalises it into this shape in `transformResponse`.
 */
export interface WalletSummary {
  wallets: Partial<Record<WalletType, WalletSummaryEntry>>;
  totalBalance: DecimalString;
}

export interface Ledger {
  id: UUID;
  userId: UUID;
  walletId: UUID;
  type: LedgerType;
  referenceId: UUID | null;
  referenceType: ReferenceType | null;
  beforeBalance: DecimalString;
  afterBalance: DecimalString;
  credit: DecimalString;
  debit: DecimalString;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: ISODateString;

  wallet?: Wallet;
}

/* -------------------------------------------------------------------------- */
/* Deposit                                                                     */
/* -------------------------------------------------------------------------- */

export interface Deposit {
  id: UUID;
  userId: UUID;
  amount: DecimalString;
  transactionHash: TxHash;
  senderAddress: EvmAddress;
  receiverAddress: EvmAddress;
  tokenContract: EvmAddress;
  network: string;
  /**
   * Prisma `BigInt?`. The backend returns the Prisma object raw, so any deposit
   * with a non-null blockNumber currently makes `res.json()` throw and the
   * request 500s. Typed as `string | number | null` because once that is fixed
   * it will most likely be stringified.
   * @see docs note in README — flagged to backend.
   */
  blockNumber: string | number | null;
  confirmations: number;
  requiredConfirmations: number;
  status: DepositStatus;
  bonusAmount: DecimalString;
  blockchainData: Record<string, unknown> | null;
  verifiedAt: ISODateString | null;
  approvedAt: ISODateString | null;
  rejectionReason: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;

  user?: User | UserRef;
  referralBonuses?: ReferralBonus[];
}

export interface DepositStatistics {
  totalDeposits: number;
  /** Server-side `Number(Decimal)` — already a JS number, precision-lossy. */
  totalAmount: number;
  pendingDeposits: number;
  approvedDeposits: number;
  rejectedDeposits: number;
}

/* -------------------------------------------------------------------------- */
/* Withdrawal                                                                  */
/* -------------------------------------------------------------------------- */

export interface Withdrawal {
  id: UUID;
  userId: UUID;
  walletType: WithdrawalWalletType;
  amount: DecimalString;
  fee: DecimalString;
  /** Early-exit penalty; non-zero when withdrawing before WITHDRAWAL_PENALTY_DAYS. */
  penalty: DecimalString;
  netAmount: DecimalString;
  destinationAddress: EvmAddress;
  transactionHash: TxHash | null;
  network: string;
  gasFee: DecimalString | null;
  status: WithdrawalStatus;
  adminId: UUID | null;
  processedAt: ISODateString | null;
  rejectionReason: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;

  user?: User | UserRef;
  admin?: UserRef | null;
}

export interface WithdrawalStatistics {
  totalWithdrawals: number;
  totalAmount: number;
  totalFees: number;
  pendingWithdrawals: number;
  processedWithdrawals: number;
  rejectedWithdrawals: number;
}

/* -------------------------------------------------------------------------- */
/* Trading                                                                     */
/* -------------------------------------------------------------------------- */

export interface Trade {
  id: UUID;
  userId: UUID;
  tradeAmount: DecimalString;
  tradeType: TradeType;
  status: TradeStatus;
  entryTime: ISODateString;
  settlementTime: ISODateString;
  exitTime: ISODateString | null;
  profit: DecimalString | null;
  commission: DecimalString | null;
  profitPercentage: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;

  user?: User | UserRef;
}

export interface TradeStatistics {
  totalTrades: number;
  totalVolume: number;
  totalUserProfit: number;
  totalAdminCommission: number;
  completedTrades: number;
  pendingTrades: number;
}

export interface TradeSessionResult {
  totalExecuted: number;
  trades: Trade[];
}

export interface TradeSettlementResult {
  settledCount: number;
  trades: Trade[];
}

/* -------------------------------------------------------------------------- */
/* Referral                                                                    */
/* -------------------------------------------------------------------------- */

export interface Referral {
  id: UUID;
  userId: UUID;
  sponsorId: UUID | null;
  level: number;
  directReferralCount: number;
  teamSize: number;
  totalBonusEarned: DecimalString;
  directDepositAmount: DecimalString;
  teamDepositAmount: DecimalString;
  createdAt: ISODateString;
  updatedAt: ISODateString;

  user?: User;
  sponsor?: User | null;
}

export interface ReferralBonus {
  id: UUID;
  referralId: UUID;
  userId: UUID;
  depositId: UUID;
  depositAmount: DecimalString;
  bonusPercentage: number;
  bonusAmount: DecimalString;
  level: number;
  /** Reuses DepositStatus on the backend — the bonus tracks its deposit. */
  status: DepositStatus;
  createdAt: ISODateString;

  user?: User;
  referral?: Referral;
  deposit?: Deposit;
}

/** Recursive node from GET /referrals/tree. Depth is bounded by `maxLevel`. */
export interface ReferralTreeNode {
  userId: UUID;
  level: number;
  directReferrals: number;
  email?: string | null;
  name?: string | null;
  children: ReferralTreeNode[];
}

export interface ReferralStatistics {
  totalReferrals: number;
  directReferrals: number;
  totalBonuses: number;
  totalBonusAmount: number;
}

export interface ReferralLink {
  /** Built server-side from FRONTEND_URL as `${FRONTEND_URL}/ref/{code}`. */
  referralLink: string;
}

export interface ReferralCodeValidation {
  valid: boolean;
  sponsorId: UUID;
  referralCode: string;
}

/* -------------------------------------------------------------------------- */
/* Rank & Cycle bonus                                                          */
/* -------------------------------------------------------------------------- */

export interface Rank {
  id: UUID;
  userId: UUID;
  level: RankLevel;
  directReferrals: number;
  teamSize: number;
  directLv1Count: number;
  achievedAt: ISODateString;
  totalRankBonusEarned: DecimalString;
  totalCycleBonusEarned: DecimalString;
  createdAt: ISODateString;
  updatedAt: ISODateString;

  user?: User | UserRef;
}

export interface RankHistoryEntry {
  id: UUID;
  userId: UUID;
  previousLevel: RankLevel | null;
  newLevel: RankLevel;
  changeReason: string | null;
  changedAt: ISODateString;
}

export interface CurrentRank {
  currentRank: RankLevel;
  rankDetails: Rank | null;
  history: RankHistoryEntry[];
}

export interface CycleBonus {
  id: UUID;
  userId: UUID;
  rankId: UUID;
  rankLevel: RankLevel;
  cycleNumber: number;
  cycleStartDate: ISODateString;
  cycleEndDate: ISODateString;
  rankBonusAmount: DecimalString;
  cycleBonusAmount: DecimalString;
  totalAmount: DecimalString;
  status: CycleBonusStatus;
  eligibilityData: Record<string, unknown> | null;
  creditedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;

  user?: User | UserRef;
  rank?: Rank;
}

/* -------------------------------------------------------------------------- */
/* Notifications & Settings                                                    */
/* -------------------------------------------------------------------------- */

export interface AppNotification {
  id: UUID;
  userId: UUID;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  readAt: ISODateString | null;
  createdAt: ISODateString;

  user?: User | UserRef;
}

export interface AuditLog {
  id: UUID;
  adminId: UUID | null;
  action: string;
  entity: string;
  entityId: UUID | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: ISODateString;

  admin?: User | UserRef | null;
}

export interface Setting {
  id: UUID;
  key: string;
  value: string;
  description: string | null;
  category: string | null;
  updaterId: UUID | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;

  updater?: UserRef | null;
}

/* -------------------------------------------------------------------------- */
/* Blockchain                                                                  */
/* -------------------------------------------------------------------------- */

export interface BlockchainTransaction {
  id: UUID;
  transactionHash: TxHash;
  type: BlockchainTransactionType;
  fromAddress: EvmAddress;
  toAddress: EvmAddress;
  amount: number;
  tokenContract: EvmAddress;
  network: string;
  /** BigInt on the server; stringified by the blockchain service's replacer. */
  blockNumber: string;
  confirmations: number;
  status: BlockchainTransactionStatus;
  rawTransaction: Record<string, unknown> | null;
  receipt: Record<string, unknown> | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/* -------------------------------------------------------------------------- */
/* Dashboards                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * GET /users/dashboard.
 *
 * WARNING — `totalDeposits` and `totalWithdrawals` are hardcoded `0` in
 * `user.service.ts`; they are placeholders, not real figures. They are typed
 * here for completeness but must NOT be rendered. Use
 * GET /deposits/statistics and GET /withdrawals/statistics instead.
 */
export interface UserDashboard {
  profile: {
    id: UUID;
    email: string;
    name: string | null;
    phone: string | null;
    country: string | null;
    role: UserRole;
    referralCode: string;
    walletAddress: EvmAddress | null;
    rank: RankLevel;
    autoTradeStatus: boolean;
    status: UserStatus;
    isContentCreator: boolean;
    sponsorTradeBonusExpiry: ISODateString | null;
    sponsorTradeBonusRate: number | null;
    lastLogin: ISODateString | null;
    createdAt: ISODateString;
  };
  /** Keyed by WalletType, value is the balance. */
  wallets: Partial<Record<WalletType, DecimalString>>;
  directReferrals: number;
  teamSize: number;
  /** @deprecated Always 0 on the backend. Do not render. */
  totalDeposits: number;
  /** @deprecated Always 0 on the backend. Do not render. */
  totalWithdrawals: number;
  totalReferrals: number;
}

export interface AdminDashboard {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  pendingDeposits: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  totalTrades: number;
  totalReferralBonuses: number;
  totalRankBonuses: number;
  totalCycleBonuses: number;
  totalAdminCommission: number;
  totalVolume: DecimalString;
}

/* -------------------------------------------------------------------------- */
/* Trade schedule                                                              */
/* -------------------------------------------------------------------------- */

/** A recent completed trade for the public live activity feed. */
export interface RecentTrade {
  id: UUID;
  tradeAmount: DecimalString;
  profit: DecimalString;
  profitPercentage: number;
  tradeType: TradeType;
  entryTime: ISODateString;
  exitTime: ISODateString;
}

/** One daily trade window as returned by GET /admin/trade-schedule. */
export interface TradeTime {
  hour: number;
  minute: number;
  time: string;
}

/** Daily trade window as returned by GET /admin/trade-schedule. */
export interface TradeSchedule {
  morning: TradeTime;
}

/** Body for PUT /admin/trade-schedule. */
export interface UpdateTradeScheduleRequest {
  morning: string;
}

/** Aggregate metrics returned by GET /admin/analytics. */
export interface AdminAnalytics extends AdminDashboard {
  totalWalletBalance: DecimalString;
  completedTrades: number;
  totalTradeProfit: DecimalString;
  totalTradeCommission: DecimalString;
  statusDistributions: {
    users: Partial<Record<UserStatus, number>>;
    deposits: Partial<Record<DepositStatus, number>>;
    withdrawals: Partial<Record<WithdrawalStatus, number>>;
    trades: Partial<Record<TradeStatus, number>>;
    referralBonuses: Partial<Record<DepositStatus, number>>;
    cycleBonuses: Partial<Record<CycleBonusStatus, number>>;
    blockchain: Partial<Record<BlockchainTransactionStatus, number>>;
  };
}

/* -------------------------------------------------------------------------- */
/* Pool Bonus Request                                                          */
/* -------------------------------------------------------------------------- */

/** A pool bonus request created by a user, pending admin approval. */
export interface PoolBonusRequest {
  id: UUID;
  userId: UUID;
  requestType: PoolBonusRequestType;
  requestedAmount: DecimalString;
  approvedAmount: DecimalString | null;
  status: PoolBonusRequestStatus;
  destinationAddress: string | null;
  network: string | null;
  rejectionReason: string | null;
  adminNote: string | null;
  approvedAt: ISODateString | null;
  processedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** Body for POST /pool-bonus/request. */
export interface CreatePoolBonusRequestPayload {
  requestType: PoolBonusRequestType;
  requestedAmount: number;
  destinationAddress?: string;
  network?: string;
}

/** Body for PUT /admin/pool-bonus-requests/:id/update. */
export interface UpdatePoolBonusRequestPayload {
  approvedAmount: number;
  adminNote?: string;
}

/** Body for PUT /admin/pool-bonus-requests/:id/reject. */
export interface RejectPoolBonusRequestPayload {
  rejectionReason: string;
}

/* -------------------------------------------------------------------------- */
/* Post & News (admin-managed content)                                         */
/* -------------------------------------------------------------------------- */

/** A post displayed in the user dashboard auto-slider. */
export interface Post {
  id: UUID;
  title: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** A news item displayed in the user dashboard ticker. */
export interface NewsItem {
  id: UUID;
  title: string;
  message: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** Body for POST /content/admin/news. */
export interface CreateNewsPayload {
  title: string;
  message: string;
}

/** Body for PUT /content/admin/news/:id. */
export interface UpdateNewsPayload {
  title?: string;
  message?: string;
  isActive?: boolean;
  sortOrder?: number;
}

/* -------------------------------------------------------------------------- */
/* Support Tickets                                                             */
/* -------------------------------------------------------------------------- */

/** A support ticket message. */
export interface TicketMessage {
  id: UUID;
  ticketId: UUID;
  senderId: UUID;
  isAdmin: boolean;
  message: string;
  /** JSON array of relative image paths, e.g. ["/uploads/tickets/ticket-123.jpg"]. Null when no attachments. */
  attachments?: string[] | null;
  createdAt: ISODateString;
  sender?: UserRef;
}

/** A support ticket. */
export interface Ticket {
  id: UUID;
  userId: UUID;
  subject: string;
  status: "OPEN" | "REPLIED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  adminId: UUID | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  messages?: TicketMessage[];
  user?: UserRef;
}

/**
 * Body for POST /tickets.
 *
 * Sent as `multipart/form-data` when attachment images are included, otherwise
 * as JSON. The ticket-api mutation builds FormData when files are present.
 */
export interface CreateTicketPayload {
  subject: string;
  message: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  attachments?: File[];
}

/** Body for POST /tickets/:id/reply. Same multipart/JSON dual-mode as create. */
export interface ReplyTicketPayload {
  message: string;
  attachments?: File[];
}
