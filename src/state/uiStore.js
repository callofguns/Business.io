import { create } from "zustand";

// Tracks which top-level screen is showing. Kept separate from gameStore so
// navigation state and simulation state can evolve independently as more
// screens come online.
export const useUiStore = create((set) => ({
  screen: "home",
  setScreen: (screen) => set({ screen }),
}));
