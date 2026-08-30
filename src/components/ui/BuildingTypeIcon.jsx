import { Store, Building2 } from "lucide-react";
import clsx from "clsx";

const TYPE_ICONS = {
  retail: Store,
  office: Building2,
};

const TILE_TONES = {
  retail: "bg-warn-50 text-warn-600",
  office: "bg-brand-50 text-brand-600",
};

// The colored icon tile for a building's type (retail/office) — mirrors
// BusinessTypeIcon's props/shape exactly so the two are interchangeable at
// a glance across the Marketplace and My Empire screens.
export function BuildingTypeIcon({ type, sizeClass = "h-14 w-14 rounded-2xl", iconSize = 24, className }) {
  const Icon = TYPE_ICONS[type] ?? Building2;

  return (
    <span
      className={clsx(
        "flex shrink-0 items-center justify-center",
        sizeClass,
        TILE_TONES[type] ?? TILE_TONES.office,
        className
      )}
    >
      <Icon size={iconSize} strokeWidth={2} />
    </span>
  );
}
