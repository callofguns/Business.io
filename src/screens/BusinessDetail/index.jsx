import { useState } from "react";
import { ArrowLeft, Banknote, Gauge, MapPin, Smile, TrendingUp, Megaphone, Tag } from "lucide-react";
import clsx from "clsx";
import { Card, SectionHeading } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { IconRow } from "../../components/ui/IconRow";
import { AnimatedMoney } from "../../components/ui/AnimatedMoney";
import { BusinessTypeIcon } from "../../components/ui/BusinessTypeIcon";
import { PillButton } from "../../components/ui/Button";
import { useGameStore } from "../../state/gameStore";
import { useUiStore } from "../../state/uiStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { formatMoney } from "../../lib/format";
import { buildingById } from "../../data/buildings";
import { capacityUpgrade, promotionCost, isPromotionActive } from "../../lib/economy";
import { TrafficChart } from "./TrafficChart";
import { ProductsModal } from "../MyEmpire/ProductsModal";

function StatCard({ icon: Icon, tone = "brand", label, value }) {
  const toneClasses = {
    brand: "bg-brand-50 text-brand-600",
    good: "bg-good-50 text-good-600",
    warn: "bg-warn-50 text-warn-600",
    bad: "bg-bad-50 text-bad-600",
  };
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", toneClasses[tone])}>
        <Icon size={18} strokeWidth={2.25} />
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-ink-faint">{label}</p>
        <p className="truncate text-[16px] font-bold text-ink">{value}</p>
      </div>
    </Card>
  );
}

function satisfactionTone(score) {
  if (score >= 70) return "good";
  if (score >= 40) return "brand";
  return "bad";
}

function satisfactionLabel(score) {
  if (score >= 70) return "Loved by customers";
  if (score >= 40) return "Steady reputation";
  return "Losing favor";
}

