import { describe, expect, it } from 'vitest'
import { cihazSiniflandir, kaynakSiniflandir, olaylariOzetle, satirlariTopla, yolNormallestir } from '@/alan/trafik'

const SITE = 'https://kariyer.pauteknokent.com.tr'

describe('yol', () => {
  it('sorgu ve # atılır, paneller ölçülmez', () => {
    expect(yolNormallestir('/ilanlar?tur=staj#x')).toBe('/ilanlar')
    expect(yolNormallestir('/firma/kodpit/')).toBe('/firma/kodpit')
    expect(yolNormallestir('/')).toBe('/')
    expect(yolNormallestir('/hesabim/profil')).toBeNull()
    expect(yolNormallestir('/firma-paneli')).toBeNull()
    expect(yolNormallestir('/yonetim/ozet')).toBeNull()
    expect(yolNormallestir('https://kotu.example/ilan')).toBeNull()
    expect(yolNormallestir('/ilan/<script>')).toBeNull()
  })
})

describe('kaynak', () => {
  it('site içi, doğrudan, arama, LinkedIn, sosyal, kurum, diğer', () => {
    expect(kaynakSiniflandir(`${SITE}/ilanlar`, SITE)).toEqual({ kaynak: 'ic', site: null })
    expect(kaynakSiniflandir('', SITE)).toEqual({ kaynak: 'dogrudan', site: null })
    expect(kaynakSiniflandir('https://www.google.com.tr/', SITE)).toEqual({ kaynak: 'arama', site: 'google.com.tr' })
    expect(kaynakSiniflandir('https://www.linkedin.com/feed/', SITE).kaynak).toBe('linkedin')
    expect(kaynakSiniflandir('https://lnkd.in/abc', SITE).kaynak).toBe('linkedin')
    expect(kaynakSiniflandir('', SITE, 'linkedin').kaynak).toBe('linkedin') // yönlendiren gizli, bağlantıda işaret var
    expect(kaynakSiniflandir('https://t.co/x', SITE).kaynak).toBe('sosyal')
    expect(kaynakSiniflandir('https://www.pauteknokent.com.tr/kariyer', SITE)).toEqual({ kaynak: 'kurum', site: 'pauteknokent.com.tr' })
    expect(kaynakSiniflandir('https://bilgisayar.pau.edu.tr/', SITE).kaynak).toBe('kurum')
    expect(kaynakSiniflandir('https://ornekblog.com/yazi?id=5', SITE)).toEqual({ kaynak: 'diger', site: 'ornekblog.com' })
  })
})

describe('cihaz', () => {
  it('telefon, tablet, bilgisayar; botlar sayılmaz', () => {
    expect(cihazSiniflandir('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148')).toBe('mobil')
    expect(cihazSiniflandir('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36')).toBe('mobil')
    expect(cihazSiniflandir('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15')).toBe('tablet')
    expect(cihazSiniflandir('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36')).toBe('masaustu')
    expect(cihazSiniflandir('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBeNull()
    expect(cihazSiniflandir('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/120 Safari/537.36')).toBeNull()
    expect(cihazSiniflandir('curl/8.0')).toBeNull()
  })
})

describe('özet', () => {
  it('ziyaret yalnızca dışarıdan gelişte; kaynak ve giriş sayfası yalnızca ziyaretlerde', () => {
    const o = olaylariOzetle([
      { yol: '/', kaynak: 'arama', kaynakSite: 'google.com', cihaz: 'mobil', giris: true },
      { yol: '/ilanlar', kaynak: 'ic', cihaz: 'mobil', giris: false },
      { yol: '/ilanlar', kaynak: 'dogrudan', cihaz: 'masaustu', giris: true },
    ])
    const bul = (b: string, d: string) => o.find((s) => s.boyut === b && s.deger === d)
    expect(bul('toplam', '-')).toMatchObject({ goruntuleme: 3, ziyaret: 2 })
    expect(bul('yol', '/ilanlar')).toMatchObject({ goruntuleme: 2, ziyaret: 1 })
    expect(bul('kaynak', 'ic')).toBeUndefined()
    expect(bul('site', 'google.com')).toMatchObject({ ziyaret: 1 })
    expect(bul('giris-yolu', '/')).toMatchObject({ ziyaret: 1 })
    expect(bul('cihaz', 'mobil')).toMatchObject({ goruntuleme: 2, ziyaret: 1 })
    expect(satirlariTopla([...o, ...o]).find((s) => s.boyut === 'toplam')).toMatchObject({ goruntuleme: 6, ziyaret: 4 })
  })
})

describe('dönem ve sayfa adları', () => {
  it('günlük dizi boş günleri 0 ile doldurur; haftalık dilimler toplar', async () => {
    const { gunlukDizi } = await import('@/alan/trafik')
    const gun = (a: Date) => a.toISOString().slice(0, 10)
    const d = { bas: new Date('2026-11-01T00:00:00Z'), bit: new Date('2026-11-04T00:00:00Z'), adimGun: 1 as const }
    expect(gunlukDizi([{ gun: '2026-11-02', goruntuleme: 5, ziyaret: 2 }], d, gun)).toEqual([
      { gun: '2026-11-01', goruntuleme: 0, ziyaret: 0 },
      { gun: '2026-11-02', goruntuleme: 5, ziyaret: 2 },
      { gun: '2026-11-03', goruntuleme: 0, ziyaret: 0 },
    ])
    const h = { bas: new Date('2026-11-01T00:00:00Z'), bit: new Date('2026-11-15T00:00:00Z'), adimGun: 7 as const }
    expect(gunlukDizi([{ gun: '2026-11-02', goruntuleme: 1, ziyaret: 1 }, { gun: '2026-11-07', goruntuleme: 1, ziyaret: 1 }, { gun: '2026-11-08', goruntuleme: 3, ziyaret: 0 }], h, gun).map((x) => x.goruntuleme)).toEqual([2, 3])
  })
  it('ilan, başvuru ve firma yolları tanınır', async () => {
    const { sayfaTuru } = await import('@/alan/trafik')
    expect(sayfaTuru('/')).toEqual({ tur: 'sabit', ad: 'Ana sayfa' })
    expect(sayfaTuru('/ilan/17-backend-gelistirici')).toEqual({ tur: 'ilan', id: 17, basvuru: false })
    expect(sayfaTuru('/ilan/17-backend-gelistirici/basvur')).toEqual({ tur: 'ilan', id: 17, basvuru: true })
    expect(sayfaTuru('/firma/kodpit')).toEqual({ tur: 'firma', slug: 'kodpit' })
  })
})
