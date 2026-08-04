/**
 * Display formatters for non-monetary values.
 *
 * All date helpers are timezone-explicit. Rendering a raw `new Date(iso)` in a
 * server component and again on the client produces different strings whenever
 * the server's TZ differs from the user's, which React 19 reports as a
 * hydration mismatch. Every formatter here therefore either pins a timezone or
 * is only ever called from a client component after mount — see `useFormatted`
 * in `@/hooks/use-formatted-date`.
 */

import type { EvmAddress, ISODateString, TxHash } from "@/types/api";

/* -------------------------------------------------------------------------- */
/* Dates                                                                       */
/* -------------------------------------------------------------------------- */

const DATE_TIME: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

const DATE_ONLY: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "2-digit",
};

/**
 * Absolute timestamp, rendered in UTC by default.
 *
 * UTC is the correct default for a financial ledger: a trade settled at
 * "18:00" must mean the same instant for support, the user, and the audit log.
 * Pass an explicit timeZone for user-local display in tooltips.
 */
export function formatDateTime(
  value: ISODateString | string | null | undefined,
  options: { timeZone?: string; locale?: string } = {},
): string {
  const date = parseDate(value);
  if (!date) return "—";
  const { timeZone = "UTC", locale = "en-GB" } = options;
  return `${new Intl.DateTimeFormat(locale, { ...DATE_TIME, timeZone }).format(date)} ${timeZone === "UTC" ? "UTC" : ""}`.trim();
}

export function formatDate(
  value: ISODateString | string | null | undefined,
  options: { timeZone?: string; locale?: string } = {},
): string {
  const date = parseDate(value);
  if (!date) return "—";
  const { timeZone = "UTC", locale = "en-GB" } = options;
  return new Intl.DateTimeFormat(locale, { ...DATE_ONLY, timeZone }).format(date);
}

/**
 * "3 minutes ago" / "in 2 hours".
 *
 * CLIENT ONLY. Depends on `Date.now()`, so calling it during SSR bakes the
 * server's clock into the HTML and guarantees a hydration mismatch.
 */
export function formatRelative(
  value: ISODateString | string | null | undefined,
  now: Date = new Date(),
): string {
  const date = parseDate(value);
  if (!date) return "—";

  const deltaSeconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const absolute = Math.abs(deltaSeconds);

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const divisions: Array<[limit: number, seconds: number, unit: Intl.RelativeTimeFormatUnit]> = [
    [60, 1, "second"],
    [3600, 60, "minute"],
    [86_400, 3600, "hour"],
    [604_800, 86_400, "day"],
    [2_629_800, 604_800, "week"],
    [31_557_600, 2_629_800, "month"],
    [Number.POSITIVE_INFINITY, 31_557_600, "year"],
  ];

  for (const [limit, seconds, unit] of divisions) {
    if (absolute < limit) {
      return formatter.format(Math.round(deltaSeconds / seconds), unit);
    }
  }
  return formatter.format(Math.round(deltaSeconds / 31_557_600), "year");
}

/**
 * Countdown for trade settlement timers (trades settle 2 minutes after entry).
 * Returns null once elapsed, so callers can swap in a "Settling…" state.
 */
export function formatCountdown(
  target: ISODateString | string | null | undefined,
  now: Date = new Date(),
): string | null {
  const date = parseDate(target);
  if (!date) return null;

  const remaining = date.getTime() - now.getTime();
  if (remaining <= 0) return null;

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

function parseDate(
  value: ISODateString | string | null | undefined,
): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/* -------------------------------------------------------------------------- */
/* Blockchain identifiers                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Middle-truncate a hex string: 0x1F71…36f7
 *
 * Keeps both ends because that is how humans actually verify an address
 * against their wallet. Truncating only the tail would be unverifiable.
 */
export function truncateHex(
  value: EvmAddress | TxHash | string | null | undefined,
  { leading = 6, trailing = 4 }: { leading?: number; trailing?: number } = {},
): string {
  if (!value) return "—";
  if (value.length <= leading + trailing + 1) return value;
  return `${value.slice(0, leading)}…${value.slice(-trailing)}`;
}

/**
 * Block explorer URL for a tx hash. Network strings come from the backend
 * (`BLOCKCHAIN_NETWORK`, e.g. "bsc-testnet") and are matched case-insensitively
 * because deposits store whatever the client sent in `network`.
 */
const EXPLORERS: Record<string, string> = {
  "bsc": "https://bscscan.com",
  "bsc-mainnet": "https://bscscan.com",
  "bsc-testnet": "https://testnet.bscscan.com",
  "ethereum": "https://etherscan.io",
  "sepolia": "https://sepolia.etherscan.io",
  "polygon": "https://polygonscan.com",
};

export function explorerTxUrl(
  hash: TxHash | string | null | undefined,
  network: string | null | undefined,
): string | null {
  if (!hash) return null;
  const base = EXPLORERS[(network ?? "").toLowerCase().trim()];
  return base ? `${base}/tx/${hash}` : null;
}

export function explorerAddressUrl(
  address: EvmAddress | string | null | undefined,
  network: string | null | undefined,
): string | null {
  if (!address) return null;
  const base = EXPLORERS[(network ?? "").toLowerCase().trim()];
  return base ? `${base}/address/${address}` : null;
}

/* -------------------------------------------------------------------------- */
/* Text                                                                        */
/* -------------------------------------------------------------------------- */

/** SCREAMING_SNAKE enum value -> "Screaming Snake". */
export function humanizeEnum(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Initials for avatar fallbacks; falls back to the email local-part. */
export function initialsOf(
  name: string | null | undefined,
  email?: string | null,
): string {
  const source = name?.trim() || email?.split("@")[0] || "";
  if (!source) return "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatCount(
  value: number | null | undefined,
  locale = "en-US",
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(locale).format(value);
}

/** Mask an email for display in shared/audit contexts: jo•••@example.com */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(1, local.length - 2))}@${domain}`;
}
