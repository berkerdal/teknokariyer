/** Firma içindeki yetkiler ve açıklamaları (talimatlar 2). Hem sunucu sayfaları hem istemci bileşenleri kullanır. */
export const YETKILER: Array<[string, string, string]> = [
  ['yonetici', 'Tam yetkili', 'İlanlar, başvurular, CV havuzu, firma profili ve ekip yönetimi.'],
  ['ilan-sorumlusu', 'İlan sorumlusu', 'İlanlar, başvurular ve CV havuzu. Firma profilini ve ekibi yönetemez.'],
  ['degerlendirici', 'Değerlendirici', 'Başvuruları görür, not ve puan ekler. Durum değiştiremez, ilan açamaz.'],
]
