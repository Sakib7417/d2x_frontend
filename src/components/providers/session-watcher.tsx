"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  expiryAcknowledged,
  selectSessionExpired,
} from "@/store/slices/auth-slice";
import { ROUTES } from "@/config/routes";

/**
 * Reacts, exactly once, to a terminal session expiry.
 *
 * The proxy has already attempted a refresh and failed by the time
 * `sessionExpired` is dispatched, so there is nothing left to recover — the
 * job here is purely to tell the user and get them to the login page without
 * losing their place.
 *
 * Two details that matter:
 *
 *  1. The `expired` flag is acknowledged immediately, before navigating. A
 *     dashboard fires many parallel requests, so a wave of 401s arrives
 *     together; without the flag-and-clear pattern the user gets six toasts
 *     and six competing `router.replace` calls.
 *
 *  2. The current path is preserved in `?next=`, so signing back in returns
 *     the user where they were rather than dumping them on the dashboard.
 *     Auth routes are excluded — a `?next=/login` loop is worse than nothing.
 */
export function SessionWatcher() {
  const expired = useAppSelector(selectSessionExpired);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!expired) return;

    dispatch(expiryAcknowledged());

    toast.error("Session expired", {
      description: "Please sign in again to continue.",
    });

    const isAuthRoute = pathname.startsWith("/login") ||
      pathname.startsWith("/signup") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password");

    const target = isAuthRoute
      ? ROUTES.login
      : `${ROUTES.login}?next=${encodeURIComponent(pathname)}`;

    router.replace(target);
    // `refresh()` clears the RSC cache so server components re-render in their
    // logged-out state; without it a cached authenticated shell can persist.
    router.refresh();
  }, [expired, dispatch, pathname, router]);

  return null;
}
