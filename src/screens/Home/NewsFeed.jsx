import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import {
  Briefcase,
  Banknote,
  TrendingUp,
  TrendingDown,
  Landmark,
  Truck,
  Newspaper,
  Package,
  Megaphone,
  Receipt,
  Users,
  Trophy,
} from "lucide-react";

const ICONS = {
  briefcase: Briefcase,
  banknote: Banknote,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  landmark: Landmark,
  truck: Truck,
  newspaper: Newspaper,
  package: Package,
  megaphone: Megaphone,
  receipt: Receipt,
  users: Users,
  trophy: Trophy,
};

const TILE_TONES = {
  good: "bg-good-50 text-good-600",
  bad: "bg-bad-50 text-bad-600",
  neutral: "bg-brand-50 text-brand-600",
};

function relativeDayLabel(entryDay, currentDay) {
  const diff = currentDay - entryDay;
  if (diff <= 0) return "now";
  if (diff === 1) return "1d ago";
  return `${diff}d ago`;
}

const itemTransition = { type: "spring", stiffness: 560, damping: 36, mass: 0.45 };

export function NewsFeed({ entries, currentDay }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-10 text-center">
        <p className="text-[13.5px] font-semibold text-ink">No news yet</p>
        <p className="text-[12.5px] text-ink-faint">Advance a day to see updates here.</p>
      </div>
    );
  }

  return (
    <ul aria-live="polite" className="flex flex-col divide-y divide-border">
      <AnimatePresence initial={false}>
        {entries.map((entry) => {
          const Icon = ICONS[entry.icon] ?? Newspaper;
          return (
            <motion.li
              key={entry.id}
              layout
              initial={{ opacity: 0, y: -14, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={itemTransition}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span
                className={clsx(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  TILE_TONES[entry.tone] ?? TILE_TONES.neutral
                )}
              >
                <Icon size={16} strokeWidth={2.25} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-ink">{entry.title}</p>
                {entry.subtitle ? (
                  <p className="truncate text-[12.5px] text-ink-faint">{entry.subtitle}</p>
                ) : null}
              </div>
              <span className="shrink-0 text-[12px] font-medium text-ink-faint">
                {relativeDayLabel(entry.day, currentDay)}
              </span>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
