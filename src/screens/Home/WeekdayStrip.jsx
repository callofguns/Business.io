import { motion } from "framer-motion";
import clsx from "clsx";
import { WEEKDAY_LABELS, weekdayIndex } from "../../lib/format";

export function WeekdayStrip({ day }) {
  const activeIndex = weekdayIndex(day);

  return (
    <div className="flex items-center justify-center gap-2.5">
      {WEEKDAY_LABELS.map((label, i) => {
        const active = i === activeIndex;
        return (
          <div key={i} className="relative flex h-9 w-9 items-center justify-center">
            {active ? (
              <motion.div
                layoutId="weekday-highlight"
                className="absolute inset-0 rounded-full bg-brand-500"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            ) : null}
            <span
              className={clsx(
                "relative text-[13px] font-bold transition-colors",
                active ? "text-white" : "text-ink-faint"
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
