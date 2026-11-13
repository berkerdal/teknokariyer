import { describe, expect, it } from 'vitest'
import {
  basvuruAraligi, filtreAlaniIzinliMi, firmaGorebilirMi, havuzOzeti, rizaGecerliMi, sonOtuzGundeGoruntuleyenFirmaSayisi,
  type HavuzAdayi,
} from '@/alan/havuz'

const simdi = new Date(2026, 10, 13)
const aday: HavuzAdayi = {
  id: '1', kod: 'A-1042', ad: 'Oğuzhan Polat', eposta: 'oguzhan@ornek.com', cinsiyet: 'erkek',
  bolum: 'Bilgisayar Mühendisliği', beceriler: ['Flutter'], diller: ['İngilizce B2'], gorunurluk: 'aktif',
  rizaTarihi: new Date(2026, 1, 1), gizlenenFirmalar: ['kodpit'],
}

describe('sayaç (K23)', () => {
  it('aralıkla gösterilir', () => {
    expect([0, 9, 10, 50, 51].map(basvuruAraligi)).toEqual([
      '10’dan az başvuru', '10’dan az başvuru', '10–50 başvuru', '10–50 başvuru', '50’den fazla başvuru',
    ])
  })
})

describe('havuz rızası', () => {
  it('12 ay geçerlidir', () => {
    expect(rizaGecerliMi(new Date(2025, 10, 14), simdi)).toBe(true)
    expect(rizaGecerliMi(new Date(2025, 10, 13), simdi)).toBe(false)
    expect(rizaGecerliMi(null, simdi)).toBe(false)
  })
})

describe('görünürlük (K24, K25)', () => {
  it('arama özetinde ad ve iletişim yok, cinsiyet var', () => {
    const o = havuzOzeti(aday) as unknown as Record<string, unknown>
    expect(o.ad).toBeUndefined()
    expect(o.eposta).toBeUndefined()
    expect(o.telefon).toBeUndefined()
    expect(o.cinsiyet).toBe('erkek')
  })
  it('gizli aday ve gizlendiği firma görmez', () => {
    expect(firmaGorebilirMi(aday, 'kodpit', simdi)).toBe(false)
    expect(firmaGorebilirMi(aday, 'bulutfon', simdi)).toBe(true)
    expect(firmaGorebilirMi({ ...aday, gorunurluk: 'gizli' }, 'bulutfon', simdi)).toBe(false)
    expect(firmaGorebilirMi({ ...aday, rizaTarihi: new Date(2025, 0, 1) }, 'bulutfon', simdi)).toBe(false)
  })
  it('cinsiyete göre filtre reddedilir', () => {
    expect(filtreAlaniIzinliMi('cinsiyet')).toBe(false)
    expect(filtreAlaniIzinliMi('beceriler')).toBe(true)
  })
  it('aday yalnızca son 30 gündeki görüntüleyen firma sayısını görür (K5)', () => {
    const g = [
      { firmaId: 'a', tarih: new Date(2026, 10, 1) }, { firmaId: 'a', tarih: new Date(2026, 10, 2) },
      { firmaId: 'b', tarih: new Date(2026, 9, 20) }, { firmaId: 'c', tarih: new Date(2026, 8, 1) },
    ]
    expect(sonOtuzGundeGoruntuleyenFirmaSayisi(g, simdi)).toBe(2)
  })
})
