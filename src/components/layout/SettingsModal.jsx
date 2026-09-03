import clsx from "clsx";
import { History, Sparkles } from "lucide-react";
import { Modal } from "../ui/Modal";
import { ThemeToggle } from "../ui/ThemeToggle";
import { PillButton } from "../ui/Button";
import { useCurrencyStore } from "../../state/currencyStore";
import { useOnboardingStore } from "../../state/onboardingStore";
import { CURRENCY_LIST } from "../../data/currencies";
import { APP_VERSION } from "../../data/changelog";

export function SettingsModal({ open, onClose, onOpenChangelog }) {
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const replayIntro = useOnboardingStore((s) => s.replayIntro);

  return (
    <Modal open={open} onClose={onClose} title="Settings" className="max-w-sm">
      <div className="flex flex-col gap-5">
        <section>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            Appearance
          </p>
          <ThemeToggle />
        </section>

        <section>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            Currency
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CURRENCY_LIST.map((c) => {
              const active = currency === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCurrency(c.code)}
                  className={clsx(
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-brand-500 bg-brand-50"
                      : "border-border-strong bg-surface hover:bg-surface-sunken"
                  )}
                >
                  <span
                    className={clsx(
                      "text-[15px] font-bold",
                      active ? "text-brand-600" : "text-ink-faint"
                    )}
                  >
                    {c.symbol}
                  </span>
                  <span
                    className={clsx(
                      "text-[13px] font-semibold",
                      active ? "text-brand-600" : "text-ink-soft"
                    )}
                  >
                    {c.code}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            About
          </p>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border-strong bg-surface px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-ink">business.io {APP_VERSION}</p>
              <p className="text-[11.5px] text-ink-faint">See what's changed in each release</p>
            </div>
            <PillButton size="sm" variant="outline" icon={History} onClick={onOpenChangelog}>
              Update Log
            </PillButton>
          </div>
          <button
            type="button"
            onClick={() => {
              replayIntro();
              onClose();
            }}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-brand-600 hover:bg-brand-50"
          >
            <Sparkles size={15} strokeWidth={2.5} />
            Replay intro
          </button>
        </section>
      </div>
    </Modal>
  );
}
