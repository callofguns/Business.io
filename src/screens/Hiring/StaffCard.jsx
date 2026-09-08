import { MapPin, Smile, Banknote, UserPlus, X } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { IconRow } from "../../components/ui/IconRow";
import { PillButton } from "../../components/ui/Button";
import { BusinessTypeIcon } from "../../components/ui/BusinessTypeIcon";
import { useGameStore } from "../../state/gameStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { buildingById } from "../../data/buildings";
import { BUSINESS_TYPES } from "../../data/businessTypes";
import { staffHireCost, dailyWagePerStaff, maxStaffFor, roleMaxFor, staffSatisfactionBonusFor } from "../../lib/economy";
import { formatMoney } from "../../lib/format";

// One named-roster sub-section per role (Stage 14) -- e.g. "Cashier · 2/3"
// with a Hire button and a list of named employees, each removable.
function RoleGroup({ business, building, role, employees, currency }) {
  const bankBalance = useGameStore((s) => s.bankBalance);
  const hireStaff = useGameStore((s) => s.hireStaff);
  const fireStaff = useGameStore((s) => s.fireStaff);

  const roleMax = roleMaxFor(building);
  const hire = staffHireCost(business, building, role);
  const canAffordHire = hire && bankBalance >= hire.fee;
  const canHire = !!canAffordHire;
  const hireReason = !hire
    ? `${role} role is full`
    : !canAffordHire
    ? "Not enough funds"
    : `Hire for ${formatMoney(hire.fee, { currency })} + ${formatMoney(hire.dailyWage, { currency })}/day`;

  return (
    <div className="rounded-2xl bg-surface-sunken p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-ink">
          {role} · {employees.length}/{roleMax}
        </span>
        <PillButton
          size="sm"
          icon={UserPlus}
          disabled={!canHire}
          title={hireReason}
          onClick={() => hireStaff({ businessId: business.id, role })}
        >
          Hire
        </PillButton>
      </div>
      {employees.length === 0 ? (
        <p className="text-[12px] text-ink-faint">No {role.toLowerCase()}s hired yet</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {employees.map((employee) => (
            <li key={employee.id} className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">
                  {employee.name.charAt(0)}
                </span>
                <span className="truncate text-[12.5px] font-medium text-ink">{employee.name}</span>
              </div>
              <button
                type="button"
                aria-label={`Let ${employee.name} go`}
                title={`Let ${employee.name} go`}
                onClick={() => fireStaff({ businessId: business.id, employeeId: employee.id })}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-border-strong hover:text-bad-600"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StaffCard({ business }) {
  const currency = useCurrencyStore((s) => s.currency);
  const building = buildingById(business.buildingId);
  if (!building) return null;

  const employees = business.employees ?? [];
  const staffCount = employees.length;
  const maxStaff = maxStaffFor(building);
  const dailyWage = dailyWagePerStaff(business.type);
  const totalWage = staffCount * dailyWage;

  const satisfactionBonus = staffSatisfactionBonusFor(staffCount, building);
  const satisfactionBonusLabel = `${satisfactionBonus >= 0 ? "+" : ""}${satisfactionBonus} to satisfaction target`;
  const roles = BUSINESS_TYPES[business.type].roles;

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
        <IconRow icon={Smile} iconClassName={satisfactionBonus >= 0 ? "text-good-500" : "text-bad-500"}>
          {satisfactionBonusLabel}
        </IconRow>
        <IconRow icon={Banknote} iconClassName="text-good-500">
          {formatMoney(totalWage, { currency })}/day in wages
        </IconRow>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        {roles.map((role) => (
          <RoleGroup
            key={role}
            business={business}
            building={building}
            role={role}
            employees={employees.filter((e) => e.role === role)}
            currency={currency}
          />
        ))}
      </div>
    </Card>
  );
}
