import type { CollectionConfig } from 'payload'

/** Yüklenen dosyalar. CV'lerin korunması (imzalı bağlantı, virüs tarama) M3 ve sonrasında eklenecek. */
export const Dosyalar: CollectionConfig = {
  slug: 'dosyalar',
  labels: { singular: 'Dosya', plural: 'Dosyalar' },
  access: { read: ({ req }) => Boolean(req.user) },
  fields: [{ name: 'alt', label: 'Alternatif metin', type: 'text', required: true }],
  upload: { crop: false, focalPoint: false },
}
