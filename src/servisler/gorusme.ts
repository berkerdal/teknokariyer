/**
 * Görüşme daveti (kurallar src/alan/gorusme.ts).
 * - Firma (tam yetkili veya ilan sorumlusu) başvuruya 1–3 tarih seçeneği önerir; başvuru “Görüşme” durumuna geçer ve adaya
 *   e-posta gider (durum değişikliğinin genel e-postası ayrıca gönderilmez).
 * - Aday birini seçer: görüşme kesinleşir, adaya ve firmaya takvim dosyası (.ics) gider.
 * - Aday hiçbirine uyamıyorsa veya kesinleşen saatte katılamıyorsa notuyla başka tarih ister; firma yeni seçenek önerir.
 * - Firma gerekçesiyle iptal eder. Aday başvurusunu geri çekerse veya hesabını silerse süren görüşme iptal olur, firmaya
 *   bildirilir. Kesinleşmiş görüşmenin iptalinde takvimden kaldıran dosya (METHOD:CANCEL, aynı UID) gönderilir.
 * Bir başvuruda aynı anda tek süren görüşme olur; tarih değişikliği aynı kayıtta yapılır.
 */
import type { Payload } from 'payload'
import type { Basvurular, Gorusmeler } from '@/payload-types'
import { firmaYetkisiVarMi } from '@/erisim'
import {
  GORUSME_BICIMI,
  davetHatalari,
  gorusmeHali,
  gorusmeZamani,
  surenGorusmeMi,
  takvimDosyasi,
  type GorusmeBicimi,
  type GorusmeOzu,
} from '@/alan/gorusme'
import { GONDEREN_ADRES } from '@/altyapi/eposta'
import { gorusmeDavetiEpostasi, gorusmeIptalEpostasi, gorusmeKesinlestiEpostasi, gorusmeYeniTarihEpostasi, siteAdresi } from '@/altyapi/epostaSablonlari'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { firmaninBasvurusu } from './degerlendirme'
import { epostaGonder, firmaEkibineGonder } from './bildirim'
import { FormHatasi, IslemHatasi, istekOlustur, kimlik, type Kullanici } from './ortak'

const KAPALI_BASVURU = ['geri-cekti', 'olumlu', 'olumsuz']

export const gorusmeOzu = (g: Pick<Gorusmeler, 'durum' | 'secenekler' | 'secilen' | 'sure'>): GorusmeOzu => ({
  durum: g.durum,
  secenekler: (g.secenekler ?? []).map((s) => new Date(s.baslangic)),
  secilen: g.secilen ? new Date(g.secilen) : null,
  sure: g.sure,
})

const adayAdresi = (id: number) => `${siteAdresi()}/hesabim/gorusme/${id}`
const firmaAdresi = (basvuruId: number) => `${siteAdresi()}/firma-paneli/basvurular/${basvuruId}#gorusme`

async function baglam(payload: Payload, g: Gorusmeler) {
  const [ilan, firma, aday] = await Promise.all([
    payload.findByID({ collection: 'ilanlar', id: kimlik(g.ilan), depth: 0, overrideAccess: true, select: { pozisyonAdi: true } }),
    payload.findByID({ collection: 'firmalar', id: kimlik(g.firma), depth: 0, overrideAccess: true, select: { kisaAd: true } }),
    g.adayKullanici
      ? payload.findByID({ collection: 'kullanicilar', id: kimlik(g.adayKullanici), depth: 0, overrideAccess: true, select: { ad: true, email: true }, disableErrors: true })
      : null,
  ])
  return { pozisyonAdi: ilan.pozisyonAdi, firma: firma.kisaAd, aday }
}

