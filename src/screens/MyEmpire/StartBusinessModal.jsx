import { useMemo, useState } from "react";
import { ArrowLeft, Activity, Gauge } from "lucide-react";
import clsx from "clsx";
import { Modal } from "../../components/ui/Modal";
import { PillButton } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { BusinessTypeIcon } from "../../components/ui/BusinessTypeIcon";
import { BuildingTypeIcon } from "../../components/ui/BuildingTypeIcon";
import { IconRow } from "../../components/ui/IconRow";
import { useGameStore, vacantBuildingsFor } from "../../state/gameStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { useUiStore } from "../../state/uiStore";
import { formatMoney } from "../../lib/format";
import { expectedDailyRevenue, startingCapacity } from "../../lib/economy";
import { STARTER_BUSINESS_OPTIONS } from "../../data/businessTypes";

export function StartBusinessModal({ open, onClose }) {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [name, setName] = useState("");

  const bankBalance = useGameStore((s) => s.bankBalance);
  const startBusiness = useGameStore((s) => s.startBusiness);
  const productPrices = useGameStore((s) => s.productPrices);
  // Select the raw, store-stable arrays (zustand only gives us a new
  // reference for these when they actually change) and derive the vacant
  // list with useMemo, rather than calling vacantBuildingsFor() inside the
  // selector itself -- that would construct a brand new array on every
  // single store notification regardless of whether anything relevant
  // changed, which breaks useSyncExternalStore's reference-stability
  // expectation and causes a real "Maximum update depth exceeded" loop.
  const businesses = useGameStore((s) => s.businesses);
  const acquiredBuildings = useGameStore((s) => s.acquiredBuildings);
  const vacantBuildings = useMemo(
    () => vacantBuildingsFor({ businesses, acquiredBuildings }, selectedType),
    [businesses, acquiredBuildings, selectedType]
  );
  const setScreen = useUiStore((s) => s.setScreen);
  const currency = useCurrencyStore((s) => s.currency);

  const selectedOption = STARTER_BUSINESS_OPTIONS.find((o) => o.type === selectedType);
  const selectedBuilding = vacantBuildings.find((b) => b.id === selectedBuildingId);
  const canAfford = selectedOption ? bankBalance >= selectedOption.cost : true;
  const canSubmit =
    Boolean(selectedOption) && Boolean(selectedBuilding) && name.trim().length > 0 && canAfford;

  const reset = () => {
    setSelectedType(null);
    setSelectedBuildingId(null);
    setName("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleOpenMarketplace = () => {
    setScreen("marketplace");
    handleClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    startBusiness({ type: selectedType, name, buildingId: selectedBuildingId });
    reset();
    onClose();
  };

  const cheapestCost = Math.min(...STARTER_BUSINESS_OPTIONS.map((o) => o.cost));

  let step = 1;
  if (selectedOption) step = 2;
  if (selectedOption && selectedBuilding) step = 3;

  return (
    <Modal open={open} onClose={handleClose} title="Start New Business" className="max-w-md">
      {step === 1 ? (
        <div className="flex flex-col gap-2.5">
          {STARTER_BUSINESS_OPTIONS.map((option) => {
            const affordable = bankBalance >= option.cost;
            return (
              <button
                key={option.type}
                type="button"
                disabled={!affordable}
                title={affordable ? undefined : "Not enough funds"}
                onClick={() => setSelectedType(option.type)}
                className={clsx(
                  "flex items-center gap-3 rounded-2xl border border-border-strong bg-surface px-4 py-3 text-left transition-colors",
                  affordable ? "hover:bg-surface-sunken" : "cursor-not-allowed opacity-50"
                )}
              >
                <BusinessTypeIcon type={option.type} sizeClass="h-12 w-12 rounded-xl" iconSize={22} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-ink">{option.type}</p>
                  <p className="text-[12px] text-ink-faint">
                    {option.riskLabel} · Needs {option.buildingType} space
                  </p>
                </div>
                <p className="shrink-0 text-[14px] font-bold text-ink">
                  {formatMoney(option.cost, { currency })}
                </p>
              </button>
            );
          })}
          {bankBalance < cheapestCost ? (
            <p className="mt-1 text-center text-[12px] text-ink-faint">
              Not enough funds to start a business right now.
            </p>
          ) : null}
        </div>
      ) : step === 2 ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setSelectedType(null)}
            className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-ink-faint hover:text-ink"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Back
          </button>

          {vacantBuildings.length === 0 ? (
            <EmptyState
              size="modal"
              title={`You don't own or lease any ${selectedOption.buildingType} space yet.`}
              action={{ label: "Open Marketplace", variant: "outline", onClick: handleOpenMarketplace }}
            >
              Acquire a building in the Marketplace first, then come back to start this business.
            </EmptyState>
          ) : (
            <div className="flex flex-col gap-2.5">
              {vacantBuildings.map((building) => {
                const preview = { type: selectedType, currentCapacity: startingCapacity(building) };
                const estimate = expectedDailyRevenue(preview, building, productPrices);
                return (
                  <button
                    key={building.id}
                    type="button"
                    onClick={() => setSelectedBuildingId(building.id)}
                    className="flex items-center gap-3 rounded-2xl border border-border-strong bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-sunken"
                  >
                    <BuildingTypeIcon type={building.type} sizeClass="h-12 w-12 rounded-xl" iconSize={22} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold text-ink">{building.name}</p>
                      <p className="text-[12px] text-ink-faint">
                        {building.city} · {building.area}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <IconRow icon={Activity} className="text-[11.5px]">
                          Traffic {building.trafficIndex}
                        </IconRow>
                        <IconRow icon={Gauge} className="text-[11.5px]">
                          {building.customerCapacity}/hr
                        </IconRow>
                      </div>
                    </div>
                    <p className="shrink-0 text-[13px] font-bold text-good-600">
                      ≈ {formatMoney(estimate, { currency })}/day
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setSelectedBuildingId(null)}
            className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-ink-faint hover:text-ink"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Back
          </button>

          <div className="flex items-center justify-between rounded-2xl bg-surface-sunken px-4 py-3">
            <div>
              <p className="text-[15px] font-bold text-ink">{selectedOption.type}</p>
              <p className="text-[12px] text-ink-faint">
                {selectedBuilding.name} · {selectedBuilding.city}
              </p>
            </div>
            <p className="shrink-0 text-[14px] font-bold text-ink">
              {formatMoney(selectedOption.cost, { currency })}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft" htmlFor="business-name">
              Business name
            </label>
            <input
              id="business-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g. "${selectedOption.type}"`}
              maxLength={32}
              className="h-11 w-full rounded-xl border border-border-strong bg-surface-sunken px-3.5 text-[14px] font-medium text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none"
            />
          </div>

          {!canAfford ? (
            <p className="text-[12px] font-medium text-bad-600">
              Not enough funds — you need {formatMoney(selectedOption.cost, { currency })}.
            </p>
          ) : null}

          <PillButton type="submit" size="lg" disabled={!canSubmit} className="w-full">
            Start Business
          </PillButton>
        </form>
      )}
    </Modal>
  );
}
