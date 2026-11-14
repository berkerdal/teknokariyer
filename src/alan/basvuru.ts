/**
 * Başvuru öncesi profil eksikleri (talimatlar 5): yalnızca bu ilanın gerektirdiği eksikler sorulur, bütün profil değil.
 * Cevaplar profile de kaydedilir; sonraki başvuruda yeniden sorulmaz. Diğer eksikler başvuruyu engellemez.
 *
 * Kurallar:
 * - Her başvuruda: okul, bölüm ve deneyim seviyesi (firmanın değerlendirmesi ve eşleştirme için en temel bilgi).
 * - Staj ilanında ayrıca sınıf (zorunlu staj ve dönem uygunluğu için).
 * - Öğrenci veya yeni mezun adayda mezuniyet tarihi (beklenen tarih de olur).
 * - İlan bir dil şartı koyduysa, profilde o dil için seviye.
 * - En az bir CV (başvuru adımında yüklenebilir; bu listede değil).
 */

export type EksikAlan = 'okul' | 'bolum' | 'deneyim' | 'sinif' | 'mezuniyet' | `dil:${string}`

export interface BasvuruIlani {
  tur: 'is' | 'staj'
  diller: Array<{ dil: string; seviye: string }>
}

export interface BasvuruProfili {
  okul?: string | null
  bolum?: string | null
  deneyim?: string | null
  sinif?: string | null
  mezuniyet?: string | null
  diller: Array<{ dil: string }>
}

export function basvuruEksikleri(ilan: BasvuruIlani, p: BasvuruProfili): EksikAlan[] {
  const eksik: EksikAlan[] = []
  if (!p.okul) eksik.push('okul')
  if (!p.bolum) eksik.push('bolum')
  if (!p.deneyim) eksik.push('deneyim')
  if (ilan.tur === 'staj' && !p.sinif) eksik.push('sinif')
  const ogrenciGibi = !p.deneyim || p.deneyim === 'ogrenci' || p.deneyim === 'yeni-mezun'
  if (ogrenciGibi && !p.mezuniyet) eksik.push('mezuniyet')
  const sahip = new Set(p.diller.map((d) => d.dil.toLocaleLowerCase('tr')))
  for (const d of ilan.diller) if (!sahip.has(d.dil.toLocaleLowerCase('tr'))) eksik.push(`dil:${d.dil}`)
  return eksik
}

export const SINIFLAR = ['Hazırlık', '1. sınıf', '2. sınıf', '3. sınıf', '4. sınıf', '5. sınıf ve üzeri', 'Yüksek lisans', 'Doktora', 'Mezun'] as const

/** Başvuru durumları ve aday panelindeki ilerleme kareleri (talimatlar 5). */
export const BASVURU_DURUM_ADI: Record<string, string> = {
  alindi: 'Alındı',
  inceleniyor: 'İnceleniyor',
  gorusme: 'Görüşme',
  teklif: 'Teklif',
  olumlu: 'Olumlu',
  olumsuz: 'Olumsuz',
  'geri-cekti': 'Geri çektin',
}
export const BASVURU_ADIMLARI = ['alindi', 'inceleniyor', 'gorusme', 'teklif', 'sonuc'] as const

/** İlerleme kareleri: her kare geçti / şimdi / olumsuz / boş. */
export function adimKareleri(durum: string): Array<'gecti' | 'simdi' | 'olumsuz' | ''> {
  const sira = durum === 'olumlu' || durum === 'olumsuz' ? 4 : Math.max(0, BASVURU_ADIMLARI.indexOf(durum as never))
  return BASVURU_ADIMLARI.map((_, n) => {
    if (durum === 'geri-cekti') return n === 0 ? 'gecti' : ''
    if (n < sira) return 'gecti'
    if (n === sira) return durum === 'olumsuz' ? 'olumsuz' : durum === 'olumlu' ? 'gecti' : 'simdi'
    return ''
  })
}

/** Aday başvurusunu ancak firma karar vermeden geri çekebilir. */
export const geriCekilebilirMi = (durum: string) => durum === 'alindi' || durum === 'inceleniyor'

/** Başvurunun geldiği yer. Yalnızca bilinen değerler kabul edilir; adresteki başka bir değer yok sayılır. */
export const BASVURU_KAYNAKLARI = ['linkedin', 'google', 'dogrudan'] as const
export type BasvuruKaynagi = (typeof BASVURU_KAYNAKLARI)[number] | 'portal'
export const basvuruKaynagi = (d?: string | null): (typeof BASVURU_KAYNAKLARI)[number] | undefined =>
  (BASVURU_KAYNAKLARI as readonly string[]).includes(d ?? '') ? (d as (typeof BASVURU_KAYNAKLARI)[number]) : undefined
