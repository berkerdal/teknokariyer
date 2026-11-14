/**
 * İlgili kişi başvuruları (KVKK m. 11, 13). Talepleri yalnızca bu servisler yazar; her adım işlem kaydına geçer.
 *
 * - Aday, hesabına giriş yapıp portal formundan başvurur: kimliği doğrulanmış sayılır, cevap e-posta adresi hesabındaki
 *   adrestir. Aynı anda en fazla 3 açık başvurusu olabilir.
 * - E-postayla, yazılı veya KEP ile gelen başvuruyu tam yetkili Yönetici A.Ş. kullanıcısı panele kaydeder. Adres
 *   portalda kayıtlı bir aday hesabına aitse başvuru o hesaba bağlanır.
 * - Sonuçlandırma gerekçelidir: cevap boş olamaz, taslaktaki yer tutucular doldurulmadan gönderilemez.
 * - E-posta gitmezse işlem geçerli kalır; panel uyarır.
 */
import type { Payload } from 'payload'
import { adayMi, yoneticiMi } from '@/erisim'
import {
  ACIK_BASVURU_SINIRI,
  KVKK_SONUC_ADI,
  KVKK_TUR_ADI,
  aciklamaZorunluMu,
  basvuruTarihiDenetle,
  kvkkTuruMu,
  sonGun,
  yerTutucuVarMi,
  type KimlikYontemi,
  type KvkkKanal,
  type KvkkSonuc,
} from '@/alan/kvkk'
import { trGunu } from '@/alan/tarih'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { KURUM } from '@/altyapi/kurum'
import { kvkkAlindiEpostasi, kvkkCevapEpostasi, kvkkYeniBasvuruEpostasi, type Eposta } from '@/altyapi/epostaSablonlari'
import { epostaGecerliMi, epostaNormallestir } from './hesapKurallari'
import { adayHesabiniSil } from './hesapSilme'
import { FormHatasi, IslemHatasi, istekOlustur, kimlik, type Kullanici } from './ortak'

async function gonder(payload: Payload, kime: string, e: Eposta): Promise<boolean> {
  try {
    await payload.sendEmail({ to: kime, subject: e.konu, html: e.html, text: e.metin })
    return true
  } catch (err) {
    console.error('KVKK e-postası gönderilemedi', err)
    return false
  }
}

function yetkiDenetle(k: Kullanici) {
  if (!yoneticiMi(k)) throw new IslemHatasi('KVKK başvurularını yalnızca tam yetkili Yönetici A.Ş. kullanıcıları yönetebilir.', 403)
}

async function talepAl(payload: Payload, id: number) {
  const t = await payload.findByID({ collection: 'kvkk-talepleri', id, depth: 0, overrideAccess: true }).catch((): null => null)
  if (!t) throw new IslemHatasi('Başvuru bulunamadı.', 404)
  return t
}

