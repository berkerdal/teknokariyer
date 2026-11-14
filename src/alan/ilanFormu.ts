/**
 * Firma ilan formunun okunması (K1). Saf fonksiyon: FormData → ilan verisi ve alan hataları.
 *
 * - Yalnızca biçim denetlenir (sayı, tarih, liste). Tamlık (zorunlu alanlar) taslakta aranmaz; yayına gönderirken
 *   `ilanEksikleri` ile denetlenir. Böylece isteğe bağlı veya henüz doldurulmamış bir alan taslak kaydını engellemez.
 * - Hata anahtarları formdaki alan kimlikleridir; hata özeti bağlantıları doğrudan alana götürür.
 * - Form alan adları birbiriyle çakışmamalıdır: ilanın dili `ilanDili`, dil şartları `dilSarti` adıyla gelir.
 */
import { DENEYIM_SIRASI, CEFR } from './eslesme'
import { IS_ALT_TURLERI, STAJ_ALT_TURLERI } from './ilan'
import { trGunu } from './tarih'

export const EGITIM_DUZEYLERI = ['lise', 'onlisans', 'lisans', 'yuksek-lisans', 'doktora'] as const
export const MODELLER = ['ofiste', 'hibrit', 'uzaktan'] as const
export const SORU_TIPLERI = ['kisa', 'evet-hayir', 'secmeli'] as const
export const EN_FAZLA_SORU = 5
export const EN_FAZLA_YAN_HAK = 15
export const EN_FAZLA_BECERI = 15

export interface IlanSorusu {
  soru: string
  tip: (typeof SORU_TIPLERI)[number]
  secenekler?: Array<{ ad: string }>
  eleyici: boolean
  beklenenCevap?: string | null
}

export interface IlanFormVerisi {
  pozisyonAdi: string
  tur: 'is' | 'staj' | null
  altTur: string | null
  aile: number | null
  model: (typeof MODELLER)[number] | null
  konum: string
  deneyim: string | null
  egitim: string | null
  pozisyonSayisi: number
  bolumler: number[]
  zorunluBeceriler: number[]
  tercihBeceriler: number[]
  diller: Array<{ dil: number; seviye: string }>
  sonBasvuru: string | null
  baslangic: string | null
  ucretEnAz: number | null
  ucretEnCok: number | null
  ucretGorunur: boolean
  yanHaklar: Array<{ ad: string }>
  isTanimi: string
  nitelikler: string
  onElemeSorulari: IlanSorusu[]
  linkedinMetni: string
  dil: 'tr' | 'en' | 'ikisi'
  stajDonemi: string | null
  ucretliStaj: boolean
  sgk: 'okul' | 'firma' | null
  stajBelgesi: boolean
  pauOncelik: boolean
}

type Okuyucu = Pick<FormData, 'get' | 'getAll'>

const izinli = <T extends string>(liste: readonly T[], d: string): T | null => ((liste as readonly string[]).includes(d) ? (d as T) : null)

/** “60.000”, “60 000”, “60000” → 60000. Boşsa null; sayı değilse NaN. */
export function tutarOku(ham: string): number | null {
  const s = ham.replace(/[\s.₺]/g, '').replace(/,\d{0,2}$/, '')
  if (!s) return null
  return /^\d+$/.test(s) ? Number(s) : Number.NaN
}

