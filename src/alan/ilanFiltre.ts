/**
 * İlan listesi filtreleri (talimatlar 3; prototip “İlan listesi ve filtreler”).
 * - Yüzlü filtre: her seçeneğin yanında, diğer filtreler uygulanmış hâldeki sonuç sayısı yazar.
 * - Sonuç vermeyecek seçenek pasiftir. Sonuç kalmazsa hangi filtrenin kaldırılacağı önerilir.
 * - Filtreler adreste tutulur (paylaşılabilir, geri tuşu çalışır).
 * Saf fonksiyonlar: veri katmanından bağımsız, birim testli.
 */
import { DENEYIM_ADI, DENEYIM_SIRASI, MODEL_ADI, type CalismaModeli, type Deneyim } from './eslesme'
import { aramayaUyar } from './metin'

export type IlanTuru = 'is' | 'staj'
export const TUR_ADI: Record<IlanTuru, string> = { staj: 'Staj', is: 'İş' }

export const ALT_TUR_ADI: Record<string, string> = {
  'tam-zamanli': 'Tam zamanlı',
  'yari-zamanli': 'Yarı zamanlı',
  proje: 'Proje bazlı',
  'zorunlu-staj': 'Zorunlu staj',
  'gonullu-staj': 'Gönüllü staj',
  'uzun-donem-staj': 'Uzun dönem staj',
  'yaz-staji': 'Yaz stajı',
}

/** Listede ve önizlemede gereken ilan özeti. */
export interface IlanOzeti {
  id: number
  pozisyonAdi: string
  firma: { id: number; ad: string; slug: string; konum: string; sektor?: string }
  tur: IlanTuru
  altTur: string
  model: CalismaModeli
  deneyim: Deneyim
  aile?: string
  ucretliStaj: boolean
  pauOncelik: boolean
  sonBasvuru: string
  yayinTarihi?: string
  /** Normalleştirilmiş aranabilir metin (pozisyon, firma, beceriler, aile). */
  arama: string
}

export type Siralama = 'yeni' | 'son-tarih'

export interface IlanFiltresi {
  tur: string[]
  model: string[]
  deneyim: string[]
  aile: string[]
  ucretli: boolean
  ara: string
  sira: Siralama
}

export const BOS_FILTRE: IlanFiltresi = { tur: [], model: [], deneyim: [], aile: [], ucretli: false, ara: '', sira: 'yeni' }

type GrupAnahtari = 'tur' | 'model' | 'deneyim' | 'aile'
type Haric = GrupAnahtari | 'ucretli' | null

interface Grup {
  k: GrupAnahtari
  ad: string
  deger: (i: IlanOzeti) => string | undefined
  /** Sabit seçenekler (değer, ad); aile için ilanlardan türetilir. */
  secenekler?: Array<[string, string]>
}

export const FILTRE_GRUPLARI: Grup[] = [
  { k: 'tur', ad: 'İlan türü', deger: (i) => i.tur, secenekler: [['staj', 'Staj'], ['is', 'İş']] },
  { k: 'model', ad: 'Çalışma modeli', deger: (i) => i.model, secenekler: Object.entries(MODEL_ADI) },
  { k: 'deneyim', ad: 'Deneyim', deger: (i) => i.deneyim, secenekler: DENEYIM_SIRASI.map((d) => [d, DENEYIM_ADI[d]]) },
  { k: 'aile', ad: 'Pozisyon ailesi', deger: (i) => i.aile },
]

export function filtrele(ilanlar: IlanOzeti[], f: IlanFiltresi, haric: Haric = null): IlanOzeti[] {
  return ilanlar.filter((i) => {
    for (const g of FILTRE_GRUPLARI) {
      if (g.k === haric) continue
      const secili = f[g.k]
      if (secili.length && !secili.includes(g.deger(i) ?? '')) return false
    }
    if (haric !== 'ucretli' && f.ucretli && !(i.tur === 'staj' && i.ucretliStaj)) return false
    if (f.ara.trim() && !aramayaUyar(f.ara, i.arama)) return false
    return true
  })
}

export function sirala(ilanlar: IlanOzeti[], sira: Siralama): IlanOzeti[] {
  const z = (s?: string) => (s ? new Date(s).getTime() : 0)
  return [...ilanlar].sort((a, b) =>
    sira === 'son-tarih' ? z(a.sonBasvuru) - z(b.sonBasvuru) || b.id - a.id : z(b.yayinTarihi) - z(a.yayinTarihi) || b.id - a.id,
  )
}

export interface FasetSecenegi {
  deger: string
  ad: string
  sayi: number
  secili: boolean
}
export interface Faset {
  k: GrupAnahtari
  ad: string
  secenekler: FasetSecenegi[]
}