/** Adayın portal formundan başvurusu. */
export async function kvkkBasvurusuYap(payload: Payload, k: Kullanici, girdi: { tur: string; aciklama?: string }) {
  if (!adayMi(k)) throw new IslemHatasi('Portal formundan yalnızca aday hesapları başvurabilir. Firmalar ve diğer kişiler kvkk@pauteknokent.com.tr adresine yazabilir.', 403)
  if (!kvkkTuruMu(girdi.tur)) throw new FormHatasi({ tur: 'Başvurunun konusunu seç.' })
  const aciklama = (girdi.aciklama ?? '').trim()
  if (aciklamaZorunluMu(girdi.tur) && aciklama.length < 10) throw new FormHatasi({ aciklama: 'Bu başvuru türünde ne istediğini birkaç cümleyle açıkla.' })
  if (aciklama.length > 3000) throw new FormHatasi({ aciklama: 'Açıklama en fazla 3000 karakter olabilir.' })
  const acik = await payload.count({ collection: 'kvkk-talepleri', where: { and: [{ kullanici: { equals: k.id } }, { durum: { not_equals: 'sonuclandi' } }] }, overrideAccess: true })
  if (acik.totalDocs >= ACIK_BASVURU_SINIRI)
    throw new IslemHatasi(`Sonuçlanmamış ${acik.totalDocs} başvurun var. Yeni başvuru için önce bunların sonuçlanmasını bekle veya ${KURUM.kvkkEposta} adresine yaz.`, 409)
  const simdi = new Date()
  const req = await istekOlustur(payload, k)
  const t = await payload.create({
    collection: 'kvkk-talepleri',
    overrideAccess: true,
    req,
    data: {
      tur: girdi.tur,
      aciklama: aciklama || null,
      kanal: 'portal',
      kullanici: k.id,
      basvuranAd: k.ad ?? k.email,
      basvuranEposta: k.email,
      basvuruTarihi: simdi.toISOString(),
      kimlik: 'hesap',
      durum: 'alindi',
    },
  })
  await islemKaydet(req, { islem: 'KVKK başvurusu yapıldı', tur: 'kisisel-veri', kayitTuru: 'kvkk-talepleri', kayitId: t.id, ayrinti: { tur: girdi.tur, kanal: 'portal' } })
  const son = sonGun(simdi)
  const eposta = await gonder(payload, k.email, kvkkAlindiEpostasi({ ad: k.ad ?? '', turAdi: KVKK_TUR_ADI[girdi.tur], sonGun: son, hitap: 'sen' }))
  await gonder(payload, KURUM.kvkkEposta, kvkkYeniBasvuruEpostasi({ id: t.id, turAdi: KVKK_TUR_ADI[girdi.tur], sonGun: son }))
  return { talep: t, eposta }
}

export interface ElleKayit {
  tur: string
  aciklama?: string
  kanal: string
  ad: string
  eposta: string
  basvuruTarihi: string
  kimlik: string
  /** Kişiye “başvurunuz alındı” e-postası gönderilsin mi */
  alindiBildir?: boolean
}

/** E-postayla, yazılı veya KEP ile gelen başvurunun panele kaydı. */
export async function kvkkTalebiKaydet(payload: Payload, k: Kullanici, g: ElleKayit) {
  yetkiDenetle(k)
  const hatalar: Record<string, string> = {}
  if (!kvkkTuruMu(g.tur)) hatalar.tur = 'Başvurunun konusunu seçin.'
  if (!['eposta', 'yazili', 'kep'].includes(g.kanal)) hatalar.kanal = 'Başvurunun hangi yolla geldiğini seçin.'
  const ad = g.ad.trim()
  if (ad.length < 2) hatalar.ad = 'Başvuranın adını ve soyadını yazın.'
  const eposta = epostaNormallestir(g.eposta)
  if (!epostaGecerliMi(eposta)) hatalar.eposta = 'Cevabın gönderileceği e-posta adresini ad@ornek.com biçiminde yazın.'
  const gun = trGunu(g.basvuruTarihi)
  if (!gun) hatalar.basvuruTarihi = 'Başvurunun ulaştığı tarihi seçin.'
  else {
    const h = basvuruTarihiDenetle(gun, new Date())
    if (h) hatalar.basvuruTarihi = h
  }
  if (!['kayitli-eposta', 'imzali', 'kep', 'dogrulanmadi'].includes(g.kimlik)) hatalar.kimlik = 'Kimliğin nasıl doğrulandığını seçin.'
  const aciklama = (g.aciklama ?? '').trim()
  if (kvkkTuruMu(g.tur) && aciklamaZorunluMu(g.tur) && aciklama.length < 10) hatalar.aciklama = 'Başvuranın ne istediğini kısaca yazın.'
  if (Object.keys(hatalar).length) throw new FormHatasi(hatalar)

  // Adres portalda kayıtlı bir aday hesabına aitse bağla
  const { docs: hesaplar } = await payload.find({ collection: 'kullanicilar', where: { and: [{ email: { equals: eposta } }, { rol: { equals: 'aday' } }] }, depth: 0, limit: 1, overrideAccess: true })
  const hesap = hesaplar[0]
  // “Kayıtlı e-posta” yalnızca adres gerçekten portalda kayıtlıysa geçerli bir doğrulama yöntemidir
  if (g.kimlik === 'kayitli-eposta' && !hesap) throw new FormHatasi({ kimlik: 'Bu e-posta adresi portalda kayıtlı değil. Kimliği başka bir yolla doğrulayın veya “Henüz doğrulanmadı” seçin.' })

  const req = await istekOlustur(payload, k)
  const t = await payload.create({
    collection: 'kvkk-talepleri',
    overrideAccess: true,
    req,
    data: {
      tur: g.tur as never,
      aciklama: aciklama || null,
      kanal: g.kanal as KvkkKanal,
      kullanici: hesap?.id ?? null,
      basvuranAd: ad,
      basvuranEposta: eposta,
      basvuruTarihi: gun!.toISOString(),
      kimlik: g.kimlik as KimlikYontemi,
      durum: 'alindi',
    },
  })
  await islemKaydet(req, { islem: 'KVKK başvurusu kaydedildi', tur: 'kisisel-veri', kayitTuru: 'kvkk-talepleri', kayitId: t.id, ayrinti: { tur: g.tur, kanal: g.kanal, hesabaBaglandi: Boolean(hesap) } })
  let bildirildi: boolean | null = null
  if (g.alindiBildir)
    bildirildi = await gonder(payload, eposta, kvkkAlindiEpostasi({ ad, turAdi: KVKK_TUR_ADI[g.tur as keyof typeof KVKK_TUR_ADI], sonGun: sonGun(gun!), hitap: hesap ? 'sen' : 'siz' }))
  return { talep: t, hesabaBaglandi: Boolean(hesap), bildirildi }
}

