import * as migration_20261114_022255_ilk_sema from './20261114_022255_ilk_sema';
import * as migration_20261114_085901_taslak_eksik_alanlar from './20261114_085901_taslak_eksik_alanlar';
import * as migration_20261114_102239_talepler_ve_unvan from './20261114_102239_talepler_ve_unvan';
import * as migration_20261114_130910_kullanici_pasif from './20261114_130910_kullanici_pasif';
import * as migration_20261114_174215_teknik_sorumlu from './20261114_174215_teknik_sorumlu';
import * as migration_20261114_181314_gunluk_ozet_saklama from './20261114_181314_gunluk_ozet_saklama';
import * as migration_20261114_194152_kvkk_talepleri from './20261114_194152_kvkk_talepleri';
import * as migration_20261115_081840_iki_adim from './20261115_081840_iki_adim';
import * as migration_20261115_083416_yeni_cihaz from './20261115_083416_yeni_cihaz';
import * as migration_20261115_090859_guvenlik_ayarlari from './20261115_090859_guvenlik_ayarlari';
import * as migration_20261115_092436_istek_sinirlari from './20261115_092436_istek_sinirlari';
import * as migration_20261115_153138_kaydedilenler_trafik from './20261115_153138_kaydedilenler_trafik';
import * as migration_20261115_161035_sertifika_ayrintilari from './20261115_161035_sertifika_ayrintilari';
import * as migration_20261115_194523_egitimler from './20261115_194523_egitimler';
import * as migration_20261115_200410_istatistik_izni from './20261115_200410_istatistik_izni';
import * as migration_20261115_214546_havuz_riza_hatirlatma from './20261115_214546_havuz_riza_hatirlatma';
import * as migration_20261116_004915_kayitli_aramalar from './20261116_004915_kayitli_aramalar';

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
    name: '20261114_181314_gunluk_ozet_saklama',
  },
  {
    up: migration_20261114_194152_kvkk_talepleri.up,
    down: migration_20261114_194152_kvkk_talepleri.down,
    name: '20261114_194152_kvkk_talepleri',
  },
  {
    up: migration_20261115_081840_iki_adim.up,
    down: migration_20261115_081840_iki_adim.down,
    name: '20261115_081840_iki_adim',
  },
  {
    up: migration_20261115_083416_yeni_cihaz.up,
    down: migration_20261115_083416_yeni_cihaz.down,
    name: '20261115_083416_yeni_cihaz',
  },
  {
    up: migration_20261115_090859_guvenlik_ayarlari.up,
    down: migration_20261115_090859_guvenlik_ayarlari.down,
    name: '20261115_090859_guvenlik_ayarlari',
  },
  {
    up: migration_20261115_092436_istek_sinirlari.up,
    down: migration_20261115_092436_istek_sinirlari.down,
    name: '20261115_092436_istek_sinirlari',
  },
  {
    up: migration_20261115_153138_kaydedilenler_trafik.up,
    down: migration_20261115_153138_kaydedilenler_trafik.down,
    name: '20261115_153138_kaydedilenler_trafik',
  },
  {
    up: migration_20261115_161035_sertifika_ayrintilari.up,
    down: migration_20261115_161035_sertifika_ayrintilari.down,
    name: '20261115_161035_sertifika_ayrintilari',
  },
  {
    up: migration_20261115_194523_egitimler.up,
    down: migration_20261115_194523_egitimler.down,
    name: '20261115_194523_egitimler',
  },
  {
    up: migration_20261115_200410_istatistik_izni.up,
    down: migration_20261115_200410_istatistik_izni.down,
    name: '20261115_200410_istatistik_izni',
  },
  {
    up: migration_20261115_214546_havuz_riza_hatirlatma.up,
    down: migration_20261115_214546_havuz_riza_hatirlatma.down,
    name: '20261115_214546_havuz_riza_hatirlatma',
  },
  {
    up: migration_20261116_004915_kayitli_aramalar.up,
    down: migration_20261116_004915_kayitli_aramalar.down,
    name: '20261116_004915_kayitli_aramalar'
  },
];
