import { useEffect, useState } from "react";
import clsx from "clsx";
import { Activity, Gauge, MapPin } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { PillButton } from "../../components/ui/Button";
import { BuildingTypeIcon } from "../../components/ui/BuildingTypeIcon";
import { IconRow } from "../../components/ui/IconRow";
import { useGameStore } from "../../state/gameStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { formatMoney } from "../../lib/format";

// `building` is nullable (null = closed). We mirror it into local state that
// only updates on a non-null value, so the modal keeps rendering its last
// building's content while it plays its closing animation, instead of
// popping empty right as it starts to close.
export function AcquireBuildingModal({ building, onClose }) {
  const bankBalance = useGameStore((s) => s.bankBalance);
  const acquireBuilding = useGameStore((s) => s.acquireBuilding);
  const buildingMarketValues = useGameStore((s) => s.buildingMarketValues);
  const currency = useCurrencyStore((s) => s.currency);
  const [mode, setMode] = useState(null);
  const [displayBuilding, setDisplayBuilding] = useState(building);

  useEffect(() => {
    if (building) setDisplayBuilding(building);
  }, [building]);

  const open = Boolean(building);

  const handleClose = () => {
    setMode(null);
    onClose();
  };

  const handleConfirm = () => {
    if (!displayBuilding || !mode) return;
    acquireBuilding({ buildingId: displayBuilding.id, mode });
    setMode(null);
    onClose();
  };

  if (!displayBuilding) return null;

  // Buying (not renting) costs the building's live market value, not the
  // frozen buyPrice -- see buildingMarketValues/rollMarketValues.
  const marketValue = buildingMarketValues[displayBuilding.id] ?? displayBuilding.buyPrice;
  const canRent = bankBalance >= displayBuilding.rentDeposit;
  const canBuy = bankBalance >= marketValue;
  const neitherAffordable = !canRent && !canBuy;
  const cost = mode === "own" ? marketValue : mode === "rent" ? displayBuilding.rentDeposit : null;
  const canConfirm = mode !== null && bankBalance >= cost;

  return (
    <Modal open={open} onClose={handleClose} title={`Acquire ${displayBuilding.name}`} className="max-w-md">
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl bg-surface-sunken px-4 py-3">
          <div className="flex items-center gap-3">
            <BuildingTypeIcon type={displayBuilding.type} sizeClass="h-11 w-11 rounded-xl" iconSize={20} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold text-ink">{displayBuilding.name}</p>
              <IconRow icon={MapPin}>
                {displayBuilding.city} · {displayBuilding.area}
              </IconRow>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <IconRow icon={Activity}>Traffic {displayBuilding.trafficIndex}</IconRow>
            <IconRow icon={Gauge}>{displayBuilding.customerCapacity}/hr capacity</IconRow>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            disabled={!canRent}
            aria-pressed={mode === "rent"}
            onClick={() => setMode("rent")}
            className={clsx(
              "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
              mode === "rent"
                ? "border-brand-500 bg-brand-50"
                : canRent
                ? "border-border-strong bg-surface hover:bg-surface-sunken"
                : "cursor-not-allowed border-border-strong bg-surface opacity-50"
            )}
          >
            <div>
              <p className="text-[14px] font-bold text-ink">Rent</p>
              <p className="text-[12px] text-ink-faint">
                then {formatMoney(displayBuilding.dailyRent, { currency })}/day forever · Deposit is non-refundable
              </p>
            </div>
            <p className="shrink-0 text-[15px] font-bold text-ink">
              {formatMoney(displayBuilding.rentDeposit, { currency })}
            </p>
          </button>

          <button
            type="button"
            disabled={!canBuy}
            aria-pressed={mode === "own"}
            onClick={() => setMode("own")}
            className={clsx(
              "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
              mode === "own"
                ? "border-brand-500 bg-brand-50"
                : canBuy
                ? "border-border-strong bg-surface hover:bg-surface-sunken"
                : "cursor-not-allowed border-border-strong bg-surface opacity-50"
            )}
          >
            <div>
              <p className="text-[14px] font-bold text-ink">Buy</p>
              <p className="text-[12px] text-ink-faint">Own outright · No rent, ever</p>
            </div>
            <p className="shrink-0 text-[15px] font-bold text-ink">
              {formatMoney(marketValue, { currency })}
            </p>
          </button>
        </div>

        {neitherAffordable ? (
          <p className="text-[12px] font-medium text-bad-600">
            Not enough funds to rent or buy this building right now.
          </p>
        ) : mode && !canConfirm ? (
          <p className="text-[12px] font-medium text-bad-600">
            Not enough funds — you need {formatMoney(cost, { currency })}.
          </p>
        ) : null}

        <PillButton size="lg" className="w-full" disabled={!canConfirm} onClick={handleConfirm}>
          Confirm
        </PillButton>
      </div>
    </Modal>
  );
}
