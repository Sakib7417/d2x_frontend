"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { NormalizedApiError } from "@/types/api";

/**
 * Shared chrome for every auth form: heading, inline error banner, submit
 * button, footer link.
 *
 * Centralised so the four auth screens cannot drift in spacing, button width
 * or error placement — the kind of inconsistency that is invisible in review
 * and obvious when clicking through the flow.
 */

export function AuthFormHeader({
  title,
  description,
}: {
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="mb-7 space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && (
        <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Inline error banner for non-field failures.
 *
 * Auth errors are shown inline rather than only as a toast: toasts auto-dismiss
 * and are easy to miss when the user is already looking at the password field
 * wondering why nothing happened. `role="alert"` announces it immediately.
 */
export function AuthFormError({ error }: { error: NormalizedApiError | null }) {
  return (
    <AnimatePresence initial={false}>
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div
            role="alert"
            className="border-loss/25 bg-loss-muted text-loss flex items-start gap-2.5 rounded-lg border px-3.5 py-3"
          >
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0"
              strokeWidth={2.2}
              aria-hidden="true"
            />
            <p className="text-sm leading-relaxed">{error.message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AuthSubmitButton({
  children,
  loading,
  disabled,
  loadingLabel,
}: {
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  loadingLabel?: string;
}) {
  return (
    <Button
      type="submit"
      size="lg"
      // `disabled` while loading prevents the double-submit that, on signup,
      // produces a duplicate-email 409 on the user's own second click.
      disabled={loading || disabled}
      className="w-full"
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {loading ? (loadingLabel ?? "Please wait…") : children}
    </Button>
  );
}

export function AuthFormFooter({
  prompt,
  linkLabel,
  href,
  className,
}: {
  prompt: string;
  linkLabel: string;
  href: string;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-muted-foreground mt-6 text-center text-sm",
        className,
      )}
    >
      {prompt}{" "}
      <Link
        href={href}
        className="text-foreground hover:text-primary font-medium underline-offset-4 transition-colors hover:underline"
      >
        {linkLabel}
      </Link>
    </p>
  );
}
