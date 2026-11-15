/**
 * İki aşamalı doğrulama akışları (talimatlar 12; K33). Kurallar `src/alan/ikiAdim.ts`, şifreleme `src/altyapi/sifreleme.ts`.
 *
 * Giriş: şifre doğrulanınca, ikinci adım gerekiyorsa oturum çerezi hemen yazılmaz. Oturum anahtarı şifreli ve 10 dakikalık
 * “bekleyen giriş” paketine konur; kişi kodu girince oturum açılır. İkinci adım şu durumlarda sorulur:
 * - Tanınan cihazdan (90 gün içinde doğrulanmış) girişte sorulmaz.
 * - Doğrulayıcı uygulamayı kurmuş kişiye (her rol) yeni cihazda uygulama kodu veya kurtarma kodu sorulur.
 * - Uygulamayı kurmamış firma ve Yönetici A.Ş. kullanıcısına yeni cihazda e-postayla 6 haneli kod gönderilir (zorunlu).
 * - Uygulamayı kurmamış adaya sorulmaz.
 *
 * Gizli anahtar şifreli; e-posta kodu, kurtarma kodları ve cihaz anahtarları yalnızca SHA-256 özetiyle saklanır. Aynı
 * uygulama kodu iki kez geçmez. 5 hatalı denemede 15 dakika kilit. Şifre yenilenince tanınan cihazlar unutulur.
 */
import type { Payload } from 'payload'
import { yoneticiMi, firmaKimligi, firmaYetkisiVarMi } from '@/erisim'
import {
  cihazAdi,
  guvenlikAyarlari,
  type GuvenlikAyarlari,
  cihazEkle,
  epostaKoduUret,
  gecerliCihazlar,
  gizliAnahtarUret,
  ikiAdimZorunluMu,
  kurtarmaKoduNormal,
  kurtarmaKodlariUret,
  otpauthAdresi,
  ozet,
  totpDogrula,
  type TaninanCihaz,
} from '@/alan/ikiAdim'
import { coz, sifrele } from '@/altyapi/sifreleme'
import { ortam } from '@/altyapi/eposta'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { girisKoduEpostasi, ikiAdimSifirlandiEpostasi } from '@/altyapi/epostaSablonlari'
import { FormHatasi, IslemHatasi, ayarlar, istekOlustur, kimlik, type Kullanici } from './ortak'

const AMAC_GIZLI = 'iki-adim-gizli'
const AMAC_BEKLEYEN = 'bekleyen-giris'
/** Bekleyen girişin ömrü */
export const BEKLEYEN_DAKIKA = 10

export type DogrulamaYontemi = 'yok' | 'uygulama' | 'eposta'

interface EpostaKodu {
  ozet: string
  son: string
  gonderimler: string[]
  /** Yalnızca yayın dışı ortamda: e-posta dışarı çıkmadığı için kodun ekranda yeniden gösterilebilmesi */
  test?: string
}

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
  taninanCihazlar?: unknown
  epostaKodu?: EpostaKodu | null
}

async function kayit(payload: Payload, id: number): Promise<IkiAdimKaydi> {
  const k = await payload.findByID({ collection: 'kullanicilar', id, depth: 0, overrideAccess: true, showHiddenFields: true }).catch((): null => null)
  if (!k) throw new IslemHatasi('Hesap bulunamadı. Yeniden giriş yapın.', 404)
  return k as unknown as IkiAdimKaydi
}

async function guncelle(payload: Payload, id: number, data: Record<string, unknown>) {
  await payload.update({ collection: 'kullanicilar', id, data: data as never, overrideAccess: true, context: { ikiAdim: true } })
}

const uygulamaKurulu = (k: IkiAdimKaydi) => Boolean(k.ikiAsamaliAcik && k.totpGizli)

/** Süreler ve sınırlar Yönetici A.Ş. → Ayarlar'dan gelir (sınır dışı veya boş değerde varsayılan). */
export async function guvenlikAyarlariniAl(payload: Payload): Promise<GuvenlikAyarlari> {
  return guvenlikAyarlari((await ayarlar(payload)).guvenlik)
}

