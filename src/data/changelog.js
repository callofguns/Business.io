// Hand-maintained alongside the release workflow: bump APP_VERSION and
// prepend a CHANGELOG entry as part of the same "push to main" step that
// tags a GitHub release (see README.md's Branch workflow section). Entries
// mirror the actual GitHub release notes at
// https://github.com/callofguns/Business.io/releases -- only released
// versions belong here, nothing still sitting on `dev` unreleased.
export const APP_VERSION = "v0.2.5-beta";

export const CHANGELOG = [
  {
    version: "v0.2.5-beta",
    date: "2026-09-02",
    title: "Stage 6: Finance Manager",
    notes: [
      "Buy/sell shares in 8 fictional stocks that random-walk in price daily (mean-reverting, so a price can't spiral to $0 or run away unbounded)",
      "Each stock gets its own price-history chart",
      "Half the list pays a daily cash dividend per share held, shown as a new \"Dividends\" line in the Day Summary",
    ],
  },
  {
    version: "v0.2.4-beta",
    date: "2026-09-01",
    title: "Stage 5: Hiring",
    notes: [
      "New Hiring screen — hire or fire staff for any business",
      "Each hire: +5 capacity, a one-time hiring fee (10x daily wage), and an ongoing $18/hr wage paid daily",
      "Replaces the old flat-cash \"Invest in Capacity\" stub",
      "New \"Wages\" line in the Day Summary, folded into taxable profit alongside rent",
    ],
  },
  {
    version: "v0.2.3-beta",
    date: "2026-08-31",
    title: "Faster animations + Stage 8: Tax Office",
    notes: [
      "Faster animations across the whole app (screen transitions, cards, modals, news feed, and more)",
      "Stage 8: Tax Office — a flat 15% tax on daily net business profit accrues and auto-files every 30 days, or pay early via \"Pay Now\"",
    ],
  },
  {
    version: "v0.2.2-beta",
    date: "2026-08-31",
    title: "Stage 3: Business Detail",
    notes: [
      "Click any business card to open its own page",
      "Daily-visitors traffic chart (last 30 days)",
      "Satisfaction: a 0-100 reputation score that drifts toward a pricing-driven target and feeds back into visitor demand",
      "Promotion: a paid marketing campaign for +50% traffic over 3 days",
    ],
  },
  {
    version: "v0.2.1-beta",
    date: "2026-08-30",
    title: "Product pricing",
    notes: [
      "Click a business card to open its Pricing panel",
      "Price each product independently of the live market rate",
      "Revenue peaks exactly at market price and falls off symmetrically either side",
    ],
  },
  {
    version: "v0.2.0-beta",
    date: "2026-08-30",
    title: "Stage 4: Marketplace",
    notes: [
      "Marketplace tab: 16 buildings (8 retail, 8 office) to buy or rent",
      "Starting a business now requires a matching acquired building",
      "Businesses sell named products at market prices that drift weekly",
      "Rent is now a real recurring expense in the Day Summary",
    ],
  },
  {
    version: "v0.1.7-beta",
    date: "2026-08-29",
    title: "PWA support",
    notes: ["Installable (Add to Home Screen / Install app)", "Works offline after first load"],
  },
  {
    version: "v0.1.6-beta",
    date: "2026-08-29",
    title: "Day Summary modal",
    notes: [
      "Pops up after every Next Day click",
      "Breaks down Total Revenue, Rent, Other Expenses, Net Change, and New Balance",
    ],
  },
  {
    version: "v0.1.5-beta",
    date: "2026-08-29",
    title: "Start New Business",
    notes: [
      "\"Start New Business\" button on My Empire: Small Shop, Small Cafe, or Small Web Design Agency",
      "Bank interest mechanic removed — income is purely from businesses now",
    ],
  },
  {
    version: "v0.1.4-beta",
    date: "2026-08-29",
    title: "Settings menu",
    notes: ["Settings gear button in the sidebar", "Dark mode toggle + currency switcher (USD/GBP/EUR/JPY)"],
  },
  {
    version: "v0.1.3-beta",
    date: "2026-08-29",
    title: "Stage 2: My Empire",
    notes: [
      "Business cards: type icon, name, status, location, daily earnings",
      "Next Day now credits daily business earnings into the bank balance",
    ],
  },
  {
    version: "v0.1.2-beta",
    date: "2026-08-29",
    title: "Login screen",
    notes: ["Simple name-entry gate before the game (no accounts/passwords)"],
  },
  {
    version: "v0.1.1-beta",
    date: "2026-08-28",
    title: "News feed cleanup",
    notes: ["Removed random flavor headlines — the feed now only reflects real state changes"],
  },
  {
    version: "v0.1.0-beta.2",
    date: "2026-08-28",
    title: "Dark mode",
    notes: ["Sidebar toggle, defaults to system preference, persists your choice"],
  },
  {
    version: "v0.1.0-beta.1",
    date: "2026-08-28",
    title: "First release: Stage 1",
    notes: ["Desktop app shell with sidebar navigation", "Home screen: day counter, Next Day progression, bank balance, news feed"],
  },
];
