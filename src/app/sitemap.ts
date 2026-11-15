/**
 * sitemap.xml (talimatlar 14 ve 16: site haritası ve hreflang). Her ortamda üretilir ki test ortamında denetlenebilsin;
 * yayın dışı ortam robots.txt ve noindex başlığıyla arama motorlarına zaten kapalıdır.
 */
import type { MetadataRoute } from 'next'
import { siteHaritasiGirdileri } from '@/alan/siteHaritasi'
import { siteAdresi } from '@/altyapi/epostaSablonlari'
import { siteHaritasiVerisi } from '@/veri/siteHaritasi'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return siteHaritasiGirdileri(await siteHaritasiVerisi(), siteAdresi())
}
