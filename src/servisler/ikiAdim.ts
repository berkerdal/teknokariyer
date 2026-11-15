/**
 * İki aşamalı doğrulama akışları (talimatlar 12). Kurallar `src/alan/ikiAdim.ts`, şifreleme `src/altyapi/sifreleme.ts`.
 *
 * Giriş: şifre doğrulanınca oturum çerezi hemen yazılmaz. Oturum anahtarı şifreli ve 10 dakikalık “bekleyen giriş”
 * paketine konur. Kişi doğrulayıcı uygulamadaki kodu (veya kurtarma kodunu) girince oturum açılır. İkinci adımı henüz
 * kurmamış firma veya kurum kullanıcısı önce kurar; kurulmadan oturum açılmaz.
 *
 * Gizli anahtar veritabanında şifreli durur. Aynı kod ikinci kez kullanılamaz. 5 hatalı denemede 15 dakika kilit.
 * Kurtarma kodları yalnızca SHA-256 özetiyle saklanır ve tek kullanımlıktır.
 */
import type { Payload } from 'payload'
import { yoneticiMi, firmaKimligi, firmaYetkisiVarMi, adayMi } from '@/erisim'
import {
  EN_FAZLA_HATA,
  KILIT_DAKIKA,
  gizliAnahtarUret,
  ikiAdimZorunluMu,
  kurtarmaKoduNormal,
  kurtarmaKodlariUret,
  otpauthAdresi,
  ozet,
  totpDogrula,
} from '@/alan/ikiAdim'
import { coz, sifrele } from '@/altyapi/sifreleme'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { ikiAdimSifirlandiEpostasi } from '@/altyapi/epostaSablonlari'
import { FormHatasi, IslemHatasi, istekOlustur, kimlik, type Kullanici } from './ortak'

const AMAC_GIZLI = 'iki-adim-gizli'
const AMAC_BEKLEYEN = 'bekleyen-giris'
/** Bekleyen girişin ömrü */
export const BEKLEYEN_DAKIKA = 10

interface IkiAdimKaydi {
  id: number
  email: string
  ad?: string | null
  rol?: string | null
  firma?: unknown
  pasif?: boolean | null
  ikiAsamaliAcik?: boolean | null
  ikiAsamaliTarih?: string | null
  totpGizli?: string | null
  totpSonAdim?: number | null
  kurtarmaKodlari?: unknown
  ikiAdimHata?: number | null
  ikiAdimKilit?: string | null
}

async function kayit(payload: Payload, id: number): Promise<IkiAdimKaydi> {
  const k = await payload.findByID({ collection: 'kullanicilar', id, depth: 0, overrideAccess: true, showHiddenFields: true }).catch((): null => null)
  if (!k) throw new IslemHatasi('Hesap bulunamadı. Yeniden giriş yap.', 404)
  return k as unknown as IkiAdimKaydi
}

async function guncelle(payload: Payload, id: number, data: Record<string, unknown>) {
  await payload.update({ collection: 'kullanicilar', id, data: data as never, overrideAccess: true, context: { ikiAdim: true } })
}

/* ---------- Bekleyen giriş paketi ---------- */

export interface BekleyenGiris {
  kullaniciId: number
  token: string
  bitis: string
  rol: string
  donus: string
  son: number
}

export async function bekleyenGirisPaketle(g: Omit<BekleyenGiris, 'son'>, simdi = new Date()): Promise<{ paket: string; son: Date }> {
  const son = new Date(simdi.getTime() + BEKLEYEN_DAKIKA * 60_000)
  return { paket: await sifrele(JSON.stringify({ ...g, son: son.getTime() }), AMAC_BEKLEYEN), son }
}

export async function bekleyenGirisAc(paket: string | undefined, simdi = new Date()): Promise<BekleyenGiris | null> {
  if (!paket) return null
  const acik = await coz(paket, AMAC_BEKLEYEN)
  if (!acik) return null
  const g = JSON.parse(acik) as BekleyenGiris
  return g.son > simdi.getTime() ? g : null
}

/* ---------- Durum ---------- */

export interface IkiAdimDurumu {
  /** Bu hesapta ikinci adım sorulacak mı (zorunlu rol veya aday açmış) */
  gerekli: boolean
  kurulu: boolean
  zorunlu: boolean
  kurulumTarihi: string | null
  kalanKurtarma: number
}

