/**
 * İstek sınırlama (talimatlar 12: “giriş denemeleri ve başvurular için istek sınırlaması”).
 *
 * Sabit pencereli sayaç: her eylem için aynı kaynaktan (IP adresinin özeti veya hesap) belli bir sürede en fazla belli
 * sayıda istek kabul edilir. Hesap bazlı kilitler ayrıca vardır (Payload: 5 hatalı şifrede 15 dakika; ikinci adım).
 * Bu modül saf kurallardır; sayaçları `src/servisler/istekSiniri.ts` tutar.
 */
export type SinirliEylem = 'giris' | 'kayit' | 'sifre-sifirlama' | 'ikinci-adim' | 'basvuru' | 'davet'

export const SINIRLAR: Record<SinirliEylem, { sayi: number; dakika: number; ne: string }> = {
  giris: { sayi: 10, dakika: 15, ne: 'giriş denemesi' },
  kayit: { sayi: 5, dakika: 60, ne: 'hesap açma denemesi' },
  'sifre-sifirlama': { sayi: 5, dakika: 60, ne: 'şifre yenileme isteği' },
  'ikinci-adim': { sayi: 20, dakika: 15, ne: 'doğrulama denemesi' },
  basvuru: { sayi: 30, dakika: 60, ne: 'başvuru' },
  davet: { sayi: 10, dakika: 60, ne: 'davet kabul denemesi' },
}

/** Pencerenin başlangıcı (dakikanın katlarına hizalı). */
export function pencereBasi(an: Date, dakika: number): Date {
  const ms = dakika * 60_000
  return new Date(Math.floor(an.getTime() / ms) * ms)
}

/** Pencerenin bitmesine kalan tam dakika (en az 1). */
export function kalanDakika(an: Date, dakika: number): number {
  const bitis = pencereBasi(an, dakika).getTime() + dakika * 60_000
  return Math.max(1, Math.ceil((bitis - an.getTime()) / 60_000))
}

export function sinirMesaji(eylem: SinirliEylem, an: Date, siz: boolean): string {
  const s = SINIRLAR[eylem]
  const dk = kalanDakika(an, s.dakika)
  return siz
    ? `Kısa sürede çok sayıda ${s.ne} yapıldı. Güvenliğiniz için ${dk} dakika sonra yeniden deneyin.`
    : `Kısa sürede çok sayıda ${s.ne} yapıldı. Güvenliğin için ${dk} dakika sonra yeniden dene.`
}
