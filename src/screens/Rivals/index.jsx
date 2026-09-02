import { useMemo } from "react";
import { Trophy } from "lucide-react";
import clsx from "clsx";
import { Card, SectionHeading } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useGameStore } from "../../state/gameStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { formatMoney } from "../../lib/format";
import { computeNetWorth, computeLeaderboard } from "../../lib/economy";

const RANK_BADGE_TONE = { 1: "gold", 2: "brand", 3: "brand" };

export function Rivals() {
  const bankBalance = useGameStore((s) => s.bankBalance);
  const businesses = useGameStore((s) => s.businesses);
  const productPrices = useGameStore((s) => s.productPrices);
  const day = useGameStore((s) => s.day);
  const stockHoldings = useGameStore((s) => s.stockHoldings);
  const stockPrices = useGameStore((s) => s.stockPrices);
  const acquiredBuildings = useGameStore((s) => s.acquiredBuildings);
  const buildingMarketValues = useGameStore((s) => s.buildingMarketValues);
  const rivalNetWorths = useGameStore((s) => s.rivalNetWorths);
  const currency = useCurrencyStore((s) => s.currency);

  const leaderboard = useMemo(
    () =>
      computeLeaderboard(
        computeNetWorth({
          bankBalance,
          businesses,
          productPrices,
          day,
          stockHoldings,
          stockPrices,
          acquiredBuildings,
          buildingMarketValues,
        }),
        rivalNetWorths
      ),
    [
      bankBalance,
      businesses,
      productPrices,
      day,
      stockHoldings,
      stockPrices,
      acquiredBuildings,
      buildingMarketValues,
      rivalNetWorths,
    ]
  );

  const playerRank = leaderboard.findIndex((e) => e.isPlayer) + 1;

  return (
    <div className="mx-auto max-w-3xl px-10 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Rivals</h1>
          <p className="mt-1 text-[14px] text-ink-faint">See how your empire stacks up, ranked by net worth</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-bold text-brand-600">
          <Trophy size={15} strokeWidth={2.5} />
          #{playerRank} of {leaderboard.length}
        </span>
      </div>

      <Card>
        <SectionHeading icon={Trophy} iconTone="gold" title="Leaderboard" subtitle="Ranked by total net worth" />
        <ul className="flex flex-col divide-y divide-border">
          {leaderboard.map((entry, i) => {
            const rank = i + 1;
            return (
              <li
                key={entry.id}
                className={clsx(
                  "flex items-center gap-3 py-3 first:pt-0 last:pb-0",
                  entry.isPlayer && "-mx-3 rounded-xl bg-brand-50 px-3"
                )}
              >
                <Badge tone={RANK_BADGE_TONE[rank] ?? "neutral"} className="w-8 shrink-0 justify-center">
                  {rank}
                </Badge>
                <p
                  className={clsx(
                    "min-w-0 flex-1 truncate text-[14px] font-semibold",
                    entry.isPlayer ? "text-brand-600" : "text-ink"
                  )}
                >
                  {entry.name}
                </p>
                <p className={clsx("shrink-0 text-[14px] font-bold", entry.isPlayer ? "text-brand-600" : "text-ink")}>
                  {formatMoney(entry.netWorth, { currency })}
                </p>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
