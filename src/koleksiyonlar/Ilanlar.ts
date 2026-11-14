import type { CollectionConfig, PayloadRequest, Where } from 'payload'
import { APIError } from 'payload'
import {
  firmaKimligi,
  firmaKullanicisiMi,
  firmaYetkisiVarMi,
  kullanici,
  kurumKullanicisiMi,
  moderasyonYapabilirMi,
  alanModerasyon,
  sistemIslemiMi,
} from '../erisim'
import { aramaMetni } from '../alan/metin'
import { DURUM_ADI, ILAN_DURUMLARI, ilanEksikleri, sonBasvuruTarihiHatasi, VARSAYILAN_EN_UZUN_SURE_GUN } from '../alan/ilan'
import { CEFR, DENEYIM_ADI, DENEYIM_SIRASI } from '../alan/eslesme'
import { islemKaydet } from '../altyapi/islemKaydi'

/**
 * İlanlar (talimatlar 4, 0.1; K1, K4).
 *
 * - Durum alanını firma doğrudan değiştiremez. Yayına gönderme, duraklatma, kapatma gibi işlemler alan/ilan.ts
 *   kurallarına göre çalışan ayrı uçlardan yapılır (M4). Burada yalnızca moderasyon durum değiştirebilir.
 * - Her kayıt bir sürüm oluşturur (sürüm geçmişi, CLAUDE.md 5).
 * - Taslak eksik kaydedilebilir (yalnızca pozisyon adı zorunlu); taslak dışındaki durumlarda `ilanEksikleri` boş olmalıdır.
 * - Herkese açık okuma yalnızca yayındaki, duraklatılmış ve kapanmış ilanlar içindir; kapanmış ilan 410 sayfasında
 *   kullanılır. Taslak ve onaydaki ilanları yalnızca firması ve kurum görür.
 */
const FIRMA_ILAN_YETKISI = ['yonetici', 'ilan-sorumlusu'] as const

const kimlik = (x: unknown) => (x && typeof x === 'object' ? (x as { id: string | number }).id : x) as string | number

/** Aranabilir metin: pozisyon, firma adı, pozisyon ailesi ve beceri adları (eş anlamlılarıyla). */
async function ilanAramaMetni(req: PayloadRequest, v: Record<string, unknown>): Promise<string> {
  const taksonomiIdleri = [v.aile, ...((v.zorunluBeceriler as unknown[]) ?? []), ...((v.tercihBeceriler as unknown[]) ?? [])]
    .filter(Boolean)
    .map(kimlik)
  const [firma, taksonomi] = await Promise.all([
    v.firma ? req.payload.findByID({ collection: 'firmalar', id: kimlik(v.firma), depth: 0, overrideAccess: true, req }) : null,
    taksonomiIdleri.length
      ? req.payload.find({ collection: 'taksonomiler', where: { id: { in: taksonomiIdleri } }, depth: 0, limit: 100, overrideAccess: true, req })
      : null,
  ])
  return aramaMetni([
    v.pozisyonAdi as string,
    firma?.kisaAd,
    firma?.unvan,
    ...(taksonomi?.docs ?? []).flatMap((t) => [t.ad, ...(t.esAnlamlilar ?? []).map((e) => e.ad)]),
  ])
}

const herkeseAcikDurumlar: Where = { durum: { in: ['yayinda', 'duraklatildi', 'suresi-doldu', 'kapandi'] } }

