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
const { STOCKS, stockById } = await import("../src/data/stocks.js");
const { RIVALS, rivalById } = await import("../src/data/rivals.js");
const { LOAN_PRODUCT } = await import("../src/data/loanProduct.js");
const { SAVINGS_PRODUCT } = await import("../src/data/savingsProduct.js");
const {
  expectedDailyRevenue,
  expectedDailyVisitors,
  staffHireCost,
  staffFireResult,
  maxStaffFor,
  dailyWagePerStaff,
  totalDailyWages,
  demandMultiplier,
  satisfactionTarget,
  stepSatisfaction,
  promotionCost,
  isPromotionActive,
  taxOnProfit,
  isTaxPaymentDue,
  TAX_RATE,
  TAX_PERIOD_DAYS,
  rollStockPrice,
  dividendPayout,
  totalDailyDividends,
  STOCK_MIN_PRICE_FLOOR,
  rollMarketValue,
  passiveRentalIncome,
  totalPassiveRentalIncome,
  MARKET_VALUE_FLOOR_RATIO,
  MARKET_VALUE_DAILY_GROWTH,
  MARKET_VALUE_CRASH_MIN,
  MARKET_VALUE_CRASH_MAX,
  RENTAL_INCOME_RATE,
  BUSINESS_VALUATION_MULTIPLIER,
  businessValuation,
  businessesValuation,
  stockPortfolioValue,
  realEstatePortfolioValue,
  computeNetWorth,
  seedRivalNetWorths,
  rollRivalNetWorth,
  computeLeaderboard,
  computePlayerRank,
  RIVAL_NET_WORTH_FLOOR_RATIO,
  creditLineInterest,
  rollCreditLinePayment,
  savingsInterest,
  clampAutoDepositPercent,
  computeAutoDeposit,
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
  check("creditLine starts unopened (null)", s.creditLine === null);
  check(
    "savings starts at 0 balance with the product's rate and 0% auto-deposit",
    s.savings.balance === 0 &&
      s.savings.dailyRate === SAVINGS_PRODUCT.dailyRate &&
      s.savings.autoDepositPercent === 0
  );
}