export function ilanFormunuOku(f: Okuyucu): { veri: IlanFormVerisi; hatalar: Record<string, string> } {
  const hatalar: Record<string, string> = {}
  const metin = (k: string, en = 5000) => String(f.get(k) ?? '').trim().slice(0, en)
  const isaret = (k: string) => ['on', '1', 'true'].includes(String(f.get(k) ?? ''))
  const kimlikler = (k: string, en = EN_FAZLA_BECERI) =>
    [...new Set(f.getAll(k).map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, en)
  const tarih = (k: string) => {
    const s = metin(k, 20)
    if (!s) return null
    const t = trGunu(s)
    if (!t) hatalar[k] = 'Tarihi takvimden seçin.'
    return t ? t.toISOString() : null
  }
  const tutar = (k: string) => {
    const n = tutarOku(metin(k, 30))
    if (Number.isNaN(n)) hatalar[k] = 'Tutarı yalnızca rakamla yazın. Örnek: 45.000'
    return Number.isNaN(n) ? null : n
  }

  const tur = izinli(['is', 'staj'] as const, metin('tur'))
  const altTurHam = metin('altTur')
  const altTur = izinli([...IS_ALT_TURLERI, ...STAJ_ALT_TURLERI], altTurHam)
  const pozisyonAdi = metin('pozisyonAdi', 120)
  if (!pozisyonAdi) hatalar.pozisyonAdi = 'Pozisyon adını yazın. Taslağı kaydetmek için yalnızca bu alan gereklidir.'

  const pozisyonSayisiHam = metin('pozisyonSayisi', 4)
  const pozisyonSayisi = pozisyonSayisiHam ? Number(pozisyonSayisiHam) : 1
  if (!Number.isInteger(pozisyonSayisi) || pozisyonSayisi < 1 || pozisyonSayisi > 99) hatalar.pozisyonSayisi = 'Pozisyon sayısını 1 ile 99 arasında bir rakamla yazın.'

  const ucretEnAz = tutar('ucretEnAz')
  const ucretEnCok = tutar('ucretEnCok')
  if (ucretEnAz != null && ucretEnCok != null && ucretEnAz > ucretEnCok) hatalar.ucretEnAz = 'Ücretin en az değeri en çok değerinden büyük olamaz.'

  const diller = f
    .getAll('dilSarti')
    .map(String)
    .flatMap((x) => {
      const [d, s] = x.split(':')
      const dil = Number(d)
      return Number.isInteger(dil) && dil > 0 && (CEFR as readonly string[]).includes(s ?? '') ? [{ dil, seviye: s! }] : []
    })
    .filter((x, n, a) => a.findIndex((y) => y.dil === x.dil) === n)

  const yanHaklar = [...new Set(f.getAll('yanHak').map((x) => String(x).trim().slice(0, 80)).filter(Boolean))]
    .slice(0, EN_FAZLA_YAN_HAK)
    .map((ad) => ({ ad }))

  const onElemeSorulari: IlanSorusu[] = []
  for (const no of f.getAll('soruNo').map(String).slice(0, EN_FAZLA_SORU)) {
    const soru = metin(`soru-${no}`, 300)
    if (!soru) continue // boş bırakılan soru satırı yok sayılır
    const tip = izinli(SORU_TIPLERI, metin(`soruTip-${no}`)) ?? 'kisa'
    const secenekler = tip === 'secmeli' ? metin(`soruSecenekler-${no}`, 1000).split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 8).map((ad) => ({ ad })) : undefined
    if (tip === 'secmeli' && (secenekler?.length ?? 0) < 2) hatalar[`soruSecenekler-${no}`] = 'Çoktan seçmeli soruya her satıra bir seçenek olacak şekilde en az iki seçenek yazın.'
    const eleyici = isaret(`soruEleyici-${no}`)
    const beklenenCevap = eleyici ? metin(`soruBeklenen-${no}`, 200) || null : null
    if (eleyici && !beklenenCevap) hatalar[`soruBeklenen-${no}`] = 'Eleyici soru için beklediğiniz cevabı seçin veya yazın.'
    onElemeSorulari.push({ soru, tip, secenekler, eleyici, beklenenCevap })
  }

  const veri: IlanFormVerisi = {
    pozisyonAdi,
    tur,
    altTur: altTur && tur && (tur === 'staj' ? (STAJ_ALT_TURLERI as readonly string[]) : (IS_ALT_TURLERI as readonly string[])).includes(altTur) ? altTur : null,
    aile: kimlikler('aile', 1)[0] ?? null,
    model: izinli(MODELLER, metin('model')),
    konum: metin('konum', 120) || 'Pamukkale Teknokent',
    deneyim: izinli(DENEYIM_SIRASI, metin('deneyim')),
    egitim: izinli(EGITIM_DUZEYLERI, metin('egitim')),
    pozisyonSayisi: hatalar.pozisyonSayisi ? 1 : pozisyonSayisi,
    bolumler: kimlikler('bolum', 20),
    zorunluBeceriler: kimlikler('zorunluBeceri'),
    tercihBeceriler: kimlikler('tercihBeceri').filter((b) => !kimlikler('zorunluBeceri').includes(b)),
    diller,
    sonBasvuru: tarih('sonBasvuru'),
    baslangic: tarih('baslangic'),
    ucretEnAz,
    ucretEnCok,
    ucretGorunur: isaret('ucretGorunur'),
    yanHaklar,
    isTanimi: metin('isTanimi'),
    nitelikler: metin('nitelikler'),
    onElemeSorulari,
    linkedinMetni: metin('linkedinMetni', 700),
    dil: izinli(['tr', 'en', 'ikisi'] as const, metin('ilanDili')) ?? 'tr',
    stajDonemi: tur === 'staj' ? metin('stajDonemi', 120) || null : null,
    ucretliStaj: tur === 'staj' && isaret('ucretliStaj'),
    sgk: tur === 'staj' ? izinli(['okul', 'firma'] as const, metin('sgk')) : null,
    stajBelgesi: tur === 'staj' ? isaret('stajBelgesi') : false,
    pauOncelik: tur === 'staj' && isaret('pauOncelik'),
  }
  if (altTurHam && tur && !veri.altTur) hatalar.altTur = tur === 'staj' ? 'Staj ilanı için bir staj türü seçin.' : 'İş ilanı için bir çalışma şekli seçin.'
  return { veri, hatalar }
}