export const Ilanlar: CollectionConfig = {
  slug: 'ilanlar',
  labels: { singular: 'İlan', plural: 'İlanlar' },
  admin: { useAsTitle: 'pozisyonAdi', defaultColumns: ['pozisyonAdi', 'firma', 'durum', 'sonBasvuru'], group: 'İlanlar' },
  versions: { maxPerDoc: 50, drafts: false },
  access: {
    read: ({ req }) => {
      const k = kullanici(req)
      if (kurumKullanicisiMi(k)) return true
      if (firmaKullanicisiMi(k)) return { or: [{ firma: { equals: firmaKimligi(k) } }, herkeseAcikDurumlar] }
      return herkeseAcikDurumlar
    },
    create: ({ req }) => moderasyonYapabilirMi(kullanici(req)) || firmaYetkisiVarMi(kullanici(req), [...FIRMA_ILAN_YETKISI]),
    update: ({ req }) => {
      const k = kullanici(req)
      if (moderasyonYapabilirMi(k)) return true
      if (firmaYetkisiVarMi(k, [...FIRMA_ILAN_YETKISI])) return { firma: { equals: firmaKimligi(k) } }
      return false
    },
    // Yalnızca hiç yayınlanmamış taslak silinir; diğerleri kayıt için kalır.
    delete: ({ req }) => {
      const k = kullanici(req)
      if (moderasyonYapabilirMi(k)) return true
      if (firmaYetkisiVarMi(k, [...FIRMA_ILAN_YETKISI]))
        return { and: [{ firma: { equals: firmaKimligi(k) } }, { durum: { equals: 'taslak' } }] }
      return false
    },
  },
  hooks: {
    beforeValidate: [
      ({ data, req, operation }) => {
        if (!data) return data
        const k = kullanici(req)
        // Firma kullanıcısı başka bir firma adına ilan açamaz (kiracı ayrımı).
        if (firmaKullanicisiMi(k)) data.firma = firmaKimligi(k)
        // Firma yeni ilanı her zaman taslak olarak açar; yayına alma ayrı uçtan, onay kuralıyla yapılır.
        if (operation === 'create' && !moderasyonYapabilirMi(k) && !sistemIslemiMi(req)) data.durum = 'taslak'
        return data
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const v = { ...(originalDoc ?? {}), ...data }
        if (data.sonBasvuru && (!originalDoc || data.sonBasvuru !== originalDoc.sonBasvuru)) {
          const hata = sonBasvuruTarihiHatasi(new Date(data.sonBasvuru), new Date())
          if (hata === 'gecmis') throw new APIError('Son başvuru tarihi yarın veya daha sonrası olmalı.', 400, undefined, true)
          if (hata === 'cok-uzak')
            throw new APIError(`Son başvuru tarihi en fazla ${VARSAYILAN_EN_UZUN_SURE_GUN} gün sonrası olabilir.`, 400, undefined, true)
        }
        if (v.ucretEnAz && v.ucretEnCok && v.ucretEnAz > v.ucretEnCok)
          throw new APIError('Ücretin en az değeri en çok değerinden büyük olamaz.', 400, undefined, true)
        // Taslak eksik kaydedilebilir; taslak dışındaki her durumda ilan tam olmalıdır (servisler alan alan mesaj verir).
        if (v.durum && v.durum !== 'taslak') {
          const eksik = ilanEksikleri(v)
          if (Object.keys(eksik).length) throw new APIError(`İlan yayına hazır değil: ${Object.values(eksik).join(' ')}`, 400, undefined, true)
        }
        data.arama = await ilanAramaMetni(req, v)
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        if (operation === 'create' || previousDoc?.durum !== doc.durum)
          await islemKaydet(req, {
            islem: operation === 'create' ? 'İlan oluşturuldu' : `İlan durumu: ${DURUM_ADI[doc.durum as keyof typeof DURUM_ADI]}`,
            tur: moderasyonYapabilirMi(kullanici(req)) ? 'moderasyon' : 'ilan',
            kayitTuru: 'ilanlar',
            kayitId: doc.id,
            ayrinti: { once: previousDoc?.durum, sonra: doc.durum },
          })
      },
    ],
  },
  fields: [
    { name: 'firma', label: 'Firma', type: 'relationship', relationTo: 'firmalar', required: true, index: true },
    { name: 'pozisyonAdi', label: 'Pozisyon adı', type: 'text', required: true, maxLength: 120 },
    {
      name: 'tur',
      label: 'İlan türü',
      type: 'select',
      required: false,
      options: [
        { label: 'İş', value: 'is' },
        { label: 'Staj', value: 'staj' },
      ],
    },
    {
      name: 'altTur',
      label: 'Çalışma şekli / staj türü',
      type: 'select',
      required: false,
      options: [
        { label: 'Tam zamanlı', value: 'tam-zamanli' },
        { label: 'Yarı zamanlı', value: 'yari-zamanli' },
        { label: 'Proje bazlı / sözleşmeli', value: 'proje' },
        { label: 'Zorunlu staj', value: 'zorunlu-staj' },
        { label: 'Gönüllü staj', value: 'gonullu-staj' },
        { label: 'Uzun dönem staj', value: 'uzun-donem-staj' },
        { label: 'Yaz stajı', value: 'yaz-staji' },
      ],
    },
    {
      name: 'aile',
      label: 'Pozisyon ailesi',
      type: 'relationship',
      relationTo: 'taksonomiler',
      required: false,
      filterOptions: { tur: { equals: 'pozisyon-ailesi' } },
    },
    {
      name: 'model',
      label: 'Çalışma modeli',
      type: 'select',
      required: false,
      options: [
        { label: 'Ofiste', value: 'ofiste' },
        { label: 'Hibrit', value: 'hibrit' },
        { label: 'Uzaktan', value: 'uzaktan' },
      ],
    },
    { name: 'konum', label: 'Konum', type: 'text', required: true, defaultValue: 'Pamukkale Teknokent' },
    {
      name: 'deneyim',
      label: 'Deneyim',
      type: 'select',
      required: false,
      options: DENEYIM_SIRASI.map((d) => ({ label: DENEYIM_ADI[d], value: d })),
    },
    {
      name: 'egitim',
      label: 'Eğitim düzeyi',
      type: 'select',
      required: false,
      options: [
        { label: 'Lise', value: 'lise' },
        { label: 'Önlisans', value: 'onlisans' },
        { label: 'Lisans', value: 'lisans' },
        { label: 'Yüksek lisans', value: 'yuksek-lisans' },
        { label: 'Doktora', value: 'doktora' },
      ],
    },
    {
      name: 'bolumler',
      label: 'Tercih edilen bölümler',
      type: 'relationship',
      relationTo: 'taksonomiler',
      hasMany: true,
      filterOptions: { tur: { equals: 'bolum' } },
    },
    {
      name: 'zorunluBeceriler',
      label: 'Zorunlu beceriler',
      type: 'relationship',
      relationTo: 'taksonomiler',
      hasMany: true,
      filterOptions: { tur: { equals: 'beceri' } },
    },
    {
      name: 'tercihBeceriler',
      label: 'Tercih sebebi beceriler',
      type: 'relationship',
      relationTo: 'taksonomiler',
      hasMany: true,
      filterOptions: { tur: { equals: 'beceri' } },
    },
    {
      name: 'diller',
      label: 'Dil şartları',
      type: 'array',
      fields: [
        { name: 'dil', type: 'relationship', relationTo: 'taksonomiler', required: true, filterOptions: { tur: { equals: 'dil' } } },
        { name: 'seviye', type: 'select', required: true, options: CEFR.map((c) => ({ label: c, value: c })) },
      ],
    },
    { name: 'pozisyonSayisi', label: 'Pozisyon sayısı', type: 'number', min: 1, defaultValue: 1 },
    { name: 'sonBasvuru', label: 'Son başvuru tarihi', type: 'date', required: false, index: true },
    { name: 'baslangic', label: 'Başlangıç tarihi', type: 'date' },
    { name: 'ucretEnAz', label: 'Ücret, en az (₺, net/ay)', type: 'number', min: 0 },
    { name: 'ucretEnCok', label: 'Ücret, en çok (₺, net/ay)', type: 'number', min: 0 },
    {
      name: 'ucretGorunur',
      label: 'Ücret ilanda görünsün',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Gizli kalsa da eşleştirmede adayın beklentisiyle karşılaştırılır.' },
    },
    { name: 'yanHaklar', label: 'Yan haklar', type: 'array', fields: [{ name: 'ad', type: 'text', required: true }] },
    { name: 'isTanimi', label: 'İş tanımı', type: 'textarea', required: false, maxLength: 5000 },
    { name: 'nitelikler', label: 'Aranan nitelikler', type: 'textarea', required: false, maxLength: 5000 },
    { name: 'sartname', label: 'Şartname veya ek belge (PDF)', type: 'upload', relationTo: 'dosyalar' },
    {
      name: 'onElemeSorulari',
      label: 'Ön eleme soruları',
      type: 'array',
      maxRows: 5,
      fields: [
        { name: 'soru', type: 'text', required: true, maxLength: 300 },
        {
          name: 'tip',
          type: 'select',
          required: true,
          defaultValue: 'kisa',
          options: [
            { label: 'Kısa cevap', value: 'kisa' },
            { label: 'Evet / Hayır', value: 'evet-hayir' },
            { label: 'Çoktan seçmeli', value: 'secmeli' },
          ],
        },
        { name: 'secenekler', type: 'array', fields: [{ name: 'ad', type: 'text', required: true }] },
        { name: 'eleyici', label: 'Eleyici', type: 'checkbox', defaultValue: false },
        { name: 'beklenenCevap', label: 'Eleyici sorunun beklenen cevabı', type: 'text' },
      ],
    },
    { name: 'linkedinMetni', label: 'LinkedIn metni', type: 'textarea', maxLength: 700 },
    {
      name: 'dil',
      label: 'İlanın dili',
      type: 'select',
      required: true,
      defaultValue: 'tr',
      options: [
        { label: 'Türkçe', value: 'tr' },
        { label: 'İngilizce', value: 'en' },
        { label: 'Her ikisi', value: 'ikisi' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Staj bilgileri',
      admin: { condition: (veri) => veri?.tur === 'staj' },
      fields: [
        { name: 'stajDonemi', label: 'Staj dönemi', type: 'text' },
        { name: 'ucretliStaj', label: 'Ücretli', type: 'checkbox', defaultValue: false },
        {
          name: 'sgk',
          label: 'SGK’yı kim karşılıyor?',
          type: 'select',
          options: [
            { label: 'Okul', value: 'okul' },
            { label: 'Firma', value: 'firma' },
          ],
        },
        { name: 'stajBelgesi', label: 'Zorunlu staj belgesi imzalanıyor', type: 'checkbox', defaultValue: true },
        { name: 'pauOncelik', label: 'PAÜ öğrencilerine öncelik', type: 'checkbox', defaultValue: false },
      ],
    },

    /* ---------- Durum ve sistem alanları ---------- */
    {
      name: 'durum',
      label: 'Durum',
      type: 'select',
      required: true,
      defaultValue: 'taslak',
      index: true,
      options: ILAN_DURUMLARI.map((d) => ({ label: DURUM_ADI[d], value: d })),
      access: { update: alanModerasyon },
      admin: { position: 'sidebar' },
    },
    { name: 'duzeltmeGerekcesi', label: 'Düzeltme gerekçesi', type: 'textarea', access: { update: alanModerasyon }, admin: { position: 'sidebar' } },
    {
      name: 'kapanisNedeni',
      label: 'Kapanış nedeni',
      type: 'select',
      options: [
        { label: 'Pozisyon doldu', value: 'doldu' },
        { label: 'Pozisyon iptal edildi', value: 'iptal' },
        { label: 'Başka bir kanaldan aday bulundu', value: 'baska-kanal' },
        { label: 'Süresi doldu', value: 'sure' },
        { label: 'Yönetici A.Ş. yayından kaldırdı', value: 'moderasyon' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'bekleyenDegisiklik',
      label: 'Onay bekleyen değişiklik',
      type: 'json',
      access: { update: alanModerasyon },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Yayındaki ilanda pozisyon adı, ilan türü, çalışma şekli veya ücret değişince yeni değerler onaylanana kadar burada bekler.',
      },
    },
    { name: 'yayinTarihi', label: 'Yayın tarihi', type: 'date', admin: { position: 'sidebar', readOnly: true } },
    { name: 'basvuruSayisi', type: 'number', defaultValue: 0, admin: { hidden: true }, access: { update: () => false } },
    { name: 'goruntulenme', type: 'number', defaultValue: 0, admin: { hidden: true }, access: { update: () => false } },
    { name: 'arama', type: 'text', index: true, admin: { hidden: true } },
  ],
}
