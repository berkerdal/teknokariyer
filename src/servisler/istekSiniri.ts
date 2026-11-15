/**
 * İstek sınırlama sayaçları. Kurallar `src/alan/istekSiniri.ts`.
 *
 * Kaynak (IP adresi veya hesap kimliği) anahtarlı özetle saklanır; IP adresinin kendisi hiçbir yerde tutulmaz. Sayaç
 * sağlayıcıdan bağımsızdır (D1 ve PostgreSQL'de aynı çalışır). Aynı anda gelen istekler sayacı birkaç fazla geçirebilir;
 * amaç kesin sayım değil, toplu denemeyi durdurmaktır.
 */
import type { Payload } from 'payload'
import { PARCA } from '@/altyapi/parcali'
import { anahtarliOzet } from '@/altyapi/sifreleme'
import { SINIRLAR, pencereBasi, sinirMesaji, type SinirliEylem } from '@/alan/istekSiniri'
import { IslemHatasi } from './ortak'

/** Sınır aşıldıysa Türkçe ve kalan süreyi söyleyen bir hatayla durdurur; aşılmadıysa sayacı artırır. */
export async function sinirDenetle(payload: Payload, eylem: SinirliEylem, kaynak: string, siz = true, simdi = new Date()): Promise<void> {
  const s = SINIRLAR[eylem]
  const bas = pencereBasi(simdi, s.dakika)
  const anahtar = `${eylem}:${(await anahtarliOzet(kaynak, 'istek-siniri')).slice(0, 32)}:${bas.getTime()}`
  const { docs } = await payload.find({ collection: 'istek-sinirlari', where: { anahtar: { equals: anahtar } }, limit: 1, depth: 0, overrideAccess: true })
  const mevcut = docs[0]
  if (mevcut && mevcut.sayi >= s.sayi) throw new IslemHatasi(sinirMesaji(eylem, simdi, siz), 429)
  if (mevcut) {
    await payload.update({ collection: 'istek-sinirlari', id: mevcut.id, data: { sayi: mevcut.sayi + 1 }, overrideAccess: true })
    return
  }
  try {
    await payload.create({ collection: 'istek-sinirlari', data: { anahtar, sayi: 1, bitis: new Date(bas.getTime() + s.dakika * 60_000).toISOString() }, overrideAccess: true })
  } catch {
    // Aynı anda başka bir istek aynı satırı açtıysa (benzersiz anahtar) sayaç zaten var; bu isteği geçir.
  }
}

/** Süresi biten sayaçlar (gece işi). */
export async function eskiSayaclariSil(payload: Payload, simdi = new Date()): Promise<number> {
  let toplam = 0
  for (let i = 0; i < 100; i++) {
    const { docs } = await payload.find({ collection: 'istek-sinirlari', where: { bitis: { less_than: simdi.toISOString() } }, limit: PARCA, depth: 0, overrideAccess: true })
    if (!docs.length) break
    await payload.delete({ collection: 'istek-sinirlari', where: { id: { in: docs.map((d) => d.id) } }, overrideAccess: true })
    toplam += docs.length
  }
  return toplam
}
