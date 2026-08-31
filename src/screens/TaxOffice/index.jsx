import { Receipt, Percent, CalendarClock, Landmark } from "lucide-react";
import { Card, SectionHeading } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { PillButton } from "../../components/ui/Button";
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
  const canPayNow = roundedAccrued > 0 && bankBalance >= roundedAccrued;

  return (
    <div className="mx-auto max-w-3xl px-10 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Tax Office</h1>
          <p className="mt-1 text-[14px] text-ink-faint">Taxes on your business profits</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-bold text-brand-600">
          <Percent size={15} strokeWidth={2.5} />
          {Math.round(TAX_RATE * 100)}% flat rate
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                ? `Automatically filed in ${daysUntilDue === 0 ? "today" : `${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`}, or pay early below.`
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
          <p className="text-[12.5px] text-ink-faint">No taxes filed yet.</p>
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
    </div>
  );
}
