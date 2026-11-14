/**
 * Yönetici A.Ş. firma ekranlarının verisi. Huni ve takip listeleri kayıtlardan hesaplanır.
 */
import { cache } from 'react'
import type { Davetler, Firmalar, Kullanicilar } from '@/payload-types'
import { hatirlatmaGunleri } from '@/alan/hatirlatma'
import { ASAMA_ADI, huniBasamagi, huniSayilari, yetkiliDurumu, type KurulumAsamasi, type YetkiliDurumu } from '@/alan/kurulum'
import { normallestir } from '@/alan/metin'
import { payloadAl } from './payload'

const kimlik = (x: unknown) => Number(x && typeof x === 'object' ? (x as { id: number }).id : x)
const gunOnce = (iso: string, simdi: Date) => Math.floor((simdi.getTime() - new Date(iso).getTime()) / 86_400_000)

export interface FirmaSatiri {
  id: number
  kisaAd: string
  unvan: string
  konum: string
  asama: KurulumAsamasi
  asamaAdi: string
  huni: number
  ilkIlan: boolean
  uye: number
  bekleyenDavet: number
  yayindakiIlan: number
  yetkili: YetkiliDurumu
  testFirmasi: boolean
  /** Kişisel takip gerekiyorsa: kaç gündür ilerleme yok */
  takipGun: number | null
  sonNot?: { not: string; tarih: string } | null
}

/** Bütün firmalar, kurulum bilgisiyle. Bir istekte bir kez hesaplanır. */
export const takipEsigi = cache(async () => {
  const payload = await payloadAl()
  const ayar = await payload.findGlobal({ slug: 'ayarlar', overrideAccess: true })
  const gunler = hatirlatmaGunleri(ayar.hatirlatmaGunleri)
  return { gun: gunler[gunler.length - 1]!, hatirlatmalar: gunler }
})

export const firmaSatirlari = cache(async (): Promise<FirmaSatiri[]> => {
  const payload = await payloadAl()
  const tum = <T,>(r: { docs: T[] }) => r.docs
  const TAKIP_GUN = (await takipEsigi()).gun // son otomatik hatırlatmadan sonra kişisel takip
  const [firmalar, uyeler, davetler, ilanlar] = await Promise.all([
    payload.find({ collection: 'firmalar', limit: 5000, pagination: false, depth: 0, overrideAccess: true, sort: 'kisaAd' }).then(tum),
    payload
      .find({ collection: 'kullanicilar', where: { and: [{ rol: { equals: 'firma' } }, { pasif: { not_equals: true } }] }, select: { firma: true }, limit: 20000, pagination: false, depth: 0, overrideAccess: true })
      .then(tum),
    payload.find({ collection: 'davetler', select: { firma: true, kullanildi: true, sonGecerlilik: true, createdAt: true }, limit: 20000, pagination: false, depth: 0, overrideAccess: true }).then(tum),
    payload
      .find({ collection: 'ilanlar', where: { yayinTarihi: { exists: true } }, select: { firma: true, durum: true }, limit: 50000, pagination: false, depth: 0, overrideAccess: true })
      .then(tum),
  ])
  const simdi = new Date()
  const say = <T,>(liste: T[], f: (x: T) => number) => {
    const m = new Map<number, T[]>()
    for (const x of liste) m.set(f(x), [...(m.get(f(x)) ?? []), x])
    return m
  }
  const uyeMap = say(uyeler as Kullanicilar[], (u) => kimlik(u.firma))
  const davetMap = say(davetler as Davetler[], (d) => kimlik(d.firma))
  const ilanMap = say(ilanlar, (i) => kimlik(i.firma))
  return (firmalar as Firmalar[]).map((f) => {
    const asama = f.asama as KurulumAsamasi
    const fDavet = davetMap.get(f.id) ?? []
    const bekleyen = fDavet.filter((d) => !d.kullanildi)
    const kabul = fDavet.filter((d) => d.kullanildi).map((d) => d.kullanildi!).sort()
    const ilkIlan = (ilanMap.get(f.id) ?? []).length > 0
    // Kişisel takip: davet 14 gündür kabul edilmedi veya devralındıktan 14 gün sonra profil tamamlanmadı
    let takipGun: number | null = null
    if (asama === 'davet' && bekleyen.length) {
      const g = gunOnce(bekleyen.map((d) => d.createdAt).sort()[0]!, simdi)
      if (g >= TAKIP_GUN) takipGun = g
    } else if (asama === 'devralindi' && kabul[0]) {
      const g = gunOnce(kabul[0], simdi)
      if (g >= TAKIP_GUN) takipGun = g
    }
    const notlar = f.takipNotlari ?? []
    return {
      id: f.id,
      kisaAd: f.kisaAd,
      unvan: f.unvan,
      konum: f.konum,
      asama,
      asamaAdi: ASAMA_ADI[asama],
      huni: huniBasamagi({ asama, ilkIlan }),
      ilkIlan,
      uye: (uyeMap.get(f.id) ?? []).length,
      bekleyenDavet: bekleyen.length,
      yayindakiIlan: (ilanMap.get(f.id) ?? []).filter((i) => i.durum === 'yayinda').length,
      yetkili: yetkiliDurumu(f),
      testFirmasi: Boolean(f.testFirmasi),
      takipGun,
      sonNot: notlar.length ? { not: notlar[notlar.length - 1]!.not, tarih: notlar[notlar.length - 1]!.tarih } : null,
    }
  })
})

