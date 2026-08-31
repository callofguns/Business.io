import { BUSINESS_TYPES } from "../data/businessTypes";

// --- Revenue model -----------------------------------------------------
//
// utilization: how much of a business's *current* capacity actually gets
// used, driven by the building's traffic index. Soft floor (0.4) rather
// than a hard cutoff so a low-traffic building is worse, not dead.
export function utilization(building) {
  return 0.4 + 0.6 * ((building.trafficIndex - 30) / 70);
}

export function visitorsPerHour(business, building) {
  const t = BUSINESS_TYPES[business.type];
  return business.currentCapacity * utilization(building) * t.throughputFactor;
}

// Expected daily *visitors* (no noise) -- the shared traffic number behind
// both revenue and the Business Detail traffic chart. Every non-price
// factor that moves footfall (demand from pricing, satisfaction, an active
// promotion) multiplies in here; revenue then just layers price on top.
//
// `day` is only needed to know whether a promotion is currently active
// (see isPromotionActive) -- callers previewing a business that doesn't
// exist yet can omit it, which correctly treats promotion as inactive.
export function expectedDailyVisitors(business, building, productPrices, day) {
  const t = BUSINESS_TYPES[business.type];
  const demand = demandMultiplier(business, productPrices);
  const satisfaction = satisfactionMultiplier(business.satisfaction ?? SATISFACTION_START);
  const promo = promotionMultiplier(business, day);
  return visitorsPerHour(business, building) * demand * satisfaction * promo * t.operatingHours;
}

// Deterministic expected revenue (no daily noise) -- used for UI estimates
// ("~$X/day" previews) and as the basis for capacity-upgrade pricing, so
// those numbers don't jitter between renders.
//
// Player-set prices (business.customPrices, see setProductPrice in
// gameStore) feed in here via demandMultiplier: pricing exactly at market
// is neutral (multiplier 1, unchanged behavior from before pricing
// existed); pricing away from market trades off price-per-sale against
// how many customers actually buy. See demandMultiplier's own comment for
// the shape of that curve.
export function expectedDailyRevenue(business, building, productPrices, day) {
  const t = BUSINESS_TYPES[business.type];
  const avgPrice = averageEffectivePrice(business, productPrices);
  return expectedDailyVisitors(business, building, productPrices, day) * t.unitsPerVisitor * avgPrice;
}

export const DAILY_VARIANCE = 0.1; // +/- 10% day-to-day noise

// Rolls one day's noise against *visitors* (not revenue directly), then
// derives revenue from that same noised visitor count -- so the traffic
// chart and the earnings number always agree on how the day actually went,
// rather than each rolling independent noise.
export function rollDailyOutcome(business, building, productPrices, day) {
  const t = BUSINESS_TYPES[business.type];
  const noise = 1 - DAILY_VARIANCE + Math.random() * DAILY_VARIANCE * 2;
  const visitors = Math.round(expectedDailyVisitors(business, building, productPrices, day) * noise);
  const avgPrice = averageEffectivePrice(business, productPrices);
  const revenue = Math.round(visitors * t.unitsPerVisitor * avgPrice);
  return { revenue, visitors };
}

// Thin wrapper for callers that only need the revenue half (verify script,
// any future one-off use) -- see rollDailyOutcome for the shared roll.
export function rollDailyRevenue(business, building, productPrices, day) {
  return rollDailyOutcome(business, building, productPrices, day).revenue;
}

// --- Product market prices ----------------------------------------------
//
// Each product has a [min, max] market range (defined on BUSINESS_TYPES);
// the *current* price for every product lives in gameStore's
// `productPrices` state as { [businessType]: { [productId]: price } }, and
// only moves when rolled (every Sunday, see gameStore.nextDay()).
export function midPrice(product) {
  return Math.round(((product.min + product.max) / 2) * 100) / 100;
}

export function seedProductPrices() {
  const prices = {};
  for (const type of Object.keys(BUSINESS_TYPES)) {
    prices[type] = {};
    for (const product of BUSINESS_TYPES[type].products) {
      prices[type][product.id] = midPrice(product);
    }
  }
  return prices;
}

