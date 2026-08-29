import { create } from "zustand";
import { useCurrencyStore } from "./currencyStore";
import { formatMoney } from "../lib/format";
import { STARTER_BUSINESS_OPTIONS } from "../data/businessTypes";

let newsIdSeq = 1;
let businessIdSeq = 1;

function makeNewsEntry({ icon, title, subtitle, tone = "neutral", day }) {
  return { id: newsIdSeq++, icon, title, subtitle, tone, day };
}

const INITIAL_STATE = {
  day: 1,
  bankBalance: 50000,
  businesses: [],
  // Set by nextDay() and read by the day-summary modal. Rent/otherExpenses
  // are real fields, currently always 0 — no expense mechanic exists yet
  // (rent arrives with Real Estate, other costs with Hiring/Tax Office).
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

  startBusiness: ({ type, name }) => {
    const option = STARTER_BUSINESS_OPTIONS.find((o) => o.type === type);
    if (!option) return;

    const trimmedName = name.trim();
    if (!trimmedName) return;

    const { bankBalance, businesses, day, news } = get();
    if (bankBalance < option.cost) return;

    const currency = useCurrencyStore.getState().currency;
    const newBusiness = {
      id: `biz-${businessIdSeq++}`,
      name: trimmedName,
      type: option.type,
      active: true,
      dailyEarnings: 0,
      minEarnings: option.minEarnings,
      maxEarnings: option.maxEarnings,
    };

    set({
      bankBalance: bankBalance - option.cost,
      businesses: [...businesses, newBusiness],
      news: [
        makeNewsEntry({
          icon: "briefcase",
          title: `You opened ${newBusiness.name}`,
          subtitle: `-${formatMoney(option.cost, { currency })} · ${option.type}`,
          tone: "good",
          day,
        }),
        ...news,
      ].slice(0, 30),
    });
  },

  nextDay: () => {
    const { day, bankBalance, businesses, news } = get();
    const newDay = day + 1;
    const currency = useCurrencyStore.getState().currency;

    let businessIncome = 0;
    let activeCount = 0;
    const updatedBusinesses = businesses.map((b) => {
      if (!b.active) return b;
      activeCount += 1;
      const earned = Math.round(b.minEarnings + Math.random() * (b.maxEarnings - b.minEarnings));
      businessIncome += earned;
      return { ...b, dailyEarnings: earned };
    });

    const rent = 0;
    const otherExpenses = 0;
    const netChange = businessIncome - rent - otherExpenses;
    const newBalance = bankBalance + netChange;

    const entries = [];
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

    set({
      day: newDay,
      bankBalance: newBalance,
      businesses: updatedBusinesses,
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
