import { useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import clsx from "clsx";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { PillButton } from "../../components/ui/Button";
import { useGameStore } from "../../state/gameStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { formatMoney, formatSigned } from "../../lib/format";
import { PriceChart } from "./PriceChart";

export function StockCard({ stock }) {
  const bankBalance = useGameStore((s) => s.bankBalance);
  const price = useGameStore((s) => s.stockPrices[stock.id] ?? stock.startPrice);
  const history = useGameStore((s) => s.stockPriceHistory[stock.id] ?? []);
  const holding = useGameStore((s) => s.stockHoldings[stock.id]);
  const buyStock = useGameStore((s) => s.buyStock);
  const sellStock = useGameStore((s) => s.sellStock);
  const currency = useCurrencyStore((s) => s.currency);
  const [sharesInput, setSharesInput] = useState("1");

  const qty = Math.max(0, Math.floor(Number.parseInt(sharesInput, 10) || 0));
  const prevPrice = history.length >= 2 ? history[history.length - 2].price : price;
  const changePct = prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0;
  const trendTone = changePct > 0.001 ? "good" : changePct < -0.001 ? "bad" : "neutral";
  const TrendIcon = trendTone === "good" ? TrendingUp : trendTone === "bad" ? TrendingDown : Minus;

  const heldShares = holding?.shares ?? 0;
  const avgCost = holding?.avgCost ?? 0;
  const unrealizedPL = heldShares > 0 ? (price - avgCost) * heldShares : 0;

  const cost = qty * price;
  const canBuy = qty > 0 && bankBalance >= cost;
  const canSell = qty > 0 && heldShares >= qty;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-bold text-ink">{stock.ticker}</h3>
            <Badge tone="neutral">{stock.sector}</Badge>
          </div>
          <p className="truncate text-[12.5px] text-ink-faint">{stock.name}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[16px] font-bold text-ink">{formatMoney(price, { currency, decimals: true })}</p>
          <p
            className={clsx(
              "flex items-center justify-end gap-0.5 text-[12px] font-bold",
              trendTone === "good" ? "text-good-600" : trendTone === "bad" ? "text-bad-600" : "text-ink-faint"
            )}
          >
            <TrendIcon size={12} strokeWidth={2.5} />
            {Math.abs(changePct).toFixed(1)}%
          </p>
        </div>
      </div>

      <PriceChart history={history} tone={trendTone} />

      {heldShares > 0 ? (
        <div className="flex items-center justify-between rounded-2xl bg-surface-sunken px-4 py-2.5">
          <p className="text-[12.5px] text-ink-faint">
            {heldShares} sh · avg {formatMoney(avgCost, { currency, decimals: true })}
          </p>
          <p className={clsx("text-[13px] font-bold", unrealizedPL >= 0 ? "text-good-600" : "text-bad-600")}>
            {formatSigned(unrealizedPL, currency)}
          </p>
        </div>
      ) : stock.dividendRate > 0 ? (
        <p className="text-[11.5px] text-ink-faint">Pays a daily dividend to holders</p>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <div className="flex h-9 items-center rounded-xl border border-border-strong bg-surface px-2.5">
          <input
            type="number"
            min="1"
            step="1"
            value={sharesInput}
            onChange={(e) => setSharesInput(e.target.value)}
            className="h-full w-14 bg-transparent text-right text-[13px] font-semibold text-ink focus:outline-none"
          />
          <span className="ml-1 text-[12px] text-ink-faint">sh</span>
        </div>
        <div className="flex items-center gap-2">
          <PillButton
            size="sm"
            variant="outline"
            disabled={!canSell}
            onClick={() => sellStock({ stockId: stock.id, shares: qty })}
          >
            Sell
          </PillButton>
          <PillButton size="sm" disabled={!canBuy} onClick={() => buyStock({ stockId: stock.id, shares: qty })}>
            Buy
          </PillButton>
        </div>
      </div>
    </Card>
  );
}
