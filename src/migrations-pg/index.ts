import * as migration_20261115_131140_ilk_sema from './20261115_131140_ilk_sema';

export const migrations = [
  {
    up: migration_20261115_131140_ilk_sema.up,
    down: migration_20261115_131140_ilk_sema.down,
    name: '20261115_131140_ilk_sema'
  },
];
