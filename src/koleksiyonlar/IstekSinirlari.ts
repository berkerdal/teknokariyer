import type { CollectionConfig } from 'payload'
import { hicKimse, kurumOkur } from '../erisim'

/**
 * İstek sınırlama sayaçları (src/servisler/istekSiniri.ts). IP adresi saklanmaz; yalnızca anahtarlı özeti (HMAC) anahtarın
 * içinde durur. Satırlar pencere bitince işe yaramaz ve gece işiyle silinir (en geç bir gün).
 */
export const IstekSinirlari: CollectionConfig = {
  slug: 'istek-sinirlari',
  labels: { singular: 'İstek sayacı', plural: 'İstek sayaçları' },
  admin: { useAsTitle: 'anahtar', group: 'Sistem', description: 'Kötüye kullanıma karşı istek sayaçları. Kişisel veri içermez; günlük silinir.' },
  access: { read: kurumOkur, create: hicKimse, update: hicKimse, delete: hicKimse },
  fields: [
    { name: 'anahtar', type: 'text', required: true, unique: true, index: true },
    { name: 'sayi', type: 'number', required: true, defaultValue: 0 },
    { name: 'bitis', type: 'date', required: true, index: true },
  ],
}
