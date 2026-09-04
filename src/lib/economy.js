import { BUSINESS_TYPES } from "../data/businessTypes";
import { STOCKS } from "../data/stocks";
import { BUILDINGS, buildingById } from "../data/buildings";
import { RIVALS } from "../data/rivals";

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

// --- Hiring / staff ---------------------------------------------------
//
// A business starts able to serve only half of its building's max capacity
// (startingCapacity below) and grows toward that max by hiring staff on the
// Hiring screen. Staff are a flat headcount (no named roles) -- each hire
// adds STAFF_CAPACITY_STEP capacity and costs an hourly wage, paid every
// day the business is open (see dailyWagePerStaff/gameStore.nextDay), plus
// a one-time hiring fee. Capacity is always *derived* from staffCount
// (capacityForStaff) rather than stored as an independent running total, so
// hiring and firing can never drift out of sync with each other -- firing
// is just staffCount - 1, capacity recomputes on its own.
export const STAFF_HOURLY_WAGE = 18;
export const STAFF_CAPACITY_STEP = 5;
export const STAFF_HIRE_FEE_MULTIPLIER = 10; // one-time fee = 10x that hire's daily wage

export function startingCapacity(building) {
  return Math.max(8, Math.round(building.customerCapacity * 0.5));
}

export function capacityForStaff(building, staffCount) {
  return Math.min(building.customerCapacity, startingCapacity(building) + staffCount * STAFF_CAPACITY_STEP);
}

// How many staff a business can usefully hire before it's already serving
// its building's full capacity -- hiring past this would only add wage cost
// for no capacity gain, so hireStaff() refuses past this point.
export function maxStaffFor(building) {
  return Math.ceil((building.customerCapacity - startingCapacity(building)) / STAFF_CAPACITY_STEP);
}

export function dailyWagePerStaff(type) {
  return Math.round(BUSINESS_TYPES[type].operatingHours * STAFF_HOURLY_WAGE);
}

export function hireFee(type) {
  return dailyWagePerStaff(type) * STAFF_HIRE_FEE_MULTIPLIER;
}

// Total daily wage bill across every active, staffed business -- folded
// into gameStore.nextDay()'s expenses (and into the tax profit basis)
// alongside rent.
export function totalDailyWages(businesses) {
  return businesses.reduce((sum, b) => {
    if (!b.active || !b.staffCount) return sum;
    return sum + b.staffCount * dailyWagePerStaff(b.type);
  }, 0);
}

// Returns null once the business is already staffed up to its building's
// max capacity.
export function staffHireCost(business, building) {
  const staffCount = business.staffCount ?? 0;
  if (staffCount >= maxStaffFor(building)) return null;
  return {
    fee: hireFee(business.type),
    dailyWage: dailyWagePerStaff(business.type),
    nextStaffCount: staffCount + 1,
    nextCapacity: capacityForStaff(building, staffCount + 1),
  };
}

// Returns null when there's no staff left to let go. No refund of the
// original hire fee (it was a sunk recruiting/training cost) -- only the
// ongoing wage stops.
export function staffFireResult(business, building) {
  const staffCount = business.staffCount ?? 0;
  if (staffCount <= 0) return null;
  return {
    nextStaffCount: staffCount - 1,
    nextCapacity: capacityForStaff(building, staffCount - 1),
  };
}

// --- Stock market (Finance Manager) ------------------------------------
//
// A small fixed list of fictional stocks (data/stocks.js). Unlike product
// prices (which only move on Sundays), every stock's price random-walks
// every single day inside gameStore.nextDay() -- current prices live in
// gameStore's `stockPrices` ({ [stockId]: price }), with a rolling
// `stockPriceHistory` ({ [stockId]: { day, price }[] }, capped to the last
// 30 entries) backing each stock's Finance Manager chart. Holdings
// (`stockHoldings`, { [stockId]: { shares, avgCost } }) are bought/sold at
// the live price via gameStore.buyStock/sellStock.
//
// Each day's move is a noise term (+/- the stock's own volatility, as a
// fraction of its current price) plus a small pull back toward the stock's
// startPrice (STOCK_MEAN_REVERSION) so a run of bad or good luck drifts
// back over time instead of compounding into a runaway price -- and a hard
// floor (STOCK_MIN_PRICE_FLOOR, as a fraction of startPrice) so a stock can
// never spiral all the way to $0.
export const STOCK_MEAN_REVERSION = 0.02; // pulls 2% of the gap back toward startPrice each day
export const STOCK_MIN_PRICE_FLOOR = 0.05; // price can never fall below 5% of its startPrice

