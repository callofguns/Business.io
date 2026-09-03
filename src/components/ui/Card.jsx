import clsx from "clsx";

export function Card({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        "rounded-card border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(16,19,26,0.04)] sm:p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SectionHeading({ icon: Icon, iconTone = "brand", title, subtitle, right }) {
  const toneClasses = {
    brand: "bg-brand-50 text-brand-600",
    good: "bg-good-50 text-good-600",
    warn: "bg-warn-50 text-warn-600",
    bad: "bg-bad-50 text-bad-600",
    gold: "bg-gold-300/30 text-gold-600",
  };

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {Icon ? (
          <span
            className={clsx(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              toneClasses[iconTone]
            )}
          >
            <Icon size={18} strokeWidth={2.25} />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold leading-tight text-ink">{title}</h2>
          {subtitle ? <p className="text-[13px] text-ink-faint">{subtitle}</p> : null}
        </div>
      </div>
      {right}
    </div>
  );
}
