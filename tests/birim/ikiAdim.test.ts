import { describe, expect, it } from 'vitest'
import { base32Oku, base32Yaz, gruplu, hotp, ikiAdimZorunluMu, kurtarmaKoduNormal, kurtarmaKodlariUret, otpauthAdresi, totpDogrula, zamanAdimi } from '@/alan/ikiAdim'

// RFC 6238 ek B: gizli anahtar "12345678901234567890" (ASCII); 8 haneli değerlerin son 6 hanesi
const GIZLI = base32Yaz(new TextEncoder().encode('12345678901234567890'))

describe('TOTP (RFC 6238 test değerleri)', () => {
  it('base32 gidiş-dönüş', () => {
    expect(GIZLI).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ')
    expect(new TextDecoder().decode(base32Oku(gruplu(GIZLI).toLowerCase()))).toBe('12345678901234567890')
  })
  it('resmî zamanlarda doğru kodu üretir', async () => {
    for (const [t, kod] of [[59, '287082'], [1111111109, '081804'], [1234567890, '005924'], [2000000000, '279037']] as const)
      expect(await hotp(GIZLI, zamanAdimi(new Date(t * 1000)))).toBe(kod)
  })
  it('önceki ve sonraki adım kabul, daha uzağı ret; kullanılmış adım tekrar kullanılamaz', async () => {
    const an = new Date(1234567890 * 1000)
    const adim = zamanAdimi(an)
    expect(await totpDogrula(GIZLI, '005924', an)).toBe(adim)
    expect(await totpDogrula(GIZLI, '005 924', an)).toBe(adim)
    expect(await totpDogrula(GIZLI, await hotp(GIZLI, adim - 1), an)).toBe(adim - 1)
    expect(await totpDogrula(GIZLI, await hotp(GIZLI, adim + 1), an)).toBe(adim + 1)
    expect(await totpDogrula(GIZLI, await hotp(GIZLI, adim + 2), an)).toBeNull()
    expect(await totpDogrula(GIZLI, '005924', an, adim)).toBeNull() // aynı kod ikinci kez
    expect(await totpDogrula(GIZLI, 'abc123', an)).toBeNull()
  })
})

describe('kurtarma kodları ve kurallar', () => {
  it('10 benzersiz kod, “abcd-efgh” biçiminde, karışan harf yok; yazım farkı önemsiz', () => {
    const k = kurtarmaKodlariUret()
    expect(k).toHaveLength(10)
    expect(new Set(k).size).toBe(10)
    for (const x of k) expect(x).toMatch(/^[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}$/)
    expect(kurtarmaKoduNormal(' ABCD-efgh ')).toBe('abcdefgh')
  })
  it('karekod adresi uygulamaların beklediği biçimde', () => {
    expect(otpauthAdresi('ABC', 'ayse@ornek.com')).toBe('otpauth://totp/TeknoKariyer%3Aayse%40ornek.com?secret=ABC&issuer=TeknoKariyer&algorithm=SHA1&digits=6&period=30')
  })
  it('firma ve kurum rollerinde zorunlu, adayda değil', () => {
    expect(['firma', 'yonetici', 'moderator', 'raporlayici'].every(ikiAdimZorunluMu)).toBe(true)
    expect(ikiAdimZorunluMu('aday')).toBe(false)
  })
})
