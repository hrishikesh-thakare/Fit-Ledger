import * as migration_20260302_074845_baseline_for_idempotency from './20260302_074845_baseline_for_idempotency';
import * as migration_20260309_141421 from './20260309_141421';
import * as migration_20260309_144725 from './20260309_144725';
import * as migration_20260309_145822 from './20260309_145822';

export const migrations = [
  {
    up: migration_20260302_074845_baseline_for_idempotency.up,
    down: migration_20260302_074845_baseline_for_idempotency.down,
    name: '20260302_074845_baseline_for_idempotency',
  },
  {
    up: migration_20260309_141421.up,
    down: migration_20260309_141421.down,
    name: '20260309_141421',
  },
  {
    up: migration_20260309_144725.up,
    down: migration_20260309_144725.down,
    name: '20260309_144725',
  },
  {
    up: migration_20260309_145822.up,
    down: migration_20260309_145822.down,
    name: '20260309_145822'
  },
];
