"use client";

import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";

/**
 * Confirmation dialog for destructive or irreversible actions.
 *
 * Every money-moving admin action in this product is irreversible — approving
 * a deposit credits wallets and cascades referral bonuses; processing a
 * withdrawal broadcasts an on-chain transfer. There is no undo, so the
 * confirmation step is a real control, not decoration.
 *
 * Two escalation levels:
 *   - standard: description + confirm button
 *   - `requireTypedConfirmation`: the user must type an exact string (an
 *     amount, an email) before the action unlocks. Reserved for the highest
 *     -stakes operations; used everywhere it becomes noise people click past.
 *
 * The dialog owns the pending state so callers just pass an async `onConfirm`
 * and get correct disabled/spinner behaviour without wiring it up each time.
 */

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button. Default true — most uses here are destructive. */
  destructive?: boolean;
  /**
   * Require the user to type this exact string to enable confirmation.
   * Case-sensitive, trimmed.
   */
  requireTypedConfirmation?: string;
  /** Label above the confirmation input. */
  typedConfirmationLabel?: string;
  /** Extra content between description and footer — a summary table, warnings. */
  children?: ReactNode;
  onConfirm: () => void | Promise<unknown>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
  requireTypedConfirmation,
  typedConfirmationLabel,
  children,
  onConfirm,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  const [typed, setTyped] = useState("");

  const confirmationSatisfied =
    !requireTypedConfirmation ||
    typed.trim() === requireTypedConfirmation.trim();

  const handleOpenChange = (next: boolean) => {
    // Never let a click-outside dismiss the dialog mid-request; the action is
    // already in flight and hiding it would leave the user unsure what happened.
    if (pending) return;
    if (!next) setTyped("");
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (!confirmationSatisfied || pending) return;

    setPending(true);
    try {
      await onConfirm();
      setTyped("");
      onOpenChange(false);
    } catch {
      // Deliberately swallowed: the caller's mutation surfaces the error via
      // toast. Keeping the dialog open lets the user retry without re-entering
      // the typed confirmation.
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-muted-foreground text-sm leading-relaxed">
              {description}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {children}

        {requireTypedConfirmation && (
          <div className="space-y-2">
            <Label htmlFor="confirm-input" className="text-xs">
              {typedConfirmationLabel ?? (
                <>
                  Type{" "}
                  <span className="text-foreground font-mono font-semibold">
                    {requireTypedConfirmation}
                  </span>{" "}
                  to confirm
                </>
              )}
            </Label>
            <Input
              id="confirm-input"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              disabled={pending}
              className="font-mono"
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              // Prevent Radix's default close-on-click; we close only after
              // the async action resolves.
              event.preventDefault();
              void handleConfirm();
            }}
            disabled={!confirmationSatisfied || pending}
            className={cn(
              buttonVariants({
                variant: destructive ? "destructive" : "default",
              }),
            )}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Imperative-ish helper for the common "one dialog per row action" case.
 *
 * Returns the open state plus a `confirm(payload)` opener, so a table can keep
 * a single dialog instance and swap the payload per row instead of mounting
 * one dialog per row — which on a 100-row table means 100 Radix portals.
 */
export function useConfirmDialog<TPayload>() {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<TPayload | null>(null);

  return {
    open,
    payload,
    confirm(next: TPayload) {
      setPayload(next);
      setOpen(true);
    },
    onOpenChange(next: boolean) {
      setOpen(next);
      if (!next) setPayload(null);
    },
  };
}