/** İncelemeye alma; kimlik doğrulama yöntemi burada güncellenebilir. */
export async function kvkkIncelemeyeAl(payload: Payload, k: Kullanici, id: number, kimlikYontemi?: string) {
  yetkiDenetle(k)
  const t = await talepAl(payload, id)
  if (t.durum === 'sonuclandi') throw new IslemHatasi('Bu başvuru sonuçlandı.', 409)
  const yontem = (kimlikYontemi || t.kimlik) as KimlikYontemi
  if (yontem === 'dogrulanmadi') throw new FormHatasi({ kimlik: 'İncelemeye almadan önce başvuranın kimliğini doğrulayın ve yöntemini seçin.' })
  if (yontem === 'kayitli-eposta' && !t.kullanici) throw new FormHatasi({ kimlik: 'Başvuru portaldaki bir hesaba bağlı değil; kayıtlı e-posta yöntemi seçilemez.' })
  const req = await istekOlustur(payload, k)
  const g = await payload.update({ collection: 'kvkk-talepleri', id, data: { durum: 'inceleniyor', kimlik: yontem }, overrideAccess: true, req })
  await islemKaydet(req, { islem: 'KVKK başvurusu incelemeye alındı', tur: 'kisisel-veri', kayitTuru: 'kvkk-talepleri', kayitId: id, ayrinti: { kimlik: yontem } })
  return g
}

export async function kvkkNotEkle(payload: Payload, k: Kullanici, id: number, metin: string) {
  yetkiDenetle(k)
  const not = metin.trim()
  if (!not) throw new FormHatasi({ not: 'Notu yazın.' })
  if (not.length > 2000) throw new FormHatasi({ not: 'Not en fazla 2000 karakter olabilir.' })
  const t = await talepAl(payload, id)
  const req = await istekOlustur(payload, k)
  await payload.update({
    collection: 'kvkk-talepleri',
    id,
    data: { notlar: [...(t.notlar ?? []).map((n) => ({ metin: n.metin, yazan: n.yazan ? kimlik(n.yazan) : null, tarih: n.tarih })), { metin: not, yazan: k.id, tarih: new Date().toISOString() }] },
    overrideAccess: true,
    req,
  })
  await islemKaydet(req, { islem: 'KVKK başvurusuna not eklendi', tur: 'kisisel-veri', kayitTuru: 'kvkk-talepleri', kayitId: id })
}

