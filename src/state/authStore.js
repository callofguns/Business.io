import { create } from "zustand";

const STORAGE_KEY = "business-io-player-name";

// No backend here — this just gates entry into the game behind a name, the
// same way the reference app's "Welcome, Mas" implies a prior sign-in step.
// Stored locally like the theme preference.
function getStoredName() {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && stored.trim() ? stored : null;
}

export const useAuthStore = create((set) => ({
  playerName: getStoredName(),

  login: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    window.localStorage.setItem(STORAGE_KEY, trimmed);
    set({ playerName: trimmed });
  },

  logout: () => {
    window.localStorage.removeItem(STORAGE_KEY);
    set({ playerName: null });
  },
}));
