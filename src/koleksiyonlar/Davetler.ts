import type { CollectionConfig } from 'payload'
import { sadeceYonetici } from '../erisim'

/**
 * Firma yetkilisi davetleri (talimatlar 0.3): kişiye özel, tek kullanımlık, 14 gün geçerli.
 * Bağlantıdaki anahtarın kendisi saklanmaz, yalnızca özeti (hash) saklanır.
 */
export const DAVET_GECERLILIK_GUN = 14

export const Davetler: CollectionConfig = {
  slug: 'davetler',
  labels: { singular: 'Davet', plural: 'Davetler' },
  admin: { defaultColumns: ['firma', 'eposta', 'sonGecerlilik', 'kullanildi'], group: 'Firmalar' },
  access: { read: sadeceYonetici, create: sadeceYonetici, update: sadeceYonetici, delete: sadeceYonetici },
  fields: [
    { name: 'firma', type: 'relationship', relationTo: 'firmalar', required: true, index: true },
    { name: 'ad', label: 'Yetkili ad soyad', type: 'text', required: true },
    { name: 'eposta', label: 'Yetkili iş e-postası', type: 'email', required: true },
    {
      name: 'firmaYetkisi',
      type: 'select',
      defaultValue: 'yonetici',
      options: [
        { label: 'Yönetici', value: 'yonetici' },
        { label: 'İlan sorumlusu', value: 'ilan-sorumlusu' },
        { label: 'Değerlendirici', value: 'degerlendirici' },
      ],
    },
    { name: 'anahtarOzeti', type: 'text', required: true, index: true, admin: { hidden: true }, access: { read: () => false } },
    { name: 'sonGecerlilik', label: 'Son geçerlilik', type: 'date', required: true },
    { name: 'kullanildi', label: 'Kullanıldı', type: 'date' },
    { name: 'hatirlatmalar', label: 'Gönderilen hatırlatmalar', type: 'array', fields: [{ name: 'tarih', type: 'date', required: true }, { name: 'gun', type: 'number' }] },
  ],
}
