import * as migration_20261115_131140_ilk_sema from './20261115_131140_ilk_sema';
import * as migration_20261115_153210_kaydedilenler_trafik from './20261115_153210_kaydedilenler_trafik';
import * as migration_20261115_161043_sertifika_ayrintilari from './20261115_161043_sertifika_ayrintilari';
import * as migration_20261115_194533_egitimler from './20261115_194533_egitimler';
import * as migration_20261115_200413_istatistik_izni from './20261115_200413_istatistik_izni';
import * as migration_20261115_214551_havuz_riza_hatirlatma from './20261115_214551_havuz_riza_hatirlatma';
import * as migration_20261116_004918_kayitli_aramalar from './20261116_004918_kayitli_aramalar';

export const migrations = [
  {
    up: migration_20261115_131140_ilk_sema.up,
    down: migration_20261115_131140_ilk_sema.down,
    name: '20261115_131140_ilk_sema',
  },
  {
    up: migration_20261115_153210_kaydedilenler_trafik.up,
    down: migration_20261115_153210_kaydedilenler_trafik.down,
    name: '20261115_153210_kaydedilenler_trafik',
  },
  {
    up: migration_20261115_161043_sertifika_ayrintilari.up,
    down: migration_20261115_161043_sertifika_ayrintilari.down,
    name: '20261115_161043_sertifika_ayrintilari',
  },
  {
    up: migration_20261115_194533_egitimler.up,
    down: migration_20261115_194533_egitimler.down,
    name: '20261115_194533_egitimler',
  },
  {
    up: migration_20261115_200413_istatistik_izni.up,
    down: migration_20261115_200413_istatistik_izni.down,
    name: '20261115_200413_istatistik_izni',
  },
  {
    up: migration_20261115_214551_havuz_riza_hatirlatma.up,
    down: migration_20261115_214551_havuz_riza_hatirlatma.down,
    name: '20261115_214551_havuz_riza_hatirlatma',
  },
  {
    up: migration_20261116_004918_kayitli_aramalar.up,
    down: migration_20261116_004918_kayitli_aramalar.down,
    name: '20261116_004918_kayitli_aramalar'
  },
];
