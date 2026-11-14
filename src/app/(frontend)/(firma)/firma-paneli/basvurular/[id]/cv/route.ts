/**
 * Başvurudaki CV'nin filigranlı indirilmesi (K6). Yalnızca başvurunun yapıldığı firmanın kullanıcıları; her indirme
 * işlem kaydına geçer. Önbelleğe alınmaz.
 */
import { basvuruCvsi } from '@/servisler/degerlendirme'
import { IslemHatasi } from '@/servisler/ortak'
import { oturum, payloadAl } from '@/veri/payload'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const k = await oturum()
  if (!k) return new Response('Bu dosyayı indirmek için firma hesabınızla giriş yapın.', { status: 401, headers: { 'content-type': 'text/plain; charset=utf-8' } })
  try {
    const { icerik, dosyaAdi } = await basvuruCvsi(await payloadAl(), k, Number((await params).id))
    return new Response(icerik as unknown as BodyInit, {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="cv.pdf"; filename*=UTF-8''${encodeURIComponent(dosyaAdi)}`,
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
      },
    })
  } catch (e) {
    const durum = e instanceof IslemHatasi ? e.durumKodu : 500
    if (!(e instanceof IslemHatasi)) console.error(e)
    return new Response(e instanceof IslemHatasi ? e.message : 'CV indirilemedi. Biraz sonra yeniden deneyin.', { status: durum, headers: { 'content-type': 'text/plain; charset=utf-8' } })
  }
}
