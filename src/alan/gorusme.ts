/**
 * Görüşme daveti (talimatlar 6 “Görüşme daveti”: firma tarih seçenekleri önerir, aday birini seçer, takvim dosyası
 * gönderilir; Faz 1'de basit). Saf kurallar: girdi denetimi, durumlar, Türkiye saatiyle tarih yazımı ve .ics üretimi.
 *
 * Saatler Türkiye saatidir (sabit UTC+3, src/alan/tarih.ts). Takvim dosyasında an UTC yazılır (“…Z”); takvim uygulaması
 * kişinin kendi saat dilimine çevirir.
 */
import { TR_FARK_MS, trGunu } from './tarih'

export const GORUSME_BICIMI = {
  'yuz-yuze': { ad: 'Yüz yüze', yerEtiketi: 'Adres', yerIpucu: 'Örneğin Pamukkale Teknokent D Blok 208. Binaya girişte sorulacak kişiyi de yazabilirsiniz.' },
  'cevrim-ici': { ad: 'Çevrim içi', yerEtiketi: 'Görüşme bağlantısı', yerIpucu: 'Teams, Meet veya Zoom bağlantısı (https:// ile başlar).' },
  telefon: { ad: 'Telefon', yerEtiketi: 'Arayacak kişi veya numara', yerIpucu: 'İsteğe bağlı. Boş bırakırsanız adayı başvurudaki numarasından ararsınız.' },
} as const
export type GorusmeBicimi = keyof typeof GORUSME_BICIMI

export const GORUSME_SURELERI = [15, 30, 45, 60, 90, 120] as const
export const EN_FAZLA_SECENEK = 3
/** Seçenek en erken bu kadar sonra olabilir (adaya hazırlanma ve seçme payı). */
export const EN_ERKEN_SAAT = 2
/** Seçenek en geç bu kadar gün sonra olabilir. */
export const EN_GEC_GUN = 60

export type GorusmeDurumu = 'bekliyor' | 'onaylandi' | 'yeni-tarih' | 'iptal'
/** Kayıttaki durum + zamana bağlı hâller (seçeneklerin hepsi geçti, görüşme saati geçti). */
export type GorusmeHali = GorusmeDurumu | 'suresi-doldu' | 'tamamlandi'

export const GORUSME_HALI_ADI: Record<GorusmeHali, { firma: string; aday: string }> = {
  bekliyor: { firma: 'Adayın tarih seçmesi bekleniyor', aday: 'Tarih seçmeni bekliyor' },
  onaylandi: { firma: 'Tarih kesinleşti', aday: 'Tarih kesinleşti' },
  'yeni-tarih': { firma: 'Aday başka tarih istedi', aday: 'Firmanın yeni tarih önermesi bekleniyor' },
  iptal: { firma: 'İptal edildi', aday: 'İptal edildi' },
  'suresi-doldu': { firma: 'Önerilen tarihlerin hepsi geçti', aday: 'Önerilen tarihlerin hepsi geçti' },
  tamamlandi: { firma: 'Görüşme saati geçti', aday: 'Görüşme saati geçti' },
}

export interface GorusmeOzu {
  durum: GorusmeDurumu
  secenekler: Date[]
  secilen?: Date | null
  sure: number
}

export function gorusmeHali(g: GorusmeOzu, simdi = new Date()): GorusmeHali {
  if (g.durum === 'onaylandi' && g.secilen && g.secilen.getTime() + g.sure * 60_000 <= simdi.getTime()) return 'tamamlandi'
  if (g.durum === 'bekliyor' && !g.secenekler.some((s) => s > simdi)) return 'suresi-doldu'
  return g.durum
}

/** Görüşme hâlâ sürüyor mu (yeni davet açılamaz; firma değiştirir veya iptal eder)? */
export const surenGorusmeMi = (g: GorusmeOzu, simdi = new Date()) => ['bekliyor', 'onaylandi', 'yeni-tarih'].includes(gorusmeHali(g, simdi))

/** Formdaki gün (“2026-11-18”) ve saat (“14:30”) → Türkiye saatine göre an. Geçersizse null. */
export function trAn(gun: string, saat: string): Date | null {
  const g = trGunu(gun)
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(saat.trim())
  if (!g || !m) return null
  return new Date(g.getTime() + (Number(m[1]) * 60 + Number(m[2])) * 60_000)
}

/** Davet formundaki gün listesi: bugünden itibaren `EN_GEC_GUN` gün, “18 Kasım Çarşamba” (Türkiye saati). */
export function gunSecenekleri(simdi = new Date()): Array<{ deger: string; metin: string }> {
  const bas = new Date(simdi.getTime() + TR_FARK_MS)
  return Array.from({ length: EN_GEC_GUN + 1 }, (_, i) => {
    const d = new Date(Date.UTC(bas.getUTCFullYear(), bas.getUTCMonth(), bas.getUTCDate() + i))
    const gun = GUNLER[d.getUTCDay()]
    return { deger: d.toISOString().slice(0, 10), metin: `${d.getUTCDate()} ${AYLAR[d.getUTCMonth()]} ${gun}${i === 0 ? ' (bugün)' : i === 1 ? ' (yarın)' : ''}` }
  })
}

/** Seçilebilir saatler: 08.00–20.30 arası yarım saatlik. */
export const SAAT_SECENEKLERI: string[] = Array.from({ length: 26 }, (_, i) => `${String(8 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`)

export interface DavetGirdisi {
  secenekler: Array<Date | null>
  sure: number
  bicim: string
  yer: string
  not: string
}

