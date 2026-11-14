/** Yönetici A.Ş. rolleri (K11: başlangıçta herkes tam yetkili; roller hazır). Sunucu ve arayüz ortak kullanır. */
export type KurumRolu = 'yonetici' | 'moderator' | 'raporlayici'
export const KURUM_ROLLERI: Array<[KurumRolu, string, string]> = [
  ['yonetici', 'Tam yetkili', 'Her şey: ilan onayı, talepler, firmalar, listeler, kullanıcılar ve ayarlar.'],
  ['moderator', 'Moderatör', 'İlan onayı, ilan değişiklikleri, liste talepleri, davetler ve takip notları. Firma kaydı, liste, kullanıcı ve ayar değiştiremez.'],
  ['raporlayici', 'Raporlayıcı', 'Yalnızca görüntüler; hiçbir karar veremez.'],
]
export const KURUM_ROL_ADI = Object.fromEntries(KURUM_ROLLERI.map(([r, a]) => [r, a])) as Record<KurumRolu, string>
