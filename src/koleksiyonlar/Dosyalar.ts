import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { kullanici, kurumKullanicisiMi, yoneticiMi } from '../erisim'

/**
 * Yüklenen dosyalar.
 * - CV ve şartnameler herkese açık değildir; yalnızca sahibi ve kurum doğrudan okur. Firmalar CV'ye başvuru veya havuz
 *   üzerinden, kısa süreli imzalı bağlantıyla ve filigranlı olarak erişir (K6; M4).
 * - Görsellerde alternatif metin zorunludur (CLAUDE.md 5).
 * - Her dosya virüs taraması tamamlanana kadar "bekliyor" durumundadır (docs/teknoloji-onerisi.md, 6).
 */
const HERKESE_ACIK_TURLER = ['logo', 'kapak', 'galeri']
const BES_MB = 5 * 1024 * 1024

export const Dosyalar: CollectionConfig = {
  slug: 'dosyalar',
  labels: { singular: 'Dosya', plural: 'Dosyalar' },
  admin: { group: 'Sistem', defaultColumns: ['filename', 'tur', 'taramaDurumu', 'createdAt'] },
  access: {
    read: ({ req }) => {
      const k = kullanici(req)
      if (kurumKullanicisiMi(k)) return true
      const acik = { tur: { in: HERKESE_ACIK_TURLER } }
      return k ? { or: [acik, { sahip: { equals: k.id } }] } : acik
    },
    create: ({ req }) => Boolean(kullanici(req)),
    update: ({ req }) => {
      const k = kullanici(req)
      if (yoneticiMi(k)) return true
      return k ? { sahip: { equals: k.id } } : false
    },
    delete: ({ req }) => {
      const k = kullanici(req)
      if (yoneticiMi(k)) return true
      return k ? { sahip: { equals: k.id } } : false
    },
  },
  upload: {
    crop: false,
    focalPoint: false,
    mimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
  },
  hooks: {
    beforeValidate: [
      ({ data, req, operation }) => {
        const k = kullanici(req)
        if (data && operation === 'create' && k) data.sahip = k.id
        const dosya = req.file
        if (dosya && dosya.size > BES_MB) throw new APIError('Dosya 5 MB’tan büyük. PDF’i sıkıştırıp tekrar yükle.', 400, undefined, true)
        if (data && ['cv', 'sartname'].includes(data.tur) && dosya && dosya.mimetype !== 'application/pdf')
          throw new APIError('Yalnızca PDF yüklenebilir.', 400, undefined, true)
        return data
      },
    ],
  },
  fields: [
    {
      name: 'tur',
      label: 'Tür',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'CV', value: 'cv' },
        { label: 'Şartname', value: 'sartname' },
        { label: 'Logo', value: 'logo' },
        { label: 'Kapak görseli', value: 'kapak' },
        { label: 'Galeri fotoğrafı', value: 'galeri' },
      ],
    },
    {
      name: 'alt',
      label: 'Alternatif metin',
      type: 'text',
      admin: { description: 'Görselde ne olduğunu anlatan kısa metin. Görsellerde zorunlu.' },
      validate: (deger: unknown, { data }: { data: { tur?: string } }) =>
        HERKESE_ACIK_TURLER.includes(data?.tur ?? '') && !String(deger ?? '').trim()
          ? 'Görseller için alternatif metin zorunlu.'
          : true,
    },
    { name: 'sahip', type: 'relationship', relationTo: 'kullanicilar', index: true, access: { update: () => false } },
    {
      name: 'taramaDurumu',
      label: 'Virüs taraması',
      type: 'select',
      defaultValue: 'bekliyor',
      access: { update: () => false },
      options: [
        { label: 'Bekliyor', value: 'bekliyor' },
        { label: 'Temiz', value: 'temiz' },
        { label: 'Zararlı', value: 'zararli' },
      ],
    },
  ],
}
