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

/* ---------- Listede benzer ad var mı? (Yönetici A.Ş. kararına yardım) ---------- */

/** Karşılaştırma kökü: Türkçe harf farkı, noktalama, boşluk ve “.js” eki gözetilmez (“React.JS” → “react”). */
export function adKoku(ad: string): string {
  return normallestir(ad)
    .replace(/\.?js\b/g, '')
    .replace(/[^\p{L}\p{N}+#]/gu, '')
}

function mesafe(a: string, b: string): number {
  const d = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let onceki = d[0]!
    d[0] = i
    for (let j = 1; j <= b.length; j++) {
      const gecici = d[j]!
      d[j] = Math.min(d[j]! + 1, d[j - 1]! + 1, onceki + (a[i - 1] === b[j - 1] ? 0 : 1))
      onceki = gecici
    }
  }
  return d[b.length]!
}

export interface BenzerAd {
  ad: string
  /** Kökleri aynı: büyük olasılıkla aynı şeyin başka yazımı */
  ayni: boolean
}

/**
 * Talep edilen ada listede benzeyenler: aynı kök (“React.js” ~ “React”), biri ötekiyle başlıyor (“React” ~ “React Native”)
 * veya bir-iki harf farkı (“Kubernets” ~ “Kubernetes”). Karar insanındır; bu yalnızca gösterilir.
 */
export function benzerAdlar(ad: string, mevcut: string[], enFazla = 4): BenzerAd[] {
  const k = adKoku(ad)
  if (!k) return []
  const sonuc: Array<BenzerAd & { puan: number }> = []
  for (const m of mevcut) {
    const km = adKoku(m)
    if (!km) continue
    const uzun = Math.max(km.length, k.length)
    const izin = uzun >= 8 ? 2 : uzun >= 4 ? 1 : 0
    const fark = mesafe(km, k)
    if (km === k) sonuc.push({ ad: m, ayni: true, puan: 0 })
    else if (fark <= izin) sonuc.push({ ad: m, ayni: false, puan: 1 + fark })
    else if (Math.min(km.length, k.length) >= 3 && (km.startsWith(k) || k.startsWith(km))) sonuc.push({ ad: m, ayni: false, puan: 4 })
  }
  return sonuc
    .sort((a, b) => a.puan - b.puan || a.ad.localeCompare(b.ad, 'tr'))
    .slice(0, enFazla)
    .map(({ ad: a, ayni }) => ({ ad: a, ayni }))
}

/** Talebin gönderildiği yerin okunur adı (“ilan-formu:zorunluBeceri” → “İlan formu”). */
export function talepKaynagi(kaynak?: string | null): string | null {
  if (!kaynak) return null
  const yer = kaynak.split(':')[0]
  return (
    {
      'ilan-formu': 'Firmanın ilan formu',
      'firma-profili': 'Firma profili',
      'aday-profil': 'Adayın profili',
      basvuru: 'Başvuru formu',
    } as Record<string, string>
  )[yer ?? ''] ?? 'Portal'
}
