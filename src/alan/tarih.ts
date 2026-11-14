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

/** Anın Türkiye saatine göre günü: “2026-11-14”. Tarih seçicinin değeri bu biçimdedir. */
export function trGunMetni(an: Date): string {
  return new Date(an.getTime() + TR_FARK_MS).toISOString().slice(0, 10)
}

/** “2026-11-14” → o günün Türkiye saatiyle başlangıcı. Geçersiz metinde null. */
export function trGunu(metin: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(metin.trim())
  if (!m) return null
  const [y, a, g] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const d = new Date(Date.UTC(y, a - 1, g) - TR_FARK_MS)
  return trGunMetni(d) === metin.trim() ? d : null // 31 Şubat gibi geçersiz günleri eler
}
