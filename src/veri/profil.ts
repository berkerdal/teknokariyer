/**
 * Profil sihirbazının adımları ve profildeki eksikler (K28). Profil sayfası ve sihirbaz aynı tanımı kullanır.
 */
import type { Adaylar } from '@/payload-types'

export const SIHIRBAZ_ADIMLARI = [
  { no: 1, kimlik: 'egitim', baslik: 'Eğitim', aciklama: 'Okulunu, bölümünü ve mezuniyet tarihini ekle.' },
  { no: 2, kimlik: 'deneyim', baslik: 'Deneyim', aciklama: 'Deneyim düzeyini seç; varsa iş ve staj deneyimlerini ekle.' },
  { no: 3, kimlik: 'beceriler', baslik: 'Beceriler', aciklama: 'Bildiğin araçları, dilleri ve yöntemleri seviyeleriyle birlikte ekle.' },
  { no: 4, kimlik: 'diller', baslik: 'Yabancı diller', aciklama: 'Bildiğin yabancı dilleri ve seviyelerini ekle.' },
  { no: 5, kimlik: 'tercihler', baslik: 'Tercihler', aciklama: 'Ne tür ilanlarla ilgilendiğini ve nasıl çalışmak istediğini belirt.' },
  { no: 6, kimlik: 'cv', baslik: 'CV', aciklama: 'Başvurularında gönderilecek CV’ni yükle.' },
] as const

export interface ProfilEksigi {
  ad: string
  adim: number
}

/** Profilde eksik olan temel bilgiler; her biri sihirbazın ilgili adımına götürür. */
export function profilEksikleri(a: Adaylar, cvSayisi: number): ProfilEksigi[] {
  const e: ProfilEksigi[] = []
  if (!a.okul || !a.bolum) e.push({ ad: 'Okul ve bölüm', adim: 1 })
  if (!a.deneyimSeviyesi) e.push({ ad: 'Deneyim düzeyi', adim: 2 })
  if (!(a.beceriler ?? []).length) e.push({ ad: 'Beceriler', adim: 3 })
  if (!(a.diller ?? []).length) e.push({ ad: 'Yabancı diller', adim: 4 })
  if (!(a.tercihler?.modeller ?? []).length) e.push({ ad: 'Çalışma tercihleri', adim: 5 })
  if (!cvSayisi) e.push({ ad: 'CV', adim: 6 })
  return e
}