// ---------------------------------------------------------------------
section("Initial store state (stock fields) -- checked before any nextDay() call");
{
  const s = useGameStore.getState();
  check("stockPrices seeded to each stock's startPrice", STOCKS.every((stock) => s.stockPrices[stock.id] === stock.startPrice));
  check(
    "stockPriceHistory seeded with a single day-1 entry per stock",
    STOCKS.every((stock) => {
      const h = s.stockPriceHistory[stock.id];
      return Array.isArray(h) && h.length === 1 && h[0].day === 1 && h[0].price === stock.startPrice;
    })
  );
  check("stockHoldings starts empty", Object.keys(s.stockHoldings).length === 0);
  check(
    "buildingMarketValues seeded to each building's static buyPrice",
    BUILDINGS.every((b) => s.buildingMarketValues[b.id] === b.buyPrice)
  );
  check(
    "rivalNetWorths seeded to each rival's startingNetWorth",
    RIVALS.every((r) => s.rivalNetWorths[r.id] === r.startingNetWorth)
  );
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
  check("starts with no staff hired", biz.staffCount === 0);
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
section("Hiring (hireStaff / fireStaff)");
{
  const s = useGameStore.getState();
  const biz = s.businesses.find((b) => b.type === "Small Shop");
  const building = buildingById(biz.buildingId);

  check(
    "dailyWagePerStaff = hourly rate * operatingHours",
    dailyWagePerStaff("Small Shop") === Math.round(BUSINESS_TYPES["Small Shop"].operatingHours * 18)
  );
  check(
    "staffFireResult is null with nothing hired yet",
    staffFireResult({ ...biz, staffCount: 0 }, building) === null
  );

  const hire = staffHireCost(biz, building);
  const balanceBefore = s.bankBalance;

  s.hireStaff({ businessId: biz.id });
  const after = useGameStore.getState();
  const bizAfter = after.businesses.find((b) => b.id === biz.id);
  check("hire fee deducted", after.bankBalance === balanceBefore - hire.fee);
  check("staffCount incremented", bizAfter.staffCount === 1);
  check("capacity increased to match staffCount", bizAfter.currentCapacity === hire.nextCapacity);

  // fire that hire back off, confirm no refund of the fee but capacity/count revert
  const balanceBeforeFire = after.bankBalance;
  s.fireStaff({ businessId: biz.id });
  const afterFire = useGameStore.getState();
  const bizAfterFire = afterFire.businesses.find((b) => b.id === biz.id);
  check("staffCount decremented", bizAfterFire.staffCount === 0);
  check("capacity reverted", bizAfterFire.currentCapacity === biz.currentCapacity);
  check("no refund on firing", afterFire.bankBalance === balanceBeforeFire);

  // firing with nobody hired is a no-op
  s.fireStaff({ businessId: biz.id });
  check("firing with no staff is a no-op", useGameStore.getState().businesses.find((b) => b.id === biz.id).staffCount === 0);

  // hire repeatedly until at max capacity, then confirm hiring further is a no-op
  let guard = 0;
  while (guard++ < 50) {
    const cur = useGameStore.getState().businesses.find((b) => b.id === biz.id);
    if (cur.staffCount >= maxStaffFor(building)) break;
    useGameStore.getState().hireStaff({ businessId: biz.id });
  }
  const maxed = useGameStore.getState().businesses.find((b) => b.id === biz.id);
  check("staffCount clamps at maxStaffFor(building)", maxed.staffCount === maxStaffFor(building));
  check("capacity clamps exactly at building max", maxed.currentCapacity === building.customerCapacity);

  const balanceAtMax = useGameStore.getState().bankBalance;
  useGameStore.getState().hireStaff({ businessId: biz.id });
  check(
    "hiring past building max is a no-op",
    useGameStore.getState().bankBalance === balanceAtMax &&
      useGameStore.getState().businesses.find((b) => b.id === biz.id).staffCount === maxed.staffCount
  );

  check(
    "totalDailyWages sums every active business's staffCount * dailyWagePerStaff",
    totalDailyWages(useGameStore.getState().businesses) ===
      useGameStore.getState().businesses.reduce(
        (sum, b) => sum + (b.staffCount ?? 0) * dailyWagePerStaff(b.type),
        0
      )
  );

  // let the staff back go so later sections' magnitude/soak numbers aren't
  // skewed by this section's hiring
  guard = 0;
  while (guard++ < 50) {
    const cur = useGameStore.getState().businesses.find((b) => b.id === biz.id);
    if (cur.staffCount <= 0) break;
    useGameStore.getState().fireStaff({ businessId: biz.id });
  }
  check("staff let go back to 0", useGameStore.getState().businesses.find((b) => b.id === biz.id).staffCount === 0);
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
section("Line of credit");
{
  // Pure formula checks
  check("creditLineInterest is 0 when no line is open", creditLineInterest(null) === 0);
  check(
    "creditLineInterest = balance * dailyRate",
    Math.abs(
      creditLineInterest({ balance: 10000, dailyRate: LOAN_PRODUCT.dailyRate }) - 10000 * LOAN_PRODUCT.dailyRate
    ) < 1e-9
  );

  const payableRoll = rollCreditLinePayment({ balance: 10000, dailyRate: LOAN_PRODUCT.dailyRate }, 1000000);
  check(
    "a payable day pays the interest from the bank, balance unchanged",
    payableRoll.balance === 10000 && payableRoll.paidFromBank === payableRoll.interestCharged && !payableRoll.missed
  );

  const missedRoll = rollCreditLinePayment({ balance: 10000, dailyRate: LOAN_PRODUCT.dailyRate }, 0);
  check(
    "a missed day capitalizes the interest into the balance instead",
    Math.abs(missedRoll.balance - (10000 + missedRoll.interestCharged)) < 1e-9 &&
      missedRoll.paidFromBank === 0 &&
      missedRoll.missed
  );
  check(
    "rollCreditLinePayment with no line open is a no-op shape",
    rollCreditLinePayment(null, 1000).balance === 0 && !rollCreditLinePayment(null, 1000).missed
  );

  // Guards before a line is open
  const s0 = useGameStore.getState();
  check("creditLine is still unopened here", s0.creditLine === null);
  const bankBeforeGuard = s0.bankBalance;
  useGameStore.getState().borrow({ amount: 1000 });
  useGameStore.getState().repayCreditLine({ amount: 1000 });
  check(
    "borrow/repayCreditLine are no-ops with no line open",
    useGameStore.getState().creditLine === null && useGameStore.getState().bankBalance === bankBeforeGuard
  );

  // Open the line
  const dayAtOpen = useGameStore.getState().day;
  useGameStore.getState().openCreditLine();
  const s1 = useGameStore.getState();
  check(
    "openCreditLine sets the product's limit/rate with a 0 balance",
    s1.creditLine.limit === LOAN_PRODUCT.limit &&
      s1.creditLine.dailyRate === LOAN_PRODUCT.dailyRate &&
      s1.creditLine.balance === 0 &&
      s1.creditLine.openedDay === dayAtOpen
  );
  check("opening news entry recorded", s1.news[0].icon === "credit-card" && s1.news[0].title.includes("opened"));

  // Opening again is a no-op
  useGameStore.getState().openCreditLine();
  check("openCreditLine is a no-op once already open", useGameStore.getState().news[0].id === s1.news[0].id);

  // borrow guards: over the limit, zero/negative
  useGameStore.getState().borrow({ amount: LOAN_PRODUCT.limit + 1 });
  check("borrow over the limit is a no-op", useGameStore.getState().creditLine.balance === 0);
  useGameStore.getState().borrow({ amount: 0 });
  useGameStore.getState().borrow({ amount: -500 });
  check("borrow of zero/negative is a no-op", useGameStore.getState().creditLine.balance === 0);

  // borrow happy path
  const bankBeforeBorrow = useGameStore.getState().bankBalance;
  useGameStore.getState().borrow({ amount: 10000 });
  const s2b = useGameStore.getState();
  check(
    "borrow credits the bank and increases the balance by the same amount",
    s2b.bankBalance === bankBeforeBorrow + 10000 && s2b.creditLine.balance === 10000
  );
  check("borrow news entry recorded", s2b.news[0].icon === "credit-card" && s2b.news[0].title.includes("borrowed"));

  // borrow beyond remaining available credit is a no-op
  useGameStore.getState().borrow({ amount: LOAN_PRODUCT.limit - 10000 + 1 });
  check("borrow beyond available credit is a no-op", useGameStore.getState().creditLine.balance === 10000);

  // repayCreditLine guards: over the balance, over the bank
  useGameStore.getState().repayCreditLine({ amount: 10001 });
  check("repay over the outstanding balance is a no-op", useGameStore.getState().creditLine.balance === 10000);
  const bankBeforeOverRepay = useGameStore.getState().bankBalance;
  useGameStore.setState({ bankBalance: 500 });
  useGameStore.getState().repayCreditLine({ amount: 501 });
  check("repay over what's in the bank is a no-op", useGameStore.getState().creditLine.balance === 10000);
  useGameStore.setState({ bankBalance: bankBeforeOverRepay });

  // repayCreditLine happy path
  const bankBeforeRepay = useGameStore.getState().bankBalance;
  useGameStore.getState().repayCreditLine({ amount: 4000 });
  const s3 = useGameStore.getState();
  check(
    "repayCreditLine debits the bank and reduces the balance by the same amount",
    s3.bankBalance === bankBeforeRepay - 4000 && s3.creditLine.balance === 6000
  );
  check("repay news entry recorded", s3.news[0].icon === "credit-card" && s3.news[0].title.includes("repaid"));

  // nextDay() wiring -- a payable day pays interest, principal untouched
  useGameStore.setState({ bankBalance: 1000000 });
  const balanceBeforePayableDay = useGameStore.getState().creditLine.balance;
  const expectedInterest = creditLineInterest(useGameStore.getState().creditLine);
  useGameStore.getState().nextDay();
  const s4 = useGameStore.getState();
  check(
    "a payable day's interest is deducted via lastDaySummary.loanPayment, balance unchanged",
    Math.abs(s4.lastDaySummary.loanPayment - expectedInterest) < 1e-6 && s4.creditLine.balance === balanceBeforePayableDay
  );
  check(
    "no missed-payment news entry on a payable day",
    !s4.news.some((n) => n.title.includes("Missed your line of credit"))
  );

  // nextDay() wiring -- a missed day capitalizes interest and warns
  useGameStore.setState({ bankBalance: 0 });
  const balanceBeforeMissedDay = useGameStore.getState().creditLine.balance;
  const expectedMissedInterest = creditLineInterest(useGameStore.getState().creditLine);
  useGameStore.getState().nextDay();
  const s5 = useGameStore.getState();
  check(
    "a missed day capitalizes the interest into the balance via nextDay()",
    Math.abs(s5.creditLine.balance - (balanceBeforeMissedDay + expectedMissedInterest)) < 1e-6 &&
      s5.lastDaySummary.loanPayment === 0
  );
  check(
    "a missed-payment news entry fires with a 'bad' tone",
    s5.news.some((n) => n.title.includes("Missed your line of credit") && n.tone === "bad")
  );
}

// ---------------------------------------------------------------------
section("Savings");
{
  // Pure formula checks
  check("savingsInterest is 0 when passed null", savingsInterest(null) === 0);
  check(
    "savingsInterest = balance * dailyRate",
    Math.abs(
      savingsInterest({ balance: 10000, dailyRate: SAVINGS_PRODUCT.dailyRate }) - 10000 * SAVINGS_PRODUCT.dailyRate
    ) < 1e-9
  );
  check("clampAutoDepositPercent clamps negative to 0", clampAutoDepositPercent(-10) === 0);
  check("clampAutoDepositPercent clamps above 100 to 100", clampAutoDepositPercent(150) === 100);
  check("clampAutoDepositPercent rounds fractional input", clampAutoDepositPercent(37.6) === 38);
  check("clampAutoDepositPercent treats NaN as 0", clampAutoDepositPercent(NaN) === 0);
  check("computeAutoDeposit sweeps nothing on a loss day", computeAutoDeposit(-500, 50) === 0);
  check("computeAutoDeposit sweeps nothing at 0%", computeAutoDeposit(1000, 0) === 0);
  check("computeAutoDeposit = netChange * percent/100, rounded", computeAutoDeposit(1000, 25) === 250);

  // Guards
  const s0 = useGameStore.getState();
  const bankBeforeGuard = s0.bankBalance;
  useGameStore.getState().depositSavings({ amount: 0 });
  useGameStore.getState().depositSavings({ amount: -100 });
  useGameStore.getState().depositSavings({ amount: bankBeforeGuard + 1 });
  check(
    "depositSavings is a no-op for zero/negative/unaffordable amounts",
    useGameStore.getState().savings.balance === 0 && useGameStore.getState().bankBalance === bankBeforeGuard
  );
  useGameStore.getState().withdrawSavings({ amount: 1 });
  check("withdrawSavings is a no-op with nothing saved", useGameStore.getState().bankBalance === bankBeforeGuard);

  // Deposit happy path -- force a comfortably large balance first, since
  // whatever nextDay()/borrow/repay left bankBalance at by this point in
  // the script isn't guaranteed to cover a flat 20000 deposit.
  useGameStore.setState({ bankBalance: 500000 });
  const bankBeforeDeposit = useGameStore.getState().bankBalance;
  useGameStore.getState().depositSavings({ amount: 20000 });
  const s1 = useGameStore.getState();
  check(
    "depositSavings moves the amount from bank to savings",
    s1.bankBalance === bankBeforeDeposit - 20000 && s1.savings.balance === 20000
  );
  check("deposit news entry recorded", s1.news[0].icon === "piggy-bank" && s1.news[0].title.includes("deposited"));

  // Withdraw guards: over the savings balance
  useGameStore.getState().withdrawSavings({ amount: 20001 });
  check("withdraw over the savings balance is a no-op", useGameStore.getState().savings.balance === 20000);

  // Withdraw happy path
  const bankBeforeWithdraw = useGameStore.getState().bankBalance;
  useGameStore.getState().withdrawSavings({ amount: 5000 });
  const s2 = useGameStore.getState();
  check(
    "withdrawSavings moves the amount from savings to bank",
    s2.bankBalance === bankBeforeWithdraw + 5000 && s2.savings.balance === 15000
  );
  check("withdraw news entry recorded", s2.news[0].icon === "piggy-bank" && s2.news[0].title.includes("withdrew"));

  // setAutoDepositPercent clamps the same way the pure function does
  useGameStore.getState().setAutoDepositPercent({ percent: 250 });
  check("setAutoDepositPercent clamps an out-of-range value", useGameStore.getState().savings.autoDepositPercent === 100);
  useGameStore.getState().setAutoDepositPercent({ percent: 40 });
  check("setAutoDepositPercent accepts an in-range value", useGameStore.getState().savings.autoDepositPercent === 40);

  // nextDay() wiring -- interest always credits (no affordability check,
  // unlike the credit line), and the auto-deposit sweep + netChange/
  // newBalance all reconcile against the day's other lastDaySummary fields,
  // the same recompute-and-compare technique used for dividends/rental
  // income above.
  const savingsBalanceBefore = useGameStore.getState().savings.balance;
  const expectedInterest = Math.round(savingsInterest(useGameStore.getState().savings) * 100) / 100;
  const balanceBeforeDay = useGameStore.getState().bankBalance;
  useGameStore.getState().nextDay();
  const s3 = useGameStore.getState();
  const netChangeBeforeSweep =
    s3.lastDaySummary.revenue -
    s3.lastDaySummary.rent -
    s3.lastDaySummary.wages -
    s3.lastDaySummary.otherExpenses -
    s3.lastDaySummary.loanPayment +
    s3.lastDaySummary.dividends +
    s3.lastDaySummary.rentalIncome;
  const expectedAutoDeposit = computeAutoDeposit(netChangeBeforeSweep, 40);
  check("lastDaySummary.autoDeposit matches computeAutoDeposit on the day's actual net change", s3.lastDaySummary.autoDeposit === expectedAutoDeposit);
  check(
    "netChange and newBalance both reflect the auto-deposit sweep",
    Math.abs(s3.lastDaySummary.netChange - (netChangeBeforeSweep - expectedAutoDeposit)) < 1e-6 &&
      s3.bankBalance === balanceBeforeDay + s3.lastDaySummary.netChange
  );
  check(
    "savings balance grew by interest plus any auto-deposit, nothing else",
    Math.abs(s3.savings.balance - (savingsBalanceBefore + expectedInterest + expectedAutoDeposit)) < 1e-6
  );
  check(
    "a savings interest news entry fires whenever interest is nonzero",
    expectedInterest <= 0 || s3.news.some((n) => n.icon === "piggy-bank" && n.title.includes("interest"))
  );

  // Turn auto-deposit back off so it doesn't skew later sections' numbers
  useGameStore.getState().setAutoDepositPercent({ percent: 0 });
  check("setAutoDepositPercent(0) turns the sweep back off", useGameStore.getState().savings.autoDepositPercent === 0);
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
section("Stock market (data + formulas)");
{
  check("8 stocks total", STOCKS.length === 8);
  check("unique ids", new Set(STOCKS.map((s) => s.id)).size === 8);
  check("unique tickers", new Set(STOCKS.map((s) => s.ticker)).size === 8);
  check("every stock has a positive startPrice", STOCKS.every((s) => s.startPrice > 0));
  check("every stock has a positive volatility", STOCKS.every((s) => s.volatility > 0));
  check("4 stocks pay a dividend, 4 don't", STOCKS.filter((s) => s.dividendRate > 0).length === 4);

  const s0 = useGameStore.getState();

  // rollStockPrice never drops below the floor even given a run of extreme
  // downward rolls
  const volatileStock = STOCKS.find((s) => s.id === "brmb");
  let minSeen = Infinity;
  for (let i = 0; i < 500; i++) {
    minSeen = Math.min(minSeen, rollStockPrice(volatileStock, volatileStock.startPrice * 0.1));
  }
  check(
    "rollStockPrice respects STOCK_MIN_PRICE_FLOOR",
    minSeen >= volatileStock.startPrice * STOCK_MIN_PRICE_FLOOR - 0.01
  );

  // dividendPayout: 0 for non-payers, proportional for payers
  const growthStock = STOCKS.find((s) => s.dividendRate === 0);
  const payerStock = STOCKS.find((s) => s.dividendRate > 0);
  check(
    "non-dividend stock pays 0 regardless of shares held",
    dividendPayout(growthStock, growthStock.startPrice, 100) === 0
  );
  check(
    "dividend stock pays price * dividendRate * shares",
    Math.abs(dividendPayout(payerStock, 100, 10) - 100 * payerStock.dividendRate * 10) < 1e-9
  );
  check("dividendPayout is 0 with no shares held", dividendPayout(payerStock, 100, 0) === 0);
  check(
    "totalDailyDividends sums only dividend-paying holdings",
    totalDailyDividends({ [growthStock.id]: { shares: 50 }, [payerStock.id]: { shares: 20 } }, s0.stockPrices) ===
      dividendPayout(payerStock, s0.stockPrices[payerStock.id], 20)
  );
}

// ---------------------------------------------------------------------
section("buyStock / sellStock");
{
  useGameStore.setState({ bankBalance: 50000 });
  const s0 = useGameStore.getState();
  const stock = stockById("evrl");
  const price = s0.stockPrices[stock.id];

  // guards
  s0.buyStock({ stockId: "does-not-exist", shares: 5 });
  check("buying an unknown stock is a no-op", useGameStore.getState().bankBalance === 50000);
  s0.buyStock({ stockId: stock.id, shares: 0 });
  check("buying 0 shares is a no-op", useGameStore.getState().bankBalance === 50000);
  s0.sellStock({ stockId: stock.id, shares: 1 });
  check("selling with nothing held is a no-op", useGameStore.getState().bankBalance === 50000);

  // buy 10 shares
  s0.buyStock({ stockId: stock.id, shares: 10 });
  const after1 = useGameStore.getState();
  check("cost deducted", Math.abs(after1.bankBalance - (50000 - price * 10)) < 1e-9);
  check("holdings shares = 10", after1.stockHoldings[stock.id].shares === 10);
  check("holdings avgCost = purchase price", after1.stockHoldings[stock.id].avgCost === price);

  // buy 10 more at a different price -- avgCost should be the weighted
  // average of both purchases
  useGameStore.setState({ stockPrices: { ...after1.stockPrices, [stock.id]: price * 1.2 } });
  const price2 = useGameStore.getState().stockPrices[stock.id];
  useGameStore.getState().buyStock({ stockId: stock.id, shares: 10 });
  const after2 = useGameStore.getState();
  const expectedAvg = Math.round(((price * 10 + price2 * 10) / 20) * 100) / 100;
  check("holdings shares = 20 after second buy", after2.stockHoldings[stock.id].shares === 20);
  check("avgCost is the weighted average of both buys", after2.stockHoldings[stock.id].avgCost === expectedAvg);

  // can't buy more than the bank can afford
  useGameStore.setState({ bankBalance: 1 });
  useGameStore.getState().buyStock({ stockId: stock.id, shares: 1000 });
  check("unaffordable buy is a no-op", useGameStore.getState().stockHoldings[stock.id].shares === 20);

  // sell more than held is a no-op
  useGameStore.setState({ bankBalance: 50000 });
  useGameStore.getState().sellStock({ stockId: stock.id, shares: 21 });
  check("selling more shares than held is a no-op", useGameStore.getState().stockHoldings[stock.id].shares === 20);

  // partial sell -- avgCost unchanged
  const beforeSell = useGameStore.getState();
  const sellPrice = beforeSell.stockPrices[stock.id];
  beforeSell.sellStock({ stockId: stock.id, shares: 5 });
  const afterSell = useGameStore.getState();
  check("partial sell reduces shares", afterSell.stockHoldings[stock.id].shares === 15);
  check(
    "partial sell proceeds credited",
    Math.abs(afterSell.bankBalance - (beforeSell.bankBalance + sellPrice * 5)) < 1e-9
  );
  check("partial sell leaves avgCost unchanged", afterSell.stockHoldings[stock.id].avgCost === expectedAvg);

  // sell everything -- holdings entry removed entirely
  useGameStore.getState().sellStock({ stockId: stock.id, shares: 15 });
  const afterAll = useGameStore.getState();
  check("selling all shares removes the holdings entry", !(stock.id in afterAll.stockHoldings));
}

// ---------------------------------------------------------------------
section("Stock prices roll daily + dividends paid via nextDay");
{
  // buy into a dividend payer so today's dividend is nonzero
  const payer = STOCKS.find((s) => s.dividendRate > 0);
  useGameStore.setState({ bankBalance: 100000 });
  useGameStore.getState().buyStock({ stockId: payer.id, shares: 50 });

  const before = useGameStore.getState();
  const dayBefore = before.day;
  before.nextDay();
  const after = useGameStore.getState();

  check(
    "every non-zero-volatility stock's price changed after nextDay (daily roll, not weekly)",
    STOCKS.every((s) => after.stockPrices[s.id] !== before.stockPrices[s.id])
  );
  check(
    "stockPriceHistory grew by one entry per stock (or held at the 30-entry cap)",
    STOCKS.every((s) => after.stockPriceHistory[s.id].length === Math.min(30, before.stockPriceHistory[s.id].length + 1))
  );
  check(
    "newest history entry matches the new day/price for every stock",
    STOCKS.every((s) => {
      const h = after.stockPriceHistory[s.id];
      const last = h[h.length - 1];
      return last.day === dayBefore + 1 && last.price === after.stockPrices[s.id];
    })
  );
  check("lastDaySummary.dividends > 0 with a dividend payer held", after.lastDaySummary.dividends > 0);
  check(
    "dividends credited to bankBalance via netChange",
    Math.abs(
      after.lastDaySummary.netChange -
        (after.lastDaySummary.revenue -
          after.lastDaySummary.rent -
          after.lastDaySummary.wages -
          after.lastDaySummary.otherExpenses -
          after.lastDaySummary.loanPayment +
          after.lastDaySummary.dividends +
          after.lastDaySummary.rentalIncome)
    ) < 1e-9
  );
  check(
    "a 'Dividends received' news entry was recorded",
    after.news.some((n) => n.icon === "banknote" && n.title === "Dividends received")
  );

  // sell back out so later sections' magnitude/soak numbers aren't skewed
  useGameStore.getState().sellStock({ stockId: payer.id, shares: 50 });
  check("sold the dividend holding back off", !(payer.id in useGameStore.getState().stockHoldings));
}

// ---------------------------------------------------------------------
section("Real estate market values");
{
  const building = BUILDINGS[0];
  const floor = building.buyPrice * MARKET_VALUE_FLOOR_RATIO;

  // floor: starting well below it, both the crash and growth branches must
  // still clamp back up to it
  let minSeen = Infinity;
  for (let i = 0; i < 500; i++) {
    minSeen = Math.min(minSeen, rollMarketValue(building, floor * 0.5).value);
  }
  check("rollMarketValue respects MARKET_VALUE_FLOOR_RATIO", minSeen >= floor - 1);

  // growth vs. crash: roll many times from a value comfortably clear of the
  // floor so both branches are reachable, and confirm every single roll
  // matches one of the two formulas exactly (not just "is in some range")
  const start = building.buyPrice * 2;
  let sawGrowth = false;
  let sawCrash = false;
  let allMatchFormula = true;
  for (let i = 0; i < 2000; i++) {
    const { value, crashed } = rollMarketValue(building, start);
    if (crashed) {
      sawCrash = true;
      const drop = 1 - value / start;
      if (drop < MARKET_VALUE_CRASH_MIN - 0.001 || drop > MARKET_VALUE_CRASH_MAX + 0.001) allMatchFormula = false;
    } else {
      sawGrowth = true;
      if (value !== Math.round(start * (1 + MARKET_VALUE_DAILY_GROWTH))) allMatchFormula = false;
    }
  }
  check("a normal day grows by exactly MARKET_VALUE_DAILY_GROWTH", sawGrowth);
  check("a crash day (rare, ~1%/day) does occur across enough trials", sawCrash);
  check("every rolled value matches the growth or crash formula exactly", allMatchFormula);
}

// ---------------------------------------------------------------------
section("Passive rental income");
{
  const building = BUILDINGS[0];
  check(
    "passiveRentalIncome = dailyRent * RENTAL_INCOME_RATE",
    passiveRentalIncome(building) === Math.round(building.dailyRent * RENTAL_INCOME_RATE)
  );

  const ownedVacant = [{ buildingId: building.id, mode: "own" }];
  check(
    "totalPassiveRentalIncome counts an owned, unoccupied building",
    totalPassiveRentalIncome(ownedVacant, []) === passiveRentalIncome(building)
  );

  const occupyingBiz = [{ buildingId: building.id, active: true }];
  check(
    "totalPassiveRentalIncome excludes an owned building occupied by an active business",
    totalPassiveRentalIncome(ownedVacant, occupyingBiz) === 0
  );

  const rentedBuilding = [{ buildingId: building.id, mode: "rent" }];
  check(
    "totalPassiveRentalIncome excludes rented (not owned) buildings",
    totalPassiveRentalIncome(rentedBuilding, []) === 0
  );

  const inactiveBiz = [{ buildingId: building.id, active: false }];
  check(
    "an inactive business doesn't block rental income (counts as vacant)",
    totalPassiveRentalIncome(ownedVacant, inactiveBiz) === passiveRentalIncome(building)
  );
}

// ---------------------------------------------------------------------
section("sellBuilding + dynamic buy price");
{
  useGameStore.setState({ bankBalance: 20000000 }); // plenty of headroom to buy outright
  const s0 = useGameStore.getState();
  const targetBuilding = BUILDINGS.find(
    (b) => b.type === "retail" && !s0.acquiredBuildings.some((a) => a.buildingId === b.id)
  );
  const marketValueBefore = s0.buildingMarketValues[targetBuilding.id];

  s0.acquireBuilding({ buildingId: targetBuilding.id, mode: "own" });
  const afterBuy = useGameStore.getState();
  check(
    "buying 'own' costs the live market value, not a frozen buyPrice",
    afterBuy.bankBalance === 20000000 - marketValueBefore
  );
  check(
    "acquiredBuildings gained an 'own' entry",
    afterBuy.acquiredBuildings.some((a) => a.buildingId === targetBuilding.id && a.mode === "own")
  );

  // selling an unoccupied owned building succeeds at the live market value
  const balanceBeforeSell = afterBuy.bankBalance;
  const priceAtSell = afterBuy.buildingMarketValues[targetBuilding.id];
  afterBuy.sellBuilding({ buildingId: targetBuilding.id });
  const afterSell = useGameStore.getState();
  check("selling credits the live market value", afterSell.bankBalance === balanceBeforeSell + priceAtSell);
  check(
    "acquiredBuildings entry removed after selling",
    !afterSell.acquiredBuildings.some((a) => a.buildingId === targetBuilding.id)
  );

  // re-buy it, start a business there, and confirm selling is blocked while occupied
  useGameStore.getState().acquireBuilding({ buildingId: targetBuilding.id, mode: "own" });
  useGameStore
    .getState()
    .startBusiness({ type: "Small Shop", name: "Landlord Test Shop", buildingId: targetBuilding.id });
  const occupiedBalance = useGameStore.getState().bankBalance;
  useGameStore.getState().sellBuilding({ buildingId: targetBuilding.id });
  check(
    "selling is blocked while the player's own business occupies it",
    useGameStore.getState().bankBalance === occupiedBalance &&
      useGameStore.getState().acquiredBuildings.some((a) => a.buildingId === targetBuilding.id)
  );

  // selling a *rented* (not owned) building is a no-op
  const rentedEntry = useGameStore.getState().acquiredBuildings.find((a) => a.mode === "rent");
  const balanceBeforeRentSell = useGameStore.getState().bankBalance;
  useGameStore.getState().sellBuilding({ buildingId: rentedEntry.buildingId });
  check(
    "selling a rented (not owned) building is a no-op",
    useGameStore.getState().bankBalance === balanceBeforeRentSell &&
      useGameStore.getState().acquiredBuildings.some((a) => a.buildingId === rentedEntry.buildingId)
  );

  // selling an unacquired/unknown building id is a no-op
  const balanceBeforeUnknown = useGameStore.getState().bankBalance;
  useGameStore.getState().sellBuilding({ buildingId: "does-not-exist" });
  check("selling an unacquired building is a no-op", useGameStore.getState().bankBalance === balanceBeforeUnknown);

  // buy a *second* building and leave it vacant (no business started) --
  // targetBuilding above ended up owned-and-occupied, so this is the one
  // the next section's passive-rental-income check needs
  const s1 = useGameStore.getState();
  const vacantOwnedBuilding = BUILDINGS.find(
    (b) => b.id !== targetBuilding.id && !s1.acquiredBuildings.some((a) => a.buildingId === b.id)
  );
  s1.acquireBuilding({ buildingId: vacantOwnedBuilding.id, mode: "own" });
  check(
    "second building bought and left vacant for the rental-income check",
    useGameStore
      .getState()
      .acquiredBuildings.some((a) => a.buildingId === vacantOwnedBuilding.id && a.mode === "own")
  );
}

// ---------------------------------------------------------------------
section("Real estate wired into nextDay (rental income + market value roll)");
{
  const before = useGameStore.getState();
  const dayBefore = before.day;
  before.nextDay();
  const after = useGameStore.getState();

  check(
    "every building's market value changed after nextDay (daily roll)",
    BUILDINGS.every((b) => after.buildingMarketValues[b.id] !== before.buildingMarketValues[b.id])
  );
  check("lastDaySummary.rentalIncome > 0 with an owned, vacant building", after.lastDaySummary.rentalIncome > 0);
  check(
    "rentalIncome credited to bankBalance via netChange",
    Math.abs(
      after.lastDaySummary.netChange -
        (after.lastDaySummary.revenue -
          after.lastDaySummary.rent -
          after.lastDaySummary.wages -
          after.lastDaySummary.otherExpenses -
          after.lastDaySummary.loanPayment +
          after.lastDaySummary.dividends +
          after.lastDaySummary.rentalIncome)
    ) < 1e-9
  );
  check(
    "a 'Rental income collected' news entry was recorded",
    after.news.some((n) => n.icon === "landmark" && n.title === "Rental income collected")
  );
  check("day advanced by 1", after.day === dayBefore + 1);
}

// ---------------------------------------------------------------------
section("Rivals catalog");
{
  check("6 rivals total", RIVALS.length === 6);
  check("unique rival ids", new Set(RIVALS.map((r) => r.id)).size === 6);
  check("unique rival names", new Set(RIVALS.map((r) => r.name)).size === 6);
  check(
    "every rival has positive startingNetWorth/dailyGrowth/volatility",
    RIVALS.every((r) => r.startingNetWorth > 0 && r.dailyGrowth > 0 && r.volatility > 0)
  );
}

// ---------------------------------------------------------------------
section("Net worth formula");
{
  const s = useGameStore.getState();
  const testShop = s.businesses.find((b) => b.name === "Test Shop");
  const building = buildingById(testShop.buildingId);

  check(
    "businessValuation = expectedDailyRevenue * BUSINESS_VALUATION_MULTIPLIER for an active business",
    businessValuation(testShop, building, s.productPrices, s.day) ===
      expectedDailyRevenue(testShop, building, s.productPrices, s.day) * BUSINESS_VALUATION_MULTIPLIER
  );
  check(
    "businessValuation is 0 for an inactive business",
    businessValuation({ ...testShop, active: false }, building, s.productPrices, s.day) === 0
  );
  check(
    "businessesValuation sums every active business's valuation",
    businessesValuation(s.businesses, s.productPrices, s.day) ===
      s.businesses.reduce(
        (sum, b) => sum + businessValuation(b, buildingById(b.buildingId), s.productPrices, s.day),
        0
      )
  );

  check(
    "stockPortfolioValue sums shares * live price",
    stockPortfolioValue({ nova: { shares: 3, avgCost: 100 } }, { nova: 150 }) === 450
  );
  check("stockPortfolioValue is 0 with no holdings", stockPortfolioValue({}, s.stockPrices) === 0);

  check(
    "realEstatePortfolioValue sums only 'own' mode entries",
    realEstatePortfolioValue(
      [
        { buildingId: "a", mode: "own" },
        { buildingId: "b", mode: "rent" },
      ],
      { a: 1000000, b: 2000000 }
    ) === 1000000
  );

  const creditLineBalance = s.creditLine?.balance ?? 0;
  check("a credit line is open with an outstanding balance here", creditLineBalance > 0);
  const savingsBalance = s.savings.balance;
  check("savings has a positive balance here", savingsBalance > 0);

  const netWorth = computeNetWorth({
    bankBalance: s.bankBalance,
    businesses: s.businesses,
    productPrices: s.productPrices,
    day: s.day,
    stockHoldings: s.stockHoldings,
    stockPrices: s.stockPrices,
    acquiredBuildings: s.acquiredBuildings,
    buildingMarketValues: s.buildingMarketValues,
    creditLineBalance,
    savingsBalance,
  });
  const expectedNetWorth =
    s.bankBalance +
    stockPortfolioValue(s.stockHoldings, s.stockPrices) +
    realEstatePortfolioValue(s.acquiredBuildings, s.buildingMarketValues) +
    businessesValuation(s.businesses, s.productPrices, s.day) +
    savingsBalance -
    creditLineBalance;
  check(
    "computeNetWorth sums bankBalance + stocks + real estate + businesses + savings - credit line balance",
    Math.abs(netWorth - expectedNetWorth) < 1e-6
  );
  check(
    "computeNetWorth without creditLineBalance/savingsBalance defaults both to 0 (non-breaking)",
    computeNetWorth({
      bankBalance: 10000,
      businesses: [],
      productPrices: s.productPrices,
      day: s.day,
      stockHoldings: {},
      stockPrices: s.stockPrices,
      acquiredBuildings: [],
      buildingMarketValues: s.buildingMarketValues,
    }) === 10000
  );
  check(
    "savingsBalance is added, the mirror of creditLineBalance being subtracted",
    computeNetWorth({
      bankBalance: 10000,
      businesses: [],
      productPrices: s.productPrices,
      day: s.day,
      stockHoldings: {},
      stockPrices: s.stockPrices,
      acquiredBuildings: [],
      buildingMarketValues: s.buildingMarketValues,
      savingsBalance: 4000,
    }) === 14000
  );
}

// ---------------------------------------------------------------------
section("Rival net worth rolls");
{
  const rival = RIVALS[0];
  const floor = rival.startingNetWorth * RIVAL_NET_WORTH_FLOOR_RATIO;

  let minSeen = Infinity;
  for (let i = 0; i < 500; i++) {
    minSeen = Math.min(minSeen, rollRivalNetWorth(rival, floor * 0.5));
  }
  check("rollRivalNetWorth respects RIVAL_NET_WORTH_FLOOR_RATIO", minSeen >= floor - 1);

  const start = rival.startingNetWorth * 5; // comfortably clear of the floor
  let sawIncrease = false;
  let sawDecrease = false;
  let allWithinBounds = true;
  for (let i = 0; i < 2000; i++) {
    const value = rollRivalNetWorth(rival, start);
    if (value > start) sawIncrease = true;
    if (value < start) sawDecrease = true;
    const lo = start * (1 + rival.dailyGrowth - rival.volatility);
    const hi = start * (1 + rival.dailyGrowth + rival.volatility);
    if (value < lo - 1 || value > hi + 1) allWithinBounds = false;
  }
  check("rollRivalNetWorth can both grow and shrink day to day", sawIncrease && sawDecrease);
  check("every rolled value stays within [growth-volatility, growth+volatility] of current", allWithinBounds);
}

// ---------------------------------------------------------------------
section("Leaderboard / rank");
{
  const rivalNetWorths = seedRivalNetWorths();
  const leaderboardLow = computeLeaderboard(0, rivalNetWorths);
  check("leaderboard has 7 entries (6 rivals + player)", leaderboardLow.length === 7);
  check(
    "leaderboard sorted descending by net worth",
    leaderboardLow.every((e, i) => i === 0 || leaderboardLow[i - 1].netWorth >= e.netWorth)
  );
  check("player ranks last with net worth 0", computePlayerRank(0, rivalNetWorths) === 7);

  const leaderboardHigh = computeLeaderboard(1e12, rivalNetWorths);
  check("player ranks first with an enormous net worth", computePlayerRank(1e12, rivalNetWorths) === 1);
  check("leaderboard's top entry is the player when they rank first", leaderboardHigh[0].isPlayer);

  const midNetWorth = rivalById("sable-capital").startingNetWorth + 1; // just above Sable Capital
  const rank = computePlayerRank(midNetWorth, rivalNetWorths);
  const rivalsAbove = RIVALS.filter((r) => rivalNetWorths[r.id] > midNetWorth).length;
  check("mid-pack net worth ranks correctly relative to rivals", rank === rivalsAbove + 1);
}

// ---------------------------------------------------------------------
section("Rivals wired into nextDay (roll + rank-change news)");
{
  const before = useGameStore.getState();
  const netWorthBefore = computeNetWorth({
    bankBalance: before.bankBalance,
    businesses: before.businesses,
    productPrices: before.productPrices,
    day: before.day,
    stockHoldings: before.stockHoldings,
    stockPrices: before.stockPrices,
    acquiredBuildings: before.acquiredBuildings,
    buildingMarketValues: before.buildingMarketValues,
  });
  const rankBefore = computePlayerRank(netWorthBefore, before.rivalNetWorths);

  before.nextDay();
  const after = useGameStore.getState();

  check(
    "every rival's net worth changed after nextDay (daily roll)",
    RIVALS.every((r) => after.rivalNetWorths[r.id] !== before.rivalNetWorths[r.id])
  );

  const netWorthAfter = computeNetWorth({
    bankBalance: after.bankBalance,
    businesses: after.businesses,
    productPrices: after.productPrices,
    day: after.day,
    stockHoldings: after.stockHoldings,
    stockPrices: after.stockPrices,
    acquiredBuildings: after.acquiredBuildings,
    buildingMarketValues: after.buildingMarketValues,
  });
  const rankAfter = computePlayerRank(netWorthAfter, after.rivalNetWorths);
  const rankChangeExpected = rankAfter !== rankBefore;
  const rankChangeNewsPresent = after.news.some((n) => n.icon === "trophy" && n.day === after.day);
  check(
    "a rank-change news entry appears exactly when the rank actually changed",
    rankChangeNewsPresent === rankChangeExpected
  );
}

// ---------------------------------------------------------------------
section("30-day soak (no NaN/Infinity, news capped)");
{
  // hire someone so wages are actually exercised through the soak, not left
  // at a permanent 0 from the Hiring section resetting back to no staff
  const soakBiz = useGameStore.getState().businesses.find((b) => b.type === "Small Shop");
  useGameStore.getState().hireStaff({ businessId: soakBiz.id });
  check("hired for the soak", useGameStore.getState().businesses.find((b) => b.id === soakBiz.id).staffCount === 1);

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
  check("lastDaySummary.wages finite and non-negative", isFinite_(s.lastDaySummary.wages) && s.lastDaySummary.wages >= 0);
  check("wages actually charged for the hired soak business", s.lastDaySummary.wages > 0);
  check(
    "every business's staffCount stays within [0, maxStaffFor(building)]",
    s.businesses.every((b) => {
      const building = buildingById(b.buildingId);
      const count = b.staffCount ?? 0;
      return building && count >= 0 && count <= maxStaffFor(building);
    })
  );
  check(
    "all stock prices finite, positive, and at least the floor after the soak",
    STOCKS.every((stock) => {
      const p = s.stockPrices[stock.id];
      return isFinite_(p) && p >= stock.startPrice * STOCK_MIN_PRICE_FLOOR - 0.01;
    })
  );
  check(
    "stockPriceHistory capped at 30 entries per stock",
    STOCKS.every((stock) => (s.stockPriceHistory[stock.id] ?? []).length <= 30)
  );
  check(
    "lastDaySummary.dividends finite and non-negative",
    isFinite_(s.lastDaySummary.dividends) && s.lastDaySummary.dividends >= 0
  );
  check(
    "all building market values finite and at least their floor after the soak",
    BUILDINGS.every((b) => {
      const v = s.buildingMarketValues[b.id];
      return isFinite_(v) && v >= b.buyPrice * MARKET_VALUE_FLOOR_RATIO - 1;
    })
  );
  check(
    "lastDaySummary.rentalIncome finite and non-negative",
    isFinite_(s.lastDaySummary.rentalIncome) && s.lastDaySummary.rentalIncome >= 0
  );
  check(
    "all rival net worths finite and at least their floor after the soak",
    RIVALS.every((r) => {
      const v = s.rivalNetWorths[r.id];
      return isFinite_(v) && v >= r.startingNetWorth * RIVAL_NET_WORTH_FLOOR_RATIO - 1;
    })
  );
  check(
    "credit line balance finite and non-negative after the soak",
    isFinite_(s.creditLine?.balance ?? 0) && (s.creditLine?.balance ?? 0) >= 0
  );
  check(
    "lastDaySummary.loanPayment finite and non-negative",
    isFinite_(s.lastDaySummary.loanPayment) && s.lastDaySummary.loanPayment >= 0
  );
  check("savings balance finite and non-negative after the soak", isFinite_(s.savings.balance) && s.savings.balance >= 0);
  check(
    "lastDaySummary.autoDeposit finite and non-negative",
    isFinite_(s.lastDaySummary.autoDeposit) && s.lastDaySummary.autoDeposit >= 0
  );
  check(
    "computePlayerRank on the final state returns a rank within [1,7]",
    (() => {
      const netWorth = computeNetWorth({
        bankBalance: s.bankBalance,
        businesses: s.businesses,
        productPrices: s.productPrices,
        day: s.day,
        stockHoldings: s.stockHoldings,
        stockPrices: s.stockPrices,
        acquiredBuildings: s.acquiredBuildings,
        buildingMarketValues: s.buildingMarketValues,
        creditLineBalance: s.creditLine?.balance ?? 0,
        savingsBalance: s.savings.balance,
      });
      const rank = computePlayerRank(netWorth, s.rivalNetWorths);
      return rank >= 1 && rank <= 7;
    })()
  );
  console.log(`  tax: accrued=${s.taxAccrued.toFixed(2)} history=${s.taxHistory.length} entries`);
  console.log(`  credit line: balance=${(s.creditLine?.balance ?? 0).toFixed(2)}`);
  console.log(`  savings: balance=${s.savings.balance.toFixed(2)} autoDepositPercent=${s.savings.autoDepositPercent}`);
  console.log(`  final day=${s.day} bankBalance=${s.bankBalance.toFixed(2)}`);
  console.log(
    `  stocks: ${STOCKS.map((stock) => `${stock.ticker}=${s.stockPrices[stock.id].toFixed(2)}`).join(" ")}`
  );
}

// ---------------------------------------------------------------------
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
