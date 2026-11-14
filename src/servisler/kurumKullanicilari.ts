/**
 * Yönetici A.Ş. kullanıcıları (K11). Hesabı tam yetkili açar; kişi e-postadaki bağlantıyla şifresini belirler.
 * Kimse kendi rolünü değiştiremez veya kendini kapatamaz; son etkin tam yetkili korunur.
 */
import type { Payload } from 'payload'
import { teknikSorumluMu, yoneticiMi } from '@/erisim'
import { KURUM_ROL_ADI, KURUM_ROLLERI, type KurumRolu } from '@/alan/kurumRolleri'
import { kurumHesabiEpostasi } from '@/altyapi/epostaSablonlari'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { epostaGecerliMi, epostaNormallestir } from './hesapKurallari'
import { FormHatasi, IslemHatasi, istekOlustur, type Kullanici } from './ortak'

export const KURUM_HESABI_GUN = 7
const rolGecerli = (r: string): r is KurumRolu => KURUM_ROLLERI.some(([x]) => x === r)

function yetki(k: Kullanici) {
  if (!yoneticiMi(k)) throw new IslemHatasi('Yönetici A.Ş. kullanıcılarını yalnızca tam yetkili kullanıcılar yönetebilir.', 403)
}

async function kurumKullanicisi(payload: Payload, id: number) {
  const u = await payload.findByID({ collection: 'kullanicilar', id, depth: 0, overrideAccess: true }).catch((): null => null)
  if (!u || !['yonetici', 'moderator', 'raporlayici'].includes(String(u.rol))) throw new IslemHatasi('Kullanıcı bulunamadı.', 404)
  return u
}

async function digerEtkinYoneticiVar(payload: Payload, haric: number) {
  const r = await payload.count({ collection: 'kullanicilar', where: { and: [{ rol: { equals: 'yonetici' } }, { pasif: { not_equals: true } }, { id: { not_equals: haric } }] }, overrideAccess: true })
  return r.totalDocs > 0
}

export async function kurumKullanicisiEkle(payload: Payload, k: Kullanici, g: { ad: string; eposta: string; unvan: string; rol: string }) {
  yetki(k)
  const ad = g.ad.replace(/\s+/g, ' ').trim()
  const eposta = epostaNormallestir(g.eposta)
  const hatalar: Record<string, string> = {}
  if (ad.length < 3) hatalar.ad = 'Kişinin adını ve soyadını yazın.'
  if (!epostaGecerliMi(eposta)) hatalar.eposta = 'E-posta adresini ad.soyad@pauteknokent.com.tr biçiminde yazın.'
  if (!rolGecerli(g.rol)) hatalar.rol = 'Bir yetki seçin.'
  if (Object.keys(hatalar).length) throw new FormHatasi(hatalar)
  const var_ = await payload.count({ collection: 'kullanicilar', where: { email: { equals: eposta } }, overrideAccess: true })
  if (var_.totalDocs) throw new FormHatasi({ eposta: 'Bu e-posta adresiyle portalda zaten bir hesap var. Kurum hesabı için kişinin kurumsal e-postasını kullanın.' })
  const req = await istekOlustur(payload, k)
  const sifre = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24)))) // kullanılmayacak; kişi kendi şifresini belirler
  const yeni = await payload.create({
    collection: 'kullanicilar',
    data: { ad, email: eposta, unvan: g.unvan.trim() || null, rol: g.rol, password: sifre, _verified: true } as never,
    overrideAccess: true,
    req,
  })
  const anahtar = await payload.forgotPassword({ collection: 'kullanicilar', data: { email: eposta }, disableEmail: true, expiration: KURUM_HESABI_GUN * 86_400_000 })
  const e = kurumHesabiEpostasi({ ad, rolAdi: KURUM_ROL_ADI[g.rol as KurumRolu], acan: k.ad ?? 'Yönetici A.Ş.', anahtar, gun: KURUM_HESABI_GUN })
  await payload.sendEmail({ to: eposta, subject: e.konu, html: e.html, text: e.metin })
  await islemKaydet(req, { islem: 'Yönetici A.Ş. kullanıcısı eklendi', tur: 'hesap', kayitTuru: 'kullanicilar', kayitId: yeni.id, ayrinti: { rol: g.rol } })
  return yeni
}

export async function kurumRoluDegistir(payload: Payload, k: Kullanici, id: number, rol: string) {
  yetki(k)
  if (Number(k.id) === id) throw new IslemHatasi('Kendi yetkinizi değiştiremezsiniz. Başka bir tam yetkili kullanıcıdan isteyin.', 409)
  if (!rolGecerli(rol)) throw new FormHatasi({ rol: 'Bir yetki seçin.' })
  const u = await kurumKullanicisi(payload, id)
  if (u.rol === 'yonetici' && rol !== 'yonetici' && !(await digerEtkinYoneticiVar(payload, id)))
    throw new IslemHatasi('Bu kişi tek etkin tam yetkili kullanıcı. Önce başka birine tam yetki verin.', 409)
  const req = await istekOlustur(payload, k)
  await payload.update({ collection: 'kullanicilar', id, data: { rol } as never, overrideAccess: true, req })
  await islemKaydet(req, { islem: 'Yönetici A.Ş. kullanıcısının yetkisi değişti', tur: 'hesap', kayitTuru: 'kullanicilar', kayitId: id, ayrinti: { once: u.rol, sonra: rol } })
}

export async function kurumKullanicisiPasifligi(payload: Payload, k: Kullanici, id: number, pasif: boolean) {
  yetki(k)
  if (Number(k.id) === id) throw new IslemHatasi('Kendi hesabınızı kapatamazsınız.', 409)
  const u = await kurumKullanicisi(payload, id)
  if (pasif && u.rol === 'yonetici' && !(await digerEtkinYoneticiVar(payload, id))) throw new IslemHatasi('Son etkin tam yetkili kullanıcı kapatılamaz.', 409)
  const req = await istekOlustur(payload, k)
  await payload.update({ collection: 'kullanicilar', id, data: { pasif } as never, overrideAccess: true, req })
  await islemKaydet(req, { islem: pasif ? 'Yönetici A.Ş. kullanıcısının hesabı kapatıldı' : 'Yönetici A.Ş. kullanıcısının hesabı yeniden açıldı', tur: 'hesap', kayitTuru: 'kullanicilar', kayitId: id })
}

/** Teknik sorumlu işareti (Payload ekranı erişimi): yalnızca teknik sorumlu verir veya kaldırır; kendinden kaldıramaz. */
export async function teknikSorumluYap(payload: Payload, k: Kullanici, id: number, deger: boolean) {
  if (!teknikSorumluMu(k)) throw new IslemHatasi('Bu işareti yalnızca teknik sorumlu değiştirebilir.', 403)
  if (Number(k.id) === id && !deger) throw new IslemHatasi('Kendi teknik sorumlu işaretinizi kaldıramazsınız.', 409)
  await kurumKullanicisi(payload, id)
  const req = await istekOlustur(payload, k)
  await payload.update({ collection: 'kullanicilar', id, data: { teknikSorumlu: deger } as never, overrideAccess: true, req })
  await islemKaydet(req, { islem: deger ? 'Teknik sorumlu yetkisi verildi' : 'Teknik sorumlu yetkisi kaldırıldı', tur: 'hesap', kayitTuru: 'kullanicilar', kayitId: id })
}
