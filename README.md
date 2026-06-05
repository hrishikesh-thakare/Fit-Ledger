# FitLedger

FitLedger is a Next.js + Payload app for building routines, tracking workouts, and logging bodyweight with offline-first support.

The migration path now introduces an Expo React Native app under `apps/mobile` and shared domain logic under `packages/shared`.

## Tech Stack

- Next.js 15
- Payload CMS 3 + PostgreSQL
- React 19 + MUI
- Dexie (IndexedDB) for offline cache/sync
- Playwright + Vitest for testing

## Package Manager

This repository uses `npm` (single-package-manager migration from pnpm).

Required versions:

- Node: `^18.20.2 || >=20.9.0`

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open:

```
http://localhost:3000
```

## Scripts

- `npm run dev` — run local dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — lint
- `npm run test:int` — integration tests (Vitest)
- `npm run test:e2e` — end-to-end tests (Playwright)
- `npm test` — runs integration + e2e tests

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
