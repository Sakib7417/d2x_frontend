"use client";

import { useMemo } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { selectBalancesHidden } from "@/store/slices/ui-slice";
import {
  formatCompact,
  signOf,
  splitForDisplay,
  toUnits,
  type FormatMoneyOptions,
} from "@/lib/utils/money";
import type { DecimalString } from "@/types/api";

/**
 * The canonical way to render a monetary amount.
 *
 * Nothing in this app should format a balance by hand. Routing every figure
 * through one component buys us, in one place:
 *
 *   - exact BigInt arithmetic (never parseFloat — see lib/utils/money)
 *   - privacy mode (••••) honoured everywhere at once
 *   - tabular numerals, so digits don't jitter as values poll
 *   - de-emphasised decimals, the typographic convention every exchange uses
 *     to keep balance columns scannable
 *   - profit/loss colour + a ▲/▼ glyph, so the sign is never conveyed by
 *     colour alone (red-green colour blindness affects ~8% of men)
 */

type MoneyVariant =
  /** Neutral figure — a balance. No colour, no sign. */
  | "plain"
  /** Colour + arrow by sign. For P&L, deltas, ledger credit/debit. */
  | "signed"
  /** Always the profit colour, regardless of sign. For earnings totals. */
  | "positive"
  /** Always the loss colour. For fees, penalties. */
  | "negative";

type MoneySize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export interface MoneyProps extends FormatMoneyOptions {
  /** Decimal string from the API. Null/undefined renders an em dash. */
  value: DecimalString | string | null | undefined;
  variant?: MoneyVariant;
  size?: MoneySize;
  /** Append the USDT ticker. */
  showCurrency?: boolean;
  /** Compact notation (1.25M) for KPI tiles. */
  compact?: boolean;
  /** Show a ▲/▼ glyph. Defaults to true for `signed`. */
  showTrendIcon?: boolean;
  /** Render decimals at full opacity instead of de-emphasised. */
  emphasizeFraction?: boolean;
  /** Opt out of privacy masking — e.g. inside a confirm dialog. */
  ignorePrivacy?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<MoneySize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-2xl",
  "2xl": "text-4xl",
};

const FRACTION_SIZE_CLASSES: Record<MoneySize, string> = {
  xs: "text-[0.625rem]",
  sm: "text-[0.6875rem]",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-base",
  "2xl": "text-xl",
};

export function Money({
  value,
  variant = "plain",
  size = "md",
  showCurrency = false,
  compact = false,
  showTrendIcon,
  emphasizeFraction = false,
  ignorePrivacy = false,
  className,
  ...formatOptions
}: MoneyProps) {
  const balancesHidden = useAppSelector(selectBalancesHidden);
  const masked = balancesHidden && !ignorePrivacy;

  const units = useMemo(() => toUnits(value ?? null), [value]);
  const sign = signOf(units);

  const isMissing = value === null || value === undefined;

  const colourClass =
    variant === "positive"
      ? "text-profit"
      : variant === "negative"
        ? "text-loss"
        : variant === "signed"
          ? sign === "positive"
            ? "text-profit"
            : sign === "negative"
              ? "text-loss"
              : "text-muted-foreground"
          : "text-foreground";

  const withIcon =
    showTrendIcon ?? (variant === "signed" && sign !== "zero");

  if (isMissing) {
    return (
      <span
        className={cn(
          "tabular text-muted-foreground",
          SIZE_CLASSES[size],
          className,
        )}
      >
        —
      </span>
    );
  }

  if (masked) {
    return (
      <span
        className={cn(
          "tabular select-none tracking-widest text-muted-foreground",
          SIZE_CLASSES[size],
          className,
        )}
        // Screen readers should not announce a fake value.
        aria-label="Balance hidden"
      >
        ••••••
      </span>
    );
  }

  if (compact) {
    return (
      <span
        className={cn(
          "tabular font-semibold",
          colourClass,
          SIZE_CLASSES[size],
          className,
        )}
      >
        {formatCompact(units, { withCurrency: showCurrency })}
      </span>
    );
  }

  const { sign: signText, whole, fraction } = splitForDisplay(units, {
    signDisplay: variant === "signed" ? "always" : "auto",
    ...formatOptions,
  });

  const TrendIcon = sign === "positive" ? ArrowUp : ArrowDown;

  return (
    <span
      className={cn(
        "tabular inline-flex items-baseline gap-1 font-semibold",
        colourClass,
        SIZE_CLASSES[size],
        className,
      )}
    >
      {showCurrency && (
        <span className="text-[0.75em] font-medium opacity-55">$</span>
      )}
      {withIcon && sign !== "zero" && (
        <TrendIcon
          className="size-3 shrink-0 self-center"
          aria-hidden="true"
          strokeWidth={3}
        />
      )}
      <span>
        {signText}
        {whole}
        {fraction && (
          <span
            className={cn(
              !emphasizeFraction && "opacity-60",
              FRACTION_SIZE_CLASSES[size],
            )}
          >
            .{fraction}
          </span>
        )}
      </span>
    </span>
  );
}
