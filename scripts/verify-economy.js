// Headless verification of the Marketplace economy, run against the real
// store/data modules (no mocks). Run with:
//   node_modules/.bin/jiti scripts/verify-economy.js
//
// jiti resolves extensionless imports the way Vite does, which plain node
// can't (gameStore.js imports "./currencyStore" with no extension).

globalThis.window = globalThis;
const localStorageBacking = {};
globalThis.localStorage = {
  getItem: (k) => (k in localStorageBacking ? localStorageBacking[k] : null),
  setItem: (k, v) => {
    localStorageBacking[k] = String(v);
  },
  removeItem: (k) => {
    delete localStorageBacking[k];
  },
};

const { useGameStore, vacantBuildingsFor } = await import("../src/state/gameStore.js");
const { BUILDINGS, buildingById, dailyRentFor } = await import("../src/data/buildings.js");
const { BUSINESS_TYPES, STARTER_BUSINESS_OPTIONS } = await import("../src/data/businessTypes.js");
const {
  expectedDailyRevenue,
  expectedDailyVisitors,
  capacityUpgrade,
  demandMultiplier,
  satisfactionTarget,
  stepSatisfaction,
  promotionCost,
  isPromotionActive,
  taxOnProfit,
  isTaxPaymentDue,
  TAX_RATE,
  TAX_PERIOD_DAYS,
} = await import("../src/lib/economy.js");
const { weekdayIndex } = await import("../src/lib/format.js");

let failures = 0;
function check(label, condition) {
  if (condition) {
    console.log(`  ok  ${label}`);
  } else {
    failures++;
    console.log(`FAIL  ${label}`);
  }
}
function section(title) {
  console.log(`\n== ${title} ==`);
}

// ---------------------------------------------------------------------
section("Catalog integrity");
check("16 buildings total", BUILDINGS.length === 16);
check("8 retail", BUILDINGS.filter((b) => b.type === "retail").length === 8);
check("8 office", BUILDINGS.filter((b) => b.type === "office").length === 8);
check("unique ids", new Set(BUILDINGS.map((b) => b.id)).size === 16);
check(
  "traffic in [30,100]",
  BUILDINGS.every((b) => b.trafficIndex >= 30 && b.trafficIndex <= 100)
);
check(
  "capacity in [20,90]",
  BUILDINGS.every((b) => b.customerCapacity >= 20 && b.customerCapacity <= 90)
);
check(
  "dailyRent matches formula",
  BUILDINGS.every((b) => b.dailyRent === dailyRentFor(b))
);
check(
  "buyPrice = dailyRent * 8000",
  BUILDINGS.every((b) => b.buyPrice === b.dailyRent * 8000)
);
check(
  "rentDeposit = dailyRent * 40",
  BUILDINGS.every((b) => b.rentDeposit === b.dailyRent * 40)
);

// ---------------------------------------------------------------------
section("Starter affordability");
const cheapestRetail = BUILDINGS.filter((b) => b.type === "retail").sort((a, b) => a.dailyRent - b.dailyRent)[0];
const cheapestOffice = BUILDINGS.filter((b) => b.type === "office").sort((a, b) => a.dailyRent - b.dailyRent)[0];
const shopCost = STARTER_BUSINESS_OPTIONS.find((o) => o.type === "Small Shop").cost;
const agencyCost = STARTER_BUSINESS_OPTIONS.find((o) => o.type === "Small Web Design Agency").cost;
console.log(`  cheapest retail: ${cheapestRetail.name} deposit=${cheapestRetail.rentDeposit}`);
console.log(`  cheapest office: ${cheapestOffice.name} deposit=${cheapestOffice.rentDeposit}`);
check(
  "retail rent path affordable at start ($50,000)",
  cheapestRetail.rentDeposit + shopCost <= 50000
);
check(
  "office rent path affordable at start ($50,000)",
  cheapestOffice.rentDeposit + agencyCost <= 50000
);

// ---------------------------------------------------------------------
section("Initial store state (tax fields)");
{
  const s = useGameStore.getState();
  check("taxAccrued starts at 0", s.taxAccrued === 0);
  check("taxHistory starts empty", s.taxHistory.length === 0);
  check("lastTaxPaymentDay starts on day 1", s.lastTaxPaymentDay === 1);
}

