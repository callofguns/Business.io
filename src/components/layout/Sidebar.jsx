import { LogOut, Settings } from "lucide-react";
import clsx from "clsx";
import { NAV_ITEMS } from "./navItems";
import { useAuthStore } from "../../state/authStore";

// Desktop only — hidden below md, where MobileTabBar + MoreSheet take over.
// Settings/Changelog are owned by AppShell now (see AppShell.jsx) so they
// can be opened from either this sidebar or the mobile MoreSheet.
export function Sidebar({ current, onNavigate, onOpenSettings }) {
  const playerName = useAuthStore((s) => s.playerName);
  const logout = useAuthStore((s) => s.logout);
  const initial = playerName ? playerName.trim().charAt(0).toUpperCase() : "?";

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-lg">
          <span aria-hidden="true">🏙️</span>
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

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          // The Business Detail screen is reached from My Empire and has no
          // nav entry of its own -- keep "My Empire" highlighted while it's
          // open rather than showing no active item at all.
          const active = current === item.key || (item.key === "empire" && current === "businessDetail");
          return (
            <button
              key={item.key}
              aria-current={active ? "page" : undefined}
              onClick={() => onNavigate(item.key)}
              className={clsx(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold transition-colors",
                active ? "bg-brand-50 text-brand-600" : "text-ink-soft hover:bg-surface-sunken hover:text-ink"
              )}
            >
              <Icon size={18} strokeWidth={2.25} />
              <span className="flex-1">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-ink-soft hover:bg-surface-sunken hover:text-ink"
        >
          <Settings size={18} strokeWidth={2.25} />
          <span className="flex-1">Settings</span>
        </button>
      </div>
    </aside>
  );
}
