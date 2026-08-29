import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { Modal } from "../../components/ui/Modal";
import { PillButton } from "../../components/ui/Button";
import { BusinessTypeIcon } from "../../components/ui/BusinessTypeIcon";
import { useGameStore } from "../../state/gameStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { formatMoney } from "../../lib/format";
import { STARTER_BUSINESS_OPTIONS } from "../../data/businessTypes";

function earningsLabel(option, currency) {
  if (option.minEarnings === option.maxEarnings) {
    return `${formatMoney(option.minEarnings, { currency })}/day`;
  }
  return `${formatMoney(option.minEarnings, { currency })}–${formatMoney(option.maxEarnings, { currency })}/day`;
}

export function StartBusinessModal({ open, onClose }) {
  const bankBalance = useGameStore((s) => s.bankBalance);
  const startBusiness = useGameStore((s) => s.startBusiness);
  const currency = useCurrencyStore((s) => s.currency);
  const [selectedType, setSelectedType] = useState(null);
  const [name, setName] = useState("");

  const selectedOption = STARTER_BUSINESS_OPTIONS.find((o) => o.type === selectedType);
  const canAfford = selectedOption ? bankBalance >= selectedOption.cost : true;
  const canSubmit = Boolean(selectedOption) && name.trim().length > 0 && canAfford;

  const reset = () => {
    setSelectedType(null);
    setName("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    startBusiness({ type: selectedType, name });
    reset();
    onClose();
  };

  const cheapestCost = Math.min(...STARTER_BUSINESS_OPTIONS.map((o) => o.cost));

  return (
    <Modal open={open} onClose={handleClose} title="Start New Business" className="max-w-md">
      {!selectedOption ? (
        <div className="flex flex-col gap-2.5">
          {STARTER_BUSINESS_OPTIONS.map((option) => {
            const affordable = bankBalance >= option.cost;
            return (
              <button
                key={option.type}
                type="button"
                disabled={!affordable}
                onClick={() => setSelectedType(option.type)}
                className={clsx(
                  "flex items-center gap-3 rounded-2xl border border-border-strong bg-surface px-4 py-3 text-left transition-colors",
                  affordable ? "hover:bg-surface-sunken" : "cursor-not-allowed opacity-50"
                )}
              >
                <BusinessTypeIcon type={option.type} sizeClass="h-12 w-12 rounded-xl" iconSize={22} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-ink">{option.type}</p>
                  <p className="text-[12px] text-ink-faint">
                    {option.riskLabel} · {earningsLabel(option, currency)}
                  </p>
                </div>
                <p className="shrink-0 text-[14px] font-bold text-ink">
                  {formatMoney(option.cost, { currency })}
                </p>
              </button>
            );
          })}
          {bankBalance < cheapestCost ? (
            <p className="mt-1 text-center text-[12px] text-ink-faint">
              Not enough funds to start a business right now.
            </p>
          ) : null}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setSelectedType(null)}
            className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-ink-faint hover:text-ink"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Back
          </button>

          <div className="flex items-center justify-between rounded-2xl bg-surface-sunken px-4 py-3">
            <div>
              <p className="text-[15px] font-bold text-ink">{selectedOption.type}</p>
              <p className="text-[12px] text-ink-faint">
                {selectedOption.riskLabel} · {earningsLabel(selectedOption, currency)}
              </p>
            </div>
            <p className="shrink-0 text-[14px] font-bold text-ink">
              {formatMoney(selectedOption.cost, { currency })}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft" htmlFor="business-name">
              Business name
            </label>
            <input
              id="business-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g. "${selectedOption.type}"`}
              maxLength={32}
              className="h-11 w-full rounded-xl border border-border-strong bg-surface-sunken px-3.5 text-[14px] font-medium text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none"
            />
          </div>

          {!canAfford ? (
            <p className="text-[12px] font-medium text-bad-600">
              Not enough funds — you need {formatMoney(selectedOption.cost, { currency })}.
            </p>
          ) : null}

          <PillButton type="submit" size="lg" disabled={!canSubmit} className="w-full">
            Start Business
          </PillButton>
        </form>
      )}
    </Modal>
  );
}