// ---------------------------------------------------------------------
section("acquireBuilding");
{
  const s = useGameStore.getState();
  const startBalance = s.bankBalance;
  s.acquireBuilding({ buildingId: cheapestRetail.id, mode: "rent" });
  const after1 = useGameStore.getState();
  check(
    "rent deposit deducted",
    after1.bankBalance === startBalance - cheapestRetail.rentDeposit
  );
  check("acquiredBuildings has 1 entry", after1.acquiredBuildings.length === 1);
  check(
    "entry mode is rent",
    after1.acquiredBuildings[0].mode === "rent" && after1.acquiredBuildings[0].buildingId === cheapestRetail.id
  );

  // duplicate acquisition is a no-op
  s.acquireBuilding({ buildingId: cheapestRetail.id, mode: "own" });
  const after2 = useGameStore.getState();
  check("duplicate acquisition is a no-op", after2.acquiredBuildings.length === 1 && after2.bankBalance === after1.bankBalance);

  // unaffordable acquisition is a no-op
  s.acquireBuilding({ buildingId: cheapestOffice.id, mode: "own" }); // buyPrice is millions
  const after3 = useGameStore.getState();
  check(
    "unaffordable buy is a no-op",
    !after3.acquiredBuildings.some((a) => a.buildingId === cheapestOffice.id)
  );

  // unknown id is a no-op
  s.acquireBuilding({ buildingId: "does-not-exist", mode: "rent" });
  const after4 = useGameStore.getState();
  check("unknown building id is a no-op", after4.acquiredBuildings.length === 1);

  // acquire the office one via rent (affordable) for later checks
  s.acquireBuilding({ buildingId: cheapestOffice.id, mode: "rent" });
  const after5 = useGameStore.getState();
  check("second acquisition (office, rent) succeeded", after5.acquiredBuildings.length === 2);
}

// ---------------------------------------------------------------------
section("startBusiness guards");
{
  // Top up funds for this section: the previous section already spent on
  // two building deposits, and this section needs enough headroom to start
  // businesses in both of them without the two scenarios competing for the
  // same limited starting balance (that competition is real gameplay
  // pacing, not something this guard-behavior test needs to model).
  useGameStore.setState({ bankBalance: 200000 });
  const s = useGameStore.getState();
  const balanceBefore = s.bankBalance;

  // reject: building not acquired (an unacquired retail building, distinct
  // from cheapestRetail which was already rented above)
  const unacquiredRetail = BUILDINGS.find((b) => b.type === "retail" && b.id !== cheapestRetail.id);
  s.startBusiness({ type: "Small Shop", name: "Nope", buildingId: unacquiredRetail.id });
  check(
    "rejects unacquired building",
    useGameStore.getState().businesses.length === 0
  );

  // reject: wrong building type (office building for a retail business type)
  s.startBusiness({ type: "Small Shop", name: "Nope", buildingId: cheapestOffice.id });
  check(
    "rejects mismatched building type",
    useGameStore.getState().businesses.length === 0
  );

  // reject: blank name
  s.startBusiness({ type: "Small Shop", name: "   ", buildingId: cheapestRetail.id });
  check("rejects blank name", useGameStore.getState().businesses.length === 0);

  // accept: valid case
  s.startBusiness({ type: "Small Shop", name: "Test Shop", buildingId: cheapestRetail.id });
  const afterStart = useGameStore.getState();
  check("valid startBusiness succeeds", afterStart.businesses.length === 1);
  check(
    "cost deducted",
    afterStart.bankBalance === balanceBefore - shopCost
  );
  const biz = afterStart.businesses[0];
  check(
    "currentCapacity set to half building max",
    biz.currentCapacity === Math.max(8, Math.round(cheapestRetail.customerCapacity * 0.5))
  );
  check("starts at neutral satisfaction (50)", biz.satisfaction === 50);
  check("starts with no active promotion", biz.promotionEndDay === null);
  check("starts with empty traffic history", Array.isArray(biz.trafficHistory) && biz.trafficHistory.length === 0);

  // reject: building already occupied
  s.startBusiness({ type: "Small Shop", name: "Second Shop", buildingId: cheapestRetail.id });
  check(
    "rejects already-occupied building",
    useGameStore.getState().businesses.length === 1
  );

  // vacantBuildingsFor should no longer list the occupied retail building
  const vacantRetail = vacantBuildingsFor(useGameStore.getState(), "Small Shop");
  check(
    "vacantBuildingsFor excludes occupied building",
    !vacantRetail.some((b) => b.id === cheapestRetail.id)
  );

  // start the web design agency in the rented office building
  s.startBusiness({ type: "Small Web Design Agency", name: "Test Agency", buildingId: cheapestOffice.id });
  check(
    "office business started",
    useGameStore.getState().businesses.length === 2
  );
}

