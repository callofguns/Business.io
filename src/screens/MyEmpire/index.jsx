import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { useGameStore } from "../../state/gameStore";
import { PillButton } from "../../components/ui/Button";
import { StatPill } from "../../components/ui/StatPill";
import { Page } from "../../components/layout/Page";
import { BusinessCard } from "./BusinessCard";
import { StartBusinessModal } from "./StartBusinessModal";

export function MyEmpire() {
  const businesses = useGameStore((s) => s.businesses);
  const [startOpen, setStartOpen] = useState(false);

  return (
    <Page>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">My Empire</h1>
          <p className="mt-1 text-[14px] text-ink-faint">Manage your businesses</p>
        </div>
        <StatPill icon={Building2}>{businesses.length}</StatPill>
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
    </Page>
  );
}
