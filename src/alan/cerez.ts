/**
 * Çerez izni (kullanıcı isteği, 15.11.2026; KVKK Kurumu “Çerez Uygulamaları Hakkında Rehber”e göre):
 * - Zorunlu çerezler (oturum, güvenlik, bu tercihin kendisi) izin gerektirmez ve her zaman çalışır.
 * - Tercih (bilgi kutularını hatırlama) ve istatistik (kimliksiz tekil ziyaretçi sayımı) yalnızca açık izinle.
 * - Reklam ve takip çerezi yoktur. Hiçbir kutu önceden işaretli gelmez; “Reddet” ile “Kabul et” eşit görünür.
 * - İzin 12 ay geçerlidir; politika değişince sürüm artar ve yeniden sorulur.
 */

export const CEREZ_SURUMU = '1'
export const IZIN_CEREZI = 'tk-cerez'
export const ISTATISTIK_CEREZI = 'tk-ist'
export const IZIN_SURESI_GUN = 365

export interface CerezIzni {
  tercih: boolean
  istatistik: boolean
  /** YYYY-AA-GG */
  tarih: string
  surum: string
}

/** Çerez değeri “1.t1.i0.2026-11-15” (sürüm, tercih, istatistik, tarih). Bozuksa null. */
export function izinOku(deger: string | null | undefined): CerezIzni | null {
  const m = /^(\d+)\.t([01])\.i([01])\.(\d{4}-\d{2}-\d{2})$/.exec(deger ?? '')
  if (!m) return null
  return { surum: m[1]!, tercih: m[2] === '1', istatistik: m[3] === '1', tarih: m[4]! }
}

export function izinYaz(i: Pick<CerezIzni, 'tercih' | 'istatistik'>, bugun: string): string {
  return `${CEREZ_SURUMU}.t${i.tercih ? 1 : 0}.i${i.istatistik ? 1 : 0}.${bugun}`
}

/** Sürüm güncel ve 12 aydan eski değilse geçerli; değilse bant yeniden gösterilir. */
export function izinGecerliMi(i: CerezIzni | null, simdi: Date): i is CerezIzni {
  if (!i || i.surum !== CEREZ_SURUMU) return false
  const gun = (simdi.getTime() - new Date(`${i.tarih}T00:00:00Z`).getTime()) / 86_400_000
  return gun >= 0 && gun < IZIN_SURESI_GUN
}

/**
 * İstatistik çerezi: yalnızca ilk ziyaret ayı ve son ziyaret günü (“2026-11.2026-11-15”); kişiyi tanıtan değer yok.
 * Sunucuya kimlik değil, yalnızca üç işaret gider: ilk kez mi geliyor, bugünün ilk açılışı mı, bu ayın ilk açılışı mı.
 */
export function istatistikGuncelle(onceki: string | null | undefined, bugun: string): { deger: string; yeni: boolean; gununIlki: boolean; ayinIlki: boolean } {
  const m = /^(\d{4}-\d{2})\.(\d{4}-\d{2}-\d{2})$/.exec(onceki ?? '')
  const ay = bugun.slice(0, 7)
  if (!m) return { deger: `${ay}.${bugun}`, yeni: true, gununIlki: true, ayinIlki: true }
  return { deger: `${m[1]}.${bugun}`, yeni: false, gununIlki: m[2] !== bugun, ayinIlki: m[2]!.slice(0, 7) !== ay }
}