/** Kesinleşmiş görüşmenin takvim dosyası (ekleme veya iptal). */
export function gorusmeTakvimi(g: Gorusmeler, b: { pozisyonAdi: string; firma: string }, yontem: 'PUBLISH' | 'CANCEL'): string {
  const bicim = GORUSME_BICIMI[g.bicim as GorusmeBicimi]
  return takvimDosyasi({
    uid: `gorusme-${g.id}-${g.takvimNo ?? 1}@kariyer.pauteknokent.com.tr`,
    yontem,
    sira: yontem === 'CANCEL' ? 1 : 0,
    baslangic: new Date(g.secilen!),
    sure: g.sure,
    ozet: `Görüşme: ${b.pozisyonAdi} · ${b.firma}`,
    aciklama: [`${b.firma} ile “${b.pozisyonAdi}” görüşmesi (${bicim.ad}).`, g.yer ? `${bicim.yerEtiketi}: ${g.yer}` : '', g.not ? `Not: ${g.not}` : '', 'TeknoKariyer · Pamukkale Teknokent']
      .filter(Boolean)
      .join('\n'),
    yer: g.bicim === 'cevrim-ici' ? g.yer ?? undefined : g.bicim === 'yuz-yuze' ? g.yer ?? undefined : undefined,
    adres: g.bicim === 'cevrim-ici' ? g.yer ?? undefined : undefined,
    duzenleyen: { ad: `${b.firma} · TeknoKariyer`, eposta: GONDEREN_ADRES },
    olusturma: new Date(),
  })
}

/** Başvurunun en son görüşmesi (firma ve aday ekranları için). */
export async function basvurununGorusmesi(payload: Payload, basvuruId: number): Promise<Gorusmeler | null> {
  const { docs } = await payload.find({ collection: 'gorusmeler', where: { basvuru: { equals: basvuruId } }, sort: '-createdAt', limit: 1, depth: 0, overrideAccess: true })
  return docs[0] ?? null
}

export interface DavetVerisi {
  secenekler: Array<Date | null>
  sure: number
  bicim: string
  yer: string
  not: string
}

/** Yeni davet veya süren görüşmenin tarihlerini değiştirme (aynı kayıt). */
export async function gorusmeyeDavetEt(payload: Payload, k: Kullanici, basvuruId: number, v: DavetVerisi, simdi = new Date()) {
  if (!firmaYetkisiVarMi(k, ['yonetici', 'ilan-sorumlusu'])) throw new IslemHatasi('Görüşme daveti yalnızca firmanın tam yetkili ve ilan sorumlusu kullanıcılarına açıktır.', 403)
  const b: Basvurular = await firmaninBasvurusu(payload, k, basvuruId)
  if (!b.adayKullanici || b.anonimlestirildi) throw new IslemHatasi('Aday hesabını sildiği için görüşmeye davet edilemez.', 409)
  if (KAPALI_BASVURU.includes(b.durum)) throw new IslemHatasi('Sonuçlanmış veya geri çekilmiş başvuru için görüşme daveti gönderilemez.', 409)
  const temiz = { ...v, yer: v.yer.replace(/\s+/g, ' ').trim(), not: v.not.trim() }
  const h = davetHatalari(temiz, simdi)
  if (Object.keys(h).length) throw new FormHatasi(h)
  const secenekler = temiz.secenekler.filter((s): s is Date => s !== null).sort((a, c) => a.getTime() - c.getTime())

  const onceki = await basvurununGorusmesi(payload, b.id)
  const suren = onceki && surenGorusmeMi(gorusmeOzu(onceki), simdi) ? onceki : null
  const req = await istekOlustur(payload, k)
  const veri = {
    secenekler: secenekler.map((s) => ({ baslangic: s.toISOString() })),
    sure: temiz.sure,
    bicim: temiz.bicim as GorusmeBicimi,
    yer: temiz.yer || null,
    not: temiz.not || null,
    durum: 'bekliyor' as const,
    secilen: null as string | null,
    adayNotu: null as string | null,
  }
  const g = suren
    ? await payload.update({ collection: 'gorusmeler', id: suren.id, data: veri, overrideAccess: true, req, depth: 0 })
    : await payload.create({
        collection: 'gorusmeler',
        data: { ...veri, basvuru: b.id, firma: kimlik(b.firma), ilan: kimlik(b.ilan), adayKullanici: kimlik(b.adayKullanici), takvimNo: 0, olusturan: k.id },
        overrideAccess: true,
        req,
        depth: 0,
      })
  if (b.durum === 'alindi' || b.durum === 'inceleniyor') await payload.update({ collection: 'basvurular', id: b.id, data: { durum: 'gorusme' }, overrideAccess: true, req, depth: 0 })

  const c = await baglam(payload, g)
  if (c.aday) {
    // Kesinleşmiş görüşmenin tarihi değiştiyse eski saat adayın takviminden kalkar.
    const iptal = suren?.durum === 'onaylandi' && suren.secilen ? gorusmeTakvimi(suren, c, 'CANCEL') : undefined
    const e = gorusmeDavetiEpostasi({
      ad: c.aday.ad,
      firma: c.firma,
      pozisyonAdi: c.pozisyonAdi,
      secenekler: secenekler.map(gorusmeZamani),
      bicim: GORUSME_BICIMI[g.bicim as GorusmeBicimi].ad,
      yer: g.bicim === 'telefon' ? null : g.yer,
      not: g.not,
      adres: adayAdresi(g.id),
      degisiklik: Boolean(suren),
    })
    await epostaGonder(payload, c.aday.email, iptal ? { ...e, ekler: [{ dosyaAdi: 'gorusme-iptal.ics', icerik: iptal, tur: 'text/calendar; charset=utf-8; method=CANCEL' }] } : e)
  }
  await islemKaydet(req, { islem: suren ? 'Görüşme tarihleri değiştirildi' : 'Görüşme daveti gönderildi', tur: 'basvuru', kayitTuru: 'gorusmeler', kayitId: g.id, ayrinti: { basvuru: b.id, secenek: secenekler.length } })
  return g
}

