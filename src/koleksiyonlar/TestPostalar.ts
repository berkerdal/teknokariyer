import type { CollectionConfig } from 'payload'

/**
 * Test posta kutusu (talimatlar 0.5). Yayın dışındaki ortamlarda gönderilen her e-posta buraya yazılır.
 * Yalnızca Yönetici A.Ş. görür; kayıtlar elle oluşturulamaz veya düzenlenemez.
 */
export const TestPostalar: CollectionConfig = {
  slug: 'test-postalar',
  labels: { singular: 'Test e-postası', plural: 'Test posta kutusu' },
  admin: { useAsTitle: 'konu', defaultColumns: ['kime', 'konu', 'createdAt'], group: 'Sistem' },
  access: {
    read: ({ req }) => req.user?.rol === 'yonetici',
    create: () => false,
    update: () => false,
    delete: ({ req }) => req.user?.rol === 'yonetici',
  },
  fields: [
    { name: 'kime', label: 'Kime', type: 'text', required: true },
    { name: 'konu', label: 'Konu', type: 'text' },
    { name: 'html', label: 'HTML gövde', type: 'textarea' },
    { name: 'metin', label: 'Düz metin gövde', type: 'textarea' },
    { name: 'ortam', label: 'Ortam', type: 'text' },
  ],
}
