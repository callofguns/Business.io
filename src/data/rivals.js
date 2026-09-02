// A small fixed list of fictional rival tycoons for the Rivals leaderboard
// (Stage 9) -- flavor only, not real companies. Each has its own starting
// net worth and daily growth profile (steady vs. volatile) so the field
// spreads out realistically over a playthrough instead of moving in lockstep.
// See rollRivalNetWorth/rollRivalNetWorths in lib/economy.js for the daily
// compounding formula.
export const RIVALS = [
  { id: "marlowe-finch", name: "Marlowe & Finch Holdings", startingNetWorth: 40000, dailyGrowth: 0.003, volatility: 0.005 },
  { id: "ridgeway", name: "Ridgeway Ventures", startingNetWorth: 150000, dailyGrowth: 0.004, volatility: 0.01 },
  { id: "sable-capital", name: "Sable Capital Group", startingNetWorth: 600000, dailyGrowth: 0.005, volatility: 0.02 },
  { id: "northstar", name: "Northstar Holdings", startingNetWorth: 2000000, dailyGrowth: 0.006, volatility: 0.03 },
  { id: "vantage", name: "Vantage Industries", startingNetWorth: 5000000, dailyGrowth: 0.007, volatility: 0.05 },
  { id: "corvette-hale", name: "Corvette & Hale Enterprises", startingNetWorth: 10000000, dailyGrowth: 0.004, volatility: 0.02 },
];

export function rivalById(id) {
  return RIVALS.find((r) => r.id === id) ?? null;
}
