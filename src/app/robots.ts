/**
 * robots.txt. Yayında: herkese açık sayfalar taranır; hesap, panel, akış ve yönetim sayfaları taranmaz; site haritası
 * bildirilir. Yayın dışı ortamlarda (test, geliştirme) hiçbir sayfa taranmaz. Cloudflare'de Worker ayrıca her yanıta
 * `X-Robots-Tag: noindex` ekler (worker.ts).
 */
import type { MetadataRoute } from 'next'
import { TARANMAYAN_YOLLAR } from '@/alan/siteHaritasi'
import { ortam } from '@/altyapi/eposta'
import { siteAdresi } from '@/altyapi/epostaSablonlari'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  if (ortam() !== 'yayin') return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: '/', disallow: TARANMAYAN_YOLLAR },
    sitemap: `${siteAdresi()}/sitemap.xml`,
  }
}
