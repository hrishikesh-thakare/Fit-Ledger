import * as migration_20260215_150300 from './20260215_150300';

export const migrations = [
  {
    up: migration_20260215_150300.up,
    down: migration_20260215_150300.down,
    name: '20260215_150300'
  },
];
