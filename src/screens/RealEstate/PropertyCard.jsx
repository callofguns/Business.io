import { MapPin, TrendingUp, TrendingDown, Minus, Banknote } from "lucide-react";
import clsx from "clsx";
import { Card } from "../../components/ui/Card";
import { IconRow } from "../../components/ui/IconRow";
import { PillButton } from "../../components/ui/Button";
import { BuildingTypeIcon } from "../../components/ui/BuildingTypeIcon";
import { BusinessTypeIcon } from "../../components/ui/BusinessTypeIcon";
import { useGameStore, buildingOccupant } from "../../state/gameStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { formatMoney, formatSigned } from "../../lib/format";
import { passiveRentalIncome } from "../../lib/economy";

export function PropertyCard({ building }) {
  const marketValue = useGameStore((s) => s.buildingMarketValues[building.id] ?? building.buyPrice);
  const occupant = useGameStore((s) => buildingOccupant(s, building.id));
  const sellBuilding = useGameStore((s) => s.sellBuilding);
  const currency = useCurrencyStore((s) => s.currency);

  const gain = marketValue - building.buyPrice;
  const gainPct = building.buyPrice > 0 ? (gain / building.buyPrice) * 100 : 0;
  const trendTone = gainPct > 0.05 ? "good" : gainPct < -0.05 ? "bad" : "neutral";
  const TrendIcon = trendTone === "good" ? TrendingUp : trendTone === "bad" ? TrendingDown : Minus;

  const rentalIncome = passiveRentalIncome(building);
  const canSell = !occupant;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <BuildingTypeIcon type={building.type} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[16px] font-bold text-ink">{building.name}</h3>
          <IconRow icon={MapPin}>
            {building.city} · {building.area}
          </IconRow>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[16px] font-bold text-ink">{formatMoney(marketValue, { currency })}</p>
          <p
            className={clsx(
              "flex items-center justify-end gap-0.5 text-[12px] font-bold",
              trendTone === "good" ? "text-good-600" : trendTone === "bad" ? "text-bad-600" : "text-ink-faint"
            )}
          >
            <TrendIcon size={12} strokeWidth={2.5} />
            {Math.abs(gainPct).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-surface-sunken px-4 py-2.5">
        <p className="text-[12.5px] text-ink-faint">Bought for {formatMoney(building.buyPrice, { currency })}</p>
        <p className={clsx("text-[13px] font-bold", gain >= 0 ? "text-good-600" : "text-bad-600")}>
          {formatSigned(gain, currency)}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        {occupant ? (
          <div className="flex items-center gap-2">
            <BusinessTypeIcon type={occupant.type} sizeClass="h-6 w-6 rounded-md" iconSize={13} />
            <p className="text-[12.5px] font-semibold text-ink">Occupied by {occupant.name}</p>
          </div>
        ) : (
          <IconRow icon={Banknote} iconClassName="text-good-500">
            {formatMoney(rentalIncome, { currency })}/day in rental income
          </IconRow>
        )}
        <PillButton
          size="sm"
          variant="outline"
          disabled={!canSell}
          onClick={() => sellBuilding({ buildingId: building.id })}
        >
          Sell
        </PillButton>
      </div>
    </Card>
  );
}
