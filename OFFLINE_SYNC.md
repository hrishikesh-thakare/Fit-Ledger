# FitLedger — Offline-First Sync

## Design Constraints

- **Single user, single device** — no multi-device reconciliation
- **Push-only sync** (local → server) — no pull-based merges
- **No conflict resolution** — server is the backup, not a peer
- **No offline routine editing or auth flows**

## Architecture

```
┌──────────────────────────────────────────┐
│             React UI (MUI)               │
└────────┬──────────────────┬──────────────┘
         │ write             │ read
   ┌─────▼─────┐     ┌──────▼──────┐
   │ IndexedDB  │     │  Network    │
   │  (Dexie)   │     │  Monitor    │
   └─────┬─────┘     └──────┬──────┘
         │                   │
   ┌─────▼───────────────────▼─────┐
   │        Sync Manager           │
   │  Queue items while offline    │
   │  Push sequentially when online│
   └───────────────┬───────────────┘
                   │
         ┌─────────▼─────────┐
         │   Payload CMS API │
         │   (PostgreSQL)    │
         └───────────────────┘
```

## Sync Flow

1. User completes a workout or logs bodyweight
2. Data is written to **IndexedDB** immediately
3. A `pending` entry is added to the **syncQueue** table
4. When online, `SyncManager.processQueue()` pushes each item to the server via HTTP
5. On success → queue entry is deleted
6. On failure → `retryCount` incremented (max 5 retries, then dropped)

## Offline Support Scope

| Feature               | Offline | Notes                              |
|-----------------------|---------|------------------------------------|
| Complete a workout    | ✅ Yes  | Saved locally, synced when online  |
| Log bodyweight        | ✅ Yes  | Saved locally, synced when online  |
| View exercise library | ✅ Yes  | Pre-cached read-only from server   |
| View routines         | ✅ Yes  | Pre-cached read-only from server   |
| View workout history  | ✅ Yes  | From IndexedDB cache               |
| Auth token            | ✅ Yes  | Already persisted in cookie        |
| Edit routines         | ❌ No   | Requires server                    |
| Login / Signup        | ❌ No   | Requires server                    |
| Admin panel           | ❌ No   | Requires server                    |
| Media uploads         | ❌ No   | Requires server                    |

## File Map

```
src/
├── lib/offline/
│   ├── db.ts              ← IndexedDB schema (Dexie)
│   ├── sync-manager.ts    ← Push-only sync queue
│   └── cache-manager.ts   ← Pre-cache exercises & routines
├── hooks/
│   ├── useOnlineStatus.ts ← navigator.onLine + custom event
│   └── useOfflineData.ts  ← Server-first, cache-fallback reads
├── components/
│   └── SyncStatusIndicator.tsx ← Offline / Syncing / Synced chip
└── app/(frontend)/
    └── OfflinePrefetch.tsx ← Triggers pre-cache on mount
```

## Key APIs

### SyncManager

```ts
import { syncManager } from '@/lib/offline/sync-manager'

// Save a completed workout offline + enqueue
await syncManager.saveWorkoutOffline({ id, routineId, date, ... })

// Save a bodyweight log offline + enqueue
await syncManager.saveBodyweightOffline({ id, weight, unit, date, ... })

// Flush the queue (called automatically when back online)
await syncManager.processQueue()

// Check pending count
const count = await syncManager.getPendingCount()
```

### useOfflineData

```ts
const { data, loading, source } = useOfflineData<Exercise>('exercises', '/api/custom/exercises')
// source === 'server' | 'cache'
```

### useOnlineStatus

```ts
const { isOnline, wasOffline } = useOnlineStatus()
```

## Dependencies

- `dexie` — IndexedDB wrapper
- `dexie-react-hooks` — optional, for live queries
