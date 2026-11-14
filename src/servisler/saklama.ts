/**
 * KVKK saklama süreleri (talimatlar: “ilan kapandıktan 12 ay sonra başvurular anonimleştirilir, CV dosyaları silinir”).
 * Süreler Ayarlar'dan gelir; hukuk birimi onayına kadar önerilen varsayılanlar geçerlidir.
 *
 * Anonimleştirilen başvuruda kişisel veri kalmaz (profil kopyası, CV, ön yazı, cevaplar, ekip notları, aday bağlantısı);
 * durum, kaynak, tarih ve ilan bağlantısı raporlar için kalır. CV dosyası başka yerde (adayın profili, başka başvuru)
 * kullanılmıyorsa silinir.
 */
import type { Payload } from 'payload'
import { islemKaydet } from '@/altyapi/islemKaydi'
import { istekOlustur, kimlik } from './ortak'

const ayOnce = (simdi: Date, ay: number) => {
  const d = new Date(simdi)
  d.setUTCMonth(d.getUTCMonth() - ay)
  return d
}

export async function basvurulariAnonimlestir(payload: Payload, simdi: Date, ay: number): Promise<{ basvuru: number; dosya: number }> {
  const sinir = ayOnce(simdi, ay).toISOString()
  const { docs: ilanlar } = await payload.find({
    collection: 'ilanlar',
    where: { and: [{ durum: { in: ['kapandi', 'suresi-doldu'] } }, { kapanisTarihi: { less_than: sinir } }] },
    select: { durum: true },
    limit: 5000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  if (!ilanlar.length) return { basvuru: 0, dosya: 0 }
  const { docs } = await payload.find({
    collection: 'basvurular',
    where: { and: [{ ilan: { in: ilanlar.map((i) => i.id) } }, { anonimlestirildi: { exists: false } }] },
    select: { cv: true },
    limit: 500, // bir çalışmada en fazla 500; kalanlar sonraki çalışmada
    depth: 0,
    overrideAccess: true,
  })
  const req = await istekOlustur(payload, null)
  const dosyalar = new Set<number>()
  for (const b of docs) {
    if (b.cv) dosyalar.add(kimlik(b.cv))
    await payload.update({
      collection: 'basvurular',
      id: b.id,
      data: { profilKopyasi: { anonim: true }, cv: null, onYazi: null, cevaplar: null, ekipNotlari: [], adayKullanici: null, anonimlestirildi: simdi.toISOString() } as never,
      overrideAccess: true,
      req,
    })
  }
  let silinenDosya = 0
  for (const id of dosyalar) {
    const [profilde, basvuruda] = await Promise.all([
      payload.count({ collection: 'adaylar', where: { 'cvler.dosya': { equals: id } }, overrideAccess: true }),
      payload.count({ collection: 'basvurular', where: { cv: { equals: id } }, overrideAccess: true }),
    ])
    if (profilde.totalDocs || basvuruda.totalDocs) continue
    await payload.delete({ collection: 'dosyalar', id, overrideAccess: true, req }).catch((e: unknown) => console.error('CV silinemedi', id, e))
    silinenDosya++
  }
  if (docs.length)
    await islemKaydet(req, { islem: 'Saklama süresi dolan başvurular anonimleştirildi', tur: 'kisisel-veri', ayrinti: { basvuru: docs.length, silinenCv: silinenDosya, sureAy: ay } })
  return { basvuru: docs.length, dosya: silinenDosya }
}

/** İşlem kayıtları süre dolunca silinir. Silme özeti yeni bir kayıt olarak yazılır. */
export async function eskiIslemKayitlariniSil(payload: Payload, simdi: Date, ay: number): Promise<number> {
  const where = { createdAt: { less_than: ayOnce(simdi, ay).toISOString() } }
  const { totalDocs } = await payload.count({ collection: 'islem-kayitlari', where, overrideAccess: true })
  if (!totalDocs) return 0
  await payload.delete({ collection: 'islem-kayitlari', where, overrideAccess: true })
  await islemKaydet(await istekOlustur(payload, null), { islem: 'Saklama süresi dolan işlem kayıtları silindi', tur: 'kisisel-veri', ayrinti: { adet: totalDocs, sureAy: ay } })
  return totalDocs
}
