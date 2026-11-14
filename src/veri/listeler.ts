/** Yönetici A.Ş. liste (taksonomi) ekranının verisi. */
import { cache } from 'react'
import { normallestir } from '@/alan/metin'
import type { ListeTuru } from '@/servisler/listeler'
import { payloadAl } from './payload'

export const SAYFA_BOYU = 50

export const listeSayilari = cache(async () => {
  const payload = await payloadAl()
  const { docs } = await payload.find({ collection: 'taksonomiler', select: { tur: true, aktif: true }, limit: 50000, pagination: false, depth: 0, overrideAccess: true })
  const sayi: Record<string, { toplam: number; secilemez: number }> = {}
  for (const d of docs) {
    const s = (sayi[d.tur] ??= { toplam: 0, secilemez: 0 })
    s.toplam++
    if (d.aktif === false) s.secilemez++
  }
  return sayi
})

export async function listeOgeleri(tur: ListeTuru, ara: string, sayfa: number, yalnizSecilemez: boolean) {
  const payload = await payloadAl()
  const q = normallestir(ara)
  const kosullar: Array<Record<string, unknown>> = [{ tur: { equals: tur } }]
  if (q) kosullar.push({ arama: { contains: q } })
  if (yalnizSecilemez) kosullar.push({ aktif: { equals: false } })
  const r = await payload.find({
    collection: 'taksonomiler',
    where: { and: kosullar } as never,
    select: { ad: true, esAnlamlilar: true, aktif: true },
    sort: 'arama', // normalleştirilmiş ad: Türkçe harfler yerinde sıralanır (ç, c ile birlikte)
    limit: SAYFA_BOYU,
    page: Math.max(1, sayfa),
    depth: 0,
    overrideAccess: true,
  })
  return {
    ogeler: r.docs.map((d) => ({ id: d.id, ad: d.ad, esAnlamlilar: (d.esAnlamlilar ?? []).map((e) => e.ad), aktif: d.aktif !== false })),
    toplam: r.totalDocs,
    sayfa: r.page ?? 1,
    sayfaSayisi: r.totalPages,
  }
}
