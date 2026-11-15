/**
 * Tarayıcı tarafı çerez yardımcıları (src/alan/cerez.ts kurallarıyla). Yalnızca istemci bileşenlerinde kullanılır.
 */
import { ISTATISTIK_CEREZI, IZIN_CEREZI, IZIN_SURESI_GUN, istatistikGuncelle, izinGecerliMi, izinOku, izinYaz, type CerezIzni } from '@/alan/cerez'

export const CEREZ_OLAYI = 'tk-cerez-degisti'
export const CEREZ_PENCERE_OLAYI = 'tk-cerez-tercihleri'

export function cerezOku(ad: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.split('; ').find((c) => c.startsWith(`${ad}=`))
  return m ? decodeURIComponent(m.slice(ad.length + 1)) : null
}

function cerezYaz(ad: string, deger: string, gun: number) {
  const guvenli = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${ad}=${encodeURIComponent(deger)}; Max-Age=${Math.round(gun * 86_400)}; Path=/; SameSite=Lax${guvenli}`
}

const bugun = () => new Date(Date.now() + 3 * 3_600_000).toISOString().slice(0, 10) // Türkiye günü

/** Geçerli izin; yoksa null (bant gösterilir, izne bağlı çerezler kullanılmaz). */
export function izinAl(): CerezIzni | null {
  const i = izinOku(cerezOku(IZIN_CEREZI))
  return izinGecerliMi(i, new Date()) ? i : null
}

/** İzni kaydeder; geri alınan izinlerin bıraktığı çerez ve depolar silinir. */
export function izinKaydet(i: { tercih: boolean; istatistik: boolean }) {
  cerezYaz(IZIN_CEREZI, izinYaz(i, bugun()), IZIN_SURESI_GUN)
  if (!i.istatistik) cerezYaz(ISTATISTIK_CEREZI, '', -1)
  if (!i.tercih) {
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith('tk-')) localStorage.removeItem(k)
    } catch {
      // depolama kapalı olabilir
    }
  }
  window.dispatchEvent(new CustomEvent(CEREZ_OLAYI))
}

/** Tercih izni yoksa bilgiler yalnızca oturum boyunca (sessionStorage) tutulur. */
export function tercihDeposu(): Storage | null {
  try {
    return izinAl()?.tercih ? localStorage : sessionStorage
  } catch {
    return null
  }
}

/** İstatistik izni varsa çerezi günceller ve kimliksiz üç işareti döndürür; yoksa null. */
export function istatistikIsaretleri(): { yeni: boolean; gununIlki: boolean; ayinIlki: boolean } | null {
  if (!izinAl()?.istatistik) return null
  const r = istatistikGuncelle(cerezOku(ISTATISTIK_CEREZI), bugun())
  cerezYaz(ISTATISTIK_CEREZI, r.deger, IZIN_SURESI_GUN)
  return { yeni: r.yeni, gununIlki: r.gununIlki, ayinIlki: r.ayinIlki }
}

export function cerezTercihleriniAc() {
  window.dispatchEvent(new CustomEvent(CEREZ_PENCERE_OLAYI))
}
