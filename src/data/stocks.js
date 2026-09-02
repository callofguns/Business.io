// A small fixed list of fictional stocks for the Finance Manager (Stage 6).
// Prices random-walk daily (see rollStockPrices in lib/economy.js) rather
// than tracking anything real -- this is flavor, not a market-data feed.
// volatility is the daily +/- swing as a fraction of price; dividendRate is
// the fraction of price paid out per share per day (0 for growth stocks
// that only ever pay off through price appreciation).
export const STOCKS = [
  { id: "nova", ticker: "NOVA", name: "Nova Systems", sector: "Tech", startPrice: 420, volatility: 0.05, dividendRate: 0 },
  { id: "evrl", ticker: "EVRL", name: "Everline Retail", sector: "Retail", startPrice: 180, volatility: 0.015, dividendRate: 0.0002 },
  { id: "solc", ticker: "SOLC", name: "Solace Energy", sector: "Energy", startPrice: 95, volatility: 0.015, dividendRate: 0.0002 },
  { id: "pncl", ticker: "PNCL", name: "Pinnacle Foods", sector: "Consumer Staples", startPrice: 140, volatility: 0.03, dividendRate: 0.0002 },
  { id: "vltx", ticker: "VLTX", name: "Voltrex Motors", sector: "Auto", startPrice: 560, volatility: 0.05, dividendRate: 0 },
  { id: "brmb", ticker: "BRMB", name: "Bramble Biotech", sector: "Biotech", startPrice: 75, volatility: 0.08, dividendRate: 0 },
  { id: "ancu", ticker: "ANCU", name: "Anchor Utilities", sector: "Utilities", startPrice: 60, volatility: 0.015, dividendRate: 0.0002 },
  { id: "qbyt", ticker: "QBYT", name: "Quantum Byte", sector: "Tech", startPrice: 850, volatility: 0.05, dividendRate: 0 },
];

export function stockById(id) {
  return STOCKS.find((s) => s.id === id) ?? null;
}
