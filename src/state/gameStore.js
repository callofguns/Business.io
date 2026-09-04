import { create } from "zustand";
import { useCurrencyStore } from "./currencyStore";
import { formatMoney, weekdayIndex } from "../lib/format";
import { STARTER_BUSINESS_OPTIONS, BUSINESS_TYPES } from "../data/businessTypes";
import { buildingById } from "../data/buildings";
import { STOCKS, stockById } from "../data/stocks";
import { LOAN_PRODUCT } from "../data/loanProduct";
import {
  seedProductPrices,
  rollProductPrices,
  rollDailyOutcome,
  startingCapacity,
  staffHireCost,
  staffFireResult,
  totalDailyWages,
  priceRatio,
  satisfactionTarget,
  stepSatisfaction,
  SATISFACTION_START,
  promotionCost,
  isPromotionActive,
  PROMOTION_DURATION_DAYS,
  taxOnProfit,
  isTaxPaymentDue,
  TAX_RATE,
  seedStockPrices,
  seedStockPriceHistory,
  rollStockPrices,
  totalDailyDividends,
  seedMarketValues,
  rollMarketValues,
  totalPassiveRentalIncome,
  seedRivalNetWorths,
  rollRivalNetWorths,
  computeNetWorth,
  computePlayerRank,
  rollCreditLinePayment,
} from "../lib/economy";

let newsIdSeq = 1;
let businessIdSeq = 1;

function makeNewsEntry({ icon, title, subtitle, tone = "neutral", day }) {
  return { id: newsIdSeq++, icon, title, subtitle, tone, day };
}

// businessType is retail/office restricted to matching buildings; acquired
// buildings not yet occupied by a business are "vacant".
function isVacant(state, buildingId) {
  return !state.businesses.some((b) => b.buildingId === buildingId && b.active !== false);
}

export function vacantBuildingsFor(state, businessType) {
  const requiredBuildingType = BUSINESS_TYPES[businessType]?.buildingType;
  if (!requiredBuildingType) return [];
  return state.acquiredBuildings
    .map((a) => buildingById(a.buildingId))
    .filter((b) => b && b.type === requiredBuildingType)
    .filter((b) => isVacant(state, b.id));
}

export function buildingOccupant(state, buildingId) {
  return state.businesses.find((b) => b.buildingId === buildingId) ?? null;
}

const INITIAL_STATE = {
  day: 1,
  bankBalance: 50000,
  businesses: [],
  // { buildingId, mode: "own" | "rent", acquiredDay }[] -- buildingId is the
  // identity, a building can only be acquired once (buy XOR rent).
  acquiredBuildings: [],
  // { [businessType]: { [productId]: currentPrice } }, re-rolled every
  // Sunday inside nextDay().
  productPrices: seedProductPrices(),
  lastPriceUpdateDay: 1,
  // Flat TAX_RATE of daily net business profit (revenue - rent) accrues
  // here every day; paid out (added to lastDaySummary.otherExpenses,
  // pushed to taxHistory, reset to 0) either automatically every
  // TAX_PERIOD_DAYS (see nextDay) or early via payTaxesNow().
  taxAccrued: 0,
  // { day, amount }[], newest first, capped -- the Tax Office's payment
  // history.
  taxHistory: [],
  lastTaxPaymentDay: 1,
  // Set by nextDay() and read by the day-summary modal.
  lastDaySummary: null,
  // { [stockId]: currentPrice }, re-rolled every day inside nextDay() (see
  // rollStockPrices in lib/economy.js) -- unlike product prices, stocks
  // move daily, not just on Sundays.
  stockPrices: seedStockPrices(),
  // { [stockId]: { day, price }[] }, oldest first, capped to the last 30
  // entries -- backs each stock's Finance Manager price chart.
  stockPriceHistory: seedStockPriceHistory(),
  // { [stockId]: { shares, avgCost } }, sparse -- a stock with no shares
  // held has no entry. avgCost is the average price paid per share still
  // held (unaffected by selling, since only the average matters for the
  // P/L display -- no FIFO/LIFO lot tracking).
  stockHoldings: {},
  // { [buildingId]: currentValue }, re-rolled every day inside nextDay()
  // (see rollMarketValues in lib/economy.js). Seeded from each building's
  // static buyPrice and drifts from there -- this is now the live cost to
  // acquire a building "own" (see acquireBuilding) and the live proceeds
  // from selling one back (see sellBuilding), not the frozen buyPrice.
  buildingMarketValues: seedMarketValues(),
  // { [rivalId]: currentNetWorth }, re-rolled every day inside nextDay()
  // (see rollRivalNetWorths in lib/economy.js). The player's own net worth
  // is never stored -- it's always computed fresh via computeNetWorth from
  // the state slices that already exist for each asset class.
  rivalNetWorths: seedRivalNetWorths(),
  // null until openCreditLine() is called (Stage 11: Loans); then
  // { limit, dailyRate, balance, openedDay }. A single revolving line, not
  // a list -- borrow/repayCreditLine adjust `balance` freely up to `limit`.
  // Interest accrues daily on `balance` in nextDay() via
  // rollCreditLinePayment(); it's a liability, subtracted in
  // computeNetWorth().
  creditLine: null,
  news: [
    makeNewsEntry({
      icon: "briefcase",
      title: "You founded your first company",
      subtitle: "Day 1 begins — good luck out there",
      tone: "good",
      day: 1,
    }),
  ],
};