/* ---------- Bekleyen giriş paketi ---------- */

export interface BekleyenGiris {
  kullaniciId: number
  token: string
  bitis: string
  rol: string
  donus: string
  yontem: Exclude<DogrulamaYontemi, 'yok'>
  /** Kodun gittiği adres, maskeli (yalnızca e-posta yönteminde) */
  adres?: string
  /** Yalnızca yayın dışı ortamda: e-postalar dışarı çıkmadığı için kod ekranda gösterilir */
  testKodu?: string
  /** Yeni kod gönderilmedi; az önce gönderilen ve hâlâ geçerli kod kullanılacak */
  oncekiKod?: boolean
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

/* ---------- Cihaz ---------- */

/** Bu cihazdan girişte hangi doğrulama sorulacak? Tanınan cihazın son kullanımı güncellenir (90 gün yeniden başlar). */
export async function girisDogrulamaYontemi(payload: Payload, kullaniciId: number, cihazAnahtari: string | undefined, simdi = new Date()): Promise<DogrulamaYontemi> {
  const k = await kayit(payload, kullaniciId)
  const uygulama = uygulamaKurulu(k)
  if (!uygulama && !ikiAdimZorunluMu(k.rol)) return 'yok'
  if (cihazAnahtari) {
    const { cihazGun } = await guvenlikAyarlariniAl(payload)
    const o = await ozet(cihazAnahtari)
    const c = gecerliCihazlar(k.taninanCihazlar, simdi, cihazGun).find((x) => x.ozet === o)
    if (c) {
      await guncelle(payload, kullaniciId, { taninanCihazlar: cihazEkle(k.taninanCihazlar, { ozet: o, ad: c.ad }, simdi, cihazGun) })
      return 'yok'
    }
  }
  return uygulama ? 'uygulama' : 'eposta'
}

/** Doğrulamadan sonra cihazı hatırlar. */
export async function cihaziHatirla(payload: Payload, kullaniciId: number, cihazAnahtari: string, tarayici: string | null, simdi = new Date()) {
  const k = await kayit(payload, kullaniciId)
  const { cihazGun } = await guvenlikAyarlariniAl(payload)
  await guncelle(payload, kullaniciId, { taninanCihazlar: cihazEkle(k.taninanCihazlar, { ozet: await ozet(cihazAnahtari), ad: cihazAdi(tarayici) }, simdi, cihazGun) })
}

export async function taninanCihazlar(payload: Payload, kullaniciId: number, cihazAnahtari?: string, simdi = new Date()) {
  const k = await kayit(payload, kullaniciId)
  const buCihaz = cihazAnahtari ? await ozet(cihazAnahtari) : null
  const { cihazGun } = await guvenlikAyarlariniAl(payload)
  return gecerliCihazlar(k.taninanCihazlar, simdi, cihazGun).map((c: TaninanCihaz) => ({ ...c, kimlik: c.ozet.slice(0, 16), buCihaz: c.ozet === buCihaz }))
}

/** Bir cihazı (kimliği özetin ilk 16 karakteri) veya hepsini unutur. */
export async function cihazlariUnut(payload: Payload, k: Kullanici, kimlikOneki?: string) {
  const kayitlar = await kayit(payload, Number(k.id))
  const liste = Array.isArray(kayitlar.taninanCihazlar) ? (kayitlar.taninanCihazlar as TaninanCihaz[]) : []
  const kalan = kimlikOneki ? liste.filter((c) => !c.ozet.startsWith(kimlikOneki)) : []
  await guncelle(payload, Number(k.id), { taninanCihazlar: kalan })
  await islemKaydet(await istekOlustur(payload, k), { islem: kimlikOneki ? 'Tanınan bir cihaz unutuldu' : 'Bütün tanınan cihazlar unutuldu', tur: 'hesap', kayitTuru: 'kullanicilar', kayitId: k.id })
}

/** Şifre yenilenince tanınan cihazlar unutulur (şifresi ele geçmiş hesapta açık cihaz kalmasın). */
export async function cihazlariTemizle(payload: Payload, kullaniciId: number) {
  await guncelle(payload, kullaniciId, { taninanCihazlar: [] })
}

/* ---------- E-posta kodu ---------- */

/**
 * Yeni cihaz için e-posta kodu üretir ve gönderir. Bekleme süresi, saatlik sınır ve kodun süresi Ayarlar'dan gelir
 * (varsayılan: 60 saniyede bir, saatte en fazla 5, 10 dakika).
 * Kodun yalnızca özeti saklanır. Yayın dışı ortamda kod, ekranda gösterilmek üzere döner.
 */
export async function epostaKoduGonder(
  payload: Payload,
  kullaniciId: number,
  simdi = new Date(),
  /**
   * Girişte çağrıldığında: hâlâ geçerli bir kod varken bekleme veya saatlik sınır sürüyorsa yenisi gönderilmez, o kullanılır.
   * Geçerli kod yoksa bekleme uygulanmaz (ör. bir cihazda kod kullanıldıktan hemen sonra başka cihazdan giriş); saatlik sınır geçerlidir.
   */
  girisSirasinda = false,
): Promise<{ kod: string | null; eposta: boolean; onceki?: boolean }> {
  const k = await kayit(payload, kullaniciId)
  const { yenidenGonderSaniye: YENIDEN_GONDER_SANIYE, saatteEnFazlaKod: SAATTE_EN_FAZLA_KOD, epostaKoduDakika: EPOSTA_KODU_DAKIKA } = await guvenlikAyarlariniAl(payload)
  const onceki = (k.epostaKodu?.gonderimler ?? []).filter((t) => simdi.getTime() - new Date(t).getTime() < 3_600_000)
  const sonGonderim = onceki.at(-1)
  const beklemede = Boolean(sonGonderim && simdi.getTime() - new Date(sonGonderim).getTime() < YENIDEN_GONDER_SANIYE * 1000)
  const sinirda = onceki.length >= SAATTE_EN_FAZLA_KOD
  const gecerliKod = Boolean(k.epostaKodu?.ozet && new Date(k.epostaKodu.son) > simdi)
  if (girisSirasinda && (beklemede || sinirda) && gecerliKod) return { kod: k.epostaKodu?.test ?? null, eposta: true, onceki: true }
  // Bekleme yalnızca “Yeni kod gönder” düğmesi içindir; girişte kod göndermek doğru şifre ister ve IP sınırına bağlıdır.
  if (beklemede && !girisSirasinda) throw new IslemHatasi(`Yeni kod istemeden önce ${YENIDEN_GONDER_SANIYE} saniye bekleyin.`, 409)
  if (sinirda) throw new IslemHatasi('Bir saat içinde çok sayıda kod istendi. Biraz sonra yeniden deneyin.', 409)
  const kod = epostaKoduUret()
  await guncelle(payload, kullaniciId, {
    epostaKodu: {
      ozet: await ozet(`${kullaniciId}:${kod}`),
      son: new Date(simdi.getTime() + EPOSTA_KODU_DAKIKA * 60_000).toISOString(),
      gonderimler: [...onceki, simdi.toISOString()],
      ...(ortam() !== 'yayin' ? { test: kod } : {}),
    },
  })
  const e = girisKoduEpostasi({ ad: k.ad ?? '', kod, dakika: EPOSTA_KODU_DAKIKA, hitap: k.rol === 'aday' ? 'sen' : 'siz' })
  try {
    await payload.sendEmail({ to: k.email, subject: e.konu, html: e.html, text: e.metin })
    return { kod, eposta: true }
  } catch (err) {
    console.error('Giriş kodu e-postası gönderilemedi', err)
    return { kod, eposta: false }
  }
}

/* ---------- Doğrulayıcı uygulama kurulumu ---------- */

/** Kurulum için gizli anahtar. Kurulum bitmeden sayfa yenilenirse aynı anahtar gösterilir. */
export async function kurulumBilgisi(payload: Payload, kullaniciId: number) {
  const k = await kayit(payload, kullaniciId)
  if (uygulamaKurulu(k)) throw new IslemHatasi('Doğrulayıcı uygulama bu hesapta zaten kurulu.', 409)
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
  if (k.ikiAsamaliAcik) throw new IslemHatasi('Doğrulayıcı uygulama bu hesapta zaten kurulu.', 409)
  const gizli = k.totpGizli ? await coz(k.totpGizli, AMAC_GIZLI) : null
  if (!gizli) throw new IslemHatasi('Kurulum süresi doldu. Sayfayı yenileyip karekodu yeniden okutun.', 409)
  if (!/^\d{6}$/.test(kod.replace(/\s/g, ''))) throw new FormHatasi({ kod: 'Uygulamada görünen 6 haneli kodu yazın.' })
  const adim = await totpDogrula(gizli, kod, simdi, 0)
  if (adim === null) throw new FormHatasi({ kod: 'Kod tutmadı. Uygulamadaki güncel kodu yazın; kod 30 saniyede bir değişir. Telefonunuzun saati otomatik ayarlı olmalı.' })
  const { kodlar, ozetler } = await yeniKurtarmaKodlari()
  await guncelle(payload, kullaniciId, { ikiAsamaliAcik: true, ikiAsamaliTarih: simdi.toISOString(), totpSonAdim: adim, kurtarmaKodlari: ozetler, ikiAdimHata: 0, ikiAdimKilit: null })
  await islemKaydet(await istekOlustur(payload, null), { islem: 'Doğrulayıcı uygulama kuruldu', tur: 'hesap', kayitTuru: 'kullanicilar', kayitId: kullaniciId })
  return kodlar
}

/* ---------- Giriş sırasında doğrulama ---------- */

export interface DogrulamaSonucu {
  kurtarmaKullanildi: boolean
  kalanKurtarma: number
}

async function hataSay(payload: Payload, k: IkiAdimKaydi, simdi: Date, siz: boolean): Promise<never> {
  const { enFazlaHata: EN_FAZLA_HATA, kilitDakika: KILIT_DAKIKA } = await guvenlikAyarlariniAl(payload)
  const hata = (k.ikiAdimHata ?? 0) + 1
  if (hata >= EN_FAZLA_HATA) {
    await guncelle(payload, k.id, { ikiAdimHata: 0, ikiAdimKilit: new Date(simdi.getTime() + KILIT_DAKIKA * 60_000).toISOString(), epostaKodu: null })
    await islemKaydet(await istekOlustur(payload, null), { islem: 'İkinci adım hatalı kodlar yüzünden kilitlendi', tur: 'hesap', kayitTuru: 'kullanicilar', kayitId: k.id })
    throw new IslemHatasi(siz ? `Çok sayıda hatalı kod girildi. Güvenliğiniz için ${KILIT_DAKIKA} dakika beklemeniz gerekiyor.` : `Çok sayıda hatalı kod girildi. Güvenliğin için ${KILIT_DAKIKA} dakika beklemen gerekiyor.`, 403)
  }
  await guncelle(payload, k.id, { ikiAdimHata: hata })
  throw new FormHatasi({ kod: siz ? `Kod tutmadı. ${EN_FAZLA_HATA - hata} deneme hakkınız kaldı.` : `Kod tutmadı. ${EN_FAZLA_HATA - hata} deneme hakkın kaldı.` })
}

/** İkinci adım: e-posta kodu, uygulama kodu veya kurtarma kodu. Hatalı denemeler sayılır; sınır aşılınca kilitlenir. */
export async function ikinciAdimDogrula(payload: Payload, kullaniciId: number, girilen: string, yontem: Exclude<DogrulamaYontemi, 'yok'>, simdi = new Date()): Promise<DogrulamaSonucu> {
  const k = await kayit(payload, kullaniciId)
  const siz = k.rol !== 'aday'
  if (k.pasif) throw new IslemHatasi('Bu hesap kapatıldı.', 403)
  if (k.ikiAdimKilit && new Date(k.ikiAdimKilit) > simdi) {
    const dk = Math.ceil((new Date(k.ikiAdimKilit).getTime() - simdi.getTime()) / 60_000)
    throw new IslemHatasi(siz ? `Çok sayıda hatalı kod girildi. ${dk} dakika sonra yeniden deneyin.` : `Çok sayıda hatalı kod girildi. ${dk} dakika sonra yeniden dene.`, 403)
  }
  const temiz = girilen.trim()
  if (!temiz) throw new FormHatasi({ kod: siz ? 'Kodu yazın.' : 'Kodu yaz.' })
  const ozetler = Array.isArray(k.kurtarmaKodlari) ? (k.kurtarmaKodlari as string[]) : []

  if (yontem === 'eposta') {
    const ek = k.epostaKodu
    if (!ek || new Date(ek.son) <= simdi) throw new FormHatasi({ kod: siz ? 'Kodun süresi doldu. “Yeni kod gönder” düğmesiyle yeni bir kod isteyin.' : 'Kodun süresi doldu. “Yeni kod gönder” düğmesiyle yeni bir kod iste.' })
    if ((await ozet(`${kullaniciId}:${temiz.replace(/\s/g, '')}`)) === ek.ozet) {
      await guncelle(payload, kullaniciId, { epostaKodu: { ...ek, ozet: '', test: undefined, son: simdi.toISOString() }, ikiAdimHata: 0, ikiAdimKilit: null })
      return { kurtarmaKullanildi: false, kalanKurtarma: ozetler.length }
    }
    return hataSay(payload, k, simdi, siz)
  }

  if (!uygulamaKurulu(k)) throw new IslemHatasi('Bu hesapta doğrulayıcı uygulama kurulu değil.', 409)
  const gizli = (await coz(k.totpGizli!, AMAC_GIZLI))!
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
      await islemKaydet(await istekOlustur(payload, null), { islem: 'Kurtarma koduyla giriş yapıldı', tur: 'hesap', kayitTuru: 'kullanicilar', kayitId: kullaniciId, ayrinti: { kalan: kalan.length } })
      return { kurtarmaKullanildi: true, kalanKurtarma: kalan.length }
    }
  }
  return hataSay(payload, k, simdi, siz)
}