// ---------------------------------------------------------------------
section("Rent wiring into lastDaySummary");
{
  const before = useGameStore.getState();
  const prevBalance = before.bankBalance;
  before.nextDay();
  const after = useGameStore.getState();
  const summary = after.lastDaySummary;
  const expectedRent = cheapestRetail.dailyRent + cheapestOffice.dailyRent;
  check("lastDaySummary.rent equals sum of rented buildings", summary.rent === expectedRent);
  check(
    "netChange = revenue - rent",
    summary.netChange === summary.revenue - summary.rent
  );
  check(
    "newBalance = prevBalance + netChange",
    after.bankBalance === prevBalance + summary.netChange && summary.newBalance === after.bankBalance
  );
  check("day advanced to 2", after.day === 2);
}

// ---------------------------------------------------------------------
section("Sunday-only price re-roll");
{
  const s0 = useGameStore.getState();
  const day1Prices = JSON.stringify(s0.productPrices);
  // advance from day 2 to day 7 (Sunday = weekdayIndex 6, i.e. day 7,14,21...)
  while (useGameStore.getState().day < 7) {
    useGameStore.getState().nextDay();
  }
  const atDay7 = useGameStore.getState();
  check("day is 7", atDay7.day === 7);
  check("weekdayIndex(7) is Sunday (6)", weekdayIndex(7) === 6);
  check("prices changed on day 7", JSON.stringify(atDay7.productPrices) !== day1Prices);
  const day7Prices = JSON.stringify(atDay7.productPrices);

  // every price stays within its [min,max]
  let allInRange = true;
  for (const type of Object.keys(BUSINESS_TYPES)) {
    for (const product of BUSINESS_TYPES[type].products) {
      const p = atDay7.productPrices[type][product.id];
      if (p < product.min - 0.001 || p > product.max + 0.001) allInRange = false;
    }
  }
  check("all rolled prices within [min,max]", allInRange);

  // days 8-13 should not change prices again
  while (useGameStore.getState().day < 13) {
    useGameStore.getState().nextDay();
  }
  check(
    "prices unchanged days 8-13",
    JSON.stringify(useGameStore.getState().productPrices) === day7Prices
  );

  // day 14 should re-roll again
  useGameStore.getState().nextDay();
  const atDay14 = useGameStore.getState();
  check("day is 14", atDay14.day === 14);
  check(
    "prices changed again on day 14",
    JSON.stringify(atDay14.productPrices) !== day7Prices
  );
}

// ---------------------------------------------------------------------
section("Magnitude table (starter vs top-end, cross-type spread)");
{
  const prices = useGameStore.getState().productPrices;

  function starterRevenue(typeName, buildingType) {
    const building = BUILDINGS.filter((b) => b.type === buildingType).sort((a, b) => a.dailyRent - b.dailyRent)[0];
    const business = { type: typeName, currentCapacity: startingCapacityFor(building) };
    return { building, revenue: expectedDailyRevenue(business, building, prices) };
  }
  function topRevenue(typeName, buildingType) {
    const building = BUILDINGS.filter((b) => b.type === buildingType).sort((a, b) => b.dailyRent - a.dailyRent)[0];
    const business = { type: typeName, currentCapacity: building.customerCapacity };
    return { building, revenue: expectedDailyRevenue(business, building, prices) };
  }
  function startingCapacityFor(building) {
    return Math.max(8, Math.round(building.customerCapacity * 0.5));
  }

  const starters = {
    "Small Shop": starterRevenue("Small Shop", "retail"),
    "Small Cafe": starterRevenue("Small Cafe", "retail"),
    "Small Web Design Agency": starterRevenue("Small Web Design Agency", "office"),
  };
  const tops = {
    "Small Shop": topRevenue("Small Shop", "retail"),
    "Small Cafe": topRevenue("Small Cafe", "retail"),
    "Small Web Design Agency": topRevenue("Small Web Design Agency", "office"),
  };

  for (const [type, { building, revenue }] of Object.entries(starters)) {
    console.log(`  starter ${type} @ ${building.name}: $${revenue.toFixed(0)}/day`);
  }
  for (const [type, { building, revenue }] of Object.entries(tops)) {
    console.log(`  top-end ${type} @ ${building.name}: $${revenue.toFixed(0)}/day`);
  }

  const starterValues = Object.values(starters).map((s) => s.revenue);
  const topValues = Object.values(tops).map((t) => t.revenue);

  check(
    "all starters in [900, 2000]",
    starterValues.every((v) => v >= 900 && v <= 2000)
  );
  check(
    "all top-end in [15000, 30000]",
    topValues.every((v) => v >= 15000 && v <= 30000)
  );
  check(
    "starter cross-type spread within 1.5x",
    Math.max(...starterValues) / Math.min(...starterValues) <= 1.5
  );
  check(
    "top-end cross-type spread within 1.5x",
    Math.max(...topValues) / Math.min(...topValues) <= 1.5
  );
}

