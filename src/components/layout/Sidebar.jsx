import {
  Home,
  Building2,
  ShoppingBag,
  Users,
  LineChart,
  Landmark,
  Receipt,
  Trophy,
  Lock,
} from "lucide-react";
import clsx from "clsx";

// Only "home" is wired up in this stage. The rest are listed so the shell's
// structure doesn't change shape as later stages come online — they just
// flip from disabled to enabled one at a time.
const NAV_ITEMS = [
  { key: "home", label: "Home", icon: Home, enabled: true },
  { key: "empire", label: "My Empire", icon: Building2, enabled: false },
  { key: "marketplace", label: "Marketplace", icon: ShoppingBag, enabled: false },
  { key: "hiring", label: "Hiring", icon: Users, enabled: false },
  { key: "finance", label: "Finance Manager", icon: LineChart, enabled: false },
  { key: "realestate", label: "Real Estate", icon: Landmark, enabled: false },
  { key: "tax", label: "Tax Office", icon: Receipt, enabled: false },
  { key: "rivals", label: "Rivals", icon: Trophy, enabled: false },
];

export function Sidebar({ current, onNavigate }) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-lg">
          🏙️
        </span>
        <span className="text-[17px] font-extrabold tracking-tight text-ink">business.io</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = current === item.key;
          return (
            <button
              key={item.key}
              disabled={!item.enabled}
              onClick={() => item.enabled && onNavigate(item.key)}
              className={clsx(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold transition-colors",
                active
                  ? "bg-brand-50 text-brand-600"
                  : item.enabled
                  ? "text-ink-soft hover:bg-surface-sunken hover:text-ink"
                  : "cursor-not-allowed text-ink-faint/70"
              )}
            >
              <Icon size={18} strokeWidth={2.25} />
              <span className="flex-1">{item.label}</span>
              {!item.enabled ? <Lock size={13} className="text-ink-faint/70" /> : null}
            </button>
          );
        })}
      </nav>

      <div className="rounded-xl bg-surface-sunken px-3 py-3 text-[12px] text-ink-faint">
        More screens unlock as we build them out, stage by stage.
      </div>
    </aside>
  );
}
