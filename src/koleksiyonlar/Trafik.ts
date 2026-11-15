import type { CollectionConfig } from 'payload'
import { hicKimse, kurumOkur } from '../erisim'

/**
 * Çerezsiz site trafiği ölçümü (talimatlar 9: “Ziyaretçi istatistikleri çerez kullanmadan ve kişisel veri tutmadan
 * ölçülür”; kullanıcı isteği 15.11.2026). Kural ve sınıflandırma: src/alan/trafik.ts.
 *
 * Saklanmayanlar: IP adresi, tarayıcı kimliği, çerez, tam yönlendiren adres (yalnızca site adı), sorgu dizgisi.
 * Ham olaylar en geç ertesi gece günlük özete dönüştürülüp silinir.
 */
export const TrafikOlaylari: CollectionConfig = {
  slug: 'trafik-olaylari',
  labels: { singular: 'Sayfa görüntüleme', plural: 'Sayfa görüntülemeleri' },
  admin: { group: 'Sistem', defaultColumns: ['gun', 'yol', 'kaynak', 'cihaz'], description: 'Bugünün ham sayfa görüntülemeleri. Kişisel veri içermez; gece özetlenip silinir.' },
  access: { read: kurumOkur, create: hicKimse, update: hicKimse, delete: hicKimse },
  fields: [
    { name: 'gun', type: 'text', required: true, index: true },
    { name: 'yol', type: 'text', required: true },
    { name: 'kaynak', type: 'text', required: true },
    { name: 'kaynakSite', type: 'text' },
    { name: 'cihaz', type: 'text', required: true },
    { name: 'giris', type: 'checkbox', defaultValue: false },
    // İstatistik çerezine izin verenlerde kimliksiz işaretler (src/alan/cerez.ts)
    { name: 'izinli', type: 'checkbox', defaultValue: false },
    { name: 'yeniZiyaretci', type: 'checkbox', defaultValue: false },
    { name: 'gununIlki', type: 'checkbox', defaultValue: false },
    { name: 'ayinIlki', type: 'checkbox', defaultValue: false },
  ],
}

export const TrafikOzetleri: CollectionConfig = {
  slug: 'trafik-ozetleri',
  labels: { singular: 'Günlük trafik özeti', plural: 'Günlük trafik özetleri' },
  admin: { group: 'Sistem', defaultColumns: ['gun', 'boyut', 'deger', 'goruntuleme', 'ziyaret'], description: 'Günlük site trafiği, boyut boyut (sayfa, kaynak, cihaz).' },
  access: { read: kurumOkur, create: hicKimse, update: hicKimse, delete: hicKimse },
  indexes: [{ fields: ['gun', 'boyut', 'deger'], unique: true }],
  fields: [
    { name: 'gun', type: 'text', required: true, index: true },
    { name: 'boyut', type: 'text', required: true },
    { name: 'deger', type: 'text', required: true },
    { name: 'goruntuleme', type: 'number', required: true, defaultValue: 0 },
    { name: 'ziyaret', type: 'number', required: true, defaultValue: 0 },
    { name: 'tekilGun', type: 'number', defaultValue: 0 },
    { name: 'tekilAy', type: 'number', defaultValue: 0 },
    { name: 'yeni', type: 'number', defaultValue: 0 },
    { name: 'izinli', type: 'number', defaultValue: 0 },
  ],
}
