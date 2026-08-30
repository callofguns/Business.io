import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Landmark } from "lucide-react";
import clsx from "clsx";
import { BUILDINGS } from "../../data/buildings";
import { useGameStore } from "../../state/gameStore";
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

const tabTransition = { type: "spring", stiffness: 420, damping: 34 };

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

  return (
    <div className="mx-auto max-w-5xl px-10 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Marketplace</h1>
          <p className="mt-1 text-[14px] text-ink-faint">Buy or lease space for your businesses</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-bold text-brand-600">
          <Landmark size={15} strokeWidth={2.5} />
          {acquiredBuildings.length}
        </span>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="relative inline-flex items-center gap-1 rounded-pill bg-surface-sunken p-1">
          {VIEWS.map((v) => {
            const active = view === v.key;
            return (
              <button
                key={v.key}
                type="button"
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

        <div className="flex items-center gap-1.5">
          {TYPE_FILTERS.map((f) => {
            const active = typeFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
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
        <div className="rounded-card border border-dashed border-border-strong bg-surface px-6 py-14 text-center">
          <p className="text-[15px] font-semibold text-ink">No buildings yet</p>
          <p className="mt-1 text-[13px] text-ink-faint">
            Acquire a building from the Market tab to see it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
    </div>
  );
}
