import { describe, expect, it } from 'vitest'
import {
  BOS_FILTRE,
  aktifFiltreSayisi,
  bosDurumOnerisi,
  fasetler,
  filtreAdresi,
  filtreDegistir,
  filtreOku,
  filtrele,
  sirala,
  ucretliStajSayisi,
  type IlanOzeti,
} from '@/alan/ilanFiltre'
import { aramaMetni } from '@/alan/metin'

const ilan = (id: number, v: Partial<IlanOzeti>): IlanOzeti => {
  const t: IlanOzeti = {
    id,
    pozisyonAdi: 'Geliştirici',
    firma: { id: 1, ad: 'Kodpit', slug: 'kodpit', konum: 'D Blok 208' },
    tur: 'is',
    altTur: 'tam-zamanli',
    model: 'hibrit',
    deneyim: '1-3',
    aile: 'Yazılım',
    ucretliStaj: false,
    pauOncelik: false,
    sonBasvuru: '2026-12-01T00:00:00.000Z',
    yayinTarihi: `2026-11-${String(id).padStart(2, '0')}T00:00:00.000Z`,
    arama: '',
    ...v,
  }
  return { ...t, arama: aramaMetni([t.pozisyonAdi, t.firma.ad, t.aile]) }
}

const ILANLAR = [
  ilan(1, { pozisyonAdi: 'Flutter Geliştirici' }),
  ilan(2, { tur: 'staj', altTur: 'yaz-staji', deneyim: 'ogrenci', model: 'ofiste', ucretliStaj: true }),
  ilan(3, { tur: 'staj', altTur: 'zorunlu-staj', deneyim: 'ogrenci', model: 'ofiste', aile: 'Donanım' }),
  ilan(4, { model: 'uzaktan', pozisyonAdi: 'Gömülü Yazılım Mühendisi', aile: 'Donanım', firma: { id: 2, ad: 'Ratel', slug: 'ratel', konum: 'D Blok 102' } }),
]

describe('ilan filtreleri', () => {
  it('gruplar kendi içinde “veya”, gruplar arasında “ve” ile çalışır', () => {
    expect(filtrele(ILANLAR, { ...BOS_FILTRE, model: ['ofiste', 'uzaktan'] }).map((i) => i.id)).toEqual([2, 3, 4])
    expect(filtrele(ILANLAR, { ...BOS_FILTRE, model: ['ofiste'], aile: ['Donanım'] }).map((i) => i.id)).toEqual([3])
  })
  it('ücretli staj yalnızca ücretli stajları bırakır', () => {
    expect(filtrele(ILANLAR, { ...BOS_FILTRE, ucretli: true }).map((i) => i.id)).toEqual([2])
    expect(ucretliStajSayisi(ILANLAR, BOS_FILTRE)).toBe(1)
  })
  it('arama Türkçe karakterden bağımsızdır', () => {
    expect(filtrele(ILANLAR, { ...BOS_FILTRE, ara: 'gomulu' }).map((i) => i.id)).toEqual([4])
    expect(filtrele(ILANLAR, { ...BOS_FILTRE, ara: 'RATEL' }).map((i) => i.id)).toEqual([4])
  })
  it('faset sayıları diğer filtreler uygulanmış hâli gösterir; sonuçsuz seçenek düşer', () => {
    const f = fasetler(ILANLAR, { ...BOS_FILTRE, tur: ['staj'] })
    const tur = f.find((x) => x.k === 'tur')!
    expect(tur.secenekler.map((s) => [s.deger, s.sayi, s.secili])).toEqual([['staj', 2, true], ['is', 2, false]])
    const model = f.find((x) => x.k === 'model')!
    expect(model.secenekler.map((s) => [s.deger, s.sayi])).toEqual([['ofiste', 2]])
    const aile = f.find((x) => x.k === 'aile')!
    expect(aile.secenekler.map((s) => s.ad)).toEqual(['Donanım', 'Yazılım'])
  })
  it('sonuç yoksa en çok sonuç getiren filtreyi önerir', () => {
    const f = { ...BOS_FILTRE, model: ['uzaktan'], tur: ['staj'] }
    expect(filtrele(ILANLAR, f)).toHaveLength(0)
    expect(bosDurumOnerisi(ILANLAR, f)).toEqual({ k: 'model', deger: 'uzaktan', ad: 'Uzaktan', sayi: 2 })
  })
  it('sıralama: en yeni veya son başvuru tarihi yakın', () => {
    expect(sirala(ILANLAR, 'yeni').map((i) => i.id)).toEqual([4, 3, 2, 1])
    const s = sirala([ilan(1, { sonBasvuru: '2026-12-05' }), ilan(2, { sonBasvuru: '2026-11-20' })], 'son-tarih')
    expect(s.map((i) => i.id)).toEqual([2, 1])
  })
  it('adres ↔ filtre gidiş dönüşü; geçersiz değerler düşer', () => {
    const f = { ...BOS_FILTRE, tur: ['staj'], model: ['hibrit', 'uzaktan'], ucretli: true, ara: 'flutter' }
    const adres = filtreAdresi(f)
    expect(adres).toBe('?tur=staj&model=hibrit&model=uzaktan&ucretli=1&ara=flutter')
    expect(filtreOku(Object.fromEntries([...new URLSearchParams(adres).keys()].map((k) => [k, new URLSearchParams(adres).getAll(k)])))).toEqual(f)
    expect(filtreOku({ tur: ['staj', 'gizli'], sira: 'tuhaf' })).toEqual({ ...BOS_FILTRE, tur: ['staj'] })
    expect(filtreAdresi(BOS_FILTRE)).toBe('')
  })
  it('filtre değiştirme ve aktif filtre sayısı', () => {
    const f = filtreDegistir(filtreDegistir(BOS_FILTRE, 'tur', 'staj'), 'ucretli')
    expect(aktifFiltreSayisi(f)).toBe(2)
    expect(filtreDegistir(f, 'tur', 'staj').tur).toEqual([])
  })
})
