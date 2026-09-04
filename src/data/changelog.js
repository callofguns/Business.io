// Hand-maintained alongside the release workflow: bump APP_VERSION and
// prepend a CHANGELOG entry as part of the same "push to main" step that
// tags a GitHub release (see README.md's Branch workflow section). Entries
// mirror the actual GitHub release notes at
// https://github.com/callofguns/Business.io/releases -- only released
// versions belong here, nothing still sitting on `dev` unreleased.
export const APP_VERSION = "v0.3.3-beta";

export const CHANGELOG = [
  {
    version: "v0.3.3-beta",
    date: "2026-09-04",
    title: "Internal cleanup",
    notes: [
      "Consolidated a few repeated UI patterns (empty-state placeholders and amount inputs) into shared components behind the scenes",
      "No visible changes to how anything looks or plays",
    ],
  },
  {
    version: "v0.3.2-beta",
    date: "2026-09-04",
    title: "Mobile fix: scrolling and safe areas",
    notes: [
      "Fixed a bug where the page would scroll partway then snap back to a previous position on iOS",
      "Content no longer overlaps the notch/status bar at the top or the home-indicator area at the bottom on iPhones",
    ],
  },
  {
    version: "v0.3.1-beta",
    date: "2026-09-04",
    title: "Stage 11: Loans",
    notes: [
      "New Loans screen — open a revolving Business Line of Credit ($25,000 limit, 24% APR) and borrow or repay freely, anytime",
      "Interest accrues daily on your outstanding balance; if you can't cover it, the interest capitalizes into the balance instead of forcing a payment",
      "Your credit line balance now counts as a liability everywhere net worth is calculated, including the Rivals leaderboard",
      "No changes to any other economy system — businesses, stocks, real estate, and taxes work exactly as before",
    ],
  },
  {
    version: "v0.3.0-beta",
    date: "2026-09-03",
    title: "Stage 10: Polish",
    notes: [
      "Mobile support — a bottom tab bar and \"More\" sheet now replace the sidebar on phones, fixing a layout that was previously unusable below desktop width",
      "Accessibility pass — visible focus rings app-wide, a real focus trap in dialogs, labelled form fields, and screen-reader-friendly state on toggles, charts, and the news feed",
      "A short welcome guide walks new players through the core loop on first login, replayable anytime from Settings",
      "Cleaned up empty states and stale copy across Marketplace, Tax Office, Finance, and the sidebar",
      "No gameplay or economy changes — this is a quality/interface release",
    ],
  },
  {
    version: "v0.2.7-beta",
    date: "2026-09-02",
    title: "Stage 9: Rivals",
    notes: [
      "New Rivals screen — a leaderboard ranking you against 6 fictional AI companies by total net worth (bank balance + stocks + owned real estate + a capitalized value of your businesses)",
      "Each rival grows at its own daily rate, some steady and some volatile, so the standings genuinely shift over a playthrough",
      "A news entry fires whenever your rank changes — overtaking a rival, or getting overtaken",
      "This completes the full roadmap — all 9 stages are now live",
    ],
  },
  {
    version: "v0.2.6-beta",
    date: "2026-09-02",
    title: "Stage 7: Real Estate + Update Log",
    notes: [
      "Stage 7: Real Estate — every Marketplace building's buy-outright price is now a live market value that drifts up daily (with a rare chance of a real crash), instead of a frozen number",
      "An owned building not occupied by your own business earns passive rental income, shown as a new \"Rental Income\" line in the Day Summary",
      "New Real Estate screen: your owned buildings as a portfolio — purchase price vs. live value, occupancy, and a Sell button",
      "Settings now shows the app version and an Update Log with every past release (this very entry included)",
    ],
  },
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
