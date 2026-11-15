/**
 * Yönetici özeti ve raporlar (K31, docs/raporlama.md). Saf hesaplar: dönem, günlere bölme, küçük grupları gizleme, huni.
 * Bütün gün sınırları Türkiye saatine göredir.
 */
import { trGunBasi, trGunMetni } from './tarih'

export type DonemKodu = '7g' | '30g' | '90g' | '12a'
export const DONEMLER: Array<[DonemKodu, string]> = [
  ['7g', 'Son 7 gün'],
  ['30g', 'Son 30 gün'],
  ['90g', 'Son 90 gün'],
  ['12a', 'Son 12 ay'],
]

export interface Donem {
  kod: DonemKodu
  ad: string
  bas: Date
  bit: Date
  oncekiBas: Date
  /** Grafikte bir sütun kaç gün (12 ayda haftalık) */
  adimGun: 1 | 7
}

export function donem(kod: string | undefined, simdi = new Date()): Donem {
  const k = (DONEMLER.find(([x]) => x === kod)?.[0] ?? '30g') as DonemKodu
  const gun = { '7g': 7, '30g': 30, '90g': 90, '12a': 364 }[k]
  const bit = new Date(trGunBasi(simdi).getTime() + 86_400_000) // bugünün sonu
  const bas = new Date(bit.getTime() - gun * 86_400_000)
  return { kod: k, ad: DONEMLER.find(([x]) => x === k)![1], bas, bit, oncekiBas: new Date(bas.getTime() - gun * 86_400_000), adimGun: k === '12a' ? 7 : 1 }
}

export const aralikta = (iso: string | null | undefined, bas: Date, bit: Date) => {
  if (!iso) return false
  const t = new Date(iso).getTime()
  return t >= bas.getTime() && t < bit.getTime()
}

export interface Dilim {
  /** Dilimin ilk günü (YYYY-AA-GG) */
  gun: string
  n: number
}

/** Tarihleri dönem boyunca günlük (veya haftalık) dilimlere sayar; boş dilimler 0 olarak yer alır. */
export function dilimlereBol(tarihler: Array<string | null | undefined>, d: Pick<Donem, 'bas' | 'bit' | 'adimGun'>): Dilim[] {
  const adim = d.adimGun * 86_400_000
  const adet = Math.ceil((d.bit.getTime() - d.bas.getTime()) / adim)
  const dilimler: Dilim[] = Array.from({ length: adet }, (_, i) => ({ gun: trGunMetni(new Date(d.bas.getTime() + i * adim)), n: 0 }))
  for (const t of tarihler) {
    if (!aralikta(t, d.bas, d.bit)) continue
    const i = Math.floor((new Date(t!).getTime() - d.bas.getTime()) / adim)
    if (dilimler[i]) dilimler[i].n++
  }
  return dilimler
}

export interface Grup {
  ad: string
  /** Gizlenen grupta null: “5'ten az” */
  n: number | null
}

/**
 * KVKK: 5'ten küçük gruplar tek tek gösterilmez (“X bölümünden 1 aday” kişiyi tanınır kılar). Küçük gruplar “Diğer”de
 * toplanır; toplamları da 5'ten küçükse sayı yerine “5'ten az” yazılır.
 */
export const GIZLEME_ESIGI = 5
export function gruplariGizle(sayilar: Map<string, number> | Record<string, number>, enFazla = 8): Grup[] {
  const girdiler = (sayilar instanceof Map ? [...sayilar.entries()] : Object.entries(sayilar)).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr'))
  const buyuk = girdiler.filter(([, n]) => n >= GIZLEME_ESIGI)
  const gosterilen = buyuk.slice(0, enFazla)
  const kalan = girdiler.filter((g) => !gosterilen.includes(g)).reduce((t, [, n]) => t + n, 0)
  const sonuc: Grup[] = gosterilen.map(([ad, n]) => ({ ad, n }))
  if (kalan > 0) sonuc.push({ ad: 'Diğer', n: kalan >= GIZLEME_ESIGI ? kalan : null })
  return sonuc
}

/** Önceki döneme göre değişim; önceki 0 ise yüzde verilmez. */
export function degisim(simdi: number, once: number): { fark: number; yuzde: number | null } {
  return { fark: simdi - once, yuzde: once > 0 ? Math.round(((simdi - once) / once) * 100) : null }
}

export const HUNI_ADIMLARI: Array<[string, string, string[]]> = [
  ['basvuru', 'Başvuru', []],
  ['incelendi', 'İncelendi', ['inceleniyor', 'gorusme', 'teklif', 'olumlu', 'olumsuz']],
  ['gorusme', 'Görüşmeye çağrıldı', ['gorusme', 'teklif', 'olumlu']],
  ['teklif', 'Teklif aldı', ['teklif', 'olumlu']],
  ['olumlu', 'Olumlu sonuç', ['olumlu']],
]

/**
 * Başvuru hunisi. Yalnızca başvurunun şimdiki durumu bilindiği için “ulaştığı aşama” durumdan çıkarılır: görüşmeden sonra
 * olumsuz sonuçlanan başvuru “İncelendi” basamağında sayılır. Geri çekilen başvurular huniye girmez.
 */
export function huni(durumlar: string[]): Array<{ kod: string; ad: string; n: number; oran: number | null }> {
  const gecerli = durumlar.filter((d) => d !== 'geri-cekti')
  const ilk = gecerli.length
  return HUNI_ADIMLARI.map(([kod, ad, kume]) => {
    const n = kume.length ? gecerli.filter((d) => kume.includes(d)).length : ilk
    return { kod, ad, n, oran: ilk ? Math.round((n / ilk) * 1000) / 10 : null }
  })
}

/** Eksen için “temiz” üst sınır ve aralıklar: 0, 5, 10… / 0, 20, 40… */
export function eksenAdimlari(enBuyuk: number, hedef = 4): number[] {
  if (enBuyuk <= 0) return [0, 1]
  const kaba = enBuyuk / hedef
  const us = 10 ** Math.floor(Math.log10(kaba))
  // Sayılar adet olduğu için adım en az 1 (eksende “0,5” gibi kesirli değer çıkmaz)
  const adim = Math.max(1, [1, 2, 5, 10].map((c) => c * us).find((a) => a >= kaba)!)
  const ust = Math.ceil(enBuyuk / adim) * adim
  return Array.from({ length: Math.round(ust / adim) + 1 }, (_, i) => Math.round(i * adim * 1000) / 1000)
}
