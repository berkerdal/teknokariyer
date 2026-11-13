import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import {
  adayMi,
  alanFirmaVeKurum,
  alanKimseYazamaz,
  firmaKimligi,
  firmaKullanicisiMi,
  firmaYetkisiVarMi,
  kullanici,
  kurumKullanicisiMi,
  moderasyonYapabilirMi,
} from '../erisim'
import { islemKaydet } from '../altyapi/islemKaydi'

/**
 * Başvurular (talimatlar 5, 6).
 * - Başvuru anında profilin kopyası dondurulur; aday profilini sonradan değiştirse de firma bu kopyayı görür.
 * - Aynı ilana iki kez başvurulamaz.
 * - Ekip notları ve puanı yalnızca firma ekibi ve kurum görür; aday göremez.
 * - Başvuru, adayın kendi uç noktasından (rıza kayıtlarıyla birlikte) oluşturulur (M4).
 */
export const BASVURU_DURUMLARI = [
  { label: 'Alındı', value: 'alindi' },
  { label: 'İnceleniyor', value: 'inceleniyor' },
  { label: 'Görüşme', value: 'gorusme' },
  { label: 'Teklif', value: 'teklif' },
  { label: 'Olumlu', value: 'olumlu' },
  { label: 'Olumsuz', value: 'olumsuz' },
  { label: 'Aday geri çekti', value: 'geri-cekti' },
] as const