/** Her grup için seçenekler ve sayıları. Sonuç vermeyen ve seçili olmayan seçenek listeden düşer. */
export function fasetler(ilanlar: IlanOzeti[], f: IlanFiltresi): Faset[] {
  return FILTRE_GRUPLARI.map((g) => {
    const taban = filtrele(ilanlar, f, g.k)
    const secenekler =
      g.secenekler ??
      [...new Set(ilanlar.map(g.deger).filter((x): x is string => Boolean(x)))]
        .sort((a, b) => a.localeCompare(b, 'tr'))
        .map((x): [string, string] => [x, x])
    return {
      k: g.k,
      ad: g.ad,
      secenekler: secenekler
        .map(([deger, ad]) => ({ deger, ad, sayi: taban.filter((i) => g.deger(i) === deger).length, secili: f[g.k].includes(deger) }))
        .filter((s) => s.sayi > 0 || s.secili),
    }
  })
}

export function ucretliStajSayisi(ilanlar: IlanOzeti[], f: IlanFiltresi): number {
  return filtrele(ilanlar, f, 'ucretli').filter((i) => i.tur === 'staj' && i.ucretliStaj).length
}

export function aktifFiltreSayisi(f: IlanFiltresi): number {
  return f.tur.length + f.model.length + f.deneyim.length + f.aile.length + (f.ucretli ? 1 : 0)
}

export interface BosDurumOnerisi {
  k: GrupAnahtari | 'ucretli'
  deger: string
  ad: string
  sayi: number
}

/** Sonuç yoksa: hangi tek filtre kaldırılırsa en çok sonuç gelir? */
export function bosDurumOnerisi(ilanlar: IlanOzeti[], f: IlanFiltresi): BosDurumOnerisi | null {
  let en: BosDurumOnerisi | null = null
  for (const g of FILTRE_GRUPLARI) {
    for (const d of f[g.k]) {
      const n = filtrele(ilanlar, { ...f, [g.k]: f[g.k].filter((x) => x !== d) }).length
      if (n && (!en || n > en.sayi)) en = { k: g.k, deger: d, ad: secenekAdi(g.k, d), sayi: n }
    }
  }
  if (f.ucretli) {
    const n = filtrele(ilanlar, { ...f, ucretli: false }).length
    if (n && (!en || n > en.sayi)) en = { k: 'ucretli', deger: '1', ad: 'Ücretli staj', sayi: n }
  }
  return en
}

export function secenekAdi(k: GrupAnahtari, deger: string): string {
  const g = FILTRE_GRUPLARI.find((x) => x.k === k)
  return g?.secenekler?.find(([d]) => d === deger)?.[1] ?? deger
}

/* ---------- Adres ↔ filtre ---------- */

type Parametreler = Record<string, string | string[] | undefined>
const dizi = (x: string | string[] | undefined) => (Array.isArray(x) ? x : x ? [x] : []).filter(Boolean)

/** Adres parametrelerinden filtre. Tanınmayan değerler sessizce yok sayılmaz, düşürülür (adres elle bozulursa liste çalışmaya devam eder). */
export function filtreOku(p: Parametreler): IlanFiltresi {
  const izinli = (k: GrupAnahtari, x: string[]) => {
    const g = FILTRE_GRUPLARI.find((y) => y.k === k)!
    return g.secenekler ? x.filter((d) => g.secenekler!.some(([s]) => s === d)) : x.slice(0, 10).map((d) => d.slice(0, 80))
  }
  return {
    tur: izinli('tur', dizi(p.tur)),
    model: izinli('model', dizi(p.model)),
    deneyim: izinli('deneyim', dizi(p.deneyim)),
    aile: izinli('aile', dizi(p.aile)),
    ucretli: dizi(p.ucretli)[0] === '1',
    ara: (dizi(p.ara)[0] ?? '').slice(0, 100),
    sira: dizi(p.sira)[0] === 'son-tarih' ? 'son-tarih' : 'yeni',
  }
}

/** Filtreden adres sorgusu (“?tur=staj&model=hibrit…”). Varsayılanlar yazılmaz. */
export function filtreAdresi(f: IlanFiltresi, ek: Record<string, string> = {}): string {
  const p = new URLSearchParams()
  for (const g of FILTRE_GRUPLARI) for (const d of f[g.k]) p.append(g.k, d)
  if (f.ucretli) p.set('ucretli', '1')
  if (f.ara.trim()) p.set('ara', f.ara.trim())
  if (f.sira !== 'yeni') p.set('sira', f.sira)
  for (const [k, v] of Object.entries(ek)) p.set(k, v)
  const s = p.toString()
  return s ? `?${s}` : ''
}

/** Bir seçeneği açıp kapatan filtre (etiket kaldırma ve öneri bağlantıları için). */
export function filtreDegistir(f: IlanFiltresi, k: GrupAnahtari | 'ucretli' | 'ara', deger = ''): IlanFiltresi {
  if (k === 'ucretli') return { ...f, ucretli: !f.ucretli }
  if (k === 'ara') return { ...f, ara: '' }
  return { ...f, [k]: f[k].includes(deger) ? f[k].filter((x) => x !== deger) : [...f[k], deger] }
}
