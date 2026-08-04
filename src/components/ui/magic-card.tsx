"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MagicCardProps {
  children?: React.ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
}

/**
 * Mouse-tracking radial-glow card.
 *
 * Lightweight reimplementation of the magicui `MagicCard` — on hover a soft
 * radial gradient follows the cursor, giving the card an interactive sheen.
 * Used by the marketing `why-physio` and `products` sections.
 */
export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = "#eab308",
  gradientOpacity = 0.15,
}: MagicCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -gradientSize, y: -gradientSize });
  const [visible, setVisible] = useState(false);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm transition-colors duration-300 hover:border-yellow-500/40",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: visible ? 1 : 0,
          background: `radial-gradient(${gradientSize}px circle at ${pos.x}px ${pos.y}px, ${gradientColor}${Math.round(
            gradientOpacity * 255,
          )
            .toString(16)
            .padStart(2, "0")}, transparent 70%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default MagicCard;
