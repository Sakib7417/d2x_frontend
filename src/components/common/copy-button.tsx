"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Copy-to-clipboard control.
 *
 * Used constantly in this product — wallet addresses, tx hashes, referral
 * codes and links. Getting it right matters more than it looks:
 *
 *   - `navigator.clipboard` is unavailable on insecure origins and in some
 *     in-app browsers, so there is an explicit fallback path rather than a
 *     silent no-op.
 *   - The confirmation timer is cleared on unmount, otherwise copying then
 *     navigating away sets state on an unmounted component.
 *   - The icon swap is animated, giving the tactile confirmation users expect
 *     when the thing they copied is a 42-character address they cannot easily
 *     verify by eye.
 */

export interface CopyButtonProps {
  value: string;
  /** Shown in the tooltip and announced to screen readers. */
  label?: string;
  size?: "xs" | "sm";
  variant?: "ghost" | "outline";
  className?: string;
  onCopied?: () => void;
}

export function CopyButton({
  value,
  label = "Copy",
  size = "sm",
  variant = "ghost",
  className,
  onCopied,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const copy = useCallback(async () => {
    const succeeded = await writeToClipboard(value);
    if (!succeeded) return;

    setCopied(true);
    onCopied?.();

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1600);
  }, [value, onCopied]);

  const iconSize = size === "xs" ? "size-3" : "size-3.5";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size="icon"
          onClick={copy}
          aria-label={copied ? "Copied" : label}
          className={cn(
            "text-muted-foreground hover:text-foreground shrink-0",
            size === "xs" ? "size-6" : "size-7",
            className,
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="done"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="grid place-items-center"
              >
                <Check className={cn(iconSize, "text-profit")} strokeWidth={3} />
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="grid place-items-center"
              >
                <Copy className={iconSize} />
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied" : label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Clipboard write with a legacy fallback.
 *
 * The async Clipboard API requires a secure context. Users on plain http in
 * dev, or inside some wallet in-app browsers, would otherwise get a dead
 * button.
 */
async function writeToClipboard(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the legacy path — usually a permissions failure.
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Monospace hex value with a copy affordance — addresses and tx hashes.
 * Full value in the title attribute so it stays verifiable on hover.
 */
export function CopyableHex({
  value,
  display,
  className,
}: {
  value: string | null | undefined;
  display?: string;
  className?: string;
}) {
  if (!value) return <span className="text-muted-foreground">—</span>;

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="font-mono text-xs" title={value}>
        {display ?? value}
      </span>
      <CopyButton value={value} size="xs" label="Copy to clipboard" />
    </span>
  );
}
