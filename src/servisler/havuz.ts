/**
 * CV havuzu (talimatlar 7; K5, K24, K25).
 * - Arama: anonim özet döner (ad ve iletişim yok). Cinsiyete göre filtre reddedilir.
 * - Profil açma: ad, iletişim ve CV görünür; adaya sorulmaz. Her açılış kayda geçer, aday yalnızca sayıyı görür.
 */
import type { Payload, Where } from 'payload'
import type { Adaylar } from '@/payload-types'
import {
  HAVUZ_RIZA_SURESI_AY,
  RIZA_HATIRLATMA_GUN,
  rizaBitisTarihi,
  rizaHatirlatmasi,
  filtreAlaniIzinliMi,
  firmaGorebilirMi,
  havuzOzeti,
  sonOtuzGundeGoruntuleyenFirmaSayisi,
  type HavuzAdayi,
  type HavuzOzeti,
} from '@/alan/havuz'
import { firmaKimligi, firmaYetkisiVarMi, kurumKullanicisiMi, adayMi } from '@/erisim'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { havuzRizaEpostasi } from '@/altyapi/epostaSablonlari'
import { trGunFarki as gunFarkiTr } from '@/alan/tarih'
import { tarihYaz } from '@/arayuz/bicim'
import { dosyaIcerigi } from '@/altyapi/depolama'
import { filigranMetni, pdfFiligranla } from '@/altyapi/filigran'
import { IslemHatasi, ayarlar, istekOlustur, kimlik, type Kullanici } from './ortak'
import { belgeHazirla } from './sertifika'

const HAVUZ_YETKISI = ['yonetici', 'ilan-sorumlusu'] as const

export interface HavuzFiltresi {
  beceriler?: Array<number | string>
  beceriKosulu?: 'hepsi' | 'herhangi'
  [alan: string]: unknown
}

function havuzYetkisi(kullanici: Kullanici) {
  if (!firmaYetkisiVarMi(kullanici, [...HAVUZ_YETKISI]))
    throw new IslemHatasi('CV havuzunda arama yetkiniz yok. Firma yöneticinizden yetki isteyin.', 403)
}

const ad = (x: unknown) => (x && typeof x === 'object' ? (x as { ad?: string }).ad : undefined)

function havuzAdayi(aday: Adaylar, kullaniciAd = '', eposta = ''): HavuzAdayi {
  return {
    id: String(aday.id),
    kod: aday.kod ?? '',
    ad: kullaniciAd,
    eposta,
    telefon: aday.telefon ?? undefined,
    cinsiyet: (aday.cinsiyet ?? undefined) as HavuzAdayi['cinsiyet'],
    bolum: ad(aday.bolum),
    okul: ad(aday.okul),
    mezuniyetYili: aday.mezuniyet ? new Date(aday.mezuniyet).getFullYear() : undefined,
    beceriler: (aday.beceriler ?? []).map((b) => ad(b.beceri)).filter((x): x is string => Boolean(x)),
    diller: (aday.diller ?? []).map((d) => `${ad(d.dil) ?? ''} ${d.seviye}`.trim()),
    tercih: [aday.tercihler?.modeller?.join(', '), aday.tercihler?.sehir].filter(Boolean).join(' · ') || undefined,
    baslama: aday.tercihler?.baslama ?? undefined,
    gorunurluk: (aday.havuz?.gorunurluk ?? 'gizli') as HavuzAdayi['gorunurluk'],
    rizaTarihi: aday.havuz?.rizaTarihi ? new Date(aday.havuz.rizaTarihi) : null,
    gizlenenFirmalar: (aday.havuz?.gizlenenFirmalar ?? []).map((f) => String(kimlik(f))),
  }
}

/** Havuz araması: rıza geçerli, görünür ve bu firmadan gizlenmemiş adayların anonim özetleri. */
export async function havuzAra(payload: Payload, kullanici: Kullanici, filtre: HavuzFiltresi = {}): Promise<HavuzOzeti[]> {
  havuzYetkisi(kullanici)
  for (const alan of Object.keys(filtre)) {
    if (alan === 'beceriKosulu') continue
    if (!filtreAlaniIzinliMi(alan)) throw new IslemHatasi(`“${alan}” alanına göre arama yapılamaz.`, 400)
  }
  const a = await ayarlar(payload)
  const rizaSiniri = new Date()
  rizaSiniri.setMonth(rizaSiniri.getMonth() - (a.saklama?.havuzRizaAy ?? 12))

  const kosullar: Where[] = [
    { 'havuz.gorunurluk': { in: ['aktif', 'acik'] } },
    { 'havuz.rizaTarihi': { greater_than: rizaSiniri.toISOString() } },
  ]
  if (filtre.beceriler?.length) {
    const idler = filtre.beceriler.map(Number)
    if (filtre.beceriKosulu === 'herhangi') kosullar.push({ 'beceriler.beceri': { in: idler } })
    else for (const id of idler) kosullar.push({ 'beceriler.beceri': { equals: id } })
  }
  const { docs } = await payload.find({ collection: 'adaylar', where: { and: kosullar }, depth: 1, limit: 200, overrideAccess: true })
  const firmaId = String(firmaKimligi(kullanici))
  const simdi = new Date()
  return docs
    .map((d) => havuzAdayi(d))
    .filter((h) => firmaGorebilirMi(h, firmaId, simdi))
    .map(havuzOzeti)
}

