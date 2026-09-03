import { LogOut, Settings } from "lucide-react";
import clsx from "clsx";
import { Modal } from "../ui/Modal";
import { NAV_ITEMS, MOBILE_SECONDARY_KEYS } from "./navItems";
import { useAuthStore } from "../../state/authStore";

const SECONDARY_ITEMS = MOBILE_SECONDARY_KEYS.map((key) => NAV_ITEMS.find((i) => i.key === key)).filter(Boolean);

// Mobile-only bottom sheet holding the screens that don't fit in the tab
// bar, plus Settings and "Switch player" — both of which used to live
// exclusively inside the now-hidden desktop Sidebar.
export function MoreSheet({ open, onClose, current, onNavigate, onOpenSettings }) {
  const logout = useAuthStore((s) => s.logout);

  const go = (key) => {
    onNavigate(key);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="More" placement="sheet">
      <nav aria-label="More" className="flex flex-col gap-1">
        {SECONDARY_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = current === item.key;
          return (
            <button
              key={item.key}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => go(item.key)}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold",
                active ? "bg-brand-50 text-brand-600" : "text-ink-soft hover:bg-surface-sunken hover:text-ink"
              )}
            >
              <Icon size={18} strokeWidth={2.25} />
              {item.label}
            </button>
          );
        })}

        <div className="my-1 border-t border-border" />

        <button
          type="button"
          onClick={() => {
            onOpenSettings();
            onClose();
          }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-ink-soft hover:bg-surface-sunken hover:text-ink"
        >
          <Settings size={18} strokeWidth={2.25} />
          Settings
        </button>
        <button
          type="button"
          onClick={() => {
            logout();
            onClose();
          }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-ink-soft hover:bg-surface-sunken hover:text-ink"
        >
          <LogOut size={18} strokeWidth={2.25} />
          Switch player
        </button>
      </nav>
    </Modal>
  );
}
