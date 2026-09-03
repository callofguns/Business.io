import clsx from "clsx";

// Small header stat pill used at the top of most screens — extracted from
// 7 near-identical inline copies. `min-w-0`/`truncate` so a long money
// string can't force the header row wide on narrow screens.
export function StatPill({ icon: Icon, children, className }) {
  return (
    <span
      className={clsx(
        "flex min-w-0 items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-bold text-brand-600",
        className
      )}
    >
      <Icon size={15} strokeWidth={2.5} className="shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  );
}
