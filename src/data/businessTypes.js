// Every business type a player can start, plus everything the economy model
// (src/lib/economy.js) needs to price it: which kind of building it needs,
// how it converts building traffic/capacity into daily visitors, and the
// named products it sells (prices live in gameStore's productPrices, these
// are just the [min, max] market bounds they drift within).
//
// unitsPerVisitor means something different per business model but plugs
// into the same revenue formula either way:
//  - "retail" businesses: every visitor buys, and buys several items
//    (a basket) -> unitsPerVisitor is basket size.
//  - "office" businesses: the same "visitors" are leads/enquiries, and only
//    a small fraction convert into a paying client -> unitsPerVisitor is a
//    conversion rate. This is what keeps a $4 grocery item and a
//    $1,200 web-design package in the same daily-revenue ballpark instead
//    of the office business exploding in scale.
export const BUSINESS_TYPES = {
  "Small Shop": {
    icon: "shopping-bag",
    tone: "warn",
    buildingType: "retail",
    startupCost: 35000,
    riskLabel: "High risk",
    operatingHours: 13,
    throughputFactor: 1.0,
    unitsPerVisitor: 5, // basket size
    products: [
      { id: "milk", name: "Milk", min: 4.0, max: 4.5 },
      { id: "cheese", name: "Cheese", min: 2.5, max: 3.5 },
      { id: "cereal", name: "Cereal", min: 3.5, max: 4.5 },
      { id: "eggs", name: "Eggs", min: 3.0, max: 4.0 },
    ],
  },
  "Small Cafe": {
    icon: "coffee",
    tone: "gold",
    buildingType: "retail",
    startupCost: 35000,
    riskLabel: "Medium risk",
    operatingHours: 14,
    throughputFactor: 2.0,
    unitsPerVisitor: 3,
    products: [
      { id: "coffee-small", name: "Coffee (Small)", min: 2.5, max: 3.0 },
      { id: "coffee-medium", name: "Coffee (Medium)", min: 3.0, max: 3.75 },
      { id: "coffee-large", name: "Coffee (Large)", min: 3.75, max: 4.5 },
      { id: "bagel", name: "Bagel", min: 2.0, max: 2.75 },
      { id: "croissant", name: "Croissant", min: 2.75, max: 3.5 },
    ],
  },
  "Small Web Design Agency": {
    icon: "laptop",
    tone: "brand",
    buildingType: "office",
    startupCost: 35000,
    riskLabel: "Low risk · Passive",
    operatingHours: 8,
    throughputFactor: 1.0,
    unitsPerVisitor: 0.03, // lead -> client conversion rate
    products: [
      { id: "base-package", name: "Base Package", min: 500, max: 750 },
      { id: "pro-package", name: "Pro Package", min: 1200, max: 1800 },
    ],
  },
};

export function businessTypeMeta(type) {
  return BUSINESS_TYPES[type] ?? { icon: "briefcase", tone: "neutral" };
}

export const BUSINESS_TYPE_NAMES = Object.keys(BUSINESS_TYPES);

// Derived, not hand-duplicated, so it can never go out of sync with
// BUSINESS_TYPES. `cost` is kept as an alias of `startupCost` since
// StartBusinessModal already reads `.cost`.
export const STARTER_BUSINESS_OPTIONS = BUSINESS_TYPE_NAMES.map((type) => ({
  type,
  ...BUSINESS_TYPES[type],
  cost: BUSINESS_TYPES[type].startupCost,
}));
