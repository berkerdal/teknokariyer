import type { CollectionConfig } from 'payload'
import {
  alanKurum,
  alanSadeceYonetici,
  firmaKimligi,
  firmaKullanicisiMi,
  firmaYetkisiVarMi,
  kullanici,
  kurumKullanicisiMi,
  sadeceYonetici,
  yoneticiMi,
} from '../erisim'
import { aramaMetni } from '../alan/metin'
import { islemKaydet } from '../altyapi/islemKaydi'

/**
 * Firmalar (talimatlar 3, 0.3; K3).
 * Yönetici A.Ş. iskelet kaydı açar, firma devralıp profili doldurur. Kurulum aşaması hunide izlenir.
 * Profil yalnızca "yayına hazır" olduğunda (logo, kısa tanıtım, sektör) herkese açık görünür.
 */
export const KURULUM_ASAMALARI = [
  { label: 'İskelet', value: 'iskelet' },
  { label: 'Davet gönderildi', value: 'davet' },
  { label: 'Devralındı', value: 'devralindi' },
  { label: 'Profil tamam', value: 'profil-tamam' },
  { label: 'Pasif (Teknokent’ten ayrıldı)', value: 'pasif' },
] as const

export const Firmalar: CollectionConfig = {
  slug: 'firmalar',
  labels: { singular: 'Firma', plural: 'Firmalar' },
  admin: { useAsTitle: 'kisaAd', defaultColumns: ['kisaAd', 'konum', 'asama', 'guvenilir'], group: 'Firmalar' },
  versions: { maxPerDoc: 20 },
  access: {
    read: ({ req }) => {
      const k = kullanici(req)
      if (kurumKullanicisiMi(k)) return true
      const herkeseAcik = { and: [{ yayinaHazir: { equals: true } }, { asama: { not_equals: 'pasif' } }, { testFirmasi: { equals: false } }] }
      if (firmaKullanicisiMi(k)) return { or: [{ id: { equals: firmaKimligi(k) } }, herkeseAcik] }
      return herkeseAcik
    },
    create: sadeceYonetici,
    update: ({ req }) => {
      const k = kullanici(req)
      if (yoneticiMi(k)) return true
      if (firmaYetkisiVarMi(k, ['yonetici'])) return { id: { equals: firmaKimligi(k) } }
      return false
    },
    delete: sadeceYonetici,
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        // Kısmi güncellemede data yalnızca değişen alanları taşıyabilir; mevcut kayıtla birleştirilir.
        const v = { ...(originalDoc ?? {}), ...data }
        data.yayinaHazir = Boolean(v.logo && v.kisaTanitim?.trim() && v.sektor)
        data.arama = aramaMetni([v.unvan, v.kisaAd, v.konum])
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        const degisenler = ['asama', 'guvenilir'].filter((a) => operation === 'create' || previousDoc?.[a] !== doc[a])
        if (degisenler.length)
          await islemKaydet(req, {
            islem: operation === 'create' ? 'Firma kaydı açıldı' : 'Firma durumu değişti',
            tur: 'kurulum',
            kayitTuru: 'firmalar',
            kayitId: doc.id,
            ayrinti: Object.fromEntries(degisenler.map((a) => [a, { once: previousDoc?.[a], sonra: doc[a] }])),
          })
      },
    ],
  },
  fields: [
    { name: 'unvan', label: 'Unvan', type: 'text', required: true },
    { name: 'kisaAd', label: 'Kısa ad', type: 'text', required: true, admin: { description: 'Listelerde görünen ad. Örnek: Kodpit Teknoloji' } },
    { name: 'slug', label: 'Adres adı', type: 'text', required: true, unique: true, index: true },
    { name: 'konum', label: 'Teknokent’teki yeri', type: 'text', required: true, admin: { description: 'Örnek: D Blok 208' } },
    {
      name: 'sektor',
      label: 'Sektör',
      type: 'relationship',
      relationTo: 'taksonomiler',
      filterOptions: { tur: { equals: 'sektor' } },
    },
    { name: 'web', label: 'Web sitesi', type: 'text' },
    {
      name: 'logo',
      label: 'Logo',
      type: 'upload',
      relationTo: 'dosyalar',
      admin: { description: 'Logo yokken firma blok/oda kodlu karoyla gösterilir.' },
    },
    { name: 'kisaTanitim', label: 'Kısa tanıtım', type: 'textarea', maxLength: 300 },
    { name: 'uzunTanitim', label: 'Burada çalışmak nasıl?', type: 'textarea', maxLength: 4000 },
    {
      name: 'teknolojiler',
      label: 'Teknolojiler ve uzmanlıklar',
      type: 'relationship',
      relationTo: 'taksonomiler',
      hasMany: true,
      filterOptions: { tur: { equals: 'beceri' } },
    },
    {
      name: 'calismaModelleri',
      label: 'Çalışma modeli',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Ofiste', value: 'ofiste' },
        { label: 'Hibrit', value: 'hibrit' },
        { label: 'Uzaktan', value: 'uzaktan' },
      ],
    },
    { name: 'yanHaklar', label: 'Yan haklar', type: 'array', fields: [{ name: 'ad', type: 'text', required: true }] },
    { name: 'kurulusYili', label: 'Kuruluş yılı', type: 'number', min: 1950, max: 2100 },
    {
      name: 'calisanAraligi',
      label: 'Çalışan sayısı',
      type: 'select',
      options: ['1–9', '10–49', '50–99', '100–249', '250+'].map((d) => ({ label: d, value: d })),
    },
    {
      name: 'galeri',
      label: 'Fotoğraflar',
      type: 'upload',
      relationTo: 'dosyalar',
      hasMany: true,
      maxRows: 8,
    },

    /* ---------- Yönetici A.Ş.'ye ait alanlar ---------- */
    {
      type: 'collapsible',
      label: 'Yönetici A.Ş.',
      fields: [
        {
          name: 'asama',
          label: 'Kurulum aşaması',
          type: 'select',
          required: true,
          defaultValue: 'iskelet',
          options: [...KURULUM_ASAMALARI],
          access: { update: alanSadeceYonetici },
        },
        {
          name: 'guvenilir',
          label: 'Güvenilir firma',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'İşaretliyse ilanları onaya gitmeden yayınlanır (K4).' },
          access: { update: alanSadeceYonetici },
        },
        {
          name: 'onaylanmisIlanSayisi',
          label: 'Onaylanmış ilan sayısı',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true },
          access: { update: () => false },
        },
        {
          name: 'testFirmasi',
          label: 'TEST firması',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Kurum içi test için. Herkese açık sayfalarda görünmez (talimatlar 0.5).' },
          access: { update: alanSadeceYonetici },
        },
        { name: 'yetkiliAd', label: 'Yetkili ad soyad', type: 'text', access: { read: alanKurum, update: alanSadeceYonetici } },
        { name: 'yetkiliEposta', label: 'Yetkili iş e-postası', type: 'email', access: { read: alanKurum, update: alanSadeceYonetici } },
        { name: 'yetkiliTelefon', label: 'Yetkili telefonu', type: 'text', access: { read: alanKurum, update: alanSadeceYonetici } },
        {
          name: 'takipNotlari',
          label: 'Takip notları',
          type: 'array',
          access: { read: alanKurum, update: alanKurum },
          fields: [
            { name: 'not', type: 'textarea', required: true },
            { name: 'tarih', type: 'date', required: true },
          ],
        },
      ],
    },
    { name: 'yayinaHazir', type: 'checkbox', defaultValue: false, admin: { hidden: true }, access: { update: () => false } },
    { name: 'arama', type: 'text', index: true, admin: { hidden: true } },
  ],
}
