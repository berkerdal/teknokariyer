import type { CollectionConfig } from 'payload'
import { hicKimse, kurumVeyaSahibi } from '../erisim'

/**
 * Kayıtlı aramalar (src/alan/kayitliArama.ts).
 * - Aday: ilan araması (`tur: ilan`), anlık veya haftalık e-posta.
 * - Firma kullanıcısı: CV havuzu araması (`tur: havuz`), haftalık e-postada yalnızca yeni aday sayısı.
 * - Yazma yalnızca servis üzerinden (src/servisler/kayitliAramalar.ts); kişi kendi aramalarını okur.
 * - Aday hesabı silinince silinir; aday veri dökümüne girer.
 */
export const KayitliAramalar: CollectionConfig = {
  slug: 'kayitli-aramalar',
  labels: { singular: 'Kayıtlı arama', plural: 'Kayıtlı aramalar' },
  admin: { group: 'Adaylar', defaultColumns: ['kullanici', 'tur', 'ad', 'siklik', 'sonBildirim'] },
  access: { read: kurumVeyaSahibi('kullanici'), create: hicKimse, update: hicKimse, delete: hicKimse },
  indexes: [{ fields: ['kullanici', 'tur', 'sorgu'], unique: true }],
  fields: [
    { name: 'kullanici', type: 'relationship', relationTo: 'kullanicilar', required: true, index: true },
    {
      name: 'tur',
      type: 'select',
      required: true,
      options: [
        { label: 'İlan araması (aday)', value: 'ilan' },
        { label: 'CV havuzu araması (firma)', value: 'havuz' },
      ],
    },
    { name: 'ad', type: 'text', required: true, maxLength: 120 },
    { name: 'sorgu', type: 'text', admin: { description: 'Adres sorgusu, ör. tur=staj&ara=react. Boş: bütün ilanlar.' } },
    {
      name: 'siklik',
      type: 'select',
      required: true,
      defaultValue: 'haftalik',
      options: [
        { label: 'Yeni ilan yayına girince', value: 'anlik' },
        { label: 'Haftada bir özet', value: 'haftalik' },
      ],
    },
    { name: 'sonBildirim', type: 'date', admin: { description: 'Son e-posta (haftalıkta bir sonraki özet bundan sonraki yenileri kapsar).' } },
  ],
}
