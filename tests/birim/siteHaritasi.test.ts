import { describe, expect, it } from 'vitest'
import { dilAdresleri } from '@/alan/dil'
import { siteHaritasiGirdileri, TARANMAYAN_YOLLAR } from '@/alan/siteHaritasi'

describe('dil adresleri', () => {
  it('kanonik adres ve hreflang karşılıkları (tr + x-default)', () => {
    expect(dilAdresleri('/ilanlar?tur=staj')).toEqual({ canonical: '/ilanlar?tur=staj', languages: { tr: '/ilanlar?tur=staj', 'x-default': '/ilanlar?tur=staj' } })
  })
})

describe('site haritası', () => {
  const kok = 'https://kariyer.pauteknokent.com.tr'
  const g = siteHaritasiGirdileri(
    {
      ilanlar: [
        { yol: '/ilan/3-flutter', guncelleme: '2026-11-10T08:00:00.000Z' },
        { yol: '/ilan/7-staj', guncelleme: '2026-11-12T08:00:00.000Z' },
      ],
      firmalar: [{ yol: '/firma/kodpit', guncelleme: '2026-11-12T08:00:00.000Z' }],
      metinler: [{ yol: '/metin/aday-aydinlatma', tarih: '2026-11-14' }],
      stajVar: true,
    },
    kok,
  )
  it('mutlak adresler, yalnızca herkese açık sayfalar', () => {
    expect(g.map((x) => x.url.replace(kok, ''))).toEqual([
      '/', '/ilanlar', '/ilanlar?tur=staj', '/ilan/3-flutter', '/ilan/7-staj', '/firmalar', '/firma/kodpit', '/kvkk-basvurusu', '/metin/aday-aydinlatma',
    ])
    expect(g.every((x) => x.url.startsWith(kok) && x.alternates.languages['x-default'] === x.url && x.alternates.languages.tr === x.url)).toBe(true)
  })
  it('liste sayfalarının son değişikliği en yeni ilandır', () => {
    expect(g[0]!.lastModified?.toISOString()).toBe('2026-11-12T08:00:00.000Z')
    expect(g[3]!.lastModified?.toISOString()).toBe('2026-11-10T08:00:00.000Z')
  })
  it('açık staj ilanı yoksa staj sekmesi girmez; hesap ve panel yolları taranmaz', () => {
    const b = siteHaritasiGirdileri({ ilanlar: [], firmalar: [], metinler: [], stajVar: false }, kok)
    expect(b.map((x) => x.url)).not.toContain(`${kok}/ilanlar?tur=staj`)
    expect(b[0]!.lastModified).toBeUndefined()
    for (const y of ['/hesabim', '/firma-paneli', '/yonetim', '/admin', '/ilan/*/basvur']) expect(TARANMAYAN_YOLLAR).toContain(y)
  })
})
