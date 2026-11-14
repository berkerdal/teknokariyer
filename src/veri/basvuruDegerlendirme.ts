/**
 * Firma paneli: başvuru listesi ve ayrıntısı. Firma, başvuru anında dondurulan profil kopyasını görür; aday profilini
 * sonradan değiştirse de kopya değişmez. Eşleşme açıklaması bu kopyaya göre hesaplanır (talimatlar 6).
 */
import { cache } from 'react'
import type { Basvurular, Ilanlar } from '@/payload-types'
import { eslesmeHesapla, type CalismaModeli, type Cefr, type Deneyim, type EslesmeProfili, type EslesmeSonucu, type IlanKosullari } from '@/alan/eslesme'
import { firmaKimligi, firmaKullanicisiMi } from '@/erisim'
import { oturum, payloadAl } from './payload'

export interface ProfilKopyasi {
  ad?: string
  eposta?: string
  telefon?: string | null
  tanitim?: string | null
  okul?: string | null
  bolum?: string | null
  sinif?: string | null
  mezuniyet?: string | null
  deneyimSeviyesi?: string | null
  deneyimler?: Array<{ pozisyon?: string; kurum?: string; baslangic?: string | null; bitis?: string | null; aciklama?: string | null }>
  beceriler?: Array<{ ad?: string; seviye?: string }>
  diller?: Array<{ dil?: string; seviye?: string }>
  sertifikalar?: Array<{ ad?: string; kurum?: string | null; yil?: number | null }>
  baglantilar?: Array<{ ad?: string; adres?: string }>
  tercihler?: { modeller?: string[]; turler?: string[]; sehir?: string; baslama?: string }
  kopyaTarihi?: string
}

const ad = (x: unknown) => (x && typeof x === 'object' ? (x as { ad?: string }).ad : undefined)

export function ilanKosullari(i: Ilanlar): IlanKosullari {
  const adlar = (x: unknown[] | null | undefined) => (x ?? []).map(ad).filter((y): y is string => Boolean(y))
  return {
    zorunluBeceriler: adlar(i.zorunluBeceriler),
    tercihBeceriler: adlar(i.tercihBeceriler),
    model: i.model as CalismaModeli,
    bolumler: adlar(i.bolumler),
    deneyim: i.deneyim as Deneyim,
    diller: (i.diller ?? []).flatMap((d) => (ad(d.dil) ? [{ dil: ad(d.dil)!, seviye: d.seviye as Cefr }] : [])),
  }
}

export function kopyaProfili(p: ProfilKopyasi): EslesmeProfili {
  return {
    beceriler: (p.beceriler ?? []).map((b) => b.ad).filter((x): x is string => Boolean(x)),
    modeller: (p.tercihler?.modeller ?? []) as CalismaModeli[],
    bolum: p.bolum ?? undefined,
    deneyim: (p.deneyimSeviyesi ?? undefined) as Deneyim | undefined,
    diller: (p.diller ?? []).flatMap((d) => (d.dil ? [{ dil: d.dil, seviye: d.seviye as Cefr }] : [])),
  }
}

export interface BasvuruSatiri {
  id: number
  ilanId: number
  pozisyonAdi: string
  ad: string
  hesapSilindi: boolean
  egitim: string
  durum: string
  tarih: string
  kaynak: string
  eleyiciUyari: boolean
  puan: number | null
  eslesme: EslesmeSonucu | null
  zorunlularTamam: boolean
}

/** Firmanın ilanları (taksonomi adlarıyla) ve bütün başvuruları. Sayfa filtreleri bellekte uygulanır. */
export const firmaBasvurulari = cache(async (): Promise<{ satirlar: BasvuruSatiri[]; ilanlar: Ilanlar[] }> => {
  const k = await oturum()
  if (!k || !firmaKullanicisiMi(k)) return { satirlar: [], ilanlar: [] }
  const payload = await payloadAl()
  const [ilanlar, basvurular] = await Promise.all([
    payload.find({ collection: 'ilanlar', where: { firma: { equals: firmaKimligi(k) } }, depth: 1, limit: 500, pagination: false, overrideAccess: false, user: k, populate: { taksonomiler: { ad: true } } }),
    payload.find({ collection: 'basvurular', where: { firma: { equals: firmaKimligi(k) } }, sort: '-createdAt', depth: 0, limit: 5000, pagination: false, overrideAccess: false, user: k }),
  ])
  const ilanHaritasi = new Map(ilanlar.docs.map((i) => [i.id, i]))
  const satirlar = basvurular.docs.flatMap((b): BasvuruSatiri[] => {
    const ilan = ilanHaritasi.get(Number(typeof b.ilan === 'object' ? b.ilan?.id : b.ilan))
    if (!ilan) return []
    const p = (b.profilKopyasi ?? {}) as ProfilKopyasi
    const hesapSilindi = !b.adayKullanici
    const eslesme = hesapSilindi ? null : eslesmeHesapla(ilanKosullari(ilan), kopyaProfili(p), 'firma')
    return [
      {
        id: b.id,
        ilanId: ilan.id,
        pozisyonAdi: ilan.pozisyonAdi,
        ad: hesapSilindi ? 'Aday hesabını sildi' : (p.ad ?? 'Aday'),
        hesapSilindi,
        egitim: [p.bolum, p.okul].filter(Boolean).join(', '),
        durum: b.durum,
        tarih: b.createdAt,
        kaynak: b.kaynak ?? 'portal',
        eleyiciUyari: Boolean(b.eleyiciUyari),
        puan: b.puan ?? null,
        eslesme,
        zorunlularTamam: Boolean(eslesme && eslesme.eksikZorunlu.length === 0),
      },
    ]
  })
  return { satirlar, ilanlar: ilanlar.docs }
})

/** Tek başvuru, ilanıyla (taksonomi adları dolu). Kiracı denetimi servis katmanında da yapılır. */
export async function basvuruAyrintisi(b: Basvurular): Promise<{ ilan: Ilanlar | null }> {
  const k = await oturum()
  if (!k) return { ilan: null }
  const payload = await payloadAl()
  const ilan = await payload
    .findByID({ collection: 'ilanlar', id: Number(typeof b.ilan === 'object' ? b.ilan?.id : b.ilan), depth: 1, overrideAccess: false, user: k, populate: { taksonomiler: { ad: true } } })
    .catch((): null => null)
  return { ilan }
}
