// Single hand-authored savings product, the mirror of loanProduct.js's
// credit line: 4% APY vs. the credit line's 24% APR -- saving is safe and
// cheap for the bank to offer you, borrowing is expensive, same real-world
// asymmetry. dailyRate is derived from apy so the two can never drift out
// of sync.
const APY = 0.04;

export const SAVINGS_PRODUCT = {
  name: "Savings Account",
  apy: APY,
  dailyRate: APY / 365,
};