/* ---------- Oturum açıkken ---------- */

export interface GuvenlikDurumu {
  /** Doğrulayıcı uygulama kurulu mu */
  uygulama: boolean
  /** Yeni cihazda e-posta kodu zorunlu mu (firma ve kurum) */
  zorunlu: boolean
  kurulumTarihi: string | null
  kalanKurtarma: number
}

export async function guvenlikDurumu(payload: Payload, kullaniciId: number): Promise<GuvenlikDurumu> {
  const k = await kayit(payload, kullaniciId)
  return {
    uygulama: uygulamaKurulu(k),
    zorunlu: ikiAdimZorunluMu(k.rol),
    kurulumTarihi: k.ikiAsamaliTarih ?? null,
    kalanKurtarma: Array.isArray(k.kurtarmaKodlari) ? k.kurtarmaKodlari.length : 0,
  }
}

/** Yeni kurtarma kodları (eskiler geçersiz olur). Güncel uygulama kodu istenir. */
export async function kurtarmaKodlariniYenile(payload: Payload, k: Kullanici, kod: string, simdi = new Date()): Promise<string[]> {
  const kayitlar = await kayit(payload, Number(k.id))
  if (!uygulamaKurulu(kayitlar)) throw new IslemHatasi('Doğrulayıcı uygulama kurulu değil.', 409)
  const gizli = (await coz(kayitlar.totpGizli!, AMAC_GIZLI))!
  const adim = await totpDogrula(gizli, kod, simdi, kayitlar.totpSonAdim ?? 0)
  if (adim === null) throw new FormHatasi({ kod: 'Kod tutmadı. Uygulamadaki güncel 6 haneli kodu yazın.' })
  const { kodlar, ozetler } = await yeniKurtarmaKodlari()
  await guncelle(payload, Number(k.id), { kurtarmaKodlari: ozetler, totpSonAdim: adim })
  await islemKaydet(await istekOlustur(payload, k), { islem: 'Kurtarma kodları yenilendi', tur: 'hesap', kayitTuru: 'kullanicilar', kayitId: k.id })
  return kodlar
}

