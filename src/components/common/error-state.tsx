"use client";

import {
  CloudOff,
  LockKeyhole,
  RefreshCw,
  SearchX,
  ServerCrash,
  ShieldAlert,
  TimerReset,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { isRetryable } from "@/lib/api/errors";
import { ROUTES } from "@/config/routes";
import type { ApiErrorKind, NormalizedApiError } from "@/types/api";

/**
 * Error state.
 *
 * Takes the already-normalised error, so no component ever branches on an HTTP
 * status code. The `kind` drives the icon, the copy and — most importantly —
 * which affordance is offered: retrying a 403 is pointless and retrying a 401
 * is worse, since the user needs to re-authenticate, not try harder.
 */

interface KindPresentation {
  icon: LucideIcon;
  title: string;
  /** Fallback copy when the backend message is missing or unhelpful. */
  description: string;
  tone: "danger" | "warning" | "neutral";
}

const PRESENTATION: Record<ApiErrorKind, KindPresentation> = {
  network: {
    icon: CloudOff,
    title: "Connection lost",
    description:
      "We couldn't reach the server. Check your internet connection and try again.",
    tone: "warning",
  },
  server: {
    icon: ServerCrash,
    title: "Something went wrong on our end",
    description:
      "This isn't your fault. Please try again in a moment — if it persists, contact support.",
    tone: "danger",
  },
  unauthorized: {
    icon: LockKeyhole,
    title: "Your session has expired",
    description: "Sign in again to continue where you left off.",
    tone: "warning",
  },
  forbidden: {
    icon: ShieldAlert,
    title: "You don't have access to this",
    description:
      "Your account doesn't have permission to view this page or perform this action.",
    tone: "danger",
  },
  not_found: {
    icon: SearchX,
    title: "Not found",
    description: "The item you're looking for doesn't exist or has been removed.",
    tone: "neutral",
  },
  conflict: {
    icon: TriangleAlert,
    title: "That conflicts with existing data",
    description: "This record already exists. Check the details and try again.",
    tone: "warning",
  },
  rate_limited: {
    icon: TimerReset,
    title: "Too many requests",
    description:
      "You've hit the rate limit. Please wait a minute before trying again.",
    tone: "warning",
  },
  validation: {
    icon: TriangleAlert,
    title: "Check your input",
    description: "Some of the values submitted weren't valid.",
    tone: "warning",
  },
  malformed: {
    icon: ServerCrash,
    title: "Unexpected response",
    description:
      "The server returned something we couldn't read. Please try again.",
    tone: "danger",
  },
  unknown: {
    icon: TriangleAlert,
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
    tone: "danger",
  },
};

const TONE_CLASSES = {
  danger: "text-loss bg-loss-muted border-loss/20",
  warning: "text-pending bg-pending-muted border-pending/20",
  neutral: "text-muted-foreground bg-muted border-border",
} as const;

export interface ErrorStateProps {
  error: NormalizedApiError | null | undefined;
  onRetry?: () => void;
  /** `inline` inside a card/table, `page` for a whole route. */
  size?: "inline" | "page";
  /**
   * Prefer the backend's message over our generic copy.
   * On by default — the backend's messages ("Insufficient balance",
   * "Minimum withdrawal is 10 USDT") are more useful than anything generic.
   * Turn off for 5xx, where the raw message may leak internals.
   */
  preferServerMessage?: boolean;
  className?: string;
}

export function ErrorState({
  error,
  onRetry,
  size = "inline",
  preferServerMessage = true,
  className,
}: ErrorStateProps) {
  if (!error) return null;

  const presentation = PRESENTATION[error.kind] ?? PRESENTATION.unknown;
  const Icon = presentation.icon;

  // Never surface a raw server message for 5xx — it can contain stack frames
  // and internal identifiers when the backend runs in development mode.
  const useServerMessage =
    preferServerMessage &&
    error.kind !== "server" &&
    error.kind !== "malformed" &&
    Boolean(error.message);

  const description = useServerMessage
    ? error.message
    : presentation.description;

  const showRetry = Boolean(onRetry) && isRetryable(error);
  const showSignIn = error.kind === "unauthorized";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "page" ? "min-h-[60vh] px-6 py-16" : "px-6 py-12",
        className,
      )}
    >
      <div
        className={cn(
          "mb-5 grid size-14 place-items-center rounded-2xl border",
          TONE_CLASSES[presentation.tone],
        )}
      >
        <Icon className="size-6" strokeWidth={1.75} />
      </div>

      <h3
        className={cn(
          "text-foreground font-semibold",
          size === "page" ? "text-xl" : "text-base",
        )}
      >
        {presentation.title}
      </h3>

      <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed text-balance">
        {description}
      </p>

      {error.status && (
        <p className="text-muted-foreground/60 mt-2 font-mono text-xs">
          Error {error.status}
        </p>
      )}

      {(showRetry || showSignIn) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {showRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="size-4" />
              Try again
            </Button>
          )}
          {showSignIn && (
            <Button size="sm" asChild>
              <a href={ROUTES.login}>Sign in</a>
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
