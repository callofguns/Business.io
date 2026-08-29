// Shared business-type metadata: icon + tile tone, keyed by type name. Used
// by My Empire's business cards and the "Start New Business" picker, so a
// business's `type` string is the single source of truth for how it looks
// across screens.
export const BUSINESS_TYPES = {
  "Small Shop": { icon: "shopping-bag", tone: "warn" },
  "Small Cafe": { icon: "coffee", tone: "gold" },
  "Small Web Design Agency": { icon: "laptop", tone: "brand" },
};

export function businessTypeMeta(type) {
  return BUSINESS_TYPES[type] ?? { icon: "briefcase", tone: "neutral" };
}

// The businesses a player can start right now. Cost is flat across all
// three; daily earnings are rolled fresh each day within [minEarnings,
// maxEarnings] — a wider range means a riskier/more volatile business.
// Figures per the user: all cost 35,000; Small Shop 1,000-3,000 (highest
// risk), Small Cafe 1,500-2,500 (medium risk), Small Web Design Agency a
// flat 2,000 (low risk / passive).
export const STARTER_BUSINESS_OPTIONS = [
  {
    type: "Small Shop",
    cost: 35000,
    minEarnings: 1000,
    maxEarnings: 3000,
    riskLabel: "High risk",
  },
  {
    type: "Small Cafe",
    cost: 35000,
    minEarnings: 1500,
    maxEarnings: 2500,
    riskLabel: "Medium risk",
  },
  {
    type: "Small Web Design Agency",
    cost: 35000,
    minEarnings: 2000,
    maxEarnings: 2000,
    riskLabel: "Low risk · Passive",
  },
];
