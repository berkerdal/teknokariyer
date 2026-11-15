/** Site haritası verisi: ilan listesiyle aynı görünürlük kuralları (yayındaki, süresi dolmamış, firması görünür ilanlar). */
import { yayindakiIlanlar } from './ilanlar'
import { payloadAl } from './payload'
import { parcaliBul } from '@/altyapi/parcali'
import { ilanAdresi } from '@/arayuz/bicim'
import { METINLER } from '@/metinler'
import type { SiteHaritasiVerisi } from '@/alan/siteHaritasi'

export async function siteHaritasiVerisi(): Promise<SiteHaritasiVerisi> {
  const ilanlar = await yayindakiIlanlar()
  const payload = await payloadAl()
  const guncellemeler = new Map(
    (
      await parcaliBul(
        ilanlar.map((i) => i.id),
        (parca) => payload.find({ collection: 'ilanlar', where: { id: { in: parca } }, select: { updatedAt: true }, limit: parca.length, depth: 0, overrideAccess: true }),
      )
    ).map((d) => [d.id, d.updatedAt]),
  )
  // Firma sayfası: /firmalar ile aynı küme (açık ilanı olan firmalar); son değişiklik olarak en yeni ilanı alınır
  const firmalar = new Map<string, string | undefined>()
  for (const i of ilanlar) {
    const g = guncellemeler.get(i.id)
    const onceki = firmalar.get(i.firma.slug)
    if (!firmalar.has(i.firma.slug) || (g && (!onceki || g > onceki))) firmalar.set(i.firma.slug, g)
  }
  return {
    ilanlar: ilanlar.map((i) => ({ yol: ilanAdresi(i), guncelleme: guncellemeler.get(i.id) })),
    firmalar: [...firmalar].map(([slug, g]) => ({ yol: `/firma/${slug}`, guncelleme: g })),
    metinler: Object.entries(METINLER).map(([kimlik, m]) => ({ yol: `/metin/${kimlik}`, tarih: m.tarih })),
    stajVar: ilanlar.some((i) => i.tur === 'staj'),
  }
}
