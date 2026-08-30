import { create } from "zustand";
import { useCurrencyStore } from "./currencyStore";
import { formatMoney, weekdayIndex } from "../lib/format";
import { STARTER_BUSINESS_OPTIONS, BUSINESS_TYPES } from "../data/businessTypes";
import { buildingById } from "../data/buildings";
import {
  seedProductPrices,
  rollProductPrices,
  rollDailyRevenue,
  startingCapacity,
  capacityUpgrade,
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
  // Set by nextDay() and read by the day-summary modal.
  lastDaySummary: null,
  // Placeholders for future stages — kept here now so later work only adds
  // reducers/screens, it doesn't need to reshape the store.
  employees: [],
  stocks: [],
  properties: [],
  rivals: [],
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

    const { bankBalance, acquiredBuildings, day, news } = get();
    if (acquiredBuildings.some((a) => a.buildingId === buildingId)) return;

    const cost = mode === "own" ? building.buyPrice : building.rentDeposit;
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
      startedDay: state.day,
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

  investInCapacity: ({ businessId }) => {
    const state = get();
    const business = state.businesses.find((b) => b.id === businessId);
    if (!business) return;
    const building = buildingById(business.buildingId);
    if (!building) return;

    const upgrade = capacityUpgrade(business, building);
    if (!upgrade) return; // already at building max
    if (state.bankBalance < upgrade.cost) return;

    const currency = useCurrencyStore.getState().currency;
    set({
      bankBalance: state.bankBalance - upgrade.cost,
      businesses: state.businesses.map((b) =>
        b.id === businessId ? { ...b, currentCapacity: upgrade.nextCapacity } : b
      ),
      news: [
        makeNewsEntry({
          icon: "trending-up",
          title: `${business.name} expanded capacity`,
          subtitle: `-${formatMoney(upgrade.cost, { currency })} · ${upgrade.nextCapacity}/hr capacity`,
          tone: "good",
          day: state.day,
        }),
        ...state.news,
      ].slice(0, 30),
    });
  },

  nextDay: () => {
    const { day, bankBalance, businesses, acquiredBuildings, productPrices, news } = get();
    const newDay = day + 1;
    const currency = useCurrencyStore.getState().currency;
    const isSunday = weekdayIndex(newDay) === 6;
    const prices = isSunday ? rollProductPrices() : productPrices;

    let businessIncome = 0;
    let activeCount = 0;
    const updatedBusinesses = businesses.map((b) => {
      if (!b.active) return b;
      const building = buildingById(b.buildingId);
      if (!building) return b;
      activeCount += 1;
      const earned = rollDailyRevenue(b, building, prices);
      businessIncome += earned;
      return { ...b, dailyEarnings: earned };
    });

    const rent = acquiredBuildings.reduce((sum, a) => {
      if (a.mode !== "rent") return sum;
      const building = buildingById(a.buildingId);
      return sum + (building?.dailyRent ?? 0);
    }, 0);

    const otherExpenses = 0;
    const netChange = businessIncome - rent - otherExpenses;
    const newBalance = bankBalance + netChange;

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
      news: [...entries, ...news].slice(0, 30),
      lastDaySummary: {
        day: newDay,
        revenue: businessIncome,
        rent,
        otherExpenses,
        netChange,
        newBalance,
      },
    });
  },
}));
