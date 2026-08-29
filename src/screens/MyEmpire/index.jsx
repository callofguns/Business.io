import { Building2, Map } from "lucide-react";
import { useGameStore } from "../../state/gameStore";
import { BusinessCard } from "./BusinessCard";

function StatPill({ icon: Icon, value, tone }) {
  const toneClasses = tone === "brand" ? "bg-brand-50 text-brand-600" : "bg-gold-300/30 text-gold-600";
  return (
    <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold ${toneClasses}`}>
      <Icon size={15} strokeWidth={2.5} />
      {value}
    </span>
  );
}

export function MyEmpire() {
  const businesses = useGameStore((s) => s.businesses);
  const cityCount = new Set(businesses.map((b) => b.location.city)).size;

  return (
    <div className="mx-auto max-w-3xl px-10 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">My Empire</h1>
          <p className="mt-1 text-[14px] text-ink-faint">Manage your businesses &amp; explore cities</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatPill icon={Building2} value={businesses.length} tone="brand" />
          <StatPill icon={Map} value={cityCount} tone="gold" />
        </div>
      </div>

      {businesses.length === 0 ? (
        <div className="rounded-card border border-dashed border-border-strong bg-surface px-6 py-14 text-center">
          <p className="text-[15px] font-semibold text-ink">No businesses yet</p>
          <p className="mt-1 text-[13px] text-ink-faint">
            The marketplace for buying new businesses is coming in a later stage.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {businesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      )}
    </div>
  );
}