// ---------------------------------------------------------------------
section("investInCapacity");
{
  const s = useGameStore.getState();
  const biz = s.businesses.find((b) => b.type === "Small Shop");
  const building = buildingById(biz.buildingId);
  const upgrade = capacityUpgrade(biz, building);
  const balanceBefore = s.bankBalance;

  s.investInCapacity({ businessId: biz.id });
  const after = useGameStore.getState();
  const bizAfter = after.businesses.find((b) => b.id === biz.id);
  check("cost deducted matches capacityUpgrade().cost", after.bankBalance === balanceBefore - upgrade.cost);
  check("capacity increased by step", bizAfter.currentCapacity === upgrade.nextCapacity);

  // repeatedly invest until at max, then confirm no-op / clamp
  let guard = 0;
  while (guard++ < 50) {
    const cur = useGameStore.getState().businesses.find((b) => b.id === biz.id);
    if (cur.currentCapacity >= building.customerCapacity) break;
    useGameStore.getState().investInCapacity({ businessId: biz.id });
  }
  const maxed = useGameStore.getState().businesses.find((b) => b.id === biz.id);
  check("clamps exactly at building max", maxed.currentCapacity === building.customerCapacity);

  const balanceAtMax = useGameStore.getState().bankBalance;
  useGameStore.getState().investInCapacity({ businessId: biz.id });
  check(
    "further investment at max is a no-op",
    useGameStore.getState().bankBalance === balanceAtMax
  );
}

// ---------------------------------------------------------------------
section("Satisfaction (reputation) rules");
{
  // Pure formula checks
  check("at-market ratio (1) targets the ceiling (70)", satisfactionTarget(1) === 70);
  check("underpriced (ratio < 1) also targets the ceiling", satisfactionTarget(0.5) === 70);
  check("50% overpriced (ratio 1.5) targets the floor (20)", satisfactionTarget(1.5) === 20);
  check("even more overpriced still floors at 20", satisfactionTarget(3) === 20);
  check("stepSatisfaction moves +1/day toward a higher target", stepSatisfaction(50, 70) === 51);
  check("stepSatisfaction moves -1/day toward a lower target", stepSatisfaction(50, 20) === 49);
  check("stepSatisfaction holds once at target", stepSatisfaction(70, 70) === 70);
  check("stepSatisfaction never drops below 0", stepSatisfaction(0, -5) === 0);
  check("stepSatisfaction never exceeds 100", stepSatisfaction(100, 105) === 100);

  // Integration: "Test Shop" has never had a custom price set (that only
  // happens in the setProductPrice section below, which runs after this
  // one), so its price ratio has been exactly 1 -- and its target exactly
  // 70 -- every day since it opened. Compare against that day count rather
  // than a hardcoded number so this stays correct regardless of how many
  // nextDay() calls earlier sections happen to make.
  const s = useGameStore.getState();
  const biz = s.businesses.find((b) => b.type === "Small Shop");
  const expected = Math.min(70, 50 + (s.day - biz.startedDay));
  check(
    "satisfaction has drifted up toward the at-market target over elapsed days",
    biz.satisfaction === expected
  );
}

