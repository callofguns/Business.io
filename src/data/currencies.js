// Supported display currencies. This is purely cosmetic — switching
// currency changes the symbol/formatting only, it does not convert the
// underlying numbers (no exchange rates), same as most tycoon-style games.
export const CURRENCIES = {
  USD: { code: "USD", symbol: "$", label: "US Dollar" },
  GBP: { code: "GBP", symbol: "£", label: "British Pound" },
  EUR: { code: "EUR", symbol: "€", label: "Euro" },
  JPY: { code: "JPY", symbol: "¥", label: "Japanese Yen" },
};

export const DEFAULT_CURRENCY = "USD";

export const CURRENCY_LIST = Object.values(CURRENCIES);
