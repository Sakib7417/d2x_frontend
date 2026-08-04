"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Route-level enter transition.
 *
 * Intentionally enter-only, with no `AnimatePresence` exit animation.
 *
 * Exit animations in the App Router require holding the outgoing tree mounted
 * while the incoming route streams in, which fights RSC streaming and reliably
 * produces a flash of the old page's data under the new page's header. A short
 * fade-and-rise on enter delivers most of the perceived polish with none of
 * that risk.
 *
 * Keyed on pathname so it replays on every navigation.
 *
 * Movement is small (6px) and fast (280ms) on purpose. Users hit these screens
 * dozens of times a session to check a balance; a long, showy transition is
 * charming once and irritating thereafter.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered container for lists of cards.
 *
 * Pair with `<StaggerItem>`. Kept separate from PageTransition so a page can
 * animate its header immediately while its data grid cascades in as it loads.
 */
export function StaggerContainer({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.05, delayChildren: delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
