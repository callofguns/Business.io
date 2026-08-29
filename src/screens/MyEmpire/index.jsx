import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { useGameStore } from "../../state/gameStore";
import { PillButton } from "../../components/ui/Button";
import { BusinessCard } from "./BusinessCard";
import { StartBusinessModal } from "./StartBusinessModal";

function StatPill({ icon: Icon, value }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-bold text-brand-600">
      <Icon size={15} strokeWidth={2.5} />
      {value}
    </span>
  );
}

export function MyEmpire() {
  const businesses = useGameStore((s) => s.businesses);
  const [startOpen, setStartOpen] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-10 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">My Empire</h1>
          <p className="mt-1 text-[14px] text-ink-faint">Manage your businesses</p>
        </div>
        <StatPill icon={Building2} value={businesses.length} />
      </div>

      <PillButton icon={Plus} className="mb-6" onClick={() => setStartOpen(true)}>
        Start New Business
      </PillButton>

      {businesses.length === 0 ? (
        <div className="rounded-card border border-dashed border-border-strong bg-surface px-6 py-14 text-center">
          <p className="text-[15px] font-semibold text-ink">No businesses yet</p>
          <p className="mt-1 text-[13px] text-ink-faint">
            Start your first business above to begin earning.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {businesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      )}

      <StartBusinessModal open={startOpen} onClose={() => setStartOpen(false)} />
    </div>
  );
}
