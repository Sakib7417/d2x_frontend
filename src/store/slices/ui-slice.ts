import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Cross-cutting UI state.
 *
 * Scope rule: only state that genuinely spans unrelated component trees lives
 * here. Local component state stays local, and server state belongs to RTK
 * Query. Putting a modal's open/closed flag in Redux is the single most common
 * way these codebases rot, so the list below is intentionally short.
 */

export interface UiState {
  /** Desktop sidebar collapsed to icon rail. Persisted to localStorage. */
  sidebarCollapsed: boolean;
  /** Mobile off-canvas nav. Not persisted. */
  mobileNavOpen: boolean;
  /** ⌘K command palette. Global by nature — openable from anywhere. */
  commandPaletteOpen: boolean;
  /**
   * Privacy mode: masks every monetary figure as ••••.
   * A standard exchange affordance for using the app in public. Read by the
   * shared `<Money>` component so one flag covers the entire surface.
   */
  balancesHidden: boolean;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  mobileNavOpen: false,
  commandPaletteOpen: false,
  balancesHidden: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    sidebarToggled(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    sidebarCollapsedSet(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    mobileNavToggled(state) {
      state.mobileNavOpen = !state.mobileNavOpen;
    },
    mobileNavSet(state, action: PayloadAction<boolean>) {
      state.mobileNavOpen = action.payload;
    },
    commandPaletteSet(state, action: PayloadAction<boolean>) {
      state.commandPaletteOpen = action.payload;
    },
    commandPaletteToggled(state) {
      state.commandPaletteOpen = !state.commandPaletteOpen;
    },
    balancesVisibilityToggled(state) {
      state.balancesHidden = !state.balancesHidden;
    },
    balancesHiddenSet(state, action: PayloadAction<boolean>) {
      state.balancesHidden = action.payload;
    },
  },
});

export const {
  sidebarToggled,
  sidebarCollapsedSet,
  mobileNavToggled,
  mobileNavSet,
  commandPaletteSet,
  commandPaletteToggled,
  balancesVisibilityToggled,
  balancesHiddenSet,
} = uiSlice.actions;

export const uiReducer = uiSlice.reducer;

interface WithUi {
  ui: UiState;
}

export const selectSidebarCollapsed = (s: WithUi) => s.ui.sidebarCollapsed;
export const selectMobileNavOpen = (s: WithUi) => s.ui.mobileNavOpen;
export const selectCommandPaletteOpen = (s: WithUi) => s.ui.commandPaletteOpen;
export const selectBalancesHidden = (s: WithUi) => s.ui.balancesHidden;
