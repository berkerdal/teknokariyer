import type { Access, CollectionConfig, Where } from 'payload'
import { adayMi, firmaKimligi, firmaKullanicisiMi, hicKimse, kullanici, yoneticiMi } from '../erisim'
import { GORUSME_BICIMI, GORUSME_SURELERI } from '../alan/gorusme'

/** Firma kendi firmasının görüşmelerini, aday kendi görüşmelerini, kurumdan tam yetkili hepsini okur. Yazma yalnızca servisle. */
const okuma: Access = ({ req }) => {
  const k = kullanici(req)
  if (yoneticiMi(k)) return true
  if (firmaKullanicisiMi(k)) return { firma: { equals: firmaKimligi(k) } } as Where
  if (adayMi(k)) return { adayKullanici: { equals: k!.id } } as Where
  return false
}

/**
 * Görüşme davetleri (kurallar src/alan/gorusme.ts, servis src/servisler/gorusme.ts).
 * Bir başvuruda aynı anda tek süren görüşme olur; tarih değişikliği aynı kayıtta yapılır.
 * `takvimNo` her kesinleşmede artar ve takvim dosyasının UID'sine girer; iptal aynı UID ile gönderilir.
 */
export const Gorusmeler: CollectionConfig = {
  slug: 'gorusmeler',
  labels: { singular: 'Görüşme', plural: 'Görüşmeler' },
  admin: { group: 'Başvurular', defaultColumns: ['basvuru', 'durum', 'secilen', 'createdAt'] },
  access: { read: okuma, create: hicKimse, update: hicKimse, delete: hicKimse },
  fields: [
    { name: 'basvuru', type: 'relationship', relationTo: 'basvurular', required: true, index: true },
    { name: 'firma', type: 'relationship', relationTo: 'firmalar', required: true, index: true },
    { name: 'ilan', type: 'relationship', relationTo: 'ilanlar', required: true },
    { name: 'adayKullanici', type: 'relationship', relationTo: 'kullanicilar', index: true },
    { name: 'secenekler', type: 'array', minRows: 1, maxRows: 3, fields: [{ name: 'baslangic', type: 'date', required: true }] },
    { name: 'sure', type: 'number', required: true, admin: { description: `Dakika: ${GORUSME_SURELERI.join(', ')}` } },
    { name: 'bicim', type: 'select', required: true, options: Object.entries(GORUSME_BICIMI).map(([value, b]) => ({ value, label: b.ad })) },
    { name: 'yer', type: 'text', maxLength: 300 },
    { name: 'not', type: 'textarea', maxLength: 1000 },
    {
      name: 'durum',
      type: 'select',
      required: true,
      defaultValue: 'bekliyor',
      index: true,
      options: [
        { value: 'bekliyor', label: 'Adayın tarih seçmesi bekleniyor' },
        { value: 'onaylandi', label: 'Tarih kesinleşti' },
        { value: 'yeni-tarih', label: 'Aday başka tarih istedi' },
        { value: 'iptal', label: 'İptal edildi' },
      ],
    },
    { name: 'secilen', type: 'date' },
    { name: 'adayNotu', type: 'textarea', maxLength: 500, admin: { description: 'Adayın başka tarih isterken yazdığı not.' } },
    { name: 'iptalNedeni', type: 'textarea', maxLength: 500 },
    { name: 'takvimNo', type: 'number', defaultValue: 0 },
    { name: 'olusturan', type: 'relationship', relationTo: 'kullanicilar' },
  ],
}
