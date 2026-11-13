import type { CollectionConfig } from 'payload'
import { adayMi, alanKimseYazamaz, kullanici, kurumKullanicisiMi } from '../erisim'

/**
 * Rıza ve onay kayıtları (talimatlar 12). Her onay metnin sürümüyle birlikte saklanır.
 * Kayıt değiştirilmez; geri alma, yeni bir tarih alanı doldurularak yapılır (geçmiş korunur).
 */
export const RIZA_TURLERI = [
  { label: 'Aday aydınlatma metni', value: 'aday-aydinlatma' },
  { label: 'Başvuru aydınlatma metni', value: 'basvuru-aydinlatma' },
  { label: 'CV havuzu açık rızası', value: 'havuz' },
  { label: 'Özel nitelikli veri açık rızası', value: 'ozel-nitelikli' },
  { label: 'Ticari ileti onayı', value: 'ticari-ileti' },
] as const

export const Rizalar: CollectionConfig = {
  slug: 'rizalar',
  labels: { singular: 'Rıza kaydı', plural: 'Rıza kayıtları' },
  admin: { defaultColumns: ['kullanici', 'tur', 'metinSurumu', 'createdAt', 'geriAlinma'], group: 'KVKK' },
  access: {
    read: ({ req }) => {
      const k = kullanici(req)
      if (kurumKullanicisiMi(k)) return true
      return k ? { kullanici: { equals: k.id } } : false
    },
    create: ({ req }) => Boolean(kullanici(req)),
    // Yalnızca sahibi geri alabilir; alan erişimleri diğer her şeyi kilitler.
    update: ({ req }) => {
      const k = kullanici(req)
      return adayMi(k) ? { kullanici: { equals: k!.id } } : false
    },
    delete: () => false,
  },
  hooks: {
    beforeValidate: [
      ({ data, req, operation }) => {
        const k = kullanici(req)
        if (data && operation === 'create' && k && !kurumKullanicisiMi(k)) data.kullanici = k.id
        return data
      },
    ],
  },
  fields: [
    { name: 'kullanici', type: 'relationship', relationTo: 'kullanicilar', required: true, index: true, access: { update: alanKimseYazamaz } },
    { name: 'tur', label: 'Tür', type: 'select', required: true, options: [...RIZA_TURLERI], access: { update: alanKimseYazamaz } },
    { name: 'metinSurumu', label: 'Metin sürümü', type: 'text', required: true, access: { update: alanKimseYazamaz } },
    { name: 'geriAlinma', label: 'Geri alınma tarihi', type: 'date' },
  ],
}
