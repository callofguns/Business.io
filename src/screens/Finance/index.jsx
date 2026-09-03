import { LineChart } from "lucide-react";
import { STOCKS } from "../../data/stocks";
import { useGameStore } from "../../state/gameStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { formatMoney } from "../../lib/format";
import { StatPill } from "../../components/ui/StatPill";
import { Page } from "../../components/layout/Page";
import { StockCard } from "./StockCard";

export function Finance() {
  const stockPrices = useGameStore((s) => s.stockPrices);
  const stockHoldings = useGameStore((s) => s.stockHoldings);
  const currency = useCurrencyStore((s) => s.currency);

  const portfolioValue = STOCKS.reduce((sum, stock) => {
    const shares = stockHoldings[stock.id]?.shares ?? 0;
    return sum + shares * (stockPrices[stock.id] ?? stock.startPrice);
  }, 0);
  const ownsAnyStock = STOCKS.some((stock) => (stockHoldings[stock.id]?.shares ?? 0) > 0);

  return (
    <Page maxWidth="5xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Finance Manager</h1>
          <p className="mt-1 text-[14px] text-ink-faint">Buy and sell shares in a small fictional market</p>
        </div>
        <StatPill icon={LineChart}>
          {ownsAnyStock ? `${formatMoney(portfolioValue, { currency })} portfolio` : "No positions yet"}
        </StatPill>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {STOCKS.map((stock) => (
          <StockCard key={stock.id} stock={stock} />
        ))}
      </div>
    </Page>
  );
}
