import * as migration_20261114_022255_ilk_sema from './20261114_022255_ilk_sema';

export const migrations = [
  {
    up: migration_20261114_022255_ilk_sema.up,
    down: migration_20261114_022255_ilk_sema.down,
    name: '20261114_022255_ilk_sema'
  },
];
