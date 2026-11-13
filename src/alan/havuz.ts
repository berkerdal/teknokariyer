/**
 * CV havuzu kuralları (talimatlar 7, K5, K24, K25) ve herkese açık başvuru sayacı (K23).
 */

/* ---------- Sayaç (K23) ---------- */

/** Herkese açık ilan sayfasında başvuru sayısı aralıkla gösterilir. Görüntülenme gösterilmez. */
export function basvuruAraligi(basvuruSayisi: number): string {
  if (basvuruSayisi < 10) return '10’dan az başvuru'
  if (basvuruSayisi <= 50) return '10–50 başvuru'
  return '50’den fazla başvuru'
}

/* ---------- Rıza (talimatlar 7) ---------- */

export const HAVUZ_RIZA_SURESI_AY = 12

export function rizaBitisTarihi(verilis: Date, ay = HAVUZ_RIZA_SURESI_AY): Date {
  const d = new Date(verilis)
  d.setMonth(d.getMonth() + ay)
  return d
}

export function rizaGecerliMi(verilis: Date | null | undefined, simdi: Date, ay = HAVUZ_RIZA_SURESI_AY): boolean {
  if (!verilis) return false
  return simdi < rizaBitisTarihi(verilis, ay)
}

/** Yenileme hatırlatması, bitişten bu kadar gün önce gider. */
export const RIZA_HATIRLATMA_GUN = 30

/* ---------- Görünürlük (K24, K25) ---------- */

export type HavuzGorunurlugu = 'aktif' | 'acik' | 'gizli'
export const GORUNURLUK_ADI: Record<HavuzGorunurlugu, string> = {
  aktif: 'Aktif iş arıyor',
  acik: 'Fırsatlara açık',
  gizli: 'Gizli',
}

export type Cinsiyet = 'kadin' | 'erkek' | 'belirtmek-istemiyor'
export const CINSIYET_ADI: Record<Cinsiyet, string> = {
  kadin: 'Kadın',
  erkek: 'Erkek',
  'belirtmek-istemiyor': 'Belirtmek istemiyor',
}

export interface HavuzAdayi {
  id: string
  kod: string // "A-1042"
  ad: string
  eposta: string
  telefon?: string
  cinsiyet?: Cinsiyet
  bolum?: string
  okul?: string
  mezuniyetYili?: number
  deneyimYili?: number
  beceriler: string[]
  tercih?: string
  baslama?: string
  diller: string[]
  gorunurluk: HavuzGorunurlugu
  rizaTarihi: Date | null
  /** Adayın gizlendiği firma kimlikleri (ör. mevcut işvereni) */
  gizlenenFirmalar: string[]
}

/** Arama listesinde firmaya giden anonim özet: ad ve iletişim yok, cinsiyet var (K24, K25). */
export interface HavuzOzeti {
  id: string
  kod: string
  cinsiyet?: Cinsiyet
  bolum?: string
  okul?: string
  mezuniyetYili?: number
  deneyimYili?: number
  beceriler: string[]
  tercih?: string
  baslama?: string
  diller: string[]
  gorunurluk: Exclude<HavuzGorunurlugu, 'gizli'>
}

/** Firma bu adayı havuzda görebilir mi? Rıza geçerli, görünürlük açık ve firma gizlenenler arasında değil. */
export function firmaGorebilirMi(aday: HavuzAdayi, firmaId: string, simdi: Date): boolean {
  if (!rizaGecerliMi(aday.rizaTarihi, simdi)) return false
  if (aday.gorunurluk === 'gizli') return false
  return !aday.gizlenenFirmalar.includes(firmaId)
}

export function havuzOzeti(aday: HavuzAdayi): HavuzOzeti {
  if (aday.gorunurluk === 'gizli') throw new Error('Gizli aday havuzda gösterilemez')
  return {
    id: aday.id,
    kod: aday.kod,
    cinsiyet: aday.cinsiyet,
    bolum: aday.bolum,
    okul: aday.okul,
    mezuniyetYili: aday.mezuniyetYili,
    deneyimYili: aday.deneyimYili,
    beceriler: aday.beceriler,
    tercih: aday.tercih,
    baslama: aday.baslama,
    diller: aday.diller,
    gorunurluk: aday.gorunurluk,
  }
}

/**
 * Havuz aramasında kullanılabilecek filtre alanları. Cinsiyet bilerek yok (K25): arama, filtre ve sıralamada kullanılamaz.
 * Sunucu, bu listede olmayan bir alana göre filtre isteğini reddeder.
 */
export const HAVUZ_FILTRE_ALANLARI = [
  'beceriler',
  'deneyimYili',
  'bolum',
  'okul',
  'mezuniyetYili',
  'diller',
  'tercih',
  'baslama',
  'sehir',
  'gorunurluk',
] as const
export type HavuzFiltreAlani = (typeof HAVUZ_FILTRE_ALANLARI)[number]

export function filtreAlaniIzinliMi(alan: string): alan is HavuzFiltreAlani {
  return (HAVUZ_FILTRE_ALANLARI as readonly string[]).includes(alan)
}

/** Son 30 günde profili açan firma sayısı: aday adları değil yalnızca sayıyı görür (K5). */
export function sonOtuzGundeGoruntuleyenFirmaSayisi(
  goruntulemeler: Array<{ firmaId: string; tarih: Date }>,
  simdi: Date,
): number {
  const sinir = simdi.getTime() - 30 * 86_400_000
  return new Set(goruntulemeler.filter((g) => g.tarih.getTime() >= sinir).map((g) => g.firmaId)).size
}
