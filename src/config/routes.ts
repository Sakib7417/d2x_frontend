/**
 * Centralised route table.
 *
 * Every internal link in the app resolves through here. Two reasons this is
 * worth the indirection:
 *   - `middleware.ts` and the nav config must agree on which paths are
 *     protected; duplicating literals is how a page ends up publicly reachable
 *     because someone renamed a folder.
 *   - Renaming a route becomes a single edit with full type-checking.
 *
 * Safe to import from both client and server — no secrets, no server-only deps.
 */

export const ROUTES = {
  // -- public ---------------------------------------------------------------
  home: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  /** Referral landing: /ref/<8-char code>, redirects into signup. */
  referralLanding: (code: string) => `/ref/${code}`,

  // -- authenticated user ---------------------------------------------------
  dashboard: "/dashboard",
  wallet: "/wallet",
  deposit: "/wallet/deposit",
  withdraw: "/wallet/withdraw",
  transactions: "/transactions",
  trading: "/trading",
  tradingHistory: "/trading/history",
  referral: "/referral",
  referralTree: "/referral/tree",
  referralEarnings: "/referral/earnings",
  ranks: "/ranks",
  cycleBonus: "/rewards/cycle-bonus",
  poolBonus: "/rewards/pool-bonus",
  depositBonus: "/rewards/deposit-bonus",
  calculator: "/calculator",
  notifications: "/notifications",
  profile: "/profile",
  settings: "/settings",
  support: "/support",
  tickets: "/tickets",
  myPosts: "/my-posts",
  myNews: "/my-news",

  // -- admin ----------------------------------------------------------------
  admin: {
    dashboard: "/admin",
    analytics: "/admin/analytics",
    users: "/admin/users",
    user: (id: string) => `/admin/users/${id}`,
    deposits: "/admin/deposits",
    withdrawals: "/admin/withdrawals",
    trading: "/admin/trading",
    wallets: "/admin/wallets",
    referralReports: "/admin/reports/referrals",
    rankReports: "/admin/reports/ranks",
    cycleBonusReports: "/admin/reports/cycle-bonus",
    poolBonusRequests: "/admin/pool-bonus-requests",
    posts: "/admin/posts",
    news: "/admin/news",
    tickets: "/admin/tickets",
    blockchain: "/admin/blockchain",
    notifications: "/admin/notifications",
    auditLogs: "/admin/audit-logs",
    settings: "/admin/settings",
  },
} as const;

/**
 * Path prefixes that require an authenticated session.
 *
 * Prefix matching (not exact) so nested routes inherit protection
 * automatically — adding `/wallet/deposit/confirm` later needs no change here.
 */
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/wallet",
  "/transactions",
  "/trading",
  "/referral",
  "/ranks",
  "/rewards",
  "/calculator",
  "/notifications",
  "/profile",
  "/settings",
  "/admin",
] as const;

/** Subset of the above that additionally requires role === ADMIN. */
export const ADMIN_PREFIXES = ["/admin"] as const;

/**
 * Routes an already-authenticated user should be bounced away from.
 * Landing on /login while signed in is confusing, not useful.
 */
export const AUTH_ONLY_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAdminPath(pathname: string): boolean {
  return ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAuthOnlyPath(pathname: string): boolean {
  return AUTH_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Validate a `?next=` value before redirecting to it.
 *
 * Only same-origin absolute paths are allowed. Without this check an attacker
 * can send `/login?next=https://evil.example/harvest`, and the post-login
 * redirect becomes an open-redirect phishing vector — particularly effective
 * on a finance site where users expect to land somewhere unfamiliar after
 * signing in. Protocol-relative `//evil.com` is rejected too.
 */
export function safeRedirectTarget(
  next: string | null | undefined,
  fallback: string,
): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  if (next.includes("\\")) return fallback;
  return next;
}