export function rollStockPrice(stock, currentPrice) {
  const reversion = (stock.startPrice - currentPrice) * STOCK_MEAN_REVERSION;
  const noise = currentPrice * stock.volatility * (Math.random() * 2 - 1);
  const next = currentPrice + reversion + noise;
  return Math.max(stock.startPrice * STOCK_MIN_PRICE_FLOOR, Math.round(next * 100) / 100);
}

export function rollStockPrices(prevPrices) {
  const prices = {};
  for (const stock of STOCKS) {
    const current = prevPrices?.[stock.id] ?? stock.startPrice;
    prices[stock.id] = rollStockPrice(stock, current);
  }
  return prices;
}

export function seedStockPrices() {
  const prices = {};
  for (const stock of STOCKS) prices[stock.id] = stock.startPrice;
  return prices;
}

export function seedStockPriceHistory() {
  const history = {};
  for (const stock of STOCKS) history[stock.id] = [{ day: 1, price: stock.startPrice }];
  return history;
}

// A stock with dividendRate 0 pays nothing -- half the list (the
// growth/speculative names) only ever pays off through price appreciation.
export function dividendPayout(stock, price, shares) {
  if (!stock.dividendRate || !shares) return 0;
  return price * stock.dividendRate * shares;
}

// Total dividend cash paid out today across every held, dividend-paying
// stock -- folded into gameStore.nextDay()'s netChange alongside revenue,
// rent, and wages. Dividends are not treated as taxable business profit
// (TAX_RATE only ever applies to business revenue minus rent/wages, see
// taxOnProfit) -- they're a separate asset class, not the tycoon's
// business income.
export function totalDailyDividends(holdings, prices) {
  return STOCKS.reduce((sum, stock) => {
    const shares = holdings?.[stock.id]?.shares ?? 0;
    if (!shares) return sum;
    const price = prices?.[stock.id] ?? stock.startPrice;
    return sum + dividendPayout(stock, price, shares);
  }, 0);
}

// --- Real estate (Stage 7) ----------------------------------------------
//
// Extends the existing Marketplace building catalog into an investable
// asset: every building's *ownership* price is a live market value
// (gameStore's `buildingMarketValues`, { [buildingId]: price }) instead of
// the static `building.buyPrice` -- seeded from buyPrice, then random-
// walked once per day in nextDay() (see rollMarketValues), same cadence as
// stocks. `building.dailyRent`/`rentDeposit` (what a *renter* pays) are
// untouched -- only the buy-outright price moves.
//
// Unlike stocks (continuous +/- noise), real estate is meant to feel like
// the "safer, boring" asset: it drifts up steadily almost every day, but
// carries a small daily chance of a real crash. A floor (as a fraction of
// the building's original price) still applies so a crash streak can't
// wipe a property out entirely.
export const MARKET_VALUE_DAILY_GROWTH = 0.0008; // +0.08%/day on a normal (non-crash) day
export const MARKET_VALUE_CRASH_CHANCE = 0.01; // 1% chance per day of a crash instead of growth
export const MARKET_VALUE_CRASH_MIN = 0.1; // a crash wipes 10-25% of that day's value
export const MARKET_VALUE_CRASH_MAX = 0.25;
export const MARKET_VALUE_FLOOR_RATIO = 0.5; // can never fall below 50% of the original buyPrice

export function seedMarketValues() {
  const values = {};
  for (const building of BUILDINGS) values[building.id] = building.buyPrice;
  return values;
}

// One day's roll for a single building. Returns { value, crashed } so
// callers (nextDay) can surface crash days as their own news entry rather
// than just a lower number.
export function rollMarketValue(building, currentValue) {
  const crashed = Math.random() < MARKET_VALUE_CRASH_CHANCE;
  const next = crashed
    ? currentValue * (1 - (MARKET_VALUE_CRASH_MIN + Math.random() * (MARKET_VALUE_CRASH_MAX - MARKET_VALUE_CRASH_MIN)))
    : currentValue * (1 + MARKET_VALUE_DAILY_GROWTH);
  const floor = building.buyPrice * MARKET_VALUE_FLOOR_RATIO;
  return { value: Math.max(floor, Math.round(next)), crashed };
}

