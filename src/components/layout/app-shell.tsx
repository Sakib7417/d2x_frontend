"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { ImageIcon, Megaphone } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { UserMenu } from "./user-menu";
import { CommandPalette } from "./command-palette";
import { PageTransition } from "@/components/common/page-transition";
import { useUiPreferences } from "@/hooks/use-sidebar-persistence";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { mobileNavSet, selectMobileNavOpen } from "@/store/slices/ui-slice";
import { useLogoutMutation } from "@/features/auth/api/auth-api";
import { useUserDashboardQuery } from "@/features/users/api/users-api";
import { ROUTES } from "@/config/routes";
import { ADMIN_NAV, USER_NAV, type NavSection } from "@/config/navigation";

/**
 * Application shell for authenticated areas.
 *
 * Shared by both the user and admin panels — they differ only in their
 * `sections`, which keeps one layout to maintain instead of two that slowly
 * diverge.
 *
 * Layout strategy: `h-dvh` + `overflow-hidden` on the frame, with scrolling
 * confined to the main column. This keeps the sidebar and topbar genuinely
 * fixed without `position: fixed` and its scrollbar-overlap problems, and
 * `dvh` (not `vh`) handles mobile browser chrome collapsing — otherwise the
 * bottom of the page sits under Safari's toolbar.
 */

export interface AppShellProps {
  navigation: "user" | "admin";
  children: ReactNode;
  /** Unread notification count, threaded to both topbar and sidebar badge. */
  notificationCount?: number;
  /** Extra controls for the topbar's right side. */
  topbarActions?: ReactNode;
  /** Constrain content width. Wide tables should pass `false`. */
  constrained?: boolean;
}

export function AppShell({
  navigation,
  children,
  notificationCount,
  topbarActions,
  constrained = true,
}: AppShellProps) {
  useUiPreferences();

  // Always call the hook — React rules of hooks require unconditional calls.
  // For admin navigation the data is simply unused.
  const dashboard = useUserDashboardQuery();
  const isContentCreator = dashboard.data?.profile.isContentCreator ?? false;

  const sections = navigation === "admin" ? ADMIN_NAV : USER_NAV;

  // For user navigation, inject content-creator-only sections if the user has
  // the isContentCreator flag on their profile.
  const effectiveSections: NavSection[] = navigation === "user" && isContentCreator
    ? [
        ...USER_NAV,
        {
          label: "Content",
          items: [
            {
              label: "My Posts",
              href: ROUTES.myPosts,
              icon: ImageIcon,
              keywords: ["banner", "slider", "image", "create post"],
            },
            {
              label: "My News",
              href: ROUTES.myNews,
              icon: Megaphone,
              keywords: ["announcement", "ticker", "create news"],
            },
          ],
        },
      ]
    : sections;

  const mobileNavOpen = useAppSelector(selectMobileNavOpen);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logout] = useLogoutMutation();

  const handleSignOut = async () => {
    try {
      await logout().unwrap();
    } catch {
      /* local state is cleared regardless — see the mutation's onQueryStarted */
    } finally {
      router.replace(ROUTES.login);
      router.refresh();
    }
  };

  return (
    <div className="bg-background flex h-dvh overflow-hidden">
      {/* Desktop rail */}
      <div className="hidden h-full lg:flex">
        <Sidebar
          sections={effectiveSections}
          badges={{ notifications: notificationCount }}
          footer={<UserMenu />}
        />
      </div>

      {/* Mobile off-canvas */}
      <Sheet
        open={mobileNavOpen}
        onOpenChange={(open) => dispatch(mobileNavSet(open))}
      >
        <SheetContent side="left" className="w-72 p-0 lg:hidden">
          {/* Required by Radix for an accessible name; visually hidden. */}
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar
            sections={effectiveSections}
            badges={{ notifications: notificationCount }}
            footer={<UserMenu />}
            mobile
            className="w-full border-r-0"
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar notificationCount={notificationCount}>{topbarActions}</Topbar>

        {/* `min-w-0` is load-bearing: without it a wide table inside a flex
            child refuses to shrink and blows out the whole layout. */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div
            className={cn(
              "px-4 py-6 lg:px-8",
              constrained && "mx-auto w-full max-w-[90rem]",
            )}
          >
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>

      <CommandPalette sections={effectiveSections} onSignOut={handleSignOut} />
    </div>
  );
}