export async function ikiAdimDurumu(payload: Payload, kullaniciId: number): Promise<IkiAdimDurumu> {
  const k = await kayit(payload, kullaniciId)
  const zorunlu = ikiAdimZorunluMu(k.rol)
  const kurulu = Boolean(k.ikiAsamaliAcik && k.totpGizli)
  return { gerekli: zorunlu || kurulu, kurulu, zorunlu, kurulumTarihi: k.ikiAsamaliTarih ?? null, kalanKurtarma: Array.isArray(k.kurtarmaKodlari) ? k.kurtarmaKodlari.length : 0 }
}

/* ---------- Kurulum ---------- */

/** Kurulum için gizli anahtar. Kurulum bitmeden sayfa yenilenirse aynı anahtar gösterilir. */
export async function kurulumBilgisi(payload: Payload, kullaniciId: number) {
  const k = await kayit(payload, kullaniciId)
  if (k.ikiAsamaliAcik && k.totpGizli) throw new IslemHatasi('İki aşamalı doğrulama bu hesapta zaten kurulu.', 409)
  let gizli = k.totpGizli ? await coz(k.totpGizli, AMAC_GIZLI) : null
  if (!gizli) {
    gizli = gizliAnahtarUret()
    await guncelle(payload, kullaniciId, { totpGizli: await sifrele(gizli, AMAC_GIZLI), ikiAsamaliAcik: false })
  }
  return { gizli, adres: otpauthAdresi(gizli, k.email) }
}

async function yeniKurtarmaKodlari(): Promise<{ kodlar: string[]; ozetler: string[] }> {
  const kodlar = kurtarmaKodlariUret()
  return { kodlar, ozetler: await Promise.all(kodlar.map((x) => ozet(kurtarmaKoduNormal(x)))) }
}

/** Uygulamadaki ilk kodla kurulumu tamamlar; kurtarma kodlarını bir kez döndürür. */
export async function kurulumuTamamla(payload: Payload, kullaniciId: number, kod: string, simdi = new Date()): Promise<string[]> {
  const k = await kayit(payload, kullaniciId)
  if (k.ikiAsamaliAcik) throw new IslemHatasi('İki aşamalı doğrulama bu hesapta zaten kurulu.', 409)
  const gizli = k.totpGizli ? await coz(k.totpGizli, AMAC_GIZLI) : null
  if (!gizli) throw new IslemHatasi('Kurulum süresi doldu. Sayfayı yenileyip karekodu yeniden okutun.', 409)
  if (!/^\d{6}$/.test(kod.replace(/\s/g, ''))) throw new FormHatasi({ kod: 'Uygulamada görünen 6 haneli kodu yazın.' })
  const adim = await totpDogrula(gizli, kod, simdi, 0)
  if (adim === null) throw new FormHatasi({ kod: 'Kod tutmadı. Uygulamadaki güncel kodu yazın; kod 30 saniyede bir değişir. Telefonunuzun saati otomatik ayarlı olmalı.' })
  const { kodlar, ozetler } = await yeniKurtarmaKodlari()
  await guncelle(payload, kullaniciId, { ikiAsamaliAcik: true, ikiAsamaliTarih: simdi.toISOString(), totpSonAdim: adim, kurtarmaKodlari: ozetler, ikiAdimHata: 0, ikiAdimKilit: null })
  await islemKaydet(await istekOlustur(payload, null), { islem: 'İki aşamalı doğrulama kuruldu', tur: 'hesap', kayitTuru: 'kullanicilar', kayitId: kullaniciId })
  return kodlar
}

/* ---------- Giriş sırasında doğrulama ---------- */

export interface DogrulamaSonucu {
  kurtarmaKullanildi: boolean
  kalanKurtarma: number
}

