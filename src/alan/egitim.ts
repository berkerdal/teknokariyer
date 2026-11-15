/**
 * Eğitim bilgileri (kullanıcı isteği, 15.11.2026: birden çok eğitim; LinkedIn'deki “Eğitim” bölümü örnek alındı).
 * Saf kurallar: satır denetimi, sıralama ve “ana eğitim”in seçimi.
 */
import { SINIFLAR } from './basvuru'

export const EGITIM_DUZEYLERI: Array<[string, string]> = [
  ['lise', 'Lise'],
  ['onlisans', 'Önlisans'],
  ['lisans', 'Lisans'],
  ['yuksek-lisans', 'Yüksek lisans'],
  ['doktora', 'Doktora'],
]
export const EGITIM_DUZEYI_ADI: Record<string, string> = Object.fromEntries(EGITIM_DUZEYLERI)
const DUZEY_SIRASI = Object.fromEntries(EGITIM_DUZEYLERI.map(([k], i) => [k, i]))
export const EN_FAZLA_EGITIM = 6

export interface EgitimSatiri {
  duzey: string
  okul: number | null
  okulAdi: string | null
  bolum: number | null
  baslangicYil: number | null
  bitisAy: number | null
  bitisYil: number | null
  devam: boolean
  sinif: string | null
  gano: number | null
}

const tamSayi = (x: unknown) => (Number.isInteger(Number(x)) && Number(x) > 0 ? Number(x) : null)

/** Bir satırı denetler. Okul listeden seçilmeli veya (lisede, listede yoksa) adı yazılmalı; lise dışında bölüm zorunlu. */
export function egitimSatiri(s: Record<string, unknown>, n: number, buYil = new Date().getUTCFullYear()): { egitim: EgitimSatiri } | { hata: string } {
  const sira = `${n + 1}. eğitim`
  const duzey = String(s.duzey ?? '')
  if (!(duzey in EGITIM_DUZEYI_ADI)) return { hata: `${sira}: eğitim düzeyini seç.` }
  const okul = tamSayi(s.okul)
  const okulAdi = String(s.okulAdi ?? '').trim().slice(0, 150) || null
  if (!okul && !okulAdi) return { hata: `${sira}: okulunu listeden seç.` }
  const bolum = tamSayi(s.bolum)
  if (!bolum && duzey !== 'lise') return { hata: `${sira}: bölümünü listeden seç.` }
  const devam = Boolean(s.devam)
  const baslangicYil = tamSayi(s.baslangicYil)
  const bitisAy = tamSayi(s.bitisAy)
  const bitisYil = tamSayi(s.bitisYil)
  if (baslangicYil && (baslangicYil < 1960 || baslangicYil > buYil)) return { hata: `${sira}: başlangıç yılı geçerli değil.` }
  if (bitisAy && (bitisAy > 12 || !bitisYil)) return { hata: `${sira}: mezuniyet tarihi için ayı ve yılı birlikte seç.` }
  if (bitisYil && (bitisYil < 1960 || bitisYil > buYil + 8)) return { hata: `${sira}: mezuniyet yılı geçerli değil.` }
  if (!devam && bitisYil && bitisYil > buYil) return { hata: `${sira}: mezuniyet yılı gelecekte; hâlâ okuyorsan “Hâlâ okuyorum” seçeneğini işaretle.` }
  if (baslangicYil && bitisYil && bitisYil < baslangicYil) return { hata: `${sira}: mezuniyet yılı başlangıç yılından önce olamaz.` }
  const sinifHam = String(s.sinif ?? '')
  const sinif = devam && (SINIFLAR as readonly string[]).includes(sinifHam) ? sinifHam : null
  const ganoHam = String(s.gano ?? '').replace(',', '.').trim()
  if (ganoHam && !(Number(ganoHam) >= 0 && Number(ganoHam) <= 4)) return { hata: `${sira}: not ortalaması 0 ile 4 arasında olmalı (örneğin 3,12).` }
  return { egitim: { duzey, okul, okulAdi: okul ? null : okulAdi, bolum, baslangicYil, bitisAy, bitisYil, devam, sinif, gano: ganoHam ? Number(ganoHam) : null } }
}

/** Gösterim ve “ana eğitim” sırası: devam edenler önce; sonra mezuniyeti yeni olan; eşitlikte yüksek düzey. */
export function egitimleriSirala<T extends Pick<EgitimSatiri, 'devam' | 'bitisYil' | 'bitisAy' | 'duzey'>>(liste: T[]): T[] {
  return [...liste].sort(
    (a, b) =>
      Number(Boolean(b.devam)) - Number(Boolean(a.devam)) ||
      (b.bitisYil ?? 0) * 12 + (b.bitisAy ?? 6) - ((a.bitisYil ?? 0) * 12 + (a.bitisAy ?? 6)) ||
      (DUZEY_SIRASI[b.duzey] ?? 0) - (DUZEY_SIRASI[a.duzey] ?? 0),
  )
}

/** Ana eğitimden profilin üst alanları (eşleştirme ve başvuru kuralları bunları kullanır). */
export function anaEgitimAlanlari(liste: EgitimSatiri[]): { okul: number | null; bolum: number | null; sinif: string | null; mezuniyet: string | null; gano: number | null } {
  const a = egitimleriSirala(liste)[0]
  if (!a) return { okul: null, bolum: null, sinif: null, mezuniyet: null, gano: null }
  return {
    okul: a.okul,
    bolum: a.bolum,
    sinif: a.devam ? a.sinif : null,
    mezuniyet: a.bitisYil ? new Date(Date.UTC(a.bitisYil, (a.bitisAy ?? 6) - 1, 15)).toISOString() : null,
    gano: a.gano,
  }
}
