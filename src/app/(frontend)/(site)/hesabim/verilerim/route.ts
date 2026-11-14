/**
 * Adayın verilerinin bir kopyası (KVKK m. 11; talimatlar 12). Yalnızca oturumdaki adayın kendi kayıtları.
 * Firma ekibinin iç notları ve puanları adaya ait veri değildir ve dökümde yer almaz (src/veri/adayDokumu.ts).
 */
import { adayMi } from '@/erisim'
import { oturum, payloadAl } from '@/veri/payload'
import { adayVeriDokumu, dokumDosyaAdi } from '@/veri/adayDokumu'

export const dynamic = 'force-dynamic'

export async function GET() {
  const k = await oturum()
  if (!k || !adayMi(k)) return new Response('Bu dosyayı indirmek için aday hesabınla giriş yap.', { status: 401 })
  const veri = await adayVeriDokumu(await payloadAl(), Number(k.id))
  if (!veri) return new Response('Hesap bulunamadı.', { status: 404 })
  return new Response(JSON.stringify(veri, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${dokumDosyaAdi()}"`,
      'Cache-Control': 'no-store',
    },
  })
}
