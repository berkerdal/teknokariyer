import { describe, expect, it } from 'vitest'
import { istatistikGuncelle, izinGecerliMi, izinOku, izinYaz } from '@/alan/cerez'

describe('çerez izni', () => {
  it('yazılan izin okunur; bozuk değer null', () => {
    const d = izinYaz({ tercih: true, istatistik: false }, '2026-11-15')
    expect(d).toBe('1.t1.i0.2026-11-15')
    expect(izinOku(d)).toEqual({ surum: '1', tercih: true, istatistik: false, tarih: '2026-11-15' })
    expect(izinOku('evet')).toBeNull()
    expect(izinOku(undefined)).toBeNull()
  })
  it('12 ay sonra ve sürüm değişince yeniden sorulur', () => {
    const i = izinOku('1.t1.i1.2026-11-15')
    expect(izinGecerliMi(i, new Date('2027-06-01T00:00:00Z'))).toBe(true)
    expect(izinGecerliMi(i, new Date('2027-11-16T00:00:00Z'))).toBe(false)
    expect(izinGecerliMi(izinOku('0.t1.i1.2026-11-15'), new Date('2026-11-16T00:00:00Z'))).toBe(false)
    expect(izinGecerliMi(null, new Date())).toBe(false)
  })
})

describe('istatistik çerezi', () => {
  it('ilk geliş, günün ve ayın ilk açılışı; kimlik yok', () => {
    const ilk = istatistikGuncelle(null, '2026-11-15')
    expect(ilk).toEqual({ deger: '2026-11.2026-11-15', yeni: true, gununIlki: true, ayinIlki: true })
    expect(istatistikGuncelle(ilk.deger, '2026-11-15')).toMatchObject({ yeni: false, gununIlki: false, ayinIlki: false })
    expect(istatistikGuncelle(ilk.deger, '2026-11-20')).toEqual({ deger: '2026-11.2026-11-20', yeni: false, gununIlki: true, ayinIlki: false })
    expect(istatistikGuncelle('2026-11.2026-11-30', '2026-12-01')).toMatchObject({ gununIlki: true, ayinIlki: true })
  })
})
