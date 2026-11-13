import type { CollectionConfig } from 'payload'
import { herkes, sadeceYonetici } from '../erisim'
import { aramaMetni } from '../alan/metin'

/**
 * Taksonomiler (talimatlar 8): beceriler, pozisyon aileleri, sektörler, üniversiteler, bölümler, diller.
 * İlan ve aday profili aynı listeyi kullanır; eşleşme ancak böyle doğru çalışır.
 * Eş anlamlılar ("JS" = "JavaScript") aramada ve beceri girişinde aynı kayda yönlendirir.
 */
export const TAKSONOMI_TURLERI = [
  { label: 'Beceri', value: 'beceri' },
  { label: 'Pozisyon ailesi', value: 'pozisyon-ailesi' },
  { label: 'Sektör', value: 'sektor' },
  { label: 'Üniversite', value: 'universite' },
  { label: 'Bölüm', value: 'bolum' },
  { label: 'Dil', value: 'dil' },
] as const

export const Taksonomiler: CollectionConfig = {
  slug: 'taksonomiler',
  labels: { singular: 'Taksonomi kaydı', plural: 'Taksonomiler' },
  admin: { useAsTitle: 'ad', defaultColumns: ['ad', 'tur', 'esAnlamlilar'], group: 'Ayarlar' },
  access: { read: herkes, create: sadeceYonetici, update: sadeceYonetici, delete: sadeceYonetici },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const v = { ...(originalDoc ?? {}), ...data }
        data.arama = aramaMetni([v.ad, ...(v.esAnlamlilar ?? []).map((e: { ad?: string }) => e?.ad)])
        return data
      },
    ],
  },
  fields: [
    { name: 'tur', label: 'Tür', type: 'select', required: true, index: true, options: [...TAKSONOMI_TURLERI] },
    { name: 'ad', label: 'Ad', type: 'text', required: true },
    {
      name: 'esAnlamlilar',
      label: 'Eş anlamlılar',
      type: 'array',
      admin: { description: 'Aynı şeyi anlatan diğer yazımlar. Örnek: JavaScript için "JS".' },
      fields: [{ name: 'ad', type: 'text', required: true }],
    },
    { name: 'aktif', label: 'Seçilebilir', type: 'checkbox', defaultValue: true },
    { name: 'arama', type: 'text', index: true, admin: { hidden: true } },
  ],
}
