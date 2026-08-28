import { create } from "zustand";

const STORAGE_KEY = "business-io-theme";

// Keep this logic identical to the inline script in index.html — that script
// sets the class before first paint; this just needs to agree with it so
// React's state matches what's already on <html>.
function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    set({ theme: next });
  },
}));

// Applies the theme to <html> and persists it — called from a single effect
// at the app root so the store itself stays a plain, side-effect-free slice.
export function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(STORAGE_KEY, theme);
}