/** Alan alan denetim (firmalara “siz”). Seçenek hataları `secenek0..2` anahtarlarıyla döner. */
export function davetHatalari(g: DavetGirdisi, simdi = new Date()): Record<string, string> {
  const h: Record<string, string> = {}
  const dolu = g.secenekler.filter((s): s is Date => s !== null)
  const enErken = simdi.getTime() + EN_ERKEN_SAAT * 3_600_000
  const enGec = simdi.getTime() + EN_GEC_GUN * 86_400_000
  g.secenekler.forEach((s, i) => {
    if (s === null) return
    if (s.getTime() < enErken) h[`secenek${i}`] = `Bu seçenek en erken ${EN_ERKEN_SAAT} saat sonrası olabilir.`
    else if (s.getTime() > enGec) h[`secenek${i}`] = `Bu seçenek en geç ${EN_GEC_GUN} gün sonrası olabilir.`
    else if (g.secenekler.slice(0, i).some((x) => x?.getTime() === s.getTime())) h[`secenek${i}`] = 'Bu tarih ve saat başka bir seçenekle aynı.'
  })
  if (!dolu.length) h.secenek0 = 'En az bir tarih ve saat seçin.'
  if (dolu.length > EN_FAZLA_SECENEK) h.secenek0 = `En fazla ${EN_FAZLA_SECENEK} seçenek önerebilirsiniz.`
  if (!(GORUSME_SURELERI as readonly number[]).includes(g.sure)) h.sure = 'Görüşmenin süresini seçin.'
  if (!(g.bicim in GORUSME_BICIMI)) h.bicim = 'Görüşmenin biçimini seçin.'
  const yer = g.yer.trim()
  if (g.bicim === 'yuz-yuze' && yer.length < 5) h.yer = 'Görüşmenin yapılacağı adresi yazın.'
  if (g.bicim === 'cevrim-ici' && !/^https:\/\/[^\s]+\.[^\s]+$/.test(yer)) h.yer = 'Görüşme bağlantısını https:// ile başlayan tam adres olarak yazın.'
  if (yer.length > 300) h.yer = 'En fazla 300 karakter yazabilirsiniz.'
  if (g.not.length > 1000) h.not = 'Not en fazla 1000 karakter olabilir.'
  return h
}

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

/** “18 Kasım 2026 Çarşamba, 14.30” (Türkiye saati). */
export function gorusmeZamani(an: Date): string {
  const d = new Date(an.getTime() + TR_FARK_MS)
  return `${d.getUTCDate()} ${AYLAR[d.getUTCMonth()]} ${d.getUTCFullYear()} ${GUNLER[d.getUTCDay()]}, ${String(d.getUTCHours()).padStart(2, '0')}.${String(d.getUTCMinutes()).padStart(2, '0')}`
}

/** “14.30–15.15” (Türkiye saati). */
export function saatAraligi(an: Date, sure: number): string {
  const s = (x: Date) => {
    const d = new Date(x.getTime() + TR_FARK_MS)
    return `${String(d.getUTCHours()).padStart(2, '0')}.${String(d.getUTCMinutes()).padStart(2, '0')}`
  }
  return `${s(an)}–${s(new Date(an.getTime() + sure * 60_000))}`
}

// ——— Takvim dosyası (RFC 5545) ———

const icsMetni = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
const icsAn = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** Satırları 75 baytı aşmayacak biçimde katlar (devam satırı bir boşlukla başlar); UTF-8 karakter bölünmez. */
export function icsKatla(satir: string): string {
  const parcalar: string[] = []
  let parca = ''
  let bayt = 0
  for (const ch of satir) {
    const b = new TextEncoder().encode(ch).length
    const sinir = parcalar.length ? 74 : 75
    if (bayt + b > sinir) {
      parcalar.push(parca)
      parca = ''
      bayt = 0
    }
    parca += ch
    bayt += b
  }
  parcalar.push(parca)
  return parcalar.join('\r\n ')
}

export interface TakvimGirdisi {
  uid: string
  /**
   * PUBLISH: takvime ekle (katılımcı listesi ve cevap isteği yok; Outlook katılımcısız REQUEST'i geçersiz sayar);
   * CANCEL: aynı UID'li etkinliği iptal eder.
   */
  yontem: 'PUBLISH' | 'CANCEL'
  sira: number
  baslangic: Date
  sure: number
  ozet: string
  aciklama: string
  yer?: string
  adres?: string
  duzenleyen: { ad: string; eposta: string }
  olusturma: Date
}

export function takvimDosyasi(t: TakvimGirdisi): string {
  const satirlar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pamukkale Teknokent//TeknoKariyer//TR',
    'CALSCALE:GREGORIAN',
    `METHOD:${t.yontem}`,
    'BEGIN:VEVENT',
    `UID:${t.uid}`,
    `SEQUENCE:${t.sira}`,
    `DTSTAMP:${icsAn(t.olusturma)}`,
    `DTSTART:${icsAn(t.baslangic)}`,
    `DTEND:${icsAn(new Date(t.baslangic.getTime() + t.sure * 60_000))}`,
    `SUMMARY:${icsMetni(t.ozet)}`,
    `DESCRIPTION:${icsMetni(t.aciklama)}`,
    ...(t.yer ? [`LOCATION:${icsMetni(t.yer)}`] : []),
    ...(t.adres ? [`URL:${t.adres}`] : []),
    `ORGANIZER;CN=${icsMetni(t.duzenleyen.ad)}:mailto:${t.duzenleyen.eposta}`,
    `STATUS:${t.yontem === 'CANCEL' ? 'CANCELLED' : 'CONFIRMED'}`,
    ...(t.yontem === 'PUBLISH' ? ['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Görüşme hatırlatması', 'TRIGGER:-PT30M', 'END:VALARM'] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return satirlar.map(icsKatla).join('\r\n') + '\r\n'
}