// ---------------------------------------------------------------------
section("Promotions");
{
  const s0 = useGameStore.getState();
  // Use the office business here so "Test Shop" (used by the pricing
  // section right after this one) is left untouched.
  const biz = s0.businesses.find((b) => b.type === "Small Web Design Agency");
  const building = buildingById(biz.buildingId);
  const cost = promotionCost(building);

  check("promotionCost = 5x the building's daily rent", cost === building.dailyRent * 5);
  check("no promotion active initially", !isPromotionActive(biz, s0.day));

  const balanceBefore = s0.bankBalance;
  s0.runPromotion({ businessId: "does-not-exist" });
  check("unknown business id is a no-op", useGameStore.getState().bankBalance === balanceBefore);

  s0.runPromotion({ businessId: biz.id });
  const s1 = useGameStore.getState();
  const biz1 = s1.businesses.find((b) => b.id === biz.id);
  check("cost deducted", s1.bankBalance === balanceBefore - cost);
  check("promotionEndDay set N days out", biz1.promotionEndDay === s1.day + 3);
  check("isPromotionActive true right after starting", isPromotionActive(biz1, s1.day));
  check(
    "news entry recorded",
    s1.news[0].icon === "megaphone" && s1.news[0].title.includes(biz.name)
  );

  const balanceMid = s1.bankBalance;
  s0.runPromotion({ businessId: biz.id });
  check(
    "starting a second campaign mid-campaign is a no-op",
    useGameStore.getState().bankBalance === balanceMid
  );

  const noPromoVisitors = expectedDailyVisitors({ ...biz1, promotionEndDay: null }, building, s1.productPrices, s1.day);
  const promoVisitors = expectedDailyVisitors(biz1, building, s1.productPrices, s1.day);
  check(
    "an active promotion boosts expected visitors by exactly 1.5x",
    Math.abs(promoVisitors / noPromoVisitors - 1.5) < 1e-9
  );

  while (useGameStore.getState().day <= biz1.promotionEndDay) {
    useGameStore.getState().nextDay();
  }
  const sExpired = useGameStore.getState();
  const bizExpired = sExpired.businesses.find((b) => b.id === biz.id);
  check(
    "promotion is no longer active once its window has passed",
    !isPromotionActive(bizExpired, sExpired.day)
  );

  const balancePreSecond = sExpired.bankBalance;
  if (balancePreSecond >= cost) {
    useGameStore.getState().runPromotion({ businessId: biz.id });
    check(
      "a fresh campaign can start once the previous one expired",
      useGameStore.getState().bankBalance === balancePreSecond - cost
    );
  } else {
    console.log("  (skipped: insufficient funds to start a second campaign here)");
  }
}