export function BusinessDetail() {
  const selectedBusinessId = useUiStore((s) => s.selectedBusinessId);
  const setScreen = useUiStore((s) => s.setScreen);
  const day = useGameStore((s) => s.day);
  const bankBalance = useGameStore((s) => s.bankBalance);
  const business = useGameStore((s) => s.businesses.find((b) => b.id === selectedBusinessId));
  const acquiredBuildings = useGameStore((s) => s.acquiredBuildings);
  const investInCapacity = useGameStore((s) => s.investInCapacity);
  const runPromotion = useGameStore((s) => s.runPromotion);
  const currency = useCurrencyStore((s) => s.currency);
  const [pricingOpen, setPricingOpen] = useState(false);

  const backToEmpire = () => setScreen("empire");

  if (!business) {
    return (
      <div className="mx-auto max-w-3xl px-10 py-10">
        <button
          type="button"
          onClick={backToEmpire}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-faint hover:text-ink"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Back to My Empire
        </button>
        <p className="mt-6 text-[14px] text-ink-faint">Business not found.</p>
      </div>
    );
  }

  const building = buildingById(business.buildingId);
  const acquisition = acquiredBuildings.find((a) => a.buildingId === business.buildingId);
  const satisfaction = business.satisfaction ?? 50;

  const upgrade = building ? capacityUpgrade(business, building) : null;
  const atMax = building && !upgrade;
  const canAffordUpgrade = upgrade ? bankBalance >= upgrade.cost : false;

  const promoActive = isPromotionActive(business, day);
  const promoCost = building ? promotionCost(building) : 0;
  const canAffordPromo = bankBalance >= promoCost;
  const promoDaysLeft = promoActive ? business.promotionEndDay - day : 0;

  return (
    <div className="mx-auto max-w-3xl px-10 py-10">
      <button
        type="button"
        onClick={backToEmpire}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-faint hover:text-ink"
      >
        <ArrowLeft size={14} strokeWidth={2.5} />
        Back to My Empire
      </button>

      <div className="mt-4 flex items-center gap-4">
        <BusinessTypeIcon type={business.type} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[26px] font-extrabold tracking-tight text-ink">{business.name}</h1>
            <Badge tone={business.active ? "good" : "neutral"} dot>
              {business.active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
            <IconRow icon={Tag}>{business.type}</IconRow>
            {building ? (
              <IconRow icon={MapPin}>
                {building.city} · {building.area}
              </IconRow>
            ) : null}
          </div>
        </div>
        <PillButton size="sm" variant="outline" onClick={() => setPricingOpen(true)}>
          Manage Pricing
        </PillButton>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Banknote}
          tone="good"
          label="Daily earnings"
          value={<AnimatedMoney value={business.dailyEarnings} />}
        />
        <StatCard
          icon={Gauge}
          label="Capacity"
          value={building ? `${business.currentCapacity}/${building.customerCapacity}` : "—"}
        />
        <StatCard
          icon={Smile}
          tone={satisfactionTone(satisfaction)}
          label="Satisfaction"
          value={`${satisfaction}/100`}
        />
        <StatCard
          icon={MapPin}
          label={acquisition?.mode === "own" ? "Owned space" : "Daily rent"}
          value={
            acquisition?.mode === "own"
              ? "No rent"
              : building
              ? `${formatMoney(building.dailyRent, { currency })}/day`
              : "—"
          }
        />
      </div>

      <Card className="mt-4">
        <SectionHeading icon={TrendingUp} title="Traffic" subtitle="Daily visitors, most recent days" />
        <TrafficChart history={business.trafficHistory ?? []} />
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <SectionHeading
            icon={Smile}
            iconTone={satisfactionTone(satisfaction)}
            title="Satisfaction"
            subtitle={satisfactionLabel(satisfaction)}
          />
          <p className="text-[12.5px] text-ink-faint">
            Drifts a little every day toward a target set by your pricing — sitting at or below
            market price builds it up, overcharging wears it down. Higher satisfaction brings in
            more customers on top of pricing itself.
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className={clsx(
                "h-full rounded-full",
                satisfactionTone(satisfaction) === "good"
                  ? "bg-good-500"
                  : satisfactionTone(satisfaction) === "bad"
                  ? "bg-bad-500"
                  : "bg-brand-500"
              )}
              style={{ width: `${satisfaction}%` }}
            />
          </div>
        </Card>

        <Card>
          <SectionHeading icon={Megaphone} title="Promotion" subtitle="Run a marketing campaign" />
          {promoActive ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-sunken px-4 py-3">
              <div>
                <p className="text-[13px] font-bold text-ink">Campaign active</p>
                <p className="text-[12px] text-ink-faint">
                  +50% traffic · {promoDaysLeft} day{promoDaysLeft === 1 ? "" : "s"} left
                </p>
              </div>
              <Badge tone="good" dot>
                Live
              </Badge>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12.5px] text-ink-faint">
                {formatMoney(promoCost, { currency })} for +50% traffic, 3 days.
              </p>
              <PillButton
                size="sm"
                variant="outline"
                icon={Megaphone}
                disabled={!building || !canAffordPromo}
                onClick={() => runPromotion({ businessId: business.id })}
              >
                Run Promotion
              </PillButton>
            </div>
          )}
        </Card>
      </div>

      {building ? (
        <Card className="mt-4">
          <SectionHeading icon={Gauge} title="Capacity" subtitle="Grow how many customers you can serve" />
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12.5px] text-ink-faint">
              {atMax
                ? "At building capacity."
                : `+${upgrade.step}/hr for ${formatMoney(upgrade.cost, { currency })}`}
            </p>
            <PillButton
              size="sm"
              variant="outline"
              icon={TrendingUp}
              disabled={atMax || !canAffordUpgrade}
              onClick={() => investInCapacity({ businessId: business.id })}
            >
              Invest in Capacity
            </PillButton>
          </div>
        </Card>
      ) : null}

      <ProductsModal business={pricingOpen ? business : null} onClose={() => setPricingOpen(false)} />
    </div>
  );
}
