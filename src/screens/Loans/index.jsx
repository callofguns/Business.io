import { useState } from "react";
import { CreditCard, Wallet, TrendingDown, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Card, SectionHeading } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { PillButton } from "../../components/ui/Button";
import { StatPill } from "../../components/ui/StatPill";
import { EmptyState } from "../../components/ui/EmptyState";
import { AmountInput } from "../../components/ui/AmountInput";
import { Page } from "../../components/layout/Page";
import { useGameStore } from "../../state/gameStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { formatMoney } from "../../lib/format";
import { LOAN_PRODUCT } from "../../data/loanProduct";

export function Loans() {
  const creditLine = useGameStore((s) => s.creditLine);
  const bankBalance = useGameStore((s) => s.bankBalance);
  const openCreditLine = useGameStore((s) => s.openCreditLine);
  const borrow = useGameStore((s) => s.borrow);
  const repayCreditLine = useGameStore((s) => s.repayCreditLine);
  const currency = useCurrencyStore((s) => s.currency);
  const [borrowInput, setBorrowInput] = useState("");
  const [repayInput, setRepayInput] = useState("");

  if (!creditLine) {
    return (
      <Page>
        <div className="mb-6">
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Loans</h1>
          <p className="mt-1 text-[14px] text-ink-faint">Borrow against a revolving line of credit</p>
        </div>
        <EmptyState
          icon={CreditCard}
          title={LOAN_PRODUCT.name}
          action={{ label: "Open Line of Credit", onClick: openCreditLine }}
        >
          Up to {formatMoney(LOAN_PRODUCT.limit, { currency })} available on demand, at{" "}
          {Math.round(LOAN_PRODUCT.apr * 100)}% APR on whatever you draw. Free to open.
        </EmptyState>
      </Page>
    );
  }

  const available = creditLine.limit - creditLine.balance;
  const dailyInterest = creditLine.balance * creditLine.dailyRate;

  const borrowAmount = Math.max(0, Math.floor(Number.parseInt(borrowInput, 10) || 0));
  const repayAmount = Math.max(0, Math.floor(Number.parseInt(repayInput, 10) || 0));
  const canBorrow = borrowAmount > 0 && borrowAmount <= available;
  const canRepay = repayAmount > 0 && repayAmount <= creditLine.balance && repayAmount <= bankBalance;

  const handleBorrow = () => {
    if (!canBorrow) return;
    borrow({ amount: borrowAmount });
    setBorrowInput("");
  };

  const handleRepay = () => {
    if (!canRepay) return;
    repayCreditLine({ amount: repayAmount });
    setRepayInput("");
  };

  return (
    <Page>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Loans</h1>
          <p className="mt-1 text-[14px] text-ink-faint">
            {LOAN_PRODUCT.name} · {Math.round(LOAN_PRODUCT.apr * 100)}% APR
          </p>
        </div>
        <StatPill icon={CreditCard}>{formatMoney(available, { currency })} available</StatPill>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard icon={CreditCard} label="Credit limit" value={formatMoney(creditLine.limit, { currency })} />
        <StatCard
          icon={TrendingDown}
          tone={creditLine.balance > 0 ? "bad" : "brand"}
          label="Outstanding balance"
          value={formatMoney(creditLine.balance, { currency })}
        />
        <StatCard icon={Wallet} tone="good" label="Available credit" value={formatMoney(available, { currency })} />
      </div>

      <Card className="mt-4">
        <SectionHeading
          icon={CreditCard}
          title="Manage credit"
          subtitle={
            creditLine.balance > 0
              ? `Interest accrues daily · ~${formatMoney(dailyInterest, { currency, decimals: true })}/day on your current balance`
              : "No balance outstanding — interest only accrues once you borrow"
          }
        />
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-sunken px-4 py-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="borrow-amount" className="mb-1 block text-[12px] font-semibold text-ink-soft">
                Borrow
              </label>
              <AmountInput
                id="borrow-amount"
                value={borrowInput}
                onChange={(e) => setBorrowInput(e.target.value)}
                prefix="$"
                placeholder="0"
                className="w-32"
                inputClassName="w-full"
              />
            </div>
            <PillButton
              size="sm"
              icon={ArrowDownToLine}
              disabled={!canBorrow}
              title={borrowAmount > available ? "Exceeds available credit" : undefined}
              onClick={handleBorrow}
            >
              Borrow
            </PillButton>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-sunken px-4 py-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="repay-amount" className="mb-1 block text-[12px] font-semibold text-ink-soft">
                Repay
              </label>
              <AmountInput
                id="repay-amount"
                value={repayInput}
                onChange={(e) => setRepayInput(e.target.value)}
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
              disabled={!canRepay}
              title={
                repayAmount > creditLine.balance
                  ? "Exceeds outstanding balance"
                  : repayAmount > bankBalance
                  ? "Not enough funds"
                  : undefined
              }
              onClick={handleRepay}
            >
              Repay
            </PillButton>
          </div>
        </div>
      </Card>
    </Page>
  );
}
