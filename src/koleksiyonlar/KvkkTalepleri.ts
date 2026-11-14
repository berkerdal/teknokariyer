import type { CollectionConfig } from 'payload'
import { hicKimse, sadeceYonetici } from '../erisim'
import { KIMLIK_YONTEMLERI, KVKK_DURUM_ADI, KVKK_KANALLARI, KVKK_SONUC_ADI, KVKK_TALEP_TURLERI } from '../alan/kvkk'

/**
 * İlgili kişi başvuruları (KVKK m. 11, 13). Kayıtları yalnızca servisler yazar (src/servisler/kvkk.ts); her adım işlem
 * kaydına geçer. Başvuru kişisel veri içerdiği için yalnızca tam yetkili Yönetici A.Ş. kullanıcıları görür. Aday kendi
 * başvurularını Hesap ve gizlilik sayfasında (servis üzerinden, iç notlar olmadan) görür.
 */
export const KvkkTalepleri: CollectionConfig = {
  slug: 'kvkk-talepleri',
  labels: { singular: 'KVKK talebi', plural: 'KVKK talepleri' },
  admin: { useAsTitle: 'basvuranAd', defaultColumns: ['basvuranAd', 'tur', 'durum', 'basvuruTarihi'], group: 'KVKK' },
  access: { read: sadeceYonetici, create: hicKimse, update: hicKimse, delete: hicKimse },
  fields: [
    { name: 'tur', label: 'Tür', type: 'select', required: true, options: KVKK_TALEP_TURLERI.map(([value, label]) => ({ value, label })) },
    { name: 'aciklama', label: 'Açıklama', type: 'textarea', maxLength: 3000 },
    { name: 'kanal', label: 'Kanal', type: 'select', required: true, options: KVKK_KANALLARI.map(([value, label]) => ({ value, label })) },
    { name: 'kullanici', label: 'Bağlı hesap', type: 'relationship', relationTo: 'kullanicilar', index: true },
    { name: 'basvuranAd', label: 'Başvuran', type: 'text', required: true },
    { name: 'basvuranEposta', label: 'Cevap e-posta adresi', type: 'email', required: true },
    { name: 'basvuruTarihi', label: 'Başvurunun ulaştığı tarih', type: 'date', required: true, index: true },
    { name: 'kimlik', label: 'Kimlik doğrulama', type: 'select', required: true, options: KIMLIK_YONTEMLERI.map(([value, label]) => ({ value, label })) },
    {
      name: 'durum',
      label: 'Durum',
      type: 'select',
      required: true,
      index: true,
      defaultValue: 'alindi',
      options: Object.entries(KVKK_DURUM_ADI).map(([value, label]) => ({ value, label })),
    },
    { name: 'sonuc', label: 'Sonuç', type: 'select', options: Object.entries(KVKK_SONUC_ADI).map(([value, label]) => ({ value, label })) },
    { name: 'cevap', label: 'Cevap', type: 'textarea', maxLength: 5000 },
    { name: 'cevapTarihi', label: 'Cevap tarihi', type: 'date' },
    { name: 'cevapGonderildi', label: 'Cevap e-postası gönderildi', type: 'checkbox', defaultValue: false },
    {
      name: 'notlar',
      label: 'İç notlar',
      type: 'array',
      fields: [
        { name: 'metin', type: 'textarea', required: true },
        { name: 'yazan', type: 'relationship', relationTo: 'kullanicilar' },
        { name: 'tarih', type: 'date', required: true },
      ],
    },
  ],
}
