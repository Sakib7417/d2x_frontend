"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent } from "@/lib/utils/money";

/**
 * KPI tile.
 *
 * The workhorse of both dashboards, so it owns its own loading state rather
 * than making every caller wire up a bespoke skeleton — that duplication is
 * exactly how loading states end up inconsistent across a large app.
 *
 * `value` is a ReactNode so callers pass either `<Money>` (exact, for
 * balances) or `<AnimatedNumber>` (count-up, for counts). The tile stays
 * agnostic about which, and never formats a figure itself.
 */

export type StatAccent = "brand" | "profit" | "loss" | "pending" | "info" | "neutral";

const ACCENTS: Record<StatAccent, { icon: string; glow: string }> = {
  brand: { icon: "text-primary bg-primary/10", glow: "from-primary/18" },
  profit: { icon: "text-profit bg-profit-muted", glow: "from-profit/18" },
  loss: { icon: "text-loss bg-loss-muted", glow: "from-loss/18" },
  pending: { icon: "text-pending bg-pending-muted", glow: "from-pending/18" },
  info: { icon: "text-info bg-info-muted", glow: "from-info/18" },
  neutral: { icon: "text-muted-foreground bg-muted", glow: "from-foreground/8" },
};

export interface StatCardProps {
  label: string;
  value: ReactNode;
  /** Small caption under the value — a secondary figure or context. */
  hint?: ReactNode;
  icon?: LucideIcon;
  accent?: StatAccent;
  /**
   * Period-over-period change, as a percentage.
   * Only pass this when the backend actually returns a comparison figure —
   * never compute a fake trend on the client.
   */
  trend?: { value: number; label?: string } | null;
  loading?: boolean;
  /** Staggered reveal index when rendering a grid of tiles. */
  index?: number;
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "brand",
  trend,
  loading = false,
  index = 0,
  className,
  onClick,
}: StatCardProps) {
  const accentStyle = ACCENTS[accent];
  const interactive = Boolean(onClick);

  if (loading) return <StatCardSkeleton className={className} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        // Stagger by index so a row of tiles cascades rather than popping in
        // as one block. Capped so a 12-tile admin grid doesn't take 2s.
        delay: Math.min(index * 0.05, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        "group border-border/70 bg-card relative overflow-hidden rounded-2xl border p-5",
        "shadow-ambient transition-all duration-300",
        "hover:border-border hover:shadow-lifted",
        interactive && "cursor-pointer active:scale-[0.99]",
        className,
      )}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {/* Corner glow, revealed on hover. Pointer-events-none so it never
          intercepts clicks on the tile. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-gradient-to-br to-transparent blur-2xl",
          "opacity-0 transition-opacity duration-500 group-hover:opacity-100",
          accentStyle.glow,
        )}
      />
      <div className="edge-light absolute inset-x-0 top-0 h-px" aria-hidden="true" />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        {Icon && (
          <div
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105",
              accentStyle.icon,
            )}
          >
            <Icon className="size-4.5" strokeWidth={2} />
          </div>
        )}
      </div>

      <div className="relative mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <div className="text-foreground text-2xl leading-none font-semibold">
          {value}
        </div>
        {trend && <TrendPill value={trend.value} label={trend.label} />}
      </div>

      {hint && (
        <div className="text-muted-foreground relative mt-2 text-xs">{hint}</div>
      )}
    </motion.div>
  );
}

function TrendPill({ value, label }: { value: number; label?: string }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium",
        positive ? "text-profit bg-profit-muted" : "text-loss bg-loss-muted",
      )}
      title={label}
    >
      <Icon className="size-3" strokeWidth={2.5} aria-hidden="true" />
      {formatPercent(Math.abs(value))}
    </span>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-border/70 bg-card rounded-2xl border p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-9 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-7 w-32" />
      <Skeleton className="mt-3 h-3 w-20" />
    </div>
  );
}
