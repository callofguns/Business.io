import { Receipt, Percent, CalendarClock, Landmark } from "lucide-react";
import { Card, SectionHeading } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { PillButton } from "../../components/ui/Button";
import { StatPill } from "../../components/ui/StatPill";
import { Page } from "../../components/layout/Page";
import { useGameStore } from "../../state/gameStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { formatMoney } from "../../lib/format";
import { TAX_RATE, TAX_PERIOD_DAYS } from "../../lib/economy";

export function TaxOffice() {
  const day = useGameStore((s) => s.day);
  const bankBalance = useGameStore((s) => s.bankBalance);
  const taxAccrued = useGameStore((s) => s.taxAccrued);
  const taxHistory = useGameStore((s) => s.taxHistory);
  const lastTaxPaymentDay = useGameStore((s) => s.lastTaxPaymentDay);
  const payTaxesNow = useGameStore((s) => s.payTaxesNow);
  const currency = useCurrencyStore((s) => s.currency);

  const roundedAccrued = Math.round(taxAccrued);
  const daysUntilDue = Math.max(0, TAX_PERIOD_DAYS - (day - lastTaxPaymentDay));
  const totalPaid = taxHistory.reduce((sum, entry) => sum + entry.amount, 0);
  const canAffordNow = bankBalance >= roundedAccrued;
  const canPayNow = roundedAccrued > 0 && canAffordNow;

  return (
    <Page>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Tax Office</h1>
          <p className="mt-1 text-[14px] text-ink-faint">Taxes on your business profits</p>
        </div>
        <StatPill icon={Percent}>{Math.round(TAX_RATE * 100)}% flat rate</StatPill>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard icon={Receipt} tone="bad" label="Accrued balance" value={formatMoney(roundedAccrued, { currency })} />
        <StatCard
          icon={CalendarClock}
          label="Next filing"
          value={daysUntilDue === 0 ? "Today" : `${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`}
        />
        <StatCard icon={Landmark} tone="good" label="Total paid" value={formatMoney(totalPaid, { currency })} />
      </div>

      <Card className="mt-4">
        <SectionHeading
          icon={Receipt}
          iconTone="bad"
          title="File taxes"
          subtitle={`${Math.round(TAX_RATE * 100)}% of net business profit accrues daily and is automatically filed every ${TAX_PERIOD_DAYS} days`}
        />
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-sunken px-4 py-3">
          <div>
            <p className="text-[13px] font-bold text-ink">{formatMoney(roundedAccrued, { currency })} owed</p>
            <p className="text-[12px] text-ink-faint">
              {roundedAccrued > 0
                ? canAffordNow
                  ? `Automatically filed in ${daysUntilDue === 0 ? "today" : `${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`}, or pay early below.`
                  : "Not enough funds to pay early right now — it will still file automatically when due."
                : "Nothing owed right now."}
            </p>
          </div>
          <PillButton size="sm" variant="outline" icon={Receipt} disabled={!canPayNow} onClick={payTaxesNow}>
            Pay Now
          </PillButton>
        </div>
      </Card>

      <Card className="mt-4">
        <SectionHeading icon={Landmark} title="Payment history" subtitle="Most recent filings" />
        {taxHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-strong px-4 py-8 text-center">
            <p className="text-[13.5px] font-semibold text-ink">No taxes filed yet</p>
            <p className="mt-1 text-[12px] text-ink-faint">
              Your first filing lands automatically {TAX_PERIOD_DAYS} days after founding your company.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {taxHistory.map((entry, i) => (
              <li key={`${entry.day}-${i}`} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <span className="text-[13px] font-semibold text-ink-soft">Day {entry.day}</span>
                <span className="text-[13.5px] font-bold text-bad-600">
                  -{formatMoney(entry.amount, { currency })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
}
