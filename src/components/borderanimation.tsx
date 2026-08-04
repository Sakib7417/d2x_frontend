"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedBorderTrailProps {
  children: React.ReactNode;
  className?: string;
  trailColor?: string;
  trailSize?: "sm" | "md" | "lg";
}

/**
 * Animated glowing border trail wrapper.
 *
 * Wraps children (typically a button) in a relatively-positioned container
 * with a rotating conic-gradient border that creates a "trail" of light.
 */
const AnimatedBorderTrail: React.FC<AnimatedBorderTrailProps> = ({
  children,
  className,
  trailColor = "#eab308",
  trailSize = "md",
}) => {
  const sizeClass =
    trailSize === "sm" ? "p-[1.5px]" : trailSize === "lg" ? "p-[3px]" : "p-[2px]";

  return (
    <div
      className={cn(
        "group relative inline-flex rounded-full",
        sizeClass,
        className,
      )}
    >
      {/* Animated conic trail */}
      <div
        aria-hidden="true"
        className="absolute inset-[-1px] rounded-full opacity-70 blur-[2px] transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `conic-gradient(from 0deg, transparent 0%, ${trailColor} 25%, transparent 50%, ${trailColor} 75%, transparent 100%)`,
          animation: "border-trail-spin 3s linear infinite",
        }}
      />
      {/* Clip content to rounded shape */}
      <div className="relative z-10 rounded-full [&>button]:rounded-full">
        {children}
      </div>
      <style>{`@keyframes border-trail-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AnimatedBorderTrail;
