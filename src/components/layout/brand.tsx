"use client";

import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/routes";


/**
 * Wordmark.
 *
 * The mark is an inline SVG rather than an image file: it inherits
 * `currentColor`, scales without a second asset for retina, and adds no
 * network request to the critical path. At this size a raster logo would be
 * the single largest LCP contributor on the login page.
 */

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid size-8 shrink-0 place-items-center rounded-[0.6rem]",
        "shadow-[0_0_20px_-8px_var(--logo-gold-400)]",
        className,
      )}
      aria-hidden="true"
    >
      {/* Interlocking chevrons — reads as both an upward trend and a network
          node, which is exactly what the product is. */}
      <Image
                    src="/images/home/d2x-logo.png"
                    alt="Dollar2X Global Group Ltd"
                    fill
                    priority
                    className="object-contain drop-shadow-[0_8px_30px_rgba(224,176,64,0.35)]"
                  />
    </span>
  );
}

export function Brand({
  href = ROUTES.home,
  collapsed = false,
  className,
}: {
  href?: string;
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg outline-none",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2",
        className,
      )}
    >
      <BrandMark className="transition-transform duration-300 group-hover:scale-105" />
      {!collapsed && (
        <span className="flex flex-col leading-none">
          <span className="text-foreground text-sm font-semibold tracking-tight">
            DOLLAR2X
          </span>
          <span className="text-muted-foreground text-[0.625rem] font-medium tracking-[0.14em] uppercase">
            GLOBAL
          </span>
        </span>
      )}
    </Link>
  );
}
