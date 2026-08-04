"use client";

import { useAppSelector } from "@/store/hooks";
import { selectIsAuthenticated, selectCurrentUser } from "@/store/slices/auth-slice";

/**
 * Auth hook used by the marketing surface.
 *
 * The application's source of truth for auth is the Redux store (see
 * `auth-slice`), preloaded on the server from the session cookie so there is
 * no signed-out flicker. The marketing components were ported expecting a
 * React context-style `useAuth()` returning `{ isAuthenticated }`; rather than
 * mounting a parallel context provider, this hook reads straight from the
 * store that is already in the tree via `<StoreProvider>`.
 */
export function useAuth() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  return { isAuthenticated, user };
}