export const useGameStore = create((set, get) => ({
  ...INITIAL_STATE,

  acquireBuilding: ({ buildingId, mode }) => {
    if (mode !== "own" && mode !== "rent") return;
    const building = buildingById(buildingId);
    if (!building) return;

    const { bankBalance, acquiredBuildings, day, news, buildingMarketValues } = get();
    if (acquiredBuildings.some((a) => a.buildingId === buildingId)) return;

    // Buying outright costs the building's *live* market value (see
    // buildingMarketValues/rollMarketValues), not the frozen buyPrice --
    // renting is unaffected, its deposit/dailyRent are static lease terms.
    const cost = mode === "own" ? buildingMarketValues[buildingId] ?? building.buyPrice : building.rentDeposit;
    if (bankBalance < cost) return;

    const currency = useCurrencyStore.getState().currency;
    set({
      bankBalance: bankBalance - cost,
      acquiredBuildings: [...acquiredBuildings, { buildingId, mode, acquiredDay: day }],
      news: [
        makeNewsEntry({
          icon: "landmark",
          title: `You ${mode === "own" ? "bought" : "leased"} ${building.name}`,
          subtitle:
            mode === "own"
              ? `-${formatMoney(cost, { currency })} · Owned outright`
              : `-${formatMoney(cost, { currency })} deposit · ${formatMoney(building.dailyRent, { currency })}/day`,
          tone: "good",
          day,
        }),
        ...news,
      ].slice(0, 30),
    });
  },

  startBusiness: ({ type, name, buildingId }) => {
    const option = STARTER_BUSINESS_OPTIONS.find((o) => o.type === type);
    if (!option) return;

    const trimmedName = name.trim();
    if (!trimmedName) return;

    const state = get();
    const building = buildingById(buildingId);
    if (!building) return;
    if (!state.acquiredBuildings.some((a) => a.buildingId === buildingId)) return;
    if (building.type !== option.buildingType) return;
    if (!isVacant(state, buildingId)) return;
    if (state.bankBalance < option.cost) return;

    const currency = useCurrencyStore.getState().currency;
    const newBusiness = {
      id: `biz-${businessIdSeq++}`,
      name: trimmedName,
      type: option.type,
      buildingId,
      active: true,
      dailyEarnings: 0,
      currentCapacity: startingCapacity(building),
      // Headcount hired on the Hiring screen -- currentCapacity is always
      // kept in lockstep with this via hireStaff/fireStaff (see
      // capacityForStaff in lib/economy.js), never adjusted independently.
      staffCount: 0,
      startedDay: state.day,
      // Sparse { [productId]: price } -- unset products just follow the
      // live market price (see effectivePrice in lib/economy.js).
      customPrices: {},
      // 0-100 reputation score, drifts daily toward a pricing-driven target
      // (see satisfactionTarget/stepSatisfaction in lib/economy.js).
      satisfaction: SATISFACTION_START,
      // Set by runPromotion(); a day <= this counts as an active campaign
      // (see isPromotionActive). Left stale after expiry -- only ever read
      // relative to the current day, never checked for null-ness alone.
      promotionEndDay: null,
      // { day, visitors }[], newest last, capped to the last 30 entries --
      // backs the Business Detail traffic chart.
      trafficHistory: [],
    };

    set({
      bankBalance: state.bankBalance - option.cost,
      businesses: [...state.businesses, newBusiness],
      news: [
        makeNewsEntry({
          icon: "briefcase",
          title: `You opened ${newBusiness.name}`,
          subtitle: `-${formatMoney(option.cost, { currency })} · ${building.name}`,
          tone: "good",
          day: state.day,
        }),
        ...state.news,
      ].slice(0, 30),
    });
  },

  hireStaff: ({ businessId }) => {
    const state = get();
    const business = state.businesses.find((b) => b.id === businessId);
    if (!business) return;
    const building = buildingById(business.buildingId);
    if (!building) return;

    const result = staffHireCost(business, building);
    if (!result) return; // already staffed to building max
    if (state.bankBalance < result.fee) return;

    const currency = useCurrencyStore.getState().currency;
    set({
      bankBalance: state.bankBalance - result.fee,
      businesses: state.businesses.map((b) =>
        b.id === businessId
          ? { ...b, staffCount: result.nextStaffCount, currentCapacity: result.nextCapacity }
          : b
      ),
      news: [
        makeNewsEntry({
          icon: "users",
          title: `${business.name} hired a new staff member`,
          subtitle: `-${formatMoney(result.fee, { currency })} hiring fee · ${formatMoney(result.dailyWage, { currency })}/day wage · ${result.nextCapacity}/hr capacity`,
          tone: "good",
          day: state.day,
        }),
        ...state.news,
      ].slice(0, 30),
    });
  },

  fireStaff: ({ businessId }) => {
    const state = get();
    const business = state.businesses.find((b) => b.id === businessId);
    if (!business) return;
    const building = buildingById(business.buildingId);
    if (!building) return;

    const result = staffFireResult(business, building);
    if (!result) return; // no staff left to let go

    set({
      businesses: state.businesses.map((b) =>
        b.id === businessId
          ? { ...b, staffCount: result.nextStaffCount, currentCapacity: result.nextCapacity }
          : b
      ),
      news: [
        makeNewsEntry({
          icon: "users",
          title: `${business.name} let a staff member go`,
          subtitle: `${result.nextCapacity}/hr capacity · daily wages reduced`,
          tone: "neutral",
          day: state.day,
        }),
        ...state.news,
      ].slice(0, 30),
    });
  },

  runPromotion: ({ businessId }) => {
    const state = get();
    const business = state.businesses.find((b) => b.id === businessId);
    if (!business) return;
    const building = buildingById(business.buildingId);
    if (!building) return;
    if (isPromotionActive(business, state.day)) return; // one campaign at a time

    const cost = promotionCost(building);
    if (state.bankBalance < cost) return;

    const currency = useCurrencyStore.getState().currency;
    const endDay = state.day + PROMOTION_DURATION_DAYS;
    set({
      bankBalance: state.bankBalance - cost,
      businesses: state.businesses.map((b) =>
        b.id === businessId ? { ...b, promotionEndDay: endDay } : b
      ),
      news: [
        makeNewsEntry({
          icon: "megaphone",
          title: `${business.name} launched a promotion`,
          subtitle: `-${formatMoney(cost, { currency })} · +50% traffic for ${PROMOTION_DURATION_DAYS} days`,
          tone: "good",
          day: state.day,
        }),
        ...state.news,
      ].slice(0, 30),
    });
  },

  // Voluntary early payment of the accrued tax balance, from the Tax
  // Office's "Pay Now" -- also resets the TAX_PERIOD_DAYS countdown from
  // today, same as an automatic payment would.
  payTaxesNow: () => {
    const state = get();
    const amount = Math.round(state.taxAccrued);
    if (amount <= 0) return; // nothing owed
    if (state.bankBalance < amount) return;

    const currency = useCurrencyStore.getState().currency;
    set({
      bankBalance: state.bankBalance - amount,
      taxAccrued: 0,
      lastTaxPaymentDay: state.day,
      taxHistory: [{ day: state.day, amount }, ...state.taxHistory].slice(0, 24),
      news: [
        makeNewsEntry({
          icon: "receipt",
          title: "You paid your taxes early",
          subtitle: `-${formatMoney(amount, { currency })} · accrued balance cleared`,
          tone: "bad",
          day: state.day,
        }),
        ...state.news,
      ].slice(0, 30),
    });
  },

  // price: null (or omitted) resets the product back to following the live
  // market price. Otherwise clamped to >= 0 -- no upper bound (the player's
  // call), but a negative price makes no sense.
  setProductPrice: ({ businessId, productId, price }) => {
    const state = get();
    const business = state.businesses.find((b) => b.id === businessId);
    if (!business) return;
    const productExists = BUSINESS_TYPES[business.type]?.products.some((p) => p.id === productId);
    if (!productExists) return;

    const nextCustomPrices = { ...business.customPrices };
    if (price == null) {
      delete nextCustomPrices[productId];
    } else {
      nextCustomPrices[productId] = Math.max(0, price);
    }

    set({
      businesses: state.businesses.map((b) =>
        b.id === businessId ? { ...b, customPrices: nextCustomPrices } : b
      ),
    });
  },

  buyStock: ({ stockId, shares }) => {
    const stock = stockById(stockId);
    if (!stock) return;
    const qty = Math.floor(shares);
    if (!Number.isFinite(qty) || qty <= 0) return;

    const state = get();
    const price = state.stockPrices[stockId] ?? stock.startPrice;
    const cost = price * qty;
    if (state.bankBalance < cost) return;

    const existing = state.stockHoldings[stockId];
    const nextShares = (existing?.shares ?? 0) + qty;
    const nextAvgCost = existing
      ? Math.round(((existing.avgCost * existing.shares + cost) / nextShares) * 100) / 100
      : price;

    const currency = useCurrencyStore.getState().currency;
    set({
      bankBalance: state.bankBalance - cost,
      stockHoldings: {
        ...state.stockHoldings,
        [stockId]: { shares: nextShares, avgCost: nextAvgCost },
      },
      news: [
        makeNewsEntry({
          icon: "trending-up",
          title: `You bought ${qty} share${qty === 1 ? "" : "s"} of ${stock.ticker}`,
          subtitle: `-${formatMoney(cost, { currency })} · ${formatMoney(price, { currency, decimals: true })}/share`,
          tone: "good",
          day: state.day,
        }),
        ...state.news,
      ].slice(0, 30),
    });
  },

  sellStock: ({ stockId, shares }) => {
    const stock = stockById(stockId);
    if (!stock) return;
    const qty = Math.floor(shares);
    if (!Number.isFinite(qty) || qty <= 0) return;

    const state = get();
    const existing = state.stockHoldings[stockId];
    if (!existing || existing.shares < qty) return; // can't sell more than held

    const price = state.stockPrices[stockId] ?? stock.startPrice;
    const proceeds = price * qty;
    const remainingShares = existing.shares - qty;
    const nextHoldings = { ...state.stockHoldings };
    if (remainingShares > 0) {
      nextHoldings[stockId] = { shares: remainingShares, avgCost: existing.avgCost };
    } else {
      delete nextHoldings[stockId];
    }

    const currency = useCurrencyStore.getState().currency;
    set({
      bankBalance: state.bankBalance + proceeds,
      stockHoldings: nextHoldings,
      news: [
        makeNewsEntry({
          icon: "trending-down",
          title: `You sold ${qty} share${qty === 1 ? "" : "s"} of ${stock.ticker}`,
          subtitle: `+${formatMoney(proceeds, { currency })} · ${formatMoney(price, { currency, decimals: true })}/share`,
          tone: "neutral",
          day: state.day,
        }),
        ...state.news,
      ].slice(0, 30),
    });
  },

  // Sells an *owned* building back at its current live market value. Only
  // "own" acquisitions are sellable (a rented lease isn't an investment to
  // liquidate); blocked while one of the player's own businesses is
  // running in it -- selling the building out from under your own
  // business isn't modeled, vacate it first.
  sellBuilding: ({ buildingId }) => {
    const state = get();
    const acquisition = state.acquiredBuildings.find((a) => a.buildingId === buildingId);
    if (!acquisition || acquisition.mode !== "own") return;
    const building = buildingById(buildingId);
    if (!building) return;
    if (!isVacant(state, buildingId)) return;

    const price = state.buildingMarketValues[buildingId] ?? building.buyPrice;
    const currency = useCurrencyStore.getState().currency;
    set({
      bankBalance: state.bankBalance + price,
      acquiredBuildings: state.acquiredBuildings.filter((a) => a.buildingId !== buildingId),
      news: [
        makeNewsEntry({
          icon: "landmark",
          title: `You sold ${building.name}`,
          subtitle: `+${formatMoney(price, { currency })} · ${
            price >= building.buyPrice ? "a profit" : "a loss"
          } vs. purchase price`,
          tone: price >= building.buyPrice ? "good" : "bad",
          day: state.day,
        }),
        ...state.news,
      ].slice(0, 30),
    });
  },

  // Opens the single revolving Business Line of Credit (Stage 11: Loans) --
  // free, instant, a no-op if one is already open.
  openCreditLine: () => {
    const state = get();
    if (state.creditLine) return;

    set({
      creditLine: {
        limit: LOAN_PRODUCT.limit,
        dailyRate: LOAN_PRODUCT.dailyRate,
        balance: 0,
        openedDay: state.day,
      },
      news: [
        makeNewsEntry({
          icon: "credit-card",
          title: `You opened a ${LOAN_PRODUCT.name}`,
          subtitle: `${Math.round(LOAN_PRODUCT.apr * 100)}% APR · up to ${formatMoney(LOAN_PRODUCT.limit, {
            currency: useCurrencyStore.getState().currency,
          })} available`,
          tone: "neutral",
          day: state.day,
        }),
        ...state.news,
      ].slice(0, 30),
    });
  },

  // Draws `amount` from the open credit line, up to available credit
  // (limit - balance). Credited straight to bankBalance.
  borrow: ({ amount }) => {
    const state = get();
    const { creditLine } = state;
    if (!creditLine) return;
    const draw = Math.round(amount);
    if (!Number.isFinite(draw) || draw <= 0) return;
    const available = creditLine.limit - creditLine.balance;
    if (draw > available) return;

    const currency = useCurrencyStore.getState().currency;
    set({
      bankBalance: state.bankBalance + draw,
      creditLine: { ...creditLine, balance: creditLine.balance + draw },
      news: [
        makeNewsEntry({
          icon: "credit-card",
          title: `You borrowed ${formatMoney(draw, { currency })}`,
          subtitle: `From your ${LOAN_PRODUCT.name}`,
          tone: "neutral",
          day: state.day,
        }),
        ...state.news,
      ].slice(0, 30),
    });
  },

  // Voluntary repayment toward the credit line balance, up to what's owed
  // and what's actually in the bank.
  repayCreditLine: ({ amount }) => {
    const state = get();
    const { creditLine } = state;
    if (!creditLine) return;
    const payment = Math.round(amount);
    if (!Number.isFinite(payment) || payment <= 0) return;
    if (payment > creditLine.balance) return;
    if (payment > state.bankBalance) return;

    const currency = useCurrencyStore.getState().currency;
    set({
      bankBalance: state.bankBalance - payment,
      creditLine: { ...creditLine, balance: creditLine.balance - payment },
      news: [
        makeNewsEntry({
          icon: "credit-card",
          title: `You repaid ${formatMoney(payment, { currency })}`,
          subtitle: `Toward your ${LOAN_PRODUCT.name}`,
          tone: "neutral",
          day: state.day,
        }),
        ...state.news,
      ].slice(0, 30),
    });
  },

  nextDay: () => {
    const {
      day,
      bankBalance,
      businesses,
      acquiredBuildings,
      productPrices,
      news,
      taxAccrued,
      taxHistory,
      lastTaxPaymentDay,
      stockPrices,
      stockPriceHistory,
      stockHoldings,
      buildingMarketValues,
      rivalNetWorths,
      creditLine,
    } = get();
    const newDay = day + 1;
    const currency = useCurrencyStore.getState().currency;
    const isSunday = weekdayIndex(newDay) === 6;
    const prices = isSunday ? rollProductPrices() : productPrices;

    // Rank-change news compares the player's leaderboard position before
    // today's changes against after -- captured now, before any mutation,
    // then again right before the final set() once every asset class has
    // its new-day value.
    const rankBefore = computePlayerRank(
      computeNetWorth({
        bankBalance,
        businesses,
        productPrices,
        day,
        stockHoldings,
        stockPrices,
        acquiredBuildings,
        buildingMarketValues,
        creditLineBalance: creditLine?.balance ?? 0,
      }),
      rivalNetWorths
    );

    let businessIncome = 0;
    let activeCount = 0;
    const updatedBusinesses = businesses.map((b) => {
      if (!b.active) return b;
      const building = buildingById(b.buildingId);
      if (!building) return b;
      activeCount += 1;
      const { revenue, visitors } = rollDailyOutcome(b, building, prices, newDay);
      businessIncome += revenue;
      const target = satisfactionTarget(priceRatio(b, prices));
      const satisfaction = stepSatisfaction(b.satisfaction ?? SATISFACTION_START, target);
      const trafficHistory = [...(b.trafficHistory ?? []), { day: newDay, visitors }].slice(-30);
      return { ...b, dailyEarnings: revenue, satisfaction, trafficHistory };
    });

    const rent = acquiredBuildings.reduce((sum, a) => {
      if (a.mode !== "rent") return sum;
      const building = buildingById(a.buildingId);
      return sum + (building?.dailyRent ?? 0);
    }, 0);

    const wages = totalDailyWages(businesses);

    // Stocks move every day (not gated on isSunday like product prices).
    const nextStockPrices = rollStockPrices(stockPrices);
    const nextStockPriceHistory = {};
    for (const stock of STOCKS) {
      nextStockPriceHistory[stock.id] = [
        ...(stockPriceHistory[stock.id] ?? []),
        { day: newDay, price: nextStockPrices[stock.id] },
      ].slice(-30);
    }
    const dividends = Math.round(totalDailyDividends(stockHoldings, nextStockPrices) * 100) / 100;

    // Real estate: buildings' market values also roll daily, and any owned
    // building not occupied by the player's own business earns passive
    // rental income.
    const { values: nextMarketValues, crashedIds } = rollMarketValues(buildingMarketValues);
    const rentalIncome = totalPassiveRentalIncome(acquiredBuildings, businesses);

    // Wages are a real operating cost, so they reduce taxable profit the
    // same way rent does. Dividends and rental income are a separate asset
    // class (not business profit), so they don't feed into the tax basis.
    const accruedAfterToday = taxAccrued + taxOnProfit(businessIncome - rent - wages);
    const taxDue = isTaxPaymentDue(newDay, lastTaxPaymentDay);
    const otherExpenses = taxDue ? Math.round(accruedAfterToday) : 0;
    const nextTaxAccrued = taxDue ? 0 : accruedAfterToday;
    const nextLastTaxPaymentDay = taxDue ? newDay : lastTaxPaymentDay;
    const nextTaxHistory = taxDue
      ? [{ day: newDay, amount: otherExpenses }, ...taxHistory].slice(0, 24)
      : taxHistory;

    // Line of credit: today's interest is paid out of the bank if
    // affordable, otherwise it capitalizes into the balance instead (see
    // rollCreditLinePayment) -- loanPayment is what actually left the bank,
    // 0 on a missed day.
    const creditLineResult = rollCreditLinePayment(creditLine, bankBalance);
    const loanPayment = creditLineResult.paidFromBank;
    const nextCreditLine = creditLine ? { ...creditLine, balance: creditLineResult.balance } : null;

    const netChange = businessIncome - rent - wages - otherExpenses - loanPayment + dividends + rentalIncome;
    const newBalance = bankBalance + netChange;

    const nextRivalNetWorths = rollRivalNetWorths(rivalNetWorths);
    const rankAfter = computePlayerRank(
      computeNetWorth({
        bankBalance: newBalance,
        businesses: updatedBusinesses,
        productPrices: prices,
        day: newDay,
        stockHoldings,
        stockPrices: nextStockPrices,
        acquiredBuildings,
        buildingMarketValues: nextMarketValues,
        creditLineBalance: nextCreditLine?.balance ?? 0,
      }),
      nextRivalNetWorths
    );

    const entries = [];
    if (isSunday) {
      entries.push(
        makeNewsEntry({
          icon: "newspaper",
          title: "Market prices updated",
          subtitle: "Weekly price movements are in",
          tone: "neutral",
          day: newDay,
        })
      );
    }
    if (businessIncome > 0) {
      entries.push(
        makeNewsEntry({
          icon: "briefcase",
          title: "Daily earnings collected",
          subtitle: `+${formatMoney(businessIncome, { currency })} from ${activeCount} business${activeCount === 1 ? "" : "es"}`,
          tone: "good",
          day: newDay,
        })
      );
    }
    if (rent > 0) {
      const rentedCount = acquiredBuildings.filter((a) => a.mode === "rent").length;
      entries.push(
        makeNewsEntry({
          icon: "trending-down",
          title: "Rent charged",
          subtitle: `-${formatMoney(rent, { currency })} · ${rentedCount} leased building${rentedCount === 1 ? "" : "s"}`,
          tone: "bad",
          day: newDay,
        })
      );
    }
    if (wages > 0) {
      entries.push(
        makeNewsEntry({
          icon: "users",
          title: "Staff wages paid",
          subtitle: `-${formatMoney(wages, { currency })} across your team`,
          tone: "bad",
          day: newDay,
        })
      );
    }
    if (dividends > 0) {
      entries.push(
        makeNewsEntry({
          icon: "banknote",
          title: "Dividends received",
          subtitle: `+${formatMoney(dividends, { currency })} from your stock holdings`,
          tone: "good",
          day: newDay,
        })
      );
    }
    if (rentalIncome > 0) {
      entries.push(
        makeNewsEntry({
          icon: "landmark",
          title: "Rental income collected",
          subtitle: `+${formatMoney(rentalIncome, { currency })} from vacant owned properties`,
          tone: "good",
          day: newDay,
        })
      );
    }
    if (crashedIds.length > 0) {
      entries.push(
        makeNewsEntry({
          icon: "trending-down",
          title: "Property values dropped",
          subtitle: `${crashedIds.length} building${crashedIds.length === 1 ? "" : "s"} in the market took a hit today`,
          tone: "bad",
          day: newDay,
        })
      );
    }
    if (rankAfter !== rankBefore) {
      const improved = rankAfter < rankBefore;
      entries.push(
        makeNewsEntry({
          icon: "trophy",
          title: improved ? `You climbed to #${rankAfter} on the leaderboard` : `You dropped to #${rankAfter} on the leaderboard`,
          subtitle: improved ? "You overtook a rival" : "A rival overtook you",
          tone: improved ? "good" : "bad",
          day: newDay,
        })
      );
    }
    if (taxDue && otherExpenses > 0) {
      entries.push(
        makeNewsEntry({
          icon: "receipt",
          title: "Taxes filed",
          subtitle: `-${formatMoney(otherExpenses, { currency })} · ${Math.round(TAX_RATE * 100)}% of accrued profit`,
          tone: "bad",
          day: newDay,
        })
      );
    }
    if (creditLineResult.missed) {
      entries.push(
        makeNewsEntry({
          icon: "credit-card",
          title: "Missed your line of credit payment",
          subtitle: `${formatMoney(creditLineResult.interestCharged, { currency, decimals: true })} interest added to your balance`,
          tone: "bad",
          day: newDay,
        })
      );
    }
    if (newBalance < 0) {
      entries.push(
        makeNewsEntry({
          icon: "trending-down",
          title: "Your balance is negative",
          subtitle: "Expenses are outrunning revenue",
          tone: "bad",
          day: newDay,
        })
      );
    }

    set({
      day: newDay,
      bankBalance: newBalance,
      businesses: updatedBusinesses,
      productPrices: prices,
      lastPriceUpdateDay: isSunday ? newDay : get().lastPriceUpdateDay,
      taxAccrued: nextTaxAccrued,
      taxHistory: nextTaxHistory,
      lastTaxPaymentDay: nextLastTaxPaymentDay,
      stockPrices: nextStockPrices,
      stockPriceHistory: nextStockPriceHistory,
      buildingMarketValues: nextMarketValues,
      rivalNetWorths: nextRivalNetWorths,
      creditLine: nextCreditLine,
      news: [...entries, ...news].slice(0, 30),
      lastDaySummary: {
        day: newDay,
        revenue: businessIncome,
        dividends,
        rentalIncome,
        rent,
        wages,
        otherExpenses,
        loanPayment,
        netChange,
        newBalance,
      },
    });
  },
}));
