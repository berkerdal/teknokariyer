import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { adayMi, firmaKimligi, firmaKullanicisiMi, kullanici, kurumKullanicisiMi, moderasyonYapabilirMi, alanModerasyon, alanKimseYazamaz } from '../erisim'
import { normallestir } from '../alan/metin'
import { islemKaydet } from '../altyapi/islemKaydi'
import { TAKSONOMI_TURLERI } from './Taksonomiler'

/**
 * Talepler: firmaların ve adayların Yönetici A.Ş.’den istekleri (14.11.2026 geri bildirimi).
 * Şimdilik tek tür: listede olmayan bir taksonomi öğesinin (beceri, pozisyon ailesi, bölüm, dil…) eklenmesi.
 *
 * - Talep eden kişi ve firması oturumdan otomatik bağlanır; kullanıcıya iletişim bilgisi yeniden sorulmaz.
 * - Yönetici A.Ş. talebi onaylayınca (durum “onaylandı” veya “kısmen”) kabul edilen öğeler taksonomiye kendiliğinden
 *   eklenir; aynı adda kayıt varsa yenisi açılmaz. Bu kural koleksiyon kancasındadır: Payload yönetim ekranından da,
 *   ileride yazılacak Yönetici A.Ş. panelinden de aynı şekilde çalışır.
 */
export const TALEP_DURUMLARI = [
  { label: 'Bekliyor', value: 'bekliyor' },
  { label: 'Onaylandı', value: 'onaylandi' },
  { label: 'Kısmen onaylandı', value: 'kismen' },
  { label: 'Reddedildi', value: 'reddedildi' },
] as const

