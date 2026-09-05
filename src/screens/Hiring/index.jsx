import { Users } from "lucide-react";
import { useGameStore } from "../../state/gameStore";
import { useUiStore } from "../../state/uiStore";
import { StatPill } from "../../components/ui/StatPill";
import { EmptyState } from "../../components/ui/EmptyState";
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
            Hire staff to boost customer satisfaction at each business
          </p>
        </div>
        <StatPill icon={Users}>{totalStaff}</StatPill>
      </div>

      {businesses.length === 0 ? (
        <EmptyState
          title="No businesses yet"
          action={{ label: "Open My Empire", onClick: () => setScreen("empire") }}
        >
          Start a business in My Empire before you can hire staff for it.
        </EmptyState>
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
