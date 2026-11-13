/**
 * Türkiye saatine göre gün sınırları. Sunucu (Workers) UTC'de çalışır; ilanın "son günü" Türkiye saatiyle biter.
 * Türkiye 2016'dan beri yaz-kış saati uygulamıyor: sabit UTC+3.
 */
export const TR_FARK_MS = 3 * 60 * 60 * 1000

/** Verilen anın Türkiye saatine göre gün başlangıcı (UTC zaman damgası olarak). */
export function trGunBasi(an: Date): Date {
  const tr = new Date(an.getTime() + TR_FARK_MS)
  return new Date(Date.UTC(tr.getUTCFullYear(), tr.getUTCMonth(), tr.getUTCDate()) - TR_FARK_MS)
}

/** Türkiye saatine göre takvim günü farkı. */
export function trGunFarki(baslangic: Date, bitis: Date): number {
  return Math.round((trGunBasi(bitis).getTime() - trGunBasi(baslangic).getTime()) / 86_400_000)
}
