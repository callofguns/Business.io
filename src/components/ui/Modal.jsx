import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import clsx from "clsx";

const backdropTransition = { duration: 0.18, ease: "easeOut" };
const panelTransition = { type: "spring", stiffness: 340, damping: 30, mass: 0.8 };

// Shared centered-dialog shell (backdrop + spring-in panel + Escape/backdrop
// to close) used by Settings and the "Start New Business" picker.
export function Modal({ open, onClose, title, className, children }) {
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
          key="modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={backdropTransition}
          onClick={onClose}
        >
          <motion.div
            key="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={panelTransition}
            onClick={(e) => e.stopPropagation()}
            className={clsx(
              "w-full rounded-card border border-border bg-surface p-6 shadow-2xl",
              className
            )}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[18px] font-extrabold tracking-tight text-ink">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={`Close ${title}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-sunken hover:text-ink"
              >
                <X size={16} strokeWidth={2.25} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
