"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronsUpDown,
  Eye,
  EyeOff,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RankBadge } from "@/components/common/status-badge";
import { useLogoutMutation } from "@/features/auth/api/auth-api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCurrentUser, selectIsAdmin } from "@/store/slices/auth-slice";
import {
  balancesVisibilityToggled,
  selectBalancesHidden,
} from "@/store/slices/ui-slice";
import { ROUTES } from "@/config/routes";
import { initialsOf } from "@/lib/utils/format";
import { UserRole } from "@/types/enums";

/**
 * Account menu.
 *
 * Also hosts the privacy toggle and the admin/user context switch, because
 * both are account-scoped rather than page-scoped and users look for them
 * under their avatar.
 */
export function UserMenu({ collapsed = false }: { collapsed?: boolean }) {
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = useAppSelector(selectIsAdmin);
  const balancesHidden = useAppSelector(selectBalancesHidden);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast.success("Signed out");
    } catch {
      // The mutation clears local state in its `finally` regardless, so the
      // user is signed out here either way — no need to alarm them.
      toast.success("Signed out");
    } finally {
      router.replace(ROUTES.login);
      router.refresh();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-auto w-full justify-start gap-2.5 px-2 py-2",
            collapsed && "justify-center px-0",
          )}
        >
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-(--logo-gold-400) to-(--logo-gold-700) text-[0.6875rem] font-semibold text-(--logo-navy-900)">
              {initialsOf(user.name, user.email)}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <>
              <div className="flex min-w-0 flex-1 flex-col items-start leading-tight">
                <span className="text-foreground w-full truncate text-sm font-medium">
                  {user.name ?? user.email.split("@")[0]}
                </span>
                <span className="text-muted-foreground w-full truncate text-xs">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="top" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1.5">
            <span className="text-foreground truncate text-sm font-medium">
              {user.name ?? "Account"}
            </span>
            <span className="text-muted-foreground truncate text-xs">
              {user.email}
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              <RankBadge rank={user.rank} />
              {user.role === UserRole.ADMIN && (
                <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold">
                  <ShieldCheck className="size-3" />
                  Admin
                </span>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={(event) => {
            // Keep the menu open: toggling privacy is something users often do
            // alongside another action, and closing feels abrupt.
            event.preventDefault();
            dispatch(balancesVisibilityToggled());
          }}
        >
          {balancesHidden ? (
            <Eye className="size-4" />
          ) : (
            <EyeOff className="size-4" />
          )}
          {balancesHidden ? "Show balances" : "Hide balances"}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href={ROUTES.profile}>
            <UserCog className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ROUTES.settings}>
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={ROUTES.admin.dashboard}>
                <LayoutDashboard className="size-4" />
                Admin panel
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={loggingOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
        >
          <LogOut className="size-4" />
          {loggingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
