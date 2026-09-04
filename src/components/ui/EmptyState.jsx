import clsx from "clsx";
import { PillButton } from "./Button";

// Shared dashed-border placeholder for "this section has nothing in it
// yet." Three size variants match the three contexts this pattern was
// hand-copied into before being extracted: a full-width block sitting
// directly on a screen's Page background, a smaller one nested inside an
// existing Card, and a smaller still one nested inside a Modal panel.
const SIZES = {
  page: {
    wrapper: "rounded-card border border-dashed border-border-strong bg-surface px-6 py-14 text-center",
    title: "text-[15px] font-semibold text-ink",
    body: "mt-1 text-[13px] text-ink-faint",
    buttonMargin: "mt-4",
  },
  card: {
    wrapper: "rounded-2xl border border-dashed border-border-strong px-4 py-8 text-center",
    title: "text-[13.5px] font-semibold text-ink",
    body: "mt-1 text-[12px] text-ink-faint",
    buttonMargin: "mt-4",
  },
  modal: {
    wrapper: "rounded-2xl border border-dashed border-border-strong px-4 py-6 text-center",
    title: "text-[14px] font-semibold text-ink",
    body: "mt-1 text-[12.5px] text-ink-faint",
    buttonMargin: "mt-3",
  },
};

export function EmptyState({ icon: Icon, title, children, action, size = "page", className }) {
  const s = SIZES[size] ?? SIZES.page;

  return (
    <div className={clsx(s.wrapper, className)}>
      {Icon ? (
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon size={22} strokeWidth={2.25} />
        </span>
      ) : null}
      <p className={s.title}>{title}</p>
      {children ? <p className={clsx(s.body, Icon && "mx-auto max-w-xs")}>{children}</p> : null}
      {action ? (
        <PillButton
          size="sm"
          variant={action.variant ?? "primary"}
          className={s.buttonMargin}
          onClick={action.onClick}
        >
          {action.label}
        </PillButton>
      ) : null}
    </div>
  );
}
