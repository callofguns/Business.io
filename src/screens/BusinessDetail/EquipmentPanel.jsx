import { Wrench, Plus, Minus } from "lucide-react";
import { Card, SectionHeading } from "../../components/ui/Card";
import { PillButton } from "../../components/ui/Button";
import { useGameStore } from "../../state/gameStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { formatMoney } from "../../lib/format";
import { equipmentFor } from "../../data/equipment";

// Stage 13: capacity comes entirely from equipment now, not staff -- this
// is the primary lever for growing how many customers a business can
// serve, capped at the building's own customerCapacity.
export function EquipmentPanel({ business, building }) {
  const bankBalance = useGameStore((s) => s.bankBalance);
  const buyEquipment = useGameStore((s) => s.buyEquipment);
  const sellEquipment = useGameStore((s) => s.sellEquipment);
  const currency = useCurrencyStore((s) => s.currency);

  if (!building) return null;

  const catalog = equipmentFor(business.type);
  const atMaxCapacity = business.currentCapacity >= building.customerCapacity;

  return (
    <Card className="mt-4">
      <SectionHeading
        icon={Wrench}
        title="Equipment"
        subtitle={`${business.currentCapacity}/${building.customerCapacity} capacity in use`}
      />
      <div className="flex flex-col gap-2.5">
        {catalog.map((item) => {
          const owned = business.equipment?.[item.id] ?? 0;
          const canBuy = !atMaxCapacity && bankBalance >= item.cost;
          const canSell = owned > 0;
          return (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-sunken px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-ink">{item.name}</p>
                <p className="text-[12px] text-ink-faint">
                  +{item.capacity} capacity · {formatMoney(item.cost, { currency })} each
                  {owned > 0 ? ` · ${owned} owned` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <PillButton
                  size="sm"
                  variant="outline"
                  icon={Minus}
                  disabled={!canSell}
                  title={canSell ? `Sell for ${formatMoney(item.sellValue, { currency })}` : "None owned to sell"}
                  onClick={() => sellEquipment({ businessId: business.id, equipmentId: item.id })}
                >
                  Sell
                </PillButton>
                <PillButton
                  size="sm"
                  icon={Plus}
                  disabled={!canBuy}
                  title={
                    atMaxCapacity
                      ? "Already at the building's max capacity"
                      : bankBalance < item.cost
                      ? "Not enough funds"
                      : undefined
                  }
                  onClick={() => buyEquipment({ businessId: business.id, equipmentId: item.id })}
                >
                  Buy
                </PillButton>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
