import clsx from "clsx";

// Small icon + label row used throughout business cards/details — stat rows
// like "London · Soho", "Gym", "$1,305".
export function IconRow({ icon: Icon, iconClassName, emphasis = false, className, children }) {
  return (
    <div className={clsx("flex min-w-0 items-center gap-1.5 text-[13px]", className)}>
      <Icon size={14} strokeWidth={2.25} className={clsx("shrink-0", iconClassName ?? "text-ink-faint")} />
      <span className={clsx("truncate", emphasis ? "font-bold text-ink" : "font-medium text-ink-soft")}>
        {children}
      </span>
    </div>
  );
}
