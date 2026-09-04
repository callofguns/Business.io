import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { useGameStore } from "../../state/gameStore";
import { PillButton } from "../../components/ui/Button";
import { StatPill } from "../../components/ui/StatPill";
import { EmptyState } from "../../components/ui/EmptyState";
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
        <EmptyState title="No businesses yet">Start your first business above to begin earning.</EmptyState>
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
