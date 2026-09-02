# business.io

A browser-based business tycoon simulator built for desktop — build an empire of
businesses, hire staff, invest in stocks and real estate, and climb the rivals
leaderboard. Time advances a day at a time via the "Next Day" button.

Built stage by stage, one working system at a time.

**Live:** https://callofguns.github.io/Business.io/

## Stack

- React 19 + Vite
- Tailwind CSS v4
- Framer Motion (spring-based, interruptible animations)
- Zustand (state)
- vite-plugin-pwa (installable, works offline)

## Getting started

```bash
npm install
npm run dev
```

## Stages

- [x] Stage 1 — Home screen: day counter, Next Day progression, bank balance, news feed
- [x] Dark mode — theme toggle (sidebar), system-preference default, persisted, no flash on load
- [x] Login screen — local name-entry gate, no accounts
- [x] Stage 2 — My Empire: owned business cards
- [x] Settings menu — gear button (sidebar, bottom-left) opens dark mode + currency (USD/GBP/EUR/JPY, defaults to USD)
- [x] Start New Business — pick from Small Shop / Small Cafe / Small Web Design Agency ($35,000
  each), name it, and it starts earning. Bank interest removed; income is now purely from
  businesses, rolled fresh each day within each business's risk range.
- [x] Day Summary modal — pops up after every Next Day with a Revenue/Rent/Other Expenses/Net
  Change breakdown. Rent and Other Expenses are real fields, currently always $0 until Real
  Estate / Hiring / Tax Office give them meaning.
- [x] PWA — installable (desktop and mobile "Add to Home Screen"/"Install app"), works offline
  after first load via a Workbox-generated service worker (`vite-plugin-pwa`, auto-update).
- [x] Stage 4 — Marketplace: 16 buildings (8 retail, 8 office) to buy or rent, each with a
  traffic index, customer capacity, and stat-driven rent. Starting a business now requires a
  matching building first. Businesses sell named products at weekly-drifting market prices
  (re-rolled every Sunday); daily earnings are a real function of building traffic/capacity,
  business capacity (grown via an "Invest in Capacity" stub), and product prices — the old
  flat random-range placeholder is gone. Rent is now a real recurring expense in the Day
  Summary. See `src/lib/economy.js` for the formulas and `scripts/verify-economy.js` for a
  headless economic sanity check (`node_modules/.bin/jiti scripts/verify-economy.js`).
- [x] Product pricing — click a business card to open its Pricing panel: each product can be
  priced independently of the live market rate. Matching market is neutral; pricing above
  trades fewer customers for more margin per sale, pricing below trades margin for turnout
  (revenue peaks exactly at market price and falls off symmetrically either side). Reset any
  product back to auto-following the market with one click.
- [x] Stage 3 — Business detail: click any business card to open its own page — daily
  visitors traffic chart, a 0-100 satisfaction (reputation) score that drifts daily toward a
  target set by your pricing and feeds back into demand, and a paid Promotion campaign
  (cost scales with the building's rent) for a temporary +50% traffic boost. Pricing
  (formerly on the My Empire card) lives here too. See `src/lib/economy.js` for the
  satisfaction/promotion formulas.
- [x] Stage 5 — Hiring: a Hiring screen lists every business and lets you hire/fire staff —
  each hire costs a one-time fee plus a recurring hourly wage (paid daily, shown as a new
  "Wages" line in the Day Summary and factored into taxable profit) and grows the business's
  capacity toward its building's max, replacing the old flat-cash capacity-investment stub.
  See `src/lib/economy.js` for the wage/capacity formulas.
- [x] Stage 6 — Finance Manager: buy/sell shares in 8 fictional stocks that random-walk in
  price every day (mean-reverting toward each stock's starting price so it can't run away
  to $0 or off to infinity), each with its own price-history chart. Half the list pays a
  small daily cash dividend per share held — credited straight to your bank balance and
  shown as a new "Dividends" line in the Day Summary — the other half only pays off through
  price appreciation. See `src/data/stocks.js` for the stock list and `src/lib/economy.js`
  for the price/dividend formulas.
- [x] Stage 7 — Real estate investments: extends the Marketplace building catalog into an
  investable asset — every building's buy-outright price is now a live market value that
  drifts up ~0.08%/day, with a small daily chance of a real crash (10-25% down, floored at
  50% of the original price), instead of a frozen number. An owned building not occupied by
  your own business earns passive rental income from a third-party tenant. The new Real
  Estate screen tracks your owned buildings as a portfolio — purchase price vs. live value,
  rental income, and a Sell button. See `src/lib/economy.js` for the growth/crash/rental
  formulas.
- [x] Stage 8 — Tax Office: a flat 15% tax on daily net business profit (revenue minus rent)
  accrues automatically and is filed — deducted from your bank, shown as the Day Summary's
  "Other Expenses" line — every 30 days, or any time from the Tax Office screen's "Pay Now".
  See `src/lib/economy.js` for the rate/cadence formulas.
- [ ] Stage 9 — Rivals / leaderboard

## Branch workflow

- `main` — default branch. Stable, released code only. Tagged as a beta
  release (`vX.Y.Z-beta.N`) each time `dev` is promoted here. Every push to
  `main` also redeploys the live GitHub Pages site (see
  `.github/workflows/deploy-pages.yml`).
- `dev` — integration branch. Always the latest working build across all
  finished stages.
- `feature/*` — one branch per stage/feature. Pushing commits to a `feature/*`
  branch automatically merges them into `dev` via GitHub Actions
  (see `.github/workflows/merge-to-dev.yml`).
