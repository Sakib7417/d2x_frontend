import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Bell,
  Blocks,
  ChartCandlestick,
  ChartLine,
  ClipboardList,
  Coins,
  Gauge,
  Gift,
  History,
  LayoutDashboard,
  Medal,
  Network,
  ReceiptText,
  Settings,
  ShieldCheck,
  Trophy,
  UserCog,
  Users,
  Wallet,
  ImageIcon,
  Megaphone,
  MessageSquare,
  Ticket as TicketIcon,
} from "lucide-react";

import { ROUTES } from "./routes";

/**
 * Navigation model.
 *
 * Single source of truth for the sidebar, the mobile nav and the ⌘K command
 * palette. Deriving all three from one structure is what keeps them from
 * drifting apart — the palette missing a page that exists in the sidebar is
 * the classic symptom of hand-maintaining both.
 *
 * `keywords` exist purely for palette search: users look for "send money" or
 * "cash out", not "Withdraw".
 */

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Extra search terms for the command palette. */
  keywords?: string[];
  /**
   * Exact-match only. Needed for index routes: `/wallet` would otherwise stay
   * highlighted while the user is on `/wallet/deposit`.
   */
  exact?: boolean;
  /** Renders a live count badge, resolved by the shell. */
  badge?: "notifications";
}

export interface NavSection {
  /** Omit for the first, unlabelled group. */
  label?: string;
  items: NavItem[];
}

export const USER_NAV: NavSection[] = [
  {
    items: [
      {
        label: "Dashboard",
        href: ROUTES.dashboard,
        icon: LayoutDashboard,
        exact: true,
        keywords: ["home", "overview", "summary"],
      },
    ],
  },
  {
    label: "Assets",
    items: [
      {
        label: "Wallet",
        href: ROUTES.wallet,
        icon: Wallet,
        exact: true,
        keywords: ["balance", "funds", "portfolio"],
      },
      {
        label: "Deposit",
        href: ROUTES.deposit,
        icon: ArrowDownToLine,
        keywords: ["fund", "add money", "top up", "usdt in"],
      },
      {
        label: "Withdraw",
        href: ROUTES.withdraw,
        icon: ArrowUpFromLine,
        keywords: ["cash out", "send", "payout", "usdt out"],
      },
      {
        label: "Transactions",
        href: ROUTES.transactions,
        icon: ReceiptText,
        keywords: ["ledger", "history", "statement", "activity"],
      },
    ],
  },
  {
    label: "Trading",
    items: [
      {
        label: "Auto Trading",
        href: ROUTES.trading,
        icon: ChartCandlestick,
        exact: true,
        keywords: ["bot", "sessions", "morning", "evening"],
      },
      {
        label: "Trade History",
        href: ROUTES.tradingHistory,
        icon: History,
        keywords: ["past trades", "settled", "profit"],
      },
    ],
  },
  {
    label: "Network",
    items: [
      {
        label: "Referrals",
        href: ROUTES.referral,
        icon: Users,
        exact: true,
        keywords: ["invite", "affiliate", "downline", "sponsor"],
      },
      {
        label: "Referral Tree",
        href: ROUTES.referralTree,
        icon: Network,
        keywords: ["genealogy", "team", "structure", "levels"],
      },
      {
        label: "Earnings",
        href: ROUTES.referralEarnings,
        icon: Coins,
        keywords: ["commission", "bonus", "referral income"],
      },
    ],
  },
  {
    label: "Rewards",
    items: [
      {
        label: "Ranks",
        href: ROUTES.ranks,
        icon: Trophy,
        keywords: ["level", "lv1", "lv7", "tier", "promotion"],
      },
      {
        label: "Cycle Bonus",
        href: ROUTES.cycleBonus,
        icon: Medal,
        keywords: ["10 day", "cycle", "reward"],
      },
      {
        label: "Pool Bonus",
        href: ROUTES.poolBonus,
        icon: Coins,
        keywords: ["pool", "bonus", "admin approval", "request"],
      },
      {
        label: "Deposit Bonus",
        href: ROUTES.depositBonus,
        icon: Gift,
        keywords: ["5%", "bonus", "incentive"],
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "Notifications",
        href: ROUTES.notifications,
        icon: Bell,
        badge: "notifications",
        keywords: ["alerts", "messages", "inbox"],
      },
      {
        label: "Profile",
        href: ROUTES.profile,
        icon: UserCog,
        keywords: ["account", "personal", "kyc", "wallet address"],
      },
      {
        label: "Support",
        href: ROUTES.tickets,
        icon: MessageSquare,
        keywords: ["help", "ticket", "contact", "ask"],
      },
      {
        label: "Settings",
        href: ROUTES.settings,
        icon: Settings,
        keywords: ["preferences", "security", "password", "theme"],
      },
    ],
  },
];

