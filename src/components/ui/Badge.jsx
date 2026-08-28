import clsx from "clsx";

const TONES = {
  good: "bg-good-50 text-good-600",
  warn: "bg-warn-50 text-warn-600",
  bad: "bg-bad-50 text-bad-600",
  brand: "bg-brand-50 text-brand-600",
  gold: "bg-gold-300/25 text-gold-600",
  neutral: "bg-surface-sunken text-ink-soft",
};

export function Badge({ tone = "neutral", dot = false, children, className }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        TONES[tone],
        className
      )}
    >
      {dot ? <span className={clsx("h-1.5 w-1.5 rounded-full", DOT_TONES[tone])} /> : null}
      {children}
    </span>
  );
}

const DOT_TONES = {
  good: "bg-good-500",
  warn: "bg-warn-500",
  bad: "bg-bad-500",
  brand: "bg-brand-500",
  gold: "bg-gold-500",
  neutral: "bg-ink-faint",
};