// Rolls every building in the catalog for one day. Returns { values,
// crashedIds } -- crashedIds backs a single aggregated "property values
// dropped" news entry rather than one per crashed building.
export function rollMarketValues(prevValues) {
  const values = {};
  const crashedIds = [];
  for (const building of BUILDINGS) {
    const current = prevValues?.[building.id] ?? building.buyPrice;
    const { value, crashed } = rollMarketValue(building, current);
    values[building.id] = value;
    if (crashed) crashedIds.push(building.id);
  }
  return { values, crashedIds };
}

// --- Passive rental income -----------------------------------------------
//
// An *owned* building the player isn't currently running their own
// business in earns passive income from a third-party tenant -- a fraction
// of the building's own dailyRent stat (the same figure a business would
// pay to lease it). A *rented* (not owned) building never earns this: the
// player is the tenant there, not the landlord.
export const RENTAL_INCOME_RATE = 0.7;

export function passiveRentalIncome(building) {
  return Math.round(building.dailyRent * RENTAL_INCOME_RATE);
}

export function totalPassiveRentalIncome(acquiredBuildings, businesses) {
  return acquiredBuildings.reduce((sum, a) => {
    if (a.mode !== "own") return sum;
    const building = buildingById(a.buildingId);
    if (!building) return sum;
    const occupied = businesses.some((b) => b.buildingId === a.buildingId && b.active !== false);
    if (occupied) return sum;
    return sum + passiveRentalIncome(building);
  }, 0);
}

// --- Line of credit ---------------------------------------------------
//
// A single revolving line the player can open once (gameStore.openCreditLine),
// then borrow from / repay freely up to its limit (LOAN_PRODUCT in
// data/loanProduct.js). Interest accrues daily on the outstanding balance;
// nextDay() attempts to pay that day's interest out of bankBalance the same
// way tax auto-payment does, but unlike tax it's a per-day amount, not a
// periodic lump sum, and a missed payment doesn't force the balance down --
// it capitalizes (adds to the balance) instead, so unpaid debt compounds.
export function creditLineInterest(creditLine) {
  if (!creditLine) return 0;
  return creditLine.balance * creditLine.dailyRate;
}

// One day's payment attempt. Returns { balance, interestCharged,
// paidFromBank, missed } -- paidFromBank is what nextDay() should actually
// deduct from bankBalance (0 when missed, since the interest capitalized
// into the balance instead of leaving the bank).
export function rollCreditLinePayment(creditLine, bankBalance) {
  if (!creditLine) return { balance: 0, interestCharged: 0, paidFromBank: 0, missed: false };
  const interest = creditLineInterest(creditLine);
  const canPay = bankBalance >= interest;
  return {
    balance: canPay ? creditLine.balance : creditLine.balance + interest,
    interestCharged: interest,
    paidFromBank: canPay ? interest : 0,
    missed: !canPay,
  };
}

// --- Savings account ---------------------------------------------------
//
// The mirror of the line of credit: always available (no "open" step,
// unlike borrowing -- there's no credit risk in the bank holding your own
// money), interest compounds daily on the balance, and unlike the credit
// line it's *always* paid -- there's no bank balance to check against,
// since interest is credited straight into the savings balance rather
// than moved out of bankBalance. A separate opt-in "auto-deposit"
// percentage sweeps a cut of each day's *positive* net income from
// bankBalance into savings automatically; a loss day sweeps nothing.
export function savingsInterest(savings) {
  if (!savings) return 0;
  return savings.balance * savings.dailyRate;
}

