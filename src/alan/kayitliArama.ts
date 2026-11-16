/**
 * Kayıtlı aramalar (talimatlar 7 ve 8; kullanıcı onayıyla 16.11.2026'da yapıldı).
 * - Aday ilan aramasını kaydeder; e-posta “anlık” (uyan ilan yayına girince) veya “haftalık” (yeni ilanların özeti) gelir.
 * - Firma CV havuzu aramasını kaydeder; yeni uyan adayların yalnızca sayısı haftalık e-postayla gelir (kişisel veri yok).
 * Saf kurallar: sorgunun ortak biçimi, özet metni, ilanın aramaya uyması, haftalık zamanı.
 */
import { FILTRE_GRUPLARI, filtreAdresi, filtreOku, filtrele, secenekAdi, type IlanFiltresi, type IlanOzeti } from './ilanFiltre'

export type AramaTuru = 'ilan' | 'havuz'
export type Siklik = 'anlik' | 'haftalik'
export const SIKLIK_ADI: Record<Siklik, string> = { anlik: 'Yeni ilan yayına girince', haftalik: 'Haftada bir özet' }
/** Bir kişinin en fazla kayıtlı araması */
export const EN_FAZLA_ARAMA = 10
/** Haftalık e-postada en fazla bu kadar ilan listelenir; fazlası “ve N ilan daha” olur */
export const HAFTALIK_EN_FAZLA_ILAN = 10

/** Adres sorgusundan (“tur=staj&ara=react”) parametreler; aynı ad birden çok kez geçebilir. */
function parametreler(sorgu: string): Record<string, string[]> {
  const p: Record<string, string[]> = {}
  for (const [k, v] of new URLSearchParams(sorgu.replace(/^\?/, ''))) (p[k] ??= []).push(v)
  return p
}

/** İlan aramasının ortak biçimi: sıralama ve tanınmayan değerler atılır, aynı arama iki kez kaydedilmesin. */
export function ilanSorgusu(sorgu: string): { filtre: IlanFiltresi; sorgu: string } {
  const filtre = { ...filtreOku(parametreler(sorgu)), sira: 'yeni' as const }
  return { filtre, sorgu: filtreAdresi(filtre).replace(/^\?/, '') }
}

/** Kayıtlı aramanın okunur özeti: ““react” · Staj · Uzaktan”. Filtresiz arama “Bütün ilanlar”. */
export function ilanAramaOzeti(f: IlanFiltresi): string {
  const parcalar = [
    ...(f.ara.trim() ? [`“${f.ara.trim()}”`] : []),
    ...FILTRE_GRUPLARI.flatMap((g) => f[g.k].map((d) => secenekAdi(g.k, d))),
    ...(f.ucretli ? ['Ücretli staj'] : []),
  ]
  return parcalar.length ? parcalar.join(' · ') : 'Bütün ilanlar'
}

export const ilanAramayaUyarMi = (ilan: IlanOzeti, sorgu: string) => filtrele([ilan], ilanSorgusu(sorgu).filtre).length === 1

/** Havuz aramasının ortak biçimi: beceri kimlikleri (sıralı, en fazla 15) ve koşul. */
export function havuzSorgusu(sorgu: string): { beceriler: number[]; kosul: 'hepsi' | 'herhangi'; sorgu: string } {
  const p = parametreler(sorgu)
  const beceriler = [...new Set((p.beceri ?? []).map(Number).filter((n) => Number.isInteger(n) && n > 0))].sort((a, b) => a - b).slice(0, 15)
  const kosul = p.kosul?.[0] === 'herhangi' ? 'herhangi' : 'hepsi'
  const q = new URLSearchParams()
  for (const b of beceriler) q.append('beceri', String(b))
  if (beceriler.length > 1) q.set('kosul', kosul)
  return { beceriler, kosul, sorgu: q.toString() }
}

/** Haftalık bildirim zamanı geldi mi? Son bildirimden (yoksa kayıttan) bu yana 7 gün (12 saat pay). */
export function haftalikZamaniMi(son: Date, simdi: Date): boolean {
  return simdi.getTime() - son.getTime() >= 7 * 86_400_000 - 12 * 3_600_000
}
