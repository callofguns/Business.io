import { motion } from "framer-motion";
import clsx from "clsx";
import { WEEKDAY_LABELS, weekdayIndex } from "../../lib/format";

export function WeekdayStrip({ day }) {
  const activeIndex = weekdayIndex(day);

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
      {WEEKDAY_LABELS.map((label, i) => {
        const active = i === activeIndex;
        return (
          <div key={i} className="relative flex h-8 w-8 items-center justify-center sm:h-9 sm:w-9">
            {active ? (
              <motion.div
                layoutId="weekday-highlight"
                className="absolute inset-0 rounded-full bg-brand-500"
                transition={{ type: "spring", stiffness: 620, damping: 34 }}
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
