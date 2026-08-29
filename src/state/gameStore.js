import { create } from "zustand";

let newsIdSeq = 1;

function makeNewsEntry({ icon, title, subtitle, tone = "neutral", day }) {
  return { id: newsIdSeq++, icon, title, subtitle, tone, day };
}

const STARTER_BUSINESSES = [
  {
    id: "biz-corner-cafe",
    name: "Corner Café",
    type: "Coffee Shop",
    location: { city: "London", area: "Camden" },
    active: true,
    dailyEarnings: 340,
  },
  {
    id: "biz-fitzone-gym",
    name: "FitZone Gym",
    type: "Gym",
    location: { city: "London", area: "Shoreditch" },
    active: true,
    dailyEarnings: 512,
  },
  {
    id: "biz-quickbite-deli",
    name: "QuickBite Deli",
    type: "Fast Food Restaurant",
    location: { city: "London", area: "Peckham" },
    active: true,
    dailyEarnings: 275,
  },
];

const INITIAL_STATE = {
  day: 1,
  bankBalance: 50000,
  businesses: STARTER_BUSINESSES,
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

  nextDay: () => {
    const { day, bankBalance, businesses, news } = get();
    const newDay = day + 1;

    const businessIncome = businesses
      .filter((b) => b.active)
      .reduce((sum, b) => sum + b.dailyEarnings, 0);

    const interestRate = 0.0004 + Math.random() * 0.0011;
    const interest = Math.round(bankBalance * interestRate);
    const newBalance = bankBalance + businessIncome + interest;

    const entries = [];
    if (businessIncome > 0) {
      entries.push(
        makeNewsEntry({
          icon: "briefcase",
          title: "Daily earnings collected",
          subtitle: `+£${businessIncome.toLocaleString("en-GB")} from ${businesses.length} businesses`,
          tone: "good",
          day: newDay,
        })
      );
    }
    if (interest > 0) {
      entries.push(
        makeNewsEntry({
          icon: "banknote",
          title: "Bank interest credited",
          subtitle: `+£${interest.toLocaleString("en-GB")} added to your balance`,
          tone: "good",
          day: newDay,
        })
      );
    }

    set({
      day: newDay,
      bankBalance: newBalance,
      news: [...entries, ...news].slice(0, 30),
    });
  },
}));
