// Single hand-authored loan product -- a revolving business line of credit.
// Only one exists (see gameStore's `creditLine`, "one at a time"), so this
// is a single object rather than a catalog like buildings.js/stocks.js, but
// follows the same rule: `dailyRate` is derived from `apr`, never a
// separately-typed number that could drift out of sync.
const APR = 0.24;

export const LOAN_PRODUCT = {
  name: "Business Line of Credit",
  limit: 25000,
  apr: APR,
  dailyRate: APR / 365,
};
