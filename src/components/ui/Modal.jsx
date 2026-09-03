import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import clsx from "clsx";

const backdropTransition = { duration: 0.12, ease: "easeOut" };
const panelTransition = { type: "spring", stiffness: 520, damping: 32, mass: 0.6 };
const sheetTransition = { type: "spring", stiffness: 480, damping: 38, mass: 0.6 };

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Tracks currently-open Modal instances so a global Escape keydown only
// closes the topmost one, even if two happen to be mounted at once.
let openModalStack = [];

// Shared centered-dialog shell (backdrop + spring-in panel + Escape/backdrop
// to close), used by every modal in the app. `placement="sheet"` renders as
// a bottom sheet instead (used by the mobile More menu) — same focus
// handling and Escape/backdrop behavior either way.
export function Modal({ open, onClose, title, className, placement = "center", children }) {
  const titleId = useId();
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    // Remember what had focus so it can be restored on close, and move
    // focus into the panel so keyboard/screen-reader users land inside the
    // dialog rather than on a now-obscured trigger.
    triggerRef.current = document.activeElement;
    const instance = {};
    openModalStack.push(instance);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector(FOCUSABLE_SELECTOR);
      (first ?? panel).focus();
    }, 0);

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        if (openModalStack[openModalStack.length - 1] === instance) onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      openModalStack = openModalStack.filter((i) => i !== instance);
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
  }, [open, onClose]);

  const isSheet = placement === "sheet";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="modal-backdrop"
          className={clsx(
            "fixed inset-0 z-50 flex bg-black/45 px-4",
            isSheet ? "items-end justify-center" : "items-center justify-center"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={backdropTransition}
          onClick={onClose}
        >
          <motion.div
            key="modal-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={isSheet ? { opacity: 0, y: 40 } : { opacity: 0, scale: 0.95, y: 12 }}
            animate={isSheet ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isSheet ? { opacity: 0, y: 40 } : { opacity: 0, scale: 0.95, y: 12 }}
            transition={isSheet ? sheetTransition : panelTransition}
            onClick={(e) => e.stopPropagation()}
            className={clsx(
              "max-h-[85dvh] w-full overflow-y-auto border border-border bg-surface p-6 shadow-2xl outline-none",
              isSheet ? "rounded-t-card pb-[calc(env(safe-area-inset-bottom)+1.5rem)]" : "rounded-card",
              className
            )}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id={titleId} className="text-[18px] font-extrabold tracking-tight text-ink">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={`Close ${title}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-sunken hover:text-ink"
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
