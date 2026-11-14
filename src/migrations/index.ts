import * as migration_20261114_022255_ilk_sema from './20261114_022255_ilk_sema';
import * as migration_20261114_085901_taslak_eksik_alanlar from './20261114_085901_taslak_eksik_alanlar';
import * as migration_20261114_102239_talepler_ve_unvan from './20261114_102239_talepler_ve_unvan';

export const migrations = [
  {
    up: migration_20261114_022255_ilk_sema.up,
    down: migration_20261114_022255_ilk_sema.down,
    name: '20261114_022255_ilk_sema',
  },
  {
    up: migration_20261114_085901_taslak_eksik_alanlar.up,
    down: migration_20261114_085901_taslak_eksik_alanlar.down,
    name: '20261114_085901_taslak_eksik_alanlar',
  },
  {
    up: migration_20261114_102239_talepler_ve_unvan.up,
    down: migration_20261114_102239_talepler_ve_unvan.down,
    name: '20261114_102239_talepler_ve_unvan'
  },
];
