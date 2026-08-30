// Buildings a player can buy or rent to house a business (Marketplace tab).
// Stats are hand-authored (stable listing, not randomized per session);
// dailyRent/buyPrice/rentDeposit are all *derived* from those stats so they
// can never drift out of sync with the pricing formula below.

// Rent scales with a building's stats: normalize traffic (30-100) and
// capacity (20-90) into 0..1, average them into a "quality score", and
// linearly interpolate between the $150 floor and $2,000 ceiling.
export function dailyRentFor({ trafficIndex, customerCapacity }) {
  const trafficNorm = (trafficIndex - 30) / 70;
  const capacityNorm = (customerCapacity - 20) / 70;
  const quality = (trafficNorm + capacityNorm) / 2;
  return Math.round(150 + quality * 1850);
}

// type: "retail" | "office". Stats spread low -> high within each type so
// the catalog reads as a real ladder rather than random noise.
const RAW_BUILDINGS = [
  // --- Retail (8) ---
  { id: "ret-corner-grocery", name: "Corner Grocery Unit", type: "retail", city: "Austin", area: "East Side", trafficIndex: 34, customerCapacity: 24 },
  { id: "ret-riverside", name: "Riverside Retail Unit", type: "retail", city: "Portland", area: "Pearl District", trafficIndex: 42, customerCapacity: 32 },
  { id: "ret-old-town", name: "Old Town Shopfront", type: "retail", city: "Savannah", area: "Historic District", trafficIndex: 55, customerCapacity: 38 },
  { id: "ret-market-kiosk", name: "Market Square Kiosk", type: "retail", city: "Denver", area: "LoDo", trafficIndex: 68, customerCapacity: 34 },
  { id: "ret-harbourfront", name: "Harbourfront Store", type: "retail", city: "Seattle", area: "Pike Place", trafficIndex: 58, customerCapacity: 56 },
  { id: "ret-northgate-mall", name: "Northgate Mall Unit", type: "retail", city: "Chicago", area: "Magnificent Mile", trafficIndex: 76, customerCapacity: 64 },
  { id: "ret-highstreet", name: "Highstreet Flagship", type: "retail", city: "Los Angeles", area: "Melrose", trafficIndex: 88, customerCapacity: 74 },
  { id: "ret-grand-central", name: "Grand Central Retail Hall", type: "retail", city: "New York", area: "Midtown", trafficIndex: 97, customerCapacity: 88 },

  // --- Office (8) ---
  { id: "off-backstreet-loft", name: "Backstreet Office Loft", type: "office", city: "Pittsburgh", area: "Strip District", trafficIndex: 32, customerCapacity: 22 },
  { id: "off-southbank-studio", name: "Southbank Studio Office", type: "office", city: "Nashville", area: "SoBro", trafficIndex: 40, customerCapacity: 30 },
  { id: "off-canal-view", name: "Canal View Workspace", type: "office", city: "Indianapolis", area: "Canal District", trafficIndex: 48, customerCapacity: 44 },
  { id: "off-uptown-suite", name: "Uptown Office Suite", type: "office", city: "Charlotte", area: "Uptown", trafficIndex: 62, customerCapacity: 40 },
  { id: "off-tech-park", name: "Tech Park Floor", type: "office", city: "Austin", area: "Domain", trafficIndex: 57, customerCapacity: 60 },
  { id: "off-financial-district", name: "Financial District Office", type: "office", city: "San Francisco", area: "FiDi", trafficIndex: 79, customerCapacity: 68 },
  { id: "off-skyline-tower", name: "Skyline Tower Floor", type: "office", city: "Chicago", area: "Loop", trafficIndex: 90, customerCapacity: 78 },
  { id: "off-summit-hq", name: "Summit Corporate HQ", type: "office", city: "New York", area: "Midtown", trafficIndex: 100, customerCapacity: 90 },
];

export const BUILDINGS = RAW_BUILDINGS.map((b) => {
  const dailyRent = dailyRentFor(b);
  return {
    ...b,
    dailyRent,
    buyPrice: dailyRent * 8000,
    rentDeposit: dailyRent * 40,
  };
});

export function buildingById(id) {
  return BUILDINGS.find((b) => b.id === id) ?? null;
}

export function buildingsOfType(type) {
  return BUILDINGS.filter((b) => b.type === type);
}
