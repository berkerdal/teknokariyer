import * as migration_20261114_022255_ilk_sema from './20261114_022255_ilk_sema';
import * as migration_20261114_085901_taslak_eksik_alanlar from './20261114_085901_taslak_eksik_alanlar';
import * as migration_20261114_102239_talepler_ve_unvan from './20261114_102239_talepler_ve_unvan';
import * as migration_20261114_130910_kullanici_pasif from './20261114_130910_kullanici_pasif';
import * as migration_20261114_174215_teknik_sorumlu from './20261114_174215_teknik_sorumlu';
import * as migration_20261114_181314_gunluk_ozet_saklama from './20261114_181314_gunluk_ozet_saklama';

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
    name: '20261114_102239_talepler_ve_unvan',
  },
  {
    up: migration_20261114_130910_kullanici_pasif.up,
    down: migration_20261114_130910_kullanici_pasif.down,
    name: '20261114_130910_kullanici_pasif',
  },
  {
    up: migration_20261114_174215_teknik_sorumlu.up,
    down: migration_20261114_174215_teknik_sorumlu.down,
    name: '20261114_174215_teknik_sorumlu',
  },
  {
    up: migration_20261114_181314_gunluk_ozet_saklama.up,
    down: migration_20261114_181314_gunluk_ozet_saklama.down,
    name: '20261114_181314_gunluk_ozet_saklama'
  },
];
