/**
 * Oturumdaki adayın profili (ön yüz). Eşleştirmeye yalnızca beceri, model, bölüm, deneyim ve dil girer;
 * cinsiyet hiçbir zaman girmez (K25).
 */
import { cache } from 'react'
import type { Adaylar, Taksonomiler } from '@/payload-types'
import type { CalismaModeli, Cefr, Deneyim, EslesmeProfili } from '@/alan/eslesme'
import { adayMi } from '@/erisim'
import { oturum, payloadAl } from './payload'

const ad = (x: unknown) => (x && typeof x === 'object' ? (x as Taksonomiler).ad : undefined)

export const oturumdakiAday = cache(async (): Promise<Adaylar | null> => {
  const k = await oturum()
  if (!k || !adayMi(k)) return null
  const payload = await payloadAl()
  const { docs } = await payload.find({
    collection: 'adaylar',
    where: { kullanici: { equals: k.id } },
    depth: 1,
    limit: 1,
    overrideAccess: false,
    user: k,
  })
  return docs[0] ?? null
})

export function eslesmeProfili(a: Adaylar): EslesmeProfili {
  return {
    beceriler: (a.beceriler ?? []).map((b) => ad(b.beceri)).filter((x): x is string => Boolean(x)),
    modeller: (a.tercihler?.modeller ?? []) as CalismaModeli[],
    bolum: ad(a.bolum) ?? undefined,
    deneyim: (a.deneyimSeviyesi ?? undefined) as Deneyim | undefined,
    diller: (a.diller ?? []).flatMap((d) => (ad(d.dil) ? [{ dil: ad(d.dil)!, seviye: d.seviye as Cefr }] : [])),
  }
}