export const ADMIN_NAV: NavSection[] = [
  {
    items: [
      {
        label: "Overview",
        href: ROUTES.admin.dashboard,
        icon: Gauge,
        exact: true,
        keywords: ["admin", "home", "kpi"],
      },
      {
        label: "Analytics",
        href: ROUTES.admin.analytics,
        icon: ChartLine,
        keywords: ["charts", "growth", "reports", "metrics"],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Users",
        href: ROUTES.admin.users,
        icon: Users,
        keywords: ["members", "accounts", "ban", "suspend"],
      },
      {
        label: "Deposits",
        href: ROUTES.admin.deposits,
        icon: ArrowDownToLine,
        keywords: ["approve", "reject", "pending", "verify"],
      },
      {
        label: "Withdrawals",
        href: ROUTES.admin.withdrawals,
        icon: ArrowUpFromLine,
        keywords: ["process", "payout", "reject", "pending"],
      },
      {
        label: "Trading",
        href: ROUTES.admin.trading,
        icon: ChartCandlestick,
        keywords: ["sessions", "execute", "settle"],
      },
      {
        label: "Wallets",
        href: ROUTES.admin.wallets,
        icon: ArrowLeftRight,
        keywords: ["balances", "adjust", "commission"],
      },
    ],
  },
  {
    label: "Reports",
    items: [
      {
        label: "Referrals",
        href: ROUTES.admin.referralReports,
        icon: Network,
        keywords: ["bonuses", "network", "downline"],
      },
      {
        label: "Ranks",
        href: ROUTES.admin.rankReports,
        icon: Trophy,
        keywords: ["levels", "promotions"],
      },
      {
        label: "Cycle Bonus",
        href: ROUTES.admin.cycleBonusReports,
        icon: Medal,
        keywords: ["10 day", "payouts"],
      },
      {
        label: "Pool Bonus Requests",
        href: ROUTES.admin.poolBonusRequests,
        icon: Coins,
        keywords: ["pool", "bonus", "approval", "requests"],
      },
      {
        label: "Blockchain",
        href: ROUTES.admin.blockchain,
        icon: Blocks,
        keywords: ["transactions", "on-chain", "tx", "confirmations"],
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Posts",
        href: ROUTES.admin.posts,
        icon: ImageIcon,
        keywords: ["banner", "slider", "image", "content"],
      },
      {
        label: "News",
        href: ROUTES.admin.news,
        icon: Megaphone,
        keywords: ["announcement", "ticker", "update"],
      },
      {
        label: "Support Tickets",
        href: ROUTES.admin.tickets,
        icon: TicketIcon,
        keywords: ["help", "support", "questions", "user queries"],
      },
      {
        label: "Notifications",
        href: ROUTES.admin.notifications,
        icon: Bell,
        keywords: ["broadcast", "alerts"],
      },
      {
        label: "Audit Logs",
        href: ROUTES.admin.auditLogs,
        icon: ClipboardList,
        keywords: ["history", "actions", "trail", "compliance"],
      },
      {
        label: "Settings",
        href: ROUTES.admin.settings,
        icon: ShieldCheck,
        keywords: ["config", "platform", "rates", "fees"],
      },
    ],
  },
];

/**
 * Active-state resolution.
 *
 * Non-exact items match on a path-segment boundary, so `/referral` matches
 * `/referral/tree` but not a hypothetical `/referral-terms`. Comparing with a
 * bare `startsWith` is the usual bug here.
 */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Flatten sections for the command palette. */
export function flattenNav(sections: NavSection[]): NavItem[] {
  return sections.flatMap((section) => section.items);
}
