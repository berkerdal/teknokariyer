/**
 * Herkese açık ilan ve firma verisi (ön yüz).
 * Okuma, ziyaretçinin erişim kuralıyla yapılır (overrideAccess: false); firma bilgisinden yalnızca herkese açık alanlar alınır.
 */
import { cache } from 'react'
import type { Firmalar, Ilanlar, Taksonomiler } from '@/payload-types'
import type { IlanOzeti, IlanTuru } from '@/alan/ilanFiltre'
import type { CalismaModeli, Cefr, Deneyim } from '@/alan/eslesme'
import { suresiDolduMu } from '@/alan/ilan'
import { ortam } from '@/altyapi/eposta'
import { payloadAl } from './payload'

const ad = (x: unknown): string | undefined => (x && typeof x === 'object' ? ((x as Taksonomiler).ad ?? undefined) : undefined)
const id = (x: unknown): number => Number(x && typeof x === 'object' ? (x as { id: number }).id : x)

export interface FirmaOzeti {
  id: number
  ad: string
  unvan: string
  slug: string
  konum: string
  sektor?: string
}

/** Firma herkese gösterilebilir mi? Pasif firma gösterilmez; test firmaları yalnızca yayın dışı ortamlarda görünür. */
function firmaGorunurMu(f: Pick<Firmalar, 'asama' | 'testFirmasi'>): boolean {
  if (f.asama === 'pasif') return false
  return !f.testFirmasi || ortam() !== 'yayin'
}

const firmaOzeti = (f: Firmalar): FirmaOzeti => ({
  id: f.id,
  ad: f.kisaAd,
  unvan: f.unvan,
  slug: f.slug,
  konum: f.konum,
  sektor: ad(f.sektor),
})

/** Firmaların herkese açık özetleri (kimlik → özet). Görünmeyen (pasif) firma dönmez. */
export async function firmalariAl(idler: number[]): Promise<Map<number, FirmaOzeti>> {
  if (!idler.length) return new Map()
  const payload = await payloadAl()
  const { docs } = await payload.find({
    collection: 'firmalar',
    where: { id: { in: [...new Set(idler)] } },
    depth: 1,
    limit: idler.length,
    overrideAccess: true, // herkese açık alanlar aşağıda seçilir; yetkili kişi bilgisi dışarı çıkmaz
    select: { kisaAd: true, unvan: true, slug: true, konum: true, sektor: true, asama: true, testFirmasi: true },
  })
  return new Map(docs.filter(firmaGorunurMu).map((f) => [f.id, firmaOzeti(f as Firmalar)]))
}

function ozet(i: Ilanlar, firma: FirmaOzeti): IlanOzeti {
  return {
    id: i.id,
    pozisyonAdi: i.pozisyonAdi,
    firma: { id: firma.id, ad: firma.ad, slug: firma.slug, konum: firma.konum, sektor: firma.sektor },
    tur: i.tur as IlanTuru,
    altTur: i.altTur,
    model: i.model as CalismaModeli,
    deneyim: i.deneyim as Deneyim,
    aile: ad(i.aile),
    ucretliStaj: Boolean(i.ucretliStaj),
    pauOncelik: Boolean(i.pauOncelik),
    sonBasvuru: i.sonBasvuru,
    yayinTarihi: i.yayinTarihi ?? undefined,
    arama: i.arama ?? '',
  }
}

/** Yayındaki, süresi dolmamış ve firması görünür ilanlar. */
export const yayindakiIlanlar = cache(async (): Promise<IlanOzeti[]> => {
  const payload = await payloadAl()
  const { docs } = await payload.find({
    collection: 'ilanlar',
    where: { durum: { equals: 'yayinda' } },
    depth: 1,
    limit: 1000,
    overrideAccess: false,
    select: {
      pozisyonAdi: true, firma: true, tur: true, altTur: true, model: true, deneyim: true, aile: true, ucretliStaj: true, pauOncelik: true,
      sonBasvuru: true, yayinTarihi: true, arama: true,
    },
    populate: { firmalar: { kisaAd: true }, taksonomiler: { ad: true } },
  })
  const simdi = new Date()
  const firmalar = await firmalariAl(docs.map((d) => id(d.firma)))
  return docs
    .filter((d) => !suresiDolduMu(new Date(d.sonBasvuru), simdi))
    .flatMap((d) => {
      const f = firmalar.get(id(d.firma))
      return f ? [ozet(d as Ilanlar, f)] : []
    })
})

