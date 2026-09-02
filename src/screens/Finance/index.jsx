import { LineChart } from "lucide-react";
import { STOCKS } from "../../data/stocks";
import { useGameStore } from "../../state/gameStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { formatMoney } from "../../lib/format";
import { StockCard } from "./StockCard";

export function Finance() {
  const stockPrices = useGameStore((s) => s.stockPrices);
  const stockHoldings = useGameStore((s) => s.stockHoldings);
  const currency = useCurrencyStore((s) => s.currency);

  const portfolioValue = STOCKS.reduce((sum, stock) => {
    const shares = stockHoldings[stock.id]?.shares ?? 0;
    return sum + shares * (stockPrices[stock.id] ?? stock.startPrice);
  }, 0);

  return (
    <div className="mx-auto max-w-5xl px-10 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Finance Manager</h1>
          <p className="mt-1 text-[14px] text-ink-faint">Buy and sell shares in a small fictional market</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-bold text-brand-600">
          <LineChart size={15} strokeWidth={2.5} />
          {formatMoney(portfolioValue, { currency })} portfolio
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {STOCKS.map((stock) => (
          <StockCard key={stock.id} stock={stock} />
        ))}
      </div>
    </div>
  );
}
