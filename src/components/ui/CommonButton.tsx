"use client";

import React from "react";

interface CommonButtonProps {
  title: string;
  width?: string;
  height?: string;
  transparent?: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  [key: string]: unknown;
}

/**
 * Marketing surface button.
 *
 * The marketing components were ported from a separate project and expect this
 * exact prop shape (`title`, `width`, `transparent`). It renders a styled
 * amber/outline button independent of the shadcn `Button` used elsewhere.
 */
const CommonButton: React.FC<CommonButtonProps> = ({
  title,
  width = "auto",
  height = "auto",
  transparent = false,
  onClick,
  className = "",
  children,
  ...rest
}) => {
  return (
    <button
      onClick={onClick}
      style={{ width, height }}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3",
        "text-sm font-semibold tracking-wide transition-all duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60",
        transparent
          ? "border border-yellow-500/60 bg-transparent text-yellow-400 hover:bg-yellow-500/10"
          : "bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:from-yellow-400 hover:to-amber-500 hover:shadow-lg hover:shadow-yellow-500/30",
        className,
      ].join(" ")}
      {...rest}
    >
      {title || children}
    </button>
  );
};

export default CommonButton;
