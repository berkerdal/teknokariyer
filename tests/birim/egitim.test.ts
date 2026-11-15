import { describe, expect, it } from 'vitest'
import { EGITIM_DUZEYI_SIMGE, anaEgitimAlanlari, egitimSatiri, egitimSinifi, egitimleriSirala, sinifSecenekleri } from '@/alan/egitim'

const satir = (v: Record<string, unknown>) => ({ duzey: 'lisans', okul: 1, bolum: 2, devam: false, ...v })
const egitim = (v: Record<string, unknown>) => {
  const r = egitimSatiri(satir(v), 0, 2026)
  if ('hata' in r) throw new Error(r.hata)
  return r.egitim
}

describe('eğitim satırı', () => {
  it('okul ve (lise dışında) bölüm zorunlu; tarih tutarsızlıkları açıklamayla reddedilir', () => {
    expect(egitimSatiri(satir({ okul: null }), 0, 2026)).toEqual({ hata: '1. eğitim: okulunu listeden seç.' })
    expect(egitimSatiri(satir({ bolum: null }), 1, 2026)).toEqual({ hata: '2. eğitim: bölümünü listeden seç.' })
    expect('egitim' in egitimSatiri(satir({ duzey: 'lise', okul: null, okulAdi: 'Denizli Anadolu Lisesi', bolum: null }), 0, 2026)).toBe(true)
    expect(egitimSatiri(satir({ bitisYil: 2028 }), 0, 2026)).toMatchObject({ hata: expect.stringContaining('Hâlâ okuyorum') })
    expect(egitimSatiri(satir({ baslangicYil: 2024, bitisYil: 2020 }), 0, 2026)).toMatchObject({ hata: expect.stringContaining('başlangıç yılından önce') })
  })

  it('sınıf yalnızca önlisans ve lisansta, düzeye uygun değerle saklanır', () => {
    expect(sinifSecenekleri('onlisans')).toEqual(['Hazırlık', '1. sınıf', '2. sınıf'])
    expect(sinifSecenekleri('lisans')).toContain('4. sınıf')
    for (const d of ['lise', 'yuksek-lisans', 'doktora']) expect(sinifSecenekleri(d)).toEqual([])
    expect(egitim({ devam: true, sinif: '3. sınıf' }).sinif).toBe('3. sınıf')
    expect(egitim({ duzey: 'onlisans', devam: true, sinif: '3. sınıf' }).sinif).toBeNull()
    expect(egitim({ duzey: 'lisans', devam: true, sinif: 'Doktora' }).sinif).toBeNull()
    expect(egitim({ duzey: 'doktora', devam: true, sinif: '2. sınıf' }).sinif).toBeNull()
    expect(egitim({ devam: false, sinif: '3. sınıf' }).sinif).toBeNull()
  })

  it('başvuru kurallarına giden sınıf: yüksek lisans ve doktorada düzeyin kendisi', () => {
    expect(egitimSinifi({ duzey: 'yuksek-lisans', devam: true, sinif: null })).toBe('Yüksek lisans')
    expect(egitimSinifi({ duzey: 'doktora', devam: true, sinif: null })).toBe('Doktora')
    expect(egitimSinifi({ duzey: 'doktora', devam: false, sinif: null })).toBeNull()
    expect(egitimSinifi({ duzey: 'lisans', devam: true, sinif: '2. sınıf' })).toBe('2. sınıf')
  })

  it('düzey simgeleri: DR, YL, ÖL, L', () => {
    expect(EGITIM_DUZEYI_SIMGE).toEqual({ lise: 'L', onlisans: 'ÖL', lisans: 'L', 'yuksek-lisans': 'YL', doktora: 'DR' })
  })
})

describe('ana eğitim', () => {
  it('devam eden önce, sonra en son biten; üst alanlar ondan türetilir', () => {
    const lisans = egitim({ okul: 5, bolum: 6, bitisAy: 7, bitisYil: 2024, gano: '3,57' })
    const doktora = egitim({ duzey: 'doktora', okul: 7, bolum: 8, devam: true, bitisAy: 7, bitisYil: 2029 })
    expect(egitimleriSirala([lisans, doktora])[0]).toBe(doktora)
    expect(anaEgitimAlanlari([lisans, doktora])).toMatchObject({ okul: 7, bolum: 8, sinif: 'Doktora', gano: null })
    expect(anaEgitimAlanlari([lisans])).toMatchObject({ okul: 5, sinif: null, gano: 3.57, mezuniyet: '2024-07-15T00:00:00.000Z' })
    expect(anaEgitimAlanlari([])).toMatchObject({ okul: null, mezuniyet: null })
  })
})
