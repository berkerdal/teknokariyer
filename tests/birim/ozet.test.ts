import { describe, expect, it } from 'vitest'
import { degisim, dilimlereBol, donem, eksenAdimlari, gruplariGizle, huni } from '@/alan/ozet'

describe('yönetici özeti hesapları', () => {
  const simdi = new Date('2026-11-14T10:00:00Z') // TR 13.00
  it('dönem bugünün sonunda biter; önceki dönem aynı uzunluktadır; 12 ay haftalık', () => {
    const d = donem('7g', simdi)
    expect(d.bit.toISOString()).toBe('2026-11-14T21:00:00.000Z')
    expect(d.bas.toISOString()).toBe('2026-11-07T21:00:00.000Z')
    expect(d.oncekiBas.toISOString()).toBe('2026-10-31T21:00:00.000Z')
    expect(donem('bilinmeyen', simdi).kod).toBe('30g')
    expect(donem('12a', simdi).adimGun).toBe(7)
  })
  it('günlere böler, boş günleri sıfırla doldurur, Türkiye gününe göre sayar', () => {
    const d = donem('7g', simdi)
    const s = dilimlereBol(['2026-11-13T21:30:00Z', '2026-11-14T09:00:00Z', '2026-11-13T20:00:00Z', '2020-01-01T00:00:00Z'], d)
    expect(s).toHaveLength(7)
    expect(s[6]).toEqual({ gun: '2026-11-14', n: 2 })
    expect(s[5]).toEqual({ gun: '2026-11-13', n: 1 })
    expect(s.reduce((t, x) => t + x.n, 0)).toBe(3)
  })
  it('5’ten küçük grupları gizler; Diğer toplamı da küçükse sayı vermez', () => {
    expect(gruplariGizle({ PAÜ: 12, DEÜ: 6, Ege: 2, ODTÜ: 1 })).toEqual([{ ad: 'PAÜ', n: 12 }, { ad: 'DEÜ', n: 6 }, { ad: 'Diğer', n: null }])
    expect(gruplariGizle({ A: 3, B: 2, C: 4 })).toEqual([{ ad: 'Diğer', n: 9 }])
    expect(gruplariGizle({ A: 9, B: 8, C: 7 }, 2)).toEqual([{ ad: 'A', n: 9 }, { ad: 'B', n: 8 }, { ad: 'Diğer', n: 7 }])
  })
  it('huni şimdiki durumdan ulaşılan aşamayı sayar; geri çekilenler dışarıda', () => {
    const h = huni(['alindi', 'inceleniyor', 'gorusme', 'olumsuz', 'teklif', 'olumlu', 'geri-cekti'])
    expect(h.map((x) => x.n)).toEqual([6, 5, 3, 2, 1])
    expect(h[4]!.oran).toBe(16.7)
  })
  it('değişim ve eksen adımları', () => {
    expect(degisim(15, 10)).toEqual({ fark: 5, yuzde: 50 })
    expect(degisim(3, 0)).toEqual({ fark: 3, yuzde: null })
    expect(eksenAdimlari(17)).toEqual([0, 5, 10, 15, 20])
    expect(eksenAdimlari(3)).toEqual([0, 1, 2, 3])
    expect(eksenAdimlari(2)).toEqual([0, 1, 2])
    expect(eksenAdimlari(1)).toEqual([0, 1])
    expect(eksenAdimlari(0)).toEqual([0, 1])
  })
})
