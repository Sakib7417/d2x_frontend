"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Brand } from "./brand";
import { isNavItemActive, type NavItem, type NavSection } from "@/config/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  mobileNavSet,
  selectSidebarCollapsed,
  sidebarToggled,
} from "@/store/slices/ui-slice";

/**
 * Primary navigation rail.
 *
 * Collapsible to an icon rail — a genuine need on a trading dashboard where
 * horizontal space is contested by wide tables. Collapsed state is persisted
 * by `useSidebarPersistence` in the shell.
 *
 * The active indicator is a shared `layoutId`, so Framer Motion animates a
 * single pill between items instead of cross-fading two. That continuity is
 * what makes the nav feel like one object rather than a list of buttons.
 */

export interface SidebarProps {
  sections: NavSection[];
  /** Live badge counts, keyed by NavItem.badge. */
  badges?: Partial<Record<NonNullable<NavItem["badge"]>, number>>;
  /** Rendered under the nav — e.g. the admin/user context switcher. */
  footer?: React.ReactNode;
  /** True inside the mobile off-canvas sheet: never collapse, close on nav. */
  mobile?: boolean;
  className?: string;
}

export function Sidebar({
  sections,
  badges,
  footer,
  mobile = false,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const collapsedPreference = useAppSelector(selectSidebarCollapsed);

  // The off-canvas sheet is never collapsed — there is no space pressure there
  // and an icon rail inside a drawer is just worse.
  const collapsed = mobile ? false : collapsedPreference;

  return (
    <aside
      className={cn(
        "bg-sidebar border-sidebar-border flex h-full flex-col border-r",
        "transition-[width] duration-300 ease-out-expo",
        collapsed ? "w-18" : "w-64",
        className,
      )}
      data-collapsed={collapsed}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2 px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <Brand collapsed={collapsed} />
      </div>

      <ScrollArea className="flex-1 overflow-hidden">
        <nav className="space-y-6 px-3 pb-4" aria-label="Main">
          {sections.map((section, sectionIndex) => (
            <div key={section.label ?? `section-${sectionIndex}`}>
              {section.label && !collapsed && (
                <p className="text-muted-foreground/70 mb-2 px-3 text-[0.6875rem] font-semibold tracking-widest uppercase">
                  {section.label}
                </p>
              )}
              {section.label && collapsed && (
                <div
                  className="bg-sidebar-border mx-auto mb-2 h-px w-8"
                  aria-hidden="true"
                />
              )}

              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <SidebarLink
                      item={item}
                      active={isNavItemActive(item, pathname)}
                      collapsed={collapsed}
                      badgeCount={item.badge ? badges?.[item.badge] : undefined}
                      onNavigate={
                        mobile ? () => dispatch(mobileNavSet(false)) : undefined
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {footer && (
        <div className={cn("border-sidebar-border border-t p-3", collapsed && "px-2")}>
          {footer}
        </div>
      )}

      {!mobile && (
        <div className="border-sidebar-border border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(sidebarToggled())}
            className={cn(
              "text-muted-foreground hover:text-foreground w-full justify-start gap-3",
              collapsed && "justify-center px-0",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4.5" />
            ) : (
              <PanelLeftClose className="size-4.5" />
            )}
            {!collapsed && <span className="text-sm">Collapse</span>}
          </Button>
        </div>
      )}
    </aside>
  );
}

function SidebarLink({
  item,
  active,
  collapsed,
  badgeCount,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  badgeCount?: number;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
        "transition-colors duration-200 outline-none",
        "focus-visible:ring-sidebar-ring focus-visible:ring-2",
        active
          ? "text-sidebar-accent-foreground"
          : "text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60",
        collapsed && "justify-center px-0",
      )}
    >
      {active && (
        <motion.span
          // Shared id across every link: one pill that slides, not a fade.
          layoutId="sidebar-active-pill"
          className="bg-sidebar-accent absolute inset-0 rounded-lg"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          aria-hidden="true"
        />
      )}
      {active && (
        <motion.span
          layoutId="sidebar-active-bar"
          className="bg-primary absolute top-1/2 left-0 h-5 w-0.75 -translate-y-1/2 rounded-r-full"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          aria-hidden="true"
        />
      )}

      <Icon
        className={cn(
          "relative z-10 size-4.5 shrink-0 transition-colors",
          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
        )}
        strokeWidth={active ? 2.2 : 1.9}
      />

      {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}

      {!collapsed && badgeCount !== undefined && badgeCount > 0 && (
        <span className="bg-primary text-primary-foreground relative z-10 ml-auto grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[0.625rem] font-semibold tabular-nums">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}

      {/* Collapsed: a dot is the only affordance that fits. */}
      {collapsed && badgeCount !== undefined && badgeCount > 0 && (
        <span
          className="bg-primary ring-sidebar absolute top-1.5 right-1.5 size-2 rounded-full ring-2"
          aria-hidden="true"
        />
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {item.label}
        {badgeCount !== undefined && badgeCount > 0 && ` (${badgeCount})`}
      </TooltipContent>
    </Tooltip>
  );
}
