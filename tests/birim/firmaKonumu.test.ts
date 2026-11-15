import { describe, expect, it } from 'vitest'
import { konumAyristir } from '@/alan/firmaKonumu'

describe('firma konumu', () => {
  it('blok ve odayı ayırır, rengi bloktan verir', () => {
    expect(konumAyristir('D Blok 208')).toMatchObject({ blok: 'D', oda: '208', renk: 'd' })
    expect(konumAyristir('B Blok G19')).toMatchObject({ blok: 'B', oda: 'G19', renk: 'b' })
    expect(konumAyristir('c blok 302-03')).toMatchObject({ blok: 'C', oda: '302-03', renk: 'c' })
    expect(konumAyristir('A Blok 12')).toMatchObject({ blok: 'A', renk: 'diger' })
  })
  it('blok yazmayan konumu kısa kod olarak gösterir', () => {
    expect(konumAyristir('Kuluçka merkezi')).toMatchObject({ blok: null, renk: 'diger', kod: 'Kuluç' })
    expect(konumAyristir('')).toMatchObject({ kod: '—' })
  })
})

import { logoAdresi, logoDosyaAdi } from '@/alan/firmaLogosu'
describe('firma logosu', () => {
  it('depo adı firma kimliğini ve zamanı taşır', () => {
    expect(logoDosyaAdi(12, 'image/png', new Date('2026-11-15T14:32:05Z'))).toBe('firma-12-logo-20261115-143205.png')
    expect(logoDosyaAdi('7', 'image/jpeg', new Date('2026-01-02T03:04:05Z'))).toBe('firma-7-logo-20260102-030405.jpg')
  })
  it('adres kimlikten ya da doldurulmuş belgeden çıkar; geçersizde null', () => {
    expect(logoAdresi(37)).toBe('/firma-logosu/37')
    expect(logoAdresi({ id: 37, filename: 'x.png' })).toBe('/firma-logosu/37')
    expect(logoAdresi(null)).toBeNull()
    expect(logoAdresi('../x')).toBeNull()
  })
})
