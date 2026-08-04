"use client";

import { Bell, Menu, Search } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useAppDispatch } from "@/store/hooks";
import { commandPaletteSet, mobileNavToggled } from "@/store/slices/ui-slice";
import { ROUTES } from "@/config/routes";

/**
 * Application top bar.
 *
 * Sticky with a translucent backdrop so table headers scroll under it rather
 * than colliding — a small thing that makes long ledger pages feel composed.
 *
 * The search control is a button, not an input. It opens the ⌘K palette, which
 * searches navigation, and later transactions and users. A dead-looking input
 * that does nothing until you type is worse than an honest button, and this
 * also keeps the palette as the single search surface.
 */

export interface TopbarProps {
  /** Unread notification count. Undefined while loading. */
  notificationCount?: number;
  /** Right-hand slot for page-specific controls. */
  children?: React.ReactNode;
  className?: string;
}

export function Topbar({
  notificationCount,
  children,
  className,
}: TopbarProps) {
  const dispatch = useAppDispatch();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 px-4 lg:px-6",
        "border-border/60 border-b",
        "bg-background/70 backdrop-blur-xl backdrop-saturate-150",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => dispatch(mobileNavToggled())}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <button
        type="button"
        onClick={() => dispatch(commandPaletteSet(true))}
        className={cn(
          "group border-border/70 bg-surface-1/60 text-muted-foreground flex h-9 items-center gap-2 rounded-lg border px-3",
          "hover:border-border hover:bg-surface-2/60 transition-colors",
          "w-9 justify-center sm:w-64 sm:justify-start",
        )}
        aria-label="Search"
      >
        <Search className="size-4 shrink-0" />
        <span className="hidden text-sm sm:inline">Search…</span>
        <kbd className="border-border/70 bg-surface-2 ml-auto hidden items-center gap-0.5 rounded border px-1.5 py-0.5 font-mono text-[0.625rem] font-medium sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <div className="flex-1" />

      {children}

      <Button
        variant="ghost"
        size="icon"
        asChild
        className="relative"
        aria-label={
          notificationCount
            ? `Notifications, ${notificationCount} unread`
            : "Notifications"
        }
      >
        <Link href={ROUTES.notifications}>
          <Bell className="size-4.5" />
          {notificationCount !== undefined && notificationCount > 0 && (
            <span
              className={cn(
                "bg-primary text-primary-foreground absolute -top-0.5 -right-0.5",
                "grid h-4 min-w-4 place-items-center rounded-full px-1",
                "text-[0.5625rem] font-bold tabular-nums",
                "ring-background ring-2",
              )}
            >
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Link>
      </Button>

      <ThemeToggle />
    </header>
  );
}
