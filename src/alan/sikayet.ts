/**
 * İlan şikâyeti (talimatlar 12 “Kötüye kullanım”; kullanıcı onayıyla 16.11.2026'da yapıldı).
 * Aday bir ilanı bildirir; bildirimler Yönetici A.Ş.'nin moderasyon kuyruğuna ilan başına toplanır ve birlikte
 * sonuçlandırılır. Saf kurallar ve adlar.
 */
export const SIKAYET_NEDENI = {
  sahte: { ad: 'Sahte veya gerçek dışı ilan', ipucu: 'Firma bu pozisyonu aramıyor gibi görünüyor ya da bilgiler tutarsız.' },
  ucret: { ad: 'Adaydan ücret istiyor', ipucu: 'Başvuru, eğitim veya belge için para isteniyor.' },
  ayrimci: { ad: 'Ayrımcı ifade içeriyor', ipucu: 'Cinsiyet, yaş, din, köken gibi işle ilgisiz bir şart koşuluyor.' },
  yaniltici: { ad: 'Yanıltıcı bilgi', ipucu: 'Ücret, çalışma şekli veya iş tanımı gerçeği yansıtmıyor.' },
  diger: { ad: 'Başka bir sorun', ipucu: 'Açıklamada kısaca anlat.' },
} as const
export type SikayetNedeni = keyof typeof SIKAYET_NEDENI

export const SIKAYET_SONUCU = {
  yersiz: { ad: 'Kurallara aykırı bulunmadı', aciklama: 'İlan yayında kalır. Bildirenlere incelendiği bildirilir.' },
  'firma-uyarildi': { ad: 'Firma uyarıldı', aciklama: 'İlan yayında kalır; firmaya yazdığınız mesaj e-postayla gider.' },
  'ilan-kaldirildi': { ad: 'İlan yayından kaldırıldı', aciklama: 'İlan kapanır, adaylar artık başvuramaz; firmaya gerekçeniz e-postayla gider.' },
} as const
export type SikayetSonucu = keyof typeof SIKAYET_SONUCU

/** Bir adayın günde en çok bildirimi (kötüye kullanıma karşı) */
export const GUNLUK_SIKAYET_SINIRI = 5
export const ACIKLAMA_EN_UZUN = 1000

/** Bildirim denetimi: neden geçerli olmalı; “Başka bir sorun”da açıklama zorunlu. Hata metni ya da null. */
export function sikayetHatasi(neden: string, aciklama: string): string | null {
  if (!(neden in SIKAYET_NEDENI)) return 'Bildirim nedenini seç.'
  if (neden === 'diger' && aciklama.trim().length < 10) return 'Sorunu birkaç cümleyle anlat (en az 10 karakter).'
  if (aciklama.length > ACIKLAMA_EN_UZUN) return `Açıklama en fazla ${ACIKLAMA_EN_UZUN} karakter olabilir.`
  return null
}

/** Karar denetimi: uyarı ve kaldırmada firmaya giden mesaj zorunlu. */
export function kararHatasi(sonuc: string, firmaMesaji: string): string | null {
  if (!(sonuc in SIKAYET_SONUCU)) return 'Bir sonuç seçin.'
  if (sonuc !== 'yersiz' && firmaMesaji.trim().length < 15) return 'Firmaya gidecek mesajı yazın: neyin sorun olduğunu ve ne yapması gerektiğini (en az 15 karakter).'
  return null
}
