import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import clsx from "clsx";
import { useThemeStore } from "../../state/themeStore";

const thumbTransition = { type: "spring", stiffness: 500, damping: 32, mass: 0.7 };

// A plain CSS transition with a slight overshoot, so the icon crossfade has
// spring-like bounce without being a framer-motion `animate` value nested
// inside the thumb's `layout`-animated parent — nesting an independent
// framer spring there was fighting the parent's FLIP animation and left the
// icons stuck mid-fade.
const iconTransitionClass = "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]";

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === "dark";

  return (
    <div className="flex items-center justify-between rounded-xl bg-surface-sunken px-3 py-2.5">
      <span className="text-[13px] font-semibold text-ink-soft">
        {isDark ? "Dark Mode" : "Light Mode"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle dark mode"
        onClick={toggleTheme}
        className="flex h-8 w-14 shrink-0 items-center rounded-pill border border-border-strong bg-surface px-1"
        style={{ justifyContent: isDark ? "flex-end" : "flex-start" }}
      >
        <motion.span
          layout
          transition={thumbTransition}
          className="relative flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white"
        >
          <Sun
            size={13}
            strokeWidth={2.5}
            className={clsx(
              "absolute",
              iconTransitionClass,
              isDark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
            )}
          />
          <Moon
            size={13}
            strokeWidth={2.5}
            className={clsx(
              "absolute",
              iconTransitionClass,
              isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
            )}
          />
        </motion.span>
      </button>
    </div>
  );
}
