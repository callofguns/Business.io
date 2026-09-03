import { MapPin, Gauge, Banknote, UserPlus, UserMinus } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { IconRow } from "../../components/ui/IconRow";
import { PillButton } from "../../components/ui/Button";
import { BusinessTypeIcon } from "../../components/ui/BusinessTypeIcon";
import { useGameStore } from "../../state/gameStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { buildingById } from "../../data/buildings";
import { staffHireCost, staffFireResult, dailyWagePerStaff, maxStaffFor } from "../../lib/economy";
import { formatMoney } from "../../lib/format";

export function StaffCard({ business }) {
  const bankBalance = useGameStore((s) => s.bankBalance);
  const hireStaff = useGameStore((s) => s.hireStaff);
  const fireStaff = useGameStore((s) => s.fireStaff);
  const currency = useCurrencyStore((s) => s.currency);

  const building = buildingById(business.buildingId);
  if (!building) return null;

  const staffCount = business.staffCount ?? 0;
  const maxStaff = maxStaffFor(building);
  const dailyWage = dailyWagePerStaff(business.type);
  const totalWage = staffCount * dailyWage;

  const hire = staffHireCost(business, building);
  const canAffordHire = hire && bankBalance >= hire.fee;
  const canHire = !!canAffordHire;
  const canFire = !!staffFireResult(business, building);

  const hireReason = !hire
    ? "Fully staffed for this building"
    : !canAffordHire
    ? "Not enough funds"
    : `Hire for ${formatMoney(hire.fee, { currency })} + ${formatMoney(hire.dailyWage, { currency })}/day`;
  const fireReason = canFire ? "Let go frees up a staff slot" : "No staff to let go";

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <BusinessTypeIcon type={business.type} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[16px] font-bold text-ink">{business.name}</h3>
          <IconRow icon={MapPin}>
            {building.city} · {building.area}
          </IconRow>
        </div>
        <span className="shrink-0 text-right text-[12.5px] font-bold text-ink">
          {staffCount}/{maxStaff} staff
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <IconRow icon={Gauge}>
          {business.currentCapacity}/{building.customerCapacity} capacity
        </IconRow>
        <IconRow icon={Banknote} iconClassName="text-good-500">
          {formatMoney(totalWage, { currency })}/day in wages
        </IconRow>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <p className="text-[12.5px] font-medium text-ink-faint">{hireReason}</p>
        <div className="flex items-center gap-2">
          <PillButton
            size="sm"
            variant="outline"
            icon={UserMinus}
            disabled={!canFire}
            title={fireReason}
            onClick={() => fireStaff({ businessId: business.id })}
          >
            Let go
          </PillButton>
          <PillButton
            size="sm"
            icon={UserPlus}
            disabled={!canHire}
            onClick={() => hireStaff({ businessId: business.id })}
          >
            Hire
          </PillButton>
        </div>
      </div>
    </Card>
  );
}
