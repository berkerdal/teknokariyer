import type { CollectionConfig } from 'payload'

/**
 * Kullanıcılar. Roller (talimatlar 2. bölüm, K11): başlangıçta Yönetici A.Ş. kullanıcılarının hepsi "yonetici".
 * Ayrıntılı alanlar ve erişim kuralları M3'te eklenecek.
 */
export const Kullanicilar: CollectionConfig = {
  slug: 'kullanicilar',
  labels: { singular: 'Kullanıcı', plural: 'Kullanıcılar' },
  admin: { useAsTitle: 'email', defaultColumns: ['ad', 'email', 'rol'] },
  auth: true,
  fields: [
    { name: 'ad', label: 'Ad soyad', type: 'text', required: true },
    {
      name: 'rol',
      label: 'Rol',
      type: 'select',
      required: true,
      defaultValue: 'aday',
      options: [
        { label: 'Yönetici (Yönetici A.Ş.)', value: 'yonetici' },
        { label: 'Moderatör (Yönetici A.Ş.)', value: 'moderator' },
        { label: 'Raporlayıcı (Yönetici A.Ş.)', value: 'raporlayici' },
        { label: 'Firma kullanıcısı', value: 'firma' },
        { label: 'Aday', value: 'aday' },
      ],
    },
  ],
}