export interface IlanAyrintisi extends IlanOzeti {
  durum: Ilanlar['durum']
  kapanisNedeni?: Ilanlar['kapanisNedeni']
  firmaBilgi: FirmaOzeti
  egitim: string
  bolumler: string[]
  zorunluBeceriler: string[]
  tercihBeceriler: string[]
  diller: Array<{ dil: string; seviye: Cefr }>
  pozisyonSayisi: number
  baslangic?: string
  ucret?: { enAz?: number; enCok?: number }
  yanHaklar: string[]
  isTanimi: string
  nitelikler: string
  soruSayisi: number
  staj?: { donem?: string; ucretli: boolean; sgk?: string; belge: boolean; pauOncelik: boolean }
  basvuruSayisi: number
}

/** İlanın ayrıntısı. İlan yoksa, herkese açık değilse veya firması görünmüyorsa null. */
export const ilanAyrintisi = cache(async (ilanId: number): Promise<IlanAyrintisi | null> => {
  if (!Number.isInteger(ilanId) || ilanId <= 0) return null
  const payload = await payloadAl()
  const i = await payload
    .findByID({ collection: 'ilanlar', id: ilanId, depth: 1, overrideAccess: false, populate: { firmalar: { kisaAd: true }, taksonomiler: { ad: true } } })
    .catch((): null => null)
  if (!i) return null
  const f = (await firmalariAl([id(i.firma)])).get(id(i.firma))
  if (!f) return null
  const adlar = (x: unknown[] | null | undefined) => (x ?? []).map(ad).filter((y): y is string => Boolean(y))
  return {
    ...ozet(i, f),
    durum: i.durum,
    kapanisNedeni: i.kapanisNedeni,
    firmaBilgi: f,
    egitim: i.egitim,
    bolumler: adlar(i.bolumler),
    zorunluBeceriler: adlar(i.zorunluBeceriler),
    tercihBeceriler: adlar(i.tercihBeceriler),
    diller: (i.diller ?? []).flatMap((d) => (ad(d.dil) ? [{ dil: ad(d.dil)!, seviye: d.seviye as Cefr }] : [])),
    pozisyonSayisi: i.pozisyonSayisi ?? 1,
    baslangic: i.baslangic ?? undefined,
    ucret: i.ucretGorunur && (i.ucretEnAz || i.ucretEnCok) ? { enAz: i.ucretEnAz ?? undefined, enCok: i.ucretEnCok ?? undefined } : undefined,
    yanHaklar: (i.yanHaklar ?? []).map((y) => y.ad),
    isTanimi: i.isTanimi,
    nitelikler: i.nitelikler,
    soruSayisi: i.onElemeSorulari?.length ?? 0,
    staj:
      i.tur === 'staj'
        ? {
            donem: i.stajDonemi ?? undefined,
            ucretli: Boolean(i.ucretliStaj),
            sgk: i.sgk ?? undefined,
            belge: i.stajBelgesi !== false,
            pauOncelik: Boolean(i.pauOncelik),
          }
        : undefined,
    basvuruSayisi: i.basvuruSayisi ?? 0,
  }
})

/** Firmanın herkese açık sayfası için firma (adres adıyla). */
export const firmaBul = cache(async (slug: string) => {
  const payload = await payloadAl()
  const { docs } = await payload.find({
    collection: 'firmalar',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
    overrideAccess: true,
    select: {
      kisaAd: true, unvan: true, slug: true, konum: true, sektor: true, web: true, kisaTanitim: true, uzunTanitim: true,
      teknolojiler: true, calismaModelleri: true, yanHaklar: true, kurulusYili: true, calisanAraligi: true, asama: true,
      testFirmasi: true, yayinaHazir: true,
    },
  })
  const f = docs[0] as Firmalar | undefined
  if (!f || !firmaGorunurMu(f)) return null
  return {
    ...firmaOzeti(f),
    web: f.web ?? undefined,
    kisaTanitim: f.kisaTanitim ?? undefined,
    uzunTanitim: f.uzunTanitim ?? undefined,
    teknolojiler: (f.teknolojiler ?? []).map(ad).filter((y): y is string => Boolean(y)),
    calismaModelleri: (f.calismaModelleri ?? []) as CalismaModeli[],
    yanHaklar: (f.yanHaklar ?? []).map((y) => y.ad),
    kurulusYili: f.kurulusYili ?? undefined,
    calisanAraligi: f.calisanAraligi ?? undefined,
  }
})