export const Basvurular: CollectionConfig = {
  slug: 'basvurular',
  labels: { singular: 'Başvuru', plural: 'Başvurular' },
  admin: { defaultColumns: ['ilan', 'adayKodu', 'durum', 'createdAt'], group: 'İlanlar' },
  access: {
    read: ({ req }) => {
      const k = kullanici(req)
      if (kurumKullanicisiMi(k)) return true
      if (firmaKullanicisiMi(k)) return { firma: { equals: firmaKimligi(k) } }
      if (adayMi(k)) return { adayKullanici: { equals: k!.id } }
      return false
    },
    create: ({ req }) => adayMi(kullanici(req)),
    update: ({ req }) => {
      const k = kullanici(req)
      if (moderasyonYapabilirMi(k)) return true
      if (firmaYetkisiVarMi(k, ['yonetici', 'ilan-sorumlusu', 'degerlendirici'])) return { firma: { equals: firmaKimligi(k) } }
      if (adayMi(k)) return { adayKullanici: { equals: k!.id } } // yalnızca geri çekme; alan erişimleri kısıtlar
      return false
    },
    delete: () => false,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (!data || operation !== 'create') return data
        const k = kullanici(req)
        if (!adayMi(k)) return data
        data.adayKullanici = k!.id
        const ilanId = typeof data.ilan === 'object' ? data.ilan?.id : data.ilan
        const ilan = await req.payload.findByID({ collection: 'ilanlar', id: ilanId, depth: 0, overrideAccess: true, req })
        if (ilan.durum !== 'yayinda') throw new APIError('Bu ilan şu an başvuru almıyor.', 400, undefined, true)
        data.firma = typeof ilan.firma === 'object' ? (ilan.firma as { id: number }).id : ilan.firma
        const onceki = await req.payload.count({
          collection: 'basvurular',
          where: { and: [{ ilan: { equals: ilanId } }, { adayKullanici: { equals: k!.id } }] },
          overrideAccess: true,
          req,
        })
        if (onceki.totalDocs > 0) throw new APIError('Bu ilana daha önce başvurdun.', 400, undefined, true)
        data.durum = 'alindi'
        return data
      },
    ],
    beforeChange: [
      ({ data, originalDoc, req, operation }) => {
        const k = kullanici(req)
        // Aday yalnızca başvurusunu geri çekebilir.
        if (operation === 'update' && adayMi(k)) {
          if (data.durum && data.durum !== 'geri-cekti')
            throw new APIError('Başvurunun durumunu yalnızca firma değiştirebilir.', 403, undefined, true)
          if (originalDoc && !['alindi', 'inceleniyor'].includes(originalDoc.durum))
            throw new APIError('Bu aşamadaki başvuru geri çekilemez.', 400, undefined, true)
        }
        return data
      },
    ],
    afterRead: [
      ({ doc, req }) => {
        // Aday ekip notlarını, puanı ve etiketleri hiçbir koşulda görmez (alan erişimine ek güvence).
        if (adayMi(kullanici(req))) {
          delete doc.ekipNotlari
          delete doc.puan
          delete doc.etiketler
        }
        return doc
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        if (operation === 'update' && previousDoc?.durum !== doc.durum)
          await islemKaydet(req, {
            islem: 'Başvuru durumu değişti',
            tur: 'basvuru',
            kayitTuru: 'basvurular',
            kayitId: doc.id,
            ayrinti: { once: previousDoc?.durum, sonra: doc.durum },
          })
      },
    ],
  },
  fields: [
    { name: 'ilan', type: 'relationship', relationTo: 'ilanlar', required: true, index: true, access: { update: alanKimseYazamaz } },
    { name: 'firma', type: 'relationship', relationTo: 'firmalar', index: true, access: { update: alanKimseYazamaz } },
    { name: 'adayKullanici', type: 'relationship', relationTo: 'kullanicilar', index: true, access: { update: alanKimseYazamaz } },
    { name: 'adayKodu', type: 'text', access: { update: alanKimseYazamaz } },
    {
      name: 'profilKopyasi',
      label: 'Başvuru anındaki profil',
      type: 'json',
      required: true,
      access: { update: alanKimseYazamaz },
    },
    { name: 'cv', label: 'Gönderilen CV', type: 'upload', relationTo: 'dosyalar', access: { update: alanKimseYazamaz } },
    { name: 'onYazi', label: 'Ön yazı', type: 'textarea', maxLength: 1500, access: { update: alanKimseYazamaz } },
    { name: 'cevaplar', label: 'Ön eleme cevapları', type: 'json', access: { update: alanKimseYazamaz } },
    { name: 'eleyiciUyari', label: 'Eleyici soruya beklenmeyen cevap', type: 'checkbox', defaultValue: false, access: { update: alanKimseYazamaz } },
    {
      name: 'kaynak',
      type: 'select',
      defaultValue: 'portal',
      access: { update: alanKimseYazamaz },
      options: [
        { label: 'Portal araması', value: 'portal' },
        { label: 'LinkedIn', value: 'linkedin' },
        { label: 'Google', value: 'google' },
        { label: 'Doğrudan bağlantı', value: 'dogrudan' },
      ],
    },
    {
      name: 'durum',
      label: 'Durum',
      type: 'select',
      required: true,
      defaultValue: 'alindi',
      index: true,
      options: [...BASVURU_DURUMLARI],
      // Değerlendirici durum değiştiremez (yetki tablosu); aday yalnızca geri çekebilir (kanca denetler).
      access: {
        update: ({ req }) => {
          const k = kullanici(req)
          return moderasyonYapabilirMi(k) || adayMi(k) || firmaYetkisiVarMi(k, ['yonetici', 'ilan-sorumlusu'])
        },
      },
    },
    { name: 'puan', label: 'Puan (yalnızca ekip)', type: 'number', min: 1, max: 5, access: { read: alanFirmaVeKurum, update: alanFirmaVeKurum } },
    {
      name: 'etiketler',
      label: 'Etiketler (yalnızca ekip)',
      type: 'array',
      access: { read: alanFirmaVeKurum, update: alanFirmaVeKurum },
      fields: [{ name: 'ad', type: 'text', required: true }],
    },
    {
      name: 'ekipNotlari',
      label: 'Ekip notları (yalnızca ekip)',
      type: 'array',
      access: { read: alanFirmaVeKurum, update: alanFirmaVeKurum },
      fields: [
        { name: 'not', type: 'textarea', required: true },
        { name: 'yazan', type: 'relationship', relationTo: 'kullanicilar' },
      ],
    },
    { name: 'aydinlatmaSurumu', label: 'Onaylanan aydınlatma metni sürümü', type: 'text', required: true, access: { update: alanKimseYazamaz } },
  ],
}
