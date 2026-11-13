import type { GlobalConfig } from 'payload'
import { kurumOkur, sadeceYonetici } from '../erisim'
import { VARSAYILAN_ONAYLI_ILAN_SAYISI, VARSAYILAN_EN_UZUN_SURE_GUN } from '../alan/ilan'
import { VARSAYILAN_AGIRLIKLAR } from '../alan/eslesme'
import { HAVUZ_RIZA_SURESI_AY } from '../alan/havuz'
import { islemKaydet } from '../altyapi/islemKaydi'

/** Sistem ayarları (talimatlar 10): onay politikası, süre sınırları, eşleşme ağırlıkları, saklama süreleri. */
export const Ayarlar: GlobalConfig = {
  slug: 'ayarlar',
  label: 'Sistem ayarları',
  admin: { group: 'Ayarlar' },
  access: { read: kurumOkur, update: sadeceYonetici },
  versions: { max: 50 },
  hooks: {
    afterChange: [async ({ req }) => islemKaydet(req, { islem: 'Sistem ayarları değişti', tur: 'ayarlar', kayitTuru: 'ayarlar' })],
  },
  fields: [
    { name: 'onayliIlanSayisi', label: 'Kaç ilan onaydan geçsin? (K4)', type: 'number', min: 0, defaultValue: VARSAYILAN_ONAYLI_ILAN_SAYISI },
    { name: 'enUzunSureGun', label: 'Son başvuru tarihi en fazla kaç gün sonrası olabilir?', type: 'number', min: 7, max: 180, defaultValue: VARSAYILAN_EN_UZUN_SURE_GUN },
    { name: 'onayHedefiIsGunu', label: 'Onay hedefi (iş günü)', type: 'number', min: 1, defaultValue: 1 },
    {
      name: 'eslesmeAgirliklari',
      label: 'Eşleşme ağırlıkları (sıralama için; adaylara ve firmalara gösterilmez)',
      type: 'group',
      fields: (Object.keys(VARSAYILAN_AGIRLIKLAR) as Array<keyof typeof VARSAYILAN_AGIRLIKLAR>).map((k) => ({
        name: k,
        type: 'number' as const,
        min: 0,
        max: 100,
        defaultValue: VARSAYILAN_AGIRLIKLAR[k],
      })),
    },
    {
      name: 'saklama',
      label: 'Saklama süreleri (KVKK)',
      type: 'group',
      fields: [
        { name: 'basvuruAnonimlestirmeAy', label: 'İlan kapandıktan kaç ay sonra başvurular anonimleştirilsin?', type: 'number', min: 1, defaultValue: 12 },
        { name: 'havuzRizaAy', label: 'Havuz rızası kaç ay geçerli?', type: 'number', min: 1, defaultValue: HAVUZ_RIZA_SURESI_AY },
        { name: 'islemKaydiAy', label: 'İşlem kayıtları kaç ay saklansın?', type: 'number', min: 12, defaultValue: 24 },
      ],
    },
    {
      name: 'hatirlatmaGunleri',
      label: 'Kurulum hatırlatmaları (gün)',
      type: 'array',
      defaultValue: [{ gun: 3 }, { gun: 7 }, { gun: 14 }],
      fields: [{ name: 'gun', type: 'number', required: true, min: 1 }],
    },
  ],
}
