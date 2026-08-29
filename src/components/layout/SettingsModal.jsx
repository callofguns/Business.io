import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import clsx from "clsx";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useCurrencyStore } from "../../state/currencyStore";
import { CURRENCY_LIST } from "../../data/currencies";

const backdropTransition = { duration: 0.18, ease: "easeOut" };
const panelTransition = { type: "spring", stiffness: 340, damping: 30, mass: 0.8 };

export function SettingsModal({ open, onClose }) {
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);

  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="settings-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={backdropTransition}
          onClick={onClose}
        >
          <motion.div
            key="settings-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={panelTransition}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-card border border-border bg-surface p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[18px] font-extrabold tracking-tight text-ink">Settings</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close settings"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-sunken hover:text-ink"
              >
                <X size={16} strokeWidth={2.25} />
              </button>
            </div>

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
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
