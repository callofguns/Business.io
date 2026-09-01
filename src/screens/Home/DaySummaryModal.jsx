import clsx from "clsx";
import { Modal } from "../../components/ui/Modal";
import { PillButton } from "../../components/ui/Button";
import { useGameStore } from "../../state/gameStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { formatMoney, formatSigned } from "../../lib/format";

function SummaryRow({ label, amount, currency, isExpense = false }) {
  // Expenses are stored as positive magnitudes (a cost), so negate before
  // signing — 0 shows as a plain "$0" with no sign either way.
  const signedValue = isExpense ? -amount : amount;
  const isNonZeroExpense = isExpense && amount > 0;

  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] font-semibold text-ink-soft">{label}</span>
      <span
        className={clsx(
          "text-[15px] font-bold",
          isNonZeroExpense ? "text-bad-600" : !isExpense && amount > 0 ? "text-good-600" : "text-ink-faint"
        )}
      >
        {formatSigned(signedValue, currency)}
      </span>
    </div>
  );
}

export function DaySummaryModal({ open, onClose }) {
  const summary = useGameStore((s) => s.lastDaySummary);
  const currency = useCurrencyStore((s) => s.currency);

  if (!summary) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Day ${summary.day} Summary`} className="max-w-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <SummaryRow label="Total Revenue" amount={summary.revenue} currency={currency} />
          <SummaryRow label="Rent" amount={summary.rent} currency={currency} isExpense />
          <SummaryRow label="Wages" amount={summary.wages} currency={currency} isExpense />
          <SummaryRow label="Other Expenses" amount={summary.otherExpenses} currency={currency} isExpense />
        </div>

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between">
          <span className="text-[14px] font-bold text-ink">Net Change</span>
          <span
            className={clsx(
              "text-[18px] font-extrabold",
              summary.netChange >= 0 ? "text-good-600" : "text-bad-600"
            )}
          >
            {formatSigned(summary.netChange, currency)}
          </span>
        </div>

        <div className="rounded-2xl bg-surface-sunken px-4 py-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">New Balance</p>
          <p className="text-[22px] font-extrabold text-ink">{formatMoney(summary.newBalance, { currency })}</p>
        </div>

        <PillButton onClick={onClose} size="lg" className="w-full">
          Continue
        </PillButton>
      </div>
    </Modal>
  );
}
