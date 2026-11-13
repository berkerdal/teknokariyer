/**
 * Erişim kuralları (talimatlar 2, 12; CLAUDE.md 5. bölüm).
 *
 * - Yetki kontrolü her zaman sunucuda yapılır; arayüzde düğmeyi gizlemek yetmez.
 * - Kiracı ayrımı: firma kullanıcısı yalnızca kendi firmasının kayıtlarını görür. Sorgu kısıtı (Where) olarak uygulanır;
 *   böylece liste, tek kayıt ve sayım uçlarının hepsinde aynı kural geçerli olur.
 * - K11: Başlangıçta Yönetici A.Ş. kullanıcılarının hepsi "yonetici". Moderatör ve raporlayıcı rolleri hazır ama
 *   varsayılan olarak atanmaz.
 */
import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

export type Rol = 'yonetici' | 'moderator' | 'raporlayici' | 'firma' | 'aday'
export type FirmaYetkisi = 'yonetici' | 'ilan-sorumlusu' | 'degerlendirici'

export interface OturumKullanicisi {
  id: string | number
  rol: Rol
  firma?: string | number | { id: string | number } | null
  firmaYetkisi?: FirmaYetkisi | null
  collection?: string
}

export const kullanici = (req: PayloadRequest): OturumKullanicisi | null =>
  (req.user as unknown as OturumKullanicisi) ?? null

const kimlik = (deger: OturumKullanicisi['firma']) =>
  deger && typeof deger === 'object' ? deger.id : (deger ?? null)

export const firmaKimligi = (k: OturumKullanicisi | null) => (k ? kimlik(k.firma) : null)

/**
 * Sunucunun kendi kodu mu? Yerel API'den kullanıcı olmadan yapılan çağrılar (davet akışı, zamanlanmış işler, testler)
 * güvenilir sistem işlemidir. REST üzerinden gelen kullanıcısız istek ise ziyaretçidir.
 */
export const sistemIslemiMi = (req: PayloadRequest) => !req.user && req.payloadAPI === 'local'

/* ---------- Rol sorguları ---------- */
export const yoneticiMi = (k: OturumKullanicisi | null) => k?.rol === 'yonetici'
/** İlan onayı ve içerik denetimi yapabilenler (moderatör ayarları değiştiremez) */
export const moderasyonYapabilirMi = (k: OturumKullanicisi | null) => k?.rol === 'yonetici' || k?.rol === 'moderator'
/** Yönetici A.Ş. tarafındaki herhangi bir rol (raporlayıcı yalnızca okur) */
export const kurumKullanicisiMi = (k: OturumKullanicisi | null) =>
  k?.rol === 'yonetici' || k?.rol === 'moderator' || k?.rol === 'raporlayici'
export const firmaKullanicisiMi = (k: OturumKullanicisi | null) => k?.rol === 'firma' && firmaKimligi(k) !== null
export const adayMi = (k: OturumKullanicisi | null) => k?.rol === 'aday'

/** Firma içindeki yetki (talimatlar 2: ekip üyesi verilen yetki kadar işlem yapar). */
export const firmaYetkisiVarMi = (k: OturumKullanicisi | null, gerekli: FirmaYetkisi[]) =>
  firmaKullanicisiMi(k) && gerekli.includes(k!.firmaYetkisi ?? 'degerlendirici')

/* ---------- Koleksiyon erişimleri ---------- */
export const sadeceYonetici: Access = ({ req }) => yoneticiMi(kullanici(req))
export const kurumOkur: Access = ({ req }) => kurumKullanicisiMi(kullanici(req))
export const moderasyon: Access = ({ req }) => moderasyonYapabilirMi(kullanici(req))
export const hicKimse: Access = () => false
export const herkes: Access = () => true

/** Kurum kullanıcısı her şeyi; firma kullanıcısı yalnızca `alan` alanı kendi firması olan kayıtları. */
export const kurumVeyaKendiFirmasi =
  (alan = 'firma', firmaYetkileri?: FirmaYetkisi[]): Access =>
  ({ req }) => {
    const k = kullanici(req)
    if (kurumKullanicisiMi(k)) return true
    if (!firmaKullanicisiMi(k)) return false
    if (firmaYetkileri && !firmaYetkisiVarMi(k, firmaYetkileri)) return false
    return { [alan]: { equals: firmaKimligi(k) } } as Where
  }

/** Yönetim (yazma) için: raporlayıcı yazamaz. */
export const yoneticiVeyaKendiFirmasi =
  (alan = 'firma', firmaYetkileri?: FirmaYetkisi[]): Access =>
  ({ req }) => {
    const k = kullanici(req)
    if (moderasyonYapabilirMi(k)) return true
    if (!firmaKullanicisiMi(k)) return false
    if (firmaYetkileri && !firmaYetkisiVarMi(k, firmaYetkileri)) return false
    return { [alan]: { equals: firmaKimligi(k) } } as Where
  }

/** Kayıt sahibi (ör. aday kendi profili) veya kurum. */
export const kurumVeyaSahibi =
  (alan = 'kullanici'): Access =>
  ({ req }) => {
    const k = kullanici(req)
    if (kurumKullanicisiMi(k)) return true
    if (!k) return false
    return { [alan]: { equals: k.id } } as Where
  }

/* ---------- Alan erişimleri ---------- */
export const alanSadeceYonetici: FieldAccess = ({ req }) => yoneticiMi(kullanici(req))
export const alanKurum: FieldAccess = ({ req }) => kurumKullanicisiMi(kullanici(req))
export const alanModerasyon: FieldAccess = ({ req }) => moderasyonYapabilirMi(kullanici(req))
/** Firma ekibi ve kurum görür; aday göremez (ekip notları, puan). */
export const alanFirmaVeKurum: FieldAccess = ({ req }) => {
  const k = kullanici(req)
  return kurumKullanicisiMi(k) || firmaKullanicisiMi(k)
}
export const alanKimseYazamaz: FieldAccess = () => false
