"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Count-up animation for integer statistics.
 *
 * SCOPE — this is for COUNTS ONLY (users, trades, referrals). It must never be
 * used for monetary values: it animates through intermediate numbers, and a
 * balance that visibly ticks through wrong figures on its way to the right one
 * is unacceptable on a financial screen. Use `<Money>` for money.
 *
 * Implementation notes:
 *   - Writes to the DOM node directly via a motion value subscription rather
 *     than through React state. A 60fps counter driving `setState` would push
 *     ~60 renders/second per tile through the reconciler; a dashboard with
 *     eight tiles would drop frames on mid-range hardware.
 *   - Only animates once, when scrolled into view.
 *   - Honours `prefers-reduced-motion` by snapping straight to the value.
 */

export interface AnimatedNumberProps {
  value: number | null | undefined;
  /** Animation duration in seconds. */
  duration?: number;
  /** Rendered before/after the number, e.g. "$" or "%". */
  prefix?: string;
  suffix?: string;
  /** Decimal places. Counts should stay at 0. */
  decimals?: number;
  locale?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1.1,
  prefix = "",
  suffix = "",
  decimals = 0,
  locale = "en-US",
  className,
}: AnimatedNumberProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const isInView = useInView(nodeRef, { once: true, margin: "-40px" });
  const prefersReducedMotion = useReducedMotion();

  const target = typeof value === "number" && Number.isFinite(value) ? value : 0;

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const format = (input: number) =>
      `${prefix}${new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(input)}${suffix}`;

    if (prefersReducedMotion || !isInView) {
      // Still paint the final value when out of view, so a user tabbing
      // straight to it (or a screen reader) never sees a stale 0.
      node.textContent = format(prefersReducedMotion ? target : motionValue.get());
      if (prefersReducedMotion) return;
    }

    if (!isInView) return;

    const unsubscribe = motionValue.on("change", (latest) => {
      node.textContent = format(latest);
    });

    const controls = animate(motionValue, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [
    target,
    isInView,
    prefersReducedMotion,
    motionValue,
    duration,
    decimals,
    locale,
    prefix,
    suffix,
  ]);

  if (value === null || value === undefined) {
    return <span className={cn("tabular", className)}>—</span>;
  }

  return (
    <span
      ref={nodeRef}
      className={cn("tabular", className)}
      // The accessible value is the final figure, never the in-between frames.
      aria-label={`${prefix}${target}${suffix}`}
    >
      {prefix}0{suffix}
    </span>
  );
}
