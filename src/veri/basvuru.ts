/**
 * Başvuru akışının ve aday panelinin verisi (yalnızca oturumdaki adayın kendi kayıtları).
 */
import type { Adaylar, Basvurular, Dosyalar, Ilanlar, Taksonomiler } from '@/payload-types'
import { basvuruEksikleri, type EksikAlan } from '@/alan/basvuru'
import { basvuruIlani, basvuruProfili } from '@/servisler/basvuru'
import { kimlik, type Kullanici } from '@/servisler/ortak'
import { payloadAl } from './payload'
import { firmalariAl } from './ilanlar'

const ad = (x: unknown) => (x && typeof x === 'object' ? ((x as Taksonomiler).ad ?? '') : '')

export interface CvOzeti {
  id: number
  ad: string
  boyut?: number
  tarih?: string
}

export const cvOzetleri = (a: Adaylar): CvOzeti[] =>
  (a.cvler ?? []).map((c) => {
    const d = typeof c.dosya === 'object' ? (c.dosya as Dosyalar) : null
    return { id: kimlik(c.dosya), ad: c.ad, boyut: d?.filesize ?? undefined, tarih: d?.createdAt }
  })

export async function taksonomiSecenekleri(tur: 'universite' | 'bolum' | 'dil' | 'beceri') {
  const payload = await payloadAl()
  const { docs } = await payload.find({ collection: 'taksonomiler', where: { tur: { equals: tur } }, limit: 1000, depth: 0, sort: 'ad', overrideAccess: true, select: { ad: true } })
  return docs.map((d) => ({ id: d.id, ad: d.ad })).sort((a, b) => a.ad.localeCompare(b.ad, 'tr'))
}

export interface BasvuruHazirligi {
  ilan: Ilanlar
  aday: Adaylar
  eksikler: EksikAlan[]
  /** Eksik dil şartları: dil kimliği → ad ve istenen seviye */
  dilSartlari: Array<{ id: number; ad: string; seviye: string }>
  cvler: CvOzeti[]
  oncekiBasvuru: Basvurular | null
}

export async function basvuruHazirligi(kullanici: Kullanici, ilanId: number): Promise<BasvuruHazirligi | null> {
  const payload = await payloadAl()
  const ilan = await payload.findByID({ collection: 'ilanlar', id: ilanId, depth: 1, overrideAccess: false }).catch((): null => null)
  if (!ilan) return null
  const { docs } = await payload.find({ collection: 'adaylar', where: { kullanici: { equals: kullanici.id } }, depth: 1, limit: 1, overrideAccess: true })
  const aday =
    docs[0] ?? (await payload.create({ collection: 'adaylar', data: { kullanici: kullanici.id, havuz: { gorunurluk: 'gizli' } } as never, overrideAccess: true, depth: 1 }))
  const onceki = await payload.find({
    collection: 'basvurular',
    where: { and: [{ ilan: { equals: ilanId } }, { adayKullanici: { equals: kullanici.id } }] },
    limit: 1,
    depth: 0,
    overrideAccess: false,
    user: kullanici,
  })
  return {
    ilan,
    aday,
    eksikler: basvuruEksikleri(basvuruIlani(ilan), basvuruProfili(aday)),
    dilSartlari: (ilan.diller ?? []).map((d) => ({ id: kimlik(d.dil), ad: ad(d.dil), seviye: d.seviye })),
    cvler: cvOzetleri(aday),
    oncekiBasvuru: onceki.docs[0] ?? null,
  }
}

export interface BasvuruKarti {
  id: number
  durum: string
  tarih: string
  ilan: { id: number; pozisyonAdi: string; durum: string; firmaAd: string; firmaKonum: string }
}

/** Adayın başvuruları: en yeni önce. Firma notları ve puanları koleksiyon kuralıyla zaten adaya gelmez. */
export async function basvurularim(kullanici: Kullanici): Promise<BasvuruKarti[]> {
  const payload = await payloadAl()
  const { docs } = await payload.find({
    collection: 'basvurular',
    where: { adayKullanici: { equals: kullanici.id } },
    depth: 2,
    limit: 200,
    sort: '-createdAt',
    overrideAccess: false,
    user: kullanici,
    populate: { ilanlar: { pozisyonAdi: true, durum: true, firma: true }, firmalar: { kisaAd: true, konum: true } },
  })
  const ilanlar = docs.map((b) => (typeof b.ilan === 'object' ? (b.ilan as Ilanlar) : null))
  const firmalar = await firmalariAl(ilanlar.flatMap((i) => (i ? [kimlik(i.firma)] : [])))
  return docs.map((b, n) => {
    const i = ilanlar[n]
    const fo = i ? firmalar.get(kimlik(i.firma)) : undefined
    const f = fo ? { kisaAd: fo.ad, konum: fo.konum } : null
    return {
      id: b.id,
      durum: b.durum,
      tarih: b.createdAt,
      ilan: { id: i?.id ?? kimlik(b.ilan), pozisyonAdi: i?.pozisyonAdi ?? 'İlan', durum: i?.durum ?? '', firmaAd: f?.kisaAd ?? '', firmaKonum: f?.konum ?? '' },
    }
  })
}
