import clsx from "clsx";
import { Modal } from "../ui/Modal";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useCurrencyStore } from "../../state/currencyStore";
import { CURRENCY_LIST } from "../../data/currencies";

export function SettingsModal({ open, onClose }) {
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);

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
      </div>
    </Modal>
  );
}