export function rollProductPrices() {
  const prices = {};
  for (const type of Object.keys(BUSINESS_TYPES)) {
    prices[type] = {};
    for (const product of BUSINESS_TYPES[type].products) {
      const rolled = product.min + Math.random() * (product.max - product.min);
      prices[type][product.id] = Math.round(rolled * 100) / 100;
    }
  }
  return prices;
}

// Average of a business type's *current* market prices. Falls back to each
// product's midpoint if a price hasn't been seeded yet (shouldn't happen in
// practice since gameStore seeds productPrices at init, but keeps this
// function safe to call standalone, e.g. from a future preview before a
// business exists).
export function averageProductPrice(type, productPrices) {
  const products = BUSINESS_TYPES[type].products;
  const sum = products.reduce((total, product) => {
    const current = productPrices?.[type]?.[product.id];
    return total + (current ?? midPrice(product));
  }, 0);
  return sum / products.length;
}

// Same as averageProductPrice but always uses midpoints, never the live
// market -- used for capacity-upgrade pricing so that cost doesn't drift
// with weekly price swings.
export function averageMidPrice(type) {
  const products = BUSINESS_TYPES[type].products;
  const sum = products.reduce((total, product) => total + midPrice(product), 0);
  return sum / products.length;
}

// --- Player-set prices ---------------------------------------------------
//
// A business can set its own selling price per product (business.
// customPrices, a sparse { [productId]: price } map -- an unset product
// just follows the live market price). No bound on the price itself
// (player's call, per design), but it can't go negative.
export function effectivePrice(business, product, productPrices) {
  const custom = business.customPrices?.[product.id];
  if (custom != null) return custom;
  return productPrices?.[business.type]?.[product.id] ?? midPrice(product);
}

// Average of what the business actually charges right now (custom price
// where set, market price otherwise) -- this is the number that multiplies
// into revenue, as opposed to averageProductPrice which is the market
// reference shown alongside it in the UI.
export function averageEffectivePrice(business, productPrices) {
  const products = BUSINESS_TYPES[business.type].products;
  const sum = products.reduce((total, product) => total + effectivePrice(business, product, productPrices), 0);
  return sum / products.length;
}

// How pricing away from market affects customer volume: exactly at market
// price the multiplier is 1 (matches pre-pricing behavior exactly). Below
// market, more customers show up (undercutting); above market, fewer do
// (customers go elsewhere) -- linear, floored at 0 (price yourself out of
// the market entirely) and capped at 2 (giving product away can at most
// double turnout). Combined with revenue also scaling with price, this
// makes revenue = price x demand a curve that peaks exactly at market
// price and falls off symmetrically either side -- deviating from market
// is a deliberate trade (volume vs. margin), not a free lunch. This
// formula is proposed, not confirmed exact numbers -- easy to retune via
// PRICE_MAX_MULTIPLIER if it doesn't feel right in play.
export const PRICE_MAX_MULTIPLIER = 2;

// effectivePrice / market -- 1 means priced exactly at market. Exported on
// its own (not just folded into demandMultiplier) because satisfaction's
// daily drift target also depends on it -- see satisfactionTarget.
export function priceRatio(business, productPrices) {
  const effective = averageEffectivePrice(business, productPrices);
  const market = averageProductPrice(business.type, productPrices);
  if (market <= 0) return 1;
  return effective / market;
}

export function demandMultiplier(business, productPrices) {
  const ratio = priceRatio(business, productPrices);
  return Math.max(0, Math.min(PRICE_MAX_MULTIPLIER, PRICE_MAX_MULTIPLIER - ratio));
}

// --- Satisfaction (reputation) --------------------------------------------
//
// A slow-moving 0-100 score, separate from the immediate price->demand
// curve above. Each day it drifts by SATISFACTION_STEP toward a target set
// by how the business is currently priced: at or below market it drifts up
// toward a happy ceiling; the more it overcharges, the lower the target
// falls (floored, not straight to 0 -- one bad pricing day doesn't tank
// years of goodwill). It then feeds back into visitor volume as a second,
// smaller multiplier on top of the pricing-driven demand curve -- reputation
// matters, but pricing-of-the-day still dominates.
export const SATISFACTION_MIN = 0;
export const SATISFACTION_MAX = 100;
export const SATISFACTION_START = 50;
export const SATISFACTION_STEP = 1; // points/day drift toward target
export const SATISFACTION_TARGET_AT_MARKET = 70;
export const SATISFACTION_TARGET_FLOOR = 20;

