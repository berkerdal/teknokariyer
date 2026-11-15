import type { CollectionConfig } from 'payload'
import { hicKimse, kurumVeyaSahibi } from '../erisim'

/**
 * Adayın kaydettiği ilanlar (talimatlar 5: “Kaydetme ve hatırlatma”; kullanıcı isteği 15.11.2026).
 * - Yazma yalnızca servis üzerinden (src/servisler/kaydedilenler.ts); aday kendi kayıtlarını okur.
 * - Son başvuruya 2 gün kala bir kez hatırlatma e-postası gider (`hatirlatildi`).
 * - Hesap silmede silinir; veri dökümüne girer. Firmalar kimin kaydettiğini görmez.
 */
export const KaydedilenIlanlar: CollectionConfig = {
  slug: 'kaydedilen-ilanlar',
  labels: { singular: 'Kaydedilen ilan', plural: 'Kaydedilen ilanlar' },
  admin: { group: 'Adaylar', defaultColumns: ['kullanici', 'ilan', 'createdAt'] },
  access: { read: kurumVeyaSahibi('kullanici'), create: hicKimse, update: hicKimse, delete: hicKimse },
  indexes: [{ fields: ['kullanici', 'ilan'], unique: true }],
  fields: [
    { name: 'kullanici', type: 'relationship', relationTo: 'kullanicilar', required: true, index: true },
    { name: 'ilan', type: 'relationship', relationTo: 'ilanlar', required: true, index: true },
    { name: 'hatirlatildi', type: 'date', admin: { description: 'Son başvuru hatırlatması gönderildiği an.' } },
  ],
}
