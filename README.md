# FitLedger

FitLedger is a Next.js + Payload app for building routines, tracking workouts, and logging bodyweight with offline-first support.

## Tech Stack

- Next.js 15
- Payload CMS 3 + PostgreSQL
- React 19 + MUI
- Dexie (IndexedDB) for offline cache/sync
- Playwright + Vitest for testing

## Package Manager

This repository uses **pnpm**.

Required versions:

- Node: `^18.20.2 || >=20.9.0`
- pnpm: `^9 || ^10`

## Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Start development server:

```bash
pnpm dev
```

3. Open:

```
http://localhost:3000
```

## Scripts

- `pnpm dev` — run local dev server
- `pnpm build` — production build
- `pnpm start` — run production server
- `pnpm lint` — lint
- `pnpm test:int` — integration tests (Vitest)
- `pnpm test:e2e` — end-to-end tests (Playwright)
- `pnpm test` — runs integration + e2e tests

## Offline Support (Current Scope)

- Complete workout offline (queued and synced later)
- Log bodyweight offline (queued and synced later)
- View pre-cached routines and exercises offline

Not in offline scope:

- Auth flows
- Routine editing

## Notes

- Service worker and Workbox assets in `public/` are generated artifacts.
- By repo policy, only `README.md` is tracked among markdown docs.
