/**
 * CV havuzu (talimatlar 7; K5, K24, K25).
 * - Arama: anonim özet döner (ad ve iletişim yok). Cinsiyete göre filtre reddedilir.
 * - Profil açma: ad, iletişim ve CV görünür; adaya sorulmaz. Her açılış kayda geçer, aday yalnızca sayıyı görür.
 */
import type { Payload, Where } from 'payload'
import type { Adaylar } from '@/payload-types'
import {
  filtreAlaniIzinliMi,
  firmaGorebilirMi,
  havuzOzeti,
  sonOtuzGundeGoruntuleyenFirmaSayisi,
  type HavuzAdayi,
  type HavuzOzeti,
} from '@/alan/havuz'
import { firmaKimligi, firmaYetkisiVarMi, kurumKullanicisiMi, adayMi } from '@/erisim'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { IslemHatasi, ayarlar, istekOlustur, kimlik, type Kullanici } from './ortak'

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
