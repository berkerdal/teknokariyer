import { describe, expect, it } from 'vitest'
import { donemAylari, raporDonemi, type RaporDonemi } from '@/alan/raporDonemi'

const simdi = new Date('2026-11-14T10:00:00Z')
const d = (k: string, b?: string, s?: string) => raporDonemi(k, b, s, simdi) as RaporDonemi

describe('rapor dönemleri', () => {
  it('hazır dönemler Türkiye takvimine göre', () => {
    expect(d('gecen-ay')).toMatchObject({ ad: 'Ekim 2026', bas: new Date('2026-09-30T21:00:00Z'), bit: new Date('2026-10-31T21:00:00Z') })
    expect(d('bu-ceyrek').bas).toEqual(new Date('2026-09-30T21:00:00Z'))
    expect(d('gecen-ceyrek').ad).toBe('2026 3. çeyrek')
    expect(d('gecen-yil')).toMatchObject({ ad: '2025', bas: new Date('2024-12-31T21:00:00Z') })
    expect(d('bu-ay').bit).toEqual(new Date('2026-11-14T21:00:00Z'))
  })
  it('özel aralık denetlenir', () => {
    expect(d('ozel', '2026-01-05', '2026-01-31')).toMatchObject({ ad: '5 Ocak 2026 – 31 Ocak 2026', bit: new Date('2026-01-31T21:00:00Z') })
    expect(raporDonemi('ozel', '2026-02-01', '2026-01-01', simdi)).toEqual({ hata: 'Bitiş günü başlangıç gününden önce olamaz.' })
    expect('hata' in raporDonemi('ozel', '', '', simdi)).toBe(true)
  })
  it('aylık kırılım dönem sınırlarına kırpılır', () => {
    const a = donemAylari(d('ozel', '2026-01-15', '2026-03-10'))
    expect(a.map((x) => x.ad)).toEqual(['Ocak 2026', 'Şubat 2026', 'Mart 2026'])
    expect(a[0]!.bas).toEqual(new Date('2026-01-14T21:00:00Z'))
    expect(a[2]!.bit).toEqual(new Date('2026-03-10T21:00:00Z'))
  })
})
