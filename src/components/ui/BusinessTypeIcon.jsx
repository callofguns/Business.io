import { ShoppingBag, Coffee, Laptop, Briefcase } from "lucide-react";
import clsx from "clsx";
import { businessTypeMeta } from "../../data/businessTypes";

const TYPE_ICONS = {
  "shopping-bag": ShoppingBag,
  coffee: Coffee,
  laptop: Laptop,
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

// The colored icon tile used for a business's type — on My Empire cards and
// in the "Start New Business" picker.
export function BusinessTypeIcon({ type, sizeClass = "h-14 w-14 rounded-2xl", iconSize = 24, className }) {
  const { icon, tone } = businessTypeMeta(type);
  const Icon = TYPE_ICONS[icon] ?? Briefcase;

  return (
    <span
      className={clsx(
        "flex shrink-0 items-center justify-center",
        sizeClass,
        TILE_TONES[tone] ?? TILE_TONES.neutral,
        className
      )}
    >
      <Icon size={iconSize} strokeWidth={2} />
    </span>
  );
}
