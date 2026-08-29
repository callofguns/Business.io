import { create } from "zustand";
import { CURRENCIES, DEFAULT_CURRENCY } from "../data/currencies";

const STORAGE_KEY = "business-io-currency";

function getStoredCurrency() {
  if (typeof window === "undefined") return DEFAULT_CURRENCY;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && CURRENCIES[stored] ? stored : DEFAULT_CURRENCY;
}

export const useCurrencyStore = create((set) => ({
  currency: getStoredCurrency(),
  setCurrency: (code) => {
    if (!CURRENCIES[code]) return;
    window.localStorage.setItem(STORAGE_KEY, code);
    set({ currency: code });
  },
}));
