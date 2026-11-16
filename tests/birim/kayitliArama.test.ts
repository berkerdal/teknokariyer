import { describe, expect, it } from 'vitest'
import { haftalikZamaniMi, havuzSorgusu, ilanAramaOzeti, ilanAramayaUyarMi, ilanSorgusu } from '@/alan/kayitliArama'
import type { IlanOzeti } from '@/alan/ilanFiltre'

const ilan = (v: Partial<IlanOzeti> = {}): IlanOzeti => ({
  id: 1, pozisyonAdi: 'React Geliştirici', firma: { id: 1, ad: 'Kodpit', slug: 'kodpit', konum: 'D Blok 208' }, tur: 'is', altTur: 'tam-zamanli',
  model: 'uzaktan', deneyim: '1-3', aile: 'Yazılım', ucretliStaj: false, pauOncelik: false, sonBasvuru: '2026-12-20T00:00:00Z', arama: 'react gelistirici kodpit', ...v,
})

describe('kayıtlı ilan araması', () => {
  it('sorgu ortak biçime getirilir: sıralama ve tanınmayan değerler atılır', () => {
    expect(ilanSorgusu('?model=uzaktan&tur=staj&sira=son-tarih&model=uzay').sorgu).toBe('tur=staj&model=uzaktan')
    expect(ilanSorgusu('').sorgu).toBe('')
  })
  it('özet okunur; filtresiz arama “Bütün ilanlar”', () => {
    expect(ilanAramaOzeti(ilanSorgusu('ara=react&tur=staj&model=uzaktan&ucretli=1').filtre)).toBe('“react” · Staj · Uzaktan · Ücretli staj')
    expect(ilanAramaOzeti(ilanSorgusu('').filtre)).toBe('Bütün ilanlar')
  })
  it('ilan aramaya uyar mı', () => {
    expect(ilanAramayaUyarMi(ilan(), 'ara=react&model=uzaktan')).toBe(true)
    expect(ilanAramayaUyarMi(ilan(), 'tur=staj')).toBe(false)
    expect(ilanAramayaUyarMi(ilan(), 'ara=flutter')).toBe(false)
    expect(ilanAramayaUyarMi(ilan(), '')).toBe(true)
  })
})

describe('kayıtlı havuz araması ve haftalık zaman', () => {
  it('beceriler sıralanır, tekrarlar ve geçersizler atılır; tek beceride koşul yazılmaz', () => {
    expect(havuzSorgusu('beceri=9&beceri=3&beceri=9&beceri=x&kosul=herhangi')).toEqual({ beceriler: [3, 9], kosul: 'herhangi', sorgu: 'beceri=3&beceri=9&kosul=herhangi' })
    expect(havuzSorgusu('beceri=5&kosul=herhangi').sorgu).toBe('beceri=5')
  })
  it('haftalık: son bildirimden 7 gün (12 saat pay) sonra', () => {
    const son = new Date('2026-11-09T07:00:00Z')
    expect(haftalikZamaniMi(son, new Date('2026-11-15T20:00:00Z'))).toBe(true)
    expect(haftalikZamaniMi(son, new Date('2026-11-15T18:00:00Z'))).toBe(false)
  })
})
