/**
 * Firma ekibi ve davetler (talimatlar 0.3, 2; K3).
 *
 * - Davet bağlantısı kişiye özel, tek kullanımlık ve 14 gün geçerlidir. Anahtarın kendisi saklanmaz, yalnızca SHA-256
 *   özeti saklanır; veritabanı sızsa bile bağlantı üretilemez.
 * - Firma yöneticisi kendi firmasına, Yönetici A.Ş. herhangi bir firmaya davet gönderir.
 * - Ekipten çıkarılan kullanıcı silinmez, pasif yapılır: giriş yapamaz; notları ve işlem kayıtları kalır.
 * - Firmada en az bir etkin “tam yetkili” kalmalıdır; son yönetici kendini çıkaramaz veya yetkisini düşüremez.
 */
import type { Payload } from 'payload'
import type { Davetler, Kullanicilar } from '@/payload-types'
import { firmaKimligi, firmaYetkisiVarMi, moderasyonYapabilirMi, type FirmaYetkisi } from '@/erisim'
import { davetEpostasi, davetHatirlatmaEpostasi } from '@/altyapi/epostaSablonlari'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { DAVET_GECERLILIK_GUN } from '@/koleksiyonlar/Davetler'
import { epostaGecerliMi, epostaNormallestir, sifreHatasi } from './hesapKurallari'
import { FormHatasi, IslemHatasi, istekOlustur, kimlik, type Kullanici } from './ortak'

export const FIRMA_YETKILERI: FirmaYetkisi[] = ['yonetici', 'ilan-sorumlusu', 'degerlendirici']

const base64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
async function ozet(anahtar: string): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(anahtar))
  return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, '0')).join('')
}
const yeniAnahtar = () => base64url(crypto.getRandomValues(new Uint8Array(32)))

function hedefFirma(k: Kullanici, firmaId?: number): number {
  if (moderasyonYapabilirMi(k) && firmaId) return firmaId
  if (!firmaYetkisiVarMi(k, ['yonetici'])) throw new IslemHatasi('Ekip yönetimi yalnızca firmanın tam yetkili kullanıcılarına açıktır.', 403)
  return Number(firmaKimligi(k))
}

export interface DavetGirdisi {
  ad: string
  eposta: string
  firmaYetkisi: string
  /** Yalnızca Yönetici A.Ş. için: hangi firmaya */
  firmaId?: number
}

