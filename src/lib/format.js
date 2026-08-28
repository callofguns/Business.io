const gbp0 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const gbp2 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 2,
});

export function formatMoney(value, { decimals = false } = {}) {
  const n = Math.round(value * 100) / 100;
  return decimals ? gbp2.format(n) : gbp0.format(n);
}

export function formatSigned(value) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(value))}`;
}

export const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

// day is 1-indexed; returns 0-6 (Mon-Sun)
export function weekdayIndex(day) {
  return (day - 1) % 7;
}
