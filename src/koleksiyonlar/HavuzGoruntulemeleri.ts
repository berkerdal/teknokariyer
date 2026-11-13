import type { CollectionConfig } from 'payload'
import { hicKimse, kurumOkur } from '../erisim'

/**
 * Firmanın havuzda bir aday profilini açması (K5, K24). Aday yalnızca son 30 gündeki firma sayısını görür.
 * Kayıt yalnızca sistem tarafından, profil açma ucunda yazılır.
 */
export const HavuzGoruntulemeleri: CollectionConfig = {
  slug: 'havuz-goruntulemeleri',
  labels: { singular: 'Havuz görüntülemesi', plural: 'Havuz görüntülemeleri' },
  admin: { group: 'KVKK', defaultColumns: ['aday', 'firma', 'kim', 'createdAt'] },
  access: { read: kurumOkur, create: hicKimse, update: hicKimse, delete: hicKimse },
  fields: [
    { name: 'aday', type: 'relationship', relationTo: 'adaylar', required: true, index: true },
    { name: 'firma', type: 'relationship', relationTo: 'firmalar', required: true, index: true },
    { name: 'kim', type: 'relationship', relationTo: 'kullanicilar' },
  ],
}
