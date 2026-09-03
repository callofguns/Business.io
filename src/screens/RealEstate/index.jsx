import { Landmark } from "lucide-react";
import { useGameStore } from "../../state/gameStore";
import { useUiStore } from "../../state/uiStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { PillButton } from "../../components/ui/Button";
import { StatPill } from "../../components/ui/StatPill";
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
        <div className="rounded-card border border-dashed border-border-strong bg-surface px-6 py-14 text-center">
          <p className="text-[15px] font-semibold text-ink">No properties owned yet</p>
          <p className="mt-1 text-[13px] text-ink-faint">
            Buy a building outright in the Marketplace to start building your portfolio.
          </p>
          <PillButton size="sm" className="mt-4" onClick={() => setScreen("marketplace")}>
            Open Marketplace
          </PillButton>
        </div>
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
