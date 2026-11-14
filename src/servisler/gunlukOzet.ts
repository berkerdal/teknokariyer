/**
 * Günlük özet (K31): gece çalışan iş, biten günün sayılarını bir satır olarak yazar. Görüntülenme gibi geçmişi tutulmayan
 * ölçüler için tek kaynaktır. Aynı gün için ikinci kez yazılmaz (ilk çalışma geçerlidir).
 */
import type { Payload } from 'payload'
import { trGunBasi, trGunMetni } from '@/alan/tarih'
import { kimlik } from './ortak'

type Sayac = { id: number; goruntulenme: number; basvuru: number }

export async function gunlukOzetYaz(payload: Payload, simdi = new Date()): Promise<string | null> {
  const bitis = trGunBasi(simdi) // bugünün başı = dünün sonu
  const baslangic = new Date(bitis.getTime() - 86_400_000)
  const tarih = trGunMetni(baslangic)
  const varMi = await payload.count({ collection: 'gunluk-ozetler', where: { tarih: { equals: tarih } }, overrideAccess: true })
  if (varMi.totalDocs) return null
  const aralik = (alan: string) => ({ and: [{ [alan]: { greater_than_equal: baslangic.toISOString() } }, { [alan]: { less_than: bitis.toISOString() } }] })
  const say = (collection: 'ilanlar' | 'basvurular' | 'kullanicilar' | 'adaylar', where: object) =>
    payload.count({ collection, where: where as never, overrideAccess: true }).then((r) => r.totalDocs)
  const [ilanlar, basvurular, yayinda, yeniIlan, gunBasvuru, toplamAday, yeniAday, havuz, onceki] = await Promise.all([
    payload.find({ collection: 'ilanlar', where: { yayinTarihi: { exists: true } }, select: { goruntulenme: true }, limit: 50000, pagination: false, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'basvurular', select: { ilan: true }, limit: 200000, pagination: false, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'ilanlar', where: { durum: { equals: 'yayinda' } }, select: { firma: true }, limit: 50000, pagination: false, depth: 0, overrideAccess: true }),
    say('ilanlar', aralik('yayinTarihi')),
    say('basvurular', aralik('createdAt')),
    say('kullanicilar', { rol: { equals: 'aday' } }),
    say('kullanicilar', { and: [{ rol: { equals: 'aday' } }, aralik('createdAt')] }),
    say('adaylar', { 'havuz.gorunurluk': { not_equals: 'gizli' } }),
    payload.find({ collection: 'gunluk-ozetler', where: { tarih: { less_than: tarih } }, sort: '-tarih', limit: 1, depth: 0, overrideAccess: true }),
  ])
  const basvuruSayisi = new Map<number, number>()
  for (const b of basvurular.docs) basvuruSayisi.set(kimlik(b.ilan), (basvuruSayisi.get(kimlik(b.ilan)) ?? 0) + 1)
  const sayaclar: Sayac[] = ilanlar.docs.map((i) => ({ id: i.id, goruntulenme: i.goruntulenme ?? 0, basvuru: basvuruSayisi.get(i.id) ?? 0 }))
  // O günün görüntülenmesi: önceki fotoğrafla fark (önceki fotoğraf yoksa yalnızca o gün yayına girenlerin toplamı)
  const once = new Map(((onceki.docs[0]?.ilanlar as Sayac[] | null) ?? []).map((s) => [s.id, s.goruntulenme]))
  const goruntulenme = onceki.docs[0] ? sayaclar.reduce((n, s) => n + Math.max(0, s.goruntulenme - (once.get(s.id) ?? 0)), 0) : 0
  await payload.create({
    collection: 'gunluk-ozetler',
    data: {
      tarih,
      yayindakiIlan: yayinda.docs.length,
      yeniIlan,
      basvuru: gunBasvuru,
      goruntulenme,
      toplamAday,
      yeniAday,
      havuzdakiAday: havuz,
      ilanVerenFirma: new Set(yayinda.docs.map((i) => kimlik(i.firma))).size,
      ilanlar: sayaclar,
    },
    overrideAccess: true,
  })
  return tarih
}
