/**
 * Fixed-point money arithmetic for USDT balances.
 *
 * WHY THIS EXISTS
 * ---------------
 * Backend balances are Postgres `Decimal(20,8)` and arrive as strings. The
 * naive move is `parseFloat(wallet.balance)`. That is wrong here, twice over:
 *
 *   1. Binary floats cannot represent decimal fractions exactly.
 *      0.1 + 0.2 === 0.30000000000000004. Summing seven wallet balances to
 *      show "Total Portfolio" would drift by cents — visibly, on screen.
 *
 *   2. Range. `Decimal(20,8)` allows 12 integer digits. Expressed in 1e-8
 *      sub-units that is up to 1e20, while Number.MAX_SAFE_INTEGER is ~9e15.
 *      Large balances silently lose their least-significant digits.
 *
 * So: every value is parsed into a `bigint` count of 1e-8 sub-units, all
 * arithmetic is exact integer arithmetic, and formatting happens only at the
 * very edge, when rendering. `DecimalString` is branded specifically to make
 * `a.balance + b.balance` a compile error.
 *
 * Rounding policy: division and percentage use truncation toward zero, which
 * matches Postgres NUMERIC casting behaviour. Anything user-facing that needs
 * banker's rounding should be computed server-side — the client must never be
 * the authority on a monetary figure.
 */

import type { DecimalString } from "@/types/api";

/** Sub-units per whole token. Must match the backend's Decimal(20,8) scale. */
export const DECIMALS = 8 as const;
const SCALE = 10n ** BigInt(DECIMALS);

/** Ticker for every balance in the system. The platform is USDT-denominated. */
export const CURRENCY = "USDT" as const;

const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;

/* -------------------------------------------------------------------------- */
/* Construction                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Assert a raw string from the API is a well-formed decimal.
 *
 * Use at trust boundaries (transformResponse) when you want contract drift to
 * surface loudly. Everywhere else prefer `toUnits`, which is total.
 */
export function asDecimal(value: string): DecimalString {
  if (!DECIMAL_PATTERN.test(value)) {
    throw new TypeError(`Malformed decimal from API: ${JSON.stringify(value)}`);
  }
  return value as DecimalString;
}

/**
 * Parse a decimal string into exact 1e-8 sub-units.
 *
 * Tolerant by design: returns 0n for null/undefined/empty/garbage rather than
 * throwing, because a single bad row must not blank an entire dashboard.
 * Excess precision beyond 8dp is truncated, matching the database column.
 */
export function toUnits(
  value: DecimalString | string | null | undefined,
): bigint {
  if (value === null || value === undefined) return 0n;

  const raw = String(value).trim();
  if (raw === "" || !DECIMAL_PATTERN.test(raw)) return 0n;

  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;
  const [whole, fraction = ""] = unsigned.split(".");

  // Pad or truncate the fractional part to exactly DECIMALS digits.
  const normalisedFraction = fraction
    .padEnd(DECIMALS, "0")
    .slice(0, DECIMALS);

  const units = BigInt(whole) * SCALE + BigInt(normalisedFraction || "0");
  return negative ? -units : units;
}

/** Render sub-units back to a canonical decimal string with all 8 places. */
export function fromUnits(units: bigint): DecimalString {
  const negative = units < 0n;
  const absolute = negative ? -units : units;

  const whole = absolute / SCALE;
  const fraction = absolute % SCALE;

  const fractionText = fraction.toString().padStart(DECIMALS, "0");
  return `${negative ? "-" : ""}${whole}.${fractionText}` as DecimalString;
}

/* -------------------------------------------------------------------------- */
/* Arithmetic — all exact                                                      */
/* -------------------------------------------------------------------------- */

export function add(
  ...values: Array<DecimalString | string | null | undefined>
): bigint {
  return values.reduce<bigint>((sum, v) => sum + toUnits(v), 0n);
}

export function subtract(
  a: DecimalString | string | null | undefined,
  b: DecimalString | string | null | undefined,
): bigint {
  return toUnits(a) - toUnits(b);
}

/**
 * Multiply by an integer-ish scalar (e.g. quantity). Fractional multipliers
 * must use `applyPercent` so the rounding is explicit.
 */
export function multiplyByInt(
  value: DecimalString | string | null | undefined,
  factor: number | bigint,
): bigint {
  return toUnits(value) * BigInt(Math.trunc(Number(factor)));
}

/**
 * Apply a percentage expressed in basis points to avoid float multipliers.
 * 250 bps = 2.50%. Truncates toward zero.
 *
 * Backend fee percentages (WITHDRAWAL_FEE_PERCENTAGE=2) arrive as whole
 * percents — convert with `percentToBps(2)` before calling.
 */
export function applyBps(units: bigint, bps: number | bigint): bigint {
  return (units * BigInt(bps)) / 10_000n;
}

export function percentToBps(percent: number): number {
  return Math.round(percent * 100);
}

/** Ratio of two sub-unit amounts as a float percentage — display only. */
export function percentOf(part: bigint, total: bigint): number {
  if (total === 0n) return 0;
  // Scale to 4dp of a percent before converting, so the Number cast is safe.
  return Number((part * 1_000_000n) / total) / 10_000;
}

export function compare(a: bigint, b: bigint): -1 | 0 | 1 {
  return a < b ? -1 : a > b ? 1 : 0;
}

