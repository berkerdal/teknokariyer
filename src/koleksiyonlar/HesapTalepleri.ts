import type { CollectionConfig } from 'payload'
import { hicKimse, kullanici, moderasyonYapabilirMi } from '../erisim'

/**
 * Firma hesap talepleri (src/alan/hesapTalebi.ts, servis src/servisler/hesapTalebi.ts). Herkese açık formdan gelir;
 * yalnızca moderasyon yetkili kurum kullanıcısı görür. Sonuç: yetkiliye davet veya gerekçeli ret.
 */
export const HesapTalepleri: CollectionConfig = {
  slug: 'hesap-talepleri',
  labels: { singular: 'Firma hesap talebi', plural: 'Firma hesap talepleri' },
  admin: { group: 'Firmalar', defaultColumns: ['firmaAdi', 'yetkiliAd', 'durum', 'createdAt'] },
  access: { read: ({ req }) => moderasyonYapabilirMi(kullanici(req)), create: hicKimse, update: hicKimse, delete: hicKimse },
  fields: [
    { name: 'firmaAdi', type: 'text', required: true, maxLength: 200 },
    { name: 'konum', type: 'text', maxLength: 60, admin: { description: 'Blok ve oda, ör. D Blok 208' } },
    { name: 'yetkiliAd', type: 'text', required: true, maxLength: 120 },
    { name: 'unvan', type: 'text', maxLength: 120 },
    { name: 'eposta', type: 'email', required: true },
    { name: 'telefon', type: 'text', maxLength: 30 },
    { name: 'not', type: 'textarea', maxLength: 1000 },
    { name: 'aydinlatmaSurumu', type: 'text', required: true },
    {
      name: 'durum',
      type: 'select',
      required: true,
      defaultValue: 'yeni',
      index: true,
      options: [
        { value: 'yeni', label: 'Sonuç bekliyor' },
        { value: 'davet', label: 'Davet gönderildi' },
        { value: 'red', label: 'Reddedildi' },
      ],
    },
    { name: 'firma', type: 'relationship', relationTo: 'firmalar', admin: { description: 'Eşleştirilen firma kaydı' } },
    { name: 'retGerekcesi', type: 'textarea' },
    { name: 'sonuclandiran', type: 'relationship', relationTo: 'kullanicilar' },
    { name: 'sonuclanmaTarihi', type: 'date' },
  ],
}
