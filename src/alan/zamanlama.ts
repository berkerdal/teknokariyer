/**
 * Zamanlanmış işlerin saatleri (UTC). Cloudflare'de `wrangler.jsonc` → `triggers.crons`, Node sunucusunda
 * `scripts/zamanlayici.ts` aynı saatleri kullanır; ikisinin aynı kaldığını bir birim testi denetler.
 * 21:05 UTC = Türkiye 00:05 (gün dönünce süresi dolan ilanlar kapanır), 07:00 UTC = Türkiye 10:00 (hatırlatmalar).
 */
export const ZAMANLANMIS_ISLER_UTC = [
  { saat: 21, dakika: 5 },
  { saat: 7, dakika: 0 },
] as const

export const cronIfadeleri = () => ZAMANLANMIS_ISLER_UTC.map((z) => `${z.dakika} ${z.saat} * * *`)

/** Bu dakika bir çalışma zamanı mı? Öyleyse aynı çalışmanın ikinci kez başlamaması için bir anahtar döner. */
export function calismaAnahtari(an: Date): string | null {
  const z = ZAMANLANMIS_ISLER_UTC.find((x) => x.saat === an.getUTCHours() && x.dakika === an.getUTCMinutes())
  return z ? `${an.toISOString().slice(0, 10)}T${String(z.saat).padStart(2, '0')}:${String(z.dakika).padStart(2, '0')}Z` : null
}
