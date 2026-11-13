import type { CollectionConfig } from 'payload'
import { hicKimse, kurumOkur } from '../erisim'

/** İşlem kayıtları (talimatlar 10): değiştirilemez ve aranabilir. Yalnızca sistem yazar (src/altyapi/islemKaydi.ts). */
export const IslemKayitlari: CollectionConfig = {
  slug: 'islem-kayitlari',
  labels: { singular: 'İşlem kaydı', plural: 'İşlem kayıtları' },
  admin: { useAsTitle: 'islem', defaultColumns: ['createdAt', 'kim', 'islem', 'tur', 'kayitTuru'], group: 'KVKK' },
  access: { read: kurumOkur, create: hicKimse, update: hicKimse, delete: hicKimse },
  fields: [
    { name: 'islem', label: 'İşlem', type: 'text', required: true },
    {
      name: 'tur',
      label: 'Tür',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Kişisel veri erişimi', value: 'kisisel-veri' },
        { label: 'İlan', value: 'ilan' },
        { label: 'Moderasyon', value: 'moderasyon' },
        { label: 'Kurulum', value: 'kurulum' },
        { label: 'Ayarlar', value: 'ayarlar' },
        { label: 'Hesap', value: 'hesap' },
        { label: 'Başvuru', value: 'basvuru' },
      ],
    },
    { name: 'kim', label: 'Kim', type: 'relationship', relationTo: 'kullanicilar', index: true },
    { name: 'kayitTuru', label: 'Kayıt türü', type: 'text', index: true },
    { name: 'kayitId', label: 'Kayıt', type: 'text', index: true },
    { name: 'ayrinti', label: 'Ayrıntı', type: 'json' },
  ],
}
