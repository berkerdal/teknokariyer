/**
 * Yazdıkça öneri (taksonomi seçimi). Saf fonksiyon: Türkçe harf ve büyük/küçük harf farkı gözetmeden eşleşir;
 * adın başında eşleşenler önce, sonra kelime başında, sonra herhangi bir yerde eşleşenler gelir.
 */
import { normallestir } from './metin'

export interface OneriSecenegi {
  id: number
  ad: string
}

export function oneriler<T extends OneriSecenegi>(secenekler: T[], yazilan: string, haric: number[] = [], enFazla = 8): T[] {
  const q = normallestir(yazilan).trim()
  if (!q) return []
  const puan = (ad: string) => {
    const n = normallestir(ad)
    if (n === q) return 0
    if (n.startsWith(q)) return 1
    if (n.split(/[\s/().,-]+/).some((k) => k.startsWith(q))) return 2
    if (n.includes(q)) return 3
    return -1
  }
  return secenekler
    .filter((s) => !haric.includes(s.id))
    .map((s) => ({ s, p: puan(s.ad) }))
    .filter((x) => x.p >= 0)
    .sort((a, b) => a.p - b.p || a.s.ad.length - b.s.ad.length || a.s.ad.localeCompare(b.s.ad, 'tr'))
    .slice(0, enFazla)
    .map((x) => x.s)
}
