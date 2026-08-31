import { Briefcase, MapPin, Banknote, Gauge, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { IconRow } from "../../components/ui/IconRow";
import { AnimatedMoney } from "../../components/ui/AnimatedMoney";
import { BusinessTypeIcon } from "../../components/ui/BusinessTypeIcon";
import { useUiStore } from "../../state/uiStore";
import { buildingById } from "../../data/buildings";

const cardTransition = { type: "spring", stiffness: 380, damping: 32, mass: 0.6 };

export function BusinessCard({ business }) {
  const { name, type, active, dailyEarnings, currentCapacity, buildingId } = business;
  const openBusinessDetail = useUiStore((s) => s.openBusinessDetail);

  const building = buildingById(buildingId);

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={cardTransition}>
      <Card className="flex flex-col">
        <button
          type="button"
          onClick={() => openBusinessDetail(business.id)}
          className="-m-1 flex items-center gap-4 rounded-2xl p-1 text-left transition-colors hover:bg-surface-sunken"
        >
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
        </button>
      </Card>
    </motion.div>
  );
}
