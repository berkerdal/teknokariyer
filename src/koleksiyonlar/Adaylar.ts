import type { CollectionConfig } from 'payload'
import { kullanici, kurumKullanicisiMi, kurumVeyaSahibi, yoneticiMi, alanKurum } from '../erisim'
import { CEFR, DENEYIM_ADI, DENEYIM_SIRASI } from '../alan/eslesme'
import { CINSIYET_ADI, GORUNURLUK_ADI } from '../alan/havuz'

/**
 * Aday profilleri (talimatlar 5, 7; K5, K24, K25).
 *
 * Firmalar bu koleksiyonu doğrudan okuyamaz. Havuz araması anonim özet döndüren, profil açılışını da kaydeden
 * ayrı uçlardan yapılır (M4). Başvurularda firma, başvuru anındaki profil kopyasını görür.
 */
export const Adaylar: CollectionConfig = {
  slug: 'adaylar',
  labels: { singular: 'Aday profili', plural: 'Aday profilleri' },
  admin: { useAsTitle: 'kod', defaultColumns: ['kod', 'bolum', 'havuzGorunurlugu'], group: 'Adaylar' },
  access: {
    read: kurumVeyaSahibi('kullanici'),
    create: ({ req }) => Boolean(kullanici(req)),
    update: ({ req }) => {
      const k = kullanici(req)
      if (yoneticiMi(k)) return true
      return k ? { kullanici: { equals: k.id } } : false
    },
    delete: ({ req }) => yoneticiMi(kullanici(req)),
  },
  hooks: {
    beforeValidate: [
      ({ data, req, operation }) => {
        const k = kullanici(req)
        // Aday yalnızca kendi profilini oluşturur.
        if (data && operation === 'create' && k && !kurumKullanicisiMi(k)) data.kullanici = k.id
        return data
      },
    ],
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && !data.kod) {
          const { totalDocs } = await req.payload.count({ collection: 'adaylar', overrideAccess: true, req })
          data.kod = `A-${String(1000 + totalDocs + 1).padStart(4, '0')}`
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'kullanici', type: 'relationship', relationTo: 'kullanicilar', required: true, unique: true, index: true, access: { update: alanKurum } },
    { name: 'kod', label: 'Aday kodu', type: 'text', unique: true, index: true, admin: { readOnly: true, description: 'Havuz listesinde adın yerine görünür.' } },
    { name: 'telefon', label: 'Telefon', type: 'text' },
    {
      name: 'cinsiyet',
      label: 'Cinsiyet',
      type: 'select',
      admin: { description: 'İsteğe bağlı. Havuzda görünür ama arama, filtre, sıralama ve eşleştirmede kullanılmaz (K25).' },
      options: Object.entries(CINSIYET_ADI).map(([value, label]) => ({ value, label })),
    },
    { name: 'tanitim', label: 'Kısa tanıtım', type: 'textarea', maxLength: 500 },
    { name: 'okul', label: 'Okul', type: 'relationship', relationTo: 'taksonomiler', filterOptions: { tur: { equals: 'universite' } } },
    { name: 'bolum', label: 'Bölüm', type: 'relationship', relationTo: 'taksonomiler', filterOptions: { tur: { equals: 'bolum' } } },
    { name: 'sinif', label: 'Sınıf', type: 'text' },
    { name: 'mezuniyet', label: 'Mezuniyet tarihi', type: 'date' },
    { name: 'gano', label: 'GANO', type: 'number', min: 0, max: 4 },
    {
      name: 'deneyimSeviyesi',
      label: 'Deneyim',
      type: 'select',
      options: DENEYIM_SIRASI.map((d) => ({ label: DENEYIM_ADI[d], value: d })),
    },
    {
      name: 'deneyimler',
      label: 'Deneyimler',
      type: 'array',
      fields: [
        { name: 'kurum', type: 'text', required: true },
        { name: 'pozisyon', type: 'text', required: true },
        { name: 'baslangic', type: 'date' },
        { name: 'bitis', type: 'date' },
        { name: 'aciklama', type: 'textarea', maxLength: 1000 },
      ],
    },
    {
      name: 'beceriler',
      label: 'Beceriler',
      type: 'array',
      fields: [
        { name: 'beceri', type: 'relationship', relationTo: 'taksonomiler', required: true, filterOptions: { tur: { equals: 'beceri' } } },
        {
          name: 'seviye',
          type: 'select',
          defaultValue: 'orta',
          options: [
            { label: 'Başlangıç', value: 'baslangic' },
            { label: 'Orta', value: 'orta' },
            { label: 'İyi', value: 'iyi' },
            { label: 'Uzman', value: 'uzman' },
          ],
        },
      ],
    },
    {
      name: 'diller',
      label: 'Diller',
      type: 'array',
      fields: [
        { name: 'dil', type: 'relationship', relationTo: 'taksonomiler', required: true, filterOptions: { tur: { equals: 'dil' } } },
        { name: 'seviye', type: 'select', required: true, options: CEFR.map((c) => ({ label: c, value: c })) },
      ],
    },
    { name: 'sertifikalar', label: 'Sertifikalar', type: 'array', fields: [{ name: 'ad', type: 'text', required: true }, { name: 'kurum', type: 'text' }, { name: 'yil', type: 'number' }] },
    { name: 'baglantilar', label: 'Projeler ve bağlantılar', type: 'array', fields: [{ name: 'ad', type: 'text', required: true }, { name: 'adres', type: 'text', required: true }] },
    {
      type: 'group',
      name: 'tercihler',
      label: 'Tercihler',
      fields: [
        { name: 'turler', type: 'select', hasMany: true, options: [{ label: 'İş', value: 'is' }, { label: 'Staj', value: 'staj' }] },
        { name: 'modeller', type: 'select', hasMany: true, options: [{ label: 'Ofiste', value: 'ofiste' }, { label: 'Hibrit', value: 'hibrit' }, { label: 'Uzaktan', value: 'uzaktan' }] },
        { name: 'baslama', type: 'text' },
        { name: 'sehir', type: 'text' },
        { name: 'tasinmayaAcik', type: 'checkbox', defaultValue: false },
        { name: 'ucretBeklentisi', type: 'number', min: 0, admin: { description: 'Yalnızca CV havuzunda eşleştirme için; firmaya gösterilmez.' } },
      ],
    },
    { name: 'askerlik', label: 'Askerlik durumu', type: 'text', admin: { description: 'İsteğe bağlı; yalnızca aday girerse.' } },
    {
      name: 'ozelNitelikli',
      label: 'Engellilik durumu ve uyarlama ihtiyacı',
      type: 'textarea',
      admin: { description: 'Özel nitelikli kişisel veri. Ayrı açık rıza olmadan kaydedilmez (talimatlar 5).' },
    },
    {
      name: 'cvler',
      label: 'CV’ler',
      type: 'array',
      maxRows: 3,
      fields: [
        { name: 'ad', type: 'text', required: true },
        { name: 'dosya', type: 'upload', relationTo: 'dosyalar', required: true },
      ],
    },
    {
      type: 'group',
      name: 'havuz',
      label: 'CV havuzu',
      fields: [
        {
          name: 'gorunurluk',
          label: 'Görünürlük',
          type: 'select',
          defaultValue: 'gizli',
          options: Object.entries(GORUNURLUK_ADI).map(([value, label]) => ({ value, label })),
        },
        { name: 'rizaTarihi', label: 'Açık rıza tarihi', type: 'date', access: { update: () => false } },
        { name: 'gizlenenFirmalar', label: 'Gizlenen firmalar', type: 'relationship', relationTo: 'firmalar', hasMany: true },
      ],
    },
  ],
}
