import clsx from "clsx";

// Shared bordered number-input control -- an optional $-prefix or unit
// suffix around a plain <input type="number">. Used by StockCard (share
// quantity), ProductsModal (product price), and Loans (borrow/repay
// amount), which each hand-rolled a near-identical copy before this was
// extracted. `id` + an external <label htmlFor> (Loans) or `ariaLabel`
// (StockCard/ProductsModal, which render several of these in a list with
// no room for a visible label each) are both supported -- pass whichever
// fits the call site.
export function AmountInput({
  id,
  value,
  onChange,
  onBlur,
  onKeyDown,
  prefix,
  suffix,
  ariaLabel,
  placeholder,
  min = "0",
  step = "1",
  autoFocus,
  className,
  inputClassName = "w-16",
}) {
  return (
    <div className={clsx("flex h-9 items-center rounded-xl border border-border-strong bg-surface px-2.5", className)}>
      {prefix ? <span className="text-[13px] text-ink-faint">{prefix}</span> : null}
      <input
        id={id}
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        className={clsx("h-full bg-transparent px-1 text-right text-[13px] font-semibold text-ink", inputClassName)}
      />
      {suffix ? <span className="ml-1 text-[12px] text-ink-faint">{suffix}</span> : null}
    </div>
  );
}
