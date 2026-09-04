import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Landmark } from "lucide-react";
import clsx from "clsx";
import { BUILDINGS } from "../../data/buildings";
import { useGameStore } from "../../state/gameStore";
import { StatPill } from "../../components/ui/StatPill";
import { EmptyState } from "../../components/ui/EmptyState";
import { Page } from "../../components/layout/Page";
import { BuildingCard } from "./BuildingCard";
import { AcquireBuildingModal } from "./AcquireBuildingModal";

const VIEWS = [
  { key: "market", label: "Market" },
  { key: "my-buildings", label: "My Buildings" },
];

const TYPE_FILTERS = [
  { key: "all", label: "All" },
  { key: "retail", label: "Retail" },
  { key: "office", label: "Office" },
];

const tabTransition = { type: "spring", stiffness: 620, damping: 36 };

export function Marketplace() {
  const acquiredBuildings = useGameStore((s) => s.acquiredBuildings);
  const [view, setView] = useState("market");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const acquiredIds = useMemo(() => new Set(acquiredBuildings.map((a) => a.buildingId)), [acquiredBuildings]);

  const listedBuildings = useMemo(() => {
    let list = view === "market" ? BUILDINGS : BUILDINGS.filter((b) => acquiredIds.has(b.id));
    if (typeFilter !== "all") list = list.filter((b) => b.type === typeFilter);
    return [...list].sort((a, b) => a.dailyRent - b.dailyRent);
  }, [view, typeFilter, acquiredIds]);

  const isFiltered = typeFilter !== "all";
  const emptyState =
    view === "my-buildings" && acquiredBuildings.length > 0 && isFiltered
      ? {
          title: `No ${typeFilter} buildings owned`,
          body: "You own buildings of a different type. Clear the filter to see them.",
          action: { label: "Clear filter", variant: "outline", onClick: () => setTypeFilter("all") },
        }
      : view === "my-buildings"
      ? {
          title: "No buildings yet",
          body: "Acquire a building from the Market tab to see it here.",
          action: { label: "Browse Market", variant: "outline", onClick: () => setView("market") },
        }
      : {
          title: `No ${typeFilter} buildings`,
          body: "Try a different filter.",
          action: { label: "Clear filter", variant: "outline", onClick: () => setTypeFilter("all") },
        };

  return (
    <Page maxWidth="5xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Marketplace</h1>
          <p className="mt-1 text-[14px] text-ink-faint">Buy or lease space for your businesses</p>
        </div>
        <StatPill icon={Landmark}>{acquiredBuildings.length}</StatPill>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Marketplace view"
          className="relative inline-flex items-center gap-1 rounded-pill bg-surface-sunken p-1"
        >
          {VIEWS.map((v) => {
            const active = view === v.key;
            return (
              <button
                key={v.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setView(v.key)}
                className="relative rounded-pill px-4 py-1.5 text-[13px] font-bold"
              >
                {active ? (
                  <motion.span
                    layoutId="marketplace-tab"
                    transition={tabTransition}
                    className="absolute inset-0 rounded-pill bg-surface shadow-[0_1px_2px_rgba(16,19,26,0.08)]"
                  />
                ) : null}
                <span className={clsx("relative", active ? "text-ink" : "text-ink-faint")}>{v.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {TYPE_FILTERS.map((f) => {
            const active = typeFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={active}
                onClick={() => setTypeFilter(f.key)}
                className={clsx(
                  "rounded-pill px-3 py-1.5 text-[12.5px] font-bold transition-colors",
                  active ? "bg-brand-50 text-brand-600" : "text-ink-faint hover:bg-surface-sunken"
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {listedBuildings.length === 0 ? (
        <EmptyState title={emptyState.title} action={emptyState.action}>
          {emptyState.body}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {listedBuildings.map((building) => (
            <BuildingCard
              key={building.id}
              building={building}
              view={view}
              onAcquire={setSelectedBuilding}
            />
          ))}
        </div>
      )}

      <AcquireBuildingModal building={selectedBuilding} onClose={() => setSelectedBuilding(null)} />
    </Page>
  );
}
