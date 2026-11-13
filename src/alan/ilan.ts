/**
 * İlanın yaşam döngüsü ve firmanın ilan üzerindeki işlemleri (K1, talimatlar 0.1 ve 4).
 * Saf fonksiyonlar: kim ne zaman hangi işlemi yapabilir, sonuç hangi duruma geçer, hangi değişiklik onaydan geçer.
 */

import { trGunBasi, trGunFarki } from './tarih'

export const ILAN_DURUMLARI = ['taslak', 'onayda', 'duzeltme', 'yayinda', 'duraklatildi', 'suresi-doldu', 'kapandi'] as const
export type IlanDurumu = (typeof ILAN_DURUMLARI)[number]

export const DURUM_ADI: Record<IlanDurumu, string> = {
  taslak: 'Taslak',
  onayda: 'Onayda',
  duzeltme: 'Düzeltme bekliyor',
  yayinda: 'Yayında',
  duraklatildi: 'Duraklatıldı',
  'suresi-doldu': 'Süresi doldu',
  kapandi: 'Kapandı',
}

/** İlk kaç ilan onaydan geçer (K4). Ayarlardan değiştirilebilir. */
export const VARSAYILAN_ONAYLI_ILAN_SAYISI = 3
/** Son başvuru tarihi en fazla kaç gün sonrası olabilir (talimatlar 4). */
export const VARSAYILAN_EN_UZUN_SURE_GUN = 60

export interface FirmaOnayDurumu {
  guvenilir: boolean
  /** Bugüne kadar Yönetici A.Ş. onayından geçip yayınlanmış ilan sayısı */
  onaylanmisIlanSayisi: number
}

/** Yayına gönderilen ilan doğrudan mı yayınlanır, onaya mı gider? (K4) */
export function yayinaGonderSonucu(
  firma: FirmaOnayDurumu,
  onayliIlanSayisi = VARSAYILAN_ONAYLI_ILAN_SAYISI,
): 'yayinda' | 'onayda' {
  if (firma.guvenilir) return 'yayinda'
  return firma.onaylanmisIlanSayisi >= onayliIlanSayisi ? 'yayinda' : 'onayda'
}

/** Firmanın bir ilan üzerindeki işlemleri ve hangi durumlarda yapılabildikleri. */
export type FirmaIslemi =
  | 'yayina-gonder'
  | 'duzenle'
  | 'duraklat'
  | 'yeniden-baslat'
  | 'sure-uzat'
  | 'kapat'
  | 'yeniden-yayinla'
  | 'kopyala'
  | 'sil'

const ISLEM_DURUMLARI: Record<FirmaIslemi, IlanDurumu[]> = {
  'yayina-gonder': ['taslak', 'duzeltme'],
  duzenle: ['taslak', 'duzeltme', 'onayda', 'yayinda', 'duraklatildi'],
  duraklat: ['yayinda'],
  'yeniden-baslat': ['duraklatildi'],
  'sure-uzat': ['yayinda', 'duraklatildi'],
  kapat: ['yayinda', 'duraklatildi', 'onayda'],
  'yeniden-yayinla': ['kapandi', 'suresi-doldu'],
  kopyala: [...ILAN_DURUMLARI],
  sil: ['taslak'], // yalnızca hiç yayınlanmamış taslak silinir; diğerleri kayıt için kalır
}

export function islemYapilabilirMi(islem: FirmaIslemi, durum: IlanDurumu): boolean {
  return ISLEM_DURUMLARI[islem].includes(durum)
}

/** Durumda yapılabilecek işlemler (arayüz yalnızca bunları gösterir: yetkisiz işlem düğmesi yok). */
export function yapilabilecekIslemler(durum: IlanDurumu): FirmaIslemi[] {
  return (Object.keys(ISLEM_DURUMLARI) as FirmaIslemi[]).filter((i) => islemYapilabilirMi(i, durum))
}

export const KAPATMA_NEDENLERI = {
  doldu: 'Pozisyon doldu',
  iptal: 'Pozisyon iptal edildi',
  'baska-kanal': 'Başka bir kanaldan aday bulundu',
} as const
export type KapatmaNedeni = keyof typeof KAPATMA_NEDENLERI

/* ---------- Tarihler ---------- */

