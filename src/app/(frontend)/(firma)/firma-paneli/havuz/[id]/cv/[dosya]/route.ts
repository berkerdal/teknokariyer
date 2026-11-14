/** Havuzdaki adayın CV'si, filigranlı (K6). Yalnızca havuz yetkisi olan firma kullanıcısı; her indirme kayda geçer. */
import { havuzCvsi } from '@/servisler/havuz'
import { IslemHatasi } from '@/servisler/ortak'
import { oturum, payloadAl } from '@/veri/payload'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: Promise<{ id: string; dosya: string }> }) {
  const k = await oturum()
  if (!k) return new Response('Bu dosyayı indirmek için firma hesabınızla giriş yapın.', { status: 401, headers: { 'content-type': 'text/plain; charset=utf-8' } })
  const { id, dosya } = await params
  try {
    const { icerik, dosyaAdi } = await havuzCvsi(await payloadAl(), k, Number(id), Number(dosya))
    return new Response(icerik as unknown as BodyInit, {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="cv.pdf"; filename*=UTF-8''${encodeURIComponent(dosyaAdi)}`,
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
      },
    })
  } catch (e) {
    if (!(e instanceof IslemHatasi)) console.error(e)
    return new Response(e instanceof IslemHatasi ? e.message : 'CV indirilemedi. Biraz sonra yeniden deneyin.', {
      status: e instanceof IslemHatasi ? e.durumKodu : 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }
}
