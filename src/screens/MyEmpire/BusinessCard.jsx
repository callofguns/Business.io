import { Briefcase, MapPin, Banknote, Gauge, ChevronRight, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { IconRow } from "../../components/ui/IconRow";
import { AnimatedMoney } from "../../components/ui/AnimatedMoney";
import { BusinessTypeIcon } from "../../components/ui/BusinessTypeIcon";
import { PillButton } from "../../components/ui/Button";
import { useGameStore } from "../../state/gameStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { formatMoney } from "../../lib/format";
import { capacityUpgrade } from "../../lib/economy";
import { buildingById } from "../../data/buildings";

const cardTransition = { type: "spring", stiffness: 380, damping: 32, mass: 0.6 };

export function BusinessCard({ business }) {
  const { name, type, active, dailyEarnings, currentCapacity, buildingId } = business;
  const bankBalance = useGameStore((s) => s.bankBalance);
  const investInCapacity = useGameStore((s) => s.investInCapacity);
  const currency = useCurrencyStore((s) => s.currency);

  const building = buildingById(buildingId);
  const upgrade = building ? capacityUpgrade(business, building) : null;
  const atMax = building && !upgrade;
  const canAffordUpgrade = upgrade ? bankBalance >= upgrade.cost : false;

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={cardTransition}>
      <Card className="flex flex-col">
        <div className="flex items-center gap-4">
          <BusinessTypeIcon type={type} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-[16px] font-bold text-ink">{name}</h3>
              <Badge tone={active ? "good" : "neutral"} dot>
                {active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
              {building ? (
                <IconRow icon={MapPin}>
                  {building.city} · {building.area}
                </IconRow>
              ) : null}
              <IconRow icon={Briefcase}>{type}</IconRow>
              {building ? (
                <IconRow icon={Gauge}>
                  {currentCapacity}/{building.customerCapacity} per hour
                </IconRow>
              ) : null}
              <IconRow icon={Banknote} iconClassName="text-good-500" emphasis>
                <AnimatedMoney value={dailyEarnings} className="tabular-nums" />
              </IconRow>
            </div>
          </div>

          <ChevronRight size={18} className="shrink-0 text-ink-faint" />
        </div>

        {building ? (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
            <p className="text-[12.5px] text-ink-faint">
              {atMax
                ? "At building capacity"
                : `+${upgrade.step}/hr for ${formatMoney(upgrade.cost, { currency })}`}
            </p>
            <PillButton
              size="sm"
              variant="outline"
              icon={TrendingUp}
              disabled={atMax || !canAffordUpgrade}
              onClick={() => investInCapacity({ businessId: business.id })}
            >
              Invest in Capacity
            </PillButton>
          </div>
        ) : null}
      </Card>
    </motion.div>
  );
}
