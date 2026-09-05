// Stage 13: capacity now comes from purchasable equipment, not hired staff
// (see lib/economy.js's capacityFromEquipment). One catalog per business
// type, same derive-don't-hand-type spirit as buildings.js: `cost`/
// `sellValue` are computed once from `capacity`, never typed separately per
// item, so they can never drift out of sync with the approved formula.
const EQUIPMENT_COST_PER_CAPACITY = 450;
const EQUIPMENT_RESALE_RATIO = 0.6;

const RAW_EQUIPMENT = {
  "Small Shop": [
    { id: "shop-cash-register", name: "Cash Register", capacity: 8 },
    { id: "shop-shelving-system", name: "Shelving System", capacity: 15 },
    { id: "shop-self-checkout", name: "Self-Checkout Kiosk", capacity: 25 },
    { id: "shop-storeroom", name: "Warehouse Storeroom", capacity: 40 },
  ],
  "Small Cafe": [
    { id: "cafe-espresso-machine", name: "Espresso Machine", capacity: 8 },
    { id: "cafe-pastry-case", name: "Pastry Display Case", capacity: 15 },
    { id: "cafe-second-register", name: "Second Register", capacity: 25 },
    { id: "cafe-seating-area", name: "Expanded Seating Area", capacity: 40 },
  ],
  "Small Web Design Agency": [
    { id: "agency-workstation", name: "Extra Workstation", capacity: 8 },
    { id: "agency-server-rack", name: "Server Rack", capacity: 15 },
    { id: "agency-pm-suite", name: "Project Management Suite", capacity: 25 },
    { id: "agency-client-floor", name: "Dedicated Client Floor", capacity: 40 },
  ],
};

export const EQUIPMENT = Object.fromEntries(
  Object.entries(RAW_EQUIPMENT).map(([type, items]) => [
    type,
    items.map((item) => {
      const cost = Math.round(item.capacity * EQUIPMENT_COST_PER_CAPACITY);
      return { ...item, cost, sellValue: Math.round(cost * EQUIPMENT_RESALE_RATIO) };
    }),
  ])
);

export function equipmentFor(businessType) {
  return EQUIPMENT[businessType] ?? [];
}

export function equipmentItemById(businessType, equipmentId) {
  return equipmentFor(businessType).find((e) => e.id === equipmentId) ?? null;
}