async function adayinGorusmesi(payload: Payload, k: Kullanici, id: number): Promise<Gorusmeler> {
  if (k.rol !== 'aday') throw new IslemHatasi('Bu işlem yalnızca adaylara açık.', 403)
  const g = await payload.findByID({ collection: 'gorusmeler', id, depth: 0, overrideAccess: true, disableErrors: true })
  if (!g || kimlik(g.adayKullanici) !== Number(k.id)) throw new IslemHatasi('Görüşme bulunamadı.', 404)
  return g
}

/** Aday gösterilen sayfada görüşmeyi okur (başkasınınki 404). */
export const adayGorusmesi = adayinGorusmesi

/** Aday seçeneklerden birini seçer; görüşme kesinleşir, iki tarafa takvim dosyası gider. */
export async function gorusmeTarihiSec(payload: Payload, k: Kullanici, id: number, secim: string, simdi = new Date()) {
  const g = await adayinGorusmesi(payload, k, id)
  if (gorusmeHali(gorusmeOzu(g), simdi) !== 'bekliyor') throw new IslemHatasi('Bu görüşme için tarih seçimi kapalı. Sayfayı yenileyip güncel durumu gör.', 409)
  const an = (g.secenekler ?? []).map((s) => new Date(s.baslangic)).find((s) => s.toISOString() === secim)
  if (!an) throw new FormHatasi({ secim: 'Önerilen tarihlerden birini seç.' })
  if (an <= simdi) throw new FormHatasi({ secim: 'Bu tarih geçti. Başka bir seçenek seç veya başka tarih iste.' })
  const req = await istekOlustur(payload, k)
  const yeni = await payload.update({ collection: 'gorusmeler', id, data: { durum: 'onaylandi', secilen: an.toISOString(), takvimNo: (g.takvimNo ?? 0) + 1 }, overrideAccess: true, req, depth: 0 })
  const c = await baglam(payload, yeni)
  const ics = gorusmeTakvimi(yeni, c, 'PUBLISH')
  const ortak = { firma: c.firma, pozisyonAdi: c.pozisyonAdi, zaman: gorusmeZamani(an), bicim: GORUSME_BICIMI[yeni.bicim as GorusmeBicimi].ad, yer: yeni.bicim === 'telefon' ? null : yeni.yer, ics }
  if (c.aday) await epostaGonder(payload, c.aday.email, gorusmeKesinlestiEpostasi({ ...ortak, hitap: 'sen', ad: c.aday.ad, adres: adayAdresi(id) }))
  await firmaEkibineGonder(payload, kimlik(yeni.firma), gorusmeKesinlestiEpostasi({ ...ortak, hitap: 'siz', ad: c.aday?.ad, adres: firmaAdresi(kimlik(yeni.basvuru)) }))
  await islemKaydet(req, { islem: 'Görüşme tarihi seçildi', tur: 'basvuru', kayitTuru: 'gorusmeler', kayitId: id })
  return yeni
}

