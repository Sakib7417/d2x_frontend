import {
  combineReducers,
  configureStore,
  type Action,
  type ThunkAction,
} from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

import { baseApi } from "@/lib/api/base-api";
import { authReducer } from "./slices/auth-slice";
import { uiReducer } from "./slices/ui-slice";

/**
 * Root reducer.
 *
 * Declared separately from `configureStore` so `RootState` can be derived from
 * it directly. Inlining the reducer map and then trying to type
 * `preloadedState` creates a circular inference problem — `RootState` depends
 * on the store, which depends on `preloadedState`, which depends on
 * `RootState` — and TypeScript resolves it by widening everything to `never`.
 */
const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  ui: uiReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

/** Slices the server is allowed to hydrate. */
export type PreloadedState = Partial<Pick<RootState, "auth" | "ui">>;

/**
 * Store factory.
 *
 * A factory rather than a module-level singleton, because in the App Router
 * the module graph is shared across requests on the server. A singleton store
 * would leak one user's session state into another user's render — a
 * catastrophic bug in a financial app, and a genuinely easy one to ship.
 *
 * Called once per browser tab, from StoreProvider.
 */
export function makeStore(preloadedState?: PreloadedState) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // RTK Query's internal actions carry non-serializable values in
          // dev-only metadata; ignoring the known paths keeps the check useful
          // for our own actions instead of drowning it in noise.
          ignoredActions: [
            "api/executeQuery/fulfilled",
            "api/executeQuery/rejected",
          ],
          ignoredPaths: ["api.mutations", "api.queries"],
        },
        immutableCheck: process.env.NODE_ENV === "development",
      }).concat(baseApi.middleware),
    devTools: process.env.NODE_ENV !== "production",
  });

  // Wires up the refetchOnFocus / refetchOnReconnect flags set on baseApi.
  setupListeners(store.dispatch);

  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