export const Talepler: CollectionConfig = {
  slug: 'talepler',
  labels: { singular: 'Talep', plural: 'Talepler' },
  admin: {
    useAsTitle: 'ozet',
    defaultColumns: ['ozet', 'taksonomiTuru', 'talepEden', 'firma', 'durum', 'createdAt'],
    group: 'Ayarlar',
    description:
      'Firmaların ve adayların listede bulamadığı beceri, pozisyon ailesi, bölüm veya dil için gönderdiği istekler. Onaylanan öğeler listeye kendiliğinden eklenir.',
  },
  access: {
    read: ({ req }) => {
      const k = kullanici(req)
      if (kurumKullanicisiMi(k)) return true
      if (!k) return false
      return { talepEden: { equals: k.id } }
    },
    create: ({ req }) => {
      const k = kullanici(req)
      return firmaKullanicisiMi(k) || adayMi(k) || moderasyonYapabilirMi(k)
    },
    update: ({ req }) => moderasyonYapabilirMi(kullanici(req)),
    delete: () => false,
  },
  hooks: {
    beforeValidate: [
      ({ data, req, operation }) => {
        if (!data || operation !== 'create') return data
        const k = kullanici(req)
        if (k) {
          data.talepEden = k.id
          data.firma = firmaKullanicisiMi(k) ? firmaKimligi(k) : null
        }
        data.durum = 'bekliyor'
        return data
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, req, operation }) => {
        const v = { ...(originalDoc ?? {}), ...data }
        const adlar = ((v.oneriler ?? []) as Array<{ ad?: string }>).map((o) => o.ad?.trim()).filter(Boolean)
        data.ozet = adlar.join(', ').slice(0, 200)
        if (operation !== 'update' || originalDoc?.durum !== 'bekliyor' || !['onaylandi', 'kismen'].includes(data.durum)) return data
        // Onay: kabul edilen öğeler taksonomiye eklenir (varsa mevcut kayıt kullanılır).
        const kabul = ((v.oneriler ?? []) as Array<{ ad?: string; kabul?: boolean }>).filter((o) => o.ad?.trim() && o.kabul !== false)
        if (!kabul.length) throw new APIError('Onaylamak için en az bir öğeyi kabul edin; hiçbirini kabul etmiyorsanız talebi reddedin.', 400, undefined, true)
        const { docs } = await req.payload.find({ collection: 'taksonomiler', where: { tur: { equals: v.taksonomiTuru } }, limit: 10000, pagination: false, depth: 0, overrideAccess: true, req, select: { ad: true } })
        const eklenenler: number[] = []
        for (const o of kabul) {
          const ad = o.ad!.trim()
          const var_ = docs.find((d) => normallestir(d.ad) === normallestir(ad))
          eklenenler.push(var_ ? var_.id : (await req.payload.create({ collection: 'taksonomiler', data: { tur: v.taksonomiTuru, ad } as never, overrideAccess: true, req })).id)
        }
        data.eklenenler = eklenenler
        data.sonucTarihi = new Date().toISOString()
        data.sonuclandiran = kullanici(req)?.id ?? null
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        if (operation === 'update' && previousDoc?.durum !== doc.durum)
          await islemKaydet(req, {
            islem: `Talep sonuçlandı: ${TALEP_DURUMLARI.find((d) => d.value === doc.durum)?.label ?? doc.durum}`,
            tur: 'moderasyon',
            kayitTuru: 'talepler',
            kayitId: doc.id,
            ayrinti: { ozet: doc.ozet },
          })
      },
    ],
  },
  fields: [
    { name: 'ozet', label: 'İstenenler', type: 'text', admin: { readOnly: true } },
    {
      name: 'taksonomiTuru',
      label: 'Hangi liste?',
      type: 'select',
      required: true,
      options: [...TAKSONOMI_TURLERI],
      access: { update: alanKimseYazamaz },
    },
    {
      name: 'oneriler',
      label: 'Eklenmesi istenenler',
      type: 'array',
      minRows: 1,
      maxRows: 10,
      admin: { description: 'Yazımı düzeltebilirsiniz. Eklemek istemediğiniz öğenin “Kabul” işaretini kaldırın.' },
      fields: [
        { name: 'ad', label: 'Ad', type: 'text', required: true, maxLength: 80 },
        { name: 'kabul', label: 'Kabul', type: 'checkbox', defaultValue: true, access: { create: alanModerasyon, update: alanModerasyon } },
      ],
    },
    { name: 'aciklama', label: 'Talep edenin açıklaması', type: 'textarea', maxLength: 500, access: { update: alanKimseYazamaz } },
    { name: 'kaynak', label: 'Nereden istendi?', type: 'text', admin: { readOnly: true }, access: { update: alanKimseYazamaz } },
    { name: 'talepEden', label: 'Talep eden', type: 'relationship', relationTo: 'kullanicilar', admin: { readOnly: true }, access: { update: alanKimseYazamaz } },
    { name: 'firma', label: 'Firma', type: 'relationship', relationTo: 'firmalar', admin: { readOnly: true }, access: { update: alanKimseYazamaz } },
    {
      name: 'durum',
      label: 'Durum',
      type: 'select',
      required: true,
      defaultValue: 'bekliyor',
      index: true,
      options: [...TALEP_DURUMLARI],
      access: { update: alanModerasyon },
      admin: { position: 'sidebar' },
    },
    {
      name: 'sonucNotu',
      label: 'Talep edene not',
      type: 'textarea',
      maxLength: 500,
      access: { update: alanModerasyon },
      admin: { position: 'sidebar', description: 'Reddederken nedenini yazın; talep eden bu notu görür.' },
    },
    { name: 'eklenenler', label: 'Listeye eklenenler', type: 'relationship', relationTo: 'taksonomiler', hasMany: true, admin: { readOnly: true, position: 'sidebar' }, access: { update: alanModerasyon } },
    { name: 'sonuclandiran', type: 'relationship', relationTo: 'kullanicilar', admin: { readOnly: true, position: 'sidebar' }, access: { update: alanModerasyon } },
    { name: 'sonucTarihi', type: 'date', admin: { readOnly: true, position: 'sidebar' }, access: { update: alanModerasyon } },
  ],
}
