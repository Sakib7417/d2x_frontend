"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Empty state.
 *
 * Distinct from the error state, and the distinction matters: "you have no
 * deposits yet" is a normal, even expected condition for a new user, while
 * "we couldn't load your deposits" is a fault. Rendering the same grey box for
 * both teaches users to distrust the screen.
 *
 * Empty states here are always actionable where an action exists — a user with
 * no deposits should be looking at a "Make your first deposit" button, not a
 * shrug.
 */

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** `inline` for inside a table/card, `page` for a full route. */
  size?: "inline" | "page";
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  size = "inline",
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "page" ? "min-h-[60vh] px-6 py-16" : "px-6 py-14",
        className,
      )}
    >
      {/* Concentric rings echo the brand's radial motif and give the icon
          enough visual weight to anchor an otherwise empty viewport. */}
      <div className="relative mb-5">
        <div
          aria-hidden="true"
          className="bg-primary/5 absolute -inset-6 rounded-full blur-2xl"
        />
        <div className="border-border/60 bg-surface-2/60 relative grid size-16 place-items-center rounded-2xl border backdrop-blur-sm">
          <Icon className="text-muted-foreground size-7" strokeWidth={1.5} />
        </div>
      </div>

      <h3
        className={cn(
          "text-foreground font-semibold",
          size === "page" ? "text-xl" : "text-base",
        )}
      >
        {title}
      </h3>

      {description && (
        <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed text-balance">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {action &&
            (action.href ? (
              <Button asChild size="sm">
                <a href={action.href}>{action.label}</a>
              </Button>
            ) : (
              <Button size="sm" onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
          {secondaryAction && (
            <Button size="sm" variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Specialised empty state for when filters exclude everything.
 *
 * Separated from the generic one because the remedy is different: the data
 * exists, the user just can't see it. Offering "Clear filters" is far more
 * useful than "Create your first…", which would be actively wrong here.
 */
export function NoResultsState({
  onClear,
  entity = "results",
  className,
}: {
  onClear?: () => void;
  entity?: string;
  className?: string;
}) {
  return (
    <EmptyState
      title={`No ${entity} match your filters`}
      description="Try widening your date range or clearing some filters."
      action={onClear ? { label: "Clear filters", onClick: onClear } : undefined}
      className={className}
    />
  );
}
