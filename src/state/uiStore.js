import { create } from "zustand";

// Tracks which top-level screen is showing. Kept separate from gameStore so
// navigation state and simulation state can evolve independently as more
// screens come online.
export const useUiStore = create((set) => ({
  screen: "home",
  // Which business the "businessDetail" screen is showing. Only meaningful
  // while screen === "businessDetail"; left stale otherwise (harmless,
  // since nothing reads it unless that screen is active).
  selectedBusinessId: null,
  setScreen: (screen) => set({ screen }),
  openBusinessDetail: (businessId) => set({ screen: "businessDetail", selectedBusinessId: businessId }),
}));
