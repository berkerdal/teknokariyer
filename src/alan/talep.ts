/**
 * Taksonomi talebi (listede olmayan beceri, pozisyon ailesi, bölüm, dil…). Saf kurallar.
 */
import { normallestir } from './metin'

export const TALEP_EN_FAZLA_OGE = 10
export const TALEP_EN_FAZLA_BEKLEYEN = 20

export const TALEP_TUR_ADI: Record<string, { tekil: string; cogul: string }> = {
  beceri: { tekil: 'beceri', cogul: 'beceriler' },
  'pozisyon-ailesi': { tekil: 'pozisyon ailesi', cogul: 'pozisyon aileleri' },
  bolum: { tekil: 'bölüm', cogul: 'bölümler' },
  dil: { tekil: 'dil', cogul: 'diller' },
  universite: { tekil: 'üniversite', cogul: 'üniversiteler' },
  sektor: { tekil: 'sektör', cogul: 'sektörler' },
}

/** Her satıra (veya virgülle ayrılmış) bir öğe; boşlar ve tekrarlar atılır, en fazla 10 öğe. */
export function talepOgeleri(ham: string): { ogeler: string[]; hata?: string } {
  const ogeler: string[] = []
  for (const parca of ham.split(/[\n,;]+/)) {
    const ad = parca.replace(/\s+/g, ' ').trim()
    if (!ad) continue
    if (ad.length < 2) return { ogeler, hata: `“${ad}” çok kısa. Her öğeyi en az iki harfle yazın.` }
    if (ad.length > 80) return { ogeler, hata: 'Her öğe en fazla 80 karakter olabilir.' }
    if (!ogeler.some((o) => normallestir(o) === normallestir(ad))) ogeler.push(ad)
  }
  if (!ogeler.length) return { ogeler, hata: 'Eklenmesini istediğiniz öğeyi yazın.' }
  if (ogeler.length > TALEP_EN_FAZLA_OGE) return { ogeler, hata: `Bir talepte en fazla ${TALEP_EN_FAZLA_OGE} öğe isteyebilirsiniz.` }
  return { ogeler }
}

/** Listede zaten olanları ayırır (Türkçe harf ve büyük/küçük harf farkı gözetilmez). */
export function mevcutlariAyir(ogeler: string[], mevcutAdlar: string[]): { yeni: string[]; zatenVar: string[] } {
  const var_ = new Set(mevcutAdlar.map(normallestir))
  return { yeni: ogeler.filter((o) => !var_.has(normallestir(o))), zatenVar: ogeler.filter((o) => var_.has(normallestir(o))) }
}
