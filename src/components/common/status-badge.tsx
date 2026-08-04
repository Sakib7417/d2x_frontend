"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { humanizeEnum } from "@/lib/utils/format";

/**
 * Status pill for every backend enum.
 *
 * Centralised because the same conceptual state appears under different names
 * across modules — a deposit is APPROVED, a withdrawal is COMPLETED, a cycle
 * bonus is CREDITED, and all three mean "done, money moved". Mapping them in
 * one table keeps the visual language consistent, so users learn the colours
 * once instead of per-screen.
 *
 * Each tone pairs a colour with a distinct icon. Colour alone is never the
 * signal — required for accessibility, and genuinely useful on a dense table
 * scanned at a glance.
 */

export type StatusTone = "success" | "danger" | "warning" | "info" | "neutral";

interface ToneStyle {
  className: string;
  icon: LucideIcon;
  /** Spinning icon for genuinely in-flight states. */
  animate?: boolean;
}

const TONES: Record<StatusTone, ToneStyle> = {
  success: {
    className: "bg-profit-muted text-profit border-profit/25",
    icon: CheckCircle2,
  },
  danger: {
    className: "bg-loss-muted text-loss border-loss/25",
    icon: XCircle,
  },
  warning: {
    className: "bg-pending-muted text-pending border-pending/25",
    icon: Clock,
  },
  info: {
    className: "bg-info-muted text-info border-info/25",
    icon: Loader2,
    animate: true,
  },
  neutral: {
    className: "bg-muted text-muted-foreground border-border",
    icon: AlertTriangle,
  },
};

/**
 * Status -> tone. Keys are the raw enum values from the backend.
 *
 * Collisions are intentional and safe: PENDING means the same thing whichever
 * module it comes from, so a single entry covers deposits, withdrawals,
 * trades and cycle bonuses alike.
 */
const STATUS_TONES: Record<string, StatusTone> = {
  // terminal success
  APPROVED: "success",
  COMPLETED: "success",
  CREDITED: "success",
  VERIFIED: "success",
  CONFIRMED: "success",
  ACTIVE: "success",
  SUCCESS: "success",

  // terminal failure
  REJECTED: "danger",
  FAILED: "danger",
  CANCELLED: "danger",
  SUSPENDED: "danger",

  // awaiting action
  PENDING: "warning",
  INACTIVE: "warning",
  PARTIAL: "warning",

  // in flight
  PROCESSING: "info",
};

/**
 * Icon overrides where the tone's default is misleading.
 * ACTIVE shares the success tone but reads better as a shield than a tick,
 * and SUSPENDED is a ban rather than a plain failure.
 */
const ICON_OVERRIDES: Record<string, LucideIcon> = {
  ACTIVE: ShieldCheck,
  SUSPENDED: Ban,
  VERIFIED: ShieldCheck,
};

export interface StatusBadgeProps {
  status: string | null | undefined;
  /** Force a tone, for statuses not in the table. */
  tone?: StatusTone;
  /** Override the label; defaults to the humanised enum value. */
  label?: string;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  tone,
  label,
  size = "sm",
  showIcon = true,
  className,
}: StatusBadgeProps) {
  if (!status) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const resolvedTone = tone ?? STATUS_TONES[status] ?? "neutral";
  const style = TONES[resolvedTone];
  const Icon = ICON_OVERRIDES[status] ?? style.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        "transition-colors duration-200",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        style.className,
        className,
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            size === "sm" ? "size-3" : "size-3.5",
            "shrink-0",
            style.animate && "animate-spin",
          )}
          aria-hidden="true"
        />
      )}
      {label ?? humanizeEnum(status)}
    </span>
  );
}

/**
 * Rank badge, LV1..LV7.
 *
 * Separate from StatusBadge because rank is a progression, not a state: it
 * uses the dedicated `--rank-*` ramp so higher tiers read as visibly more
 * prestigious. Driven by inline CSS vars because Tailwind cannot generate the
 * class names from a dynamic index at build time.
 */
export function RankBadge({
  rank,
  className,
  size = "sm",
}: {
  rank: string | null | undefined;
  className?: string;
  size?: "sm" | "md";
}) {
  if (!rank) return <span className="text-muted-foreground text-sm">—</span>;

  const level = Number.parseInt(rank.replace(/\D/g, ""), 10) || 1;
  const colour = `var(--rank-${Math.min(Math.max(level, 1), 7)})`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold tracking-wide whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className,
      )}
      style={{
        color: colour,
        borderColor: `color-mix(in oklch, ${colour} 30%, transparent)`,
        backgroundColor: `color-mix(in oklch, ${colour} 12%, transparent)`,
      }}
    >
      {rank}
    </span>
  );
}
