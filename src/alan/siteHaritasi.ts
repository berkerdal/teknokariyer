/**
 * Site haritası girdileri (sitemap.xml). Yalnızca arama motorunun dizinlemesi istenen herkese açık sayfalar:
 * ana sayfa, ilan listesi, açık ilanlar, açık ilanı olan firmalar, KVKK başvurusu ve aydınlatma metinleri.
 * Hesap, başvuru, panel ve yönetim sayfaları girmez (onlar ayrıca noindex). Saf fonksiyon: veri dışarıdan gelir.
 */
import { dilAdresleri } from './dil'

export interface SiteHaritasiGirdisi {
  url: string
  lastModified?: Date
  changeFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  priority?: number
  alternates: { languages: Record<string, string> }
}

export interface SiteHaritasiVerisi {
  ilanlar: Array<{ yol: string; guncelleme?: string | null }>
  firmalar: Array<{ yol: string; guncelleme?: string | null }>
  metinler: Array<{ yol: string; tarih?: string | null }>
  /** İlan listesinde staj sekmesi gösterilecek mi (açık staj ilanı var mı) */
  stajVar: boolean
}

const tarih = (s?: string | null) => {
  if (!s) return undefined
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? undefined : d
}

/** `kok`: sitenin mutlak adresi (sonunda `/` olmadan). */
export function siteHaritasiGirdileri(v: SiteHaritasiVerisi, kok: string): SiteHaritasiGirdisi[] {
  const tam = (yol: string) => kok + yol
  const girdi = (yol: string, ek: Omit<SiteHaritasiGirdisi, 'url' | 'alternates'>): SiteHaritasiGirdisi => {
    const { languages } = dilAdresleri(yol)
    return { url: tam(yol), alternates: { languages: Object.fromEntries(Object.entries(languages).map(([k, y]) => [k, tam(y)])) }, ...ek }
  }
  const sonIlan = v.ilanlar.map((i) => tarih(i.guncelleme)).filter((d): d is Date => Boolean(d)).sort((a, b) => b.getTime() - a.getTime())[0]
  return [
    girdi('/', { changeFrequency: 'daily', priority: 1, lastModified: sonIlan }),
    girdi('/ilanlar', { changeFrequency: 'daily', priority: 0.9, lastModified: sonIlan }),
    ...(v.stajVar ? [girdi('/ilanlar?tur=staj', { changeFrequency: 'daily', priority: 0.8, lastModified: sonIlan })] : []),
    ...v.ilanlar.map((i) => girdi(i.yol, { changeFrequency: 'weekly', priority: 0.8, lastModified: tarih(i.guncelleme) })),
    girdi('/firmalar', { changeFrequency: 'weekly', priority: 0.6 }),
    ...v.firmalar.map((f) => girdi(f.yol, { changeFrequency: 'weekly', priority: 0.5, lastModified: tarih(f.guncelleme) })),
    girdi('/kvkk-basvurusu', { changeFrequency: 'yearly', priority: 0.2 }),
    ...v.metinler.map((m) => girdi(m.yol, { changeFrequency: 'yearly', priority: 0.2, lastModified: tarih(m.tarih) })),
  ]
}

/** robots.txt'te taranması istenmeyen yollar (hesap, panel, akış ve yönetim sayfaları). */
export const TARANMAYAN_YOLLAR = [
  '/hesabim', '/firma-paneli', '/yonetim', '/yonetim-islem', '/yonetim-islem-ornek', '/admin', '/api', '/giris', '/cikis', '/davet',
  '/dogrula', '/sifre-yenile', '/sifremi-unuttum', '/hesap-guvenligi', '/hesap-silindi', '/basvuru-tamam', '/ilan/*/basvur',
]
