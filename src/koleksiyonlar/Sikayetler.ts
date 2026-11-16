import type { CollectionConfig } from 'payload'
import { hicKimse, kullanici, moderasyonYapabilirMi } from '../erisim'
import { SIKAYET_NEDENI, SIKAYET_SONUCU } from '../alan/sikayet'

/**
 * İlan şikâyetleri (src/alan/sikayet.ts, servis src/servisler/sikayet.ts).
 * - Yalnızca aday bildirir (servis üzerinden); bildireni ve açıklamayı yalnızca moderasyon yetkili kurum görür.
 * - Firma bildirimi ve bildirenin kimliğini görmez.
 */
export const Sikayetler: CollectionConfig = {
  slug: 'sikayetler',
  labels: { singular: 'İlan şikâyeti', plural: 'İlan şikâyetleri' },
  admin: { group: 'Moderasyon', defaultColumns: ['ilan', 'neden', 'durum', 'createdAt'] },
  access: { read: ({ req }) => moderasyonYapabilirMi(kullanici(req)), create: hicKimse, update: hicKimse, delete: hicKimse },
  fields: [
    { name: 'ilan', type: 'relationship', relationTo: 'ilanlar', required: true, index: true },
    { name: 'gonderen', type: 'relationship', relationTo: 'kullanicilar', index: true },
    { name: 'neden', type: 'select', required: true, options: Object.entries(SIKAYET_NEDENI).map(([value, n]) => ({ value, label: n.ad })) },
    { name: 'aciklama', type: 'textarea', maxLength: 1000 },
    {
      name: 'durum',
      type: 'select',
      required: true,
      defaultValue: 'yeni',
      index: true,
      options: [
        { value: 'yeni', label: 'İnceleme bekliyor' },
        { value: 'sonuclandi', label: 'Sonuçlandı' },
      ],
    },
    { name: 'sonuc', type: 'select', options: Object.entries(SIKAYET_SONUCU).map(([value, n]) => ({ value, label: n.ad })) },
    { name: 'firmaMesaji', type: 'textarea', admin: { description: 'Uyarı veya kaldırmada firmaya giden mesaj.' } },
    { name: 'icNot', type: 'textarea', admin: { description: 'Yalnızca Yönetici A.Ş. görür.' } },
    { name: 'sonuclandiran', type: 'relationship', relationTo: 'kullanicilar' },
    { name: 'sonuclanmaTarihi', type: 'date' },
  ],
}