export async function davetGonder(payload: Payload, k: Kullanici, g: DavetGirdisi): Promise<Davetler> {
  const firmaId = hedefFirma(k, g.firmaId)
  const ad = g.ad.replace(/\s+/g, ' ').trim()
  const eposta = epostaNormallestir(g.eposta)
  const hatalar: Record<string, string> = {}
  if (ad.length < 3) hatalar.ad = 'Davet edeceğiniz kişinin adını ve soyadını yazın.'
  if (!epostaGecerliMi(eposta)) hatalar.eposta = 'E-posta adresini ad@firma.com.tr biçiminde yazın.'
  if (!FIRMA_YETKILERI.includes(g.firmaYetkisi as FirmaYetkisi)) hatalar.firmaYetkisi = 'Bir yetki seçin.'
  if (Object.keys(hatalar).length) throw new FormHatasi(hatalar)

  const mevcut = (await payload.find({ collection: 'kullanicilar', where: { email: { equals: eposta } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (mevcut) {
    if (mevcut.rol === 'firma' && kimlik(mevcut.firma) === firmaId && !mevcut.pasif) throw new FormHatasi({ eposta: 'Bu kişi zaten ekibinizde.' })
    throw new FormHatasi({ eposta: 'Bu e-posta adresiyle portalda başka bir hesap var. Kişinin iş e-posta adresini kullanın veya Yönetici A.Ş.’ye başvurun.' })
  }
  const simdi = new Date()
  const bekleyen = await payload.find({
    collection: 'davetler',
    where: { and: [{ firma: { equals: firmaId } }, { eposta: { equals: eposta } }, { kullanildi: { exists: false } }, { sonGecerlilik: { greater_than: simdi.toISOString() } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (bekleyen.docs[0]) throw new FormHatasi({ eposta: 'Bu adrese gönderilmiş geçerli bir davet zaten var. Davetler listesinden yeniden gönderebilirsiniz.' })

  const anahtar = yeniAnahtar()
  const req = await istekOlustur(payload, k)
  const davet = await payload.create({
    collection: 'davetler',
    data: {
      firma: firmaId,
      ad,
      eposta,
      firmaYetkisi: g.firmaYetkisi as FirmaYetkisi,
      anahtarOzeti: await ozet(anahtar),
      sonGecerlilik: new Date(simdi.getTime() + DAVET_GECERLILIK_GUN * 86_400_000).toISOString(),
    },
    overrideAccess: true,
    req,
  })
  await davetiGonder(payload, davet, anahtar, k)
  await islemKaydet(req, { islem: 'Ekip daveti gönderildi', tur: 'kurulum', kayitTuru: 'davetler', kayitId: davet.id, ayrinti: { yetki: g.firmaYetkisi } })
  // Yönetici A.Ş.'nin iskelet kaydına ilk davet: kurulum hunisinde “davet gönderildi” aşaması.
  const firma = await payload.findByID({ collection: 'firmalar', id: firmaId, depth: 0, overrideAccess: true })
  if (firma.asama === 'iskelet') await payload.update({ collection: 'firmalar', id: firmaId, data: { asama: 'davet' }, overrideAccess: true, req })
  return davet
}

async function davetiGonder(payload: Payload, davet: Davetler, anahtar: string, k: Kullanici) {
  const firma = await payload.findByID({ collection: 'firmalar', id: kimlik(davet.firma), depth: 0, overrideAccess: true })
  const e = davetEpostasi({ ad: davet.ad, firma: firma.kisaAd, davetEden: moderasyonYapabilirMi(k) ? 'Pamukkale Teknokent Yönetici A.Ş.' : (k.ad ?? firma.kisaAd), anahtar, gun: DAVET_GECERLILIK_GUN })
  await payload.sendEmail({ to: davet.eposta, subject: e.konu, html: e.html, text: e.metin })
}

/** Süresi dolmuş veya e-postası kaybolmuş daveti yeni bir anahtarla yeniden gönderir (eski bağlantı geçersiz olur). */
export async function davetiYenidenGonder(payload: Payload, k: Kullanici, davetId: number) {
  const davet = await payload.findByID({ collection: 'davetler', id: davetId, depth: 0, overrideAccess: true }).catch((): null => null)
  if (!davet || kimlik(davet.firma) !== hedefFirma(k, kimlik(davet.firma))) throw new IslemHatasi('Davet bulunamadı.', 404)
  if (davet.kullanildi) throw new IslemHatasi('Bu davet kabul edildi; yeniden gönderilemez.', 409)
  const anahtar = yeniAnahtar()
  const req = await istekOlustur(payload, k)
  const yeni = await payload.update({
    collection: 'davetler',
    id: davetId,
    data: { anahtarOzeti: await ozet(anahtar), sonGecerlilik: new Date(Date.now() + DAVET_GECERLILIK_GUN * 86_400_000).toISOString() },
    overrideAccess: true,
    req,
  })
  await davetiGonder(payload, yeni, anahtar, k)
}

export async function davetiIptalEt(payload: Payload, k: Kullanici, davetId: number) {
  const davet = await payload.findByID({ collection: 'davetler', id: davetId, depth: 0, overrideAccess: true }).catch((): null => null)
  if (!davet || kimlik(davet.firma) !== hedefFirma(k, kimlik(davet.firma))) throw new IslemHatasi('Davet bulunamadı.', 404)
  if (davet.kullanildi) throw new IslemHatasi('Bu davet kabul edildi; iptal edilemez. Kişiyi ekipten çıkarabilirsiniz.', 409)
  const req = await istekOlustur(payload, k)
  await payload.delete({ collection: 'davetler', id: davetId, overrideAccess: true, req })
  await islemKaydet(req, { islem: 'Ekip daveti iptal edildi', tur: 'kurulum', kayitTuru: 'davetler', kayitId: davetId })
}

/**
 * Zamanlanmış hatırlatma: bekleyen davete yeni anahtarla hatırlatma gönderir (eski bağlantılar geçersiz olur).
 * Son hatırlatmada süresi biten davet uzatılır. Kullanıcı işlemi değil, sistem işidir.
 */
export async function davetHatirlat(payload: Payload, davetId: number, gun: number, son: boolean, uzatmaGun: number, simdi = new Date()) {
  const davet = await payload.findByID({ collection: 'davetler', id: davetId, depth: 0, overrideAccess: true })
  if (davet.kullanildi) return false
  const firma = await payload.findByID({ collection: 'firmalar', id: kimlik(davet.firma), depth: 0, overrideAccess: true })
  if (firma.asama === 'pasif') return false
  const anahtar = yeniAnahtar()
  const sonGecerlilik =
    son && new Date(davet.sonGecerlilik).getTime() < simdi.getTime() + uzatmaGun * 86_400_000
      ? new Date(simdi.getTime() + uzatmaGun * 86_400_000).toISOString()
      : davet.sonGecerlilik
  await payload.update({
    collection: 'davetler',
    id: davetId,
    data: { anahtarOzeti: await ozet(anahtar), sonGecerlilik, hatirlatmalar: [...(davet.hatirlatmalar ?? []), { tarih: simdi.toISOString(), gun }] },
    overrideAccess: true,
  })
  const sonGun = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }).format(new Date(sonGecerlilik))
  const e = davetHatirlatmaEpostasi({ ad: davet.ad, firma: firma.kisaAd, anahtar, sonGun, son })
  await payload.sendEmail({ to: davet.eposta, subject: e.konu, html: e.html, text: e.metin })
  return true
}

/** Bağlantıdaki anahtarla geçerli daveti bulur. Geçersizse null (neden ayrıca söylenir). */
export async function davetiBul(payload: Payload, anahtar: string): Promise<{ davet: Davetler; firmaAd: string } | { hata: 'yok' | 'kullanildi' | 'suresi-doldu' }> {
  if (!anahtar || anahtar.length < 20) return { hata: 'yok' }
  const { docs } = await payload.find({ collection: 'davetler', where: { anahtarOzeti: { equals: await ozet(anahtar) } }, limit: 1, depth: 0, overrideAccess: true })
  const davet = docs[0]
  if (!davet) return { hata: 'yok' }
  if (davet.kullanildi) return { hata: 'kullanildi' }
  if (new Date(davet.sonGecerlilik) < new Date()) return { hata: 'suresi-doldu' }
  const firma = await payload.findByID({ collection: 'firmalar', id: kimlik(davet.firma), depth: 0, overrideAccess: true })
  return { davet, firmaAd: firma.kisaAd }
}

/** Daveti kabul eder: firma hesabı açılır (e-posta doğrulanmış sayılır; davet bağlantısı bunu kanıtlar). */
export async function davetiKabulEt(payload: Payload, anahtar: string, g: { ad: string; unvan?: string; sifre: string }): Promise<Kullanicilar> {
  const b = await davetiBul(payload, anahtar)
  if ('hata' in b)
    throw new IslemHatasi(
      b.hata === 'suresi-doldu' ? 'Davetin süresi dolmuş. Sizi davet eden kişiden daveti yeniden göndermesini isteyin.' : b.hata === 'kullanildi' ? 'Bu davet daha önce kabul edildi. Giriş sayfasından giriş yapın.' : 'Davet bağlantısı geçersiz. Bağlantıyı e-postadan eksiksiz kopyaladığınızdan emin olun.',
      b.hata === 'yok' ? 404 : 409,
    )
  const ad = g.ad.replace(/\s+/g, ' ').trim()
  const hatalar: Record<string, string> = {}
  if (ad.length < 3) hatalar.ad = 'Adınızı ve soyadınızı yazın.'
  const sh = sifreHatasi(g.sifre)
  if (sh) hatalar.sifre = sh.replace('belirle', 'belirleyin')
  if (Object.keys(hatalar).length) throw new FormHatasi(hatalar)
  const { davet } = b
  const kullanici = await payload.create({
    collection: 'kullanicilar',
    overrideAccess: true,
    disableVerificationEmail: true,
    data: {
      email: davet.eposta,
      password: g.sifre,
      ad,
      unvan: g.unvan?.trim().slice(0, 80) || undefined,
      rol: 'firma',
      firma: kimlik(davet.firma),
      firmaYetkisi: davet.firmaYetkisi ?? 'degerlendirici',
      _verified: true,
    } as never,
  })
  await payload.update({ collection: 'davetler', id: davet.id, data: { kullanildi: new Date().toISOString() }, overrideAccess: true })
  const firma = await payload.findByID({ collection: 'firmalar', id: kimlik(davet.firma), depth: 0, overrideAccess: true })
  if (firma.asama === 'iskelet' || firma.asama === 'davet') await payload.update({ collection: 'firmalar', id: firma.id, data: { asama: 'devralindi' }, overrideAccess: true })
  const req = await istekOlustur(payload, kullanici as unknown as Kullanici)
  await islemKaydet(req, { islem: 'Ekip daveti kabul edildi', tur: 'kurulum', kayitTuru: 'davetler', kayitId: davet.id })
  return kullanici
}

/* ---------- Ekip üyeleri ---------- */

async function ekiptenUye(payload: Payload, k: Kullanici, uyeId: number): Promise<Kullanicilar> {
  const firmaId = hedefFirma(k)
  const uye = await payload.findByID({ collection: 'kullanicilar', id: uyeId, depth: 0, overrideAccess: true }).catch((): null => null)
  if (!uye || uye.rol !== 'firma' || kimlik(uye.firma) !== firmaId) throw new IslemHatasi('Ekip üyesi bulunamadı.', 404)
  return uye
}

async function etkinYoneticiSayisi(payload: Payload, firmaId: number) {
  return (
    await payload.count({
      collection: 'kullanicilar',
      where: { and: [{ firma: { equals: firmaId } }, { rol: { equals: 'firma' } }, { firmaYetkisi: { equals: 'yonetici' } }, { pasif: { not_equals: true } }] },
      overrideAccess: true,
    })
  ).totalDocs
}

export async function yetkiDegistir(payload: Payload, k: Kullanici, uyeId: number, yetki: string) {
  if (!FIRMA_YETKILERI.includes(yetki as FirmaYetkisi)) throw new IslemHatasi('Bir yetki seçin.')
  const uye = await ekiptenUye(payload, k, uyeId)
  if (uye.firmaYetkisi === 'yonetici' && yetki !== 'yonetici' && (await etkinYoneticiSayisi(payload, kimlik(uye.firma))) <= 1)
    throw new IslemHatasi('Firmada en az bir tam yetkili kullanıcı kalmalı. Önce başka birine tam yetki verin.', 409)
  const req = await istekOlustur(payload, k)
  await payload.update({ collection: 'kullanicilar', id: uyeId, data: { firmaYetkisi: yetki as FirmaYetkisi }, overrideAccess: true, req })
  await islemKaydet(req, { islem: 'Ekip üyesinin yetkisi değişti', tur: 'kurulum', kayitTuru: 'kullanicilar', kayitId: uyeId, ayrinti: { once: uye.firmaYetkisi, sonra: yetki } })
}

export async function ekiptenCikar(payload: Payload, k: Kullanici, uyeId: number) {
  const uye = await ekiptenUye(payload, k, uyeId)
  if (uye.pasif) return
  if (uye.firmaYetkisi === 'yonetici' && (await etkinYoneticiSayisi(payload, kimlik(uye.firma))) <= 1)
    throw new IslemHatasi('Firmanın son tam yetkili kullanıcısı ekipten çıkarılamaz. Önce başka birine tam yetki verin.', 409)
  const req = await istekOlustur(payload, k)
  await payload.update({ collection: 'kullanicilar', id: uyeId, data: { pasif: true }, overrideAccess: true, req })
  await islemKaydet(req, { islem: 'Ekip üyesi çıkarıldı', tur: 'kurulum', kayitTuru: 'kullanicilar', kayitId: uyeId })
}

export async function ekibeGeriAl(payload: Payload, k: Kullanici, uyeId: number) {
  const uye = await ekiptenUye(payload, k, uyeId)
  const req = await istekOlustur(payload, k)
  await payload.update({ collection: 'kullanicilar', id: uye.id, data: { pasif: false }, overrideAccess: true, req })
  await islemKaydet(req, { islem: 'Ekip üyesi geri alındı', tur: 'kurulum', kayitTuru: 'kullanicilar', kayitId: uyeId })
}

/** Kişi kendi adını ve görevini düzenler. */
export async function kendiBilgileriniGuncelle(payload: Payload, k: Kullanici, g: { ad: string; unvan: string }) {
  const ad = g.ad.replace(/\s+/g, ' ').trim()
  if (ad.length < 3) throw new FormHatasi({ ad: 'Adınızı ve soyadınızı yazın.' })
  const req = await istekOlustur(payload, k)
  return payload.update({ collection: 'kullanicilar', id: k.id, data: { ad, unvan: g.unvan.trim().slice(0, 80) || null }, overrideAccess: true, req })
}