/** Aday başka tarih ister (önerilenlere uyamıyor veya kesinleşen saatte katılamıyor). */
export async function gorusmeYeniTarihIste(payload: Payload, k: Kullanici, id: number, not: string, simdi = new Date()) {
  const g = await adayinGorusmesi(payload, k, id)
  const hal = gorusmeHali(gorusmeOzu(g), simdi)
  if (!['bekliyor', 'onaylandi', 'suresi-doldu'].includes(hal)) throw new IslemHatasi('Bu görüşme için başka tarih istenemez. Sayfayı yenileyip güncel durumu gör.', 409)
  const metin = not.replace(/\s+/g, ' ').trim()
  if (metin.length < 10) throw new FormHatasi({ not: 'Firmaya hangi gün ve saatlerin sana uygun olduğunu yaz (en az 10 karakter).' })
  if (metin.length > 500) throw new FormHatasi({ not: 'Not en fazla 500 karakter olabilir.' })
  const req = await istekOlustur(payload, k)
  const yeni = await payload.update({ collection: 'gorusmeler', id, data: { durum: 'yeni-tarih', adayNotu: metin, secilen: null }, overrideAccess: true, req, depth: 0 })
  const c = await baglam(payload, g)
  const ics = hal === 'onaylandi' ? gorusmeTakvimi(g, c, 'CANCEL') : undefined
  await firmaEkibineGonder(payload, kimlik(g.firma), gorusmeYeniTarihEpostasi({ aday: c.aday?.ad ?? 'Aday', pozisyonAdi: c.pozisyonAdi, not: metin, adres: firmaAdresi(kimlik(g.basvuru)), ics }))
  if (ics && c.aday) {
    const e = gorusmeIptalEpostasi({
      hitap: 'sen',
      ad: c.aday.ad,
      firma: c.firma,
      pozisyonAdi: c.pozisyonAdi,
      neden: `Başka tarih istediğini ${c.firma} firmasına ilettik. Kesinleşen görüşme takviminden kaldırılıyor; firma yeni tarihler önerdiğinde sana e-posta gelecek.`,
      ics,
      baslik: `Başka tarih isteğin firmaya iletildi: ${c.pozisyonAdi}`,
    })
    await epostaGonder(payload, c.aday.email, e)
  }
  await islemKaydet(req, { islem: 'Aday başka görüşme tarihi istedi', tur: 'basvuru', kayitTuru: 'gorusmeler', kayitId: id })
  return yeni
}

/** Firma görüşmeyi gerekçesiyle iptal eder. */
export async function gorusmeyiIptalEt(payload: Payload, k: Kullanici, id: number, neden: string, simdi = new Date()) {
  if (!firmaYetkisiVarMi(k, ['yonetici', 'ilan-sorumlusu'])) throw new IslemHatasi('Görüşmeyi iptal etme yetkiniz yok.', 403)
  const g = await payload.findByID({ collection: 'gorusmeler', id, depth: 0, overrideAccess: true, disableErrors: true })
  if (!g) throw new IslemHatasi('Görüşme bulunamadı.', 404)
  await firmaninBasvurusu(payload, k, kimlik(g.basvuru)) // kiracı denetimi
  if (!surenGorusmeMi(gorusmeOzu(g), simdi)) throw new IslemHatasi('Bu görüşme zaten sonuçlanmış.', 409)
  const metin = neden.replace(/\s+/g, ' ').trim()
  if (metin.length < 10) throw new FormHatasi({ neden: 'Adaya gidecek açıklamayı yazın (en az 10 karakter).' })
  if (metin.length > 500) throw new FormHatasi({ neden: 'Açıklama en fazla 500 karakter olabilir.' })
  const req = await istekOlustur(payload, k)
  const yeni = await payload.update({ collection: 'gorusmeler', id, data: { durum: 'iptal', iptalNedeni: metin }, overrideAccess: true, req, depth: 0 })
  const c = await baglam(payload, g)
  const ics = g.durum === 'onaylandi' && g.secilen ? gorusmeTakvimi(g, c, 'CANCEL') : undefined
  if (c.aday) await epostaGonder(payload, c.aday.email, gorusmeIptalEpostasi({ hitap: 'sen', ad: c.aday.ad, firma: c.firma, pozisyonAdi: c.pozisyonAdi, neden: metin, adres: `${siteAdresi()}/hesabim`, ics }))
  await islemKaydet(req, { islem: 'Görüşme iptal edildi', tur: 'basvuru', kayitTuru: 'gorusmeler', kayitId: id })
  return yeni
}