/** Uygulama kodu (6 hane) veya kurtarma kodu. Hatalı denemeler sayılır; sınır aşılınca kilitlenir. */
export async function ikinciAdimDogrula(payload: Payload, kullaniciId: number, girilen: string, simdi = new Date()): Promise<DogrulamaSonucu> {
  const k = await kayit(payload, kullaniciId)
  if (k.pasif) throw new IslemHatasi('Bu hesap kapatıldı.', 403)
  if (!k.ikiAsamaliAcik || !k.totpGizli) throw new IslemHatasi('Bu hesapta iki aşamalı doğrulama kurulu değil.', 409)
  if (k.ikiAdimKilit && new Date(k.ikiAdimKilit) > simdi) {
    const dk = Math.ceil((new Date(k.ikiAdimKilit).getTime() - simdi.getTime()) / 60_000)
    throw new IslemHatasi(`Çok sayıda hatalı kod girildi. ${dk} dakika sonra yeniden deneyin.`, 403)
  }
  const temiz = girilen.trim()
  if (!temiz) throw new FormHatasi({ kod: 'Kodu yazın.' })
  const gizli = (await coz(k.totpGizli, AMAC_GIZLI))!
  const ozetler = Array.isArray(k.kurtarmaKodlari) ? (k.kurtarmaKodlari as string[]) : []
  const req = await istekOlustur(payload, null)

  if (/^\d[\d\s]{5,7}$/.test(temiz)) {
    const adim = await totpDogrula(gizli, temiz, simdi, k.totpSonAdim ?? 0)
    if (adim !== null) {
      await guncelle(payload, kullaniciId, { totpSonAdim: adim, ikiAdimHata: 0, ikiAdimKilit: null })
      return { kurtarmaKullanildi: false, kalanKurtarma: ozetler.length }
    }
  } else {
    const o = await ozet(kurtarmaKoduNormal(temiz))
    if (ozetler.includes(o)) {
      const kalan = ozetler.filter((x) => x !== o)
      await guncelle(payload, kullaniciId, { kurtarmaKodlari: kalan, ikiAdimHata: 0, ikiAdimKilit: null })
      await islemKaydet(req, { islem: 'Kurtarma koduyla giriş yapıldı', tur: 'hesap', kayitTuru: 'kullanicilar', kayitId: kullaniciId, ayrinti: { kalan: kalan.length } })
      return { kurtarmaKullanildi: true, kalanKurtarma: kalan.length }
    }
  }
  const hata = (k.ikiAdimHata ?? 0) + 1
  if (hata >= EN_FAZLA_HATA) {
    await guncelle(payload, kullaniciId, { ikiAdimHata: 0, ikiAdimKilit: new Date(simdi.getTime() + KILIT_DAKIKA * 60_000).toISOString() })
    await islemKaydet(req, { islem: 'İki aşamalı doğrulama hatalı kodlar yüzünden kilitlendi', tur: 'hesap', kayitTuru: 'kullanicilar', kayitId: kullaniciId })
    throw new IslemHatasi(`Çok sayıda hatalı kod girildi. Güvenliğiniz için ${KILIT_DAKIKA} dakika beklemeniz gerekiyor.`, 403)
  }
  await guncelle(payload, kullaniciId, { ikiAdimHata: hata })
  throw new FormHatasi({ kod: `Kod tutmadı. Uygulamadaki güncel kodu yazın. ${EN_FAZLA_HATA - hata} deneme hakkınız kaldı.` })
}

/* ---------- Oturum açıkken ---------- */

/** Yeni kurtarma kodları (eskiler geçersiz olur). Güncel uygulama kodu istenir. */
export async function kurtarmaKodlariniYenile(payload: Payload, k: Kullanici, kod: string, simdi = new Date()): Promise<string[]> {
  const kayitlar = await kayit(payload, Number(k.id))
  if (!kayitlar.ikiAsamaliAcik || !kayitlar.totpGizli) throw new IslemHatasi('İki aşamalı doğrulama kurulu değil.', 409)
  const gizli = (await coz(kayitlar.totpGizli, AMAC_GIZLI))!
  const adim = await totpDogrula(gizli, kod, simdi, kayitlar.totpSonAdim ?? 0)
  if (adim === null) throw new FormHatasi({ kod: 'Kod tutmadı. Uygulamadaki güncel 6 haneli kodu yazın.' })
  const { kodlar, ozetler } = await yeniKurtarmaKodlari()
  await guncelle(payload, Number(k.id), { kurtarmaKodlari: ozetler, totpSonAdim: adim })
  await islemKaydet(await istekOlustur(payload, k), { islem: 'Kurtarma kodları yenilendi', tur: 'hesap', kayitTuru: 'kullanicilar', kayitId: k.id })
  return kodlar
}

