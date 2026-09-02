import { motion } from "framer-motion";
import { Activity, Gauge, Banknote, Landmark, MapPin } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { IconRow } from "../../components/ui/IconRow";
import { PillButton } from "../../components/ui/Button";
import { BuildingTypeIcon } from "../../components/ui/BuildingTypeIcon";
import { BusinessTypeIcon } from "../../components/ui/BusinessTypeIcon";
import { useGameStore, buildingOccupant } from "../../state/gameStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { useUiStore } from "../../state/uiStore";
import { formatMoney } from "../../lib/format";

const cardTransition = { type: "spring", stiffness: 560, damping: 34, mass: 0.45 };

export function BuildingCard({ building, view, onAcquire }) {
  const bankBalance = useGameStore((s) => s.bankBalance);
  const acquisition = useGameStore((s) =>
    s.acquiredBuildings.find((a) => a.buildingId === building.id)
  );
  const occupant = useGameStore((s) => buildingOccupant(s, building.id));
  const marketValue = useGameStore((s) => s.buildingMarketValues[building.id] ?? building.buyPrice);
  const setScreen = useUiStore((s) => s.setScreen);
  const currency = useCurrencyStore((s) => s.currency);

  const canAfford = bankBalance >= building.rentDeposit;

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={cardTransition}>
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <BuildingTypeIcon type={building.type} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[16px] font-bold text-ink">{building.name}</h3>
            <IconRow icon={MapPin}>
              {building.city} · {building.area}
            </IconRow>
          </div>
          {acquisition ? (
            <Badge tone={acquisition.mode === "own" ? "brand" : "gold"} dot>
              {acquisition.mode === "own" ? "Owned" : "Leased"}
            </Badge>
          ) : (
            <Badge tone="neutral">Available</Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <IconRow icon={Activity}>Traffic {building.trafficIndex}</IconRow>
          <IconRow icon={Gauge}>{building.customerCapacity}/hr capacity</IconRow>
          <IconRow icon={Banknote} iconClassName="text-good-500">
            {formatMoney(building.dailyRent, { currency })}/day rent
          </IconRow>
          <IconRow icon={Landmark}>{formatMoney(marketValue, { currency })} to buy</IconRow>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          {view === "market" ? (
            acquisition ? (
              <p className="text-[12.5px] font-medium text-ink-faint">
                {acquisition.mode === "own"
                  ? "You own this building"
                  : `Leasing · ${formatMoney(building.dailyRent, { currency })}/day`}
              </p>
            ) : (
              <>
                <p className="text-[12.5px] font-medium text-ink-faint">
                  {canAfford ? "Rent or buy to use this space" : "Not enough funds"}
                </p>
                <PillButton size="sm" onClick={() => onAcquire(building)} disabled={!canAfford}>
                  Acquire
                </PillButton>
              </>
            )
          ) : occupant ? (
            <div className="flex items-center gap-2">
              <BusinessTypeIcon type={occupant.type} sizeClass="h-6 w-6 rounded-md" iconSize={13} />
              <p className="text-[12.5px] font-semibold text-ink">Occupied by {occupant.name}</p>
            </div>
          ) : (
            <>
              <p
                className={
                  acquisition?.mode === "rent"
                    ? "text-[12.5px] font-medium text-warn-600"
                    : "text-[12.5px] font-medium text-ink-faint"
                }
              >
                {acquisition?.mode === "rent"
                  ? `Vacant · paying ${formatMoney(building.dailyRent, { currency })}/day with no business here`
                  : "Vacant"}
              </p>
              <PillButton size="sm" variant="outline" onClick={() => setScreen("empire")}>
                Start a business here
              </PillButton>
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
