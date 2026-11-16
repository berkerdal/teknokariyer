/**
 * Firma hesap talebi (talimatlar 10 “Firma hesap talepleri”; kullanıcı onayıyla 16.11.2026'da yapıldı).
 * Firma hesapları davetle açılır (talimatlar 3). Daveti gelmemiş Teknokent firması herkese açık formdan hesap ister;
 * Yönetici A.Ş. talebi bir firma kaydıyla eşleştirip yetkiliye davet gönderir veya gerekçesiyle reddeder.
 */
import { kisaAdTuret } from './iceAktarma'

export interface TalepGirdisi {
  firmaAdi: string
  konum: string
  yetkiliAd: string
  unvan: string
  eposta: string
  telefon: string
  not: string
}

const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Alan alan denetim; hata yoksa boş nesne. Metinler “siz” hitabıyla (firmalara). */
export function talepHatalari(g: TalepGirdisi): Record<string, string> {
  const h: Record<string, string> = {}
  if (g.firmaAdi.trim().length < 2) h.firmaAdi = 'Firmanızın adını yazın.'
  if (g.yetkiliAd.trim().split(/\s+/).length < 2) h.yetkiliAd = 'Adınızı ve soyadınızı yazın.'
  if (!EPOSTA.test(g.eposta.trim())) h.eposta = 'İş e-posta adresinizi ad@firma.com.tr biçiminde yazın.'
  if (g.telefon.trim() && g.telefon.replace(/\D/g, '').length < 10) h.telefon = 'Telefon numarasını alan koduyla yazın (en az 10 rakam) veya boş bırakın.'
  if (g.not.length > 1000) h.not = 'Not en fazla 1000 karakter olabilir.'
  return h
}

/** Büyük harfle ve ASCII “I” ile yazılmış adlar da eşleşsin (“KODPIT” → “kodpit”), sonra şirket ekleri atılır. */
const sade = (s: string) =>
  kisaAdTuret(s.toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFC'))
    .replace(/[^a-z0-9çğıöşü ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Talepteki firma adına en çok benzeyen kayıtlı firmalar (en fazla 3): şirket ekleri atılıp sadeleştirilmiş adlar
 * eşitse, biri öbürünü içeriyorsa veya ilk kelimeleri aynıysa aday sayılır.
 */
export function benzerFirmalar<T extends { id: number; kisaAd: string; unvan: string }>(ad: string, firmalar: T[]): T[] {
  const a = sade(ad)
  if (!a) return []
  const ilk = a.split(' ')[0]!
  const puan = (f: T) => {
    const adlar = [sade(f.kisaAd), sade(f.unvan)]
    if (adlar.includes(a)) return 3
    if (adlar.some((x) => x && (x.includes(a) || a.includes(x)))) return 2
    if (ilk.length >= 3 && adlar.some((x) => x.split(' ')[0] === ilk)) return 1
    return 0
  }
  return firmalar
    .map((f) => [f, puan(f)] as const)
    .filter(([, p]) => p > 0)
    .sort((x, y) => y[1] - x[1] || x[0].kisaAd.localeCompare(y[0].kisaAd, 'tr'))
    .slice(0, 3)
    .map(([f]) => f)
}
