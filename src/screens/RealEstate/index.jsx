import { Landmark } from "lucide-react";
import { useGameStore } from "../../state/gameStore";
import { useUiStore } from "../../state/uiStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { StatPill } from "../../components/ui/StatPill";
import { EmptyState } from "../../components/ui/EmptyState";
import { Page } from "../../components/layout/Page";
import { formatMoney } from "../../lib/format";
import { buildingById } from "../../data/buildings";
import { PropertyCard } from "./PropertyCard";

export function RealEstate() {
  const acquiredBuildings = useGameStore((s) => s.acquiredBuildings);
  const buildingMarketValues = useGameStore((s) => s.buildingMarketValues);
  const setScreen = useUiStore((s) => s.setScreen);
  const currency = useCurrencyStore((s) => s.currency);

  const owned = acquiredBuildings.filter((a) => a.mode === "own");
  const portfolioValue = owned.reduce((sum, a) => sum + (buildingMarketValues[a.buildingId] ?? 0), 0);

  return (
    <Page>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Real Estate</h1>
          <p className="mt-1 text-[14px] text-ink-faint">Your owned buildings, as investments</p>
        </div>
        <StatPill icon={Landmark}>
          {owned.length > 0 ? `${formatMoney(portfolioValue, { currency })} portfolio` : "No properties yet"}
        </StatPill>
      </div>

      {owned.length === 0 ? (
        <EmptyState
          title="No properties owned yet"
          action={{ label: "Open Marketplace", onClick: () => setScreen("marketplace") }}
        >
          Buy a building outright in the Marketplace to start building your portfolio.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {owned.map((a) => {
            const building = buildingById(a.buildingId);
            if (!building) return null;
            return <PropertyCard key={a.buildingId} building={building} />;
          })}
        </div>
      )}
    </Page>
  );
}
