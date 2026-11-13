import { describe, expect, it } from 'vitest'
import { adimKareleri, basvuruEksikleri, geriCekilebilirMi, type BasvuruProfili } from '@/alan/basvuru'

const tam: BasvuruProfili = { okul: 'PAÜ', bolum: 'Bilgisayar Mühendisliği', deneyim: 'ogrenci', sinif: '4. sınıf', mezuniyet: '2027-06-15', diller: [{ dil: 'İngilizce' }] }

describe('başvuru öncesi eksikler', () => {
  it('profili tam aday için eksik yok', () => {
    expect(basvuruEksikleri({ tur: 'staj', diller: [{ dil: 'İngilizce', seviye: 'B1' }] }, tam)).toEqual([])
  })
  it('yalnızca ilanın gerektirdikleri sorulur', () => {
    const p: BasvuruProfili = { ...tam, sinif: null, mezuniyet: null, diller: [] }
    expect(basvuruEksikleri({ tur: 'is', diller: [{ dil: 'İngilizce', seviye: 'B1' }] }, p)).toEqual(['mezuniyet', 'dil:İngilizce'])
    expect(basvuruEksikleri({ tur: 'staj', diller: [] }, p)).toEqual(['sinif', 'mezuniyet'])
  })
  it('deneyimli adaydan mezuniyet tarihi istenmez', () => {
    expect(basvuruEksikleri({ tur: 'is', diller: [] }, { ...tam, deneyim: '3-5', mezuniyet: null })).toEqual([])
  })
  it('boş profil: temel üç bilgi', () => {
    expect(basvuruEksikleri({ tur: 'is', diller: [] }, { diller: [] })).toEqual(['okul', 'bolum', 'deneyim', 'mezuniyet'])
  })
})

describe('başvuru durumu', () => {
  it('ilerleme kareleri', () => {
    expect(adimKareleri('alindi')).toEqual(['simdi', '', '', '', ''])
    expect(adimKareleri('gorusme')).toEqual(['gecti', 'gecti', 'simdi', '', ''])
    expect(adimKareleri('olumsuz')).toEqual(['gecti', 'gecti', 'gecti', 'gecti', 'olumsuz'])
    expect(adimKareleri('olumlu')).toEqual(['gecti', 'gecti', 'gecti', 'gecti', 'gecti'])
  })
  it('karar verilmeden geri çekilebilir', () => {
    expect(['alindi', 'inceleniyor', 'gorusme', 'olumsuz'].map(geriCekilebilirMi)).toEqual([true, true, false, false])
  })
})