/** Sonuçlandırma: cevap kaydedilir ve başvurana e-postayla gider. */
export async function kvkkSonuclandir(payload: Payload, k: Kullanici, id: number, g: { sonuc: string; cevap: string }) {
  yetkiDenetle(k)
  const t = await talepAl(payload, id)
  if (t.durum === 'sonuclandi') throw new IslemHatasi('Bu başvuru zaten sonuçlandı.', 409)
  if (t.kimlik === 'dogrulanmadi') throw new IslemHatasi('Başvuranın kimliği doğrulanmadan cevap verilemez. Önce başvuruyu incelemeye alın.', 409)
  const hatalar: Record<string, string> = {}
  if (!(g.sonuc in KVKK_SONUC_ADI)) hatalar.sonuc = 'Sonucu seçin.'
  const cevap = g.cevap.trim()
  if (cevap.length < 20) hatalar.cevap = 'Başvurana gidecek cevabı yazın. Ret ve kısmi kabulde gerekçe yazılması yasal zorunluluktur.'
  else if (yerTutucuVarMi(cevap)) hatalar.cevap = 'Taslaktaki köşeli parantezli yerleri ([… yazın]) doldurun.'
  if (cevap.length > 5000) hatalar.cevap = 'Cevap en fazla 5000 karakter olabilir.'
  if (Object.keys(hatalar).length) throw new FormHatasi(hatalar)
  const sonuc = g.sonuc as KvkkSonuc
  const req = await istekOlustur(payload, k)
  const simdi = new Date().toISOString()
  // Hesap silinmişse bile başvurana yazılır; hitap hesabın varlığına göre değil, kanala göre seçilir.
  const hitap = t.kanal === 'portal' || t.kullanici ? 'sen' : 'siz'
  const eposta = await gonder(payload, t.basvuranEposta, kvkkCevapEpostasi({ ad: t.basvuranAd, turAdi: KVKK_TUR_ADI[t.tur], sonucAdi: KVKK_SONUC_ADI[sonuc], cevap, hitap }))
  const s = await payload.update({ collection: 'kvkk-talepleri', id, data: { durum: 'sonuclandi', sonuc, cevap, cevapTarihi: simdi, cevapGonderildi: eposta }, overrideAccess: true, req })
  await islemKaydet(req, { islem: 'KVKK başvurusu sonuçlandırıldı', tur: 'kisisel-veri', kayitTuru: 'kvkk-talepleri', kayitId: id, ayrinti: { sonuc, eposta } })
  return { talep: s, eposta }
}

/** Silme başvurusu üzerine bağlı aday hesabının silinmesi. Talep açık ve kimlik doğrulanmış olmalıdır. */
export async function kvkkHesabiSil(payload: Payload, k: Kullanici, id: number) {
  yetkiDenetle(k)
  const t = await talepAl(payload, id)
  if (t.tur !== 'silme') throw new IslemHatasi('Hesap yalnızca silme başvurusu üzerine silinebilir.', 400)
  if (t.durum !== 'inceleniyor') throw new IslemHatasi('Hesabı silmeden önce başvuruyu incelemeye alın ve başvuranın kimliğini doğrulayın.', 409)
  if (!t.kullanici) throw new IslemHatasi('Başvuru portaldaki bir hesaba bağlı değil veya hesap zaten silinmiş.', 409)
  const sonuc = await adayHesabiniSil(payload, k, kimlik(t.kullanici), { kvkkTalebi: id })
  await kvkkNotEkle(payload, k, id, `Hesap silindi: ${sonuc.basvuru} başvurudan kimlik bilgileri ve CV çıkarıldı, ${sonuc.cv} dosya silindi.`)
  return sonuc
}
