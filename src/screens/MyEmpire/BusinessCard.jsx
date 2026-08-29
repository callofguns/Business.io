import {
  Coffee,
  Dumbbell,
  Utensils,
  Scissors,
  Croissant,
  Book,
  Briefcase,
  MapPin,
  Banknote,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { IconRow } from "../../components/ui/IconRow";
import { AnimatedMoney } from "../../components/ui/AnimatedMoney";
import { businessTypeMeta } from "../../data/businessTypes";

const TYPE_ICONS = {
  coffee: Coffee,
  dumbbell: Dumbbell,
  utensils: Utensils,
  scissors: Scissors,
  croissant: Croissant,
  book: Book,
  briefcase: Briefcase,
};

const TILE_TONES = {
  brand: "bg-brand-50 text-brand-600",
  good: "bg-good-50 text-good-600",
  warn: "bg-warn-50 text-warn-600",
  bad: "bg-bad-50 text-bad-600",
  gold: "bg-gold-300/30 text-gold-600",
  neutral: "bg-surface-sunken text-ink-soft",
};

const cardTransition = { type: "spring", stiffness: 380, damping: 32, mass: 0.6 };

export function BusinessCard({ business }) {
  const { name, type, location, active, dailyEarnings } = business;
  const { icon, tone } = businessTypeMeta(type);
  const TypeIcon = TYPE_ICONS[icon] ?? Briefcase;

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={cardTransition}>
      <Card className="flex items-center gap-4">
        <span
          className={clsx(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
            TILE_TONES[tone] ?? TILE_TONES.neutral
          )}
        >
          <TypeIcon size={24} strokeWidth={2} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-[16px] font-bold text-ink">{name}</h3>
            <Badge tone={active ? "good" : "neutral"} dot>
              {active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            <IconRow icon={MapPin}>
              {location.city} · {location.area}
            </IconRow>
            <IconRow icon={Briefcase}>{type}</IconRow>
            <IconRow icon={Banknote} iconClassName="text-good-500" emphasis>
              <AnimatedMoney value={dailyEarnings} className="tabular-nums" />
            </IconRow>
          </div>
        </div>

        <ChevronRight size={18} className="shrink-0 text-ink-faint" />
      </Card>
    </motion.div>
  );
}
