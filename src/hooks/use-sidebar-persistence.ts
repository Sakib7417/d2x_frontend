"use client";

import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectSidebarCollapsed,
  sidebarCollapsedSet,
} from "@/store/slices/ui-slice";
import {
  balancesHiddenSet,
  selectBalancesHidden,
} from "@/store/slices/ui-slice";

const SIDEBAR_KEY = "mlm.ui.sidebarCollapsed";
const PRIVACY_KEY = "mlm.ui.balancesHidden";

/**
 * Persists UI preferences to localStorage.
 *
 * Implemented as an effect rather than a redux-persist integration: two
 * booleans do not justify the bundle cost, the rehydration gate, or the
 * `PersistGate` flash that comes with it.
 *
 * Read happens once on mount (never during render — localStorage does not
 * exist on the server, and reading it during render would break hydration).
 * The brief frame where the sidebar is expanded before a stored `collapsed`
 * applies is covered by a CSS transition, so it reads as intentional rather
 * than as a jump.
 */
export function useUiPreferences() {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector(selectSidebarCollapsed);
  const balancesHidden = useAppSelector(selectBalancesHidden);

  // ---- hydrate once -------------------------------------------------------
  useEffect(() => {
    try {
      const storedSidebar = window.localStorage.getItem(SIDEBAR_KEY);
      if (storedSidebar !== null) {
        dispatch(sidebarCollapsedSet(storedSidebar === "true"));
      }

      const storedPrivacy = window.localStorage.getItem(PRIVACY_KEY);
      if (storedPrivacy !== null) {
        dispatch(balancesHiddenSet(storedPrivacy === "true"));
      }
    } catch {
      // Safari private mode throws on localStorage access. Defaults are fine.
    }
    // Intentionally mount-only: this is a one-shot hydration, and re-running
    // it when the values change would fight the user's own toggles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- persist on change --------------------------------------------------
  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PRIVACY_KEY, String(balancesHidden));
    } catch {
      /* ignore */
    }
  }, [balancesHidden]);
}