export const isZero = (units: bigint): boolean => units === 0n;
export const isNegative = (units: bigint): boolean => units < 0n;
export const isPositive = (units: bigint): boolean => units > 0n;
export const absolute = (units: bigint): bigint => (units < 0n ? -units : units);

/** Sign of a value, for driving profit/loss colour and ▲/▼ glyphs. */
export type Sign = "positive" | "negative" | "zero";
export function signOf(units: bigint): Sign {
  if (units > 0n) return "positive";
  if (units < 0n) return "negative";
  return "zero";
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

export interface FormatMoneyOptions {
  /** Minimum fraction digits shown. Default 2. */
  minimumFractionDigits?: number;
  /**
   * Maximum fraction digits shown. Default 2.
   * Use 8 on detail screens where the exact on-chain amount matters.
   */
  maximumFractionDigits?: number;
  /** Append " USDT". Default false — most call sites label the column instead. */
  withCurrency?: boolean;
  /** Force a leading + on positive values (for deltas). Default false. */
  signDisplay?: "auto" | "always" | "never";
  /** Group thousands. Default true. */
  grouping?: boolean;
  locale?: string;
}

/**
 * Format sub-units for display.
 *
 * Implemented on the string produced by `fromUnits` rather than by converting
 * to Number first, so values above 2^53 still render every digit correctly.
 * `Intl.NumberFormat` accepts a string only in the `formatToParts`-free
 * bigint path, so we split and group manually — this is the reason for the
 * hand-rolled grouping below.
 */
export function formatUnits(
  units: bigint,
  options: FormatMoneyOptions = {},
): string {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    withCurrency = false,
    signDisplay = "auto",
    grouping = true,
    locale = "en-US",
  } = options;

  const maxFraction = Math.max(
    0,
    Math.min(DECIMALS, Math.max(minimumFractionDigits, maximumFractionDigits)),
  );

  const negative = units < 0n;
  const abs = negative ? -units : units;

  const whole = abs / SCALE;
  const fractionAll = (abs % SCALE).toString().padStart(DECIMALS, "0");

  // Truncate (never round up) so a displayed balance can never exceed the
  // real one — showing a user more money than they have is unacceptable.
  let fraction = fractionAll.slice(0, maxFraction);
  while (
    fraction.length > minimumFractionDigits &&
    fraction.endsWith("0")
  ) {
    fraction = fraction.slice(0, -1);
  }

  const wholeText = grouping
    ? groupThousands(whole.toString(), locale)
    : whole.toString();

  let sign = "";
  if (negative && signDisplay !== "never") sign = "-";
  else if (!negative && signDisplay === "always" && units !== 0n) sign = "+";

  const body = fraction.length > 0 ? `${wholeText}.${fraction}` : wholeText;
  return withCurrency ? `${sign}${body} ${CURRENCY}` : `${sign}${body}`;
}

/** Convenience: parse then format in one step. */
export function formatMoney(
  value: DecimalString | string | null | undefined,
  options?: FormatMoneyOptions,
): string {
  return formatUnits(toUnits(value), options);
}

/**
 * Compact notation for KPI tiles: 1.25M, 48.2K.
 *
 * Safe to route through Number here because compact display is inherently
 * approximate and only the leading 3-4 significant digits are shown.
 */
export function formatCompact(
  units: bigint,
  options: { locale?: string; withCurrency?: boolean } = {},
): string {
  const { locale = "en-US", withCurrency = false } = options;
  const asNumber = Number(units) / Number(SCALE);

  const text = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(asNumber);

  return withCurrency ? `${text} ${CURRENCY}` : text;
}

/**
 * Split a formatted amount into integer and fraction parts.
 *
 * Lets the Money component de-emphasise the decimals (smaller, dimmer), which
 * is the typographic trick every serious exchange uses to keep balance columns
 * scannable.
 */
export function splitForDisplay(
  units: bigint,
  options: FormatMoneyOptions = {},
): { sign: string; whole: string; fraction: string } {
  const formatted = formatUnits(units, options);
  const sign = formatted.startsWith("-") || formatted.startsWith("+")
    ? formatted[0]
    : "";
  const body = sign ? formatted.slice(1) : formatted;
  const [whole, fraction = ""] = body.split(".");
  return { sign, whole, fraction };
}

/** Percentage formatter for profit rates, bonus rates, allocation shares. */
export function formatPercent(
  value: number | null | undefined,
  options: { maximumFractionDigits?: number; signDisplay?: "auto" | "always" } = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const { maximumFractionDigits = 2, signDisplay = "auto" } = options;
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits,
    signDisplay,
  }).format(value / 100);
}

/**
 * Format a plain JS number that the backend already lossily converted with
 * `Number(Decimal)` — statistics endpoints do this. Kept separate from the
 * bigint path so it is obvious at the call site which values are exact and
 * which are not.
 */
export function formatLossyAmount(
  value: number | null | undefined,
  options: { maximumFractionDigits?: number; locale?: string } = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const { maximumFractionDigits = 2, locale = "en-US" } = options;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(value);
}

function groupThousands(digits: string, locale: string): string {
  // Intl handles locale-specific separators; digits here is always < 21 chars
  // so BigInt formatting is exact.
  return new Intl.NumberFormat(locale, { useGrouping: true }).format(
    BigInt(digits),
  );
}
