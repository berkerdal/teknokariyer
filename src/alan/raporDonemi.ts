/**
 * Rapor dönemleri (K31). Hazır dönemler takvime göredir (ay, çeyrek, yıl); özel aralık gün olarak seçilir.
 * Sınırlar Türkiye saatiyle; bitiş hariçtir.
 */
import { trGunBasi, trGunMetni, trGunu } from './tarih'

export const RAPOR_DONEMLERI: Array<[string, string]> = [
  ['bu-ay', 'Bu ay'],
  ['gecen-ay', 'Geçen ay'],
  ['bu-ceyrek', 'Bu çeyrek'],
  ['gecen-ceyrek', 'Geçen çeyrek'],
  ['bu-yil', 'Bu yıl'],
  ['gecen-yil', 'Geçen yıl'],
  ['ozel', 'Özel aralık'],
]

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

export interface RaporDonemi {
  kod: string
  ad: string
  bas: Date
  bit: Date
  /** Adres için: ?donem=ozel&bas=2026-01-01&bit=2026-03-31 */
  sorgu: Record<string, string>
}

/** TR takviminde yıl/ay (0 tabanlı) başlangıcı */
const ayBasi = (y: number, a: number) => trGunu(`${y}-${String(a + 1).padStart(2, '0')}-01`)!

export function raporDonemi(kod: string | undefined, basMetni?: string, bitMetni?: string, simdi = new Date()): RaporDonemi | { hata: string } {
  const bugun = trGunMetni(simdi)
  const [y, a] = [Number(bugun.slice(0, 4)), Number(bugun.slice(5, 7)) - 1]
  const yarin = new Date(trGunBasi(simdi).getTime() + 86_400_000)
  const ceyrek = Math.floor(a / 3)
  switch (kod ?? 'bu-ay') {
    case 'bu-ay':
      return { kod: 'bu-ay', ad: `${AYLAR[a]} ${y} (bugüne kadar)`, bas: ayBasi(y, a), bit: yarin, sorgu: { donem: 'bu-ay' } }
    case 'gecen-ay': {
      const [gy, ga] = a === 0 ? [y - 1, 11] : [y, a - 1]
      return { kod: 'gecen-ay', ad: `${AYLAR[ga]} ${gy}`, bas: ayBasi(gy, ga), bit: ayBasi(y, a), sorgu: { donem: 'gecen-ay' } }
    }
    case 'bu-ceyrek':
      return { kod: 'bu-ceyrek', ad: `${y} ${ceyrek + 1}. çeyrek (bugüne kadar)`, bas: ayBasi(y, ceyrek * 3), bit: yarin, sorgu: { donem: 'bu-ceyrek' } }
    case 'gecen-ceyrek': {
      const [gy, gc] = ceyrek === 0 ? [y - 1, 3] : [y, ceyrek - 1]
      return { kod: 'gecen-ceyrek', ad: `${gy} ${gc + 1}. çeyrek`, bas: ayBasi(gy, gc * 3), bit: ayBasi(y, ceyrek * 3), sorgu: { donem: 'gecen-ceyrek' } }
    }
    case 'bu-yil':
      return { kod: 'bu-yil', ad: `${y} (bugüne kadar)`, bas: ayBasi(y, 0), bit: yarin, sorgu: { donem: 'bu-yil' } }
    case 'gecen-yil':
      return { kod: 'gecen-yil', ad: String(y - 1), bas: ayBasi(y - 1, 0), bit: ayBasi(y, 0), sorgu: { donem: 'gecen-yil' } }
    case 'ozel': {
      const b = trGunu(basMetni ?? '')
      const s = trGunu(bitMetni ?? '')
      if (!b || !s) return { hata: 'Özel aralık için başlangıç ve bitiş günlerini seçin.' }
      if (s < b) return { hata: 'Bitiş günü başlangıç gününden önce olamaz.' }
      if (b.getTime() > trGunBasi(simdi).getTime()) return { hata: 'Başlangıç günü bugünden sonra olamaz.' }
      if ((s.getTime() - b.getTime()) / 86_400_000 > 366 * 3) return { hata: 'Özel aralık en fazla üç yıl olabilir.' }
      const ad = (d: Date) => {
        const m = trGunMetni(d)
        return `${Number(m.slice(8))} ${AYLAR[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`
      }
      return { kod: 'ozel', ad: `${ad(b)} – ${ad(s)}`, bas: b, bit: new Date(s.getTime() + 86_400_000), sorgu: { donem: 'ozel', bas: basMetni!, bit: bitMetni! } }
    }
    default:
      return raporDonemi('bu-ay', undefined, undefined, simdi)
  }
}

/** Dönemdeki aylar (aylık kırılım tabloları için). */
export function donemAylari(d: Pick<RaporDonemi, 'bas' | 'bit'>): Array<{ ad: string; bas: Date; bit: Date }> {
  const sonuc: Array<{ ad: string; bas: Date; bit: Date }> = []
  let m = trGunMetni(d.bas)
  let [y, a] = [Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1]
  for (let i = 0; i < 48; i++) {
    const bas = ayBasi(y, a)
    if (bas >= d.bit) break
    const [ny, na] = a === 11 ? [y + 1, 0] : [y, a + 1]
    const bit = ayBasi(ny, na)
    sonuc.push({ ad: `${AYLAR[a]} ${y}`, bas: bas < d.bas ? d.bas : bas, bit: bit > d.bit ? d.bit : bit })
    ;[y, a] = [ny, na]
    m = ''
  }
  return sonuc
}
