import type { CollectionConfig } from 'payload'
import { hicKimse, kurumOkur } from '../erisim'

/**
 * Günlük özet (K31, docs/raporlama.md 7): geçmişi kayıtlarda tutulmayan ölçülerin her gün alınan fotoğrafı. Trend grafikleri
 * ve dönem raporları buradan çizilir. Kişisel veri içermez. Yalnızca zamanlanmış iş yazar.
 */
export const GunlukOzetler: CollectionConfig = {
  slug: 'gunluk-ozetler',
  labels: { singular: 'Günlük özet', plural: 'Günlük özetler' },
  admin: { useAsTitle: 'tarih', defaultColumns: ['tarih', 'yayindakiIlan', 'basvuru', 'yeniAday'], group: 'Raporlar' },
  access: { read: kurumOkur, create: hicKimse, update: hicKimse, delete: hicKimse },
  fields: [
    { name: 'tarih', label: 'Gün (Türkiye saati, YYYY-AA-GG)', type: 'text', required: true, unique: true, index: true },
    { name: 'yayindakiIlan', label: 'Gün sonunda yayındaki ilan', type: 'number', defaultValue: 0 },
    { name: 'yeniIlan', label: 'O gün yayına giren ilan', type: 'number', defaultValue: 0 },
    { name: 'basvuru', label: 'O gün gelen başvuru', type: 'number', defaultValue: 0 },
    { name: 'goruntulenme', label: 'O gün ilan görüntülenmesi', type: 'number', defaultValue: 0 },
    { name: 'toplamAday', label: 'Gün sonunda aday hesabı', type: 'number', defaultValue: 0 },
    { name: 'yeniAday', label: 'O gün açılan aday hesabı', type: 'number', defaultValue: 0 },
    { name: 'havuzdakiAday', label: 'Gün sonunda havuzda görünen aday', type: 'number', defaultValue: 0 },
    { name: 'ilanVerenFirma', label: 'Gün sonunda yayında ilanı olan firma', type: 'number', defaultValue: 0 },
    {
      name: 'ilanlar',
      label: 'İlan başına birikimli sayaçlar',
      type: 'json',
      admin: { description: '[{ id, goruntulenme, basvuru }]: ertesi günle farkı o günün değeridir.' },
    },
  ],
}
