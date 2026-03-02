import * as migration_20260302_074845_baseline_for_idempotency from './20260302_074845_baseline_for_idempotency';

export const migrations = [
  {
    up: migration_20260302_074845_baseline_for_idempotency.up,
    down: migration_20260302_074845_baseline_for_idempotency.down,
    name: '20260302_074845_baseline_for_idempotency'
  },
];
