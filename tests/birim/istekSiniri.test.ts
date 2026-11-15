import { describe, expect, it } from 'vitest'
import { SINIRLAR, kalanDakika, pencereBasi, sinirMesaji } from '@/alan/istekSiniri'

describe('istek sınırı kuralları', () => {
  it('pencere dakikanın katına hizalanır; kalan süre en az 1 dakika', () => {
    const an = new Date('2026-11-15T09:07:30Z')
    expect(pencereBasi(an, 15).toISOString()).toBe('2026-11-15T09:00:00.000Z')
    expect(kalanDakika(an, 15)).toBe(8)
    expect(kalanDakika(new Date('2026-11-15T09:14:59Z'), 15)).toBe(1)
  })
  it('mesaj hitaba göre ve kalan süreyle', () => {
    const an = new Date('2026-11-15T09:50:00Z')
    expect(sinirMesaji('kayit', an, false)).toBe('Kısa sürede çok sayıda hesap açma denemesi yapıldı. Güvenliğin için 10 dakika sonra yeniden dene.')
    expect(sinirMesaji('giris', an, true)).toMatch(/Güvenliğiniz için 10 dakika sonra yeniden deneyin\.$/)
  })
  it('her eylemin sınırı makul', () => {
    for (const s of Object.values(SINIRLAR)) {
      expect(s.sayi).toBeGreaterThanOrEqual(5)
      expect(s.dakika).toBeGreaterThanOrEqual(15)
    }
  })
})
