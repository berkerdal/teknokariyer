/**
 * Bildirim alıcıları. Firma bildirimleri, firmanın ilanlarla ilgilenen etkin kullanıcılarına (tam yetkili ve ilan
 * sorumlusu) gider; ekipten çıkarılanlara gitmez. Gönderim e-posta altyapısıyla yapılır; yayın dışı ortamlarda
 * e-postalar dışarı çıkmaz, test posta kutusuna düşer.
 */
import type { Payload } from 'payload'
import type { Eposta } from '@/altyapi/epostaSablonlari'

export async function firmaEkibineGonder(payload: Payload, firmaId: number, e: Eposta): Promise<number> {
  const { docs } = await payload.find({
    collection: 'kullanicilar',
    where: { and: [{ firma: { equals: firmaId } }, { rol: { equals: 'firma' } }, { firmaYetkisi: { in: ['yonetici', 'ilan-sorumlusu'] } }, { pasif: { not_equals: true } }] },
    select: { email: true },
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  for (const u of docs) await epostaGonder(payload, u.email, e)
  return docs.length
}

/** Tek alıcıya e-posta; ekler (takvim dosyası gibi) varsa iletilir. */
export function epostaGonder(payload: Payload, kime: string, e: Eposta) {
  return payload.sendEmail({
    to: kime,
    subject: e.konu,
    html: e.html,
    text: e.metin,
    ...(e.ekler?.length ? { attachments: e.ekler.map((x) => ({ filename: x.dosyaAdi, content: x.icerik, contentType: x.tur })) } : {}),
  })
}
