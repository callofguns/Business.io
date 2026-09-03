import { motion } from "framer-motion";
import clsx from "clsx";

const VARIANTS = {
  primary:
    "bg-brand-500 text-white shadow-[0_10px_24px_-10px_rgba(59,130,246,0.65)] hover:bg-brand-600",
  gold: "bg-gradient-to-b from-gold-400 to-gold-500 text-white shadow-[0_10px_24px_-10px_rgba(219,166,39,0.65)]",
  ghost: "bg-surface-sunken text-ink hover:bg-border-strong",
  outline: "bg-surface text-ink border border-border-strong hover:bg-surface-sunken",
};

const SIZES = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-[15px]",
  lg: "h-14 px-6 text-[16px]",
};

const press = { type: "spring", stiffness: 650, damping: 30, mass: 0.5 };

export function PillButton({
  children,
  icon: Icon,
  variant = "primary",
  size = "md",
  disabled = false,
  className,
  ...props
}) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.96 }}
      whileHover={disabled ? undefined : { scale: 1.015 }}
      transition={press}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-tight transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {Icon ? (
        <span
          className={clsx(
            "flex items-center justify-center rounded-full bg-white/20",
            size === "sm" ? "h-5 w-5" : "h-6 w-6"
          )}
        >
          <Icon size={size === "sm" ? 12 : 14} strokeWidth={2.75} />
        </span>
      ) : null}
      {children}
    </motion.button>
  );
}
