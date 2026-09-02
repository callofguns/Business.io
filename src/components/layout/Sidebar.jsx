import { useState } from "react";
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
  LogOut,
  Settings,
} from "lucide-react";
import clsx from "clsx";
import { SettingsModal } from "./SettingsModal";
import { ChangelogModal } from "./ChangelogModal";
import { useAuthStore } from "../../state/authStore";

// Only "home" is wired up in this stage. The rest are listed so the shell's
// structure doesn't change shape as later stages come online — they just
// flip from disabled to enabled one at a time.
const NAV_ITEMS = [
  { key: "home", label: "Home", icon: Home, enabled: true },
  { key: "empire", label: "My Empire", icon: Building2, enabled: true },
  { key: "marketplace", label: "Marketplace", icon: ShoppingBag, enabled: true },
  { key: "hiring", label: "Hiring", icon: Users, enabled: true },
  { key: "finance", label: "Finance Manager", icon: LineChart, enabled: true },
  { key: "realestate", label: "Real Estate", icon: Landmark, enabled: true },
  { key: "tax", label: "Tax Office", icon: Receipt, enabled: true },
  { key: "rivals", label: "Rivals", icon: Trophy, enabled: false },
];

export function Sidebar({ current, onNavigate }) {
  const playerName = useAuthStore((s) => s.playerName);
  const logout = useAuthStore((s) => s.logout);
  const initial = playerName ? playerName.trim().charAt(0).toUpperCase() : "?";
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-lg">
          🏙️
        </span>
        <span className="text-[17px] font-extrabold tracking-tight text-ink">business.io</span>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-xl bg-surface-sunken px-3 py-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[13px] font-bold text-white">
          {initial}
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">
          {playerName}
        </span>
        <button
          type="button"
          onClick={logout}
          aria-label="Switch player"
          title="Switch player"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-border-strong hover:text-ink"
        >
          <LogOut size={14} strokeWidth={2.25} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          // The Business Detail screen is reached from My Empire and has no
          // nav entry of its own -- keep "My Empire" highlighted while it's
          // open rather than showing no active item at all.
          const active = current === item.key || (item.key === "empire" && current === "businessDetail");
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

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-ink-soft hover:bg-surface-sunken hover:text-ink"
        >
          <Settings size={18} strokeWidth={2.25} />
          <span className="flex-1">Settings</span>
        </button>
        <div className="rounded-xl bg-surface-sunken px-3 py-3 text-[12px] text-ink-faint">
          More screens unlock as we build them out, stage by stage.
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenChangelog={() => {
          setSettingsOpen(false);
          setChangelogOpen(true);
        }}
      />
      <ChangelogModal open={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </aside>
  );
}
