import { describe, expect, it } from 'vitest'
import {
  duzenlemeSonucu, enGecSonBasvuruTarihi, ilanKopyasi, islemYapilabilirMi, kalanGun, sonBasvuruTarihiHatasi,
  suresiDolduMu, yapilabilecekIslemler, yayinaGonderSonucu,
} from '@/alan/ilan'

const bugun = new Date(2026, 10, 13) // 13 Kasım 2026

describe('onay kuralı (K4)', () => {
  it('güvenilir olmayan firmanın ilk 3 ilanı onaya gider', () => {
    expect(yayinaGonderSonucu({ guvenilir: false, onaylanmisIlanSayisi: 0 })).toBe('onayda')
    expect(yayinaGonderSonucu({ guvenilir: false, onaylanmisIlanSayisi: 2 })).toBe('onayda')
  })
  it('3 ilanı onaylanan firma doğrudan yayınlar', () => {
    expect(yayinaGonderSonucu({ guvenilir: false, onaylanmisIlanSayisi: 3 })).toBe('yayinda')
  })
  it('güvenilir firma her zaman doğrudan yayınlar', () => {
    expect(yayinaGonderSonucu({ guvenilir: true, onaylanmisIlanSayisi: 0 })).toBe('yayinda')
  })
})

describe('son başvuru tarihi', () => {
  it('en fazla 60 gün sonrası seçilebilir; 60. gün dahil', () => {
    expect(enGecSonBasvuruTarihi(bugun)).toEqual(new Date(2027, 0, 12))
    expect(sonBasvuruTarihiHatasi(new Date(2027, 0, 12), bugun)).toBeNull()
    expect(sonBasvuruTarihiHatasi(new Date(2027, 0, 13), bugun)).toBe('cok-uzak')
  })
  it('bugün veya geçmiş seçilemez', () => {
    expect(sonBasvuruTarihiHatasi(bugun, bugun)).toBe('gecmis')
    expect(sonBasvuruTarihiHatasi(new Date(2026, 10, 14), bugun)).toBeNull()
  })
  it('son gün boyunca ilan açıktır; ertesi gün süresi dolar', () => {
    const son = new Date(2026, 10, 15)
    expect(suresiDolduMu(son, new Date(2026, 10, 15, 23, 59))).toBe(false)
    expect(suresiDolduMu(son, new Date(2026, 10, 16, 0, 1))).toBe(true)
    expect(kalanGun(son, bugun)).toBe(2)
  })
})

describe('firmanın ilan işlemleri (K1)', () => {
  it('her durumda yalnızca anlamlı işlemler sunulur', () => {
    expect(yapilabilecekIslemler('yayinda')).toEqual(expect.arrayContaining(['duzenle', 'duraklat', 'sure-uzat', 'kapat', 'kopyala']))
    expect(islemYapilabilirMi('duraklat', 'taslak')).toBe(false)
    expect(islemYapilabilirMi('yeniden-baslat', 'duraklatildi')).toBe(true)
    expect(islemYapilabilirMi('yeniden-yayinla', 'kapandi')).toBe(true)
    expect(islemYapilabilirMi('sil', 'yayinda')).toBe(false)
  })
})

describe('esaslı değişiklik', () => {
  const eski = { pozisyonAdi: 'Flutter Geliştirici', isTanimi: 'Eski metin', ucretEnAz: 45000, sonBasvuru: '2026-12-06' }
  const yeni = { ...eski, isTanimi: 'Yeni metin', ucretEnAz: 50000, sonBasvuru: '2026-12-20' }
  it('ücret değişikliği onaya gider, yazım ve tarih hemen yansır', () => {
    expect(duzenlemeSonucu(eski, yeni, false)).toEqual({ hemen: ['isTanimi', 'sonBasvuru'], onaya: ['ucretEnAz'] })
  })
  it('güvenilir firmada her şey hemen yansır', () => {
    expect(duzenlemeSonucu(eski, yeni, true).onaya).toEqual([])
  })
})

describe('kopyalama', () => {
  it('tarih, durum ve sayaçlar sıfırlanır; içerik korunur', () => {
    const k = ilanKopyasi({ id: '9', durum: 'kapandi', sonBasvuru: '2026-10-03', basvuruSayisi: 41, pozisyonAdi: 'iOS Geliştirici', zorunluBeceriler: ['Swift'] })
    expect(k).toEqual({ durum: 'taslak', pozisyonAdi: 'iOS Geliştirici', zorunluBeceriler: ['Swift'] })
  })
})

import { trGunBasi, trGunFarki } from '@/alan/tarih'
describe('Türkiye saati', () => {
  it('UTC 22:30 Türkiye’de ertesi gündür', () => {
    const an = new Date(Date.UTC(2026, 10, 13, 22, 30)) // TR: 14 Kasım 01:30
    expect(trGunBasi(an).toISOString()).toBe('2026-11-13T21:00:00.000Z') // TR 14 Kasım 00:00
    expect(trGunFarki(new Date(Date.UTC(2026, 10, 13, 20, 0)), an)).toBe(1)
  })
})

describe('gün sınırı sunucu saat diliminden bağımsız (Workers UTC çalışır)', () => {
  it('son gün Türkiye saatiyle 23:59’a kadar sürer', () => {
    const son = new Date('2026-11-15T09:00:00Z') // 15 Kasım, Türkiye 12:00
    expect(suresiDolduMu(son, new Date('2026-11-15T20:59:00Z'))).toBe(false) // TR 23:59
    expect(suresiDolduMu(son, new Date('2026-11-15T21:01:00Z'))).toBe(true) // TR 16 Kasım 00:01
    expect(kalanGun(son, new Date('2026-11-14T22:30:00Z'))).toBe(0) // TR 15 Kasım 01:30: son gün
  })
})
