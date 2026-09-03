import { Users } from "lucide-react";
import { useGameStore } from "../../state/gameStore";
import { useUiStore } from "../../state/uiStore";
import { PillButton } from "../../components/ui/Button";
import { StatPill } from "../../components/ui/StatPill";
import { Page } from "../../components/layout/Page";
import { StaffCard } from "./StaffCard";

export function Hiring() {
  const businesses = useGameStore((s) => s.businesses);
  const setScreen = useUiStore((s) => s.setScreen);

  const totalStaff = businesses.reduce((sum, b) => sum + (b.staffCount ?? 0), 0);

  return (
    <Page>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Hiring</h1>
          <p className="mt-1 text-[14px] text-ink-faint">
            Hire staff to grow how many customers each business can serve
          </p>
        </div>
        <StatPill icon={Users}>{totalStaff}</StatPill>
      </div>

      {businesses.length === 0 ? (
        <div className="rounded-card border border-dashed border-border-strong bg-surface px-6 py-14 text-center">
          <p className="text-[15px] font-semibold text-ink">No businesses yet</p>
          <p className="mt-1 text-[13px] text-ink-faint">
            Start a business in My Empire before you can hire staff for it.
          </p>
          <PillButton size="sm" className="mt-4" onClick={() => setScreen("empire")}>
            Open My Empire
          </PillButton>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {businesses.map((business) => (
            <StaffCard key={business.id} business={business} />
          ))}
        </div>
      )}
    </Page>
  );
}