/**
 * Adayın süren görüşmelerini kapatır (başvuruyu geri çekti veya hesabını sildi). Firmaya bildirim gider; aday tarafına
 * e-posta gitmez (işlemi kendisi yaptı). `basvuruId` verilirse yalnızca o başvurunun görüşmesi.
 */
export async function adayGorusmeleriniKapat(payload: Payload, adayId: number, neden: 'geri-cekti' | 'hesap-silindi', basvuruId?: number, simdi = new Date()) {
  const { docs } = await payload.find({
    collection: 'gorusmeler',
    where: { and: [{ adayKullanici: { equals: adayId } }, { durum: { not_equals: 'iptal' } }, ...(basvuruId ? [{ basvuru: { equals: basvuruId } }] : [])] },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  let sayi = 0
  for (const g of docs) {
    if (!surenGorusmeMi(gorusmeOzu(g), simdi)) continue
    const c = await baglam(payload, g)
    const ics = g.durum === 'onaylandi' && g.secilen ? gorusmeTakvimi(g, c, 'CANCEL') : undefined
    await payload.update({
      collection: 'gorusmeler',
      id: g.id,
      data: { durum: 'iptal', iptalNedeni: neden === 'geri-cekti' ? 'Aday başvurusunu geri çekti.' : 'Aday hesabını sildi.' },
      overrideAccess: true,
      depth: 0,
    })
    await firmaEkibineGonder(
      payload,
      kimlik(g.firma),
      gorusmeIptalEpostasi({
        hitap: 'siz',
        firma: c.firma,
        pozisyonAdi: c.pozisyonAdi,
        neden: neden === 'geri-cekti' ? `${c.aday?.ad ?? 'Aday'} başvurusunu geri çektiği için görüşme iptal oldu.` : 'Aday hesabını sildiği için görüşme iptal oldu.',
        adres: neden === 'geri-cekti' ? firmaAdresi(kimlik(g.basvuru)) : undefined,
        ics,
      }),
    ).catch((): number => 0)
    sayi++
  }
  return sayi
}

/** Kesinleşmiş görüşmenin takvim dosyası: aday kendi görüşmesini, firma kullanıcısı kendi firmasınınkini indirir. */
export async function gorusmeTakvimDosyasi(payload: Payload, k: Kullanici, id: number): Promise<string> {
  let g: Gorusmeler
  if (k.rol === 'aday') g = await adayinGorusmesi(payload, k, id)
  else {
    const x = await payload.findByID({ collection: 'gorusmeler', id, depth: 0, overrideAccess: true, disableErrors: true })
    if (!x) throw new IslemHatasi('Görüşme bulunamadı.', 404)
    await firmaninBasvurusu(payload, k, kimlik(x.basvuru))
    g = x
  }
  if (g.durum !== 'onaylandi' || !g.secilen) throw new IslemHatasi('Takvim dosyası yalnızca tarihi kesinleşmiş görüşme için indirilebilir.', 409)
  return gorusmeTakvimi(g, await baglam(payload, g), 'PUBLISH')
}