/** Firma bir profili açar: ad, iletişim ve CV görünür (K24). Açılış kayda geçer (K5, işlem kaydı: kişisel veri). */
export async function havuzProfiliAc(payload: Payload, kullanici: Kullanici, adayId: number | string) {
  havuzYetkisi(kullanici)
  const aday = await payload.findByID({ collection: 'adaylar', id: adayId, depth: 1, overrideAccess: true }).catch((): null => null)
  if (!aday) throw new IslemHatasi('Aday bulunamadı.', 404)
  const k = typeof aday.kullanici === 'object' ? aday.kullanici : await payload.findByID({ collection: 'kullanicilar', id: aday.kullanici, overrideAccess: true })
  const h = havuzAdayi(aday, k.ad, k.email)
  const firmaId = String(firmaKimligi(kullanici))
  if (!firmaGorebilirMi(h, firmaId, new Date())) throw new IslemHatasi('Bu aday artık havuzda değil.', 404)

  const req = await istekOlustur(payload, kullanici)
  await payload.create({
    collection: 'havuz-goruntulemeleri',
    data: { aday: aday.id, firma: Number(firmaId), kim: kullanici.id },
    overrideAccess: true,
    req,
  })
  await islemKaydet(req, { islem: 'Havuz profili açıldı', tur: 'kisisel-veri', kayitTuru: 'adaylar', kayitId: aday.id })
  return {
    ...havuzOzeti(h),
    ad: h.ad,
    eposta: h.eposta,
    telefon: h.telefon,
    cvler: (aday.cvler ?? []).map((c) => ({ ad: c.ad, dosya: kimlik(c.dosya) })),
    tanitim: aday.tanitim,
    deneyimler: aday.deneyimler ?? [],
    sertifikalar: aday.sertifikalar ?? [],
    egitimler: aday.egitimler ?? [],
  }
}

/** Adayın kendi görüntülenme sayısı: son 30 günde kaç farklı firma açtı (adlar yok; K5). */
export async function goruntuleyenFirmaSayisi(payload: Payload, kullanici: Kullanici): Promise<number> {
  if (!adayMi(kullanici) && !kurumKullanicisiMi(kullanici)) throw new IslemHatasi('Bu bilgi yalnızca adayın kendisine gösterilir.', 403)
  const { docs: adaylar } = await payload.find({ collection: 'adaylar', where: { kullanici: { equals: kullanici.id } }, limit: 1, depth: 0, overrideAccess: true })
  if (!adaylar[0]) return 0
  const sinir = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const { docs } = await payload.find({
    collection: 'havuz-goruntulemeleri',
    where: { and: [{ aday: { equals: adaylar[0].id } }, { createdAt: { greater_than_equal: sinir } }] },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })
  return sonOtuzGundeGoruntuleyenFirmaSayisi(
    docs.map((d) => ({ firmaId: String(kimlik(d.firma)), tarih: new Date(d.createdAt) })),
    new Date(),
  )
}

/** Havuzdaki adayın CV'si, firma adı ve tarih filigranıyla (K6). Aday görünür değilse veya dosya onun değilse 404. */
export async function havuzCvsi(payload: Payload, kullanici: Kullanici, adayId: number, dosyaId: number, amac: 'indir' | 'goruntule' = 'indir'): Promise<{ icerik: Uint8Array; dosyaAdi: string }> {
  havuzYetkisi(kullanici)
  const aday = await payload.findByID({ collection: 'adaylar', id: adayId, depth: 0, overrideAccess: true }).catch((): null => null)
  if (!aday) throw new IslemHatasi('Aday bulunamadı.', 404)
  const h = havuzAdayi(aday)
  if (!firmaGorebilirMi(h, String(firmaKimligi(kullanici)), new Date())) throw new IslemHatasi('Bu aday artık havuzda değil.', 404)
  const cv = (aday.cvler ?? []).find((c) => kimlik(c.dosya) === dosyaId)
  if (!cv) throw new IslemHatasi('CV bulunamadı.', 404)
  const dosya = await payload.findByID({ collection: 'dosyalar', id: dosyaId, depth: 0, overrideAccess: true }).catch((): null => null)
  const ham = dosya?.filename ? await dosyaIcerigi(dosya.filename) : null
  if (!ham) throw new IslemHatasi('CV dosyası bulunamadı.', 404)
  const firma = await payload.findByID({ collection: 'firmalar', id: Number(firmaKimligi(kullanici)), depth: 0, overrideAccess: true })
  let icerik: Uint8Array
  try {
    icerik = await pdfFiligranla(ham, filigranMetni(firma.kisaAd, new Date()))
  } catch {
    throw new IslemHatasi('CV’ye filigran eklenemediği için dosya indirilemiyor. Bu durumu Yönetici A.Ş.’ye bildirin.', 409)
  }
  const req = await istekOlustur(payload, kullanici)
  await islemKaydet(req, { islem: amac === 'goruntule' ? 'Havuzdaki CV görüntülendi' : 'Havuzdaki CV indirildi', tur: 'kisisel-veri', kayitTuru: 'adaylar', kayitId: adayId, ayrinti: { firma: firma.kisaAd } })
  return { icerik, dosyaAdi: `CV - ${aday.kod ?? 'aday'} - ${cv.ad ?? 'CV'}.pdf` }
}