const UYGULAMAYI_TEMIZLE: Record<string, unknown> = { ikiAsamaliAcik: false, ikiAsamaliTarih: null, totpGizli: null, totpSonAdim: null, kurtarmaKodlari: null, ikiAdimHata: 0, ikiAdimKilit: null }

/** Kişi doğrulayıcı uygulamayı kaldırır (önerilen ama isteğe bağlı; K33). Firma ve kurumda yeni cihazda e-posta kodu sürer. */
export async function ikiAdimiKapat(payload: Payload, k: Kullanici, kod: string, simdi = new Date()) {
  const kayitlar = await kayit(payload, Number(k.id))
  if (!uygulamaKurulu(kayitlar)) throw new IslemHatasi('Doğrulayıcı uygulama zaten kurulu değil.', 409)
  const gizli = (await coz(kayitlar.totpGizli!, AMAC_GIZLI))!
  if ((await totpDogrula(gizli, kod, simdi, kayitlar.totpSonAdim ?? 0)) === null) throw new FormHatasi({ kod: k.rol === 'aday' ? 'Kod tutmadı. Uygulamadaki güncel 6 haneli kodu yaz.' : 'Kod tutmadı. Uygulamadaki güncel 6 haneli kodu yazın.' })
  await guncelle(payload, Number(k.id), UYGULAMAYI_TEMIZLE)
  await islemKaydet(await istekOlustur(payload, k), { islem: 'Doğrulayıcı uygulama kaldırıldı', tur: 'hesap', kayitTuru: 'kullanicilar', kayitId: k.id })
}

