import { MoreHorizontal } from "lucide-react";
import clsx from "clsx";
import { NAV_ITEMS, MOBILE_PRIMARY_KEYS, MOBILE_SECONDARY_KEYS } from "./navItems";

const PRIMARY_ITEMS = MOBILE_PRIMARY_KEYS.map((key) => NAV_ITEMS.find((i) => i.key === key)).filter(Boolean);

// Replaces the sidebar below md: 4 primary destinations plus a "More" sheet
// for everything else (see MoreSheet.jsx). Fixed to the bottom, safe-area
// aware for phones with a home-indicator gesture bar.
export function MobileTabBar({ current, onNavigate, onOpenMore }) {
  const moreActive = MOBILE_SECONDARY_KEYS.includes(current);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {PRIMARY_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = current === item.key || (item.key === "empire" && current === "businessDetail");
        return (
          <button
            key={item.key}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onNavigate(item.key)}
            className={clsx(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold",
              active ? "text-brand-600" : "text-ink-faint"
            )}
          >
            <Icon size={20} strokeWidth={2.25} />
            <span className="w-full truncate px-1 text-center">{item.shortLabel}</span>
          </button>
        );
      })}
      <button
        type="button"
        aria-current={moreActive ? "page" : undefined}
        onClick={onOpenMore}
        className={clsx(
          "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold",
          moreActive ? "text-brand-600" : "text-ink-faint"
        )}
      >
        <MoreHorizontal size={20} strokeWidth={2.25} />
        <span className="w-full truncate px-1 text-center">More</span>
      </button>
    </nav>
  );
}
