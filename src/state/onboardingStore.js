import { create } from "zustand";

const STORAGE_KEY = "business-io-intro-seen";

// Same hand-rolled localStorage idiom as authStore/themeStore/currencyStore
// (this codebase doesn't use zustand/middleware's `persist` anywhere).
// playerName alone can't signal "first run" — it persists across reloads —
// so this gets its own key. logout() deliberately does NOT clear it:
// "Switch player" shouldn't force a returning player back through the intro.
function getStoredIntroSeen() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export const useOnboardingStore = create((set) => ({
  introSeen: getStoredIntroSeen(),
  completeIntro: () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    set({ introSeen: true });
  },
  // Doesn't touch the stored flag — closing the modal again (Skip, or
  // finishing the last step) is what calls completeIntro and persists it.
  replayIntro: () => set({ introSeen: false }),
}));
