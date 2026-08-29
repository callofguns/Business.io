// Shared business-type metadata: icon + tile tone, keyed by type name. Used
// by My Empire now and by the Marketplace (buying businesses) later, so a
// business's `type` string is the single source of truth for how it looks
// across screens.
export const BUSINESS_TYPES = {
  "Coffee Shop": { icon: "coffee", tone: "warn" },
  Gym: { icon: "dumbbell", tone: "brand" },
  "Fast Food Restaurant": { icon: "utensils", tone: "gold" },
  Hairdressers: { icon: "scissors", tone: "bad" },
  Bakery: { icon: "croissant", tone: "warn" },
  Bookshop: { icon: "book", tone: "good" },
};

export function businessTypeMeta(type) {
  return BUSINESS_TYPES[type] ?? { icon: "briefcase", tone: "neutral" };
}