export function clampAutoDepositPercent(percent) {
  if (!Number.isFinite(percent)) return 0;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

// netChangeBeforeSweep is the day's bankBalance delta *before* any sweep is
// taken out of it -- only a positive day sweeps anything.
export function computeAutoDeposit(netChangeBeforeSweep, autoDepositPercent) {
  if (netChangeBeforeSweep <= 0 || autoDepositPercent <= 0) return 0;
  return Math.round(netChangeBeforeSweep * (autoDepositPercent / 100));
}

// --- Net worth (Stage 9: Rivals) -----------------------------------------
//
// One combined figure summing every asset class the player can hold, used
// only to rank against rivals on the leaderboard -- never stored, always
// computed fresh from the live store slices that already exist for each
// asset class individually.
//
// A business's contribution is *capitalized* off its deterministic
// expected daily revenue (not the noisy actual roll, so net worth doesn't
// jitter day to day the same amount dailyEarnings does) at a flat
// multiple -- "worth roughly 250 days of earnings," the same
// derive-a-price-from-a-stat spirit as building buyPrice being derived
// from dailyRent, not a separately invented number per business.
export const BUSINESS_VALUATION_MULTIPLIER = 250;

export function businessValuation(business, building, productPrices, day) {
  if (!business.active || !building) return 0;
  return expectedDailyRevenue(business, building, productPrices, day) * BUSINESS_VALUATION_MULTIPLIER;
}

export function businessesValuation(businesses, productPrices, day) {
  return businesses.reduce((sum, b) => {
    const building = buildingById(b.buildingId);
    return sum + businessValuation(b, building, productPrices, day);
  }, 0);
}

export function stockPortfolioValue(stockHoldings, stockPrices) {
  return STOCKS.reduce((sum, stock) => {
    const shares = stockHoldings?.[stock.id]?.shares ?? 0;
    if (!shares) return sum;
    return sum + shares * (stockPrices?.[stock.id] ?? stock.startPrice);
  }, 0);
}

export function realEstatePortfolioValue(acquiredBuildings, buildingMarketValues) {
  return acquiredBuildings.reduce((sum, a) => {
    if (a.mode !== "own") return sum;
    return sum + (buildingMarketValues?.[a.buildingId] ?? 0);
  }, 0);
}

export function computeNetWorth({
  bankBalance,
  businesses,
  productPrices,
  day,
  stockHoldings,
  stockPrices,
  acquiredBuildings,
  buildingMarketValues,
  creditLineBalance = 0,
  savingsBalance = 0,
}) {
  return (
    bankBalance +
    stockPortfolioValue(stockHoldings, stockPrices) +
    realEstatePortfolioValue(acquiredBuildings, buildingMarketValues) +
    businessesValuation(businesses, productPrices, day) +
    savingsBalance -
    creditLineBalance
  );
}

// --- Rivals (Stage 9) -----------------------------------------------------
//
// A small fixed list of fictional AI rivals (data/rivals.js), each with
// its own daily compound-growth rate and volatility so the leaderboard
// spreads out realistically instead of moving in lockstep. Unlike stocks
// (mean-reverting around a fixed price) rivals are meant to trend upward
// like a real competing empire, so this compounds forward from wherever
// the rival currently sits rather than pulling back toward a start value
// -- floored at a fraction of that rival's *starting* net worth so a bad
// streak shrinks a rival, never wipes them out to zero.
export const RIVAL_NET_WORTH_FLOOR_RATIO = 0.1;

export function seedRivalNetWorths() {
  const values = {};
  for (const rival of RIVALS) values[rival.id] = rival.startingNetWorth;
  return values;
}

export function rollRivalNetWorth(rival, currentNetWorth) {
  const noise = (Math.random() * 2 - 1) * rival.volatility;
  const next = currentNetWorth * (1 + rival.dailyGrowth + noise);
  const floor = rival.startingNetWorth * RIVAL_NET_WORTH_FLOOR_RATIO;
  return Math.max(floor, Math.round(next));
}

export function rollRivalNetWorths(prevNetWorths) {
  const values = {};
  for (const rival of RIVALS) {
    const current = prevNetWorths?.[rival.id] ?? rival.startingNetWorth;
    values[rival.id] = rollRivalNetWorth(rival, current);
  }
  return values;
}

// Ranked list of every rival plus the player, descending by net worth --
// backs both the Rivals screen and the rank-change news check in
// gameStore.nextDay(). `playerNetWorth` uses computeNetWorth's output.
export function computeLeaderboard(playerNetWorth, rivalNetWorths) {
  const entries = [
    { id: "player", name: "You", netWorth: playerNetWorth, isPlayer: true },
    ...RIVALS.map((rival) => ({
      id: rival.id,
      name: rival.name,
      netWorth: rivalNetWorths?.[rival.id] ?? rival.startingNetWorth,
      isPlayer: false,
    })),
  ];
  return entries.sort((a, b) => b.netWorth - a.netWorth);
}

// 1-indexed -- #1 is the top of the leaderboard.
export function computePlayerRank(playerNetWorth, rivalNetWorths) {
  const leaderboard = computeLeaderboard(playerNetWorth, rivalNetWorths);
  return leaderboard.findIndex((e) => e.isPlayer) + 1;
}
