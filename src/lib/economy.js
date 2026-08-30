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
export function expectedDailyRevenue(business, building, productPrices) {
  const t = BUSINESS_TYPES[business.type];
  const avgPrice = averageEffectivePrice(business, productPrices);
  const demand = demandMultiplier(business, productPrices);
  return visitorsPerHour(business, building) * demand * t.operatingHours * t.unitsPerVisitor * avgPrice;
}

export const DAILY_VARIANCE = 0.1; // +/- 10% day-to-day noise

export function rollDailyRevenue(business, building, productPrices) {
  const noise = 1 - DAILY_VARIANCE + Math.random() * DAILY_VARIANCE * 2;
  return Math.round(expectedDailyRevenue(business, building, productPrices) * noise);
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

export function demandMultiplier(business, productPrices) {
  const effective = averageEffectivePrice(business, productPrices);
  const market = averageProductPrice(business.type, productPrices);
  if (market <= 0) return 1;
  const ratio = effective / market;
  return Math.max(0, Math.min(PRICE_MAX_MULTIPLIER, PRICE_MAX_MULTIPLIER - ratio));
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
