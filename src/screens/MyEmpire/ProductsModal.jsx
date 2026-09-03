import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import clsx from "clsx";
import { Modal } from "../../components/ui/Modal";
import { PillButton } from "../../components/ui/Button";
import { useGameStore } from "../../state/gameStore";
import { useCurrencyStore } from "../../state/currencyStore";
import { formatMoney } from "../../lib/format";
import { BUSINESS_TYPES } from "../../data/businessTypes";
import { effectivePrice, demandMultiplier } from "../../lib/economy";

function ProductRow({ business, product, productPrices, currency, onSetPrice }) {
  const current = effectivePrice(business, product, productPrices);
  const market = productPrices?.[business.type]?.[product.id] ?? current;
  const isCustom = business.customPrices?.[product.id] != null;
  const [draft, setDraft] = useState(current.toFixed(2));

  // Keep the input in sync if the underlying price changes from outside
  // this row (e.g. a Sunday market re-roll while a product isn't customized).
  useEffect(() => {
    setDraft(current.toFixed(2));
  }, [current]);

  const commit = () => {
    const parsed = Number.parseFloat(draft);
    if (Number.isFinite(parsed)) {
      onSetPrice(product.id, parsed);
    } else {
      setDraft(current.toFixed(2));
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-sunken px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-ink">{product.name}</p>
        <p className="text-[12px] text-ink-faint">Market: {formatMoney(market, { currency, decimals: true })}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="flex h-9 items-center rounded-xl border border-border-strong bg-surface pl-2.5 pr-1">
          <span className="text-[13px] text-ink-faint">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            aria-label={`Price for ${product.name}`}
            className="h-full w-16 bg-transparent px-1 text-right text-[13px] font-semibold text-ink"
          />
        </div>
        {isCustom ? (
          <button
            type="button"
            title="Reset to market price"
            aria-label="Reset to market price"
            onClick={() => onSetPrice(product.id, null)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-faint hover:bg-surface-sunken hover:text-ink"
          >
            <RotateCcw size={15} strokeWidth={2.25} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ProductsModal({ business, onClose }) {
  const setProductPrice = useGameStore((s) => s.setProductPrice);
  const productPrices = useGameStore((s) => s.productPrices);
  const currency = useCurrencyStore((s) => s.currency);
  const [displayBusiness, setDisplayBusiness] = useState(business);

  useEffect(() => {
    if (business) setDisplayBusiness(business);
  }, [business]);

  // Keep displayBusiness's own fields (customPrices etc.) live from the
  // store while the modal is open, not frozen at the moment it opened.
  const liveBusiness = useGameStore((s) => s.businesses.find((b) => b.id === displayBusiness?.id)) ?? displayBusiness;

  const open = Boolean(business);
  if (!displayBusiness) return null;

  const products = BUSINESS_TYPES[displayBusiness.type]?.products ?? [];
  const demand = demandMultiplier(liveBusiness, productPrices);
  const demandPct = Math.round(demand * 100);
  const demandTone = demandPct === 100 ? "text-ink-faint" : demandPct > 100 ? "text-good-600" : "text-bad-600";

  return (
    <Modal open={open} onClose={onClose} title={`${displayBusiness.name} · Pricing`} className="max-w-md">
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl bg-surface-sunken px-4 py-3">
          <p className="text-[12.5px] text-ink-faint">
            Price above market for more margin per sale but fewer customers; price below for the
            opposite. Sitting at market price is neutral.
          </p>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
              Customer turnout
            </span>
            <span className={clsx("text-[14px] font-bold", demandTone)}>{demandPct}%</span>
          </p>
        </div>

        {products.length === 0 ? (
          <p className="text-center text-[12.5px] text-ink-faint">This business has no products to price.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {products.map((product) => (
              <ProductRow
                key={product.id}
                business={liveBusiness}
                product={product}
                productPrices={productPrices}
                currency={currency}
                onSetPrice={(productId, price) =>
                  setProductPrice({ businessId: liveBusiness.id, productId, price })
                }
              />
            ))}
          </div>
        )}

        <PillButton onClick={onClose} size="lg" className="w-full">
          Done
        </PillButton>
      </div>
    </Modal>
  );
}
