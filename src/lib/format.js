import { CURRENCIES, DEFAULT_CURRENCY } from "../data/currencies";

// One fixed locale for every currency so formatting stays visually
// consistent app-wide (symbol first, comma thousands separator) instead of
// each currency's "native" convention (e.g. EUR often trails the symbol).
const FORMAT_LOCALE = "en-US";
const formatterCache = new Map();

function getFormatter(currencyCode, decimals) {
  const code = CURRENCIES[currencyCode] ? currencyCode : DEFAULT_CURRENCY;
  const key = `${code}:${decimals ? 2 : 0}`;
  if (!formatterCache.has(key)) {
    formatterCache.set(
      key,
      new Intl.NumberFormat(FORMAT_LOCALE, {
        style: "currency",
        currency: code,
        maximumFractionDigits: decimals ? 2 : 0,
      })
    );
  }
  return formatterCache.get(key);
}

export function formatMoney(value, { decimals = false, currency = DEFAULT_CURRENCY } = {}) {
  const n = Math.round(value * 100) / 100;
  return getFormatter(currency, decimals).format(n);
}

export function formatSigned(value, currency = DEFAULT_CURRENCY) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(value), { currency })}`;
}

export const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

// day is 1-indexed; returns 0-6 (Mon-Sun)
export function weekdayIndex(day) {
  return (day - 1) % 7;
}