/** Havuzdaki (görünür ve rızası geçerli) aday sayısı: firma sayfasının üstünde gösterilir. */
export async function havuzAdaySayisi(payload: Payload, kullanici: Kullanici): Promise<number> {
  return (await havuzAra(payload, kullanici, {})).length
}

/** Havuzdaki adayın sertifika belgesi: aday görünür olmalı ve belge onun profilindeki bir sertifikaya bağlı olmalı. */
export async function havuzBelgesi(payload: Payload, kullanici: Kullanici, adayId: number, dosyaId: number) {
  havuzYetkisi(kullanici)
  const aday = await payload.findByID({ collection: 'adaylar', id: adayId, depth: 0, overrideAccess: true }).catch((): null => null)
  if (!aday) throw new IslemHatasi('Aday bulunamadı.', 404)
  if (!firmaGorebilirMi(havuzAdayi(aday), String(firmaKimligi(kullanici)), new Date())) throw new IslemHatasi('Bu aday artık havuzda değil.', 404)
  if (!(aday.sertifikalar ?? []).some((s) => s.dosya && kimlik(s.dosya) === dosyaId)) throw new IslemHatasi('Belge bulunamadı.', 404)
  const firma = await payload.findByID({ collection: 'firmalar', id: Number(firmaKimligi(kullanici)), depth: 0, overrideAccess: true })
  return belgeHazirla(payload, dosyaId, { k: kullanici, ad: firma.kisaAd, kayit: { kayitTuru: 'adaylar', kayitId: adayId } })
}

/**
 * Rıza yenileme hatırlatmaları (zamanlanmış iş, mesai saatinde): bitişe 30 ve 7 gün kala ve süre dolunca birer kez
 * (kural `rizaHatirlatmasi`). Görünürlüğü “gizli” olan adaya gönderilmez. Gönderilen eşik adayın kaydına yazılır;
 * rıza yenilenince sıfırlanır.
 */
export async function havuzRizaHatirlatmalari(payload: Payload, simdi: Date, hatalar: string[]): Promise<number> {
  const ay = (await ayarlar(payload)).saklama?.havuzRizaAy ?? HAVUZ_RIZA_SURESI_AY
  const ust = new Date(simdi)
  ust.setMonth(ust.getMonth() - ay)
  ust.setDate(ust.getDate() + RIZA_HATIRLATMA_GUN + 1)
  const alt = new Date(simdi)
  alt.setMonth(alt.getMonth() - ay)
  alt.setDate(alt.getDate() - 31)
  const { docs } = await payload.find({
    collection: 'adaylar',
    where: { and: [{ 'havuz.rizaTarihi': { less_than: ust.toISOString() } }, { 'havuz.rizaTarihi': { greater_than: alt.toISOString() } }, { 'havuz.gorunurluk': { not_equals: 'gizli' } }] },
    depth: 0,
    limit: 2000,
    pagination: false,
    overrideAccess: true,
    select: { kullanici: true, havuz: true },
  })
  let n = 0
  for (const a of docs) {
    const verilis = new Date(a.havuz!.rizaTarihi!)
    const esik = rizaHatirlatmasi(verilis, simdi, ay, a.havuz?.rizaHatirlatildi)
    if (esik === null) continue
    try {
      const u = await payload.findByID({ collection: 'kullanicilar', id: kimlik(a.kullanici), depth: 0, overrideAccess: true, disableErrors: true })
      if (u?.email) {
        const e = havuzRizaEpostasi({ ad: u.ad, kalan: esik === 0 ? 0 : gunFarkiTr(simdi, rizaBitisTarihi(verilis, ay)), bitis: tarihYaz(rizaBitisTarihi(verilis, ay).toISOString(), true) })
        await payload.sendEmail({ to: u.email, subject: e.konu, html: e.html, text: e.metin })
        n++
      }
      await payload.update({ collection: 'adaylar', id: a.id, data: { havuz: { ...a.havuz, rizaHatirlatildi: esik } } as never, overrideAccess: true, context: { sistem: true } })
    } catch (e) {
      hatalar.push(`Havuz rızası ${a.id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  return n
}
