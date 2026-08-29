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
- [ ] Stage 3 — Business detail: traffic chart, satisfaction & promotion stats
- [ ] Stage 4 — Marketplace: buy new businesses
- [ ] Stage 5 — Hiring flow
- [ ] Stage 6 — Finance Manager: stock market
- [ ] Stage 7 — Real estate investments
- [ ] Stage 8 — Tax Office
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
