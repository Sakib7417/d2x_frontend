import { useDispatch, useSelector, useStore } from "react-redux";

import type { AppDispatch, AppStore, RootState } from "./index";

/**
 * Pre-typed Redux hooks.
 *
 * Always use these instead of the bare `useDispatch` / `useSelector`, so that
 * `RootState` and thunk-aware `AppDispatch` types flow through without a cast
 * at every call site.
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