// ---------------------------------------------------------------------
section("Taxes");
{
  // Pure formula checks
  check("taxOnProfit is 15% of a positive profit", taxOnProfit(1000) === 150);
  check("taxOnProfit floors a loss to 0 tax", taxOnProfit(-500) === 0);
  check("isTaxPaymentDue false before the period elapses", !isTaxPaymentDue(1 + TAX_PERIOD_DAYS - 1, 1));
  check("isTaxPaymentDue true once the period elapses", isTaxPaymentDue(1 + TAX_PERIOD_DAYS, 1));

  const s0 = useGameStore.getState();
  const accruedBefore = s0.taxAccrued;
  check("tax has been accruing from daily profits so far", accruedBefore > 0);
  check("no automatic payment has fired yet (well under the period)", s0.taxHistory.length === 0);

  // payTaxesNow guard: can't pay more than the bank holds
  useGameStore.setState({ bankBalance: 0 });
  useGameStore.getState().payTaxesNow();
  check("payTaxesNow is a no-op when unaffordable", useGameStore.getState().taxAccrued === accruedBefore);

  // restore funds and pay for real
  useGameStore.setState({ bankBalance: 500000 });
  const balanceBeforePay = useGameStore.getState().bankBalance;
  const dayBeforePay = useGameStore.getState().day;
  useGameStore.getState().payTaxesNow();
  const s1 = useGameStore.getState();
  const paidAmount = Math.round(accruedBefore);
  check("payTaxesNow deducts the rounded accrued amount", s1.bankBalance === balanceBeforePay - paidAmount);
  check("payTaxesNow resets taxAccrued to 0", s1.taxAccrued === 0);
  check("payTaxesNow resets the payment countdown", s1.lastTaxPaymentDay === dayBeforePay);
  check(
    "payTaxesNow records a history entry",
    s1.taxHistory.length === 1 && s1.taxHistory[0].amount === paidAmount
  );
  check(
    "payTaxesNow news entry recorded",
    s1.news[0].icon === "receipt" && s1.news[0].title.includes("early")
  );

  // paying again immediately (nothing owed) is a no-op
  const balanceAfterFirstPay = s1.bankBalance;
  useGameStore.getState().payTaxesNow();
  check("payTaxesNow with nothing owed is a no-op", useGameStore.getState().bankBalance === balanceAfterFirstPay);

  // advance TAX_PERIOD_DAYS and confirm an automatic payment fires
  const dayAtReset = useGameStore.getState().lastTaxPaymentDay;
  while (useGameStore.getState().day < dayAtReset + TAX_PERIOD_DAYS) {
    useGameStore.getState().nextDay();
  }
  const s2 = useGameStore.getState();
  check("an automatic payment fired once the period elapsed", s2.taxHistory.length === 2);
  check("automatic payment resets the countdown", s2.lastTaxPaymentDay === dayAtReset + TAX_PERIOD_DAYS);
  check(
    "lastDaySummary.otherExpenses matches the automatic payment",
    s2.lastDaySummary.otherExpenses === s2.taxHistory[0].amount
  );
}

// ---------------------------------------------------------------------
section("setProductPrice / demandMultiplier");
{
  const s0 = useGameStore.getState();
  const biz = s0.businesses.find((b) => b.type === "Small Shop");
  const building = buildingById(biz.buildingId);
  const products = BUSINESS_TYPES["Small Shop"].products;

  check(
    "no custom prices -> demand multiplier is exactly 1",
    demandMultiplier(biz, s0.productPrices) === 1
  );

  const revenueAtMarket = expectedDailyRevenue(biz, building, s0.productPrices);

  // price every product at double the market rate -> average ratio 2 ->
  // demand clamped to 0 (priced completely out of the market)
  for (const p of products) {
    const market = s0.productPrices["Small Shop"][p.id];
    s0.setProductPrice({ businessId: biz.id, productId: p.id, price: market * 2 });
  }
  const sHigh = useGameStore.getState();
  const bizHigh = sHigh.businesses.find((b) => b.id === biz.id);
  check(
    "2x market price -> demand multiplier clamps to 0",
    demandMultiplier(bizHigh, sHigh.productPrices) === 0
  );
  check(
    "2x market price -> expected revenue is 0",
    expectedDailyRevenue(bizHigh, building, sHigh.productPrices) === 0
  );

  // price every product at 0 -> average ratio 0 -> demand caps at 2 (the
  // formula's PRICE_MAX_MULTIPLIER), but revenue is still 0 (price x demand)
  for (const p of products) {
    s0.setProductPrice({ businessId: biz.id, productId: p.id, price: 0 });
  }
  const sZero = useGameStore.getState();
  const bizZero = sZero.businesses.find((b) => b.id === biz.id);
  check(
    "$0 price -> demand multiplier is 2 (max turnout)",
    demandMultiplier(bizZero, sZero.productPrices) === 2
  );
  check(
    "$0 price -> expected revenue is 0 (giving it away)",
    expectedDailyRevenue(bizZero, building, sZero.productPrices) === 0
  );

  // price every product at 1.5x market -> revenue should be *lower* than
  // at market price -- this is the "peak at market" shape the whole
  // mechanic depends on, not just an isolated multiplier check
  for (const p of products) {
    const market = sZero.productPrices["Small Shop"][p.id];
    s0.setProductPrice({ businessId: biz.id, productId: p.id, price: market * 1.5 });
  }
  const s15 = useGameStore.getState();
  const biz15 = s15.businesses.find((b) => b.id === biz.id);
  const revenue15x = expectedDailyRevenue(biz15, building, s15.productPrices);
  check(
    "1.5x market price -> revenue lower than at-market revenue",
    revenue15x < revenueAtMarket
  );

  // and the symmetric case (0.5x market) should also be lower than the peak
  for (const p of products) {
    const market = s15.productPrices["Small Shop"][p.id];
    s0.setProductPrice({ businessId: biz.id, productId: p.id, price: market * 0.5 });
  }
  const s05 = useGameStore.getState();
  const biz05 = s05.businesses.find((b) => b.id === biz.id);
  const revenue05x = expectedDailyRevenue(biz05, building, s05.productPrices);
  check(
    "0.5x market price -> revenue also lower than at-market revenue",
    revenue05x < revenueAtMarket
  );

  // negative price clamps to 0
  s0.setProductPrice({ businessId: biz.id, productId: products[0].id, price: -50 });
  const sNeg = useGameStore.getState();
  const bizNeg = sNeg.businesses.find((b) => b.id === biz.id);
  check(
    "negative price clamps to 0",
    bizNeg.customPrices[products[0].id] === 0
  );

  // reset (price: null) removes the override entirely
  s0.setProductPrice({ businessId: biz.id, productId: products[0].id, price: null });
  const sReset = useGameStore.getState();
  const bizReset = sReset.businesses.find((b) => b.id === biz.id);
  check(
    "price: null removes the custom override",
    !(products[0].id in bizReset.customPrices)
  );

  // reset every product back to market and confirm demand returns to 1
  for (const p of products) {
    s0.setProductPrice({ businessId: biz.id, productId: p.id, price: null });
  }
  const sBack = useGameStore.getState();
  const bizBack = sBack.businesses.find((b) => b.id === biz.id);
  check(
    "resetting every product -> demand multiplier back to 1",
    demandMultiplier(bizBack, sBack.productPrices) === 1
  );
  check(
    "customPrices is empty again",
    Object.keys(bizBack.customPrices).length === 0
  );

  // guard clauses: unknown business / unknown product are no-ops
  const balanceBeforeGuards = sBack.bankBalance;
  s0.setProductPrice({ businessId: "does-not-exist", productId: products[0].id, price: 10 });
  s0.setProductPrice({ businessId: biz.id, productId: "not-a-real-product", price: 10 });
  const sGuards = useGameStore.getState();
  check(
    "unknown business/product are no-ops",
    sGuards.bankBalance === balanceBeforeGuards &&
      Object.keys(sGuards.businesses.find((b) => b.id === biz.id).customPrices).length === 0
  );
}