const GUN_MS = 86_400_000
/** Takvim günü farkı, Türkiye saatine göre. Sunucu hangi saat diliminde çalışırsa çalışsın sonuç aynıdır. */
export function gunFarki(baslangic: Date, bitis: Date): number {
  return trGunFarki(baslangic, bitis)
}

export type TarihHatasi = 'gecmis' | 'cok-uzak' | null

/** Son başvuru tarihi bugünden sonra ve en fazla N gün ileride olmalı. Sınır günü dahildir. */
export function sonBasvuruTarihiHatasi(
  tarih: Date,
  bugun: Date,
  enUzunGun = VARSAYILAN_EN_UZUN_SURE_GUN,
): TarihHatasi {
  const fark = gunFarki(bugun, tarih)
  if (fark < 1) return 'gecmis'
  if (fark > enUzunGun) return 'cok-uzak'
  return null
}

/** Seçilebilecek en geç son başvuru günü (Türkiye saatiyle o günün başı). */
export function enGecSonBasvuruTarihi(bugun: Date, enUzunGun = VARSAYILAN_EN_UZUN_SURE_GUN): Date {
  return new Date(trGunBasi(bugun).getTime() + enUzunGun * GUN_MS)
}

/** Son başvuru günü geçti mi? Son gün boyunca ilan açıktır. */
export function suresiDolduMu(sonBasvuru: Date, simdi: Date): boolean {
  return gunFarki(sonBasvuru, simdi) > 0
}

/** Kalan gün; arayüzde “Son 2 gün” vurgusu için. Son gün 0 döner. */
export function kalanGun(sonBasvuru: Date, simdi: Date): number {
  return gunFarki(simdi, sonBasvuru)
}

/* ---------- Esaslı değişiklik (talimatlar 0.1) ---------- */

/** Bu alanlardaki değişiklik yayındaki ilanda onaydan geçer (güvenilir firma hariç). */
export const ESASLI_ALANLAR = ['pozisyonAdi', 'tur', 'altTur', 'ucretEnAz', 'ucretEnCok', 'ucretGorunur'] as const
export type EsasliAlan = (typeof ESASLI_ALANLAR)[number]

export const ESASLI_ALAN_ADI: Record<EsasliAlan, string> = {
  pozisyonAdi: 'Pozisyon adı',
  tur: 'İlan türü',
  altTur: 'Çalışma şekli / staj türü',
  ucretEnAz: 'Ücret (en az)',
  ucretEnCok: 'Ücret (en çok)',
  ucretGorunur: 'Ücretin görünürlüğü',
}

type Kayit = Record<string, unknown>
const esit = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

export interface DuzenlemeSonucu {
  /** Hemen yayına yansıyan alanlar */
  hemen: string[]
  /** Onaya giden alanlar (güvenilir firmada boş) */
  onaya: EsasliAlan[]
}

/** Yayındaki bir ilanda yapılan değişikliklerin hangisi hemen, hangisi onayla yayına girer? */
export function duzenlemeSonucu(eski: Kayit, yeni: Kayit, guvenilir: boolean): DuzenlemeSonucu {
  const degisen = [...new Set([...Object.keys(eski), ...Object.keys(yeni)])].filter((k) => !esit(eski[k], yeni[k]))
  const esasli = degisen.filter((k): k is EsasliAlan => (ESASLI_ALANLAR as readonly string[]).includes(k))
  if (guvenilir) return { hemen: degisen, onaya: [] }
  return { hemen: degisen.filter((k) => !esasli.includes(k as EsasliAlan)), onaya: esasli }
}

/* ---------- Kopyalama ---------- */

/** Kopyada sıfırlanan alanlar: tarih, durum, sayaçlar ve kimlik. Diğer her şey dolu gelir. */
export const KOPYADA_SIFIRLANAN = ['id', 'durum', 'sonBasvuru', 'yayinTarihi', 'kapanisNedeni', 'goruntulenme', 'basvuruSayisi', 'createdAt', 'updatedAt'] as const

export function ilanKopyasi<T extends Kayit>(ilan: T): Partial<T> {
  const kopya: Kayit = { ...ilan }
  for (const alan of KOPYADA_SIFIRLANAN) delete kopya[alan]
  kopya.durum = 'taslak'
  return kopya as Partial<T>
}