export const kurulumOzeti = cache(async () => {
  const s = await firmaSatirlari()
  const etkin = s.filter((f) => f.asama !== 'pasif')
  return {
    huni: huniSayilari(etkin),
    takip: etkin.filter((f) => f.takipGun !== null).sort((a, b) => b.takipGun! - a.takipGun!),
    yetkiliEksik: etkin.filter((f) => f.asama === 'iskelet' && f.yetkili !== 'tamam'),
    davetHazir: etkin.filter((f) => f.asama === 'iskelet' && f.yetkili === 'tamam'),
    pasif: s.length - etkin.length,
    esik: await takipEsigi(),
  }
})

export function firmaSuz(s: FirmaSatiri[], q: { ara?: string; asama?: string }) {
  const ara = normallestir(q.ara ?? '')
  return s.filter(
    (f) =>
      (!ara || normallestir(`${f.kisaAd} ${f.unvan} ${f.konum}`).includes(ara)) &&
      (!q.asama || (q.asama === 'takip' ? f.takipGun !== null : q.asama === 'ilk-ilan' ? f.ilkIlan : f.asama === q.asama)),
  )
}

/** Tek firmanın yönetim ayrıntısı. */
export async function firmaYonetimAyrintisi(id: number) {
  if (!Number.isInteger(id) || id <= 0) return null
  const payload = await payloadAl()
  const firma = await payload.findByID({ collection: 'firmalar', id, depth: 1, overrideAccess: true }).catch((): null => null)
  if (!firma) return null
  const [uyeler, davetler, ilanlar, kayitlar, sektorler] = await Promise.all([
    payload.find({ collection: 'kullanicilar', where: { firma: { equals: id } }, select: { ad: true, email: true, unvan: true, firmaYetkisi: true, pasif: true }, limit: 100, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'davetler', where: { firma: { equals: id } }, sort: '-createdAt', limit: 100, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'ilanlar', where: { firma: { equals: id } }, select: { pozisyonAdi: true, durum: true, sonBasvuru: true, updatedAt: true }, sort: '-updatedAt', limit: 50, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'islem-kayitlari', where: { and: [{ kayitTuru: { equals: 'firmalar' } }, { kayitId: { equals: String(id) } }] }, sort: '-createdAt', limit: 15, depth: 1, overrideAccess: true, populate: { kullanicilar: { ad: true } } }),
    payload.find({ collection: 'taksonomiler', where: { tur: { equals: 'sektor' } }, select: { ad: true }, limit: 500, pagination: false, depth: 0, overrideAccess: true }),
  ])
  const satir = (await firmaSatirlari()).find((f) => f.id === id) ?? null
  return {
    firma,
    satir,
    uyeler: uyeler.docs,
    davetler: davetler.docs.map((d) => ({ ...d, doldu: !d.kullanildi && new Date(d.sonGecerlilik).getTime() < Date.now() })),
    ilanlar: ilanlar.docs,
    kayitlar: kayitlar.docs,
    sektorler: sektorler.docs.map((d) => ({ id: d.id, ad: d.ad })).sort((a, b) => a.ad.localeCompare(b.ad, 'tr')),
  }
}

export const sektorSecenekleri = cache(async () => {
  const payload = await payloadAl()
  const { docs } = await payload.find({ collection: 'taksonomiler', where: { tur: { equals: 'sektor' } }, select: { ad: true }, limit: 500, pagination: false, depth: 0, overrideAccess: true })
  return docs.map((d) => ({ id: d.id, ad: d.ad })).sort((a, b) => a.ad.localeCompare(b.ad, 'tr'))
})
