import { useState } from "react";
import { PiggyBank, TrendingUp, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Card, SectionHeading } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { PillButton } from "../../components/ui/Button";
import { AmountInput } from "../../components/ui/AmountInput";
import { useGameStore } from "../../state/gameStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { formatMoney } from "../../lib/format";
import { clampAutoDepositPercent } from "../../lib/economy";
import { SAVINGS_PRODUCT } from "../../data/savingsProduct";

export function SavingsSection() {
  const savings = useGameStore((s) => s.savings);
  const bankBalance = useGameStore((s) => s.bankBalance);
  const depositSavings = useGameStore((s) => s.depositSavings);
  const withdrawSavings = useGameStore((s) => s.withdrawSavings);
  const setAutoDepositPercent = useGameStore((s) => s.setAutoDepositPercent);
  const currency = useCurrencyStore((s) => s.currency);
  const [depositInput, setDepositInput] = useState("");
  const [withdrawInput, setWithdrawInput] = useState("");
  const [percentInput, setPercentInput] = useState(String(savings.autoDepositPercent));

  const dailyInterest = savings.balance * savings.dailyRate;
  const depositAmount = Math.max(0, Math.floor(Number.parseInt(depositInput, 10) || 0));
  const withdrawAmount = Math.max(0, Math.floor(Number.parseInt(withdrawInput, 10) || 0));
  const canDeposit = depositAmount > 0 && depositAmount <= bankBalance;
  const canWithdraw = withdrawAmount > 0 && withdrawAmount <= savings.balance;

  const handleDeposit = () => {
    if (!canDeposit) return;
    depositSavings({ amount: depositAmount });
    setDepositInput("");
  };

  const handleWithdraw = () => {
    if (!canWithdraw) return;
    withdrawSavings({ amount: withdrawAmount });
    setWithdrawInput("");
  };

  const commitPercent = () => {
    const parsed = clampAutoDepositPercent(Number.parseInt(percentInput, 10));
    setAutoDepositPercent({ percent: parsed });
    setPercentInput(String(parsed));
  };

  return (
    <Card className="mb-4">
      <SectionHeading
        icon={PiggyBank}
        iconTone="good"
        title="Savings"
        subtitle={`${Math.round(SAVINGS_PRODUCT.apy * 100)}% APY, compounds daily`}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={PiggyBank} tone="good" label="Balance" value={formatMoney(savings.balance, { currency })} />
        <StatCard
          icon={TrendingUp}
          label="Interest today"
          value={formatMoney(dailyInterest, { currency, decimals: true })}
        />
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-sunken px-4 py-3">
          <div className="min-w-0 flex-1">
            <label htmlFor="savings-deposit" className="mb-1 block text-[12px] font-semibold text-ink-soft">
              Deposit
            </label>
            <AmountInput
              id="savings-deposit"
              value={depositInput}
              onChange={(e) => setDepositInput(e.target.value)}
              prefix="$"
              placeholder="0"
              className="w-32"
              inputClassName="w-full"
            />
          </div>
          <PillButton
            size="sm"
            icon={ArrowDownToLine}
            disabled={!canDeposit}
            title={depositAmount > bankBalance ? "Not enough funds" : undefined}
            onClick={handleDeposit}
          >
            Deposit
          </PillButton>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-sunken px-4 py-3">
          <div className="min-w-0 flex-1">
            <label htmlFor="savings-withdraw" className="mb-1 block text-[12px] font-semibold text-ink-soft">
              Withdraw
            </label>
            <AmountInput
              id="savings-withdraw"
              value={withdrawInput}
              onChange={(e) => setWithdrawInput(e.target.value)}
              prefix="$"
              placeholder="0"
              className="w-32"
              inputClassName="w-full"
            />
          </div>
          <PillButton
            size="sm"
            variant="outline"
            icon={ArrowUpFromLine}
            disabled={!canWithdraw}
            title={withdrawAmount > savings.balance ? "Exceeds savings balance" : undefined}
            onClick={handleWithdraw}
          >
            Withdraw
          </PillButton>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-sunken px-4 py-3">
          <div className="min-w-0 flex-1">
            <label htmlFor="savings-auto-percent" className="mb-1 block text-[12px] font-semibold text-ink-soft">
              Auto-deposit
            </label>
            <p className="text-[11.5px] text-ink-faint">
              Sweeps this % of each profitable day's net income into savings automatically.
            </p>
          </div>
          <AmountInput
            id="savings-auto-percent"
            value={percentInput}
            onChange={(e) => setPercentInput(e.target.value)}
            onBlur={commitPercent}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            suffix="%"
            min="0"
            step="1"
            ariaLabel="Auto-deposit percentage of daily net income"
            inputClassName="w-12"
          />
        </div>
      </div>
    </Card>
  );
}