/**
 * Telefonunu kaybeden veya şüpheli giriş gören kişi için sıfırlama: doğrulayıcı uygulama kaldırılır ve tanınan cihazlar
 * unutulur; bir sonraki girişte (firma ve kurumda) e-posta kodu istenir. Tam yetkili Yönetici A.Ş. kullanıcısı herkesi,
 * firmanın tam yetkilisi kendi ekibini sıfırlayabilir. Kimse kendini sıfırlayamaz. Kişiye bilgi e-postası gider.
 */
export async function ikiAdimiSifirla(payload: Payload, yapan: Kullanici, hedefId: number) {
  if (Number(yapan.id) === hedefId) throw new IslemHatasi('Kendi doğrulamanızı buradan sıfırlayamazsınız. Hesap güvenliği sayfasını kullanın; telefonunuz yoksa kurtarma kodlarınızdan birini kullanın.', 403)
  const hedef = await kayit(payload, hedefId)
  const firmaYoneticisi = firmaYetkisiVarMi(yapan, ['yonetici']) && hedef.rol === 'firma' && kimlik(hedef.firma) === firmaKimligi(yapan)
  if (!yoneticiMi(yapan) && !firmaYoneticisi) throw new IslemHatasi('Bu kişinin doğrulamasını sıfırlama yetkiniz yok.', 403)
  const cihazVar = gecerliCihazlar(hedef.taninanCihazlar, new Date()).length > 0
  if (!uygulamaKurulu(hedef) && !hedef.totpGizli && !cihazVar) throw new IslemHatasi('Bu kişide sıfırlanacak bir doğrulama yok.', 409)
  await guncelle(payload, hedefId, { ...UYGULAMAYI_TEMIZLE, taninanCihazlar: [], epostaKodu: null })
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