/** Aday isterse ikinci adımı kapatır (firma ve kurum hesaplarında kapatılamaz). */
export async function ikiAdimiKapat(payload: Payload, k: Kullanici, kod: string, simdi = new Date()) {
  if (!adayMi(k)) throw new IslemHatasi('Firma ve Yönetici A.Ş. hesaplarında iki aşamalı doğrulama kapatılamaz.', 403)
  const kayitlar = await kayit(payload, Number(k.id))
  if (!kayitlar.ikiAsamaliAcik || !kayitlar.totpGizli) throw new IslemHatasi('İki aşamalı doğrulama zaten kapalı.', 409)
  const gizli = (await coz(kayitlar.totpGizli, AMAC_GIZLI))!
  if ((await totpDogrula(gizli, kod, simdi, kayitlar.totpSonAdim ?? 0)) === null) throw new FormHatasi({ kod: 'Kod tutmadı. Uygulamadaki güncel 6 haneli kodu yaz.' })
  await guncelle(payload, Number(k.id), { ikiAsamaliAcik: false, ikiAsamaliTarih: null, totpGizli: null, totpSonAdim: null, kurtarmaKodlari: null, ikiAdimHata: 0, ikiAdimKilit: null })
  await islemKaydet(await istekOlustur(payload, k), { islem: 'İki aşamalı doğrulama kapatıldı', tur: 'hesap', kayitTuru: 'kullanicilar', kayitId: k.id })
}

/**
 * Telefonu kaybeden kişi için sıfırlama: kişi bir sonraki girişte ikinci adımı yeniden kurar.
 * Tam yetkili Yönetici A.Ş. kullanıcısı herkesi, firmanın tam yetkilisi kendi ekibini sıfırlayabilir. Kimse kendini
 * sıfırlayamaz (kurtarma kodu bunun içindir). Kişiye bilgi e-postası gider.
 */
export async function ikiAdimiSifirla(payload: Payload, yapan: Kullanici, hedefId: number) {
  if (Number(yapan.id) === hedefId) throw new IslemHatasi('Kendi iki aşamalı doğrulamanızı sıfırlayamazsınız. Telefonunuz yoksa kurtarma kodlarınızdan birini kullanın.', 403)
  const hedef = await kayit(payload, hedefId)
  const firmaYoneticisi = firmaYetkisiVarMi(yapan, ['yonetici']) && hedef.rol === 'firma' && kimlik(hedef.firma) === firmaKimligi(yapan)
  if (!yoneticiMi(yapan) && !firmaYoneticisi) throw new IslemHatasi('Bu kişinin iki aşamalı doğrulamasını sıfırlama yetkiniz yok.', 403)
  if (!hedef.ikiAsamaliAcik && !hedef.totpGizli) throw new IslemHatasi('Bu kişide iki aşamalı doğrulama zaten kurulu değil.', 409)
  await guncelle(payload, hedefId, { ikiAsamaliAcik: false, ikiAsamaliTarih: null, totpGizli: null, totpSonAdim: null, kurtarmaKodlari: null, ikiAdimHata: 0, ikiAdimKilit: null })
  await islemKaydet(await istekOlustur(payload, yapan), { islem: 'İki aşamalı doğrulama sıfırlandı', tur: 'hesap', kayitTuru: 'kullanicilar', kayitId: hedefId })
  const e = ikiAdimSifirlandiEpostasi({ ad: hedef.ad ?? '', hitap: hedef.rol === 'aday' ? 'sen' : 'siz', sifirlayan: yapan.ad ?? 'Yönetici' })
  try {
    await payload.sendEmail({ to: hedef.email, subject: e.konu, html: e.html, text: e.metin })
    return { eposta: true }
  } catch {
    return { eposta: false }
  }
}

/* ---------- Kurtarma kodlarının bir kez gösterilmesi ---------- */

const AMAC_KURTARMA = 'kurtarma-gosterim'

/** Yeni kodlar, gösterileceği sayfaya şifreli ve 15 dakikalık bir paketle taşınır; sayfada “kaydettim” deyince silinir. */
export async function kurtarmaPaketle(kodlar: string[], donus: string, simdi = new Date()) {
  const son = new Date(simdi.getTime() + 15 * 60_000)
  return { paket: await sifrele(JSON.stringify({ kodlar, donus, son: son.getTime() }), AMAC_KURTARMA), son }
}

export async function kurtarmaAc(paket: string | undefined, simdi = new Date()): Promise<{ kodlar: string[]; donus: string } | null> {
  if (!paket) return null
  const acik = await coz(paket, AMAC_KURTARMA)
  if (!acik) return null
  const v = JSON.parse(acik) as { kodlar: string[]; donus: string; son: number }
  return v.son > simdi.getTime() ? v : null
}
