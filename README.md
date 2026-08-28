# business.io

A browser-based business tycoon simulator built for desktop — build an empire of
businesses, hire staff, invest in stocks and real estate, and climb the rivals
leaderboard. Time advances a day at a time via the "Next Day" button.

Built stage by stage, one working system at a time.

**Live:** https://callofguns.github.io/business.io/

## Stack

- React 19 + Vite
- Tailwind CSS v4
- Framer Motion (spring-based, interruptible animations)
- Zustand (state)

## Getting started

```bash
npm install
npm run dev
```

## Stages

- [x] Stage 1 — Home screen: day counter, Next Day progression, bank balance, news feed
- [x] Dark mode — theme toggle (sidebar), system-preference default, persisted, no flash on load
- [ ] Stage 2 — My Empire: owned business cards
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