// ---------------------------------------------------------------------
section("30-day soak (no NaN/Infinity, news capped)");
{
  for (let i = 0; i < 30; i++) {
    useGameStore.getState().nextDay();
  }
  const s = useGameStore.getState();
  const isFinite_ = (n) => Number.isFinite(n);
  check("bankBalance finite", isFinite_(s.bankBalance));
  check(
    "all dailyEarnings finite",
    s.businesses.every((b) => isFinite_(b.dailyEarnings))
  );
  check("lastDaySummary fields finite", Object.values(s.lastDaySummary).every((v) => typeof v !== "number" || isFinite_(v)));
  check("news capped at 30", s.news.length <= 30);
  check("satisfaction stays within [0,100] for every business", s.businesses.every((b) => b.satisfaction >= 0 && b.satisfaction <= 100));
  check(
    "trafficHistory capped at 30 entries per business",
    s.businesses.every((b) => (b.trafficHistory ?? []).length <= 30)
  );
  check(
    "trafficHistory entries are sane (finite non-negative visitors, strictly increasing day)",
    s.businesses.every((b) => {
      const h = b.trafficHistory ?? [];
      return (
        h.every((e) => isFinite_(e.visitors) && e.visitors >= 0) &&
        h.every((e, i) => i === 0 || e.day > h[i - 1].day)
      );
    })
  );
  check("taxAccrued finite and non-negative", isFinite_(s.taxAccrued) && s.taxAccrued >= 0);
  check(
    "taxHistory entries finite and non-negative",
    s.taxHistory.every((e) => isFinite_(e.amount) && e.amount >= 0)
  );
  console.log(`  tax: accrued=${s.taxAccrued.toFixed(2)} history=${s.taxHistory.length} entries`);
  console.log(`  final day=${s.day} bankBalance=${s.bankBalance.toFixed(2)}`);
}

// ---------------------------------------------------------------------
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
