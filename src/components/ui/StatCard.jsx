import clsx from "clsx";
import { Card } from "./Card";

const TONE_CLASSES = {
  brand: "bg-brand-50 text-brand-600",
  good: "bg-good-50 text-good-600",
  warn: "bg-warn-50 text-warn-600",
  bad: "bg-bad-50 text-bad-600",
};

// Small icon-tile + label/value stat tile, used in a stat grid at the top
// of a detail screen (Business Detail, Tax Office).
export function StatCard({ icon: Icon, tone = "brand", label, value }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", TONE_CLASSES[tone])}>
        <Icon size={18} strokeWidth={2.25} />
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-ink-faint">{label}</p>
        <p className="truncate text-[16px] font-bold text-ink">{value}</p>
      </div>
    </Card>
  );
}
