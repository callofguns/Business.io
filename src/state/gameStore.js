import { create } from "zustand";
import { pickFlavorNews } from "../data/newsFlavor";

let newsIdSeq = 1;

function makeNewsEntry({ icon, title, subtitle, tone = "neutral", day }) {
  return { id: newsIdSeq++, icon, title, subtitle, tone, day };
}

const INITIAL_STATE = {
  day: 1,
  playerName: "Founder",
  bankBalance: 50000,
  // Placeholders for future stages — kept here now so later work only adds
  // reducers/screens, it doesn't need to reshape the store.
  businesses: [],
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
    const { day, bankBalance, news } = get();
    const newDay = day + 1;

    // No businesses yet in this stage, so the only cashflow is a small
    // amount of bank interest — this keeps the balance (and its animation)
    // alive while later stages add real income/expenses here.
    const interestRate = 0.0004 + Math.random() * 0.0011;
    const interest = Math.round(bankBalance * interestRate);
    const newBalance = bankBalance + interest;

    const entries = [];
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

    for (const item of pickFlavorNews(Math.random() < 0.5 ? 1 : 2)) {
      entries.push(
        makeNewsEntry({
          icon: item.icon,
          title: item.title,
          tone: item.tone,
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
