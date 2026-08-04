"use client";

import { useRef, type ReactNode } from "react";
import { Provider } from "react-redux";

import { makeStore, type AppStore, type PreloadedState } from "@/store";

interface StoreProviderProps {
  children: ReactNode;
  /**
   * Session state resolved on the server from the httpOnly cookie.
   *
   * Passing it through here rather than fetching on mount is what lets the
   * first paint already know who the user is: no auth flicker, no layout shift
   * from an avatar popping in, no "Sign in" button flashing at a signed-in
   * user.
   */
  preloadedState?: PreloadedState;
}

/**
 * Creates the Redux store exactly once per client, in a ref.
 *
 * `useRef` rather than `useState(() => makeStore())` or a module singleton:
 *   - a module-level singleton is shared across requests on the server and
 *     would cross-contaminate user sessions;
 *   - `useState` works but signals "this can change", which it cannot.
 *
 * The ref is initialised lazily so `makeStore` runs during the first render of
 * this component and not on every re-render.
 */
export function StoreProvider({ children, preloadedState }: StoreProviderProps) {
  const storeRef = useRef<AppStore | null>(null);

  if (storeRef.current === null) {
    storeRef.current = makeStore(preloadedState);
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