export function satisfactionTarget(ratio) {
  const overchargePenalty = Math.max(0, ratio - 1) * 100;
  return Math.max(SATISFACTION_TARGET_FLOOR, SATISFACTION_TARGET_AT_MARKET - overchargePenalty);
}

export function stepSatisfaction(current, target) {
  if (current === target) return current;
  const next = current < target ? current + SATISFACTION_STEP : current - SATISFACTION_STEP;
  return Math.max(SATISFACTION_MIN, Math.min(SATISFACTION_MAX, next));
}

// 0.85x at 0, 1.0x (neutral) at the 50 starting score, 1.15x at 100.
export function satisfactionMultiplier(satisfaction) {
  return 0.85 + satisfaction * 0.003;
}

// --- Promotions -------------------------------------------------------
//
// A time-limited marketing campaign a business can run: pay up front, get
// a flat traffic boost for a few days, then it wears off. Cost scales with
// the building's daily rent so it stays proportional across every tier,
// the same way buyPrice/rentDeposit already do in data/buildings.js.
export const PROMOTION_COST_MULTIPLIER = 5;
export const PROMOTION_DURATION_DAYS = 3;
export const PROMOTION_BOOST = 1.5;

export function promotionCost(building) {
  return Math.round(building.dailyRent * PROMOTION_COST_MULTIPLIER);
}

export function isPromotionActive(business, day) {
  return business?.promotionEndDay != null && day != null && day <= business.promotionEndDay;
}

export function promotionMultiplier(business, day) {
  return isPromotionActive(business, day) ? PROMOTION_BOOST : 1;
}

// --- Taxes -----------------------------------------------------------
//
// A flat tax on daily net business profit (all businesses' revenue minus
// rent, floored at 0 -- a loss day accrues no tax). It builds up in
// gameStore's `taxAccrued` every day via taxOnProfit(), but is only
// actually deducted from the bank on a fixed cadence (see
// isTaxPaymentDue) or early via the Tax Office's "Pay Now" -- see
// gameStore.payTaxesNow().
export const TAX_RATE = 0.15;
export const TAX_PERIOD_DAYS = 30;

export function taxOnProfit(profit) {
  return Math.max(0, profit) * TAX_RATE;
}

// Due once TAX_PERIOD_DAYS have elapsed since the last payment (automatic
// or an early "Pay Now") -- not a fixed calendar day, so paying early
// genuinely restarts the countdown rather than double-charging shortly
// after.
export function isTaxPaymentDue(day, lastTaxPaymentDay) {
  return day - lastTaxPaymentDay >= TAX_PERIOD_DAYS;
}

// --- Capacity investment --------------------------------------------------
//
// A business starts able to serve only half of its building's max capacity,
// and grows toward that max via investInCapacity(). Cost is derived from
// the revenue the step unlocks (~25 days of it), so payback stays roughly
// constant across every business type and every building on the ladder,
// scaling naturally with how good the building/business already is.
export const CAPACITY_STEP = 5;
export const CAPACITY_PAYBACK_DAYS = 25;

export function startingCapacity(building) {
  return Math.max(8, Math.round(building.customerCapacity * 0.5));
}

export function revenuePerCapacityUnit(type, building) {
  const t = BUSINESS_TYPES[type];
  return utilization(building) * t.throughputFactor * t.operatingHours * t.unitsPerVisitor * averageMidPrice(type);
}

// Returns null when the business is already at its building's max capacity.
export function capacityUpgrade(business, building) {
  const step = Math.min(CAPACITY_STEP, building.customerCapacity - business.currentCapacity);
  if (step <= 0) return null;
  const cost = Math.round(step * revenuePerCapacityUnit(business.type, building) * CAPACITY_PAYBACK_DAYS);
  return { step, cost, nextCapacity: business.currentCapacity + step };
}
