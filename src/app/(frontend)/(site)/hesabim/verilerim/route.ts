/**
 * Adayın verilerinin bir kopyası (KVKK m. 11; talimatlar 12). Yalnızca oturumdaki adayın kendi kayıtları.
 * Firma ekibinin iç notları ve puanları adaya ait veri değildir ve erişim kuralıyla zaten dönmez.
 */
import { adayMi } from '@/erisim'
import { oturum, payloadAl } from '@/veri/payload'

export const dynamic = 'force-dynamic'

export async function GET() {
  const k = await oturum()
  if (!k || !adayMi(k)) return new Response('Bu dosyayı indirmek için aday hesabınla giriş yap.', { status: 401 })
  const payload = await payloadAl()
  const ortak = { overrideAccess: false, user: k, depth: 1, limit: 1000 } as const
  const [aday, basvurular, rizalar] = await Promise.all([
    payload.find({ collection: 'adaylar', where: { kullanici: { equals: k.id } }, ...ortak }),
    payload.find({ collection: 'basvurular', where: { adayKullanici: { equals: k.id } }, ...ortak, depth: 0 }),
    payload.find({ collection: 'rizalar', where: { kullanici: { equals: k.id } }, overrideAccess: true, depth: 0, limit: 1000 }),
  ])
  const veri = {
    olusturma: new Date().toISOString(),
    aciklama: 'TeknoKariyer’de senin hakkında tuttuğumuz kayıtların kopyası.',
    hesap: { ad: k.ad, eposta: k.email, rol: k.rol, olusturma: k.createdAt },
    profil: aday.docs[0] ?? null,
    basvurular: basvurular.docs,
    onaylar: rizalar.docs.map((r) => ({ tur: r.tur, metinSurumu: r.metinSurumu, tarih: r.createdAt, geriAlinma: r.geriAlinma })),
  }
  return new Response(JSON.stringify(veri, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="teknokariyer-verilerim-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
